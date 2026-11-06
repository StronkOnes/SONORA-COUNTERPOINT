/**
 * SONORA Counterpoint Studio - Attribution & Licensing Modal
 * Mandatory attribution for Jonathan Kulp's "Gratis ad Parnassum" (CC-BY-SA 3.0).
 */

import React from 'react';
import { X, Award, ExternalLink, BookOpen, ShieldCheck } from 'lucide-react';

interface AttributionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AttributionModal: React.FC<AttributionModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none animate-in fade-in duration-150">
      <div className="bg-[#10141d] border border-[#232c3f] rounded-xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[#20283a] flex items-center justify-between bg-[#141924]">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-white">
                Musical Heritage & Attribution
              </h2>
              <p className="text-[11px] text-neutral-400">
                Educational foundation of SONORA Counterpoint Studio
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-neutral-300 leading-relaxed">
          <div className="bg-[#151b27] p-3.5 rounded-lg border border-[#242e42] space-y-2">
            <div className="font-semibold text-amber-300 text-sm">
              Gratis ad Parnassum: A Free Workbook for 18th-Century Counterpoint
            </div>
            <div className="text-neutral-400 text-[11px]">
              Authored by <strong>Jonathan Kulp</strong> (University of Louisiana at Lafayette, 2009).
            </div>
            <p className="text-neutral-300">
              The contrapuntal rule evaluation, species definitions (1:1, 2:1, 3:1, 4:1), non-chord tone guidance (accented passing tones, suspensions, neighbor tones), and exercises in this software are grounded in Professor Jonathan Kulp&apos;s open-source workbook.
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-semibold text-neutral-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Creative Commons Attribution-ShareAlike 3.0 License (CC-BY-SA 3.0)
            </div>
            <p className="text-neutral-400 text-[11px]">
              The source workbook is distributed under the terms of the Creative Commons Attribution-ShareAlike 3.0 license. In accordance with Section 4 of the license, appropriate attribution is hereby provided to Jonathan Kulp.
            </p>
            <div className="text-[11px] text-neutral-400">
              You are free to share and adapt this material under the condition that you provide attribution and distribute adaptations under the same license.
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-[#1e2535]">
            <div className="font-semibold text-neutral-200">
              SONORA Composition Engine
            </div>
            <p className="text-neutral-400 text-[11px]">
              Engineered with modern Web Audio synthesis, interactive multi-track piano roll, standard Type 1 MIDI generator, and multi-candidate constraint scoring for professional music producers and classical composers alike.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#20283a] bg-[#141924] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-[#0b0e14] bg-amber-400 hover:bg-amber-300 rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
