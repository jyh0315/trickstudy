/* =========================================================
   주간 보스 레이드
   - 매주 월요일 새 보스 등장, HP = 하루 목표 시간 × 5일 × 10
   - 집중 1분 = 10 데미지 (대표 사도 호감도 보너스 적용)
   - 의뢰 해결: 쉬움 50 / 보통 100 / 어려움 200
   - HP 50% 상자, 격파 보상
   ========================================================= */
const BOSSES = [
  { id: "tig-hero",       title: "더 피드스탠스",      taunt: ["으하하! 공부 따위로 이 몸을 쓰러뜨릴 수 있을 것 같으냐!", "교주여, 그 정도 집중력으론 간지럽지도 않다!"] },
  { id: "maestromk2",     title: "폭주 모드",          taunt: ["삐빅. 교주의 집중력: 측정 불가(너무 낮음).", "삐-. 공부 방해 프로토콜 가동."] },
  { id: "ifrit",          title: "숙제를 태우는 불꽃",  taunt: ["네 문제집을 전부 태워주마!", "활활! 집중력도 같이 타버려라!"] },
  { id: "bigwood",        title: "졸음의 거목",        taunt: ["쿠우우… 너도… 같이… 자자…", "공부는… 내일 해도… 되지 않을까…"] },
  { id: "rim-chaos",      title: "혼돈의 마녀",        taunt: ["후후, 오늘은 유튜브 딱 한 편만 보는 건 어때?", "혼돈이야말로 진정한 공부법이지!"] },
  { id: "ner-rage",       title: "분노 폭발",          taunt: ["왜 아직도 공부를 안 끝냈어?!!", "으아아! 다 부숴버릴 거야!"] },
  { id: "shaydi-twisted", title: "뒤틀린 그림자",      taunt: ["…집중 같은 건 그림자에 삼켜질 거야.", "…넌 결국 핸드폰을 보게 될걸."] },
  { id: "makasha",        title: "미루기의 화신",      taunt: ["5분만 더 쉬어~ 5분만~", "그거 내일의 교주가 할 거야~"] },
];
const BOSS_HURT = ["크윽…!", "아, 아프잖아!", "이, 이럴 수가…!", "교주 녀석… 제법이군!", "으아악! 집중력이 너무 강해!"];
const BOSS_DOWN = ["으아아… 이번 주는 내가 졌다…!", "다음 주엔… 반드시…!"];
const TODO_DMG = { easy: 50, normal: 100, hard: 200 };

(() => {
"use strict";
const TS = window.TS;
const $ = (id) => document.getElementById(id);
const S = () => TS.state;
const fmtN = (n) => Math.round(n).toLocaleString();

const weekIndex = () => Math.floor((new Date(TS.weekKey() + "T00:00") - new Date("2024-01-01T00:00")) / (7 * 864e5));
function ensure() {
  const s = S(), wk = TS.weekKey();
  if (s.boss && s.boss.week === wk) {
    if (s.boss.weak === undefined && window.Balance) { s.boss.weak = window.Balance.pickWeak(); TS.save(); }
    return s.boss;
  }
  if (s.boss) {
    s.bossHist = [{ week: s.boss.week, id: s.boss.id, dmg: s.boss.dmg, max: s.boss.max }, ...(s.bossHist || [])].slice(0, 12);
  }
  const b = BOSSES[((weekIndex() % BOSSES.length) + BOSSES.length) % BOSSES.length];
  const max = Math.max(3000, Math.round((s.settings.goal * 5 * 10) / 100) * 100);
  s.boss = { week: wk, id: b.id, max, dmg: 0, hits: [], chest: [], seen: false, weak: window.Balance ? window.Balance.pickWeak() : null };
  TS.save();
  return s.boss;
}
const info = (b) => BOSSES.find((x) => x.id === b.id) || BOSSES[0];
const hpLeft = (b) => Math.max(0, b.max - b.dmg);
function phase(b = ensure()) {
  const r = hpLeft(b) / b.max;
  return r > 0.66 ? 1 : r > 0.33 ? 2 : 3;
}

function deal(n, src) {
  const b = ensure();
  n = Math.round(n);
  if (n <= 0) return 0;
  const beforePhase = phase(b), wasAlive = b.dmg < b.max, wasHalf = b.dmg >= b.max / 2;
  b.dmg += n;
  b.hits.unshift({ t: Date.now(), src, n });
  b.hits = b.hits.slice(0, 30);
  // 50% 상자
  if (!wasHalf && b.dmg >= b.max / 2 && !b.chest.includes(50)) {
    b.chest.push(50);
    TS.addElif(300);
    const it = TS.randomItem("R"); if (it) TS.addItem(it.id);
    TS.toast(`📦 보스 HP 50% 돌파! 엘리프 +300${it ? ` · ${it.name}` : ""}`);
  }
  // 격파
  if (wasAlive && b.dmg >= b.max) {
    b.chest.push(100);
    TS.addElif(1000); TS.addCandy(60);
    const drop = TS.randomItem("SR", S().partner); if (drop) TS.addItem(drop.id);
    setTimeout(() => {
      TS.sfx("r3"); TS.confetti(120);
      const c = TS.SADO_MAP[b.id];
      TS.modal(`<h2>👹 보스 격파!</h2>
        <img class="modal-emote boss-dead" src="${TS.chibiSrc(c)}" alt="">
        <p><b>${TS.esc(c.name)}</b>: “${TS.esc(TS.rand(BOSS_DOWN))}”</p>
        <div class="reward-row"><span class="reward-chip"><i class="ic-elif"></i>+1000</span><span class="reward-chip"><i class="ic-candy"></i>+60</span><span class="reward-chip">⭐ EXP +300</span>${drop ? TS.itemChip(drop.id) : ""}</div>
        <p class="hint">남은 기간에 주는 데미지도 랭킹 ‘보스 딜’에 그대로 쌓여요!</p>
        <div class="modal-actions"><button class="btn yellow" data-close>승리!</button></div>`);
      TS.addExp(300);
      TS.save(); TS.refresh();
    }, 0);
  }
  if (phase(b) !== beforePhase) TS.emit("boss-phase", phase(b));
  TS.save();
  if (TS.view === "boss") { render(); hitFx(n); }
  return n;
}

TS.on("focus", ({ min, eff, subject, partner, extras }) => {
  const bonus = window.Affection ? window.Affection.bonusPct(partner) : 0;
  const weak = ensure().weak && subject === ensure().weak;
  const mult = weak ? (window.Balance ? window.Balance.BALANCE.weakMult : 2) : 1;
  const n = deal((eff == null ? min : eff) * 10 * (1 + bonus / 100) * mult, `${subject} ${min}분${weak ? " ⚡약점" : ""}`);
  if (n) extras.push(`👹 -${fmtN(n)}${weak ? " ⚡약점!" : ""}`);
});
TS.on("todo", (x) => {
  const n = deal(TODO_DMG[x.diff] || 50, "의뢰");
  if (n) TS.toast(`👹 보스에게 ${n} 데미지!`);
});
TS.on("view", (v) => { if (v === "boss") { ensure().seen = true; TS.save(); } });

/* ───── 화면 ───── */
function hitFx(n) {
  const img = document.querySelector(".boss-img");
  const layer = document.querySelector(".dmg-layer");
  if (!img || !layer) return;
  img.classList.remove("hit"); void img.offsetWidth; img.classList.add("hit");
  const f = document.createElement("span");
  f.className = "dmg-float"; f.textContent = "-" + fmtN(n);
  f.style.left = 30 + Math.random() * 40 + "%";
  layer.appendChild(f);
  setTimeout(() => f.remove(), 1400);
  const say = document.querySelector(".boss-bubble");
  if (say) say.textContent = TS.rand(BOSS_HURT);
}
function render() {
  const b = ensure(), bi = info(b), c = TS.SADO_MAP[b.id], ph = phase(b);
  const left = hpLeft(b), dead = left === 0;
  const now = new Date(), nextMon = new Date(TS.weekKey() + "T00:00"); nextMon.setDate(nextMon.getDate() + 7);
  const dLeft = Math.ceil((nextMon - now) / 864e5);
  const bonus = window.Affection ? window.Affection.bonusPct(S().partner) : 0;
  $("view-boss").innerHTML = `
    <div class="card boss-card phase-${dead ? "dead" : ph}">
      <div class="boss-top"><span class="tag" style="background:var(--ink);color:var(--cream)">이번 주 보스</span><span>⏳ ${dLeft}일 뒤 새 보스</span></div>
      <div class="boss-arena">
        <div class="boss-bubble">${TS.esc(dead ? TS.rand(BOSS_DOWN) : TS.rand(bi.taunt))}</div>
        <img class="boss-img" src="${TS.chibiSrc(c)}" alt="">
        <div class="dmg-layer"></div>
      </div>
      <h2 class="boss-name">${TS.esc(c.name)} <small>${TS.esc(bi.title)}</small></h2>
      <div class="boss-hp">
        <span class="bar hp"><i style="width:${(left / b.max) * 100}%"></i></span>
        <b>${dead ? "격파 완료!" : `HP ${fmtN(left)} / ${fmtN(b.max)}`}</b>
      </div>
      <div class="phase-row">${[1, 2, 3].map((p) => `<span class="${!dead && p === ph ? "on" : ""} ${p < ph || dead ? "past" : ""}">PHASE ${p}</span>`).join("")}</div>
      <div class="boss-chests">
        <div class="${b.chest.includes(50) ? "open" : ""}">📦 HP 50%<small>${b.chest.includes(50) ? "받음 ✔" : "엘리프 300 · R 아티팩트"}</small></div>
        <div class="${b.chest.includes(100) ? "open" : ""}">🏆 격파<small>${b.chest.includes(100) ? "받음 ✔" : "엘리프 1000 · 별사탕 60 · SR 아티팩트"}</small></div>
      </div>
      ${b.weak ? `<div class="boss-weak">⚡ 약점 과목: <b>${TS.esc(b.weak)}</b> — 이 과목으로 집중하면 데미지 ${window.Balance ? window.Balance.BALANCE.weakMult : 2}배! <small>(지난주에 제일 적게 공부한 과목)</small></div>` : ""}
      <p class="hint">⚔️ 집중 1분 = 10 데미지${bonus ? ` (대표 사도 호감도 보너스 <b>+${bonus}%</b>)` : ""} · 의뢰 해결 쉬움 50 / 보통 100 / 어려움 200<br>
      누적 데미지 <b>${fmtN(b.dmg)}</b>${b.dmg > b.max ? ` (초과 ${fmtN(b.dmg - b.max)})` : ""}</p>
      <div class="modal-actions"><button class="btn red big" data-go="timer">⚔️ 집중해서 공격!</button></div>
    </div>
    <div class="card">
      <h3 class="card-title">전투 기록</h3>
      <ul class="boss-log">${b.hits.map((h) => `<li><span>${new Date(h.t).toLocaleString("ko-KR", { weekday: "short", hour: "2-digit", minute: "2-digit" })}</span><span>${TS.esc(h.src)}</span><b>-${fmtN(h.n)}</b></li>`).join("") || '<li class="empty">아직 공격하지 않았어요. 집중을 시작해서 첫 타격을!</li>'}</ul>
    </div>
    ${dexHTML()}
    ${(S().bossHist || []).length ? `<div class="card"><h3 class="card-title">지난 보스</h3><ul class="boss-log">${S().bossHist.map((h) => {
      const hc = TS.SADO_MAP[h.id];
      return `<li><span>${h.week} 주</span><span>${TS.esc(hc ? hc.name : h.id)}</span><b>${h.dmg >= h.max ? "🏆 격파" : `${Math.floor((h.dmg / h.max) * 100)}%`}</b></li>`;
    }).join("")}</ul></div>` : ""}`;
}
TS.views.boss = render;

/* 보스 도감: 등장 순서(이번 주부터)와 격파 횟수 */
function kills(id) {
  const s = S();
  return (s.bossHist || []).filter((h) => h.id === id && h.dmg >= h.max).length + (s.boss && s.boss.id === id && s.boss.dmg >= s.boss.max ? 1 : 0);
}
function dexHTML() {
  const n = BOSSES.length, cur = ((weekIndex() % n) + n) % n;
  const order = BOSSES.map((b, i) => ({ b, inW: (i - cur + n) % n })).sort((a, z) => a.inW - z.inW);
  return `<div class="card"><h3 class="card-title">📖 보스 도감 <span class="count">${n}명</span></h3>
    <div class="boss-dex">${order.map(({ b, inW }) => {
      const c = TS.SADO_MAP[b.id], k = kills(b.id);
      const when = inW === 0 ? "이번 주" : inW === 1 ? "다음 주" : `${inW}주 뒤`;
      return `<div class="dex ${inW === 0 ? "now" : ""}">
        <img src="${TS.chibiSrc(c)}" alt="" loading="lazy">
        <div><span class="tag ${inW === 0 ? "now" : ""}">${when}</span>
        <b>${TS.esc(c.name)}</b><small>${TS.esc(b.title)}</small>
        <em>“${TS.esc(b.taunt[0])}”</em>
        <span class="dex-kill">${k ? `🏆 격파 ${k}회` : "아직 못 잡음"}</span></div></div>`;
    }).join("")}</div>
    <p class="hint">보스는 ${n}주마다 한 바퀴 돌아요. HP는 하루 목표 시간 × 5일 × 10 (최소 3,000).</p></div>`;
}

TS.on("refresh", () => {
  const b = ensure(), c = TS.SADO_MAP[b.id], left = hpLeft(b);
  if (!$("brief-boss")) return;
  $("brief-boss-name").textContent = c.name;
  $("brief-boss").textContent = left ? `${Math.ceil((left / b.max) * 100)}%` : "격파!";
  $("brief-boss-bar").style.width = (left / b.max) * 100 + "%";
  $("dot-boss").classList.toggle("hidden", b.seen);
});
TS.chatterHooks.push(() => {
  const b = ensure();
  if (hpLeft(b) === 0 || Math.random() > 0.3) return null;
  return `이번 주 보스 ${TS.SADO_MAP[b.id].name}, HP가 ${Math.ceil((hpLeft(b) / b.max) * 100)}% 남았어요! 같이 때려요!`;
});

window.Boss = { phase: () => phase(), ensure, deal, kills, BOSSES };
})();
