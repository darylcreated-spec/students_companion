import Dexie, { type Table } from 'dexie';
import { LectureDocument, CommuteNote, AppSettings, TextHighlight } from '../types';

export class CompanionDatabase extends Dexie {
  documents!: Table<LectureDocument, string>;
  notes!: Table<CommuteNote, string>;
  highlights!: Table<TextHighlight, string>;
  settings!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('StudentsCompanionDB');
    this.version(2).stores({
      documents: 'id, title, type, uploadedAt, status',
      notes: 'id, documentId, category, createdAt, timestampSeconds',
      highlights: 'id, documentId, chapterIndex, createdAt',
      settings: 'key'
    });
  }
}

export const db = new CompanionDatabase();

// Default initial settings
export const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: typeof localStorage !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') || '' : '',
  googleCloudTtsKey: typeof localStorage !== 'undefined' ? localStorage.getItem('GOOGLE_TTS_KEY') || '' : '',
  selectedLanguage: 'en-US',
  autoResumeAfterNote: true,
  speechPitch: 1.0,
  speechRate: 1.0,
  hapticFeedbackEnabled: true,
  commuteSafeMode: false,
};

export const sampleDoc: LectureDocument = {
  id: 'sample-companion-guide',
  title: "The Student's Companion: How It Works & Master Guide",
  type: 'pdf',
  originalName: 'Students_Companion_Interactive_Guide.pdf',
  fileSize: 385000,
  totalPagesOrSlides: 6,
  uploadedAt: Date.now() - 3600000 * 2,
  durationMinutes: 12,
  status: 'ready',
  rawText: "Comprehensive operational guide and interactive walkthrough of The Student's Companion hands-free commute audio, interactive e-book reader, active recall quiz, and transcriber.",
  segments: [
    {
      id: 'seg-guide-1',
      chapterIndex: 0,
      title: '1. Welcome & Hands-Free Commute Audio',
      slideNumber: 1,
      estimatedSeconds: 150,
      keyPoints: [
        'Hands-Free Commute Audio: Converts textbooks, lecture slides, and PDFs into natural spoken audio for your travel.',
        'Commute Auto-Bookmark: Automatically remembers your exact second and sentence when you pause, so you can resume on your next trip.',
        'Zero Cloud Dependency: Runs 100% offline from your local device vault with zero cellular data needed.'
      ],
      originalContent: "Chapter 1: Welcome to The Student's Companion. Turn travel time into active study sessions with hands-free commute audio lectures and auto-bookmarking.",
      synthesizedAudioText: "Welcome to The Student's Companion. This app transforms your daily commute into productive study time by turning PDFs, lecture slides, and notes into intelligent spoken audio. When you arrive at your bus stop or destination, simply pause the audio. The app automatically saves a commute bookmark. The next time you open the app, tap 'Resume Commute' to pick up right at that exact second."
    },
    {
      id: 'seg-guide-2',
      chapterIndex: 1,
      title: '2. Interactive E-Book Reader & Sentence Seeking',
      slideNumber: 2,
      estimatedSeconds: 160,
      keyPoints: [
        'Arbitrary Sentence Seeking: Tap any sentence on your screen and select Start Reading to jump audio playback instantly to that point.',
        'Customizable Typography: Switch between Serif and Sans fonts, scale text sizes, and toggle Dark, Sepia, or OLED nocturnal themes.',
        'Instant Dictionary Lookup: Tap Define or use the search bar to look up word meanings with phonetic pronunciation audio.'
      ],
      originalContent: 'Chapter 2: Interactive Reader controls, sentence-level seeking, teleprompter auto-scrolling, typography settings, and instant dictionary search.',
      synthesizedAudioText: "Our live reading window is fully interactive. Tap any sentence you see right here on your screen. An action toolbar will appear allowing you to select 'Start Reading' from that exact sentence, or look up unfamiliar terms with our built-in dictionary. You can toggle between E-Book and Teleprompter modes, switch between Serif and Sans typography, and choose Dark, Sepia, or OLED black themes for night reading."
    },
    {
      id: 'seg-guide-3',
      chapterIndex: 2,
      title: '3. Journey Highlights & Commute Takeaway Playlist',
      slideNumber: 3,
      estimatedSeconds: 155,
      keyPoints: [
        '4-Color Takeaway System: Amber for Key Takeaways, Cyan for Core Concepts, Emerald for Exam Flags, and Purple for Formulas.',
        'Commute Highlights Queue: Tap the Highlights button in the top action bar to play a condensed audio playlist of only your marked takeaways.',
        'Offline Highlight Vault: All highlights are indexed in your local browser database and can be exported into your study notes.'
      ],
      originalContent: 'Chapter 3: The 4-color highlighting palette and the Journey Highlights sequential audio player.',
      synthesizedAudioText: "While reading, you can highlight sentences using our four-color system: Amber for core takeaways, Cyan for key concepts, Emerald for exam review alerts, and Purple for formulas. Best of all, tap the 'Highlights' button in your top action bar anytime during your commute to hear a condensed audio review of only your highlighted takeaways, linked together seamlessly with audio chimes."
    },
    {
      id: 'seg-guide-4',
      chapterIndex: 3,
      title: '4. Active Recall Audio Flashcards & Commute Quiz',
      slideNumber: 4,
      estimatedSeconds: 140,
      keyPoints: [
        'Active Recall Methodology: Spoken questions prompt mental recall before the answer is revealed to maximize retention.',
        'Commute Flashcard Deck: Tap Quiz in the action bar to practice chapter flashcards hands-free while walking or riding.',
        'Timed Recall Countdown: A 4-second anticipation timer challenges you to answer out loud before audio reveals the solution.'
      ],
      originalContent: 'Chapter 4: Active Recall flashcard mode, countdown timers, and spoken audio quiz playback.',
      synthesizedAudioText: "Active recall is proven to be the most effective study method for long-term retention. Tap the 'Quiz' button in your action bar to enter Audio Flashcards mode. The app will speak the question aloud, start a four-second recall countdown to let you answer out loud, and then reveal the correct explanation. It is the ultimate hands-free practice test for transit."
    },
    {
      id: 'seg-guide-5',
      chapterIndex: 4,
      title: '5. Transcriber Dictation, Spoken Punctuation & Exports',
      slideNumber: 5,
      estimatedSeconds: 165,
      keyPoints: [
        'Hands-Free Voice Dictation: Speak thoughts on the go with real-time speech-to-text and live audio waveform feedback.',
        'Spoken Punctuation Engine: Speak words like comma, period, question mark, or new line, and tap Auto-Punctuate for formatted notes.',
        'Multi-Format Note Exports: Instant one-tap download to TXT, PDF, Word DOCX, and Anki study flashcard decks (.tsv).'
      ],
      originalContent: 'Chapter 5: Transcriber mode, voice dictation, automatic punctuation conversion, and export formats.',
      synthesizedAudioText: "When inspiration strikes on your walk, switch to the Transcriber tab. Tap the microphone to record your voice notes hands-free. You can speak punctuation naturally—saying 'comma', 'period', 'question mark', or 'new line'. Tap 'Auto-Punctuate' to convert spoken words into clean formatting, then export your notes in one tap to TXT, PDF, Word DOCX, or Anki flashcards."
    },
    {
      id: 'seg-guide-6',
      chapterIndex: 5,
      title: '6. Universal Ingestion & 100% Offline PWA',
      slideNumber: 6,
      estimatedSeconds: 150,
      keyPoints: [
        'Multi-Format Ingestion: Tap + File to upload PDFs, Word documents, PowerPoint presentations, text files, or scan book pages with your camera.',
        '100% Offline Vault: All documents, audio synthesis, and study notes operate fully offline in your device IndexedDB vault.',
        'Install to Home Screen: Add Student\'s Companion to your phone launcher for a native full-screen app experience.'
      ],
      originalContent: 'Chapter 6: Universal ingestion portal, camera batch scanner, offline vault architecture, and PWA installation.',
      synthesizedAudioText: "To add your own course materials, tap '+ File' in the action bar. You can upload PDFs, Word files, PowerPoint presentations, or take multi-page photos of textbook pages with our camera scanner. The app processes everything completely on your device and stores it in your offline vault. Install Student's Companion to your home screen today for a distraction-free, native study experience anywhere."
    }
  ]
};

export const sampleNotes: CommuteNote[] = [
  {
    id: 'note-guide-1',
    documentId: 'sample-companion-guide',
    documentTitle: "The Student's Companion Guide",
    chapterId: 'seg-guide-1',
    chapterTitle: '1. Welcome & Hands-Free Commute Audio',
    timestampSeconds: 30,
    timestampFormatted: '00:30',
    rawTranscription: 'remember that commute bookmark preserves your exact sentence when pausing',
    synthesizedContent: 'Commute Auto-Bookmark: Automatically saves chapter, sentence, and timestamp when stopping playback.',
    category: 'concept',
    createdAt: Date.now() - 3600000 * 2
  },
  {
    id: 'note-guide-2',
    documentId: 'sample-companion-guide',
    documentTitle: "The Student's Companion Guide",
    chapterId: 'seg-guide-3',
    chapterTitle: '3. Journey Highlights',
    timestampSeconds: 45,
    timestampFormatted: '00:45',
    rawTranscription: 'use journey highlights before exams to listen to only the critical takeaways',
    synthesizedContent: 'EXAM REVIEW: Tap Highlights in the top bar to listen to an audio playlist of only your marked takeaways before class.',
    category: 'exam',
    createdAt: Date.now() - 3600000 * 1
  },
  {
    id: 'note-guide-3',
    documentId: 'sample-companion-guide',
    documentTitle: "The Student's Companion Guide",
    chapterId: 'seg-guide-6',
    chapterTitle: '6. Universal Ingestion & Offline PWA',
    timestampSeconds: 40,
    timestampFormatted: '00:40',
    rawTranscription: 'tap add file to upload course syllabus and lecture slides for commute study',
    synthesizedContent: 'Action Item: Tap + File to ingest your syllabus and lecture slides into your local offline vault.',
    category: 'action',
    createdAt: Date.now() - 1800000
  }
];

export const sampleHighlights: TextHighlight[] = [
  {
    id: 'hl-guide-1',
    documentId: 'sample-companion-guide',
    chapterIndex: 0,
    sentenceIndex: 0,
    color: 'amber',
    text: "Welcome to The Student's Companion.",
    createdAt: Date.now() - 3600000 * 3,
  },
  {
    id: 'hl-guide-2',
    documentId: 'sample-companion-guide',
    chapterIndex: 1,
    sentenceIndex: 1,
    color: 'cyan',
    text: "Tap any sentence you see right here on your screen.",
    createdAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'hl-guide-3',
    documentId: 'sample-companion-guide',
    chapterIndex: 2,
    sentenceIndex: 0,
    color: 'emerald',
    text: "While reading, you can highlight sentences using our four-color system: Amber for core takeaways, Cyan for key concepts, Emerald for exam review alerts, and Purple for formulas.",
    createdAt: Date.now() - 3600000 * 1,
  },
  {
    id: 'hl-guide-4',
    documentId: 'sample-companion-guide',
    chapterIndex: 4,
    sentenceIndex: 2,
    color: 'purple',
    text: "You can speak punctuation naturally—saying 'comma', 'period', 'question mark', or 'new line'.",
    createdAt: Date.now() - 1800000,
  },
];

export async function seedInitialDataIfEmpty() {
  // Clean up any test or legacy sample documents
  await db.documents.delete('masbev-hse-plan');
  await db.documents.delete('masbev-hse-plan-doc');
  await db.documents.delete('sample-quantum-logistics');
  await db.notes.where('documentId').equals('sample-quantum-logistics').delete();
  await db.highlights.where('documentId').equals('sample-quantum-logistics').delete();

  const guideExists = await db.documents.get('sample-companion-guide');
  if (!guideExists) {
    await db.documents.put(sampleDoc);
    await db.notes.bulkPut(sampleNotes);
    await db.highlights.bulkPut(sampleHighlights);
  }
}
