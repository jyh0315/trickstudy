/* =========================================================
   🖼️ CG 앨범 — 스토리 CG 모아 보기 (CG_CATALOG: 메인 스토리 29화 · 테마극장 76화)
   - 이야기 탭 아래. 공부 시간으로 화가 하나씩 열림
     · 메인 스토리 N화: 그 챕터 이야기가 열리는 때 ((N-1) × 850분)
     · 테마극장 N화: N × 60분
   - 화를 누르면 큰 화면으로 넘겨 보기 (← → · 화면 좌우 누르기 · Esc)
   ========================================================= */
(() => {
"use strict";
const TS = window.TS, S = () => TS.state, esc = TS.esc;
if (typeof CG_CATALOG === "undefined") return;
const PREVIEW = new URLSearchParams(location.search).has("preview");
const KINDS = { main: { label: "메인 스토리", need: (ep) => (ep - 1) * 850 }, theme: { label: "테마극장", need: (ep) => ep * 60 } };
const studied = () => { const s = S(), b = s.story && s.story.base2 != null ? s.story.base2 : s.stats.totalMin; return Math.max(0, s.stats.totalMin - b); };
const hm = (m) => (m >= 60 ? `${Math.floor(m / 60)}시간${m % 60 ? ` ${m % 60}분` : ""}` : `${m}분`);
const dir = (kind, ep) => `assets/story/cg/${kind}/${String(ep).padStart(2, "0")}/`;
const isOpen = (kind, e) => PREVIEW || studied() >= KINDS[kind].need(e.ep);
const seen = () => { const s = S(); if (!s.cgSeen) s.cgSeen = {}; return s.cgSeen; };
let tab = "main";

function card() {
  const list = CG_CATALOG[tab] || [];
  const open = list.filter((e) => isOpen(tab, e)), lock = list.filter((e) => !isOpen(tab, e));
  const show = open.concat(lock.slice(0, 3));
  const total = (k) => CG_CATALOG[k].filter((e) => isOpen(k, e)).length + " / " + CG_CATALOG[k].length;
  return `<div class="card story-ch cga-card"><h3 class="card-title">🖼️ CG 앨범 <small>공부할수록 한 화씩 열려요</small></h3>
    <div class="seg small cga-tabs">${Object.keys(KINDS).map((k) => `<button data-cgatab="${k}" class="${k === tab ? "on" : ""}">${KINDS[k].label} <small>${total(k)}</small></button>`).join("")}</div>
    <div class="cga-grid">${show.map((e) => {
      const o = isOpen(tab, e), cover = e.f[Math.min(2, e.f.length - 1)];
      return `<button class="cga ${o ? "" : "lock"}" ${o ? `data-cga="${tab}:${e.ep}"` : "disabled"}>
        <img src="${dir(tab, e.ep)}${cover}.webp" alt="" loading="lazy">
        <b>Ep.${e.ep} ${esc(e.t)}</b>
        <em>${o ? `${seen()[tab + e.ep] ? "✔" : "NEW"} · ${e.f.length}장` : `🔒 공부 ${hm(Math.max(0, KINDS[tab].need(e.ep) - studied()))} 더`}</em></button>`;
    }).join("")}</div>
    ${lock.length > 3 ? `<p class="hint" style="margin:8px 0 0">🔒 그 밖에 ${lock.length - 3}화가 더 기다리고 있어요.</p>` : ""}</div>`;
}
function mountCard() {
  const el = document.getElementById("view-story"); if (!el) return;
  const old = el.querySelector(".cga-card"), html = card();
  if (old) old.outerHTML = html;
  else { const hint = el.querySelector(":scope > p.hint"); (hint || el.lastElementChild).insertAdjacentHTML("beforebegin", html); }
}
TS.on("refresh", (view) => { if (view === "story") setTimeout(mountCard, 0); });
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-cgatab]"); if (t) { tab = t.dataset.cgatab; return mountCard(); }
  const b = e.target.closest("[data-cga]"); if (b) { const [k, ep] = b.dataset.cga.split(":"); view(k, +ep); }
});

/* ───── 크게 보기 ───── */
function view(kind, ep) {
  const e = CG_CATALOG[kind].find((x) => x.ep === ep); if (!e) return;
  seen()[kind + ep] = 1; TS.save();
  let i = 0;
  const ov = document.createElement("div");
  ov.className = "cga-ov";
  ov.innerHTML = `<div class="cga-top"><b>${KINDS[kind].label} Ep.${ep} · ${esc(e.t)}</b><span class="cga-n"></span><button class="cga-x">✕</button></div>
    <img class="cga-img" alt=""><button class="cga-nav prev">‹</button><button class="cga-nav next">›</button>
    <div class="cga-strip">${e.f.map((f, k) => `<img data-k="${k}" src="${dir(kind, ep)}${f}.webp" loading="lazy" alt="">`).join("")}</div>`;
  document.body.appendChild(ov);
  const img = ov.querySelector(".cga-img");
  const show = (k) => {
    i = (k + e.f.length) % e.f.length;
    img.classList.remove("in"); void img.offsetWidth; img.src = `${dir(kind, ep)}${e.f[i]}.webp`; img.classList.add("in");
    ov.querySelector(".cga-n").textContent = `${i + 1} / ${e.f.length}`;
    ov.querySelectorAll(".cga-strip img").forEach((t, k2) => t.classList.toggle("on", k2 === i));
    const cur = ov.querySelector(".cga-strip img.on"); if (cur) cur.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  };
  const close = () => { ov.remove(); document.removeEventListener("keydown", key); mountCard(); };
  const key = (ev) => { if (ev.key === "Escape") close(); else if (ev.key === "ArrowRight" || ev.key === " ") { ev.preventDefault(); show(i + 1); } else if (ev.key === "ArrowLeft") show(i - 1); };
  document.addEventListener("keydown", key);
  ov.addEventListener("click", (ev) => {
    if (ev.target.closest(".cga-x")) return close();
    const t = ev.target.closest(".cga-strip img"); if (t) return show(+t.dataset.k);
    if (ev.target.closest(".cga-top, .cga-strip")) return;
    if (ev.target.closest(".prev")) return show(i - 1);
    if (ev.target.closest(".next")) return show(i + 1);
    show(ev.clientX < innerWidth / 2 ? i - 1 : i + 1);
  });
  show(0);
}
window.CgAlbum = { view };
})();
