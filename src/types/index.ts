export type DocumentType = 'pdf' | 'docx' | 'pptx' | 'txt' | 'gdoc';

export interface LectureSegment {
  id: string;
  chapterIndex: number;
  title: string;
  originalContent: string;
  synthesizedAudioText: string;
  estimatedSeconds: number;
  slideNumber?: number;
  keyPoints: string[];
}

export interface LectureDocument {
  id: string;
  title: string;
  type: DocumentType;
  originalName: string;
  fileSize: number;
  totalPagesOrSlides?: number;
  uploadedAt: number;
  durationMinutes: number;
  segments: LectureSegment[];
  rawText: string;
  status: 'ready' | 'synthesizing' | 'error';
}

export type NoteCategory = 'action' | 'concept' | 'exam';

export interface CommuteNote {
  id: string;
  documentId: string;
  documentTitle: string;
  chapterId?: string;
  chapterTitle?: string;
  timestampSeconds: number;
  timestampFormatted: string;
  rawTranscription: string;
  synthesizedContent: string;
  category: NoteCategory;
  createdAt: number;
  audioSnippetBlob?: Blob;
}

export type PlaybackRate = 1.0 | 1.25 | 1.5 | 2.0;

export interface AudioPlayerState {
  currentDocumentId: string | null;
  currentSegmentId: string | null;
  currentSegmentIndex: number;
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number; // Seconds within current segment
  duration: number; // Total seconds of current segment
  playbackRate: PlaybackRate;
  isBuffering: boolean;
  isSynthesizingSpeech: boolean;
  ttsEngineType: 'browser' | 'google-cloud';
}

export interface AppSettings {
  geminiApiKey: string;
  googleCloudTtsKey?: string;
  selectedVoiceURI?: string;
  cloudVoiceName?: string;
  autoResumeAfterNote: boolean;
  speechPitch: number;
  speechRate: number;
  hapticFeedbackEnabled: boolean;
  commuteSafeMode: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  googleCloudTtsKey: '',
  selectedVoiceURI: '',
  cloudVoiceName: 'en-US-Journey-F',
  autoResumeAfterNote: true,
  speechPitch: 1.0,
  speechRate: 1.0,
  hapticFeedbackEnabled: true,
  commuteSafeMode: true,
};
