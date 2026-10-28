"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Chibi from "@/components/Chibi";
import { Button, Card, ProgressBar, SpeechBubble } from "@/components/ui";
import { PINCH_LINES } from "@/lib/characters";
import { cloudLoad, cloudSave, supabase } from "@/lib/supabase";
import { TITLES, expToNext, leaderOf, selectSave, todayKey, useGame } from "@/store/game";
import { useUI } from "@/store/ui";

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

function dday(date: string) {
  const today = new Date(todayKey());
  const target = new Date(date);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export default function Dashboard() {
  const game = useGame();
  const leader = leaderOf(game);
  const [line, setLine] = useState(() => pick(leader.lines));
  const [pinched, setPinched] = useState(false);
  const pinchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => setLine(pick(leader.lines)), [leader]);
  useEffect(() => () => clearTimeout(pinchTimer.current), []);

  const pinch = () => {
    setPinched(true);
    setLine(pick(PINCH_LINES));
    clearTimeout(pinchTimer.current);
    pinchTimer.current = setTimeout(() => {
      setPinched(false);
      setLine(pick(leader.lines));
    }, 1300);
  };

  const title = TITLES.find((t) => t.id === game.equippedTitle)?.name;
  const today = game.studyLog[todayKey()] ?? {};
  const todayTotal = Object.values(today).reduce((a, b) => a + b, 0);
  const goalTotal = game.subjects.reduce((a, s) => a + s.goalMin, 0);
  const upcoming = game.exams.filter((e) => dday(e.date) >= 0);

  return (
    <div className="flex flex-col gap-4">
      {/* 프로필 */}
      <Card className="bg-gradient-to-br from-white to-pink/40">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-pink-deep">「{title}」</p>
            <Nickname />
            <div className="mt-2 flex items-center gap-2">
              <span className="font-display text-sm">Lv.{game.level}</span>
              <div className="flex-1">
                <ProgressBar value={game.exp / expToNext(game.level)} />
              </div>
              <span className="text-xs text-ink/60">{game.exp}/{expToNext(game.level)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* 대표 사도 */}
      <div className="relative flex flex-col items-center py-2">
        <div className="mb-2 max-w-[80%]">
          <SpeechBubble>{line}</SpeechBubble>
        </div>
        <motion.button onClick={pinch} whileTap={{ scale: 0.95 }} aria-label="볼따구 잡아당기기" className="cursor-grab">
          <Chibi character={leader} size={210} pinched={pinched} float={!pinched} />
        </motion.button>
        <p className="font-display mt-1 text-lg">{leader.name}</p>
        <p className="text-xs text-ink/50">눌러서 볼따구 잡아당기기 🤏</p>
        <Sparkles />
      </div>

      {/* D-Day */}
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-display text-xl">📅 다가오는 시험</h2>
        </div>
        {upcoming.length === 0 && <p className="text-sm text-ink/60">등록된 시험이 없어요. 아래에서 추가해 주세요!</p>}
        <ul className="flex flex-col gap-2">
          <AnimatePresence>
            {upcoming.map((e) => {
              const d = dday(e.date);
              return (
                <motion.li key={e.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 rounded-2xl bg-cream px-3 py-2">
                  <span className={`font-display min-w-16 rounded-xl border-[3px] border-ink/80 px-2 py-0.5 text-center ${d <= 7 ? "bg-pink" : "bg-sky"}`}>
                    {d === 0 ? "D-DAY" : `D-${d}`}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{e.name}</p>
                    <p className="text-xs text-ink/50">{e.date}</p>
                  </div>
                  <button className="text-ink/40 hover:text-pink-deep" onClick={() => game.removeExam(e.id)} aria-label="삭제">✕</button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
        <ExamForm />
      </Card>

      {/* 오늘의 수련 */}
      <Card>
        <h2 className="font-display mb-2 text-xl">🔥 오늘의 수련 {todayTotal}분 / {goalTotal}분</h2>
        <div className="flex flex-col gap-2">
          {game.subjects.map((s) => (
            <div key={s.id} className="flex items-center gap-2 text-sm">
              <span className="w-20 truncate">{s.emoji} {s.name}</span>
              <div className="flex-1"><ProgressBar value={(today[s.id] ?? 0) / s.goalMin} color="#7FD8B0" height={14} /></div>
              <span className="w-16 text-right text-xs text-ink/60">{today[s.id] ?? 0}/{s.goalMin}분</span>
            </div>
          ))}
        </div>
      </Card>

      {/* 바로가기 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: "/training/", icon: "⏰", label: "수련장", tone: "bg-mint" },
          { href: "/battle/", icon: "⚔️", label: "침략전", tone: "bg-sky" },
          { href: "/recruit/", icon: "🎁", label: "모집", tone: "bg-lemon" },
        ].map((q, i) => (
          <motion.div key={q.href} initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 * i, type: "spring" }}
            whileHover={{ y: -4, rotate: i % 2 ? 2 : -2 }} whileTap={{ scale: 0.9 }}>
            <Link href={q.href} className={`flex flex-col items-center rounded-3xl border-[3px] border-ink/80 py-4 shadow-chunky ${q.tone}`}>
              <span className="text-3xl">{q.icon}</span>
              <span className="font-display">{q.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* 기록 */}
      <Card>
        <h2 className="font-display mb-2 text-xl">📊 교주 기록</h2>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <Stat label="총 수련" value={`${Math.floor(game.stats.focusMin / 60)}시간 ${game.stats.focusMin % 60}분`} />
          <Stat label="푼 문제" value={`${game.stats.solved}개`} />
          <Stat label="정답률" value={game.stats.solved ? `${Math.round((game.stats.correct / game.stats.solved) * 100)}%` : "-"} />
          <Stat label="쓰러뜨린 보스" value={`${game.stats.bossesDefeated}마리`} />
        </div>
      </Card>

      <SaveCard />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-cream p-2 text-center">
      <p className="text-xs text-ink/60">{label}</p>
      <p className="font-display text-lg">{value}</p>
    </div>
  );
}

function Nickname() {
  const { nickname, setNickname } = useGame();
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(nickname);
  if (editing)
    return (
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setNickname(v); setEditing(false); }}>
        <input value={v} onChange={(e) => setV(e.target.value)} autoFocus className="w-32" maxLength={12} />
        <Button tone="mint" className="py-0.5 text-sm">저장</Button>
      </form>
    );
  return (
    <button className="font-display text-2xl" onClick={() => { setV(nickname); setEditing(true); }}>
      {nickname} <span className="text-sm text-ink/40">✏️</span>
    </button>
  );
}

function ExamForm() {
  const addExam = useGame((s) => s.addExam);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  return (
    <form
      className="mt-3 flex flex-wrap gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name || !date) return;
        addExam(name, date);
        setName("");
        setDate("");
      }}
    >
      <input placeholder="시험 이름 (예: 중간고사)" value={name} onChange={(e) => setName(e.target.value)} className="min-w-0 flex-1" />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <Button tone="sky" type="submit">추가</Button>
    </form>
  );
}

function Sparkles() {
  return (
    <div className="pointer-events-none absolute inset-0">
      {[...Array(6)].map((_, i) => (
        <motion.span
          key={i}
          className="absolute text-lg"
          style={{ left: `${15 + i * 14}%`, top: `${20 + (i % 3) * 22}%` }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5], rotate: [0, 90] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.4 }}
        >
          {i % 2 ? "✨" : "⭐"}
        </motion.span>
      ))}
    </div>
  );
}

function SaveCard() {
  const toast = useUI((s) => s.toast);
  const importSave = useGame((s) => s.importSave);
  const resetAll = useGame((s) => s.resetAll);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); } catch (e) { toast(`실패: ${(e as Error).message}`, "😵"); }
    setBusy(false);
  };

  return (
    <Card className="bg-white/80">
      <h2 className="font-display mb-1 text-xl">💾 저장</h2>
      <p className="mb-3 text-xs text-ink/60">
        진행 상황은 이 브라우저에 자동 저장돼요.
        {supabase ? " 클라우드에 올려 두면 다른 기기에서도 불러올 수 있어요." : ""}
      </p>
      <div className="flex flex-wrap gap-2">
        {supabase && (
          <>
            <Button tone="mint" disabled={busy}
              onClick={() => run(async () => { await cloudSave(selectSave(useGame.getState())); toast("클라우드 저장 완료!", "☁️"); })}>
              클라우드 저장
            </Button>
            <Button tone="sky" disabled={busy}
              onClick={() => run(async () => {
                const data = await cloudLoad();
                if (!data) return toast("저장된 데이터가 없어요", "🤔");
                importSave(data);
                toast("불러오기 완료!", "☁️");
              })}>
              불러오기
            </Button>
          </>
        )}
        <Button tone="white" onClick={() => { if (confirm("정말 모든 진행 상황을 초기화할까요?")) resetAll(); }}>
          초기화
        </Button>
      </div>
    </Card>
  );
}
