import React from 'react';
import { Headphones, Library, BookmarkCheck, FileDown } from 'lucide-react';

export type NavTab = 'audio' | 'library' | 'notebook' | 'export';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  noteCount?: number;
  isPlaying?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  noteCount = 0,
  isPlaying = false,
}) => {
  const tabs = [
    {
      id: 'audio' as NavTab,
      label: 'Audio Hub',
      icon: Headphones,
      badge: isPlaying ? 'LIVE' : null,
    },
    {
      id: 'library' as NavTab,
      label: 'Library',
      icon: Library,
      badge: null,
    },
    {
      id: 'notebook' as NavTab,
      label: 'Notebook',
      icon: BookmarkCheck,
      badge: noteCount > 0 ? `${noteCount}` : null,
    },
    {
      id: 'export' as NavTab,
      label: 'Export',
      icon: FileDown,
      badge: null,
    },
  ];

  return (
    <nav className="h-18 px-3 py-2 border-t border-white/5 bg-[#0A0F1D]/90 backdrop-blur-xl flex items-center justify-around z-30">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center relative transition-all rounded-xl ${
              isActive
                ? 'text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            {/* Active Pill Indicator */}
            {isActive && (
              <span className="absolute -top-2 w-8 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
            )}

            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''
                }`}
              />
              {tab.badge && (
                <span
                  className={`absolute -top-1.5 -right-3 px-1.5 py-0.2 rounded-full text-[9px] font-mono leading-tight font-bold ${
                    tab.badge === 'LIVE'
                      ? 'bg-cyan-500 text-obsidian-950 animate-pulse shadow-[0_0_6px_rgba(34,211,238,0.8)]'
                      : 'bg-amber-400 text-obsidian-950'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </div>

            <span className="text-[10px] mt-1 tracking-tight font-sora">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
