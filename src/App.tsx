/**
 * SONORA Counterpoint Studio - DAW Master Polyphonic Workstation
 * Optimized for music producers: piano roll, multi-track stems, counterpoint intelligence, and velocity lane.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Project, Voice, NoteEvent, CandidateAlternative, ScaleType, TICKS_PER_BEAT } from './types/music.ts';
import { SAMPLE_PROJECTS } from './data/sampleProjects.ts';
import { TopBar } from './components/TopBar.tsx';
import { VoiceTrackPanel } from './components/VoiceTrackPanel.tsx';
import { PianoRoll } from './components/PianoRoll.tsx';
import { IntelligencePanel } from './components/IntelligencePanel.tsx';
import { AnalysisInspector } from './components/AnalysisInspector.tsx';
import { PresetLibraryModal } from './components/PresetLibraryModal.tsx';
import { AttributionModal } from './components/AttributionModal.tsx';
import { GuideModal } from './components/GuideModal.tsx';
import { audioEngine } from './audio/audioEngine.ts';
import { exportProjectToMidi, exportSingleVoiceStem, exportAllStems, downloadMidiFile } from './midi/midiWriter.ts';
import { parseMidiFile } from './midi/midiReader.ts';

const LOCAL_STORAGE_KEY = 'sonora_counterpoint_project_daw_v2';

export default function App() {
  const [project, setProject] = useState<Project>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.voices && parsed.voices.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return SAMPLE_PROJECTS[0];
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMetronomeOn, setIsMetronomeOn] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.85);
  const [currentTick, setCurrentTick] = useState(0);

  // Modals & Feedback
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isAttributionOpen, setIsAttributionOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const projectRef = useRef(project);
  useEffect(() => {
    projectRef.current = project;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(project));
    } catch {
      // ignore
    }
    audioEngine.updateVoices(project.voices);
    audioEngine.setSwing(project.swing || 0);
  }, [project]);

  const handleVolumeChange = (vol: number) => {
    setMasterVolume(vol);
    audioEngine.setMasterVolume(vol);
  };

  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      audioEngine.stopPlayback();
      setIsPlaying(false);
    } else {
      audioEngine.setMetronome(isMetronomeOn);
      audioEngine.setSwing(projectRef.current.swing || 0);
      const ticksPerBar = projectRef.current.timeSignature[0] * TICKS_PER_BEAT;
      const totalTicks = projectRef.current.totalBars * ticksPerBar;

      audioEngine.startPlayback(
        projectRef.current.voices,
        projectRef.current.tempo,
        projectRef.current.timeSignature,
        currentTick >= totalTicks ? 0 : currentTick,
        projectRef.current.loop,
        projectRef.current.loopStartTick,
        totalTicks,
        (tick: number) => {
          setCurrentTick(tick);
        }
      );
      setIsPlaying(true);
    }
  }, [isPlaying, isMetronomeOn, currentTick]);

  const handleStop = () => {
    audioEngine.stopPlayback();
    setIsPlaying(false);
    setCurrentTick(0);
    audioEngine.seek(0);
  };

  const handleToggleLoop = () => {
    setProject(prev => ({ ...prev, loop: !prev.loop }));
  };

  const handleToggleMetronome = () => {
    const nextState = !isMetronomeOn;
    setIsMetronomeOn(nextState);
    audioEngine.setMetronome(nextState);
  };

  const handleChangeBpm = (bpm: number) => {
    const clamped = Math.max(40, Math.min(240, bpm));
    setProject(prev => ({ ...prev, tempo: clamped }));
  };

  const handleChangeTimeSignature = (ts: [number, number]) => {
    setProject(prev => ({ ...prev, timeSignature: ts }));
  };

  const handleChangeKeySignature = (key: string) => {
    setProject(prev => ({ ...prev, keySignature: key }));
  };

  const handleChangeScaleType = (scaleType: ScaleType) => {
    setProject(prev => ({ ...prev, scaleType }));
  };

  const handleChangeSwing = (swing: number) => {
    setProject(prev => ({ ...prev, swing }));
    audioEngine.setSwing(swing);
  };

  const handleRenameProject = (name: string) => {
    setProject(prev => ({ ...prev, name }));
  };

  // Voice management
  const handleSelectVoice = (id: string) => {
    setProject(prev => ({ ...prev, activeVoiceId: id }));
  };

  const handleUpdateVoice = (voiceId: string, updates: Partial<Voice>) => {
    setProject(prev => ({
      ...prev,
      voices: prev.voices.map(v => (v.id === voiceId ? { ...v, ...updates } : v)),
    }));
  };

  const handleAddVoice = () => {
    if (project.voices.length >= 8) return;
    const colors = ['#f59e0b', '#38bdf8', '#34d399', '#a78bfa', '#fb7185', '#fbbf24', '#2dd4bf', '#818cf8'];
    const newIdx = project.voices.length + 1;
    const isBass = newIdx === 3 || newIdx === 4;
    const newVoice: Voice = {
      id: `voice-${Date.now()}`,
      name: isBass ? 'Sub-Bass' : `Track ${newIdx}`,
      role: isBass ? 'bass' : 'countermelody',
      color: colors[(newIdx - 1) % colors.length],
      instrument: isBass ? 'moog_sub_bass' : 'neo_pluck',
      volume: 0.85,
      pan: newIdx % 2 === 0 ? 0.2 : -0.2,
      muted: false,
      solo: false,
      locked: false,
      notes: [],
      octaveOffset: isBass ? -1 : 0,
    };

    setProject(prev => ({
      ...prev,
      voices: [...prev.voices, newVoice],
      activeVoiceId: newVoice.id,
    }));
  };

  const handleRemoveVoice = (voiceId: string) => {
    if (project.voices.length <= 1) return;
    setProject(prev => {
      const remaining = prev.voices.filter(v => v.id !== voiceId);
      return {
        ...prev,
        voices: remaining,
        activeVoiceId: prev.activeVoiceId === voiceId ? remaining[0].id : prev.activeVoiceId,
      };
    });
  };

  // Note editing
  const handleAddNote = (voiceId: string, note: NoteEvent) => {
    setProject(prev => ({
      ...prev,
      voices: prev.voices.map(v =>
        v.id === voiceId ? { ...v, notes: [...v.notes, note] } : v
      ),
    }));
  };

  const handleUpdateNote = (voiceId: string, noteId: string, updates: Partial<NoteEvent>) => {
    setProject(prev => ({
      ...prev,
      voices: prev.voices.map(v =>
        v.id === voiceId
          ? {
              ...v,
              notes: v.notes.map(n => (n.id === noteId ? { ...n, ...updates } : n)),
            }
          : v
      ),
    }));
  };

  const handleDeleteNote = (voiceId: string, noteId: string) => {
    setProject(prev => ({
      ...prev,
      voices: prev.voices.map(v =>
        v.id === voiceId ? { ...v, notes: v.notes.filter(n => n.id !== noteId) } : v
      ),
    }));
  };

  // DAW Tools: Humanize, Transpose, Duplicate
  const handleHumanizeVoice = (voiceId: string) => {
    setProject(prev => ({
      ...prev,
      voices: prev.voices.map(v => {
        if (v.id !== voiceId) return v;
        const humanizedNotes = v.notes.map(n => {
          const velJitter = Math.floor(Math.random() * 24 - 12);
          const timeJitter = Math.floor(Math.random() * 16 - 8);
          return {
            ...n,
            velocity: Math.max(30, Math.min(127, n.velocity + velJitter)),
            startTime: Math.max(0, n.startTime + timeJitter),
          };
        });
        return { ...v, notes: humanizedNotes };
      }),
    }));
  };

  const handleTransposeVoice = (voiceId: string, semitones: number) => {
    setProject(prev => ({
      ...prev,
      voices: prev.voices.map(v => {
        if (v.id !== voiceId) return v;
        const transposed = v.notes.map(n => ({
          ...n,
          pitch: Math.max(0, Math.min(127, n.pitch + semitones)),
        }));
        return { ...v, notes: transposed };
      }),
    }));
  };

  const handleDuplicateVoiceNotes = (voiceId: string) => {
    const ticksPerBar = project.timeSignature[0] * TICKS_PER_BEAT;
    setProject(prev => ({
      ...prev,
      voices: prev.voices.map(v => {
        if (v.id !== voiceId || v.notes.length === 0) return v;
        const maxTime = Math.max(...v.notes.map(n => n.startTime + n.duration));
        const barSpan = Math.ceil(maxTime / ticksPerBar) * ticksPerBar;
        const duplicated = v.notes.map(n => ({
          ...n,
          id: `dup-${Date.now()}-${Math.random()}`,
          startTime: n.startTime + barSpan,
        }));
        return { ...v, notes: [...v.notes, ...duplicated] };
      }),
    }));
  };

  // Candidate application - robustly applies to target track and auto-focuses piano roll
  const handleApplyCandidate = (voiceId: string, candidate: CandidateAlternative) => {
    setProject(prev => {
      // Ensure target voice exists, or fallback gracefully
      const effectiveVoiceId = prev.voices.some(v => v.id === voiceId)
        ? voiceId
        : prev.voices.find(v => v.id !== prev.voices[0]?.id)?.id || prev.voices[0]?.id;

      if (!effectiveVoiceId) return prev;

      const targetVoice = prev.voices.find(v => v.id === effectiveVoiceId);
      const targetName = targetVoice?.name || 'Target Track';

      const updatedVoices = prev.voices.map(v =>
        v.id === effectiveVoiceId
          ? {
              ...v,
              notes: candidate.notes.map(n => ({ ...n })),
              locked: false, // ensure unlocked so producer can immediately edit
            }
          : v
      );

      // Trigger user confirmation toast
      setToastMessage(`✓ Applied "${candidate.name}" to ${targetName} (${candidate.notes.length} notes)`);
      setTimeout(() => setToastMessage(null), 3500);

      return {
        ...prev,
        voices: updatedVoices,
        activeVoiceId: effectiveVoiceId, // Automatically switch active editing focus to this track!
      };
    });
  };

  // Invertible Counterpoint register inversion
  const handleInvertVoices = (v1Id: string, v2Id: string) => {
    setProject(prev => {
      const v1 = prev.voices.find(v => v.id === v1Id);
      const v2 = prev.voices.find(v => v.id === v2Id);
      if (!v1 || !v2) return prev;

      const invertedV1Notes = v1.notes.map(n => ({ ...n, pitch: n.pitch - 12 }));
      const invertedV2Notes = v2.notes.map(n => ({ ...n, pitch: n.pitch + 12 }));

      return {
        ...prev,
        voices: prev.voices.map(v => {
          if (v.id === v1Id) return { ...v, notes: invertedV1Notes };
          if (v.id === v2Id) return { ...v, notes: invertedV2Notes };
          return v;
        }),
      };
    });
  };

  // MIDI Export & Stems
  const handleExportMidi = () => {
    const data = exportProjectToMidi(project);
    const safeName = project.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    downloadMidiFile(data, `${safeName}_multitrack.mid`);
  };

  const handleExportSingleStem = (voiceId: string) => {
    exportSingleVoiceStem(project, voiceId);
  };

  const handleExportAllStems = () => {
    exportAllStems(project);
  };

  const handleImportMidi = async (file: File) => {
    try {
      const parsed = await parseMidiFile(file);
      if (parsed.voices && parsed.voices.length > 0) {
        setProject(prev => ({
          ...prev,
          name: file.name.replace(/\.[^/.]+$/, ''),
          tempo: parsed.tempo || prev.tempo,
          voices: parsed.voices!,
          activeVoiceId: parsed.voices![0].id,
        }));
      }
    } catch (err) {
      console.error('Failed to import MIDI file', err);
      alert('Could not parse MIDI file. Please check file formatting.');
    }
  };

  const handleJumpToMeasure = (measure: number) => {
    const ticksPerBar = project.timeSignature[0] * TICKS_PER_BEAT;
    const targetTick = (measure - 1) * ticksPerBar;
    setCurrentTick(targetTick);
    audioEngine.seek(targetTick);
  };

  const handleCreateNewProject = (voiceCount: number) => {
    const ticksPerBar = project.timeSignature[0] * TICKS_PER_BEAT;
    const totalBars = 4;
    const colors = ['#f59e0b', '#38bdf8', '#34d399', '#a78bfa', '#fb7185', '#fbbf24'];

    const newVoices: Voice[] = Array.from({ length: voiceCount }).map((_, idx) => ({
      id: `voice-${Date.now()}-${idx}`,
      name: idx === 0 ? 'Lead Melody' : idx === voiceCount - 1 ? '808 Sub-Bass' : `Countermelody ${idx}`,
      role: idx === 0 ? 'lead' : idx === voiceCount - 1 ? 'bass' : 'countermelody',
      color: colors[idx % colors.length],
      instrument: idx === 0 ? 'neo_pluck' : idx === voiceCount - 1 ? 'moog_sub_bass' : 'vintage_rhodes',
      volume: 0.85,
      pan: idx === 0 ? 0 : (idx % 2 === 1 ? -0.2 : 0.2),
      muted: false,
      solo: false,
      locked: false,
      notes: [],
      octaveOffset: idx === voiceCount - 1 ? -1 : 0,
    }));

    setProject({
      id: `proj-${Date.now()}`,
      name: `New ${voiceCount}-Track DAW Project`,
      tempo: 120,
      timeSignature: [4, 4],
      keySignature: 'C',
      scaleType: 'minor',
      loop: true,
      loopStartTick: 0,
      loopEndTick: totalBars * ticksPerBar,
      totalBars,
      voices: newVoices,
      activeVoiceId: newVoices[0].id,
      generationHistory: [],
      attributionNotice: 'SONORA DAW Polyphony Project.',
      swing: 15,
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0b0d11] text-[#e2e8f0] overflow-hidden select-none">
      {/* 1. Top Transport & DAW Actions Bar */}
      <TopBar
        project={project}
        isPlaying={isPlaying}
        isMetronomeOn={isMetronomeOn}
        masterVolume={masterVolume}
        onTogglePlay={handleTogglePlay}
        onStop={handleStop}
        onToggleLoop={handleToggleLoop}
        onToggleMetronome={handleToggleMetronome}
        onChangeBpm={handleChangeBpm}
        onChangeTimeSignature={handleChangeTimeSignature}
        onChangeKeySignature={handleChangeKeySignature}
        onChangeScaleType={handleChangeScaleType}
        onChangeSwing={handleChangeSwing}
        onChangeVolume={handleVolumeChange}
        onExportMidi={handleExportMidi}
        onExportAllStems={handleExportAllStems}
        onImportMidi={handleImportMidi}
        onOpenPresets={() => setIsPresetsOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenAttribution={() => setIsAttributionOpen(true)}
        onRenameProject={handleRenameProject}
      />

      {/* Floating Action Confirmation Toast */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-[#16271f] border border-emerald-500/50 text-emerald-300 px-4 py-2 rounded-lg shadow-2xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. Main Middle DAW Canvas: Mixer Track Stems + High-Impact Piano Roll + Intelligence Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Tracks & Stems Panel */}
        <VoiceTrackPanel
          voices={project.voices}
          activeVoiceId={project.activeVoiceId}
          onSelectVoice={handleSelectVoice}
          onUpdateVoice={handleUpdateVoice}
          onAddVoice={handleAddVoice}
          onRemoveVoice={handleRemoveVoice}
          onExportStem={handleExportSingleStem}
        />

        {/* Center: DAW Piano Roll & Velocity Lane */}
        <PianoRoll
          project={project}
          currentTick={currentTick}
          onAddNote={handleAddNote}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
          onHumanizeVoice={handleHumanizeVoice}
          onTransposeVoice={handleTransposeVoice}
          onDuplicateVoiceNotes={handleDuplicateVoiceNotes}
        />

        {/* Right: Counterpoint Intelligence & Alternative Generator */}
        <IntelligencePanel
          project={project}
          onApplyCandidate={handleApplyCandidate}
          onInvertVoices={handleInvertVoices}
        />
      </div>

      {/* 3. Bottom Contrapuntal Analysis & Rule Inspector */}
      <AnalysisInspector project={project} onJumpToMeasure={handleJumpToMeasure} />

      {/* Modals */}
      <GuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onLoadExamplePreset={() => setProject(SAMPLE_PROJECTS[0])}
      />

      <PresetLibraryModal
        isOpen={isPresetsOpen}
        onClose={() => setIsPresetsOpen(false)}
        onSelectProject={setProject}
        onCreateNewProject={handleCreateNewProject}
      />

      <AttributionModal
        isOpen={isAttributionOpen}
        onClose={() => setIsAttributionOpen(false)}
      />
    </div>
  );
}
