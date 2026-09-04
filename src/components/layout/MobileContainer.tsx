import React, { useEffect, useState } from 'react';
import { DeviceDetector, BrowserInfo } from '../../services/device/deviceDetector';

interface MobileContainerProps {
  children: React.ReactNode;
  oledMode?: boolean;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({ children, oledMode = false }) => {
  const [deviceInfo, setDeviceInfo] = useState<BrowserInfo | null>(null);

  useEffect(() => {
    const info = DeviceDetector.getInfo();
    setDeviceInfo(info);
    DeviceDetector.unlockAudioContext();
  }, []);

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center overscroll-none selection:bg-cyan-500/30 selection:text-cyan-200 transition-colors duration-300 ${
        oledMode ? 'bg-[#000000]' : 'bg-[#070B14]'
      }`}
    >
      {/* Universal Responsive Container */}
      <div
        className={`relative w-full h-[100dvh] max-w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl sm:h-[94vh] sm:my-auto sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          oledMode
            ? 'bg-[#000000] sm:border sm:border-zinc-800'
            : 'bg-[#0A0F1D] sm:border sm:border-slate-800/80'
        }`}
      >
        {/* Main Reactive Content Area with Safe-Area Padding */}
        <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          {children}
        </div>
      </div>
    </div>
  );
};
