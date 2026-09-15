import { ImmersionPassage, ReadingDomain, LexileBand } from '../../types';

export const IMMERSION_PASSAGES: ImmersionPassage[] = [
  // ================= 1. PHILOSOPHY (1000L) =================
  {
    id: 'phil-1000',
    domain: 'Philosophy',
    lexile: '1000L',
    title: 'The Architecture of Certainty',
    subtitle: 'Epistemology, reason, and empirical inquiry in ancient and modern thought',
    wordCount: 465,
    targetWords: [
      {
        word: 'Empirical',
        phonetic: '/ɛmˈpɪrɪkəl/',
        syllables: ['em', 'pir', 'i', 'cal'],
        partOfSpeech: 'adjective',
        definition: 'Based on, concerned with, or verifiable by observation or experience rather than theory or pure logic.',
        morphemes: {
          prefix: 'em-',
          root: 'pir (peira: trial, attempt)',
          suffix: '-ical',
          meaning: 'Originating from direct testing or observable experience.'
        },
        orthographicRule: {
          title: 'Vowel Harmony in Suffixes (-ical)',
          explanation: 'When adding the suffix -ical to a root ending in -ic, maintain the soft c sound before the vowel.',
          example: 'Empiric + al = Empirical; Logic + al = Logical.'
        },
        exampleSentence: 'Philosophers demanded empirical evidence before declaring a hypothesis true.'
      },
      {
        word: 'Articulate',
        phonetic: '/ɑːrˈtɪkjuleɪt/',
        syllables: ['ar', 'tic', 'u', 'late'],
        partOfSpeech: 'verb / adjective',
        definition: 'To express an idea or feeling fluently, coherently, and distinctly.',
        morphemes: {
          root: 'articulus (joint, small part)',
          suffix: '-ate',
          meaning: 'To connect distinct segments or sounds into a cohesive whole.'
        },
        orthographicRule: {
          title: 'Alternating Stress and Pronunciation Shift',
          explanation: 'As a verb, "-ate" is pronounced /eɪt/ (articu-LATE); as an adjective, it reduces to a schwa /ət/ (articu-lit).',
          example: 'He will articulate (verb) his ideas in an articulate (adj) manner.'
        },
        exampleSentence: 'Socrates urged his disciples to articulate their assumptions with precision.'
      },
      {
        word: 'Dialectic',
        phonetic: '/ˌdaɪəˈlɛktɪk/',
        syllables: ['di', 'a', 'lec', 'tic'],
        partOfSpeech: 'noun',
        definition: 'The discourse between two opposing viewpoints seeking to establish truth through reasoned arguments.',
        morphemes: {
          prefix: 'dia- (across, between)',
          root: 'lect (legein: to speak, choose)',
          suffix: '-ic',
          meaning: 'Speaking across differences to arrive at mutual insight.'
        },
        orthographicRule: {
          title: 'The Greek "dia-" Prefix',
          explanation: 'The prefix "dia-" signifies through or across. Before vowels, it retains both syllables (di-a).',
          example: 'Dialogue, Diameter, Dialectic.'
        },
        exampleSentence: 'Through patient dialectic, opposing thinkers reconciled their ethical differences.'
      },
      {
        word: 'Dogmatic',
        phonetic: '/dɔːɡˈmætɪk/',
        syllables: ['dog', 'mat', 'ic'],
        partOfSpeech: 'adjective',
        definition: 'Inclined to lay down principles as undeniably true, without consideration of evidence or the opinions of others.',
        morphemes: {
          root: 'dogma (opinion, tenet)',
          suffix: '-ic',
          meaning: 'Characterized by rigid or unexamined doctrine.'
        },
        orthographicRule: {
          title: 'Doubling and Medial Consonant Clusters',
          explanation: 'The letter cluster "-gm-" retains both phonetic consonants in English words derived from Greek.',
          example: 'Dogmatic, Pragmatic, Paradigm.'
        },
        exampleSentence: 'Critical thinkers resist dogmatic claims that forbid rigorous inquiry.'
      }
    ],
    checkpoints: [
      {
        id: 'cp-phil-1',
        wordOffset: 195,
        question: 'According to the first part of the text, why did thinkers begin to favor empirical observation over pure theory?',
        options: [
          'Because observation tests theories against observable reality rather than untested assumptions',
          'Because ancient philosophers disliked using books and writing',
          'Because mathematics was completely banned from academic discussion'
        ],
        correctIndex: 0,
        explanation: 'Empirical inquiry tests claims through direct observation and real-world testing, preventing errors born from untested speculation.'
      },
      {
        id: 'cp-phil-2',
        wordOffset: 380,
        question: 'How does dialectic differ from a hostile argument?',
        options: [
          'It seeks to find higher truth through reasoned cooperative discussion rather than merely winning',
          'It is spoken in Latin and forbidden in public spaces',
          'It requires both speakers to agree on every point before speaking'
        ],
        correctIndex: 0,
        explanation: 'Dialectic uses opposing perspectives constructively to uncover deeper truth, whereas pure arguments often seek only victory.'
      }
    ],
    content: `For millennia, human civilization struggled with a fundamental dilemma: how do we know what is genuinely true? In ancient academies, scholars often reasoned from abstract principles alone. If a theory sounded harmonious and elegant, it was celebrated as truth, even if no one had stepped outside to verify it in the physical world.

This changed when early natural philosophers began demanding empirical evidence. They argued that our senses, refined through systematic instruments, must be the bedrock of knowledge. An idea could no longer survive merely because a revered authority uttered it. It had to withstand observational scrutiny. Thinkers were forced to articulate their hypotheses with mathematical clarity, defining terms so precisely that any skeptic could replicate the experiment.

Yet empirical observation alone could not resolve every human enigma. What should we do when two reasonable people observe the same set of facts but interpret them with profound conflict? Here arose the noble art of dialectic. Rather than descending into shouting matches, thinkers sat opposite one another, treating disagreement not as an insult, but as an intellectual anvil upon which weak assumptions are hammered away.

Through this disciplined exchange, each speaker listened intently to identify contradictions in their own perspective. In doing so, they learned to cast aside dogmatic habits. The dogmatic mind clings rigidly to inherited traditions, fearing that any revision to its beliefs will cause its world to collapse. Conversely, the dialectic mind embraces intellectual humility. It understands that knowledge is not a museum of frozen dogmas, but an evolving river shaped by relentless questioning, careful speech, and honest evidence.`
  },

  // ================= 2. SCIENCE & TECHNOLOGY (1000L) =================
  {
    id: 'sci-1000',
    domain: 'Science',
    lexile: '1000L',
    title: 'The Rewired Brain: Neuroplasticity and Habit',
    subtitle: 'How synaptic plasticity and deliberate practice remodel human cognitive capacity',
    wordCount: 472,
    targetWords: [
      {
        word: 'Synthesize',
        phonetic: '/ˈsɪnθəsaɪz/',
        syllables: ['syn', 'the', 'size'],
        partOfSpeech: 'verb',
        definition: 'To combine a range of different ideas, facts, or substances into a unified, coherent whole.',
        morphemes: {
          prefix: 'syn- (together)',
          root: 'thesis (placing, putting)',
          suffix: '-ize',
          meaning: 'Placing disparate elements together to create a single entity.'
        },
        orthographicRule: {
          title: 'The Greek "syn-" Prefix Assimilation',
          explanation: 'Before /t/, /d/, or vowels, "syn-" retains its n; before /p/, /b/, /m/, it becomes "sym-" (sympathy, symptom).',
          example: 'Synthesis, Synchronize, Syntax.'
        },
        exampleSentence: 'Proficient learners synthesize multiple perspectives into clear comprehension.'
      },
      {
        word: 'Resilience',
        phonetic: '/rɪˈzɪljəns/',
        syllables: ['re', 'sil', 'ience'],
        partOfSpeech: 'noun',
        definition: 'The capacity to recover quickly from difficulties; psychological or physical toughness.',
        morphemes: {
          prefix: 're- (back, again)',
          root: 'salire (to leap, spring)',
          suffix: '-ience',
          meaning: 'The ability to spring back after being stretched or compressed.'
        },
        orthographicRule: {
          title: 'The "-ience" vs. "-ance" Suffix Decision',
          explanation: 'Latin second and third conjugation verbs typically generate nouns ending in "-ience" with an "i".',
          example: 'Resilience, Convenience, Obedience.'
        },
        exampleSentence: 'Cognitive resilience allows readers to push through challenging texts without quitting.'
      },
      {
        word: 'Anomalous',
        phonetic: '/əˈnɒmələs/',
        syllables: ['a', 'nom', 'a', 'lous'],
        partOfSpeech: 'adjective',
        definition: 'Deviating from what is standard, normal, or expected.',
        morphemes: {
          prefix: 'an- (not, without)',
          root: 'homalos (even, regular)',
          suffix: '-ous',
          meaning: 'Uneven or departing from regular patterns.'
        },
        orthographicRule: {
          title: 'Prefix "an-" Before Vowels',
          explanation: 'The negative prefix "a-" gains an "n" before vowel sounds to prevent a glottal stop.',
          example: 'Anomalous, Anonymous, Anarchy.'
        },
        exampleSentence: 'The neuroscientist noticed an anomalous spike in activity in the visual cortex.'
      },
      {
        word: 'Ubiquitous',
        phonetic: '/juːˈbɪkwɪtəs/',
        syllables: ['u', 'biq', 'ui', 'tous'],
        partOfSpeech: 'adjective',
        definition: 'Present, appearing, or found everywhere simultaneously.',
        morphemes: {
          root: 'ubique (everywhere)',
          suffix: '-ous',
          meaning: 'Characterized by being found in every quarter.'
        },
        orthographicRule: {
          title: 'The "qu" Digraph Pairing',
          explanation: 'In English orthography, "q" is virtually always followed by "u", functioning as a single sound unit /kw/.',
          example: 'Ubiquitous, Sequential, Equilibrium.'
        },
        exampleSentence: 'Smartphones have become ubiquitous across every modern learning environment.'
      }
    ],
    checkpoints: [
      {
        id: 'cp-sci-1',
        wordOffset: 210,
        question: 'What historical misconception about the human brain was overturned by neuroplasticity?',
        options: [
          'The old belief that the adult brain was fixed, rigid, and incapable of growing new pathways',
          'The idea that human beings only use ten percent of their lungs',
          'The belief that reading was an inherited physical organ rather than a learned skill'
        ],
        correctIndex: 0,
        explanation: 'For decades scientists assumed adult brains were hardwired. Neuroplasticity proved that focused practice dynamically rewires neural circuits at any age.'
      },
      {
        id: 'cp-sci-2',
        wordOffset: 390,
        question: 'Why is experiencing friction or difficulty essential during deliberate study?',
        options: [
          'Struggle signals the brain to reinforce synapses and build permanent structural resilience',
          'It ensures that students spend more money on study guides',
          'It proves that the subject matter should be avoided completely'
        ],
        correctIndex: 0,
        explanation: 'Cognitive struggle triggers myelin growth around neural pathways, forging resilience and making complex recall automatic.'
      }
    ],
    content: `For decades, medical textbooks taught a discouraging dogma: once human beings reach maturity, their brain architecture is largely unalterable. If an adult struggled with complex vocabulary, foreign languages, or abstract mathematics, it was assumed their biological hardware had simply set like dry cement.

Modern neuroscience has thoroughly dismantled that myth through the discovery of neuroplasticity. The brain is not a static machine; it is a living, adaptable network. Whenever you deliberately practice a challenging skill—such as decoding complex text or mapping unfamiliar spellings—your neurons synthesize new neurotransmitters and physically remodel their synaptic connections.

What initially appears anomalous—a reader suddenly advancing their vocabulary by several grades in just months—is actually the predictable outcome of deliberate practice. The brain responds directly to cognitive demands. When you encounter a challenging word, the momentary confusion you experience is not a sign of failure. It is the chemical trigger that tells your brain to adapt.

Today, digital distractions are ubiquitous. Notifications buzz incessantly, splintering attention and encouraging superficial skimming. To counteract this, students must cultivate cognitive resilience. By dedicating fifteen minutes of uninterrupted focus to reading dense texts, you train your attention networks to resist impulse. You show your brain that deep comprehension, patient inquiry, and focused literacy are essential priorities worth rewiring for.`
  },

  // ================= 3. CLASSICAL LITERATURE (800L) =================
  {
    id: 'lit-800',
    domain: 'Literature',
    lexile: '800L',
    title: 'Echoes Across the Horizon',
    subtitle: 'The timeless power of narrative voice, empathy, and literary perspective',
    wordCount: 440,
    targetWords: [
      {
        word: 'Melancholy',
        phonetic: '/ˈmɛlənkɒli/',
        syllables: ['mel', 'an', 'chol', 'y'],
        partOfSpeech: 'noun / adjective',
        definition: 'A deep, pensive, and long-lasting sadness or reflective state of mind.',
        morphemes: {
          prefix: 'melan- (black, dark)',
          root: 'chole (bile)',
          suffix: '-y',
          meaning: 'Originally ancient medicine for dark mood; now poetic sorrow.'
        },
        orthographicRule: {
          title: 'Greek "-ch-" Sounding Like /k/',
          explanation: 'Words derived from Greek with "ch" are pronounced as /k/ rather than the soft /tʃ/ of Anglo-Saxon.',
          example: 'Melancholy, Character, Chorus, Echo.'
        },
        exampleSentence: 'A gentle melancholy settled over the library as autumn leaves drifted past the window.'
      },
      {
        word: 'Transient',
        phonetic: '/ˈtrænziənt/',
        syllables: ['tran', 'sient'],
        partOfSpeech: 'adjective',
        definition: 'Lasting only for a short time; impermanent or fleeting.',
        morphemes: {
          prefix: 'trans- (across, beyond)',
          root: 'ire (to go)',
          suffix: '-ent',
          meaning: 'Passing quickly through or across.'
        },
        orthographicRule: {
          title: 'The "-sient" Phonetic Softening',
          explanation: 'The letter combination "-sient" often produces a soft /ʃənt/ or /ziənt/ glide in English speech.',
          example: 'Transient, Ancient, Patient.'
        },
        exampleSentence: 'The storm was transient, leaving clear stars and damp earth in its wake.'
      },
      {
        word: 'Benevolent',
        phonetic: '/bəˈnɛvələnt/',
        syllables: ['be', 'nev', 'o', 'lent'],
        partOfSpeech: 'adjective',
        definition: 'Well-meaning, kindly, and motivated by a desire to do good for others.',
        morphemes: {
          prefix: 'bene- (well, good)',
          root: 'volent (velle: to wish, will)',
          meaning: 'Possessing goodwill towards others.'
        },
        orthographicRule: {
          title: 'The Latin "bene-" Prefix',
          explanation: 'Always spelled b-e-n-e, this prefix signifies goodness or benefit, contrasting with "male-" (bad).',
          example: 'Benevolent, Beneficial, Benefactor.'
        },
        exampleSentence: 'The benevolent mentor guided young scholars with patient kindness.'
      },
      {
        word: 'Inevitable',
        phonetic: '/ɪnˈɛvɪtəbəl/',
        syllables: ['in', 'ev', 'i', 'ta', 'ble'],
        partOfSpeech: 'adjective',
        definition: 'Certain to happen; unavoidable.',
        morphemes: {
          prefix: 'in- (not)',
          root: 'evitabilis (avoidable)',
          suffix: '-able',
          meaning: 'That which cannot be steered away from or avoided.'
        },
        orthographicRule: {
          title: 'The "-able" vs. "-ible" Suffix Rule',
          explanation: 'Roots that cannot form complete standalone base words often take -able after Latin first-conjugation stems.',
          example: 'Inevitable, Capable, Hospitable.'
        },
        exampleSentence: 'Growth is the inevitable reward of regular, dedicated study.'
      }
    ],
    checkpoints: [
      {
        id: 'cp-lit-1',
        wordOffset: 200,
        question: 'What unique gift does literature provide that ordinary daily conversation often misses?',
        options: [
          'It lets us live inside the minds and emotions of other humans across centuries',
          'It provides a list of grammatical rules to memorize',
          'It forces everyone to read at the exact same speed'
        ],
        correctIndex: 0,
        explanation: 'Great literature creates radical empathy by letting readers inhabit the inner thoughts and struggles of characters across distant eras.'
      },
      {
        id: 'cp-lit-2',
        wordOffset: 370,
        question: 'Why does the author call our daily worries "transient"?',
        options: [
          'Because they pass quickly like clouds when viewed against the larger arc of history',
          'Because worries are permanently carved into stone',
          'Because feelings never change or fade'
        ],
        correctIndex: 0,
        explanation: 'Transient signifies something temporary and fleeting, reminding us that difficult moments pass with time.'
      }
    ],
    content: `When you open an old book, you cross an invisible bridge between centuries. You are no longer sitting alone in a quiet room; you are listening directly to a voice that spoke hundreds of years ago. Through literature, we discover that the joys, hopes, and anxieties of the human heart have remained remarkably constant.

Consider the gentle melancholy that often visits a character walking home at twilight. That quiet sadness is not an illness; it is a sign of a reflective soul contemplating life's vast mystery. In great stories, we meet benevolent companions—strangers who offer shelter or gentle wisdom simply because they believe in human goodness.

Stories also teach us perspective. When we are young, every hardship feels permanent. A failed test, a sharp rebuke, or a lost friendship seems like the end of the universe. Yet literature reminds us that our trials are transient. Like seasonal storms, they sweep across our lives, cause us to stumble, and then dissipate into memory.

Change is an inevitable companion of existence. By reading widely, we develop empathy for people whose backgrounds, languages, and eras are entirely different from our own. We realize that behind every unfamiliar face lies a complex narrative waiting to be understood.`
  },

  // ================= 4. CURRENT AFFAIRS (1200L) =================
  {
    id: 'curr-1200',
    domain: 'CurrentAffairs',
    lexile: '1200L',
    title: 'The Information Architecture of Democracy',
    subtitle: 'Algorithmic curation, civic discourse, and the defense of public deliberation',
    wordCount: 512,
    targetWords: [
      {
        word: 'Discourse',
        phonetic: '/ˈdɪskɔːrs/',
        syllables: ['dis', 'course'],
        partOfSpeech: 'noun',
        definition: 'Written or spoken communication or debate, particularly formal or public discussion.',
        morphemes: {
          prefix: 'dis- (apart, away)',
          root: 'currere (to run)',
          meaning: 'Running back and forth between minds in conversation.'
        },
        orthographicRule: {
          title: 'The "-our-" Vowel Team',
          explanation: 'In words like discourse and recourse, the -our- diphthong produces an /ɔːr/ sound in standard orthography.',
          example: 'Discourse, Source, Resource, Course.'
        },
        exampleSentence: 'Civilized discourse requires acknowledging nuance rather than trading slogans.'
      },
      {
        word: 'Disparity',
        phonetic: '/dɪˈspærɪti/',
        syllables: ['dis', 'par', 'i', 'ty'],
        partOfSpeech: 'noun',
        definition: 'A great difference, inequality, or noticeable lack of parity between things.',
        morphemes: {
          prefix: 'dis- (not, away)',
          root: 'par (equal)',
          suffix: '-ity',
          meaning: 'The state of being unequal or unbalanced.'
        },
        orthographicRule: {
          title: 'The "-ity" Noun Suffix Shift',
          explanation: 'Adding -ity shifts the primary stress to the syllable immediately preceding it (PAR-i-ty -> dis-PAR-i-ty).',
          example: 'Parity -> Disparity; Similar -> Similarity.'
        },
        exampleSentence: 'Analysts examined the growing economic disparity between metropolitan and rural hubs.'
      },
      {
        word: 'Scrutinize',
        phonetic: '/ˈskruːtɪnaɪz/',
        syllables: ['scru', 'ti', 'nize'],
        partOfSpeech: 'verb',
        definition: 'To examine or inspect closely, critically, and thoroughly.',
        morphemes: {
          root: 'scrutinium (search, inquiry from scruta: sorted rags)',
          suffix: '-ize',
          meaning: 'To sift meticulously through details to find the truth.'
        },
        orthographicRule: {
          title: 'The Suffix "-ize" in Analytical Verbs',
          explanation: 'Denotes the act of subjecting something to systematic process.',
          example: 'Scrutinize, Analyze, Categorize.'
        },
        exampleSentence: 'Voters must learn to scrutinize digital headlines before amplifying them.'
      },
      {
        word: 'Pragmatic',
        phonetic: '/præɡˈmætɪk/',
        syllables: ['prag', 'mat', 'ic'],
        partOfSpeech: 'adjective',
        definition: 'Dealing with things sensibly and realistically in a way that is based on practical rather than theoretical considerations.',
        morphemes: {
          root: 'pragma (deed, act)',
          suffix: '-ic',
          meaning: 'Grounded in actionable reality and concrete consequences.'
        },
        orthographicRule: {
          title: 'Hard "g" Before Consonants',
          explanation: 'The letter "g" followed immediately by "m" produces a crisp velar plosive /ɡ/.',
          example: 'Pragmatic, Syntagma, Phlegmatic.'
        },
        exampleSentence: 'The committee adopted a pragmatic solution that delivered immediate results.'
      }
    ],
    checkpoints: [
      {
        id: 'cp-curr-1',
        wordOffset: 240,
        question: 'How do engagement-maximizing algorithms adversely affect public civic discourse?',
        options: [
          'They prioritize sensationalism and outrage over thoughtful nuanced deliberation',
          'They increase the price of fiber optic cables across cities',
          'They force all news articles to be written in rhyme'
        ],
        correctIndex: 0,
        explanation: 'Algorithms optimized purely for time-on-screen elevate inflammatory content because outrage provokes rapid clicks, degrading civic discourse.'
      },
      {
        id: 'cp-curr-2',
        wordOffset: 440,
        question: 'What is the pragmatic remedy proposed for citizens navigating the modern information landscape?',
        options: [
          'Cultivating disciplined media literacy to scrutinize sources and verify claims before reacting',
          'Disconnecting electricity entirely across the nation',
          'Believing every anonymous post that appears in social feeds'
        ],
        correctIndex: 0,
        explanation: 'Pragmatic media literacy empowers individuals to critically verify and scrutinize sources rather than succumbing to emotional manipulation.'
      }
    ],
    content: `The vitality of any democratic society hinges upon the quality of its public discourse. When citizens possess the vocabulary and critical acumen to debate policies with nuance, collective governance thrives. Conversely, when discourse degenerates into tribal epithets and hyper-simplified soundbites, the institutions safeguarding freedom begin to fray.

In the twenty-first century, this challenge is magnified by algorithmic architecture. Digital platforms do not monetize moderation; their business models incentivize continuous engagement. Because moral indignation and sensationalism generate instant clicks, automated feeds frequently elevate inflammatory voices while burying calm analysis.

This dynamic exacerbates social disparity. Those equipped with rigorous information literacy can navigate digital echo chambers, scrutinizing claims against verifiable primary data. Meanwhile, audiences lacking critical reading stamina become vulnerable to manipulative narratives designed to provoke panic rather than promote understanding.

A healthy democracy cannot rely solely on regulatory edicts; it demands a pragmatic commitment from every citizen. We must train ourselves to pause before reacting, to question algorithmic bias, and to read long-form journalism that challenges our preconceptions. Active literacy is not an ornamental academic luxury. It is the indispensable cognitive shield of a free citizenry.`
  }
];

export class ImmersionPassageManager {
  public static getPassagesByDomain(domain: ReadingDomain): ImmersionPassage[] {
    return IMMERSION_PASSAGES.filter((p) => p.domain === domain);
  }

  public static getPassage(domain: ReadingDomain, lexile: LexileBand): ImmersionPassage {
    const found = IMMERSION_PASSAGES.find((p) => p.domain === domain && p.lexile === lexile);
    if (found) return found;
    const fallbackDomain = IMMERSION_PASSAGES.find((p) => p.domain === domain);
    return fallbackDomain || IMMERSION_PASSAGES[0];
  }

  public static getAllDomains(): ReadingDomain[] {
    return ['Philosophy', 'Science', 'Literature', 'CurrentAffairs'];
  }

  public static getAllLexileBands(): LexileBand[] {
    return ['800L', '1000L', '1200L'];
  }
}
