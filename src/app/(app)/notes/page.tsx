import { createSupabaseServer } from "@/lib/supabase/server";
import { NotesClient } from "@/components/notes/NotesClient";

export default async function NotesPage() {
  const supabase = await createSupabaseServer();

  const [{ data: categories }, { data: projects }, { data: notes }] = await Promise.all([
    supabase.from("categories").select("id,name,color").order("created_at", { ascending: true }),
    supabase.from("projects").select("id,title").eq("status", "active").order("created_at", { ascending: false }),
    supabase
      .from("notes")
      .select("id,title,content,pinned,updated_at,category_id,project_id")
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false })
  ]);

  return <NotesClient notes={(notes ?? []) as any} categories={(categories ?? []) as any} projects={(projects ?? []) as any} />;
}
