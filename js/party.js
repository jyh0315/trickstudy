/* =========================================================
   ⚔️ 사도 편성 보스전
   - 보스 탭에서 사도 3명 편성 → 집중 데미지에 편성 배율 (등급·돌파·성격 상성, 최대 ×1.6)
   - 스킬: 집중 25분마다 저학년 스킬(편성 순서대로 돌아가며) · 하루 90분이 되면 고학년 스킬(가장 센 사도)
   - 집중이 끝나면 전투 연출: 등장 → 공격 → 스킬 → (격파 시 MVP 승리 대사)
   - 대사: BATTLE_LINES (「트릭컬 사도 정리」 전투 항목: 덱 편성·등장·공격·스킬·쓰러짐)
   ========================================================= */
(() => {
"use strict";
const TS = window.TS, S = () => TS.state, esc = TS.esc;
const N = 3, MULT_MAX = 1.6, S1_EVERY = 25, S2_AT = 90;
const RAR = { 1: 1, 2: 1.15, 3: 1.3 };
const PERS_KO = (p) => (typeof PERS !== "undefined" && PERS[p] ? PERS[p].label : p);
const BL = (id) => (typeof BATTLE_LINES !== "undefined" && BATTLE_LINES[id]) || {};
const V = (id) => (typeof voiceOf === "function" ? voiceOf(id) : null) || {};
// 전투 대사 (없으면 비슷한 일반 대사로)
function line(id, k) {
  const b = BL(id), v = V(id);
  const pick = (a) => (a && a.length ? TS.rand(a) : "");
  const alt = { deck: v.cheer, stage: v.cheer, enter: v.cheer, atk: b.atk2 || v.cheer, atk2: b.atk, s1: b.atk2 || b.atk, s2: b.s1 || b.atk2, down: v.lose || v.fail };
  return pick(b[k]) || pick(alt[k]) || pick(v.win) || "가자!";
}

/* ───── 상태 ───── */
function P() {
  const s = S();
  if (!s.party) s.party = { ids: [], g1: 0, day: "", dayMin: 0, s2: "", fx: true, rot: 0 };
  const p = s.party;
  p.ids = (p.ids || []).filter((id) => s.owned[id] && TS.SADO_MAP[id]).slice(0, N);
  if (p.day !== TS.today()) { p.day = TS.today(); p.dayMin = 0; }
  return p;
}
const bt = (id) => (window.Growth ? window.Growth.btOf(id) : 0);
const btPer = (c) => (typeof CONFIG.btBonus === "object" ? CONFIG.btBonus[c.rarity] || 0 : CONFIG.btBonus || 0);
const weakP = () => { const b = window.Boss && window.Boss.ensure(); const x = b && window.Boss.BOSSES.find((z) => z.id === b.id); return x && x.weakP; };
function pow(id) { const c = TS.SADO_MAP[id]; return c ? RAR[c.rarity] * (1 + bt(id) * btPer(c)) : 1; }
function mult(ids = P().ids) {
  if (!ids.length) return 1;
  const wp = weakP();
  let sum = 0; for (let i = 0; i < N; i++) sum += ids[i] ? pow(ids[i]) : 0.9; // 빈 칸은 0.9
  const m = sum / N + ids.filter((id) => TS.SADO_MAP[id].pers === wp).length * 0.1;
  return Math.min(MULT_MAX, Math.max(1, m));
}
function recommend() {
  const wp = weakP();
  return Object.keys(S().owned).filter((id) => TS.SADO_MAP[id])
    .map((id) => ({ id, v: pow(id) + (TS.SADO_MAP[id].pers === wp ? 0.1 : 0) }))
    .sort((a, b) => b.v - a.v).slice(0, N).map((x) => x.id);
}

/* ───── 집중이 끝났을 때 (boss.js 에서 부름) ───── */
function afterFocus({ min, n, before, full, extras }) {
  const p = P(), ids = p.ids.slice();
  if (!ids.length) return;
  const skills = [];
  p.g1 += min;
  while (p.g1 >= S1_EVERY && skills.length < 4) {
    p.g1 -= S1_EVERY;
    const id = ids[p.rot % ids.length]; p.rot++;
    skills.push({ id, kind: "s1", n: Math.round(80 * pow(id)) });
  }
  const prevDay = p.dayMin; p.dayMin += min;
  if (prevDay < S2_AT && p.dayMin >= S2_AT && p.s2 !== p.day) {
    p.s2 = p.day;
    const id = ids.slice().sort((a, b) => pow(b) - pow(a))[0];
    skills.push({ id, kind: "s2", n: Math.round(400 * pow(id)) });
  }
  let sdmg = 0;
  for (const k of skills) { k.n = window.Boss.deal(k.n, `${TS.shortName(TS.SADO_MAP[k.id])} ${k.kind === "s2" ? "고학년" : "저학년"} 스킬`); sdmg += k.n; }
  if (sdmg) extras && extras.push(`✨ 스킬 -${Math.round(sdmg).toLocaleString()}`);
  TS.save();
  const b = window.Boss.ensure();
  if (p.fx !== false && (n || sdmg)) setTimeout(() => cutscene({ ids, n, skills, before, after: b.dmg, max: b.max, bossId: b.id }), 500);
}
TS.on("giveup", () => {
  const ids = P().ids; if (!ids.length) return;
  const id = TS.rand(ids);
  setTimeout(() => TS.toast(`💫 ${TS.shortName(TS.SADO_MAP[id])}: “${line(id, "down")}”`), 1200);
});

/* ───── 전투 연출 ───── */
let ov = null;
function cutscene(x) {
  if (ov) ov.remove();
  const boss = TS.SADO_MAP[x.bossId];
  const total = x.n + x.skills.reduce((a, k) => a + k.n, 0);
  const pw = x.ids.map(pow), pws = pw.reduce((a, b) => a + b, 0) || 1;
  ov = document.createElement("div");
  ov.className = "bt-ov";
  ov.innerHTML = `<div class="bt-bg"></div>
    <div class="bt-hp"><b>${esc(boss.name)}</b><span class="bar hp"><i style="width:${Math.max(0, 1 - x.before / x.max) * 100}%"></i></span></div>
    <div class="bt-boss"><img src="${TS.chibiSrc(boss)}" alt=""><div class="bt-dmg"></div></div>
    <div class="bt-team">${x.ids.map((id, i) => `<div class="bt-m" data-i="${i}"><div class="bt-live"><img class="bt-pic" src="${TS.chibiSrc(TS.SADO_MAP[id])}" alt=""></div><div class="bt-say"></div></div>`).join("")}</div>
    <div class="bt-cut"></div>
    <div class="bt-total"></div>
    <button class="bt-skip">건너뛰기 ▶</button>`;
  document.body.appendChild(ov);
  const me = ov, lives = [];
  const alive = () => me.isConnected;
  const close = () => { if (!alive()) return; me.classList.add("bye"); setTimeout(() => { lives.forEach((l) => l && l.dispose()); me.remove(); if (ov === me) ov = null; }, 350); };
  me.querySelector(".bt-skip").onclick = (e) => { e.stopPropagation(); close(); };
  me.addEventListener("click", () => { if (me.classList.contains("end")) close(); });
  // 움직이는 사도
  const ctrls = [];
  me.querySelectorAll(".bt-m").forEach((m, i) => {
    const host = m.querySelector(".bt-live"), id = x.ids[i];
    if (window.Live && window.Live.canLive && window.Live.canLive(id)) {
      lives.push(window.Live.mount(host, id, { frame: "body", onReady: (c) => { ctrls[i] = c; host.classList.add("ok"); } }));
    }
  });
  const say = (i, t, cls = "") => { const el = me.querySelectorAll(".bt-say")[i]; if (!el) return; el.className = "bt-say on " + cls; el.textContent = t; };
  const play = (i, k) => { try { ctrls[i] && ctrls[i].play(k); } catch (e) { /* 무시 */ } };
  const float = (n, big) => {
    const f = document.createElement("span"); f.className = "bt-num" + (big ? " big" : "");
    f.textContent = "-" + Math.round(n).toLocaleString(); f.style.left = 15 + Math.random() * 55 + "%"; f.style.top = 20 + Math.random() * 40 + "%";
    me.querySelector(".bt-dmg").appendChild(f); setTimeout(() => f.remove(), 1500);
    const img = me.querySelector(".bt-boss img"); img.classList.remove("hit"); void img.offsetWidth; img.classList.add("hit");
  };
  const steps = [];
  let t = 400;
  // 1) 등장
  x.ids.forEach((id, i) => steps.push([t + i * 350, () => { me.querySelectorAll(".bt-m")[i].classList.add("in"); say(i, line(id, "enter")); }]));
  t += 350 * x.ids.length + 900;
  // 2) 공격 (데미지를 힘에 비례해서 나눔)
  x.ids.forEach((id, i) => steps.push([t + i * 420, () => {
    const m = me.querySelectorAll(".bt-m")[i]; m.classList.remove("atk"); void m.offsetWidth; m.classList.add("atk");
    play(i, "proud"); say(i, line(id, Math.random() < 0.3 ? "atk2" : "atk"));
    TS.sfx("poke"); if (x.n) float((x.n * pw[i]) / pws);
  }]));
  t += 420 * x.ids.length + 700;
  // 3) 스킬
  x.skills.forEach((k) => {
    steps.push([t, () => {
      const i = x.ids.indexOf(k.id), c = TS.SADO_MAP[k.id];
      const cut = me.querySelector(".bt-cut");
      cut.className = "bt-cut on " + k.kind;
      cut.innerHTML = `<img src="${TS.portrait(c, true)}" alt=""><div><small>${k.kind === "s2" ? "고학년 스킬" : "저학년 스킬"}</small><b>${esc(line(k.id, k.kind))}</b></div>`;
      play(i, "dance"); TS.sfx(k.kind === "s2" ? "r3" : "level");
      setTimeout(() => { if (alive()) { float(k.n, true); cut.className = "bt-cut"; } }, 1100);
    }]);
    t += 1600;
  });
  // 4) HP 줄이고 마무리
  steps.push([t, () => {
    me.querySelector(".bt-hp i").style.width = Math.max(0, 1 - x.after / x.max) * 100 + "%";
    const killed = x.before < x.max && x.after >= x.max;
    const tot = me.querySelector(".bt-total");
    tot.innerHTML = `총 데미지 <b>${Math.round(total).toLocaleString()}</b>${killed ? "<em>BOSS DOWN!</em>" : ""}<small>화면을 누르면 닫혀요</small>`;
    tot.classList.add("on");
    if (killed) {
      me.classList.add("killed");
      const mvp = x.ids.map((id, i) => ({ i, id, v: pw[i] })).sort((a, b) => b.v - a.v)[0];
      play(mvp.i, "happy"); say(mvp.i, (V(mvp.id).win && TS.rand(V(mvp.id).win)) || line(mvp.id, "s2"), "mvp");
      if (window.Affection && window.Affection.gain) window.Affection.gain(mvp.id, 10);
    }
    me.classList.add("end");
  }]);
  steps.push([t + 5000, close]);
  steps.forEach(([ms, fn]) => setTimeout(() => { if (alive()) fn(); }, ms));
}

/* ───── 보스 탭: 편성 카드 ───── */
function card() {
  const p = P(), wp = weakP(), m = mult();
  const slot = (i) => {
    const id = p.ids[i], c = id && TS.SADO_MAP[id];
    if (!c) return `<button class="pt-slot empty" data-pslot="${i}"><span>＋</span><small>사도 넣기</small></button>`;
    return `<button class="pt-slot ${c.pers === wp ? "weak" : ""}" data-pslot="${i}"><img src="${TS.chibiSrc(c)}" alt=""><b>${esc(TS.shortName(c))}</b>
      <small>${"★".repeat(c.rarity)}${bt(id) ? ` ✦${bt(id)}` : ""} · ${esc(PERS_KO(c.pers))}${c.pers === wp ? " ⚡" : ""}</small></button>`;
  };
  return `<div class="card pt-card">
    <h3 class="card-title">⚔️ 편성 <span class="count">데미지 ×${m.toFixed(2)}</span></h3>
    <div class="pt-slots">${[0, 1, 2].map(slot).join("")}</div>
    ${wp ? `<p class="hint">⚡ 이번 주 보스는 <b>${esc(PERS_KO(wp))}</b> 성격에 약해요 (1명당 +0.1)</p>` : ""}
    <div class="pt-gauge">
      <div><span>✨ 저학년 스킬</span><span class="bar"><i style="width:${(p.g1 / S1_EVERY) * 100}%"></i></span><small>${p.g1} / ${S1_EVERY}분</small></div>
      <div><span>💥 고학년 스킬</span><span class="bar"><i style="width:${Math.min(1, p.dayMin / S2_AT) * 100}%"></i></span><small>${p.s2 === p.day ? "오늘 사용 ✔" : `오늘 ${p.dayMin} / ${S2_AT}분`}</small></div>
    </div>
    <div class="modal-actions" style="flex-wrap:wrap">
      <button class="btn yellow small" data-prec>⭐ 추천 편성</button>
      ${p.ids.length ? '<button class="btn white small" data-pclear>비우기</button>' : ""}
      <label class="check" style="margin-left:auto"><input type="checkbox" data-pfx ${p.fx !== false ? "checked" : ""}> 전투 연출 보기</label>
    </div>
    <p class="hint">배율 = 등급(★1.0 · ★★1.15 · ★★★1.3) × 돌파 보너스의 평균 + 성격 상성 (최대 ×${MULT_MAX}) · 빈 칸은 0.9</p>
  </div>`;
}
function setSlot(i, id) {
  const p = P();
  const ids = p.ids.slice();
  const j = ids.indexOf(id); if (j >= 0) ids.splice(j, 1);
  if (id) ids.splice(Math.min(i, ids.length), 0, id);
  p.ids = ids.slice(0, N); TS.save();
  if (id) TS.toast(`💬 ${TS.shortName(TS.SADO_MAP[id])}: “${line(id, "deck")}”`);
  rerender();
}
function picker(i) {
  const wp = weakP(), p = P();
  const list = Object.keys(S().owned).filter((id) => TS.SADO_MAP[id]).sort((a, b) => pow(b) + (TS.SADO_MAP[b].pers === wp ? 0.1 : 0) - pow(a) - (TS.SADO_MAP[a].pers === wp ? 0.1 : 0));
  TS.modal(`<h2>⚔️ ${i + 1}번 자리</h2><p class="hint">센 순서대로 정렬했어요. ⚡는 이번 주 보스 상성이에요.</p>
    <div class="pt-pick">${list.map((id) => { const c = TS.SADO_MAP[id];
      return `<button data-ppick="${id}" class="${p.ids.includes(id) ? "in" : ""} ${c.pers === wp ? "weak" : ""}"><img src="${TS.chibiSrc(c)}" alt="" loading="lazy"><b>${esc(TS.shortName(c))}</b><small>${"★".repeat(c.rarity)}${bt(id) ? ` ✦${bt(id)}` : ""}${c.pers === wp ? " ⚡" : ""}</small></button>`; }).join("")}</div>
    <div class="modal-actions">${p.ids[i] ? '<button class="btn white" data-premove>빼기</button>' : ""}<button class="btn white" data-close>닫기</button></div>`,
  (el, close) => {
    el.querySelectorAll("[data-ppick]").forEach((b) => (b.onclick = () => { close(); setSlot(i, b.dataset.ppick); }));
    const r = el.querySelector("[data-premove]"); if (r) r.onclick = () => { close(); const pp = P(); pp.ids.splice(i, 1); TS.save(); rerender(); };
  }, { cls: "pt-modal" });
}
const rerender = () => { if (TS.view === "boss" && TS.views.boss) TS.views.boss(); };
document.addEventListener("click", (e) => {
  const s = e.target.closest("[data-pslot]"); if (s) return picker(+s.dataset.pslot);
  if (e.target.closest("[data-prec]")) { const ids = recommend(); P().ids = ids; TS.save(); if (ids[0]) TS.toast(`💬 ${TS.shortName(TS.SADO_MAP[ids[0]])}: “${line(ids[0], "deck")}”`); return rerender(); }
  if (e.target.closest("[data-pclear]")) { P().ids = []; TS.save(); return rerender(); }
});
document.addEventListener("change", (e) => { if (e.target.matches("[data-pfx]")) { P().fx = e.target.checked; TS.save(); } });

window.Party = { mult: () => mult(), afterFocus, card, cutscene, line, P, recommend };
})();
