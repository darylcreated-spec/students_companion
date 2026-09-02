export interface VoiceCaptureCallbacks {
  onTranscriptChange: (transcript: string, isFinal: boolean) => void;
  onAudioLevelChange: (level: number) => void;
  onStateChange: (state: 'idle' | 'listening' | 'processing' | 'error') => void;
  onError: (error: string) => void;
}

export class VoiceRecognitionService {
  private static recognition: any = null;
  private static audioContext: AudioContext | null = null;
  private static analyser: AnalyserNode | null = null;
  private static microphoneStream: MediaStream | null = null;
  private static animFrameId: number | null = null;
  private static isListening = false;
  private static silenceTimeoutId: any = null;
  private static accumulatedTranscript = '';

  public static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  public static async startListening(callbacks: VoiceCaptureCallbacks): Promise<void> {
    this.stopListening();
    this.accumulatedTranscript = '';

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      callbacks.onError('Web Speech Recognition is not supported in this browser.');
      return;
    }

    try {
      // 1. Initialize Microphone Audio Stream for Live Waveform
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          this.microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const source = this.audioContext.createMediaStreamSource(this.microphoneStream);
          this.analyser = this.audioContext.createAnalyser();
          this.analyser.fftSize = 256;
          source.connect(this.analyser);

          this.startAudioLevelPolling(callbacks);
        } catch (e) {
          console.warn('Microphone stream for visualizer not granted:', e);
        }
      }

      // 2. Initialize SpeechRecognition instance
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        callbacks.onStateChange('listening');
      };

      this.recognition.onresult = (event: any) => {
        let interimText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            this.accumulatedTranscript += ' ' + transcript;
          } else {
            interimText += transcript;
          }
        }

        const fullCurrentText = (this.accumulatedTranscript + ' ' + interimText).trim();
        callbacks.onTranscriptChange(fullCurrentText, false);

        // Reset silence timer on active speech
        clearTimeout(this.silenceTimeoutId);
        this.silenceTimeoutId = setTimeout(() => {
          // If 2.5 seconds of silence after speaking, finish transcription
          if (this.accumulatedTranscript.trim().length > 0 || interimText.trim().length > 0) {
            callbacks.onTranscriptChange((this.accumulatedTranscript + ' ' + interimText).trim(), true);
          }
        }, 2500);
      };

      this.recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          return;
        }
        callbacks.onError(`Speech recognition error: ${event.error}`);
        callbacks.onStateChange('error');
      };

      this.recognition.onend = () => {
        this.isListening = false;
        callbacks.onStateChange('idle');
      };

      this.recognition.start();
    } catch (err: any) {
      callbacks.onError(err.message || 'Failed to start speech recognition');
      callbacks.onStateChange('error');
    }
  }

  private static startAudioLevelPolling(callbacks: VoiceCaptureCallbacks) {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const poll = () => {
      if (!this.analyser || !this.isListening) return;

      this.analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const normalizedLevel = Math.min(1.0, average / 80); // 0 to 1.0

      callbacks.onAudioLevelChange(normalizedLevel);
      this.animFrameId = requestAnimationFrame(poll);
    };

    poll();
  }

  public static stopListening(): string {
    clearTimeout(this.silenceTimeoutId);
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => track.stop());
      this.microphoneStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
      this.analyser = null;
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (_) {}
      this.recognition = null;
    }

    this.isListening = false;
    return this.accumulatedTranscript.trim();
  }
}
