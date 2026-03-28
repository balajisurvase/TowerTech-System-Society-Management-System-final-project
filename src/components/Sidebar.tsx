import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Bell, 
  MessageSquare, 
  LogOut,
  Building2,
  Calendar
} from 'lucide-react';
import { Role } from '../types';

interface SidebarProps {
  isAdmin: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ isAdmin, activeTab, setActiveTab, onLogout }: SidebarProps) {

  const adminLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'residents', label: 'Residents', icon: Users },
    { id: 'maintenance', label: 'Maintenance', icon: CreditCard },
    { id: 'complaints', label: 'Complaints', icon: MessageSquare },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
  ];

  const residentLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'maintenance', label: 'Maintenance', icon: CreditCard },
    { id: 'complaints', label: 'Complaints', icon: MessageSquare },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
  ];

  const links = isAdmin ? adminLinks : residentLinks;

  return (
    <div className="w-64 bg-white h-screen border-r border-gray-100 flex flex-col">
      <div className="p-8 border-b border-gray-50 flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-100">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-bold text-gray-800 leading-tight">TowerTech</h2>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Society</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2 mt-4">
        {links.map((link) => (
          <button
            key={link.id}
            onClick={() => setActiveTab(link.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === link.id
                ? 'bg-blue-50 text-blue-600 font-bold shadow-sm'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <link.icon className={`w-5 h-5 ${activeTab === link.id ? 'text-blue-600' : 'text-gray-400'}`} />
            <span className="text-sm">{link.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-50">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 transition-all font-bold text-sm"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
