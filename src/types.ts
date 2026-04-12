export type Role = 'admin' | 'resident' | 'security';

export interface Resident {
  id?: string;
  resident_id: string;
  name: string;
  tower: string;
  floor: number;
  flat: string;
  flat_number?: string;
  email?: string;
  phone: string;
  password?: string;
  society_id: string;
  role?: Role;
  status?: 'Active' | 'Inactive';
}

export interface Security {
  id: string;
  security_id: string;
  name: string;
  phone: string;
  password?: string;
  society_id: string;
  role: 'security';
  shift?: string;
}

export interface MaintenanceRecord {
  id?: string;
  maintenance_id: string;
  bill_no?: string;
  resident_id: string;
  resident_name?: string;
  flat_no: string;
  tower: string;
  month: string;
  amount: number;
  status: string;
  due_date: string;
  society_id: string;
  admin_id?: string;
  payment_date?: string | null;
  generated_by?: string;
  created_at?: string;
}

export interface Complaint {
  id?: string;
  complaint_id: string;
  resident_id: string;
  name?: string;
  tower: string;
  flat_no: string;
  complaint_date: string;
  category?: string;
  complaint_type?: 'Electricity Issue' | 'Water Supply Issue' | 'Lift Issue' | 'Cleanliness Issue' | 'Security Issue';
  description: string;
  date?: string;
  created_at?: string;
  status: string;
  society_id: string;
  admin_id?: string;
  media?: string;
  media_url?: string;
  admin_comment?: string;
}

export interface Booking {
  id?: string;
  booking_id: string;
  resident_id: string;
  name: string;
  tower: string;
  flat: string;
  amenity_name: string;
  amenity_type: string;
  event_name: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  time_slot?: string;
  charges: number;
  status: string;
  society_id: string;
  admin_id?: string;
  admin_comment?: string;
  created_at?: string;
}

export interface Amenity {
  id?: string;
  amenity_id: string;
  name: string;
  type?: string;
  charges: number;
  price?: number;
  society_id: string;
  description?: string;
  base_hours?: number;
  extra_hour_charge?: number;
  facilities?: string;
}

export interface Media {
  id?: string;
  media_id: string;
  complaint_id: string;
  file_url: string;
  uploaded_at?: string;
  uploaded_by: string;
  society_id: string;
}

export interface User {
  id: string;
  name: string;
  admin_name?: string;
  email?: string;
  phone: string;
  role: Role;
  resident_id?: string;
  admin_id?: string;
  society_id: string;
  flat?: string;
  tower?: string;
}

export interface Admin {
  id: string;
  admin_id: string;
  name: string;
  email?: string;
  phone: string;
  password?: string;
  society_id: string;
  role?: string;
}

export interface Society {
  id?: string;
  society_id: string;
  name: string;
  towers: number;
  floors_per_tower: number;
  flats_per_floor: number;
  admin_email: string;
  phone: string;
  created_at?: string;
}
