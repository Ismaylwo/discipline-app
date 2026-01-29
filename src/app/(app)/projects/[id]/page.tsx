import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TasksClient } from "@/components/tasks/TasksClient";

export default async function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServer();

  const { data: project } = await supabase
    .from("projects")
    .select("id,title,description,deadline,status,category_id")
    .eq("id", id)
    .maybeSingle();

  if (!project) return notFound();

  const [{ data: tasks }, { data: categories }, { data: projects }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id,title,description,deadline,priority,status,completed_at,category_id,project_id,created_at")
      .eq("project_id", id)
      .order("deadline", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id,name,color").order("created_at", { ascending: true }),
    supabase.from("projects").select("id,title").eq("status", "active").order("created_at", { ascending: false })
  ]);

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{project.title}</CardTitle>
          <CardDescription>{project.description ?? "—"}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Badge>{project.status}</Badge>
          {project.deadline ? <Badge variant="today">{String(project.deadline).slice(0, 10)}</Badge> : <Badge>без дедлайна</Badge>}
          <Badge>{(tasks ?? []).length} задач</Badge>
        </CardContent>
      </Card>

      <TasksClient
        tasks={(tasks ?? []) as any}
        categories={(categories ?? []) as any}
        projects={(projects ?? []) as any}
        variant="embedded"
      />
    </div>
  );
}
