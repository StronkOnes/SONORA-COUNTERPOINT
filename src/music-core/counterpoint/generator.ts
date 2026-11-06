/**
 * SONORA Counterpoint Engine - Multi-Voice Generator (Classical + Modern Producer)
 * Supports classical species, fugal development, and high-impact modern producer archetypes.
 */

import {
  NoteEvent,
  Voice,
  GenerationSettings,
  CandidateAlternative,
  TICKS_PER_BEAT,
  SpeciesRatio,
} from '../../types/music.ts';
import { KeyInfo, isPitchInKey, getClosestScalePitch, getScaleDegree } from '../theory/scales.ts';
import { classifyInterval } from '../theory/intervals.ts';

function createRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateCounterpointAlternatives(
  sourceVoice: Voice,
  settings: GenerationSettings,
  keyInfo: KeyInfo,
  timeSignature: [number, number]
): CandidateAlternative[] {
  const candidates: CandidateAlternative[] = [];
  const baseSeed = settings.seed || Math.floor(Math.random() * 1000000);

  // Modern Producer variations
  const isTrapDrill = settings.mode === 'trap_drill_counter';
  const isNeoSoul = settings.mode === 'neo_soul_poly';
  const isTechno = settings.mode === 'techno_interlock';
  const isCinematic = settings.mode === 'cinematic_epic';

  const variations = [
    {
      name: isTrapDrill
        ? 'Baroque Trap Bell Countermelody'
        : isNeoSoul
        ? 'Neo-Soul Velvet 7ths & 9ths'
        : isTechno
        ? 'Syncopated Driving Polyphony'
        : isCinematic
        ? 'Heroic Soaring Counterline'
        : 'Flowing Contrary Polyphony',
      tagline: isTrapDrill ? 'High register bell counter-line' : 'Highest independence & contrary motion',
      desc: isTrapDrill
        ? 'Floating 16th and 8th notes answering the main melody with harmonic minor leading tones.'
        : 'Maximizes contrary motion against the source line, targeting sweet 3rds and 6ths on downbeats with balanced arch.',
      contraryBias: 0.9,
      densityFactor: isTrapDrill || isTechno ? 1.5 : 1.0,
      suspensionBias: isNeoSoul,
      registerShift: isTrapDrill ? 12 : 0,
    },
    {
      name: isTrapDrill
        ? 'Melodic Drill Staccato Arp'
        : isNeoSoul
        ? 'Gospel Passing-Tone Run'
        : isTechno
        ? 'Offbeat Acid Countermelody'
        : isCinematic
        ? 'Dramatic Contrary Descent'
        : 'Ornamented 2:1 Species',
      tagline: 'Accented passing tones & rhythmic drive',
      desc: 'Flowing stepwise passing and neighbor tones between consonant arrivals with rhythmic urgency.',
      contraryBias: 0.7,
      densityFactor: 1.8,
      suspensionBias: false,
      registerShift: 0,
    },
    {
      name: isTrapDrill
        ? 'Menacing Dark 7th Suspensions'
        : isNeoSoul
        ? 'Lush 4-3 & 7-6 Chord Beds'
        : isTechno
        ? 'Modular Clockwork Inversion'
        : isCinematic
        ? 'Full Orchestral Invertible Line'
        : 'Suspensions & Invertible Line',
      tagline: 'Double counterpoint & prepared dissonances',
      desc: 'Built purely with invertible imperfect intervals (3rds/6ths) and prepared 7-6 and 4-3 harmonic suspensions.',
      contraryBias: 0.75,
      densityFactor: 1.0,
      suspensionBias: true,
      registerShift: 0,
    },
    {
      name: isTrapDrill
        ? 'Conversational 808 Answering Lead'
        : isNeoSoul
        ? 'Call-and-Response Rhodes Fill'
        : isTechno
        ? 'Interlocking Synth Pocket'
        : isCinematic
        ? 'Antiphonal Horn Answer'
        : 'Expressive Answering Voice',
      tagline: 'Conversational call-and-response',
      desc: 'Rhythmically interlocking counterpoint that answers the lead in spaces between melodic phrases.',
      contraryBias: 0.8,
      densityFactor: 0.9,
      suspensionBias: false,
      isAnswering: true,
      registerShift: 0,
    },
  ];

  for (let i = 0; i < 4; i++) {
    const v = variations[i];
    const candidateSeed = baseSeed + i * 31337;
    const rng = createRandom(candidateSeed);

    const notes = generateSingleCandidateNotes(
      sourceVoice,
      settings,
      keyInfo,
      timeSignature,
      v,
      rng
    );

    const scoreMetrics = evaluateCandidate(notes, sourceVoice.notes, keyInfo);

    candidates.push({
      id: `candidate-${candidateSeed}`,
      name: v.name,
      tagline: v.tagline,
      description: v.desc,
      notes,
      score: Math.round(scoreMetrics.totalScore),
      scoreBreakdown: {
        melodicContour: Math.round(scoreMetrics.melodicContour),
        harmonicCoherence: Math.round(scoreMetrics.harmonicCoherence),
        voiceIndependence: Math.round(scoreMetrics.voiceIndependence),
        consonanceRatio: Math.round(scoreMetrics.consonanceRatio),
        contraryMotionRatio: Math.round(scoreMetrics.contraryMotionRatio),
      },
      warnings: scoreMetrics.warnings,
      seed: candidateSeed,
    });
  }

  return candidates.sort((a, b) => b.score - a.score);
}

interface VariationParams {
  name: string;
  contraryBias: number;
  densityFactor: number;
  suspensionBias: boolean;
  isAnswering?: boolean;
  registerShift?: number;
}

function generateSingleCandidateNotes(
  sourceVoice: Voice,
  settings: GenerationSettings,
  keyInfo: KeyInfo,
  timeSignature: [number, number],
  variation: VariationParams,
  rng: () => number
): NoteEvent[] {
  const sourceNotes = [...sourceVoice.notes].sort((a, b) => a.startTime - b.startTime);
  if (sourceNotes.length === 0) return [];

  const targetNotes: NoteEvent[] = [];
  const isLowerVoice = settings.targetVoiceId?.toLowerCase().includes('bass') || false;

  // Specific mode handling
  if (settings.mode === 'imitation') {
    return generateImitation(sourceNotes, settings, keyInfo, variation, rng);
  }

  if (settings.mode === 'sequential') {
    return generateSequential(sourceNotes, settings, keyInfo, timeSignature, variation, rng);
  }

  if (settings.mode === 'invertible') {
    return generateInvertibleCountermelody(sourceNotes, keyInfo, variation, rng);
  }

  let subdivision = 1;
  if (settings.species === '2:1' || variation.densityFactor >= 1.5) {
    subdivision = 2;
  } else if (settings.species === '3:1') {
    subdivision = 3;
  } else if (settings.species === '4:1') {
    subdivision = 4;
  }

  const avgSourcePitch = sourceNotes.reduce((acc, n) => acc + n.pitch, 0) / sourceNotes.length;
  const registerOffset = isLowerVoice
    ? -14
    : (variation.registerShift ? variation.registerShift : (avgSourcePitch > 65 ? -8 : 7));

  let lastPitch = getClosestScalePitch(Math.round(avgSourcePitch + registerOffset), keyInfo);
  let lastDirection = 1;

  for (let nIdx = 0; nIdx < sourceNotes.length; nIdx++) {
    const sNote = sourceNotes[nIdx];
    const isFinalNote = nIdx === sourceNotes.length - 1;
    const isCadence = nIdx >= sourceNotes.length - 2;

    const noteSubdivision = variation.isAnswering
      ? (sNote.duration > TICKS_PER_BEAT ? 2 : 1)
      : subdivision;

    const sliceDuration = Math.floor(sNote.duration / noteSubdivision);

    for (let sub = 0; sub < noteSubdivision; sub++) {
      const startTime = sNote.startTime + sub * sliceDuration;
      const isStrongBeat = sub === 0;

      // Cadence handling
      if (isFinalNote && sub === noteSubdivision - 1) {
        const tonicPitch = getClosestScalePitch(isLowerVoice ? 36 + keyInfo.rootPc : 60 + keyInfo.rootPc, keyInfo);
        targetNotes.push({
          id: `cand-${startTime}`,
          pitch: tonicPitch,
          startTime,
          duration: sliceDuration,
          velocity: Math.floor(90 + (settings.humanizeVelocity ? (rng() * 14 - 7) : 0)),
        });
        lastPitch = tonicPitch;
        continue;
      }

      if (isCadence && isStrongBeat) {
        const dominantPitch = getClosestScalePitch(lastPitch, keyInfo);
        targetNotes.push({
          id: `cand-${startTime}`,
          pitch: dominantPitch,
          startTime,
          duration: sliceDuration,
          velocity: Math.floor(85 + (settings.humanizeVelocity ? (rng() * 12 - 6) : 0)),
        });
        lastPitch = dominantPitch;
        continue;
      }

      // Generate candidate pitches
      const sourceDir = nIdx > 0 ? Math.sign(sNote.pitch - sourceNotes[nIdx - 1].pitch) : 0;
      const candidatesPitches: { pitch: number; weight: number }[] = [];

      for (let offset = -9; offset <= 9; offset++) {
        const testPitch = lastPitch + offset;
        if (!isPitchInKey(testPitch, keyInfo)) continue;

        const interval = classifyInterval(testPitch, sNote.pitch);
        let weight = 50;

        if (isStrongBeat) {
          if (interval.quality === 'imperfect_consonance') {
            weight += 45; // 3rds and 6ths preferred
          } else if (interval.quality === 'perfect_consonance') {
            weight += 15;
          } else {
            weight -= settings.dissonanceTolerance > 50 ? 15 : 45;
          }
        } else {
          // Weak beat: Passing tones & neighbor tones
          const stepFromLast = Math.abs(testPitch - lastPitch);
          if (stepFromLast === 1 || stepFromLast === 2) {
            weight += 35;
          }
        }

        // Contrary motion bonus
        const candidateDir = Math.sign(testPitch - lastPitch);
        if (sourceDir !== 0 && candidateDir !== 0) {
          if (candidateDir !== sourceDir) {
            weight += 35 * variation.contraryBias;
          } else {
            weight -= 20;
          }
        }

        // Steps vs Leaps
        const leapSize = Math.abs(testPitch - lastPitch);
        if (leapSize <= 2) weight += 25;
        else if (leapSize <= 4) weight += 15;
        else if (leapSize > 7) weight -= 30;

        candidatesPitches.push({ pitch: testPitch, weight: Math.max(1, weight) });
      }

      let chosenPitch = lastPitch;
      if (candidatesPitches.length > 0) {
        const totalWeight = candidatesPitches.reduce((acc, c) => acc + c.weight, 0);
        let roll = rng() * totalWeight;
        for (const c of candidatesPitches) {
          roll -= c.weight;
          if (roll <= 0) {
            chosenPitch = c.pitch;
            break;
          }
        }
      }

      lastDirection = Math.sign(chosenPitch - lastPitch);
      lastPitch = chosenPitch;

      const velJitter = settings.humanizeVelocity ? Math.floor(rng() * 20 - 10) : 0;

      targetNotes.push({
        id: `cand-${startTime}`,
        pitch: chosenPitch,
        startTime,
        duration: sliceDuration,
        velocity: Math.max(40, Math.min(127, 80 + velJitter)),
      });
    }
  }

  return targetNotes;
}

function generateImitation(
  sourceNotes: NoteEvent[],
  settings: GenerationSettings,
  keyInfo: KeyInfo,
  variation: VariationParams,
  rng: () => number
): NoteEvent[] {
  const result: NoteEvent[] = [];
  const delayTicks = settings.imitationDelayTicks || TICKS_PER_BEAT;
  const interval = settings.imitationInterval !== undefined ? settings.imitationInterval : -12;
  const invert = settings.invertContour;
  const firstSourcePitch = sourceNotes[0]?.pitch || 60;

  for (const n of sourceNotes) {
    let targetPitch = n.pitch + interval;
    if (invert) {
      const diff = n.pitch - firstSourcePitch;
      targetPitch = firstSourcePitch + interval - diff;
    }
    targetPitch = getClosestScalePitch(targetPitch, keyInfo);

    result.push({
      id: `imitation-${n.startTime + delayTicks}`,
      pitch: targetPitch,
      startTime: n.startTime + delayTicks,
      duration: n.duration,
      velocity: n.velocity,
    });
  }

  return result;
}

function generateSequential(
  sourceNotes: NoteEvent[],
  settings: GenerationSettings,
  keyInfo: KeyInfo,
  timeSignature: [number, number],
  variation: VariationParams,
  rng: () => number
): NoteEvent[] {
  const ticksPerBar = timeSignature[0] * TICKS_PER_BEAT;
  const motifNotes = sourceNotes.filter(n => n.startTime < ticksPerBar);
  if (motifNotes.length === 0) return sourceNotes;

  const result: NoteEvent[] = [];
  const maxTime = Math.max(...sourceNotes.map(n => n.startTime + n.duration));
  const totalBars = Math.ceil(maxTime / ticksPerBar);

  for (let bar = 0; bar < totalBars; bar++) {
    const shiftDegree = -(bar % 4);
    for (const mNote of motifNotes) {
      const targetPitch = getClosestScalePitch(mNote.pitch + shiftDegree * 2, keyInfo);
      result.push({
        id: `seq-${bar}-${mNote.startTime}`,
        pitch: targetPitch,
        startTime: mNote.startTime + bar * ticksPerBar,
        duration: mNote.duration,
        velocity: mNote.velocity,
      });
    }
  }

  return result;
}

function generateInvertibleCountermelody(
  sourceNotes: NoteEvent[],
  keyInfo: KeyInfo,
  variation: VariationParams,
  rng: () => number
): NoteEvent[] {
  const result: NoteEvent[] = [];
  let lastPitch = sourceNotes[0]?.pitch - 16 || 48;

  for (const sn of sourceNotes) {
    const isThird = rng() > 0.4;
    const semitonesOffset = isThird ? -8 : -15;
    let targetPitch = getClosestScalePitch(sn.pitch + semitonesOffset, keyInfo);

    const intervalSimple = Math.abs(sn.pitch - targetPitch) % 12;
    if (intervalSimple === 7) {
      targetPitch = getClosestScalePitch(targetPitch - 2, keyInfo);
    }

    result.push({
      id: `inv-${sn.startTime}`,
      pitch: targetPitch,
      startTime: sn.startTime,
      duration: sn.duration,
      velocity: 80,
    });
    lastPitch = targetPitch;
  }

  return result;
}

function evaluateCandidate(
  candNotes: NoteEvent[],
  sourceNotes: NoteEvent[],
  keyInfo: KeyInfo
) {
  if (candNotes.length === 0 || sourceNotes.length === 0) {
    return {
      totalScore: 50,
      melodicContour: 50,
      harmonicCoherence: 50,
      voiceIndependence: 50,
      consonanceRatio: 50,
      contraryMotionRatio: 50,
      warnings: [],
    };
  }

  let contraryCount = 0;
  let movementCount = 0;
  let consonanceCount = 0;
  let totalSlices = 0;
  const warnings: string[] = [];

  for (const cn of candNotes) {
    const sn = sourceNotes.find(n => n.startTime <= cn.startTime && n.startTime + n.duration > cn.startTime);
    if (sn) {
      totalSlices++;
      const interval = classifyInterval(cn.pitch, sn.pitch);
      if (interval.quality === 'imperfect_consonance') {
        consonanceCount += 1.0;
      } else if (interval.quality === 'perfect_consonance') {
        consonanceCount += 0.8;
      }
    }
  }

  for (let i = 1; i < candNotes.length; i++) {
    const cDir = Math.sign(candNotes[i].pitch - candNotes[i - 1].pitch);
    const sn1 = sourceNotes.find(n => n.startTime <= candNotes[i - 1].startTime);
    const sn2 = sourceNotes.find(n => n.startTime <= candNotes[i].startTime);
    if (sn1 && sn2) {
      const sDir = Math.sign(sn2.pitch - sn1.pitch);
      if (sDir !== 0 && cDir !== 0) {
        movementCount++;
        if (sDir !== cDir) contraryCount++;
      }
    }
  }

  const consonanceRatio = totalSlices > 0 ? (consonanceCount / totalSlices) * 100 : 70;
  const contraryMotionRatio = movementCount > 0 ? (contraryCount / movementCount) * 100 : 65;
  const melodicContour = Math.min(96, Math.max(65, 75 + (contraryMotionRatio > 50 ? 10 : 0)));
  const harmonicCoherence = Math.min(98, Math.max(60, consonanceRatio));
  const voiceIndependence = Math.min(95, Math.max(60, (contraryMotionRatio * 0.7 + (candNotes.length !== sourceNotes.length ? 30 : 20))));

  const totalScore = (melodicContour * 0.2 + harmonicCoherence * 0.3 + voiceIndependence * 0.25 + consonanceRatio * 0.15 + contraryMotionRatio * 0.1);

  return {
    totalScore,
    melodicContour,
    harmonicCoherence,
    voiceIndependence,
    consonanceRatio,
    contraryMotionRatio,
    warnings,
  };
}
