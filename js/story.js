/* =========================================================
   📖 스토리 — 게임 대화 장면처럼 재생 (배경 + 움직이는 사도 + 대사창)
   - 대본(STORY, story-data.js)을 한 줄씩 읽어서 연출
   - 공부 시간으로 다음 화가 열림 (STORY_MIN_PER_EP 분마다 1화, 첫 화는 무료)

   대본 한 줄 형식 (필요한 것만 적으면 됨)
     { bg: "assets/ssbg/012.webp" }            배경 바꾸기
     { loc: "요정 마을 광장" }                    장소 표시
     { title: "챕터 1", sub: "최소한 잼은 발라줘" } 제목 카드
     { in: "erpin", at: "L" }                   사도 등장 (L·C·R)  · { out: "erpin" } 퇴장
         왼쪽(L)에 선 사도는 자동으로 좌우 반전(오른쪽을 봄). flip: 1/0 으로 직접 지정, 대사 줄에 flip 을 주면 돌아봄
     { s: "erpin", t: "대사 *강조할 말*", f: "happy", e: "!", st: "shout" }   (*…* 는 초록색 강조)
         s = 말하는 사도(id) 또는 "me"(교주) / f = 표정·동작 / e = 감정 스티커 / st = shout·think
     { n: "나레이션" }  { shake: 1 }  { flash: 1 }  { wait: 800 }
     { cg: "assets/story/cg/s1c1/003.webp" }  CG 보이기 (.webm 이면 움직이는 CG) · { cg: "" } 닫기 · { clear: 1 } 무대의 사도 모두 퇴장
     { sfx: "gun" }  효과음 (gun boom pop magic crowd run knock door pull bonk drop eat gulp ominous)
     { music: "02. Day Life.mp3" }  배경음악 바꾸기 (assets/bgm, 천천히 넘어감) · music: "" 은 끄기 / 화에 bgm: 을 적으면 첫 곡
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

function st() { const s = S(); if (!s.story) s.story = { base: s.stats.totalMin, seen: [] }; if (s.story.base2 == null) s.story.base2 = s.stats.totalMin; return s.story; }
// ?preview 로 열면 시작 화면 없이 스토리 탭으로, 모든 화 열림 + 대본 보기 (구성 확인용, 보상 없음)
const PREVIEW = new URLSearchParams(location.search).has("preview");
// hide: true 인 챕터(원작 메인 스토리 등 준비 중)는 미리보기에서만
const chapters = () => STORY.filter((ch) => PREVIEW || !ch.hide);
const allEps = () => chapters().flatMap((ch) => ch.eps.map((ep) => ({ ...ep, ch })));
// 스토리가 열린 뒤(이번 업데이트부터) 공부한 시간
const studied = () => Math.max(0, S().stats.totalMin - st().base2);
// 화마다 need(분)를 채우면 열림. need 가 없으면 화 순서 × STORY_MIN_PER_EP
const needOf = (ep, i) => (ep.need != null ? ep.need : i * STORY_MIN_PER_EP);
const isOpen = (ep, i) => PREVIEW || studied() >= needOf(ep, i);
const unlockedN = () => allEps().filter((e, i) => isOpen(e, i)).length;
// 아직 안 열린 화 중 가장 먼저 열릴 화
const nextEp = () => { const L = allEps().map((ep, i) => ({ ep, need: needOf(ep, i) })).filter((x) => x.need > studied()).sort((a, b) => a.need - b.need); return L[0] || null; };
const nextIn = () => { const x = nextEp(); return x ? Math.max(0, x.need - studied()) : 0; };
const hm = (m) => (m >= 60 ? `${Math.floor(m / 60)}시간${m % 60 ? ` ${m % 60}분` : ""}` : `${m}분`);

/* ───── 스토리 탭 ───── */
function render() {
  const el = $("view-story");
  const eps = allEps(), open = unlockedN(), seen = new Set(st().seen);
  const firstNew = eps.findIndex((e, i) => isOpen(e, i) && !seen.has(e.id));
  el.innerHTML = `
    <div class="card story-head">
      <h2 class="ribbon">사도 이야기</h2>
      <p>공부할수록 다음 이야기가 열려요.
        ${open < eps.length ? `다음 화까지 공부 <b>${hm(nextIn())}</b> 남았어요.` : "지금 있는 이야기는 모두 열렸어요!"}</p>
      <div class="story-prog"><span class="bar"><i style="width:${(() => { const x = nextEp(); if (!x) return 100; const prevNeed = Math.max(0, ...eps.map((e, k) => needOf(e, k)).filter((n) => n <= studied())); return Math.min(100, ((studied() - prevNeed) / Math.max(1, x.need - prevNeed)) * 100).toFixed(1); })()}%"></i></span>
        <small>${Math.min(open, eps.length)} / ${eps.length}화 열림 · 본 화 ${seen.size}</small></div>
      ${firstNew >= 0 ? `<button class="btn yellow" data-play="${eps[firstNew].id}">▶ 이어 보기 — ${esc(eps[firstNew].title)}</button>` : ""}
    </div>
    ${chapters().map((ch) => `<div class="card story-ch">
      <h3 class="card-title">${esc(ch.season)} · ${esc(ch.name)} <small>${esc(ch.title)}</small></h3>
      ${ch.fold ? `<details class="story-fold"><summary>${ch.eps.filter((ep) => { const k = eps.findIndex((x) => x.id === ep.id); return isOpen(eps[k], k); }).length} / ${ch.eps.length}화 열림 · 눌러서 펼치기</summary>` : ""}
      <ol class="story-eps">${(ch.fold ? ch.eps.filter((ep, n) => { const k = eps.findIndex((x) => x.id === ep.id); return isOpen(eps[k], k) || ch.eps.slice(0, n).filter((p) => { const q = eps.findIndex((x) => x.id === p.id); return !isOpen(eps[q], q); }).length < 3; }) : ch.eps).map((ep) => {
        const i = eps.findIndex((x) => x.id === ep.id), lock = !isOpen(eps[i], i);
        return `<li class="${lock ? "lock" : ""} ${seen.has(ep.id) ? "seen" : ""}">
          <button ${lock ? "disabled" : ""} data-play="${ep.id}">
            <b>${ch.eps.indexOf(ep) + 1}화</b><span>${esc(ep.title)}</span>
            <em>${lock ? `🔒 공부 ${hm(Math.max(0, needOf(ep, i) - studied()))} 더` : seen.has(ep.id) ? "✔ 다시 보기" : "NEW"}</em>
          </button>${PREVIEW ? `<button class="story-script" data-script="${ep.id}">📜 대본</button>` : ""}</li>`;
      }).join("")}</ol>${ch.fold ? "</details>" : ""}
    </div>`).join("")}
    ${chapters().length ? "" : '<div class="card"><p class="hint">이야기를 준비하고 있어요!</p></div>'}
    <p class="hint">시즌 1은 원작 메인 스토리 줄거리(「트릭컬 스토리 정리」)를, 사도 이야기는 「트릭컬 사도 정리」의 대사·말투를 바탕으로 새로 쓴 팬 창작이에요.</p>`;
  el.querySelectorAll("[data-play]").forEach((b) => (b.onclick = () => play(b.dataset.play)));
  el.querySelectorAll("[data-script]").forEach((b) => (b.onclick = () => showScript(b.dataset.script)));
  if (PREVIEW) el.insertAdjacentHTML("afterbegin", '<div class="card story-preview-note">🔍 <b>미리보기 모드</b> — 모든 화가 열려 있고 📜 대본으로 구성을 볼 수 있어요. 여기서 본 건 기록·보상에 반영되지 않아요.</div>');
}
/* 대본 보기 (미리보기 모드) */
function showScript(id) {
  const ep = allEps().find((e) => e.id === id);
  if (!ep) return;
  const tag = (t) => `<span class="sc-tag">${t}</span>`;
  const rows = ep.lines.map((L) => {
    const meta = [];
    if (L.bg) meta.push(tag("배경 " + L.bg.split("/").pop()));
    if (L.loc) meta.push(tag("📍 " + esc(L.loc)));
    if (L.title) meta.push(tag("제목 " + esc(L.title + " · " + (L.sub || ""))));
    if (L.in) meta.push(tag(`등장 ${esc(nameOf(L.in))} (${L.at || "C"})`));
    if (L.out) meta.push(tag(`퇴장 ${esc(nameOf(L.out))}`));
    if (L.shake) meta.push(tag("흔들림")); if (L.flash) meta.push(tag("번쩍"));
    let body = "";
    if (L.s) body = `<b>${esc(nameOf(L.s))}</b>${L.f ? `<i>${esc(L.f)}</i>` : ""}${L.e ? `<i>${esc(L.e)}</i>` : ""}${L.st ? `<i>${L.st === "shout" ? "외침" : "속마음"}</i>` : ""} ${esc(fmtT(L.t).replace(/\*/g, ""))}`;
    else if (L.n) body = `<em>${esc(fmtT(L.n))}</em>`;
    else if (L.choice) body = `<b>선택지</b> ${L.choice.map((c, k) => `${k + 1}) ${esc(c)}`).join(" / ")}`;
    return `<li>${meta.join("")}${body ? `<p>${body}</p>` : ""}</li>`;
  }).join("");
  TS.modal(`<h2>📜 ${esc(ep.title)}</h2><ol class="story-sc">${rows}</ol>
    <div class="modal-actions"><button class="btn yellow" data-close>닫기</button></div>`);
}
if (PREVIEW && window.TitleScreen) window.TitleScreen.show = (done) => { done(); setTimeout(() => TS.go("story"), 0); };
/* ───── 🎞️ 특별 영상 (움직이는 CG): 공부 시간으로 하나씩 열림 ───── */
function videoCard() {
  if (typeof CG_VIDEOS === "undefined" || !CG_VIDEOS.length) return "";
  return `<div class="card story-ch"><h3 class="card-title">🎞️ 특별 영상 <small>움직이는 CG ${CG_VIDEOS.filter((v) => PREVIEW || studied() >= v.need).length} / ${CG_VIDEOS.length}</small></h3>
    <div class="cgv-grid">${(() => {
      // 열린 영상 전부 + 다음에 열릴 3개만 (나머지는 개수만)
      const L = CG_VIDEOS.slice().sort((a, b) => a.need - b.need);
      const open = L.filter((v) => PREVIEW || studied() >= v.need), lock = L.filter((v) => !(PREVIEW || studied() >= v.need));
      window.__cgvMore = Math.max(0, lock.length - 3);
      return open.concat(lock.slice(0, 3));
    })().map((v) => {
      const open = PREVIEW || studied() >= v.need;
      return `<button class="cgv ${open ? "" : "lock"}" ${open ? `data-cgv="${v.id}"` : "disabled"}>
        <img src="assets/video/${v.id}.jpg" alt="" loading="lazy"><b>${esc(v.title)}</b>
        <em>${open ? "▶ 보기" : `🔒 공부 ${hm(Math.max(0, v.need - studied()))} 더`}</em></button>`;
    }).join("")}</div>${window.__cgvMore ? `<p class="hint" style="margin:8px 0 0">🔒 그 밖에 ${window.__cgvMore}개가 더 기다리고 있어요. 공부할수록 하나씩 열려요!</p>` : ""}</div>`;
}
function playVideo(id) {
  const v = CG_VIDEOS.find((x) => x.id === id); if (!v) return;
  // 화면 가득, 기본 재생바 없이: 누르면 일시정지/재생, 아래 얇은 진행선, 위에 제목·닫기
  const ov = document.createElement("div");
  ov.className = "cgv-overlay";
  ov.innerHTML = `<video src="assets/video/${v.id}.webm" poster="assets/video/${v.id}.jpg" autoplay loop playsinline></video>
    <div class="cgv-top"><b>🎞️ ${esc(v.title)}</b><button class="cgv-x" title="닫기">✕</button></div>
    <div class="cgv-pause">❚❚</div><div class="cgv-line"><i></i></div>`;
  document.body.appendChild(ov);
  const vid = ov.querySelector("video"), line = ov.querySelector(".cgv-line i");
  if (window.BGM && window.BGM.pauseFor) window.BGM.pauseFor("video");
  let raf = 0; const tick = () => { if (vid.duration) line.style.width = (vid.currentTime / vid.duration) * 100 + "%"; raf = requestAnimationFrame(tick); }; tick();
  let hideT = 0; const wake = () => { ov.classList.add("ui"); clearTimeout(hideT); hideT = setTimeout(() => ov.classList.remove("ui"), 2200); }; wake();
  const close = () => { cancelAnimationFrame(raf); ov.remove(); document.removeEventListener("keydown", key); if (window.BGM && window.BGM.resumeFrom) window.BGM.resumeFrom("video"); };
  const key = (e) => { if (e.key === "Escape") close(); if (e.key === " ") { e.preventDefault(); toggle(); } };
  const toggle = () => { if (vid.paused) { vid.play(); ov.classList.remove("paused"); } else { vid.pause(); ov.classList.add("paused"); } wake(); };
  document.addEventListener("keydown", key);
  ov.addEventListener("pointermove", wake);
  ov.onclick = (e) => { if (e.target.closest(".cgv-x")) return close(); toggle(); };
}
TS.on("refresh", (view) => {
  if (view !== "story") return;
  const el = $("view-story"); if (!el || el.querySelector(".cgv-grid")) return;
  const hint = el.querySelector(":scope > p.hint");
  (hint || el.lastElementChild).insertAdjacentHTML("beforebegin", videoCard());
  el.querySelectorAll("[data-cgv]").forEach((b) => (b.onclick = () => playVideo(b.dataset.cgv)));
});
TS.views.story = render;

/* ───── 재생기 ───── */
const SLOTS = { L: "29%", C: "50%", R: "69%" };
const STICKER = { "!": "❗", "?": "❓", "!?": "⁉️", "♥": "💗", "💧": "💧", "💢": "💢", "…": "💬", "✨": "✨", "💡": "💡" };
let P = null; // 재생 중 상태

/* ───── 이야기 배경음악 (로비 음악은 잠깐 멈춤) ───── */
const music = new Audio(); music.loop = true;
let fadeT = 0;
const mVol = () => (window.BGM && window.BGM.vol != null ? window.BGM.vol : 0.4);
function setMusic(file) {
  clearInterval(fadeT);
  const to = file ? "assets/bgm/" + encodeURIComponent(file) : "";
  if (to && music.src.endsWith(encodeURIComponent(file)) && !music.paused) return;
  const swap = () => {
    if (!to) { music.pause(); return; }
    music.src = to; music.volume = 0; music.play().catch(() => {});
    fadeT = setInterval(() => { music.volume = Math.min(mVol(), music.volume + mVol() / 15); if (music.volume >= mVol()) clearInterval(fadeT); }, 60);
  };
  if (music.paused || !music.src) return swap();
  fadeT = setInterval(() => { music.volume = Math.max(0, music.volume - mVol() / 10); if (music.volume <= 0.01) { clearInterval(fadeT); swap(); } }, 50); // 지금 곡을 줄이고 다음 곡
}
function stopMusic() { clearInterval(fadeT); fadeT = setInterval(() => { music.volume = Math.max(0, music.volume - 0.04); if (music.volume <= 0.01) { clearInterval(fadeT); music.pause(); } }, 40); }

function play(epId) {
  const ep = allEps().find((e) => e.id === epId);
  if (!ep || P) return;
  const root = document.createElement("div");
  root.id = "story";
  // 게임(트릭컬 스토리) 화면과 같은 1280×640 무대를 만들고 화면 크기에 맞춰 통째로 확대·축소
  root.innerHTML = `<div class="sp-zone">
    <div class="sp-bg"></div><div class="sp-bg next"></div>
    <div class="sp-stage"></div>
    <div class="sp-fade"></div>
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
  P = { ep: { ...ep, lines: ep.lines.slice() }, root, i: -1, actors: {}, seq: 0, typing: null, auto: false, autoT: 0, log: [], wait: false, done: false };
  if (window.BGM && window.BGM.pauseFor) window.BGM.pauseFor("story");
  if (ep.bgm && S().settings.sound !== false) setMusic(ep.bgm);
  root.addEventListener("click", (e) => {
    // 크롬은 클릭 안에서 깨운 오디오만 소리가 남 → 누를 때마다 깨워 둠 (말소리·효과음)
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === "suspended") actx.resume(); } catch (_) { /* 무시 */ }
    const c = e.target.closest("[data-c]");
    if (c) return ctrl(c.dataset.c);
    if (e.target.closest(".sp-choice, .sp-log")) return;
    advance();
  });
  document.addEventListener("keydown", onKey);
  bindTouch(root);
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
  P.skipping = 1;
  if (L.clear) Object.keys(P.actors).forEach(leave);
  if (L.cg != null) showCg(L.cg);
  if (L.in) enter(L.in, L.at || "C", null, L.flip);
  P.skipping = 0;
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
  // 장면 전환: 화면이 천천히 어두워졌다가 새 배경으로 밝아짐 (첫 배경은 바로)
  if (L.bg && P.hadBg) {
    const fade = P.root.querySelector(".sp-fade");
    P.wait = true;
    fade.classList.add("on");
    setTimeout(() => {
      if (!P) return;
      setBg(L.bg, true);
      fade.classList.remove("on");
      setTimeout(() => { if (!P) return; P.wait = false; run({ ...L, bg: null }); }, 700);
    }, 750);
    return;
  }
  const box = P.root.querySelector(".sp-box");
  let speak = false;
  if (L.bg) { setBg(L.bg, true); P.hadBg = true; }
  if (L.music != null && S().settings.sound !== false) setMusic(L.music);
  if (L.sfx) sfxPlay(L.sfx);
  if (L.clear) Object.keys(P.actors).forEach(leave); // 무대 비우기
  if (L.cg != null) showCg(L.cg);
  if (L.in) enter(L.in, L.at || "C", L.f, L.flip);
  else if (L.flip != null && L.s && P.actors[L.s]) { P.actors[L.s].flip = L.flip; P.actors[L.s].el.classList.toggle("flip", !!L.flip); } // 말하면서 돌아보기
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
      const pic = picOf(L.s);
      P.root.querySelector(".sp-pf-in").innerHTML = pic ? `<img src="${pic}" alt="">` : `<b>${me ? "📖" : esc(who.slice(0, 1))}</b>`;
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
    type(t, L.s);
  }
  if (L.wait) { P.wait = true; setTimeout(() => { if (!P) return; P.wait = false; advance(); }, L.wait); return; }
  if (!speak) advance(); // 대사가 없는 줄은 바로 다음
}
const fmtT = (t) => String(t || "").replace(/\{me\}/g, S().name || "교주").replace(/\{partner\}/g, (TS.SADO_MAP[S().partner] || {}).name || "");
// 사도 목록에 없는 등장인물(영춘 등)은 story-data.js 의 STORY_NPC 에서 이름·그림을 가져옴
const npc = (id) => (typeof STORY_NPC !== "undefined" && STORY_NPC[id]) || null;
const nameOf = (id) => (id === "me" ? S().name || "교주" : (TS.SADO_MAP[id] || npc(id) || {}).name || id);
const picOf = (id) => (TS.SADO_MAP[id] ? TS.chibiSrc(TS.SADO_MAP[id]) : npc(id) ? npc(id).img : "");
const colorOf = (id) => (id === "me" ? "#ff7fa8" : (PERS[(TS.SADO_MAP[id] || {}).pers] || {}).color || "#7d8aa0");

// *강조* → 초록 글씨. 글자마다 <span>을 미리 깔아 두고 하나씩 보이게 해서 줄바꿈·위치가 흔들리지 않음
/* ───── 소리: 사도 음성 + 말소리 톡톡 ─────
   - 대사가 받아 둔 음성 대사와 같으면 그 음성을 그대로
   - 그 밖의 대사는 글자가 나올 때 사도마다 다른 높이의 '톡톡' 말소리 */
let actx = null;
const vVol = () => (typeof S().settings.voiceVol === "number" ? S().settings.voiceVol : 40) / 100;
const soundOn = () => S().settings.sound !== false;
const norm = (t) => String(t || "").replace(/[^가-힣a-zA-Z0-9]/g, "");
let VT_IDX = null;
function voiceFileFor(id, text) {
  if (typeof VOICE_TEXT === "undefined") return null;
  if (!VT_IDX) { VT_IDX = {}; for (const [k, v] of Object.entries(VOICE_TEXT)) { const sid = k.replace(/(_s\d+)?-(pull|pat)$/, ""); (VT_IDX[sid] = VT_IDX[sid] || []).push([k, norm(v)]); } }
  const t = norm(text); if (t.length < 4) return null;
  const hit = (VT_IDX[id] || []).find(([, v]) => v && (v === t || (v.length >= 6 && t.includes(v)) || (t.length >= 6 && v.includes(t))));
  return hit ? hit[0] : null;
}
function playFile(key) {
  if (!soundOn()) return 0;
  const a = new Audio(`assets/voice/${key}.mp3`); a.volume = vVol(); a.play().catch(() => {});
  if (P) P.voiceUntil = Date.now() + 2500;
  return 1;
}
// 사도마다 정해진 말소리 높이·음색 (성격 따라 음색)
function blipOf(id) {
  if (!id) return null;
  if (id === "me") return { f: 300, w: "sine" };
  let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const c = TS.SADO_MAP[id], pers = c ? c.pers : "";
  const w = { pure: "triangle", jolly: "square", mad: "sawtooth", cool: "sine", gloomy: "sine", special: "triangle" }[pers] || "triangle";
  const base = { pure: 620, jolly: 680, mad: 560, cool: 430, gloomy: 380, special: 520 }[pers] || 520;
  return { f: base + (h % 9) * 18 - 70, w };
}
function blip(b) {
  if (!b || !soundOn() || (P && P.voiceUntil > Date.now())) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
    o.type = b.w; o.frequency.setValueAtTime(b.f * (0.94 + Math.random() * 0.12), t);
    const v = 0.22 * Math.max(0.2, vVol()) * (b.w === "square" || b.w === "sawtooth" ? 0.45 : 1);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.06);
  } catch (e) { /* 소리 못 냄 */ }
}

/* 효과음 (대본에 { sfx: "gun" }) — 파일 없이 소리를 만들어 냄
   gun 총소리 · boom 폭발 · pop 뿅 · magic 반짝 · crowd 웅성웅성 · run 다다닥 · knock 똑똑
   pull 쑤욱 · bonk 꽁 · drop 휘잉~ · eat 냠냠 · gulp 꿀꺽 · ominous 불길함 · door 쾅 */
function sfxPlay(kind) {
  if (!soundOn()) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const A = actx, t0 = A.currentTime, V = 0.6 * Math.max(0.15, vVol());
    const out = A.createGain(); out.gain.value = V; out.connect(A.destination);
    const noise = (dur) => { const b = A.createBuffer(1, Math.max(1, A.sampleRate * dur), A.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = A.createBufferSource(); s.buffer = b; return s; };
    const env = (node, t, a, peak, d) => { const g = A.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); node.connect(g).connect(out); return g; };
    const tone = (type, f1, f2, t, dur, peak = 0.3) => { const o = A.createOscillator(); o.type = type; o.frequency.setValueAtTime(f1, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur); env(o, t, 0.005, peak, dur); o.start(t); o.stop(t + dur + 0.05); };
    const burst = (t, dur, freq, type = "lowpass", peak = 0.5, q = 0.7) => { const n = noise(dur + 0.05), f = A.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; n.connect(f); env(f, t, 0.003, peak, dur); n.start(t); n.stop(t + dur + 0.05); };
    ({
      gun: () => { burst(t0, 0.18, 2500, "highpass", 0.9); tone("sine", 140, 40, t0, 0.25, 0.8); burst(t0 + 0.05, 0.6, 800, "lowpass", 0.15); },
      boom: () => { burst(t0, 1.4, 400, "lowpass", 1); tone("sine", 90, 25, t0, 1.2, 0.9); burst(t0, 0.25, 3000, "highpass", 0.5); },
      pop: () => tone("sine", 500, 1300, t0, 0.12, 0.4),
      magic: () => [0, 1, 2, 3, 4].forEach((i) => tone("triangle", 880 * Math.pow(1.26, i), 0, t0 + i * 0.07, 0.25, 0.18)),
      crowd: () => { for (let i = 0; i < 6; i++) burst(t0 + i * 0.18, 0.35, 500 + Math.random() * 600, "bandpass", 0.25, 3); },
      run: () => { for (let i = 0; i < 7; i++) tone("sine", 120, 60, t0 + i * 0.11, 0.07, 0.5); },
      knock: () => { for (let i = 0; i < 3; i++) { tone("square", 180, 90, t0 + i * 0.18, 0.06, 0.25); burst(t0 + i * 0.18, 0.05, 1500, "bandpass", 0.3, 2); } },
      door: () => { burst(t0, 0.3, 300, "lowpass", 0.9); tone("sine", 70, 40, t0, 0.3, 0.7); },
      pull: () => tone("sine", 180, 1000, t0, 0.45, 0.35),
      bonk: () => { tone("square", 260, 130, t0, 0.12, 0.3); tone("sine", 520, 260, t0, 0.15, 0.25); },
      drop: () => tone("triangle", 1100, 140, t0, 0.6, 0.3),
      eat: () => [0, 1, 2].forEach((i) => burst(t0 + i * 0.16, 0.06, 1200, "bandpass", 0.5, 4)),
      gulp: () => { tone("sine", 300, 120, t0, 0.15, 0.4); tone("sine", 260, 100, t0 + 0.2, 0.15, 0.35); },
      ominous: () => { const o = A.createOscillator(), l = A.createOscillator(), lg = A.createGain(); o.type = "sawtooth"; o.frequency.value = 55; l.frequency.value = 3; lg.gain.value = 8; l.connect(lg).connect(o.frequency); const f = A.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 300; o.connect(f); env(f, t0, 0.4, 0.35, 2.2); o.start(t0); l.start(t0); o.stop(t0 + 2.8); l.stop(t0 + 2.8); },
    }[kind] || (() => TS.sfx(kind)))();
  } catch (e) { /* 소리 못 냄 */ }
}

function type(text, who) {
  // 받아 둔 음성과 같은 대사면 진짜 음성
  if (who && who !== "me") { const key = voiceFileFor(who, text); if (key) playFile(key); }
  const bl = blipOf(who);
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
    if (bl && (k % 4 === 2 || k % 4 === 3) && /[가-힣a-zA-Z0-9]/.test(P.spans[k - 1].textContent)) blip(bl);
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
/* CG: 무대 위를 덮는 일러스트 (대사창은 그 위에). { cg: "경로" } 보이기 · { cg: "" } 닫기 */
function showCg(src) {
  let el = P.root.querySelector(".sp-cg");
  if (!el) { el = document.createElement("div"); el.className = "sp-cg"; P.root.querySelector(".sp-stage").after(el); }
  if (!src) { el.classList.remove("on"); const v = el.querySelector("video"); if (v) setTimeout(() => v.pause(), 600); return; }
  // .webm 이면 움직이는 CG(영상)
  const isV = /\.webm$/.test(src);
  const put = () => {
    el.innerHTML = isV ? `<video src="${src}" poster="${src.replace(/\.webm$/, ".jpg")}" autoplay muted loop playsinline></video>` : `<img src="${src}" alt="">`;
  };
  const cur = el.querySelector("img,video"), curSrc = (cur && cur.getAttribute("src")) || "";
  if (el.classList.contains("on") && cur && !curSrc.endsWith(src)) { el.classList.add("swap"); setTimeout(() => { put(); el.classList.remove("swap"); }, 250); }
  else if (!cur || !curSrc.endsWith(src)) put();
  el.classList.add("on");
}
function setBg(src, instant) {
  const [a, b] = P.root.querySelectorAll(".sp-bg");
  const cur = a.classList.contains("next") ? b : a, nx = cur === a ? b : a;
  nx.style.backgroundImage = `url('${src}')`;
  P.root.style.setProperty("--spbg", `url('${new URL(src, location.href).href}')`); // 무대 밖 여백은 흐린 배경으로
  nx.classList.remove("next"); cur.classList.add("next");
  if (instant) nx.style.transition = "none"; else nx.style.transition = "";
}
// 사도 그림은 기본이 왼쪽을 봄 → 왼쪽(L) 자리면 좌우 반전해서 가운데(상대)를 보게. 대본에서 flip: 1/0 으로 직접 정할 수도 있음
const faceFlip = (at, flip) => (flip != null ? !!flip : at === "L");
/* 무대 자리 정리: 같은 자리에 둘 이상 서면 겹쳐 보이니까 사람 수에 맞춰 고르게 벌려 세움
   (대본의 L·C·R 순서는 그대로, 많아지면 조금 작게) */
const slotPct = (at) => parseFloat(SLOTS[at] || at) || 50;
const SPREAD = { 1: [50], 2: [31, 69], 3: [20, 50, 80], 4: [15, 38, 62, 85], 5: [12, 31, 50, 69, 88] };
function layout() {
  const list = Object.values(P.actors).sort((a, b) => a.want - b.want || a.seq - b.seq);
  const n = list.length; if (!n) return;
  const clash = list.some((a, i) => i && a.want - list[i - 1].want < 30);
  const pos = clash || n > 3 ? SPREAD[Math.min(n, 5)] || list.map((_, i) => 8 + (84 * i) / (n - 1)) : list.map((a) => a.want);
  const sc = n >= 5 ? 0.74 : n === 4 ? 0.84 : 1;
  list.forEach((a, i) => {
    const x = pos[i];
    a.el.style.left = x + "%";
    a.el.style.scale = sc === 1 ? "" : String(sc);
    a.el.style.transformOrigin = "50% 100%";
    a.el.classList.toggle("flip", a.flip != null ? !!a.flip : x < 45);
  });
}
function enter(id, at, f, flip) {
  if (P.actors[id]) { const a0 = P.actors[id]; a0.want = slotPct(at); a0.flip = flip; a0.seq = ++P.seq; layout(); return; }
  const c = TS.SADO_MAP[id], N = npc(id);
  if (!c && !N) return;
  const el = document.createElement("div");
  el.className = "sp-actor" + (faceFlip(at, flip) ? " flip" : "");
  el.style.left = SLOTS[at] || at;
  el.innerHTML = `<div class="sp-sticker"></div>`;
  P.root.querySelector(".sp-stage").appendChild(el);
  const a = { id, el, live: null, want: slotPct(at), flip, seq: ++P.seq };
  const fallback = () => { if (!el.querySelector(".sp-img")) el.insertAdjacentHTML("beforeend", `<img class="sp-img" src="${picOf(id)}" alt="">`); };
  a.live = c && window.Live ? window.Live.mount(el, id, { frame: "story", onReady: (ctrl) => { a.ctrl = ctrl; if (f) a.live.play(f); }, onFail: fallback }) : null;
  if (!a.live) fallback();
  P.actors[id] = a;
  layout();
  requestAnimationFrame(() => el.classList.add("in"));

}
function leave(id) {
  const a = P.actors[id];
  if (!a) return;
  delete P.actors[id];
  a.el.classList.add("out");
  layout();
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
  if (first && !PREVIEW) { s.seen.push(ep.id); TS.addElif(50); }
  TS.save();
  const box = document.createElement("div");
  box.className = "sp-end";
  box.innerHTML = `<div class="sp-end-card">
      <h3>📖 ${esc(ep.title)} 끝!</h3>
      ${first ? '<p class="reward-chip"><i class="ic-elif"></i>+50 처음 본 보상</p>' : ""}
      <p class="hint">${nextEp() ? `다음 화까지 공부 ${hm(nextIn())}` : "지금 있는 이야기를 모두 봤어요!"}</p>
      <button class="btn yellow" id="sp-endok">확인</button></div>`;
  P.root.appendChild(box);
  box.querySelector("#sp-endok").onclick = (e) => { e.stopPropagation(); close(); };
  // 다음화 자동재생: 열린 다음 화가 있으면 이어서
  const eps = allEps(), i = eps.findIndex((x) => x.id === ep.id), nx = eps[i + 1];
  if (s.nextAuto && nx && isOpen(nx, i + 1)) setTimeout(() => { if (P && P.ep.id === ep.id) { close(); play(nx.id); } }, 1500);
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
  stopMusic();
  if (window.BGM && window.BGM.resumeFrom) window.BGM.resumeFrom("story");
  if (TS.view === "story") render();
}


/* ───── 이야기 중에도 사도 만지기 ─────
   볼 근처를 누르고 끌기 = 볼 당기기 · 길게 누르기 = 쓰다듬기 · 문지르기 = 간지럽히기
   그냥 누르면 평소처럼 다음 대사 (만진 뒤 따라오는 클릭은 넘기지 않음) */
const TOUCH_LINES = {
  pat: ["헤헤… 쓰다듬어 주는 거예요?", "기분 좋아요~", "더 해줘요!"],
  tickle: ["꺄하하! 간지러워요!", "그, 그만~ 히히히!", "간지럼은 반칙이에요!"],
  pull: ["으에에… 볼 늘어나요!", "아야야, 놔 주세요~", "볼은 장난감이 아니에요!"],
};
function actorAt(x, y) {
  const list = Object.values(P.actors).filter((a) => a.ctrl && a.ctrl.ready).sort((a, b) => (+getComputedStyle(b.el).zIndex || 0) - (+getComputedStyle(a.el).zIndex || 0) || b.seq - a.seq);
  // 몸통 근처(가운데 쪽)만 — 투명한 여백을 눌렀을 땐 대사 넘기기
  return list.find((a) => { const r = a.el.getBoundingClientRect(); return Math.abs(x - (r.left + r.width / 2)) < r.width * 0.2 && y > r.top + r.height * 0.12 && y < r.bottom - r.height * 0.05; });
}
function reactLine(a, kind) {
  const v = TS.voice && TS.voice(a.id, kind === "pull" ? "pull" : "pat");
  const text = (v && v.text) || TS.fmt(TS.rand(TOUCH_LINES[kind]), TS.SADO_MAP[a.id]);
  let b = a.el.querySelector(".sp-react");
  if (!b) { b = document.createElement("div"); b.className = "sp-react"; a.el.appendChild(b); }
  b.textContent = text; b.classList.remove("on"); void b.offsetWidth; b.classList.add("on");
  clearTimeout(b._t); b._t = setTimeout(() => b.classList.remove("on"), 2600);
  if (!v) TS.sfx("poke");
}
const T_HOLD = { pat: ["Pat_Idle", "Pat_End"], tickle: ["Tickle_Idle_1", "Tickle_End"] };
function holdAnim(a, kind) {
  const c = a.ctrl, [loop] = T_HOLD[kind];
  if (!c.anims.includes(loop)) { a.live.play(kind === "pat" ? "happy" : "shy"); return; }
  c.player.animationState.setAnimation(0, loop, true); c.busyUntil = Infinity;
}
function holdOff(a, kind) {
  const c = a.ctrl; if (!c || !c.player) return;
  const [loop, end] = T_HOLD[kind];
  if (!c.anims.includes(loop)) return;
  const st = c.player.animationState;
  let dur = 0;
  if (c.anims.includes(end)) { st.setAnimation(0, end, false); dur = c.player.skeleton.data.findAnimation(end).duration; }
  st.addAnimation(0, c.idles[0] || c.anims[0], true, 0);
  c.busyUntil = Date.now() + dur * 1000;
}
function bindTouch(root) {
  let d = null, used = false;
  root.addEventListener("pointerdown", (e) => {
    used = false; d = null;
    if (e.target.closest("[data-c], .sp-choice, .sp-log, .sp-box, .sp-end")) return;
    const a = actorAt(e.clientX, e.clientY); if (!a) return;
    d = { a, x: e.clientX, y: e.clientY, moved: 0, kind: "" };
    if (!a.pull && window.Live && window.Live.cheekPull) a.pull = window.Live.cheekPull(a.ctrl) || false;
    if (a.pull && a.pull.near(e.clientX, e.clientY) < a.el.getBoundingClientRect().width * 0.09) {
      e.preventDefault();
      try { root.setPointerCapture(e.pointerId); } catch (_) { /* 무시 */ }
      d.kind = "pull"; used = true;
      a.pull.grab(e.clientX, e.clientY); reactLine(a, "pull");
      return;
    }
    try { root.setPointerCapture(e.pointerId); } catch (_) { /* 무시 */ }
    d.timer = setTimeout(() => {
      if (!d || d.kind || d.moved > 20) return;
      d.kind = "pat"; used = true; holdAnim(a, "pat"); reactLine(a, "pat"); hearts(a);
    }, 550);
  });
  root.addEventListener("pointermove", (e) => {
    if (!d) return;
    if (d.kind === "pull") { d.a.pull.move(e.clientX, e.clientY); return; }
    d.moved += Math.hypot(e.movementX || 0, e.movementY || 0);
    if (!d.kind && d.moved > 90) { clearTimeout(d.timer); d.kind = "tickle"; used = true; holdAnim(d.a, "tickle"); reactLine(d.a, "tickle"); }
  });
  const up = () => {
    if (!d) return;
    clearTimeout(d.timer);
    if (d.kind === "pull") d.a.pull.release();
    else if (d.kind) { const { a, kind } = d; setTimeout(() => holdOff(a, kind), 600); }
    d = null;
  };
  root.addEventListener("pointerup", up);
  root.addEventListener("pointercancel", up);
  // 만진 뒤 따라오는 클릭은 대사 넘기기로 치지 않음
  root.addEventListener("click", (e) => { if (used) { used = false; e.stopImmediatePropagation(); } }, true);
}
function hearts(a) {
  for (let i = 0; i < 5; i++) {
    const h = document.createElement("span");
    h.className = "sp-heart"; h.textContent = TS.rand(["💗", "💕", "💖"]);
    h.style.left = 38 + Math.random() * 24 + "%"; h.style.animationDelay = i * 0.12 + "s";
    a.el.appendChild(h); setTimeout(() => h.remove(), 1800);
  }
}
window.Story = { play, render };
})();
