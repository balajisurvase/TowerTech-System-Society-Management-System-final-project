import React, { useState, useEffect } from 'react';
import { 
  Users,
  CreditCard, 
  MessageSquare, 
  Calendar,
  CheckCircle2, 
  Clock,
  AlertCircle,
  Send,
  Upload,
  ChevronRight,
  ArrowUpRight,
  Plus,
  Eye,
  X,
  Image as ImageIcon,
  User as UserIcon,
  LogOut,
  Edit,
  EyeOff
} from 'lucide-react';
import AmenityBooking from './AmenityBooking';
import { Resident, MaintenanceRecord, Complaint, Booking } from '../types';
import { societyService } from '../lib/societyService';
import { toast } from 'sonner';

interface ResidentDashboardProps {
  activeTab: string;
  resident: Resident;
  maintenance: MaintenanceRecord[];
  complaints: Complaint[];
  bookings: Booking[];
  onRefresh: () => void;
  onLogout: () => void;
}

export default function ResidentDashboard({ 
  activeTab, 
  resident, 
  maintenance, 
  complaints, 
  bookings,
  onRefresh,
  onLogout,
  setActiveTab
}: ResidentDashboardProps & { setActiveTab: (tab: string) => void }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    name: resident.name,
    phone: resident.phone || '',
    email: resident.email || '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const [maintenanceFilter, setMaintenanceFilter] = useState({
    month: 'All',
    year: 'All',
    status: 'All'
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [complaintCategory, setComplaintCategory] = useState('');
  const [description, setDescription] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showComplaintSuccessModal, setShowComplaintSuccessModal] = useState(false);
  const [viewAllComplaints, setViewAllComplaints] = useState(false);
  const [viewAllBookings, setViewAllBookings] = useState(false);

  const [localMaintenance, setLocalMaintenance] = useState<MaintenanceRecord[]>([]);
  const [localComplaints, setLocalComplaints] = useState<Complaint[]>([]);
  const [localBookings, setLocalBookings] = useState<Booking[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [maintenanceData, complaintsData, bookingsData] = await Promise.all([
          societyService.getResidentMaintenance(resident.resident_id, resident.society_id),
          societyService.getResidentComplaints(resident.resident_id, resident.society_id),
          societyService.getResidentBookings(resident.resident_id, resident.society_id)
        ]);
        setLocalMaintenance(maintenanceData);
        setLocalComplaints(complaintsData);
        setLocalBookings(bookingsData);
      } catch (error) {
        console.error('Error fetching resident data:', error);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [resident.resident_id, activeTab]); // Re-fetch when tab changes or resident changes

  const residentMaintenance = localMaintenance;
  const myComplaints = localComplaints;
  const residentBookings = localBookings;

  // Filter society-wide data (excluding PII for complaints)
  const societyComplaints = complaints.map(c => ({
    ...c,
    name: c.resident_id === resident.resident_id ? c.name : 'Resident',
    flat_no: c.resident_id === resident.resident_id ? c.flat_no : 'Hidden',
    tower: c.resident_id === resident.resident_id ? c.tower : 'Hidden',
    complaint_date: c.resident_id === resident.resident_id ? c.complaint_date : 'Hidden'
  }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMediaFile(e.target.files[0]);
    }
  };

  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleSubmitComplaint = async () => {
    if (!description.trim() || !complaintCategory.trim()) {
      alert('Please provide a category and description.');
      return;
    }
    setSubmitting(true);
    try {
      let media = '';
      if (mediaFile) {
        media = await societyService.uploadMedia(mediaFile);
      }

      await societyService.addComplaint({
        resident_id: resident.resident_id,
        name: resident.name,
        flat_no: resident.flat,
        tower: resident.tower,
        category: complaintCategory,
        description,
        status: 'Pending',
        complaint_date: new Date().toISOString().split('T')[0],
        media,
        society_id: resident.society_id
      });
      
      setComplaintCategory('');
      setDescription('');
      setMediaFile(null);
      setShowComplaintSuccessModal(true);
      toast.success('Complaint submitted successfully!');
      onRefresh();
    } catch (error: any) {
      console.error('Error submitting complaint:', error);
      toast.error('Failed to submit complaint: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const currentBalance = residentMaintenance
    .filter(m => m.status === 'Unpaid')
    .reduce((sum, m) => sum + m.amount, 0);

  const [generatingBill, setGeneratingBill] = useState(false);

  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear().toString();
  const fullMonth = `${currentMonth} ${currentYear}`;

  const hasBillForCurrentMonth = residentMaintenance.find(m => m.month === fullMonth);
  const isPaidForCurrentMonth = hasBillForCurrentMonth?.status === 'Paid';

  const handleGenerateResidentBill = async () => {
    if (hasBillForCurrentMonth) {
      if (isPaidForCurrentMonth) {
        toast.error('Maintenance already paid for this month');
      } else {
        toast.error('Maintenance bill already generated for this month');
      }
      return;
    }

    setGeneratingBill(true);
    try {
      await societyService.createMaintenanceBill({
        resident_id: resident.resident_id,
        resident_name: resident.name,
        flat_no: resident.flat,
        tower: resident.tower,
        month: fullMonth,
        amount: 2500, // Default amount, could be dynamic
        status: 'Unpaid',
        due_date: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
        society_id: resident.society_id,
        generated_by: 'Resident'
      });
      toast.success('Maintenance bill generated successfully!');
      onRefresh();
    } catch (error: any) {
      toast.error('Failed to generate bill: ' + error.message);
    } finally {
      setGeneratingBill(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (profileData.newPassword) {
      if (profileData.newPassword !== profileData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      if (profileData.newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
    }

    setUpdatingProfile(true);
    try {
      const updatePayload: any = {
        name: profileData.name,
        phone: profileData.phone,
        email: profileData.email
      };
      
      await societyService.updateResident(resident.resident_id, updatePayload);
      toast.success('Profile updated successfully');
      setShowEditProfile(false);
      onRefresh();
    } catch (error: any) {
      toast.error('Failed to update profile: ' + error.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profileData.oldPassword) {
      toast.error('Please enter your old password');
      return;
    }
    if (profileData.newPassword !== profileData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (profileData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setUpdatingProfile(true);
    try {
      await societyService.updateResident(resident.resident_id, {
        password: profileData.newPassword
      });
      toast.success('Password updated successfully');
      setShowChangePassword(false);
      
      // Clear password fields
      setProfileData(prev => ({
        ...prev,
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      onRefresh();
    } catch (error: any) {
      toast.error('Failed to update password: ' + error.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const renderHeader = () => (
    <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-blue-800 to-indigo-900 p-8 rounded-[2.5rem] shadow-xl shadow-blue-100 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full -ml-24 -mb-24 blur-2xl"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/10">
            <Users className="w-5 h-5 text-blue-300" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">TowerTech-Society</h1>
        </div>
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight">
            Hello, <span className="text-white drop-shadow-sm">{resident.name}!</span>
          </h2>
          <p className="text-blue-100/80 text-lg font-medium max-w-2xl leading-relaxed">
            Welcome to your TowerTech Resident Dashboard. Here you can manage your maintenance, bookings, and complaints.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-blue-200 font-medium pt-2">
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
              <span className="text-[10px] font-black uppercase tracking-tighter opacity-40">Flat:</span>
              <span className="text-xs font-black uppercase tracking-widest">T-{resident.tower} / {resident.flat}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
              <span className="text-[10px] font-black uppercase tracking-tighter opacity-40">Role:</span>
              <span className="text-xs font-black uppercase tracking-widest">{resident.role}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-end gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowEditProfile(true)}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all group"
            title="Edit Profile"
          >
            <Edit className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
          </button>
          <button 
            onClick={onLogout}
            className="p-3 bg-rose-500/20 hover:bg-rose-500/30 rounded-2xl border border-rose-500/20 transition-all group"
            title="Logout"
          >
            <LogOut className="w-5 h-5 text-rose-300 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  );

  const renderEditProfileModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black">Edit Profile</h3>
            <p className="text-blue-100 text-xs font-medium uppercase tracking-wider">Update your personal information</p>
          </div>
          <button onClick={() => setShowEditProfile(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
            <input 
              type="text"
              required
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
            <input 
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
            <input 
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
            />
          </div>
          <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
            <button 
              type="button"
              onClick={() => {
                setShowEditProfile(false);
                setShowChangePassword(true);
              }}
              className="w-full bg-slate-100 text-slate-600 font-black py-3 rounded-xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]"
            >
              Change Password
            </button>
            <button 
              type="submit"
              disabled={updatingProfile}
              className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
            >
              {updatingProfile ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderChangePasswordModal = () => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden">
        <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black tracking-tight">Change Password</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Secure your resident account</p>
          </div>
          <button onClick={() => setShowChangePassword(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleChangePassword} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Old Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={profileData.oldPassword}
                onChange={(e) => setProfileData({ ...profileData, oldPassword: e.target.value })}
                className="w-full px-5 py-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-900 transition-all font-bold text-sm" 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={profileData.newPassword}
                onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                className="w-full px-5 py-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-900 transition-all font-bold text-sm" 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={profileData.confirmPassword}
                onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                className="w-full px-5 py-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-900 transition-all font-bold text-sm" 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowChangePassword(false)}
              className="flex-1 px-6 py-4 rounded-xl border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updatingProfile}
              className="flex-[2] px-6 py-4 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              {updatingProfile ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="flex flex-col gap-6">
            {/* Welcome Message */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] shadow-xl shadow-indigo-100 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110 blur-3xl"></div>
              <div className="relative z-10">
                <h2 className="text-4xl font-black tracking-tight mb-3">
                  Hello, <span className="text-white drop-shadow-sm">{resident.name}</span>!
                </h2>
                <p className="text-indigo-100 font-medium max-w-lg text-lg leading-relaxed">
                  Welcome to your TowerTech Resident Dashboard. Here you can manage your maintenance, bookings, and complaints.
                </p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button 
                onClick={() => setActiveTab('maintenance')}
                className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[2rem] text-white shadow-xl shadow-blue-100 text-left relative overflow-hidden group transition-all hover:scale-[1.02]"
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-600">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Maintenance Status</p>
                  <h3 className="text-2xl font-black">
                    {residentMaintenance.some(m => m.status === 'Unpaid') ? 'Payment Due' : 'All Paid'}
                  </h3>
                </div>
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
              </button>

              <button 
                onClick={() => setActiveTab('complaints')}
                className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-[2rem] text-white shadow-xl shadow-emerald-100 text-left relative overflow-hidden group transition-all hover:scale-[1.02]"
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-emerald-600">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">My Complaints</p>
                  <h3 className="text-2xl font-black">{myComplaints.length} Raised</h3>
                </div>
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
              </button>

              <button 
                onClick={() => setActiveTab('bookings')}
                className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-[2rem] text-white shadow-xl shadow-amber-100 text-left relative overflow-hidden group transition-all hover:scale-[1.02]"
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-amber-600">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Active Bookings</p>
                  <h3 className="text-2xl font-black">{residentBookings.length} Active</h3>
                </div>
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
              </button>
            </div>

            {/* Detailed Info Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Summary */}
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Resident Profile</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tower / Flat</span>
                    <span className="text-sm font-bold text-slate-900">T-{resident.tower} / F-{resident.flat}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resident ID</span>
                    <span className="text-sm font-black text-blue-600">{resident.resident_id}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</span>
                    <span className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{resident.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</span>
                    <span className="text-sm font-bold text-slate-900">{resident.phone}</span>
                  </div>
                </div>
              </div>

              {/* Recent Maintenance */}
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Recent Bills</h3>
                  <button onClick={() => setActiveTab('maintenance')} className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                  {residentMaintenance.slice(0, 3).map((m, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          <CreditCard className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">{m.month}</p>
                          <p className="text-[10px] font-bold text-slate-400">₹{m.amount}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black uppercase flex items-center gap-1 ${m.status === 'Paid' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {m.status === 'Paid' ? 'PAID' : 'UNPAID'}
                      </span>
                    </div>
                  ))}
                  {residentMaintenance.length === 0 && <p className="text-center text-slate-400 text-xs py-4">No records found.</p>}
                </div>
              </div>

              {/* Recent Bookings */}
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Recent Bookings</h3>
                  <button onClick={() => setActiveTab('bookings')} className="text-amber-600 text-[10px] font-black uppercase tracking-widest hover:underline">View All</button>
                </div>
                <div className="space-y-3">
                  {residentBookings.slice(0, 3).map((b, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 truncate w-24">{b.amenity_name}</p>
                          <p className="text-[10px] font-bold text-slate-400">{b.booking_date}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black uppercase flex items-center gap-1 ${
                        b.status === 'Approved' ? 'text-emerald-600' : 
                        b.status === 'Pending' ? 'text-amber-600' : 'text-rose-600'
                      }`}>
                        {b.status === 'Approved' ? 'APPROVED' : 
                         b.status === 'Pending' ? 'PENDING' : 'REJECTED'}
                      </span>
                    </div>
                  ))}
                  {residentBookings.length === 0 && <p className="text-center text-slate-400 text-xs py-4">No bookings yet.</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      );

      case 'maintenance':
        const filteredMaintenance = residentMaintenance.filter(m => {
          const matchesMonth = maintenanceFilter.month === 'All' || m.month.includes(maintenanceFilter.month);
          const matchesYear = maintenanceFilter.year === 'All' || m.month.includes(maintenanceFilter.year);
          const matchesStatus = maintenanceFilter.status === 'All' || m.status === maintenanceFilter.status;
          return matchesMonth && matchesYear && matchesStatus;
        });

        return (
          <div className="flex flex-col gap-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 shrink-0">
              <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Personal Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Full Name</p>
                  <p className="font-bold text-slate-800 text-sm">{resident.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tower & Flat No</p>
                  <p className="font-bold text-slate-800 text-sm">Tower {resident.tower} - Flat {resident.flat}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Address</p>
                  <p className="font-bold text-slate-800 text-sm truncate">{resident.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone Number</p>
                  <p className="font-bold text-slate-800 text-sm">{resident.phone}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
              <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div>
                  <h3 className="text-lg font-black text-slate-900">Maintenance Status</h3>
                  <p className="text-xs text-slate-500 font-medium">View and track your maintenance payments</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select 
                    value={maintenanceFilter.month}
                    onChange={(e) => setMaintenanceFilter({ ...maintenanceFilter, month: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                  >
                    <option value="All">All Months</option>
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select 
                    value={maintenanceFilter.year}
                    onChange={(e) => setMaintenanceFilter({ ...maintenanceFilter, year: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                  >
                    <option value="All">All Years</option>
                    {['2024', '2025', '2026'].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <select 
                    value={maintenanceFilter.status}
                    onChange={(e) => setMaintenanceFilter({ ...maintenanceFilter, status: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
                  >
                    <option value="All">All Status</option>
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
              </div>
              <div className="overflow-auto flex-1">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest sticky top-0">
                    <tr>
                      <th className="px-8 py-4">Bill ID</th>
                      <th className="px-8 py-4">Tower/Flat</th>
                      <th className="px-8 py-4">Month</th>
                      <th className="px-8 py-4">Amount</th>
                      <th className="px-8 py-4">Due Date</th>
                      <th className="px-8 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loadingData ? (
                      <tr>
                        <td colSpan={6} className="px-8 py-12 text-center">
                          <div className="flex justify-center items-center gap-2 text-indigo-600">
                            <div className="w-5 h-5 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                            <span className="font-bold">Loading records...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredMaintenance.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-8 py-12 text-center text-slate-400 font-bold">
                          No maintenance records found.
                        </td>
                      </tr>
                    ) : (
                      filteredMaintenance.map((m, index) => (
                        <tr key={m.id || index} className="hover:bg-slate-50 transition-colors text-xs">
                          <td className="px-8 py-6 font-black text-indigo-600">{m.maintenance_id}</td>
                          <td className="px-8 py-6 font-bold text-slate-800">T-{m.tower} / {m.flat_no}</td>
                          <td className="px-8 py-6 text-slate-600 font-medium">{m.month}</td>
                          <td className="px-8 py-6 font-black text-slate-900">₹{m.amount}</td>
                          <td className="px-8 py-6 text-slate-500">{m.due_date}</td>
                          <td className="px-8 py-6">
                            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1.5 w-fit ${
                              m.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {m.status === 'Paid' ? 'PAID' : 'UNPAID'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'complaints':
        return (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Raise Complaint Form */}
              <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                  <Plus className="w-6 h-6 text-indigo-600" />
                  Raise a New Complaint
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Complaint Category</label>
                    <select 
                      value={complaintCategory}
                      onChange={(e) => setComplaintCategory(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-bold text-sm bg-slate-50 transition-all"
                    >
                      <option value="">Select Category</option>
                      <option value="Electricity Issue">Electricity Issue</option>
                      <option value="Water Supply Issue">Water Supply Issue</option>
                      <option value="Lift Issue">Lift Issue</option>
                      <option value="Cleanliness Issue">Cleanliness Issue</option>
                      <option value="Security Issue">Security Issue</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Description</label>
                    <textarea 
                      rows={5}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your issue in detail..."
                      className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none resize-none font-medium text-sm bg-slate-50 transition-all"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Attach Media (Image/Video)</label>
                    <div className="relative">
                      <input 
                        type="file" 
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                        className="hidden" 
                        id="media-upload"
                      />
                      <label 
                        htmlFor="media-upload"
                        className="flex flex-col items-center justify-center gap-3 w-full px-6 py-8 rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 cursor-pointer transition-all text-slate-500 font-bold text-sm bg-slate-50/50"
                      >
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600">
                          <Upload className="w-6 h-6" />
                        </div>
                        <span className="truncate max-w-[200px]">{mediaFile ? mediaFile.name : 'Click to upload media'}</span>
                        <p className="text-[10px] text-slate-400 font-medium">Max size: 10MB</p>
                      </label>
                    </div>
                  </div>
                  <button 
                    onClick={handleSubmitComplaint}
                    disabled={submitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-indigo-100 mt-4 uppercase tracking-widest text-xs"
                  >
                    <Send className="w-5 h-5" />
                    {submitting ? 'Submitting...' : 'Submit Complaint'}
                  </button>
                </div>
              </div>

              {/* Complaint History */}
              <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Complaint History</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">Track and view all society complaints</p>
                  </div>
                  <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                    <button 
                      onClick={() => setViewAllComplaints(false)}
                      className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${!viewAllComplaints ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}
                    >
                      My List
                    </button>
                    <button 
                      onClick={() => setViewAllComplaints(true)}
                      className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${viewAllComplaints ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}
                    >
                      Society
                    </button>
                  </div>
                </div>
                <div className="space-y-6">
                  {(viewAllComplaints ? societyComplaints : myComplaints).map((c, index) => (
                    <div key={c.complaint_id || c.id || `complaint-${index}`} className="bg-slate-50/50 rounded-3xl border border-slate-100 p-6 hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all group">
                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex-1 space-y-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest">
                              {c.complaint_id}
                            </span>
                            <span className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-[10px] font-black rounded-lg uppercase tracking-widest">
                              T-{c.tower} / {c.flat_no}
                            </span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {c.complaint_date}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-slate-800 mb-2">{c.category}</h4>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">{c.description}</p>
                          </div>
                          {c.admin_comment && (
                            <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                              <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">Admin Response</p>
                              <p className="text-xs font-bold text-slate-700">{c.admin_comment}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end justify-between gap-4">
                          <span className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-sm flex items-center gap-1.5 ${
                            c.status === 'Done' || c.status === 'Resolved' ? 'bg-emerald-600 text-white' : 
                            c.status === 'Pending' ? 'bg-amber-500 text-white' : 
                            c.status === 'Process' ? 'bg-indigo-600 text-white' :
                            'bg-rose-600 text-white'
                          }`}>
                            {c.status === 'Done' || c.status === 'Resolved' ? 'DONE' : 
                             c.status === 'Pending' ? 'PENDING' : 
                             c.status === 'Process' ? 'PROCESS' : 'REJECT'}
                          </span>
                          {c.media && (
                            <button 
                              onClick={() => setSelectedImage(c.media_url || c.media)}
                              className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-600 transition-all shadow-sm"
                            >
                              <ImageIcon className="w-6 h-6" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {(viewAllComplaints ? societyComplaints : myComplaints).length === 0 && (
                    <div className="text-center py-20 bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200">
                      <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No complaints found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 'bookings':
        return (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Amenity Booking</h3>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Book facilities and view schedules</p>
                </div>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setViewAllBookings(false)}
                  className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${!viewAllBookings ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Book & My List
                </button>
                <button 
                  onClick={() => setViewAllBookings(true)}
                  className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${viewAllBookings ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                >
                  Society Schedule
                </button>
              </div>
            </div>

            <div className="min-h-0">
              {viewAllBookings ? (
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
                  <div className="p-6 border-b border-slate-50 shrink-0">
                    <h3 className="text-lg font-black text-slate-900">Society-wide Booking Schedule</h3>
                    <p className="text-xs text-slate-500 font-medium">View all upcoming events and amenity availability</p>
                  </div>
                  <div className="overflow-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest sticky top-0">
                        <tr>
                          <th className="px-8 py-4">Booking ID</th>
                          <th className="px-8 py-4">Amenity</th>
                          <th className="px-8 py-4">Description</th>
                          <th className="px-8 py-4">Date</th>
                          <th className="px-8 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {bookings.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-bold">
                              No bookings found in the society.
                            </td>
                          </tr>
                        ) : (
                          bookings.map((b, index) => (
                            <tr key={b.booking_id || b.id || `booking-all-${index}`} className="hover:bg-slate-50 transition-colors text-xs">
                              <td className="px-8 py-6 font-black text-indigo-600">{b.booking_id}</td>
                              <td className="px-8 py-6">
                                <p className="font-bold text-slate-800">{b.amenity_name}</p>
                                <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">{b.amenity_type}</p>
                              </td>
                              <td className="px-8 py-6 font-medium text-slate-600 max-w-xs truncate">{b.event_name}</td>
                              <td className="px-8 py-6">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-2 text-slate-800 font-bold">
                                    <Calendar className="w-3 h-3 text-indigo-600" />
                                    {b.booking_date}
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                                    <Clock className="w-3 h-3" />
                                    {b.time_slot || `${b.start_time} - ${b.end_time}`}
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1.5 w-fit ${
                                  b.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                                  b.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                }`}>
                                  {b.status === 'Approved' ? 'APPROVED' : 
                                   b.status === 'Pending' ? 'PENDING' : 'REJECTED'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <AmenityBooking 
                  resident={resident} 
                  onRefresh={onRefresh} 
                />
              )}
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group shrink-0">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 transition-transform duration-700 group-hover:scale-110"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/30 shadow-inner">
                    <UserIcon className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black tracking-tight">{resident.name}</h3>
                    <p className="text-indigo-100 font-bold uppercase tracking-widest text-[10px] mt-1">Resident Profile • {resident.resident_id}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                    <p className="text-[9px] font-black text-indigo-100 uppercase tracking-widest opacity-70">Tower</p>
                    <p className="text-xl font-black">{resident.tower}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
                    <p className="text-[9px] font-black text-indigo-100 uppercase tracking-widest opacity-70">Flat</p>
                    <p className="text-xl font-black">{resident.flat}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h4 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-600" />
                Edit Profile Information
              </h4>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input 
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <input 
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input 
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm transition-all"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowChangePassword(true)}
                    className="w-full bg-slate-100 text-slate-600 font-black py-3 rounded-xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]"
                  >
                    Change Password
                  </button>
                  <button 
                    type="submit"
                    disabled={updatingProfile}
                    className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                  >
                    {updatingProfile ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );

      default:
        return <div className="p-12 text-center text-gray-400">Section coming soon...</div>;
    }
  };

  return (
    <div className="flex flex-col max-w-7xl mx-auto w-full">
      <div className="">
        {renderContent()}
      </div>

      {showEditProfile && renderEditProfileModal()}
      {showComplaintSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Complaint Raised!</h3>
                <p className="text-slate-500 font-medium mt-2">Your complaint has been submitted successfully. Our team will look into it shortly.</p>
              </div>
              <button 
                onClick={() => setShowComplaintSuccessModal(false)}
                className="w-full bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 uppercase tracking-widest text-xs"
              >
                Got it, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      {showChangePassword && renderChangePasswordModal()}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          <div className="max-w-full max-h-full flex items-center justify-center">
            <img 
              src={selectedImage} 
              alt="Full view" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
