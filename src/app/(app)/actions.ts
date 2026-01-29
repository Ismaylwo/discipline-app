"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getDushanbeDayBounds, getDushanbeDateString } from "@/lib/date";

function ensure(cond: any, msg: string) {
  if (!cond) throw new Error(msg);
}

export async function logoutAction() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  revalidatePath("/");
}

export async function createTaskAction(payload: {
  title: string;
  description?: string;
  deadline: string | null;
  priority: 1 | 2 | 3;
  category_id: string | null;
  project_id: string | null;
}) {
  const supabase = await createSupabaseServer();
  const { data: user } = await supabase.auth.getUser();
  ensure(user.user, "Нет пользователя");

  const { error } = await supabase.from("tasks").insert({
    title: payload.title,
    description: payload.description ?? null,
    deadline: payload.deadline,
    priority: payload.priority ?? 2,
    status: "todo",
    category_id: payload.category_id,
    project_id: payload.project_id
  });
  if (error) throw error;

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/projects");
}

export async function toggleTaskDoneAction(taskId: string, done: boolean) {
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("tasks")
    .update({
      status: done ? "done" : "todo",
      completed_at: done ? new Date().toISOString() : null
    })
    .eq("id", taskId);
  if (error) throw error;

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/stats");
}

export async function deleteTaskAction(taskId: string) {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/stats");
}

export async function duplicateTaskAction(taskId: string) {
  const supabase = await createSupabaseServer();
  const { data: task, error } = await supabase.from("tasks").select("*").eq("id", taskId).single();
  if (error) throw error;

  const { error: e2 } = await supabase.from("tasks").insert({
    title: `${task.title} (copy)`,
    description: task.description,
    deadline: task.deadline,
    priority: task.priority,
    status: "todo",
    category_id: task.category_id,
    project_id: task.project_id
  });
  if (e2) throw e2;

  revalidatePath("/tasks");
}

export async function updateTaskAction(taskId: string, patch: any) {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("tasks").update(patch).eq("id", taskId);
  if (error) throw error;
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/projects");
}

export async function getTaskDetailsAction(taskId: string) {
  const supabase = await createSupabaseServer();
  const { data: task, error } = await supabase
    .from("tasks")
    .select("id,title,description,deadline,priority,status,category_id,project_id")
    .eq("id", taskId)
    .single();
  if (error) throw error;

  const { data: subtasks } = await supabase
    .from("subtasks")
    .select("id,title,is_done")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  return { ...task, subtasks: subtasks ?? [] };
}

export async function createSubtaskAction(taskId: string, title: string) {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("subtasks")
    .insert({ task_id: taskId, title })
    .select("id,title,is_done")
    .single();
  if (error) throw error;
  revalidatePath("/tasks");
  return data;
}

export async function toggleSubtaskAction(subtaskId: string, done: boolean) {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("subtasks").update({ is_done: done, done_at: done ? new Date().toISOString() : null }).eq("id", subtaskId);
  if (error) throw error;
  revalidatePath("/tasks");
}

export async function deleteSubtaskAction(subtaskId: string) {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("subtasks").delete().eq("id", subtaskId);
  if (error) throw error;
  revalidatePath("/tasks");
}

export async function createProjectAction(payload: { title: string; description?: string; deadline: string | null; category_id: string | null }) {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("projects").insert({
    title: payload.title,
    description: payload.description ?? null,
    deadline: payload.deadline,
    category_id: payload.category_id,
    status: "active"
  });
  if (error) throw error;
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  revalidatePath("/stats");
}

export async function createHabitAction(payload: { title: string }) {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("habits").insert({ title: payload.title, is_active: true });
  if (error) throw error;
  revalidatePath("/habits");
  revalidatePath("/dashboard");
  revalidatePath("/stats");
}

export async function toggleHabitTodayAction(habitId: string) {
  const supabase = await createSupabaseServer();
  const today = getDushanbeDateString(new Date());

  // try find
  const { data: existing } = await supabase.from("habit_logs").select("id").eq("habit_id", habitId).eq("log_date", today).maybeSingle();
  if (existing?.id) {
    const { error } = await supabase.from("habit_logs").delete().eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("habit_logs").insert({ habit_id: habitId, log_date: today, value: 1 });
    if (error) throw error;
  }

  revalidatePath("/habits");
  revalidatePath("/dashboard");
  revalidatePath("/stats");
}

export async function createNoteAction(payload: { title: string; content: string; pinned: boolean; category_id: string | null; project_id: string | null }) {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("notes").insert({
    title: payload.title,
    content: payload.content,
    pinned: payload.pinned,
    category_id: payload.category_id,
    project_id: payload.project_id
  });
  if (error) throw error;
  revalidatePath("/notes");
}

export async function updateNoteAction(noteId: string, patch: any) {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("notes").update(patch).eq("id", noteId);
  if (error) throw error;
  revalidatePath("/notes");
}

export async function deleteNoteAction(noteId: string) {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.from("notes").delete().eq("id", noteId);
  if (error) throw error;
  revalidatePath("/notes");
}
