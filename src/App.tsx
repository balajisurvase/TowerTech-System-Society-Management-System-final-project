import React, { useState, useEffect } from 'react';
import { User, Resident, MaintenanceRecord, Complaint, Booking } from './types';
import { initialResidents, initialMaintenance, initialComplaints, initialBookings } from './data';
import { societyService } from './lib/societyService';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import ResidentDashboard from './components/ResidentDashboard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  
  // App State
  const [residents, setResidents] = useState<Resident[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Fetch data from Supabase
  const fetchData = async () => {
    setLoading(true);

    if (!isSupabaseConfigured) {
      setResidents(initialResidents);
      setMaintenance(initialMaintenance);
      setComplaints(initialComplaints);
      setBookings(initialBookings);
      setLoading(false);
      return;
    }

    try {
      const [resData, mainData, compData, bookingData] = await Promise.all([
        societyService.getResidents(),
        societyService.getMaintenance(),
        societyService.getComplaints(),
        societyService.getBookings()
      ]);
      
      const uniqueResidents = Array.from(new Map(resData.map(r => [r.resident_id, r])).values());
      setResidents(uniqueResidents);
      setMaintenance(mainData);
      setComplaints(compData);
      setBookings(bookingData);
    } catch (error) {
      console.error('Error fetching data from Supabase:', error);
      // Fallback to initial data for prototype if Supabase tables are not set up
      setResidents(initialResidents);
      setMaintenance(initialMaintenance);
      setComplaints(initialComplaints);
      setBookings(initialBookings);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time updates with Supabase
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const currentResident = user.resident_id 
    ? residents.find(r => r.resident_id === user.resident_id) 
    : null;

  return (
    <div className="min-h-screen bg-stone-50">
      {!isSupabaseConfigured && (
        <div className="fixed top-0 left-0 right-0 bg-emerald-600 text-white px-4 py-2 text-sm z-[9999] shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span><strong>Prototype Mode:</strong> Supabase is not connected. Using local sample data.</span>
          </div>
          <button 
            onClick={() => alert('To connect Supabase:\n1. Open the "Secrets" panel in AI Studio.\n2. Add VITE_SUPABASE_URL (your project URL).\n3. Add VITE_SUPABASE_ANON_KEY (your anon key).\n4. The app will automatically sync once configured.')}
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-xs font-bold transition-colors"
          >
            Setup Instructions
          </button>
        </div>
      )}
      
      <main className="min-h-screen">
        {user.admin_id ? (
          <AdminDashboard 
            user={user}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            residents={residents}
            maintenance={maintenance}
            complaints={complaints}
            bookings={bookings}
            onRefresh={fetchData}
            onLogout={handleLogout}
          />
        ) : (
          currentResident && (
            <ResidentDashboard 
              activeTab={activeTab}
              resident={currentResident}
              maintenance={maintenance}
              complaints={complaints}
              bookings={bookings}
              onRefresh={fetchData}
              setActiveTab={setActiveTab}
              onLogout={handleLogout}
            />
          )
        )}
      </main>
    </div>
  );
}
