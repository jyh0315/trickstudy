"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import Chibi from "@/components/Chibi";
import { Button, Card, PageTitle } from "@/components/ui";
import { CHARACTERS, RARITY_STYLE } from "@/lib/characters";
import { PULL10_COST, PULL_COST, TITLES, useGame, type PullResult } from "@/store/game";
import { useUI } from "@/store/ui";

type Tab = "gacha" | "book" | "title";

export default function Recruit() {
  const [tab, setTab] = useState<Tab>("gacha");
  return (
    <div className="flex flex-col gap-4">
      <PageTitle icon="🎁" title="모집" sub="엘리프로 사도를 모집하고, 크레용으로 칭호를 사요" />
      <div className="flex gap-2">
        {([["gacha", "🎁 모집"], ["book", "📖 사도 도감"], ["title", "🏷️ 칭호"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`font-display relative flex-1 rounded-2xl border-[3px] border-ink/80 py-2 ${tab === id ? "bg-pink shadow-chunky-sm" : "bg-white"}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === "gacha" && <Gacha />}
      {tab === "book" && <Collection />}
      {tab === "title" && <Titles />}
    </div>
  );
}

function Gacha() {
  const { elif, pity, pull } = useGame();
  const toast = useUI((s) => s.toast);
  const [results, setResults] = useState<PullResult[] | null>(null);
  const [revealed, setRevealed] = useState(0);

  const doPull = (n: 1 | 10) => {
    const r = pull(n);
    if (!r) return toast("엘리프가 부족해요! 수련하러 가자", "💦");
    setResults(r);
    setRevealed(0);
  };

  return (
    <>
      <Card className="flex flex-col items-center gap-3 overflow-hidden bg-gradient-to-b from-lavender/70 to-white">
        <motion.div className="relative flex h-48 w-full items-center justify-center"
          animate={{ rotate: [0, 2, -2, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
          <motion.div className="absolute h-44 w-44 rounded-full bg-lemon/70 blur-xl" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} />
          <span className="relative text-8xl">💌</span>
        </motion.div>
        <p className="font-display text-xl">사도 모집 편지</p>
        <p className="text-xs text-ink/60">★★★ 3% · ★★ 18% · ★ 79% · {50 - pity}회 안에 ★★★ 확정</p>
        <div className="flex gap-3">
          <Button tone="sky" onClick={() => doPull(1)} disabled={elif < PULL_COST}>1회 모집<br /><span className="text-sm">💎 {PULL_COST}</span></Button>
          <Button tone="pink" onClick={() => doPull(10)} disabled={elif < PULL10_COST}>10회 모집<br /><span className="text-sm">💎 {PULL10_COST}</span></Button>
        </div>
        <p className="text-xs text-ink/50">중복 사도는 크레용 🖍️ 으로 바뀌어요 (★5 / ★★15 / ★★★50)</p>
      </Card>

      <AnimatePresence>
        {results && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/50 p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex w-full max-w-xl flex-col items-center gap-4">
              <div className={`grid gap-3 ${results.length === 1 ? "grid-cols-1" : "grid-cols-3 sm:grid-cols-5"}`}>
                {results.map((r, i) => (
                  <PullCard key={i} result={r} open={i < revealed} big={results.length === 1}
                    onOpen={() => setRevealed((v) => Math.max(v, i + 1))} />
                ))}
              </div>
              {revealed < results.length ? (
                <Button tone="lemon" onClick={() => setRevealed(results.length)}>모두 열기</Button>
              ) : (
                <Button tone="mint" onClick={() => setResults(null)}>확인</Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function PullCard({ result, open, onOpen, big }: { result: PullResult; open: boolean; onOpen: () => void; big: boolean }) {
  const { character, isNew, crayon } = result;
  const style = RARITY_STYLE[character.rarity];
  const w = big ? 220 : 100;
  return (
    <motion.button onClick={onOpen} initial={{ y: -200, opacity: 0, rotate: -20 }} animate={{ y: 0, opacity: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }} style={{ width: w, perspective: 800 }}>
      <motion.div className="relative" style={{ transformStyle: "preserve-3d", height: w * 1.35 }}
        animate={{ rotateY: open ? 180 : 0 }} transition={{ duration: 0.5 }}>
        {/* 뒷면 */}
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl border-[3px] border-ink/80 bg-pink shadow-chunky-sm"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
          <span className={big ? "text-7xl" : "text-4xl"}>💌</span>
        </div>
        {/* 앞면 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-[3px] border-ink/80 bg-white p-1"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", boxShadow: `0 0 24px 6px ${style.glow}`, background: `linear-gradient(180deg, ${style.color}55, #fff), #fff`, WebkitBackfaceVisibility: "hidden" }}>
          {open && character.rarity === 3 && (
            <motion.div className="absolute inset-0 rounded-2xl" animate={{ opacity: [0.2, 0.7, 0.2] }} transition={{ repeat: Infinity, duration: 1.2 }}
              style={{ background: "radial-gradient(circle, #fff6 0, #ffd70044 60%, transparent 70%)" }} />
          )}
          <span className="text-xs font-bold" style={{ color: style.color, WebkitTextStroke: "0.5px #5B4636" }}>{style.label}</span>
          <Chibi character={character} size={big ? 160 : 72} />
          <span className={`font-display ${big ? "text-2xl" : "text-sm"}`}>{character.name}</span>
          {isNew ? (
            <span className="rounded-full bg-pink-deep px-2 text-[10px] font-bold text-white">NEW!</span>
          ) : (
            <span className="text-[10px] text-ink/60">🖍️ +{crayon}</span>
          )}
        </div>
      </motion.div>
    </motion.button>
  );
}

function Collection() {
  const { owned, leaderId, setLeader } = useGame();
  const toast = useUI((s) => s.toast);
  const count = CHARACTERS.filter((c) => owned[c.id]).length;
  return (
    <Card>
      <p className="font-display mb-3 text-lg">수집 {count} / {CHARACTERS.length}</p>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {[...CHARACTERS].sort((a, b) => b.rarity - a.rarity).map((c) => {
          const have = !!owned[c.id];
          const style = RARITY_STYLE[c.rarity];
          return (
            <motion.button key={c.id} whileHover={have ? { y: -4 } : {}} whileTap={have ? { scale: 0.92 } : {}}
              onClick={() => { if (have) { setLeader(c.id); toast(`${c.name}(을)를 대표 사도로!`, "💖"); } }}
              className={`relative flex flex-col items-center rounded-2xl border-[3px] p-2 ${leaderId === c.id ? "border-pink-deep bg-pink/40" : "border-ink/30 bg-cream"}`}>
              <span className="text-[10px] font-bold" style={{ color: style.color }}>{style.label}</span>
              <Chibi character={c} size={80} silhouette={!have} />
              <span className="font-display text-sm">{have ? c.name : "???"}</span>
              {have && owned[c.id] > 1 && <span className="absolute right-1 top-1 rounded-full bg-white px-1.5 text-[10px]">x{owned[c.id]}</span>}
              {leaderId === c.id && <span className="absolute left-1 top-1 text-sm">👑</span>}
            </motion.button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs text-ink/50">보유한 사도를 누르면 엘리아스 대표 사도로 설정돼요</p>
    </Card>
  );
}

function Titles() {
  const { titles, equippedTitle, crayon, buyTitle, equipTitle } = useGame();
  const toast = useUI((s) => s.toast);
  return (
    <Card>
      <p className="font-display mb-3 text-lg">🖍️ 보유 크레용 {crayon}</p>
      <ul className="flex flex-col gap-2">
        {TITLES.map((t) => {
          const have = titles.includes(t.id);
          return (
            <li key={t.id} className="flex items-center gap-2 rounded-2xl bg-cream px-3 py-2">
              <span className="font-display flex-1">「{t.name}」</span>
              {have ? (
                equippedTitle === t.id ? (
                  <span className="font-display text-sm text-pink-deep">장착 중</span>
                ) : (
                  <Button tone="mint" className="py-0.5 text-sm" onClick={() => equipTitle(t.id)}>장착</Button>
                )
              ) : (
                <Button tone="lemon" className="py-0.5 text-sm" disabled={crayon < t.cost}
                  onClick={() => buyTitle(t.id) && toast(`칭호 「${t.name}」 획득!`, "🏷️")}>
                  🖍️ {t.cost}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
