export type Note = {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  updated_at: string;
  category_id: string | null;
  project_id: string | null;
};
