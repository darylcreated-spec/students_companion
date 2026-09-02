import React from 'react';

interface MobileContainerProps {
  children: React.ReactNode;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#070B14] flex items-center justify-center sm:py-4 md:py-6 select-none">
      {/* 412x915 Mobile Viewport Shell */}
      <div className="relative w-full max-w-[420px] h-screen sm:h-[915px] sm:max-h-[92vh] bg-[#0A0F1D] sm:rounded-[40px] sm:border-[8px] sm:border-slate-800/80 shadow-2xl flex flex-col overflow-hidden">
        {/* Dynamic Island / Speaker Notch on Desktop Frame */}
        <div className="hidden sm:block absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-50 border border-slate-800"></div>
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {children}
        </div>
      </div>
    </div>
  );
};
