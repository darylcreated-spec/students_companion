/**
 * Background Audio Keep-Alive Service:
 * Prevents mobile browsers (iOS Safari, Android Chrome) from suspending JavaScript
 * timers, SpeechSynthesis, and audio contexts when the device screen turns off,
 * locks in the commuter's pocket, or switches background tabs.
 */
export class BackgroundAudioKeepAlive {
  private static audioContext: AudioContext | null = null;
  private static oscillatorNode: OscillatorNode | null = null;
  private static gainNode: GainNode | null = null;
  private static isRunning = false;

  /**
   * Initializes and starts the inaudible background audio loop.
   * Uses a 20Hz oscillator with gain set to 0.0001 (completely imperceptible to human ear)
   * which signals the mobile operating system that media playback is actively running.
   */
  public static start() {
    if (typeof window === 'undefined') return;
    if (this.isRunning) return;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new AudioCtxClass();
      }

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      // Create an inaudible frequency oscillator
      this.oscillatorNode = this.audioContext.createOscillator();
      this.oscillatorNode.type = 'sine';
      this.oscillatorNode.frequency.setValueAtTime(20, this.audioContext.currentTime); // Inaudible sub-bass threshold

      // Virtually zero volume to prevent any audible sound while maintaining active media session
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.setValueAtTime(0.0001, this.audioContext.currentTime);

      this.oscillatorNode.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      this.oscillatorNode.start();
      this.isRunning = true;
    } catch (err) {
      console.warn('Background audio keep-alive could not be started:', err);
    }
  }

  /**
   * Stops the background keep-alive loop when audio is paused or finished.
   */
  public static stop() {
    if (!this.isRunning) return;

    try {
      if (this.oscillatorNode) {
        this.oscillatorNode.stop();
        this.oscillatorNode.disconnect();
        this.oscillatorNode = null;
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
      this.isRunning = false;
    } catch (err) {
      console.warn('Error stopping background keep-alive:', err);
    }
  }

  public static isActive(): boolean {
    return this.isRunning;
  }
}
