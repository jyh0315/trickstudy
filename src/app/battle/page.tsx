"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import BossMonster from "@/components/BossMonster";
import Chibi from "@/components/Chibi";
import { Button, Card, PageTitle, ProgressBar, SpeechBubble } from "@/components/ui";
import { bossFor, DAMAGE_PER_CORRECT } from "@/lib/bosses";
import { PINCH_LINES } from "@/lib/characters";
import { leaderOf, useGame } from "@/store/game";
import { useUI } from "@/store/ui";

type Victory = { boss: ReturnType<typeof bossFor>; elif: number; exp: number };

export default function Battle() {
  const game = useGame();
  const leader = leaderOf(game);
  const toast = useUI((s) => s.toast);
  const showLevelUp = useUI((s) => s.showLevelUp);
  const boss = bossFor(game.bossIndex);

  const [subjectId, setSubjectId] = useState(game.subjects[0]?.id ?? "");
  const [book, setBook] = useState(game.battleLogs[0]?.book ?? "");
  const [solved, setSolved] = useState(10);
  const [correct, setCorrect] = useState(8);
  const [hitKey, setHitKey] = useState(0);
  const [popups, setPopups] = useState<{ id: number; text: string }[]>([]);
  const [pinched, setPinched] = useState(false);
  const [line, setLine] = useState("문제집 풀고 와서 결과를 알려 줘!");
  const [victory, setVictory] = useState<Victory | null>(null);

  const books = useMemo(() => [...new Set(game.battleLogs.map((l) => l.book).filter(Boolean))], [game.battleLogs]);
  const remainHp = boss.hp - game.bossDamage;

  const attack = (e: React.FormEvent) => {
    e.preventDefault();
    if (solved <= 0) return;
    const before = bossFor(game.bossIndex);
    const r = game.logBattle(subjectId, book.trim(), solved, correct);

    if (r.damage > 0) {
      setHitKey((k) => k + 1);
      const id = Date.now();
      setPopups((p) => [...p, { id, text: `-${r.damage}` }]);
      setTimeout(() => setPopups((p) => p.filter((x) => x.id !== id)), 1100);
    }
    if (r.wrong > 0) {
      setTimeout(() => {
        setPinched(true);
        setLine(`오답 ${r.wrong}개… ${PINCH_LINES[r.wrong % PINCH_LINES.length]} 오답노트 꼭 써!`);
        setTimeout(() => setPinched(false), 1600);
      }, 450);
    } else {
      setLine("전부 정답! 교주 최고야!!");
    }
    toast(`+${r.elif} 엘리프 · +${r.exp} EXP`, "⚔️");
    if (r.defeated) setTimeout(() => setVictory({ boss: before, elif: r.defeated!.elif, exp: r.defeated!.exp }), 600);
    if (r.levels) setTimeout(() => showLevelUp(useGame.getState().level), r.defeated ? 2500 : 800);
  };

  return (
    <div className="flex flex-col gap-4">
      <PageTitle icon="⚔️" title="침략전" sub={`문제집에서 맞힌 문제 1개 = ${DAMAGE_PER_CORRECT} 데미지`} />

      {/* 전장 */}
      <Card className="overflow-hidden bg-gradient-to-b from-sky/60 to-white p-0">
        <div className="flex items-center justify-between px-4 pt-3">
          <div>
            <p className="font-display text-xl">
              {boss.name} {boss.loop > 0 && <span className="text-sm text-pink-deep">{boss.loop + 1}회차</span>}
            </p>
            <p className="text-xs text-ink/60">{boss.desc}</p>
          </div>
          <span className="font-display rounded-full border-[3px] border-ink/80 bg-lemon px-2 text-sm">STAGE {game.bossIndex + 1}</span>
        </div>
        <div className="px-4 pt-2">
          <ProgressBar value={remainHp / boss.hp} color="#FF6F91" height={22} />
          <p className="mt-1 text-right text-xs text-ink/60">HP {remainHp} / {boss.hp}</p>
        </div>

        <div className="relative flex items-end justify-between px-4 pb-4">
          <div className="flex flex-col items-center">
            <div className="mb-1 max-w-44"><SpeechBubble>{line}</SpeechBubble></div>
            <Chibi character={leader} size={130} pinched={pinched} float={!pinched} />
          </div>
          <div className="relative">
            <BossMonster color={boss.color} accent={boss.accent} hitKey={hitKey} size={170} />
            <AnimatePresence>
              {popups.map((p) => (
                <motion.span key={p.id} className="font-display absolute left-1/2 top-4 -translate-x-1/2 text-4xl text-pink-deep"
                  style={{ WebkitTextStroke: "2px #5B4636" }}
                  initial={{ y: 0, opacity: 0, scale: 0.4 }} animate={{ y: -60, opacity: 1, scale: 1.3 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}>
                  {p.text}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </Card>

      {/* 결과 입력 */}
      <Card>
        <h2 className="font-display mb-3 text-xl">📝 문제집 결과 입력</h2>
        <form onSubmit={attack} className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            {game.subjects.map((s) => (
              <motion.button type="button" key={s.id} whileTap={{ scale: 0.9 }} onClick={() => setSubjectId(s.id)}
                className={`font-display rounded-2xl border-[3px] border-ink/80 px-3 py-1 ${subjectId === s.id ? "bg-sky shadow-chunky-sm" : "bg-white"}`}>
                {s.emoji} {s.name}
              </motion.button>
            ))}
          </div>
          <input list="books" placeholder="문제집 이름 / 범위 (예: 수학의 정석 p.40-52)" value={book} onChange={(e) => setBook(e.target.value)} />
          <datalist id="books">{books.map((b) => <option key={b} value={b} />)}</datalist>
          <div className="grid grid-cols-2 gap-3">
            <Stepper label="푼 문제" value={solved} onChange={(v) => { setSolved(v); setCorrect((c) => Math.min(c, v)); }} />
            <Stepper label="맞힌 문제" value={correct} max={solved} onChange={setCorrect} />
          </div>
          <p className="text-center text-sm text-ink/70">
            예상 데미지 <b className="text-pink-deep">{correct * DAMAGE_PER_CORRECT}</b>
            {solved - correct > 0 && <> · 오답 {solved - correct}개 = 볼따구 🤏</>}
          </p>
          <Button tone="pink" type="submit" className="py-3 text-xl" disabled={solved <= 0}>⚔️ 공격!</Button>
        </form>
      </Card>

      {/* 기록 */}
      <Card>
        <h2 className="font-display mb-2 text-xl">📜 전투 기록</h2>
        {game.battleLogs.length === 0 && <p className="text-sm text-ink/60">아직 기록이 없어요.</p>}
        <ul className="flex flex-col gap-1.5">
          {game.battleLogs.slice(0, 10).map((l) => {
            const s = game.subjects.find((x) => x.id === l.subjectId);
            return (
              <li key={l.id} className="flex items-center gap-2 rounded-xl bg-cream px-3 py-1.5 text-sm">
                <span>{s?.emoji ?? "📝"}</span>
                <span className="min-w-0 flex-1 truncate">{l.book || s?.name || "문제집"}</span>
                <span className="text-ink/60">{l.correct}/{l.solved}</span>
                <span className="font-display w-12 text-right text-pink-deep">-{l.damage}</span>
              </li>
            );
          })}
        </ul>
      </Card>

      <AnimatePresence>
        {victory && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 0.3, y: 80 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.3 }}
              transition={{ type: "spring", stiffness: 260, damping: 14 }}
              className="flex w-full max-w-sm flex-col items-center gap-2 rounded-[32px] border-[3px] border-ink/80 bg-white p-6 shadow-chunky">
              <motion.p className="font-display text-4xl text-pink-deep" animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                토벌 성공!
              </motion.p>
              <BossMonster color={victory.boss.color} accent={victory.boss.accent} hitKey={0} defeated size={130} />
              <p className="font-display text-lg">{victory.boss.name} 격파!</p>
              <p className="font-display text-xl">💎 +{victory.elif} · ⭐ +{victory.exp} EXP</p>
              <Button tone="mint" onClick={() => setVictory(null)}>다음 보스로!</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stepper({ label, value, onChange, max = 999 }: { label: string; value: number; onChange: (v: number) => void; max?: number }) {
  const set = (v: number) => onChange(Math.max(0, Math.min(max, v)));
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-cream p-2">
      <span className="text-xs text-ink/60">{label}</span>
      <div className="flex items-center gap-1">
        <Button type="button" tone="white" className="px-2 py-0" onClick={() => set(value - 1)}>−</Button>
        <input type="number" value={value} min={0} max={max} onChange={(e) => set(Number(e.target.value))}
          className="font-display w-16 text-center text-xl" />
        <Button type="button" tone="white" className="px-2 py-0" onClick={() => set(value + 1)}>+</Button>
      </div>
    </div>
  );
}
