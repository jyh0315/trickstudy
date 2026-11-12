/* =========================================================
   🏆 업적 추가 — 누적 50시간 이후에도 계속 목표가 생기도록
   after: 앞 단계 업적을 받아야 다음 단계가 보임 (목록이 너무 길어지지 않게)
   ========================================================= */
(() => {
"use strict";
if (typeof ACHIEVEMENTS === "undefined") return;
const S = (s) => s.stats || {};
const days = (s) => Object.values(S(s).days || {}).filter((m) => m > 0).length;
const bestDay = (s) => Math.max(0, ...Object.values(S(s).days || {}));
const ownN = (s) => Object.keys(s.owned || {}).length;
const r3N = (s) => (typeof SADO !== "undefined" ? SADO.filter((c) => c.rarity === 3 && s.owned[c.id]).length : 0);
const AFF = (typeof AFF_LEVELS !== "undefined") ? AFF_LEVELS : [0, 30, 80, 160, 280, 450, 680, 980, 1360, 1830];
const affLv = (p) => { let lv = 1; AFF.forEach((n, i) => { if (p >= n) lv = i + 1; }); return lv; };
const affCount = (s, lv) => Object.values(s.aff || {}).filter((p) => affLv(p) >= lv).length;
const affBest = (s) => Math.max(1, ...Object.values(s.aff || {}).map(affLv));
const seenN = (s) => ((s.story && s.story.seen) || []).length;
const bossKills = (s) => (s.bossHist || []).filter((h) => h.dmg >= h.max).length + (s.boss && s.boss.dmg >= s.boss.max ? 1 : 0);
const petN = (s) => Object.keys((s.pets && s.pets.owned) || {}).length;
const subjMin = (s) => { const v = Object.values(S(s).subjects || {}); return v.length >= 4 ? Math.min(...v.sort((a, b) => b - a).slice(0, 4)) : 0; };

const add = (list) => list.forEach((a) => { if (!ACHIEVEMENTS.some((x) => x.id === a.id)) ACHIEVEMENTS.push(a); });
// 단계형: [id, 제목, goal, elif] … 앞 단계 id 를 after 로 자동 연결
const chain = (first, check, steps) => { let prev = first; add(steps.map(([id, title, goal, elif]) => { const a = { id, title, goal, elif, check, after: prev }; prev = id; return a; })); };

/* ⏱ 누적 집중 (기존 a_50h 다음) */
chain("a_50h", (s) => S(s).totalMin, [
  ["a_100h", "누적 집중 100시간 · 교단의 기둥", 6000, 2500],
  ["a_200h", "누적 집중 200시간 · 세계수도 감탄", 12000, 4000],
  ["a_300h", "누적 집중 300시간 · 사제장급 인내심", 18000, 5000],
  ["a_500h", "누적 집중 500시간 · 엘리아스의 전설", 30000, 8000],
  ["a_750h", "누적 집중 750시간 · 네르가 존경함", 45000, 10000],
  ["a_1000h", "누적 집중 1000시간 · 교주 그 자체", 60000, 15000],
]);
/* 🔁 집중 완주 횟수 */
chain("a_first", (s) => S(s).sessions, [
  ["a_s10", "집중 10번 완주", 10, 200],
  ["a_s50", "집중 50번 완주", 50, 500],
  ["a_s100", "집중 100번 완주 · 뽀모도로 장인", 100, 1000],
  ["a_s300", "집중 300번 완주", 300, 2000],
  ["a_s500", "집중 500번 완주", 500, 3000],
  ["a_s1000", "집중 1000번 완주 · 타이머가 닳았다", 1000, 6000],
]);
/* 🔥 연속 공부 */
chain("a_streak7", (s) => S(s).bestStreak, [
  ["a_streak14", "14일 연속 공부", 14, 1000],
  ["a_streak30", "30일 연속 공부 · 한 달 개근", 30, 2500],
  ["a_streak60", "60일 연속 공부", 60, 4000],
  ["a_streak100", "100일 연속 공부 · 백일 기념", 100, 7000],
  ["a_streak365", "365일 연속 공부 · 1년 개근", 365, 20000],
]);
/* 📅 공부한 날 (연속 아니어도 됨) */
chain(null, days, [
  ["a_d10", "공부한 날 10일", 10, 300],
  ["a_d30", "공부한 날 30일", 30, 800],
  ["a_d100", "공부한 날 100일", 100, 2500],
  ["a_d200", "공부한 날 200일", 200, 5000],
  ["a_d365", "공부한 날 365일 · 엘리아스의 1년", 365, 10000],
]);
/* 🌙 하루 최고 기록 */
chain(null, bestDay, [
  ["a_day3h", "하루 3시간 공부", 180, 300],
  ["a_day5h", "하루 5시간 공부", 300, 700],
  ["a_day8h", "하루 8시간 공부 · 정시 출근", 480, 1500],
  ["a_day10h", "하루 10시간 공부 · 루드도 인정한 근성", 600, 2500],
  ["a_day12h", "하루 12시간 공부 · 이건 좀 쉬어요", 720, 4000],
]);
/* 📚 과목 골고루 (공부한 상위 4과목이 모두 이만큼) */
chain(null, subjMin, [
  ["a_sub5h", "4과목 이상 각 5시간", 300, 800],
  ["a_sub20h", "4과목 이상 각 20시간", 1200, 2500],
  ["a_sub50h", "4과목 이상 각 50시간 · 만능 교주", 3000, 6000],
]);
/* 📝 의뢰 */
chain("a_todo50", (s) => S(s).todosDone, [
  ["a_todo100", "의뢰 100개 해결", 100, 800],
  ["a_todo300", "의뢰 300개 해결", 300, 2000],
  ["a_todo500", "의뢰 500개 해결", 500, 3500],
  ["a_todo1000", "의뢰 1000개 해결 · 해결사 교주", 1000, 7000],
]);
/* ⭐ 교주 레벨 */
chain("a_lv10", (s) => s.level, [
  ["a_lv20", "교주 레벨 20 달성", 20, 1500],
  ["a_lv30", "교주 레벨 30 달성", 30, 2500],
  ["a_lv50", "교주 레벨 50 달성", 50, 5000],
  ["a_lv75", "교주 레벨 75 달성", 75, 8000],
  ["a_lv100", "교주 레벨 100 달성 · 만렙 교주", 100, 15000],
]);
/* 🎴 모집 */
chain(null, (s) => S(s).pulls || 0, [
  ["a_pull10", "사도 모집 10회", 10, 100],
  ["a_pull100", "사도 모집 100회", 100, 800],
  ["a_pull300", "사도 모집 300회", 300, 2000],
  ["a_pull1000", "사도 모집 1000회 · 엘리프 큰손", 1000, 5000],
]);
chain("a_ssr", r3N, [
  ["a_ssr10", "★★★ 사도 10명 영입", 10, 1000],
  ["a_ssr20", "★★★ 사도 20명 영입", 20, 2500],
  ["a_ssr30", "★★★ 사도 30명 영입", 30, 4000],
]);
chain("a_c70", ownN, [
  ["a_c100", "사도 100명 영입", 100, 2500],
]);
/* 💗 호감도 */
chain(null, affBest, [
  ["a_aff3", "사도 한 명과 호감도 Lv3", 3, 200],
  ["a_aff5", "사도 한 명과 호감도 Lv5", 5, 600],
  ["a_aff8", "사도 한 명과 호감도 Lv8", 8, 1500],
  ["a_aff10", "사도 한 명과 호감도 Lv10 · 영원한 짝꿍", 10, 3000],
]);
chain(null, (s) => affCount(s, 5), [
  ["a_aff5x5", "호감도 Lv5 사도 5명", 5, 1500],
  ["a_aff5x20", "호감도 Lv5 사도 20명", 20, 4000],
  ["a_aff5x50", "호감도 Lv5 사도 50명 · 교단 인기인", 50, 8000],
]);
/* 👆 볼따구 */
chain("a_poke", (s) => S(s).pokes, [
  ["a_poke500", "볼따구 500번 찌르기", 500, 300],
  ["a_poke2000", "볼따구 2000번 찌르기 · 말랑 중독", 2000, 800],
  ["a_poke10000", "볼따구 10000번 찌르기 · 볼이 남아나질 않아", 10000, 2000],
]);
/* 📖 스토리 */
chain(null, seenN, [
  ["a_story10", "스토리 10화 감상", 10, 300],
  ["a_story50", "스토리 50화 감상", 50, 1000],
  ["a_story100", "스토리 100화 감상", 100, 2500],
  ["a_story150", "스토리 150화 감상 · 엘리아스 역사가", 150, 4000],
]);
/* ⚔ 보스 */
chain(null, bossKills, [
  ["a_boss1", "주간 보스 첫 토벌", 1, 500],
  ["a_boss5", "주간 보스 5번 토벌", 5, 1500],
  ["a_boss12", "주간 보스 12번 토벌 · 토벌대장", 12, 4000],
]);
/* 🐾 펫 */
chain(null, petN, [
  ["a_pet1", "첫 펫 입양", 1, 200],
  ["a_pet5", "펫 5마리 입양", 5, 600],
  ["a_pet10", "펫 10마리 입양 · 동물원 교단", 10, 1500],
]);
/* 🔨 꿀밤 */
chain(null, (s) => (s.knockGame && s.knockGame.best) || 0, [
  ["a_knock20", "꿀밤 타임 20점", 20, 200],
  ["a_knock40", "꿀밤 타임 40점", 40, 600],
  ["a_knock60", "꿀밤 타임 60점 · 빠따가 약이다", 60, 1500],
]);
})();
