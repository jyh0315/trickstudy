"use client";

import { create } from "zustand";

export interface Toast { id: number; text: string; icon?: string }

interface UI {
  toasts: Toast[];
  levelUp: number | null;
  toast: (text: string, icon?: string) => void;
  showLevelUp: (level: number) => void;
  closeLevelUp: () => void;
}

let next = 1;

export const useUI = create<UI>((set) => ({
  toasts: [],
  levelUp: null,
  toast: (text, icon) => {
    const id = next++;
    set((s) => ({ toasts: [...s.toasts, { id, text, icon }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2600);
  },
  showLevelUp: (levelUp) => set({ levelUp }),
  closeLevelUp: () => set({ levelUp: null }),
}));
