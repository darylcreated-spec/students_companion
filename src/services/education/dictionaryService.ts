import { WordDefinition } from '../../types';
import { TTSEngine } from '../audio/ttsEngine';

// Offline academic glossary fallback for fast, offline responses to core scientific/technical terms
const ACADEMIC_FALLBACKS: Record<string, Partial<WordDefinition>> = {
  quantum: {
    phonetic: '/ˈkwɒn.təm/',
    partOfSpeech: 'noun',
    definition: 'The minimum amount of any physical entity involved in an interaction, or a discrete packet of energy or matter.',
    example: 'Quantum annealing allows simultaneous evaluation of multi-state pathways.',
  },
  logistics: {
    phonetic: '/ləˈdʒɪs.tɪks/',
    partOfSpeech: 'noun',
    definition: 'The detailed coordination of a complex operation involving many people, facilities, or supplies.',
    example: 'Global supply chain logistics require dynamic path routing algorithms.',
  },
  superposition: {
    phonetic: '/ˌsuː.pər.pəˈzɪʃ.ən/',
    partOfSpeech: 'noun',
    definition: 'A principle of quantum theory where a system can exist simultaneously in multiple states until measured.',
    example: 'Qubits exploit superposition to compute parallel possibilities.',
  },
  algorithm: {
    phonetic: '/ˈæl.ɡə.rɪ.ðəm/',
    partOfSpeech: 'noun',
    definition: 'A process or set of rules to be followed in calculations or other problem-solving operations by a computer.',
    example: 'Dijkstra developed a shortest path algorithm for network graphs.',
  },
  annealing: {
    phonetic: '/əˈniː.lɪŋ/',
    partOfSpeech: 'noun',
    definition: 'A metaheuristic for approximating the global optimum of a given function, inspired by metallurgical heating and cooling.',
    example: 'Simulated annealing escapes local minima during graph optimization.',
  },
  heuristic: {
    phonetic: '/hjʊəˈrɪs.tɪk/',
    partOfSpeech: 'adjective',
    definition: 'Proceeding to a solution by trial and error or by rules that are only loosely defined.',
    example: 'A heuristic approach provides an acceptable trade-off between speed and accuracy.',
  },
  combinatorial: {
    phonetic: '/kəmˌbaɪ.nəˈtɔː.ri.əl/',
    partOfSpeech: 'adjective',
    definition: 'Relating to the selection and arrangement of elements in finite sets.',
    example: 'Traveling salesperson problems suffer from combinatorial explosion.',
  },
  entropy: {
    phonetic: '/ˈɛn.trə.pi/',
    partOfSpeech: 'noun',
    definition: 'A thermodynamic quantity representing the unavailability of a system\'s thermal energy for conversion into mechanical work; a measure of disorder.',
    example: 'Information entropy quantifies the expected amount of information in a message.',
  },
  gradient: {
    phonetic: '/ˈɡreɪ.di.ənt/',
    partOfSpeech: 'noun',
    definition: 'An inclined part of a road or railway; in mathematics, a vector representing the rate and direction of change in a scalar field.',
    example: 'Stochastic gradient descent optimizes neural network parameters.',
  },
  hypothesis: {
    phonetic: '/haɪˈpɒθ.ə.sɪs/',
    partOfSpeech: 'noun',
    definition: 'A supposition or proposed explanation made on the basis of limited evidence as a starting point for further investigation.',
    example: 'Researchers tested the hypothesis using controlled double-blind trials.',
  },
  paradigm: {
    phonetic: '/ˈpær.ə.daɪm/',
    partOfSpeech: 'noun',
    definition: 'A typical example or pattern of something; a distinct set of concepts or thought patterns.',
    example: 'Deep learning represents a paradigm shift in computer vision.',
  },
  synthesize: {
    phonetic: '/ˈsɪn.θə.saɪz/',
    partOfSpeech: 'verb',
    definition: 'To combine a number of things into a coherent whole, or produce by chemical or biological synthesis.',
    example: 'The lecture synthesizes classical economics with modern behavioral insights.',
  }
};

export class DictionaryService {
  private static cache = new Map<string, WordDefinition>();

  /**
   * Sanitizes a word string by stripping out surrounding punctuation and symbols.
   */
  public static cleanWord(raw: string): string {
    return raw
      .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '')
      .trim()
      .toLowerCase();
  }

  /**
   * Looks up the meaning, phonetics, and usage of a word.
   * Leverages Free Dictionary API, falling back to local academic glossary and AI when available.
   */
  public static async lookupWord(rawWord: string): Promise<WordDefinition> {
    const word = this.cleanWord(rawWord);
    if (!word) {
      throw new Error('Please enter or select a valid word to define.');
    }

    if (this.cache.has(word)) {
      return this.cache.get(word)!;
    }

    // 1. Try Free Dictionary API
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const entry = data[0];
          const phonetic =
            entry.phonetic ||
            entry.phonetics?.find((p: any) => p.text)?.text ||
            '';

          let partOfSpeech = '';
          let definition = '';
          let example = '';
          const synonyms: string[] = [];

          if (Array.isArray(entry.meanings) && entry.meanings.length > 0) {
            for (const meaning of entry.meanings) {
              if (!partOfSpeech && meaning.partOfSpeech) {
                partOfSpeech = meaning.partOfSpeech;
              }
              if (Array.isArray(meaning.definitions)) {
                for (const def of meaning.definitions) {
                  if (!definition && def.definition) {
                    definition = def.definition;
                    example = def.example || '';
                  }
                  if (Array.isArray(def.synonyms)) {
                    for (const s of def.synonyms) {
                      if (!synonyms.includes(s) && synonyms.length < 5) {
                        synonyms.push(s);
                      }
                    }
                  }
                }
              }
            }
          }

          if (definition) {
            const result: WordDefinition = {
              word: entry.word || word,
              phonetic,
              partOfSpeech,
              definition,
              example,
              synonyms: synonyms.length > 0 ? synonyms : undefined,
              source: 'Free Dictionary API'
            };
            this.cache.set(word, result);
            return result;
          }
        }
      }
    } catch (_err) {
      // Network failure, timeout, or CORS error - fallback gracefully
    }

    // 2. Check offline academic fallback
    if (ACADEMIC_FALLBACKS[word]) {
      const fb = ACADEMIC_FALLBACKS[word];
      const result: WordDefinition = {
        word,
        phonetic: fb.phonetic || '',
        partOfSpeech: fb.partOfSpeech || 'noun',
        definition: fb.definition || 'Key academic and technical concept.',
        example: fb.example,
        synonyms: fb.synonyms,
        source: 'Companion Academic Glossary'
      };
      this.cache.set(word, result);
      return result;
    }

    // 3. Fallback for unknown words when offline or 404
    const fallbackDef: WordDefinition = {
      word,
      partOfSpeech: 'term',
      definition: `Definition for "${word}". When connected to the internet or with Gemini enabled, complete lexical and etymological definitions are retrieved automatically.`,
      source: 'Student Companion Dictionary'
    };
    this.cache.set(word, fallbackDef);
    return fallbackDef;
  }

  /**
   * Reads aloud the word and its definition using the TTS engine.
   */
  public static speakDefinition(def: WordDefinition): void {
    const textToSpeak = `${def.word}. ${def.partOfSpeech ? def.partOfSpeech + '. ' : ''}${def.definition}${
      def.example ? ' Example: ' + def.example : ''
    }`;
    TTSEngine.speak(textToSpeak, 1.0);
  }
}
