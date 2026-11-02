/* =========================================================
   🎭 대사 연출 모음 — 「트릭컬 사도 정리」 대사 활용
   - 📝 반성문: 집중을 중간에 그만두면 대표 사도가 반성문 (PVP 패배 반성문)
   - 💔 관심 사도 해제: 대표 사도를 바꾸면 이전 사도가 한마디
   - ⏳ 로딩 화면: 시작 화면 아래에 사도 한마디 + 로딩 화면 제목
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
      <p class="sorry-text">${esc(line)}</p>
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
function showLoading() {
  const root = document.getElementById("title"); if (!root || root.querySelector(".ttl-load")) return;
  const L = loadingLine(); if (!L.c) return;
  const el = document.createElement("div");
  el.className = "ttl-load";
  el.innerHTML = `<img src="${TS.chibiSrc(L.c)}" alt=""><div><small>「${esc(L.title)}」</small><p>${esc(L.text)}</p><b>— ${esc(TS.shortName(L.c))}</b></div>`;
  root.appendChild(el);
}
// 시작 화면이 그려진 뒤에 붙이기 (title.js가 #title 을 만듦)
const mo = new MutationObserver(() => { if (document.getElementById("title")) showLoading(); });
mo.observe(document.body, { childList: true });
if (document.getElementById("title")) showLoading();
TS.on("start", () => mo.disconnect());
})();
