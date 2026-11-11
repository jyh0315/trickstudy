/* =========================================================
   🔨 꿀밤 타임 — 쉬는 시간에 머리 비우고 하는 미니게임
   - 구멍에서 튀어나오는 사도에게 꿀밤! (가진 사도들이 나옴, 맞으면 그 사도의 꿀밤 대사)
   - ★★★ 는 +3점, 연속으로 맞히면 콤보 보너스
   - 네르(사제장)를 때리면 -3점 + "반성문 300장입니다"
   - 30초 한 판. 점수만큼 엘리프(하루 3판까지 보상, 한 판 최대 40) · 최고 점수 기록
   - 여는 곳: 로비 사도 아래 「🔨 꿀밤 타임」 버튼, 휴식 시간이 시작될 때 알림
   ========================================================= */
(() => {
"use strict";
const TS = window.TS, S = () => TS.state, esc = TS.esc;
const HOLES = 9, TIME = 30, DAILY = 3, MAX_REWARD = 40, PRIEST = "ner";
const V = (id) => (typeof voiceOf === "function" ? voiceOf(id) : null) || {};
const st = () => { const s = S(); if (!s.knockGame) s.knockGame = { best: 0, day: "", plays: 0, total: 0 }; if (s.knockGame.day !== TS.today()) { s.knockGame.day = TS.today(); s.knockGame.plays = 0; } return s.knockGame; };
const pic = (c) => (c.emote ? `assets/emotes/${c.id}/${1 + Math.floor(Math.random() * 4)}.webp` : TS.chibiSrc(c));
const NER_LINES = ["반성문 300장입니다.", "…지금 누구 머리를 치신 거죠?", "교주님. 기도실로 따라오세요.", "0 네 개 빼먹지 마세요!"];
const MISS = ["허공을 쳤다!", "빗나감!", "잔디만 아프다…"];

let ov = null;
function open() {
  if (ov) return;
  const g = st();
  ov = document.createElement("div");
  ov.className = "kg-ov";
  ov.innerHTML = `<div class="kg-box">
      <div class="kg-top"><b>🔨 꿀밤 타임</b><span class="kg-best">최고 ${g.best}점</span><button class="kg-x" title="닫기">✕</button></div>
      <div class="kg-hud"><span>점수 <b class="kg-score">0</b></span><span class="kg-combo"></span><span>⏱ <b class="kg-time">${TIME}</b></span></div>
      <div class="kg-field">${Array.from({ length: HOLES }, (_, i) => `<div class="kg-hole" data-h="${i}"><div class="kg-clip"><div class="kg-mole"><img alt="" draggable="false"><span class="kg-fx"></span></div><i class="kg-dirt"></i></div><span class="kg-say"></span></div>`).join("")}</div>
      <div class="kg-start">
        <p>구멍에서 나오는 사도에게 <b>꿀밤</b>을 먹여요!<br>★★★는 3점 · 연속으로 맞히면 콤보 · <b>네르는 때리면 안 돼요</b> (−3점)</p>
        <button class="btn yellow big kg-go">시작!</button>
        <small>오늘 보상 ${Math.max(0, DAILY - g.plays)} / ${DAILY}판 남음 · 점수만큼 엘리프 (한 판 최대 ${MAX_REWARD})</small>
      </div></div>`;
  document.body.appendChild(ov);
  ov.querySelector(".kg-x").onclick = close;
  ov.querySelector(".kg-go").onclick = start;
  ov.addEventListener("pointerdown", onHit);
}
function close() { if (!ov) return; run = null; clearTimeout(spawnT); clearInterval(tickT); ov.remove(); ov = null; }

let run = null, spawnT = 0, tickT = 0;
function pool() {
  const ids = Object.keys(S().owned).filter((id) => TS.SADO_MAP[id] && id !== PRIEST);
  return ids.length ? ids : ["erpin", "butter", "kommy"].filter((id) => TS.SADO_MAP[id]);
}
function start() {
  if (!ov) return;
  ov.querySelector(".kg-start").classList.add("hidden");
  ov.querySelectorAll(".kg-hole").forEach((h) => { h.className = "kg-hole"; });
  run = { score: 0, combo: 0, left: TIME, up: {}, hit: 0, pool: pool() };
  hud();
  tickT = setInterval(() => { if (!run) return; run.left--; hud(); if (run.left <= 0) finish(); }, 1000);
  spawn();
}
function hud() {
  if (!ov || !run) return;
  ov.querySelector(".kg-score").textContent = run.score;
  ov.querySelector(".kg-time").textContent = Math.max(0, run.left);
  ov.querySelector(".kg-combo").textContent = run.combo >= 3 ? `🔥 ${run.combo} 콤보` : "";
  ov.querySelector(".kg-hud").classList.toggle("hurry", run.left <= 5);
}
function spawn() {
  if (!run || !ov) return;
  const free = [...ov.querySelectorAll(".kg-hole")].filter((h) => !h.classList.contains("up"));
  if (free.length) {
    const h = TS.rand(free), i = +h.dataset.h;
    const priest = TS.SADO_MAP[PRIEST] && Math.random() < 0.12;
    const id = priest ? PRIEST : TS.rand(run.pool), c = TS.SADO_MAP[id];
    h.querySelector("img").src = pic(c);
    h.className = "kg-hole up" + (priest ? " priest" : c.rarity === 3 ? " r3" : "");
    const stay = Math.max(650, 1300 - (TIME - run.left) * 18); // 갈수록 빨리 들어감
    run.up[i] = { id, t: setTimeout(() => { if (h.classList.contains("up") && !h.classList.contains("hit")) { h.classList.remove("up"); if (id !== PRIEST) { run.combo = 0; hud(); } } delete run.up[i]; }, stay) };
  }
  spawnT = setTimeout(spawn, Math.max(280, 720 - (TIME - run.left) * 12 + Math.random() * 200));
}
function say(h, text, cls = "") {
  const s = h.querySelector(".kg-say");
  s.textContent = text; s.className = "kg-say on " + cls;
  clearTimeout(s._t); s._t = setTimeout(() => s.classList.remove("on"), 1100);
}
function onHit(e) {
  if (!run) return;
  const h = e.target.closest(".kg-hole"); if (!h) return;
  e.preventDefault();
  const i = +h.dataset.h, m = run.up[i];
  // 망치 자국
  const f = document.createElement("span"); f.className = "kg-bonk"; f.textContent = "꽁!";
  const r = h.getBoundingClientRect(); f.style.left = e.clientX - r.left + "px"; f.style.top = e.clientY - r.top + "px"; h.appendChild(f); setTimeout(() => f.remove(), 450);
  if (!m || h.classList.contains("hit") || !h.classList.contains("up")) { run.combo = 0; hud(); say(h, TS.rand(MISS), "miss"); TS.sfx("click"); return; }
  clearTimeout(m.t);
  h.classList.add("hit");
  const c = TS.SADO_MAP[m.id];
  if (m.id === PRIEST) {
    run.score = Math.max(0, run.score - 3); run.combo = 0;
    say(h, TS.rand(NER_LINES), "bad"); TS.sfx("sad");
    ov.querySelector(".kg-box").classList.remove("shake"); void ov.offsetWidth; ov.querySelector(".kg-box").classList.add("shake");
  } else {
    run.combo++; run.hit++;
    const pts = (c.rarity === 3 ? 3 : 1) + (run.combo >= 10 ? 2 : run.combo >= 5 ? 1 : 0);
    run.score += pts;
    const v = V(m.id), line = (v.knock && TS.rand(v.knock)) || (v.poke && TS.rand(v.poke)) || "아얏!";
    say(h, `+${pts} ${line.length > 20 ? line.slice(0, 19) + "…" : line}`); TS.sfx("poke");
  }
  hud();
  setTimeout(() => { h.classList.remove("up", "hit"); if (run) delete run.up[i]; }, 380);
}
function finish() {
  if (!run || !ov) return;
  clearTimeout(spawnT); clearInterval(tickT);
  Object.values(run.up).forEach((m) => clearTimeout(m.t));
  const g = st(), score = run.score, hit = run.hit;
  const isBest = score > g.best; if (isBest) g.best = score;
  const paid = g.plays < DAILY, reward = paid ? Math.min(MAX_REWARD, score) : 0;
  g.plays++; g.total = (g.total || 0) + hit;
  if (reward) TS.addElif(reward);
  TS.save(); TS.refresh();
  run = null;
  ov.querySelectorAll(".kg-hole").forEach((h) => h.classList.remove("up", "hit"));
  const pc = TS.SADO_MAP[S().partner];
  const comment = score >= 100 ? "…손이 안 보였어. 교주, 혹시 전생에 망치였어?" : score >= 60 ? "오~ 제법인데? 볼보다 머리가 더 말랑했나 봐!" : score >= 25 ? "나쁘지 않아! 쉬는 시간엔 이 정도가 딱이지~" : "…설마 봐준 거야? 다들 고마워할걸!";
  const box = ov.querySelector(".kg-start");
  box.innerHTML = `<h3>${isBest && score ? "🎉 최고 기록!" : "끝!"}</h3>
    <p class="kg-final"><b>${score}</b>점 <small>꿀밤 ${hit}방</small></p>
    ${pc ? `<p class="kg-cmt"><img src="${TS.chibiSrc(pc)}" alt=""><span>${esc(TS.shortName(pc))}: “${esc(comment)}”</span></p>` : ""}
    <p>${reward ? `<i class="ic-elif"></i> 엘리프 <b>+${reward}</b>` : paid ? "이번엔 보상이 없어요 (0점)" : "오늘 보상은 다 받았어요. 그래도 계속 할 수 있어요!"}</p>
    <div class="modal-actions"><button class="btn white kg-end">그만하기</button><button class="btn yellow kg-go">한 판 더!</button></div>
    <small>오늘 보상 ${Math.max(0, DAILY - g.plays)} / ${DAILY}판 남음 · 최고 ${g.best}점</small>`;
  box.classList.remove("hidden");
  box.querySelector(".kg-go").onclick = start;
  box.querySelector(".kg-end").onclick = close;
  ov.querySelector(".kg-best").textContent = `최고 ${g.best}점`;
  if (isBest && score && TS.confetti) TS.confetti(60);
  TS.sfx("level");
}

/* 로비 버튼 */
const talk = document.getElementById("talk-btn") || document.getElementById("pip-btn");
if (talk) {
  const b = document.createElement("button");
  b.className = "btn white small"; b.id = "knock-btn"; b.textContent = "🔨 꿀밤 타임"; b.title = "쉬는 시간에 머리 비우고 하는 미니게임";
  b.onclick = open; talk.after(b);
}
/* 휴식이 시작되면 살짝 알려 줌 */
document.addEventListener("study-timer", (e) => {
  if (e.detail.running && e.detail.mode !== "focus" && !ov) {
    const t = document.createElement("div");
    t.className = "kg-toast"; t.innerHTML = "☕ 쉬는 시간! <button class='btn yellow small'>🧶 펫이랑 놀아 줄까?</button>";
    t.querySelector("button").onclick = () => { t.remove(); if (window.Playroom) window.Playroom.open(); else open(); };
    document.body.appendChild(t); setTimeout(() => t.remove(), 9000);
  }
});
window.KnockGame = { open, close };
})();
