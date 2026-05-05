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
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
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

