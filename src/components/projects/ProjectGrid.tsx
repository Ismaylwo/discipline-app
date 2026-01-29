import { ProjectCard } from "./ProjectCard";

export function ProjectGrid({ items }: { items: any[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <ProjectCard key={p.project_id} p={p} />
      ))}
    </div>
  );
}
