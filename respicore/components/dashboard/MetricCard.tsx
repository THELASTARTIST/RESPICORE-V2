// components/dashboard/MetricCard.tsx
// Displays the latest value for a single metric with a
// colour-coded status indicator. Pure presentational component.

interface MetricCardProps {
  label: string;
  value: number | null | undefined;
  unit: string;
  icon: React.ReactNode;
  status?: "normal" | "warning" | "critical" | "neutral";
  description?: string;
}

const statusConfig = {
  normal:   { color: "text-green-400", bg: "bg-green-500/10",  border: "border-green-500/20",  dot: "bg-green-400"  },
  warning:  { color: "text-amber-400", bg: "bg-amber-500/10",  border: "border-amber-500/20",  dot: "bg-amber-400"  },
  critical: { color: "text-red-400",   bg: "bg-red-500/10",    border: "border-red-500/20",    dot: "bg-red-400"    },
  neutral:  { color: "text-slate-400", bg: "bg-slate-700/30",  border: "border-slate-700",     dot: "bg-slate-500"  },
};

export default function MetricCard({
  label, value, unit, icon, status = "neutral", description,
}: MetricCardProps) {
  const cfg = statusConfig[status];

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 hover:border-slate-600 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="text-slate-400">{icon}</div>
        {value !== null && value !== undefined && (
          <span className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${cfg.bg} ${cfg.border} border ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {status}
          </span>
        )}
      </div>
      <div className="mt-1">
        <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">{label}</p>
        {value !== null && value !== undefined ? (
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-white">{value}</span>
            <span className="text-sm text-slate-400">{unit}</span>
          </div>
        ) : (
          <div className="text-2xl font-bold text-slate-600">--</div>
        )}
        {description && (
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}
