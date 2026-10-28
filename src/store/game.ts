"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CHARACTERS, CHARACTER_MAP, type Character, type Rarity } from "@/lib/characters";
import { bossFor, DAMAGE_PER_CORRECT } from "@/lib/bosses";

export interface Exam { id: string; name: string; date: string }
export interface Subject { id: string; name: string; emoji: string; goalMin: number }
export interface TimerState {
  subjectId: string;
  mode: "focus" | "break";
  durationSec: number;
  endAt: number | null; // 진행 중이면 종료 시각(ms)
  pausedRemaining: number | null; // 일시정지면 남은 초
  distractions: number;
}
export interface BattleLog {
  id: string;
  at: number;
  subjectId: string;
  book: string;
  solved: number;
  correct: number;
  damage: number;
}
export interface Title { id: string; name: string; cost: number }

export const TITLES: Title[] = [
  { id: "t-sprout", name: "새싹 교주", cost: 0 },
  { id: "t-cheek", name: "볼따구 수집가", cost: 30 },
  { id: "t-night", name: "밤샘 수련생", cost: 60 },
  { id: "t-oops", name: "오답노트의 달인", cost: 100 },
  { id: "t-focus", name: "집중력 괴물", cost: 150 },
  { id: "t-elias", name: "엘리아스의 지배자", cost: 300 },
];

export const PULL_COST = 100;
export const PULL10_COST = 900;
const PITY = 50;
const DUP_CRAYON: Record<Rarity, number> = { 1: 5, 2: 15, 3: 50 };

export const expToNext = (level: number) => 100 + (level - 1) * 50;
export const todayKey = () => new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD
const uid = () => Math.random().toString(36).slice(2, 10);

export interface PullResult { character: Character; isNew: boolean; crayon: number }

interface Data {
  nickname: string;
  level: number;
  exp: number;
  elif: number;
  crayon: number;
  owned: Record<string, number>;
  leaderId: string;
  titles: string[];
  equippedTitle: string;
  exams: Exam[];
  subjects: Subject[];
  studyLog: Record<string, Record<string, number>>; // 날짜 → 과목 → 분
  timer: TimerState | null;
  bossIndex: number;
  bossDamage: number;
  battleLogs: BattleLog[];
  pity: number;
  stats: { totalPulls: number; bossesDefeated: number; solved: number; correct: number; focusMin: number };
}

interface Actions {
  gainExp: (amount: number) => number; // 오른 레벨 수
  setNickname: (name: string) => void;
  setLeader: (id: string) => void;
  addExam: (name: string, date: string) => void;
  removeExam: (id: string) => void;
  addSubject: (name: string, emoji: string, goalMin: number) => void;
  updateSubject: (id: string, patch: Partial<Subject>) => void;
  removeSubject: (id: string) => void;
  startTimer: (subjectId: string, mode: "focus" | "break", minutes: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  cancelTimer: () => void;
  addDistraction: () => void;
  completeTimer: () => { mode: "focus" | "break"; minutes: number; elif: number; exp: number; levels: number } | null;
  logBattle: (subjectId: string, book: string, solved: number, correct: number) => {
    damage: number; wrong: number; elif: number; exp: number; levels: number;
    defeated: null | { name: string; elif: number; exp: number };
  };
  pull: (count: 1 | 10) => PullResult[] | null;
  buyTitle: (id: string) => boolean;
  equipTitle: (id: string) => void;
  importSave: (data: Partial<Data>) => void;
  resetAll: () => void;
}

const initial: Data = {
  nickname: "교주",
  level: 1,
  exp: 0,
  elif: 300,
  crayon: 0,
  owned: { erpin: 1 },
  leaderId: "erpin",
  titles: ["t-sprout"],
  equippedTitle: "t-sprout",
  exams: [],
  subjects: [
    { id: "kor", name: "국어", emoji: "📖", goalMin: 60 },
    { id: "eng", name: "영어", emoji: "🔤", goalMin: 60 },
    { id: "math", name: "수학", emoji: "📐", goalMin: 90 },
    { id: "sci", name: "과학", emoji: "🧪", goalMin: 60 },
  ],
  studyLog: {},
  timer: null,
  bossIndex: 0,
  bossDamage: 0,
  battleLogs: [],
  pity: 0,
  stats: { totalPulls: 0, bossesDefeated: 0, solved: 0, correct: 0, focusMin: 0 },
};

function rollRarity(pity: number, guaranteeTwo: boolean): Rarity {
  if (pity + 1 >= PITY) return 3;
  const r = Math.random();
  if (r < 0.03) return 3;
  if (r < 0.21 || guaranteeTwo) return 2;
  return 1;
}

export const useGame = create<Data & Actions>()(
  persist(
    (set, get) => ({
      ...initial,

      gainExp: (amount) => {
        let { level, exp } = get();
        exp += amount;
        let levels = 0;
        while (exp >= expToNext(level)) {
          exp -= expToNext(level);
          level += 1;
          levels += 1;
        }
        set({ level, exp });
        return levels;
      },

      setNickname: (nickname) => set({ nickname: nickname.slice(0, 12) || "교주" }),
      setLeader: (leaderId) => get().owned[leaderId] && set({ leaderId }),

      addExam: (name, date) =>
        set((s) => ({ exams: [...s.exams, { id: uid(), name, date }].sort((a, b) => a.date.localeCompare(b.date)) })),
      removeExam: (id) => set((s) => ({ exams: s.exams.filter((e) => e.id !== id) })),

      addSubject: (name, emoji, goalMin) =>
        set((s) => ({ subjects: [...s.subjects, { id: uid(), name, emoji, goalMin }] })),
      updateSubject: (id, patch) =>
        set((s) => ({ subjects: s.subjects.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      removeSubject: (id) => set((s) => ({ subjects: s.subjects.filter((x) => x.id !== id) })),

      startTimer: (subjectId, mode, minutes) =>
        set({
          timer: {
            subjectId, mode, durationSec: Math.round(minutes * 60),
            endAt: Date.now() + minutes * 60_000, pausedRemaining: null, distractions: 0,
          },
        }),
      pauseTimer: () => {
        const t = get().timer;
        if (!t?.endAt) return;
        set({ timer: { ...t, endAt: null, pausedRemaining: Math.max(0, (t.endAt - Date.now()) / 1000) } });
      },
      resumeTimer: () => {
        const t = get().timer;
        if (!t || t.pausedRemaining == null) return;
        set({ timer: { ...t, endAt: Date.now() + t.pausedRemaining * 1000, pausedRemaining: null } });
      },
      cancelTimer: () => set({ timer: null }),
      addDistraction: () => {
        const t = get().timer;
        if (t) set({ timer: { ...t, distractions: t.distractions + 1 } });
      },

      completeTimer: () => {
        const t = get().timer;
        if (!t) return null;
        const minutes = Math.round(t.durationSec / 60);
        set({ timer: null });
        if (t.mode === "break") return { mode: "break", minutes, elif: 0, exp: 0, levels: 0 };

        // 딴짓 1회마다 보상 10% 감소 (최대 50%)
        const penalty = Math.min(0.5, t.distractions * 0.1);
        const elif = Math.round(minutes * 2 * (1 - penalty));
        const exp = Math.round(minutes * 2 * (1 - penalty));
        const day = todayKey();
        set((s) => ({
          elif: s.elif + elif,
          studyLog: {
            ...s.studyLog,
            [day]: { ...s.studyLog[day], [t.subjectId]: (s.studyLog[day]?.[t.subjectId] ?? 0) + minutes },
          },
          stats: { ...s.stats, focusMin: s.stats.focusMin + minutes },
        }));
        const levels = get().gainExp(exp);
        return { mode: "focus", minutes, elif, exp, levels };
      },

      logBattle: (subjectId, book, solved, correct) => {
        correct = Math.max(0, Math.min(correct, solved));
        const wrong = solved - correct;
        const damage = correct * DAMAGE_PER_CORRECT;
        let elif = solved + correct;
        let exp = solved + correct;
        let defeated = null as null | { name: string; elif: number; exp: number };

        let { bossIndex, bossDamage } = get();
        bossDamage += damage;
        let defeatedCount = 0;
        // 남은 데미지는 다음 보스로 넘어간다
        while (bossDamage >= bossFor(bossIndex).hp) {
          const b = bossFor(bossIndex);
          bossDamage -= b.hp;
          bossIndex += 1;
          defeatedCount += 1;
          elif += b.reward.elif;
          exp += b.reward.exp;
          defeated = { name: b.name, elif: (defeated?.elif ?? 0) + b.reward.elif, exp: (defeated?.exp ?? 0) + b.reward.exp };
        }

        set((s) => ({
          bossIndex, bossDamage,
          elif: s.elif + elif,
          battleLogs: [{ id: uid(), at: Date.now(), subjectId, book, solved, correct, damage }, ...s.battleLogs].slice(0, 100),
          stats: {
            ...s.stats,
            solved: s.stats.solved + solved,
            correct: s.stats.correct + correct,
            bossesDefeated: s.stats.bossesDefeated + defeatedCount,
          },
        }));
        const levels = get().gainExp(exp);
        return { damage, wrong, elif, exp, levels, defeated };
      },

      pull: (count) => {
        const cost = count === 10 ? PULL10_COST : PULL_COST;
        const s = get();
        if (s.elif < cost) return null;
        let pity = s.pity;
        const owned = { ...s.owned };
        let crayon = 0;
        const results: PullResult[] = [];
        for (let i = 0; i < count; i++) {
          const guaranteeTwo = count === 10 && i === 9 && results.every((r) => r.character.rarity === 1);
          const rarity = rollRarity(pity, guaranteeTwo);
          pity = rarity === 3 ? 0 : pity + 1;
          const pool = CHARACTERS.filter((c) => c.rarity === rarity);
          const character = pool[Math.floor(Math.random() * pool.length)];
          const isNew = !owned[character.id];
          const gain = isNew ? 0 : DUP_CRAYON[rarity];
          owned[character.id] = (owned[character.id] ?? 0) + 1;
          crayon += gain;
          results.push({ character, isNew, crayon: gain });
        }
        set({
          elif: s.elif - cost, crayon: s.crayon + crayon, owned, pity,
          stats: { ...s.stats, totalPulls: s.stats.totalPulls + count },
        });
        return results;
      },

      buyTitle: (id) => {
        const t = TITLES.find((x) => x.id === id);
        const s = get();
        if (!t || s.titles.includes(id) || s.crayon < t.cost) return false;
        set({ crayon: s.crayon - t.cost, titles: [...s.titles, id], equippedTitle: id });
        return true;
      },
      equipTitle: (id) => get().titles.includes(id) && set({ equippedTitle: id }),

      importSave: (data) => set({ ...initial, ...data }),
      resetAll: () => set({ ...initial }),
    }),
    {
      name: "trickcal-study-save",
      version: 1,
      partialize: (s) => {
        // 액션 함수는 저장하지 않는다
        const data: Partial<Data> = {};
        for (const k of Object.keys(initial) as (keyof Data)[]) (data as Record<string, unknown>)[k] = s[k];
        return data as Data;
      },
    },
  ),
);

export const selectSave = (s: Data): Data => {
  const data: Partial<Data> = {};
  for (const k of Object.keys(initial) as (keyof Data)[]) (data as Record<string, unknown>)[k] = s[k];
  return data as Data;
};

export const leaderOf = (s: Data) => CHARACTER_MAP[s.leaderId] ?? CHARACTERS[0];
