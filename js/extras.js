/* =========================================================
   🎭 대사 연출 모음 — 「트릭컬 사도 정리」 대사 활용
   - 📝 반성문: 집중을 중간에 그만두면 대표 사도가 반성문 (PVP 패배 반성문)
   - 💔 관심 사도 해제: 대표 사도를 바꾸면 이전 사도가 한마디
   - ⏳ 로딩 화면: 시작 화면에서 넘어갈 때 가운데에 크게 사도 한마디 + 로딩 화면 제목
   - 💢 꿀밤 반응: 움직이는 사도도 같이 움찔 (꿀밤 자체는 app.js knock)
   ========================================================= */
(() => {
"use strict";
const TS = window.TS;
const S = () => TS.state;
const esc = TS.esc;
const V = (id) => (typeof voiceOf === "function" ? voiceOf(id) : null);

/* ───── 📝 반성문 ───── */
TS.on("giveup", (min) => {
  const c = TS.SADO_MAP[S().partner], v = c && V(c.id);
  if (!c) return;
  const line = v && v.sorry ? TS.rand(v.sorry) : TS.fmt(TS.rand(TS.linesOf(c, "fail")), c);
  const d = new Date(), date = `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
  S().stats.sorry = (S().stats.sorry || 0) + 1;
  TS.save();
  setTimeout(() => TS.modal(`<div class="sorry-paper">
      <h2>반 성 문</h2>
      <p class="sorry-sub">집중 ${min}분 만에 멈춘 일에 대하여</p>
      <img class="sorry-chibi" src="${TS.chibiSrc(c)}" alt="">
      ${/^\(.*\)$/.test(line.trim()) ? `<div class="sorry-act">${/발바닥|도장/.test(line) ? '<span class="sorry-paw">🐾</span>' : ""}<p>${esc(line)}</p></div>` : `<p class="sorry-text">${esc(line)}</p>`}
      <p class="sorry-sign">${date}<br><b>${esc(c.name)}</b> <span class="sorry-stamp">반성</span></p>
    </div>
    <p class="hint" style="text-align:center">교주님 대신 ${esc(TS.fmt("{name}가", c))} 반성문을 썼어요… 다음엔 끝까지 해 봐요!</p>
    <div class="modal-actions"><button class="btn yellow" data-close>다음엔 끝까지!</button></div>`, null, { cls: "sorry-modal" }), 400);
});

/* ───── 💔 관심 사도 해제 ───── */
let prev = S().partner;
TS.on("start", () => { prev = S().partner; });
TS.on("partner", (id) => {
  const old = prev; prev = id;
  if (!old || old === id) return;
  const c = TS.SADO_MAP[old], v = V(old);
  if (!c || !v || !v.unfav) return;
  TS.toast(`💔 ${TS.shortName(c)}: “${TS.rand(v.unfav)}”`);
});

/* ───── 💢 꿀밤: 움직이는 사도도 반응 ───── */
TS.on("knock", () => { try { window.Live && window.Live.react && (window.Live.react("dizzy") || window.Live.react("angry")); } catch (e) { /* 무시 */ } });

/* ───── ⏳ 로딩 화면 한마디 (시작 화면) ───── */
function loadingLine() {
  const s = S();
  const ids = Object.keys(s.owned || {}).filter((id) => V(id) && V(id).load);
  if (s.partner && V(s.partner) && V(s.partner).load) ids.push(s.partner, s.partner); // 대표 사도는 조금 더 자주
  const pool = ids.length ? ids : Object.keys(SADO_VOICE).filter((id) => SADO_VOICE[id].load);
  const id = TS.rand(pool), c = TS.SADO_MAP[id];
  const [text, title] = TS.rand(V(id).load);
  return { c, text, title };
}
// 시작 화면 → 메인 화면으로 넘어갈 때 가운데에 크게 (로딩 화면처럼)
function showLoading() {
  const L = loadingLine(); if (!L.c) return;
  const ov = document.createElement("div");
  ov.className = "ld-overlay";
  ov.innerHTML = `<div class="ld-card">
      <img class="ld-pic" src="${TS.portrait(L.c, true)}" alt="">
      <div class="ld-text"><small>「${esc(L.title)}」</small><p>${esc(L.text)}</p><b>— ${esc(L.c.name)}</b></div>
    </div>
    <div class="ld-bar"><i></i></div><span class="ld-skip">눌러서 넘기기</span>`;
  document.body.appendChild(ov);
  const close = () => { if (!ov.isConnected) return; ov.classList.add("bye"); setTimeout(() => ov.remove(), 450); };
  ov.onclick = close;
  setTimeout(close, 2800);
}
TS.on("start", () => { if (S().started) showLoading(); });
})();

/* ───── 🎁 선물(장비 장착) · ✦ 돌파(승급·스킬 강화) 반응 ───── */
(() => {
const TS = window.TS, V = (id) => (typeof voiceOf === "function" ? voiceOf(id) : null);
function react(id, key) {
  const c = TS.SADO_MAP[id], v = V(id);
  if (!c || !v || !v[key]) return;
  const line = TS.rand(v[key]);
  if (id === TS.state.partner) setTimeout(() => TS.say(line), 300);
  else setTimeout(() => TS.toast(`💬 ${TS.shortName(c)}: “${line}”`), 600);
}
TS.on("gift", (g) => react(g.id, "equip"));
TS.on("bt", (id) => react(id, "promo"));
})();

/* ───── 📖 어사이드 (「어사이드 발현 · 승급」 독백) ─────
   발현: 호감도 Lv7 또는 돌파 ✦3 · 승급: 호감도 Lv10 또는 돌파 ✦5 */
(() => {
const TS = window.TS, S = () => TS.state, esc = TS.esc;
const V = (id) => (typeof voiceOf === "function" ? voiceOf(id) : null);
const aff = (id) => (window.Affection ? window.Affection.level(id) : 1);
const bt = (id) => (window.Growth ? window.Growth.btOf(id) : 0);
const PARTS = [
  { k: "a", name: "어사이드 발현", ok: (id) => aff(id) >= 7 || bt(id) >= 3, cond: "호감도 Lv7 또는 돌파 ✦3" },
  { k: "b", name: "어사이드 승급", ok: (id) => aff(id) >= 10 || bt(id) >= 5, cond: "호감도 Lv10 또는 돌파 ✦5" },
];
const got = () => { if (!S().aside) S().aside = {}; return S().aside; };
function show(id, k) {
  const c = TS.SADO_MAP[id], v = V(id), P = PARTS.find((x) => x.k === k);
  if (!c || !v || !v.aside || !v.aside[k]) return;
  const ov = document.createElement("div");
  ov.className = "as-overlay";
  ov.innerHTML = `<div class="as-card"><img class="as-pic" src="${TS.portrait(c, true)}" alt="">
    <div class="as-text"><small>📖 ${esc(P.name)}</small><h3>${esc(c.name)}</h3><p></p><button class="btn yellow small">닫기</button></div></div>`;
  document.body.appendChild(ov);
  const p = ov.querySelector("p"), txt = v.aside[k];
  let i = 0; const tick = () => { if (!ov.isConnected) return; p.textContent = txt.slice(0, ++i); if (i < txt.length) setTimeout(tick, 38); };
  tick();
  ov.onclick = (e) => { if (e.target.closest("button") || e.target === ov) ov.remove(); else { i = txt.length; p.textContent = txt; } };
  TS.sfx("level");
}
// 새로 열린 어사이드 알림 (한 번만)
function check() {
  if (!S().started) return;
  const g = got();
  for (const id of Object.keys(S().owned)) {
    const v = V(id); if (!v || !v.aside) continue;
    for (const P of PARTS) {
      if (!v.aside[P.k] || (g[id] && g[id][P.k]) || !P.ok(id)) continue;
      (g[id] = g[id] || {})[P.k] = 1; TS.save();
      const c = TS.SADO_MAP[id];
      TS.toast(`📖 ${TS.shortName(c)}의 ${P.name}이 열렸어요! (사도 상세에서 다시 볼 수 있어요)`);
      setTimeout(() => show(id, P.k), 900);
      return; // 한 번에 하나씩
    }
  }
}
TS.on("refresh", () => setTimeout(check, 50));
TS.on("bt", () => setTimeout(check, 400));
// 사도 상세
TS.detailHooks.push((c) => {
  const v = V(c.id); if (!v || !v.aside || !TS.state.owned[c.id]) return "";
  return `<div class="as-book"><b>📖 어사이드</b>${PARTS.filter((P) => v.aside[P.k]).map((P) => P.ok(c.id)
    ? `<button class="btn pink small" data-aside="${c.id}:${P.k}">${P.name}</button>`
    : `<span class="tk-lock">🔒 ${P.name} · ${P.cond}</span>`).join("")}</div>`;
});
document.addEventListener("click", (e) => { const b = e.target.closest("[data-aside]"); if (!b) return; const [id, k] = b.dataset.aside.split(":"); show(id, k); });
window.Aside = { show, check };
})();
