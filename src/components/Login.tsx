import React, { useState } from 'react';
import { LogIn, Building2, Eye, EyeOff, ShieldCheck, Users, X, UserPlus, Lock, Mail } from 'lucide-react';
import { User, Role } from '../types';
import { supabase } from '../lib/supabase';
import { societyService } from '../lib/societyService';
import RegisterSociety from './RegisterSociety';

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [view, setView] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<Role>('resident');
  const [loginId, setLoginId] = useState('');
  const [societyId, setSocietyId] = useState('GV2026');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Theme colors based on role
  const themeColor = role === 'resident' ? 'emerald' : 'indigo';
  const themeHex = role === 'resident' ? '#10b981' : '#4f46e5';
  const themeBg = role === 'resident' ? 'bg-emerald-600' : 'bg-indigo-600';
  const themeHover = role === 'resident' ? 'hover:bg-emerald-700' : 'hover:bg-indigo-700';
  const themeShadow = role === 'resident' ? 'shadow-emerald-100' : 'shadow-indigo-100';
  const themeFocus = role === 'resident' ? 'focus:ring-emerald-500/10 focus:border-emerald-500' : 'focus:ring-indigo-500/10 focus:border-indigo-500';
  const themeText = role === 'resident' ? 'text-emerald-600' : 'text-indigo-600';
  const themeIcon = role === 'resident' ? 'text-emerald-400' : 'text-indigo-400';

  // Forgot Password States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState({ text: '', type: '' });

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage({ text: '', type: '' });

    try {
      await societyService.resetPassword(resetEmail);
      setResetMessage({ text: 'Password reset link sent to your email.', type: 'success' });
      setResetEmail('');
    } catch (err: any) {
      console.error('Reset Error:', err);
      setResetMessage({ text: err.message || 'Failed to send reset link. Please check the email address.', type: 'error' });
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (role === 'admin') {
        const { data: adminData, error: adminError } = await supabase
          .from('admin')
          .select('*')
          .eq('admin_id', loginId)
          .eq('password', password)
          .eq('society_id', societyId)
          .limit(1);

        if (adminError) {
          console.error('Admin Login Error (with society_id):', adminError);
          // Fallback to check without society_id if the column doesn't exist
          const { data: retryData, error: retryError } = await supabase
            .from('admin')
            .select('*')
            .eq('admin_id', loginId)
            .eq('password', password)
            .limit(1);
          
          if (retryError) throw new Error(`Database error: ${retryError.message}`);
          if (!retryData || retryData.length === 0) throw new Error('Invalid Administrator ID or Password');
          
          const data = retryData[0];
          onLogin({
            id: data.id,
            admin_id: data.admin_id,
            name: data.name,
            email: data.email || '',
            phone: data.phone || '',
            role: data.role || 'admin',
            society_id: data.society_id
          });
          return;
        }

        if (!adminData || adminData.length === 0) {
          // Try one more time without society_id just in case
          const { data: retryData } = await supabase
            .from('admin')
            .select('*')
            .eq('admin_id', loginId)
            .eq('password', password)
            .limit(1);
          
          if (retryData && retryData.length > 0) {
            const data = retryData[0];
            onLogin({
              id: data.id,
              admin_id: data.admin_id,
              name: data.name,
              email: data.email || '',
              phone: data.phone || '',
              role: data.role || 'admin',
              society_id: data.society_id
            });
            return;
          }
          throw new Error('Invalid Administrator ID or Password');
        }

        const data = adminData[0];
        onLogin({
          id: data.id,
          admin_id: data.admin_id,
          name: data.name,
          email: data.email || '',
          phone: data.phone || '',
          role: data.role || 'admin',
          society_id: data.society_id
        });
      } else {
        const { data: residentData, error: residentError } = await supabase
          .from('resident')
          .select('*')
          .eq('resident_id', loginId)
          .eq('password', password)
          .eq('society_id', societyId)
          .limit(1);

        if (residentError) {
          console.error('Resident Login Error (with society_id):', residentError);
          // Fallback to check without society_id
          const { data: retryData, error: retryError } = await supabase
            .from('resident')
            .select('*')
            .eq('resident_id', loginId)
            .eq('password', password)
            .limit(1);
          
          if (retryError) throw new Error(`Database error: ${retryError.message}`);
          if (!retryData || retryData.length === 0) throw new Error('Invalid Resident ID or Password');

          const data = retryData[0];
          onLogin({
            id: data.resident_id,
            resident_id: data.resident_id,
            name: data.name,
            email: data.email || '',
            phone: data.phone || '',
            role: data.role || 'resident',
            society_id: data.society_id,
            flat: data.flat,
            tower: data.tower
          });
          return;
        }

        if (!residentData || residentData.length === 0) {
          // Try one more time without society_id
          const { data: retryData } = await supabase
            .from('resident')
            .select('*')
            .eq('resident_id', loginId)
            .eq('password', password)
            .limit(1);
          
          if (retryData && retryData.length > 0) {
            const data = retryData[0];
            onLogin({
              id: data.resident_id,
              resident_id: data.resident_id,
              name: data.name,
              email: data.email || '',
              phone: data.phone || '',
              role: data.role || 'resident',
              society_id: data.society_id,
              flat: data.flat,
              tower: data.tower
            });
            return;
          }
          throw new Error('Invalid Resident ID or Password');
        }

        const data = residentData[0];
        onLogin({
          id: data.resident_id,
          resident_id: data.resident_id,
          name: data.name,
          email: data.email || '',
          phone: data.phone || '',
          role: data.role || 'resident',
          society_id: data.society_id,
          flat: data.flat,
          tower: data.tower
        });
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  if (view === 'register') {
    return <RegisterSociety onBack={() => setView('login')} onSuccess={() => setView('login')} />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      {/* Background Decorative Elements - Subtle */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-[10%] -left-[10%] w-[40%] h-[40%] ${role === 'resident' ? 'bg-emerald-500/5' : 'bg-indigo-500/5'} rounded-full blur-[100px] transition-all duration-700`} />
        <div className={`absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] ${role === 'resident' ? 'bg-teal-500/5' : 'bg-purple-500/5'} rounded-full blur-[100px] transition-all duration-700`} />
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 max-w-md w-full relative border border-slate-100">
            <button 
              onClick={() => {
                setShowForgotModal(false);
                setResetMessage({ text: '', type: '' });
              }}
              className="absolute right-8 top-8 text-slate-400 hover:text-slate-600 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-8">
              <div className={`w-14 h-14 ${role === 'resident' ? 'bg-emerald-50' : 'bg-indigo-50'} rounded-2xl flex items-center justify-center mb-6`}>
                <Lock className={`w-7 h-7 ${themeText}`} />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Reset Password</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">Enter your email to receive a reset link.</p>
            </div>
            
            {resetMessage.text && (
              <div className={`p-4 rounded-2xl text-xs font-bold mb-6 flex items-center gap-3 ${
                resetMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
              }`}>
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                {resetMessage.text}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative group">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:${themeText} transition-colors`} />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 ${themeFocus} outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-300 text-sm`}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setResetMessage({ text: '', type: '' });
                  }}
                  className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold py-3.5 rounded-2xl transition-all text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className={`flex-[1.5] ${themeBg} ${themeHover} disabled:bg-slate-300 text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg ${themeShadow} text-xs uppercase tracking-widest`}
                >
                  {resetLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Send Link'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-[1000px] w-full grid md:grid-cols-2 bg-white rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] overflow-hidden relative z-10 border border-slate-100">
        {/* Left Side - Visual/Branding */}
        <div className={`hidden md:flex flex-col justify-between p-12 lg:p-16 ${role === 'resident' ? 'bg-emerald-950' : 'bg-slate-900'} text-white relative overflow-hidden transition-all duration-700`}>
          <div className={`absolute top-0 right-0 w-64 h-64 ${role === 'resident' ? 'bg-emerald-500/10' : 'bg-indigo-500/10'} rounded-full -mr-32 -mt-32 blur-3xl`} />
          <div className={`absolute bottom-0 left-0 w-48 h-48 ${role === 'resident' ? 'bg-teal-500/10' : 'bg-purple-500/10'} rounded-full -ml-24 -mb-24 blur-2xl`} />
          
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-10 border border-white/10">
              <Building2 className={`w-8 h-8 ${themeIcon}`} />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight mb-4">
              TowerTech
            </h1>
            <h3 className={`text-xl lg:text-2xl font-semibold ${themeIcon} mb-8`}>
              Society Management System
            </h3>
            
            <div className="space-y-6">
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ${role === 'resident' ? 'text-emerald-300' : 'text-indigo-300'}`}>
                  SMART COMMUNITY MANAGEMENT
                </p>
                <p className="text-slate-400 text-base font-medium leading-relaxed max-w-sm">
                  A simple digital platform to manage residential societies efficiently.
                </p>
              </div>

              <div className="pt-6 border-t border-white/5">
                <p className="text-slate-300 text-sm font-semibold leading-relaxed">
                  Digital Solutions for Modern Communities
                </p>
                <p className="text-slate-500 text-xs mt-2 leading-relaxed max-w-xs">
                  Manage maintenance payments, resolve complaints, and book amenities in one place.
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                <ShieldCheck className={`w-5 h-5 ${themeIcon}`} />
              </div>
              <p className="text-sm font-bold text-slate-300">Secure • Reliable • Encrypted</p>
            </div>
            <div className="pt-8 border-t border-white/5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em]">
                © 2026 TowerTech Technologies
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          <div className="mb-10">
            <div className="md:hidden flex justify-center mb-8">
              <div className={`w-14 h-14 ${themeBg} rounded-2xl flex items-center justify-center shadow-lg ${themeShadow}`}>
                <Building2 className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
              {role === 'resident' ? 'Resident Login' : 'Admin Login'}
            </h2>
            <p className="text-slate-500 text-sm font-medium">Welcome back! Please sign in to your account.</p>
          </div>

          {/* Role Switcher */}
          <div className="mb-8">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Select Mode</label>
            <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
              <button
                onClick={() => {
                  setRole('resident');
                  setLoginId('');
                  setPassword('');
                }}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  role === 'resident' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Resident
              </button>
              <button
                onClick={() => {
                  setRole('admin');
                  setLoginId('');
                  setPassword('');
                }}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  role === 'admin' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Society ID</label>
                <div className="relative group">
                  <Building2 className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:${themeText} transition-colors`} />
                  <input
                    type="text"
                    value={societyId}
                    onChange={(e) => setSocietyId(e.target.value)}
                    placeholder="GV2026"
                    className={`w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-4 ${themeFocus} outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-300 text-sm`}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                  {role === 'resident' ? 'Resident ID' : 'Admin ID'}
                </label>
                <div className="relative group">
                  <UserPlus className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:${themeText} transition-colors`} />
                  <input
                    type="text"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder={role === 'resident' ? "e.g. R101" : "e.g. A001"}
                    className={`w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-4 ${themeFocus} outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-300 text-sm`}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</label>
                  <button 
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className={`text-[10px] font-bold ${themeText} hover:opacity-80 uppercase tracking-widest`}
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:${themeText} transition-colors`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 focus:ring-4 ${themeFocus} outline-none transition-all font-semibold text-slate-700 placeholder:text-slate-300 text-sm`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-xs font-bold border border-rose-100 flex items-center gap-2">
                <X className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${themeBg} ${themeHover} disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg ${themeShadow} hover:shadow-lg active:scale-[0.98] uppercase tracking-widest text-xs mt-2`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
            <button
              onClick={() => setView('register')}
              className={`w-full group flex flex-col items-center gap-2 p-6 bg-gradient-to-r from-slate-50 to-white rounded-3xl border border-slate-100 hover:border-${themeColor}-200 transition-all shadow-sm hover:shadow-md`}
            >
              <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center ${themeText} shadow-sm mb-1`}>
                <UserPlus className="w-5 h-5" />
              </div>
              <span className={`text-sm font-bold ${themeText} uppercase tracking-widest`}>
                Register Your Society
              </span>
              <p className="text-slate-400 text-[10px] font-medium text-center">
                Create a new society account to start managing residents and services.
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
