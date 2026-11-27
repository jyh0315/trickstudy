/* =========================================================
   📞 약속 전화 — 하루 한 번, 사이트를 열면 대표 사도에게서 전화가 와요
   - 받으면: 「사도 정리」의 '라운지 연락하기' 대사 → 오늘 몇 분 공부할지 약속
   - 그날 공부 시간이 약속을 채우면 💗+15 와 칭찬 (로비에 📞 약속 칩으로 진행 표시)
   - 거절하면 부재중 1통 (그날은 다시 안 옴)
   ========================================================= */
(() => {
"use strict";
const TS = window.TS;
if (!TS) return;
const S = () => TS.state, esc = TS.esc;
const PREVIEW = new URLSearchParams(location.search).has("preview");
const V = (id) => (typeof SADO_VOICE !== "undefined" && SADO_VOICE[id]) || {};
const pickV = (id, k, d) => { const L = V(id)[k]; return L && L.length ? TS.rand(L) : d; };
const todayMin = () => (S().stats && S().stats.days && S().stats.days[TS.today()]) || 0;
const st = () => { const s = S(); if (!s.phone || s.phone.d !== TS.today()) s.phone = { d: TS.today() }; return s.phone; };

function ring() {
  const id = S().partner, c = id && TS.SADO_MAP[id];
  if (!c || !S().owned[id] || document.getElementById("ph-ring")) return;
  const el = document.createElement("div");
  el.id = "ph-ring"; el.className = "ph-ring";
  el.innerHTML = `<img src="${TS.portrait(c, true)}" alt=""><div><b>📞 ${esc(c.name)}</b><span>전화가 왔어요…</span></div>
    <button class="btn yellow small" data-ph="yes">받기</button><button class="btn white small" data-ph="no">거절</button>`;
  document.body.appendChild(el);
  TS.sfx && TS.sfx("poke");
  el.onclick = (e) => {
    const b = e.target.closest("[data-ph]"); if (!b) return;
    el.remove();
    const p = st();
    if (b.dataset.ph === "no") { p.missed = 1; TS.save(); TS.toast(`📞 ${c.name}의 부재중 전화 1통`); return; }
    answer(id, c);
  };
}
function answer(id, c) {
  const hello = pickV(id, "call", `${S().name || "교주"}, 잠깐 통화 괜찮아?`);
  const goal = (S().settings && S().settings.goal) || 120, done = todayMin();
  const opts = [30, 60, 90, 120, 180].filter((m) => m > done).slice(0, 4);
  if (!opts.length) opts.push(done + 30);
  TS.modal(`<h2>📞 ${esc(c.name)}</h2>
    <img class="modal-emote" src="${TS.portrait(c, true)}" alt="">
    <p>“${esc(TS.fmt ? TS.fmt(hello, c) : hello)}”</p>
    <p class="ph-ask">오늘은 몇 분 공부할 거야? <small>(오늘 지금까지 ${done}분 · 하루 목표 ${goal}분)</small></p>
    <div class="ph-opts">${opts.map((m) => `<button class="btn ${m === goal ? "yellow" : "white"} small" data-pm="${m}">${m}분 약속</button>`).join("")}</div>
    <div class="modal-actions"><button class="btn white" data-close>그냥 안부만</button></div>`,
  (el, close) => el.querySelectorAll("[data-pm]").forEach((b) => (b.onclick = () => {
    const p = st(); p.promise = +b.dataset.pm; p.ok = 0; TS.save(); close();
    window.Affection && window.Affection.gain(id, 2);
    TS.say && TS.say(`${p.promise}분! 약속했다? 끝나면 칭찬해 줄게.`);
    TS.toast(`📞 ${c.name}과(와) ${p.promise}분 공부 약속! 💗+2`); TS.refresh();
  })));
  st().answered = 1; TS.save();
}
TS.phoneCall = () => ring();

/* 약속 지키면 칭찬 */
TS.on("focus", ({ partner }) => {
  const p = S().phone; if (!p || p.d !== TS.today() || !p.promise || p.ok) return;
  if (todayMin() < p.promise) return;
  p.ok = 1;
  const id = partner || S().partner, c = TS.SADO_MAP[id]; if (!c) return;
  window.Affection && window.Affection.gain(id, 15);
  setTimeout(() => {
    TS.sfx && TS.sfx("level"); TS.confetti && TS.confetti(40);
    TS.modal(`<h2>📞 약속 지켰어요!</h2><img class="modal-emote" src="${TS.portrait(c, true)}" alt="">
      <p><b>${esc(c.name)}</b>: “${esc(pickV(id, "great", pickV(id, "done", "약속 지켰네! 역시 믿고 있었어.")))}”</p>
      <div class="reward-row"><span class="reward-chip">💗 +15</span><span class="reward-chip">⏱️ ${todayMin()} / ${p.promise}분</span></div>
      <div class="modal-actions"><button class="btn yellow" data-close>헤헤</button></div>`);
  }, 600);
});

/* 로비 칩 */
function chip() {
  const g = document.querySelector(".stage-btns"); if (!g) return;
  let el = document.getElementById("ph-chip");
  const p = S().phone, on = p && p.d === TS.today() && p.promise;
  if (!on) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement("span"); el.id = "ph-chip"; el.className = "ph-chip"; g.prepend(el); }
  const m = todayMin();
  el.textContent = p.ok ? `📞 약속 완료 ${p.promise}분 ✔` : `📞 약속 ${m}/${p.promise}분`;
  el.classList.toggle("ok", !!p.ok);
}
TS.on("refresh", chip);

/* 하루 한 번 전화 (페이지를 연 뒤 조금 있다가, 다른 창이 없을 때) */
function maybeRing(tries = 0) {
  const p = st();
  if (p.answered || p.missed || p.promise) { chip(); return; }
  if (document.hidden || TS.modalOpen || document.getElementById("title")) {
    if (tries < 40) setTimeout(() => maybeRing(tries + 1), 3000);
    return;
  }
  ring();
}
if (!PREVIEW) setTimeout(() => maybeRing(), 6000);
})();
