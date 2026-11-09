/* =========================================================
   ✨ ★★★ 등장 연출 — 모집에서 ★★★ 카드를 뒤집으면
   화면 가득 금빛 연출 + 움직이는 사도(크게) + 이름 + 영입 대사(목소리)
   여러 명이면 차례대로, 화면을 누르면 다음으로
   ========================================================= */
(() => {
"use strict";
const TS = window.TS, esc = TS.esc;
const queue = [];
let cur = null;

function lineOf(c) {
  const v = TS.voice && TS.voice(c.id, "pull"); // 목소리가 있으면 재생
  const t = (v && v.text) || (typeof VOICE_TEXT !== "undefined" && VOICE_TEXT[c.id + "-pull"]);
  if (t) return t;
  const vo = typeof voiceOf === "function" && voiceOf(c.id);
  if (vo && vo.idle && vo.idle.length) return TS.rand(vo.idle);
  return TS.fmt(TS.rand(TS.linesOf(c, "idle")), c);
}

function show(x) {
  const c = x.c;
  const ov = document.createElement("div");
  ov.className = "r3-ov";
  ov.innerHTML = `<div class="r3-rays"></div><div class="r3-flash"></div><div class="r3-spark"></div>
    <div class="r3-stars"><i>★</i><i>★</i><i>★</i></div>
    <div class="r3-char"><img class="r3-img" src="${TS.portrait(c, true)}" alt=""></div>
    <div class="r3-info">
      ${x.isNew ? '<span class="r3-new">NEW!</span>' : ""}
      <div class="r3-name">${esc(c.name)}</div>
      <div class="r3-line"><p></p></div>
    </div>
    <div class="r3-tap">화면을 눌러 계속</div>`;
  document.body.appendChild(ov);
  cur = ov;
  // 반짝이
  const sp = ov.querySelector(".r3-spark");
  for (let i = 0; i < 26; i++) {
    const s = document.createElement("i");
    s.style.left = Math.random() * 100 + "%"; s.style.top = Math.random() * 100 + "%";
    s.style.animationDelay = (Math.random() * 2).toFixed(2) + "s"; s.style.fontSize = 10 + Math.random() * 22 + "px";
    s.textContent = Math.random() < 0.5 ? "✦" : "✧";
    sp.appendChild(s);
  }
  // 움직이는 사도 (안 되면 그림 그대로)
  let live = null;
  const box = ov.querySelector(".r3-char");
  if (window.Live && window.Live.canLive && window.Live.canLive(c.id)) {
    live = window.Live.mount(box, c.id, { frame: "body", onReady: (ctrl) => { box.classList.add("ok"); ctrl.play(TS.rand(["happy", "dance", "proud"])); } });
  }
  TS.sfx("r3");
  // 대사는 사도가 등장한 뒤 타자 치듯
  const p = ov.querySelector(".r3-line p");
  let txt = "", k = 0, typer = 0;
  setTimeout(() => {
    if (!ov.isConnected) return;
    txt = lineOf(c);
    ov.classList.add("talk");
    typer = setInterval(() => { p.textContent = txt.slice(0, ++k); if (k >= txt.length) clearInterval(typer); }, 42);
  }, 1300);
  const t0 = Date.now();
  ov.addEventListener("click", () => {
    if (Date.now() - t0 < 900) return;
    if (txt && k < txt.length) { k = txt.length; p.textContent = txt; clearInterval(typer); return; }
    clearInterval(typer);
    ov.classList.add("bye");
    setTimeout(() => { if (live) live.dispose(); ov.remove(); cur = null; next(); }, 350);
  });
}
function next() { if (!cur && queue.length) show(queue.shift()); }
TS.on("r3", (x) => { if (x && x.c) { queue.push(x); setTimeout(next, 250); } });
window.R3 = { show: (id) => { const c = TS.SADO_MAP[id]; if (c) { queue.push({ c, isNew: true }); next(); } } };
})();
