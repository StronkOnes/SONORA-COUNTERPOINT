/**
 * SONORA Counterpoint Studio - DAW Counterpoint Intelligence Panel
 * High-impact producer counterpoint styles (Trap/Drill, Neo-Soul, Techno, Cinematic, Fux/Kulp Classical).
 * Bulletproof target track routing and instant visual confirmation on apply.
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Play,
  Check,
  ArrowUpDown,
  Flame,
  Music,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import {
  Project,
  Voice,
  GenerationSettings,
  GenerationMode,
  RuleProfile,
  SpeciesRatio,
  CandidateAlternative,
} from '../types/music.ts';
import { generateCounterpointAlternatives } from '../music-core/counterpoint/generator.ts';
import { getKeyInfo } from '../music-core/theory/scales.ts';
import { audioEngine } from '../audio/audioEngine.ts';

interface IntelligencePanelProps {
  project: Project;
  onApplyCandidate: (voiceId: string, candidate: CandidateAlternative) => void;
  onInvertVoices: (v1Id: string, v2Id: string) => void;
}

const PRODUCER_MODES: { id: GenerationMode; label: string; desc: string; category: 'modern' | 'classical' }[] = [
  { id: 'trap_drill_counter', label: 'Baroque Trap / Drill', desc: 'Menacing high-register bell counter-melodies & harmonic minor 7ths', category: 'modern' },
  { id: 'neo_soul_poly', label: 'Neo-Soul & R&B Lush', desc: 'Velvet 7th/9th suspensions, passing tones & chordal responses', category: 'modern' },
  { id: 'techno_interlock', label: 'Melodic Techno Interlock', desc: 'Syncopated driving polyphony with driving rhythm pocket', category: 'modern' },
  { id: 'cinematic_epic', label: 'Cinematic Orchestral', desc: 'Soaring contrary motion and heroic cadential arch', category: 'modern' },
  { id: 'independent', label: 'Independent Counterpoint', desc: 'Contrasting contour, contrary motion & imperfect consonances', category: 'classical' },
  { id: 'answering', label: 'Answering Call & Response', desc: 'Interlocking conversation in spaces between lead phrases', category: 'classical' },
  { id: 'imitation', label: 'Imitation / Canon', desc: 'Canonical repetition with pitch interval & time delay', category: 'classical' },
  { id: 'invertible', label: 'Invertible Double Counterpoint', desc: 'Tested at octave without forbidden 4ths (Kulp Ch. 7)', category: 'classical' },
  { id: 'suspensions', label: 'Suspension Generator', desc: 'Classic 4-3, 7-6 and 2-3 prepared and resolved tensions', category: 'classical' },
  { id: 'fugal', label: 'Fugal Development', desc: 'Subject, countersubject and dominant answer entries', category: 'classical' },
];

export const IntelligencePanel: React.FC<IntelligencePanelProps> = ({
  project,
  onApplyCandidate,
  onInvertVoices,
}) => {
  const [mode, setMode] = useState<GenerationMode>('trap_drill_counter');
  const [profile, setProfile] = useState<RuleProfile>('modern_creative');
  const [species, setSpecies] = useState<SpeciesRatio>('2:1');

  const [sourceVoiceId, setSourceVoiceId] = useState<string>(project.voices[0]?.id || '');
  const [targetVoiceId, setTargetVoiceId] = useState<string>(
    project.voices.find(v => v.id !== project.voices[0]?.id)?.id || project.voices[0]?.id || ''
  );

  // Keep source and target voice IDs strictly synced with project.voices
  useEffect(() => {
    if (!project.voices.some(v => v.id === sourceVoiceId)) {
      setSourceVoiceId(project.voices[0]?.id || '');
    }
    if (!project.voices.some(v => v.id === targetVoiceId)) {
      const fallback = project.voices.find(v => v.id !== project.voices[0]?.id)?.id || project.voices[0]?.id || '';
      setTargetVoiceId(fallback);
    }
  }, [project.voices, sourceVoiceId, targetVoiceId]);

  const [independence, setIndependence] = useState(85);
  const [contraryMotionWeight, setContraryMotionWeight] = useState(80);
  const [humanizeVelocity, setHumanizeVelocity] = useState(true);
  const [imitationInterval, setImitationInterval] = useState(-12);
  const [invertContour, setInvertContour] = useState(false);
  const [seed, setSeed] = useState(Math.floor(Math.random() * 900000) + 100000);

  const [candidates, setCandidates] = useState<CandidateAlternative[]>([]);
  const [appliedCandidateId, setAppliedCandidateId] = useState<string | null>(null);

  const handleGenerate = () => {
    const sourceVoice = project.voices.find(v => v.id === sourceVoiceId) || project.voices[0];
    if (!sourceVoice || sourceVoice.notes.length === 0) {
      alert('Source track is empty. Please draw some notes on the piano roll or select a track with notes.');
      return;
    }

    const keyInfo = getKeyInfo(project.keySignature, project.scaleType);
    const newSeed = Math.floor(Math.random() * 900000) + 100000;
    setSeed(newSeed);

    const settings: GenerationSettings = {
      mode,
      profile,
      species,
      sourceVoiceId,
      targetVoiceId,
      independence,
      rhythmDensity: 75,
      contraryMotionWeight,
      dissonanceTolerance: profile === 'modern_creative' ? 65 : 20,
      allowParallelFifths: profile === 'modern_creative',
      allowVoiceCrossing: profile !== 'strict_18th_century',
      cadentialTrill: true,
      imitationDelayTicks: 480,
      imitationInterval,
      invertContour,
      swingAmount: project.swing || 0,
      humanizeVelocity,
      seed: newSeed,
    };

    const results = generateCounterpointAlternatives(
      sourceVoice,
      settings,
      keyInfo,
      project.timeSignature
    );

    setCandidates(results);
    setAppliedCandidateId(null);
  };

  const handleAudition = (candidate: CandidateAlternative) => {
    const targetVoice = project.voices.find(v => v.id === targetVoiceId);
    audioEngine.playCandidatePreview(candidate.notes, project.tempo, targetVoice?.instrument || 'neo_pluck');
  };

  const handleApply = (candidate: CandidateAlternative) => {
    const effectiveTargetId = targetVoiceId || (project.voices.find(v => v.id !== sourceVoiceId)?.id) || project.voices[0]?.id;
    if (!effectiveTargetId) return;

    onApplyCandidate(effectiveTargetId, candidate);
    setAppliedCandidateId(candidate.id);

    // Audio preview confirmation tick
    audioEngine.playPreviewNote(72, 'neo_pluck', 0.2, 95);

    setTimeout(() => {
      setAppliedCandidateId(null);
    }, 2800);
  };

  const handleInvertibleTest = () => {
    if (project.voices.length >= 2) {
      onInvertVoices(project.voices[0].id, project.voices[1].id);
    }
  };

  const targetVoice = project.voices.find(v => v.id === targetVoiceId) || project.voices[0];

  return (
    <div className="w-96 border-l border-[#1e2430] bg-[#0c0f16] flex flex-col shrink-0 select-none overflow-hidden h-full">
      {/* Header */}
      <div className="p-3 border-b border-[#1e2430] bg-[#10141d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
            Counterpoint Generator
          </span>
        </div>
        <span className="text-[10px] font-mono text-neutral-500">Seed: {seed}</span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Source & Target Voice Routing */}
        <div className="bg-[#121622] p-3 rounded-lg border border-[#1d2536] space-y-2.5">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span className="font-semibold text-neutral-300">Track Routing</span>
            <span className="text-[10px] text-amber-400/90 font-mono">Source → Destination</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-neutral-400 block mb-1">
                Source Melody (C.F.)
              </label>
              <select
                value={sourceVoiceId}
                onChange={e => setSourceVoiceId(e.target.value)}
                className="w-full bg-[#1a2130] text-xs text-neutral-200 rounded px-2 py-1.5 border border-[#273247] focus:outline-none focus:border-amber-500"
              >
                {project.voices.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.notes.length} notes)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-amber-400 block mb-1 font-semibold">
                Destination Track
              </label>
              <select
                value={targetVoiceId}
                onChange={e => setTargetVoiceId(e.target.value)}
                className="w-full bg-[#1f293d] text-xs text-amber-300 font-bold rounded px-2 py-1.5 border border-amber-500/40 focus:outline-none focus:border-amber-400 shadow-sm"
              >
                {project.voices.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-[10px] text-neutral-400 flex items-center justify-between pt-0.5">
            <span>Applying will populate:</span>
            <span className="font-bold text-amber-300 font-mono">
              {targetVoice?.name} ({targetVoice?.instrument})
            </span>
          </div>
        </div>

        {/* Style / Generator Archetypes */}
        <div>
          <label className="text-xs font-semibold text-neutral-300 mb-1.5 flex items-center justify-between">
            <span>Counterpoint Style</span>
            <span className="text-[10px] text-neutral-500 font-mono">Modern & Classical</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {PRODUCER_MODES.map(m => (
              <button
                key={m.id}
                onClick={() => {
                  setMode(m.id);
                  if (m.category === 'modern') setProfile('modern_creative');
                }}
                className={`p-2 rounded-lg text-left border transition-all ${
                  mode === m.id
                    ? 'bg-[#1e2738] border-amber-500/60 text-amber-300 shadow-sm'
                    : 'bg-[#121622] border-[#1d2536] text-neutral-400 hover:text-neutral-200 hover:bg-[#161b29]'
                }`}
              >
                <div className="text-[11px] font-bold truncate flex items-center gap-1">
                  {m.category === 'modern' ? <Flame className="w-3 h-3 text-amber-400 shrink-0" /> : <Music className="w-3 h-3 text-sky-400 shrink-0" />}
                  <span className="truncate">{m.label}</span>
                </div>
                <div className="text-[9px] text-neutral-500 line-clamp-1 mt-0.5">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Rule Profile */}
        <div>
          <label className="text-xs font-semibold text-neutral-300 mb-1.5 block">
            Harmonic Strictness
          </label>
          <div className="grid grid-cols-3 gap-1 bg-[#121622] p-1 rounded-lg border border-[#1d2536]">
            <button
              onClick={() => setProfile('modern_creative')}
              className={`py-1.5 text-[11px] font-medium rounded transition-colors text-center ${
                profile === 'modern_creative'
                  ? 'bg-amber-500 text-[#0b0e14] font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Modern Expressive
            </button>
            <button
              onClick={() => setProfile('flexible_classical')}
              className={`py-1.5 text-[11px] font-medium rounded transition-colors text-center ${
                profile === 'flexible_classical'
                  ? 'bg-amber-500 text-[#0b0e14] font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Flexible Classical
            </button>
            <button
              onClick={() => setProfile('strict_18th_century')}
              className={`py-1.5 text-[11px] font-medium rounded transition-colors text-center ${
                profile === 'strict_18th_century'
                  ? 'bg-amber-500 text-[#0b0e14] font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Strict 18th-C.
            </button>
          </div>
        </div>

        {/* Species & Controls */}
        <div className="space-y-3 bg-[#121622] p-3 rounded-lg border border-[#1d2536]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-300 font-medium">Species Ratio</span>
            <div className="flex items-center gap-1">
              {(['1:1', '2:1', '3:1', '4:1', 'mixed'] as SpeciesRatio[]).map(r => (
                <button
                  key={r}
                  onClick={() => setSpecies(r)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded ${
                    species === r
                      ? 'bg-amber-400 text-[#0b0d11] font-bold'
                      : 'bg-[#1a2130] text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-neutral-400">Contrary Motion Weight</span>
              <span className="font-mono text-amber-300">{contraryMotionWeight}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={contraryMotionWeight}
              onChange={e => setContraryMotionWeight(Number(e.target.value))}
              className="w-full h-1 accent-amber-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-neutral-400">Melodic Independence</span>
              <span className="font-mono text-amber-300">{independence}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={independence}
              onChange={e => setIndependence(Number(e.target.value))}
              className="w-full h-1 accent-amber-500 cursor-pointer"
            />
          </div>

          <label className="flex items-center justify-between text-[11px] text-neutral-300 cursor-pointer pt-1 border-t border-[#1e2535]">
            <span>Humanize Velocity Dynamics</span>
            <input
              type="checkbox"
              checked={humanizeVelocity}
              onChange={e => setHumanizeVelocity(e.target.checked)}
              className="accent-amber-500"
            />
          </label>

          {mode === 'invertible' && (
            <div className="pt-2 border-t border-[#1e2535]">
              <button
                onClick={handleInvertibleTest}
                className="w-full py-1.5 px-2 text-xs font-semibold text-neutral-200 bg-[#1a2233] hover:bg-[#222d42] border border-[#2d3a52] rounded flex items-center justify-center gap-1.5 transition-colors"
                title="Swap upper and lower registers to test double counterpoint"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
                <span>Test Register Inversion (Swap Voices)</span>
              </button>
            </div>
          )}
        </div>

        {/* Primary CTA: Generate */}
        <button
          onClick={handleGenerate}
          className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-[#0b0e14] font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
        >
          <Sparkles className="w-4 h-4 fill-current" />
          <span>Generate 4 Contrapuntal Alternatives</span>
        </button>

        {/* Candidate Alternatives List */}
        {candidates.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-neutral-300">Generated Alternatives</span>
              <span className="text-[10px] text-neutral-500 font-mono">Ranked by musical score</span>
            </div>

            {candidates.map((cand, idx) => {
              const isApplied = appliedCandidateId === cand.id;

              return (
                <div
                  key={cand.id}
                  className={`bg-[#121622] border rounded-lg p-3 space-y-2.5 transition-all shadow-sm ${
                    isApplied
                      ? 'border-emerald-500 ring-1 ring-emerald-500/50 bg-[#14231f]'
                      : 'border-[#1e2537] hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono flex items-center justify-center">
                          {idx + 1}
                        </span>
                        {cand.name}
                      </div>
                      <div className="text-[10px] text-amber-400/80 font-medium">{cand.tagline}</div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-mono font-bold text-amber-300">
                        {cand.score}
                      </span>
                      <span className="text-[10px] text-neutral-500">/100</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-neutral-400 leading-relaxed">
                    {cand.description}
                  </p>

                  {/* Score Breakdown Bars */}
                  <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-neutral-400 pt-1 border-t border-[#1a2130]">
                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span>Independence</span>
                        <span className="text-neutral-300">{cand.scoreBreakdown.voiceIndependence}%</span>
                      </div>
                      <div className="h-1 bg-[#1a2130] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-400 rounded-full"
                          style={{ width: `${cand.scoreBreakdown.voiceIndependence}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-0.5">
                        <span>Contrary Motion</span>
                        <span className="text-neutral-300">{cand.scoreBreakdown.contraryMotionRatio}%</span>
                      </div>
                      <div className="h-1 bg-[#1a2130] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${cand.scoreBreakdown.contraryMotionRatio}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: Audition & Apply */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleAudition(cand)}
                      className="flex-1 py-1.5 px-2 text-[11px] font-medium text-neutral-200 bg-[#1b2230] hover:bg-[#252f42] rounded border border-[#273247] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Play className="w-3 h-3 fill-current text-amber-400" />
                      <span>Audition</span>
                    </button>

                    <button
                      onClick={() => handleApply(cand)}
                      className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                        isApplied
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-400 hover:bg-amber-300 text-[#0b0e14]'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Applied to {targetVoice?.name}!</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Apply to {targetVoice?.name}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
