import React, { useState } from 'react';
import {
  Settings,
  Upload,
  Check,
  Shield,
  User,
  QrCode,
  Stamp,
  Hash,
  Sparkles,
  Building2,
} from 'lucide-react';
import { BrandingSettings, UserProfile, UserRole } from '../types';

interface SettingsPageProps {
  branding: BrandingSettings;
  user: UserProfile;
  onSaveBranding: (settings: BrandingSettings) => void;
  onSaveUser: (user: UserProfile) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  branding,
  user,
  onSaveBranding,
  onSaveUser,
}) => {
  const [formBranding, setFormBranding] = useState<BrandingSettings>({ ...branding });
  const [formUser, setFormUser] = useState<UserProfile>({ ...user });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleImageUpload = (
    key: keyof BrandingSettings,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setFormBranding((prev) => ({
            ...prev,
            [key]: evt.target?.result as string,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBranding(formBranding);
    onSaveUser(formUser);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-slate-900 rounded-xl text-white">
            <Settings className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">System & Branding Settings</h2>
            <p className="text-xs text-slate-500">
              Configure corporate logos, digital signatures, certificate ID sequences & user roles.
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center space-x-1.5 animate-bounce">
            <Check className="w-4 h-4" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* BRANDING LOGOS & ASSETS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Stamp className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Corporate Logos & Signatures</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* BSROCKS Logo */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">BSROCKS Logo</span>
              {formBranding.bsrocksLogo ? (
                <img src={formBranding.bsrocksLogo} className="h-12 object-contain rounded bg-white p-1 border" />
              ) : (
                <div className="h-12 bg-slate-200 rounded flex items-center justify-center text-[10px] text-slate-500 font-semibold">
                  No Logo Uploaded
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload('bsrocksLogo', e)}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-blue-50 file:text-blue-700"
              />
            </div>

            {/* SeventhSense Logo */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">SeventhSense Logo</span>
              {formBranding.seventhSenseLogo ? (
                <img src={formBranding.seventhSenseLogo} className="h-12 object-contain rounded bg-white p-1 border" />
              ) : (
                <div className="h-12 bg-slate-200 rounded flex items-center justify-center text-[10px] text-slate-500 font-semibold">
                  No Logo Uploaded
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload('seventhSenseLogo', e)}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-blue-50 file:text-blue-700"
              />
            </div>

            {/* Signature Asset */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Authorized Signature</span>
              {formBranding.signatureImage ? (
                <img src={formBranding.signatureImage} className="h-12 object-contain rounded bg-white p-1 border" />
              ) : (
                <div className="h-12 bg-slate-200 rounded flex items-center justify-center text-[10px] text-slate-500 font-semibold">
                  No Signature Uploaded
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload('signatureImage', e)}
                className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-blue-50 file:text-blue-700"
              />
            </div>
          </div>
        </div>

        {/* CERTIFICATE ID SEQUENCE CONFIG */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Hash className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Certificate ID Sequence Builder</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">ID Prefix</label>
              <input
                type="text"
                value={formBranding.idPrefix}
                onChange={(e) => setFormBranding({ ...formBranding, idPrefix: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono uppercase focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. BSR-2026-"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Starting Sequence Number</label>
              <input
                type="number"
                value={formBranding.idStartingNumber}
                onChange={(e) => setFormBranding({ ...formBranding, idStartingNumber: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Number Digit Padding</label>
              <input
                type="number"
                min={2}
                max={8}
                value={formBranding.idNumberLength}
                onChange={(e) => setFormBranding({ ...formBranding, idNumberLength: Number(e.target.value) })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between font-mono">
            <span className="text-slate-600">Sample Generated Certificate ID:</span>
            <span className="font-bold text-blue-700">
              {formBranding.idPrefix}
              {String(formBranding.idStartingNumber).padStart(formBranding.idNumberLength, '0')}
            </span>
          </div>
        </div>

        {/* USER ROLES & PERMISSIONS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Shield className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">User Profile & Access Role</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Display Name</label>
              <input
                type="text"
                value={formUser.displayName}
                onChange={(e) => setFormUser({ ...formUser, displayName: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={formUser.email}
                onChange={(e) => setFormUser({ ...formUser, email: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
              <select
                value={formUser.role}
                onChange={(e) => setFormUser({ ...formUser, role: e.target.value as UserRole })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="admin">Administrator (Full Access)</option>
                <option value="staff">Staff Member (Generator & Print)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save All Configuration Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
