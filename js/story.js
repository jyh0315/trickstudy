/* =========================================================
   📖 스토리 — 게임 대화 장면처럼 재생 (배경 + 움직이는 사도 + 대사창)
   - 대본(STORY, story-data.js)을 한 줄씩 읽어서 연출
   - 공부 시간으로 다음 화가 열림 (STORY_MIN_PER_EP 분마다 1화, 첫 화는 무료)

   대본 한 줄 형식 (필요한 것만 적으면 됨)
     { bg: "assets/ssbg/012.webp" }            배경 바꾸기
     { loc: "요정 마을 광장" }                    장소 표시
     { title: "챕터 1", sub: "최소한 잼은 발라줘" } 제목 카드
     { in: "erpin", at: "L" }                   사도 등장 (L·C·R)  · { out: "erpin" } 퇴장
     { s: "erpin", t: "대사 *강조할 말*", f: "happy", e: "!", st: "shout" }   (*…* 는 초록색 강조)
         s = 말하는 사도(id) 또는 "me"(교주) / f = 표정·동작 / e = 감정 스티커 / st = shout·think
     { n: "나레이션" }  { shake: 1 }  { flash: 1 }  { wait: 800 }
     { choice: ["보기1", "보기2"], r: ["보기1 고르면 나올 대사", "보기2 대사"] }  (r는 교주 대신 첫 사도가 반응)
   f(표정): happy angry sad surprise shy dizzy proud talk eat dance touch pat tickle
   e(스티커): ! ? !? ♥ 💧 💢 … ✨ 💡
   ========================================================= */
const STORY_MIN_PER_EP = 60;

(() => {
"use strict";
const TS = window.TS;
const $ = (id) => document.getElementById(id);
const esc = TS.esc;
const S = () => TS.state;

function st() { const s = S(); if (!s.story) s.story = { base: s.stats.totalMin, seen: [] }; return s.story; }
const allEps = () => STORY.flatMap((ch) => ch.eps.map((ep) => ({ ...ep, ch })));
// 열린 화 수: 첫 화 + (기능을 처음 연 뒤 공부한 시간 / 60분)
const studied = () => Math.max(0, S().stats.totalMin - st().base);
const unlockedN = () => 1 + Math.floor(studied() / STORY_MIN_PER_EP);
const nextIn = () => STORY_MIN_PER_EP - (studied() % STORY_MIN_PER_EP);

/* ───── 스토리 탭 ───── */
function render() {
  const el = $("view-story");
  const eps = allEps(), open = unlockedN(), seen = new Set(st().seen);
  const firstNew = eps.findIndex((e, i) => i < open && !seen.has(e.id));
  el.innerHTML = `
    <div class="card story-head">
      <h2 class="ribbon">메인 스토리</h2>
      <p>공부를 <b>${STORY_MIN_PER_EP}분</b> 할 때마다 다음 화가 열려요.
        ${open < eps.length ? `다음 화까지 <b>${nextIn()}분</b> 남았어요.` : "지금 있는 이야기는 모두 열렸어요!"}</p>
      <div class="story-prog"><span class="bar"><i style="width:${(((STORY_MIN_PER_EP - nextIn()) / STORY_MIN_PER_EP) * 100).toFixed(1)}%"></i></span>
        <small>${Math.min(open, eps.length)} / ${eps.length}화 열림 · 본 화 ${seen.size}</small></div>
      ${firstNew >= 0 ? `<button class="btn yellow" data-play="${eps[firstNew].id}">▶ 이어 보기 — ${esc(eps[firstNew].title)}</button>` : ""}
    </div>
    ${STORY.map((ch) => `<div class="card story-ch">
      <h3 class="card-title">${esc(ch.season)} · ${esc(ch.name)} <small>${esc(ch.title)}</small></h3>
      <ol class="story-eps">${ch.eps.map((ep) => {
        const i = eps.findIndex((x) => x.id === ep.id), lock = i >= open;
        return `<li class="${lock ? "lock" : ""} ${seen.has(ep.id) ? "seen" : ""}">
          <button ${lock ? "disabled" : ""} data-play="${ep.id}">
            <b>${i + 1}화</b><span>${esc(ep.title)}</span>
            <em>${lock ? `🔒 공부 ${(i - open + 1) * STORY_MIN_PER_EP - (STORY_MIN_PER_EP - nextIn())}분 더` : seen.has(ep.id) ? "✔ 다시 보기" : "NEW"}</em>
          </button></li>`;
      }).join("")}</ol>
    </div>`).join("")}
    ${STORY.length ? "" : '<div class="card"><p class="hint">메인 스토리를 준비하고 있어요. 곧 시즌 1부터 올라와요!</p></div>'}
    <p class="hint">줄거리는 원작 메인 스토리를 바탕으로 하고, 세부 대사는 새로 쓴 팬 창작이에요.</p>`;
  el.querySelectorAll("[data-play]").forEach((b) => (b.onclick = () => play(b.dataset.play)));
}
TS.views.story = render;

/* ───── 재생기 ───── */
const SLOTS = { L: "26%", C: "50%", R: "70%" };
const STICKER = { "!": "❗", "?": "❓", "!?": "⁉️", "♥": "💗", "💧": "💧", "💢": "💢", "…": "💬", "✨": "✨", "💡": "💡" };
let P = null; // 재생 중 상태

function play(epId) {
  const ep = allEps().find((e) => e.id === epId);
  if (!ep || P) return;
  const root = document.createElement("div");
  root.id = "story";
  // 게임(트릭컬 스토리) 화면과 같은 1280×640 무대를 만들고 화면 크기에 맞춰 통째로 확대·축소
  root.innerHTML = `<div class="sp-zone">
    <div class="sp-bg"></div><div class="sp-bg next"></div>
    <div class="sp-stage"></div>
    <div class="sp-loc hidden"></div>
    <div class="sp-titlecard hidden"><small></small><b></b></div>
    <div class="sp-choice hidden"></div>
    <div class="sp-box narr">
      <div class="sp-pf"><span class="sp-pf-in"></span></div>
      <div class="sp-name"><span></span></div>
      <div class="sp-text"></div>
      <span class="sp-next"></span>
    </div>
    <div class="sp-ctrl">
      <button class="sp-btn" data-c="nextep" title="다 보면 다음 화 바로 재생">다음화<br>자동재생</button>
      <button class="sp-btn" data-c="auto" title="대사 자동 넘김">대사<br><b>AUTO</b></button>
      <button class="sp-btn menu" data-c="menu" title="메뉴"><i></i><i></i><i></i></button>
      <div class="sp-menu hidden">
        <button data-c="log">📜 지난 대사</button>
        <button data-c="skip">⏭ 건너뛰기</button>
        <button data-c="close">🚪 나가기</button>
      </div>
    </div>
    <div class="sp-log hidden"><div class="sp-log-in"></div><button class="btn white small" data-c="logclose">닫기</button></div>
  </div>`;
  document.body.appendChild(root);
  document.body.classList.add("story-open");
  P = { ep: { ...ep, lines: ep.lines.slice() }, root, i: -1, actors: {}, typing: null, auto: false, autoT: 0, log: [], wait: false, done: false };
  if (window.BGM && window.BGM.pauseFor) window.BGM.pauseFor("story");
  root.addEventListener("click", (e) => {
    const c = e.target.closest("[data-c]");
    if (c) return ctrl(c.dataset.c);
    if (e.target.closest(".sp-choice, .sp-log")) return;
    advance();
  });
  document.addEventListener("keydown", onKey);
  fit(); window.addEventListener("resize", fit);
  syncBtns();
  advance();
}
function fit() {
  if (!P) return;
  const k = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
  P.root.querySelector(".sp-zone").style.transform = `translate(-50%, -50%) scale(${k})`;
}
function onKey(e) {
  if (!P) return;
  if (e.key === "Escape") return close();
  if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") { e.preventDefault(); advance(); }
}
function ctrl(c) {
  const menu = P.root.querySelector(".sp-menu");
  if (c !== "menu") menu.classList.add("hidden");
  if (c === "menu") return menu.classList.toggle("hidden");
  if (c === "nextep") { st().nextAuto = !st().nextAuto; TS.save(); return syncBtns(); }
  if (c === "close") return close();
  if (c === "auto") { P.auto = !P.auto; syncBtns(); if (P.auto && !P.typing && !P.wait) scheduleAuto(); return; }
  if (c === "skip") { // 선택지·끝까지 건너뛰기
    while (P.i < P.ep.lines.length - 1) {
      const L = P.ep.lines[P.i + 1];
      if (L.choice) break;
      P.i++;
      silentApply(L);
    }
    finishTyping();
    return advance();
  }
  if (c === "log") {
    const lg = P.root.querySelector(".sp-log");
    lg.querySelector(".sp-log-in").innerHTML = P.log.map((x) => `<p>${x.who ? `<b>${esc(x.who)}</b>` : ""}${esc(x.t)}</p>`).join("") || "<p>아직 대사가 없어요.</p>";
    lg.classList.remove("hidden");
    return;
  }
  if (c === "logclose") P.root.querySelector(".sp-log").classList.add("hidden");
}
// 건너뛸 때 배경·등장인물만 맞춰 둠
function silentApply(L) {
  if (L.bg) setBg(L.bg, true);
  if (L.in) enter(L.in, L.at || "C");
  if (L.out) leave(L.out);
  if (L.s || L.n) P.log.push({ who: L.s ? nameOf(L.s) : "", t: fmtT(L.t || L.n) });
}
function syncBtns() {
  P.root.querySelector('[data-c="auto"]').classList.toggle("on", P.auto);
  P.root.querySelector('[data-c="nextep"]').classList.toggle("on", !!st().nextAuto);
}
function scheduleAuto() { clearTimeout(P.autoT); if (P.auto) P.autoT = setTimeout(advance, 1400); }

function advance() {
  if (!P || P.wait) return;
  if (P.typing) return finishTyping();
  clearTimeout(P.autoT);
  P.i++;
  const L = P.ep.lines[P.i];
  if (!L) return end();
  run(L);
}
function run(L) {
  const box = P.root.querySelector(".sp-box");
  let speak = false;
  if (L.bg) setBg(L.bg);
  if (L.in) enter(L.in, L.at || "C", L.f);
  if (L.out) leave(L.out);
  if (L.loc) showLoc(L.loc);
  if (L.shake) { P.root.classList.remove("shake"); void P.root.offsetWidth; P.root.classList.add("shake"); TS.sfx("poke"); }
  if (L.flash) { P.root.classList.remove("flash-w"); void P.root.offsetWidth; P.root.classList.add("flash-w"); }
  if (L.title) return titleCard(L);
  if (L.choice) return choice(L);
  if (L.s || L.n) {
    speak = true;
    const me = L.s === "me", who = L.s ? nameOf(L.s) : "";
    // 나레이션은 프로필·이름표 없이 가운데 정렬
    box.className = "sp-box" + (L.st ? " " + L.st : "") + (L.s ? "" : " narr");
    if (L.st === "shout") { box.style.animation = "none"; void box.offsetWidth; box.style.animation = ""; }
    if (L.s) {
      P.root.querySelector(".sp-name span").textContent = who;
      const c = TS.SADO_MAP[L.s];
      P.root.querySelector(".sp-pf-in").innerHTML = c ? `<img src="${TS.chibiSrc(c)}" alt="">` : `<b>${me ? "📖" : esc(who.slice(0, 1))}</b>`;
    }
    // 말하는 사도는 밝게, 나머지는 살짝 어둡게
    for (const [id, a] of Object.entries(P.actors)) a.el.classList.toggle("dim", !!L.s && !me && id !== L.s);
    const a = P.actors[L.s];
    if (a) {
      if (L.f && a.live) a.live.play(L.f);
      a.el.classList.remove("talk"); void a.el.offsetWidth; a.el.classList.add("talk");
      if (L.e) sticker(a, L.e);
    }
    const t = fmtT(L.t || L.n);
    P.log.push({ who, t: t.replace(/\*/g, "") });
    type(t);
  }
  if (L.wait) { P.wait = true; setTimeout(() => { if (!P) return; P.wait = false; advance(); }, L.wait); return; }
  if (!speak) advance(); // 대사가 없는 줄은 바로 다음
}
const fmtT = (t) => String(t || "").replace(/\{me\}/g, S().name || "교주").replace(/\{partner\}/g, (TS.SADO_MAP[S().partner] || {}).name || "");
const nameOf = (id) => (id === "me" ? S().name || "교주" : (TS.SADO_MAP[id] || {}).name || id);
const colorOf = (id) => (id === "me" ? "#ff7fa8" : (PERS[(TS.SADO_MAP[id] || {}).pers] || {}).color || "#7d8aa0");

// *강조* → 초록 글씨. 글자마다 <span>을 미리 깔아 두고 하나씩 보이게 해서 줄바꿈·위치가 흔들리지 않음
function type(text) {
  const el = P.root.querySelector(".sp-text");
  const chars = [];
  text.split(/(\*[^*]+\*)/).forEach((part) => {
    const hl = /^\*[^*]+\*$/.test(part);
    [...(hl ? part.slice(1, -1) : part)].forEach((ch) => chars.push(`<span${hl ? ' class="hl"' : ""}>${esc(ch)}</span>`));
  });
  el.innerHTML = `<div class="sp-tx">${chars.join("")}</div>`;
  P.spans = [...el.querySelectorAll("span")];
  P.root.querySelector(".sp-next").classList.remove("on");
  let k = 0;
  const step = () => {
    if (!P) return;
    for (let n = 0; n < 2 && k < P.spans.length; n++) P.spans[k++].classList.add("on"); // 한 번에 2글자
    if (k >= P.spans.length) { P.typing = null; P.root.querySelector(".sp-next").classList.add("on"); scheduleAuto(); return; }
    P.typing = setTimeout(step, 30);
  };
  P.typing = setTimeout(step, 30);
}
function finishTyping() {
  if (!P.typing) return;
  clearTimeout(P.typing); P.typing = null;
  P.spans.forEach((x) => x.classList.add("on"));
  P.root.querySelector(".sp-next").classList.add("on");
  scheduleAuto();
}
function setBg(src, instant) {
  const [a, b] = P.root.querySelectorAll(".sp-bg");
  const cur = a.classList.contains("next") ? b : a, nx = cur === a ? b : a;
  nx.style.backgroundImage = `url('${src}')`;
  P.root.style.setProperty("--spbg", `url('${new URL(src, location.href).href}')`); // 무대 밖 여백은 흐린 배경으로
  nx.classList.remove("next"); cur.classList.add("next");
  if (instant) nx.style.transition = "none"; else nx.style.transition = "";
}
function enter(id, at, f) {
  if (P.actors[id]) { P.actors[id].el.style.left = SLOTS[at] || at; return; }
  const c = TS.SADO_MAP[id];
  if (!c) return;
  const el = document.createElement("div");
  el.className = "sp-actor";
  el.style.left = SLOTS[at] || at;
  el.innerHTML = `<div class="sp-sticker"></div>`;
  P.root.querySelector(".sp-stage").appendChild(el);
  const a = { id, el, live: null };
  const fallback = () => { if (!el.querySelector(".sp-img")) el.insertAdjacentHTML("beforeend", `<img class="sp-img" src="${TS.chibiSrc(c)}" alt="">`); };
  a.live = window.Live ? window.Live.mount(el, id, { frame: "story", onReady: (ctrl) => { a.ctrl = ctrl; if (f) a.live.play(f); }, onFail: fallback }) : null;
  if (!a.live) fallback();
  P.actors[id] = a;
  requestAnimationFrame(() => el.classList.add("in"));
}
function leave(id) {
  const a = P.actors[id];
  if (!a) return;
  delete P.actors[id];
  a.el.classList.add("out");
  setTimeout(() => { if (a.live) a.live.dispose(); a.el.remove(); }, 500);
}
function sticker(a, e) {
  const s = a.el.querySelector(".sp-sticker");
  s.textContent = STICKER[e] || e;
  s.classList.remove("on"); void s.offsetWidth; s.classList.add("on");
}
function showLoc(text) {
  const el = P.root.querySelector(".sp-loc");
  el.textContent = "📍 " + text;
  el.classList.remove("hidden", "on"); void el.offsetWidth; el.classList.add("on");
}
function titleCard(L) {
  const el = P.root.querySelector(".sp-titlecard");
  el.querySelector("small").textContent = L.title;
  el.querySelector("b").textContent = L.sub || "";
  el.classList.remove("hidden");
  P.wait = true;
  TS.sfx("r2");
  setTimeout(() => { if (!P) return; el.classList.add("hidden"); P.wait = false; advance(); }, 2600);
}
function choice(L) {
  const el = P.root.querySelector(".sp-choice");
  P.wait = true;
  el.innerHTML = L.choice.map((t, i) => `<button data-ci="${i}">${esc(fmtT(t))}</button>`).join("");
  el.classList.remove("hidden");
  el.querySelectorAll("[data-ci]").forEach((b) => (b.onclick = (e) => {
    e.stopPropagation();
    el.classList.add("hidden");
    P.wait = false;
    TS.sfx("click");
    const k = +b.dataset.ci;
    P.log.push({ who: nameOf("me"), t: fmtT(L.choice[k]) });
    // 고른 보기에 대한 반응 한 줄을 끼워 넣음
    if (L.r && L.r[k]) P.ep.lines.splice(P.i + 1, 0, typeof L.r[k] === "string" ? { s: L.by || Object.keys(P.actors)[0], t: L.r[k] } : L.r[k]);
    advance();
  }));
}

/* 화 끝 */
function end() {
  if (P.done) return;
  P.done = true;
  const ep = P.ep, s = st(), first = !s.seen.includes(ep.id);
  if (first) { s.seen.push(ep.id); TS.addElif(50); }
  TS.save();
  const box = document.createElement("div");
  box.className = "sp-end";
  box.innerHTML = `<div class="sp-end-card">
      <h3>📖 ${esc(ep.title)} 끝!</h3>
      ${first ? '<p class="reward-chip"><i class="ic-elif"></i>+50 처음 본 보상</p>' : ""}
      <p class="hint">다음 화까지 공부 ${nextIn()}분</p>
      <button class="btn yellow" id="sp-endok">확인</button></div>`;
  P.root.appendChild(box);
  box.querySelector("#sp-endok").onclick = (e) => { e.stopPropagation(); close(); };
  // 다음화 자동재생: 열린 다음 화가 있으면 이어서
  const eps = allEps(), i = eps.findIndex((x) => x.id === ep.id), nx = eps[i + 1];
  if (s.nextAuto && nx && i + 1 < unlockedN()) setTimeout(() => { if (P && P.ep.id === ep.id) { close(); play(nx.id); } }, 1500);
}
function close() {
  if (!P) return;
  clearTimeout(P.typing); clearTimeout(P.autoT);
  Object.values(P.actors).forEach((a) => a.live && a.live.dispose());
  P.root.remove();
  P = null;
  document.body.classList.remove("story-open");
  document.removeEventListener("keydown", onKey);
  window.removeEventListener("resize", fit);
  if (window.BGM && window.BGM.resumeFrom) window.BGM.resumeFrom("story");
  if (TS.view === "story") render();
}

window.Story = { play, render };
})();
