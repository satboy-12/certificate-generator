import React, { useState } from 'react';
import { Award, Lock, Mail, Shield, ArrowRight, Sparkles } from 'lucide-react';
import { UserProfile, UserRole } from '../types';

interface LoginModalProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@bsrocks.com');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<UserRole>('admin');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user: UserProfile = {
      id: `usr_${Date.now()}`,
      email: email.trim(),
      displayName: email.includes('admin') ? 'Administrator' : 'Staff Operator',
      role,
      organization: 'BSROCKS × SeventhSense',
    };
    onLoginSuccess(user);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200 space-y-6">
        
        {/* Branding Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-md">
            <Award className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            BSROCKS <span className="text-slate-400">×</span> SeventhSense
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Certificate Printing System Portal
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <button
                type="button"
                onClick={() => alert('Password reset link sent to registered corporate email.')}
                className="text-[11px] text-blue-600 hover:underline font-medium"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Account Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="admin">Administrator (Full Editing & Permissions)</option>
              <option value="staff">Staff Operator (Generator & Print)</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
          >
            <span>Sign In to Certificate System</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center text-[11px] text-slate-500">
          Internal Event Use Only • Powered by BSROCKS × SeventhSense
        </div>
      </div>
    </div>
  );
};
