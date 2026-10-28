/* =========================================================
   배경음악 플레이어
   음악을 넣는 방법 2가지:
   1) 사이트에서 [🎵 → 내 PC 음악 추가] — 이 브라우저(IndexedDB)에 저장됨
   2) assets/bgm/ 폴더에 mp3 를 올리기
      - GitHub Pages(*.github.io)에서는 폴더를 자동으로 읽어옴
      - 그 외 환경이면 아래 BGM_TRACKS 에 파일 이름을 적어주기
   ========================================================= */
const BGM_TRACKS = [
  // { file: "Lobby.mp3", title: "로비 테마" },
];

(() => {
"use strict";

const KEY = "trickcal-bgm";
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const prettyName = (f) => decodeURIComponent(f).replace(/\.[^.]+$/, "").replace(/^\d+[\s._-]*/, "").trim() || f;

let st = { vol: 0.4, shuffle: false, withTimer: true, cur: null };
try { Object.assign(st, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { /* 기본값 */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* 무시 */ } };

const audio = new Audio();
audio.volume = st.vol;
let tracks = [];          // { id, title, src, local }
let errors = 0;

function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast"; el.textContent = msg;
  $("toasts").appendChild(el);
  setTimeout(() => el.remove(), 2700);
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
async function repoTracks() {
  const list = BGM_TRACKS.map((t) => ({ id: "f:" + t.file, title: t.title || prettyName(t.file), src: "assets/bgm/" + encodeURIComponent(t.file) }));
  if (list.length || !location.hostname.endsWith(".github.io")) return list;
  // GitHub Pages면 저장소의 assets/bgm 폴더 목록을 API로 읽음
  const owner = location.hostname.split(".")[0];
  const repo = location.pathname.split("/").filter(Boolean)[0] || `${owner}.github.io`;
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/assets/bgm`);
    if (!res.ok) return [];
    const files = await res.json();
    return files.filter((f) => /\.(mp3|ogg|m4a|wav|flac|opus)$/i.test(f.name))
      .map((f) => ({ id: "f:" + f.name, title: prettyName(f.name), src: "assets/bgm/" + encodeURIComponent(f.name) }));
  } catch (e) { return []; }
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
function play(i) {
  if (!tracks.length) { toast("🎵 음악이 없어요. ‘내 PC 음악 추가’로 넣어주세요!"); openPanel(true); return; }
  if (i == null) i = curIdx() >= 0 ? curIdx() : 0;
  const t = tracks[(i + tracks.length) % tracks.length];
  if (st.cur !== t.id || !audio.src) { audio.src = t.src; st.cur = t.id; save(); }
  audio.play().catch(() => { /* 사용자 조작 전 자동재생 차단 */ });
}
function pause() { audio.pause(); }
function next(dir = 1) {
  if (!tracks.length) return;
  let i = curIdx();
  if (st.shuffle && tracks.length > 1) {
    let j; do { j = Math.floor(Math.random() * tracks.length); } while (j === i);
    i = j;
  } else i += dir;
  st.cur = null;
  play(i);
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

/* 타이머랑 같이: 시작하면 재생, 일시정지·그만하기면 멈춤 */
document.addEventListener("study-timer", (e) => {
  if (!st.withTimer || !tracks.length) return;
  if (e.detail.running) { if (audio.paused) play(); }
  else pause();
});

/* ───── UI ───── */
function openPanel(force) {
  const p = $("bgm-panel");
  const open = force != null ? force : p.classList.contains("hidden");
  p.classList.toggle("hidden", !open);
}
function render() {
  const playing = !audio.paused;
  $("bgm-btn").classList.toggle("playing", playing);
  const cur = tracks[curIdx()];
  $("bgm-now").textContent = cur ? cur.title : tracks.length ? "재생할 곡을 골라주세요" : "아직 음악이 없어요";
  $("bgm-play").textContent = playing ? "⏸" : "▶";
  $("bgm-vol").value = Math.round(st.vol * 100);
  $("bgm-shuffle").classList.toggle("on", st.shuffle);
  $("bgm-with-timer").checked = st.withTimer;
  $("bgm-list").innerHTML = tracks.map((t, i) => `
    <li class="${t.id === st.cur ? "cur" : ""}">
      <button class="bgm-track" data-i="${i}">${t.id === st.cur && playing ? "♪" : i + 1 + "."} ${esc(t.title)}</button>
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
$("bgm-list").onclick = async (e) => {
  const t = e.target.closest("[data-i]");
  if (t) { st.cur = null; return play(+t.dataset.i); }
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
  if ((e.key === "m" || e.key === "M") && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) {
    audio.paused ? play() : pause();
  }
});

reload();
})();
