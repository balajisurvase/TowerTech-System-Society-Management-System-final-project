import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
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
      alert('Please fill in all fields');
      return;
    }

    const selectedAmenity = amenitiesList.find(a => a.name === formData.amenity_name);
    if (!selectedAmenity) return;

    setSubmitting(true);
    try {
      const { total } = getCharges();
      
      // Format time for display
      const formatTime = (time: string) => {
        const [h, m] = time.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${m} ${ampm}`;
      };

      await societyService.addBooking({
        resident_id: resident.resident_id,
        name: resident.name,
        tower: resident.tower,
        flat: resident.flat,
        amenity_name: formData.amenity_name,
        amenity_type: selectedAmenity.description || 'Amenity',
        event_name: formData.event_name,
        booking_date: formData.booking_date,
        start_time: formatTime(formData.start_time),
        end_time: formatTime(formData.end_time),
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
      alert('Booking failed: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const charges = getCharges();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-800">Amenity Bookings</h2>
          <p className="text-gray-500 font-medium">Book and manage society amenities</p>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-6 py-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold">{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-blue-50 overflow-hidden">
            <div className="p-8 border-b border-blue-50">
              <h3 className="text-xl font-black text-gray-800">Book Amenity</h3>
              <p className="text-gray-500">Request a new reservation</p>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Select Amenity</label>
                  <select
                    name="amenity_name"
                    value={formData.amenity_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-bold text-gray-700"
                  >
                    {amenitiesList.map(a => (
                      <option key={a.amenity_id} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Event Name</label>
                  <input
                    type="text"
                    name="event_name"
                    value={formData.event_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Birthday Party"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-bold text-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Booking Date</label>
                  <input
                    type="date"
                    name="booking_date"
                    value={formData.booking_date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-bold text-gray-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Start Time</label>
                    <input
                      type="time"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-bold text-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">End Time</label>
                    <input
                      type="time"
                      name="end_time"
                      value={formData.end_time}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all font-bold text-gray-700"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50/50 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-bold">Total Hours :</span>
                  <span className="text-gray-800 font-black">{charges.hours} Hours</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-bold">Base Charges :</span>
                  <span className="text-gray-800 font-black">₹{charges.base}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-bold">Extra Hour Charges :</span>
                  <span className="text-gray-800 font-black">₹{charges.extra} per hour</span>
                </div>
                <div className="pt-4 border-t border-blue-100 flex justify-between items-center">
                  <span className="text-gray-800 font-black">Total Charges :</span>
                  <span className="text-2xl font-black text-blue-600">₹{charges.total}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    SUBMITTING...
                  </>
                ) : (
                  'Submit Booking Request'
                )}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-blue-50 overflow-hidden">
            <div className="p-8 border-b border-blue-50">
              <h3 className="text-xl font-black text-gray-800">My Booking History</h3>
              <p className="text-gray-500">Track all your amenity reservations</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-blue-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4">Booking ID</th>
                    <th className="px-8 py-4">Amenity</th>
                    <th className="px-8 py-4">Event</th>
                    <th className="px-8 py-4">Date</th>
                    <th className="px-8 py-4">Program Time</th>
                    <th className="px-8 py-4">Charges</th>
                    <th className="px-8 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-8 py-12 text-center">
                        <div className="flex justify-center items-center gap-2 text-blue-600">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="font-bold">Loading bookings...</span>
                        </div>
                      </td>
                    </tr>
                  ) : bookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-8 py-12 text-center text-gray-400 font-bold">
                        No bookings found.
                      </td>
                    </tr>
                  ) : (
                    bookings.map((b) => (
                      <tr key={b.id || b.booking_id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-8 py-6 font-black text-blue-600">
                          {b.booking_id || b.id?.slice(0, 8) || 'PENDING'}
                        </td>
                        <td className="px-8 py-6">
                          <p className="font-bold text-gray-800">{b.amenity_name}</p>
                          <p className="text-[10px] text-gray-400 font-black uppercase">{b.amenity_type}</p>
                        </td>
                        <td className="px-8 py-6 font-medium text-gray-700">{b.event_name}</td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-gray-800 font-bold">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            {b.booking_date}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-2 text-xs text-gray-600 font-bold">
                            <Clock className="w-3 h-3" />
                            {b.time_slot || `${b.start_time} - ${b.end_time}`}
                          </div>
                        </td>
                        <td className="px-8 py-6 font-black text-gray-800">₹{b.charges}</td>
                        <td className="px-8 py-6">
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1.5 w-fit ${
                            b.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : 
                            b.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {b.status === 'Approved' && <CheckCircle2 className="w-3 h-3" />}
                            {b.status === 'Pending' && <Clock className="w-3 h-3" />}
                            {b.status === 'Rejected' && <AlertCircle className="w-3 h-3" />}
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
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-2xl shadow-sm border border-blue-50 overflow-hidden">
            <div className="p-8 border-b border-blue-50">
              <h3 className="text-xl font-black text-gray-800">Booking Rules</h3>
            </div>
            <div className="p-8 space-y-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs shrink-0">1</div>
                <p className="text-sm text-gray-600 font-medium">Booking must be done at least 1 day before event</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs shrink-0">2</div>
                <p className="text-sm text-gray-600 font-medium">Maximum booking time is 8 hours</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs shrink-0">3</div>
                <p className="text-sm text-gray-600 font-medium">Extra charges apply after base hours</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs shrink-0">4</div>
                <p className="text-sm text-gray-600 font-medium">Admin approval is required</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
