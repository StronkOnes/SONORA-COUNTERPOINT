/**
 * Music Theory - Scales, Producer Modes, and Tendency Tones
 */

import { ScaleType } from '../../types/music.ts';

export interface KeyInfo {
  root: string;
  rootPc: number;
  mode: ScaleType;
  preferFlats: boolean;
  scalePcs: number[]; // pitch classes in scale
  leadingTonePc: number;
}

// Scale intervals in semitones
const SCALE_FORMULAS: Record<ScaleType, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  harmonic_minor: [0, 2, 3, 5, 7, 8, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  hirajoshi: [0, 2, 3, 7, 8],
};

const ROOT_SEMITONES: Record<string, { pc: number; preferFlats: boolean }> = {
  'C': { pc: 0, preferFlats: false },
  'C#': { pc: 1, preferFlats: false },
  'Db': { pc: 1, preferFlats: true },
  'D': { pc: 2, preferFlats: false },
  'D#': { pc: 3, preferFlats: false },
  'Eb': { pc: 3, preferFlats: true },
  'E': { pc: 4, preferFlats: false },
  'F': { pc: 5, preferFlats: true },
  'F#': { pc: 6, preferFlats: false },
  'Gb': { pc: 6, preferFlats: true },
  'G': { pc: 7, preferFlats: false },
  'G#': { pc: 8, preferFlats: false },
  'Ab': { pc: 8, preferFlats: true },
  'A': { pc: 9, preferFlats: false },
  'A#': { pc: 10, preferFlats: false },
  'Bb': { pc: 10, preferFlats: true },
  'B': { pc: 11, preferFlats: false },
};

export function getKeyInfo(keySignature: string, customMode: ScaleType = 'minor'): KeyInfo {
  // Parse root and optional 'm'
  let root = keySignature;
  let mode = customMode;

  if (root.endsWith('m') && !root.endsWith('dim')) {
    root = root.slice(0, -1);
    mode = 'minor';
  }

  const rootData = ROOT_SEMITONES[root] || ROOT_SEMITONES['C'];
  const formula = SCALE_FORMULAS[mode] || SCALE_FORMULAS.minor;
  const scalePcs = formula.map(semi => (rootData.pc + semi) % 12);
  const leadingTonePc = (rootData.pc + 11) % 12;

  return {
    root,
    rootPc: rootData.pc,
    mode,
    preferFlats: rootData.preferFlats,
    scalePcs,
    leadingTonePc,
  };
}

export function isPitchInKey(pitch: number, keyInfo: KeyInfo): boolean {
  const pc = ((pitch % 12) + 12) % 12;
  return keyInfo.scalePcs.includes(pc);
}

export function getClosestScalePitch(targetPitch: number, keyInfo: KeyInfo): number {
  let best = targetPitch;
  let minDiff = 999;
  for (let offset = -4; offset <= 4; offset++) {
    const candidate = targetPitch + offset;
    if (isPitchInKey(candidate, keyInfo)) {
      const diff = Math.abs(offset);
      if (diff < minDiff) {
        minDiff = diff;
        best = candidate;
      }
    }
  }
  return best;
}

export function getScaleDegree(pitch: number, keyInfo: KeyInfo): number {
  const pc = ((pitch % 12) + 12) % 12;
  const idx = keyInfo.scalePcs.indexOf(pc);
  return idx >= 0 ? idx + 1 : -1;
}
