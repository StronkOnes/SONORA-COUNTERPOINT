/**
 * SONORA Counterpoint Studio - DAW Top Transport & Project Bar
 * Features master transport, swing/groove control, scale mode selector, multi-track & individual stem export.
 */

import React, { useRef } from 'react';
import {
  Play,
  Square,
  Repeat,
  Volume2,
  Download,
  Upload,
  BookOpen,
  Info,
  Sliders,
  FolderDown,
} from 'lucide-react';
import { Project, ScaleType } from '../types/music.ts';

interface TopBarProps {
  project: Project;
  isPlaying: boolean;
  isMetronomeOn: boolean;
  masterVolume: number;
  onTogglePlay: () => void;
  onStop: () => void;
  onToggleLoop: () => void;
  onToggleMetronome: () => void;
  onChangeBpm: (bpm: number) => void;
  onChangeTimeSignature: (ts: [number, number]) => void;
  onChangeKeySignature: (key: string) => void;
  onChangeScaleType: (scale: ScaleType) => void;
  onChangeSwing: (swing: number) => void;
  onChangeVolume: (vol: number) => void;
  onExportMidi: () => void;
  onExportAllStems: () => void;
  onImportMidi: (file: File) => void;
  onOpenPresets: () => void;
  onOpenGuide: () => void;
  onOpenAttribution: () => void;
  onRenameProject: (name: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  project,
  isPlaying,
  isMetronomeOn,
  masterVolume,
  onTogglePlay,
  onStop,
  onToggleLoop,
  onToggleMetronome,
  onChangeBpm,
  onChangeTimeSignature,
  onChangeKeySignature,
  onChangeScaleType,
  onChangeSwing,
  onChangeVolume,
  onExportMidi,
  onExportAllStems,
  onImportMidi,
  onOpenPresets,
  onOpenGuide,
  onOpenAttribution,
  onRenameProject,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportMidi(file);
    }
  };

  return (
    <header className="h-14 border-b border-[#1e2430] bg-[#0f131a] px-4 flex items-center justify-between gap-6 shrink-0 select-none z-30">
      {/* Zone 1: Wordmark & Project Name */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-[#0b0d11] font-bold text-xs tracking-wider">
            SN
          </div>
          <span className="text-base font-bold tracking-tight text-white font-sans whitespace-nowrap">
            SONORA
          </span>
        </div>
        <span className="text-xs text-neutral-600 hidden sm:inline">·</span>
        <input
          type="text"
          value={project.name}
          onChange={e => onRenameProject(e.target.value)}
          className="text-xs font-semibold text-neutral-300 bg-transparent border-b border-transparent hover:border-neutral-700 focus:border-amber-500 focus:outline-none px-1 py-0.5 rounded transition-colors max-w-[160px] truncate"
          title="Click to rename composition"
        />
      </div>

      {/* Zone 2: Navigation Links & Producer Presets */}
      <nav className="flex items-center gap-2">
        <button
          onClick={onOpenGuide}
          className="px-3 py-1.5 text-xs font-bold text-amber-300 bg-gradient-to-r from-amber-500/20 to-amber-600/10 hover:from-amber-500/30 hover:to-amber-600/20 border border-amber-500/40 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap shadow-sm"
          title="Open interactive Producer & Counterpoint Guide"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>How to Use (Guide)</span>
        </button>

        <button
          onClick={onOpenPresets}
          className="px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-[#141822] hover:bg-[#1c2230] border border-[#1f2636] rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap"
          title="Load historical & modern polyphonic presets"
        >
          <FolderDown className="w-3.5 h-3.5 text-neutral-400" />
          <span>Presets & Demos</span>
        </button>

        {/* Swing / Groove Slider */}
        <div className="hidden lg:flex items-center gap-1.5 bg-[#141822] px-2.5 py-1 rounded-md border border-[#1f2636]">
          <span className="text-[10px] font-mono text-neutral-400 uppercase">Swing</span>
          <input
            type="range"
            min={0}
            max={60}
            value={project.swing || 0}
            onChange={e => onChangeSwing(Number(e.target.value))}
            className="w-16 h-1 accent-amber-500 cursor-pointer"
            title={`MPC Swing: ${project.swing || 0}%`}
          />
          <span className="text-[10px] font-mono text-amber-400 font-bold w-6 text-right">
            {project.swing || 0}%
          </span>
        </div>
      </nav>

      {/* Zone 3: Transport & DAW Export Actions */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Playback Transport */}
        <div className="flex items-center gap-1 bg-[#141822] p-1 rounded-lg border border-[#1f2636]">
          <button
            onClick={onTogglePlay}
            className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${
              isPlaying
                ? 'bg-amber-500 text-[#0b0d11] shadow-md shadow-amber-500/30'
                : 'text-neutral-200 hover:bg-[#222b3d] hover:text-amber-400'
            }`}
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            <Play className={`w-4 h-4 ${isPlaying ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={onStop}
            className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-[#222b3d] transition-colors"
            title="Stop & Rewind"
          >
            <Square className="w-4 h-4 fill-current text-neutral-400" />
          </button>
          <button
            onClick={onToggleLoop}
            className={`p-1.5 rounded-md transition-colors ${
              project.loop ? 'text-amber-400 bg-amber-500/10' : 'text-neutral-500 hover:text-neutral-300'
            }`}
            title="Loop Composition"
          >
            <Repeat className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleMetronome}
            className={`px-2 py-1 text-[11px] font-mono font-medium rounded transition-colors ${
              isMetronomeOn ? 'text-amber-300 bg-amber-500/15' : 'text-neutral-500 hover:text-neutral-300'
            }`}
            title="Toggle Metronome Click"
          >
            TICK
          </button>
        </div>

        {/* Musical Parameters: BPM & Producer Scale */}
        <div className="hidden xl:flex items-center gap-2 text-xs font-mono text-neutral-300">
          <div className="flex items-center gap-1 bg-[#141822] px-2 py-1 rounded-md border border-[#1f2636]">
            <span className="text-neutral-500 text-[10px]">BPM</span>
            <input
              type="number"
              min={40}
              max={240}
              value={project.tempo}
              onChange={e => onChangeBpm(Number(e.target.value))}
              className="w-12 bg-transparent text-right font-mono font-bold text-amber-300 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#141822] px-2 py-1 rounded-md border border-[#1f2636]">
            <span className="text-neutral-500 text-[10px]">ROOT</span>
            <select
              value={project.keySignature}
              onChange={e => onChangeKeySignature(e.target.value)}
              className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer"
            >
              {['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'].map(k => (
                <option key={k} value={k} className="bg-[#141822] text-neutral-200">
                  {k}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-[#141822] px-2 py-1 rounded-md border border-[#1f2636]">
            <span className="text-neutral-500 text-[10px]">SCALE</span>
            <select
              value={project.scaleType}
              onChange={e => onChangeScaleType(e.target.value as ScaleType)}
              className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer"
            >
              <option value="minor" className="bg-[#141822] text-neutral-200">Natural Minor</option>
              <option value="harmonic_minor" className="bg-[#141822] text-neutral-200">Harmonic Minor (Drill/Baroque)</option>
              <option value="dorian" className="bg-[#141822] text-neutral-200">Dorian (House/Neo-Soul)</option>
              <option value="phrygian" className="bg-[#141822] text-neutral-200">Phrygian (Dark Trap)</option>
              <option value="major" className="bg-[#141822] text-neutral-200">Major</option>
              <option value="lydian" className="bg-[#141822] text-neutral-200">Lydian (Cinematic)</option>
              <option value="hirajoshi" className="bg-[#141822] text-neutral-200">Hirajoshi Pentatonic</option>
            </select>
          </div>
        </div>

        {/* Master Volume */}
        <div className="hidden 2xl:flex items-center gap-1.5 text-neutral-400">
          <Volume2 className="w-3.5 h-3.5 text-neutral-500" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={masterVolume}
            onChange={e => onChangeVolume(Number(e.target.value))}
            className="w-16 h-1 accent-amber-500 cursor-pointer"
            title="Master Gain"
          />
        </div>

        {/* MIDI Import & DAW Export Actions */}
        <div className="flex items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".mid,.midi"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-[#141822] hover:bg-[#1e2433] rounded-md border border-[#1f2636] transition-colors flex items-center gap-1.5 whitespace-nowrap"
            title="Import MIDI file into project"
          >
            <Upload className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Import</span>
          </button>

          {/* Export All Stems */}
          <button
            onClick={onExportAllStems}
            className="px-2.5 py-1.5 text-xs font-semibold text-neutral-200 hover:text-white bg-[#1b2230] hover:bg-[#252f42] rounded-md border border-[#2b374d] transition-colors flex items-center gap-1.5 whitespace-nowrap"
            title="Export separate MIDI stem file for each track"
          >
            <FolderDown className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">All Stems</span>
          </button>

          {/* Export Full Multi-track MIDI */}
          <button
            onClick={onExportMidi}
            className="px-3 py-1.5 text-xs font-bold text-[#0b0d11] bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-md shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap"
            title="Export complete Multi-Track MIDI (.mid) to DAW"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export MIDI</span>
          </button>
        </div>

        {/* Attribution & Info */}
        <button
          onClick={onOpenAttribution}
          className="p-1.5 text-neutral-400 hover:text-amber-300 hover:bg-[#141822] rounded-md transition-colors"
          title="Gratis ad Parnassum & License Attribution"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
