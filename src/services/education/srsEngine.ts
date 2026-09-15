import { db } from '../../db/database';
import { SRSCard } from '../../types';

/**
 * SuperMemo-2 (SM-2) Spaced Repetition Engine
 * Scientifically schedules memory reviews based on cognitive recall quality.
 */
export class SRSEngine {
  /**
   * Calculates SM-2 next interval and ease factor given a quality score (0 to 5).
   * 5: perfect recall
   * 4: correct after hesitation
   * 3: correct with serious difficulty
   * 2: incorrect, but correct one seemed easy to recall
   * 1: incorrect, but familiar
   * 0: complete blackout
   */
  public static calculateSM2(
    currentCard: { easeFactor: number; interval: number; repetitions: number },
    quality: number
  ): { easeFactor: number; interval: number; repetitions: number; nextReviewDate: string } {
    const q = Math.max(0, Math.min(5, Math.round(quality)));
    let { easeFactor, interval, repetitions } = currentCard;

    if (q >= 3) {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
    } else {
      repetitions = 0;
      interval = 1;
    }

    // Update Ease Factor (minimum floor of 1.3)
    easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (easeFactor < 1.3) {
      easeFactor = 1.3;
    }

    const nextDate = new Date(Date.now() + interval * 86400000);
    const nextReviewDate = nextDate.toISOString().slice(0, 10);

    return {
      easeFactor: Number(easeFactor.toFixed(2)),
      interval,
      repetitions,
      nextReviewDate,
    };
  }

  /**
   * Derives a 0-5 performance score from spelling attempts and sentence transfer quality.
   */
  public static calculatePerformanceScore(
    spellingErrors: number,
    sentenceScore: number
  ): number {
    if (spellingErrors === 0 && sentenceScore >= 85) return 5;
    if (spellingErrors === 0 && sentenceScore >= 70) return 4;
    if (spellingErrors <= 1 && sentenceScore >= 60) return 3;
    if (spellingErrors <= 2) return 2;
    return 1;
  }

  /**
   * Updates or creates an SRS card in IndexedDB for a target word.
   */
  public static async recordWordReview(
    word: string,
    qualityRating: number
  ): Promise<SRSCard> {
    const cleanWord = word.trim().toLowerCase();
    const existing = await db.srsCards.where('word').equalsIgnoreCase(cleanWord).first();

    const currentCard = existing || {
      id: `srs-${cleanWord}-${Date.now()}`,
      word: word.trim(),
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      nextReviewDate: new Date().toISOString().slice(0, 10),
      lastPerformanceRating: 3,
    };

    const nextState = this.calculateSM2(currentCard, qualityRating);
    const updatedCard: SRSCard = {
      ...currentCard,
      ...nextState,
      word: word.trim(),
      lastPerformanceRating: qualityRating,
    };

    await db.srsCards.put(updatedCard);
    return updatedCard;
  }

  /**
   * Retrieves all cards due for review today or earlier.
   */
  public static async getDueCards(): Promise<SRSCard[]> {
    const today = new Date().toISOString().slice(0, 10);
    const all = await db.srsCards.toArray();
    return all.filter((c) => c.nextReviewDate <= today);
  }

  /**
   * Retrieves all tracked cards in the user's lexicon.
   */
  public static async getAllCards(): Promise<SRSCard[]> {
    return await db.srsCards.toArray();
  }
}
