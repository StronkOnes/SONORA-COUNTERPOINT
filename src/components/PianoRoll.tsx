/**
 * SONORA Counterpoint Studio - DAW Master Piano Roll & Velocity Lane
 * Includes multi-track ghost notes, velocity editor lane, scale highlighter, quantize, and humanize.
 */

import React, { useRef, useState, useEffect } from 'react';
import { Project, Voice, NoteEvent, TICKS_PER_BEAT } from '../types/music.ts';
import { isBlackKey, midiToNoteName } from '../music-core/theory/pitch.ts';
import { getKeyInfo, isPitchInKey } from '../music-core/theory/scales.ts';
import { audioEngine } from '../audio/audioEngine.ts';
import {
  ZoomIn,
  ZoomOut,
  Magnet,
  Wand2,
  Sliders,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Copy,
} from 'lucide-react';

interface PianoRollProps {
  project: Project;
  currentTick: number;
  onAddNote: (voiceId: string, note: NoteEvent) => void;
  onUpdateNote: (voiceId: string, noteId: string, updates: Partial<NoteEvent>) => void;
  onDeleteNote: (voiceId: string, noteId: string) => void;
  onHumanizeVoice: (voiceId: string) => void;
  onTransposeVoice: (voiceId: string, semitones: number) => void;
  onDuplicateVoiceNotes: (voiceId: string) => void;
}

export const PianoRoll: React.FC<PianoRollProps> = ({
  project,
  currentTick,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onHumanizeVoice,
  onTransposeVoice,
  onDuplicateVoiceNotes,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pitch range: C2 (36) to C6 (84)
  const MIN_PITCH = 36;
  const MAX_PITCH = 84;
  const TOTAL_PITCHES = MAX_PITCH - MIN_PITCH + 1;

  const [zoomLevel, setZoomLevel] = useState(1.1);
  const [snapTicks, setSnapTicks] = useState(TICKS_PER_BEAT / 2); // 8th note default
  const [showVelocityLane, setShowVelocityLane] = useState(true);
  const [highlightScaleOnly, setHighlightScaleOnly] = useState(true);

  const pixelsPerTick = 0.14 * zoomLevel;
  const rowHeight = 18; // px per semitone
  const velocityLaneHeight = showVelocityLane ? 90 : 0;

  const activeVoice = project.voices.find(v => v.id === project.activeVoiceId) || project.voices[0];
  const keyInfo = getKeyInfo(project.keySignature, project.scaleType);

  const ticksPerBar = project.timeSignature[0] * TICKS_PER_BEAT;
  const totalTicks = project.totalBars * ticksPerBar;
  const gridWidth = Math.max(1200, totalTicks * pixelsPerTick);
  const gridHeight = TOTAL_PITCHES * rowHeight;

  // Dragging & Interaction states
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const [dragAction, setDragAction] = useState<'move' | 'resize' | 'velocity' | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{
    x: number;
    y: number;
    startTick: number;
    pitch: number;
    duration: number;
    velocity: number;
  } | null>(null);

  // Auto-scroll to middle C on mount
  useEffect(() => {
    if (containerRef.current) {
      const c4Y = (MAX_PITCH - 60) * rowHeight;
      containerRef.current.scrollTop = Math.max(0, c4Y - 180);
    }
  }, []);

  const handleGridMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeVoice || activeVoice.locked) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedPitch = MAX_PITCH - Math.floor(y / rowHeight);
    const rawTick = x / pixelsPerTick;
    const snappedStartTick = Math.max(0, Math.floor(rawTick / snapTicks) * snapTicks);

    audioEngine.playPreviewNote(
      clickedPitch + (activeVoice.octaveOffset || 0) * 12,
      activeVoice.instrument,
      0.35
    );

    const newNote: NoteEvent = {
      id: `note-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      pitch: clickedPitch,
      startTime: snappedStartTick,
      duration: snapTicks,
      velocity: 88,
    };

    onAddNote(activeVoice.id, newNote);
  };

  const handleNoteMouseDown = (e: React.MouseEvent, note: NoteEvent, action: 'move' | 'resize') => {
    e.stopPropagation();
    if (!activeVoice || activeVoice.locked) return;

    setDraggingNoteId(note.id);
    setDragAction(action);
    setDragStartPos({
      x: e.clientX,
      y: e.clientY,
      startTick: note.startTime,
      pitch: note.pitch,
      duration: note.duration,
      velocity: note.velocity,
    });

    audioEngine.playPreviewNote(
      note.pitch + (activeVoice.octaveOffset || 0) * 12,
      activeVoice.instrument,
      0.25
    );
  };

  const handleVelocityMouseDown = (e: React.MouseEvent, note: NoteEvent) => {
    e.stopPropagation();
    if (!activeVoice || activeVoice.locked) return;

    setDraggingNoteId(note.id);
    setDragAction('velocity');
    setDragStartPos({
      x: e.clientX,
      y: e.clientY,
      startTick: note.startTime,
      pitch: note.pitch,
      duration: note.duration,
      velocity: note.velocity,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNoteId || !dragAction || !dragStartPos || !activeVoice) return;

    const deltaX = e.clientX - dragStartPos.x;
    const deltaY = e.clientY - dragStartPos.y;

    if (dragAction === 'move') {
      const deltaTicks = Math.round((deltaX / pixelsPerTick) / snapTicks) * snapTicks;
      const deltaPitches = -Math.round(deltaY / rowHeight);
      const newStart = Math.max(0, dragStartPos.startTick + deltaTicks);
      const newPitch = Math.max(MIN_PITCH, Math.min(MAX_PITCH, dragStartPos.pitch + deltaPitches));

      onUpdateNote(activeVoice.id, draggingNoteId, {
        startTime: newStart,
        pitch: newPitch,
      });
    } else if (dragAction === 'resize') {
      const deltaTicks = Math.round((deltaX / pixelsPerTick) / snapTicks) * snapTicks;
      const newDuration = Math.max(snapTicks, dragStartPos.duration + deltaTicks);
      onUpdateNote(activeVoice.id, draggingNoteId, {
        duration: newDuration,
      });
    } else if (dragAction === 'velocity') {
      const velDelta = -Math.round(deltaY * 1.3);
      const newVel = Math.max(1, Math.min(127, dragStartPos.velocity + velDelta));
      onUpdateNote(activeVoice.id, draggingNoteId, {
        velocity: newVel,
      });
    }
  };

  const handleMouseUp = () => {
    setDraggingNoteId(null);
    setDragAction(null);
    setDragStartPos(null);
  };

  return (
    <div
      className="flex-1 flex flex-col bg-[#0b0e14] overflow-hidden select-none relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* DAW Piano Roll Tool Bar */}
      <div className="h-10 border-b border-[#1b2230] bg-[#10141d] px-3 flex items-center justify-between text-xs text-neutral-300 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shadow-sm"
              style={{ backgroundColor: activeVoice?.color || '#f59e0b' }}
            />
            <span className="font-bold text-white">
              {activeVoice?.name}
            </span>
            <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              {activeVoice?.role.toUpperCase()}
            </span>
          </div>

          <span className="text-neutral-700">|</span>

          {/* Grid Snap Selector */}
          <div className="flex items-center gap-1.5">
            <Magnet className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={snapTicks}
              onChange={e => setSnapTicks(Number(e.target.value))}
              className="bg-[#171d29] text-[11px] font-mono text-neutral-200 rounded px-2 py-0.5 border border-[#242e42] focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value={TICKS_PER_BEAT}>1/4 (Beat)</option>
              <option value={TICKS_PER_BEAT / 2}>1/8 (Offbeat)</option>
              <option value={TICKS_PER_BEAT / 4}>1/16 (Trap / Drill)</option>
              <option value={TICKS_PER_BEAT / 8}>1/32 (Hi-Res)</option>
            </select>
          </div>

          {/* Scale Highlight Toggle */}
          <button
            onClick={() => setHighlightScaleOnly(!highlightScaleOnly)}
            className={`px-2 py-0.5 text-[11px] font-medium rounded border transition-colors ${
              highlightScaleOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-[#171d29] text-neutral-400 border-[#242e42] hover:text-white'
            }`}
            title="Highlight in-key scale notes"
          >
            Scale Guide: {keyInfo.root} {keyInfo.mode}
          </button>
        </div>

        {/* DAW Action Buttons: Humanize, Transpose, Duplicate, Zoom */}
        <div className="flex items-center gap-2">
          {/* Transpose Octave */}
          <div className="flex items-center bg-[#171d29] rounded border border-[#242e42] text-[10px] font-mono">
            <button
              onClick={() => activeVoice && onTransposeVoice(activeVoice.id, -12)}
              className="px-1.5 py-0.5 hover:text-white flex items-center gap-0.5"
              title="Transpose 1 Octave Down (-12)"
            >
              <ArrowDown className="w-3 h-3" />
              -Oct
            </button>
            <span className="text-neutral-700">|</span>
            <button
              onClick={() => activeVoice && onTransposeVoice(activeVoice.id, 12)}
              className="px-1.5 py-0.5 hover:text-white flex items-center gap-0.5"
              title="Transpose 1 Octave Up (+12)"
            >
              <ArrowUp className="w-3 h-3" />
              +Oct
            </button>
          </div>

          {/* Duplicate Phrase */}
          <button
            onClick={() => activeVoice && onDuplicateVoiceNotes(activeVoice.id)}
            className="px-2 py-1 text-[11px] font-medium text-neutral-300 hover:text-white bg-[#171d29] hover:bg-[#20293a] border border-[#242e42] rounded flex items-center gap-1 transition-colors"
            title="Duplicate notes forward by bar length"
          >
            <Copy className="w-3 h-3 text-neutral-400" />
            <span className="hidden sm:inline">Duplicate</span>
          </button>

          {/* Humanize Velocity & Timing */}
          <button
            onClick={() => activeVoice && onHumanizeVoice(activeVoice.id)}
            className="px-2 py-1 text-[11px] font-medium text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded flex items-center gap-1 transition-colors"
            title="Humanize velocities & subtle micro-timing (+/- 8%)"
          >
            <Wand2 className="w-3 h-3" />
            <span>Humanize</span>
          </button>

          {/* Toggle Velocity Lane */}
          <button
            onClick={() => setShowVelocityLane(!showVelocityLane)}
            className={`p-1 rounded border text-[11px] font-mono flex items-center gap-1 ${
              showVelocityLane
                ? 'bg-[#222b3d] text-amber-300 border-amber-500/30'
                : 'bg-[#171d29] text-neutral-400 border-[#242e42]'
            }`}
            title="Toggle Velocity Editor Lane"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Velocity</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-[#171d29] p-0.5 rounded border border-[#242e42]">
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.2))}
              className="p-1 hover:text-white text-neutral-400"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px] font-mono text-neutral-400 w-8 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.2))}
              className="p-1 hover:text-white text-neutral-400"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Piano Roll Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Piano Keys Column */}
        <div className="w-16 border-r border-[#1e2535] bg-[#0c0f16] flex flex-col shrink-0 overflow-hidden z-20 shadow-md">
          {/* Top ruler placeholder */}
          <div className="h-6 border-b border-[#1e2535] bg-[#121722]" />

          <div
            className="flex-1 overflow-hidden"
            style={{
              transform: `translateY(-${containerRef.current?.scrollTop || 0}px)`,
            }}
          >
            {Array.from({ length: TOTAL_PITCHES }).map((_, idx) => {
              const pitch = MAX_PITCH - idx;
              const isBlack = isBlackKey(pitch);
              const isC = pitch % 12 === 0;
              const inKey = isPitchInKey(pitch, keyInfo);

              return (
                <div
                  key={pitch}
                  onClick={() =>
                    audioEngine.playPreviewNote(
                      pitch + (activeVoice?.octaveOffset || 0) * 12,
                      activeVoice?.instrument || 'neo_pluck',
                      0.4
                    )
                  }
                  style={{ height: rowHeight }}
                  className={`flex items-center justify-between px-1.5 text-[9px] font-mono border-b border-[#181f2c] cursor-pointer transition-colors ${
                    isBlack
                      ? 'bg-[#121620] text-neutral-500 hover:bg-[#1a2130]'
                      : 'bg-[#1b2230] text-neutral-300 hover:bg-[#253043]'
                  } ${isC ? 'border-b-amber-500/40 text-amber-300 font-bold' : ''} ${
                    inKey && highlightScaleOnly ? 'bg-amber-500/[0.04]' : ''
                  }`}
                  title={`${midiToNoteName(pitch)} (${pitch})`}
                >
                  <span>{midiToNoteName(pitch)}</span>
                  {inKey && !isC && <span className="w-1 h-1 rounded-full bg-amber-400/40" />}
                </div>
              );
            })}
          </div>

          {/* Velocity lane left label */}
          {showVelocityLane && (
            <div
              style={{ height: velocityLaneHeight }}
              className="border-t border-[#1e2535] bg-[#0e121a] flex items-center justify-center text-[10px] font-mono text-neutral-500 uppercase tracking-wider"
            >
              Vel
            </div>
          )}
        </div>

        {/* Right: Grid, Notes, and Velocity Lane Scrollable Container */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto relative bg-[#090c12]"
        >
          {/* Measure Ruler Bar (Sticky at top) */}
          <div
            className="h-6 sticky top-0 border-b border-[#1e2535] bg-[#121722] z-10 flex select-none"
            style={{ width: gridWidth }}
          >
            {Array.from({ length: project.totalBars }).map((_, barIdx) => {
              const barWidth = ticksPerBar * pixelsPerTick;

              return (
                <div
                  key={barIdx}
                  style={{ width: barWidth }}
                  className="border-r border-[#263147] text-[10px] font-mono text-neutral-400 px-2 flex items-center justify-between"
                >
                  <span className="font-bold text-amber-300/90">Bar {barIdx + 1}</span>
                  <span className="text-[9px] text-neutral-600">
                    {project.timeSignature[0]}/{project.timeSignature[1]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Notes Grid Area */}
          <div
            style={{ width: gridWidth, height: gridHeight }}
            onMouseDown={handleGridMouseDown}
            className="relative cursor-crosshair"
          >
            {/* Background pitch lanes */}
            {Array.from({ length: TOTAL_PITCHES }).map((_, idx) => {
              const pitch = MAX_PITCH - idx;
              const isBlack = isBlackKey(pitch);
              const inKey = isPitchInKey(pitch, keyInfo);
              const isC = pitch % 12 === 0;

              return (
                <div
                  key={pitch}
                  style={{ top: idx * rowHeight, height: rowHeight }}
                  className={`absolute w-full border-b border-[#141a26] pointer-events-none ${
                    isBlack ? 'bg-[#0b0e15]' : 'bg-[#0f131d]'
                  } ${inKey && highlightScaleOnly ? 'bg-amber-500/[0.03]' : ''} ${
                    isC ? 'border-b-amber-500/30' : ''
                  }`}
                />
              );
            })}

            {/* Vertical Bar & Beat Lines */}
            {Array.from({ length: project.totalBars * project.timeSignature[0] }).map((_, beatIdx) => {
              const beatTick = beatIdx * TICKS_PER_BEAT;
              const isBarStart = beatIdx % project.timeSignature[0] === 0;
              const xPos = beatTick * pixelsPerTick;

              return (
                <div
                  key={beatIdx}
                  style={{ left: xPos }}
                  className={`absolute top-0 bottom-0 pointer-events-none ${
                    isBarStart ? 'w-[1.5px] bg-[#2a364d]' : 'w-[0.5px] bg-[#161d2b]'
                  }`}
                />
              );
            })}

            {/* Inactive Voices (Ghost Notes) */}
            {project.voices
              .filter(v => v.id !== activeVoice?.id && !v.muted)
              .map(voice => (
                <React.Fragment key={voice.id}>
                  {voice.notes.map(note => {
                    const top = (MAX_PITCH - note.pitch) * rowHeight;
                    const left = note.startTime * pixelsPerTick;
                    const width = Math.max(8, note.duration * pixelsPerTick);

                    return (
                      <div
                        key={note.id}
                        style={{
                          top: top + 2,
                          left,
                          width: width - 2,
                          height: rowHeight - 4,
                          borderColor: voice.color,
                        }}
                        className="absolute rounded border opacity-40 bg-opacity-20 pointer-events-none flex items-center px-1 text-[8px] font-mono truncate text-neutral-300"
                        title={`${voice.name}: ${midiToNoteName(note.pitch)}`}
                      >
                        {midiToNoteName(note.pitch)}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}

            {/* Active Voice Notes */}
            {activeVoice?.notes.map(note => {
              const top = (MAX_PITCH - note.pitch) * rowHeight;
              const left = note.startTime * pixelsPerTick;
              const width = Math.max(10, note.duration * pixelsPerTick);
              const isSelected = note.id === draggingNoteId;

              // Velocity opacity/brightness
              const velOpacity = 0.6 + (note.velocity / 127) * 0.4;

              return (
                <div
                  key={note.id}
                  style={{
                    top: top + 1,
                    left,
                    width: width - 1,
                    height: rowHeight - 2,
                    backgroundColor: activeVoice.color,
                    opacity: velOpacity,
                  }}
                  onMouseDown={e => handleNoteMouseDown(e, note, 'move')}
                  onDoubleClick={() => onDeleteNote(activeVoice.id, note.id)}
                  className={`absolute rounded-sm shadow-md cursor-grab active:cursor-grabbing flex items-center justify-between px-1 text-[10px] font-mono font-bold text-[#0b0e14] transition-all select-none group ${
                    isSelected ? 'ring-2 ring-white z-20' : 'z-10 hover:brightness-110'
                  }`}
                >
                  <span className="truncate">{midiToNoteName(note.pitch)}</span>

                  <div
                    onMouseDown={e => handleNoteMouseDown(e, note, 'resize')}
                    className="w-2.5 h-full absolute right-0 top-0 cursor-ew-resize hover:bg-black/25 rounded-r-sm"
                    title="Drag to resize note duration"
                  />
                </div>
              );
            })}

            {/* Real-time Playhead Cursor Line */}
            <div
              style={{ left: currentTick * pixelsPerTick }}
              className="absolute top-0 bottom-0 w-[2px] bg-amber-400 z-30 pointer-events-none shadow-[0_0_12px_rgba(251,191,36,0.8)]"
            >
              <div className="w-2.5 h-2.5 bg-amber-400 rotate-45 -ml-1 -mt-1 shadow" />
            </div>
          </div>

          {/* Bottom Velocity Editor Lane */}
          {showVelocityLane && (
            <div
              style={{ width: gridWidth, height: velocityLaneHeight }}
              className="sticky bottom-0 border-t border-[#1e2535] bg-[#0c0f17] relative select-none z-10"
            >
              {/* Vertical Beat Guides in Velocity Lane */}
              {Array.from({ length: project.totalBars * project.timeSignature[0] }).map((_, beatIdx) => {
                const beatTick = beatIdx * TICKS_PER_BEAT;
                const isBarStart = beatIdx % project.timeSignature[0] === 0;
                const xPos = beatTick * pixelsPerTick;

                return (
                  <div
                    key={`vel-beat-${beatIdx}`}
                    style={{ left: xPos }}
                    className={`absolute top-0 bottom-0 pointer-events-none ${
                      isBarStart ? 'w-[1.5px] bg-[#222c3f]' : 'w-[0.5px] bg-[#141a26]'
                    }`}
                  />
                );
              })}

              {/* Velocity Bars for Active Voice */}
              {activeVoice?.notes.map(note => {
                const x = note.startTime * pixelsPerTick;
                const heightPercent = (note.velocity / 127) * 100;
                const isSelected = note.id === draggingNoteId;

                return (
                  <div
                    key={`vel-${note.id}`}
                    style={{ left: x }}
                    onMouseDown={e => handleVelocityMouseDown(e, note)}
                    className="absolute bottom-0 w-2.5 flex flex-col items-center cursor-ns-resize group"
                    title={`Velocity: ${note.velocity} - Click & drag up/down`}
                  >
                    <div
                      style={{
                        height: `${heightPercent}%`,
                        backgroundColor: isSelected ? '#ffffff' : activeVoice.color,
                      }}
                      className="w-1.5 rounded-t-sm group-hover:brightness-125 transition-colors relative"
                    >
                      <div className="w-2 h-2 rounded-full bg-white -mt-1 -ml-[1px] shadow-sm" />
                    </div>
                  </div>
                );
              })}

              {/* Playhead in Velocity Lane */}
              <div
                style={{ left: currentTick * pixelsPerTick }}
                className="absolute top-0 bottom-0 w-[2px] bg-amber-400 pointer-events-none"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
