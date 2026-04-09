import { supabase, supabaseUrl } from './supabase';
import { Resident, MaintenanceRecord, Complaint, Booking, Society, Admin, Amenity, Media } from '../types';
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
        .select();
      
      if (!societyError && societyResult && societyResult.length > 0) {
        society = societyResult[0];
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
      .select();

    if (adminError) {
      console.error('Admin creation error:', adminError);
      throw adminError;
    }

    return { society, admin: admin ? admin[0] : null };
  },

  async updateAdminProfile(society_id: string, admin_id: string, updates: Partial<Admin>) {
    const { data, error } = await supabase
      .from('admin')
      .update(updates)
      .eq('society_id', society_id)
      .eq('admin_id', admin_id)
      .select();
    
    if (error) throw error;
    return data && data.length > 0 ? data[0] as Admin : null;
  },

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return { success: true };
  },

  async getResidentMaintenance(resident_id: string, society_id?: string) {
    let query = supabase
      .from('maintenance')
      .select('*')
      .eq('resident_id', resident_id);
    
    if (society_id) {
      query = query.eq('society_id', society_id);
    }

    const { data, error } = await query.order('due_date', { ascending: false });
    
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
      .select();
    
    if (error) throw error;
    return data && data.length > 0 ? data[0] as MaintenanceRecord : null;
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
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
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
      .select();
    
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
          .select();
        
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
              .select();
            
            if (finalError) throw finalError;
            return finalData[0] as MaintenanceRecord;
          }
          throw retryError;
        }
        return retryData[0] as MaintenanceRecord;
      }
      console.error('Error creating maintenance bill:', error);
      throw error;
    }
    return data[0] as MaintenanceRecord;
  },

  async createBulkMaintenanceBills(bills: Omit<MaintenanceRecord, 'id' | 'maintenance_id'>[]) {
    if (bills.length === 0) return [];

    const billsWithIds = bills.map((bill, index) => {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.random().toString(36).substring(2, 5).toUpperCase();
      const maintenance_id = `M-${timestamp}${random}${index.toString().padStart(2, '0')}`;
      
      return {
        ...bill,
        id: generateUUID(),
        maintenance_id,
        created_at: new Date().toISOString()
      };
    });

    const { data, error } = await supabase
      .from('maintenance')
      .insert(billsWithIds)
      .select();

    if (error) {
      console.error('Error creating bulk maintenance bills:', error);
      // If bulk insert fails, we could try one by one or just throw
      // For now, let's throw so the UI can handle it
      throw error;
    }

    return data as MaintenanceRecord[];
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
      .select();
    
    if (error) throw error;
    return data && data.length > 0 ? data[0] as Amenity : null;
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
      .select();
    
    if (error) {
      // If society_id column is missing, try without it
      if (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('society_id')) {
        const { society_id, ...amenityWithoutSociety } = amenity as any;
        const { data: retryData, error: retryError } = await supabase
          .from('amenities')
          .insert([{ ...amenityWithoutSociety, amenity_id }])
          .select();
        if (retryError) throw retryError;
        return retryData && retryData.length > 0 ? retryData[0] as Amenity : null;
      }
      throw error;
    }
    return data && data.length > 0 ? data[0] as Amenity : null;
  },

  async getResidentComplaints(resident_id: string, society_id?: string) {
    let query = supabase
      .from('complaint')
      .select('*')
      .eq('resident_id', resident_id);
    
    if (society_id) {
      query = query.eq('society_id', society_id);
    }

    const { data, error } = await query.order('date', { ascending: false });
    
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

  async addComplaint(complaintData: Omit<Complaint, 'id' | 'complaint_id'>) {
    // Generate a unique complaint ID: C011, C012...
    let complaint_id = '';
    try {
      const { count } = await supabase
        .from('complaint')
        .select('*', { count: 'exact', head: true });
      
      const nextNumber = (count || 0) + 1; // Start from C001 if count is 0
      complaint_id = `C${nextNumber.toString().padStart(3, '0')}`;
    } catch (e) {
      const timestamp = Date.now().toString().slice(-6);
      complaint_id = `C-${timestamp}`;
    }

    const complaint = { ...complaintData, complaint_id };

    const { data, error } = await supabase
      .from('complaint')
      .insert([complaint])
      .select();
    
    if (error) {
      // If society_id column is missing, try without it
      if (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('society_id') || error.message?.includes('column')) {
        const { society_id, ...complaintWithoutSociety } = complaint as any;
        const { data: retryData, error: retryError } = await supabase
          .from('complaint')
          .insert([complaintWithoutSociety])
          .select();
        
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
              .select();
            if (finalError) throw finalError;
            
            // If media is present, try to save to media table
            if (complaint.media || complaint.media_url) {
              await this.saveMedia({
                complaint_id: complaint.complaint_id,
                file_url: complaint.media || complaint.media_url || '',
                uploaded_by: complaint.resident_id,
                society_id: complaint.society_id
              }).catch(err => console.warn('Failed to save to media table:', err));
            }
            
            return finalData && finalData.length > 0 ? finalData[0] as Complaint : null;
          }
          throw retryError;
        }
        
        // If media is present, try to save to media table
        if (complaint.media || complaint.media_url) {
          await this.saveMedia({
            complaint_id: complaint.complaint_id,
            file_url: complaint.media || complaint.media_url || '',
            uploaded_by: complaint.resident_id,
            society_id: complaint.society_id
          }).catch(err => console.warn('Failed to save to media table:', err));
        }
        
        return retryData && retryData.length > 0 ? retryData[0] as Complaint : null;
      }
      console.error('Error submitting complaint:', error);
      throw error;
    }
    
    // If media is present, try to save to media table
    if (complaint.media || complaint.media_url) {
      await this.saveMedia({
        complaint_id: complaint.complaint_id,
        file_url: complaint.media || complaint.media_url || '',
        uploaded_by: complaint.resident_id,
        society_id: complaint.society_id
      }).catch(err => console.warn('Failed to save to media table:', err));
    }
    
    return data && data.length > 0 ? data[0] as Complaint : null;
  },

  async saveMedia(mediaData: Omit<Media, 'id' | 'media_id'>) {
    const media_id = `M-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const { data, error } = await supabase
      .from('media')
      .insert([{ ...mediaData, media_id }])
      .select();
    
    if (error) {
      console.error('Error saving media record:', error);
      throw error;
    }
    return data && data.length > 0 ? data[0] as Media : null;
  },

  async updateComplaintStatus(complaint_id: string, status: Complaint['status'], comment?: string) {
    const updates: any = { status };
    if (comment) {
      updates.admin_comment = comment;
    }
    const { data, error } = await supabase
      .from('complaint')
      .update(updates)
      .eq('complaint_id', complaint_id)
      .select();
    
    if (error) throw error;
    return data && data.length > 0 ? data[0] as Complaint : null;
  },

  async getBookings() {
    const { data, error } = await supabase
      .from('booking')
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

  async getResidentBookings(resident_id: string, society_id?: string) {
    let query = supabase
      .from('booking')
      .select('*')
      .eq('resident_id', resident_id);
    
    if (society_id) {
      query = query.eq('society_id', society_id);
    }

    const { data, error } = await query.order('booking_date', { ascending: false });
    
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
        .from('booking')
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
      .from('booking')
      .insert([bookingWithId])
      .select();
    
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
          .from('booking')
          .insert([minimalBooking])
          .select();
        
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
              .from('booking')
              .insert([superMinimalBooking])
              .select();
            if (finalError) throw finalError;
            return finalData && finalData.length > 0 ? finalData[0] as Booking : null;
          }
          throw retryError;
        }
        return retryData && retryData.length > 0 ? retryData[0] as Booking : null;
      }
      throw error;
    }
    return data && data.length > 0 ? data[0] as Booking : null;
  },

  async updateBookingStatus(booking_id: string, status: Booking['status'], comment?: string) {
    const updates: any = { status };
    if (comment) {
      updates.admin_comment = comment;
    }
    const { data, error } = await supabase
      .from('booking')
      .update(updates)
      .eq('booking_id', booking_id)
      .select();
    
    if (error) {
      // Fallback: if booking_id column is missing, try to update by id if possible
      if (error.code === '42703' || error.message?.includes('booking_id')) {
        const { data: retryData, error: retryError } = await supabase
          .from('booking')
          .update(updates)
          .eq('id', booking_id)
          .select();
        if (retryError) throw retryError;
        return retryData && retryData.length > 0 ? retryData[0] as Booking : null;
      }
      throw error;
    }
    return data && data.length > 0 ? data[0] as Booking : null;
  },

  async updateBooking(booking_id: string, updates: Partial<Booking>) {
    const { data, error } = await supabase
      .from('booking')
      .update(updates)
      .eq('booking_id', booking_id)
      .select();
    
    if (error) {
      // Fallback: if booking_id column is missing, try to update by id if possible
      if (error.code === '42703' || error.message?.includes('booking_id')) {
        const { data: retryData, error: retryError } = await supabase
          .from('booking')
          .update(updates)
          .eq('id', booking_id)
          .select();
        if (retryError) throw retryError;
        return retryData && retryData.length > 0 ? retryData[0] as Booking : null;
      }
      throw error;
    }
    return data && data.length > 0 ? data[0] as Booking : null;
  },

  async updateResident(resident_id: string, updates: Partial<Resident>) {
    const { data, error } = await supabase
      .from('resident')
      .update(updates)
      .eq('resident_id', resident_id)
      .select();
    
    if (error) throw error;
    return data && data.length > 0 ? data[0] as Resident : null;
  },

  async addResident(resident: Omit<Resident, 'id'>) {
    const { data, error } = await supabase
      .from('resident')
      .insert([resident])
      .select();
    
    if (error) throw error;
    return data && data.length > 0 ? data[0] as Resident : null;
  },

  async deleteMaintenanceRecord(id: string) {
    const { error } = await supabase
      .from('maintenance')
      .delete()
      .or(`maintenance_id.eq.${id},id.eq.${id}`);
    
    if (error) throw error;
    return { success: true };
  },
  
  async deleteComplaint(id: string) {
    const { error } = await supabase
      .from('complaint')
      .delete()
      .or(`complaint_id.eq.${id},id.eq.${id}`);
    
    if (error) throw error;
    return { success: true };
  },

  async deleteBooking(id: string) {
    const { error } = await supabase
      .from('booking')
      .delete()
      .or(`booking_id.eq.${id},id.eq.${id}`);
    
    if (error) throw error;
    return { success: true };
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
    const { error: bookingError } = await supabase.from('booking').upsert(initialBookings);
    if (bookingError) throw bookingError;

    // Seed Amenities
    const { error: amenityError } = await supabase.from('amenities').upsert(initialAmenities);
    if (amenityError) throw amenityError;

    return { success: true };
  }
};
