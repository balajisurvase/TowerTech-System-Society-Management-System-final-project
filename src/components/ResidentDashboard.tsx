import React, { useState } from 'react';
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
  Plus
} from 'lucide-react';
import AmenityBooking from './AmenityBooking';
import { Resident, MaintenanceRecord, Complaint, Booking } from '../types';
import { societyService } from '../lib/societyService';

interface ResidentDashboardProps {
  activeTab: string;
  resident: Resident;
  maintenance: MaintenanceRecord[];
  complaints: Complaint[];
  bookings: Booking[];
  onRefresh: () => void;
}

export default function ResidentDashboard({ 
  activeTab, 
  resident, 
  maintenance, 
  complaints, 
  bookings,
  onRefresh,
  setActiveTab
}: ResidentDashboardProps & { setActiveTab: (tab: string) => void }) {
  const [complaintCategory, setComplaintCategory] = useState('');
  const [description, setDescription] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
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
    flat_no: c.resident_id === resident.resident_id ? c.flat_no : '***',
    tower: c.resident_id === resident.resident_id ? c.tower : '*',
    complaint_date: c.resident_id === resident.resident_id ? c.complaint_date : '***'
  }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMediaFile(e.target.files[0]);
    }
  };

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
      alert('Complaint submitted successfully!');
      onRefresh();
    } catch (error: any) {
      console.error('Error submitting complaint:', error);
      alert('Failed to submit complaint: ' + error.message);
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
        alert('Maintenance already paid for this month');
      } else {
        alert('Maintenance bill already generated for this month');
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
        floor: resident.floor,
        month: fullMonth,
        amount: 2500, // Default amount, could be dynamic
        status: 'Unpaid',
        due_date: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
        society_id: resident.society_id,
        generated_by: 'Resident'
      });
      alert('Maintenance bill generated successfully!');
      onRefresh();
    } catch (error: any) {
      alert('Failed to generate bill: ' + error.message);
    } finally {
      setGeneratingBill(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button 
                onClick={() => setActiveTab('maintenance')}
                className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50 text-left hover:border-blue-200 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-600 p-3 rounded-xl text-white group-hover:scale-110 transition-transform">
                    <CreditCard className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Maintenance Status</p>
                <h3 className="text-2xl font-black text-gray-800">
                  {residentMaintenance.some(m => m.status === 'Unpaid') ? 'Pay Pending' : 'Paid ✔'}
                </h3>
                <div className="mt-4 flex items-center text-blue-600 text-xs font-bold gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  View Details <ChevronRight className="w-3 h-3" />
                </div>
              </button>

              <button 
                onClick={() => setActiveTab('complaints')}
                className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50 text-left hover:border-blue-200 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-emerald-600 p-3 rounded-xl text-white group-hover:scale-110 transition-transform">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Complaints</p>
                <h3 className="text-2xl font-black text-gray-800">{myComplaints.length} Raised</h3>
                <div className="mt-4 flex items-center text-emerald-600 text-xs font-bold gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  View History <ChevronRight className="w-3 h-3" />
                </div>
              </button>

              <button 
                onClick={() => setActiveTab('bookings')}
                className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50 text-left hover:border-blue-200 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-amber-600 p-3 rounded-xl text-white group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Bookings Made</p>
                <h3 className="text-2xl font-black text-gray-800">{residentBookings.length} Active</h3>
                <div className="mt-4 flex items-center text-amber-600 text-xs font-bold gap-1">
                  View All Bookings <ChevronRight className="w-3 h-3" />
                </div>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-blue-50">
                <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  Resident Details
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Name</span>
                    <span className="font-bold text-gray-800">{resident.name}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Resident ID</span>
                    <span className="font-black text-blue-600">{resident.resident_id}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Tower</span>
                    <span className="font-bold text-gray-800">{resident.tower}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Flat No</span>
                    <span className="font-bold text-gray-800">{resident.flat}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Email</span>
                    <span className="font-bold text-gray-800">{resident.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Phone</span>
                    <span className="font-bold text-gray-800">{resident.phone}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-blue-50">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-800">Recent Maintenance History</h3>
                  <button onClick={() => setActiveTab('maintenance')} className="text-blue-600 text-xs font-bold hover:underline">View All</button>
                </div>
                <div className="space-y-4">
                  {residentMaintenance.slice(0, 3).map((m, index) => (
                    <div key={m.maintenance_id || m.id || `maintenance-${index}`} className="flex items-center justify-between p-4 rounded-xl bg-blue-50/30 border border-blue-50">
                      <div className="flex items-center gap-4">
                        <div className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded uppercase tracking-widest">
                          {m.maintenance_id || (m.id ? m.id.substring(0, 6) : 'N/A')}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{m.month}</p>
                          <p className="text-xs text-gray-400">Due: {m.due_date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-gray-800">₹{m.amount}</p>
                        <span className={`text-[10px] font-black uppercase ${
                          m.status === 'Paid' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {m.status === 'Paid' ? 'Paid ✔' : 'Pay Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {residentMaintenance.length === 0 && <p className="text-center text-gray-400 py-4">No records found.</p>}
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-blue-50">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-800">My Recent Bookings</h3>
                  <button onClick={() => setActiveTab('bookings')} className="text-amber-600 text-xs font-bold hover:underline">View All</button>
                </div>
                <div className="space-y-4">
                  {residentBookings.slice(0, 3).map((b, index) => (
                    <div key={b.booking_id || b.id || `booking-${index}`} className="flex items-center justify-between p-4 rounded-xl bg-blue-50/30 border border-blue-50">
                      <div className="flex items-center gap-4">
                        <div className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded uppercase tracking-widest">
                          {b.booking_id || (b.id ? b.id.substring(0, 6) : 'N/A')}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{b.amenity_name}</p>
                          <p className="text-xs text-gray-400">{b.booking_date} • {b.time_slot || `${b.start_time} - ${b.end_time}`}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                        b.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                        b.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                  {residentBookings.length === 0 && <p className="text-center text-gray-400 py-4">No bookings yet.</p>}
                </div>
              </div>
            </div>
          </div>
        );

      case 'maintenance':
        return (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-blue-50">
              <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                Personal Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Full Name</p>
                  <p className="font-bold text-gray-800 text-lg">{resident.name}</p>
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Tower & Flat No</p>
                  <p className="font-bold text-gray-800 text-lg">Tower {resident.tower} - Flat {resident.flat}</p>
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Email Address</p>
                  <p className="font-bold text-gray-800 text-lg">{resident.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Phone Number</p>
                  <p className="font-bold text-gray-800 text-lg">{resident.phone}</p>
                </div>
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Resident ID</p>
                  <p className="font-black text-blue-600 text-lg">{resident.resident_id}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-blue-50 overflow-hidden">
              <div className="p-8 border-b border-blue-50 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-gray-800">Maintenance Status</h3>
                  <p className="text-gray-500">View and track your maintenance payments</p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  {hasBillForCurrentMonth && !isPaidForCurrentMonth && (
                    <div className="mt-2 px-4 py-2 bg-rose-50 text-rose-600 text-[10px] font-black rounded-xl border border-rose-100 uppercase tracking-widest">
                      Bill Generated for {fullMonth}
                    </div>
                  )}
                  {isPaidForCurrentMonth && (
                    <div className="mt-2 px-4 py-2 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-xl border border-emerald-100 uppercase tracking-widest">
                      Paid for {fullMonth}
                    </div>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-blue-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                    <tr>
                      <th className="px-8 py-4">Maintenance ID</th>
                      <th className="px-8 py-4">Tower/Floor/Flat</th>
                      <th className="px-8 py-4">Month</th>
                      <th className="px-8 py-4">Amount</th>
                      <th className="px-8 py-4">Due Date</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    {loadingData ? (
                      <tr>
                        <td colSpan={6} className="px-8 py-12 text-center">
                          <div className="flex justify-center items-center gap-2 text-blue-600">
                            <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                            <span className="font-bold">Loading records...</span>
                          </div>
                        </td>
                      </tr>
                    ) : residentMaintenance.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-8 py-12 text-center text-gray-400 font-bold">
                          No maintenance records found for Flat {resident.flat}, Tower {resident.tower}.
                        </td>
                      </tr>
                    ) : (
                      residentMaintenance.map((m, index) => (
                        <tr key={m.maintenance_id || m.id || `maintenance-${index}`} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-8 py-6 font-black text-blue-600">
                            {m.maintenance_id || (m.id ? m.id.substring(0, 8) : 'N/A')}
                          </td>
                          <td className="px-8 py-6 text-gray-600 font-bold">T-{m.tower} / F-{m.floor} / {m.flat_no}</td>
                          <td className="px-8 py-6 font-bold text-gray-800">{m.month}</td>
                          <td className="px-8 py-6 font-black text-gray-800">₹{m.amount}</td>
                          <td className="px-8 py-6 text-gray-500">{m.due_date}</td>
                          <td className="px-8 py-6">
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                              m.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {m.status === 'Paid' ? 'Paid ✔' : 'Pay Pending'}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              <button className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest">View</button>
                              <span className="text-gray-300">|</span>
                              <button className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest">Download</button>
                            </div>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-blue-50">
              <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
                <Plus className="w-6 h-6 text-blue-600" />
                Raise a New Complaint
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Complaint Category</label>
                  <select 
                    value={complaintCategory}
                    onChange={(e) => setComplaintCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
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
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
                  <textarea 
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your issue in detail..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none font-medium"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Attach Media (Image/Video)</label>
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
                      className="flex items-center justify-center gap-2 w-full px-4 py-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-500 cursor-pointer transition-all text-gray-500 font-bold"
                    >
                      <Upload className="w-5 h-5" />
                      {mediaFile ? mediaFile.name : 'Click to upload media'}
                    </label>
                  </div>
                </div>
                <button 
                  onClick={handleSubmitComplaint}
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-100"
                >
                  <Send className="w-5 h-5" />
                  {submitting ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-blue-50">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-800">Complaint History</h3>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setViewAllComplaints(false)}
                    className={`px-3 py-1 text-[10px] font-black uppercase rounded-md transition-all ${!viewAllComplaints ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                  >
                    My List
                  </button>
                  <button 
                    onClick={() => setViewAllComplaints(true)}
                    className={`px-3 py-1 text-[10px] font-black uppercase rounded-md transition-all ${viewAllComplaints ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                  >
                    Society List
                  </button>
                </div>
              </div>
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {(viewAllComplaints ? societyComplaints : myComplaints).map((c, index) => (
                  <div key={c.complaint_id || c.id || `complaint-${index}`} className="p-6 rounded-2xl bg-blue-50/30 border border-blue-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest">
                            {c.complaint_id || (c.id ? `C-${c.id.substring(0, 6)}` : 'N/A')}
                          </span>
                          <h4 className="font-bold text-gray-800 text-lg">{c.category}</h4>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">
                            {c.tower}-{c.flat_no}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-bold">BY: {c.name} • DATE: {c.complaint_date}</p>
                      </div>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                        c.status === 'Done' || c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                        c.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 
                        c.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 font-medium">{c.description}</p>
                    {(c.media || c.media_url) && (
                      <div className="mt-4 rounded-xl overflow-hidden border border-blue-50">
                        {((c.media || c.media_url) || '').match(/\.(mp4|webm|ogg)$/) ? (
                          <video src={c.media || c.media_url} controls className="w-full max-h-48 object-cover" />
                        ) : (
                          <img src={c.media || c.media_url} alt="Complaint media" className="w-full max-h-48 object-cover" referrerPolicy="no-referrer" />
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {(viewAllComplaints ? societyComplaints : myComplaints).length === 0 && <p className="text-center text-gray-400 py-8 font-bold">No complaints yet.</p>}
              </div>
            </div>
          </div>
        );

      case 'bookings':
        return (
          <div className="space-y-8">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-blue-50">
              <div className="flex items-center gap-4">
                <Calendar className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="text-lg font-black text-gray-800">Amenity Booking</h3>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Book facilities and view schedules</p>
                </div>
              </div>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => setViewAllBookings(false)}
                  className={`px-4 py-2 text-xs font-black uppercase rounded-md transition-all ${!viewAllBookings ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                >
                  Book & My List
                </button>
                <button 
                  onClick={() => setViewAllBookings(true)}
                  className={`px-4 py-2 text-xs font-black uppercase rounded-md transition-all ${viewAllBookings ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
                >
                  Society Schedule
                </button>
              </div>
            </div>

            {viewAllBookings ? (
              <div className="bg-white rounded-2xl shadow-sm border border-blue-50 overflow-hidden">
                <div className="p-8 border-b border-blue-50">
                  <h3 className="text-xl font-black text-gray-800">Society-wide Booking Schedule</h3>
                  <p className="text-gray-500">View all upcoming events and amenity availability</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-blue-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                      <tr>
                        <th className="px-8 py-4">Amenity</th>
                        <th className="px-8 py-4">Date</th>
                        <th className="px-8 py-4">Program Time</th>
                        <th className="px-8 py-4">Event</th>
                        <th className="px-8 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50">
                      {bookings.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-8 py-12 text-center text-gray-400 font-bold">
                            No bookings found in the society.
                          </td>
                        </tr>
                      ) : (
                        bookings.map((b, index) => (
                          <tr key={b.booking_id || b.id || `booking-all-${index}`} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-8 py-6 font-bold text-gray-800">{b.amenity_name}</td>
                            <td className="px-8 py-6 text-gray-600">{b.booking_date}</td>
                            <td className="px-8 py-6 text-gray-600">{b.time_slot || `${b.start_time} - ${b.end_time}`}</td>
                            <td className="px-8 py-6 font-medium text-gray-500">{b.event_name}</td>
                            <td className="px-8 py-6">
                              <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                                b.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                                b.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                              }`}>
                                {b.status}
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
        );

      default:
        return <div className="p-12 text-center text-gray-400">Section coming soon...</div>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-emerald-600 to-teal-700 p-8 rounded-[2.5rem] shadow-xl shadow-emerald-100 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/20 rounded-full -ml-24 -mb-24 blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Green View Residency - Resident Dashboard</h1>
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black tracking-tight">Welcome, {resident.name}</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-emerald-100 font-medium">
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                <span className="text-[10px] font-black uppercase tracking-tighter opacity-60">Tower:</span>
                <span className="text-xs font-black uppercase tracking-widest">{resident.tower}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                <span className="text-[10px] font-black uppercase tracking-tighter opacity-60">Flat:</span>
                <span className="text-xs font-black uppercase tracking-widest">{resident.flat}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg border border-white/10">
                <span className="text-[10px] font-black uppercase tracking-tighter opacity-60">Resident ID:</span>
                <span className="text-xs font-black uppercase tracking-widest">{resident.resident_id}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10">
          <div className="text-right">
            <p className="text-sm font-black">{resident.name}</p>
            <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-widest">Resident ID: {resident.resident_id}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-emerald-600 text-xl font-black shadow-inner">
            {resident.name.split(' ').map(n => n[0]).join('')}
          </div>
        </div>
      </header>

      {renderContent()}
    </div>
  );
}
