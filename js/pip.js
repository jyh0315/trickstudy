/* =========================================================
   📺 미니 타이머 (항상 위에 떠 있는 작은 창)
   1순위: Document Picture-in-Picture (크롬 116+ PC) — 버튼까지 되는 미니 창
   2순위: 영상 PiP (캔버스를 영상으로 띄움) — 대부분의 크롬/크롬북에서 동작
   + 탭이 백그라운드여도 타이머가 정확하도록 워커로 1초마다 틱
   ========================================================= */
(() => {
"use strict";
const TS = window.TS;
const $ = (id) => document.getElementById(id);

/* 백그라운드 탭 타이머 지연 방지용 워커 틱 */
try {
  const src = "setInterval(() => postMessage(0), 1000);";
  const w = new Worker(URL.createObjectURL(new Blob([src], { type: "text/javascript" })));
  w.onmessage = () => { if (document.hidden && TS.tick) TS.tick(); };
} catch (e) { /* file:// 등에서 워커 불가 → 기본 타이머만 사용 */ }

function info() {
  const t = TS.timer.t, left = TS.timer.left(), dur = TS.timer.dur();
  const c = TS.SADO_MAP[TS.state.partner];
  const busy = t.running || t.remain > 0;
  return {
    c, running: t.running, mode: t.mode,
    label: t.mode === "focus" ? (t.running ? "집중 중" : busy ? "일시정지" : "집중 대기") : (t.running ? "휴식 중" : busy ? "일시정지" : "휴식 대기"),
    time: TS.timer.mmss(left), pct: 1 - left / dur,
  };
}

/* ───── 1) Document PiP ───── */
let pipWin = null;
async function openDocPip() {
  pipWin = await window.documentPictureInPicture.requestWindow({ width: 260, height: 330 });
  const d = pipWin.document;
  document.querySelectorAll('link[rel="stylesheet"], style').forEach((n) => {
    const k = n.cloneNode(true);
    if (n.href) k.href = n.href; // PiP 창은 주소가 달라서 절대 경로로
    d.head.appendChild(k);
  });
  d.title = "미니 타이머";
  d.body.className = "pip-body";
  d.body.innerHTML = `<div class="pip">
    <img class="pip-img" id="p-img" alt="">
    <div class="pip-mode" id="p-mode"></div>
    <div class="pip-time" id="p-time"></div>
    <div class="pip-bar"><i id="p-bar"></i></div>
    <div class="pip-btns"><button class="btn yellow small" id="p-toggle"></button><button class="btn white small" id="p-back">창으로</button></div>
  </div>`;
  const q = (id) => d.getElementById(id);
  let lastImg = "";
  const draw = () => {
    const i = info();
    const src = i.c ? (i.c.emote ? TS.portrait(i.c) : TS.chibiSrc(i.c)) : TS.chibiSrc(TS.SADO_MAP.erpin);
    if (src !== lastImg) { q("p-img").src = new URL(src, location.href).href; lastImg = src; }
    q("p-mode").textContent = i.label;
    q("p-time").textContent = i.time;
    q("p-bar").style.width = i.pct * 100 + "%";
    q("p-bar").style.background = i.mode === "focus" ? "var(--pink)" : "var(--mint)";
    q("p-toggle").textContent = i.running ? "⏸ 일시정지" : "▶ 시작";
  };
  q("p-toggle").onclick = () => { const t = TS.timer.t; t.running ? TS.timer.pause() : TS.timer.start(); draw(); };
  q("p-back").onclick = () => { window.focus(); pipWin.close(); };
  draw();
  pipWin.setInterval(draw, 500); // PiP 창 쪽 타이머라 메인 탭이 숨겨져도 안 느려짐
  pipWin.addEventListener("pagehide", () => { pipWin = null; });
}

/* ───── 2) 영상 PiP (캔버스) ───── */
let video = null, canvas = null, raf = 0;
const img = new Image();
function drawCanvas() {
  const i = info(), g = canvas.getContext("2d"), W = canvas.width, H = canvas.height;
  g.fillStyle = "#fff8e6"; g.fillRect(0, 0, W, H);
  g.strokeStyle = "#3b2a20"; g.lineWidth = 8; g.strokeRect(4, 4, W - 8, H - 8);
  const src = i.c ? TS.chibiSrc(i.c) : TS.chibiSrc(TS.SADO_MAP.erpin);
  if (!img.src.endsWith(src)) img.src = src;
  if (img.complete && img.naturalWidth) g.drawImage(img, 24, 30, 120, 142);
  g.fillStyle = "#3b2a20";
  g.font = "26px Jua, sans-serif"; g.fillText(i.label, 170, 62);
  g.font = "76px Jua, sans-serif"; g.fillText(i.time, 164, 140);
  g.fillStyle = "#f1e2bd"; g.fillRect(170, 158, 200, 14);
  g.fillStyle = i.mode === "focus" ? "#ff8fb1" : "#7fd6c2"; g.fillRect(170, 158, 200 * i.pct, 14);
}
async function openVideoPip() {
  if (!canvas) {
    canvas = document.createElement("canvas"); canvas.width = 400; canvas.height = 200;
    video = document.createElement("video");
    video.muted = true; video.playsInline = true;
    video.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;bottom:0;left:0";
    document.body.appendChild(video);
    video.addEventListener("leavepictureinpicture", () => clearInterval(raf));
  }
  drawCanvas();
  video.srcObject = canvas.captureStream(4);
  await video.play();
  await video.requestPictureInPicture();
  clearInterval(raf);
  raf = setInterval(drawCanvas, 250);
}

async function openPip() {
  try {
    if (pipWin) { pipWin.focus(); return; }
    if ("documentPictureInPicture" in window) return await openDocPip();
    if (document.pictureInPictureEnabled) return await openVideoPip();
    TS.toast("이 브라우저는 미니 타이머를 지원하지 않아요 😢");
  } catch (e) {
    console.warn(e);
    // 문서 PiP가 실패하면 영상 PiP로 한 번 더
    try { if (document.pictureInPictureEnabled) return await openVideoPip(); } catch (e2) { console.warn(e2); }
    TS.toast("미니 타이머를 열 수 없어요");
  }
}
$("pip-btn").onclick = openPip;
$("t-pip").onclick = openPip;
window.MiniTimer = { open: openPip };
})();
