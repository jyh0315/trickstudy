/* =========================================================
   공부 잔디 — 최근 1년 날짜별 집중 시간을 GitHub 잔디처럼
   ========================================================= */
(() => {
"use strict";
const TS = window.TS;
const $ = (id) => document.getElementById(id);
const WEEKS = 53;

function level(min, goal) {
  if (!min) return 0;
  if (min < goal * 0.25) return 1;
  if (min < goal * 0.5) return 2;
  if (min < goal) return 3;
  return 4;
}
function render() {
  const el = $("grass-card");
  if (!el) return;
  const s = TS.state, days = s.stats.days, goal = s.settings.goal;
  // 시작: 52주 전 월요일
  const start = new Date(TS.weekKey() + "T00:00");
  start.setDate(start.getDate() - (WEEKS - 1) * 7);
  const todayKey = TS.today();
  let cols = "", months = "", lastMonth = -1, lastCol = -9, studied = 0, best = 0, run = 0, total = 0;
  for (let w = 0; w < WEEKS; w++) {
    let cells = "";
    for (let d = 0; d < 7; d++) {
      const day = new Date(start); day.setDate(start.getDate() + w * 7 + d);
      const k = TS.dateKey(day);
      if (k > todayKey) { cells += '<i class="g future"></i>'; continue; }
      const m = days[k] || 0;
      total += m;
      if (m) { studied++; run++; best = Math.max(best, run); } else run = 0;
      cells += `<i class="g l${level(m, goal)} ${k === todayKey ? "today" : ""}" title="${k} · ${m}분"></i>`;
      if (d === 0 && day.getMonth() !== lastMonth) {
        lastMonth = day.getMonth();
        if (w - lastCol >= 3) { months += `<span style="grid-column:${w + 1}">${lastMonth + 1}월</span>`; lastCol = w; }
      }
    }
    cols += `<div class="gcol">${cells}</div>`;
  }
  el.innerHTML = `<h3 class="card-title">🌱 공부 잔디 <span class="grass-sum">최근 1년 <b>${studied}일</b> 공부 · 최장 연속 <b>${best}일</b> · 총 <b>${Math.floor(total / 60)}시간</b></span></h3>
    <div class="grass-scroll"><div class="grass">
      <div class="gmonths" style="grid-template-columns:repeat(${WEEKS}, 1fr)">${months}</div>
      <div class="gdays"><span>월</span><span></span><span>수</span><span></span><span>금</span><span></span><span>일</span></div>
      <div class="gcols">${cols}</div>
    </div></div>
    <div class="grass-legend">적게 <i class="g l0"></i><i class="g l1"></i><i class="g l2"></i><i class="g l3"></i><i class="g l4"></i> 많이 <small>(진한 초록 = 하루 목표 ${goal}분 달성)</small></div>`;
  const sc = el.querySelector(".grass-scroll");
  sc.scrollLeft = sc.scrollWidth;
}
TS.on("stats", () => setTimeout(render, 0));
})();
