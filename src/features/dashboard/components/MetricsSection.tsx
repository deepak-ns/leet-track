import { MetricCard } from "@/features/dashboard/components/MetricCard";

type MetricCardItem = {
  label: string;
  value: number | string;
  subtitle?: string;
  accent?: "blue" | "green" | "amber" | "rose" | "violet";
};

export function MetricsSection({
  cards,
  loading,
}: {
  cards: MetricCardItem[];
  loading: boolean;
}) {
  return (
    <section className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
      {cards.map((card) => (
        <MetricCard
          key={card.label}
          label={card.label}
          value={loading ? 0 : card.value}
          subtitle={card.subtitle}
          accent={card.accent}
        />
      ))}
    </section>
  );
}

