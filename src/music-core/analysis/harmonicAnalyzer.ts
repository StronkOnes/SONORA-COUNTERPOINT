/**
 * SONORA Counterpoint Engine - Real-time Harmonic & Voice-leading Analyzer
 */

import { Voice, ChordAnalysis, TICKS_PER_BEAT } from '../../types/music.ts';
import { KeyInfo } from '../theory/scales.ts';
import { analyzePitches } from '../theory/chords.ts';
import { midiToNoteName } from '../theory/pitch.ts';

export interface ComprehensiveAnalysis {
  keyConfidence: number;
  chords: ChordAnalysis[];
  detectedCadences: { measure: number; type: string; description: string }[];
  imperfectConsonancePercentage: number;
  voiceLeadingHealthScore: number;
}

export function analyzeProjectHarmony(
  voices: Voice[],
  keyInfo: KeyInfo,
  timeSignature: [number, number],
  totalBars: number
): ComprehensiveAnalysis {
  const chords: ChordAnalysis[] = [];
  const ticksPerBar = timeSignature[0] * TICKS_PER_BEAT;
  const totalTicks = totalBars * ticksPerBar;
  const detectedCadences: { measure: number; type: string; description: string }[] = [];

  let consonantSlices = 0;
  let totalAnalyzedSlices = 0;

  // Step through each beat
  for (let t = 0; t < totalTicks; t += TICKS_PER_BEAT) {
    const activePitches: number[] = [];
    for (const v of voices) {
      if (v.muted) continue;
      const note = v.notes.find(n => n.startTime <= t && n.startTime + n.duration > t);
      if (note) {
        activePitches.push(note.pitch);
      }
    }

    if (activePitches.length > 0) {
      totalAnalyzedSlices++;
      const recognized = analyzePitches(activePitches, keyInfo);
      const sorted = [...activePitches].sort((a, b) => a - b);
      const bassPitch = sorted[0];
      const intervalsAboveBass = sorted.slice(1).map(p => (p - bassPitch) % 12);

      // Check if intervals above bass are consonant (3, 4, 7, 8, 9, 0)
      const hasDissonance = intervalsAboveBass.some(i => [1, 2, 5, 6, 10, 11].includes(i));
      if (!hasDissonance) consonantSlices++;

      if (recognized) {
        chords.push({
          timeTicks: t,
          measure: Math.floor(t / ticksPerBar) + 1,
          beat: Math.floor((t % ticksPerBar) / TICKS_PER_BEAT) + 1,
          root: recognized.rootName,
          chordType: recognized.quality,
          romanNumeral: recognized.romanNumeral,
          bassNote: midiToNoteName(bassPitch, keyInfo.preferFlats),
          intervalsAboveBass,
          confidence: 0.9,
        });
      }
    }
  }

  // Detect cadences (e.g. V -> I, IV -> V, ii -> V -> I at phrase/bar endings)
  for (let i = 1; i < chords.length; i++) {
    const prev = chords[i - 1];
    const curr = chords[i];

    if (prev.measure !== curr.measure && curr.beat === 1) {
      // Bar boundary
      if ((prev.romanNumeral.startsWith('V') || prev.romanNumeral.startsWith('v')) &&
          (curr.romanNumeral.startsWith('I') || curr.romanNumeral.startsWith('i'))) {
        const isRootPos = prev.bassNote.startsWith(prev.root) && curr.bassNote.startsWith(curr.root);
        detectedCadences.push({
          measure: curr.measure,
          type: isRootPos ? 'PAC (Perfect Authentic Cadence)' : 'IAC (Imperfect Authentic Cadence)',
          description: `V -> I harmonic arrival at measure ${curr.measure}`,
        });
      } else if (curr.romanNumeral.startsWith('V')) {
        detectedCadences.push({
          measure: curr.measure,
          type: 'Half Cadence',
          description: `Harmonic repose on dominant (V) at measure ${curr.measure}`,
        });
      }
    }
  }

  const imperfectRatio = totalAnalyzedSlices > 0 ? (consonantSlices / totalAnalyzedSlices) * 100 : 80;
  const healthScore = Math.min(99, Math.max(50, Math.round(imperfectRatio * 0.9 + 10)));

  return {
    keyConfidence: 0.95,
    chords,
    detectedCadences,
    imperfectConsonancePercentage: Math.round(imperfectRatio),
    voiceLeadingHealthScore: healthScore,
  };
}
