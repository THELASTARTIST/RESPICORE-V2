// components/dashboard/MedicationHistory.tsx
// Table of recent medication log entries with delete support.

import { useState } from "react";

export interface MedicationLog {
  id: string;
  user_id: string;
  medication_type: string;
  medication_name: string | null;
  dosage: string;
  notes: string | null;
  puff_count: number | null;
  taken_at: string;
  created_at: string;
}

interface MedicationHistoryProps {
  medications: MedicationLog[];
  onDeleted: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  inhaler_rescue: "Rescue Inhaler",
  inhaler_maintenance: "Maintenance Inhaler",
  nebulizer: "Nebulizer",
  antibiotic: "Antibiotic",
  steroid: "Steroid",
  antihistamine: "Antihistamine",
  other: "Other",
};

export default function MedicationHistory({ medications, onDeleted }: MedicationHistoryProps) {
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      await fetch(`/api/medications?id=${id}`, { method: "DELETE" });
      onDeleted();
    } catch {
      console.error("Delete failed");
    } finally {
      setDeleting(null);
    }
  }

  if (!medications.length) {
    return (
      <p className="text-xs text-slate-500 text-center py-4">No medication entries yet.</p>
    );
  }

  return (
    <div className="max-h-52 overflow-y-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-slate-900 z-10">
          <tr className="border-b border-slate-700">
            <th className="text-left py-2 px-3 text-[10px] text-slate-500 font-mono uppercase">Time</th>
            <th className="text-left py-2 px-3 text-[10px] text-slate-500 font-mono uppercase">Type</th>
            <th className="text-left py-2 px-3 text-[10px] text-slate-500 font-mono uppercase">Dosage</th>
            <th className="hidden sm:table-cell text-left py-2 px-3 text-[10px] text-slate-500 font-mono uppercase">Name</th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {medications.map((m) => (
            <tr key={m.id} className="border-b border-slate-800/50 hover:bg-slate-700/10 transition-colors">
              <td className="py-2 px-3 text-slate-400 font-mono whitespace-nowrap">
                {new Date(m.taken_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </td>
              <td className="py-2 px-3 text-slate-300">
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-medium">
                  {TYPE_LABELS[m.medication_type] ?? m.medication_type}
                </span>
              </td>
              <td className="py-2 px-3 text-cyan-400 font-mono">{m.dosage}</td>
              <td className="hidden sm:table-cell py-2 px-3 text-slate-400">{m.medication_name || "—"}</td>
              <td className="py-2 px-3 text-right">
                <button
                  onClick={() => confirm("Delete this medication entry?") && handleDelete(m.id)}
                  disabled={deleting === m.id}
                  className="text-slate-600 hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
