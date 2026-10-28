"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { asset } from "@/lib/asset";
import { BACKGROUNDS } from "@/lib/backgrounds";
import { useGame, leaderOf } from "@/store/game";
import { useUI } from "@/store/ui";
import Chibi from "./Chibi";
import { Button } from "./ui";

const NAV = [
  { href: "/", label: "엘리아스", icon: "🏰" },
  { href: "/training/", label: "수련장", icon: "⏰" },
  { href: "/battle/", label: "침략전", icon: "⚔️" },
  { href: "/recruit/", label: "모집", icon: "🎁" },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useGame.persist.onFinishHydration(() => setHydrated(true));
    if (useGame.persist.hasHydrated()) setHydrated(true);
    return unsub;
  }, []);

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <motion.div className="text-6xl" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}>
          🌀
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <Background />
      <TopBar />
      <main className="flex-1 px-4 pb-32 pt-2">{children}</main>
      <BottomNav />
      <TimerWatcher />
      <Toasts />
      <LevelUpModal />
    </div>
  );
}

const bgCache: Record<string, string | null | undefined> = {};

function Background() {
  const pathname = usePathname();
  const bg = BACKGROUNDS[pathname];
  const [src, setSrc] = useState<string | null | undefined>(bg ? bgCache[bg.name] : null);

  useEffect(() => {
    if (!bg) return setSrc(null);
    if (bgCache[bg.name] !== undefined) return setSrc(bgCache[bg.name]);
    const candidates = [bg.url, asset(`/backgrounds/${bg.name}.jpg`), asset(`/backgrounds/${bg.name}.png`)].filter(Boolean) as string[];
    let cancelled = false;
    const tryNext = (i: number) => {
      if (i >= candidates.length) {
        bgCache[bg.name] = null;
        if (!cancelled) setSrc(null);
        return;
      }
      const img = new Image();
      img.onload = () => { bgCache[bg.name] = candidates[i]; if (!cancelled) setSrc(candidates[i]); };
      img.onerror = () => tryNext(i + 1);
      img.src = candidates[i];
    };
    tryNext(0);
    return () => { cancelled = true; };
  }, [bg]);

  return (
    <AnimatePresence>
      {src && (
        <motion.div key={src} className="fixed inset-0 -z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="h-full w-full object-cover" />
          {/* 카드 글씨가 잘 보이도록 살짝 밝게 덮기 */}
          <div className="absolute inset-0 bg-cream/45" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TopBar() {
  const { elif, crayon, level, timer } = useGame();
  const pathname = usePathname();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const remain = timer ? (timer.endAt ? (timer.endAt - now) / 1000 : timer.pausedRemaining ?? 0) : 0;

  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 bg-cream/85 px-4 py-3 backdrop-blur">
      <span className="font-display rounded-full border-[3px] border-ink/80 bg-lavender px-3 py-0.5 text-sm text-ink">Lv.{level}</span>
      {timer && pathname !== "/training/" && (
        <Link href="/training/" className="font-display rounded-full border-[3px] border-ink/80 bg-mint px-3 py-0.5 text-sm text-ink">
          {timer.mode === "focus" ? "⏰" : "☕"} {fmt(Math.max(0, remain))}
        </Link>
      )}
      <div className="ml-auto flex gap-2">
        <Currency icon="💎" value={elif} label="엘리프" />
        <Currency icon="🖍️" value={crayon} label="크레용" />
      </div>
    </header>
  );
}

function Currency({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <motion.div
      key={value}
      initial={{ scale: 1.25 }}
      animate={{ scale: 1 }}
      title={label}
      className="font-display flex items-center gap-1 rounded-full border-[3px] border-ink/80 bg-white px-3 py-0.5 text-sm text-ink"
    >
      <span>{icon}</span>
      {value.toLocaleString()}
    </motion.div>
  );
}

function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-3">
      <div className="flex w-full max-w-md justify-around rounded-[28px] border-[3px] border-ink/80 bg-white px-2 py-2 shadow-chunky">
        {NAV.map((n) => {
          const active = pathname === n.href;
          return (
            <Link key={n.href} href={n.href} className="relative flex flex-1 flex-col items-center py-1">
              {active && (
                <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-2xl bg-pink"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }} />
              )}
              <motion.span className="relative text-2xl" animate={active ? { y: [0, -6, 0] } : {}} transition={{ duration: 0.5 }}>
                {n.icon}
              </motion.span>
              <span className="font-display relative text-xs text-ink">{n.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// 어느 페이지에 있든 타이머 종료와 딴짓(탭 이탈)을 감시한다.
function TimerWatcher() {
  const toast = useUI((s) => s.toast);
  const showLevelUp = useUI((s) => s.showLevelUp);

  useEffect(() => {
    const tick = setInterval(() => {
      const t = useGame.getState().timer;
      if (!t?.endAt || t.endAt > Date.now()) return;
      const r = useGame.getState().completeTimer();
      if (!r) return;
      if (r.mode === "break") toast("휴식 끝! 다시 수련하러 가자", "☕");
      else {
        toast(`${r.minutes}분 수련 완료! +${r.elif} 엘리프`, "🎉");
        if (r.levels) showLevelUp(useGame.getState().level);
      }
    }, 500);

    const onVis = () => {
      const t = useGame.getState().timer;
      if (document.visibilityState === "visible" && t?.mode === "focus" && t.endAt) {
        useGame.getState().addDistraction();
        toast("딴짓 감지! 볼따구 쭈우욱~", "🤏");
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [toast, showLevelUp]);

  return null;
}

function Toasts() {
  const toasts = useUI((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-50 flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -30, scale: 0.6 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="font-display flex items-center gap-2 rounded-full border-[3px] border-ink/80 bg-lemon px-4 py-2 text-ink shadow-chunky-sm"
          >
            {t.icon && <span className="text-xl">{t.icon}</span>}
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function LevelUpModal() {
  const level = useUI((s) => s.levelUp);
  const close = useUI((s) => s.closeLevelUp);
  const leader = useGame(leaderOf);
  return (
    <AnimatePresence>
      {level && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.div
            initial={{ scale: 0.3, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.3 }}
            transition={{ type: "spring", stiffness: 300, damping: 14 }}
            className="flex flex-col items-center gap-2 rounded-[32px] border-[3px] border-ink/80 bg-white p-6 shadow-chunky"
          >
            <p className="font-display text-4xl text-pink-deep">LEVEL UP!</p>
            <Chibi character={leader} size={140} float />
            <p className="font-display text-2xl text-ink">교주 레벨 {level} 달성!</p>
            <Button tone="mint" onClick={close}>야호!</Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function fmt(sec: number) {
  const s = Math.ceil(sec);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
