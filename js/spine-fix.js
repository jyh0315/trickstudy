/* 스파인 그림 손보기 (사이트의 모든 움직이는 사도가 같이 씀: 로비·이야기·GIF 만들기·노트·미니 타이머)
   1) 이미 알파가 곱해진(PMA) 그림이면 되돌림 → 홍조처럼 반투명한 부위 테두리가 검게 남지 않게
   2) 부위 가장자리 반투명 픽셀의 색을 바로 안쪽 색으로 채움 → 조각끼리 맞닿는 곳(앞머리 등)의 가는 선(이음새)이 안 보이게
   3) 올릴 때 알파를 곱해서(premultipliedAlpha: true 와 짝) 가장자리 번짐 없이 */
(function () {
  "use strict";
  // win: 고칠 창 (미니 타이머처럼 따로 띄운 창의 spine 에도 쓸 수 있게) — window.SpineFix(창)
  function apply(win) {
  win = win || window;
  const T = win.spine && win.spine.GLTexture;
  if (!T || T.__fix) return;
  T.__fix = T.__pma = true;
  T.DISABLE_UNPACK_PREMULTIPLIED_ALPHA_WEBGL = false;
  // 실험용 ?seam=0 이면 손보기 없이 (비교용)
  const off = new URLSearchParams(location.search).get("seam") === "0";
  const BLEED = !off, R = 1;
  function fix(img) {
    try {
      const w = img.width, h = img.height;
      if (!w || !h || img.__fixed) return img;
      const cv = win.document.createElement("canvas"); cv.width = w; cv.height = h;
      const g = cv.getContext("2d", { willReadFrequently: true }); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, w, h), px = d.data;
      let semi = 0, over = 0;
      for (let i = 3; i < px.length; i += 28) { const a = px[i]; if (a > 8 && a < 247) { semi++; if (Math.max(px[i - 3], px[i - 2], px[i - 1]) > a + 3) over++; } }
      const pma = semi > 50 && over / semi < 0.01;
      for (let i = 3; i < px.length; i += 4) {
        const a = px[i]; if (a === 0 || a === 255) continue;
        if (pma && !off) { const k = 255 / a; px[i - 3] = Math.min(255, px[i - 3] * k); px[i - 2] = Math.min(255, px[i - 2] * k); px[i - 1] = Math.min(255, px[i - 1] * k); }
      }
      // 가장자리 반투명 픽셀의 색을 바로 옆 가장 진한(불투명) 픽셀 색으로 → 조각 경계가 어둡게 비치지 않음
      if (BLEED) {
        const src = new Uint8ClampedArray(px);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4, a = src[i + 3]; if (a === 0 || a === 255) continue;
          let best = -1, ba = a;
          for (let dy = -R; dy <= R; dy++) { const yy = y + dy; if (yy < 0 || yy >= h) continue; for (let dx = -R; dx <= R; dx++) { const xx = x + dx; if (xx < 0 || xx >= w) continue; const j = (yy * w + xx) * 4; if (src[j + 3] > ba) { ba = src[j + 3]; best = j; } } }
          if (best >= 0) { px[i] = src[best]; px[i + 1] = src[best + 1]; px[i + 2] = src[best + 2]; }
        }
      }
      g.putImageData(d, 0, 0);
      cv.__fixed = true;
      return cv;
    } catch (e) { return img; } // 다른 사이트 그림이라 읽기가 막히면 그대로
  }
  const up = T.prototype.update;
  T.prototype.update = function (mip) {
    if (this._image && !this._image.__fixed) this._image = fix(this._image);
    const gl = this.context.gl;
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    try { up.call(this, mip); } finally { gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); }
  };
  }
  window.SpineFix = apply;
  apply(window);
})();
