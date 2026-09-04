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
  id: 'sample-quantum-logistics',
  title: 'Module 4: Quantum Logistics & Supply Chains',
  type: 'pptx',
  originalName: 'Lecture4_Quantum_Logistics_Final.pptx',
  fileSize: 2450000,
  totalPagesOrSlides: 16,
  uploadedAt: Date.now() - 3600000 * 4,
  durationMinutes: 14,
  status: 'ready',
  rawText: 'Quantum computing applications in global logistics and supply chain optimization.',
  segments: [
    {
      id: 'seg-1',
      chapterIndex: 0,
      title: '1. Introduction to Quantum Routing & NP-Hard Challenges',
      slideNumber: 1,
      estimatedSeconds: 210,
      keyPoints: [
        'Traditional routing algorithms struggle with O(n!) combinatorial explosion',
        'Quantum annealing accelerates traveling salesperson simulations by 10,000x',
        'Commuter takeaway: Superposition allows evaluating millions of freight routes simultaneously'
      ],
      originalContent: 'Slide 1-4: Quantum algorithms in routing. Traveling Salesperson Problem (TSP) complexity. Comparison between Dijkstra classical graph traversal and Quantum Annealing on D-Wave architectures.',
      synthesizedAudioText: "Welcome to Module 4. Today on your commute, we're unpacking quantum logistics. Imagine you have a fleet of 50 delivery trucks navigating city gridlock. Classical computers choke because checking every route creates billions of combinations. But with quantum annealing, qubits exist in superpositions of multiple states at once, testing every path concurrently to find the global minimum energy state in seconds."
    },
    {
      id: 'seg-2',
      chapterIndex: 1,
      title: '2. Qubit Scaling & Hardware Decoherence',
      slideNumber: 5,
      estimatedSeconds: 240,
      keyPoints: [
        'Superconducting transmon qubits require cryogenic cooling below 15 millikelvin',
        'Thermal noise causes decoherence within 100 microseconds',
        'Error mitigation: Surface codes require 1,000 physical qubits per logical qubit'
      ],
      originalContent: 'Slide 5-9: Physical implementations of qubits. Superconducting loops vs trapped ions. The cryogenic dilution refrigerator environment. Coherence time T1 and T2 dephasing.',
      synthesizedAudioText: "Now let's talk hardware constraints. You can't just slap a quantum chip on a delivery van. These processors require dilution refrigerators running at 15 millikelvin—colder than deep space. Why? Because the slightest stray thermal photon knocks a qubit out of its delicate superposition state. That loss of information is called decoherence."
    },
    {
      id: 'seg-3',
      chapterIndex: 2,
      title: '3. Quantum Advantage in Maritime Shipping',
      slideNumber: 10,
      estimatedSeconds: 195,
      keyPoints: [
        'Container ship stowage planning has factorial constraints',
        'QAOA (Quantum Approximate Optimization Algorithm) deployed on NISQ devices',
        'Midterm exam alert: Understand difference between Grover speedup and Shor factoring'
      ],
      originalContent: 'Slide 10-14: Real world applications in maritime container placement and fuel efficiency. Port of Rotterdam pilot using QAOA heuristic on noisy intermediate-scale quantum (NISQ) systems.',
      synthesizedAudioText: 'Moving to maritime shipping. When a mega-container ship arrives in port, cranes spend hours playing 3D Tetris with thousands of 40-foot steel boxes. Re-handling misplaced containers costs millions in fuel and port demurrage. By executing the Quantum Approximate Optimization Algorithm on NISQ devices, port operators have demonstrated a twelve percent reduction in crane crane cycle turnaround time.'
    },
    {
      id: 'seg-4',
      chapterIndex: 3,
      title: '4. Future Horizons & Final Review',
      slideNumber: 15,
      estimatedSeconds: 180,
      keyPoints: [
        'Hybrid classical-quantum computing workflows will dominate the next 5 years',
        'Review: Quantum Annealing vs Universal Gate Arrays',
        'Action item: Memorize Grover amplitude amplification step'
      ],
      originalContent: 'Slide 15-16: Summary and key takeaways. Homework problem set 4 due Friday.',
      synthesizedAudioText: "To wrap up today's commute session: The future of supply chains isn't purely quantum, but hybrid. Classical microprocessors handle inventory UI, while cloud quantum co-processors optimize fleet routing. Keep this in mind for the mid-term: Grover is quadratic, Shor is polynomial, and annealing targets combinatorial optimization."
    }
  ]
};

export const sampleNotes: CommuteNote[] = [
  {
    id: 'note-1',
    documentId: 'sample-quantum-logistics',
    documentTitle: 'Module 4: Quantum Logistics',
    chapterId: 'seg-1',
    chapterTitle: '1. Introduction to Quantum Routing',
    timestampSeconds: 45,
    timestampFormatted: '00:45',
    rawTranscription: 'remember that quantum annealing is used for traveling salesperson optimization on d-wave',
    synthesizedContent: 'Quantum Annealing: Specifically deployed for combinatorial optimization (TSP problem) by finding lowest energy state.',
    category: 'concept',
    createdAt: Date.now() - 3600000 * 2
  },
  {
    id: 'note-2',
    documentId: 'sample-quantum-logistics',
    documentTitle: 'Module 4: Quantum Logistics',
    chapterId: 'seg-3',
    chapterTitle: '3. Shor & Grover Speedups',
    timestampSeconds: 120,
    timestampFormatted: '02:00',
    rawTranscription: 'prof said grovers algorithm quadratic speed up is 100 percent going to be on the midterm exam',
    synthesizedContent: 'MIDTERM ALERT: Understand Grover’s O(√N) quadratic speedup for unstructured search vs Shor’s polynomial factorization.',
    category: 'exam',
    createdAt: Date.now() - 3600000 * 1
  },
  {
    id: 'note-3',
    documentId: 'sample-quantum-logistics',
    documentTitle: 'Module 4: Quantum Logistics',
    chapterId: 'seg-4',
    chapterTitle: '4. Future Horizons',
    timestampSeconds: 60,
    timestampFormatted: '01:00',
    rawTranscription: 'finish homework problem set 4 before friday 5pm',
    synthesizedContent: 'Submit Problem Set 4 on Hybrid Quantum Logistics by Friday 5:00 PM on Canvas.',
    category: 'action',
    createdAt: Date.now() - 1800000
  }
];

export async function seedInitialDataIfEmpty() {
  // Clean up any test documents
  await db.documents.delete('masbev-hse-plan');
  await db.documents.delete('masbev-hse-plan-doc');

  const count = await db.documents.count();
  if (count === 0) {
    await db.documents.add(sampleDoc);
    await db.notes.bulkAdd(sampleNotes);
  }
}
