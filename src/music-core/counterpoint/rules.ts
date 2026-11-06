/**
 * SONORA Counterpoint Engine - Rule Evaluation System
 * Grounded in Jonathan Kulp's "Gratis ad Parnassum" (2009)
 */

import { Voice, NoteEvent, RuleViolation, RuleProfile, TICKS_PER_BEAT } from '../../types/music.ts';
import { classifyInterval } from '../theory/intervals.ts';
import { KeyInfo, getScaleDegree } from '../theory/scales.ts';

export function evaluateCounterpointRules(
  voices: Voice[],
  keyInfo: KeyInfo,
  profile: RuleProfile,
  timeSignature: [number, number]
): RuleViolation[] {
  const violations: RuleViolation[] = [];
  if (voices.length < 2) return violations;

  const ticksPerBar = timeSignature[0] * TICKS_PER_BEAT;
  const isStrict = profile === 'strict_18th_century';
  const isFlexible = profile === 'flexible_classical';
  const isModern = profile === 'modern_creative';

  // Pairwise voice checks
  for (let i = 0; i < voices.length; i++) {
    for (let j = i + 1; j < voices.length; j++) {
      const vUpper = voices[i].notes.length > 0 && voices[j].notes.length > 0 && 
        voices[i].notes[0].pitch >= voices[j].notes[0].pitch ? voices[i] : voices[j];
      const vLower = vUpper === voices[i] ? voices[j] : voices[i];

      checkPairwiseVoiceLeading(vUpper, vLower, keyInfo, isStrict, isFlexible, isModern, ticksPerBar, violations);
    }
  }

  // Single-voice melodic contour checks
  for (const voice of voices) {
    checkMelodicRules(voice, keyInfo, isStrict, isFlexible, ticksPerBar, violations);
  }

  return violations;
}

function checkPairwiseVoiceLeading(
  upper: Voice,
  lower: Voice,
  keyInfo: KeyInfo,
  isStrict: boolean,
  isFlexible: boolean,
  isModern: boolean,
  ticksPerBar: number,
  violations: RuleViolation[]
) {
  // Sample time slices where notes change
  const timePoints = new Set<number>();
  for (const n of upper.notes) {
    timePoints.add(n.startTime);
    timePoints.add(n.startTime + n.duration);
  }
  for (const n of lower.notes) {
    timePoints.add(n.startTime);
    timePoints.add(n.startTime + n.duration);
  }

  const sortedTimes = Array.from(timePoints).sort((a, b) => a - b);
  interface Slice {
    time: number;
    upperNote: NoteEvent;
    lowerNote: NoteEvent;
    intervalSimple: number;
  }

  const slices: Slice[] = [];
  for (const t of sortedTimes) {
    const un = upper.notes.find(n => n.startTime <= t && n.startTime + n.duration > t);
    const ln = lower.notes.find(n => n.startTime <= t && n.startTime + n.duration > t);
    if (un && ln) {
      const simple = Math.abs(un.pitch - ln.pitch) % 12;
      slices.push({ time: t, upperNote: un, lowerNote: ln, intervalSimple: simple });
    }
  }

  let consecutiveThirds = 0;
  let consecutiveSixths = 0;

  for (let idx = 0; idx < slices.length; idx++) {
    const current = slices[idx];
    const prev = idx > 0 ? slices[idx - 1] : null;
    const measure = Math.floor(current.time / ticksPerBar) + 1;

    // 1. Voice Crossing Check
    if (current.upperNote.pitch < current.lowerNote.pitch) {
      if (!isModern) {
        violations.push({
          measure,
          timeTicks: current.time,
          type: isStrict ? 'error' : 'warning',
          ruleName: 'Voice Crossing',
          message: `${upper.name} drops below ${lower.name} (${current.upperNote.pitch} < ${current.lowerNote.pitch})`,
          voiceIds: [upper.id, lower.id],
          pitches: [current.upperNote.pitch, current.lowerNote.pitch],
        });
      }
    }

    // 2. Parallel Fifths and Octaves Check
    if (prev && (current.upperNote.pitch !== prev.upperNote.pitch || current.lowerNote.pitch !== prev.lowerNote.pitch)) {
      const upperDir = Math.sign(current.upperNote.pitch - prev.upperNote.pitch);
      const lowerDir = Math.sign(current.lowerNote.pitch - prev.lowerNote.pitch);

      // Same direction movement
      if (upperDir !== 0 && upperDir === lowerDir) {
        // Parallel 5ths
        if (prev.intervalSimple === 7 && current.intervalSimple === 7) {
          violations.push({
            measure,
            timeTicks: current.time,
            type: isModern ? 'info' : 'error',
            ruleName: 'Parallel 5ths',
            message: `Parallel perfect 5ths detected between ${upper.name} and ${lower.name}`,
            voiceIds: [upper.id, lower.id],
            pitches: [current.upperNote.pitch, current.lowerNote.pitch],
          });
        }
        // Parallel Octaves / Unisons
        if (prev.intervalSimple === 0 && current.intervalSimple === 0) {
          violations.push({
            measure,
            timeTicks: current.time,
            type: isModern ? 'info' : 'error',
            ruleName: 'Parallel Octaves',
            message: `Parallel octaves/unisons detected between ${upper.name} and ${lower.name}`,
            voiceIds: [upper.id, lower.id],
            pitches: [current.upperNote.pitch, current.lowerNote.pitch],
          });
        }
      }

      // 3. Sneaky Parallels Check (Kulp, p. 9 & 15)
      // Off-beat perfect interval moving to on-beat perfect interval
      const isDownbeat = current.time % TICKS_PER_BEAT === 0;
      const prevWasOffbeat = prev.time % TICKS_PER_BEAT !== 0;
      if (isDownbeat && prevWasOffbeat && isStrict) {
        if ((prev.intervalSimple === 7 && current.intervalSimple === 7) ||
            (prev.intervalSimple === 0 && current.intervalSimple === 0)) {
          violations.push({
            measure,
            timeTicks: current.time,
            type: 'warning',
            ruleName: 'Sneaky Parallels',
            message: `Sneaky parallel: Off-beat perfect interval moving in parallel to downbeat perfect interval`,
            voiceIds: [upper.id, lower.id],
            pitches: [current.upperNote.pitch, current.lowerNote.pitch],
          });
        }
      }
    }

    // 4. Consecutive 3rds or 6ths limit (Kulp, p. 10: "avoid having more than three in a row")
    if (current.intervalSimple === 3 || current.intervalSimple === 4) {
      consecutiveThirds++;
      consecutiveSixths = 0;
      if (consecutiveThirds > 3 && isStrict) {
        violations.push({
          measure,
          timeTicks: current.time,
          type: 'warning',
          ruleName: 'Consecutive 3rds',
          message: `More than three parallel 3rds in a row diminishes voice independence`,
          voiceIds: [upper.id, lower.id],
          pitches: [current.upperNote.pitch, current.lowerNote.pitch],
        });
      }
    } else if (current.intervalSimple === 8 || current.intervalSimple === 9) {
      consecutiveSixths++;
      consecutiveThirds = 0;
      if (consecutiveSixths > 3 && isStrict) {
        violations.push({
          measure,
          timeTicks: current.time,
          type: 'warning',
          ruleName: 'Consecutive 6ths',
          message: `More than three parallel 6ths in a row diminishes voice independence`,
          voiceIds: [upper.id, lower.id],
          pitches: [current.upperNote.pitch, current.lowerNote.pitch],
        });
      }
    } else {
      consecutiveThirds = 0;
      consecutiveSixths = 0;
    }
  }
}

function checkMelodicRules(
  voice: Voice,
  keyInfo: KeyInfo,
  isStrict: boolean,
  isFlexible: boolean,
  ticksPerBar: number,
  violations: RuleViolation[]
) {
  const notes = [...voice.notes].sort((a, b) => a.startTime - b.startTime);
  if (notes.length < 2) return;

  for (let i = 0; i < notes.length; i++) {
    const cur = notes[i];
    const prev = i > 0 ? notes[i - 1] : null;
    const next = i < notes.length - 1 ? notes[i + 1] : null;
    const measure = Math.floor(cur.startTime / ticksPerBar) + 1;

    // Tendency tone: Leading tone (degree 7) must resolve up to degree 1
    const degree = getScaleDegree(cur.pitch, keyInfo);
    if (degree === 7 && next) {
      const nextDegree = getScaleDegree(next.pitch, keyInfo);
      if (nextDegree !== 1 && (isStrict || isFlexible)) {
        violations.push({
          measure,
          timeTicks: cur.startTime,
          type: isStrict ? 'error' : 'warning',
          ruleName: 'Tendency Tone',
          message: `Leading tone (degree 7) in ${voice.name} should resolve up by step to tonic (degree 1)`,
          voiceIds: [voice.id],
          pitches: [cur.pitch],
        });
      }
    }

    // Tendency tone: 4th degree resolving down to 3rd degree
    if (degree === 4 && next && isStrict) {
      const nextDegree = getScaleDegree(next.pitch, keyInfo);
      if (nextDegree !== 3 && Math.abs(cur.pitch - next.pitch) > 2) {
        violations.push({
          measure,
          timeTicks: cur.startTime,
          type: 'info',
          ruleName: 'Tendency Tone (4-3)',
          message: `Degree 4 in ${voice.name} usually resolves downward by step to degree 3`,
          voiceIds: [voice.id],
          pitches: [cur.pitch],
        });
      }
    }

    // Melodic Leap Recovery (Kulp, p. 7-8: Leaps > 4th should change direction by step)
    if (prev && next) {
      const leapIn = cur.pitch - prev.pitch;
      const stepOut = next.pitch - cur.pitch;
      if (Math.abs(leapIn) >= 7) { // 5th or larger
        if (Math.sign(leapIn) === Math.sign(stepOut)) {
          violations.push({
            measure,
            timeTicks: cur.startTime,
            type: 'warning',
            ruleName: 'Leap Recovery',
            message: `Large leap of ${Math.abs(leapIn)} semitones in ${voice.name} should be followed by step in opposite direction`,
            voiceIds: [voice.id],
            pitches: [cur.pitch],
          });
        }
      }
    }
  }
}
