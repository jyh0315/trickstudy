/* =========================================================
   📒 교주노트 — 「사도정리」(나무위키 사도 문서) 기반
   - 📒 교주의 기록: 호감도 Lv.3·6·9·12·15·18·21마다 한 줄씩 (게임의 친밀도 기록)
   - 💝 애장품 + 💌 편지: 호감도 Lv.30에 도착 (게임과 같음)
   - 📇 프로필(별명·종족·좋아하는 것…) · 📖 사도 스토리(에피소드 제목·소개, Lv.1·5·9…마다 열림)
   데이터: assets/data/sado-notes.json (커서 처음엔 안 받고, 잠깐 쉴 때나 필요할 때 한 번 받음)
   ========================================================= */
(() => {
"use strict";
const TS = window.TS;
if (!TS) return;
const S = () => TS.state, esc = TS.esc;
const PREVIEW = new URLSearchParams(location.search).has("preview");
const REC_LV = [3, 6, 9, 12, 15, 18, 21], KS_LV = 30;
const storyLv = (k) => 1 + 4 * k; // 에피소드 1 = Lv.1, 2 = Lv.5, 3 = Lv.9 …

let DATA = null, loading = null;
function load() {
  if (DATA) return Promise.resolve(DATA);
  return loading || (loading = fetch("assets/data/sado-notes.json?v=1").then((r) => r.json()).then((j) => (DATA = j))
    .catch(() => { loading = null; return null; }));
}
TS.sadoNotes = load;
TS.sadoNotesData = () => DATA;
(window.requestIdleCallback || ((f) => setTimeout(f, 4000)))(() => load(), { timeout: 8000 });

const lv = (id) => (PREVIEW ? 99 : TS.affLevel ? TS.affLevel(id) : 1);
const ksSrc = (id, d) => (d.ks && d.ks.img ? `assets/keepsakes/${d.ks.img}.webp` : `assets/chibi/${id}.webp?v=2`);
TS.keepsakeSrc = ksSrc;
const ksImg = (id, d, cls = "") => `<span class="kn-ksimg ${d.ks.img ? "" : "face"} ${cls}"><img src="${ksSrc(id, d)}" alt="" loading="lazy"></span>`;

/* ───── 사도 상세 창 ───── */
const PROF = [["race", "종족"], ["pers", "성격"], ["like", "좋아하는 것"], ["hate", "싫어하는 것"], ["hobby", "취미"], ["cv", "성우"]];
function profHTML(d) {
  const p = d.prof || {}, rows = PROF.filter(([k]) => p[k] && p[k].length);
  if (!rows.length && !d.ep) return "";
  return `<details class="aff-book kn-prof" open><summary>📇 프로필 ${d.ep ? `<small>${esc(d.ep)}</small>` : ""}</summary>
    <dl>${rows.map(([k, t]) => `<dt>${t}</dt><dd>${p[k].map(esc).join(" · ")}</dd>`).join("")}</dl></details>`;
}
function recHTML(d, L) {
  const R = d.rec || []; if (!R.length) return "";
  const open = R.filter((_, i) => L >= REC_LV[i]).length;
  return `<details class="aff-book"><summary>📒 교주의 기록 <b>${open} / ${R.length}</b></summary><ol>${R.map((t, i) => (L >= REC_LV[i]
    ? `<li class="on"><em>친밀 Lv.${REC_LV[i]}</em><span>${esc(t)}</span></li>`
    : `<li><em>친밀 Lv.${REC_LV[i]}</em><span class="lock">🔒 호감도 Lv.${REC_LV[i]}에 기록돼요</span></li>`)).join("")}</ol></details>`;
}
function ksHTML(id, d, L) {
  if (!d.ks) return "";
  if (L < KS_LV) return `<div class="kn-ks lock">${ksImg(id, d)}<div><b>💝 애장품 · 💌 편지</b><span>호감도 Lv.${KS_LV}이 되면 ${esc(TS.SADO_MAP[id].name)}의 애장품과 편지가 도착해요.</span></div></div>`;
  return `<div class="kn-ks">${ksImg(id, d)}<div><b>💝 ${esc(d.ks.name)}</b><span>${esc(d.ks.desc)}</span>
    ${d.letter && d.letter.length ? `<button class="btn pink small" data-letter="${id}">💌 편지 읽기</button>` : ""}</div></div>`;
}
function storyHTML(d, L) {
  const st = d.story || []; if (!st.length) return "";
  const open = st.filter((_, k) => L >= storyLv(k)).length;
  return `<details class="aff-book"><summary>📖 사도 스토리 <b>${open} / ${st.length}</b></summary><ol>${st.map(([t, b], k) => (L >= storyLv(k)
    ? `<li class="on"><em>에피소드 ${k + 1}</em><b>${esc(t)}</b><span>${esc(b)}</span></li>`
    : `<li><em>에피소드 ${k + 1}</em><span class="lock">🔒 호감도 Lv.${storyLv(k)}에 열려요</span></li>`)).join("")}</ol></details>`;
}
function body(id) {
  const d = DATA && DATA[id]; if (!d) return "";
  const L = lv(id);
  return profHTML(d) + ksHTML(id, d, L) + recHTML(d, L) + storyHTML(d, L) + (TS.banquetNoteHTML ? TS.banquetNoteHTML(id, d) : "");
}
function fill(id) {
  load().then(() => document.querySelectorAll(`[data-kn="${id}"]:not([data-kn-ok])`).forEach((el) => { el.innerHTML = body(id); el.dataset.knOk = 1; }));
}
TS.detailHooks.push((c) => {
  if (!S().owned[c.id] && !PREVIEW) return "";
  if (DATA) return `<div class="kn-wrap" data-kn="${c.id}" data-kn-ok="1">${body(c.id)}</div>`;
  setTimeout(() => fill(c.id), 0);
  return `<div class="kn-wrap" data-kn="${c.id}"><p class="hint">📒 교주노트를 펼치는 중…</p></div>`;
});

/* ───── 💌 편지 ───── */
function openLetter(id) {
  load().then(() => {
    const d = DATA && DATA[id], c = TS.SADO_MAP[id];
    if (!d || !d.ks || !c) return;
    TS.sfx && TS.sfx("r3");
    TS.modal(`<div class="sorry-paper kn-letter">
        ${ksImg(id, d, "big")}
        <p class="sorry-sub">${esc(c.name)}의 편지 · 애장품 「${esc(d.ks.name)}」과 함께</p>
        ${(d.letter || []).map((t) => `<p>${esc(t)}</p>`).join("")}
      </div>
      <div class="modal-actions"><button class="btn yellow" data-close>소중히 간직하기</button></div>`, null, { cls: "kn-letter-modal" });
  });
}
TS.openLetter30 = openLetter;
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-letter]");
  if (!b) return;
  e.preventDefault();
  const back = b.closest(".modal-back");
  if (back) back.querySelector("[data-close]") && back.querySelector("[data-close]").click(); // 지금 창을 닫고 편지
  openLetter(b.dataset.letter);
});

/* ───── 호감도 레벨업 때 (affection.js 에서 부름) ───── */
TS.noteLevelHTML = (id, L) => {
  const d = DATA && DATA[id];
  if (!d) { load(); return ""; }
  let h = "";
  const ri = REC_LV.indexOf(L);
  if (ri >= 0 && d.rec && d.rec[ri]) h += `<div class="kn-new"><b>📒 교주의 기록에 한 줄 늘었어요</b><span>${esc(d.rec[ri])}</span></div>`;
  const si = (d.story || []).findIndex((_, k) => storyLv(k) === L);
  if (si >= 0) h += `<div class="kn-new"><b>📖 사도 스토리 「${esc(d.story[si][0])}」가 열렸어요</b><span>${esc(d.story[si][1])}</span></div>`;
  if (L === KS_LV && d.ks) {
    const s = S(); if (!s.ks30) s.ks30 = {};
    if (!s.ks30[id]) s.ks30[id] = TS.today();
    h += `<div class="ks-got">${ksImg(id, d)}<div><b>💝 애장품 「${esc(d.ks.name)}」과 편지가 도착했어요!</b><span>${esc(d.ks.desc)}</span>
      ${d.letter && d.letter.length ? `<button class="btn pink small" data-letter="${id}">💌 편지 읽기</button>` : ""}</div></div>`;
  }
  return h;
};
})();
