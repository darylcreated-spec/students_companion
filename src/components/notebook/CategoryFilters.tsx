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
}) => {
  const filters: { id: FilterCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'All Notes', icon: '📝' },
    { id: 'exam', label: 'Exam Flags', icon: '🚩' },
    { id: 'action', label: 'Action Items', icon: '⚡' },
    { id: 'concept', label: 'Concepts', icon: '💡' },
  ];

  return (
    <div className="w-full flex items-center space-x-1.5 overflow-x-auto py-1 no-scrollbar">
      {filters.map((f) => {
        const isActive = selected === f.id;
        return (
          <button
            key={f.id}
            onClick={() => onSelect(f.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium whitespace-nowrap flex items-center space-x-1.5 border transition-all ${
              isActive
                ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <span>{f.icon}</span>
            <span>{f.label}</span>
          </button>
        );
      })}
    </div>
  );
};
