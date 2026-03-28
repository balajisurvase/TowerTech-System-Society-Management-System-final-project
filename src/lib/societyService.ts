import { supabase } from './supabase';
import { Resident, MaintenanceRecord, Complaint, Booking, Society, Admin, Amenity } from '../types';
import { initialAmenities } from '../data';

// Helper to generate a UUID if needed
const generateUUID = () => {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
};

export const societyService = {
  async getResidents() {
    const { data, error } = await supabase
      .from('resident')
      .select('*')
      .order('resident_id', { ascending: true });
    
    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return [] as Resident[];
      }
      console.error('Error fetching residents:', error);
      throw error;
    }
    return data as Resident[];
  },

  async createSocietyAccount(societyData: Omit<Society, 'society_id'>, adminPassword: string) {
    // 1. Generate Society ID: SOC2026XXXX
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const society_id = `SOC2026${randomDigits}`;

    let society = { ...societyData, society_id };

    // 2. Try to insert into society table, but don't fail if it doesn't exist
    try {
      const { data: societyResult, error: societyError } = await supabase
        .from('society')
        .insert([{ ...societyData, society_id }])
        .select()
        .single();
      
      if (!societyError && societyResult) {
        society = societyResult;
      }
    } catch (err) {
      console.warn('Society table might be missing, skipping society record creation:', err);
    }

    // 3. Create first admin account in admin table
    const adminData = {
      admin_id: `A001`,
      name: `Admin - ${societyData.name}`,
      email: societyData.admin_email,
      phone: societyData.phone,
      password: adminPassword,
      society_id: society_id,
      role: 'admin'
    };

    const { data: admin, error: adminError } = await supabase
      .from('admin')
      .insert([adminData])
      .select()
      .single();

    if (adminError) {
      console.error('Admin creation error:', adminError);
      throw adminError;
    }

    return { society, admin };
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return { success: true };
  },

  async getResidentMaintenance(resident_id: string) {
    const { data, error } = await supabase
      .from('maintenance')
      .select('*')
      .eq('resident_id', resident_id)
      .order('due_date', { ascending: false });
    
    if (error) {
      // Fallback: if column doesn't exist, try to fetch all and filter in memory
      if (error.code === '42703' || error.message?.includes('resident_id')) {
        const { data: allData, error: allErr } = await supabase.from('maintenance').select('*');
        if (allErr) return [] as MaintenanceRecord[];
        return (allData || []).filter((m: any) => m.resident_id === resident_id) as MaintenanceRecord[];
      }
      console.error('Error fetching resident maintenance:', error);
      return [] as MaintenanceRecord[];
    }
    return data as MaintenanceRecord[];
  },

  async getMaintenance() {
    const { data, error } = await supabase
      .from('maintenance')
      .select('*')
      .order('due_date', { ascending: false });
    
    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return [] as MaintenanceRecord[];
      }
      console.error('Error fetching maintenance:', error);
      throw error;
    }
    return data as MaintenanceRecord[];
  },

  async updateMaintenanceStatus(maintenance_id: string, status: 'Paid' | 'Unpaid') {
    const { data, error } = await supabase
      .from('maintenance')
      .update({ status })
      .eq('maintenance_id', maintenance_id)
      .select()
      .single();
    
    if (error) throw error;
    return data as MaintenanceRecord;
  },

  async createMaintenanceBill(bill: Omit<MaintenanceRecord, 'id' | 'maintenance_id'>) {
    // Check for duplicate bill for the same flat and month
    const { data: existingBill, error: checkError } = await supabase
      .from('maintenance')
      .select('maintenance_id')
      .eq('flat_no', bill.flat_no)
      .eq('month', bill.month)
      .maybeSingle();

    if (checkError && checkError.code !== '42703') throw checkError;
    if (existingBill) {
      throw new Error(`Maintenance bill already generated for flat ${bill.flat_no} in ${bill.month}`);
    }

    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const maintenance_id = `M-${timestamp}${random}`;

    const billWithId = { 
      ...bill, 
      id: generateUUID(), // Proactively provide an ID to avoid NOT NULL constraint errors
      maintenance_id,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('maintenance')
      .insert([billWithId])
      .select()
      .single();
    
    if (error) {
      // If columns are missing or NOT NULL constraint violated, try to insert without them
      if (error.code === '42703' || error.code === 'PGRST204' || error.code === '23502' || error.message?.includes('column') || error.message?.includes('null value')) {
        // Strip out fields that are often missing in simpler schemas, 
        // but KEEP mandatory ones like resident_id if possible
        const { 
          generated_by, 
          admin_id, 
          ...minimalBill 
        } = bill as any;
        
        const { data: retryData, error: retryError } = await supabase
          .from('maintenance')
          .insert([{ ...minimalBill, id: generateUUID(), maintenance_id }])
          .select()
          .single();
        
        if (retryError) {
          console.error('Error creating maintenance bill after retry:', retryError);
          // If still failing, try even more minimal (just the basics)
          if (retryError.code === '42703' || retryError.code === 'PGRST204' || retryError.code === '23502' || retryError.message?.includes('column') || retryError.message?.includes('null value')) {
            const superMinimalBill = {
              id: generateUUID(),
              maintenance_id,
              resident_id: bill.resident_id,
              resident_name: bill.resident_name,
              flat_no: bill.flat_no,
              month: bill.month,
              amount: bill.amount,
              status: bill.status,
              due_date: bill.due_date,
              society_id: bill.society_id
            };
            const { data: finalData, error: finalError } = await supabase
              .from('maintenance')
              .insert([superMinimalBill])
              .select()
              .single();
            
            if (finalError) throw finalError;
            return finalData as MaintenanceRecord;
          }
          throw retryError;
        }
        return retryData as MaintenanceRecord;
      }
      console.error('Error creating maintenance bill:', error);
      throw error;
    }
    return data as MaintenanceRecord;
  },

  async getAmenities(society_id: string) {
    let query = supabase.from('amenities').select('*');
    
    // Try with society_id filter first
    const { data, error } = await query.eq('society_id', society_id).order('name', { ascending: true });
    
    if (error) {
      // If society_id column is missing (42703) or table missing (42P01/PGRST205)
      if (error.code === '42703' || error.message?.includes('society_id')) {
        const { data: allData, error: allErr } = await supabase.from('amenities').select('*').order('name', { ascending: true });
        if (allErr || !allData || allData.length === 0) return initialAmenities.filter(a => a.society_id === society_id);
        return allData as Amenity[];
      }
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return initialAmenities.filter(a => a.society_id === society_id);
      }
      console.error('Error fetching amenities:', error);
      throw error;
    }
    if (!data || data.length === 0) return initialAmenities.filter(a => a.society_id === society_id);
    return data as Amenity[];
  },

  async updateAmenity(amenity_id: string, updates: Partial<Amenity>) {
    const { data, error } = await supabase
      .from('amenities')
      .update(updates)
      .eq('amenity_id', amenity_id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Amenity;
  },

  async deleteAmenity(amenity_id: string) {
    const { error } = await supabase
      .from('amenities')
      .delete()
      .eq('amenity_id', amenity_id);
    
    if (error) throw error;
    return { success: true };
  },

  async addAmenity(amenity: Omit<Amenity, 'id' | 'amenity_id'>) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const amenity_id = `AM-${timestamp}${random}`;

    const { data, error } = await supabase
      .from('amenities')
      .insert([{ ...amenity, amenity_id }])
      .select()
      .single();
    
    if (error) {
      // If society_id column is missing, try without it
      if (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('society_id')) {
        const { society_id, ...amenityWithoutSociety } = amenity as any;
        const { data: retryData, error: retryError } = await supabase
          .from('amenities')
          .insert([{ ...amenityWithoutSociety, amenity_id }])
          .select()
          .single();
        if (retryError) throw retryError;
        return retryData as Amenity;
      }
      throw error;
    }
    return data as Amenity;
  },

  async getResidentComplaints(resident_id: string) {
    const { data, error } = await supabase
      .from('complaint')
      .select('*')
      .eq('resident_id', resident_id)
      .order('date', { ascending: false });
    
    if (error) {
      // Fallback: if resident_id column is missing, try to fetch all and filter in memory
      if (error.code === '42703' || error.message?.includes('resident_id')) {
        const { data: allData, error: allErr } = await supabase.from('complaint').select('*');
        if (allErr) return [] as Complaint[];
        return (allData || []).filter((c: any) => c.resident_id === resident_id) as Complaint[];
      }
      // If table is missing, return empty array
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return [] as Complaint[];
      }
      console.error('Error fetching resident complaints:', error);
      return [] as Complaint[];
    }
    return data as Complaint[];
  },

  async getComplaints() {
    const { data, error } = await supabase
      .from('complaint')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return [] as Complaint[];
      }
      console.error('Error fetching complaints:', error);
      throw error;
    }
    return data as Complaint[];
  },

  async addComplaint(complaint: Omit<Complaint, 'id'>) {
    // Generate a complaint_id if not provided
    if (!complaint.complaint_id) {
      try {
        const { count, error: countError } = await supabase
          .from('complaint')
          .select('*', { count: 'exact', head: true });
        
        const nextNumber = (count || 0) + 11; // Start from C011 if count is 0
        complaint.complaint_id = `C${nextNumber.toString().padStart(3, '0')}`;
      } catch (e) {
        const timestamp = Date.now().toString().slice(-6);
        complaint.complaint_id = `C-${timestamp}`;
      }
    }

    const { data, error } = await supabase
      .from('complaint')
      .insert([complaint])
      .select()
      .single();
    
    if (error) {
      // If society_id column is missing, try without it
      if (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('society_id') || error.message?.includes('column')) {
        const { society_id, ...complaintWithoutSociety } = complaint as any;
        const { data: retryData, error: retryError } = await supabase
          .from('complaint')
          .insert([complaintWithoutSociety])
          .select()
          .single();
        
        if (retryError) {
          console.error('Error submitting complaint after retry:', retryError);
          // Try super minimal
          if (retryError.code === '42703' || retryError.code === 'PGRST204' || retryError.message?.includes('column')) {
            const superMinimalComplaint = {
              complaint_id: complaint.complaint_id,
              category: complaint.category,
              description: complaint.description,
              date: complaint.date,
              status: complaint.status
            };
            const { data: finalData, error: finalError } = await supabase
              .from('complaint')
              .insert([superMinimalComplaint])
              .select()
              .single();
            if (finalError) throw finalError;
            return finalData as Complaint;
          }
          throw retryError;
        }
        return retryData as Complaint;
      }
      console.error('Error submitting complaint:', error);
      throw error;
    }
    return data as Complaint;
  },

  async updateComplaintStatus(complaint_id: string, status: Complaint['status']) {
    const { data, error } = await supabase
      .from('complaint')
      .update({ status })
      .eq('complaint_id', complaint_id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Complaint;
  },

  async getBookings() {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('booking_date', { ascending: false });
    
    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return [] as Booking[];
      }
      console.error('Error fetching bookings:', error);
      return [] as Booking[];
    }
    return data as Booking[];
  },

  async getResidentBookings(resident_id: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('resident_id', resident_id)
      .order('booking_date', { ascending: false });
    
    if (error) {
      // Fallback: if resident_id column is missing, try to fetch all and filter in memory
      if (error.code === '42703' || error.message?.includes('resident_id')) {
        const { data: allData, error: allErr } = await supabase.from('bookings').select('*');
        if (allErr) return [] as Booking[];
        return (allData || []).filter((b: any) => b.resident_id === resident_id) as Booking[];
      }
      // If table is missing, return empty array
      if (error.code === '42P01' || error.code === 'PGRST205') {
        return [] as Booking[];
      }
      console.error('Error fetching resident bookings:', error);
      return [] as Booking[];
    }
    return data as Booking[];
  },

  async addBooking(booking: Omit<Booking, 'id' | 'booking_id'>) {
    // Generate a unique booking ID: B004, B005...
    let booking_id = '';
    try {
      const { count, error: countError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });
      
      const nextNumber = (count || 0) + 4; // Start from B004 if count is 0
      booking_id = `B${nextNumber.toString().padStart(3, '0')}`;
    } catch (e) {
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      booking_id = `B2026${randomDigits}`;
    }

    const bookingWithId = { 
      ...booking, 
      id: generateUUID(), // Proactively provide an ID
      booking_id,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingWithId])
      .select()
      .single();
    
    if (error) {
      console.error('Error adding booking:', error);
      // If society_id or other columns are missing, or NOT NULL constraint violated, try to insert with minimal fields
      if (error.code === '42703' || error.code === 'PGRST204' || error.code === '23502' || error.message?.includes('society_id') || error.message?.includes('column') || error.message?.includes('null value')) {
        // Create a minimal version of the booking, but KEEP mandatory fields
        const minimalBooking: any = {
          id: generateUUID(),
          booking_id,
          resident_id: booking.resident_id,
          name: booking.name,
          tower: booking.tower,
          flat: booking.flat,
          amenity_name: booking.amenity_name,
          event_name: booking.event_name,
          booking_date: booking.booking_date,
          start_time: booking.start_time,
          end_time: booking.end_time,
          status: booking.status,
          charges: booking.charges,
          society_id: booking.society_id
        };

        const { data: retryData, error: retryError } = await supabase
          .from('bookings')
          .insert([minimalBooking])
          .select()
          .single();
        
        if (retryError) {
          console.error('Retry booking failed:', retryError);
          // Try super minimal - only if absolutely necessary, but still keep mandatory fields
          if (retryError.code === '42703' || retryError.code === 'PGRST204' || retryError.code === '23502' || retryError.message?.includes('column') || retryError.message?.includes('null value')) {
            const superMinimalBooking = {
              id: generateUUID(),
              booking_id,
              resident_id: booking.resident_id,
              name: booking.name,
              amenity_name: booking.amenity_name,
              event_name: booking.event_name,
              booking_date: booking.booking_date,
              status: booking.status,
              society_id: booking.society_id
            };
            const { data: finalData, error: finalError } = await supabase
              .from('bookings')
              .insert([superMinimalBooking])
              .select()
              .single();
            if (finalError) throw finalError;
            return finalData as Booking;
          }
          throw retryError;
        }
        return retryData as Booking;
      }
      throw error;
    }
    return data as Booking;
  },

  async updateBookingStatus(booking_id: string, status: Booking['status']) {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('booking_id', booking_id)
      .select()
      .single();
    
    if (error) {
      // Fallback: if booking_id column is missing, try to update by id if possible
      if (error.code === '42703' || error.message?.includes('booking_id')) {
        const { data: retryData, error: retryError } = await supabase
          .from('bookings')
          .update({ status })
          .eq('id', booking_id)
          .select()
          .single();
        if (retryError) throw retryError;
        return retryData as Booking;
      }
      throw error;
    }
    return data as Booking;
  },

  async updateBooking(booking_id: string, updates: Partial<Booking>) {
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('booking_id', booking_id)
      .select()
      .single();
    
    if (error) {
      // Fallback: if booking_id column is missing, try to update by id if possible
      if (error.code === '42703' || error.message?.includes('booking_id')) {
        const { data: retryData, error: retryError } = await supabase
          .from('bookings')
          .update(updates)
          .eq('id', booking_id)
          .select()
          .single();
        if (retryError) throw retryError;
        return retryData as Booking;
      }
      throw error;
    }
    return data as Booking;
  },

  async updateResident(resident_id: string, updates: Partial<Resident>) {
    const { data, error } = await supabase
      .from('resident')
      .update(updates)
      .eq('resident_id', resident_id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Resident;
  },

  async uploadMedia(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `complaints/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      if (uploadError.message?.includes('Bucket not found')) {
        throw new Error('Storage bucket "media" not found. Please create a public bucket named "media" in your Supabase project.');
      }
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  async seedDatabase(initialResidents: Resident[], initialAdmins: any[], initialMaintenance: MaintenanceRecord[], initialComplaints: Complaint[], initialBookings: Booking[], initialAmenities: Amenity[]) {
    // Seed Residents
    const { error: resError } = await supabase.from('resident').upsert(initialResidents);
    if (resError) throw resError;

    // Seed Admins
    const { error: adminError } = await supabase.from('admin').upsert(initialAdmins);
    if (adminError) throw adminError;

    // Seed Maintenance
    const { error: mainError } = await supabase.from('maintenance').upsert(initialMaintenance);
    if (mainError) throw mainError;

    // Seed Complaints
    const { error: compError } = await supabase.from('complaint').upsert(initialComplaints);
    if (compError) throw compError;

    // Seed Bookings
    const { error: bookingError } = await supabase.from('bookings').upsert(initialBookings);
    if (bookingError) throw bookingError;

    // Seed Amenities
    const { error: amenityError } = await supabase.from('amenities').upsert(initialAmenities);
    if (amenityError) throw amenityError;

    return { success: true };
  }
};
