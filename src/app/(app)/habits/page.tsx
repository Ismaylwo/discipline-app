import { createSupabaseServer } from "@/lib/supabase/server";
import { getDushanbeDateString } from "@/lib/date";
import { EmptyState } from "@/components/common/EmptyState";
import { HabitList } from "@/components/habits/HabitList";

export default async function HabitsPage() {
  const supabase = await createSupabaseServer();
  const today = getDushanbeDateString(new Date());

  const { data: habits } = await supabase
    .from("habits")
    .select("id,title,is_active,created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (!habits?.length) {
    return <EmptyState title="Пока нет привычек" description="Создайте привычку через кнопку “Добавить” вверху." />;
  }

  const results = [];
  // Last 7 days starting from today (Asia/Dushanbe date string)
  const start7 = getDushanbeDateString(new Date(Date.now() - 6 * 24 * 60 * 60_000));

  for (const h of habits) {
    const { data: logs } = await supabase
      .from("habit_logs")
      .select("log_date")
      .eq("habit_id", h.id)
      .gte("log_date", start7)
      .order("log_date", { ascending: true });

    const loggedSet = new Set((logs ?? []).map((l) => l.log_date));
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60_000);
      const ds = getDushanbeDateString(d);
      last7.push(loggedSet.has(ds));
    }

    let streak = 0;
    try {
      const { data: s } = await supabase.rpc("stats_habit_current_streak", { habit: h.id });
      streak = Number(s ?? 0);
    } catch {
      // ignore if RPC missing
    }

    results.push({
      id: h.id,
      title: h.title,
      today_done: loggedSet.has(today),
      last7,
      streak
    });
  }

  return <HabitList items={results} />;
}
