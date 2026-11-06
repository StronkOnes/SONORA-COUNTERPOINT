/**
 * Music Theory - Intervals & Consonance Classification
 * Based on 18th-century counterpoint rules (Gratis ad Parnassum)
 */

export type IntervalQuality = 'perfect_consonance' | 'imperfect_consonance' | 'dissonance';

export interface IntervalClassification {
  semitones: number;
  simpleSemitones: number; // mod 12
  octaves: number;
  name: string;
  quality: IntervalQuality;
  isParallelForbidden: boolean; // parallel 5ths, octaves, unisons
}

const INTERVAL_NAMES: Record<number, { name: string; quality: IntervalQuality }> = {
  0: { name: 'P1 (Unison)', quality: 'perfect_consonance' },
  1: { name: 'm2 (Minor 2nd)', quality: 'dissonance' },
  2: { name: 'M2 (Major 2nd)', quality: 'dissonance' },
  3: { name: 'm3 (Minor 3rd)', quality: 'imperfect_consonance' },
  4: { name: 'M3 (Major 3rd)', quality: 'imperfect_consonance' },
  5: { name: 'P4 (Perfect 4th)', quality: 'dissonance' }, // Dissonant in 2-part counterpoint
  6: { name: 'd5/A4 (Tritone)', quality: 'dissonance' },
  7: { name: 'P5 (Perfect 5th)', quality: 'perfect_consonance' },
  8: { name: 'm6 (Minor 6th)', quality: 'imperfect_consonance' },
  9: { name: 'M6 (Major 6th)', quality: 'imperfect_consonance' },
  10: { name: 'm7 (Minor 7th)', quality: 'dissonance' },
  11: { name: 'M7 (Major 7th)', quality: 'dissonance' },
};

export function classifyInterval(lowerPitch: number, upperPitch: number): IntervalClassification {
  const semitones = Math.abs(upperPitch - lowerPitch);
  const octaves = Math.floor(semitones / 12);
  const simple = semitones % 12;

  let info = INTERVAL_NAMES[simple] || { name: 'Unknown', quality: 'dissonance' };

  // Compound 3rds/6ths (10th etc) are imperfect consonances
  if (octaves > 0) {
    if (simple === 0) {
      info = { name: `P${8 * (octaves + 1)} (Octave)`, quality: 'perfect_consonance' };
    } else if (simple === 3 || simple === 4) {
      info = { name: `${simple === 3 ? 'm' : 'M'}${octaves * 7 + 3} (${simple === 3 ? 'm' : 'M'}10th)`, quality: 'imperfect_consonance' };
    } else if (simple === 8 || simple === 9) {
      info = { name: `${simple === 8 ? 'm' : 'M'}${octaves * 7 + 6} (${simple === 8 ? 'm' : 'M'}13th)`, quality: 'imperfect_consonance' };
    } else if (simple === 7) {
      info = { name: `P${octaves * 7 + 5} (12th)`, quality: 'perfect_consonance' };
    }
  }

  const isParallelForbidden = simple === 0 || simple === 7;

  return {
    semitones,
    simpleSemitones: simple,
    octaves,
    name: info.name,
    quality: info.quality,
    isParallelForbidden,
  };
}

/**
 * Invertible counterpoint calculation:
 * Inversion at the Octave (semitones: (12 - s % 12) % 12)
 * 3rd (3 or 4) -> 6th (9 or 8) [Imperfect -> Imperfect: Valid]
 * 6th (8 or 9) -> 3rd (4 or 3) [Imperfect -> Imperfect: Valid]
 * 5th (7) -> 4th (5) [Perfect -> DISSONANT 4th: Dangerous in two voices!]
 */
export function checkInvertibleAtOctave(semitones: number): {
  originalName: string;
  invertedName: string;
  isInvertibleConsonant: boolean;
  explanation: string;
} {
  const simple = semitones % 12;
  const inverted = (12 - simple) % 12;
  const origInfo = INTERVAL_NAMES[simple];
  const invInfo = INTERVAL_NAMES[inverted];

  const origConsonant = origInfo.quality !== 'dissonance';
  const invConsonant = invInfo.quality !== 'dissonance';
  const valid = origConsonant && invConsonant;

  let explanation = '';
  if (simple === 7) {
    explanation = 'A fifth (P5) inverts to a fourth (P4), which becomes dissonant in two voices!';
  } else if (simple === 3 || simple === 4) {
    explanation = 'A third inverts to a sixth, maintaining sweet imperfect consonance.';
  } else if (simple === 8 || simple === 9) {
    explanation = 'A sixth inverts to a third, maintaining sweet imperfect consonance.';
  } else if (simple === 0) {
    explanation = 'An octave/unison inverts to unison/octave, but leaves little room for register exchange.';
  } else {
    explanation = `${origInfo.name} inverts to ${invInfo.name}.`;
  }

  return {
    originalName: origInfo.name,
    invertedName: invInfo.name,
    isInvertibleConsonant: valid,
    explanation,
  };
}
