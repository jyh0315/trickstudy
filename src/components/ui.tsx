"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";

export function Card({ children, className = "", ...rest }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={`rounded-[28px] border-[3px] border-ink/80 bg-white p-4 shadow-chunky ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

const TONES = {
  pink: "bg-pink text-ink",
  mint: "bg-mint text-ink",
  sky: "bg-sky text-ink",
  lemon: "bg-lemon text-ink",
  lavender: "bg-lavender text-ink",
  white: "bg-white text-ink",
} as const;

export function Button({
  children, tone = "pink", className = "", ...rest
}: HTMLMotionProps<"button"> & { tone?: keyof typeof TONES; children: ReactNode }) {
  return (
    <motion.button
      whileHover={{ scale: 1.04, y: -2 }}
      whileTap={{ scale: 0.92, y: 3 }}
      transition={{ type: "spring", stiffness: 500, damping: 15 }}
      className={`font-display rounded-2xl border-[3px] border-ink/80 px-4 py-2 shadow-chunky-sm disabled:cursor-not-allowed disabled:opacity-50 ${TONES[tone]} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

export function ProgressBar({ value, color = "#FF9EC4", height = 18 }: { value: number; color?: string; height?: number }) {
  return (
    <div className="overflow-hidden rounded-full border-[3px] border-ink/80 bg-cream" style={{ height }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: `repeating-linear-gradient(-45deg, ${color}, ${color} 10px, ${color}cc 10px, ${color}cc 20px)` }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
      />
    </div>
  );
}

export function SpeechBubble({ children }: { children: ReactNode }) {
  return (
    <motion.div
      key={String(children)}
      initial={{ opacity: 0, scale: 0.6, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 16 }}
      className="relative rounded-2xl border-[3px] border-ink/80 bg-white px-4 py-2 text-center text-sm font-bold text-ink shadow-chunky-sm"
    >
      {children}
      <span className="absolute -bottom-[11px] left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b-[3px] border-r-[3px] border-ink/80 bg-white" />
    </motion.div>
  );
}

export function PageTitle({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <motion.span className="text-4xl" animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
        {icon}
      </motion.span>
      <div>
        <h1 className="font-display text-3xl text-ink">{title}</h1>
        {sub && <p className="text-sm text-ink/60">{sub}</p>}
      </div>
    </div>
  );
}
