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
const KINDS = { main: { label: "메인 스토리", need: (ep) => (window.CG_MAIN_NEED && window.CG_MAIN_NEED[ep] != null ? window.CG_MAIN_NEED[ep] : (ep - 1) * 850) }, theme: { label: "테마극장", need: (ep) => ep * 60 } };
const studied = () => { const s = S(), b = s.story && s.story.base2 != null ? s.story.base2 : s.stats.totalMin; return Math.max(0, s.stats.totalMin - b); };
const hm = (m) => (m >= 60 ? `${Math.floor(m / 60)}시간${m % 60 ? ` ${m % 60}분` : ""}` : `${m}분`);
const dir = (kind, ep) => `assets/story/cg/${kind}/${String(ep).padStart(2, "0")}/`;
const isOpen = (kind, e) => PREVIEW || studied() >= KINDS[kind].need(e.ep);
const seen = () => { const s = S(); if (!s.cgSeen) s.cgSeen = {}; return s.cgSeen; };
let tab = "main";
const all = {};
// 이 CG에 움직이는 버전(특별 영상)이 있으면 그 영상 주소
const VID = (() => { const m = {}; if (typeof CG_VIDEO_FROM !== "undefined") for (const [id, p] of Object.entries(CG_VIDEO_FROM)) m[p] = `assets/video/${id}.webm`; return m; })();
const vidOf = (kind, ep, f) => VID[`${kind}/${String(ep).padStart(2, "0")}/${f}`];

function card() {
  const list = CG_CATALOG[tab] || [];
  const open = list.filter((e) => isOpen(tab, e)), lock = list.filter((e) => !isOpen(tab, e));
  // 많이 열리면 길어지니까: 최근에 열린 8화 + 다음에 열릴 3화만, 「전체 보기」로 펼침
  const hidden = all[tab] ? 0 : Math.max(0, open.length - 8);
  const show = open.slice(hidden).concat(lock.slice(0, 3));
  const total = (k) => CG_CATALOG[k].filter((e) => isOpen(k, e)).length + " / " + CG_CATALOG[k].length;
  return `<div class="card story-ch cga-card"><h3 class="card-title">🖼️ CG 앨범 <small>공부할수록 한 화씩 열려요</small></h3>
    <div class="seg small cga-tabs">${Object.keys(KINDS).map((k) => `<button data-cgatab="${k}" class="${k === tab ? "on" : ""}">${KINDS[k].label} <small>${total(k)}</small></button>`).join("")}</div>
    <div class="cga-grid">${show.map((e) => {
      const o = isOpen(tab, e), cover = e.f[Math.min(2, e.f.length - 1)];
      return `<button class="cga ${o ? "" : "lock"}" ${o ? `data-cga="${tab}:${e.ep}"` : "disabled"}>
        <img src="${dir(tab, e.ep)}${cover}.webp" alt="" loading="lazy">
        <b>Ep.${e.ep} ${esc(e.t)}</b>
        <em>${o ? `${seen()[tab + e.ep] ? "✔" : "NEW"} · ${e.f.length}장${e.f.some((f) => vidOf(tab, e.ep, f)) ? " · 🎞️ 영상" : ""}` : `🔒 공부 ${hm(Math.max(0, KINDS[tab].need(e.ep) - studied()))} 더`}</em></button>`;
    }).join("")}</div>
    ${open.length > 8 ? `<div class="modal-actions" style="margin-top:8px"><button class="btn white small" data-cgaall>${all[tab] ? "최근 것만 보기" : `앞의 ${hidden}화도 전체 보기`}</button></div>` : ""}
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
  if (e.target.closest("[data-cgaall]")) { all[tab] = !all[tab]; return mountCard(); }
  const b = e.target.closest("[data-cga]"); if (b) { const [k, ep] = b.dataset.cga.split(":"); view(k, +ep); }
});

/* ───── 크게 보기 ───── */
function view(kind, ep) {
  const e = CG_CATALOG[kind].find((x) => x.ep === ep); if (!e) return;
  seen()[kind + ep] = 1; TS.save();
  let i = 0;
  const ov = document.createElement("div");
  ov.className = "cga-ov";
  ov.innerHTML = `<div class="cga-top"><b>${KINDS[kind].label} Ep.${ep} · ${esc(e.t)}</b><span class="cga-n"></span><button class="cga-x">✕</button></div>${(() => { const t = kind === "theme" && typeof THEME_INFO !== "undefined" && THEME_INFO[ep]; return t && (t.c || t.s.length) ? `<div class="cga-info">${t.c ? `<b>주연: ${esc(t.c)}</b>` : ""}${esc(t.s.join(" "))}</div>` : ""; })()}
    <img class="cga-img" alt=""><video class="cga-vid" loop playsinline autoplay muted></video><button class="cga-nav prev">‹</button><button class="cga-nav next">›</button>
    <div class="cga-strip">${e.f.map((f, k) => `<img data-k="${k}" class="${vidOf(kind, ep, f) ? "mv" : ""}" src="${dir(kind, ep)}${f}.webp" loading="lazy" alt="">`).join("")}</div>`;
  document.body.appendChild(ov);
  const img = ov.querySelector(".cga-img");
  const show = (k) => {
    i = (k + e.f.length) % e.f.length;
    const v = vidOf(kind, ep, e.f[i]), vid = ov.querySelector(".cga-vid");
    img.classList.remove("in"); void img.offsetWidth; img.src = `${dir(kind, ep)}${e.f[i]}.webp`; img.classList.add("in");
    img.style.display = v ? "none" : ""; vid.style.display = v ? "" : "none";
    if (v) { vid.src = v; vid.poster = img.src; vid.play().catch(() => {}); } else { vid.pause(); vid.removeAttribute("src"); }
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
    if (ev.target.closest(".cga-top, .cga-strip, .cga-info")) return;
    if (ev.target.closest(".prev")) return show(i - 1);
    if (ev.target.closest(".next")) return show(i + 1);
    show(ev.clientX < innerWidth / 2 ? i - 1 : i + 1);
  });
  show(0);
}
window.CgAlbum = { view };
})();
