import React, { useState } from "react";
import { Flag, X } from "lucide-react";
import {
  REPORT_REASONS,
  ReportReason,
  ReportTargetType,
  submitReport
} from "../services/reportService";

interface ReportButtonProps {
  targetType: ReportTargetType;
  targetId: string;
  excerpt?: string;
  label?: string;
  triggerNotification?: (msg: string) => void;
  className?: string;
}

export const ReportButton: React.FC<ReportButtonProps> = ({
  targetType,
  targetId,
  excerpt,
  label = "Report",
  triggerNotification,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>(
    targetType === "ai_output" ? "inaccurate" : "offensive"
  );
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setIsOpen(false);
    setDetails("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await submitReport({ targetType, targetId, reason, details, excerpt });
      if (triggerNotification) triggerNotification("Thanks, your report was sent for review.");
      close();
    } catch (err) {
      console.error("Report submission failed:", err);
      setError("Could not send the report. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={`inline-flex items-center gap-1 text-[10px] font-mono text-slate-500 hover:text-amber-400 transition cursor-pointer ${className}`}
        title="Report this content"
      >
        <Flag className="w-3 h-3" />
        <span>{label}</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          onClick={(e) => {
            e.stopPropagation();
            close();
          }}
        >
          <div
            className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 font-mono text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Flag className="w-4 h-4 text-amber-400" />
                {targetType === "ai_output" ? "Report AI output" : "Report content"}
              </h3>
              <button
                type="button"
                onClick={close}
                className="p-1 text-slate-400 hover:text-white rounded-full bg-slate-800/50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <fieldset className="space-y-1.5">
                {REPORT_REASONS.map((r) => (
                  <label key={r.id} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="report-reason"
                      value={r.id}
                      checked={reason === r.id}
                      onChange={() => setReason(r.id)}
                    />
                    {r.label}
                  </label>
                ))}
              </fieldset>

              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder="Anything else we should know? (optional)"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:border-amber-500 focus:outline-none"
              />

              {error && <p className="text-[11px] text-red-400">{error}</p>}

              <div className="pt-1 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={close}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-950 hover:bg-amber-900 border border-amber-700 text-amber-100 text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  {isSubmitting ? "Sending..." : "Send report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
