import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Resident, Booking, Amenity } from '../types';
import { societyService } from '../lib/societyService';

interface AmenityBookingProps {
  resident: Resident;
  onRefresh: () => void;
}

export default function AmenityBooking({ resident, onRefresh }: AmenityBookingProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [amenitiesList, setAmenitiesList] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    amenity_name: '',
    event_name: '',
    booking_date: '',
    start_time: '18:00',
    end_time: '22:00'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsData, amenitiesData] = await Promise.all([
        societyService.getResidentBookings(resident.resident_id),
        societyService.getAmenities(resident.society_id)
      ]);
      setBookings(bookingsData);
      setAmenitiesList(amenitiesData);
      
      if (amenitiesData.length > 0 && !formData.amenity_name) {
        setFormData(prev => ({ ...prev, amenity_name: amenitiesData[0].name }));
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [resident.resident_id, resident.society_id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateHours = () => {
    if (!formData.start_time || !formData.end_time) return 0;
    const start = new Date(`2000-01-01T${formData.start_time}`);
    const end = new Date(`2000-01-01T${formData.end_time}`);
    let diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (diff < 0) diff += 24;
    return diff;
  };

  const getCharges = () => {
    const selectedAmenity = amenitiesList.find(a => a.name === formData.amenity_name);
    if (!selectedAmenity) return { base: 0, extra: 0, total: 0, hours: 0 };

    const hours = calculateHours();
    const baseHours = selectedAmenity.base_hours || 4;
    const basePrice = selectedAmenity.price;
    const extraCharge = selectedAmenity.extra_hour_charge || 0;

    let total = basePrice;
    if (hours > baseHours) {
      total += Math.ceil(hours - baseHours) * extraCharge;
    }

    return {
      base: basePrice,
      extra: extraCharge,
      total: total,
      hours: hours
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.event_name || !formData.booking_date || !formData.start_time || !formData.end_time) {
      toast.error('Please fill in all fields');
      return;
    }

    const selectedAmenity = amenitiesList.find(a => a.name === formData.amenity_name);
    if (!selectedAmenity) return;

    // Check for slot conflicts
    const formatTime = (time: string) => {
      const [h, m] = time.split(':');
      const hour = parseInt(h);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${m} ${ampm}`;
    };

    const newStartTime = formatTime(formData.start_time);
    const newEndTime = formatTime(formData.end_time);

    const conflict = bookings.find(b => 
      b.amenity_name === formData.amenity_name && 
      b.booking_date === formData.booking_date &&
      b.status !== 'Rejected' &&
      ((newStartTime >= b.start_time && newStartTime < b.end_time) ||
       (newEndTime > b.start_time && newEndTime <= b.end_time) ||
       (newStartTime <= b.start_time && newEndTime >= b.end_time))
    );

    if (conflict) {
      toast.error('This slot is already booked for the selected amenity. Please choose another time.');
      return;
    }

    setSubmitting(true);
    try {
      const { total } = getCharges();
      
      await societyService.addBooking({
        resident_id: resident.resident_id,
        name: resident.name,
        tower: resident.tower,
        flat: resident.flat,
        amenity_name: formData.amenity_name,
        amenity_type: selectedAmenity.description || 'Amenity',
        event_name: formData.event_name,
        booking_date: formData.booking_date,
        start_time: newStartTime,
        end_time: newEndTime,
        charges: total,
        status: 'Pending',
        society_id: resident.society_id
      });

      setSuccessMessage('Booking request submitted successfully!');
      setFormData(prev => ({
        ...prev,
        event_name: '',
        booking_date: '',
      }));
      fetchData();
      onRefresh();
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error: any) {
      toast.error('Booking failed: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const charges = getCharges();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-lg font-black text-slate-900">Amenity Bookings</h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Book and manage society amenities</p>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 shrink-0">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold text-sm">{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
            <div className="p-6 border-b border-slate-50 shrink-0">
              <h3 className="text-lg font-black text-slate-900">Book Amenity</h3>
              <p className="text-xs text-slate-500 font-medium">Request a new reservation</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Auto-filled Resident Info Section */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></div>
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Resident Information</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Name</p>
                    <p className="font-bold text-slate-800 text-xs">{resident.name}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Resident ID</p>
                    <p className="font-black text-indigo-600 text-xs">{resident.resident_id}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Tower</p>
                    <p className="font-bold text-slate-800 text-xs">{resident.tower}</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Flat No</p>
                    <p className="font-bold text-slate-800 text-xs">{resident.flat}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Amenity</label>
                  <div className="relative">
                    <select
                      name="amenity_name"
                      value={formData.amenity_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-bold text-sm text-slate-700 appearance-none bg-slate-50"
                    >
                      {amenitiesList.map(a => (
                        <option key={a.amenity_id} value={a.name}>{a.name} ({a.description || 'Amenity'})</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </div>
                  </div>
                  {amenitiesList.find(a => a.name === formData.amenity_name)?.facilities && (
                    <div className="mt-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                      <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-0.5">Available Facilities</p>
                      <p className="text-[10px] font-bold text-slate-700">{amenitiesList.find(a => a.name === formData.amenity_name)?.facilities}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Event Name</label>
                  <input
                    type="text"
                    name="event_name"
                    value={formData.event_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Birthday Party, Meeting"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-bold text-sm text-slate-700 bg-slate-50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Booking Date</label>
                  <input
                    type="date"
                    name="booking_date"
                    value={formData.booking_date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-bold text-sm text-slate-700 bg-slate-50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Time</label>
                    <input
                      type="time"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-bold text-sm text-slate-700 bg-slate-50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Time</label>
                    <input
                      type="time"
                      name="end_time"
                      value={formData.end_time}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-bold text-sm text-slate-700 bg-slate-50"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50/50 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">Total Hours :</span>
                  <span className="text-slate-800 font-black">{charges.hours} Hours</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">Base Charges :</span>
                  <span className="text-slate-800 font-black">₹{charges.base}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">Extra Hour Charges :</span>
                  <span className="text-slate-800 font-black">₹{charges.extra} per hour</span>
                </div>
                <div className="pt-3 border-t border-indigo-100 flex justify-between items-center">
                  <span className="text-slate-800 font-black text-sm">Total Charges :</span>
                  <span className="text-xl font-black text-indigo-600">₹{charges.total}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    SUBMITTING...
                  </>
                ) : (
                  'Submit Booking Request'
                )}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
            <div className="p-6 border-b border-slate-50 shrink-0">
              <h3 className="text-lg font-black text-slate-900">My Booking History</h3>
              <p className="text-xs text-slate-500 font-medium">Track all your amenity reservations</p>
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
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center">
                        <div className="flex justify-center items-center gap-2 text-indigo-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="font-bold">Loading bookings...</span>
                        </div>
                      </td>
                    </tr>
                  ) : bookings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-bold">
                        No bookings found.
                      </td>
                    </tr>
                  ) : (
                    bookings.map((b, idx) => (
                      <tr key={b.id || b.booking_id} className="hover:bg-slate-50 transition-colors text-xs">
                        <td className="px-8 py-6 font-black text-indigo-600">
                          B{String(idx + 1).padStart(3, '0')}
                        </td>
                        <td className="px-8 py-6">
                          <p className="font-bold text-slate-800">{b.amenity_name}</p>
                          <p className="text-[8px] text-slate-400 font-black uppercase">{b.amenity_type}</p>
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
                          <span className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase flex items-center gap-1.5 w-fit ${
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
        </div>

        <div className="space-y-6 shrink-0">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50">
              <h3 className="text-lg font-black text-slate-900">Booking Rules</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[10px] shrink-0">1</div>
                <p className="text-xs text-slate-600 font-medium">Booking must be done at least 1 day before event</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[10px] shrink-0">2</div>
                <p className="text-xs text-slate-600 font-medium">Maximum booking time is 8 hours</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[10px] shrink-0">3</div>
                <p className="text-xs text-slate-600 font-medium">Extra charges apply after base hours</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[10px] shrink-0">4</div>
                <p className="text-xs text-slate-600 font-medium">Admin approval is required</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
