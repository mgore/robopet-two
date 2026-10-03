import React from "react";
import {
  Sparkles,
  Clock,
  CheckCircle,
  AlertTriangle,
  BatteryCharging,
  Code
} from "lucide-react";
import { HardwareComponent, CompatibilityReport } from "../../types";

interface DiagnosticsTabProps {
  activeMCU: HardwareComponent;
  diagnosticLoading: boolean;
  diagnosticReport: CompatibilityReport | null;
  onRunDiagnostics: () => void;
}

export const DiagnosticsTab: React.FC<DiagnosticsTabProps> = ({
  activeMCU,
  diagnosticLoading,
  diagnosticReport,
  onRunDiagnostics
}) => {
  return (
    <div className="bg-slate-900/30 rounded-xl border border-slate-800 p-6 shadow-2xl flex flex-col gap-5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-3 border-b border-slate-800/60">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            Active Circuit Compatibility Diagnostics
          </h3>
          <p className="text-xs text-slate-400">
            Validates logic voltage, pin bus contention, and power draws between your chosen parts.
          </p>
        </div>
        <button
          onClick={onRunDiagnostics}
          disabled={diagnosticLoading}
          className="w-full md:w-auto px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold rounded hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] border-0 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {diagnosticLoading ? (
            <>
              <Clock className="w-3.5 h-3.5 animate-spin" />
              Scanning Signals...
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Run AI Diagnostic Check
            </>
          )}
        </button>
      </div>

      {!diagnosticReport && !diagnosticLoading && (
        <div className="p-8 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-lg">
          Click "Run AI Diagnostic Check" to verify voltage, bus conflicts, and power draw for your selected MCU ({activeMCU.name}).
        </div>
      )}

      {diagnosticReport && !diagnosticLoading && (
        <div className="flex flex-col gap-4">
          {/* Status badge */}
          <div
            className={`p-4 rounded-lg border flex items-center justify-between ${
              diagnosticReport.overallStatus === "passed"
                ? "bg-emerald-950/20 border-emerald-900/50 text-emerald-400"
                : diagnosticReport.overallStatus === "warning"
                ? "bg-amber-950/20 border-amber-900/50 text-amber-400"
                : "bg-red-950/20 border-red-900/50 text-red-400"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-slate-950/40">
                {diagnosticReport.overallStatus === "passed" ? (
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                ) : (
                  <AlertTriangle
                    className={`w-6 h-6 ${
                      diagnosticReport.overallStatus === "warning" ? "text-amber-400" : "text-red-400"
                    }`}
                  />
                )}
              </div>
              <div>
                <div className="text-[10px] uppercase font-mono tracking-widest text-slate-500">
                  DIAGNOSTIC VERDICT STATUS
                </div>
                <h4 className="text-sm font-bold font-mono uppercase">
                  {diagnosticReport.overallStatus === "passed"
                    ? "COMPATIBILITY ASSURED"
                    : diagnosticReport.overallStatus === "warning"
                    ? "WARNING FLAGS RAISED"
                    : "CRITICAL SYSTEM CONFLICTS"}
                </h4>
              </div>
            </div>
            <span className="text-xs font-mono px-3 py-1 bg-slate-950 rounded border border-slate-850">
              MCU: {activeMCU.name}
            </span>
          </div>

          {/* Warnings feed */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Warning Logs & Flagged Conflicts:</span>
            {diagnosticReport.warnings.length === 0 ? (
              <div className="p-4 bg-slate-950 rounded border border-slate-850 text-center text-xs text-slate-500 font-mono">
                No hardware warnings flagged! Your circuit architecture looks pristine.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {diagnosticReport.warnings.map((warn, index) => (
                  <div key={index} className="p-3.5 bg-slate-950 border border-slate-850 rounded flex items-start gap-3">
                    <AlertTriangle
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        warn.severity === "high"
                          ? "text-red-400"
                          : warn.severity === "medium"
                          ? "text-amber-400"
                          : "text-slate-400"
                      }`}
                    />
                    <div className="text-xs">
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5 flex-wrap">
                        <span>{warn.title}</span>
                        <span className="text-[9px] text-slate-500">({warn.componentName})</span>
                        <span
                          className={`text-[8px] px-1.5 py-0.2 font-mono rounded ${
                            warn.severity === "high"
                              ? "bg-red-950/40 text-red-400 border border-red-900/30"
                              : "bg-amber-950/40 text-amber-400 border border-amber-900/30"
                          }`}
                        >
                          {warn.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-slate-400 leading-normal mt-1 text-[11px]">{warn.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Side-by-side: power analysis + Level shifts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Power */}
            <div className="p-4 bg-slate-950 rounded border border-slate-850 flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-900 text-xs font-semibold text-slate-200 font-mono">
                <BatteryCharging className="w-4 h-4 text-cyan-400" />
                Power Analysis
              </div>
              <div className="text-xs flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Peak Current Estimate:</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {diagnosticReport.powerAnalysis.totalEstimatedCurrentMA} mA
                  </span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-slate-500">Recommended Battery:</span>
                  <span className="font-mono text-white text-right leading-tight max-w-[60%]">
                    {diagnosticReport.powerAnalysis.recommendedBatteryPower}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal mt-1 border-t border-slate-900 pt-2">
                  {diagnosticReport.powerAnalysis.comments}
                </p>
              </div>
            </div>

            {/* Level shifts */}
            <div className="p-4 bg-slate-950 rounded border border-slate-850 flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-900 text-xs font-semibold text-slate-200 font-mono">
                <Code className="w-4 h-4 text-cyan-400" />
                Level-Shifting Guidelines
              </div>
              <div className="text-xs flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                {diagnosticReport.levelShiftingNeeds.length === 0 ? (
                  <span className="text-slate-500 text-[11px] font-mono p-2">
                    All pins aligned. No logic level shifters required.
                  </span>
                ) : (
                  diagnosticReport.levelShiftingNeeds.map((shift, i) => (
                    <div key={i} className="p-2 bg-slate-900/50 rounded border border-slate-800 text-[10px] leading-relaxed flex flex-col">
                      <span className="text-slate-200 font-bold">{shift.component}</span>
                      <span className="text-slate-400 font-mono">Line: {shift.signalLine}</span>
                      <span className="text-cyan-400 font-mono mt-0.5">{shift.shiftNeeded}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Technical Advice */}
          <div className="p-4 bg-cyan-950/20 rounded border border-cyan-900/30 text-xs">
            <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider block mb-1">
              Architect Assembly Advisory:
            </span>
            <p className="text-slate-300 leading-relaxed whitespace-pre-line font-sans text-[11px]">
              {diagnosticReport.technicalAdvice}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
