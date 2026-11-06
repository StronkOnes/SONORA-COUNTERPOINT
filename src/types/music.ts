/**
 * SONORA Counterpoint Studio - Music Domain Types (DAW-Optimized)
 * High-performance polyphonic architecture for professional music producers.
 */

export type VoiceRole = 
  | 'lead'
  | 'countermelody'
  | 'bass'
  | 'inner'
  | 'imitation'
  | 'fugal'
  | 'arp';

export type InstrumentType = 
  | 'moog_sub_bass'
  | 'vintage_rhodes'
  | 'neo_pluck'
  | 'grand_piano'
  | 'french_harpsichord'
  | 'pipe_organ'
  | 'chamber_strings'
  | 'solo_cello'
  | 'flute_woodwind'
  | 'analog_poly';

export interface NoteEvent {
  id: string;
  pitch: number; // MIDI pitch 0-127 (60 = C4)
  startTime: number; // in ticks (480 ticks = 1 beat, 120 = 16th)
  duration: number; // in ticks
  velocity: number; // 0-127
  selected?: boolean;
}

export interface Voice {
  id: string;
  name: string;
  role: VoiceRole;
  color: string;
  clef?: 'treble' | 'bass';
  instrument: InstrumentType;
  volume: number; // 0 to 1
  pan: number; // -1 (left) to 1 (right)
  muted: boolean;
  solo: boolean;
  locked: boolean;
  notes: NoteEvent[];
  octaveOffset: number; // -2, -1, 0, 1, 2
}

export type GenerationMode = 
  | 'independent'
  | 'answering'
  | 'imitation'
  | 'invertible'
  | 'sequential'
  | 'suspensions'
  | 'contrary_motion'
  | 'fugal'
  | 'trap_drill_counter'
  | 'neo_soul_poly'
  | 'techno_interlock'
  | 'cinematic_epic';

export type RuleProfile = 
  | 'strict_18th_century'
  | 'flexible_classical'
  | 'modern_creative'
  | 'custom';

export type SpeciesRatio = '1:1' | '2:1' | '3:1' | '4:1' | 'mixed';

export type ScaleType =
  | 'major'
  | 'minor'
  | 'harmonic_minor'
  | 'dorian'
  | 'phrygian'
  | 'lydian'
  | 'mixolydian'
  | 'hirajoshi';

export interface GenerationSettings {
  mode: GenerationMode;
  profile: RuleProfile;
  species: SpeciesRatio;
  sourceVoiceId: string;
  targetVoiceId?: string;
  independence: number; // 0 - 100
  rhythmDensity: number; // 0 - 100
  contraryMotionWeight: number; // 0 - 100
  dissonanceTolerance: number; // 0 - 100
  allowParallelFifths: boolean;
  allowVoiceCrossing: boolean;
  cadentialTrill: boolean;
  imitationDelayTicks: number; // e.g. 480 ticks = 1 beat
  imitationInterval: number; // semitones (0 = unison, 7 = fifth, 12 = octave)
  invertContour: boolean;
  swingAmount: number; // 0 - 100%
  humanizeVelocity: boolean;
  seed: number;
}

export interface CandidateAlternative {
  id: string;
  name: string;
  tagline: string;
  description: string;
  notes: NoteEvent[];
  score: number; // 0 - 100
  scoreBreakdown: {
    melodicContour: number;
    harmonicCoherence: number;
    voiceIndependence: number;
    consonanceRatio: number;
    contraryMotionRatio: number;
  };
  warnings: string[];
  seed: number;
}

export interface RuleViolation {
  measure: number;
  timeTicks: number;
  type: 'error' | 'warning' | 'info';
  ruleName: string;
  message: string;
  voiceIds: string[];
  pitches: number[];
}

export interface ChordAnalysis {
  timeTicks: number;
  measure: number;
  beat: number;
  root: string;
  chordType: string;
  romanNumeral: string;
  bassNote: string;
  intervalsAboveBass: number[];
  confidence: number;
}

export interface Project {
  id: string;
  name: string;
  tempo: number; // BPM (e.g. 108)
  timeSignature: [number, number]; // [4, 4], [3, 4], [6, 8], etc.
  keySignature: string; // 'C', 'G', 'D', 'F', 'Bb', 'Eb', 'Am', 'Em', 'Dm', 'Cm'
  scaleType: ScaleType;
  voices: Voice[];
  activeVoiceId: string;
  loop: boolean;
  loopStartTick: number;
  loopEndTick: number;
  totalBars: number;
  generationHistory: CandidateAlternative[];
  attributionNotice: string;
  swing: number; // 0 - 60%
}

export const TICKS_PER_BEAT = 480; // Standard MIDI resolution (PPQ)
