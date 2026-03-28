import React, { useState } from 'react';
import { LogIn, Building2, Eye, EyeOff, ShieldCheck, Users, X, UserPlus } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative">
            <button 
              onClick={() => {
                setShowForgotModal(false);
                setResetMessage({ text: '', type: '' });
              }}
              className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h3>
            <p className="text-gray-500 mb-6">Enter your email address and we'll send you a link to reset your password.</p>
            
            {resetMessage.text && (
              <div className={`p-4 rounded-xl text-sm font-medium mb-6 ${
                resetMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
              }`}>
                {resetMessage.text}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setResetMessage({ text: '', type: '' });
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center"
                >
                  {resetLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Send Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Landing Page Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl w-full grid md:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10">
        {/* Left Side - Branding/Landing Info */}
        <div className="hidden md:flex flex-col justify-center p-12 bg-blue-50">
          <div className="mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-blue-900 mb-4 leading-tight">
              TowerTech-Society <br />
              <span className="text-blue-600 text-3xl">Management System</span>
            </h1>
            <p className="text-blue-700/70 text-lg">
              Streamline your community living with our all-in-one digital platform.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-blue-900 font-medium">Secure & Private</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-blue-900 font-medium">Community Focused</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="p-8 md:p-12">
          <div className="text-center md:text-left mb-10">
            <div className="md:hidden flex justify-center mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-500 mt-2">Please enter your details to sign in</p>
          </div>

          <div className="flex mb-8 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => {
                setRole('resident');
                setLoginId('');
                setPassword('');
              }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                role === 'resident' ? 'bg-white shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700'
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
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                role === 'admin' ? 'bg-white shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Administrator
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Society ID</label>
              <input
                type="text"
                value={societyId}
                onChange={(e) => setSocietyId(e.target.value)}
                placeholder="GV2026"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {role === 'resident' ? 'Resident ID' : 'Administrator ID'}
              </label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder={role === 'resident' ? 'e.g. R001' : 'e.g. A001'}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                required
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
                <button 
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-12 placeholder:text-gray-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 space-y-4">
            <button
              onClick={() => setView('register')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
            >
              <UserPlus className="w-5 h-5" />
              Create Society Account
            </button>
          </div>
          
          <div className="mt-10 text-center text-gray-400 text-xs">
            <p>© 2026 TowerTech-Society Management. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
