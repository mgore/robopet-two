import React from "react";
import {
  BookOpen,
  Heart,
  Download,
  Upload,
  Sliders,
  Cpu,
  Layers
} from "lucide-react";
import { UserProfileBadge } from "./UserProfileBadge";
import { UserProfileDoc } from "../lib/firebase";

interface NavigationHeaderProps {
  paypalLink: string;
  onOpenGlossary: () => void;
  onExportJSON: () => void;
  onImportJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadPreset: (presetName: string) => void;
  userDoc: UserProfileDoc | null;
  onOpenAuthModal: () => void;
  triggerNotification: (msg: string) => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  paypalLink,
  onOpenGlossary,
  onExportJSON,
  onImportJSON,
  onLoadPreset,
  userDoc,
  onOpenAuthModal,
  triggerNotification
}) => {
  return (
    <header className="min-h-16 py-2 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md px-3 sm:px-4 md:px-6 sticky top-0 z-50 flex flex-wrap justify-between items-center gap-2 sm:gap-4 shadow-xl max-w-full overflow-hidden">
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 bg-[#0a0612] border border-[#00f0ff]/50 rounded-lg flex items-center justify-center shrink-0 shadow-md shadow-[#00f0ff]/30 overflow-hidden">
          <img src="/icon.svg" alt="AI RoboPet Icon" className="w-full h-full object-contain rounded" />
        </div>
        <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-white uppercase font-display whitespace-nowrap">
          AI <span className="text-[#a855f7]">ROBOPET</span>
        </h1>
      </div>

      {/* Global Tech Help Glossary, Datasheet, Presets Loader & User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap justify-end">
        {/* Tech Glossary & Help Guide Button */}
        <button
          onClick={onOpenGlossary}
          className="px-2.5 sm:px-3 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/80 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-indigo-500/10 shrink-0"
          title="Open Robotics Tech Glossary & Tech Focus Guide"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="hidden sm:inline">Tech Glossary</span>
          <span className="sm:hidden">Help</span>
        </button>

        {/* Direct Support PayPal Button */}
        <a
          id="header-support-btn"
          href={paypalLink}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 sm:px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700/80 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow-rose-500/10 shrink-0"
          title="Support AI RoboPet via PayPal"
        >
          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-500/30 shrink-0" />
          <span>Support</span>
        </a>

        {/* Local Build JSON Export / Import ($0 Cloud Cost) */}
        <div className="hidden xl:flex items-center gap-1.5 border-l border-slate-800 pl-2.5">
          <button
            onClick={onExportJSON}
            className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer shadow-sm hover:text-cyan-300"
            title="Save current robot configuration as a downloadable JSON file on your computer ($0 Cost)"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>

          <label
            className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1 cursor-pointer shadow-sm hover:text-cyan-300"
            title="Load a saved robot build JSON file from your computer ($0 Cost)"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Import</span>
            <input type="file" accept=".json" onChange={onImportJSON} className="hidden" />
          </label>
        </div>

        <div className="hidden lg:flex items-center gap-2 border-l border-slate-800 pl-2.5">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Presets:</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => onLoadPreset("Autonomous Obstacle-Avoiding Rover")}
              className="px-2.5 py-1 bg-slate-800/50 hover:bg-slate-850 hover:text-white text-[11px] border border-slate-700 text-slate-200 rounded transition-colors flex items-center gap-1 font-mono cursor-pointer"
            >
              <Sliders className="w-3 h-3 text-cyan-400" />
              Rover
            </button>
            <button
              onClick={() => onLoadPreset("Kinematic Robotic Sorting Arm")}
              className="px-2.5 py-1 bg-slate-800/50 hover:bg-slate-850 hover:text-white text-[11px] border border-slate-700 text-slate-200 rounded transition-colors flex items-center gap-1 font-mono cursor-pointer"
            >
              <Cpu className="w-3 h-3 text-violet-400" />
              Arm
            </button>
            <button
              onClick={() => onLoadPreset("Self-Stabilizing Hexapod Walker")}
              className="px-2.5 py-1 bg-slate-800/50 hover:bg-slate-850 hover:text-white text-[11px] border border-slate-700 text-slate-200 rounded transition-colors flex items-center gap-1 font-mono cursor-pointer"
            >
              <Layers className="w-3 h-3 text-amber-400" />
              Hexapod
            </button>
          </div>
        </div>

        {/* User Profile Badge / Auth Button */}
        <UserProfileBadge
          userDoc={userDoc}
          onOpenAuthModal={onOpenAuthModal}
          triggerNotification={triggerNotification}
        />
      </div>
    </header>
  );
};
