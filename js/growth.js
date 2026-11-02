/* =========================================================
   ✦ 돌파 · 🔁 환생 · 장기 꾸미기
   - 돌파: 사도마다 ✦1~5. 중복 영입(표정을 다 연 뒤) 또는 별사탕으로 올림
           대표 사도의 돌파 1단계당 집중 보상 +4% (최대 +20%)
   - 환생: 사도 100명 이상 모으면 원할 때만. 대표 사도만 남기고 도감을 비우는 대신
           영구 집중 보상 +10%/회 (최대 +50%), 별사탕 300, 환생 칭호·프레임·테마·뱃지
   - 몇 년 걸리는 장기 칭호 · 프레임 · 카드 테마 · 뱃지
   ========================================================= */
const REBORN_NEED = 100, REBORN_BONUS = 0.1, REBORN_MAX = 5;
const btOf = (s, id) => (s.owned[id] && s.owned[id].bt) || 0;
const btFull = (s) => Object.values(s.owned).filter((o) => (o.bt || 0) >= 5).length;
const rebornN = (s) => (s.reborn && s.reborn.n) || 0;
const petN = (s) => Object.keys((s.pets && s.pets.owned) || {}).length;
const goodSeasons = (s) => Object.values((s.season && s.season.hist) || {}).filter((h) => h.lv >= 20).length;
const H = (h) => h * 60;

PROFILE_TITLES.push(
  { id: "h100",     label: "백 시간의 교주",   cond: "누적 집중 100시간",     ok: (s) => s.stats.totalMin >= H(100) },
  { id: "h300",     label: "300시간 장인",     cond: "누적 집중 300시간",     ok: (s) => s.stats.totalMin >= H(300) },
  { id: "h1000",    label: "천 시간의 현자",   cond: "누적 집중 1000시간",    ok: (s) => s.stats.totalMin >= H(1000) },
  { id: "st30",     label: "한 달 개근",       cond: "30일 연속 공부",        ok: (s) => s.stats.bestStreak >= 30 },
  { id: "st100",    label: "백일 개근",        cond: "100일 연속 공부",       ok: (s) => s.stats.bestStreak >= 100 },
  { id: "todo100",  label: "의뢰 해결사",      cond: "의뢰 100개 해결",       ok: (s) => (s.stats.todosDone || 0) >= 100 },
  { id: "todo500",  label: "의뢰의 전설",      cond: "의뢰 500개 해결",       ok: (s) => (s.stats.todosDone || 0) >= 500 },
  { id: "lv30",     label: "베테랑 교주",      cond: "레벨 30",              ok: (s) => s.level >= 30 },
  { id: "lv50",     label: "교주 중의 교주",   cond: "레벨 50",              ok: (s) => s.level >= 50 },
  { id: "dex",      label: "도감 완성",        cond: "사도 136명 모두 영입",   ok: (s) => Object.keys(s.owned).length >= SADO.length },
  { id: "bt1",      label: "돌파의 달인",      cond: "사도 1명 돌파 ✦5",      ok: (s) => btFull(s) >= 1 },
  { id: "bt10",     label: "한계 돌파",        cond: "사도 10명 돌파 ✦5",     ok: (s) => btFull(s) >= 10 },
  { id: "rb1",      label: "환생한 교주",      cond: "환생 1회",             ok: (s) => rebornN(s) >= 1 },
  { id: "rb3",      label: "윤회의 교주",      cond: "환생 3회",             ok: (s) => rebornN(s) >= 3 },
  { id: "rb5",      label: "영원의 교주",      cond: "환생 5회",             ok: (s) => rebornN(s) >= 5 },
  { id: "pet40",    label: "펫 조련사",        cond: "펫 40마리",            ok: (s) => petN(s) >= 40 },
  { id: "petall",   label: "펫 박사",          cond: "펫 79마리 모두",        ok: (s) => petN(s) >= 79 },
  { id: "four",     label: "사계절 교주",      cond: "시즌 4개를 20단계 이상", ok: (s) => goodSeasons(s) >= 4 },
  { id: "poke1k",   label: "볼따구 마스터",    cond: "볼 찌르기 1000번",      ok: (s) => s.stats.pokes >= 1000 },
);
PROFILE_FRAMES.push(
  { id: "sakura",  label: "벚꽃",   cond: "30일 연속 공부",     ok: (s) => s.stats.bestStreak >= 30 },
  { id: "galaxy",  label: "은하수", cond: "누적 집중 100시간",  ok: (s) => s.stats.totalMin >= H(100) },
  { id: "crystal", label: "크리스탈", cond: "사도 1명 돌파 ✦5", ok: (s) => btFull(s) >= 1 },
  { id: "royal",   label: "왕관",   cond: "레벨 30",           ok: (s) => s.level >= 30 },
  { id: "paw",     label: "발바닥", cond: "펫 20마리",         ok: (s) => petN(s) >= 20 },
  { id: "phoenix", label: "불사조", cond: "환생 1회",          ok: (s) => rebornN(s) >= 1 },
  { id: "aurora",  label: "오로라", cond: "환생 3회",          ok: (s) => rebornN(s) >= 3 },
);
PROFILE_THEMES.push(
  { id: "forest",  label: "숲속",     cond: "의뢰 100개 해결",    ok: (s) => (s.stats.todosDone || 0) >= 100 },
  { id: "ocean",   label: "바닷속",   cond: "30일 연속 공부",     ok: (s) => s.stats.bestStreak >= 30 },
  { id: "rose",    label: "장미정원", cond: "사도 100명",         ok: (s) => Object.keys(s.owned).length >= 100 },
  { id: "goldlux", label: "황금",     cond: "레벨 50",           ok: (s) => s.level >= 50 },
  { id: "cosmos",  label: "우주",     cond: "환생 1회",          ok: (s) => rebornN(s) >= 1 },
  { id: "library", label: "대도서관", cond: "누적 집중 300시간",  ok: (s) => s.stats.totalMin >= H(300) },
);
PROFILE_BADGES.push(
  { id: "h100",  icon: "📖", label: "누적 100시간",  ok: (s) => s.stats.totalMin >= H(100) },
  { id: "h1000", icon: "🏛️", label: "누적 1000시간", ok: (s) => s.stats.totalMin >= H(1000) },
  { id: "st30",  icon: "🌸", label: "30일 연속",     ok: (s) => s.stats.bestStreak >= 30 },
  { id: "st100", icon: "💯", label: "100일 연속",    ok: (s) => s.stats.bestStreak >= 100 },
  { id: "dex",   icon: "📚", label: "도감 완성",     ok: (s) => Object.keys(s.owned).length >= SADO.length },
  { id: "bt5",   icon: "✦",  label: "돌파 ✦5",      ok: (s) => btFull(s) >= 1 },
  { id: "rb1",   icon: "🔁", label: "환생",         ok: (s) => rebornN(s) >= 1 },
  { id: "rb5",   icon: "♾️", label: "환생 5회",     ok: (s) => rebornN(s) >= 5 },
);

(() => {
"use strict";
const TS = window.TS;
const $ = (id) => document.getElementById(id);
const S = () => TS.state;
const esc = TS.esc;

/* 예전 기록: 중복으로 받은 만큼 돌파 단계를 채워 줌 (한 번만) */
(function migrate() {
  const s = S();
  if (s.btInit) return;
  Object.entries(s.owned).forEach(([id, o]) => {
    if (o.bt != null) return;
    const c = TS.SADO_MAP[id];
    const usedEmo = c && c.emote ? Math.max(0, (o.emo || 1) - 1) : 0;
    o.bt = Math.max(0, Math.min(CONFIG.btMax, (o.n || 1) - 1 - usedEmo));
  });
  s.btInit = 1; TS.save();
})();

/* ───── 보상 배율 ───── */
TS.rewardHooks.push((rw) => {
  const s = S(), bt = btOf(s, s.partner), rb = Math.min(REBORN_MAX, rebornN(s));
  if (bt) { rw.eff *= 1 + CONFIG.btBonus * bt; rw.notes.push(`✦ 돌파 +${Math.round(CONFIG.btBonus * bt * 100)}%`); }
  if (rb) { rw.eff *= 1 + REBORN_BONUS * rb; rw.notes.push(`🔁 환생 +${Math.round(REBORN_BONUS * rb * 100)}%`); }
});

/* ───── 사도 상세: 돌파 ───── */
function btHTML(c) {
  const o = S().owned[c.id]; if (!o) return "";
  const bt = o.bt || 0, cost = CONFIG.btCost[c.rarity], max = bt >= CONFIG.btMax;
  return `<div class="bt-box" data-btbox="${c.id}">
    <div class="bt-stars">${[1, 2, 3, 4, 5].map((i) => `<span class="${i <= bt ? "on" : ""}">✦</span>`).join("")}</div>
    <p class="bt-desc">돌파 <b>${bt} / ${CONFIG.btMax}</b> · 대표 사도일 때 집중 보상 <b>+${Math.round(bt * CONFIG.btBonus * 100)}%</b></p>
    ${max ? '<p class="hint">최대 돌파! 이제 중복은 별사탕으로 바뀌어요.</p>'
      : `<button class="btn pink small" data-btbuy="${c.id}" ${S().candy < cost ? "disabled" : ""}><i class="ic-candy"></i> ${cost}개로 돌파 ✦${bt + 1}</button>
         <p class="hint">${c.emote && (o.emo || 1) < 4 ? "중복 영입은 표정을 먼저 열고, 그다음 돌파에 쓰여요." : "중복으로 영입해도 돌파가 올라가요."}</p>`}
  </div>`;
}
TS.detailHooks.push(btHTML);
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-btbuy]"); if (!b) return;
  const id = b.dataset.btbuy, c = TS.SADO_MAP[id], o = S().owned[id], cost = CONFIG.btCost[c.rarity];
  if (!o || (o.bt || 0) >= CONFIG.btMax || S().candy < cost) return;
  S().candy -= cost; o.bt = (o.bt || 0) + 1;
  TS.sfx("r2"); TS.confetti(40); TS.toast(`✦ ${c.name} 돌파 ${o.bt}단계!`); TS.emit("bt", id);
  TS.save(); TS.refresh();
  const box = document.querySelector(`[data-btbox="${id}"]`);
  if (box) box.outerHTML = btHTML(c);
});

/* ───── 환생 ───── */
function rebornBtn() {
  const head = $("sado-count"); if (!head) return;
  let b = $("reborn-btn");
  if (!b) {
    b = document.createElement("button"); b.id = "reborn-btn"; b.className = "btn small white reborn-btn";
    b.onclick = openReborn; head.after(b);
  }
  const n = Object.keys(S().owned).length, rb = rebornN(S());
  b.innerHTML = `🔁 환생${rb ? ` <b>${rb}</b>` : ""}`;
  b.classList.toggle("ready", n >= REBORN_NEED && rb < 99);
}
function openReborn() {
  const s = S(), n = Object.keys(s.owned).length, rb = rebornN(s), ok = n >= REBORN_NEED;
  const nextB = Math.min(REBORN_MAX, rb + 1) * REBORN_BONUS * 100;
  const keep = TS.SADO_MAP[s.partner];
  TS.modal(`<div class="rb-modal">
    <div class="rb-icon">🔁</div>
    <h2>환생 ${rb ? `<small>(지금 ${rb}회)</small>` : ""}</h2>
    <p>도감을 비우고 처음부터 다시 모으는 대신, <b>영원히 남는 힘</b>을 얻어요. 하고 싶을 때만 하면 돼요.</p>
    <div class="rb-grid">
      <div class="rb-lose"><h4>사라지는 것</h4><ul><li>대표 사도를 뺀 모든 사도 (${Math.max(0, n - 1)}명)</li><li>그 사도들의 표정 · 돌파</li></ul></div>
      <div class="rb-keep"><h4>남는 것</h4><ul><li>대표 사도 <b>${esc(keep ? keep.name : "")}</b></li><li>레벨 · 엘리프 · 별사탕 · 아티팩트</li><li>호감도 · 펫 · 칭호 · 기록 · 시즌</li></ul></div>
    </div>
    <div class="rb-gain"><h4>얻는 것</h4><ul>
      <li>영구 집중 보상 <b>+${nextB}%</b> ${rb >= REBORN_MAX ? "(최대)" : `(지금 +${rb * REBORN_BONUS * 100}%)`}</li>
      <li>별사탕 <b>300</b></li>
      <li>${rb === 0 ? "칭호 「환생한 교주」 · 불사조 프레임 · 우주 테마 · 뱃지" : rb === 2 ? "칭호 「윤회의 교주」 · 오로라 프레임" : rb === 4 ? "칭호 「영원의 교주」 · ♾️ 뱃지" : "환생 횟수가 프로필에 표시돼요"}</li>
    </ul></div>
    ${ok ? `<button class="btn red wide" id="rb-go">환생하기</button>` : `<p class="rb-need">사도 <b>${n} / ${REBORN_NEED}</b>명 — ${REBORN_NEED}명을 모으면 환생할 수 있어요</p>`}
  </div>`, (el, close) => {
    const g = el.querySelector("#rb-go");
    if (g) g.onclick = () => { close(); TS.confirmModal("정말 환생할까요?", `대표 사도 ${esc(keep ? keep.name : "")}만 남고 다른 사도 ${n - 1}명이 도감에서 사라져요. 되돌릴 수 없어요!`, "환생!", doReborn, true); };
  });
}
function doReborn() {
  const s = S(), n = Object.keys(s.owned).length;
  if (n < REBORN_NEED) return;
  const keep = s.partner, ko = s.owned[keep];
  s.reborn = { n: rebornN(s) + 1, hist: [...((s.reborn && s.reborn.hist) || []), { t: Date.now(), owned: n }] };
  s.owned = { [keep]: ko };
  if (s.emoteSel) Object.keys(s.emoteSel).forEach((id) => { if (id !== keep) delete s.emoteSel[id]; });
  TS.addCandy(300);
  TS.save(); TS.refresh();
  TS.sfx("r3"); TS.confetti(120);
  TS.modal(`<div class="rb-modal"><div class="rb-icon rb-done">✨</div><h2>환생 ${s.reborn.n}회!</h2>
    <p>새로운 여정이 시작돼요. 이제 집중 보상이 영원히 <b>+${Math.min(REBORN_MAX, s.reborn.n) * REBORN_BONUS * 100}%</b>!</p>
    <p class="hint">별사탕 300개를 받았어요. 다시 만날 사도들을 기대해요!</p></div>`);
}
TS.on("refresh", (v) => { if (v === "sado") rebornBtn(); });
TS.on("view", (v) => { if (v === "sado") setTimeout(rebornBtn, 0); });

window.Growth = { btOf: (id) => btOf(S(), id), reborn: () => rebornN(S()) };
})();
