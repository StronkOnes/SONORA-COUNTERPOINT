/**
 * Music Theory - Pitch and Note utilities
 */

export const NOTE_NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

export function midiToNoteName(pitch: number, preferFlats = false): string {
  const clamped = Math.max(0, Math.min(127, Math.round(pitch)));
  const octave = Math.floor(clamped / 12) - 1;
  const pitchClass = clamped % 12;
  const name = preferFlats ? NOTE_NAMES_FLAT[pitchClass] : NOTE_NAMES_SHARP[pitchClass];
  return `${name}${octave}`;
}

export function noteNameToMidi(name: string): number {
  const match = name.trim().match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
  if (!match) return 60; // default C4
  const [, letter, accidental, octStr] = match;
  const baseMap: Record<string, number> = {
    C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11
  };
  let semitone = baseMap[letter.toUpperCase()] ?? 0;
  if (accidental === '#') semitone += 1;
  if (accidental === 'b') semitone -= 1;
  const octave = parseInt(octStr, 10);
  return (octave + 1) * 12 + semitone;
}

export function midiToFrequency(pitch: number): number {
  return 440 * Math.pow(2, (pitch - 69) / 12);
}

export function getPitchClass(pitch: number): number {
  return ((pitch % 12) + 12) % 12;
}

export function isBlackKey(pitch: number): boolean {
  const pc = getPitchClass(pitch);
  return [1, 3, 6, 8, 10].includes(pc);
}
