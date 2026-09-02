import React from 'react';
import { NoteCategory } from '../../types';

export type FilterCategory = 'all' | NoteCategory;

interface CategoryFiltersProps {
  selected: FilterCategory;
  onSelect: (cat: FilterCategory) => void;
  counts: {
    all: number;
    action: number;
    concept: number;
    exam: number;
  };
}

export const CategoryFilters: React.FC<CategoryFiltersProps> = ({
  selected,
  onSelect,
  counts,
}) => {
  const filters: { id: FilterCategory; label: string; icon: string; count: number }[] = [
    { id: 'all', label: 'All Notes', icon: '📝', count: counts.all },
    { id: 'exam', label: 'Exam Flags', icon: '🚩', count: counts.exam },
    { id: 'action', label: 'Action Items', icon: '⚡', count: counts.action },
    { id: 'concept', label: 'Concepts', icon: '💡', count: counts.concept },
  ];

  return (
    <div className="w-full flex items-center space-x-1.5 overflow-x-auto py-1 no-scrollbar">
      {filters.map((f) => {
        const isActive = selected === f.id;
        return (
          <button
            key={f.id}
            onClick={() => onSelect(f.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-mono font-medium whitespace-nowrap flex items-center space-x-1.5 border transition-all ${
              isActive
                ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <span>{f.icon}</span>
            <span>{f.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                isActive
                  ? 'bg-cyan-400 text-obsidian-950'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {f.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
