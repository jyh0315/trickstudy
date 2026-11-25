/* =========================================================
   🌙 화면보호기 — 공부하는 동안 켜두는 화면
   - 배경 일러스트가 천천히 움직이며 바뀌고, 사도들이 번갈아 등장 (Spine)
   - 큰 시계 · 타이머 남은 시간 · 오늘 집중 · 다음 D-day
   - 화면 꺼짐 방지(Wake Lock) · 전체 화면 · 마우스 안 움직이면 커서 숨김
   - 사도를 누르면 반응 / Esc 로 나가기
   ========================================================= */
(() => {
"use strict";
const TS = window.TS;
const $ = (id) => document.getElementById(id);
const S = () => TS.state;
const esc = TS.esc;
const rand = (a) => a[Math.floor(Math.random() * a.length)];
const pad = TS.pad;

function cfg() {
  const s = S();
  if (!s.ss) s.ss = { interval: 120, count: 2, source: "owned", clock: true, auto: false, allBg: false };
  if (!s.ss.bgSrc) s.ss.bgSrc = "game"; // game: 게임 배경 · illust: 레벨업 일러스트 · mix: 둘 다
  return s.ss;
}
let fsOn = false, root = null, chars = [], tick = 0, rotate = 0, cursorT = 0, wake = null, bgIdx = 0, bgList = [];

function pickChars(n) {
  if (!n) return []; // 0명: 배경만
  const s = S(), owned = Object.keys(s.owned).filter((id) => TS.SADO_MAP[id]);
  if (cfg().source === "partner" || owned.length <= 1) return [s.partner].filter(Boolean).slice(0, 1);
  const pool = owned.filter((id) => id !== s.partner).sort(() => Math.random() - 0.5);
  return [s.partner, ...pool].slice(0, n).sort(() => Math.random() - 0.5);
}
/* 배경 목록 (이미지 주소) */
function buildBgList(c) {
  const game = (typeof SS_BACKGROUNDS !== "undefined" ? SS_BACKGROUNDS : []).map((n) => `assets/ssbg/${n}.webp`);
  const illust = (c.allBg ? BACKGROUNDS.map((b) => b.id) : S().unlockedBg.slice()).map((id) => bgSrc(id));
  const video = (typeof CG_VIDEOS !== "undefined" ? CG_VIDEOS : []).map((v) => `https://jyh0315.github.io/trickstudy-assets/video/${v.id}.webm`);
  const list = c.bgSrc === "illust" ? illust : c.bgSrc === "mix" ? game.concat(illust) : c.bgSrc === "video" ? video : c.bgSrc === "all" ? game.concat(illust, video) : game;
  return (list.length ? list : illust).sort(() => Math.random() - 0.5);
}
function nextBg() {
  if (!bgList.length) return bgSrc(S().bg);
  bgIdx = (bgIdx + 1) % bgList.length;
  const next = bgList[(bgIdx + 1) % bgList.length];
  if (next) new Image().src = next; // 다음 배경 미리 받아두기 (바뀔 때 깜빡임 방지)
  return bgList[bgIdx];
}

/* 사도 한 명 배치 (Spine 실패 시 그림으로) */
function addChar(id, slot, total) {
  const c = TS.SADO_MAP[id];
  const el = document.createElement("div");
  el.className = `ss-char n${total} s${slot}`;
  el.innerHTML = `<div class="ss-bubble"></div><div class="ss-body"></div><span class="ss-name">${esc(c.name)}</span>`;
  root.querySelector(".ss-chars").appendChild(el);
  const body = el.querySelector(".ss-body");
  const item = { id, el, live: null };
  item.live = window.Live ? window.Live.mount(body, id, {
    onFail: () => { body.innerHTML = `<img src="${TS.portrait(c, true)}" alt="">`; body.classList.add("static"); },
  }) : null;
  if (!item.live) { body.innerHTML = `<img src="${TS.portrait(c, true)}" alt="">`; body.classList.add("static"); }
  let downT = 0, petT = 0;
  el.addEventListener("pointerdown", (e) => { e.stopPropagation(); downT = Date.now(); clearTimeout(petT); petT = setTimeout(() => { downT = 0; pat(item); }, 450); });
  const up = () => { clearTimeout(petT); if (downT && Date.now() - downT < 450) { if (item.live) item.live.play(rand(["touch", "happy", "shy", "surprise"])); say(item, TS.fmt(rand(TS.linesOf(c, "poke")), c)); TS.sfx("poke"); } downT = 0; };
  el.addEventListener("pointerup", up); el.addEventListener("pointerleave", () => { clearTimeout(petT); downT = 0; });
  requestAnimationFrame(() => el.classList.add("in"));
  return item;
}
/* 🧶 가볍게 놀아주기 — 길게 눌러 쓰다듬기 · 🍰 간식 · 💬 수다 · 🎵 춤 (호감도 하루 15번까지) */
const AFF_DAILY = 15, SNACKS = ["🍰", "🧁", "🍩", "🥐", "🍪", "🍓", "🍮"];
function play() { const s = S(); if (!s.playroom) s.playroom = { day: "", n: 0 }; if (s.playroom.day !== TS.today()) { s.playroom.day = TS.today(); s.playroom.n = 0; } return s.playroom; }
function love(item) {
  const p = play();
  if (p.n < AFF_DAILY && window.Affection && window.Affection.gain) { p.n++; window.Affection.gain(item.id, 1); TS.save(); }
  const a = root && root.querySelector(".ss-aff"); if (a) { a.textContent = p.n >= AFF_DAILY ? "💗 오늘 호감도 다 받았어요" : `💗 오늘 놀아주기 호감도 ${p.n} / ${AFF_DAILY}`; a.classList.remove("show"); void a.offsetWidth; a.classList.add("show"); }
}
function fx(item, emo) {
  for (let i = 0; i < 5; i++) { const h = document.createElement("span"); h.className = "ss-heart"; h.textContent = rand(emo); h.style.left = 20 + Math.random() * 60 + "%"; h.style.animationDelay = i * 0.12 + "s"; item.el.appendChild(h); setTimeout(() => h.remove(), 1900); }
}
const lineOf = (id, kinds, fb) => { const c = TS.SADO_MAP[id]; for (const k of kinds) { const L = TS.linesOf(c, k); if (L && L.length) return TS.fmt(rand(L), c); } return fb; };
function pat(item) {
  if (item.live) item.live.play(rand(["shy", "happy"]));
  say(item, lineOf(item.id, ["pat", "poke"], "에헤헤…")); fx(item, ["💗", "💕", "💖"]); love(item); TS.sfx("coin");
}
let busy = false;
function snack() {
  if (busy || !chars.length) return; busy = true;
  chars.forEach((it, i) => setTimeout(() => {
    if (!root) return;
    const sn = document.createElement("span"); sn.className = "ss-snack"; sn.textContent = rand(SNACKS); it.el.appendChild(sn); setTimeout(() => sn.remove(), 2600);
    if (it.live) it.live.play("eat"); say(it, rand(["잘 먹을게요!", "냠냠… 맛있다!", "쉬는 시간엔 역시 단 거지~", "이거 나 주는 거야?"])); fx(it, ["✨", "😋", "💗"]); love(it);
  }, i * 700));
  TS.sfx("coin"); setTimeout(() => (busy = false), chars.length * 700 + 1500);
}
function chat() {
  if (busy || !chars.length) return; busy = true;
  const ids = chars.map((c) => c.id), talks = typeof SADO_TALKS !== "undefined" ? SADO_TALKS : [];
  const pool = talks.filter((t) => t.every((x) => ids.includes(x[0])) && new Set(t.map((x) => x[0])).size === Math.min(2, ids.length));
  const lines = pool.length ? rand(pool) : chars.map((c) => [c.id, lineOf(c.id, ["idle"], "…")]);
  let t = 0;
  lines.forEach(([id, text], k) => { setTimeout(() => { const it = chars.find((x) => x.id === id); if (!it || !root) return; if (it.live) it.live.play("talk"); say(it, text); if (k === 0) love(it); TS.sfx("click"); }, t); t += Math.min(3200, 1300 + text.length * 60); });
  setTimeout(() => (busy = false), t + 300);
}
function dance() {
  if (!chars.length) return;
  chars.forEach((it, i) => setTimeout(() => { if (!root) return; if (it.live) it.live.play("dance"); fx(it, ["🎵", "🎶", "✨"]); if (i === 0) say(it, lineOf(it.id, ["done", "cheer"], "신난다~!")); }, i * 200));
  TS.sfx("level");
}
function say(item, text) {
  const b = item.el.querySelector(".ss-bubble");
  b.textContent = text;
  b.classList.remove("show"); void b.offsetWidth; b.classList.add("show");
}
function swapChars() {
  busy = false;
  const old = chars;
  old.forEach((it) => it.el.classList.add("out"));
  setTimeout(() => old.forEach((it) => { if (it.live) it.live.dispose(); it.el.remove(); }), 900);
  if (TS.isPlain()) { chars = []; quote(); return; } // 심플 모드: 사도 대신 한 줄 문구
  const ids = pickChars(cfg().count);
  chars = ids.map((id, i) => addChar(id, i, ids.length));
}
const QUOTES = ["작은 진전도 진전이다.", "오늘 걷지 않으면 내일 뛰어야 한다.", "집중한 25분이 흐트러진 3시간보다 낫다.", "꾸준함은 재능을 이긴다.", "할 수 있다고 믿으면 이미 반은 온 것.", "지금 하는 공부가 미래의 나를 만든다.", "천천히 해도 괜찮아, 멈추지만 않으면.", "어제보다 한 문제 더."];
function quote() {
  const el = root && root.querySelector(".ss-quote");
  if (!el) return;
  el.classList.remove("show"); void el.offsetWidth;
  el.textContent = rand(QUOTES);
  el.classList.add("show");
}
function swapBg() {
  const layers = root.querySelectorAll(".ss-bg");
  const front = root.querySelector(".ss-bg.on"), back = [...layers].find((l) => l !== front);
  const src = TS.isPlain() ? "" : nextBg();
  // 움직이는 CG(영상)면 배경 칸 안에 영상을 깔고, 그림이면 배경 이미지
  const old = back.querySelector("video"); if (old) old.remove();
  if (/\.webm$/.test(src)) {
    back.style.backgroundImage = `url("${src.replace(/\.webm$/, ".jpg")}")`;
    back.insertAdjacentHTML("beforeend", `<video class="ss-vid" src="${src}" autoplay muted loop playsinline></video>`);
  } else back.style.backgroundImage = src ? `url("${src}")` : "none";
  back.style.animationName = rand(["ssKb1", "ssKb2", "ssKb3"]);
  back.classList.add("on");
  if (front) front.classList.remove("on");
}

/* 시계 · 타이머 · 정보 */
function hud() {
  if (!root) return;
  const now = new Date(), c = cfg();
  root.querySelector(".ss-clock").classList.toggle("hidden", !c.clock);
  root.querySelector(".ss-time").textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  root.querySelector(".ss-date").textContent = now.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" });
  const t = TS.timer.t, busy = t.running || t.remain > 0;
  const tm = root.querySelector(".ss-timer");
  tm.classList.toggle("hidden", !busy);
  if (busy) {
    tm.classList.toggle("brk", t.mode === "break");
    tm.querySelector("span").textContent = t.tag === "mock" ? "📝 모의고사" : t.mode === "focus" ? `📚 ${t.subject} 집중` : "☕ 휴식";
    tm.querySelector("b").textContent = TS.timer.mmss(TS.timer.left()) + (t.running ? "" : " ⏸");
    tm.querySelector("i").style.width = (1 - TS.timer.left() / TS.timer.dur()) * 100 + "%";
  }
  const todayMin = S().stats.days[TS.today()] || 0, goal = S().settings.goal;
  let info = `오늘 집중 <b>${todayMin}</b> / ${goal}분`;
  const dd = window.Schedule ? window.Schedule.ddSorted().find((d) => d.dayDiff >= 0) : null;
  if (dd) info += ` · 📌 ${esc(dd.x.title)} <b>${dd.label}</b>`;
  root.querySelector(".ss-info").innerHTML = info;
}
function chatter() {
  if (!chars.length) return;
  const it = rand(chars), c = TS.SADO_MAP[it.id], t = TS.timer.t;
  const kind = t.running && t.mode === "focus" ? "cheer" : "idle";
  say(it, TS.fmt(rand(TS.linesOf(c, kind)), c));
  if (it.live && Math.random() < 0.6) it.live.play(rand(["happy", "talk", "shy", "proud"]));
}

/* 켜기 · 끄기 */
async function open() {
  if (root || !S().started) return;
  const c = cfg();
  bgList = buildBgList(c);
  bgIdx = 0;
  root = document.createElement("div");
  root.id = "ss";
  root.innerHTML = `
    <div class="ss-bg on" style="${TS.isPlain() ? "" : `background-image:url('${(bgList[0] || bgSrc(S().bg)).replace(/\.webm$/, ".jpg")}')`}">${!TS.isPlain() && /\.webm$/.test(bgList[0] || "") ? `<video class="ss-vid" src="${bgList[0]}" autoplay muted loop playsinline></video>` : ""}</div><div class="ss-bg"></div>
    <div class="ss-shade"></div>
    <div class="ss-clock"><div class="ss-time"></div><div class="ss-date"></div></div>
    <div class="ss-timer hidden"><span></span><b></b><div class="ss-tbar"><i></i></div></div>
    <div class="ss-chars"></div>
    <div class="ss-quote"></div>
    <div class="ss-info"></div>
    <div class="ss-aff"></div>
    <div class="ss-ctrl">
      <span class="ss-play" title="사도를 길게 누르면 쓰다듬기">
        <button class="btn yellow small" id="ss-snack" title="사도들에게 간식 주기">🍰 간식</button>
        <button class="btn yellow small" id="ss-chat" title="사도끼리 수다">💬 수다</button>
        <button class="btn yellow small" id="ss-dance" title="같이 춤">🎵 춤</button>
      </span>
      <button class="btn white small" id="ss-next" title="다음 배경·사도">⏭ 다음</button>
      <button class="btn white small" id="ss-set">⚙️ 설정</button>
      <button class="btn red small" id="ss-exit">✕ 나가기 (Esc)</button>
    </div>
    <div class="ss-panel hidden" id="ss-panel">
      <label>바뀌는 간격 <select id="ss-int">${[[30, "30초"], [60, "1분"], [120, "2분"], [300, "5분"], [600, "10분"]].map(([v, l]) => `<option value="${v}" ${c.interval === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      <label>사도 수 <select id="ss-cnt">${[0, 1, 2, 3].map((n) => `<option value="${n}" ${c.count === n ? "selected" : ""}>${n ? n + "명" : "없음 (배경만)"}</option>`).join("")}</select></label>
      <label>사도 <select id="ss-src"><option value="owned" ${c.source === "owned" ? "selected" : ""}>보유 사도 랜덤</option><option value="partner" ${c.source === "partner" ? "selected" : ""}>대표 사도만</option></select></label>
      <label class="check"><input type="checkbox" id="ss-clk" ${c.clock ? "checked" : ""}> 큰 시계</label>
      <label>배경 <select id="ss-bgsrc">${[["game", "게임 배경 (155장)"], ["illust", "레벨업 일러스트"], ["mix", "게임 배경 + 일러스트"], ["video", "🎞️ 움직이는 CG"], ["all", "전부 섞어서"]].map(([v, l]) => `<option value="${v}" ${c.bgSrc === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
      <label class="check"><input type="checkbox" id="ss-allbg" ${c.allBg ? "checked" : ""}> 잠긴 일러스트도 보기</label>
      <label class="check"><input type="checkbox" id="ss-auto" ${c.auto ? "checked" : ""}> 집중 시작하면 자동으로 켜기</label>
    </div>`;
  document.body.appendChild(root);
  document.body.classList.add("ss-open");
  swapChars();
  TS.emit("ss-open", root);
  hud();
  tick = setInterval(() => { hud(); if (Math.random() < 0.06) chatter(); }, 1000);
  rotate = setInterval(() => { swapBg(); swapChars(); }, c.interval * 1000);
  root.addEventListener("mousemove", wakeCursor);
  root.addEventListener("pointerdown", wakeCursor);
  wakeCursor();
  $("ss-exit").onclick = close;
  $("ss-snack").onclick = snack; $("ss-chat").onclick = chat; $("ss-dance").onclick = dance;
  $("ss-next").onclick = () => { swapBg(); swapChars(); };
  $("ss-set").onclick = () => { $("ss-panel").classList.toggle("hidden"); wakeCursor(); };
  root.addEventListener("keydown", wakeCursor);
  const save = () => {
    Object.assign(c, { interval: +$("ss-int").value, count: +$("ss-cnt").value, source: $("ss-src").value, clock: $("ss-clk").checked, allBg: $("ss-allbg").checked, auto: $("ss-auto").checked, bgSrc: $("ss-bgsrc").value });
    TS.save(); hud();
    clearInterval(rotate); rotate = setInterval(() => { swapBg(); swapChars(); }, c.interval * 1000);
  };
  root.querySelectorAll("#ss-panel select, #ss-panel input").forEach((x) => (x.onchange = () => { save(); if (x.id === "ss-cnt" || x.id === "ss-src") swapChars(); if (x.id === "ss-bgsrc" || x.id === "ss-allbg") { bgList = buildBgList(c); bgIdx = -1; swapBg(); } }));
  try { if (document.documentElement.requestFullscreen) { await document.documentElement.requestFullscreen(); fsOn = true; } } catch (e) { /* 무시 */ }
  lockWake();
}
function close() {
  if (!root) return;
  clearInterval(tick); clearInterval(rotate); clearTimeout(cursorT);
  chars.forEach((it) => it.live && it.live.dispose());
  chars = [];
  TS.emit("ss-close");
  root.remove(); root = null;
  document.body.classList.remove("ss-open");
  fsOn = false;
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  if (wake) { wake.release().catch(() => {}); wake = null; }
  TS.refresh();
}
function wakeCursor() {
  if (!root) return;
  root.classList.remove("idle");
  clearTimeout(cursorT);
  // 설정 창이 열려 있으면 숨기지 않음 (고르는 동안 사라지면 안 되니까)
  cursorT = setTimeout(() => { if (root && $("ss-panel").classList.contains("hidden")) root.classList.add("idle"); else wakeCursor(); }, 3000);
}
async function lockWake() {
  try { if ("wakeLock" in navigator) wake = await navigator.wakeLock.request("screen"); } catch (e) { /* 지원 안 함 */ }
}
// 전체 화면에서 Esc 한 번 = 화면보호기 끄기
document.addEventListener("fullscreenchange", () => { if (root && fsOn && !document.fullscreenElement) { fsOn = false; close(); } });
document.addEventListener("visibilitychange", () => { if (root && !document.hidden && !wake) lockWake(); });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && root) close();
});
document.addEventListener("study-timer", (e) => {
  if (e.detail.running && e.detail.mode === "focus" && cfg().auto && !root) open();
});

$("ss-btn").onclick = open;
$("ss-btn2").onclick = open;
window.ScreenSaver = { open, close };
})();
