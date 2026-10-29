/* =========================================================
   ⚖️ 과목 밸런스 — 한 과목만 파는 걸 막는 장치들
   1) 과목 피로도: 같은 과목을 하루 90분 넘게 하면 넘은 시간의 보상은 절반
   2) 보스 약점: 매주 보스는 "지난주 제일 적게 한 과목"에 2배 데미지
   3) 골고루 임무: 일일 3과목 각 20분 / 주간 4과목 각 60분 / 밸런스 80점 업적
   4) 밸런스 점수(0~100) · 추천 과목 · 편식하면 사도가 잔소리
   공부 시간 기록은 실제 시간 그대로, 보상(엘리프·EXP·보스 데미지)만 조정
   ========================================================= */
const BALANCE = {
  fatigueMin: 90,     // 같은 과목 하루 이 시간까지는 보상 100%
  fatigueRate: 0.5,   // 넘은 시간의 보상 비율
  weakMult: 2,        // 보스 약점 과목 데미지 배율
  dailyEach: 20,      // 일일 임무: 과목당 최소 분
  weeklyEach: 60,     // 주간 임무: 과목당 최소 분
  exclude: ["기타"],  // 밸런스 계산에서 빼는 과목
};

DAILY_QUESTS.push({ id: "d_bal", title: "3과목 이상 각 20분씩 공부", stat: "subjBal", goal: 3, elif: 80, exp: 30 });
WEEKLY_QUESTS.push({ id: "w_bal", title: "4과목 이상 각 60분씩 공부", stat: "subjBal", goal: 4, elif: 350, exp: 150 });
ACHIEVEMENTS.push({ id: "a_bal", title: "주간 과목 밸런스 80점 달성", goal: 80, elif: 500, check: (s) => s.stats.bestBalance || 0 });

(() => {
"use strict";
const TS = window.TS;
const $ = (id) => document.getElementById(id);
const S = () => TS.state;
const esc = TS.esc;

const subjects = () => S().settings.subjects.filter((x) => !BALANCE.exclude.includes(x));
function subjDays() { const st = S().stats; if (!st.subjDays) st.subjDays = {}; return st.subjDays; }
const todayOf = (subj) => (subjDays()[TS.today()] || {})[subj] || 0;
function rangeMin(from, to) { // from <= 날짜 < to
  const out = {};
  for (const [d, m] of Object.entries(subjDays())) {
    if (d < from || (to && d >= to)) continue;
    for (const [k, v] of Object.entries(m)) out[k] = (out[k] || 0) + v;
  }
  return out;
}
const weekMin = () => rangeMin(TS.weekKey());
function lastWeekMin() {
  const d = new Date(TS.weekKey() + "T00:00"); d.setDate(d.getDate() - 7);
  return rangeMin(TS.dateKey(d), TS.weekKey());
}

/* 밸런스 점수: 과목별 시간 분포의 고른 정도 (정규화 엔트로피) */
function score(mins = weekMin()) {
  const subs = subjects();
  const vals = subs.map((x) => mins[x] || 0), total = vals.reduce((a, b) => a + b, 0);
  if (subs.length < 2 || total < 30) return null;
  const n = Math.min(subs.length, 5);
  let h = 0;
  for (const v of vals) if (v > 0) { const p = v / total; h -= p * Math.log(p); }
  return Math.min(100, Math.round((h / Math.log(n)) * 100));
}
const scoreLabel = (sc) => sc == null ? "측정 중" : sc >= 80 ? "골고루! 🌈" : sc >= 55 ? "그럭저럭 🙂" : sc >= 30 ? "살짝 편식 😐" : "편식 중 😵";
function recommend() {
  const m = weekMin(), subs = subjects();
  if (!subs.length) return null;
  return subs.slice().sort((a, b) => (m[a] || 0) - (m[b] || 0))[0];
}
function pickWeak() {
  const subs = subjects();
  if (!subs.length) return null;
  const m = lastWeekMin();
  const min = Math.min(...subs.map((x) => m[x] || 0));
  const cands = subs.filter((x) => (m[x] || 0) === min);
  const wi = Math.floor((new Date(TS.weekKey() + "T00:00") - new Date("2024-01-01T00:00")) / (7 * 864e5));
  return cands[((wi % cands.length) + cands.length) % cands.length];
}

/* ───── 보상 조정: 과목 피로도 ───── */
TS.rewardHooks.push((rw) => {
  const prior = todayOf(rw.subject), lim = BALANCE.fatigueMin;
  const over = Math.max(0, prior + rw.min - lim) - Math.max(0, prior - lim);
  if (over <= 0) return;
  rw.eff -= over * (1 - BALANCE.fatigueRate);
  rw.notes.push(`😵 ${esc(rw.subject)} 피로 (${over}분 보상 절반)`);
});

/* ───── 기록 ───── */
function recount() {
  const s = S(), td = subjDays()[TS.today()] || {}, wk = weekMin();
  s.daily.subjBal = subjects().filter((x) => (td[x] || 0) >= BALANCE.dailyEach).length;
  s.weekly.subjBal = subjects().filter((x) => (wk[x] || 0) >= BALANCE.weeklyEach).length;
  const total = Object.values(wk).reduce((a, b) => a + b, 0), sc = score(wk);
  if (sc != null && total >= 120) s.stats.bestBalance = Math.max(s.stats.bestBalance || 0, sc);
}
TS.on("focus", ({ min, subject }) => {
  const sd = subjDays(), t = TS.today();
  sd[t] = sd[t] || {};
  sd[t][subject] = (sd[t][subject] || 0) + min;
  // 오래된 기록 정리 (120일)
  const cut = TS.daysAgo(120);
  for (const d of Object.keys(sd)) if (d < cut) delete sd[d];
  recount();
  TS.save();
});
/* v1.3 이전 기록 채우기 (한 번만): 과목별 누적에는 있는데 날짜별 기록에 없는 시간을
   실제로 공부한 날짜(stats.days)에 오래된 날부터 채워 넣음. 과목 합계는 정확, 날짜 배분은 추정 */
function backfill() {
  const st = S().stats;
  if (st.subjMigrated) return;
  st.subjMigrated = true;
  const sd = subjDays(), recorded = {};
  for (const m of Object.values(sd)) for (const [k, v] of Object.entries(m)) recorded[k] = (recorded[k] || 0) + v;
  const pool = Object.entries(st.subjects || {}).map(([k, v]) => [k, v - (recorded[k] || 0)]).filter(([, v]) => v > 0);
  for (const d of Object.keys(st.days).sort()) {
    let gap = st.days[d] - Object.values(sd[d] || {}).reduce((a, b) => a + b, 0);
    while (gap > 0 && pool.length) {
      const take = Math.min(gap, pool[0][1]);
      sd[d] = sd[d] || {};
      sd[d][pool[0][0]] = (sd[d][pool[0][0]] || 0) + take;
      gap -= take; pool[0][1] -= take;
      if (pool[0][1] <= 0) pool.shift();
    }
  }
}
/* 과목 목록 정리: "한국사. 영어" 처럼 마침표 등으로 적은 것도 나눔 */
function normalizeSubjects() {
  const s = S().settings, fixed = [...new Set(s.subjects.flatMap((x) => x.split(/[,，.。、/·]/)).map((x) => x.trim()).filter(Boolean))];
  if (fixed.join("|") !== s.subjects.join("|")) {
    s.subjects = fixed.length ? fixed : SUBJECTS_DEFAULT.slice();
    if (!s.subjects.includes(S().timer.subject)) S().timer.subject = s.subjects[0];
  }
}
TS.on("boot", () => { normalizeSubjects(); backfill(); recount(); TS.save(); });

/* ───── 화면 ───── */
function balanceHTML(compact) {
  const m = weekMin(), subs = subjects(), sc = score(m), total = subs.reduce((a, x) => a + (m[x] || 0), 0);
  const max = Math.max(1, ...subs.map((x) => m[x] || 0));
  const weak = window.Boss ? window.Boss.ensure().weak : null;
  return `<div class="bal-head">
      <div class="bal-score ${sc == null ? "" : sc >= 80 ? "good" : sc >= 55 ? "ok" : "bad"}"><b>${sc == null ? "-" : sc}</b><small>점</small></div>
      <div><b class="bal-label">이번 주 과목 밸런스: ${scoreLabel(sc)}</b>
      <p class="hint" style="margin:2px 0 0">${sc == null ? "이번 주 30분 이상 공부하면 점수가 나와요." : `한 과목을 하루 ${BALANCE.fatigueMin}분 넘게 하면 넘은 시간 보상은 절반이에요.`}</p></div>
    </div>
    ${compact ? "" : `<div class="bal-bars">${subs.map((x) => {
      const v = m[x] || 0, td = todayOf(x);
      return `<div class="bal-row ${x === weak ? "weak" : ""}"><span>${esc(x)}${x === weak ? " ⚡" : ""}</span>
        <span class="bar"><i style="width:${(v / max) * 100}%"></i></span>
        <b>${v}분 <small>${total ? Math.round((v / total) * 100) : 0}%</small></b>
        <em class="${td >= BALANCE.fatigueMin ? "tired" : ""}">오늘 ${td}/${BALANCE.fatigueMin}</em></div>`;
    }).join("")}</div>
    <p class="hint">⚡ = 이번 주 보스 약점 과목 (데미지 ${BALANCE.weakMult}배) · “오늘 n/${BALANCE.fatigueMin}” = 오늘 그 과목 피로도</p>`}`;
}
function renderTimerStrip() {
  const el = $("balance-strip");
  if (!el) return;
  const rec = recommend(), weak = window.Boss ? window.Boss.ensure().weak : null;
  const cur = TS.timer.t.subject, td = todayOf(cur), m = weekMin();
  const tired = td >= BALANCE.fatigueMin;
  el.innerHTML = `
    ${rec ? `<span class="bal-chip rec">⭐ 추천 <b>${esc(rec)}</b> <small>이번 주 ${m[rec] || 0}분</small>${rec !== cur && !TS.timer.t.running ? ` <button class="link" data-subj="${esc(rec)}">이걸로</button>` : ""}</span>` : ""}
    ${weak ? `<span class="bal-chip weak">👹 보스 약점 <b>${esc(weak)}</b> <small>데미지 ×${BALANCE.weakMult}</small>${weak !== cur && weak !== rec && !TS.timer.t.running ? ` <button class="link" data-subj="${esc(weak)}">이걸로</button>` : ""}</span>` : ""}
    <span class="bal-chip ${tired ? "tired" : ""}">${tired ? "😵" : "🔋"} 오늘 ${esc(cur)} <b>${td}</b>/${BALANCE.fatigueMin}분${tired ? " · 보상 절반!" : ""}</span>`;
  // 과목 선택지에 표시
  document.querySelectorAll("#t-subject option").forEach((o) => {
    const x = o.value, marks = [];
    o.setAttribute("value", x); // 표시 글자를 바꿔도 값은 과목 이름 그대로
    if (x === rec) marks.push("⭐");
    if (x === weak) marks.push("⚡");
    if (todayOf(x) >= BALANCE.fatigueMin) marks.push("😵");
    o.textContent = x + (marks.length ? " " + marks.join("") : "");
  });
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-subj]");
  if (!b) return;
  TS.timer.t.subject = b.dataset.subj; TS.save(); TS.sfx("click"); TS.refresh();
});

TS.on("refresh", (v) => {
  if (v === "timer") renderTimerStrip();
  const el = $("brief-bal");
  if (el) { const sc = score(); el.textContent = sc == null ? "측정 중" : `${sc}점`; }
});
TS.on("stats", () => { const el = $("balance-card"); if (el) el.innerHTML = `<h3 class="card-title">⚖️ 과목 밸런스</h3>${balanceHTML(false)}`; });

/* 편식하면 잔소리 */
TS.chatterHooks.push(() => {
  const m = weekMin(), subs = subjects(), total = subs.reduce((a, x) => a + (m[x] || 0), 0);
  const cur = TS.timer.t.subject;
  if (TS.timer.t.running && todayOf(cur) >= BALANCE.fatigueMin) return `교주님, 오늘 ${cur}만 ${todayOf(cur)}분째예요… 머리가 지쳤을 거예요. 다른 과목도 해봐요!`;
  if (total < 90) return null;
  const top = subs.slice().sort((a, b) => (m[b] || 0) - (m[a] || 0))[0], pct = Math.round(((m[top] || 0) / total) * 100);
  if (pct >= 60) return `이번 주 공부의 ${pct}%가 ${top}이에요! ${recommend()}도 좀 챙겨요~`;
  return null;
});

window.Balance = { score, recommend, pickWeak, weekMin, todayOf, BALANCE };
})();
