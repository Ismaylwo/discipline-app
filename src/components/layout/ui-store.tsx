"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type AddTab = "task" | "project" | "habit" | "note";

type UIState = {
  isCommandOpen: boolean;
  isAddOpen: boolean;
  addTab: AddTab;
  openCommand: () => void;
  closeCommand: () => void;
  openAdd: (tab?: AddTab) => void;
  closeAdd: () => void;
};

const Ctx = createContext<UIState | null>(null);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [isCommandOpen, setCommandOpen] = useState(false);
  const [isAddOpen, setAddOpen] = useState(false);
  const [addTab, setAddTab] = useState<AddTab>("task");

  const value = useMemo<UIState>(
    () => ({
      isCommandOpen,
      isAddOpen,
      addTab,
      openCommand: () => setCommandOpen(true),
      closeCommand: () => setCommandOpen(false),
      openAdd: (tab = "task") => {
        setAddTab(tab);
        setAddOpen(true);
      },
      closeAdd: () => setAddOpen(false)
    }),
    [isCommandOpen, isAddOpen, addTab]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUI() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useUI must be used within UIProvider");
  return v;
}
