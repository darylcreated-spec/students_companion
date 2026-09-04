/**
 * Device & Browser Detection and Cross-Platform Compatibility Utility
 * Detects browser engine, operating system, form factors, and platform capabilities.
 */

export interface BrowserInfo {
  name: 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Opera' | 'Samsung' | 'Unknown';
  version: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  os: 'iOS' | 'iPadOS' | 'Android' | 'macOS' | 'Windows' | 'Linux' | 'Unknown';
  isTouchDevice: boolean;
  isPWA: boolean;
  capabilities: {
    speechSynthesis: boolean;
    speechRecognition: boolean;
    indexedDB: boolean;
    mediaSession: boolean;
    wakeLock: boolean;
    serviceWorker: boolean;
    webAudio: boolean;
  };
}

export class DeviceDetector {
  private static cachedInfo: BrowserInfo | null = null;

  public static getInfo(): BrowserInfo {
    if (this.cachedInfo) return this.cachedInfo;

    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return {
        name: 'Unknown',
        version: '0',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        os: 'Unknown',
        isTouchDevice: false,
        isPWA: false,
        capabilities: {
          speechSynthesis: false,
          speechRecognition: false,
          indexedDB: false,
          mediaSession: false,
          wakeLock: false,
          serviceWorker: false,
          webAudio: false,
        },
      };
    }

    const ua = navigator.userAgent || '';
    const platform = (navigator as any).userAgentData?.platform || navigator.platform || '';
    const maxTouchPoints = navigator.maxTouchPoints || 0;

    // 1. Detect OS
    let os: BrowserInfo['os'] = 'Unknown';
    if (/iPad/i.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1)) {
      os = 'iPadOS';
    } else if (/iPhone|iPod/i.test(ua)) {
      os = 'iOS';
    } else if (/Android/i.test(ua)) {
      os = 'Android';
    } else if (/Macintosh|Mac OS X/i.test(ua)) {
      os = 'macOS';
    } else if (/Windows|Win32|Win64/i.test(ua)) {
      os = 'Windows';
    } else if (/Linux/i.test(ua)) {
      os = 'Linux';
    }

    // 2. Detect Browser Name
    let name: BrowserInfo['name'] = 'Unknown';
    let version = '0';

    if (/SamsungBrowser/i.test(ua)) {
      name = 'Samsung';
      version = ua.match(/SamsungBrowser\/([\d.]+)/)?.[1] || '0';
    } else if (/Edg/i.test(ua)) {
      name = 'Edge';
      version = ua.match(/Edg\/([\d.]+)/)?.[1] || '0';
    } else if (/OPR|Opera/i.test(ua)) {
      name = 'Opera';
      version = ua.match(/(?:OPR|Opera)\/([\d.]+)/)?.[1] || '0';
    } else if (/Chrome|CriOS/i.test(ua)) {
      name = 'Chrome';
      version = ua.match(/(?:Chrome|CriOS)\/([\d.]+)/)?.[1] || '0';
    } else if (/Firefox|FxiOS/i.test(ua)) {
      name = 'Firefox';
      version = ua.match(/(?:Firefox|FxiOS)\/([\d.]+)/)?.[1] || '0';
    } else if (/Safari/i.test(ua) && !/Chrome|CriOS/i.test(ua)) {
      name = 'Safari';
      version = ua.match(/Version\/([\d.]+)/)?.[1] || '0';
    }

    // 3. Form Factor
    const isTouchDevice = 'ontouchstart' in window || maxTouchPoints > 0;
    const isTablet =
      os === 'iPadOS' ||
      (/Android/i.test(ua) && !/Mobile/i.test(ua)) ||
      (window.innerWidth >= 600 && window.innerWidth <= 1024 && isTouchDevice);
    const isMobile = (os === 'iOS' || /Mobile|Android/i.test(ua)) && !isTablet;
    const isDesktop = !isMobile && !isTablet;

    // 4. Standalone PWA detection
    const isPWA =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    // 5. Browser Capabilities
    const capabilities = {
      speechSynthesis: 'speechSynthesis' in window,
      speechRecognition:
        'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
      indexedDB: 'indexedDB' in window,
      mediaSession: 'mediaSession' in navigator,
      wakeLock: 'wakeLock' in navigator,
      serviceWorker: 'serviceWorker' in navigator,
      webAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
    };

    const info: BrowserInfo = {
      name,
      version,
      isMobile,
      isTablet,
      isDesktop,
      os,
      isTouchDevice,
      isPWA,
      capabilities,
    };

    this.cachedInfo = info;
    return info;
  }

  /**
   * Keep mobile screen awake during audio lecture commute (WakeLock API).
   */
  public static async requestWakeLock(): Promise<(() => void) | null> {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return null;

    try {
      const lock = await (navigator as any).wakeLock.request('screen');
      return () => {
        lock.release().catch(() => {});
      };
    } catch {
      return null;
    }
  }

  /**
   * Unlock Web Audio & Speech synthesis for iOS Safari / Android autoplay policy.
   */
  public static unlockAudioContext(): void {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      // Unlock Web Audio context
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      }

      // Unlock SpeechSynthesis
      if ('speechSynthesis' in window) {
        const synth = window.speechSynthesis;
        if (synth.paused) {
          synth.resume();
        }
      }

      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('click', unlock);
    };

    window.addEventListener('touchstart', unlock, { passive: true, once: true });
    window.addEventListener('click', unlock, { passive: true, once: true });
  }
}

/**
 * Haptic Vibration Feedback Utility for Tactile Eyes-Free Commute Interactions
 */
export class HapticFeedback {
  public static trigger(type: 'light' | 'medium' | 'success' | 'warning' = 'light'): void {
    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('vibrate' in navigator)) {
      return;
    }

    try {
      // Check user preference in localStorage if disabled
      const setting = localStorage.getItem('STUDENT_COMPANION_HAPTICS');
      if (setting === 'false') return;

      switch (type) {
        case 'light':
          navigator.vibrate(12); // Short crisp pocket pulse
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'success':
          navigator.vibrate([15, 60, 25]); // Double confirmation pulse
          break;
        case 'warning':
          navigator.vibrate([40, 50, 40]);
          break;
      }
    } catch (_) {
      // Ignored if user policy or device disables vibration
    }
  }
}

