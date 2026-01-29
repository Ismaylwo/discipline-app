import { createSupabaseServer } from "@/lib/supabase/server";
import { getDushanbeDayBounds, addDaysIso } from "@/lib/date";
import { TasksClient } from "@/components/tasks/TasksClient";

export default async function TasksPage({
  searchParams
}: {
  searchParams: Promise<{ filter?: string; q?: string; category?: string; project?: string; status?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createSupabaseServer();

  const filter = resolvedSearchParams.filter ?? "all";
  const q = (resolvedSearchParams.q ?? "").trim();
  const category = resolvedSearchParams.category ?? "all";
  const project = resolvedSearchParams.project ?? "all";
  const status = resolvedSearchParams.status ?? "all";

  const [{ data: categories }, { data: projects }] = await Promise.all([
    supabase.from("categories").select("id,name,color").order("created_at", { ascending: true }),
    supabase.from("projects").select("id,title").eq("status", "active").order("created_at", { ascending: false })
  ]);

  const now = new Date();
  const { startIso, endIso } = getDushanbeDayBounds(now);
  const weekEndIso = addDaysIso(startIso, 7);

  let query = supabase
    .from("tasks")
    .select("id,title,description,deadline,priority,status,completed_at,category_id,project_id,created_at")
    .order("deadline", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (q) {
    const safe = q.replaceAll("%", "\%").replaceAll("_", "\_");
    query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
  }

  if (category !== "all") query = query.eq("category_id", category);
  if (project !== "all") query = query.eq("project_id", project);
  if (status !== "all") query = query.eq("status", status as any);

  if (filter === "today") {
    query = query.gte("deadline", startIso).lte("deadline", endIso);
  } else if (filter === "overdue") {
    query = query.lt("deadline", startIso).neq("status", "done");
  } else if (filter === "week") {
    query = query.gte("deadline", startIso).lt("deadline", weekEndIso);
  } else if (filter === "done") {
    query = query.eq("status", "done");
  }

  const { data: tasks } = await query;

  return (
    <TasksClient
      tasks={(tasks ?? []) as any}
      categories={(categories ?? []) as any}
      projects={(projects ?? []) as any}
      variant="full"
      basePath="/tasks"
    />
  );
}
