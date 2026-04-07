// components/exercises/BreathingExercise.tsx
// Full-screen guided breathing exercise modal with animated circles.

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type ExerciseMode = "478" | "pursed";
type Phase = "inhale" | "hold" | "exhale";

interface SessionInfo {
  mode: ExerciseMode;
  cyclesCompleted: number;
}

const EXERCISE_CONFIG: Record<ExerciseMode, { label: string; description: string; phases: { name: Phase; duration: number }[] }> = {
  "478": {
    label: "4-7-8 Relaxing Breath",
    description: "Inhale through nose (4s), hold breath (7s), exhale through mouth (8s)",
    phases: [
      { name: "inhale", duration: 4 },
      { name: "hold", duration: 7 },
      { name: "exhale", duration: 8 },
    ],
  },
  "pursed": {
    label: "Pursed Lip Breathing",
    description: "Breathe in through nose (2s), exhale through pursed lips (4s)",
    phases: [
      { name: "inhale", duration: 2 },
      { name: "exhale", duration: 4 },
    ],
  },
};

const TOTAL_CYCLES = 4;

interface BreathingExerciseProps {
  onComplete: (totalSeconds: number) => void;
  onClose: () => void;
}

export default function BreathingExercise({ onComplete, onClose }: BreathingExerciseProps) {
  const [mode, setMode] = useState<ExerciseMode | null>(null);
  const [started, setStarted] = useState(false);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const totalStarted = started && mode != null;
  const config = mode ? EXERCISE_CONFIG[mode] : null;
  const phase = config ? config.phases[phaseIndex] : null;

  const allDone = !started && mode != null
    ? false
    : started && currentCycle >= TOTAL_CYCLES;

  // Countdown timer
  const tick = useCallback(() => {
    if (!phase) return;
    setSecondsLeft((prev) => {
      if (prev <= 1) {
        // Move to next phase
        setPhaseIndex((pi) => {
          if (pi + 1 >= config.phases.length) {
            // End of cycle
            setCurrentCycle((cc) => {
              if (cc + 1 >= TOTAL_CYCLES) {
                setStarted(false);
                setTimeout(() => onComplete((Date.now() - startTimeRef.current) / 1000), 500);
                return cc + 1;
              }
              return cc + 1;
            });
            return 0;
          }
          return pi + 1;
        });
        if (phaseIndex + 1 < config.phases.length) {
          return config.phases[phaseIndex + 1].duration;
        }
        return 0;
      }
      return prev - 1;
    });
  }, [phase, phaseIndex, config]);

  useEffect(() => {
    if (!totalStarted || !phase) return;
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [totalStarted, phaseIndex, currentCycle, tick, phase]);

  // Calculate progress of current phase for circle animation
  const phaseDuration = phase?.duration ?? 1;
  const progress = 1 - secondsLeft / phaseDuration;

  // Circle size scales with phase
  let fillPercent = 30;
  if (phase?.name === "inhale") fillPercent = 30 + progress * 70;
  else if (phase?.name === "exhale") fillPercent = 100 - progress * 70;
  else fillPercent = 70 + Math.sin(progress * Math.PI) * 30;

  const PHASE_COLORS: Record<string, string> = {
    inhale: "text-cyan-400",
    hold: "text-amber-400",
    exhale: "text-purple-400",
  };

  const PHASE_LABELS: Record<string, string> = {
    inhale: "Breathe In",
    hold: "Hold",
    exhale: "Breathe Out",
  };

  // Mode selection screen
  if (!started && !allDone) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4">
          <button onClick={onClose} className="mb-4 text-slate-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-lg font-bold text-white mb-1">Breathing Exercise</h2>
          <p className="text-sm text-slate-400 mb-5">Choose a technique. Each session is {TOTAL_CYCLES} breath cycles.</p>

          {(["478", "pursed"] as ExerciseMode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setStarted(true);
                startTimeRef.current = Date.now();
              }}
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-4 mb-3 text-left transition-colors"
            >
              <p className="text-sm font-semibold text-white">{EXERCISE_CONFIG[m].label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{EXERCISE_CONFIG[m].description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // All done screen
  if (allDone) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-white mb-1">Session Complete</h2>
          <p className="text-sm text-slate-400 mb-4">Great work! Exercise duration has been logged automatically.</p>
          <button onClick={() => onComplete(0)} className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-2.5 rounded-lg text-sm transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Active exercise session
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-sm font-semibold text-white mb-1">{config?.label}</h2>
        <p className="text-xs text-slate-500 mb-6">
          Cycle {Math.min(currentCycle + 1, TOTAL_CYCLES)} of {TOTAL_CYCLES}
        </p>

        {/* Cycle completion dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: TOTAL_CYCLES }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i < currentCycle ? "bg-cyan-400" : "bg-slate-700"
              }`}
            />
          ))}
        </div>

        {/* Animated breathing circle */}
        <div className="relative flex items-center justify-center my-8">
          <div
            className={`rounded-full border-2 border-current transition-all duration-500 flex items-center justify-center ${
              PHASE_COLORS[phase?.name ?? "inhale"]
            }`}
            style={{
              width: `${fillPercent * 1.5 + 48}px`,
              height: `${fillPercent * 1.5 + 48}px`,
              borderColor: phase?.name === "inhale" ? "#06b6d4" : phase?.name === "hold" ? "#f59e0b" : "#a855f7",
              background: phase?.name === "inhale"
                ? "rgba(6,182,212,0.06)"
                : phase?.name === "hold"
                ? "rgba(245,158,11,0.04)"
                : "rgba(168,85,247,0.04)",
            }}
          >
            <div className="text-center">
              <p className={`text-4xl font-bold font-mono ${PHASE_COLORS[phase?.name ?? "inhale"]}`}>
                {secondsLeft > 0 ? secondsLeft : "?"}
              </p>
              <p className={`text-xs font-medium mt-1 ${PHASE_COLORS[phase?.name ?? "inhale"]}`}>
                {PHASE_LABELS[phase?.name ?? "inhale"]}
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          {phase?.name === "inhale"
            ? "Breathe in slowly through your nose"
            : phase?.name === "hold"
            ? "Hold your breath"
            : "Exhale slowly through pursed lips"}
        </p>

        {/* Phase progress bar */}
        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${progress * 100}%`,
              background: phase?.name === "inhale" ? "#06b6d4" : phase?.name === "hold" ? "#f59e0b" : "#a855f7",
            }}
          />
        </div>
      </div>
    </div>
  );
}
