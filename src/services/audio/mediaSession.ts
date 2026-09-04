export interface MediaSessionConfig {
  title: string;
  artist?: string;
  album?: string;
  artwork?: string;
  onPlay: () => void;
  onPause: () => void;
  onSeekBackward?: () => void;
  onSeekForward?: () => void;
  onPreviousTrack?: () => void;
  onNextTrack?: () => void;
}

export class MediaSessionService {
  public static updateMetadata(config: MediaSessionConfig) {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) {
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: config.title,
      artist: config.artist || "Student's Companion",
      album: config.album || 'Commute Audio Journey',
      artwork: [
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/favicon.svg',
          sizes: '512x512',
          type: 'image/svg+xml'
        }
      ]
    });

    // Action handlers
    this.setActionHandler('play', config.onPlay);
    this.setActionHandler('pause', config.onPause);
    
    if (config.onSeekBackward) {
      this.setActionHandler('seekbackward', config.onSeekBackward);
    }
    if (config.onSeekForward) {
      this.setActionHandler('seekforward', config.onSeekForward);
    }
    if (config.onPreviousTrack) {
      this.setActionHandler('previoustrack', config.onPreviousTrack);
    }
    if (config.onNextTrack) {
      this.setActionHandler('nexttrack', config.onNextTrack);
    }
    this.setActionHandler('stop', config.onPause);
  }

  public static setPositionState(state: { duration: number; playbackRate: number; position: number }) {
    if (
      typeof window !== 'undefined' &&
      'mediaSession' in navigator &&
      typeof navigator.mediaSession.setPositionState === 'function'
    ) {
      try {
        const safeDuration = Math.max(1, Math.round(state.duration || 1));
        const safePosition = Math.min(safeDuration, Math.max(0, Math.round(state.position || 0)));
        navigator.mediaSession.setPositionState({
          duration: safeDuration,
          playbackRate: Math.max(0.5, Math.min(2.5, state.playbackRate || 1.0)),
          position: safePosition,
        });
      } catch (err) {
        // Some browsers disallow setPositionState if audio element isn't currently loaded
      }
    }
  }

  public static setPlaybackState(state: 'none' | 'paused' | 'playing') {
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = state;
      } catch (_) {}
    }
  }

  private static setActionHandler(action: MediaSessionAction, handler: (details?: any) => void) {
    try {
      navigator.mediaSession.setActionHandler(action, (details) => {
        handler(details);
      });
    } catch (error) {
      console.warn(`MediaSession action "${action}" not supported:`, error);
    }
  }
}
