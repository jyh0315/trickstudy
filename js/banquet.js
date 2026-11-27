/* =========================================================
   🍽️ 연회장 — 대표 사도에게 오늘의 메뉴 중 하나를 대접하기
   - 메뉴·반응: 「사도정리」 문서의 '연회장 선호 음식' (좋아하는 음식 2 · 싫어하는 음식 2 · 공통 간식)
   - 오늘의 메뉴 8가지 = 그 사도가 좋아하는 것·싫어하는 것·공통 간식·아무 반응 없는 음식을 섞어서 (하루 동안 같은 메뉴)
   - 대접권: 매일 3장 + 집중 25분마다 1장 (최대 6장)
   - 좋아하는 음식 💗+40 · 공통 간식 +15 · 무난 +8 · 싫어하는 음식 +2. 알아낸 취향은 사도 상세의 「🍽️ 연회장 취향 노트」에 기록
   ========================================================= */
(() => {
"use strict";
const TS = window.TS;
if (!TS) return;
const S = () => TS.state, esc = TS.esc;
const DAILY = 3, MAX = 6;
const FOOD = {
  "캔 사료": "🥫", "우주식량": "🛰️", "따뜻한 아이스 아메리카노": "☕", "비밀의 포도주스": "🍇", "초콜릿 아이스크림": "🍫",
  "UFC 당근 튀김": "🥕", "공기 커틀릿": "🍽️", "레몬차": "🍋", "계피맛 알사탕": "🍬", "한입초 쌈": "🥬", "만화 고기 구이": "🍖",
  "캬라멜 팝콘": "🍿", "코코넛 솔잎죽": "🥥", "용족 사탕": "💎", "민트 초코 아이스크림": "🍨", "석류석 열매": "🍒", "크림 브륄레": "🍮",
  "딸기 케이크": "🍰", "마시멜로 마카롱": "🍡", "매듭 빵": "🥨", "쌀밥 한 공기": "🍚", "보석 타르트": "🥧", "호박 스프": "🎃",
  "멜론 보코치니": "🍈", "유령 푸딩": "👻", "꿀단지": "🍯", "금탕후루": "🍢", "해초 샐러드": "🥗", "허니갈릭 살몬": "🐟", "미숫가루": "🥛",
  "송편": "🌙", "새콤비타F": "🍊", "얌얌비타C": "💊", "킹짱비타K": "👑", "부쉬 드 노엘": "🎄", "아몬드 로쉐": "🌰", "떡국": "🍲", "에심당 뽈사탕": "🍭",
};
const SPECIAL = Object.keys(FOOD).slice(0, 30);
/* 음식 그림 (게임 연회장 그림, assets/food/<SPECIAL 순서 두 자리>.webp). 공통 간식 8가지는 그림이 없어서 이모지 */
const ic = (f, cls = "") => { const i = SPECIAL.indexOf(f); return i >= 0 ? `<img class="bq-img ${cls}" src="assets/food/${String(i).padStart(2, "0")}.webp" alt="">` : `<span class="bq-emo ${cls}">${FOOD[f] || "🍽️"}</span>`; };
const PTS = { like: 40, etc: 15, ok: 8, hate: 2 };
const MARK = { like: "💗", hate: "💢", etc: "🙂", ok: "😐" };

/* 대접권 */
function tk() {
  const s = S(), t = TS.today();
  if (!s.banq || s.banq.d !== t) s.banq = { d: t, n: Math.max(DAILY, (s.banq && s.banq.n) || 0) };
  return s.banq;
}
TS.on("focus", ({ min }) => {
  const add = Math.floor(min / 25); if (!add) return;
  const b = tk(); b.n = Math.min(MAX, b.n + add);
});
const book = (id) => { const s = S(); if (!s.banqNote) s.banqNote = {}; return s.banqNote[id] || (s.banqNote[id] = {}); };

/* 오늘의 메뉴: 날짜+사도로 정해지는 섞기 (다시 열어도 같음) */
function seeded(str) { let h = 2166136261; for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296; }
function menu(id, d) {
  const r = seeded(TS.today() + id), pick = (arr, n) => arr.slice().sort(() => r() - 0.5).slice(0, n);
  const F = d.food || { like: [], hate: [], etc: [] };
  const known = new Set([...F.like, ...F.hate].map((x) => x[0]));
  const items = [
    ...F.like.map(([f, t]) => ({ f, t, k: "like" })), ...F.hate.map(([f, t]) => ({ f, t, k: "hate" })),
    ...pick(F.etc, 2).map(([f, t]) => ({ f, t, k: "etc" })),
    ...pick(SPECIAL.filter((f) => !known.has(f)), 8 - F.like.length - F.hate.length - Math.min(2, F.etc.length)).map((f) => ({ f, t: null, k: "ok" })),
  ];
  return items.sort(() => r() - 0.5);
}

function open() {
  const id = S().partner, c = id && TS.SADO_MAP[id];
  if (!c || !S().owned[id]) { TS.toast("대표 사도를 먼저 정해 주세요!"); return; }
  TS.sadoNotes().then((D) => {
    const d = D && D[id];
    if (!d || !d.food) { TS.toast(`${c.name}의 연회장 취향 기록이 아직 없어요.`); return; }
    const M = menu(id, d), b = tk(), note = book(id);
    TS.modal(`<h2>🍽️ 연회장 <small>${esc(c.name)} 초대</small></h2>
      <img class="modal-emote" src="${TS.portrait(c, true)}" alt="" style="width:96px;height:96px">
      <p class="hint">오늘의 메뉴 중 하나를 대접해요. 좋아하는 음식을 맞히면 💗+${PTS.like}! · 남은 대접권 <b>🎟️ ${b.n}</b> <small>(매일 ${DAILY}장 · 집중 25분마다 +1)</small></p>
      <div class="bq-grid">${M.map((x, i) => `<button class="bq-dish" data-bq="${i}" ${b.n ? "" : "disabled"}>
        <span class="bq-ic">${ic(x.f)}</span><b>${esc(x.f)}</b>${note[x.f] ? `<em>${MARK[note[x.f]]}</em>` : ""}</button>`).join("")}</div>
      <div class="modal-actions"><button class="btn white" data-close>다음에</button></div>`,
    (el, close) => el.querySelectorAll("[data-bq]").forEach((btn) => (btn.onclick = () => { close(); serve(id, c, M[+btn.dataset.bq]); })), { cls: "bq-modal" });
  });
}
function serve(id, c, x) {
  const b = tk(); if (b.n <= 0) return;
  b.n--;
  book(id)[x.f] = x.k;
  const live = S().partner === id && window.Live;
  if (live) window.Live.react(x.k === "hate" ? "angry" : x.k === "ok" ? "talk" : "eat");
  TS.sfx && TS.sfx(x.k === "like" ? "r3" : x.k === "hate" ? "poke" : "coin");
  if (x.k === "like") TS.confetti && TS.confetti(40);
  const text = x.t || "조용히 접시를 비웠다. 특별히 좋아하지도, 싫어하지도 않는 눈치다.";
  const head = { like: "💗 좋아하는 음식이에요!", hate: "💢 싫어하는 음식이었어요…", etc: "🙂 맛있게 먹었어요", ok: "😐 무난했어요" }[x.k];
  setTimeout(() => TS.modal(`<div class="bq-plate">${ic(x.f, "big")}</div><h2>${esc(x.f)}</h2>
      <img class="modal-emote" src="${TS.portrait(c, true)}" alt="">
      <p class="bq-head">${head}</p>
      <div class="kn-new"><b>📒 교주의 기록</b><span>${esc(text)}</span></div>
      <div class="reward-row"><span class="reward-chip">💗 +${PTS[x.k]}</span><span class="reward-chip">🎟️ 남은 대접권 ${b.n}</span></div>
      <div class="modal-actions"><button class="btn yellow" data-close>좋아</button>${b.n ? '<button class="btn white" data-bq-more>한 번 더</button>' : ""}</div>`,
    (el, close) => { const m = el.querySelector("[data-bq-more]"); if (m) m.onclick = () => { close(); open(); }; }), 350);
  window.Affection && window.Affection.gain(id, PTS[x.k]);
  TS.emit && TS.emit("banquet", { id, food: x.f, kind: x.k });
  TS.save(); TS.refresh();
}
TS.openBanquet = open;

/* 사도 상세: 알아낸 취향 (kyoju-note.js 가 부름) */
TS.banquetNoteHTML = (id, d) => {
  if (!d.food) return "";
  const note = book(id), F = d.food;
  const all = [...F.like.map((x) => [x[0], "like"]), ...F.hate.map((x) => [x[0], "hate"]), ...F.etc.map((x) => [x[0], "etc"])];
  const found = all.filter(([f]) => note[f]).length;
  return `<details class="aff-book"><summary>🍽️ 연회장 취향 노트 <b>${found} / ${all.length}</b></summary>
    <div class="bq-note">${all.map(([f, k]) => (note[f] ? `<span class="bq-tag ${k}">${ic(f, "sm")} ${esc(f)} ${MARK[k]}</span>` : `<span class="bq-tag lock">❔ ???</span>`)).join("")}</div>
    <p class="hint">로비의 🍽️ 연회장에서 대접하면 기록돼요.</p></details>`;
};

/* 로비 버튼 */
function addBtn() {
  const g = document.getElementById("gift-btn"); if (!g || document.getElementById("bq-btn")) return;
  const b = document.createElement("button");
  b.id = "bq-btn"; b.type = "button"; b.className = "btn white small"; b.textContent = "🍽️ 연회장";
  g.insertAdjacentElement("afterend", b); b.onclick = open;
  const upd = () => { const n = tk().n; b.textContent = n ? `🍽️ 연회장 ${n}` : "🍽️ 연회장"; };
  upd(); TS.on("refresh", upd);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addBtn); else addBtn();
})();
