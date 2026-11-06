/**
 * SONORA Counterpoint Studio - Preset & Exercise Library Modal
 * Historical exercises from Jonathan Kulp's Gratis ad Parnassum and modern producer polyphony.
 */

import React from 'react';
import { X, BookOpen, Music, Sparkles, Layers } from 'lucide-react';
import { Project } from '../types/music.ts';
import { SAMPLE_PROJECTS } from '../data/sampleProjects.ts';

interface PresetLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (project: Project) => void;
  onCreateNewProject: (voiceCount: number) => void;
}

export const PresetLibraryModal: React.FC<PresetLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectProject,
  onCreateNewProject,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#10141d] border border-[#232c3f] rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#20283a] flex items-center justify-between bg-[#141924]">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-white">
                Composition Templates & Exercises
              </h2>
              <p className="text-[11px] text-neutral-400">
                Featuring authentic exercises from Jonathan Kulp&apos;s <em>Gratis ad Parnassum</em> (2009)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-[#20293a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Quick Start Blank Project */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Start From Scratch
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  onCreateNewProject(2);
                  onClose();
                }}
                className="p-3 bg-[#151b27] hover:bg-[#1d2536] border border-[#242e42] hover:border-amber-500/40 rounded-lg text-left transition-all"
              >
                <div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  2-Voice Studio
                </div>
                <div className="text-[10px] text-neutral-400">
                  Lead cantus firmus + 1 countermelody
                </div>
              </button>

              <button
                onClick={() => {
                  onCreateNewProject(4);
                  onClose();
                }}
                className="p-3 bg-[#151b27] hover:bg-[#1d2536] border border-[#242e42] hover:border-amber-500/40 rounded-lg text-left transition-all"
              >
                <div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  4-Voice Polyphony
                </div>
                <div className="text-[10px] text-neutral-400">
                  Soprano, Alto, Tenor, and Basso Continuo
                </div>
              </button>

              <button
                onClick={() => {
                  onCreateNewProject(6);
                  onClose();
                }}
                className="p-3 bg-[#151b27] hover:bg-[#1d2536] border border-[#242e42] hover:border-amber-500/40 rounded-lg text-left transition-all"
              >
                <div className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  6-Voice Orchestra
                </div>
                <div className="text-[10px] text-neutral-400">
                  Full contrapuntal chamber ensemble
                </div>
              </button>
            </div>
          </div>

          {/* Curated Kulp & Modern Presets */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Historical & Master Producer Presets
            </h3>
            <div className="space-y-2">
              {SAMPLE_PROJECTS.map(p => (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProject(p);
                    onClose();
                  }}
                  className="p-3.5 bg-[#151b27] hover:bg-[#1d2536] border border-[#242e42] hover:border-amber-500/50 rounded-lg cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-neutral-100 group-hover:text-amber-300 transition-colors flex items-center gap-2">
                      <Music className="w-3.5 h-3.5 text-amber-400" />
                      {p.name}
                    </div>
                    <div className="text-[11px] text-neutral-400 leading-relaxed">
                      {p.attributionNotice}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 pt-1">
                      <span>{p.voices.length} Voices</span>
                      <span>·</span>
                      <span>Key of {p.keySignature} {p.scaleType}</span>
                      <span>·</span>
                      <span>{p.timeSignature[0]}/{p.timeSignature[1]} @ {p.tempo} BPM</span>
                    </div>
                  </div>

                  <button className="px-3 py-1.5 text-xs font-semibold text-[#0b0e14] bg-amber-400 group-hover:bg-amber-300 rounded-md transition-colors shrink-0 shadow-sm">
                    Load
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
