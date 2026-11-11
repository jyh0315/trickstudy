/* =========================================================
   🧶 놀아주기 — 화면보호기 배경 위에서 사도들과 노는 방 (머리 비우고 쉬는 시간용)
   - 대표 사도 + 가진 사도 2명이 바닥을 돌아다님 (움직이는 사도)
   - 도구: ✋ 손(누르면 콕 · 길게 누르면 쓰다듬기) · 🍪 간식(떨어뜨리면 달려와서 먹음)
           ⚽ 공(던지면 쫓아가서 차 줌) · 🫧 비눗방울 · 🎵 다 같이 춤
   - 놀아 주면 호감도 +1 (하루 15번까지), 사도마다 자기 대사로 반응
   - 여는 곳: 로비 「🧶 놀아주기」 · 화면보호기 아래 버튼 · 휴식 시작 알림 · 🔨 꿀밤 타임도 여기서
   ========================================================= */
(() => {
"use strict";
const TS = window.TS, S = () => TS.state, esc = TS.esc;
const V = (id) => (typeof voiceOf === "function" ? voiceOf(id) : null) || {};
const AFF_DAILY = 15, N = 3;
const st = () => { const s = S(); if (!s.playroom) s.playroom = { day: "", n: 0, total: 0, tool: "hand" }; if (s.playroom.day !== TS.today()) { s.playroom.day = TS.today(); s.playroom.n = 0; } return s.playroom; };
const TOOLS = [
  { k: "hand", i: "✋", t: "손", d: "누르면 콕, 길게 누르면 쓰다듬기" },
  { k: "snack", i: "🍪", t: "간식", d: "바닥을 누르면 간식이 떨어져요" },
  { k: "ball", i: "⚽", t: "공", d: "누른 곳으로 공을 던져요" },
  { k: "bubble", i: "🫧", t: "비눗방울", d: "누른 곳에서 비눗방울이 올라가요" },
];
const SNACKS = ["🍪", "🍩", "🧁", "🍰", "🥐", "🍭", "🍮"];
const NOSNACK = ["나도 줘!", "내 건?", "…부럽다.", "한 입만!"];

let root = null, chars = [], tool = "hand", loops = [], ball = null;
const later = (fn, ms) => { const t = setTimeout(fn, ms); loops.push(t); return t; };

function pickIds() {
  const s = S(), owned = Object.keys(s.owned).filter((id) => TS.SADO_MAP[id] && id !== s.partner).sort(() => Math.random() - 0.5);
  return [s.partner, ...owned].filter(Boolean).slice(0, N);
}
function randomBg() {
  const L = typeof SS_BACKGROUNDS !== "undefined" ? SS_BACKGROUNDS : [];
  // 바닥이 잘 보이는 야외·실내 배경 위주
  const good = ["017", "026", "041", "062", "070", "078", "084", "098", "105", "112", "117", "120", "136", "139", "140", "141", "144", "157"].filter((n) => L.includes(n));
  return `assets/ssbg/${TS.rand(good.length ? good : L)}.webp`;
}

function open(bg) {
  if (root) return;
  const p = st(); tool = p.tool || "hand";
  root = document.createElement("div");
  root.className = "pr-ov";
  root.innerHTML = `<div class="pr-bg" style="background-image:url('${bg && !/\.webm$/.test(bg) ? bg : randomBg()}')"></div><div class="pr-shade"></div>
    <div class="pr-top"><b>🧶 놀아주기</b><span class="pr-aff"></span>
      <button class="btn white small" data-pr="bg" title="배경 바꾸기">🏞️</button><button class="btn white small" data-pr="swap" title="다른 사도 부르기">👥</button>
      <button class="btn red small" data-pr="close" title="나가기 (Esc)">✕ 나가기</button></div>
    <div class="pr-field"><div class="pr-items"></div><div class="pr-chars"></div></div>
    <div class="pr-tip"></div>
    <div class="pr-tools">${TOOLS.map((t) => `<button data-tool="${t.k}" title="${t.d}"><i>${t.i}</i><span>${t.t}</span></button>`).join("")}
      <button data-pr="dance" title="다 같이 춤"><i>🎵</i><span>춤</span></button>
      ${window.KnockGame ? '<button data-pr="knock" title="꿀밤 타임 (미니게임)"><i>🔨</i><span>꿀밤</span></button>' : ""}</div>`;
  (document.fullscreenElement || document.body).appendChild(root);
  root.addEventListener("click", onClick);
  const field = root.querySelector(".pr-field");
  field.addEventListener("pointerdown", onDown);
  field.addEventListener("pointerup", onUp); field.addEventListener("pointercancel", onUp); field.addEventListener("pointerleave", onUp);
  document.addEventListener("keydown", onKey);
  setTool(tool); hud(); spawn();
}
function close() {
  if (!root) return;
  loops.forEach(clearTimeout); loops = [];
  chars.forEach((c) => c.live && c.live.dispose()); chars = []; ball = null;
  document.removeEventListener("keydown", onKey);
  root.remove(); root = null; TS.save();
}
const onKey = (e) => { if (e.key === "Escape" && root) { e.stopPropagation(); close(); } };
function hud() {
  if (!root) return; const p = st();
  root.querySelector(".pr-aff").textContent = p.n >= AFF_DAILY ? "💗 오늘 호감도 다 받음" : `💗 오늘 호감도 ${p.n} / ${AFF_DAILY}`;
}
function setTool(k) {
  tool = k; st().tool = k;
  root.querySelectorAll("[data-tool]").forEach((b) => b.classList.toggle("on", b.dataset.tool === k));
  root.querySelector(".pr-tip").textContent = TOOLS.find((t) => t.k === k).d;
  root.dataset.tool = k;
}

/* ───── 사도 ───── */
function spawn() {
  chars.forEach((c) => { c.el.remove(); c.live && c.live.dispose(); }); chars = [];
  const ids = pickIds();
  ids.forEach((id, i) => {
    const c = TS.SADO_MAP[id];
    const el = document.createElement("div");
    el.className = "pr-char";
    el.innerHTML = `<div class="pr-bub"></div><div class="pr-body"><img class="pr-pic" src="${TS.chibiSrc(c)}" alt=""></div><span class="pr-name">${esc(TS.shortName(c))}</span>`;
    root.querySelector(".pr-chars").appendChild(el);
    const x = ((i + 1) * 100) / (ids.length + 1);
    const it = { id, c, el, x, busy: false, ctrl: null, live: null };
    el.style.left = x + "%";
    const body = el.querySelector(".pr-body");
    if (window.Live && window.Live.canLive && window.Live.canLive(id)) it.live = window.Live.mount(body, id, { frame: "body", onReady: (ctrl) => { it.ctrl = ctrl; body.classList.add("ok"); } });
    chars.push(it);
    later(() => wander(it), 1500 + Math.random() * 3000);
  });
}
function wander(it) {
  if (!root || !chars.includes(it)) return;
  if (!it.busy && Math.random() < 0.75) {
    let x = 8 + Math.random() * 84;
    for (let k = 0; k < 6 && chars.some((o) => o !== it && Math.abs(o.x - x) < 22); k++) x = 8 + Math.random() * 84;
    moveTo(it, x, 0.55);
  }
  later(() => wander(it), 2600 + Math.random() * 4200);
}
/* x(%)로 걸어감. speed: 화면 너비 1%당 걸리는 시간(초 단위 배수) */
function moveTo(it, x, speed = 0.3, done) {
  x = Math.max(5, Math.min(95, x));
  const dist = Math.abs(x - it.x), ms = Math.max(250, dist * speed * 60);
  it.el.classList.toggle("flip", x > it.x); // 기본은 왼쪽을 봄 → 오른쪽으로 갈 땐 뒤집기
  it.el.classList.add("walk");
  it.el.style.transitionDuration = ms + "ms";
  it.el.style.left = x + "%"; it.x = x;
  clearTimeout(it.moveT);
  it.moveT = later(() => { it.el.classList.remove("walk"); done && done(); }, ms);
}
function bubble(it, text) {
  const b = it.el.querySelector(".pr-bub");
  b.textContent = text.length > 34 ? text.slice(0, 33) + "…" : text; b.classList.add("on");
  clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove("on"), 2400);
}
function play(it, kind) { try { it.ctrl && it.ctrl.play(kind); } catch (e) { /* 무시 */ } }
function hearts(it, emo = ["💗", "💕", "💖"]) {
  for (let i = 0; i < 4; i++) { const h = document.createElement("span"); h.className = "pr-heart"; h.textContent = TS.rand(emo); h.style.left = 30 + Math.random() * 40 + "%"; h.style.animationDelay = i * 0.1 + "s"; it.el.appendChild(h); setTimeout(() => h.remove(), 1600); }
}
function love(it) {
  const p = st(); p.total = (p.total || 0) + 1;
  if (p.n < AFF_DAILY && window.Affection && window.Affection.gain) { p.n++; window.Affection.gain(it.id, 1); }
  hud();
}
const lineOf = (it, keys, fb) => { const v = V(it.id); for (const k of keys) if (v[k] && v[k].length) return TS.rand(v[k]); return fb; };

/* ───── 누르기 ───── */
const fieldPos = (e) => { const r = root.querySelector(".pr-field").getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, r }; };
let hold = null;
function onDown(e) {
  if (!root) return;
  const ce = e.target.closest(".pr-char"), it = ce && chars.find((c) => c.el === ce);
  const pos = fieldPos(e);
  if (tool === "hand") {
    if (!it) { // 빈 곳을 누르면 그쪽으로 다 같이 옴
      chars.filter((c) => !c.busy).forEach((c, i) => moveTo(c, pos.x + (i - 1) * 9, 0.28));
      return;
    }
    hold = { it, t: Date.now(), pat: false };
    hold.timer = setTimeout(() => {
      if (!hold || hold.it !== it) return;
      hold.pat = true; it.busy = true;
      try { if (it.ctrl && it.ctrl.anims.includes("Pat_Idle")) { it.ctrl.player.animationState.setAnimation(0, "Pat_Idle", true); it.ctrl.busyUntil = Infinity; } else play(it, "happy"); } catch (err) { /* 무시 */ }
      bubble(it, lineOf(it, ["pat"], "헤헤…")); hearts(it); love(it); TS.sfx("coin");
      hold.loop = setInterval(() => hearts(it), 900);
    }, 450);
    return;
  }
  if (tool === "snack") return dropSnack(pos.x);
  if (tool === "ball") return throwBall(pos.x);
  if (tool === "bubble") return blow(pos.x, pos.y);
}
function onUp() {
  if (!hold) return;
  const h = hold; hold = null; clearTimeout(h.timer); clearInterval(h.loop);
  const it = h.it;
  if (h.pat) {
    try { if (it.ctrl && it.ctrl.anims.includes("Pat_End")) { const stt = it.ctrl.player.animationState; stt.setAnimation(0, "Pat_End", false); stt.addAnimation(0, it.ctrl.idles[0] || it.ctrl.anims[0], true, 0); it.ctrl.busyUntil = Date.now() + 1500; } } catch (err) { /* 무시 */ }
    later(() => (it.busy = false), 900);
  } else if (Date.now() - h.t < 450) { // 콕
    play(it, TS.rand(["touch", "surprise", "shy"])); bubble(it, lineOf(it, ["poke"], "앗!")); TS.sfx("poke");
    it.el.classList.remove("boing"); void it.el.offsetWidth; it.el.classList.add("boing");
  }
}

/* 🍪 간식 */
function dropSnack(x) {
  const free = chars.filter((c) => !c.busy); if (!free.length) return;
  const el = document.createElement("span");
  el.className = "pr-snack"; el.textContent = TS.rand(SNACKS); el.style.left = x + "%";
  root.querySelector(".pr-items").appendChild(el);
  TS.sfx("click");
  const it = free.sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
  it.busy = true;
  free.slice(1).forEach((o) => { if (Math.random() < 0.5) later(() => bubble(o, TS.rand(NOSNACK)), 500); });
  later(() => moveTo(it, x + (it.x < x ? -4 : 4), 0.2, () => {
    if (!root) return;
    el.classList.add("eaten"); setTimeout(() => el.remove(), 350);
    play(it, "eat"); bubble(it, lineOf(it, ["equip"], "냠냠! 맛있어!")); hearts(it, ["💗", "✨", "😋"]); love(it); TS.sfx("coin");
    later(() => (it.busy = false), 1800);
  }), 450);
}
/* ⚽ 공 */
function throwBall(x, kicks = 0) {
  if (!ball) { ball = document.createElement("span"); ball.className = "pr-ball"; ball.textContent = "⚽"; root.querySelector(".pr-items").appendChild(ball); ball.style.left = "50%"; }
  const b = ball; b.dataset.k = kicks;
  b.classList.remove("fly"); void b.offsetWidth; b.classList.add("fly");
  b.style.left = Math.max(6, Math.min(94, x)) + "%";
  TS.sfx("click");
  const free = chars.filter((c) => !c.busy); if (!free.length) return;
  const it = free.sort((a, b2) => Math.abs(a.x - x) - Math.abs(b2.x - x))[0];
  it.busy = true;
  free.slice(1).forEach((o) => moveTo(o, x + (o.x < x ? -14 : 14), 0.4));
  later(() => moveTo(it, x + (it.x < x ? -3 : 3), 0.18, () => {
    if (!root || ball !== b) { it.busy = false; return; }
    play(it, TS.rand(["happy", "proud"])); hearts(it, ["⭐", "💫", "💗"]); TS.sfx("poke");
    if (kicks === 0) { bubble(it, lineOf(it, ["cheer", "done"], "에잇!")); love(it); }
    later(() => { it.busy = false; if (root && ball === b && kicks < 2) throwBall(8 + Math.random() * 84, kicks + 1); }, 700);
  }), 380);
}
/* 🫧 비눗방울 */
function blow(x, y) {
  for (let i = 0; i < 7; i++) {
    const s = document.createElement("span"); s.className = "pr-bb";
    s.style.left = x + (Math.random() * 10 - 5) + "%"; s.style.top = y + "%";
    s.style.setProperty("--dx", Math.random() * 120 - 60 + "px"); s.style.setProperty("--sz", 16 + Math.random() * 26 + "px");
    s.style.animationDelay = i * 0.08 + "s";
    root.querySelector(".pr-items").appendChild(s); setTimeout(() => s.remove(), 3600);
  }
  TS.sfx("click");
  const near = chars.filter((c) => !c.busy).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
  if (near) { moveTo(near, x, 0.35, () => { play(near, "surprise"); if (Math.random() < 0.6) { bubble(near, lineOf(near, ["idle"], "우와~")); love(near); } }); }
}
/* 🎵 춤 */
function dance() {
  chars.forEach((it, i) => later(() => { if (it.busy) return; play(it, "dance"); hearts(it, ["🎵", "🎶", "✨"]); if (i === 0) { bubble(it, lineOf(it, ["done", "cheer"], "신난다~!")); love(it); } it.el.classList.remove("boing"); void it.el.offsetWidth; it.el.classList.add("boing"); }, i * 180));
  TS.sfx("level");
}

function onClick(e) {
  const t = e.target.closest("[data-tool]"); if (t) return setTool(t.dataset.tool);
  const b = e.target.closest("[data-pr]"); if (!b) return;
  const k = b.dataset.pr;
  if (k === "close") close();
  else if (k === "bg") root.querySelector(".pr-bg").style.backgroundImage = `url('${randomBg()}')`;
  else if (k === "swap") { loops.forEach(clearTimeout); loops = []; if (ball) { ball.remove(); ball = null; } spawn(); }
  else if (k === "dance") dance();
  else if (k === "knock") { close(); window.KnockGame.open(); }
}

/* ───── 여는 곳 ───── */
const anchor = document.getElementById("talk-btn") || document.getElementById("pip-btn");
if (anchor) {
  const old = document.getElementById("knock-btn"); if (old) old.remove(); // 꿀밤 타임은 놀아주기 안의 🔨 로
  const b = document.createElement("button");
  b.className = "btn white small"; b.id = "play-btn"; b.textContent = "🧶 놀아주기"; b.title = "사도들과 놀아 주기 (간식 · 공 · 쓰다듬기)";
  b.onclick = () => open(); anchor.after(b);
}
// 화면보호기 안에서도: 아래 버튼 줄에 추가 (지금 배경 그대로)
new MutationObserver(() => {
  const ctrl = document.querySelector("#ss .ss-ctrl");
  if (!ctrl || ctrl.querySelector("[data-prss]")) return;
  const b = document.createElement("button");
  b.className = "btn yellow small"; b.dataset.prss = 1; b.textContent = "🧶 놀아주기";
  b.onclick = (e) => { e.stopPropagation(); const cur = document.querySelector("#ss .ss-bg.on"); const m = cur && /url\(["']?([^"')]+)/.exec(cur.style.backgroundImage || ""); open(m ? m[1] : null); };
  ctrl.prepend(b);
}).observe(document.body, { childList: true });
window.Playroom = { open, close };
})();
