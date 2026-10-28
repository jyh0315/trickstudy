"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { fmt } from "@/components/AppShell";
import Chibi from "@/components/Chibi";
import { Button, Card, PageTitle, SpeechBubble } from "@/components/ui";
import { PINCH_LINES } from "@/lib/characters";
import { leaderOf, todayKey, useGame } from "@/store/game";

const FOCUS_PRESETS = [15, 25, 50];
const BREAK_PRESETS = [5, 10];

export default function Training() {
  const game = useGame();
  const leader = leaderOf(game);
  const timer = game.timer;
  const [subjectId, setSubjectId] = useState(game.subjects[0]?.id ?? "");
  const [custom, setCustom] = useState(40);
  const [now, setNow] = useState(Date.now());
  const [pinched, setPinched] = useState(false);
  const [line, setLine] = useState("과목이랑 시간을 골라 줘, 교주!");
  const lastDistractions = useRef(timer?.distractions ?? 0);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  // 딴짓이 감지되면 볼따구 쭈욱
  useEffect(() => {
    const d = timer?.distractions ?? 0;
    if (d > lastDistractions.current) doPinch("어디 갔다 왔어?! " + PINCH_LINES[d % PINCH_LINES.length]);
    lastDistractions.current = d;
  }, [timer?.distractions]);

  const doPinch = (msg: string) => {
    setPinched(true);
    setLine(msg);
    setTimeout(() => setPinched(false), 1500);
  };

  const remain = timer ? Math.max(0, timer.endAt ? (timer.endAt - now) / 1000 : timer.pausedRemaining ?? 0) : 0;
  const progress = timer ? 1 - remain / timer.durationSec : 0;
  const subject = game.subjects.find((s) => s.id === (timer?.subjectId ?? subjectId));
  const paused = timer && !timer.endAt;

  const start = (mode: "focus" | "break", min: number) => {
    if (mode === "focus" && !subjectId) return;
    game.startTimer(subjectId, mode, min);
    setLine(mode === "focus" ? `${min}분 집중! 딴 탭 가면 볼 잡아당긴다~` : "푹 쉬어, 교주~");
  };

  const giveUp = () => {
    if (timer?.mode === "focus" && !confirm("포기하면 보상이 없어요. 정말 그만둘까요?")) return;
    game.cancelTimer();
    if (timer?.mode === "focus") doPinch("포기라니! " + PINCH_LINES[0]);
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle icon="⏰" title="수련장" sub="집중하면 엘리프와 경험치를 얻어요 (1분 = 💎2)" />

      <Card className="flex flex-col items-center gap-3 bg-gradient-to-b from-white to-mint/40">
        <div className="relative flex items-center justify-center">
          <Ring progress={progress} color={timer?.mode === "break" ? "#8FC8FF" : "#FF8FB1"} />
          <div className="absolute flex flex-col items-center">
            <Chibi character={leader} size={110} pinched={pinched} float={!!timer && !paused && !pinched} />
            <p className="font-display text-4xl tabular-nums">{fmt(timer ? remain : 0)}</p>
            <p className="text-xs text-ink/60">
              {timer ? (timer.mode === "break" ? "☕ 휴식 중" : `${subject?.emoji ?? ""} ${subject?.name ?? ""}`) : "대기 중"}
              {paused && " · 일시정지"}
            </p>
          </div>
        </div>
        <SpeechBubble>{line}</SpeechBubble>

        {timer ? (
          <div className="mt-2 flex gap-2">
            {paused ? (
              <Button tone="mint" onClick={game.resumeTimer}>▶ 계속</Button>
            ) : (
              <Button tone="lemon" onClick={game.pauseTimer}>⏸ 일시정지</Button>
            )}
            <Button tone="white" onClick={giveUp}>그만두기</Button>
          </div>
        ) : null}
        {timer?.mode === "focus" && timer.distractions > 0 && (
          <p className="text-xs text-pink-deep">딴짓 {timer.distractions}회 · 보상 -{Math.min(50, timer.distractions * 10)}%</p>
        )}
      </Card>

      <AnimatePresence>
        {!timer && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="flex flex-col gap-4">
            <Card>
              <h2 className="font-display mb-2 text-xl">📚 과목 선택</h2>
              <div className="flex flex-wrap gap-2">
                {game.subjects.map((s) => (
                  <motion.button key={s.id} whileTap={{ scale: 0.9 }} onClick={() => setSubjectId(s.id)}
                    className={`font-display rounded-2xl border-[3px] border-ink/80 px-3 py-1 ${subjectId === s.id ? "bg-pink shadow-chunky-sm" : "bg-white"}`}>
                    {s.emoji} {s.name}
                    <span className="ml-1 text-xs text-ink/50">{game.studyLog[todayKey()]?.[s.id] ?? 0}/{s.goalMin}분</span>
                  </motion.button>
                ))}
              </div>
              <h2 className="font-display mb-2 mt-4 text-xl">🔥 집중 시작</h2>
              <div className="flex flex-wrap items-center gap-2">
                {FOCUS_PRESETS.map((m) => (
                  <Button key={m} tone="pink" onClick={() => start("focus", m)} disabled={!subjectId}>{m}분</Button>
                ))}
                <div className="flex items-center gap-1">
                  <input type="number" min={1} max={180} value={custom} onChange={(e) => setCustom(Number(e.target.value))} className="w-20" />
                  <Button tone="lavender" onClick={() => start("focus", Math.max(1, Math.min(180, custom)))} disabled={!subjectId}>분 시작</Button>
                </div>
              </div>
              <h2 className="font-display mb-2 mt-4 text-xl">☕ 휴식</h2>
              <div className="flex gap-2">
                {BREAK_PRESETS.map((m) => (
                  <Button key={m} tone="sky" onClick={() => start("break", m)}>{m}분 휴식</Button>
                ))}
              </div>
            </Card>
            <SubjectEditor />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Ring({ progress, color }: { progress: number; color: string }) {
  const r = 120;
  const c = 2 * Math.PI * r;
  return (
    <svg width="280" height="280" viewBox="0 0 280 280" className="-rotate-90">
      <circle cx="140" cy="140" r={r} fill="none" stroke="#F3E3CF" strokeWidth="22" />
      <circle cx="140" cy="140" r={r} fill="none" stroke="rgba(91,70,54,0.8)" strokeWidth="28" strokeDasharray="1 0" opacity="0.08" />
      <motion.circle cx="140" cy="140" r={r} fill="none" stroke={color} strokeWidth="22" strokeLinecap="round"
        strokeDasharray={c} animate={{ strokeDashoffset: c * (1 - progress) }} transition={{ duration: 0.3 }} />
    </svg>
  );
}

function SubjectEditor() {
  const { subjects, addSubject, updateSubject, removeSubject } = useGame();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📝");
  const [goal, setGoal] = useState(60);
  return (
    <Card>
      <h2 className="font-display mb-2 text-xl">🎯 과목별 하루 목표</h2>
      <ul className="flex flex-col gap-2">
        {subjects.map((s) => (
          <li key={s.id} className="flex items-center gap-2 text-sm">
            <span className="w-24 truncate">{s.emoji} {s.name}</span>
            <input type="number" min={5} step={5} value={s.goalMin} className="w-20"
              onChange={(e) => updateSubject(s.id, { goalMin: Math.max(5, Number(e.target.value)) })} />
            <span className="text-ink/60">분</span>
            <button className="ml-auto text-ink/40 hover:text-pink-deep" onClick={() => removeSubject(s.id)} aria-label="삭제">✕</button>
          </li>
        ))}
      </ul>
      <form className="mt-3 flex flex-wrap gap-2"
        onSubmit={(e) => { e.preventDefault(); if (!name) return; addSubject(name, emoji || "📝", goal); setName(""); }}>
        <input value={emoji} onChange={(e) => setEmoji(e.target.value)} className="w-14 text-center" maxLength={2} />
        <input placeholder="과목 이름" value={name} onChange={(e) => setName(e.target.value)} className="min-w-0 flex-1" />
        <input type="number" min={5} step={5} value={goal} onChange={(e) => setGoal(Number(e.target.value))} className="w-20" />
        <Button tone="mint" type="submit">추가</Button>
      </form>
    </Card>
  );
}
