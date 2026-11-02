/* =========================================================
   💬 사도끼리 대화 — 「트릭컬 사도 정리」의 교단 대화(SADO_TALKS)
   - 대화에 나오는 사도를 모두 가지고 있으면 열림
   - 로비에 있으면 가끔 대표 사도가 나오는 대화가 저절로 재생, 💬 대화 버튼으로 바로 보기
   - 본 대화는 기록되고, 사도 상세에서 다시 볼 수 있음
   ========================================================= */
(() => {
"use strict";
const TS = window.TS;
const $ = (id) => document.getElementById(id);
const S = () => TS.state;
const esc = TS.esc;
const ALL = typeof SADO_TALKS !== "undefined" ? SADO_TALKS : [];

// 본 대화는 첫 줄로 기억 (대화 목록이 바뀌어도 유지)
const keyOf = (i) => ALL[i] ? ALL[i][0][0] + ":" + ALL[i][0][1] : "";
const seen = () => { if (!S().talkSeen || S().talkSeen.some((x) => typeof x === "number")) S().talkSeen = []; return S().talkSeen; };
const isSeen = (i) => seen().includes(keyOf(i));
const who = (t) => [...new Set(t.map((x) => x[0]))];
const opened = (t) => who(t).every((id) => S().owned[id]);
const withId = (id) => ALL.map((t, i) => ({ t, i })).filter(({ t }) => who(t).includes(id));

/* ───── 대화 재생 카드 ───── */
let playing = null;
function play(i) {
  const t = ALL[i]; if (!t) return;
  if (playing) playing.remove();
  const ids = who(t);
  const card = document.createElement("div");
  card.className = "tk-card";
  card.innerHTML = `<div class="tk-head">💬 ${ids.map((id) => esc(TS.shortName(TS.SADO_MAP[id]))).join(" · ")}<button class="tk-x" title="닫기">✕</button></div><div class="tk-body"></div>`;
  document.body.appendChild(card);
  playing = card;
  const body = card.querySelector(".tk-body");
  let k = 0, timer = 0;
  const close = () => { clearTimeout(timer); card.classList.add("bye"); setTimeout(() => card.remove(), 300); if (playing === card) playing = null; };
  const next = () => {
    if (!card.isConnected) return;
    if (k >= t.length) { timer = setTimeout(close, 4500); return; }
    const [id, text] = t[k], c = TS.SADO_MAP[id], left = id === t[0][0];
    const row = document.createElement("div");
    row.className = "tk-row " + (left ? "l" : "r");
    row.innerHTML = `<img src="${TS.chibiSrc(c)}" alt=""><div><b>${esc(TS.shortName(c))}</b><p>${esc(text)}</p></div>`;
    body.appendChild(row);
    body.scrollTop = body.scrollHeight;
    TS.sfx("click");
    k++;
    timer = setTimeout(next, Math.min(4200, 1400 + text.length * 70));
  };
  card.querySelector(".tk-x").onclick = (e) => { e.stopPropagation(); close(); };
  card.onclick = () => { clearTimeout(timer); next(); }; // 누르면 다음 줄 바로
  if (!isSeen(i)) { seen().push(keyOf(i)); TS.save(); }
  next();
}

/* 대표 사도가 나오는 열린 대화 하나 (안 본 것 먼저) */
function pick(any) {
  const p = S().partner;
  let list = withId(p).filter(({ t }) => opened(t));
  if (!list.length && any) list = ALL.map((t, i) => ({ t, i })).filter(({ t }) => opened(t));
  if (!list.length) return -1;
  const fresh = list.filter(({ i }) => !isSeen(i));
  return TS.rand(fresh.length ? fresh : list).i;
}

/* 💬 버튼 (사도 아래 버튼 줄) */
const pip = $("pip-btn");
const btn = document.createElement("button");
btn.className = "btn white small"; btn.id = "talk-btn"; btn.textContent = "💬 대화";
btn.title = "가지고 있는 사도끼리 나누는 대화";
if (pip) pip.after(btn);
btn.onclick = () => {
  const i = pick(true);
  if (i < 0) return TS.toast("아직 대화할 친구가 없어요. 대화에 나오는 사도를 모두 모으면 열려요!");
  play(i);
};

/* 로비에서 가끔 저절로 (5분에 한 번 정도, 집중 중·창이 떠 있을 땐 안 함) */
let last = Date.now();
setInterval(() => {
  if (!S().started || document.hidden || TS.modalOpen || playing || TS.view !== "lobby") return;
  if (TS.timer.t.running && TS.timer.t.mode === "focus") return;
  if (Date.now() - last < 5 * 60000 || Math.random() > 0.5) return;
  const i = pick(false); if (i < 0) return;
  last = Date.now(); play(i);
}, 30000);

/* 사도 상세: 이 사도의 대화 목록 */
TS.detailHooks.push((c) => {
  const list = withId(c.id); if (!list.length) return "";
  const n = list.filter(({ i }) => isSeen(i)).length;
  return `<details class="tk-book"><summary>💬 사도끼리 대화 <b>${n} / ${list.length}</b></summary><div>${list.map(({ t, i }) => {
    const others = who(t).filter((id) => id !== c.id).map((id) => TS.SADO_MAP[id]);
    const names = others.map((o) => esc(TS.shortName(o))).join(", ");
    return opened(t)
      ? `<button class="btn ${isSeen(i) ? "white" : "yellow"} small" data-talk="${i}">${isSeen(i) ? "" : "NEW "}${names} · “${esc(t[0][1].length > 12 ? t[0][1].slice(0, 12) + "…" : t[0][1])}”</button>`
      : `<span class="tk-lock">🔒 ${names} 영입 필요</span>`;
  }).join("")}</div></details>`;
});
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-talk]"); if (!b) return;
  const x = document.querySelector(".modal .x"); if (x) x.click();
  setTimeout(() => play(+b.dataset.talk), 150);
});

window.Talk = { play, pick, count: () => ALL.length };
})();
