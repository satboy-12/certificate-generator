import React from 'react';
import { ShieldCheck, Layers, Award, User, LogOut, Settings, Plus, Sparkles } from 'lucide-react';
import { Project, UserProfile, BrandingSettings } from '../types';

interface HeaderProps {
  currentProject: Project | null;
  projects: Project[];
  user: UserProfile;
  branding: BrandingSettings;
  onSelectProject: (p: Project) => void;
  onNewProjectClick: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProject,
  projects,
  user,
  branding,
  onSelectProject,
  onNewProjectClick,
  onOpenSettings,
  onLogout,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 text-slate-900 sticky top-0 z-40">
      
      {/* Left: Logos & Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center text-white font-bold text-xs tracking-wider">
            B
          </div>
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs tracking-wider">
            S
          </div>
        </div>

        <div className="h-6 w-[1px] bg-slate-200" />

        <div className="flex items-center gap-3">
          <h1 className="text-base sm:text-lg font-semibold tracking-tight text-slate-900">
            BSROCKS × SeventhSense{' '}
            <span className="text-slate-400 font-normal text-xs sm:text-sm hidden sm:inline ml-1">
              | Certificate Printing System
            </span>
          </h1>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-cyan-100 text-cyan-900 border border-cyan-300 shadow-xs" title="Strict CMYK Color Mode for Commercial Press">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-pulse" />
            CMYK MODE ONLY
          </span>
        </div>

        {/* Active Project Switcher */}
        <div className="hidden lg:flex items-center gap-2 ml-4 pl-4 border-l border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Project:</span>
          {projects.length > 0 ? (
            <select
              value={currentProject?.id || ''}
              onChange={(e) => {
                const found = projects.find((p) => p.id === e.target.value);
                if (found) onSelectProject(found);
              }}
              className="bg-slate-50 text-slate-800 text-xs font-semibold rounded-md px-2.5 py-1.5 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-slate-400">No Projects</span>
          )}

          <button
            onClick={onNewProjectClick}
            className="inline-flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-2.5 py-1.5 rounded-md shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Right: User Role & Quick Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSettings}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          title="Branding & System Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        <div className="h-5 w-[1px] bg-slate-200" />

        {/* User Badge */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-medium text-slate-900 leading-tight">{user.displayName}</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              {user.role}
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
            {user.displayName.charAt(0)}
          </div>
        </div>

        <button
          onClick={onLogout}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
