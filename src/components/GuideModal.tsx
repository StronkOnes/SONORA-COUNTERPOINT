/**
 * SONORA Counterpoint Studio - Production Guide & Workflow Tutorial Modal
 * Interactive walkthrough for master producers and composers.
 */

import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Sparkles,
  Layers,
  Download,
  Flame,
  CheckCircle2,
  Sliders,
  Play,
  ArrowRight,
  Music,
  Compass,
} from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadExamplePreset: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({
  isOpen,
  onClose,
  onLoadExamplePreset,
}) => {
  const [activeTab, setActiveTab] = useState<'quickstart' | 'counterpoint' | 'daw'>('quickstart');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#10141d] border border-[#232c3f] rounded-xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#20283a] flex items-center justify-between bg-[#141924]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[#0b0e14] font-bold text-xs shadow-md">
              ?
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                SONORA Master Producer Guide
              </h2>
              <p className="text-[11px] text-neutral-400">
                Learn how to generate interlocking polyphony and export stems into your DAW
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

        {/* Tab Navigation */}
        <div className="px-5 pt-3 border-b border-[#1b2230] bg-[#121622] flex items-center gap-2">
          <button
            onClick={() => setActiveTab('quickstart')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'quickstart'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3-Minute Quickstart</span>
          </button>
          <button
            onClick={() => setActiveTab('counterpoint')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'counterpoint'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Counterpoint Secrets for Producers</span>
          </button>
          <button
            onClick={() => setActiveTab('daw')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'daw'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>DAW Workflow & Stems</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-neutral-300 leading-relaxed flex-1">
          {activeTab === 'quickstart' && (
            <div className="space-y-4">
              <div className="bg-[#151c28] p-4 rounded-xl border border-[#232f44] flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm mb-1">
                    Create or Load Your Lead Melody
                  </h3>
                  <p className="text-neutral-400 leading-relaxed">
                    Click anywhere on the Piano Roll to draw notes for your <strong>Lead Melody</strong>, drop a <strong>.mid</strong> file via the <em className="text-neutral-200">Import</em> button, or click <em className="text-amber-400">Producer & Kulp Presets</em> at the top to load an authentic project.
                  </p>
                </div>
              </div>

              <div className="bg-[#151c28] p-4 rounded-xl border border-[#232f44] flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm mb-1">
                    Configure the Generator & Choose a Target Track
                  </h3>
                  <p className="text-neutral-400 leading-relaxed mb-2">
                    In the right panel, confirm your <strong>Source Voice (e.g. Lead)</strong> and <strong>Target Track (e.g. Countermelody or Sub-Bass)</strong>.
                  </p>
                  <p className="text-neutral-400 leading-relaxed">
                    Pick your style: choose <strong>Baroque Trap / Drill</strong> for menacing bell counter-melodies, <strong>Neo-Soul</strong> for lush 7th/9th passing chords, or <strong>18th-Century Counterpoint</strong> for strict classical voice-leading.
                  </p>
                </div>
              </div>

              <div className="bg-[#151c28] p-4 rounded-xl border border-[#232f44] flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm mb-1">
                    Generate, Audition & Apply
                  </h3>
                  <p className="text-neutral-400 leading-relaxed mb-2">
                    Hit the golden <strong className="text-amber-300">Generate 4 Contrapuntal Alternatives</strong> button. The AI engine calculates 4 ranked variations with contrapuntal score breakdowns.
                  </p>
                  <p className="text-neutral-400 leading-relaxed">
                    Click <strong>Audition</strong> to listen to any candidate solo. When you like a line, click <strong className="text-amber-400">Apply to Track</strong>. The notes will immediately write into your chosen track and light up on the piano roll!
                  </p>
                </div>
              </div>

              <div className="bg-[#151c28] p-4 rounded-xl border border-[#232f44] flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm mb-1">
                    Shape Velocities & Drag into Your DAW
                  </h3>
                  <p className="text-neutral-400 leading-relaxed">
                    Use the bottom <strong>Velocity Lane</strong> to sculpt dynamics, or click <strong className="text-amber-400">Humanize</strong> to add organic bounce. Then click the <strong className="text-white">Download Icon</strong> on any track in the left panel to export individual <strong>.mid stems</strong> straight into Ableton, FL Studio, or Logic!
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'counterpoint' && (
            <div className="space-y-4">
              <div className="border border-[#20293a] bg-[#131722] p-4 rounded-xl space-y-2">
                <h3 className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                  <Compass className="w-4 h-4" />
                  1. The Rule of Contrary Motion (Why It Makes Music Sound Huge)
                </h3>
                <p className="text-neutral-300 leading-relaxed">
                  When all musical parts move in the same direction, our brains perceive them as a single muddy block. <strong>Contrary motion</strong>—where the countermelody descends when the lead ascends—gives each voice its own distinct melodic contour, making your multi-track productions sound wide, deep, and intentional.
                </p>
              </div>

              <div className="border border-[#20293a] bg-[#131722] p-4 rounded-xl space-y-2">
                <h3 className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                  <Music className="w-4 h-4" />
                  2. Imperfect Consonances (3rds & 6ths)
                </h3>
                <p className="text-neutral-300 leading-relaxed">
                  Jonathan Kulp&apos;s <em>Gratis ad Parnassum</em> explains that imperfect consonances (major/minor 3rds, 6ths, and 10ths) are the richest harmonic building blocks. Our generator prioritizes 3rds and 6ths on accented downbeats, while passing through 2nds and 7ths on weak offbeats for forward rhythmic momentum.
                </p>
              </div>

              <div className="border border-[#20293a] bg-[#131722] p-4 rounded-xl space-y-2">
                <h3 className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                  <Sliders className="w-4 h-4" />
                  3. Suspensions (4-3 and 7-6 Tensions)
                </h3>
                <p className="text-neutral-300 leading-relaxed">
                  A suspension holds a note from the previous beat over a changing bass note, creating a powerful dissonance on the downbeat that resolves downward by step. This technique creates the iconic emotional pull heard in Baroque chorales, Neo-Soul Rhodes ballads, and modern film scores.
                </p>
              </div>

              <div className="border border-[#20293a] bg-[#131722] p-4 rounded-xl space-y-2">
                <h3 className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                  <Flame className="w-4 h-4" />
                  4. Invertible Double Counterpoint
                </h3>
                <p className="text-neutral-300 leading-relaxed">
                  Lines written in invertible counterpoint remain consonant even when their registers are flipped (e.g. the bass line moves above the melody!). Use the <strong>Test Register Inversion</strong> button to audition your arrangement with registers swapped.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'daw' && (
            <div className="space-y-4">
              <div className="bg-[#151c28] p-4 rounded-xl border border-[#232f44] space-y-2">
                <h3 className="font-bold text-white text-sm">
                  How to Drag Stems Into Any DAW
                </h3>
                <p className="text-neutral-300 leading-relaxed">
                  SONORA exports standard Type 1 MIDI files (.mid) encoded with track names, PPQ resolution (480 ticks/beat), note velocities, and tempo maps.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <div className="p-2.5 bg-[#1b2333] rounded-lg border border-[#28364d]">
                    <div className="font-semibold text-amber-400 mb-1">Ableton Live</div>
                    <div className="text-[11px] text-neutral-400">
                      Click the stem icon to download the `.mid` file, then drag it directly from your browser download bar onto an empty MIDI track in Session or Arrangement view.
                    </div>
                  </div>
                  <div className="p-2.5 bg-[#1b2333] rounded-lg border border-[#28364d]">
                    <div className="font-semibold text-amber-400 mb-1">FL Studio</div>
                    <div className="text-[11px] text-neutral-400">
                      Drag the downloaded `.mid` file onto any channel in the Channel Rack or directly into the Piano Roll editor.
                    </div>
                  </div>
                  <div className="p-2.5 bg-[#1b2333] rounded-lg border border-[#28364d]">
                    <div className="font-semibold text-amber-400 mb-1">Logic Pro & Studio One</div>
                    <div className="text-[11px] text-neutral-400">
                      Drag the multi-track MIDI file into the timeline; Logic will automatically ask to create individual software instrument tracks for each stem!
                    </div>
                  </div>
                  <div className="p-2.5 bg-[#1b2333] rounded-lg border border-[#28364d]">
                    <div className="font-semibold text-amber-400 mb-1">All Stems In One Click</div>
                    <div className="text-[11px] text-neutral-400">
                      Click <strong>All Stems</strong> in the top bar to download separate MIDI files for every single voice simultaneously.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#20283a] bg-[#141924] flex items-center justify-between">
          <button
            onClick={() => {
              onLoadExamplePreset();
              onClose();
            }}
            className="px-3 py-1.5 text-xs font-semibold text-amber-300 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-md transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Load &quot;Baroque Drill&quot; Preset</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-[#0b0e14] bg-amber-400 hover:bg-amber-300 rounded-md transition-colors shadow-sm"
          >
            Got It, Let&apos;s Produce!
          </button>
        </div>
      </div>
    </div>
  );
};
