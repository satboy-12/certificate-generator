import React from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  FolderKanban,
  Edit3,
  FileSpreadsheet,
  Award,
  QrCode,
  Settings,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'upload_flow' | 'projects' | 'editor' | 'import' | 'certificates' | 'verification' | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  certificatesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, certificatesCount }) => {
  const mainMenu = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload_flow' as NavTab, label: 'Upload & Generate', icon: UploadCloud, badgeText: 'Master Workflow' },
    { id: 'projects' as NavTab, label: 'Projects', icon: FolderKanban },
    { id: 'editor' as NavTab, label: 'Templates', icon: Edit3 },
  ];

  const dataMenu = [
    { id: 'import' as NavTab, label: 'Name Lists', icon: FileSpreadsheet },
    {
      id: 'certificates' as NavTab,
      label: 'Certificates',
      icon: Award,
      badge: certificatesCount > 0 ? certificatesCount : undefined,
    },
    { id: 'verification' as NavTab, label: 'Verification', icon: QrCode },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800 justify-between">
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          Main Menu
        </div>
        {mainMenu.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badgeText && (
                <span className="px-2 py-0.5 text-[9px] bg-blue-500/20 text-blue-300 font-bold rounded-full border border-blue-500/30 uppercase tracking-tight">
                  {item.badgeText}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-4 pb-1 px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          Data Management
        </div>
        {dataMenu.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                    isActive ? 'bg-blue-800 text-white' : 'bg-slate-800 text-blue-400 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
