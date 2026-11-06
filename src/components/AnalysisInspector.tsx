/**
 * SONORA Counterpoint Studio - Live Analysis & Rule Inspector Panel
 * Displays harmonic chords, Roman numerals, cadence detection, and voice-leading rule violations.
 */

import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Activity,
  AlertTriangle,
  Info,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { Project, RuleViolation, TICKS_PER_BEAT } from '../types/music.ts';
import { getKeyInfo } from '../music-core/theory/scales.ts';
import { analyzeProjectHarmony } from '../music-core/analysis/harmonicAnalyzer.ts';
import { evaluateCounterpointRules } from '../music-core/counterpoint/rules.ts';

interface AnalysisInspectorProps {
  project: Project;
  onJumpToMeasure: (measure: number) => void;
}

export const AnalysisInspector: React.FC<AnalysisInspectorProps> = ({
  project,
  onJumpToMeasure,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const keyInfo = getKeyInfo(project.keySignature, project.scaleType);

  const harmony = analyzeProjectHarmony(
    project.voices,
    keyInfo,
    project.timeSignature,
    project.totalBars
  );

  const violations = evaluateCounterpointRules(
    project.voices,
    keyInfo,
    'strict_18th_century',
    project.timeSignature
  );

  return (
    <div className="border-t border-[#1e2430] bg-[#0d1017] shrink-0 select-none transition-all duration-200">
      {/* Panel Top Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-9 px-4 flex items-center justify-between cursor-pointer hover:bg-[#121622] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Contrapuntal Analysis & Rule Inspector
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-neutral-400">
              Key: <strong className="text-amber-300 font-bold">{project.keySignature} {project.scaleType}</strong>
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-neutral-400">
              Voice-Leading Health: <strong className="text-emerald-400 font-bold">{harmony.voiceLeadingHealthScore}%</strong>
            </span>
            <span className="text-neutral-600">·</span>
            <span className="text-neutral-400">
              Imperfect Consonances (3rds/6ths): <strong className="text-sky-300 font-bold">{harmony.imperfectConsonancePercentage}%</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {violations.length === 0 ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>All 18th-century voice rules pass</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{violations.length} contrapuntal notices</span>
            </div>
          )}

          <button className="text-neutral-500 hover:text-white p-1">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content View */}
      {isExpanded && (
        <div className="p-4 border-t border-[#1a2130] grid grid-cols-1 md:grid-cols-3 gap-4 max-h-48 overflow-y-auto">
          {/* Column 1: Harmonic Progression & Chords */}
          <div className="bg-[#121622] rounded-lg p-3 border border-[#1d2536] space-y-2">
            <div className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
              <span>Harmonic Progression</span>
              <span className="text-[10px] text-neutral-500">{harmony.chords.length} detected beats</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
              {harmony.chords.map((c, idx) => (
                <div
                  key={idx}
                  className="bg-[#192130] px-2 py-1 rounded text-center border border-[#232f45]"
                >
                  <div className="text-xs font-serif font-bold text-amber-300">
                    {c.romanNumeral}
                  </div>
                  <div className="text-[9px] font-mono text-neutral-400">
                    m.{c.measure}.{c.beat}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Cadences & Musical Architecture */}
          <div className="bg-[#121622] rounded-lg p-3 border border-[#1d2536] space-y-2">
            <div className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
              <span>Cadences & Structural Closures</span>
              <span className="text-[10px] text-neutral-500">Gratis ad Parnassum Ch. 8</span>
            </div>
            <div className="space-y-1.5 max-h-28 overflow-y-auto text-xs">
              {harmony.detectedCadences.length === 0 ? (
                <div className="text-neutral-500 text-[11px] py-2">
                  No definitive V-I cadences detected yet. Place a leading tone (degree 7) resolving to tonic (degree 1) at measure ends.
                </div>
              ) : (
                harmony.detectedCadences.map((cad, idx) => (
                  <div
                    key={idx}
                    onClick={() => onJumpToMeasure(cad.measure)}
                    className="p-1.5 rounded bg-[#18202e] hover:bg-[#202b3d] cursor-pointer transition-colors border border-[#232e42]"
                  >
                    <div className="font-semibold text-amber-400 text-[11px]">
                      {cad.type}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      {cad.description}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 3: Counterpoint Rule Violations & Guidance */}
          <div className="bg-[#121622] rounded-lg p-3 border border-[#1d2536] space-y-2">
            <div className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
              <span>Voice Leading Inspector</span>
              <span className="text-[10px] text-neutral-500">Kulp Rule Engine</span>
            </div>
            <div className="space-y-1.5 max-h-28 overflow-y-auto text-xs">
              {violations.length === 0 ? (
                <div className="text-emerald-400/90 text-[11px] py-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>No parallel fifths, octaves, or illegal voice crossings detected. Clean polyphony!</span>
                </div>
              ) : (
                violations.map((v, idx) => (
                  <div
                    key={idx}
                    onClick={() => onJumpToMeasure(v.measure)}
                    className="p-1.5 rounded bg-[#1b1c24] hover:bg-[#262835] cursor-pointer transition-colors border border-amber-500/20"
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold text-amber-400">
                      <span>{v.ruleName}</span>
                      <span className="text-[9px] font-mono text-neutral-500">m.{v.measure}</span>
                    </div>
                    <div className="text-[10px] text-neutral-400 leading-tight">
                      {v.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
