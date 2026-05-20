type MetricCardProps = {
  label: string;
  value: number | string;
  subtitle?: string;
  accent?: "blue" | "green" | "amber" | "rose" | "violet";
};

const accentStyles = {
  blue: {
    bar: "from-blue-500 to-sky-600 dark:from-blue-300 dark:to-sky-400",
    num: "text-blue-700 dark:text-blue-300",
    badge: "border border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800/45 dark:bg-blue-950/25 dark:text-blue-300",
    glow: "shadow-blue-700/5",
  },
  green: {
    bar: "from-emerald-500 to-teal-600 dark:from-emerald-300 dark:to-teal-400",
    num: "text-emerald-700 dark:text-emerald-300",
    badge: "border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/45 dark:bg-emerald-950/25 dark:text-emerald-300",
    glow: "shadow-emerald-500/5",
  },
  amber: {
    bar: "from-slate-500 to-blue-600 dark:from-neutral-300 dark:to-blue-400",
    num: "text-neutral-800 dark:text-neutral-200",
    badge: "border border-neutral-200 bg-neutral-50 text-neutral-800 dark:border-neutral-700/60 dark:bg-neutral-900/35 dark:text-neutral-200",
    glow: "shadow-neutral-700/5",
  },
  rose: {
    bar: "from-blue-600 to-indigo-700 dark:from-blue-300 dark:to-indigo-400",
    num: "text-blue-800 dark:text-blue-300",
    badge: "border border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800/45 dark:bg-blue-950/25 dark:text-blue-300",
    glow: "shadow-blue-700/5",
  },
  violet: {
    bar: "from-neutral-500 to-slate-700 dark:from-neutral-300 dark:to-slate-400",
    num: "text-neutral-800 dark:text-neutral-200",
    badge: "border border-neutral-200 bg-neutral-50 text-neutral-800 dark:border-neutral-700/60 dark:bg-neutral-900/35 dark:text-neutral-200",
    glow: "shadow-neutral-700/5",
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
      className={`metric-shell glass-card group min-w-0 rounded-2xl border border-neutral-200/70 p-5 shadow-sm transition duration-300 dark:border-neutral-800 ${s.glow}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-[3px] origin-left bg-gradient-to-r transition-transform duration-300 group-hover:scale-x-110 ${s.bar}`}
      />
      <div
        className={`inline-flex max-w-full rounded-lg px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider transition-transform duration-300 group-hover:-translate-y-0.5 ${s.badge}`}
      >
        <span className="truncate">{label}</span>
      </div>
      <p
        className={`mt-4 min-w-0 break-words font-mono text-[clamp(1.65rem,4vw,2.25rem)] font-extrabold leading-none tracking-tight tabular-nums transition-transform duration-300 group-hover:translate-x-0.5 ${s.num}`}
      >
        {value}
      </p>
      {subtitle && (
        <p className="mt-2 min-w-0 break-words text-xs font-medium leading-5 text-neutral-500 dark:text-neutral-400">
          {subtitle}
        </p>
      )}
    </div>
  );
}

