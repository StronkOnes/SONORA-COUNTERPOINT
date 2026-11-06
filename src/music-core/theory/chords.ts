/**
 * Music Theory - Chord Identification & Roman Numeral Analysis
 */

import { KeyInfo } from './scales.ts';
import { NOTE_NAMES_SHARP, NOTE_NAMES_FLAT } from './pitch.ts';

export interface RecognizedChord {
  rootPc: number;
  rootName: string;
  quality: 'maj' | 'min' | 'dim' | 'aug' | 'dom7' | 'maj7' | 'min7' | 'halfdim7' | 'dim7' | 'power' | 'unison';
  romanNumeral: string;
  inversion: 'root' | 'first' | 'second' | 'third';
  bassPc: number;
}

export function analyzePitches(pitches: number[], keyInfo: KeyInfo): RecognizedChord | null {
  if (!pitches || pitches.length === 0) return null;
  const uniquePcs = Array.from(new Set(pitches.map(p => ((p % 12) + 12) % 12)));
  const sortedPitches = [...pitches].sort((a, b) => a - b);
  const lowestPitch = sortedPitches[0];
  const bassPc = ((lowestPitch % 12) + 12) % 12;

  if (uniquePcs.length === 1) {
    const rootPc = uniquePcs[0];
    const name = keyInfo.preferFlats ? NOTE_NAMES_FLAT[rootPc] : NOTE_NAMES_SHARP[rootPc];
    const degree = getRomanNumeralDegree(rootPc, keyInfo, 'maj');
    return {
      rootPc,
      rootName: name,
      quality: 'unison',
      romanNumeral: degree,
      inversion: 'root',
      bassPc,
    };
  }

  // Find best fitting triad or 7th chord root
  let bestChord: RecognizedChord | null = null;
  let highestMatch = -1;

  for (const candidateRoot of uniquePcs) {
    const rel = uniquePcs.map(pc => (pc - candidateRoot + 12) % 12);
    const has3rdM = rel.includes(4);
    const has3rdm = rel.includes(3);
    const has5thP = rel.includes(7);
    const has5thd = rel.includes(6);
    const has7thm = rel.includes(10);
    const has7thM = rel.includes(11);

    let matchCount = 0;
    let quality: RecognizedChord['quality'] = 'maj';

    if (has3rdM && has5thP) {
      quality = has7thm ? 'dom7' : (has7thM ? 'maj7' : 'maj');
      matchCount = 3 + (has7thm || has7thM ? 1 : 0);
    } else if (has3rdm && has5thP) {
      quality = has7thm ? 'min7' : 'min';
      matchCount = 3 + (has7thm ? 1 : 0);
    } else if (has3rdm && has5thd) {
      quality = has7thm ? 'halfdim7' : 'dim';
      matchCount = 3;
    } else if (has5thP) {
      quality = 'power';
      matchCount = 2;
    } else if (has3rdM) {
      quality = 'maj';
      matchCount = 2;
    } else if (has3rdm) {
      quality = 'min';
      matchCount = 2;
    }

    if (matchCount > highestMatch) {
      highestMatch = matchCount;
      const rootName = keyInfo.preferFlats ? NOTE_NAMES_FLAT[candidateRoot] : NOTE_NAMES_SHARP[candidateRoot];
      const roman = getRomanNumeralDegree(candidateRoot, keyInfo, quality);

      let inversion: RecognizedChord['inversion'] = 'root';
      if (bassPc !== candidateRoot) {
        const bassRel = (bassPc - candidateRoot + 12) % 12;
        if (bassRel === 3 || bassRel === 4) inversion = 'first';
        else if (bassRel === 7 || bassRel === 6) inversion = 'second';
        else if (bassRel === 10 || bassRel === 11) inversion = 'third';
      }

      bestChord = {
        rootPc: candidateRoot,
        rootName,
        quality,
        romanNumeral: roman,
        inversion,
        bassPc,
      };
    }
  }

  return bestChord;
}

function getRomanNumeralDegree(rootPc: number, keyInfo: KeyInfo, quality: string): string {
  const diff = (rootPc - keyInfo.rootPc + 12) % 12;
  const majorMap: Record<number, { upper: string; lower: string; isDim?: boolean }> = {
    0: { upper: 'I', lower: 'i' },
    2: { upper: 'II', lower: 'ii' },
    4: { upper: 'III', lower: 'iii' },
    5: { upper: 'IV', lower: 'iv' },
    7: { upper: 'V', lower: 'v' },
    9: { upper: 'VI', lower: 'vi' },
    11: { upper: 'VII', lower: 'vii', isDim: true },
  };

  const minorMap: Record<number, { upper: string; lower: string; isDim?: boolean }> = {
    0: { upper: 'I', lower: 'i' },
    2: { upper: 'II', lower: 'ii', isDim: true },
    3: { upper: 'III', lower: 'iii' },
    5: { upper: 'IV', lower: 'iv' },
    7: { upper: 'V', lower: 'v' }, // Harmonic minor V is major
    8: { upper: 'VI', lower: 'vi' },
    11: { upper: 'VII', lower: 'vii', isDim: true }, // Leading tone VII°
    10: { upper: 'VII', lower: 'vii' }, // Subtonic
  };

  const map = keyInfo.mode === 'major' ? majorMap : minorMap;
  const entry = map[diff];
  if (!entry) return '?';

  let num = (quality === 'maj' || quality === 'dom7' || quality === 'maj7' || (diff === 7 && keyInfo.mode === 'minor'))
    ? entry.upper
    : entry.lower;

  if (quality === 'dim' || quality === 'halfdim7' || entry.isDim) {
    num += '°';
  }
  if (quality === 'dom7' || quality === 'maj7' || quality === 'min7') {
    num += '7';
  }

  return num;
}
