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
  pipWin = await window.documentPictureInPicture.requestWindow({ width: 280, height: 380 });
  const d = pipWin.document;
  document.querySelectorAll('link[rel="stylesheet"], style').forEach((n) => {
    const k = n.cloneNode(true);
    if (n.href) k.href = n.href; // PiP 창은 주소가 달라서 절대 경로로
    d.head.appendChild(k);
  });
  d.title = "미니 타이머";
  d.body.className = "pip-body";
  d.body.innerHTML = `<div class="pip">
    <div class="pip-stage" id="p-stage"><img class="pip-img" id="p-img" alt=""></div>
    <div class="pip-mode" id="p-mode"></div>
    <div class="pip-time" id="p-time"></div>
    <div class="pip-bar"><i id="p-bar"></i></div>
    <div class="pip-btns"><button class="btn yellow small" id="p-toggle"></button><button class="btn white small" id="p-back">창으로</button></div>
  </div>`;
  const q = (id) => d.getElementById(id);
  let lastImg = "";
  const draw = () => {
    const i = info();
    // 표정 사도는 대표 사도 화면과 같은 얼굴(해금한 표정 중 지금 보이는 것)을 따라감
    const face = document.getElementById("partner-img");
    const src = i.c ? (i.c.emote && face && face.getAttribute("src") ? face.getAttribute("src") : i.c.emote ? TS.portrait(i.c, true) : TS.chibiSrc(i.c)) : TS.chibiSrc(TS.SADO_MAP.erpin);
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
  pipLive(pipWin, q("p-stage"));
  pipWin.addEventListener("pagehide", () => { pipWin = null; });
}


/* ───── 미니 창 안에서 움직이는 사도 (Spine) ─────
   메인 탭이 가려지거나 다른 앱을 써도 계속 움직이도록, spine 런타임을 미니 창 쪽에 따로 불러와
   그 창의 requestAnimationFrame 으로 돌림. 못 불러오면 원래 그림 그대로 */
function pipLive(w, stage) {
  try {
    const id = TS.state.partner;
    if (!window.Live || !window.Live.canLive(id) || typeof SPINE_DATA === "undefined") return;
    const d = SPINE_DATA[id], idx = Math.min(window.Live.curSkin(id), d.skins.length - 1);
    const bases = SPINE_HOSTS.map((h) => encodeURI(h.url + h.dir(d.dir) + "/" + d.skins[idx][0]));
    const doc = w.document;
    const sc = doc.createElement("script");
    sc.src = new URL("js/vendor/spine-player.min.js", location.href).href;
    sc.onload = () => start(0);
    doc.head.appendChild(sc);
    let player = null, anims = [], idles = [];
    function patch() { // 이음새 선 방지 (live.js 와 같은 방식: 텍스처 알파 미리 곱하기)
      const T = w.spine && w.spine.GLTexture;
      if (!T || T.__pma) return;
      T.__pma = true; T.DISABLE_UNPACK_PREMULTIPLIED_ALPHA_WEBGL = false;
      const up = T.prototype.update;
      T.prototype.update = function (mip) {
        const gl = this.context.gl;
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        try { up.call(this, mip); } finally { gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); }
      };
    }
    function start(hi) {
      if (hi >= bases.length || w.closed) return;
      patch();
      const host = doc.createElement("div");
      host.className = "pip-live";
      stage.appendChild(host);
      let done = false;
      const giveUp = w.setTimeout(() => { if (done) return; done = true; try { player.dispose(); } catch (e) { /* 무시 */ } host.remove(); start(hi + 1); }, 15000);
      player = new w.spine.SpinePlayer(host, {
        skelUrl: bases[hi] + ".skel.asset", atlasUrl: bases[hi] + ".atlas.asset",
        showControls: false, showLoading: false, alpha: true, backgroundColor: "#00000000", premultipliedAlpha: true,
        viewport: { padLeft: 0, padRight: 0, padTop: 0, padBottom: 0, transitionTime: 0 },
        success: (p) => {
          if (done) return; done = true; w.clearTimeout(giveUp);
          const data = p.skeleton.data;
          anims = data.animations.map((a) => a.name);
          idles = anims.filter((n) => /^Idle_/.test(n));
          const sk = data.skins.find((x) => x.name === "Normal") || data.skins.find((x) => x.name !== "default");
          if (sk) { p.skeleton.setSkin(sk); p.skeleton.setSlotsToSetupPose(); }
          p.animationState.setAnimation(0, idles[0] || anims[0], true);
          p.animationState.apply(p.skeleton); p.skeleton.updateWorldTransform();
          // 로비 대표 사도처럼 얼굴 위주 (머리 뼈 기준, live.js 의 face 와 같은 틀)
          const HB = ["Head", "S1_Head", "S3_Head", "S2_Head", "Head_Root", "S3_Head_Root", "S1_Head_Root"];
          let hb = null;
          for (const n of HB) if ((hb = p.skeleton.findBone(n))) break;
          if (!hb) hb = p.skeleton.bones.find((x) => /^(S\d+_)?Head(_Root)?$/i.test(x.data.name));
          let hx = hb ? hb.worldX : 0, hy = hb ? hb.worldY : 430;
          if (!Number.isFinite(hx) || !Number.isFinite(hy)) { hx = 0; hy = 430; }
          const S = 430;
          Object.assign(p.config.viewport, { x: hx - S / 2, y: hy - 140, width: S, height: S });
          p.setViewport(p.animationState.getCurrent(0).animation.name);
          if (p.paused) p.play();
          stage.classList.add("on");
        },
        error: () => { if (done) return; done = true; w.clearTimeout(giveUp); try { player.dispose(); } catch (e) { /* 무시 */ } host.remove(); start(hi + 1); },
      });
    }
    // 누르면 반응 (콕 찌르기 → 기쁨 → 다시 대기)
    const pick = (re) => anims.filter((n) => re.test(n));
    stage.addEventListener("click", () => {
      if (!player || !anims.length) return;
      const st = player.animationState;
      const seq = anims.includes("Touch_Idle") && anims.includes("Touch_End") ? ["Touch_Idle", "Touch_End"] : [pick(/^(Happy|Shy|Proud)_/)[0]].filter(Boolean);
      if (!seq.length) return;
      st.data.defaultMix = 0.18;
      st.setAnimation(0, seq[0], false);
      seq.slice(1).forEach((n) => st.addAnimation(0, n, false, 0));
      st.addAnimation(0, idles[Math.floor(Math.random() * idles.length)] || anims[0], true, 0);
    });
    // 집중이 끝나면 기뻐하기
    let wasRunning = TS.timer.t.running;
    w.setInterval(() => {
      const r = TS.timer.t.running;
      if (wasRunning && !r && player && anims.length && TS.timer.left() <= 0) {
        const h = pick(/^(Happy|Dance|Proud)_/);
        if (h.length) { const st = player.animationState; st.setAnimation(0, h[0], false); st.addAnimation(0, idles[0] || anims[0], true, 0); }
      }
      wasRunning = r;
    }, 1000);
  } catch (e) { console.warn("pip live", e); }
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
window.MiniTimer = { open: openPip, _live: pipLive };
})();
