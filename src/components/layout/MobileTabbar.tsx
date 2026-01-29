"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CheckSquare, Flame, StickyNote, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/habits", label: "Habits", icon: Flame },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/stats", label: "Stats", icon: BarChart3 }
];

export function MobileTabbar() {
  const pathname = usePathname();
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1 px-2 py-2">
        {tabs.map((t) => {
          const active = pathname === t.href || pathname.startsWith(t.href);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn("flex flex-col items-center gap-1 rounded-xl py-2 text-xs text-zinc-600", active ? "bg-zinc-100 text-zinc-900" : "")}
            >
              <Icon className="h-5 w-5" />
              {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
