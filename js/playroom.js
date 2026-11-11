/* =========================================================
   🧶 놀아주기 — 화면보호기 배경 위에서 펫이랑 놀고, 사도들은 옆에서 같이 쉬는 방
   역할을 나눔:
   - 🐾 펫 (내가 가진 펫 최대 4마리): 공 쫓기 · 간식 먹기 · 쓰다듬 받기 · 비눗방울 터뜨리기 · 폴짝
   - 🧑 사도 (대표 사도 + 1명): 펫을 돌보는 쪽. 공을 던져 주고, 간식을 챙겨 주고, 구경하며 한마디.
        사도끼리는 수다(교단 대화)와 티타임(간식 먹으며 쉬기), 춤
   - 도구: ✋ 손(펫: 콕·길게 쓰다듬기 / 사도: 말 걸기) · 🍖 펫 간식 · ⚽ 공 · 🫧 비눗방울
           ☕ 티타임 · 💬 수다 · 🎵 춤 · 🔨 꿀밤 타임
   - 사도와 이야기하거나 티타임을 하면 호감도 +1 (하루 15번까지)
   ========================================================= */
(() => {
"use strict";
const TS = window.TS, S = () => TS.state, esc = TS.esc;
const V = (id) => (typeof voiceOf === "function" ? voiceOf(id) : null) || {};
const AFF_DAILY = 15, MAX_PETS = 4;
const st = () => { const s = S(); if (!s.playroom) s.playroom = { day: "", n: 0, total: 0, tool: "hand" }; if (s.playroom.day !== TS.today()) { s.playroom.day = TS.today(); s.playroom.n = 0; } return s.playroom; };
const TOOLS = [
  { k: "hand", i: "✋", t: "손", d: "펫: 누르면 폴짝, 길게 누르면 쓰다듬기 · 사도: 누르면 말 걸기" },
  { k: "snack", i: "🍖", t: "펫 간식", d: "바닥을 누르면 사도가 펫 간식을 놓아 줘요" },
  { k: "ball", i: "⚽", t: "공", d: "누른 곳으로 사도가 공을 던져 주고, 펫이 물어 와요" },
  { k: "bubble", i: "🫧", t: "비눗방울", d: "누른 곳에서 비눗방울이 올라가요. 펫이 터뜨리러 와요" },
];
const PET_SNACKS = ["🍖", "🦴", "🐟", "🥕", "🧀"], TEA = ["🍰", "🧁", "🍩", "🥐", "🍪", "☕"];
const PET_SOUND = ["♪", "!", "♥", "?", "…zZ", "✨"];
// 사도가 펫을 보며 하는 말 (말투는 voiceOf().s: ban 반말 / 그 외 존댓말)
const WATCH = {
  ban: ["잘한다, 잘한다!", "저 녀석, 아까보다 빨라졌는데?", "귀엽긴… 흥.", "간식은 하나씩만 줘야 해.", "쟤는 맨날 저기서만 자더라.", "한 번 더 던져 볼까?"],
  jon: ["잘하네요, 착하다~", "아까보다 빨라졌어요!", "보고만 있어도 마음이 편해져요.", "간식은 하나씩만 주세요.", "저 아이는 늘 저기서 자더라고요.", "한 번 더 던져 볼까요?"],
};
const THROW = { ban: ["자, 간다!", "물어 와!", "에잇!"], jon: ["자, 갑니다!", "물어 오세요~", "에잇!"] };
const FEED = { ban: ["자, 간식이다.", "천천히 먹어.", "많이 먹고 커라."], jon: ["자, 간식이에요.", "천천히 먹어요.", "많이 먹고 크세요~"] };
const tone = (id) => (V(id).s === "ban" ? "ban" : "jon");

let root = null, sados = [], pets = [], tool = "hand", loops = [], ball = null, guest = false;
const later = (fn, ms) => { const t = setTimeout(fn, ms); loops.push(t); return t; };

function randomBg() {
  const L = typeof SS_BACKGROUNDS !== "undefined" ? SS_BACKGROUNDS : [];
  const good = ["017", "026", "041", "062", "070", "078", "084", "098", "105", "112", "117", "120", "136", "139", "140", "141", "144", "157"].filter((n) => L.includes(n));
  return `assets/ssbg/${TS.rand(good.length ? good : L)}.webp`;
}
function pickPets() {
  const P = S().pets || { owned: {}, cur: "" }, map = typeof PET_MAP !== "undefined" ? PET_MAP : {};
  const owned = Object.keys(P.owned || {}).filter((id) => map[id]).sort(() => Math.random() - 0.5);
  const list = [P.cur, ...owned.filter((id) => id !== P.cur)].filter((id) => map[id]).slice(0, MAX_PETS).map((id) => map[id]);
  guest = !list.length;
  // 펫이 아직 없으면 놀러 온 손님 펫 두 마리
  return list.length ? list : (typeof PETS !== "undefined" ? PETS.slice().sort(() => Math.random() - 0.5).slice(0, 2) : []);
}
function pickSados() {
  const s = S(), others = Object.keys(s.owned).filter((id) => TS.SADO_MAP[id] && id !== s.partner);
  // 대표 사도와 '교단 대화'가 있는 사도를 먼저 (수다를 떨 수 있게)
  const talks = typeof SADO_TALKS !== "undefined" ? SADO_TALKS : [];
  const pals = others.filter((id) => talks.some((t) => { const w = new Set(t.map((x) => x[0])); return w.size === 2 && w.has(id) && w.has(s.partner); }));
  const second = pals.length ? TS.rand(pals) : others.length ? TS.rand(others) : null;
  return [s.partner, second].filter(Boolean);
}

function open(bg) {
  if (root) return;
  tool = st().tool || "hand"; if (!TOOLS.some((t) => t.k === tool)) tool = "hand";
  root = document.createElement("div");
  root.className = "pr-ov";
  root.innerHTML = `<div class="pr-bg" style="background-image:url('${bg && !/\.webm$/.test(bg) ? bg : randomBg()}')"></div><div class="pr-shade"></div>
    <div class="pr-top"><b>🧶 놀아주기</b><span class="pr-aff"></span>
      <button class="btn white small" data-pr="bg" title="배경 바꾸기">🏞️</button><button class="btn white small" data-pr="swap" title="다른 사도·펫 부르기">👥</button>
      <button class="btn red small" data-pr="close" title="나가기 (Esc)">✕ 나가기</button></div>
    <div class="pr-field"><div class="pr-sados"></div><div class="pr-items"></div><div class="pr-pets"></div></div>
    <div class="pr-tip"></div>
    <div class="pr-tools">${TOOLS.map((t) => `<button data-tool="${t.k}" title="${t.d}"><i>${t.i}</i><span>${t.t}</span></button>`).join("")}
      <span class="pr-sep"></span>
      <button data-pr="tea" title="사도들 티타임"><i>☕</i><span>티타임</span></button>
      <button data-pr="chat" title="사도들 수다"><i>💬</i><span>수다</span></button>
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
  sados.forEach((c) => c.live && c.live.dispose()); sados = []; pets = []; ball = null;
  document.removeEventListener("keydown", onKey);
  root.remove(); root = null; TS.save();
}
const onKey = (e) => { if (e.key === "Escape" && root) { e.stopPropagation(); close(); } };
function hud() {
  if (!root) return; const p = st();
  root.querySelector(".pr-aff").textContent = p.n >= AFF_DAILY ? "💗 오늘 호감도 다 받음" : `💗 오늘 호감도 ${p.n} / ${AFF_DAILY}`;
}
function tip(text) { if (root) root.querySelector(".pr-tip").textContent = text; }
function setTool(k) {
  tool = k; st().tool = k;
  root.querySelectorAll("[data-tool]").forEach((b) => b.classList.toggle("on", b.dataset.tool === k));
  tip(TOOLS.find((t) => t.k === k).d);
  root.dataset.tool = k;
}

/* ───── 등장 ───── */
function spawn() {
  loops.forEach(clearTimeout); loops = [];
  sados.forEach((c) => { c.el.remove(); c.live && c.live.dispose(); }); sados = [];
  pets.forEach((p) => p.el.remove()); pets = [];
  if (ball) { ball.remove(); ball = null; }
  // 사도: 양옆에 서 있음 (왼쪽 사도는 오른쪽을 보게 뒤집음)
  pickSados().forEach((id, i, all) => {
    const c = TS.SADO_MAP[id], left = i === 0;
    const el = document.createElement("div");
    el.className = "pr-sado " + (left ? "L" : "R");
    el.innerHTML = `<div class="pr-bub"></div><div class="pr-body"><img class="pr-pic" src="${TS.chibiSrc(c)}" alt=""></div><span class="pr-name">${esc(TS.shortName(c))}</span>`;
    root.querySelector(".pr-sados").appendChild(el);
    const it = { id, c, el, x: left ? 14 : 86, busy: false, ctrl: null, live: null, left };
    const body = el.querySelector(".pr-body");
    if (window.Live && window.Live.canLive && window.Live.canLive(id)) it.live = window.Live.mount(body, id, { frame: "body", onReady: (ctrl) => { it.ctrl = ctrl; body.classList.add("ok"); } });
    sados.push(it);
  });
  // 펫: 가운데 바닥을 돌아다님
  pickPets().forEach((p, i, all) => {
    const el = document.createElement("div");
    el.className = "pr-pet";
    el.innerHTML = `<span class="pr-pbub"></span><img src="${p.img}" alt="" draggable="false"><span class="pr-name">${esc(p.name)}</span>`;
    root.querySelector(".pr-pets").appendChild(el);
    const x = 28 + ((i + 0.5) * 44) / all.length;
    const it = { p, el, x, busy: false };
    el.style.left = x + "%";
    pets.push(it);
    later(() => wander(it), 800 + Math.random() * 2500);
  });
  if (guest) later(() => sayS(sados[0], tone(sados[0].id) === "ban" ? "어? 못 보던 애들이 놀러 왔네. 펫을 데려오면 같이 놀 수 있어!" : "어머, 손님 펫이 놀러 왔어요. 펫을 데려오면 같이 놀 수 있어요!"), 900);
  later(idleWatch, 7000 + Math.random() * 5000);
}
/* 펫: 어슬렁 */
function wander(it) {
  if (!root || !pets.includes(it)) return;
  if (!it.busy) {
    const r = Math.random();
    if (r < 0.6) petMove(it, 24 + Math.random() * 52, 0.7);
    else if (r < 0.8) { hop(it); petSay(it, TS.rand(PET_SOUND)); }
    else if (r < 0.9) { it.el.classList.add("nap"); petSay(it, "…zZ"); later(() => it.el.classList.remove("nap"), 3500); }
  }
  later(() => wander(it), 2400 + Math.random() * 4000);
}
function petMove(it, x, speed = 0.3, done) {
  x = Math.max(22, Math.min(78, x));
  const ms = Math.max(220, Math.abs(x - it.x) * speed * 60);
  it.el.classList.remove("nap");
  it.el.classList.toggle("flip", x > it.x); // 펫 그림은 왼쪽을 봄
  it.el.classList.add("walk");
  it.el.style.transitionDuration = ms + "ms";
  it.el.style.left = x + "%"; it.x = x;
  clearTimeout(it.moveT);
  it.moveT = later(() => { it.el.classList.remove("walk"); done && done(); }, ms);
}
function hop(it) { it.el.classList.remove("hop"); void it.el.offsetWidth; it.el.classList.add("hop"); }
function petSay(it, t) { const b = it.el.querySelector(".pr-pbub"); b.textContent = t; b.classList.add("on"); clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove("on"), 1300); }
function fx(host, emo) {
  for (let i = 0; i < 4; i++) { const h = document.createElement("span"); h.className = "pr-heart"; h.textContent = TS.rand(emo); h.style.left = 25 + Math.random() * 50 + "%"; h.style.animationDelay = i * 0.1 + "s"; host.appendChild(h); setTimeout(() => h.remove(), 1600); }
}
/* 사도 */
function sayS(it, text) {
  if (!it) return;
  const b = it.el.querySelector(".pr-bub");
  b.textContent = text.length > 40 ? text.slice(0, 39) + "…" : text; b.classList.add("on");
  clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove("on"), 2800);
}
function act(it, kind) { try { it && it.ctrl && it.ctrl.play(kind); } catch (e) { /* 무시 */ } }
function love(it) {
  const p = st(); p.total = (p.total || 0) + 1;
  if (p.n < AFF_DAILY && window.Affection && window.Affection.gain) { p.n++; window.Affection.gain(it.id, 1); }
  hud();
}
const nearS = (x) => sados.slice().sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
const lineOf = (it, keys, fb) => { const v = V(it.id); for (const k of keys) if (v[k] && v[k].length) return TS.rand(v[k]); return fb; };
/* 가만히 두면 사도가 펫을 보며 한마디 */
function idleWatch() {
  if (!root) return;
  const it = TS.rand(sados);
  if (it && !it.busy && !talking) sayS(it, TS.rand(WATCH[tone(it.id)]));
  later(idleWatch, 9000 + Math.random() * 8000);
}

/* ───── 누르기 ───── */
const fieldPos = (e) => { const r = root.querySelector(".pr-field").getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }; };
let hold = null;
function onDown(e) {
  if (!root) return;
  const pe = e.target.closest(".pr-pet"), pet = pe && pets.find((c) => c.el === pe);
  const se = e.target.closest(".pr-sado"), sado = se && sados.find((c) => c.el === se);
  const pos = fieldPos(e);
  if (sado) { // 사도는 어떤 도구든 '말 걸기'
    if (sado.busy || talking) return;
    act(sado, "talk"); sayS(sado, lineOf(sado, ["idle"], "응?")); love(sado); TS.sfx("click");
    return;
  }
  if (tool === "hand") {
    if (!pet) { pets.filter((c) => !c.busy).forEach((c, i) => petMove(c, pos.x + (i - 1) * 7, 0.3)); return; } // 빈 곳: 펫들이 모여듦
    hold = { it: pet, t: Date.now(), pat: false };
    hold.timer = setTimeout(() => {
      if (!hold || hold.it !== pet) return;
      hold.pat = true; pet.busy = true; pet.el.classList.remove("nap"); pet.el.classList.add("pat");
      petSay(pet, "♥"); fx(pet.el, ["💗", "💕", "💖"]); TS.sfx("coin");
      hold.loop = setInterval(() => fx(pet.el, ["💗", "💕"]), 800);
      const s = nearS(pet.x); if (s && !s.busy) later(() => sayS(s, tone(s.id) === "ban" ? "좋아하네. 꼬리 좀 봐." : "좋아하네요. 꼬리 좀 보세요~"), 700);
    }, 420);
    return;
  }
  if (tool === "snack") return feed(pos.x);
  if (tool === "ball") return throwBall(pos.x);
  if (tool === "bubble") return blow(pos.x, pos.y);
}
function onUp() {
  if (!hold) return;
  const h = hold; hold = null; clearTimeout(h.timer); clearInterval(h.loop);
  const it = h.it;
  if (h.pat) { it.el.classList.remove("pat"); later(() => (it.busy = false), 500); }
  else if (Date.now() - h.t < 420) { hop(it); petSay(it, TS.rand(["!", "♪", "?"])); TS.sfx("poke"); }
}

/* 🍖 펫 간식: 사도가 놓아 주고 펫이 먹음 */
function feed(x) {
  x = Math.max(24, Math.min(76, x));
  const free = pets.filter((c) => !c.busy); if (!free.length) return;
  const s = nearS(x); if (s && !s.busy) { act(s, "happy"); sayS(s, TS.rand(FEED[tone(s.id)])); }
  const el = document.createElement("span");
  el.className = "pr-snack"; el.textContent = TS.rand(PET_SNACKS); el.style.left = x + "%";
  root.querySelector(".pr-items").appendChild(el);
  TS.sfx("click");
  const it = free.sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
  it.busy = true;
  free.slice(1).forEach((o) => { if (Math.random() < 0.6) later(() => { petMove(o, x + (o.x < x ? -9 : 9), 0.4); petSay(o, "…!"); }, 400); });
  later(() => petMove(it, x + (it.x < x ? -3 : 3), 0.2, () => {
    if (!root) return;
    el.classList.add("eaten"); setTimeout(() => el.remove(), 350);
    it.el.classList.add("munch"); petSay(it, "냠"); fx(it.el, ["✨", "💗", "😋"]); TS.sfx("coin");
    later(() => { it.el.classList.remove("munch"); it.busy = false; hop(it); }, 1500);
  }), 450);
}
/* ⚽ 공: 사도가 던져 주고 펫이 쫓아가 물어 옴 */
function throwBall(x) {
  x = Math.max(24, Math.min(76, x));
  const s = nearS(x);
  if (!ball) { ball = document.createElement("span"); ball.className = "pr-ball"; ball.textContent = "⚽"; root.querySelector(".pr-items").appendChild(ball); }
  const b = ball;
  if (s) { b.style.transitionDuration = "0ms"; b.style.left = s.x + (s.left ? 5 : -5) + "%"; void b.offsetWidth; b.style.transitionDuration = ""; if (!s.busy) { act(s, "proud"); sayS(s, TS.rand(THROW[tone(s.id)])); } }
  b.classList.remove("fly"); void b.offsetWidth; b.classList.add("fly");
  b.style.left = x + "%";
  TS.sfx("click");
  const free = pets.filter((c) => !c.busy); if (!free.length) return;
  const it = free.sort((a, b2) => Math.abs(a.x - x) - Math.abs(b2.x - x))[0];
  it.busy = true;
  free.slice(1).forEach((o) => later(() => petMove(o, x + (o.x < x ? -10 : 10), 0.35, () => hop(o)), 250));
  later(() => petMove(it, x, 0.16, () => {
    if (!root || ball !== b) { it.busy = false; return; }
    hop(it); petSay(it, "!"); TS.sfx("poke");
    // 물고 던져 준 사도에게 돌아감
    const back = s ? s.x + (s.left ? 9 : -9) : 50;
    later(() => {
      if (!root || ball !== b) { it.busy = false; return; }
      b.classList.remove("fly"); b.classList.add("carry"); b.style.transitionDuration = Math.abs(back - it.x) * 0.2 * 60 + "ms"; b.style.left = back + "%";
      petMove(it, back, 0.2, () => {
        b.classList.remove("carry"); b.style.transitionDuration = "";
        fx(it.el, ["⭐", "💫", "💗"]); petSay(it, "♪");
        if (s && !s.busy) { act(s, "happy"); sayS(s, tone(s.id) === "ban" ? "오, 물어 왔네! 잘했어." : "어머, 물어 왔어요! 잘했어요~"); }
        later(() => (it.busy = false), 600);
      });
    }, 450);
  }), 420);
}
/* 🫧 비눗방울: 펫이 쫓아와 폴짝 */
function blow(x, y) {
  for (let i = 0; i < 7; i++) {
    const s = document.createElement("span"); s.className = "pr-bb";
    s.style.left = x + (Math.random() * 10 - 5) + "%"; s.style.top = y + "%";
    s.style.setProperty("--dx", Math.random() * 120 - 60 + "px"); s.style.setProperty("--sz", 16 + Math.random() * 26 + "px");
    s.style.animationDelay = i * 0.08 + "s";
    root.querySelector(".pr-items").appendChild(s); setTimeout(() => s.remove(), 3600);
  }
  TS.sfx("click");
  pets.filter((c) => !c.busy).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x)).slice(0, 2).forEach((it, i) => later(() => petMove(it, x + (i ? 7 : -2), 0.3, () => { hop(it); petSay(it, TS.rand(["!", "♪"])); later(() => hop(it), 500); }), i * 200));
  const s = TS.rand(sados); if (s && !s.busy && Math.random() < 0.4) later(() => sayS(s, tone(s.id) === "ban" ? "예쁘다… 아, 터졌다." : "예쁘네요… 앗, 터졌어요."), 1200);
}

/* ☕ 티타임: 사도들이 간식 먹으며 쉼 */
function tea() {
  if (talking || sados.some((s) => s.busy)) return;
  sados.forEach((s, i) => {
    s.busy = true;
    const el = document.createElement("span"); el.className = "pr-tea"; el.textContent = TS.rand(TEA); s.el.appendChild(el);
    later(() => { act(s, "eat"); sayS(s, i === 0 ? lineOf(s, ["equip"], tone(s.id) === "ban" ? "잘 먹을게!" : "잘 먹겠습니다~") : tone(s.id) === "ban" ? "쉬는 시간엔 역시 단 거지." : "쉬는 시간엔 역시 단 게 최고예요."); fx(s.el, ["✨", "💗", "😋"]); love(s); }, 300 + i * 900);
    later(() => { el.remove(); s.busy = false; }, 3600);
  });
  // 펫들이 한 입만… 하고 모여듦
  pets.filter((c) => !c.busy).slice(0, 2).forEach((it, i) => later(() => { const s = sados[i % sados.length]; petMove(it, s.x + (s.left ? 12 : -12), 0.35, () => petSay(it, "…♥")); }, 1200));
  TS.sfx("coin");
}
/* 💬 수다: 둘의 '교단 대화'가 있으면 그걸, 없으면 각자 한마디씩 */
let talking = false;
function chat() {
  if (talking || sados.some((s) => s.busy)) return;
  const ids = sados.map((s) => s.id), talks = typeof SADO_TALKS !== "undefined" ? SADO_TALKS : [];
  const pool = talks.filter((t) => t.every((x) => ids.includes(x[0])) && new Set(t.map((x) => x[0])).size === Math.min(2, ids.length));
  const lines = pool.length ? TS.rand(pool) : sados.map((s) => [s.id, lineOf(s, ["idle"], "…")]);
  talking = true;
  let t = 0;
  lines.forEach(([id, text], k) => { later(() => { const s = sados.find((x) => x.id === id); if (!s) return; act(s, "talk"); sayS(s, text); if (k === 0) love(s); TS.sfx("click"); }, t); t += Math.min(3200, 1300 + text.length * 60); });
  later(() => (talking = false), t + 300);
}
/* 🎵 춤 */
function dance() {
  sados.forEach((it, i) => later(() => { if (it.busy) return; act(it, "dance"); fx(it.el, ["🎵", "🎶", "✨"]); if (i === 0) sayS(it, lineOf(it, ["done", "cheer"], "신난다~!")); }, i * 200));
  pets.forEach((it, i) => later(() => { if (it.busy) return; hop(it); later(() => hop(it), 450); later(() => hop(it), 900); petSay(it, "♪"); }, 150 + i * 120));
  TS.sfx("level");
}

function onClick(e) {
  const t = e.target.closest("button[data-tool]"); if (t) return setTool(t.dataset.tool); // (root 에도 data-tool 이 있어서 button 으로 한정)
  const b = e.target.closest("[data-pr]"); if (!b) return;
  const k = b.dataset.pr;
  if (k === "close") close();
  else if (k === "bg") root.querySelector(".pr-bg").style.backgroundImage = `url('${randomBg()}')`;
  else if (k === "swap") { talking = false; spawn(); }
  else if (k === "dance") dance();
  else if (k === "tea") tea();
  else if (k === "chat") chat();
  else if (k === "knock") { close(); window.KnockGame.open(); }
}

/* ───── 여는 곳 ───── */
const anchor = document.getElementById("talk-btn") || document.getElementById("pip-btn");
if (anchor) {
  const old = document.getElementById("knock-btn"); if (old) old.remove(); // 꿀밤 타임은 놀아주기 안의 🔨 로
  const b = document.createElement("button");
  b.className = "btn white small"; b.id = "play-btn"; b.textContent = "🧶 놀아주기"; b.title = "펫이랑 놀고 사도들과 쉬는 방";
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
