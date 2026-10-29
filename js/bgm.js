/* =========================================================
   배경음악 플레이어 — 상황별 자동 전환
   상황: 📚 집중 / ☕ 휴식 / 👹 보스 / 🏠 로비
   - 곡마다 상황 태그가 있고(아래 TAG_RULES 로 자동 분류, 목록에서 바꿀 수 있음)
   - 타이머·화면이 바뀌면 그 상황에 맞는 곡으로 넘어감
   - 보스 화면에서는 보스 HP에 따라 "Phase 1/2/3" 곡이 바뀜

   음악을 넣는 방법:
   1) 사이트에서 [🎵 → 내 PC 음악 추가] — 이 브라우저(IndexedDB)에 저장됨
   2) assets/bgm/ 폴더에 mp3 올리기 (GitHub Pages면 자동 인식,
      아니면 아래 BGM_TRACKS 에 파일 이름 적기)
   ========================================================= */
const BGM_TRACKS = [
  // { file: "Lobby.mp3", title: "로비 테마" },
];

/* 곡 제목에 이 단어가 들어가면 해당 상황으로 자동 분류 (나머지는 집중) */
const TAG_RULES = {
  lobby: ["Main Title"],
  break: ["Let's Go", "Theme Theater", "Adventure Begins", "Lamb And Dumber", "This Is Awkward", "Life Is Comedy", "Trick Or Treat", "Get You Crayon", "Winner", "Sugar Free"],
  boss:  ["Feedstance", "No Way Out", "Honranada", "Battle On Sunset", "Dragon Cave", "Deep Cave", "Ghost Village", "We're In Trouble", "Gold Thief", "Dimension Crash", "Hyper Fatalism", "Alpha And Omega"],
};
const CTX = {
  focus: { label: "📚 집중", pool: ["focus"] },
  break: { label: "☕ 휴식", pool: ["break"] },
  boss:  { label: "👹 보스", pool: ["boss"] },
  lobby: { label: "🏠 로비", pool: ["lobby", "break", "focus"] },
};
const TAG_LABEL = { focus: "📚 집중", break: "☕ 휴식", boss: "👹 보스", lobby: "🏠 로비", off: "🚫 제외" };

(() => {
"use strict";

const KEY = "trickcal-bgm";
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const prettyName = (f) => decodeURIComponent(f).replace(/\.[^.]+$/, "").replace(/^\d+[\s._-]*/, "").trim() || f;

let st = { vol: 0.4, shuffle: true, withTimer: true, auto: true, onStart: true, cur: null, tags: {} };
try { Object.assign(st, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { /* 기본값 */ }
st.tags = st.tags || {};
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* 무시 */ } };

const audio = new Audio();
audio.volume = st.vol;
let tracks = [];          // { id, title, src, local }
let errors = 0, ctx = "lobby";

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast"; el.textContent = msg;
  $("toasts").appendChild(el);
  setTimeout(() => el.remove(), 2700);
}

/* ───── 태그 ───── */
function autoTag(title) {
  for (const [tag, words] of Object.entries(TAG_RULES)) if (words.some((w) => title.includes(w))) return tag;
  return "focus";
}
const tagOf = (t) => st.tags[t.id] || autoTag(t.title);
function poolFor(c) {
  let list = tracks.filter((t) => CTX[c].pool.includes(tagOf(t)));
  if (c === "boss" && window.Boss) {
    // 보스 HP 단계에 맞는 "Phase N" 곡이 있으면 그 곡만
    const ph = window.Boss.phase();
    const phased = list.filter((t) => new RegExp(`Phase ${ph}\\b`).test(t.title));
    if (phased.length) return phased;
    list = list.filter((t) => !/Phase \d/.test(t.title));
  }
  return list.length ? list : tracks.filter((t) => tagOf(t) !== "off");
}

/* ───── IndexedDB (내 PC 음악 저장) ───── */
function db() {
  return new Promise((ok, no) => {
    const r = indexedDB.open("trickcal-bgm", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("tracks", { keyPath: "id" });
    r.onsuccess = () => ok(r.result);
    r.onerror = () => no(r.error);
  });
}
async function idb(mode, fn) {
  const d = await db();
  return new Promise((ok, no) => {
    const tx = d.transaction("tracks", mode);
    const req = fn(tx.objectStore("tracks"));
    tx.oncomplete = () => ok(req && req.result);
    tx.onerror = () => no(tx.error);
  });
}

/* ───── 트랙 목록 불러오기 ───── */
const toList = (names) => names.filter((n) => /\.(mp3|ogg|m4a|wav|flac|opus)$/i.test(n)).sort()
  .map((n) => ({ id: "f:" + n, title: prettyName(n), src: "assets/bgm/" + encodeURIComponent(n) }));
async function repoTracks() {
  const list = BGM_TRACKS.map((t) => ({ id: "f:" + t.file, title: t.title || prettyName(t.file), src: "assets/bgm/" + encodeURIComponent(t.file) }));
  if (list.length || !location.hostname.endsWith(".github.io")) return list;
  // GitHub Pages면 저장소의 assets/bgm 폴더 목록을 API로 읽음 (1시간 캐시)
  const owner = location.hostname.split(".")[0];
  const repo = location.pathname.split("/").filter(Boolean)[0] || `${owner}.github.io`;
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem(KEY + "-list")); } catch (e) { /* 없음 */ }
  if (cached && Date.now() - cached.t < 3600000) return toList(cached.names);
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/assets/bgm`);
    if (!res.ok) return cached ? toList(cached.names) : [];
    const names = (await res.json()).map((f) => f.name);
    try { localStorage.setItem(KEY + "-list", JSON.stringify({ t: Date.now(), names })); } catch (e) { /* 무시 */ }
    return toList(names);
  } catch (e) { return cached ? toList(cached.names) : []; }
}
async function localTracks() {
  try {
    const rows = (await idb("readonly", (s) => s.getAll())) || [];
    return rows.map((r) => ({ id: r.id, title: r.title, src: URL.createObjectURL(r.blob), local: true }));
  } catch (e) { return []; }
}
async function reload() {
  for (const t of tracks) if (t.local) URL.revokeObjectURL(t.src);
  tracks = [...(await repoTracks()), ...(await localTracks())];
  render();
}

/* ───── 재생 ───── */
const curIdx = () => tracks.findIndex((t) => t.id === st.cur);
const curTrack = () => tracks[curIdx()];
function playTrack(t) {
  if (!t) return;
  if (!audio.src || !audio.src.endsWith(t.src)) audio.src = t.src; // 미리 받아둔 곡이면 그대로
  if (st.cur !== t.id) { st.cur = t.id; save(); }
  return audio.play().then(() => true, () => false); // 사용자 조작 전엔 자동재생이 막힐 수 있음
}
function playCtx(exclude) {
  const pool = poolFor(ctx);
  if (!pool.length) return;
  let pick;
  if (st.shuffle && pool.length > 1) {
    const others = pool.filter((t) => t.id !== exclude);
    pick = others[Math.floor(Math.random() * others.length)];
  } else {
    const i = pool.findIndex((t) => t.id === (exclude || st.cur));
    pick = pool[(i + 1) % pool.length];
  }
  playTrack(pick);
}
function play(i) {
  if (!tracks.length) { toast("🎵 음악이 없어요. ‘내 PC 음악 추가’로 넣어주세요!"); openPanel(true); return; }
  if (i != null) return playTrack(tracks[(i + tracks.length) % tracks.length]);
  const cur = curTrack();
  if (cur && (!st.auto || poolFor(ctx).includes(cur))) return playTrack(cur);
  playCtx();
}
function pause() { audio.pause(); }
function next(dir = 1) {
  if (!tracks.length) return;
  if (st.auto) return playCtx(st.cur);
  let i = curIdx();
  if (st.shuffle && tracks.length > 1) {
    let j; do { j = Math.floor(Math.random() * tracks.length); } while (j === i);
    i = j;
  } else i += dir;
  playTrack(tracks[(i + tracks.length) % tracks.length]);
}
audio.addEventListener("ended", () => next(1));
audio.addEventListener("playing", () => { errors = 0; render(); });
audio.addEventListener("pause", render);
audio.addEventListener("error", () => {
  if (!audio.src) return;
  errors++;
  if (errors >= Math.min(3, tracks.length)) { toast("🎵 음악 파일을 재생할 수 없어요"); errors = 0; render(); return; }
  next(1);
});

/* ───── 상황 판단 ───── */
function currentCtx() {
  const TS = window.TS;
  if (!TS) return "lobby";
  const t = TS.timer.t;
  if (t.running) return t.mode === "focus" ? "focus" : "break";
  if (TS.view === "boss") return "boss";
  return "lobby";
}
const fits = (t) => t && poolFor(ctx).includes(t);
function updateCtx(force) {
  const c = currentCtx();
  if (c === ctx && !force) return;
  ctx = c;
  render();
  if (!st.auto || audio.paused) return;
  if (!fits(curTrack())) playCtx();
}
/* 타이머랑 같이: 시작하면 재생, 일시정지·그만하기면 멈춤 */
document.addEventListener("study-timer", (e) => {
  ctx = currentCtx();
  if (st.withTimer && tracks.length) {
    if (e.detail.running) {
      const cur = curTrack();
      if (st.auto && !fits(cur)) playCtx();
      else if (audio.paused) play();
      return render();
    }
    pause();
  }
  updateCtx(true);
});
window.TS.on("refresh", () => updateCtx());
window.TS.on("view", () => setTimeout(() => updateCtx(), 0));
window.TS.on("boss-phase", () => updateCtx(true));

/* ───── UI ───── */
function openPanel(force) {
  const p = $("bgm-panel");
  const open = force != null ? force : p.classList.contains("hidden");
  p.classList.toggle("hidden", !open);
  if (open) render();
}
function render() {
  const playing = !audio.paused;
  $("bgm-btn").classList.toggle("playing", playing);
  const cur = curTrack();
  $("bgm-now").textContent = cur ? cur.title : tracks.length ? "재생할 곡을 골라주세요" : "아직 음악이 없어요";
  $("bgm-ctx").textContent = `지금 상황: ${CTX[ctx].label}${st.auto ? " · 자동 전환 켜짐" : ""}`;
  $("bgm-play").textContent = playing ? "⏸" : "▶";
  $("bgm-vol").value = Math.round(st.vol * 100);
  $("bgm-shuffle").classList.toggle("on", st.shuffle);
  $("bgm-with-timer").checked = st.withTimer;
  $("bgm-auto").checked = st.auto;
  $("bgm-onstart").checked = st.onStart;
  if ($("bgm-panel").classList.contains("hidden")) return;
  $("bgm-list").innerHTML = tracks.map((t, i) => `
    <li class="${t.id === st.cur ? "cur" : ""}">
      <button class="bgm-track" data-i="${i}">${t.id === st.cur && playing ? "♪" : i + 1 + "."} ${esc(t.title)}</button>
      <select class="bgm-tag" data-tag="${esc(t.id)}" title="이 곡을 틀 상황">${Object.entries(TAG_LABEL).map(([k, v]) => `<option value="${k}" ${tagOf(t) === k ? "selected" : ""}>${v}</option>`).join("")}</select>
      ${t.local ? `<button class="icon-btn" data-rm="${esc(t.id)}" title="삭제">✕</button>` : ""}
    </li>`).join("") || `<li class="bgm-empty">아래 버튼으로 PC에 있는 mp3 파일을 추가하거나,<br>저장소의 <b>assets/bgm/</b> 폴더에 음악을 올려주세요.</li>`;
}

$("bgm-btn").onclick = () => openPanel();
$("bgm-play").onclick = () => (audio.paused ? play() : pause());
$("bgm-prev").onclick = () => next(-1);
$("bgm-next").onclick = () => next(1);
$("bgm-vol").oninput = (e) => { st.vol = e.target.value / 100; audio.volume = st.vol; save(); };
$("bgm-shuffle").onclick = () => { st.shuffle = !st.shuffle; save(); render(); };
$("bgm-with-timer").onchange = (e) => { st.withTimer = e.target.checked; save(); };
$("bgm-auto").onchange = (e) => { st.auto = e.target.checked; save(); updateCtx(true); };
$("bgm-onstart").onchange = (e) => { st.onStart = e.target.checked; save(); };
$("bgm-list").onchange = (e) => {
  const s = e.target.closest("[data-tag]");
  if (s) { st.tags[s.dataset.tag] = s.value; save(); }
};
$("bgm-list").onclick = async (e) => {
  const t = e.target.closest("[data-i]");
  if (t) return play(+t.dataset.i);
  const rm = e.target.closest("[data-rm]");
  if (rm) {
    if (st.cur === rm.dataset.rm) { pause(); audio.removeAttribute("src"); st.cur = null; }
    await idb("readwrite", (s) => s.delete(rm.dataset.rm));
    reload();
  }
};
$("bgm-file").onchange = async (e) => {
  const files = [...e.target.files];
  e.target.value = "";
  if (!files.length) return;
  try {
    for (const f of files) {
      await idb("readwrite", (s) => s.put({ id: "l:" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title: prettyName(f.name), blob: f }));
    }
    toast(`🎵 ${files.length}곡 추가!`);
  } catch (err) {
    toast("🎵 저장 공간이 부족하거나 저장할 수 없어요");
  }
  reload();
};
document.addEventListener("click", (e) => {
  if (!e.target.closest("#bgm-panel") && !e.target.closest("#bgm-btn")) openPanel(false);
});
document.addEventListener("keydown", (e) => {
  // 입력 중이 아닐 때 M 키로 재생/정지
  if ((e.key === "m" || e.key === "M") && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName) && !document.body.classList.contains("title-open")) {
    audio.paused ? play() : pause();
  }
});

const ready = reload();
let titleOn = false;
// 페이지를 열자마자 메인 테마를 미리 받아 둠 → 시작 화면에서 바로(막히면 첫 터치 순간) 재생
if (st.onStart) { audio.preload = "auto"; audio.src = "assets/bgm/" + encodeURIComponent("01. Trickal Main Title.mp3"); audio.load(); }
window.BGM = {
  // 시작 화면에서 볼을 당긴 직후 (사용자 조작이라 자동재생 허용됨)
  onStart() {
    if (!st.onStart) return;
    ready.then(() => {
      ctx = currentCtx();
      if (titleOn && !audio.paused) return; // 시작 화면 메인 테마가 나오는 중이면 그대로 이어서
      if (tracks.length) playCtx();
    });
  },
  // 시작 화면이 뜨자마자 메인 테마. 브라우저가 막으면 화면을 처음 누르는 순간 재생
  title() {
    if (!st.onStart) return;
    // 곡 목록(GitHub API)을 기다리지 않고 메인 테마 파일을 바로 틂
    const MAIN = "01. Trickal Main Title.mp3";
    const t = tracks.find((x) => /Main Title/i.test(x.title)) || { id: "f:" + MAIN, title: prettyName(MAIN), src: "assets/bgm/" + encodeURIComponent(MAIN) };
    {
      titleOn = true;
      playTrack(t).then((ok) => {
        if (ok) return;
        const kick = () => { if (audio.paused && titleOn) playTrack(t); off(); };
        const off = () => ["pointerdown", "keydown", "touchstart", "mousedown", "click"].forEach((ev) => document.removeEventListener(ev, kick, true));
        ["pointerdown", "keydown", "touchstart", "mousedown", "click"].forEach((ev) => document.addEventListener(ev, kick, true));
      });
    }
  },
  get ctx() { return ctx; },
};
window.BGM.title(); // 페이지 열리자마자
})();
