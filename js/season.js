/* =========================================================
   🎖️ 시즌 & 시즌 패스 — 학기마다 새로 시작하는 성장 축
   - 1년에 4시즌: 봄(1학기 3~6월) · 여름(방학 7~8월) · 가을(2학기 9~12월) · 겨울(방학 1~2월)
     날짜만으로 자동 계산되니 손볼 필요 없음
   - 시즌 포인트(SP): 집중 1분 = 1SP, 의뢰 해결, 매일 첫 접속, 주간 시즌 미션
   - 시즌 사도 3명(시즌마다 바뀜)이 대표 사도면 집중 SP ×1.2
   - 패스 50단계 + 끝없는 보너스 단계. 20·50단계 칭호, 30단계 프레임, 40단계 테마, 50단계 뱃지는 시즌마다 새로 생김
   - 시즌이 끝나면 못 받은 보상은 자동 지급, 결과는 기록으로 남음
   테스트: ?season=end (지난 시즌 결과 창 보기)
   ========================================================= */
const SEASON_KINDS = {
  spring: { name: "봄",   sub: "1학기",   icon: "🌸", color: "#ff8fb1", from: [3, 1],  to: [6, 30] },
  summer: { name: "여름", sub: "여름방학", icon: "🌊", color: "#3fb6e8", from: [7, 1],  to: [8, 31] },
  fall:   { name: "가을", sub: "2학기",   icon: "🍁", color: "#ef8a3c", from: [9, 1],  to: [12, 31] },
  winter: { name: "겨울", sub: "겨울방학", icon: "❄️", color: "#7d9cff", from: [1, 1],  to: [2, 29] },
};
const SEASON_EPOCH = "2026-fall"; // 첫 시즌 (칭호 목록은 여기서부터)

const Season = (() => {
  const p2 = (n) => String(n).padStart(2, "0");
  const key = (d) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
  function kindOf(m) { return m >= 3 && m <= 6 ? "spring" : m <= 8 && m >= 7 ? "summer" : m >= 9 ? "fall" : "winter"; }
  function info(id) {
    const [y, kind] = id.split("-"), K = SEASON_KINDS[kind], Y = +y;
    const start = new Date(Y, K.from[0] - 1, K.from[1]);
    const end = kind === "winter" ? new Date(Y, 2, 0) : new Date(Y, K.to[0] - 1, K.to[1]); // 겨울: 2월 말일
    const days = Math.round((end - start) / 864e5) + 1;
    const cost = Math.round((days * 1.25) / 5) * 5; // 1단계에 필요한 SP (긴 시즌일수록 큼)
    return { id, kind, year: Y, K, start: key(start), end: key(end), days, cost,
      label: `${String(Y).slice(2)} ${K.name}`, full: `${Y} ${K.name} 시즌`, sub: K.sub };
  }
  function currentId(d = new Date()) { return `${d.getFullYear()}-${kindOf(d.getMonth() + 1)}`; }
  function next(id) {
    const order = ["winter", "spring", "summer", "fall"], [y, k] = id.split("-"), i = order.indexOf(k);
    return i === 3 ? `${+y + 1}-winter` : `${y}-${order[i + 1]}`;
  }
  // 첫 시즌부터 지금까지 (칭호·뱃지 목록용)
  function allIds() {
    const out = [], cur = currentId(); let id = SEASON_EPOCH;
    for (let i = 0; i < 200; i++) { out.push(id); if (id === cur) break; id = next(id); }
    return out;
  }
  // 시즌 사도 3명: 시즌 id로 정해지는 랜덤 (모두에게 같음)
  function cast(id) {
    let h = 2166136261; for (const ch of id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
    const pool = SADO.filter((c) => c.rarity >= 2).map((c) => c.id), pick = [];
    while (pick.length < 3 && pool.length) pick.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
    return pick;
  }
  const MAX = 50;
  // 단계별 보상
  function reward(lv) {
    if (lv > MAX) return { candy: 15, text: "별사탕 15" };
    const r = { elif: 300 }, t = [];
    if (lv % 10 === 5) Object.assign(r, { candy: 30 });
    if (lv === 10) Object.assign(r, { candy: 20, item: ["R", "R"] });
    if (lv === 20) Object.assign(r, { item: ["SR"], title: "t20" });
    if (lv === 25) Object.assign(r, { candy: 50, item: ["SR"] });
    if (lv === 30) Object.assign(r, { frame: 1, item: ["SR"] });
    if (lv === 40) Object.assign(r, { theme: 1, item: ["SSR"] });
    if (lv === 50) Object.assign(r, { candy: 300, title: "t50", badge: 1, item: ["SSR"] });
    if (r.elif) t.push(`엘리프 ${r.elif}`);
    if (r.candy) t.push(`별사탕 ${r.candy}`);
    if (r.item) t.push(r.item.map((x) => `${x} 아티팩트`).join(" + "));
    if (r.title === "t20") t.push("칭호 「탐험가」");
    if (r.title === "t50") t.push("칭호 「마스터」");
    if (r.frame) t.push("시즌 프레임");
    if (r.theme) t.push("시즌 테마");
    if (r.badge) t.push("시즌 뱃지");
    r.text = t.join(" · ");
    r.big = !!(r.title || r.frame || r.theme || r.badge || r.item);
    return r;
  }
  return { info, currentId, allIds, cast, reward, MAX, kindOf };
})();

/* 시즌 기록: s.season = { id, sp, claimed, hist: { id: { lv, sp } }, ... } */
const seasonLv = (s, id) => {
  const ss = s.season; if (!ss) return 0;
  if (ss.id === id) return Math.floor(ss.sp / Season.info(id).cost);
  return (ss.hist && ss.hist[id] && ss.hist[id].lv) || 0;
};
const seasonKindBest = (s, kind) => Math.max(0, ...Season.allIds().filter((id) => id.endsWith(kind)).map((id) => seasonLv(s, id)));

// 프로필 꾸미기: 시즌마다 칭호 2개 · 뱃지 1개, 계절마다 프레임 · 테마
Season.allIds().forEach((id) => {
  const I = Season.info(id);
  PROFILE_TITLES.push(
    { id: `ss_${id}_20`, label: `${I.label} 탐험가`, cond: `${I.full} 패스 20단계`, ok: (s) => seasonLv(s, id) >= 20 },
    { id: `ss_${id}_50`, label: `${I.label} 마스터`, cond: `${I.full} 패스 50단계`, ok: (s) => seasonLv(s, id) >= 50 },
  );
  PROFILE_BADGES.push({ id: `ss_${id}`, icon: I.K.icon, label: `${I.label} 마스터`, ok: (s) => seasonLv(s, id) >= 50 });
});
Object.entries(SEASON_KINDS).forEach(([k, K]) => {
  PROFILE_FRAMES.push({ id: `ss_${k}`, label: `${K.name} 시즌`, cond: `${K.name} 시즌 패스 30단계`, ok: (s) => seasonKindBest(s, k) >= 30 });
  PROFILE_THEMES.push({ id: `ss_${k}`, label: `${K.name} 시즌`, cond: `${K.name} 시즌 패스 40단계`, ok: (s) => seasonKindBest(s, k) >= 40 });
});

(() => {
"use strict";
const TS = window.TS;
const $ = (id) => document.getElementById(id);
const S = () => TS.state;
const esc = TS.esc;

/* ───── 주간 시즌 미션 (매주 월요일, 목록에서 3개가 정해짐) ───── */
const WEEKLY_POOL = [
  { id: "f300",  title: "이번 주 집중 300분",              goal: 300, sp: 80,  prog: (w) => w.min },
  { id: "f600",  title: "이번 주 집중 600분",              goal: 600, sp: 150, prog: (w) => w.min },
  { id: "d4",    title: "4일 이상 공부하기 (하루 30분+)",    goal: 4,   sp: 90,  prog: (w) => Object.values(w.days).filter((m) => m >= 30).length },
  { id: "d6",    title: "6일 이상 공부하기 (하루 20분+)",    goal: 6,   sp: 130, prog: (w) => Object.values(w.days).filter((m) => m >= 20).length },
  { id: "ses8",  title: "끝까지 집중 8회",                 goal: 8,   sp: 80,  prog: (w) => w.full },
  { id: "ses15", title: "끝까지 집중 15회",                goal: 15,  sp: 140, prog: (w) => w.full },
  { id: "todo6", title: "의뢰 6개 해결",                   goal: 6,   sp: 80,  prog: (w) => w.todo },
  { id: "hard2", title: "어려움 의뢰 2개 해결",             goal: 2,   sp: 90,  prog: (w) => w.hard },
  { id: "subj3", title: "과목 3개 이상 각 40분 공부",        goal: 3,   sp: 100, prog: (w) => Object.values(w.subj).filter((m) => m >= 40).length },
  { id: "cast",  title: "시즌 사도와 함께 집중 120분",        goal: 120, sp: 100, prog: (w) => w.cast },
  { id: "long",  title: "하루에 120분 이상 공부한 날 2일",    goal: 2,   sp: 110, prog: (w) => Object.values(w.days).filter((m) => m >= 120).length },
  { id: "poke",  title: "대표 사도 볼 30번 만지기",          goal: 30,  sp: 40,  prog: (w) => w.poke },
];
function weekly(wk) {
  let h = 0; for (const ch of wk + S().season.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const pool = WEEKLY_POOL.slice(), out = [];
  // 같은 종류(f300/f600 등)가 겹치지 않게
  const fam = (m) => m.id.replace(/\d+$/, "");
  while (out.length < 3 && pool.length) {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0;
    const m = pool.splice(h % pool.length, 1)[0];
    if (!out.some((o) => fam(o) === fam(m))) out.push(m);
  }
  return out;
}

/* ───── 상태 ───── */
function fresh(id) { return { id, sp: 0, claimed: 0, wk: null, daily: "", hist: (S().season && S().season.hist) || {}, seen: (S().season && S().season.seen) || "" }; }
function wkState() {
  const ss = S().season, k = TS.weekKey();
  if (!ss.wk || ss.wk.key !== k) ss.wk = { key: k, min: 0, days: {}, subj: {}, full: 0, todo: 0, hard: 0, cast: 0, poke: 0, done: [] };
  return ss.wk;
}
const I = () => Season.info(S().season.id);
const lv = () => Math.floor(S().season.sp / I().cost);

function init() {
  const s = S();
  const cur = Season.currentId();
  if (!s.season) {
    s.season = fresh(cur);
    // 처음 켤 때: 이번 시즌 시작일부터 공부한 시간을 SP로 쳐줌
    const st = Season.info(cur).start;
    s.season.sp = Object.entries((s.stats && s.stats.days) || {}).filter(([d]) => d >= st).reduce((a, [, m]) => a + m, 0);
  }
  if (s.season.id !== cur) endSeason(cur);
  try { if (new URLSearchParams(location.search).get("season") === "end") setTimeout(() => showResult(s.season.id, { lv: lv(), sp: s.season.sp, got: [] }), 1500); } catch (e) { /* 무시 */ }
}

/* ───── SP 얻기 ───── */
function addSP(n, why) {
  if (!S().started || n <= 0) return;
  const before = lv();
  S().season.sp += Math.round(n);
  const after = lv();
  if (after > before) {
    TS.toast(`🎖️ 시즌 패스 ${after}단계 달성!${after <= Season.MAX && Season.reward(after).big ? " 특별 보상이 기다려요" : ""}`);
    TS.sfx("coin");
  }
  updateBadge();
}

/* ───── 보상 ───── */
function give(r, id) {
  if (r.elif) TS.addElif(r.elif);
  if (r.candy) TS.addCandy(r.candy);
  const got = [];
  (r.item || []).forEach((rar) => { const it = TS.randomItem(rar, S().partner); if (it && TS.addItem(it.id)) got.push(it.id); });
  return got;
}
function claimAll() {
  const ss = S().season, to = lv();
  if (ss.claimed >= to) return [];
  let got = [], elif = 0, candy = 0;
  for (let l = ss.claimed + 1; l <= to; l++) {
    const r = Season.reward(l);
    elif += r.elif || 0; candy += r.candy || 0;
    got = got.concat(give(r));
  }
  ss.claimed = to;
  TS.save(); TS.refresh();
  return { got, elif, candy };
}

/* ───── 시즌 끝 ───── */
function endSeason(cur) {
  const ss = S().season, old = ss.id;
  const res = claimAll() || {};
  const final = { lv: Math.floor(ss.sp / Season.info(old).cost), sp: ss.sp };
  const hist = Object.assign({}, ss.hist, { [old]: final });
  S().season = fresh(cur); S().season.hist = hist;
  TS.save();
  setTimeout(() => showResult(old, { ...final, got: res.got || [], elif: res.elif || 0, candy: res.candy || 0 }), 1200);
}
function showResult(id, r) {
  const I0 = Season.info(id), N = Season.info(Season.currentId());
  TS.modal(`<div class="sn-result" style="--sn:${I0.K.color}">
    <div class="sn-res-icon">${I0.K.icon}</div>
    <h2>${esc(I0.full)} 종료!</h2>
    <p class="sn-res-lv">최종 <b>${r.lv}</b>단계 · ${r.sp.toLocaleString()} SP</p>
    <p class="hint">${r.lv >= 50 ? "시즌 마스터! 정말 대단해요, 교주님!" : r.lv >= 20 ? "멋진 시즌이었어요!" : "이번 시즌도 수고했어요!"}</p>
    ${r.elif || r.candy || (r.got && r.got.length) ? `<p>못 받은 보상을 대신 챙겨 뒀어요: ${r.elif ? `엘리프 ${r.elif} ` : ""}${r.candy ? `별사탕 ${r.candy}` : ""}</p>
      ${r.got.length ? `<div class="reward-row">${r.got.map((x) => TS.itemChip(x)).join("")}</div>` : ""}` : ""}
    <div class="sn-res-next">${N.K.icon} <b>${esc(N.full)}</b> 시작! <small>${esc(N.sub)} · ~${N.end.slice(5).replace("-", "/")}</small></div>
    <button class="btn yellow wide" id="sn-res-ok">새 시즌 시작하기</button></div>`, (box, close) => {
    box.querySelector("#sn-res-ok").onclick = () => { close(); TS.go("season"); };
  });
  TS.confetti && TS.confetti();
}

/* ───── 이벤트 연결 ───── */
const castNow = () => Season.cast(S().season.id);
TS.on("focus", (x) => {
  const w = wkState(), d = TS.today();
  const isCast = castNow().includes(x.partner);
  w.min += x.min; w.days[d] = (w.days[d] || 0) + x.min;
  w.subj[x.subject || "기타"] = (w.subj[x.subject || "기타"] || 0) + x.min;
  if (x.full) w.full++;
  if (isCast) w.cast += x.min;
  addSP(x.min * (isCast ? 1.2 : 1), "focus");
  TS.save();
});
TS.on("todo", (t) => {
  const w = wkState();
  w.todo++; if (t.diff === "hard") w.hard++;
  addSP({ easy: 10, normal: 20, hard: 40 }[t.diff] || 10, "todo");
});
TS.on("poke", () => { wkState().poke++; });
TS.on("start", () => {
  const ss = S().season;
  if (!S().started) return;
  if (ss.daily !== TS.today()) { ss.daily = TS.today(); addSP(15, "daily"); TS.save(); }
  updateBadge();
});

/* ───── 화면 ───── */
const wkReady = () => { const w = wkState(); return weekly(w.key).filter((m) => !w.done.includes(m.id) && m.prog(w) >= m.goal); };
function updateBadge() {
  const ss = S().season; if (!ss) return;
  const dot = $("dot-season"); if (dot) dot.classList.toggle("hidden", !(lv() > ss.claimed || wkReady().length));
  const b = $("sn-lobby");
  if (b) {
    const i = I(), l = lv(), inLv = ss.sp - l * i.cost;
    b.style.setProperty("--sn", i.K.color);
    b.innerHTML = `<span class="sn-lb-icon">${i.K.icon}</span><span class="sn-lb-txt"><b>${esc(i.full)}</b> <small>${l}단계 · D-${dleft()}</small></span>
      <span class="bar"><i style="width:${(inLv / i.cost) * 100}%"></i></span>${l > ss.claimed ? '<em class="sn-lb-new">보상!</em>' : ""}`;
  }
}
const dleft = () => Math.max(0, Math.ceil((new Date(I().end + "T23:59:59") - Date.now()) / 864e5));

function render() {
  const ss = S().season, i = I(), l = lv(), inLv = ss.sp - l * i.cost, w = wkState();
  const cast = castNow().map((id) => TS.SADO_MAP[id]).filter(Boolean);
  const partnerCast = castNow().includes(S().partner);
  // 패스 트랙: 지금 단계 주변 + 큰 보상 단계
  const shown = [];
  const lo = Math.max(1, Math.min(l - 1, Season.MAX - 9));
  for (let n = lo; n < lo + 10; n++) shown.push(n);
  if (l >= Season.MAX) for (let n = Math.max(Season.MAX + 1, l - 1); n <= l + 3; n++) if (!shown.includes(n)) shown.push(n);
  const cell = (n) => {
    const r = Season.reward(n), got = n <= ss.claimed, ready = n <= l && !got;
    return `<div class="sn-cell ${got ? "got" : ""} ${ready ? "ready" : ""} ${n <= l ? "reach" : ""} ${r.big ? "big" : ""}">
      <span class="sn-n">${n > Season.MAX ? "+" + (n - Season.MAX) : n}</span>
      <span class="sn-ic">${r.title ? "🏆" : r.badge ? i.K.icon : r.theme ? "🎨" : r.frame ? "🖼️" : r.item ? "🎁" : r.candy && !r.elif ? "🍬" : r.candy ? "🍬" : "💎"}</span>
      <small>${esc(r.text)}</small></div>`;
  };
  const milestones = [10, 20, 30, 40, 50].map((n) => ({ n, r: Season.reward(n) }));
  $("view-season").innerHTML = `
    <div class="sn-hero" style="--sn:${i.K.color}">
      <div class="sn-hero-icon">${i.K.icon}</div>
      <div class="sn-hero-text">
        <span class="sn-tag">${esc(i.sub)} 시즌</span>
        <h2>${esc(i.full)}</h2>
        <p class="sn-period">📅 ${i.start.slice(5).replace("-", "/")} ~ ${i.end.slice(5).replace("-", "/")} · 종료까지 <b>D-${dleft()}</b></p>
        <div class="sn-lvrow"><span class="sn-lv">${l}<small>단계</small></span>
          <div class="sn-lvbar"><span class="bar"><i style="width:${(inLv / i.cost) * 100}%"></i></span><small>${inLv} / ${i.cost} SP · 총 ${ss.sp.toLocaleString()} SP</small></div></div>
      </div>
      <div class="sn-cast">
        <small>이번 시즌 사도 <b>SP ×1.2</b></small>
        <div>${cast.map((c) => `<button class="sn-cast-c ${S().partner === c.id ? "on" : ""}" data-sncast="${c.id}" title="${esc(c.name)}"><img src="${TS.chibiSrc(c)}" alt=""><span>${esc(TS.shortName(c))}</span>${S().owned[c.id] ? "" : "<em>미보유</em>"}</button>`).join("")}</div>
        <small class="hint">${partnerCast ? "✨ 지금 대표 사도가 시즌 사도예요!" : "시즌 사도를 대표로 하면 집중 SP가 20% 늘어요"}</small>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">🎖️ 시즌 패스 <span class="count">${Math.min(l, Season.MAX)} / ${Season.MAX}</span>
        <button class="btn ${l > ss.claimed ? "yellow" : "white"} small" id="sn-claim" ${l > ss.claimed ? "" : "disabled"} style="margin-left:auto">${l > ss.claimed ? `보상 ${l - ss.claimed}개 받기` : "받을 보상 없음"}</button></h3>
      <div class="sn-track">${shown.map(cell).join("")}</div>
      <div class="sn-miles">${milestones.map(({ n, r }) => `<span class="${l >= n ? "on" : ""}"><b>${n}</b> ${esc(r.text.replace(/엘리프 300 · /, ""))}</span>`).join("")}</div>
      <p class="hint">50단계 뒤에도 끝없는 보너스 단계(별사탕 15)가 이어져요. 칭호·뱃지는 시즌마다 새로 생겨서 모아 둘 수 있어요.</p>
    </div>

    <div class="card">
      <h3 class="card-title">📅 이번 주 시즌 미션 <span class="hint" style="margin:0 0 0 auto">매주 월요일 새 미션</span></h3>
      <div class="quest-list">${weekly(w.key).map((m) => {
        const p = Math.min(m.goal, m.prog(w)), done = w.done.includes(m.id), ready = !done && p >= m.goal;
        return `<div class="quest ${done ? "claimed" : ""} ${ready ? "ready" : ""}">
          <div><div class="quest-title">${esc(m.title)}</div><div class="quest-rw"><span>🎖️ ${m.sp} SP</span></div></div>
          <span class="bar"><i style="width:${(p / m.goal) * 100}%"></i></span><span class="quest-prog">${p} / ${m.goal}</span>
          <button class="btn small ${ready ? "yellow" : "white"}" data-snwk="${m.id}" ${ready ? "" : "disabled"}>${done ? "완료" : ready ? "받기!" : "진행 중"}</button></div>`;
      }).join("")}</div>
    </div>

    <div class="card">
      <h3 class="card-title">💡 SP 얻는 법</h3>
      <ul class="sn-how">
        <li>⏰ 집중 1분 = <b>1 SP</b> (시즌 사도가 대표면 1.2 SP)</li>
        <li>📜 의뢰 해결 = 쉬움 <b>10</b> · 보통 <b>20</b> · 어려움 <b>40</b> SP</li>
        <li>🌅 매일 첫 접속 = <b>15 SP</b></li>
        <li>📅 주간 시즌 미션 = <b>40~150 SP</b></li>
      </ul>
    </div>
    ${histHTML()}`;

  $("sn-claim").onclick = () => {
    const r = claimAll(); if (!r || !r.got) return;
    TS.sfx("coin"); TS.confetti && TS.confetti();
    TS.toast(`🎖️ 시즌 보상! ${r.elif ? `엘리프 +${r.elif} ` : ""}${r.candy ? `별사탕 +${r.candy}` : ""}${r.got.length ? ` · 아티팩트 ${r.got.length}개` : ""}`);
  };
  document.querySelectorAll("[data-snwk]").forEach((b) => (b.onclick = () => {
    const m = WEEKLY_POOL.find((x) => x.id === b.dataset.snwk), w2 = wkState();
    if (!m || w2.done.includes(m.id) || m.prog(w2) < m.goal) return;
    w2.done.push(m.id); addSP(m.sp, "weekly"); TS.toast(`📅 ${m.title} — ${m.sp} SP`); TS.save(); render();
  }));
  document.querySelectorAll("[data-sncast]").forEach((b) => (b.onclick = () => {
    const id = b.dataset.sncast;
    if (!S().owned[id]) return TS.toast("아직 영입하지 않은 사도예요. 모집에서 만나 봐요!");
    S().partner = id; TS.emit("partner", id); TS.renderPartner(true); TS.save(); render();
    TS.toast(`✨ ${TS.fmt("{name}를 대표 사도로! 집중 SP ×1.2", TS.SADO_MAP[id])}`);
  }));
  updateBadge();
}
function histHTML() {
  const h = S().season.hist || {}, ids = Object.keys(h).sort().reverse();
  if (!ids.length) return "";
  return `<div class="card"><h3 class="card-title">📚 지난 시즌</h3><div class="sn-hist">${ids.map((id) => {
    const x = Season.info(id), r = h[id];
    return `<div style="--sn:${x.K.color}"><span>${x.K.icon}</span><b>${esc(x.full)}</b><em>${r.lv}단계</em><small>${r.sp.toLocaleString()} SP</small></div>`;
  }).join("")}</div></div>`;
}

TS.views.season = render;
TS.on("refresh", () => updateBadge());

/* 로비 배너 */
const lobby = $("view-lobby");
if (lobby) {
  const b = document.createElement("button");
  b.id = "sn-lobby"; b.className = "sn-lobby";
  b.onclick = () => TS.go("season");
  const ev = $("event-banner");
  ev ? ev.after(b) : lobby.prepend(b);
}

/* 랭킹: 이번 시즌 SP */
window.RANK_EXTRA && window.RANK_EXTRA.push(() => ({ sn: { id: S().season.id, sp: S().season.sp } }));
window.RANK_TABS && window.RANK_TABS.push({ id: "season", label: "🎖️ 시즌", val: (e) => (e.sn && e.sn.id === S().season.id ? e.sn.sp : 0), fmt: "sp" });

init();
updateBadge();
window.SeasonPass = { addSP, lv, info: I, claimAll, render };
})();
