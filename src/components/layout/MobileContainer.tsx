import React, { useEffect, useState } from 'react';
import { DeviceDetector, BrowserInfo } from '../../services/device/deviceDetector';

interface MobileContainerProps {
  children: React.ReactNode;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({ children }) => {
  const [deviceInfo, setDeviceInfo] = useState<BrowserInfo | null>(null);

  useEffect(() => {
    const info = DeviceDetector.getInfo();
    setDeviceInfo(info);
    DeviceDetector.unlockAudioContext();
  }, []);

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center overscroll-none selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Universal Responsive Container */}
      <div className="relative w-full h-[100dvh] max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl sm:h-[94vh] sm:my-auto bg-[#0A0F1D] sm:rounded-3xl sm:border sm:border-slate-800/80 shadow-2xl flex flex-col overflow-hidden transition-all duration-300">
        {/* Main Reactive Content Area with Safe-Area Padding */}
        <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          {children}
        </div>
      </div>
    </div>
  );
};
