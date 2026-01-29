"use client";

import { useTransition } from "react";
import { Flame } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toggleHabitTodayAction } from "@/app/(app)/actions";

export function HabitCard({
  habit,
  todayDone,
  last7
}: {
  habit: { id: string; title: string; streak?: number };
  todayDone: boolean;
  last7: boolean[];
}) {
  const [isPending, startTransition] = useTransition();

  const onToggle = () =>
    startTransition(async () => {
      try {
        await toggleHabitTodayAction(habit.id);
      } catch (e: any) {
        toast.error(e?.message ?? "Не удалось отметить");
      }
    });

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-semibold">{habit.title}</div>
          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
            <Badge variant={todayDone ? "success" : "default"}>{todayDone ? "Сегодня ✓" : "Сегодня —"}</Badge>
            <span className="inline-flex items-center gap-1">
              <Flame className="h-3.5 w-3.5" /> streak: {habit.streak ?? 0}
            </span>
          </div>
        </div>
        <Button variant={todayDone ? "secondary" : "default"} onClick={onToggle} disabled={isPending}>
          {todayDone ? "Снять" : "Отметить"}
        </Button>
      </div>

      <div className="mt-4 flex gap-1">
        {last7.map((v, idx) => (
          <div key={idx} className={cn("h-2 flex-1 rounded-full", v ? "bg-zinc-900" : "bg-zinc-100")} />
        ))}
      </div>
      <div className="mt-1 text-xs text-zinc-500">Последние 7 дней</div>
    </div>
  );
}
