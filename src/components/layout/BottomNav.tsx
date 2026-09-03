import React from 'react';
import { BookOpen, Mic } from 'lucide-react';

export type NavTab = 'reader' | 'transcriber';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  const tabs = [
    {
      id: 'reader' as NavTab,
      label: 'Reader',
      icon: BookOpen,
    },
    {
      id: 'transcriber' as NavTab,
      label: 'Transcriber',
      icon: Mic,
    },
  ];

  return (
    <nav className="h-16 px-4 py-2 border-t border-white/5 bg-[#0A0F1D]/90 backdrop-blur-xl flex items-center justify-around z-30">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-2 mx-2 flex flex-col items-center justify-center relative transition-all rounded-xl ${
              isActive
                ? 'text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200 font-medium'
            }`}
          >
            {isActive && (
              <span className="absolute -top-2 w-10 h-1 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
            )}

            <Icon
              className={`w-5 h-5 transition-transform ${
                isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''
              }`}
            />

            <span className="text-[11px] mt-1 tracking-tight font-sora">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
