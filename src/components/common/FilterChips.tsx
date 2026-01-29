"use client";

import { cn } from "@/lib/utils";

export function FilterChips({
  chips,
  activeId,
  onChange
}: {
  chips: { id: string; label: string }[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={cn(
            "rounded-full border px-3 py-1 text-sm transition",
            activeId === c.id ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-700 hover:bg-zinc-50"
          )}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
