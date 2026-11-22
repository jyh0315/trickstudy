/* =========================================================
   💬 볼따구콘 창 — 미니 타이머처럼 다른 창(Gmail 등) 위에 떠 있는 이모티콘 판
   · 누르면 복사 → Gmail 쓰기 창에서 Ctrl+V 하면 움직이는 GIF 로 들어감
   · 끌어다 놓기(드래그)로도 넣을 수 있음
   1순위 Document Picture-in-Picture (항상 위), 안 되면 작은 새 창
   ========================================================= */
(() => {
"use strict";
const $ = (id) => document.getElementById(id);
const NAMES = [1, 2].flatMap((k) => Array.from({ length: 24 }, (_, i) => `bolddagu${k}-${String(i + 1).padStart(2, "0")}`));
// 크기: 소(108px) · 중(1.5배) · 대(2배) — 끌어다 놓으면 GIF 원래 크기로 들어가서 크기별 파일을 따로 둠
const SIZES = { s: { dir: "", px: 106, label: "소" }, m: { dir: "m/", px: 159, label: "중" }, l: { dir: "l/", px: 212, label: "대" } };
const SKEY = "trickstudy-emo-size";
let size = (() => { try { return SIZES[localStorage.getItem(SKEY)] ? localStorage.getItem(SKEY) : "s"; } catch (e) { return "s"; } })();
const gifURL = (n) => new URL(`assets/kakao/gif/${SIZES[size].dir}${n}.gif`, location.href).href;
const RKEY = "trickstudy-emo-recent";
const recent = () => { try { return (JSON.parse(localStorage.getItem(RKEY) || "[]") || []).filter((n) => NAMES.includes(n)); } catch (e) { return []; } };
const pushRecent = (n) => { try { localStorage.setItem(RKEY, JSON.stringify([n, ...recent().filter((x) => x !== n)].slice(0, 12))); } catch (e) { /* 무시 */ } };

const CSS = `
*{box-sizing:border-box} body{margin:0;background:#fff8e6;font:13px "Pretendard","Apple SD Gothic Neo","Malgun Gothic",sans-serif;color:#3b2a20}
.ep{display:flex;flex-direction:column;height:100vh}
.ep-top{display:flex;gap:4px;padding:6px;align-items:center;border-bottom:2px solid #3b2a20;background:#ffe9a8}
.ep-top button{font:12px inherit;font-weight:700;border:2px solid #3b2a20;border-radius:9px;background:#fff;padding:3px 8px;cursor:pointer;color:#3b2a20}
.ep-top button.on{background:#ffd24d}
.ep-top .sp{flex:1}
.ep-top .sz{display:inline-flex;gap:2px}
.ep-top .sz button{padding:3px 7px}
.ep-grid{flex:1;overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(76px,1fr));gap:4px;padding:6px;align-content:start}
.ep-grid button{border:2px solid transparent;border-radius:10px;background:#fff;padding:2px;cursor:pointer;aspect-ratio:1}
.ep-grid button:hover{border-color:#ff8fb1}
.ep-grid img{width:100%;height:100%;object-fit:contain;display:block;pointer-events:auto}
.ep-tip{padding:5px 8px;font-size:11.5px;border-top:2px solid #3b2a20;background:#fff}
.ep-tip.ok{background:#d9f7e6}
.ep-empty{grid-column:1/-1;padding:20px;text-align:center;opacity:.7}`;

function build(win) {
  const d = win.document;
  d.title = "💬 볼따구콘";
  const st = d.createElement("style"); st.textContent = CSS; d.head.appendChild(st);
  d.body.innerHTML = `<div class="ep">
    <div class="ep-top"><button data-t="recent">⭐ 최근</button><button data-t="1">볼따구콘 1</button><button data-t="2">볼따구콘 2</button><span class="sp"></span><span class="sz">${Object.entries(SIZES).map(([k, v]) => `<button data-s="${k}">${v.label}</button>`).join("")}</span></div>
    <div class="ep-grid" id="g"></div>
    <div class="ep-tip" id="tip" title="오른쪽 클릭 → '이미지 복사' 해도 돼요"><b>끌어다 놓기 = 움직이는 그림</b> · 누르면 복사 (Ctrl+V 는 멈춘 그림)</div></div>`;
  const g = d.getElementById("g"), tip = d.getElementById("tip");
  let tab = recent().length ? "recent" : "1";
  const draw = () => {
    d.querySelectorAll("[data-t]").forEach((b) => b.classList.toggle("on", b.dataset.t === tab));
    d.querySelectorAll("[data-s]").forEach((b) => b.classList.toggle("on", b.dataset.s === size));
    const list = tab === "recent" ? recent() : NAMES.filter((n) => n.startsWith("bolddagu" + tab));
    g.innerHTML = list.length ? list.map((n) => `<button data-n="${n}" title="눌러서 복사"><img src="${gifURL(n)}" alt="이모티콘" draggable="true"></button>`).join("") : `<div class="ep-empty">아직 쓴 이모티콘이 없어요</div>`;
  };
  d.querySelector(".ep-top").onclick = (e) => {
    const b = e.target.closest("[data-t]"); if (b) { tab = b.dataset.t; draw(); }
    const z = e.target.closest("[data-s]"); if (z) { size = z.dataset.s; try { localStorage.setItem(SKEY, size); } catch (er) { /* 무시 */ } draw(); say(`크기: <b>${SIZES[size].label}</b> (${SIZES[size].px}px) — 이 크기로 들어가요`, true); }
  };
  let tT = 0;
  const say = (t, ok) => { tip.innerHTML = t; tip.classList.toggle("ok", !!ok); clearTimeout(tT); tT = win.setTimeout(() => { tip.innerHTML = "<b>끌어다 놓기 = 움직이는 그림</b> · 누르면 복사 (Ctrl+V 는 멈춘 그림)"; tip.classList.remove("ok"); }, 2600); };
  g.onclick = async (e) => {
    const b = e.target.closest("[data-n]"); if (!b) return;
    const url = gifURL(b.dataset.n), px = SIZES[size].px, html = `<img src="${url}" alt="이모티콘" width="${px}">`;
    // 그림 데이터(PNG) + html(움직이는 GIF 주소) + 주소 를 같이 — "이미지 복사" 와 같은 모양이라 Gmail 이 붙여넣기를 받아 줌
    const png = () => new Promise((ok, no) => {
      const im = b.querySelector("img"), c = d.createElement("canvas");
      c.width = im.naturalWidth || px; c.height = im.naturalHeight || px;
      try { c.getContext("2d").drawImage(im, 0, 0); c.toBlob((bl) => (bl ? ok(bl) : no(new Error("png"))), "image/png"); } catch (e) { no(e); }
    });
    const T = (t, type) => new Blob([t], { type });
    try {
      await win.navigator.clipboard.write([new win.ClipboardItem({ "image/png": png(), "text/html": T(html, "text/html"), "text/plain": T(url, "text/plain") })]);
      say("📋 복사했어요 — Ctrl+V 는 멈춘 그림이에요. 움직이게 하려면 <b>끌어다 놓아요</b>", true);
    } catch (er) {
      try { await win.navigator.clipboard.write([new win.ClipboardItem({ "image/png": png() })]); say("📋 그림으로 복사했어요 (멈춘 그림) — 움직이게 하려면 끌어다 놓아요", true); }
      catch (er2) { try { await win.navigator.clipboard.writeText(url); say("주소만 복사됐어요 — 이모티콘을 메일로 끌어다 놓아 주세요"); } catch (er3) { say("복사가 막혔어요 — 이모티콘을 메일로 끌어다 놓아 주세요"); } }
    }
    pushRecent(b.dataset.n);
  };
  g.addEventListener("dragstart", (e) => { const b = e.target.closest("[data-n]"); if (b) pushRecent(b.dataset.n); });
  draw();
}

let win = null;
async function open() {
  if (win && !win.closed) { win.focus(); return; }
  try {
    if ("documentPictureInPicture" in window) {
      if (window.documentPictureInPicture.window) { (window.TS && TS.toast) ? TS.toast("미니 타이머 창을 닫고 다시 눌러 주세요 (작은 창은 하나만 띄울 수 있어요)") : 0; return; }
      win = await window.documentPictureInPicture.requestWindow({ width: 340, height: 460 });
    } else {
      win = window.open("", "trickstudy-emo", "popup,width=360,height=500");
      if (!win) return window.TS && TS.toast && TS.toast("팝업이 막혔어요 — 주소창 오른쪽에서 팝업을 허용해 주세요");
      win.document.body.innerHTML = "";
    }
    build(win);
  } catch (e) { console.warn(e); window.TS && TS.toast && TS.toast("이모티콘 창을 열 수 없어요"); }
}
const b = $("emo-btn"); if (b) b.onclick = open;
window.EmoPip = { open };
})();
