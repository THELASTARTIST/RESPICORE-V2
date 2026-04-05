"use client";
// components/dashboard/MetricForm.tsx
// Form for logging a new health metric reading.
// Submits to /api/health-metrics (POST) and calls onSuccess() to trigger refetch.

import { useState } from "react";

interface MetricFormProps {
  onSuccess: () => void;
}

export default function MetricForm({ onSuccess }: MetricFormProps) {
  const [loading, setLoading]                     = useState(false);
  const [error, setError]                         = useState<string | null>(null);
  const [success, setSuccess]                     = useState(false);
  const [spo2, setSpo2]                           = useState("");
  const [heartRate, setHeartRate]                 = useState("");
  const [respiratoryRate, setRespiratoryRate]     = useState("");
  const [symptomScore, setSymptomScore]           = useState("");
  const [notes, setNotes]                         = useState("");
  const [exerciseDone, setExerciseDone]           = useState(false);
  const [exerciseDuration, setExerciseDuration]   = useState("");

  function resetForm() {
    setSpo2(""); setHeartRate(""); setRespiratoryRate("");
    setSymptomScore(""); setNotes("");
    setExerciseDone(false); setExerciseDuration("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      ...(spo2            && { spo2: parseFloat(spo2) }),
      ...(heartRate       && { heart_rate: parseInt(heartRate) }),
      ...(respiratoryRate && { respiratory_rate: parseInt(respiratoryRate) }),
      ...(symptomScore    && { symptom_score: parseInt(symptomScore) }),
      ...(notes           && { notes }),
      breathing_exercise_done: exerciseDone,
      ...(exerciseDone && exerciseDuration && {
        exercise_duration_mins: parseInt(exerciseDuration),
      }),
    };

    const res  = await fetch("/api/health-metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();

    if (!res.ok || json.error) {
      setError(json.error || "Failed to save. Please try again.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    resetForm();
    onSuccess();
    setTimeout(() => setSuccess(false), 3000);
    setLoading(false);
  }

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-white mb-1">Log Today&apos;s Reading</h2>
      <p className="text-sm text-slate-400 mb-6">Fill in any metrics you have available.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 text-sm text-green-400 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Reading saved successfully!
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">SpO2 (%)</label>
            <input type="number" min="70" max="100" step="0.1" value={spo2}
              onChange={(e) => setSpo2(e.target.value)} placeholder="e.g. 98.5"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Heart Rate (BPM)</label>
            <input type="number" min="30" max="300" value={heartRate}
              onChange={(e) => setHeartRate(e.target.value)} placeholder="e.g. 72"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Resp. Rate (br/min)</label>
            <input type="number" min="1" max="60" value={respiratoryRate}
              onChange={(e) => setRespiratoryRate(e.target.value)} placeholder="e.g. 16"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Symptom Score (1-10)</label>
            <input type="number" min="1" max="10" value={symptomScore}
              onChange={(e) => setSymptomScore(e.target.value)} placeholder="1=none, 10=severe"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-between bg-slate-900/60 border border-slate-700 rounded-lg px-4 py-3">
          <div>
            <p className="text-sm font-medium text-white">Breathing exercise completed?</p>
            <p className="text-xs text-slate-500 mt-0.5">Daily respiratory training</p>
          </div>
          <button type="button" onClick={() => setExerciseDone((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${exerciseDone ? "bg-cyan-500" : "bg-slate-600"}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${exerciseDone ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        {exerciseDone && (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Duration (minutes)</label>
            <input type="number" min="1" max="120" value={exerciseDuration}
              onChange={(e) => setExerciseDuration(e.target.value)} placeholder="e.g. 10"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">Notes (optional)</label>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Any symptoms, context, or observations..."
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder:text-slate-600 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
          />
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-600 text-slate-900 font-bold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Save Reading
            </>
          )}
        </button>
      </form>
    </div>
  );
}
