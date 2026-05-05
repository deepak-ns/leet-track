type MetricCardProps = {
  label: string;
  value: number | string;
  subtitle?: string;
  accent?: "blue" | "green" | "amber" | "rose" | "violet";
};

const accentStyles = {
  blue: {
    bar: "from-sky-400 to-blue-600",
    num: "text-blue-700 dark:text-blue-400",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    glow: "shadow-sky-500/10",
  },
  green: {
    bar: "from-emerald-400 to-teal-600",
    num: "text-emerald-700 dark:text-emerald-400",
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    glow: "shadow-emerald-500/10",
  },
  amber: {
    bar: "from-amber-300 to-orange-500",
    num: "text-amber-700 dark:text-amber-400",
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    glow: "shadow-amber-500/10",
  },
  rose: {
    bar: "from-rose-400 to-pink-600",
    num: "text-rose-700 dark:text-rose-400",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400",
    glow: "shadow-rose-500/10",
  },
  violet: {
    bar: "from-violet-400 to-indigo-600",
    num: "text-violet-700 dark:text-violet-400",
    badge:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400",
    glow: "shadow-violet-500/10",
  },
};

export function MetricCard({
  label,
  value,
  subtitle,
  accent = "blue",
}: MetricCardProps) {
  const s = accentStyles[accent];

  return (
    <div
      className={`metric-shell glass-card rounded-[1.6rem] p-5 shadow-lg ${s.glow}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${s.bar}`}
      />
      <div
        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${s.badge}`}
      >
        {label}
      </div>
      <p
        className={`mt-4 text-4xl font-semibold tracking-tight tabular-nums ${s.num}`}
      >
        {value}
      </p>
      {subtitle && (
        <p className="mt-2 max-w-[18rem] text-sm leading-6 text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}

