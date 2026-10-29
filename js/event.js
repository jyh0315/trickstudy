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
    raid: { id: "ifrit", name: "기말고사 마왕", title: "시험지를 태우는 불꽃" },
    daily: [
      { id: "focus", title: "오늘 집중 120분",                stat: "focus", goal: 120, charm: 15 },
      { id: "subj",  title: "시험 과목 3개 이상 각 20분 공부", stat: "subj",  goal: 3,   charm: 10 },
      { id: "cards", title: "암기카드 20장 복습",             stat: "cards", goal: 20,  charm: 10 },
      { id: "wrong", title: "오답노트 2개 작성·다시 풀기",     stat: "wrong", goal: 2,   charm: 10 },
      { id: "range", title: "시험 범위 3칸 체크",             stat: "range", goal: 3,   charm: 10 },
      { id: "mock",  title: "모의고사 1회 완주",              stat: "mock",  goal: 1,   charm: 15 },
    ],
    once: [
      { id: "plan",     title: "기말 시험 시간표 등록하기",        goal: 1,   charm: 20, prog: (st) => st.exams.length },
      { id: "rangeset", title: "시험 범위 10칸 이상 적어두기",     goal: 10,  charm: 15, prog: (st) => st.ranges.length },
      { id: "cardset",  title: "암기카드 30장 만들기",            goal: 30,  charm: 15, prog: (st) => st.cards.length },
      { id: "focus1200", title: "이벤트 기간 집중 1200분",          goal: 1200, charm: 80, prog: (st, ev) => ev.focusTotal },
      { id: "cards200",  title: "이벤트 기간 암기카드 200장 복습",   goal: 200,  charm: 50, prog: (st, ev) => ev.cardsTotal },
      { id: "mock5",     title: "모의고사 5회 완주",                goal: 5,    charm: 40, prog: (st) => st.mocks.length },
      { id: "rangeall",  title: "시험 전에 기말고사 마왕 쓰러뜨리기 (범위 100%)", goal: 1, charm: 80, prog: (st, ev) => (ev.raidBeat ? 1 : 0) },
    ],
    stamps: [   // 이벤트 기간에 접속한 날마다 1개 (연속 아니어도 됨)
      { label: "1회", reward: { elif: 300 },           text: "엘리프 300" },
      { label: "2회", reward: { charm: 20 },           text: "합격 부적 20" },
      { label: "3회", reward: { candy: 40 },           text: "별사탕 40" },
      { label: "4회", reward: { charm: 30 },           text: "합격 부적 30" },
      { label: "5회", reward: { elif: 500 },           text: "엘리프 500" },
      { label: "6회", reward: { charm: 40 },           text: "합격 부적 40" },
      { label: "7회", reward: { charm: 60, title: 1 }, text: "부적 60 + 칭호 「기말 개근러」" },
    ],
    shop: [
      { id: "title", icon: "🏆", name: "한정 칭호 「기말 정복자」",   cost: 120, limit: 1 },
      { id: "frame", icon: "🧧", name: "한정 프레임 「합격 부적」",   cost: 160,  limit: 1 },
      { id: "theme", icon: "❄️", name: "한정 테마 「눈꽃 시험장」",   cost: 120,  limit: 1 },
      { id: "badge", icon: "📝", name: "한정 뱃지 「기말 대작전」",   cost: 80,   limit: 1 },
      { id: "ssr",   icon: "🎫", name: "★★★ 사도 선택권",          cost: 300, limit: 1, desc: "아직 없는 ★★★ 사도 1명을 골라 영입" },
      { id: "yeot",  icon: "🍯", name: "합격 엿",                  cost: 40,  limit: 3, desc: "대표 사도 호감도 +100" },
      { id: "elif",  icon: "💎", name: "엘리프 500",               cost: 30,  limit: 5 },
      { id: "candy", icon: "🍬", name: "별사탕 50",                cost: 30,  limit: 3 },
    ],
    lines: {
      idle:  ["기말고사 대작전 진행 중! 오늘 미션 확인했어요?", "오답노트 한 장만 같이 써볼까요?", "암기카드 넘기러 가요! 딱 20장만!", "시험 범위, 오늘은 어디까지 지울 거예요?"],
      cheer: ["이번 기말은 우리가 정복한다!", "합격 부적 모으는 중~ 집중 집중!", "시험장에서 웃는 건 교주님이에요!"],
      done:  ["기말고사 마왕이 떨고 있어요!", "이 기세면 전교 1등도 꿈이 아니에요!"],
    },
    examLines: { // 시험 기간(12/1~12/4) 응원 대사
      idle:  ["오늘 시험 잘 봐요, 교주님! 준비한 만큼 다 나올 거예요!", "시험 끝난 과목은 잊고, 다음 과목에 집중!", "긴장되면 심호흡! 후~ 하~"],
      cheer: ["내일 시험 과목 마지막 정리 화이팅!", "오답노트 한 번만 더 훑어봐요!"],
    },
  },
];
const WRONG_REASONS = ["개념 부족", "계산 실수", "문제 잘못 읽음", "시간 부족", "찍었음", "기타"];
const WRONG_TIPS = {
  "개념 부족": "교과서 해당 단원 개념 정리를 다시 한 번! 암기카드로 만들어두면 좋아요.",
  "계산 실수": "검산 습관을 들여요. 풀이를 한 줄씩 또박또박 쓰기!",
  "문제 잘못 읽음": "문제의 조건에 밑줄 긋기! ‘아닌 것’, ‘모두’ 같은 말에 동그라미.",
  "시간 부족": "모의고사 모드로 시간 재고 풀어보는 연습을 해봐요.",
  "찍었음": "찍은 문제는 무조건 다시 풀기! 진짜 아는지 확인해요.",
  "기타": "왜 틀렸는지 한 줄이라도 적어두면 다음엔 안 틀려요.",
};
const CARD_INTERVAL = [0, 1, 2, 4, 7]; // 암기카드 상자 1~5 복습 간격(일)

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
  if (!s.ev[EV.id]) s.ev[EV.id] = { charm: 0, earned: 0, stamps: [], daily: { d: "" }, claimed: {}, once: [], bought: {}, focusTotal: 0, cardsTotal: 0, raidBeat: false };
  const e = s.ev[EV.id];
  if (e.daily.d !== TS.today()) e.daily = { d: TS.today(), focus: 0, cards: 0, wrong: 0, range: 0, mock: 0 };
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
TS.on("focus", ({ min, full, tag, subject, extras }) => {
  if (tag === "mock" && full) mockDone(subject, min);
  if (!isOn()) return;
  const e = ev();
  e.daily.focus += min; e.focusTotal += min;
  e.fracMin = (e.fracMin || 0) + min;
  const c = Math.floor(e.fracMin / EV.charmPerMin);
  e.fracMin -= c * EV.charmPerMin;
  if (giveCharm(c)) extras.push(`${EV.coin.icon} +${c}`);
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
  TS.save();
  TS.sfx("level"); TS.confetti(70);
  TS.modal(`<h2>💌 출석 도장 쾅!</h2>
    <p><b>${esc(EV.title)}</b> ${st.label} 출석!</p>
    <div class="stamp-row">${EV.stamps.map((x, i) => `<div class="stamp ${i < e.stamps.length ? "on" : ""}"><span>${i < e.stamps.length ? "합격" : i + 1}</span><small>${x.label}</small></div>`).join("")}</div>
    <div class="reward-row"><span class="reward-chip">🎁 ${esc(st.text)}</span></div>
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
  ["mission", "🎯 미션"], ["stamp", "💌 출석"], ["exam", "📝 시험 준비"], ["cards", "🃏 암기카드"],
  ["wrong", "❌ 오답노트"], ["mock", "⏱️ 모의고사"], ["shop", "🛍️ 상점"],
];
function render() {
  const el = $("view-event");
  if (!el) return;
  const rc = readyCount();
  el.innerHTML = `${hero()}
    <div class="seg ev-seg">${PANES.map(([k, l]) => `<button data-evp="${k}" class="${k === pane ? "on" : ""}">${l}${k === "mission" && rc ? `<em class="dot"></em>` : ""}</button>`).join("")}</div>
    <div id="ev-pane"></div>`;
  el.querySelectorAll("[data-evp]").forEach((b) => (b.onclick = () => { pane = b.dataset.evp; cardSession = null; TS.sfx("click"); render(); }));
  ({ mission: paneMission, stamp: paneStamp, exam: paneExam, cards: paneCards, wrong: paneWrong, mock: paneMock, shop: paneShop })[pane]();
}
const P = () => $("ev-pane");
const lockNote = () => (status() === "pre" ? `<p class="ev-lock">🔒 ${fmtDate(EV.start)}부터 열려요. 시험 준비·암기카드·오답노트는 지금 바로 쓸 수 있어요!</p>` : "");

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

/* ───── 시험 준비: 시험 시간표 + 범위 + 기말고사 마왕 ───── */
let rangeSubj = "";
function raidInfo() {
  const r = study().ranges, done = r.filter((x) => x.done).length;
  return { total: r.length, done, pct: r.length ? Math.round((done / r.length) * 100) : 0 };
}
function paneExam() {
  const st = study(), ri = raidInfo(), c = TS.SADO_MAP[EV.raid.id], beat = ev().raidBeat;
  const exams = st.exams.slice().sort((a, b) => (a.date + a.period).localeCompare(b.date + b.period));
  if (!rangeSubj) rangeSubj = (exams[0] && exams[0].subject) || subjects()[0];
  const bySubj = (x) => st.ranges.filter((r) => r.subject === x);
  P().innerHTML = `
    <div class="card raid ${beat ? "beat" : ""}">
      <div class="raid-top">
        <img class="raid-img ${beat ? "dead" : ""}" src="${TS.chibiSrc(c)}" alt="">
        <div class="raid-info">
          <span class="tag" style="background:var(--red);color:#fff">이벤트 보스</span>
          <h3>${esc(EV.raid.name)} <small>${esc(EV.raid.title)}</small></h3>
          <p>${beat ? "🏆 시험 범위를 전부 정복했어요! 마왕 격파!" : ri.total ? `“크하하! 아직 범위가 ${ri.total - ri.done}칸이나 남았다!”` : "“시험 범위를 적어봐라… 그게 내 HP다!”"}</p>
          <div class="boss-hp"><span class="bar hp"><i style="width:${ri.total ? 100 - ri.pct : 100}%"></i></span><b>HP ${ri.total - ri.done} / ${ri.total}</b></div>
          <p class="hint" style="margin-top:6px">시험 범위 한 칸을 체크할 때마다 마왕 HP -1. 범위를 전부 체크하면 격파!</p>
        </div>
      </div>
    </div>
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
    if (r.done && !r.counted && isOn()) { r.counted = true; ev().daily.range++; }
    if (r.done) TS.sfx("coin");
    const ri2 = raidInfo();
    if (r.done && ri2.total >= 5 && ri2.done === ri2.total && !ev().raidBeat) {
      ev().raidBeat = true;
      TS.sfx("r3"); TS.confetti(120);
      TS.modal(`<h2>🏯 기말고사 마왕 격파!</h2><img class="modal-emote boss-dead" src="${TS.chibiSrc(TS.SADO_MAP[EV.raid.id])}" alt="">
        <p>시험 범위 ${ri2.total}칸을 전부 정복했어요!<br>이제 시험장에서 실력을 보여줄 차례예요.</p>
        <div class="reward-row"><span class="reward-chip">🏯 한정 뱃지 「범위 정복」</span><span class="reward-chip">🎯 기간 미션 달성</span></div>
        <div class="modal-actions"><button class="btn yellow" data-close>정복 완료!</button></div>`);
    }
    TS.save(); render();
  }));
  P().querySelectorAll("[data-rgdel]").forEach((b) => (b.onclick = () => {
    study().ranges = study().ranges.filter((x) => x.id !== b.dataset.rgdel); TS.save(); render();
  }));
}

/* ───── 암기카드 (라이트너 상자 방식) ───── */
let cardSession = null, cardSubj = "";
const due = (c) => !c.due || c.due <= TS.today();
function paneCards() {
  const st = study();
  if (cardSession) return cardStudy();
  const list = cardSubj ? st.cards.filter((c) => c.subject === cardSubj) : st.cards;
  const dueN = list.filter(due).length;
  P().innerHTML = `
    <div class="card">
      <h3 class="card-title">🃏 암기카드 만들기</h3>
      <form class="ev-form card-form" id="cd-form" autocomplete="off">
        <select id="cd-subj">${subjects().map((x) => `<option ${x === cardSubj ? "selected" : ""}>${esc(x)}</option>`).join("")}</select>
        <input id="cd-front" placeholder="앞면 (질문) 예) 광합성이 일어나는 곳" maxlength="120" required>
        <input id="cd-back" placeholder="뒷면 (답) 예) 엽록체" maxlength="200" required>
        <button class="btn yellow" type="submit">추가</button>
      </form>
    </div>
    <div class="card">
      <div class="cards-head">
        <div class="seg small">${["", ...subjects()].map((x) => `<button data-cs="${esc(x)}" class="${x === cardSubj ? "on" : ""}">${x ? esc(x) : "전체"}</button>`).join("")}</div>
      </div>
      <div class="box-row">${[1, 2, 3, 4, 5].map((b) => `<div class="lbox"><b>${list.filter((c) => (c.box || 1) === b).length}</b><small>상자 ${b}${b === 1 ? " (매일)" : ` (${CARD_INTERVAL[b - 1]}일)`}</small></div>`).join("")}</div>
      <div class="modal-actions">
        <button class="btn pink big" id="cd-go" ${dueN ? "" : "disabled"}>📖 오늘 복습 ${dueN}장</button>
        <button class="btn white" id="cd-all" ${list.length ? "" : "disabled"}>🔀 아무거나 20장</button>
      </div>
      <p class="hint">“알아요” 하면 다음 상자로 넘어가서 점점 가끔 나오고, “몰라요” 하면 상자 1로 돌아가 매일 나와요. 이벤트 기간엔 5장마다 부적 1!</p>
      <ul class="card-list">${list.slice().reverse().slice(0, 60).map((c) => `<li><span class="tag">${esc(c.subject)}</span><b>${esc(c.front)}</b><span>${esc(c.back)}</span><small>상자 ${c.box || 1}</small><button class="icon-btn" data-cddel="${c.id}">✕</button></li>`).join("") || '<li class="empty">카드를 만들어서 외워봐요!</li>'}</ul>
    </div>`;
  $("cd-form").onsubmit = (e) => {
    e.preventDefault();
    st.cards.push({ id: uid(), subject: $("cd-subj").value, front: $("cd-front").value.trim(), back: $("cd-back").value.trim(), box: 1, due: TS.today() });
    cardSubj = $("cd-subj").value;
    TS.sfx("click"); TS.save(); render(); $("cd-front").focus();
  };
  P().querySelectorAll("[data-cs]").forEach((b) => (b.onclick = () => { cardSubj = b.dataset.cs; render(); }));
  P().querySelectorAll("[data-cddel]").forEach((b) => (b.onclick = () => { st.cards = st.cards.filter((c) => c.id !== b.dataset.cddel); TS.save(); render(); }));
  const start = (cards) => { cardSession = { queue: cards.map((c) => c.id), i: 0, flip: false, ok: 0, ng: 0 }; render(); };
  $("cd-go").onclick = () => start(list.filter(due).sort(() => Math.random() - 0.5).slice(0, 20));
  $("cd-all").onclick = () => start(list.slice().sort(() => Math.random() - 0.5).slice(0, 20));
}
function cardStudy() {
  const s = cardSession, st = study();
  const c = st.cards.find((x) => x.id === s.queue[s.i]);
  if (!c) {
    P().innerHTML = `<div class="card flash-done"><h3>🎉 복습 끝!</h3><p>알아요 <b>${s.ok}</b> · 몰라요 <b>${s.ng}</b></p>
      <div class="modal-actions"><button class="btn yellow" id="cd-back2">카드 목록으로</button></div></div>`;
    $("cd-back2").onclick = () => { cardSession = null; render(); };
    return;
  }
  P().innerHTML = `<div class="card flash-wrap">
    <div class="flash-top"><span class="tag">${esc(c.subject)}</span><span>${s.i + 1} / ${s.queue.length}</span><button class="link" id="cd-quit">그만하기</button></div>
    <button class="flash ${s.flip ? "flip" : ""}" id="cd-card">
      <span class="flash-in"><span class="flash-front">${esc(c.front)}<small>눌러서 뒤집기</small></span><span class="flash-back">${esc(c.back)}</span></span>
    </button>
    <div class="modal-actions ${s.flip ? "" : "invisible"}">
      <button class="btn red big" id="cd-ng">😵 몰라요</button><button class="btn mint big" id="cd-ok">😎 알아요</button>
    </div></div>`;
  $("cd-card").onclick = () => { s.flip = !s.flip; TS.sfx("flip"); cardStudy(); };
  $("cd-quit").onclick = () => { cardSession = null; render(); };
  const answer = (ok) => {
    c.box = ok ? Math.min(5, (c.box || 1) + 1) : 1;
    c.due = addDays(TS.today(), CARD_INTERVAL[c.box - 1]);
    c.reviews = (c.reviews || 0) + 1;
    ok ? s.ok++ : s.ng++;
    if (isOn()) {
      const e = ev(); e.daily.cards++; e.cardsTotal++;
      if (e.cardsTotal % 5 === 0) giveCharm(1);
    }
    TS.sfx(ok ? "coin" : "click");
    s.i++; s.flip = false; TS.save(); cardStudy();
  };
  if (s.flip) { $("cd-ok").onclick = () => answer(true); $("cd-ng").onclick = () => answer(false); }
}

/* ───── 오답노트 ───── */
let wrongSubj = "";
function paneWrong() {
  const st = study();
  const list = wrongSubj ? st.wrongs.filter((w) => w.subject === wrongSubj) : st.wrongs;
  const reasons = {};
  for (const w of st.wrongs) reasons[w.why] = (reasons[w.why] || 0) + 1;
  const top = Object.entries(reasons).sort((a, b) => b[1] - a[1])[0];
  P().innerHTML = `
    <div class="card">
      <h3 class="card-title">❌ 오답노트 쓰기</h3>
      <form class="ev-form wrong-form" id="wr-form" autocomplete="off">
        <div class="tt-row"><select id="wr-subj">${subjects().map((x) => `<option ${x === wrongSubj ? "selected" : ""}>${esc(x)}</option>`).join("")}</select>
        <select id="wr-why">${WRONG_REASONS.map((x) => `<option>${x}</option>`).join("")}</select></div>
        <input id="wr-q" placeholder="틀린 문제 (짧게) 예) 수학 프린트 3번 - 이차함수 최댓값" maxlength="100" required>
        <textarea id="wr-fix" placeholder="정답 · 올바른 풀이 · 기억할 점" maxlength="300" rows="2"></textarea>
        <button class="btn yellow" type="submit">오답 기록</button>
      </form>
    </div>
    ${top ? `<div class="card wrong-stat"><h3 class="card-title">🔍 나의 실수 패턴</h3>
      <div class="why-row">${Object.entries(reasons).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<span class="why-chip ${k === top[0] ? "top" : ""}">${k} <b>${v}</b></span>`).join("")}</div>
      <p class="why-tip">💡 <b>${top[0]}</b>가 제일 많아요. ${WRONG_TIPS[top[0]]}</p></div>` : ""}
    <div class="card">
      <div class="seg small">${["", ...subjects()].map((x) => `<button data-ws="${esc(x)}" class="${x === wrongSubj ? "on" : ""}">${x ? esc(x) : "전체"}</button>`).join("")}</div>
      <ul class="wrong-list">${list.slice().sort((a, b) => (a.solved ? 1 : 0) - (b.solved ? 1 : 0) || b.created - a.created).map((w) => `<li class="${w.solved ? "solved" : ""}">
        <div class="wr-head"><span class="tag">${esc(w.subject)}</span><span class="tag why">${esc(w.why)}</span>${w.solved ? '<span class="tag ok">✔ 정복</span>' : ""}<small>다시 푼 횟수 ${w.reviews || 0}</small><button class="icon-btn" data-wrdel="${w.id}">✕</button></div>
        <b>${esc(w.q)}</b>
        <details><summary>풀이 보기</summary><p>${esc(w.fix || "(메모 없음)")}</p></details>
        ${w.solved ? "" : `<div class="wr-btns"><span>다시 풀어봤나요?</span><button class="btn small mint" data-wrok="${w.id}">⭕ 맞았어요</button><button class="btn small white" data-wrng="${w.id}">❌ 또 틀렸어요</button></div>`}
      </li>`).join("") || '<li class="empty">틀린 문제를 적어두고, 시험 전에 다시 풀어봐요!</li>'}</ul>
    </div>`;
  const bump = () => { if (isOn()) ev().daily.wrong++; };
  $("wr-form").onsubmit = (e) => {
    e.preventDefault();
    st.wrongs.push({ id: uid(), subject: $("wr-subj").value, why: $("wr-why").value, q: $("wr-q").value.trim(), fix: $("wr-fix").value.trim(), created: Date.now(), reviews: 0, solved: false });
    wrongSubj = $("wr-subj").value;
    bump(); TS.sfx("coin"); TS.toast("❌ 오답 기록! 시험 전에 꼭 다시 풀어봐요");
    TS.save(); render();
  };
  P().querySelectorAll("[data-ws]").forEach((b) => (b.onclick = () => { wrongSubj = b.dataset.ws; render(); }));
  P().querySelectorAll("[data-wrdel]").forEach((b) => (b.onclick = () => { st.wrongs = st.wrongs.filter((w) => w.id !== b.dataset.wrdel); TS.save(); render(); }));
  const review = (id, ok) => {
    const w = st.wrongs.find((x) => x.id === id);
    w.reviews = (w.reviews || 0) + 1;
    if (ok) { w.solved = true; TS.sfx("r2"); TS.toast("⭕ 오답 정복!"); } else TS.sfx("sad");
    bump(); TS.save(); render();
  };
  P().querySelectorAll("[data-wrok]").forEach((b) => (b.onclick = () => review(b.dataset.wrok, true)));
  P().querySelectorAll("[data-wrng]").forEach((b) => (b.onclick = () => review(b.dataset.wrng, false)));
}

/* ───── 모의고사 ───── */
function paneMock() {
  const st = study(), t = TS.timer.t;
  const busy = t.running || t.remain > 0;
  const bySubj = {};
  for (const m of st.mocks) (bySubj[m.subject] = bySubj[m.subject] || []).push(m);
  P().innerHTML = `
    <div class="card">
      <h3 class="card-title">⏱️ 실전 모의고사 모드</h3>
      <p class="hint" style="margin:0 0 12px">진짜 시험처럼 <b>일시정지 없이</b> 시간을 재요. 끝나면 점수를 기록하고, 집중 시간·보상·보스 데미지도 그대로 받아요.</p>
      <div class="tt-row">
        <label>과목 <select id="mk-subj">${subjects().map((x) => `<option>${esc(x)}</option>`).join("")}</select></label>
        <label>시간 <select id="mk-min">${[40, 45, 50, 60, 70, 80, 90, 100].map((n) => `<option value="${n}" ${n === 50 ? "selected" : ""}>${n}분</option>`).join("")}</select></label>
        <button class="btn red big" id="mk-go" ${busy ? "disabled" : ""}>📝 시험 시작!</button>
      </div>
      ${busy ? '<p class="hint">지금 타이머가 돌아가는 중이라 끝나고 시작할 수 있어요.</p>' : ""}
    </div>
    <div class="card">
      <h3 class="card-title">📈 모의고사 기록</h3>
      ${Object.keys(bySubj).length ? Object.entries(bySubj).map(([k, arr]) => `<div class="mock-subj"><b>${esc(k)}</b>
        <div class="mock-dots">${arr.slice(-10).map((m) => `<span title="${m.date} · ${m.min}분${m.memo ? " · " + esc(m.memo) : ""}" style="--h:${m.score == null ? 8 : Math.max(8, m.score)}%" class="${m.score == null ? "na" : ""}"><i></i><small>${m.score == null ? "-" : m.score}</small></span>`).join("")}</div></div>`).join("")
        : '<p class="hint">아직 모의고사 기록이 없어요.</p>'}
    </div>`;
  $("mk-go").onclick = () => {
    const t2 = TS.timer.t;
    if (t2.running || t2.remain) return;
    const min = +$("mk-min").value;
    t2.mode = "focus"; t2.subject = $("mk-subj").value; t2.tag = "mock"; t2.todoId = "";
    t2.dur = min * 60000; t2.remain = t2.dur;
    TS.save(); TS.timer.start(); TS.go("timer");
    TS.toast(`📝 ${t2.subject} 모의고사 시작! ${min}분, 일시정지 없음`);
  };
}
function mockDone(subject, min) {
  const st = study(), m = { id: uid(), subject, min, date: TS.today(), score: null, memo: "" };
  st.mocks.push(m);
  if (isOn()) { ev().daily.mock++; giveCharm(5); }
  TS.save();
  setTimeout(() => TS.modal(`<h2>📝 모의고사 끝!</h2>
    <p><b>${esc(subject)}</b> ${min}분 완주! 채점해서 점수를 남겨볼까요?</p>
    <div class="tt-row" style="justify-content:center"><label>점수 <input type="number" id="mk-score" min="0" max="100" placeholder="0~100" style="width:100px"></label></div>
    <input id="mk-memo" maxlength="60" placeholder="한 줄 메모 (예: 서술형 시간 부족)" style="width:100%;margin-top:8px">
    <div class="modal-actions"><button class="btn white" data-close>나중에</button><button class="btn yellow" id="mk-save">기록</button></div>`,
    (el, close) => {
      el.querySelector("#mk-save").onclick = () => {
        const v = el.querySelector("#mk-score").value;
        m.score = v === "" ? null : Math.max(0, Math.min(100, Math.round(+v)));
        m.memo = el.querySelector("#mk-memo").value.trim();
        TS.save(); close(); TS.sfx("coin");
        TS.toast(m.score != null ? `📈 ${subject} ${m.score}점 기록!` : "📈 기록 완료");
      };
    }), 0);
}

/* ───── 상점 ───── */
function paneShop() {
  const e = ev(), open = shopOpen();
  P().innerHTML = `${lockNote()}
    <div class="card"><h3 class="card-title">🛍️ 기간 한정 상점 <span class="ev-coin" style="margin-left:auto">${EV.coin.icon} <b>${e.charm.toLocaleString()}</b></span></h3>
    <p class="hint" style="margin:0 0 12px">${open ? `상점은 ${fmtDate(addDays(EV.end, EV.shopDays))}까지 열려요. 한정 꾸미기는 이벤트가 끝나도 계속 쓸 수 있어요!` : status() === "pre" ? "이벤트가 시작되면 열려요." : "상점이 닫혔어요."}</p>
    <div class="shop-grid">${EV.shop.map((it) => {
      const n = e.bought[it.id] || 0, sold = n >= it.limit;
      return `<div class="shop-item ${sold ? "sold" : ""}">
        <span class="si-icon">${it.icon === "💎" ? '<i class="ic-elif" style="width:34px;height:34px"></i>' : it.icon}</span>
        <b>${esc(it.name)}</b>${it.desc ? `<small>${esc(it.desc)}</small>` : ""}
        <span class="si-limit">${sold ? "품절" : `남은 수량 ${it.limit - n}`}</span>
        <button class="btn small ${sold ? "white" : "pink"}" data-buy-ev="${it.id}" ${!open || sold || e.charm < it.cost ? "disabled" : ""}>${EV.coin.icon} ${it.cost}</button>
      </div>`;
    }).join("")}</div></div>`;
  P().querySelectorAll("[data-buy-ev]").forEach((b) => (b.onclick = () => buy(EV.shop.find((x) => x.id === b.dataset.buyEv))));
}
function buy(it) {
  const e = ev();
  if (!shopOpen() || e.charm < it.cost || (e.bought[it.id] || 0) >= it.limit) return;
  const finish = (msg) => {
    e.charm -= it.cost; e.bought[it.id] = (e.bought[it.id] || 0) + 1;
    TS.sfx("r2"); TS.toast(msg); TS.save(); TS.refresh();
  };
  if (it.id === "elif") { TS.addElif(500); return finish("💎 엘리프 +500"); }
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
  el.innerHTML = `<div class="evb-text"><span class="ev-tag">${st === "pre" ? "곧 시작" : st === "on" ? "진행 중" : "종료"}</span>
      <b>💓 ${esc(EV.title)}</b>
      <small>${st === "pre" ? `${fmtDate(EV.start)} 시작 · 시작까지 ${countdown()}` : st === "on" ? `종료까지 ${countdown()} · 오늘 미션 ${EV.daily.filter(dailyClaimed).length}/${EV.daily.length} · 기말고사 D-${examDday()}` : inExam() ? "시험 기간! 준비한 만큼 다 보여줘요 💪" : shopOpen() ? "상점 교환 기간이에요" : "참여해 주셔서 고마워요!"}</small></div>
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
