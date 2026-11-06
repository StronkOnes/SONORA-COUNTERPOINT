/**
 * SONORA Counterpoint Studio - Multi-Track Voice Panel (DAW Stems & Mixer)
 * Includes individual track MIDI stem export, modern producer instruments, and octave transpose.
 */

import React from 'react';
import {
  Volume2,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Sliders,
  Download,
} from 'lucide-react';
import { Voice, VoiceRole, InstrumentType } from '../types/music.ts';

interface VoiceTrackPanelProps {
  voices: Voice[];
  activeVoiceId: string;
  onSelectVoice: (id: string) => void;
  onUpdateVoice: (voiceId: string, updates: Partial<Voice>) => void;
  onAddVoice: () => void;
  onRemoveVoice: (voiceId: string) => void;
  onExportStem: (voiceId: string) => void;
}

const INSTRUMENT_LABELS: Record<InstrumentType, string> = {
  moog_sub_bass: 'Moog 808 Sub-Bass',
  neo_pluck: 'Neo Pluck (Trap/Drill)',
  vintage_rhodes: 'Vintage Rhodes EP',
  grand_piano: 'Concert Grand Piano',
  french_harpsichord: 'French Harpsichord',
  pipe_organ: 'Church Pipe Organ',
  chamber_strings: 'Chamber Strings',
  solo_cello: 'Solo Cello',
  flute_woodwind: 'Air Flute / Woodwind',
  analog_poly: 'Warm Analog Poly Pad',
};

const ROLE_LABELS: Record<VoiceRole, string> = {
  lead: 'Lead Melody',
  countermelody: 'Countermelody',
  bass: 'Basso / Sub-Bass',
  inner: 'Inner Harmonic',
  imitation: 'Imitative Canon',
  fugal: 'Fugal Subject',
  arp: 'Arpeggio / Fill',
};

export const VoiceTrackPanel: React.FC<VoiceTrackPanelProps> = ({
  voices,
  activeVoiceId,
  onSelectVoice,
  onUpdateVoice,
  onAddVoice,
  onRemoveVoice,
  onExportStem,
}) => {
  return (
    <div className="w-80 border-r border-[#1e2430] bg-[#0c0f15] flex flex-col shrink-0 select-none overflow-hidden h-full">
      {/* Panel Header */}
      <div className="p-3 border-b border-[#1e2430] flex items-center justify-between bg-[#10141c]">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
            DAW Tracks & Stems ({voices.length}/8)
          </span>
        </div>
        {voices.length < 8 && (
          <button
            onClick={onAddVoice}
            className="px-2 py-0.5 text-xs text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded flex items-center gap-1 transition-colors"
            title="Add a new polyphonic voice"
          >
            <Plus className="w-3 h-3" />
            <span>Add Track</span>
          </button>
        )}
      </div>

      {/* Voice List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#171c26]">
        {voices.map(voice => {
          const isActive = voice.id === activeVoiceId;

          return (
            <div
              key={voice.id}
              onClick={() => onSelectVoice(voice.id)}
              className={`p-3 transition-colors cursor-pointer ${
                isActive ? 'bg-[#151a24] border-l-2 border-amber-400' : 'hover:bg-[#11151e]'
              }`}
            >
              {/* Row 1: Role, Color, Name, Stem Download, Lock, Delete */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: voice.color }}
                  />
                  <input
                    type="text"
                    value={voice.name}
                    onClick={e => e.stopPropagation()}
                    onChange={e => onUpdateVoice(voice.id, { name: e.target.value })}
                    className="text-xs font-semibold text-neutral-200 bg-transparent border-b border-transparent hover:border-neutral-700 focus:border-amber-500 focus:outline-none truncate w-24"
                  />
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  {/* Stem Download Button */}
                  <button
                    onClick={() => onExportStem(voice.id)}
                    className="p-1 rounded text-neutral-400 hover:text-amber-300 hover:bg-[#1f2738] transition-colors"
                    title={`Export ${voice.name} as individual MIDI Stem (.mid)`}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Lock voice */}
                  <button
                    onClick={() => onUpdateVoice(voice.id, { locked: !voice.locked })}
                    className={`p-1 rounded text-xs transition-colors ${
                      voice.locked ? 'text-amber-400 bg-amber-500/15' : 'text-neutral-600 hover:text-neutral-400'
                    }`}
                    title={voice.locked ? 'Voice is locked (protected from regeneration)' : 'Lock voice to protect notes'}
                  >
                    {voice.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>

                  {voices.length > 1 && (
                    <button
                      onClick={() => onRemoveVoice(voice.id)}
                      className="p-1 rounded text-neutral-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Remove voice"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: Role & Instrument Selectors */}
              <div className="grid grid-cols-2 gap-1.5 mb-2.5" onClick={e => e.stopPropagation()}>
                <select
                  value={voice.role}
                  onChange={e => onUpdateVoice(voice.id, { role: e.target.value as VoiceRole })}
                  className="w-full bg-[#1b2230] text-[11px] font-medium text-neutral-300 rounded px-1.5 py-1 border border-[#263145] focus:outline-none focus:border-amber-500 cursor-pointer"
                  title="Musical Role"
                >
                  <option value="lead">Lead Melody</option>
                  <option value="countermelody">Countermelody</option>
                  <option value="bass">Bass Foundation</option>
                  <option value="inner">Inner Polyphony</option>
                  <option value="imitation">Imitative (Canon)</option>
                  <option value="fugal">Fugal Subject</option>
                  <option value="arp">Arp / Syncopation</option>
                </select>

                <select
                  value={voice.instrument}
                  onChange={e => onUpdateVoice(voice.id, { instrument: e.target.value as InstrumentType })}
                  className="w-full bg-[#1b2230] text-[11px] font-medium text-amber-300 rounded px-1.5 py-1 border border-[#263145] focus:outline-none focus:border-amber-500 cursor-pointer"
                  title="Sound Engine Instrument"
                >
                  {Object.entries(INSTRUMENT_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Row 3: Mute, Solo, Volume, Octave */}
              <div className="flex items-center gap-2 text-xs" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => onUpdateVoice(voice.id, { muted: !voice.muted })}
                  className={`w-6 h-5 rounded text-[10px] font-mono font-bold flex items-center justify-center transition-colors ${
                    voice.muted
                      ? 'bg-rose-500 text-white'
                      : 'bg-[#1b2230] text-neutral-400 hover:text-neutral-200 border border-[#263145]'
                  }`}
                  title="Mute Track"
                >
                  M
                </button>

                <button
                  onClick={() => onUpdateVoice(voice.id, { solo: !voice.solo })}
                  className={`w-6 h-5 rounded text-[10px] font-mono font-bold flex items-center justify-center transition-colors ${
                    voice.solo
                      ? 'bg-amber-500 text-[#0b0d11]'
                      : 'bg-[#1b2230] text-neutral-400 hover:text-neutral-200 border border-[#263145]'
                  }`}
                  title="Solo Track"
                >
                  S
                </button>

                {/* Volume slider */}
                <div className="flex-1 flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-neutral-500 shrink-0" />
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={voice.volume}
                    onChange={e => onUpdateVoice(voice.id, { volume: Number(e.target.value) })}
                    className="w-full h-1 accent-amber-500 cursor-pointer"
                    title={`Volume: ${Math.round(voice.volume * 100)}%`}
                  />
                </div>

                {/* Octave Shift */}
                <div className="flex items-center bg-[#1b2230] rounded border border-[#263145] text-[10px] font-mono">
                  <button
                    onClick={() => onUpdateVoice(voice.id, { octaveOffset: (voice.octaveOffset || 0) - 1 })}
                    className="px-1 text-neutral-400 hover:text-white"
                    title="Shift 1 Octave Down"
                  >
                    -8
                  </button>
                  <span className="px-1 text-amber-400 font-semibold">
                    {voice.octaveOffset > 0 ? `+${voice.octaveOffset}` : voice.octaveOffset}
                  </span>
                  <button
                    onClick={() => onUpdateVoice(voice.id, { octaveOffset: (voice.octaveOffset || 0) + 1 })}
                    className="px-1 text-neutral-400 hover:text-white"
                    title="Shift 1 Octave Up"
                  >
                    +8
                  </button>
                </div>
              </div>

              {/* Note count summary */}
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-neutral-500">
                <span>{voice.notes.length} notes</span>
                <span>{ROLE_LABELS[voice.role]}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
