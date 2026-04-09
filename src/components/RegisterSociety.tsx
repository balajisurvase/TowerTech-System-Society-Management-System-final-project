import React, { useState } from 'react';
import { toast } from 'sonner';
import { Building2, ArrowLeft, ShieldCheck, Phone, Mail, Lock, Home, X } from 'lucide-react';
import { societyService } from '../lib/societyService';

interface RegisterSocietyProps {
  onBack: () => void;
  onSuccess: () => void;
}

export default function RegisterSociety({ onBack, onSuccess }: RegisterSocietyProps) {
  const [formData, setFormData] = useState({
    name: '',
    admin_first_name: '',
    admin_last_name: '',
    password: '',
    confirm_password: '',
    towers: 1,
    floors_per_tower: 1,
    flats_per_floor: 1,
    admin_email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'towers' || name === 'floors_per_tower' || name === 'flats_per_floor' ? parseInt(value) || 0 : value
    }));
  };

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name || !formData.admin_first_name || !formData.admin_last_name || !formData.admin_email || !formData.phone || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setOtpStep(true);
    // In a real app, you'd send this via SMS/Email
    toast.info(`MOCK OTP: ${newOtp} (In a real app, this would be sent to ${formData.phone})`, {
      duration: 10000,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp !== generatedOtp) {
      setError('Invalid OTP. Please try again.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { society } = await societyService.createSocietyAccount({
        name: formData.name,
        towers: formData.towers,
        floors_per_tower: formData.floors_per_tower,
        flats_per_floor: formData.flats_per_floor,
        admin_email: formData.admin_email,
        phone: formData.phone
      }, formData.password);

      // Update admin name with first and last name
      await societyService.updateAdminProfile(society.society_id, 'A001', {
        name: `${formData.admin_first_name} ${formData.admin_last_name}`
      });

      setSuccess(`Society Account Created Successfully! Your Society ID is: ${society.society_id}. Redirecting to login...`);
      
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (err: any) {
      console.error('Registration Error:', err);
      setError(err.message || 'Failed to create society account. Please check if the tables exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 md:p-8 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="max-w-4xl w-full bg-white/95 backdrop-blur-xl rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] overflow-hidden relative z-10 border border-white/20 h-full max-h-[90vh] flex flex-col">
        <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar">
          <button 
            onClick={onBack}
            className="group flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-all mb-8 font-black uppercase tracking-widest text-[10px]"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </button>

          <div className="mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-200">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Create Society Account</h2>
            <p className="text-slate-500 font-bold">Register your society and start managing your community.</p>
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-sm font-bold border border-rose-100 mb-8 flex items-center gap-3 animate-shake">
              <X className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl text-sm font-bold border border-emerald-100 mb-8 flex items-center gap-3 animate-in slide-in-from-top-2">
              <ShieldCheck className="w-5 h-5 flex-shrink-0" />
              {success}
            </div>
          )}

          <form onSubmit={otpStep ? handleSubmit : handleSendOtp} className="space-y-8">
            {!otpStep ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Society Name</label>
                    <div className="relative group">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Green Valley Society"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Admin Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="email"
                        name="admin_email"
                        value={formData.admin_email}
                        onChange={handleChange}
                        placeholder="admin@example.com"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Admin First Name</label>
                    <input
                      type="text"
                      name="admin_first_name"
                      value={formData.admin_first_name}
                      onChange={handleChange}
                      placeholder="First Name"
                      className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Admin Last Name</label>
                    <input
                      type="text"
                      name="admin_last_name"
                      value={formData.admin_last_name}
                      onChange={handleChange}
                      placeholder="Last Name"
                      className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Phone Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 9876543210"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Admin Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Confirm Password</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="password"
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 placeholder:text-slate-300"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-slate-100">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Towers</label>
                    <div className="relative group">
                      <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="number"
                        name="towers"
                        min="1"
                        value={formData.towers}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Floors / Tower</label>
                    <input
                      type="number"
                      name="floors_per_tower"
                      min="1"
                      value={formData.floors_per_tower}
                      onChange={handleChange}
                      className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Flats / Floor</label>
                    <input
                      type="number"
                      name="flats_per_floor"
                      min="1"
                      value={formData.flats_per_floor}
                      onChange={handleChange}
                      className="w-full px-6 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black py-4.5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_-12px_rgba(16,185,129,0.4)] hover:shadow-[0_25px_50px_-12px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-[0.2em] text-xs mt-4"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Send Verification OTP
                </button>
              </>
            ) : (
              <div className="space-y-8 py-8">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Phone className="w-10 h-10 text-emerald-600 animate-bounce" />
                  </div>
                  <p className="text-slate-600 font-medium">We've sent a 6-digit OTP to your phone number <br /><b className="text-slate-900 text-lg">{formData.phone}</b></p>
                  <div className="flex justify-center pt-4">
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="000000"
                      className="w-full max-w-[240px] text-center text-4xl tracking-[0.4em] font-black py-5 rounded-3xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/10 outline-none transition-all text-slate-800 placeholder:text-slate-200"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setOtpStep(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4.5 rounded-2xl transition-all uppercase tracking-widest text-xs"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:from-slate-400 disabled:to-slate-500 text-white font-black py-4.5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-200 uppercase tracking-widest text-xs"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Verify & Create Account
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
        
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center items-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            © 2026 TowerTech-Society Management System
          </p>
        </div>
      </div>
    </div>
  );
}
