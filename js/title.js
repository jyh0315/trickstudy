/* =========================================================
   시작 화면 — "볼을 잡아당겨서 시작하기!"
   사도 얼굴을 캔버스에 그리고, 잡은 지점 주변만 늘어나게 왜곡(liquify)
   충분히 당겼다 놓으면 뾰옹~ 하고 시작
   ========================================================= */
(() => {
"use strict";
const TS = window.TS;

function show(done) {
  const s = TS.state;
  const c = TS.SADO_MAP[s.partner] || TS.SADO_MAP.butter;
  const src = c.emote ? `assets/emotes/${c.id}/1.gif` : TS.chibiSrc(c);
  const root = document.createElement("div");
  root.id = "title";
  root.innerHTML = `
    <div class="ttl-bg" style="background-image:url('assets/bg/${s.bg || "trickcal"}.jpg')"></div>
    <div class="ttl-logo"><span class="l1">교주님,</span><span class="l2">공부하세요!</span><span class="l3">RE:STUDY</span></div>
    <div class="ttl-ver">Ver 1.1 · 교주 전용</div>
    <div class="ttl-copy">♥ Trickcal fan-made study</div>
    <div class="ttl-face" id="ttl-face">
      <img id="ttl-img" src="${src}" alt="" draggable="false">
      <canvas id="ttl-cv" width="420" height="420"></canvas>
      <span class="ttl-hand">👌</span>
      <span class="ttl-pop" id="ttl-pop">뾰옹~!</span>
    </div>
    <div class="ttl-hint" id="ttl-hint">볼을 잡아당겨서 시작하기!</div>`;
  document.body.appendChild(root);
  document.body.classList.add("title-open");

  const face = root.querySelector("#ttl-face"), img = root.querySelector("#ttl-img");
  const cv = root.querySelector("#ttl-cv"), g = cv.getContext("2d", { willReadFrequently: true });
  const hint = root.querySelector("#ttl-hint");
  const W = cv.width, H = cv.height, R = W * 0.42;
  let srcData = null, out = null, canWarp = true;
  let drag = null; // { gx, gy, sx, sy, dx, dy }
  let finished = false;

  const toCanvas = (e) => {
    const r = face.getBoundingClientRect(); // 캔버스는 숨겨진 상태일 수 있어서 틀 기준
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  function capture() {
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    // object-fit: cover
    const iw = img.naturalWidth || 1, ih = img.naturalHeight || 1, k = Math.max(W / iw, H / ih);
    g.drawImage(img, (W - iw * k) / 2, (H - ih * k) / 2, iw * k, ih * k);
    try { srcData = g.getImageData(0, 0, W, H); out = g.createImageData(W, H); canWarp = true; }
    catch (err) { canWarp = false; } // file:// 로 열면 캔버스 읽기가 막힘 → CSS로 대체
    face.classList.toggle("nowarp", !canWarp);
  }
  function warp(dx, dy, gx, gy) {
    const len = Math.hypot(dx, dy), maxL = R * 0.6;
    if (len > maxL) { dx *= maxL / len; dy *= maxL / len; }
    if (!canWarp) {
      img.style.transformOrigin = `${(gx / W) * 100}% ${(gy / H) * 100}%`;
      img.style.transform = `translate(${dx / 3}px, ${dy / 3}px) scale(${1 + Math.abs(dx) / 600}, ${1 + Math.abs(dy) / 600})`;
      return;
    }
    const sd = srcData.data, od = out.data;
    od.set(sd);
    const cx = gx + dx, cy = gy + dy, R2 = R * R;
    const x0 = Math.max(0, Math.floor(cx - R)), x1 = Math.min(W - 1, Math.ceil(cx + R));
    const y0 = Math.max(0, Math.floor(cy - R)), y1 = Math.min(H - 1, Math.ceil(cy + R));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const ex = x - cx, ey = y - cy, r2 = ex * ex + ey * ey;
        if (r2 >= R2) continue;
        const f = 1 - r2 / R2, w = f * f;
        let sx = Math.round(x - dx * w), sy = Math.round(y - dy * w);
        sx = sx < 0 ? 0 : sx >= W ? W - 1 : sx; sy = sy < 0 ? 0 : sy >= H ? H - 1 : sy;
        const si = (sy * W + sx) * 4, oi = (y * W + x) * 4;
        od[oi] = sd[si]; od[oi + 1] = sd[si + 1]; od[oi + 2] = sd[si + 2]; od[oi + 3] = sd[si + 3];
      }
    }
    g.putImageData(out, 0, 0);
    // 당길수록 볼이 빨개짐
    const k = Math.min(1, Math.hypot(dx, dy) / maxL);
    const grad = g.createRadialGradient(cx, cy, 0, cx, cy, R * 0.45);
    grad.addColorStop(0, `rgba(255,110,140,${0.35 * k})`);
    grad.addColorStop(1, "rgba(255,110,140,0)");
    g.fillStyle = grad; g.fillRect(cx - R, cy - R, R * 2, R * 2);
  }
  function springBack(d, after) {
    const t0 = performance.now();
    const step = (now) => {
      const t = (now - t0) / 1000;
      const a = Math.exp(-7 * t) * Math.cos(20 * t);
      warp(d.dx * a, d.dy * a, d.gx, d.gy);
      if (t < 0.6) requestAnimationFrame(step);
      else { warp(0, 0, d.gx, d.gy); face.classList.remove("pulling"); img.style.transform = ""; after && after(); }
    };
    requestAnimationFrame(step);
  }

  face.addEventListener("pointerdown", (e) => {
    if (finished) return;
    e.preventDefault();
    face.setPointerCapture(e.pointerId);
    capture();
    const p = toCanvas(e);
    drag = { gx: p.x, gy: p.y, sx: p.x, sy: p.y, dx: 0, dy: 0 };
    face.classList.add("pulling");
    TS.sfx("poke");
  });
  face.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const p = toCanvas(e);
    drag.dx = p.x - drag.sx; drag.dy = p.y - drag.sy;
    warp(drag.dx, drag.dy, drag.gx, drag.gy);
    hint.textContent = Math.hypot(drag.dx, drag.dy) > W * 0.3 ? "놓으면 시작!" : "쭈우욱~";
  });
  const release = () => {
    if (!drag) return;
    const d = drag; drag = null;
    if (Math.hypot(d.dx, d.dy) > W * 0.3) finish(d);
    else { hint.textContent = "조금 더 세게 당겨주세요!"; TS.sfx("click"); springBack(d); }
  };
  face.addEventListener("pointerup", release);
  face.addEventListener("pointercancel", release);

  function finish(d) {
    finished = true;
    TS.sfx("level");
    const pop = root.querySelector("#ttl-pop");
    pop.classList.add("show");
    hint.textContent = "출발!";
    const go = () => {
      root.classList.add("bye");
      document.body.classList.remove("title-open");
      if (window.BGM) window.BGM.onStart(); // 사용자 조작 직후라 자동재생 가능
      setTimeout(() => { root.remove(); done(); }, 550);
    };
    if (d) springBack(d, go); else go();
  }
  const onKey = (e) => {
    if (finished) return document.removeEventListener("keydown", onKey);
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); document.removeEventListener("keydown", onKey); finish(null); }
  };
  document.addEventListener("keydown", onKey);
}
window.TitleScreen = { show };
})();
