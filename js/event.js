/* =========================================================
   🎉 기간 한정 이벤트
   지금 이벤트: 두근두근 기말고사 대작전 (11/17 ~ 11/30, 기말고사 12/1 ~ 12/4 전 준비 기간)
   - 미리보기: 시작 7일 전부터 (시험 준비 도구는 미리 써도 됨)
   - 본 이벤트: 미션 · 출석 도장 · 상점 · 집중 보너스 · 이벤트 랭킹
   - 시험 기간(12/1~12/4)엔 시험 응원 모드, 상점은 12/7까지, 12/11에 탭이 사라짐
   테스트: 주소 뒤에 ?event=on / ?event=pre / ?event=after (되돌리기: ?event=off)
   ========================================================= */
const EVENTS = [
  {
    id: "final2026",
    title: "두근두근 기말고사 대작전",
    sub: "기말고사 2주 전! 사도들과 함께 시험 준비를 끝내요",
    start: "2026-11-17", end: "2026-11-30",          // 이벤트 기간 (시험 전 준비)
    exam: { start: "2026-12-01", end: "2026-12-04" }, // 실제 기말고사 기간
    previewDays: 7, shopDays: 7, afterDays: 11,
    coin: { name: "합격 부적", icon: "🧧" },
    focusBonus: 1.5,     // 기간 중 집중 보상(엘리프·EXP·보스 데미지) 배율
    charmPerMin: 5,      // 집중 n분마다 부적 1
    cast: ["yomi", "erpin", "butter"],
    // 시험 범위 원정: 범위 한 칸 = 징검다리 한 칸. 다 체크하면 원정대가 시험장에 도착
    trek: { name: "시험 범위 원정대", title: "범위를 하나씩 밟고 시험장까지!" },
    // 🔥 단체 레이드: 모두의 공부가 데미지가 되어 하나의 보스를 함께 쓰러뜨림 (Firebase /raid/<이벤트>/<uid>)
    group: {
      boss: "ner-rage", name: "기말고사 대마왕", title: "모두의 시험지를 노리는 자",
      hp: 150000,            // 전체 HP (참여 인원에 맞게 조절)
      perMin: 10,            // 집중 1분 = 10 데미지 (이벤트 보너스 ×1.5 적용 → 15)
      perRange: 30,          // 시험 범위 1칸 체크 = 30 데미지
      pool: { charm: 1500, elif: 30000, candy: 900 }, // 격파 시 기여도(데미지 비율)대로 나눠 가짐
      base: { charm: 30, elif: 500 },                 // 참여만 해도 받는 기본 보상
      failRate: 0.3,         // 이벤트 끝까지 못 잡으면 보상의 30%만
    },
    daily: [
      { id: "focus", title: "오늘 집중 120분",                stat: "focus", goal: 120, charm: 15 },
      { id: "subj",  title: "시험 과목 3개 이상 각 20분 공부", stat: "subj",  goal: 3,   charm: 10 },
      { id: "range", title: "시험 범위 3칸 체크",             stat: "range", goal: 3,   charm: 10 },
      { id: "raid",  title: "단체 레이드에 데미지 1,000",       stat: "raid",  goal: 1000, charm: 15 },
    ],
    once: [
      { id: "plan",     title: "기말 시험 시간표 등록하기",        goal: 1,   charm: 20, prog: (st) => st.exams.length },
      { id: "rangeset", title: "시험 범위 10칸 이상 적어두기",     goal: 10,  charm: 15, prog: (st) => st.ranges.length },
      { id: "focus1200", title: "이벤트 기간 집중 1200분",          goal: 1200, charm: 80, prog: (st, ev) => ev.focusTotal },
      { id: "raid10k",   title: "단체 레이드 누적 데미지 10,000",   goal: 10000, charm: 60, prog: (st, ev) => Math.floor(ev.raidDmg || 0) },
      { id: "rangeall",  title: "시험 전에 범위 원정 완주하기 (범위 100%)", goal: 1, charm: 80, prog: (st, ev) => (ev.raidBeat ? 1 : 0) },
    ],
    stamps: [   // 이벤트 기간에 접속한 날마다 1개 (연속 아니어도 됨)
      { label: "1회", reward: { elif: 300 },           text: "엘리프 300" },
      { label: "2회", reward: { charm: 20 },           text: "합격 부적 20" },
      { label: "3회", reward: { candy: 40, item: "R" },  text: "별사탕 40 + R 아티팩트" },
      { label: "4회", reward: { charm: 30 },           text: "합격 부적 30" },
      { label: "5회", reward: { elif: 500 },           text: "엘리프 500" },
      { label: "6회", reward: { charm: 40, item: "SR" }, text: "부적 40 + SR 아티팩트" },
      { label: "7회", reward: { charm: 60, title: 1, item: "SSR" }, text: "부적 60 + SSR 아티팩트 + 칭호 「기말 개근러」" },
    ],
    shop: [
      { id: "title", icon: "🏆", name: "한정 칭호 「기말 정복자」",   cost: 120, limit: 1 },
      { id: "frame", icon: "🧧", name: "한정 프레임 「합격 부적」",   cost: 160,  limit: 1 },
      { id: "theme", icon: "❄️", name: "한정 테마 「눈꽃 시험장」",   cost: 120,  limit: 1 },
      { id: "badge", icon: "📝", name: "한정 뱃지 「기말 대작전」",   cost: 80,   limit: 1 },
      { id: "ssr",   icon: "🎫", name: "★★★ 사도 선택권",          cost: 300, limit: 1, desc: "아직 없는 ★★★ 사도 1명을 골라 영입" },
      { id: "yeot",  icon: "🍯", name: "합격 엿",                  cost: 40,  limit: 3, desc: "대표 사도 호감도 +100" },
      { id: "box_ssr", icon: "art:SSR", name: "SSR 아티팩트 상자",   cost: 200, limit: 2, desc: "SSR 아티팩트 1개 (대표 사도 전용이 잘 나와요)" },
      { id: "box_sr",  icon: "art:SR",  name: "SR 아티팩트 상자",    cost: 70,  limit: 5, desc: "SR 아티팩트 1개" },
      { id: "elif",  icon: "💎", name: "엘리프 500",               cost: 30,  limit: 5 },
      { id: "candy", icon: "🍬", name: "별사탕 50",                cost: 30,  limit: 3 },
    ],
    lines: {
      idle:  ["기말고사 대작전 진행 중! 오늘 미션 확인했어요?", "다 같이 기말고사 대마왕 잡으러 가요!", "시험 범위, 오늘은 어디까지 지울 거예요?"],
      cheer: ["이번 기말은 우리가 정복한다!", "합격 부적 모으는 중~ 집중 집중!", "시험장에서 웃는 건 교주님이에요!"],
      done:  ["원정대가 시험장에 한 걸음 더 가까워졌어요!", "이 기세면 전교 1등도 꿈이 아니에요!"],
    },
    examLines: { // 시험 기간(12/1~12/4) 응원 대사
      idle:  ["오늘 시험 잘 봐요, 교주님! 준비한 만큼 다 나올 거예요!", "시험 끝난 과목은 잊고, 다음 과목에 집중!", "긴장되면 심호흡! 후~ 하~"],
      cheer: ["내일 시험 과목 마지막 정리 화이팅!", "틀렸던 문제 한 번만 더 훑어봐요!"],
    },
  },
];

/* 이벤트 한정 꾸미기 (프로필) */
const evState = (s, id = "final2026") => (s.ev && s.ev[id]) || { bought: {}, stamps: [] };
PROFILE_TITLES.push(
  { id: "ev_final",  label: "기말 정복자", cond: "기말고사 대작전 상점", ok: (s) => !!evState(s).bought.title },
  { id: "ev_attend", label: "기말 개근러", cond: "기말고사 대작전 출석 7회", ok: (s) => evState(s).stamps.length >= 7 },
);
PROFILE_FRAMES.push({ id: "charm", label: "합격 부적", cond: "기말고사 대작전 상점", ok: (s) => !!evState(s).bought.frame });
PROFILE_THEMES.push({ id: "snow", label: "눈꽃 시험장", cond: "기말고사 대작전 상점", ok: (s) => !!evState(s).bought.theme });
PROFILE_BADGES.push(
  { id: "ev_final", icon: "📝", label: "기말 대작전", ok: (s) => !!evState(s).bought.badge },
  { id: "ev_raid",  icon: "🏯", label: "범위 정복",   ok: (s) => !!evState(s).raidBeat },
  { id: "ev_gmvp",  icon: "🏅", label: "레이드 MVP",  ok: (s) => !!evState(s).raidMvp },
  { id: "ev_gjoin", icon: "🔥", label: "레이드 참여", ok: (s) => !!evState(s).raidClaimed },
);

(() => {
"use strict";
const TS = window.TS;
const $ = (id) => document.getElementById(id);
const S = () => TS.state;
const esc = TS.esc;
const EV = EVENTS[0];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const addDays = (key, n) => { const d = new Date(key + "T00:00"); d.setDate(d.getDate() + n); return TS.dateKey(d); };
const fmtDate = (key) => { const d = new Date(key + "T00:00"); return `${d.getMonth() + 1}.${d.getDate()}(${"일월화수목금토"[d.getDay()]})`; };

/* ───── 기간 ───── */
try {
  const q = new URLSearchParams(location.search).get("event");
  if (q === "off") sessionStorage.removeItem("ev-force");
  else if (["on", "pre", "after"].includes(q)) sessionStorage.setItem("ev-force", q);
} catch (e) { /* 무시 */ }
const forced = () => { try { return sessionStorage.getItem("ev-force"); } catch (e) { return null; } };
function status() {
  const f = forced();
  if (f) return f;
  const t = TS.today();
  if (t < addDays(EV.start, -EV.previewDays)) return "none";
  if (t < EV.start) return "pre";
  if (t <= EV.end) return "on";
  if (t <= addDays(EV.end, EV.afterDays)) return "after";
  return "none";
}
const isOn = () => status() === "on";
const inExam = () => { const t = TS.today(); return t >= EV.exam.start && t <= EV.exam.end; };
const examDday = () => Math.round((new Date(EV.exam.start + "T00:00") - new Date(TS.today() + "T00:00")) / 864e5);
function examLine() {
  const d = examDday();
  if (inExam()) return "📚 기말고사 기간! 시험 잘 봐요 💪";
  if (d > 0) return `📚 기말고사 ${fmtDate(EV.exam.start)} ~ ${fmtDate(EV.exam.end)} · <b>D-${d}</b>`;
  return "📚 기말고사 끝! 정말 수고했어요 🎉";
}
const shopOpen = () => isOn() || (status() === "after" && (forced() === "after" || TS.today() <= addDays(EV.end, EV.shopDays)));
function countdown() {
  const st = status();
  const target = st === "pre" ? new Date(EV.start + "T00:00") : new Date(addDays(EV.end, 1) + "T00:00");
  let ms = Math.max(0, target - new Date());
  if (forced() && ms === 0) ms = 3 * 864e5; // 테스트 모드
  const d = Math.floor(ms / 864e5), h = Math.floor((ms % 864e5) / 36e5), m = Math.floor((ms % 36e5) / 6e4), s = Math.floor((ms % 6e4) / 1000);
  return d ? `${d}일 ${h}시간 ${m}분` : `${h}시간 ${m}분 ${s}초`;
}

/* ───── 상태 ───── */
function ev() {
  const s = S();
  if (!s.ev) s.ev = {};
  if (!s.ev[EV.id]) s.ev[EV.id] = { charm: 0, earned: 0, stamps: [], daily: { d: "" }, claimed: {}, once: [], bought: {}, focusTotal: 0, raidBeat: false, raidDmg: 0 };
  const e = s.ev[EV.id];
  if (e.daily.d !== TS.today()) e.daily = { d: TS.today(), focus: 0, range: 0, raid: 0 };
  return e;
}
function study() {
  const s = S();
  if (!s.study) s.study = { exams: [], ranges: [], cards: [], wrongs: [], mocks: [] };
  return s.study;
}
const subjects = () => S().settings.subjects;
function giveCharm(n, why) {
  if (!isOn() || n <= 0) return 0;
  const e = ev();
  e.charm += n; e.earned += n;
  if (why) TS.toast(`${EV.coin.icon} ${why} — ${EV.coin.name} +${n}`);
  return n;
}
function dailyProg(m) {
  if (m.stat === "subj") return S().daily.subjBal || 0;
  return ev().daily[m.stat] || 0;
}
const dailyClaimed = (m) => (ev().claimed[TS.today()] || []).includes(m.id);
const dailyReady = (m) => isOn() && !dailyClaimed(m) && dailyProg(m) >= m.goal;
const onceReady = (m) => shopOpen() && !ev().once.includes(m.id) && m.prog(study(), ev()) >= m.goal;
const readyCount = () => EV.daily.filter(dailyReady).length + EV.once.filter(onceReady).length;

/* ───── 연결: 집중 · 보상 ───── */
TS.rewardHooks.push((rw) => {
  if (!isOn()) return;
  rw.eff *= EV.focusBonus;
  rw.notes.push(`🎉 이벤트 ×${EV.focusBonus}`);
});
TS.on("focus", ({ min, eff, full, tag, subject, extras }) => {
  if (!isOn()) return;
  const e = ev();
  e.daily.focus += min; e.focusTotal += min;
  e.fracMin = (e.fracMin || 0) + min;
  const c = Math.floor(e.fracMin / EV.charmPerMin);
  e.fracMin -= c * EV.charmPerMin;
  if (giveCharm(c)) extras.push(`${EV.coin.icon} +${c}`);
  const rd = raidHit((eff == null ? min : eff) * EV.group.perMin);
  if (rd) extras.push(`🔥 레이드 -${Math.round(rd).toLocaleString()}`);
  TS.save();
});
TS.lineHooks.push((c, kind) => (inExam() && status() !== "none" ? EV.examLines[kind] || [] : status() === "on" || status() === "pre" ? EV.lines[kind] || [] : []));
window.RANK_EXTRA && window.RANK_EXTRA.push(() => (status() !== "none" ? { ev: { id: EV.id, c: ev().earned } } : {}));
window.RANK_TABS && window.RANK_TABS.push({ id: "event", label: "🎉 이벤트", val: (e) => (e.ev && e.ev.id === EV.id ? e.ev.c : 0), fmt: "charm", show: () => status() !== "none" });

/* 출석 도장: 이벤트 기간에 접속한 날마다 1개 */
function stampCheck() {
  if (!isOn() || !S().started) return;
  const e = ev(), t = TS.today();
  if (e.stamps.includes(t) || e.stamps.length >= EV.stamps.length) return;
  e.stamps.push(t);
  const st = EV.stamps[e.stamps.length - 1], r = st.reward;
  if (r.elif) TS.addElif(r.elif);
  if (r.candy) TS.addCandy(r.candy);
  if (r.charm) giveCharm(r.charm);
  const drop = r.item ? TS.randomItem(r.item, S().partner) : null;
  if (drop) TS.addItem(drop.id);
  TS.save();
  TS.sfx("level"); TS.confetti(70);
  TS.modal(`<h2>💌 출석 도장 쾅!</h2>
    <p><b>${esc(EV.title)}</b> ${st.label} 출석!</p>
    <div class="stamp-row">${EV.stamps.map((x, i) => `<div class="stamp ${i < e.stamps.length ? "on" : ""}"><span>${i < e.stamps.length ? "합격" : i + 1}</span><small>${x.label}</small></div>`).join("")}</div>
    <div class="reward-row"><span class="reward-chip">🎁 ${esc(st.text)}</span>${drop ? TS.itemChip(drop.id) : ""}</div>
    <div class="modal-actions"><button class="btn white" data-close>닫기</button><button class="btn pink" data-close data-go="event">이벤트 보러 가기</button></div>`);
}
TS.on("start", stampCheck);

/* ───── 화면 공통 ───── */
let pane = "mission";
function hero() {
  const st = status(), e = ev();
  const msg = { pre: `${fmtDate(EV.start)} 시작! 시험 준비 도구는 지금부터 쓸 수 있어요`, on: "진행 중!", after: inExam() ? "준비 끝! 이제 시험 기간이에요" : shopOpen() ? "이벤트 종료 · 상점 교환 기간" : "이벤트 종료" }[st];
  return `<div class="ev-hero">
    <div class="ev-hero-text">
      <span class="ev-tag">기간 한정 이벤트</span>
      <h2 class="ev-title">💓 ${esc(EV.title)}</h2>
      <p class="ev-sub">${esc(EV.sub)}</p>
      <p class="ev-period">📅 ${fmtDate(EV.start)} ~ ${fmtDate(EV.end)} · <b>${msg}</b></p>
      <p class="ev-exam">${examLine()}</p>
      ${st !== "after" ? `<p class="ev-count">${st === "pre" ? "시작까지" : "종료까지"} <b id="ev-count">${countdown()}</b></p>` : ""}
      <div class="ev-chips">
        <span class="ev-coin">${EV.coin.icon} ${esc(EV.coin.name)} <b>${e.charm.toLocaleString()}</b></span>
        <span class="ev-bonus">📚 집중 보상 ×${EV.focusBonus}</span>
        <span class="ev-bonus">${EV.coin.icon} 집중 ${EV.charmPerMin}분 = 부적 1</span>
      </div>
    </div>
    <div class="ev-cast">${EV.cast.map((id, i) => `<img src="${TS.portrait(TS.SADO_MAP[id])}" onerror="this.src='${TS.chibiSrc(TS.SADO_MAP[id])}'" style="--r:${[-8, 0, 8][i]}deg" alt="">`).join("")}
      <span class="ev-cast-say">시험 정복하러 가자!</span></div>
  </div>`;
}
const PANES = [
  ["mission", "🎯 미션"], ["raid", "🔥 단체 레이드"], ["stamp", "💌 출석"], ["exam", "📝 시험 준비"], ["shop", "🛍️ 상점"],
];
function render() {
  const el = $("view-event");
  if (!el) return;
  const rc = readyCount();
  el.innerHTML = `${hero()}
    <div class="seg ev-seg">${PANES.map(([k, l]) => `<button data-evp="${k}" class="${k === pane ? "on" : ""}">${l}${k === "mission" && rc ? `<em class="dot"></em>` : ""}</button>`).join("")}</div>
    <div id="ev-pane"></div>`;
  el.querySelectorAll("[data-evp]").forEach((b) => (b.onclick = () => { pane = b.dataset.evp; TS.sfx("click"); render(); }));
  ({ mission: paneMission, raid: paneRaid, stamp: paneStamp, exam: paneExam, shop: paneShop }[pane] || paneMission)();
}
const P = () => $("ev-pane");
const lockNote = () => (status() === "pre" ? `<p class="ev-lock">🔒 ${fmtDate(EV.start)}부터 열려요. 시험 준비(시간표·범위)는 지금 바로 쓸 수 있어요!</p>` : "");

/* ───── 미션 ───── */
function missionHTML(m, prog, ready, done, key) {
  const p = Math.min(m.goal, prog);
  return `<div class="quest ${done ? "claimed" : ""} ${ready ? "ready" : ""}">
    <div><div class="quest-title">${esc(m.title)}</div><div class="quest-rw"><span>${EV.coin.icon} ${m.charm}</span></div></div>
    <span class="bar"><i style="width:${(p / m.goal) * 100}%"></i></span><span class="quest-prog">${p} / ${m.goal}</span>
    <button class="btn small ${ready ? "yellow" : "white"}" data-evclaim="${key}" ${ready ? "" : "disabled"}>${done ? "완료" : ready ? "받기!" : "진행 중"}</button></div>`;
}
function paneMission() {
  P().innerHTML = `${lockNote()}
    <div class="card"><h3 class="card-title">📆 오늘의 이벤트 미션 <span class="hint" style="margin:0 0 0 auto">매일 자정 초기화</span></h3>
      <div class="quest-list">${EV.daily.map((m) => missionHTML(m, dailyProg(m), dailyReady(m), dailyClaimed(m), "d:" + m.id)).join("")}</div></div>
    <div class="card"><h3 class="card-title">🏁 기간 미션</h3>
      <div class="quest-list">${EV.once.map((m) => missionHTML(m, m.prog(study(), ev()), onceReady(m), ev().once.includes(m.id), "o:" + m.id)).join("")}</div></div>`;
  P().querySelectorAll("[data-evclaim]").forEach((b) => (b.onclick = () => {
    const [k, id] = b.dataset.evclaim.split(":"), e = ev();
    if (k === "d") {
      const m = EV.daily.find((x) => x.id === id);
      if (!dailyReady(m)) return;
      (e.claimed[TS.today()] = e.claimed[TS.today()] || []).push(id);
      giveCharm(m.charm, m.title);
    } else {
      const m = EV.once.find((x) => x.id === id);
      if (!onceReady(m)) return;
      e.once.push(id);
      e.charm += m.charm; e.earned += m.charm; // 교환 기간에도 받을 수 있게
      TS.toast(`${EV.coin.icon} ${m.title} — ${EV.coin.name} +${m.charm}`);
    }
    TS.sfx("coin"); TS.save(); TS.refresh();
  }));
}

/* ───── 출석 ───── */
function paneStamp() {
  const e = ev();
  P().innerHTML = `${lockNote()}<div class="card"><h3 class="card-title">💌 출석 도장 <span class="count">${e.stamps.length} / ${EV.stamps.length}</span></h3>
    <div class="stamp-row big">${EV.stamps.map((x, i) => `<div class="stamp ${i < e.stamps.length ? "on" : ""}">
      <span>${i < e.stamps.length ? "합격" : i + 1}</span><small>${x.label}</small><em>${esc(x.text)}</em></div>`).join("")}</div>
    <p class="hint">이벤트 기간(${fmtDate(EV.start)} ~ ${fmtDate(EV.end)})에 접속한 날마다 도장이 하나씩 찍혀요. 연속이 아니어도 괜찮아요. 7개 다 모으면 한정 칭호 「기말 개근러」!</p></div>`;
}

/* ───── 시험 준비: 시험 시간표 + 범위 + 범위 원정 지도 ───── */
/* 범위 원정 지도: 범위 한 칸 = 징검다리 한 칸. 체크한 만큼 원정대(이벤트 사도들)가 앞으로 걸어감 */
function trekHTML(ri, beat) {
  const T = EV.trek, all = study().ranges;
  const party = `<span class="trek-party">${EV.cast.map((id) => `<img src="${TS.chibiSrc(TS.SADO_MAP[id])}" alt="">`).join("")}</span>`;
  const done = all.filter((x) => x.done), left = all.filter((x) => !x.done);
  // 지나온 칸 → 원정대 → 남은 칸 → 시험장
  const stone = (x, cls) => `<li class="trek-stone ${cls}" title="${esc(x.subject)} · ${esc(x.text)}"><i>${cls === "done" ? "✔" : ""}</i><small>${esc(x.subject)}</small></li>`;
  const road = all.length
    ? `<li class="trek-start">🚩<small>출발</small></li>${done.map((x) => stone(x, "done")).join("")}<li class="trek-here">${party}</li>${left.map((x) => stone(x, "")).join("")}<li class="trek-goal ${beat ? "on" : ""}">🏫<small>시험장</small></li>`
    : `<li class="trek-empty">아래 체크리스트에 시험 범위를 적으면 길이 생겨요!</li>`;
  const say = beat ? "🏁 원정 완주! 시험장 도착했어요. 이제 실력 발휘만 남았어요!"
    : !all.length ? "“범위를 적어줘요! 어디로 걸어가야 할지 모르겠어요~”"
    : left.length <= 2 ? `“시험장이 눈앞이에요! ${left.length}칸만 더!”` : `“아직 ${left.length}칸 남았어요. 오늘은 어디까지 갈까요?”`;
  return `<div class="card trek ${beat ? "beat" : ""}">
      <div class="trek-head"><span class="tag" style="background:var(--green, #5fbf6a);color:#fff">범위 원정</span>
        <h3>${esc(T.name)} <small>${esc(T.title)}</small></h3>
        <b class="trek-pct">${ri.pct}%</b></div>
      <p class="trek-say">${say}</p>
      <ol class="trek-road">${road}</ol>
      <p class="hint" style="margin-top:6px">시험 범위 한 칸을 체크할 때마다 원정대가 한 칸 전진해요. 범위를 전부 체크하면 시험장 도착!</p>
    </div>`;
}
let rangeSubj = "";
function raidInfo() {
  const r = study().ranges, done = r.filter((x) => x.done).length;
  return { total: r.length, done, pct: r.length ? Math.round((done / r.length) * 100) : 0 };
}
function paneExam() {
  const st = study(), ri = raidInfo(), beat = ev().raidBeat;
  const exams = st.exams.slice().sort((a, b) => (a.date + a.period).localeCompare(b.date + b.period));
  if (!rangeSubj) rangeSubj = (exams[0] && exams[0].subject) || subjects()[0];
  const bySubj = (x) => st.ranges.filter((r) => r.subject === x);
  P().innerHTML = `
    ${trekHTML(ri, beat)}
    <div class="card">
      <h3 class="card-title">🗓️ 기말 시험 시간표 <span class="hint" style="margin:0 0 0 auto">등록하면 D-day에도 떠요</span></h3>
      <form class="tt-row ev-form" id="ex-form" autocomplete="off">
        <select id="ex-subj">${subjects().map((x) => `<option>${esc(x)}</option>`).join("")}</select>
        <input type="date" id="ex-date" value="${EV.exam.start}" required>
        <select id="ex-period">${[1, 2, 3, 4, 5, 6, 7].map((n) => `<option value="${n}">${n}교시</option>`).join("")}</select>
        <button class="btn yellow" type="submit">추가</button>
      </form>
      <ul class="exam-list">${exams.map((x) => {
        const dd = Math.round((new Date(x.date + "T00:00") - new Date(TS.today() + "T00:00")) / 864e5);
        const rs = bySubj(x.subject), pct = rs.length ? Math.round((rs.filter((r) => r.done).length / rs.length) * 100) : 0;
        return `<li class="${dd <= 1 && dd >= 0 ? "soon" : ""}"><b class="dd-label">${dd > 0 ? `D-${dd}` : dd === 0 ? "D-DAY" : "끝"}</b>
          <span class="ex-name">${esc(x.subject)}<small>${fmtDate(x.date)} ${x.period}교시</small></span>
          <span class="ex-range"><span class="bar"><i style="width:${pct}%"></i></span><small>범위 ${pct}% (${rs.filter((r) => r.done).length}/${rs.length})</small></span>
          <button class="icon-btn" data-exdel="${x.id}" title="삭제">🗑️</button></li>`;
      }).join("") || '<li class="empty">시험 과목과 날짜를 등록해 보세요!</li>'}</ul>
    </div>
    <div class="card">
      <h3 class="card-title">✅ 시험 범위 체크리스트</h3>
      <div class="seg small subj-seg">${subjects().map((x) => {
        const rs = bySubj(x);
        return `<button data-rs="${esc(x)}" class="${x === rangeSubj ? "on" : ""}">${esc(x)}${rs.length ? ` <small>${rs.filter((r) => r.done).length}/${rs.length}</small>` : ""}</button>`;
      }).join("")}</div>
      <form class="tt-row ev-form" id="rg-form" autocomplete="off" style="margin-top:10px">
        <input id="rg-text" placeholder="예) 3단원 이차함수 / 교과서 p.80~95 / 프린트 2장" maxlength="60" required style="flex:1">
        <button class="btn yellow" type="submit">추가</button>
      </form>
      <p class="hint" style="margin:6px 0 0">여러 줄을 한 번에 붙여넣어도 돼요 (줄마다 한 칸).</p>
      <ul class="range-list">${bySubj(rangeSubj).map((r) => `<li class="${r.done ? "done" : ""}">
        <button class="todo-check" data-rgck="${r.id}">${r.done ? "✔" : ""}</button><span>${esc(r.text)}</span>
        <button class="icon-btn" data-rgdel="${r.id}" title="삭제">✕</button></li>`).join("") || `<li class="empty">${esc(rangeSubj)} 시험 범위를 적어보세요.</li>`}</ul>
    </div>`;
  { // 원정대가 보이게 길을 스크롤
    const road = P().querySelector(".trek-road"), here = P().querySelector(".trek-here");
    if (road && here) road.scrollLeft = here.offsetLeft - road.clientWidth / 2;
  }
  $("ex-form").onsubmit = (e) => {
    e.preventDefault();
    const subject = $("ex-subj").value, date = $("ex-date").value, period = $("ex-period").value;
    if (!date) return;
    const id = uid();
    study().exams.push({ id, subject, date, period });
    const sch = S().schedule || (S().schedule = { tt: [], dd: [] });
    sch.dd.push({ id: "ex_" + id, title: `${subject} 기말고사`, date, time: "" });
    TS.sfx("coin"); TS.toast(`📝 ${subject} 시험 등록! D-day에도 추가했어요`);
    TS.save(); render();
  };
  P().querySelectorAll("[data-exdel]").forEach((b) => (b.onclick = () => {
    const id = b.dataset.exdel;
    study().exams = study().exams.filter((x) => x.id !== id);
    if (S().schedule) S().schedule.dd = S().schedule.dd.filter((x) => x.id !== "ex_" + id);
    TS.save(); render();
  }));
  P().querySelectorAll("[data-rs]").forEach((b) => (b.onclick = () => { rangeSubj = b.dataset.rs; render(); }));
  $("rg-text").addEventListener("paste", (e) => {
    const txt = (e.clipboardData || window.clipboardData).getData("text");
    if (!txt.includes("\n")) return;
    e.preventDefault();
    txt.split(/\r?\n/).map((x) => x.trim()).filter(Boolean).forEach((text) => study().ranges.push({ id: uid(), subject: rangeSubj, text: text.slice(0, 60), done: false }));
    TS.save(); render();
  });
  $("rg-form").onsubmit = (e) => {
    e.preventDefault();
    const text = $("rg-text").value.trim();
    if (!text) return;
    study().ranges.push({ id: uid(), subject: rangeSubj, text, done: false });
    TS.save(); render();
    $("rg-text").focus();
  };
  P().querySelectorAll("[data-rgck]").forEach((b) => (b.onclick = () => {
    const r = study().ranges.find((x) => x.id === b.dataset.rgck);
    r.done = !r.done;
    if (r.done && !r.counted && isOn()) { r.counted = true; ev().daily.range++; raidHit(EV.group.perRange, "범위 체크"); }
    if (r.done) TS.sfx("coin");
    const ri2 = raidInfo();
    if (r.done && ri2.total >= 5 && ri2.done === ri2.total && !ev().raidBeat) {
      ev().raidBeat = true;
      TS.sfx("r3"); TS.confetti(120);
      TS.modal(`<h2>🏁 범위 원정 완주!</h2><div class="trek-party big">${EV.cast.map((id) => `<img src="${TS.chibiSrc(TS.SADO_MAP[id])}" alt="">`).join("")}</div>
        <p>시험 범위 ${ri2.total}칸을 전부 밟고 시험장에 도착했어요!<br>이제 시험장에서 실력을 보여줄 차례예요.</p>
        <div class="reward-row"><span class="reward-chip">🏯 한정 뱃지 「범위 정복」</span><span class="reward-chip">🎯 기간 미션 달성</span></div>
        <div class="modal-actions"><button class="btn yellow" data-close>정복 완료!</button></div>`);
    }
    TS.save(); render();
  }));
  P().querySelectorAll("[data-rgdel]").forEach((b) => (b.onclick = () => {
    study().ranges = study().ranges.filter((x) => x.id !== b.dataset.rgdel); TS.save(); render();
  }));
}

/* ───── 🔥 단체 레이드 ─────
   각자 /raid/<이벤트>/<uid> = { n: 이름, d: 누적 데미지, t: 시각 } 를 올리고,
   모두의 합이 HP 를 넘으면 격파. 보상은 데미지 비율대로 나눔 */
const G = EV.group;
let raidCache = null, raidAt = 0, raidLoading = false, raidErr = "", raidUpT = 0, raidLastUp = 0;
const raidPath = () => `raid/${EV.id}`;
function raidSus(e) { // 말이 안 되는 데미지 (이벤트 시작 후 흐른 시간보다 많음)
  const since = forced() ? Infinity : Math.max(0, (Date.now() - new Date(EV.start + "T00:00")) / 60000); // 테스트 모드면 검사 생략
  return !(e.d >= 0) || e.d > since * 20 + 6000 || e.t > Date.now() + 600000;
}
function raidTotals() {
  const list = (raidCache || []).filter((e) => !raidSus(e) || e.uid === raidCache.me).sort((a, b) => b.d - a.d);
  const total = list.reduce((a, e) => a + e.d, 0);
  return { list, total, cleared: total >= G.hp };
}
function raidHit(n, why) {
  if (!isOn() || !(n > 0)) return 0;
  if (raidCache && raidTotals().cleared) return 0; // 이미 격파됨
  const e = ev();
  e.raidDmg = (e.raidDmg || 0) + n;
  e.daily.raid = (e.daily.raid || 0) + n;
  if (why) TS.toast(`🔥 ${G.name}에게 ${Math.round(n)} 데미지! (${why})`);
  clearTimeout(raidUpT); raidUpT = setTimeout(raidUpload, 4000);
  return n;
}
async function raidUpload() {
  if (!window.FB || !(ev().raidDmg > 0)) return;
  if (Date.now() - raidLastUp < 7000) { clearTimeout(raidUpT); raidUpT = setTimeout(raidUpload, 7000); return; }
  raidLastUp = Date.now();
  try {
    await window.FB.api(`${raidPath()}/{uid}`, { method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ n: String(S().name).slice(0, 12), d: Math.floor(ev().raidDmg), t: Date.now() }) });
    raidErr = "";
  } catch (err) { raidErr = /permission/i.test(err.message) ? "서버가 레이드 기록을 거절했어요 (보안 규칙을 확인해 주세요)" : err.message; }
}
async function raidLoad(force) {
  if (!window.FB || raidLoading || (!force && raidCache && Date.now() - raidAt < 30000)) return;
  raidLoading = true;
  try {
    if (ev().raidDmg > 0) await raidUpload();
    const { uid, data } = await window.FB.api(raidPath());
    const list = Object.entries(data || {}).map(([u, x]) => (x && typeof x === "object" ? {
      uid: u, n: String(x.n || "???").slice(0, 12), d: Math.max(0, Math.floor(+x.d || 0)), t: +x.t || 0 } : null)).filter(Boolean);
    list.me = uid;
    raidCache = list; raidAt = Date.now(); raidErr = "";
  } catch (err) { raidErr = err.message; }
  raidLoading = false;
  if (TS.view === "event" && pane === "raid") paneRaid();
}
/* 기여도별 아티팩트: 1위 SSR, 2~3위 SR+R, 기여 10%↑ SR, 3%↑ R, 참여 N (못 잡으면 N 하나) */
function raidItems(cleared, rank, share) {
  if (!cleared) return [["N", 1]];
  if (rank === 1) return [["SSR", 1], ["SR", 1]];
  if (rank <= 3) return [["SR", 1], ["R", 1]];
  if (share >= 0.1) return [["SR", 1]];
  if (share >= 0.03) return [["R", 1], ["N", 1]];
  return [["N", 2]];
}
const RAR_LABEL = { SSR: "SSR", SR: "SR", R: "R", N: "N" };
function raidReward() {
  const { list, total, cleared } = raidTotals();
  const me = list.find((x) => x.uid === raidCache.me);
  if (!me || !me.d) return null;
  const share = total ? me.d / total : 0, k = cleared ? 1 : G.failRate;
  return {
    share, rank: list.indexOf(me) + 1, cleared,
    charm: Math.round((G.base.charm + G.pool.charm * share) * k),
    elif: Math.round((G.base.elif + G.pool.elif * share) * k),
    candy: Math.round(G.pool.candy * share * k),
    mvp: cleared && list.indexOf(me) < 3,
    items: raidItems(cleared, list.indexOf(me) + 1, share),
  };
}
function paneRaid() {
  const c = TS.SADO_MAP[G.boss], e = ev();
  if (!raidCache) { P().innerHTML = `<div class="card"><p class="hint">레이드 정보를 불러오는 중…</p></div>`; raidLoad(); return; }
  const { list, total, cleared } = raidTotals();
  const left = Math.max(0, G.hp - total), me = list.find((x) => x.uid === raidCache.me);
  const rw = raidReward(), ended = status() === "after";
  const canClaim = rw && !e.raidClaimed && (cleared || ended);
  const fmtN = (n) => Math.round(n).toLocaleString();
  P().innerHTML = `${lockNote()}
    <div class="card raid-g ${cleared ? "beat" : ""}">
      <div class="raid-top">
        <img class="raid-img ${cleared ? "dead" : ""}" src="${TS.chibiSrc(c)}" alt="">
        <div class="raid-info">
          <span class="tag" style="background:#d8253e;color:#fff">🔥 단체 레이드</span>
          <h3>${esc(G.name)} <small>${esc(G.title)}</small></h3>
          <p>${cleared ? "🏆 모두의 힘으로 격파했어요! 보상을 받아가세요." : ended ? "이벤트가 끝났어요. 못 잡았지만 참여 보상은 받을 수 있어요." : `“크하하… ${list.length}명이 덤벼도 나는 안 쓰러진다!”`}</p>
          <div class="boss-hp"><span class="bar hp"><i style="width:${(left / G.hp) * 100}%"></i></span><b>HP ${fmtN(left)} / ${fmtN(G.hp)}</b></div>
          <p class="hint" style="margin-top:6px">이벤트 기간에 집중 1분 = ${G.perMin} 데미지 (이벤트 보너스로 ×${EV.focusBonus}) · 시험 범위 1칸 = ${G.perRange} · 참여 ${list.length}명</p>
        </div>
      </div>
    </div>
    <div class="card">
      <h3 class="card-title">⚔️ 내 기여 <button class="btn white small" id="rd-refresh" style="margin-left:auto">${raidLoading ? "불러오는 중…" : "🔄 새로고침"}</button></h3>
      ${raidErr ? `<p class="rank-err" style="padding:8px 12px;border-radius:12px">⚠️ ${esc(raidErr)}</p>` : ""}
      <div class="raid-me">
        <div><small>내 데미지</small><b>${fmtN(e.raidDmg || 0)}</b></div>
        <div><small>순위</small><b>${me ? `${list.indexOf(me) + 1}위` : "-"}</b></div>
        <div><small>기여도</small><b>${rw ? (rw.share * 100).toFixed(1) + "%" : "0%"}</b></div>
      </div>
      <div class="raid-reward">
        <b>${cleared ? "🎁 받을 보상" : ended ? "🎁 참여 보상 (30%)" : "🎁 지금 격파하면 받을 보상 (예상)"}</b>
        ${rw ? `<span>🧧 ${rw.charm}</span><span><i class="ic-elif"></i> ${fmtN(rw.elif)}</span><span><i class="ic-candy"></i> ${rw.candy}</span>${rw.items.map(([r, n]) => `<span class="rar r-${r}">🎁 ${RAR_LABEL[r]} 아티팩트${n > 1 ? ` ×${n}` : ""}</span>`).join("")}${rw.mvp ? "<span>🏅 MVP 뱃지</span>" : ""}` : "<span>공부해서 공격하면 보상이 생겨요!</span>"}
      </div>
      <p class="hint">기본 보상 + 공동 보상(🧧${G.pool.charm} · 💎${fmtN(G.pool.elif)} · 🍬${G.pool.candy})을 <b>데미지 비율대로</b> 나눠요.<br>
      아티팩트: <b>1위 SSR+SR</b> · 2~3위 SR+R · 기여 10%↑ SR · 3%↑ R+N · 참여 N×2 · 1~3위는 MVP 뱃지!</p>
      ${canClaim ? `<button class="btn yellow big" id="rd-claim" style="width:100%">보상 받기!</button>` : e.raidClaimed ? `<p class="hint">✔ 보상을 받았어요</p>` : ""}
    </div>
    <div class="card">
      <h3 class="card-title">🏆 공격 순위 <span class="count">${list.length}명</span></h3>
      <ol class="raid-list">${list.slice(0, 20).map((x, i) => `<li class="${x.uid === raidCache.me ? "me" : ""}">
        <span class="rk">${i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</span><span class="nm">${esc(x.n)}</span>
        <span class="bar"><i style="width:${total ? (x.d / list[0].d) * 100 : 0}%"></i></span>
        <b>${fmtN(x.d)}</b><small>${total ? ((x.d / total) * 100).toFixed(1) : 0}%</small></li>`).join("") || '<li class="empty">아직 아무도 공격하지 않았어요. 첫 공격의 주인공이 되어보세요!</li>'}</ol>
      ${raidAt ? `<p class="hint">업데이트: ${new Date(raidAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</p>` : ""}
    </div>`;
  $("rd-refresh").onclick = () => raidLoad(true);
  const cl = $("rd-claim");
  if (cl) cl.onclick = () => {
    const r = raidReward();
    if (!r || e.raidClaimed) return;
    e.raidClaimed = true; e.raidMvp = r.mvp;
    e.charm += r.charm; e.earned += r.charm;
    TS.addElif(r.elif); TS.addCandy(r.candy);
    const got = [];
    for (const [rar, n] of r.items) for (let i = 0; i < n; i++) { const it = TS.randomItem(rar, S().partner); if (it) { TS.addItem(it.id); got.push(it.id); } }
    TS.save(); TS.sfx("r3"); TS.confetti(120);
    TS.modal(`<h2>🔥 레이드 보상!</h2><p>${r.cleared ? `${esc(G.name)} 격파 성공!` : "참여 보상이에요."} 내 순위 <b>${r.rank}위</b> · 기여도 <b>${(r.share * 100).toFixed(1)}%</b></p>
      <div class="reward-row"><span class="reward-chip">🧧 +${r.charm}</span><span class="reward-chip"><i class="ic-elif"></i>+${r.elif.toLocaleString()}</span><span class="reward-chip"><i class="ic-candy"></i>+${r.candy}</span>${r.mvp ? '<span class="reward-chip">🏅 MVP 뱃지</span>' : ""}</div>
      ${got.length ? `<div class="reward-row">${got.map((id) => TS.itemChip(id)).join("")}</div><p class="hint">아티팩트는 🎁 선물하기 → 🎒 가방에서 사도에게 줄 수 있어요</p>` : ""}
      <div class="modal-actions"><button class="btn yellow" data-close>좋아!</button></div>`);
    TS.refresh();
  };
}
setInterval(() => { if (TS.view === "event" && pane === "raid" && !document.hidden) raidLoad(); }, 30000);

/* ───── 상점 ───── */
function paneShop() {
  const e = ev(), open = shopOpen();
  P().innerHTML = `${lockNote()}
    <div class="card"><h3 class="card-title">🛍️ 기간 한정 상점 <span class="ev-coin" style="margin-left:auto">${EV.coin.icon} <b>${e.charm.toLocaleString()}</b></span></h3>
    <p class="hint" style="margin:0 0 12px">${open ? `상점은 ${fmtDate(addDays(EV.end, EV.shopDays))}까지 열려요. 한정 꾸미기는 이벤트가 끝나도 계속 쓸 수 있어요!` : status() === "pre" ? "이벤트가 시작되면 열려요." : "상점이 닫혔어요."}</p>
    <div class="shop-grid">${EV.shop.map((it) => {
      const n = e.bought[it.id] || 0, sold = n >= it.limit;
      return `<div class="shop-item ${sold ? "sold" : ""}">
        <span class="si-icon">${it.icon === "💎" ? '<i class="ic-elif" style="width:34px;height:34px"></i>' : it.icon.startsWith("art:") ? boxIcon(it.icon.slice(4)) : it.icon}</span>
        <b>${esc(it.name)}</b>${it.desc ? `<small>${esc(it.desc)}</small>` : ""}
        <span class="si-limit">${sold ? "품절" : `남은 수량 ${it.limit - n}`}</span>
        <button class="btn small ${sold ? "white" : "pink"}" data-buy-ev="${it.id}" ${!open || sold || e.charm < it.cost ? "disabled" : ""}>${EV.coin.icon} ${it.cost}</button>
      </div>`;
    }).join("")}</div></div>`;
  P().querySelectorAll("[data-buy-ev]").forEach((b) => (b.onclick = () => buy(EV.shop.find((x) => x.id === b.dataset.buyEv))));
}
/* 상자 아이콘: 그 등급 아티팩트 그림 3장을 겹쳐서 */
function boxIcon(rar) {
  const pick = ARTIFACTS.filter((x) => x.rarity === rar).slice(0, 3);
  return `<span class="box-stack r-${rar}">${pick.map((x) => TS.itemIcon(x)).join("")}</span>`;
}
function buy(it) {
  const e = ev();
  if (!shopOpen() || e.charm < it.cost || (e.bought[it.id] || 0) >= it.limit) return;
  const finish = (msg) => {
    e.charm -= it.cost; e.bought[it.id] = (e.bought[it.id] || 0) + 1;
    TS.sfx("r2"); TS.toast(msg); TS.save(); TS.refresh();
  };
  if (it.id === "elif") { TS.addElif(500); return finish("💎 엘리프 +500"); }
  if (it.id.startsWith("box_")) {
    const got = TS.randomItem(it.id === "box_ssr" ? "SSR" : "SR", S().partner);
    TS.addItem(got.id);
    finish(`🎁 ${got.name} 획득!`);
    TS.modal(`<h2>🎁 상자 열기!</h2><div class="reward-row big">${TS.itemChip(got.id)}</div>
      <p class="hint">🎁 선물하기 → 🎒 가방에서 사도에게 줄 수 있어요</p>
      <div class="modal-actions"><button class="btn yellow" data-close>좋아!</button></div>`);
    return;
  }
  if (it.id === "candy") { TS.addCandy(50); return finish("🍬 별사탕 +50"); }
  if (it.id === "yeot") {
    const p = S().partner;
    if (window.Affection) window.Affection.gain(p, 100);
    TS.say("합격 엿이다! 이거 먹고 시험 철썩 붙는 거예요!");
    return finish(`🍯 ${TS.SADO_MAP[p].name}에게 합격 엿! 💗+100`);
  }
  if (it.id === "ssr") {
    const cand = SADO.filter((c) => c.rarity === 3 && !S().owned[c.id]);
    if (!cand.length) return TS.toast("이미 ★★★ 사도를 전부 갖고 있어요!");
    TS.modal(`<h2>🎫 ★★★ 사도 선택권</h2><p>영입할 사도를 골라주세요!</p>
      <div class="pick-grid">${cand.map((c) => `<button data-pick-ssr="${c.id}"><img src="${TS.chibiSrc(c)}" alt=""><span>${esc(c.name)}</span></button>`).join("")}</div>`,
      (el, close) => el.querySelectorAll("[data-pick-ssr]").forEach((bt) => (bt.onclick = () => {
        const c = TS.SADO_MAP[bt.dataset.pickSsr];
        S().owned[c.id] = { n: 1, emo: c.emote ? 1 : 0 };
        close(); TS.confetti(100); finish(`🎫 ${c.name} 영입!`);
      })));
    return;
  }
  const label = { title: "칭호", frame: "프레임", theme: "테마", badge: "뱃지" }[it.id];
  finish(`${it.icon} 한정 ${label} 획득! 프로필 꾸미기에서 장착하세요`);
}

/* ───── 로비 배너 · 탭 · 시작 화면 ───── */
function renderBanner() {
  const el = $("event-banner"), st = status();
  if (!el) return;
  el.classList.toggle("hidden", st === "none");
  if (st === "none") return;
  const rc = readyCount();
  const todayExams = study().exams.filter((x) => x.date === TS.today()).sort((a, b) => a.period - b.period);
  el.innerHTML = `<div class="evb-text"><span class="ev-tag">${st === "pre" ? "곧 시작" : st === "on" ? "진행 중" : inExam() ? "📚 시험 기간" : "종료"}</span>
      <b>💓 ${esc(EV.title)}</b>
      <small>${st === "pre" ? `${fmtDate(EV.start)} 시작 · 시작까지 ${countdown()}` : st === "on" ? `종료까지 ${countdown()} · 오늘 미션 ${EV.daily.filter(dailyClaimed).length}/${EV.daily.length} · 기말고사 D-${examDday()}` : inExam() ? (todayExams.length ? `오늘 시험: ${todayExams.map((x) => `${esc(x.subject)} ${x.period}교시`).join(" · ")} — 준비한 만큼 다 보여줘요 💪` : "시험 기간! 준비한 만큼 다 보여줘요 💪") : shopOpen() ? "상점 교환 기간이에요" : "참여해 주셔서 고마워요!"}</small></div>
    <span class="ev-coin">${EV.coin.icon} <b>${ev().charm}</b></span>
    <button class="btn pink" data-go="event">${rc ? `🎁 보상 ${rc}개` : "이벤트 보기"}</button>`;
}
TS.views.event = render;
TS.on("refresh", (v) => {
  const st = status(), tab = $("tab-event");
  if (tab) {
    tab.classList.toggle("hidden", st === "none");
    $("dot-event").classList.toggle("hidden", !readyCount());
  }
  if (v === "lobby") renderBanner();
});
setInterval(() => {
  const c = $("ev-count");
  if (c && TS.view === "event") c.textContent = countdown();
}, 1000);

if (window.TitleScreen) {
  const orig = window.TitleScreen.show;
  window.TitleScreen.show = (done) => {
    orig(done);
    const st = status(), t = $("title");
    if (!t || (st !== "on" && st !== "pre")) return;
    const r = document.createElement("div");
    r.className = "ttl-event";
    r.innerHTML = `<span>${st === "on" ? "🎉 진행 중" : "⏳ 곧 시작"}</span><b>💓 ${esc(EV.title)}</b><small>${fmtDate(EV.start)} ~ ${fmtDate(EV.end)}</small>`;
    t.appendChild(r);
  };
}

window.GameEvent = { status, ev, study, EV };
})();
