import React from 'react';
import { Search, Bell, Settings } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User;
}

export default function Header({ user }: HeaderProps) {
  const date = new Date();
  const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
  const dayMonth = date.toLocaleString('default', { day: 'numeric', month: 'short' });

  return (
    <header className="h-16 bg-white border-b border-slate-100 px-8 flex items-center justify-between shrink-0 z-10">
      <div className="flex flex-col">
        <h1 className="text-xs font-black text-slate-900 tracking-tight leading-none">
          TowerTech – Society Management System
        </h1>
        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">
          Green Park Residency
        </p>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="text-right">
          <p className="text-xs font-black text-slate-900 leading-none">{monthYear}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{dayMonth}</p>
        </div>
        
        <div className="h-6 w-[1px] bg-slate-100" />
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-slate-900 leading-none">{user.name}</p>
            <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-1">
              {user.admin_id ? 'Administrator' : 'Resident'}
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-600 font-black text-sm border border-slate-200">
            {user.name.charAt(0)}
          </div>
        </div>
      </div>
    </header>
  );
}
