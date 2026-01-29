import { HabitCard } from "./HabitCard";

export function HabitList({ items }: { items: any[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {items.map((h) => (
        <HabitCard key={h.id} habit={h} todayDone={Boolean(h.today_done)} last7={(h.last7 as boolean[]) ?? []} />
      ))}
    </div>
  );
}
