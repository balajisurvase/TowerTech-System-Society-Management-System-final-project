import { supabase } from './supabase';
import { Resident, MaintenanceRecord, Complaint, Booking, Society, Admin, Amenity } from '../types';
import { initialAmenities } from '../data';

export const societyService = {
  async getResidents() {
    const { data, error } = await supabase
      .from('resident')
      .select('*')
      .order('resident_id', { ascending: true });
    
    if (error) throw error;
    return data as Resident[];
  },

  async createSocietyAccount(societyData: Omit<Society, 'society_id'>, adminPassword: string) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const society_id = `SOC2026${randomDigits}`;

    const { data: society, error: societyError } = await supabase
      .from('society')
      .insert([{ ...societyData, society_id }])
      .select()
      .single();

    if (societyError) throw societyError;

    const { data: admin, error: adminError } = await supabase
      .from('admin')
      .insert([{
        admin_id: `A001`,
        name: `Admin - ${societyData.name}`,
        email: societyData.admin_email,
        phone: societyData.phone,
        password: adminPassword,
        society_id: society_id,
        role: 'admin'
      }])
      .select()
      .single();

    if (adminError) throw adminError;

    return { society, admin };
  },

  async getResidentMaintenance(resident_id: string) {
    const { data, error } = await supabase
      .from('maintenance')
      .select('*')
      .eq('resident_id', resident_id)
      .order('due_date', { ascending: false });
    
    if (error) throw error;
    return data as MaintenanceRecord[];
  },

  async getMaintenance() {
    const { data, error } = await supabase
      .from('maintenance')
      .select('*')
      .order('due_date', { ascending: false });
    
    if (error) throw error;
    return data as MaintenanceRecord[];
  },

  async updateMaintenanceStatus(id: string, status: 'Paid' | 'Unpaid') {
    const updates: any = { status };
    if (status === 'Paid') {
      updates.payment_date = new Date().toISOString();
    } else {
      updates.payment_date = null;
    }

    const { data, error } = await supabase
      .from('maintenance')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as MaintenanceRecord;
  },

  async createMaintenanceBill(bill: Omit<MaintenanceRecord, 'id' | 'maintenance_id'>) {
    const { data: existing } = await supabase
      .from('maintenance')
      .select('id')
      .eq('flat_no', bill.flat_no)
      .eq('month', bill.month)
      .maybeSingle();

    if (existing) {
      throw new Error(`Maintenance bill already generated for flat ${bill.flat_no} in ${bill.month}`);
    }

    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const maintenance_id = `M-${timestamp}${random}`;

    const { data, error } = await supabase
      .from('maintenance')
      .insert([{ ...bill, maintenance_id }])
      .select()
      .single();
    
    if (error) throw error;
    return data as MaintenanceRecord;
  },

  async getAmenities(society_id: string) {
    const { data, error } = await supabase
      .from('amenity')
      .select('*')
      .eq('society_id', society_id)
      .order('name', { ascending: true });
    
    if (error) throw error;
    if (!data || data.length === 0) {
      return initialAmenities.filter(a => a.society_id === society_id);
    }
    return data as Amenity[];
  },

  async updateAmenity(id: string, updates: Partial<Amenity>) {
    const { data, error } = await supabase
      .from('amenity')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Amenity;
  },

  async deleteAmenity(id: string) {
    const { error } = await supabase
      .from('amenity')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  },

  async addAmenity(amenity: Omit<Amenity, 'id' | 'amenity_id'>) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const amenity_id = `AM-${timestamp}${random}`;

    const { data, error } = await supabase
      .from('amenity')
      .insert([{ ...amenity, amenity_id }])
      .select()
      .single();
    
    if (error) throw error;
    return data as Amenity;
  },

  async getResidentComplaints(resident_id: string) {
    const { data, error } = await supabase
      .from('complaint')
      .select('*')
      .eq('resident_id', resident_id)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data as Complaint[];
  },

  async getComplaints() {
    const { data, error } = await supabase
      .from('complaint')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data as Complaint[];
  },

  async addComplaint(complaint: Omit<Complaint, 'id'>) {
    if (!complaint.complaint_id) {
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      complaint.complaint_id = `C-${timestamp}${random}`;
    }

    const { data, error } = await supabase
      .from('complaint')
      .insert([complaint])
      .select()
      .single();
    
    if (error) throw error;
    return data as Complaint;
  },

  async updateComplaintStatus(id: string, status: Complaint['status']) {
    const { data, error } = await supabase
      .from('complaint')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Complaint;
  },

  async getBookings() {
    const { data, error } = await supabase
      .from('booking')
      .select('*')
      .order('booking_date', { ascending: false });
    
    if (error) throw error;
    return data as Booking[];
  },

  async getResidentBookings(resident_id: string) {
    const { data, error } = await supabase
      .from('booking')
      .select('*')
      .eq('resident_id', resident_id)
      .order('booking_date', { ascending: false });
    
    if (error) throw error;
    return data as Booking[];
  },

  async addBooking(booking: Omit<Booking, 'id' | 'booking_id'>) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const booking_id = `B2026${randomDigits}`;

    const { data, error } = await supabase
      .from('booking')
      .insert([{ ...booking, booking_id }])
      .select()
      .single();
    
    if (error) throw error;
    return data as Booking;
  },

  async updateBookingStatus(id: string, status: Booking['status']) {
    const { data, error } = await supabase
      .from('booking')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Booking;
  },

  async updateBooking(id: string, updates: Partial<Booking>) {
    const { data, error } = await supabase
      .from('booking')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Booking;
  },

  async uploadMedia(file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `complaints/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  async seedDatabase(initialResidents: Resident[], initialAdmins: any[], initialMaintenance: MaintenanceRecord[], initialComplaints: Complaint[], initialBookings: Booking[], initialAmenities: Amenity[]) {
    try {
      await supabase.from('resident').upsert(initialResidents);
      await supabase.from('admin').upsert(initialAdmins);
      await supabase.from('maintenance').upsert(initialMaintenance);
      await supabase.from('complaint').upsert(initialComplaints);
      await supabase.from('booking').upsert(initialBookings);
      await supabase.from('amenity').upsert(initialAmenities);
      return { success: true };
    } catch (error) {
      console.error('Seeding error:', error);
      throw error;
    }
  },

  async login(role: 'admin' | 'resident', loginId: string, password: string, societyId: string) {
    const table = role === 'admin' ? 'admin' : 'resident';
    const idField = role === 'admin' ? 'admin_id' : 'resident_id';

    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq(idField, loginId)
      .eq('password', password)
      .eq('society_id', societyId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      // Fallback for older data without society_id
      const { data: retryData, error: retryError } = await supabase
        .from(table)
        .select('*')
        .eq(idField, loginId)
        .eq('password', password)
        .maybeSingle();
      
      if (retryError) throw retryError;
      if (!retryData) {
        throw new Error(`Invalid ${role === 'admin' ? 'Administrator' : 'Resident'} ID or Password`);
      }
      return retryData;
    }
    return data;
  },

  async resetPassword(email: string) {
    const { data: admin } = await supabase
      .from('admin')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    const { data: resident } = await supabase
      .from('resident')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (!admin && !resident) {
      throw new Error('No account found with this email address.');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return { success: true };
  }
};
