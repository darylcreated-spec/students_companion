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
  currentSentenceIndex?: number;
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number; // Seconds within current segment
  duration: number; // Total seconds of current segment
  playbackRate: PlaybackRate;
  isBuffering: boolean;
  isSynthesizingSpeech: boolean;
  ttsEngineType: 'browser' | 'google-cloud';
}

export type SleepTimerMode = 'off' | '15m' | '30m' | '45m' | 'chapter' | 'document';

export interface CommuteBookmark {
  documentId: string;
  documentTitle: string;
  chapterIndex: number;
  chapterTitle: string;
  currentTime: number;
  updatedAt: number;
}

export type HighlightColor = 'amber' | 'cyan' | 'emerald' | 'purple';

export interface TextHighlight {
  id: string;
  documentId: string;
  chapterIndex: number;
  sentenceIndex?: number;
  text: string;
  color: HighlightColor;
  createdAt: number;
}

export interface WordDefinition {
  word: string;
  phonetic?: string;
  partOfSpeech: string;
  definition: string;
  example?: string;
  synonyms?: string[];
  source?: string;
}

export type EReaderTheme = 'dark' | 'oled' | 'sepia';

export interface AppSettings {
  geminiApiKey: string;
  googleCloudTtsKey?: string;
  selectedLanguage: string;
  selectedVoiceURI?: string;
  cloudVoiceName?: string;
  autoResumeAfterNote: boolean;
  speechPitch: number;
  speechRate: number;
  hapticFeedbackEnabled: boolean;
  commuteSafeMode: boolean;
  oledMode?: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  googleCloudTtsKey: '',
  selectedLanguage: 'en-US',
  selectedVoiceURI: '',
  cloudVoiceName: 'en-US-Journey-F',
  autoResumeAfterNote: true,
  speechPitch: 1.0,
  speechRate: 1.0,
  hapticFeedbackEnabled: true,
  commuteSafeMode: true,
  oledMode: false,
};

export interface DailyLesson {
  id: string;
  dayNumber: number;
  word: string;
  phonetic: string;
  syllables: string[];
  partOfSpeech: string;
  friendlyDefinition: string;
  sentenceExample: string;
  memoryTrick: string;
  rootOrigin: string;
  spellingHint: string;
  readingTitle: string;
  readingPassage: string;
  comprehensionQuestion: string;
  comprehensionOptions: string[];
  correctOptionIndex: number;
  comprehensionExplanation: string;
}

export interface UserLiteracyProgress {
  currentDay: number;
  streakCount: number;
  lastCompletedDate: string | null;
  masteredWords: string[];
  favoriteWords: string[];
}

export type LexileBand = '800L' | '1000L' | '1200L';
export type ReadingDomain = 'Philosophy' | 'Science' | 'Literature' | 'CurrentAffairs';

export interface MorphemeBreakdown {
  prefix?: string;
  root: string;
  suffix?: string;
  meaning: string;
}

export interface OrthographicRule {
  title: string;
  explanation: string;
  example: string;
}

export interface TargetWordDetail {
  word: string;
  phonetic: string;
  syllables: string[];
  partOfSpeech: string;
  definition: string;
  morphemes: MorphemeBreakdown;
  orthographicRule: OrthographicRule;
  exampleSentence: string;
}

export interface PassageCheckpoint {
  id: string;
  wordOffset: number; // approximate word threshold where checkpoint occurs
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ImmersionPassage {
  id: string;
  domain: ReadingDomain;
  lexile: LexileBand;
  title: string;
  subtitle: string;
  wordCount: number;
  content: string;
  targetWords: TargetWordDetail[];
  checkpoints: PassageCheckpoint[];
}

export interface SRSCard {
  id: string;
  word: string;
  easeFactor: number; // default 2.5
  interval: number; // in days
  repetitions: number;
  nextReviewDate: string; // YYYY-MM-DD
  lastPerformanceRating: number; // 0 to 5
}

export interface ReadingAnalyticsSession {
  id: string;
  date: string;
  domain: ReadingDomain;
  lexileLevel: LexileBand;
  wpm: number;
  wordsRead: number;
  orthographicAccuracy: number;
  durationSeconds: number;
}

export interface SentenceEvaluationResult {
  isValid: boolean;
  score: number; // 0-100
  syntaxFeedback: string;
  semanticFeedback: string;
  suggestedImprovement?: string;
}

