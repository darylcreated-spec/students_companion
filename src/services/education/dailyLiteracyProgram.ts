import { DailyLesson, UserLiteracyProgress } from '../../types';

export const DAILY_LESSONS: DailyLesson[] = [
  {
    id: 'lesson-1',
    dayNumber: 1,
    word: 'Persevere',
    phonetic: '/ˌpɜːrsəˈvɪr/',
    syllables: ['per', 'se', 'vere'],
    partOfSpeech: 'verb',
    friendlyDefinition: 'To keep going and continue trying your best, even when something is difficult or takes a long time.',
    sentenceExample: 'When you learn new words every morning, you persevere through the hard parts until reading feels natural.',
    memoryTrick: "Break it down: 'per' + 'severe'. Even severe obstacles fade when you per-severe!",
    rootOrigin: 'From Latin perseverare: "per" (thoroughly) + "severus" (strict, earnest).',
    spellingHint: 'Watch the three "e" vowels: p-E-r-s-E-v-E-r-e. No "a" or "i" in this word!',
    readingTitle: 'The Power of Showing Up',
    readingPassage: 'Nobody is born an expert reader or speller. Every person you admire had to start with simple words and stumble before finding their stride. The secret is choosing to persevere. When you spend five focused minutes reading and writing each morning on your commute, your brain builds permanent neural pathways. Soon, words that once looked intimidating become effortless friends.',
    comprehensionQuestion: 'According to the passage, what is the secret to building strong reading skills?',
    comprehensionOptions: [
      'Choosing to persevere with consistent daily practice',
      'Memorizing an entire dictionary in one night',
      'Never making any spelling mistakes'
    ],
    correctOptionIndex: 0,
    comprehensionExplanation: 'Consistent daily perseverance rewires your neural pathways so words become second nature!'
  },
  {
    id: 'lesson-2',
    dayNumber: 2,
    word: 'Research',
    phonetic: '/ˈriːsɜːrtʃ/',
    syllables: ['re', 'search'],
    partOfSpeech: 'noun / verb',
    friendlyDefinition: 'A careful, systematic study to discover new facts, verify information, and reach new conclusions.',
    sentenceExample: 'She did thorough research on her lecture topic before presenting to the class.',
    memoryTrick: "Look at the word: 're' (again) + 'search' (to look). Research literally means to search again thoroughly!",
    rootOrigin: 'From Old French recercher: "re-" (intensive prefix) + "cerchier" (to search).',
    spellingHint: 'Contains the "ear" vowel team that sounds like "er": r-E-A-R-c-h. Remember to include the letter "a" inside search!',
    readingTitle: 'The Joy of Discovery',
    readingPassage: 'Curiosity is the engine of human progress. When you don’t know an answer, you don’t have to guess—you can research the facts. Good research involves looking at multiple reliable sources, asking clear questions, and taking clear notes. The more you explore, the more connected all of human knowledge feels.',
    comprehensionQuestion: 'Why does the word "research" have the prefix "re-"?',
    comprehensionOptions: [
      'Because it means to search repeatedly and thoroughly',
      'Because it stands for reading',
      'Because it comes from the word reverse'
    ],
    correctOptionIndex: 0,
    comprehensionExplanation: 'The prefix "re-" means again or intensive—searching deeply again and again!'
  },
  {
    id: 'lesson-3',
    dayNumber: 3,
    word: 'Articulate',
    phonetic: '/ɑːrˈtɪkjuleɪt/',
    syllables: ['ar', 'tic', 'u', 'late'],
    partOfSpeech: 'adjective / verb',
    friendlyDefinition: 'Able to express thoughts and ideas clearly, effectively, and fluently in spoken or written words.',
    sentenceExample: 'Expanding your vocabulary helps you articulate your thoughts with confidence and clarity.',
    memoryTrick: 'Think of "article" + "late": an articulate speaker could write an article without delay!',
    rootOrigin: 'From Latin articulare: "to divide into distinct joints or clear vocal sounds".',
    spellingHint: 'Four distinct syllables: ar-tic-u-late. Notice the single "c" in "tic" and single "t" in "late".',
    readingTitle: 'Finding Your Voice',
    readingPassage: 'Have you ever had a brilliant idea trapped in your head that you struggled to explain? That feeling is why vocabulary matters. When you have the right words at your disposal, you can articulate complex thoughts with ease. People listen closely to someone who speaks with precision and genuine care.',
    comprehensionQuestion: 'What is the main benefit of becoming more articulate?',
    comprehensionOptions: [
      'Expressing your ideas clearly so others understand you easily',
      'Talking louder than everyone else',
      'Using the longest possible words'
    ],
    correctOptionIndex: 0,
    comprehensionExplanation: 'Being articulate is about clarity, precision, and helping others understand your vision.'
  },
  {
    id: 'lesson-4',
    dayNumber: 4,
    word: 'Vocabulary',
    phonetic: '/voʊˈkæbjəleri/',
    syllables: ['vo', 'cab', 'u', 'lar', 'y'],
    partOfSpeech: 'noun',
    friendlyDefinition: 'All the words known, used, or understood by a person in a language or subject.',
    sentenceExample: 'Every new word added to your vocabulary is another key to unlock books and conversations.',
    memoryTrick: 'Related to "vocal" and "voice". Your vocabulary gives power to your vocal voice!',
    rootOrigin: 'From Latin vocabularius, from vocabulum ("a word, name"), from vocare ("to call, speak").',
    spellingHint: 'Five rhythmic beats: vo-cab-u-lar-y. Watch the "u-l-a-r" ending—not "uler" or "ularly".',
    readingTitle: 'Words as Building Blocks',
    readingPassage: 'A rich vocabulary is like an artist having a box with sixty-four colors instead of just four crayons. With more words, you can describe subtle emotions, understand challenging textbooks, and appreciate great literature. Learning just one word a day adds over 360 words to your mind every year.',
    comprehensionQuestion: 'How does the passage compare vocabulary to an artist?',
    comprehensionOptions: [
      'Like having a box of sixty-four colored pencils instead of just four',
      'Like buying an expensive painting',
      'Like drawing with invisible ink'
    ],
    correctOptionIndex: 0,
    comprehensionExplanation: 'More words give you more colors to paint your thoughts and understand the world.'
  },
  {
    id: 'lesson-5',
    dayNumber: 5,
    word: 'Conscientious',
    phonetic: '/ˌkɑːnʃiˈenʃəs/',
    syllables: ['con', 'sci', 'en', 'tious'],
    partOfSpeech: 'adjective',
    friendlyDefinition: 'Wishing to do what is right; thorough, careful, and paying close attention to quality.',
    sentenceExample: 'A conscientious student double-checks their notes and reviews spelling patterns.',
    memoryTrick: "Notice the secret word inside: 'con' + 'SCIENCE' + 'tious'. A conscientious person uses science and care!",
    rootOrigin: 'From Latin conscientia ("knowledge within oneself, conscience").',
    spellingHint: 'The trickiest part is "sci" (like science) followed by "en" and "tious" (which sounds like "shus").',
    readingTitle: 'The Craft of Care',
    readingPassage: 'Rushing through tasks often creates double the work. A conscientious worker takes a breath, checks the details, and takes pride in a job well done. In reading and writing, being conscientious means noticing how words are built and listening to how they sound before clicking submit.',
    comprehensionQuestion: 'What hidden English word is inside "conscientious"?',
    comprehensionOptions: [
      'Science',
      'Center',
      'Sentence'
    ],
    correctOptionIndex: 0,
    comprehensionExplanation: 'Con-SCIENCE-tious! Remembering "science" helps you spell the middle syllable perfectly.'
  },
  {
    id: 'lesson-6',
    dayNumber: 6,
    word: 'Synthesize',
    phonetic: '/ˈsɪnθəsaɪz/',
    syllables: ['syn', 'the', 'size'],
    partOfSpeech: 'verb',
    friendlyDefinition: 'To combine different ideas, facts, or pieces of information together into a single unified whole.',
    sentenceExample: 'In your lecture notes, synthesize what the professor said with the textbook diagrams.',
    memoryTrick: "'Syn-' means together (like synonym or symphony). To synthesize is to put ideas together in size!",
    rootOrigin: 'From Greek synthesis: "syn" (together) + "tithenai" (to place, put).',
    spellingHint: 'Starts with "syn-" using the letter "y". Ends with "-ize" (or "-ise" in UK English).',
    readingTitle: 'Connecting the Dots',
    readingPassage: 'Great thinkers do not just memorize isolated facts. They take an insight from history, combine it with a concept from biology, and synthesize a creative solution to a modern problem. When you read broadly, your brain naturally connects disparate ideas into wisdom.',
    comprehensionQuestion: 'What does the prefix "syn-" mean in synthesize and symphony?',
    comprehensionOptions: [
      'Together or with',
      'Against or opposite',
      'Slowly or quiet'
    ],
    correctOptionIndex: 0,
    comprehensionExplanation: 'Syn- means together! In synthesis, you place different thoughts together.'
  },
  {
    id: 'lesson-7',
    dayNumber: 7,
    word: 'Essential',
    phonetic: '/ɪˈsenʃəl/',
    syllables: ['es', 'sen', 'tial'],
    partOfSpeech: 'adjective',
    friendlyDefinition: 'Extremely important and absolutely necessary; something you cannot do without.',
    sentenceExample: 'Consistent daily review is an essential ingredient for building permanent memory.',
    memoryTrick: 'Double "s" in essential: it is ESSENTIAL to have both S’s for Success!',
    rootOrigin: 'From Latin essentia ("being, essence"), from esse ("to be").',
    spellingHint: 'Notice the double "ss": e-s-s-e-n. And the "-tial" ending that sounds like "shul".',
    readingTitle: 'Focusing on What Matters',
    readingPassage: 'Our days are crowded with distractions—notifications, advertisements, and noise. Successful learners ask themselves one simple question: What is truly essential today? Prioritizing your health, your growth, and your education ensures that your energy flows where it matters most.',
    comprehensionQuestion: 'What spelling pattern gives the "shul" sound in "essential"?',
    comprehensionOptions: [
      '-tial',
      '-shull',
      '-chl'
    ],
    correctOptionIndex: 0,
    comprehensionExplanation: 'The Latin suffix "-tial" produces the smooth "shul" sound in words like essential and partial.'
  },
  {
    id: 'lesson-8',
    dayNumber: 8,
    word: 'Separate',
    phonetic: '/ˈsepəreɪt/',
    syllables: ['sep', 'a', 'rate'],
    partOfSpeech: 'verb / adjective',
    friendlyDefinition: 'To keep apart, divide, or distinguish as distinct and independent units.',
    sentenceExample: 'Always separate complex study chapters into small, digestible paragraphs.',
    memoryTrick: 'Classic spelling rule: There is "A RAT" in sep-A-RAT-e!',
    rootOrigin: 'From Latin separare: "se-" (apart) + "parare" (to prepare, make ready).',
    spellingHint: 'The most commonly misspelled vowel is the middle "a": s-e-p-A-r-a-t-e. Never write "seperate"!',
    readingTitle: 'The Beauty of Focus',
    readingPassage: 'When you try to study math, answer text messages, and cook dinner at the exact same moment, your brain overheats. It is far more effective to separate your hours. Give thirty minutes of pure focus to one task, take a five-minute break, and then move to the next.',
    comprehensionQuestion: 'What is the famous memory trick for spelling "separate"?',
    comprehensionOptions: [
      'There is "A RAT" in separate',
      'Separate has two double letters',
      'It rhymes with celery'
    ],
    correctOptionIndex: 0,
    comprehensionExplanation: 'Remembering "A RAT" guarantees you will always use an "A" in the middle of sep-a-rat-e!'
  },
  {
    id: 'lesson-9',
    dayNumber: 9,
    word: 'Diligent',
    phonetic: '/ˈdɪlɪdʒənt/',
    syllables: ['dil', 'i', 'gent'],
    partOfSpeech: 'adjective',
    friendlyDefinition: 'Showing steady, earnest, and energetic effort; hardworking and attentive.',
    sentenceExample: 'Her diligent practice paid off when she received top marks on the state exam.',
    memoryTrick: 'A "gentleman" or gentle soul who works with "delight" is diligent!',
    rootOrigin: 'From Latin diligere ("to value highly, love, esteem"). If you value something, you work hard for it.',
    spellingHint: 'One "l": d-i-l-i-g-e-n-t. Ends in "-ent", not "-ant".',
    readingTitle: 'Quiet Dedication',
    readingPassage: 'Talent can open a door, but diligence is what keeps you in the room. A diligent student doesn’t wait for inspiration; they sit down, open their notes, and put in the work. Small daily efforts compound over months into extraordinary achievements.',
    comprehensionQuestion: 'Which word is an antonym (opposite) of diligent?',
    comprehensionOptions: [
      'Careless or lazy',
      'Persistent',
      'Thoughtful'
    ],
    correctOptionIndex: 0,
    comprehensionExplanation: 'Diligent means hardworking and careful; its opposite is careless or lazy.'
  },
  {
    id: 'lesson-10',
    dayNumber: 10,
    word: 'Accommodate',
    phonetic: '/əˈkɑːmədeɪt/',
    syllables: ['ac', 'com', 'mo', 'date'],
    partOfSpeech: 'verb',
    friendlyDefinition: 'To provide space or lodging for; to fit in with the wishes, needs, or circumstances of others.',
    sentenceExample: 'The new lecture hall was designed to accommodate over three hundred students comfortably.',
    memoryTrick: 'Double "c" and double "m": A good hotel has room to ACCOMMODATE Coffee and Milk (CC and MM)!',
    rootOrigin: 'From Latin accommodare: "ad" (to) + "commodus" (suitable, fit).',
    spellingHint: 'Two Cs and two Ms: a-C-C-o-M-M-o-d-a-t-e. One of the top ten most misspelled words in English!',
    readingTitle: 'Making Room for Growth',
    readingPassage: 'In life, unexpected changes happen every week. Traffic delays your commute, assignments shift, and schedules collide. Flexible people learn how to accommodate new circumstances without losing their calm. They adjust their sails and keep steering toward their goals.',
    comprehensionQuestion: 'What double letters must be included when spelling "accommodate"?',
    comprehensionOptions: [
      'Two C’s and two M’s (cc and mm)',
      'Two D’s and two T’s',
      'Two O’s and two E’s'
    ],
    correctOptionIndex: 0,
    comprehensionExplanation: 'Double C and double M! Remember: accommodate has room for double Coffee and double Milk.'
  }
];

export class DailyLiteracyManager {
  private static STORAGE_KEY = 'STUDENT_COMPANION_LITERACY_PROGRESS';

  public static getProgress(): UserLiteracyProgress {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (_) {}

    const defaultProgress: UserLiteracyProgress = {
      currentDay: 1,
      streakCount: 0,
      lastCompletedDate: null,
      masteredWords: [],
      favoriteWords: [],
    };
    return defaultProgress;
  }

  public static saveProgress(progress: UserLiteracyProgress): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress));
    } catch (_) {}
  }

  public static getTodayLesson(): DailyLesson {
    const progress = this.getProgress();
    const day = progress.currentDay || 1;
    const lesson = DAILY_LESSONS.find((l) => l.dayNumber === day);
    return lesson || DAILY_LESSONS[0];
  }

  public static getLessonByDay(dayNumber: number): DailyLesson {
    const lesson = DAILY_LESSONS.find((l) => l.dayNumber === dayNumber);
    return lesson || DAILY_LESSONS[0];
  }

  public static isLessonCompletedToday(): boolean {
    const progress = this.getProgress();
    if (!progress.lastCompletedDate) return false;
    const today = new Date().toISOString().slice(0, 10);
    return progress.lastCompletedDate === today;
  }

  public static completeDailyLesson(dayNumber: number, word: string): UserLiteracyProgress {
    const progress = this.getProgress();
    const today = new Date().toISOString().slice(0, 10);

    const isConsecutive =
      progress.lastCompletedDate &&
      new Date(today).getTime() - new Date(progress.lastCompletedDate).getTime() <= 86400000 * 2;

    const newStreak = isConsecutive ? progress.streakCount + 1 : 1;

    const updatedWords = Array.from(new Set([...progress.masteredWords, word]));
    const nextDay = Math.min(DAILY_LESSONS.length, dayNumber + 1);

    const updated: UserLiteracyProgress = {
      ...progress,
      currentDay: nextDay,
      streakCount: newStreak,
      lastCompletedDate: today,
      masteredWords: updatedWords,
    };

    this.saveProgress(updated);
    return updated;
  }

  public static checkSpelling(input: string, target: string): {
    isCorrect: boolean;
    cleanInput: string;
    feedback: string;
    scaffolding: string;
  } {
    const cleanIn = input.trim().toLowerCase();
    const cleanTarget = target.trim().toLowerCase();

    if (cleanIn === cleanTarget) {
      return {
        isCorrect: true,
        cleanInput: cleanIn,
        feedback: 'Outstanding! 100% correct spelling.',
        scaffolding: cleanTarget.split('').join(' '),
      };
    }

    // Build scaffolding showing matched characters
    const targetChars = cleanTarget.split('');
    const inChars = cleanIn.split('');
    const scaffold = targetChars
      .map((ch, i) => (inChars[i] === ch ? ch : '_'))
      .join(' ');

    let hint = 'Keep going! Compare your letters with the syllable sounds.';
    if (cleanIn.length > cleanTarget.length) {
      hint = `Watch out: your spelling has ${cleanIn.length - cleanTarget.length} extra letter(s).`;
    } else if (cleanIn.length < cleanTarget.length) {
      hint = `Almost there! You are missing ${cleanTarget.length - cleanIn.length} letter(s).`;
    }

    return {
      isCorrect: false,
      cleanInput: cleanIn,
      feedback: hint,
      scaffolding: scaffold,
    };
  }
}
