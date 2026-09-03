import Dexie, { type Table } from 'dexie';
import { LectureDocument, CommuteNote, AppSettings } from '../types';

export class CompanionDatabase extends Dexie {
  documents!: Table<LectureDocument, string>;
  notes!: Table<CommuteNote, string>;
  settings!: Table<{ key: string; value: any }, string>;

  constructor() {
    super('StudentsCompanionDB');
    this.version(1).stores({
      documents: 'id, title, type, uploadedAt, status',
      notes: 'id, documentId, category, createdAt, timestampSeconds',
      settings: 'key'
    });
  }
}

export const db = new CompanionDatabase();

// Default initial settings
export const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: localStorage.getItem('GEMINI_API_KEY') || '',
  googleCloudTtsKey: localStorage.getItem('GOOGLE_TTS_KEY') || '',
  selectedLanguage: 'en-US',
  autoResumeAfterNote: true,
  speechPitch: 1.0,
  speechRate: 1.0,
  hapticFeedbackEnabled: true,
  commuteSafeMode: false,
};

// Initialize DB with sample lecture if empty
export async function seedInitialDataIfEmpty() {
  const count = await db.documents.count();
  if (count === 0) {
    const sampleDoc: LectureDocument = {
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
          title: '2. Qubit Superposition & Supply Chain Resilience',
          slideNumber: 5,
          estimatedSeconds: 260,
          keyPoints: [
            'Superposition enables simultaneous multi-path probabilistic state evaluation',
            'Decoherence noise mitigation remains the primary hardware hurdle',
            'Supply chain resilience score increases 45% when using probabilistic quantum modeling'
          ],
          originalContent: 'Slide 5-9: Superposition equations |Psi> = alpha|0> + beta|1>. Noise cancellation and environmental thermal decoherence. Real-time port disruption forecasting.',
          synthesizedAudioText: "Let's dive into qubit superposition. In classical binary logic, a port is either open with a bit value of zero, or closed with a one. Quantum logic allows a state vector alpha zero plus beta one. This lets supply chain models anticipate volatile shipping port bottlenecks before they physically manifest, giving logistics operators hours of advance warning."
        },
        {
          id: 'seg-3',
          chapterIndex: 2,
          title: '3. Shor & Grover Speedups in Warehouse Inventory',
          slideNumber: 10,
          estimatedSeconds: 240,
          keyPoints: [
            'Grover’s algorithm provides quadratic speedup O(sqrt(N)) for unstructured search',
            'Warehouse inventory retrieval indexed across millions of SKU permutations',
            'Exam Flag: Understand quadratic vs polynomial speedup differences'
          ],
          originalContent: 'Slide 10-14: Grover Algorithm speedup. Amplitude amplification. Unstructured database lookup for automated robotic fulfillment centers.',
          synthesizedAudioText: "Here is an essential exam concept: Grover's search algorithm provides a quadratic speedup for unstructured databases. If an Amazon robotic warehouse has 100 million inventory items, a classical linear search takes up to 100 million operations. Grover's algorithm finds the optimal SKU in just the square root of N—that is roughly 10,000 steps!"
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

    await db.documents.add(sampleDoc);

    // Add initial sample notes
    const sampleNotes: CommuteNote[] = [
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

    await db.notes.bulkAdd(sampleNotes);
  }
}
