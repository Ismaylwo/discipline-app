export type Task = {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  priority: 1 | 2 | 3;
  status: "todo" | "doing" | "done";
  completed_at: string | null;
  category_id: string | null;
  project_id: string | null;
  created_at: string;
};
