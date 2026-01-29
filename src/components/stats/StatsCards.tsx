import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function StatsCards({
  summary
}: {
  summary: { period_created: number; period_done: number; overdue_now: number; due_today: number } | null;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <Card>
        <CardHeader>
          <CardDescription>Создано</CardDescription>
          <CardTitle>{summary?.period_created ?? "—"}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Сделано</CardDescription>
          <CardTitle>{summary?.period_done ?? "—"}</CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Просрочено сейчас</CardDescription>
          <CardTitle className="flex items-center gap-2">
            {summary?.overdue_now ?? "—"} <Badge variant="overdue">Overdue</Badge>
          </CardTitle>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardDescription>Дедлайн сегодня</CardDescription>
          <CardTitle className="flex items-center gap-2">
            {summary?.due_today ?? "—"} <Badge variant="today">Today</Badge>
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
