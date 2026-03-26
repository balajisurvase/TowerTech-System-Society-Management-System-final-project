import React, { useState } from 'react';
import { 
  Users, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle,
  Search,
  MessageSquare,
  Calendar,
  Check,
  X,
  Clock,
  ExternalLink,
  Plus,
  Edit,
  ArrowLeft
} from 'lucide-react';
import { User, Resident, MaintenanceRecord, Complaint, Booking, Amenity } from '../types';
import { societyService } from '../lib/societyService';
import { useEffect } from 'react';

interface AdminDashboardProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  residents: Resident[];
  maintenance: MaintenanceRecord[];
  complaints: Complaint[];
  bookings: Booking[];
  onRefresh: () => void;
}

export default function AdminDashboard({ 
  user, 
  activeTab, 
  setActiveTab,
  residents, 
  maintenance, 
  complaints, 
  bookings,
  onRefresh 
}: AdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [maintenanceFilter, setMaintenanceFilter] = useState<'All' | 'Paid' | 'Unpaid'>('All');
  const [complaintFilter, setComplaintFilter] = useState<'All' | 'Pending' | 'Done' | 'Rejected'>('All');
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [dbError, setDbError] = useState<string | null>(null);
  const [showBillForm, setShowBillForm] = useState(false);
  const [showAmenityForm, setShowAmenityForm] = useState(false);
  const [showBookingEditModal, setShowBookingEditModal] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [bookingEditData, setBookingEditData] = useState({
    start_time: '',
    end_time: ''
  });
  const [billFormData, setBillFormData] = useState({
    resident_id: 'all',
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear().toString(),
    amount: 2500,
    due_date: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
    description: 'Monthly Maintenance'
  });
  const [amenityFormData, setAmenityFormData] = useState({
    name: '',
    price: 0,
    description: '',
    base_hours: 4,
    extra_hour_charge: 0,
    facilities: ''
  });

  const fetchAmenities = async () => {
    try {
      const data = await societyService.getAmenities(user.society_id);
      setAmenities(data);
      setDbError(null);
    } catch (error: any) {
      // PGRST205: PostgREST error for table not found in schema cache
      // 42P01: Postgres error for table not found
      if (error.code === '42P01' || error.code === 'PGRST205') {
        setDbError('The "amenities" table is missing from your database.');
      } else {
        console.error('Error fetching amenities:', error);
      }
    }
  };

  useEffect(() => {
    fetchAmenities();
  }, [user.society_id]);

  // Calculate Statistics
  const totalResidents = residents.length;
  const paidMaintenanceCount = maintenance.filter(m => m.status === 'Paid').length;
  const unpaidMaintenanceCount = maintenance.filter(m => m.status === 'Unpaid').length;
  const totalComplaints = complaints.length;
  const pendingComplaints = complaints.filter(c => c.status === 'Pending').length;
  const doneComplaints = complaints.filter(c => c.status === 'Done' || c.status === 'Resolved').length;
  const rejectedComplaints = complaints.filter(c => c.status === 'Rejected').length;
  
  const totalBookings = bookings.length;
  const totalCollectionAmount = maintenance
    .filter(m => m.status === 'Paid')
    .reduce((sum, m) => sum + m.amount, 0);
  const totalPendingAmount = maintenance
    .filter(m => m.status === 'Unpaid')
    .reduce((sum, m) => sum + m.amount, 0);

  const stats = [
    { label: 'Total Residents', value: totalResidents, icon: Users, color: 'bg-blue-600' },
    { label: 'Paid Maintenance', value: paidMaintenanceCount, icon: CheckCircle2, color: 'bg-emerald-600' },
    { label: 'Unpaid Maintenance', value: unpaidMaintenanceCount, icon: AlertCircle, color: 'bg-amber-600' },
    { label: 'Total Complaints', value: totalComplaints, icon: MessageSquare, color: 'bg-indigo-600' },
    { label: 'Total Bookings', value: totalBookings, icon: Calendar, color: 'bg-violet-600' },
    { label: 'Total Collection', value: `₹${totalCollectionAmount}`, icon: CreditCard, color: 'bg-emerald-700' },
  ];

  const formatTime = (time?: string) => {
    if (!time) return 'N/A';
    try {
      const [hours, minutes] = time.split(':');
      const h = parseInt(hours);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    } catch (e) {
      return time;
    }
  };

  const handleUpdateMaintenanceStatus = async (maintenanceId: string, status: 'Paid' | 'Unpaid') => {
    setUpdating(maintenanceId);
    try {
      await societyService.updateMaintenanceStatus(maintenanceId, status);
      onRefresh();
    } catch (error: any) {
      alert('Update failed: ' + error.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdateComplaintStatus = async (complaintId: string, status: 'Pending' | 'Done' | 'Rejected') => {
    setUpdating(complaintId);
    try {
      await societyService.updateComplaintStatus(complaintId, status);
      onRefresh();
    } catch (error: any) {
      alert('Update failed: ' + error.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: 'Approved' | 'Rejected' | 'Pending') => {
    setUpdating(bookingId);
    try {
      await societyService.updateBookingStatus(bookingId, status);
      onRefresh();
    } catch (error: any) {
      alert('Update failed: ' + error.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleUpdateBookingTimes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    setUpdating(editingBooking.booking_id || editingBooking.id!);
    try {
      await societyService.updateBooking(editingBooking.booking_id || editingBooking.id!, {
        start_time: bookingEditData.start_time,
        end_time: bookingEditData.end_time
      });
      alert('Booking times updated successfully!');
      setShowBookingEditModal(false);
      onRefresh();
    } catch (error: any) {
      alert('Update failed: ' + error.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleCreateMaintenanceBill = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (residents.length === 0) {
      alert('No residents found to generate bills for.');
      return;
    }

    setUpdating('generating-bill');
    try {
      const fullMonth = `${billFormData.month} ${billFormData.year}`;
      
      let targetResidents = [];
      if (billFormData.resident_id === 'all') {
        targetResidents = residents;
      } else if (billFormData.resident_id.startsWith('tower-')) {
        const tower = billFormData.resident_id.split('-')[1];
        targetResidents = residents.filter(r => r.tower === tower);
      }

      if (targetResidents.length > 0) {
        // Generate bills for multiple residents
        const billPromises = targetResidents.map(resident => 
          societyService.createMaintenanceBill({
            resident_id: resident.resident_id,
            resident_name: resident.name,
            flat_no: resident.flat,
            tower: resident.tower,
            month: fullMonth,
            amount: billFormData.amount,
            status: 'Unpaid',
            due_date: billFormData.due_date,
            society_id: user.society_id,
            admin_id: user.admin_id,
            generated_by: 'Admin'
          })
        );

        await Promise.all(billPromises);
        alert(`Maintenance bills generated successfully for ${targetResidents.length} residents!`);
      } else {
        // Generate bill for a SPECIFIC resident
        const resident = residents.find(r => r.resident_id === billFormData.resident_id);
        if (!resident) throw new Error('Resident not found');

        await societyService.createMaintenanceBill({
          resident_id: resident.resident_id,
          resident_name: resident.name,
          flat_no: resident.flat,
          tower: resident.tower,
          month: fullMonth,
          amount: billFormData.amount,
          status: 'Unpaid',
          due_date: billFormData.due_date,
          society_id: user.society_id,
          admin_id: user.admin_id,
          generated_by: 'Admin'
        });
        alert(`Maintenance bill generated successfully for ${resident.name}!`);
      }
      
      setShowBillForm(false);
      onRefresh();
    } catch (error: any) {
      alert('Failed to generate bill(s): ' + error.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleAddAmenity = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating('adding-amenity');
    try {
      // Check if amenity already exists
      const existingAmenity = amenities.find(a => a.name === amenityFormData.name);
      
      if (existingAmenity) {
        // Update existing amenity
        await societyService.updateAmenity(existingAmenity.amenity_id, {
          price: amenityFormData.price,
          base_hours: amenityFormData.base_hours,
          extra_hour_charge: amenityFormData.extra_hour_charge,
          facilities: amenityFormData.facilities
        });
        alert('Amenity updated successfully!');
      } else {
        // Add new amenity
        await societyService.addAmenity({
          name: amenityFormData.name,
          price: amenityFormData.price,
          description: amenityFormData.description,
          base_hours: amenityFormData.base_hours,
          extra_hour_charge: amenityFormData.extra_hour_charge,
          facilities: amenityFormData.facilities,
          society_id: user.society_id
        });
        alert('Amenity added successfully!');
      }
      
      setShowAmenityForm(false);
      setAmenityFormData({ 
        name: '', 
        price: 0, 
        description: '', 
        base_hours: 4,
        extra_hour_charge: 0,
        facilities: ''
      });
      fetchAmenities();
    } catch (error: any) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        setDbError('The amenities table does not exist in your database.');
        setShowSqlModal(true);
      }
      alert('Failed to update amenity: ' + error.message);
    } finally {
      setUpdating(null);
    }
  };

  const filteredResidents = residents.filter(r => 
    r.resident_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMaintenance = maintenance
    .filter(m => {
      if (maintenanceFilter === 'All') return true;
      return m.status === maintenanceFilter;
    })
    .sort((a, b) => {
      const idA = a.maintenance_id || a.id || '';
      const idB = b.maintenance_id || b.id || '';
      return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' });
    });

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${stat.color} p-3 rounded-xl text-white`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                  <h3 className="text-2xl font-black text-gray-800">{stat.value}</h3>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-blue-50">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Recent Complaints</h3>
                <div className="space-y-4">
                  {complaints.slice(0, 5).map((complaint, index) => (
                    <div key={complaint.complaint_id || complaint.id || `complaint-${index}`} className="flex items-center justify-between p-4 rounded-xl bg-blue-50/30 border border-blue-50">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          complaint.status === 'Done' || complaint.status === 'Resolved' ? 'bg-emerald-100 text-emerald-600' :
                          complaint.status === 'In Progress' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded uppercase">
                              {complaint.complaint_id || (complaint.id ? `C-${complaint.id.substring(0, 4)}` : 'N/A')}
                            </span>
                            <p className="font-bold text-gray-800">{complaint.category}</p>
                          </div>
                          <p className="text-xs text-gray-400">{complaint.name} • {complaint.date}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${
                        complaint.status === 'Done' || complaint.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                        complaint.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {complaint.status}
                      </span>
                    </div>
                  ))}
                  {complaints.length === 0 && <p className="text-center text-gray-400 py-4">No complaints found.</p>}
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-blue-50">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Recent Bookings</h3>
                <div className="space-y-4">
                  {bookings.slice(0, 5).map((booking, index) => (
                    <div key={booking.booking_id || booking.id || `booking-${index}`} className="flex items-center justify-between p-4 rounded-xl bg-blue-50/30 border border-blue-50">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          booking.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                          booking.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                        }`}>
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[8px] font-black text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded uppercase">
                              {booking.booking_id || (booking.id ? booking.id.substring(0, 4) : 'N/A')}
                            </span>
                            <p className="font-bold text-gray-800">{booking.amenity_name}</p>
                          </div>
                          <p className="text-xs text-gray-400">{booking.booking_date} • {booking.event_name}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full uppercase ${
                        booking.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                        booking.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  ))}
                  {bookings.length === 0 && <p className="text-center text-gray-400 py-4">No bookings found.</p>}
                </div>
              </div>
            </div>
          </div>
        );

      case 'residents':
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-blue-50 overflow-hidden">
            <div className="p-6 border-b border-blue-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-lg font-bold text-gray-800">Resident Management</h3>
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search ID or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full md:w-64"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-blue-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Resident ID</th>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Tower/Floor/Flat</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {filteredResidents.map((r) => (
                    <tr key={r.resident_id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 font-black text-blue-600">{r.resident_id}</td>
                      <td className="px-6 py-4 font-bold text-gray-800">{r.name}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">T-{r.tower} / F-{r.floor} / {r.flat}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        <p>{r.email}</p>
                        <p>{r.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => setActiveTab('maintenance')}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                        >
                          View Maintenance
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'maintenance':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-100">
                <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Total Residents</p>
                <h3 className="text-3xl font-black">{totalResidents}</h3>
              </div>
              <div className="bg-emerald-600 p-6 rounded-2xl text-white shadow-lg shadow-emerald-100">
                <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">Total Paid Amount</p>
                <h3 className="text-3xl font-black">₹{totalCollectionAmount.toLocaleString()}</h3>
              </div>
              <div className="bg-amber-600 p-6 rounded-2xl text-white shadow-lg shadow-amber-100">
                <p className="text-amber-100 text-xs font-bold uppercase tracking-wider mb-1">Total Pending Amount</p>
                <h3 className="text-3xl font-black">₹{totalPendingAmount.toLocaleString()}</h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-blue-50 overflow-hidden">
              <div className="p-6 border-b border-blue-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-bold text-gray-800">Maintenance Records</h3>
                  <button 
                    onClick={() => setShowBillForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Generate New Bill
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 uppercase">Filter:</span>
                  <select 
                    value={maintenanceFilter}
                    onChange={(e) => setMaintenanceFilter(e.target.value as any)}
                    className="px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-gray-700"
                  >
                    <option value="All">Show All</option>
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-blue-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Maintenance ID</th>
                      <th className="px-6 py-4">Tower</th>
                      <th className="px-6 py-4">Flat No</th>
                      <th className="px-6 py-4">Month</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Due Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-50">
                    {filteredMaintenance.map((m, index) => (
                      <tr key={m.maintenance_id || m.id || index} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-base font-black text-blue-600 uppercase tracking-tight leading-none">
                              {m.maintenance_id || (m.id ? m.id.substring(0, 8) : 'N/A')}
                            </span>
                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest leading-none mt-1.5">
                              {m.resident_id}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">T-{m.tower}</td>
                        <td className="px-6 py-4 font-bold text-gray-800">{m.flat_no}</td>
                        <td className="px-6 py-4 text-gray-600">{m.month}</td>
                        <td className="px-6 py-4 font-bold text-gray-800">₹{m.amount}</td>
                        <td className="px-6 py-4 text-gray-500 text-sm">{m.due_date}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                            m.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {m.status === 'Unpaid' ? (
                              <button 
                                onClick={() => handleUpdateMaintenanceStatus(m.maintenance_id || m.id!, 'Paid')}
                                disabled={updating === (m.maintenance_id || m.id)}
                                className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg hover:bg-emerald-100 transition-all disabled:opacity-50 uppercase"
                              >
                                Mark as Paid
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleUpdateMaintenanceStatus(m.maintenance_id || m.id!, 'Unpaid')}
                                disabled={updating === (m.maintenance_id || m.id)}
                                className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-lg hover:bg-rose-100 transition-all disabled:opacity-50 uppercase"
                              >
                                Mark as Unpaid
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'complaints':
        const filteredComplaints = complaints.filter(c => {
          if (complaintFilter === 'All') return true;
          if (complaintFilter === 'Done') return c.status === 'Done' || c.status === 'Resolved';
          return c.status === complaintFilter;
        });

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-100">
                <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">Total Complaints</p>
                <h3 className="text-3xl font-black">{totalComplaints}</h3>
              </div>
              <div className="bg-amber-600 p-6 rounded-2xl text-white shadow-lg shadow-amber-100">
                <p className="text-amber-100 text-xs font-bold uppercase tracking-wider mb-1">Pending</p>
                <h3 className="text-3xl font-black">{pendingComplaints}</h3>
              </div>
              <div className="bg-emerald-600 p-6 rounded-2xl text-white shadow-lg shadow-emerald-100">
                <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">Done</p>
                <h3 className="text-3xl font-black">{doneComplaints}</h3>
              </div>
              <div className="bg-rose-600 p-6 rounded-2xl text-white shadow-lg shadow-rose-100">
                <p className="text-rose-100 text-xs font-bold uppercase tracking-wider mb-1">Rejected</p>
                <h3 className="text-3xl font-black">{rejectedComplaints}</h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-blue-50 overflow-hidden">
              <div className="p-6 border-b border-blue-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="text-lg font-bold text-gray-800">Complaint Management</h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 uppercase">Filter:</span>
                  <select 
                    value={complaintFilter}
                    onChange={(e) => setComplaintFilter(e.target.value as any)}
                    className="px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-gray-700"
                  >
                    <option value="All">Show All</option>
                    <option value="Pending">Pending</option>
                    <option value="Done">Done</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 gap-6">
                {filteredComplaints.map((c, index) => (
                  <div key={c.complaint_id || c.id || index} className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50 flex flex-col md:flex-row gap-6 hover:border-blue-200 transition-all">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${
                            c.status === 'Done' || c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-600' :
                            c.status === 'In Progress' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                          }`}>
                            <MessageSquare className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest">
                                {c.complaint_id || (c.id ? `C-${c.id.substring(0, 6)}` : 'N/A')}
                              </span>
                              <h4 className="text-xl font-bold text-gray-800">{c.category}</h4>
                            </div>
                            <p className="text-sm text-gray-400">
                              By: {c.name || residents.find(r => r.resident_id === c.resident_id)?.name || c.resident_id} • 
                              Flat: {c.flat || 'N/A'} • {c.date}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs font-black px-4 py-1 rounded-full uppercase ${
                          c.status === 'Done' || c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700' :
                          c.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-6">{c.description}</p>
                      
                      <div className="flex flex-wrap gap-2">
                        <button 
                          onClick={() => handleUpdateComplaintStatus(c.complaint_id || c.id!, 'Pending')}
                          disabled={updating === (c.complaint_id || c.id)}
                          className="px-4 py-2 rounded-xl bg-amber-50 text-amber-600 text-xs font-bold hover:bg-amber-100 transition-all disabled:opacity-50"
                        >
                          Set Pending
                        </button>
                        <button 
                          onClick={() => handleUpdateComplaintStatus(c.complaint_id || c.id!, 'Done')}
                          disabled={updating === (c.complaint_id || c.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-bold hover:bg-emerald-100 transition-all disabled:opacity-50"
                        >
                          Set Done
                        </button>
                        <button 
                          onClick={() => handleUpdateComplaintStatus(c.complaint_id || c.id!, 'Rejected')}
                          disabled={updating === (c.complaint_id || c.id)}
                          className="px-4 py-2 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 transition-all disabled:opacity-50"
                        >
                          Set Rejected
                        </button>
                      </div>
                    </div>
                    {(c.media || c.media_url) && (
                      <div className="md:w-64 h-48 rounded-xl overflow-hidden bg-gray-100 border border-blue-50 relative group">
                        {((c.media || c.media_url) || '').match(/\.(mp4|webm|ogg)$/) ? (
                          <video src={c.media || c.media_url} className="w-full h-full object-cover" />
                        ) : (
                          <img src={c.media || c.media_url} alt="Complaint attachment" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        )}
                        <a 
                          href={c.media || c.media_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-sm"
                        >
                          <ExternalLink className="w-5 h-5 mr-2" />
                          View Media
                        </a>
                      </div>
                    )}
                  </div>
                ))}
                {filteredComplaints.length === 0 && <div className="p-12 text-center text-gray-400 bg-white rounded-2xl border border-blue-50">No complaints found for this filter.</div>}
              </div>
            </div>
          </div>
        );

      case 'bookings':
        return (
          <div className="bg-white rounded-2xl shadow-sm border border-blue-50 overflow-hidden">
            <div className="p-8 border-b border-blue-50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className="p-2 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm"
                  title="Back to Dashboard"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="text-2xl font-black text-gray-800">Amenity Bookings</h3>
                  <p className="text-gray-500">Manage and approve resident amenity requests</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowAmenityForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Update Booking
                </button>
                <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                  <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Total: {bookings.length}</span>
                </div>
              </div>
            </div>

            {/* Current Amenity Prices Section */}
            <div className="px-8 py-4 bg-blue-50/30 border-b border-blue-50 flex flex-wrap gap-6">
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mr-2">Current Rates:</div>
              {amenities.map(amenity => (
                <div key={amenity.amenity_id} className="flex items-center gap-2 bg-white px-3 py-1 rounded-lg border border-blue-100 shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{amenity.name}</span>
                  </div>
                  <span className="text-sm font-black text-blue-600">₹{amenity.price}</span>
                </div>
              ))}
              {amenities.length === 0 && <span className="text-xs text-gray-400 italic">No amenity prices set.</span>}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-blue-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Booking ID</th>
                    <th className="px-6 py-4">Resident Name</th>
                    <th className="px-6 py-4">Resident ID</th>
                    <th className="px-6 py-4">Tower / Flat</th>
                    <th className="px-6 py-4">Amenity Name</th>
                    <th className="px-6 py-4">Event Name</th>
                    <th className="px-6 py-4">Booking Date</th>
                    <th className="px-6 py-4">Program Time</th>
                    <th className="px-6 py-4">Charges (₹)</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {bookings.map((b, index) => (
                    <tr key={b.booking_id || b.id || index} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 font-black text-blue-600">
                        {b.booking_id || b.id?.slice(0, 8) || 'PENDING'}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-800">{b.name}</td>
                      <td className="px-6 py-4 text-[10px] text-gray-400 font-black uppercase">{b.resident_id}</td>
                      <td className="px-6 py-4 font-bold text-gray-700">T-{b.tower} / {b.flat}</td>
                      <td className="px-6 py-4 font-bold text-gray-800">{b.amenity_name}</td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{b.event_name}</td>
                      <td className="px-6 py-4 text-gray-800 font-bold">{b.booking_date}</td>
                      <td className="px-6 py-4 text-[10px] text-gray-400 font-black uppercase">
                        {b.start_time} - {b.end_time}
                      </td>
                      <td className="px-6 py-4 font-black text-gray-800">₹{b.charges}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${
                          b.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                          b.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingBooking(b);
                              setBookingEditData({
                                start_time: b.start_time,
                                end_time: b.end_time
                              });
                              setShowBookingEditModal(true);
                            }}
                            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                            title="Edit Program Time"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleUpdateBookingStatus(b.booking_id || b.id!, 'Approved')}
                            disabled={updating === (b.booking_id || b.id) || b.status === 'Approved'}
                            className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all disabled:opacity-30"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleUpdateBookingStatus(b.booking_id || b.id!, 'Rejected')}
                            disabled={updating === (b.booking_id || b.id) || b.status === 'Rejected'}
                            className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all disabled:opacity-30"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-400 font-bold">
                        No amenity bookings found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return <div className="p-12 text-center text-gray-400">Section coming soon...</div>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-slate-800 to-slate-900 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full -ml-24 -mb-24 blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/10">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">TowerTech-Society</h1>
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black tracking-tight">Hello, {user.name}</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-400 font-medium">
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                <span className="text-[10px] font-black uppercase tracking-tighter opacity-40">ID:</span>
                <span className="text-xs font-black uppercase tracking-widest">{user.admin_id || 'A-001'}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                <span className="text-[10px] font-black uppercase tracking-tighter opacity-40">Role:</span>
                <span className="text-xs font-black uppercase tracking-widest">{user.role}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                <span className="text-[10px] font-black uppercase tracking-tighter opacity-40">Email:</span>
                <span className="text-xs font-black tracking-widest">{user.email || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/10">
          <div className="text-right">
            <p className="text-sm font-black">{user.name}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Admin ID: {user.admin_id || 'A-001'}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-lg">
            {user.name?.slice(0, 2).toUpperCase() || 'AD'}
          </div>
        </div>
      </header>

      {renderContent()}

      {/* Maintenance Bill Form Modal */}
      {showBillForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black">Generate Maintenance Bill</h3>
                <p className="text-blue-100 text-xs font-medium uppercase tracking-wider">Create a new record for a resident</p>
              </div>
              <button onClick={() => setShowBillForm(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateMaintenanceBill} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Resident / Group</label>
                <select 
                  required
                  value={billFormData.resident_id}
                  onChange={(e) => setBillFormData({ ...billFormData, resident_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                >
                  <option value="all">All Residents</option>
                  <optgroup label="By Tower">
                    <option value="tower-A">Tower A Residents</option>
                    <option value="tower-B">Tower B Residents</option>
                    <option value="tower-C">Tower C Residents</option>
                    <option value="tower-D">Tower D Residents</option>
                  </optgroup>
                  <optgroup label="Individual Residents">
                    {residents.map(r => (
                      <option key={r.resident_id} value={r.resident_id}>
                        {r.name} ({r.tower}-{r.flat}) - {r.resident_id}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Month</label>
                  <select 
                    required
                    value={billFormData.month}
                    onChange={(e) => setBillFormData({ ...billFormData, month: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  >
                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Year</label>
                  <select 
                    required
                    value={billFormData.year}
                    onChange={(e) => setBillFormData({ ...billFormData, year: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  >
                    {[new Date().getFullYear(), new Date().getFullYear() + 1].map(y => (
                      <option key={y} value={y.toString()}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount (₹)</label>
                  <input 
                    type="number"
                    required
                    min="1"
                    value={billFormData.amount}
                    onChange={(e) => setBillFormData({ ...billFormData, amount: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Due Date</label>
                  <input 
                    type="date"
                    required
                    value={billFormData.due_date}
                    onChange={(e) => setBillFormData({ ...billFormData, due_date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</label>
                <textarea 
                  rows={2}
                  value={billFormData.description}
                  onChange={(e) => setBillFormData({ ...billFormData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
                />
              </div>
              <button 
                type="submit"
                disabled={updating === 'generating-bill'}
                className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
              >
                {updating === 'generating-bill' ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Generate Bill
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Booking Edit Modal */}
      {showBookingEditModal && editingBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowBookingEditModal(false)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Back"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h3 className="text-xl font-black text-gray-800">Update Booking Times</h3>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                    {editingBooking.amenity_name} - {editingBooking.booking_date}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowBookingEditModal(false)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateBookingTimes} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Start Time</label>
                  <input 
                    type="time"
                    required
                    value={bookingEditData.start_time}
                    onChange={(e) => setBookingEditData({ ...bookingEditData, start_time: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">End Time</label>
                  <input 
                    type="time"
                    required
                    value={bookingEditData.end_time}
                    onChange={(e) => setBookingEditData({ ...bookingEditData, end_time: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                </div>
              </div>
              <button 
                type="submit"
                disabled={updating === (editingBooking.booking_id || editingBooking.id)}
                className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
              >
                {updating === (editingBooking.booking_id || editingBooking.id) ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Update Times
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Amenity Price Management Modal */}
      {showAmenityForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowAmenityForm(false)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Back"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                  <h3 className="text-xl font-black text-gray-800">Amenity Price Management</h3>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Set and update booking amounts</p>
                </div>
              </div>
              <button onClick={() => setShowAmenityForm(false)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {dbError && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-rose-700 font-black uppercase text-xs">
                    <AlertCircle className="w-4 h-4" />
                    Database Setup Required
                  </div>
                  <p className="text-xs text-rose-600 font-medium">{dbError}</p>
                  <p className="text-[10px] text-rose-500">Please run the SQL script in your Supabase SQL Editor to create the necessary tables.</p>
                  <button 
                    onClick={() => setShowSqlModal(true)}
                    className="mt-2 bg-rose-600 text-white text-[10px] font-black px-3 py-1.5 rounded-lg hover:bg-rose-700 transition-colors uppercase tracking-widest w-fit"
                  >
                    View SQL Fix
                  </button>
                </div>
              )}
              {/* Add New Amenity Form */}
              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                <h4 className="text-sm font-black text-blue-800 uppercase tracking-widest mb-4">Manage Amenity</h4>
                <form onSubmit={handleAddAmenity} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amenity Name</label>
                      <input 
                        list="amenity-suggestions"
                        required
                        placeholder="Enter or select amenity"
                        value={amenityFormData.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          const existing = amenities.find(a => a.name === name);
                          
                          if (existing) {
                            setAmenityFormData({ 
                              ...amenityFormData, 
                              name,
                              price: existing.price,
                              base_hours: existing.base_hours || 4,
                              extra_hour_charge: existing.extra_hour_charge || 0,
                              description: existing.description || ''
                            });
                          } else {
                            // Predefined pricing for new entries if they match standard names
                            let defaults = { price: 0, base_hours: 4, extra_hour_charge: 0, description: '' };
                            if (name === 'Clubhouse Hall') {
                              defaults = { price: 2500, base_hours: 4, extra_hour_charge: 500, description: 'Indoor hall with AC, chairs, and lighting for events like birthdays and meetings.' };
                            } else if (name === 'Garden Hall') {
                              defaults = { price: 1500, base_hours: 4, extra_hour_charge: 300, description: 'Outdoor space for family gatherings and small celebrations.' };
                            } else if (name === 'Community Hall') {
                              defaults = { price: 3000, base_hours: 5, extra_hour_charge: 600, description: 'Large hall for society functions, cultural events, and meetings.' };
                            }
                            setAmenityFormData({ ...amenityFormData, name, ...defaults });
                          }
                        }}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                      />
                      <datalist id="amenity-suggestions">
                        <option value="Clubhouse Hall" />
                        <option value="Garden Hall" />
                        <option value="Community Hall" />
                      </datalist>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Price (₹)</label>
                      <input 
                        type="number"
                        required
                        placeholder="Price (₹)"
                        value={amenityFormData.price || ''}
                        onChange={(e) => setAmenityFormData({ ...amenityFormData, price: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Hours</label>
                      <input 
                        type="number"
                        required
                        min="1"
                        value={amenityFormData.base_hours}
                        onChange={(e) => setAmenityFormData({ ...amenityFormData, base_hours: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Extra Hour Charge (₹)</label>
                      <input 
                        type="number"
                        required
                        min="0"
                        value={amenityFormData.extra_hour_charge}
                        onChange={(e) => setAmenityFormData({ ...amenityFormData, extra_hour_charge: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Facilities (Comma separated)</label>
                    <textarea 
                      rows={2}
                      value={amenityFormData.facilities}
                      onChange={(e) => setAmenityFormData({ ...amenityFormData, facilities: e.target.value })}
                      placeholder="e.g. AC Hall, 30 Chairs, Tables"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={updating === 'adding-amenity'}
                    className="w-full bg-blue-600 text-white font-black py-3 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 text-xs uppercase tracking-widest shadow-lg shadow-blue-100"
                  >
                    {amenities.find(a => a.name === amenityFormData.name) ? 'Update Amenity Price' : 'Save Amenity Price'}
                  </button>
                </form>
              </div>

              {/* Existing Amenities Table */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Existing Amenities</h4>
                  <button 
                    onClick={async () => {
                      if (window.confirm('This will remove all current amenities and set the default ones (Clubhouse, Garden, Community Halls). Continue?')) {
                        setUpdating('resetting-amenities');
                        try {
                          // 1. Delete all current amenities
                          for (const a of amenities) {
                            await societyService.deleteAmenity(a.amenity_id);
                          }
                          
                          // 2. Add default amenities
                          const defaults = [
                            { name: 'Clubhouse Hall', price: 2500, base_hours: 4, extra_hour_charge: 500, description: 'Indoor hall with AC, chairs, and lighting for events like birthdays and meetings.', society_id: user.society_id },
                            { name: 'Garden Hall', price: 1500, base_hours: 4, extra_hour_charge: 300, description: 'Outdoor space for family gatherings and small celebrations.', society_id: user.society_id },
                            { name: 'Community Hall', price: 3000, base_hours: 5, extra_hour_charge: 600, description: 'Large hall for society functions, cultural events, and meetings.', society_id: user.society_id }
                          ];
                          
                          for (const d of defaults) {
                            await societyService.addAmenity(d);
                          }
                          
                          await fetchAmenities();
                          alert('Amenities reset to defaults successfully!');
                        } catch (error: any) {
                          alert('Reset failed: ' + error.message);
                        } finally {
                          setUpdating(null);
                        }
                      }
                    }}
                    disabled={updating === 'resetting-amenities'}
                    className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1 disabled:opacity-50"
                  >
                    {updating === 'resetting-amenities' ? 'Resetting...' : 'Reset to Defaults'}
                  </button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-100 max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-[10px]">
                    <thead className="bg-gray-50 text-gray-400 font-black uppercase tracking-widest sticky top-0">
                      <tr>
                        <th className="px-4 py-3">Amenity Name</th>
                        <th className="px-4 py-3">Base Price (₹)</th>
                        <th className="px-4 py-3">Base Hours</th>
                        <th className="px-4 py-3">Extra Hour Charge (₹)</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {amenities.map((a) => (
                        <tr key={a.amenity_id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3 font-bold text-gray-800">{a.name}</td>
                          <td className="px-4 py-3 font-black text-blue-600">₹{a.price}</td>
                          <td className="px-4 py-3 text-gray-500">{a.base_hours}</td>
                          <td className="px-4 py-3 text-gray-500">₹{a.extra_hour_charge}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  setAmenityFormData({
                                    name: a.name,
                                    price: a.price,
                                    description: a.description || '',
                                    base_hours: a.base_hours || 4,
                                    extra_hour_charge: a.extra_hour_charge || 0,
                                    facilities: a.facilities || ''
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all"
                                title="Edit"
                              >
                                <Plus className="w-3 h-3 rotate-45" />
                              </button>
                              <button 
                                onClick={async () => {
                                  if (window.confirm(`Are you sure you want to delete ${a.name}?`)) {
                                    try {
                                      await societyService.deleteAmenity(a.amenity_id);
                                      fetchAmenities();
                                      alert('Amenity deleted successfully!');
                                    } catch (error: any) {
                                      alert('Delete failed: ' + error.message);
                                    }
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all"
                                title="Delete"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {amenities.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-400 italic">No amenities configured.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SQL Fix Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-rose-600 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black">SQL Database Fix</h3>
                <p className="text-rose-100 text-xs font-medium uppercase tracking-wider">Run this in your Supabase SQL Editor</p>
              </div>
              <button onClick={() => setShowSqlModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
                <pre className="text-green-400 text-xs font-mono leading-relaxed">
{`-- 1. Create the amenities table
CREATE TABLE IF NOT EXISTS public.amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amenity_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    society_id TEXT NOT NULL,
    description TEXT,
    base_hours NUMERIC DEFAULT 4,
    extra_hour_charge NUMERIC DEFAULT 0,
    facilities TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add missing columns to existing tables
ALTER TABLE public.complaint ADD COLUMN IF NOT EXISTS society_id TEXT;
ALTER TABLE public.maintenance ADD COLUMN IF NOT EXISTS resident_id TEXT;
ALTER TABLE public.maintenance ADD COLUMN IF NOT EXISTS generated_by TEXT;
ALTER TABLE public.maintenance ADD COLUMN IF NOT EXISTS society_id TEXT;

-- 3. Create the booking table (if not already exists)
CREATE TABLE IF NOT EXISTS public.booking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id TEXT UNIQUE,
    resident_id TEXT NOT NULL,
    name TEXT NOT NULL,
    tower TEXT NOT NULL,
    flat TEXT NOT NULL,
    amenity_name TEXT NOT NULL,
    amenity_type TEXT,
    event_name TEXT NOT NULL,
    booking_date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    charges NUMERIC NOT NULL,
    status TEXT DEFAULT 'Pending',
    society_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking ENABLE ROW LEVEL SECURITY;

-- 4. Create basic policies
CREATE POLICY "Allow all on amenities" ON public.amenities FOR ALL USING (true);
CREATE POLICY "Allow all on booking" ON public.booking FOR ALL USING (true);`}
                </pre>
              </div>
              <div className="flex justify-between items-center bg-rose-50 p-4 rounded-xl border border-rose-100">
                <div className="flex items-center gap-3 text-rose-700">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-xs font-medium">Copy this script and run it in your Supabase SQL Editor to fix the "PGRST205" error.</p>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`-- 1. Create the amenities table
CREATE TABLE IF NOT EXISTS public.amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amenity_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    society_id TEXT NOT NULL,
    description TEXT,
    base_hours NUMERIC DEFAULT 4,
    extra_hour_charge NUMERIC DEFAULT 0,
    facilities TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add missing columns to existing tables
ALTER TABLE public.complaint ADD COLUMN IF NOT EXISTS society_id TEXT;
ALTER TABLE public.maintenance ADD COLUMN IF NOT EXISTS resident_id TEXT;
ALTER TABLE public.maintenance ADD COLUMN IF NOT EXISTS generated_by TEXT;
ALTER TABLE public.maintenance ADD COLUMN IF NOT EXISTS society_id TEXT;

-- 3. Create the booking table (if not already exists)
CREATE TABLE IF NOT EXISTS public.booking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id TEXT UNIQUE,
    resident_id TEXT NOT NULL,
    name TEXT NOT NULL,
    tower TEXT NOT NULL,
    flat TEXT NOT NULL,
    amenity_name TEXT NOT NULL,
    amenity_type TEXT,
    event_name TEXT NOT NULL,
    booking_date DATE NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    charges NUMERIC NOT NULL,
    status TEXT DEFAULT 'Pending',
    society_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking ENABLE ROW LEVEL SECURITY;

-- 5. Create basic policies
CREATE POLICY "Allow all on amenities" ON public.amenities FOR ALL USING (true);
CREATE POLICY "Allow all on booking" ON public.booking FOR ALL USING (true);`);
                    alert('SQL script copied to clipboard!');
                  }}
                  className="bg-rose-600 text-white font-black px-4 py-2 rounded-lg hover:bg-rose-700 transition-all text-xs uppercase tracking-widest"
                >
                  Copy SQL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
