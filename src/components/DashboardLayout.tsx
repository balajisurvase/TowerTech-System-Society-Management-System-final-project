import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  MessageSquare, 
  Calendar, 
  LogOut, 
  Menu, 
  X, 
  User as UserIcon,
  Bell,
  Search,
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight,
  PieChart,
  FileText
} from 'lucide-react';
import { User } from '../types';

interface DashboardLayoutProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function DashboardLayout({ 
  user, 
  activeTab, 
  setActiveTab, 
  onLogout, 
  children 
}: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'residents', label: 'Residents', icon: Users },
    { id: 'maintenance', label: 'Maintenance', icon: CreditCard },
    { id: 'complaints', label: 'Complaints', icon: MessageSquare },
    { id: 'bookings', label: 'Amenity Booking', icon: Calendar },
  ];

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className="min-h-screen bg-background flex font-sans text-slate-900">
      {/* Sidebar - Desktop */}
      <aside 
        style={{ width: isSidebarCollapsed ? '80px' : '280px' }}
        className="hidden lg:flex flex-col bg-sidebar text-white h-screen sticky top-0 z-50 shadow-2xl overflow-hidden transition-all duration-300"
      >
        {/* Sidebar Header */}
        <div className="p-6 flex items-center gap-4 border-b border-white/5">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          {!isSidebarCollapsed && (
            <div className="whitespace-nowrap">
              <h1 className="text-lg font-black tracking-tight">TowerTech</h1>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Society Management</p>
            </div>
          )}
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 p-3.5 rounded-xl transition-all relative group ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
                )}
                <item.icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-primary' : ''}`} />
                {!isSidebarCollapsed && (
                  <span className="font-bold text-sm whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-4 p-3.5 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all group"
          >
            <LogOut className="w-5 h-5 shrink-0 group-hover:-translate-x-1 transition-transform" />
            {!isSidebarCollapsed && (
              <span className="font-bold text-sm whitespace-nowrap">
                Logout
              </span>
            )}
          </button>
        </div>

        {/* Collapse Toggle Button */}
        <button 
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary-dark transition-colors z-[60]"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 md:px-10 sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden md:flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">
                {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-900 leading-none">{user.admin_name || user.name || 'Admin'}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">
                  {user.role} {user.role === 'admin' && `• ${user.admin_id || user.resident_id}`}
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-lg shadow-primary/20 flex items-center justify-center text-white font-black text-lg overflow-hidden border-2 border-white">
                {(user.admin_name || user.name || 'A').charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 bg-background p-6 md:p-10">
          <div key={activeTab}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <>
          <div
            onClick={toggleMobileMenu}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] lg:hidden"
          />
          <aside
            className="fixed top-0 left-0 bottom-0 w-72 bg-sidebar text-white z-[101] lg:hidden flex flex-col shadow-2xl"
          >
            <div className="p-6 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight">TowerTech</h1>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Society Management</p>
                </div>
              </div>
              <button onClick={toggleMobileMenu} className="p-2 text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                    activeTab === item.id 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-bold text-sm">{item.label}</span>
                </button>
              ))}
            </nav>
            <div className="p-6 border-t border-white/5">
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-4 p-4 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-bold text-sm">Logout</span>
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
