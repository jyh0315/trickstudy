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

/* ───── 전투 연출 (16:9 무대 1280×720, 화면에 맞춰 확대·축소) ─────
   배경: 보스마다 전장 · 왼쪽 편성 3명(오른쪽을 봄) vs 오른쪽 보스 (모두 움직이는 사도)
   대사는 아래 대사창에 (얼굴을 가리지 않게) · 말하는 사도는 밝게, 머리 위에 ▼ */
const BOSS_BG = { "tig-hero": "096", maestromk2: "029", ifrit: "138", bigwood: "122", "rim-chaos": "127", "ner-rage": "082", "shaydi-twisted": "129", makasha: "101" };
const SLOT = [{ x: 250, y: 0, s: 1 }, { x: 40, y: 30, s: 0.9 }, { x: 450, y: 36, s: 0.86 }]; // 앞·뒤 배치 (가운데 앞, 양옆 뒤)
let ov = null;
function cutscene(x) {
  if (ov) ov.remove();
  const boss = TS.SADO_MAP[x.bossId], bi = window.Boss.BOSSES.find((z) => z.id === x.bossId) || {};
  const total = x.n + x.skills.reduce((a, k) => a + k.n, 0);
  const pw = x.ids.map(pow), pws = pw.reduce((a, b) => a + b, 0) || 1;
  const bg = `assets/ssbg/${BOSS_BG[x.bossId] || "096"}.webp`;
  const hp0 = Math.max(0, 1 - x.before / x.max), hp1 = Math.max(0, 1 - x.after / x.max);
  ov = document.createElement("div");
  ov.className = "bx-ov";
  ov.style.setProperty("--bxbg", `url('${bg}')`);
  ov.innerHTML = `<div class="bx-zone">
      <div class="bx-bg" style="background-image:url('${bg}')"></div><div class="bx-vig"></div>
      <div class="bx-hud"><div class="bx-bname"><b>${esc(boss.name)}</b><small>${esc(bi.title || "")}</small></div>
        <div class="bx-hpbar"><i class="bx-hpdelay" style="width:${hp0 * 100}%"></i><i class="bx-hp" style="width:${hp0 * 100}%"></i><span>HP ${Math.round(hp0 * 100)}%</span></div></div>
      <div class="bx-boss"><div class="bx-shadow"></div><div class="bx-live"><img class="bx-pic" src="${TS.chibiSrc(boss)}" alt=""></div><div class="bx-fx"></div></div>
      ${x.ids.map((id, i) => `<div class="bx-m" data-i="${i}" style="left:${SLOT[i].x}px;bottom:${60 + SLOT[i].y}px;--s:${SLOT[i].s};z-index:${i === 0 ? 4 : 3}"><div class="bx-shadow"></div><div class="bx-live"><img class="bx-pic" src="${TS.chibiSrc(TS.SADO_MAP[id])}" alt=""></div><span class="bx-mark">▼</span></div>`).join("")}
      <div class="bx-cut"><div class="bx-cut-lines"></div><img alt=""><div class="bx-cut-t"><small></small><b></b></div></div>
      <div class="bx-flash"></div>
      <div class="bx-box"><div class="bx-name"><span></span></div><p></p></div>
      <div class="bx-result"><small>총 데미지</small><b></b><em>BOSS DOWN!</em><span></span></div>
      <button class="bx-skip">건너뛰기 ▶</button>
    </div>`;
  document.body.appendChild(ov);
  const me = ov, zone = me.querySelector(".bx-zone"), lives = [];
  // 세로 화면(휴대폰)은 720×1280 세로 무대로 (보스 위 · 사도 아래)
  const fitZ = () => {
    const port = innerHeight > innerWidth * 1.1;
    me.classList.toggle("port", port);
    const [w, h] = port ? [720, 1280] : [1280, 720];
    zone.style.transform = `translate(-50%, -50%) scale(${Math.min(innerWidth / w, innerHeight / h)})`;
  };
  fitZ(); addEventListener("resize", fitZ);
  const alive = () => me.isConnected;
  const close = () => { if (!alive()) return; me.classList.add("bye"); removeEventListener("resize", fitZ); setTimeout(() => { lives.forEach((l) => l && l.dispose()); me.remove(); if (ov === me) ov = null; }, 350); };
  me.querySelector(".bx-skip").onclick = (e) => { e.stopPropagation(); close(); };
  me.addEventListener("click", () => { if (me.classList.contains("end")) close(); });
  // 움직이는 사도·보스
  const ctrls = [], mount = (box, id, cb) => {
    const host = box.querySelector(".bx-live");
    if (!(window.Live && window.Live.canLive && window.Live.canLive(id))) return;
    lives.push(window.Live.mount(host, id, { frame: "body", onReady: (c) => { host.classList.add("ok"); cb(c); } }));
  };
  me.querySelectorAll(".bx-m").forEach((m, i) => mount(m, x.ids[i], (c) => (ctrls[i] = c)));
  let bossCtrl = null; mount(me.querySelector(".bx-boss"), x.bossId, (c) => (bossCtrl = c));
  const play = (c, k) => { try { c && c.play(k); } catch (e) { /* 무시 */ } };
  // 대사창
  const box = me.querySelector(".bx-box"), mEls = me.querySelectorAll(".bx-m");
  let typeT = 0;
  const talk = (who, text, i = -1, cls = "") => {
    box.className = "bx-box on " + cls;
    box.querySelector(".bx-name span").textContent = who;
    const p = box.querySelector("p"); clearInterval(typeT); let k = 0;
    typeT = setInterval(() => { p.textContent = text.slice(0, ++k); if (k >= text.length) clearInterval(typeT); }, 28);
    mEls.forEach((m, j) => m.classList.toggle("speak", j === i));
  };
  const shake = (big) => { zone.classList.remove("shake", "shake2"); void zone.offsetWidth; zone.classList.add(big ? "shake2" : "shake"); };
  const flash = () => { const f = me.querySelector(".bx-flash"); f.classList.remove("on"); void f.offsetWidth; f.classList.add("on"); };
  const hit = (n, big) => {
    const fx = me.querySelector(".bx-fx");
    const sl = document.createElement("i"); sl.className = "bx-slash" + (big ? " big" : ""); sl.style.rotate = (-35 + Math.random() * 70) + "deg"; fx.appendChild(sl); setTimeout(() => sl.remove(), 600);
    const bu = document.createElement("i"); bu.className = "bx-burst" + (big ? " big" : ""); fx.appendChild(bu); setTimeout(() => bu.remove(), 700);
    const f = document.createElement("span"); f.className = "bx-num" + (big ? " big" : "");
    f.textContent = Math.round(n).toLocaleString(); f.style.left = 25 + Math.random() * 40 + "%"; f.style.top = 10 + Math.random() * 30 + "%";
    fx.appendChild(f); setTimeout(() => f.remove(), 1500);
    const b = me.querySelector(".bx-boss"); b.classList.remove("hit"); void b.offsetWidth; b.classList.add("hit");
    play(bossCtrl, Math.random() < 0.5 ? "angry" : "dizzy"); shake(big);
  };
  // HP 바: 앞 바는 바로, 뒤(노란) 바는 천천히
  let dealt = 0;
  const hpTo = () => {
    const r = Math.max(hp1, hp0 - (hp0 - hp1) * Math.min(1, dealt / (total || 1)));
    me.querySelector(".bx-hp").style.width = r * 100 + "%";
    setTimeout(() => { if (alive()) me.querySelector(".bx-hpdelay").style.width = r * 100 + "%"; }, 450);
    me.querySelector(".bx-hpbar span").textContent = `HP ${Math.round(r * 100)}%`;
  };
  const steps = []; let t = 300;
  // 0) 보스 도발
  steps.push([t, () => { play(bossCtrl, "angry"); talk(boss.name, TS.rand(bi.taunt || ["…"]), -1, "boss"); }]);
  t += 1500;
  // 1) 등장
  x.ids.forEach((id, i) => steps.push([t + i * 260, () => { mEls[i].classList.add("in"); if (i === 0) talk(TS.SADO_MAP[id].name, line(id, "enter"), 0); }]));
  t += 260 * x.ids.length + 1300;
  // 2) 공격
  x.ids.forEach((id, i) => steps.push([t + i * 900, () => {
    const m = mEls[i]; m.classList.remove("atk"); void m.offsetWidth; m.classList.add("atk");
    play(ctrls[i], "proud"); talk(TS.SADO_MAP[id].name, line(id, Math.random() < 0.3 ? "atk2" : "atk"), i);
    TS.sfx("poke");
    setTimeout(() => { if (!alive()) return; const d = (x.n * pw[i]) / pws; dealt += d; if (x.n) { hit(d); hpTo(); } }, 260);
  }]));
  t += 900 * x.ids.length + 300;
  // 3) 스킬 컷인
  x.skills.forEach((k) => {
    steps.push([t, () => {
      const i = x.ids.indexOf(k.id), c = TS.SADO_MAP[k.id], cut = me.querySelector(".bx-cut");
      cut.querySelector("img").src = TS.portrait(c, true);
      cut.querySelector("small").textContent = k.kind === "s2" ? "고학년 스킬" : "저학년 스킬";
      cut.querySelector("b").textContent = line(k.id, k.kind);
      cut.className = "bx-cut on " + k.kind;
      play(ctrls[i], "dance"); TS.sfx(k.kind === "s2" ? "r3" : "level");
      talk(c.name, cut.querySelector("b").textContent, i, "skill");
      setTimeout(() => { if (!alive()) return; cut.className = "bx-cut"; flash(); dealt += k.n; hit(k.n, true); hpTo(); }, 1250);
    }]);
    t += 2100;
  });
  // 4) 결과
  steps.push([t + 200, () => {
    dealt = total; hpTo();
    const killed = x.before < x.max && x.after >= x.max;
    const r = me.querySelector(".bx-result");
    r.querySelector("b").textContent = Math.round(total).toLocaleString();
    if (killed) {
      me.classList.add("killed"); play(bossCtrl, "sad"); flash();
      const mvp = x.ids.map((id, i) => ({ i, id, v: pw[i] })).sort((a, b) => b.v - a.v)[0];
      play(ctrls[mvp.i], "happy");
      talk(TS.SADO_MAP[mvp.id].name, (V(mvp.id).win && TS.rand(V(mvp.id).win)) || line(mvp.id, "s2"), mvp.i, "mvp");
      r.querySelector("span").textContent = `👑 MVP ${TS.shortName(TS.SADO_MAP[mvp.id])} · 호감도 +10`;
      if (window.Affection && window.Affection.gain) window.Affection.gain(mvp.id, 10);
    } else {
      play(bossCtrl, "dizzy");
      talk(boss.name, TS.rand(typeof BOSS_HURT !== "undefined" ? BOSS_HURT : ["크윽…!"]), -1, "boss");
      r.querySelector("span").textContent = `남은 HP ${Math.round(hp1 * 100)}% · 화면을 누르면 닫혀요`;
    }
    r.classList.add("on"); me.classList.add("end");
  }]);
  steps.push([t + 6500, close]);
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
