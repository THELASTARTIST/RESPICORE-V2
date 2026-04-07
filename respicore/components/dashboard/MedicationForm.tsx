// components/dashboard/MedicationForm.tsx
// Form for logging a medication entry.

import { useState } from "react";

const MED_TYPES = [
  { value: "inhaler_rescue", label: "Rescue Inhaler" },
  { value: "inhaler_maintenance", label: "Maintenance Inhaler" },
  { value: "nebulizer", label: "Nebulizer" },
  { value: "antibiotic", label: "Antibiotic" },
  { value: "steroid", label: "Steroid" },
  { value: "antihistamine", label: "Antihistamine" },
  { value: "other", label: "Other" },
];

interface MedicationFormProps {
  onSuccess: () => void;
}

export default function MedicationForm({ onSuccess }: MedicationFormProps) {
  const [medType, setMedType] = useState("inhaler_rescue");
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [puffCount, setPuffCount] = useState("1");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function reset() {
    setName("");
    setDosage("");
    setPuffCount("1");
    setNotes("");
    setMedType("inhaler_rescue");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!dosage.trim()) {
      setError("Dosage is required. e.g. '2 puffs', '2.5mg/3ml'.");
      return;
    }

    setLoading(true);
    try {
      const isRescue = medType === "inhaler_rescue";
      const res = await fetch("/api/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medication_type: medType,
          medication_name: name.trim() || null,
          dosage: dosage.trim(),
          notes: notes.trim() || null,
          puff_count: isRescue ? parseInt(puffCount) || 1 : null,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error || "Failed to save medication entry.");
        return;
      }
      setSuccess(true);
      reset();
      onSuccess();
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const showPuffCount = medType === "inhaler_rescue";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-xs text-red-400">{error}</div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 text-xs text-green-400">
          Medication logged!
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
        <select value={medType} onChange={(e) => setMedType(e.target.value)}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
          {MED_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Medication name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Albuterol"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Dosage</label>
          <input type="text" value={dosage} onChange={(e) => setDosage(e.target.value)}
            placeholder="e.g. 2 puffs"
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
        </div>
      </div>

      {showPuffCount && (
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Puff count</label>
          <input type="number" min="0" value={puffCount} onChange={(e) => setPuffCount(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
          <p className="text-[10px] text-slate-600 mt-1">GINA: {"\u003e"}4 days/week of rescue use = uncontrolled</p>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Notes (optional)</label>
        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. chest felt tight"
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
      </div>

      <button type="submit" disabled={loading}
        className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-600 text-slate-900 font-bold py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
        {loading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
            Logging...
          </>
        ) : (
          <>
            Log Medication
          </>
        )}
      </button>
    </form>
  );
}
