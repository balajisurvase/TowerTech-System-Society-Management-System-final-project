-- SQL Schema for TowerTech-Society Supabase Project

-- 1. Admin Table
CREATE TABLE IF NOT EXISTS admin (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    password TEXT NOT NULL,
    society_id TEXT DEFAULT 'GV2026',
    role TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Resident Table
CREATE TABLE IF NOT EXISTS resident (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resident_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    tower TEXT NOT NULL,
    floor INTEGER,
    flat TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    password TEXT NOT NULL,
    society_id TEXT DEFAULT 'GV2026',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Maintenance Table
CREATE TABLE IF NOT EXISTS maintenance (
    maintenance_id TEXT PRIMARY KEY,
    bill_no TEXT,
    flat_no TEXT,
    tower TEXT,
    month TEXT,
    amount BIGINT,
    status TEXT,
    due_date DATE,
    admin_id TEXT,
    society_id TEXT DEFAULT 'GV2026',
    resident_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Complaint Table
CREATE TABLE IF NOT EXISTS complaint (
    complaint_id TEXT PRIMARY KEY,
    resident_id TEXT,
    flat_no TEXT,
    tower TEXT,
    complaint_date DATE,
    description TEXT,
    status TEXT,
    society_id TEXT DEFAULT 'GV2026',
    admin_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Booking Table
CREATE TABLE IF NOT EXISTS booking (
    booking_id TEXT PRIMARY KEY,
    resident_id TEXT,
    name TEXT,
    tower TEXT,
    flat TEXT,
    amenity_name TEXT,
    amenity_type TEXT,
    event_name TEXT,
    booking_date DATE,
    start_time TIME,
    end_time TIME,
    charges BIGINT,
    status TEXT,
    society_id TEXT DEFAULT 'GV2026',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Amenity Table
CREATE TABLE IF NOT EXISTS amenity (
    amenity_id TEXT PRIMARY KEY,
    name TEXT,
    type TEXT,
    charges BIGINT,
    society_id TEXT DEFAULT 'GV2026',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Security Table
CREATE TABLE IF NOT EXISTS security (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    security_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    password TEXT NOT NULL,
    society_id TEXT DEFAULT 'GV2026',
    role TEXT DEFAULT 'security',
    shift TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE resident ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenity ENABLE ROW LEVEL SECURITY;
ALTER TABLE security ENABLE ROW LEVEL SECURITY;

-- Basic Policies
CREATE POLICY "Allow all on admin" ON admin FOR ALL USING (true);
CREATE POLICY "Allow all on resident" ON resident FOR ALL USING (true);
CREATE POLICY "Allow all on maintenance" ON maintenance FOR ALL USING (true);
CREATE POLICY "Allow all on complaint" ON complaint FOR ALL USING (true);
CREATE POLICY "Allow all on booking" ON booking FOR ALL USING (true);
CREATE POLICY "Allow all on amenity" ON amenity FOR ALL USING (true);
CREATE POLICY "Allow all on security" ON security FOR ALL USING (true);
