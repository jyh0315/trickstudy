/* =========================================================
   교주님, 공부하세요! — 게임 로직
   저장: localStorage("trickcal-study")
   ========================================================= */
(() => {
"use strict";

const SAVE_KEY = "trickcal-study";
const $ = (id) => document.getElementById(id);
const SADO_MAP = Object.fromEntries(SADO.map((c) => [c.id, c]));
const EMOTE_SADO = SADO.filter((c) => c.emote);
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const esc = (s) => String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const pad = (n) => String(n).padStart(2, "0");

/* ───── 날짜 ───── */
const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => dateKey();
const weekKey = () => {
  const d = new Date(); d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // 월요일 시작
  return dateKey(d);
};
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return dateKey(d); };

/* ───── 상태 ───── */
const freshDaily = () => ({ login: 0, poke: 0, focusMin: 0, sessions: 0, todos: 0 });
function defaultState() {
  return {
    v: 1, started: false, name: "교주",
    level: 1, exp: 0, elif: CONFIG.startElif, candy: 0,
    owned: {}, partner: null, bg: "trickcal", unlockedBg: ["trickcal"],
    todos: [],
    dailyKey: "", weeklyKey: "", lastLogin: "",
    daily: freshDaily(), weekly: freshDaily(),
    claimed: { daily: [], weekly: [], ach: [] },
    stats: { totalMin: 0, sessions: 0, todosDone: 0, pokes: 0, pulls: 0, streak: 0, bestStreak: 0, lastStudy: "", days: {}, subjects: {} },
    pity: 0, history: [],
    settings: { focus: 25, brk: 5, goal: 120, sound: true, notify: false, auto: false, subjects: SUBJECTS_DEFAULT.slice() },
    timer: { mode: "focus", running: false, endAt: 0, remain: 0, dur: 0, subject: SUBJECTS_DEFAULT[0], todoId: "" },
  };
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultState();
    const s = JSON.parse(raw), d = defaultState();
    // 새 필드가 생겨도 깨지지 않게 얕게 병합
    for (const k of ["daily", "weekly", "claimed", "stats", "settings", "timer"]) s[k] = { ...d[k], ...(s[k] || {}) };
    return { ...d, ...s };
  } catch (e) {
    console.warn("save load failed", e);
    return defaultState();
  }
}
let state = load();
const save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* 저장 불가 환경 */ } };

/* ───── 텍스트 ───── */
function hasBatchim(word) {
  const ch = word.charCodeAt(word.length - 1);
  if (ch < 0xac00 || ch > 0xd7a3) return false;
  return (ch - 0xac00) % 28 !== 0;
}
const shortName = (c) => c.name.split("(")[0].trim();
function fmt(text, c) {
  const n = shortName(c), b = hasBatchim(n);
  const J = { "는": b ? "은" : "는", "은": b ? "은" : "는", "가": b ? "이" : "가", "이": b ? "이" : "가", "를": b ? "을" : "를", "을": b ? "을" : "를", "와": b ? "과" : "와", "과": b ? "과" : "와" };
  return text.replace(/\{name\}(는|은|가|이|를|을|와|과)?/g, (_, j) => n + (j ? J[j] : ""))
    .replace(/\{me\}/g, state.name);
}
const linesOf = (c, kind) => (SPECIAL_LINES[c.id] && SPECIAL_LINES[c.id][kind]) || PERS[c.pers][kind];
const titleOf = (c) => (SPECIAL_LINES[c.id] && SPECIAL_LINES[c.id].title) || `${PERS[c.pers].label} 성격의 사도`;
const stars = (r) => "★".repeat(r);

/* ───── 이미지 ───── */
const chibiSrc = (c) => `assets/chibi/${c.id}.webp`;
const emoteCount = (c) => (c.emote && state.owned[c.id] ? state.owned[c.id].emo || 1 : 0);
function portrait(c, randomEmote = false) {
  const n = emoteCount(c);
  if (!n) return chibiSrc(c);
  return `assets/emotes/${c.id}/${randomEmote ? 1 + Math.floor(Math.random() * n) : 1}.gif`;
}

/* ───── 효과음 (WebAudio, 파일 없이) ───── */
let actx;
function sfx(kind) {
  if (!state.settings.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const seq = {
      click: [[660, 0.05]],
      poke:  [[880, 0.05], [1320, 0.07]],
      coin:  [[988, 0.07], [1319, 0.12]],
      done:  [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.25]],
      level: [[523, 0.08], [659, 0.08], [784, 0.08], [1047, 0.08], [1319, 0.3]],
      flip:  [[740, 0.06]],
      r2:    [[784, 0.08], [1175, 0.15]],
      r3:    [[784, 0.08], [988, 0.08], [1175, 0.08], [1568, 0.35]],
      sad:   [[392, 0.15], [330, 0.25]],
      bell:  [[1047, 0.2], [784, 0.2], [1047, 0.2], [784, 0.4]],
    }[kind] || [[600, 0.05]];
    let t = actx.currentTime;
    for (const [f, d] of seq) {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = "triangle"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(actx.destination);
      o.start(t); o.stop(t + d + 0.02);
      t += d * 0.85;
    }
  } catch (e) { /* 오디오 불가 */ }
}

/* ───── 토스트 / 꽃가루 ───── */
function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast"; el.textContent = msg;
  $("toasts").appendChild(el);
  setTimeout(() => el.remove(), 2700);
}
function confetti(n = 60) {
  const box = document.createElement("div"); box.className = "confetti";
  const colors = ["#ffd34e", "#ff8fb1", "#7fd6c2", "#8fd3ff", "#b77cff", "#ff7b6e"];
  for (let i = 0; i < n; i++) {
    const p = document.createElement("i");
    p.style.left = Math.random() * 100 + "vw";
    p.style.background = rand(colors);
    p.style.animationDuration = 1.6 + Math.random() * 1.8 + "s";
    p.style.animationDelay = Math.random() * 0.4 + "s";
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    box.appendChild(p);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 4000);
}

/* ───── 모달 (순서대로 하나씩) ───── */
const modalQueue = [];
let modalOpen = false;
function modal(html, bind, opts = {}) {
  modalQueue.push({ html, bind, opts });
  if (!modalOpen) nextModal();
}
function nextModal() {
  const m = modalQueue.shift();
  if (!m) { modalOpen = false; return; }
  modalOpen = true;
  const back = document.createElement("div");
  back.className = "modal-back";
  back.innerHTML = `<div class="modal ${m.opts.cls || ""}">${m.opts.noClose ? "" : '<button class="x" data-close>✕</button>'}${m.html}</div>`;
  const close = () => { back.remove(); nextModal(); };
  back.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]") || (e.target === back && !m.opts.noClose)) close();
  });
  $("modal-root").appendChild(back);
  if (m.bind) m.bind(back, close);
}
function confirmModal(title, text, yes, onYes, danger = false) {
  modal(`<h2>${title}</h2><p>${text}</p><div class="modal-actions"><button class="btn white" data-close>취소</button><button class="btn ${danger ? "red" : "yellow"}" id="m-yes">${yes}</button></div>`,
    (el, close) => { el.querySelector("#m-yes").onclick = () => { close(); onYes(); }; });
}

/* ───── 재화 · 경험치 ───── */
function bump(id) { const el = $(id).parentElement; el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
function addElif(n) { if (!n) return; state.elif = Math.max(0, state.elif + n); bump("elif"); }
function addCandy(n) { if (!n) return; state.candy += n; bump("candy"); }
function addExp(n) {
  state.exp += n;
  while (state.exp >= expToNext(state.level)) {
    state.exp -= expToNext(state.level);
    state.level++;
    state.elif += CONFIG.levelUpElif;
    const next = BACKGROUNDS.find((b) => !state.unlockedBg.includes(b.id));
    if (next) state.unlockedBg.push(next.id);
    levelUpModal(state.level, next);
  }
}
function levelUpModal(lv, bg) {
  sfx("level"); confetti(90);
  const c = SADO_MAP[state.partner];
  modal(`<h2>LEVEL UP!</h2>
    <p style="font-family:var(--font-title);font-size:22px;margin:0">교주 레벨 <b>${lv}</b> 달성!</p>
    ${c ? `<p>${esc(c.name)}: “${esc(fmt(rand(linesOf(c, "done")), c))}”</p>` : ""}
    <div class="reward-row"><span class="reward-chip"><i class="ic-elif"></i>+${CONFIG.levelUpElif}</span></div>
    ${bg ? `<p style="margin:6px 0 0">🖼️ 새 배경 일러스트 해금: <b>${esc(bg.name)}</b></p><img class="unlock-bg" src="assets/bg/${bg.id}.jpg" alt="">` : ""}
    <div class="modal-actions">${bg ? '<button class="btn white" id="m-setbg">배경으로 설정</button>' : ""}<button class="btn yellow" data-close>좋아!</button></div>`,
    (el, close) => {
      const b = el.querySelector("#m-setbg");
      if (b) b.onclick = () => { state.bg = bg.id; save(); applyBg(); close(); };
    }, { cls: "levelup" });
}

/* ───── 일일 / 주간 초기화 ───── */
function rollover() {
  let changed = false;
  const t = today(), w = weekKey();
  if (state.dailyKey !== t) {
    state.dailyKey = t;
    state.daily = freshDaily();
    state.claimed.daily = [];
    // 반복 의뢰는 다시 진행 중으로, 지난 날 끝낸 일회성 의뢰는 정리
    state.todos = state.todos.filter((x) => x.daily || !x.done || x.done === t);
    for (const x of state.todos) if (x.daily && x.done && x.done !== t) x.done = null;
    changed = true;
  }
  if (state.weeklyKey !== w) {
    state.weeklyKey = w;
    state.weekly = freshDaily();
    state.claimed.weekly = [];
    changed = true;
  }
  if (state.started && state.lastLogin !== t) {
    state.lastLogin = t;
    state.daily.login = 1;
    state.weekly.login++;
    changed = true;
  }
  if (changed) save();
  return changed;
}

/* ───── 연속 공부 ───── */
function markStudied() {
  const t = today(), s = state.stats;
  if (s.lastStudy === t) return;
  s.streak = s.lastStudy === daysAgo(1) ? s.streak + 1 : 1;
  s.bestStreak = Math.max(s.bestStreak, s.streak);
  s.lastStudy = t;
}
const currentStreak = () => (state.stats.lastStudy === today() || state.stats.lastStudy === daysAgo(1) ? state.stats.streak : 0);

/* ───── 대표 사도 / 말풍선 ───── */
let sayTimer = 0;
function renderPartner(randomEmote = false) {
  const c = SADO_MAP[state.partner];
  if (!c) return;
  const img = $("partner-img");
  img.src = portrait(c, randomEmote);
  img.alt = c.name;
  $("partner").classList.toggle("chibi", !c.emote);
  $("np-name").textContent = c.name;
  $("np-stars").textContent = stars(c.rarity);
  const p = $("np-pers");
  p.textContent = PERS[c.pers].label;
  p.style.background = PERS[c.pers].grad;
}
function say(text, changeFace = true) {
  const b = $("bubble");
  $("bubble-text").textContent = text;
  b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop");
  if (changeFace) renderPartner(true);
}
function sayKind(kind) {
  const c = SADO_MAP[state.partner];
  if (c) say(fmt(rand(linesOf(c, kind)), c));
}
function chatter() {
  if (!state.started) return;
  const t = state.timer;
  if (t.running && t.mode === "focus") return sayKind("cheer");
  if (t.running && t.mode === "break") return say(rand(["푹 쉬어요~ 스트레칭도 하고!", "물 한 잔 마셔요!", "휴식도 공부의 일부예요."]));
  if (Math.random() < 0.45) return say(recommend().say);
  sayKind("idle");
}
function poke() {
  if (!state.started) return;
  const p = $("partner");
  p.classList.remove("squish"); void p.offsetWidth; p.classList.add("squish");
  const fx = $("poke-fx");
  fx.textContent = rand(["콕!", "말랑", "뿅!", "쿡!", "볼따구!"]);
  fx.classList.remove("show"); void fx.offsetWidth; fx.classList.add("show");
  sfx("poke");
  sayKind("poke");
  state.stats.pokes++; state.daily.poke++;
  save(); refresh();
}

/* ───── 추천 (할 일 알려주기) ───── */
function pendingTodos() { return state.todos.filter((x) => !x.done); }
function readyQuests() {
  return [
    ...DAILY_QUESTS.filter((q) => questReady(q, "daily")),
    ...WEEKLY_QUESTS.filter((q) => questReady(q, "weekly")),
    ...ACHIEVEMENTS.filter((q) => questReady(q, "ach")),
  ];
}
function recommend() {
  const t = state.timer, todayMin = state.stats.days[today()] || 0, goal = state.settings.goal;
  const pend = pendingTodos(), ready = readyQuests();
  const hard = pend.find((x) => x.diff === "hard");
  if (t.running) {
    const left = Math.max(0, Math.ceil((t.endAt - Date.now()) / 60000));
    return t.mode === "focus"
      ? { say: `지금은 집중 시간! ${left}분만 더 버텨봐요!`, actions: [["timer", "타이머 보기", "yellow"]] }
      : { say: `휴식 중이에요. ${left}분 뒤에 다시 달려요!`, actions: [["timer", "타이머 보기", "mint"]] };
  }
  if (ready.length) return { say: `받을 수 있는 임무 보상이 ${ready.length}개 있어요! 얼른 받아요!`, actions: [["quest", "보상 받으러 가기", "pink"]] };
  if (!pend.length && todayMin === 0) return { say: `${state.name}님, 오늘 할 공부를 의뢰 게시판에 적어볼까요?`, actions: [["todo", "의뢰 적으러 가기", "yellow"], ["timer", "그냥 바로 집중!", "white"]] };
  if (pend.length) {
    const pick = hard || pend[0];
    return { say: `“${pick.text}” 아직 안 했죠? 지금 해치워요!`, actions: [["focus:" + pick.id, "이 의뢰로 집중 시작", "yellow"], ["todo", "의뢰 목록", "white"]] };
  }
  if (todayMin < goal) return { say: `오늘 목표까지 ${goal - todayMin}분 남았어요. 조금만 더!`, actions: [["timer", "집중 시작", "yellow"]] };
  if (state.elif >= CONFIG.pullCost) return { say: `오늘 목표 달성! 모은 엘리프로 사도를 모집해 볼까요?`, actions: [["gacha", "모집하러 가기", "pink"]] };
  return { say: `오늘 할 일 끝! 정말 수고했어요, ${state.name}님!`, actions: [] };
}

/* ───── 화면 전환 ───── */
let view = "lobby";
function go(v) {
  if (v.startsWith("focus:")) {
    const id = v.slice(6);
    if (!state.timer.running && !state.timer.remain) { state.timer.todoId = id; state.timer.mode = "focus"; save(); }
    v = "timer";
  }
  view = v;
  document.querySelectorAll("#tabs button").forEach((b) => b.classList.toggle("on", b.dataset.view === v));
  document.querySelectorAll(".view").forEach((s) => s.classList.toggle("on", s.id === "view-" + v));
  sfx("click");
  refresh();
  if (window.innerWidth <= 900) window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ───── 공통 갱신 ───── */
function refresh() {
  rollover();
  renderTop();
  renderMini();
  const r = { lobby: renderLobby, timer: renderTimer, todo: renderTodos, quest: renderQuests, gacha: renderGacha, sado: renderSado, stats: renderStats }[view];
  if (r) r();
  $("dot-quest").classList.toggle("hidden", !readyQuests().length);
}
function renderTop() {
  $("lv").textContent = state.level;
  $("pname").textContent = state.name;
  const need = expToNext(state.level);
  $("expfill").style.width = Math.min(100, (state.exp / need) * 100) + "%";
  $("exptext").textContent = `${state.exp} / ${need}`;
  $("elif").textContent = state.elif.toLocaleString();
  $("candy").textContent = state.candy.toLocaleString();
}
function renderMini() {
  const min = state.stats.days[today()] || 0, goal = state.settings.goal;
  $("today-min").textContent = min;
  $("today-goal").textContent = goal;
  $("today-ring").style.strokeDashoffset = 113.1 * (1 - Math.min(1, min / goal));
  $("streak").textContent = currentStreak();
}
function applyBg() {
  $("bg").style.backgroundImage = `url("assets/bg/${state.bg}.jpg")`;
}

/* ───── 로비 ───── */
function renderLobby() {
  const r = recommend();
  $("brief-say").textContent = r.say;
  $("brief-actions").innerHTML = r.actions.map(([to, label, color]) => `<button class="btn ${color}" data-go="${to}">${esc(label)}</button>`).join("");
  const min = state.stats.days[today()] || 0, goal = state.settings.goal;
  $("brief-focus").textContent = `${min} / ${goal}분`;
  $("brief-focus-bar").style.width = Math.min(100, (min / goal) * 100) + "%";
  $("brief-todo").textContent = pendingTodos().length + "개";
  $("brief-reward").textContent = readyQuests().length + "개";
  $("brief-pulls").textContent = Math.floor(state.elif / CONFIG.pullCost) + "회";
  $("lobby-quests").innerHTML = DAILY_QUESTS.map((q) => questHTML(q, "daily")).join("");
}

/* ───── 임무 ───── */
let questTab = "daily";
const questProg = (q, kind) => kind === "ach" ? q.check(state) : (kind === "daily" ? state.daily : state.weekly)[q.stat] || 0;
const questClaimed = (q, kind) => state.claimed[kind].includes(q.id);
const questReady = (q, kind) => !questClaimed(q, kind) && questProg(q, kind) >= q.goal;
function questHTML(q, kind) {
  const p = Math.min(q.goal, questProg(q, kind)), done = questClaimed(q, kind), ready = questReady(q, kind);
  return `<div class="quest ${done ? "claimed" : ""} ${ready ? "ready" : ""}">
    <div><div class="quest-title">${esc(q.title)}</div>
      <div class="quest-rw"><span><i class="ic-elif"></i> ${q.elif}</span>${q.exp ? `<span>⭐ ${q.exp} EXP</span>` : ""}</div></div>
    <span class="bar"><i style="width:${(p / q.goal) * 100}%"></i></span>
    <span class="quest-prog">${p} / ${q.goal}</span>
    <button class="btn small ${ready ? "yellow" : "white"}" data-claim="${kind}:${q.id}" ${ready ? "" : "disabled"}>${done ? "완료" : ready ? "받기!" : "진행 중"}</button>
  </div>`;
}
function claimQuest(kind, id, quiet = false) {
  const list = { daily: DAILY_QUESTS, weekly: WEEKLY_QUESTS, ach: ACHIEVEMENTS }[kind];
  const q = list.find((x) => x.id === id);
  if (!q || !questReady(q, kind)) return 0;
  state.claimed[kind].push(id);
  addElif(q.elif);
  if (q.exp) addExp(q.exp);
  if (!quiet) { sfx("coin"); toast(`🎁 ${q.title} — 엘리프 +${q.elif}`); }
  return q.elif;
}
function renderQuests() {
  const list = { daily: DAILY_QUESTS, weekly: WEEKLY_QUESTS, ach: ACHIEVEMENTS }[questTab];
  document.querySelectorAll("#quest-seg button").forEach((b) => b.classList.toggle("on", b.dataset.q === questTab));
  // 받을 수 있는 것 → 진행 중 → 완료 순
  const order = (q) => (questReady(q, questTab) ? 0 : questClaimed(q, questTab) ? 2 : 1);
  $("quest-list").innerHTML = list.slice().sort((a, b) => order(a) - order(b)).map((q) => questHTML(q, questTab)).join("");
  const now = new Date(), mid = new Date(now); mid.setHours(24, 0, 0, 0);
  const h = Math.floor((mid - now) / 3600000), m = Math.floor(((mid - now) % 3600000) / 60000);
  $("quest-reset").textContent = questTab === "daily" ? `⏳ 일일 임무 초기화까지 ${h}시간 ${m}분`
    : questTab === "weekly" ? "⏳ 주간 임무는 매주 월요일에 초기화돼요" : "🏆 업적은 한 번만 받을 수 있어요";
  $("claim-all").classList.toggle("hidden", !list.some((q) => questReady(q, questTab)));
}

/* ───── 의뢰 ───── */
let newDiff = "normal";
function todoHTML(x) {
  const d = DIFFICULTY[x.diff];
  return `<li class="todo" data-id="${x.id}">
    <button class="todo-check" data-done="${x.id}" title="해결!" ${x.done ? "disabled" : ""}>${x.done ? "✔" : ""}</button>
    <span class="todo-text">${esc(x.text)}</span>
    ${x.daily ? '<span class="tag" style="background:#d9f0ff">매일</span>' : ""}
    <span class="tag" style="background:${d.color}">${d.label} +${d.elif}</span>
    <span class="todo-actions">
      ${x.done ? "" : `<button class="icon-btn" data-focus="${x.id}" title="이 의뢰로 집중">⏰</button>`}
      <button class="icon-btn" data-del="${x.id}" title="삭제">🗑️</button>
    </span></li>`;
}
function renderTodos() {
  const pend = pendingTodos(), done = state.todos.filter((x) => x.done);
  const order = { hard: 0, normal: 1, easy: 2 };
  $("todo-list").innerHTML = pend.sort((a, b) => order[a.diff] - order[b.diff]).map(todoHTML).join("");
  $("todo-list").dataset.empty = "진행 중인 의뢰가 없어요. 오늘 할 공부를 적어보세요!";
  $("todo-done").innerHTML = done.map(todoHTML).join("");
  $("todo-done").dataset.empty = "아직 해결한 의뢰가 없어요.";
  $("todo-count").textContent = pend.length;
  document.querySelectorAll("#todo-diff button").forEach((b) => b.classList.toggle("on", b.dataset.d === newDiff));
}
function completeTodo(id) {
  const x = state.todos.find((t) => t.id === id);
  if (!x || x.done) return;
  x.done = today();
  const d = DIFFICULTY[x.diff];
  state.stats.todosDone++; state.daily.todos++; state.weekly.todos++;
  if (state.timer.todoId === id && !state.timer.running) state.timer.todoId = "";
  addElif(d.elif); addExp(d.exp);
  sfx("coin");
  toast(`📜 의뢰 해결! 엘리프 +${d.elif} · EXP +${d.exp}`);
  sayKind("done");
  save(); refresh();
}

/* ───── 타이머 ───── */
const T = () => state.timer;
const modeMin = (mode) => (mode === "focus" ? state.settings.focus : state.settings.brk);
function timerLeft() {
  const t = T();
  if (t.running) return Math.max(0, t.endAt - Date.now());
  if (t.remain) return t.remain;
  return modeMin(t.mode) * 60000;
}
function timerDur() { const t = T(); return t.dur || modeMin(t.mode) * 60000; }
const mmss = (ms) => { const s = Math.ceil(ms / 1000); return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`; };

function renderTimer() {
  const t = T(), s = state.settings;
  document.querySelectorAll("#mode-seg button").forEach((b) => b.classList.toggle("on", b.dataset.mode === t.mode));
  const busy = t.running || t.remain > 0;
  $("view-timer").querySelector(".timer-card").classList.toggle("locked", busy);
  $("t-start").textContent = t.running ? "진행 중…" : t.remain ? "계속하기!" : t.mode === "focus" ? "집중 시작!" : "휴식 시작";
  $("t-start").classList.toggle("hidden", t.running);
  $("t-pause").classList.toggle("hidden", !t.running);
  $("t-stop").classList.toggle("hidden", !busy);
  $("t-focus").value = s.focus; $("t-break").value = s.brk; $("t-auto").checked = s.auto;
  const subj = $("t-subject");
  subj.innerHTML = s.subjects.map((x) => `<option ${x === t.subject ? "selected" : ""}>${esc(x)}</option>`).join("");
  const td = $("t-todo");
  td.innerHTML = '<option value="">(없음)</option>' + pendingTodos().map((x) => `<option value="${x.id}" ${x.id === t.todoId ? "selected" : ""}>${esc(x.text)}</option>`).join("");
  updateClock();
}
function updateClock() {
  const t = T(), left = timerLeft(), dur = timerDur();
  const txt = mmss(left);
  const clock = $("clock");
  if (clock) {
    $("clock-time").textContent = txt;
    $("clock-label").textContent = t.mode === "focus" ? (t.running ? "집중 중" : "집중") : (t.running ? "휴식 중" : "휴식");
    clock.classList.toggle("brk", t.mode === "break");
    clock.classList.toggle("running", t.running);
    $("clk-fg").style.strokeDashoffset = 552.9 * (1 - left / dur);
    const mins = Math.round(dur / 60000);
    $("clock-sub").innerHTML = t.mode === "focus"
      ? `완주 보상 <i class="ic-elif"></i> +${mins * CONFIG.elifPerMin} · EXP +${mins * CONFIG.expPerMin}`
      : "휴식 중엔 보상이 없어요. 푹 쉬어요!";
  }
  const busy = t.running || t.remain > 0;
  $("mini-timer").classList.toggle("hidden", !busy);
  $("mini-timer").classList.toggle("brk", t.mode === "break");
  $("mini-mode").textContent = (t.mode === "focus" ? "집중" : "휴식") + (t.running ? " 중" : " 일시정지");
  $("mini-time").textContent = txt;
  document.title = t.running ? `${t.mode === "focus" ? "📚" : "☕"} ${txt} · 교주님, 공부하세요!` : "교주님, 공부하세요!";
}
function startTimer() {
  const t = T();
  if (t.running) return;
  if (!t.remain) { t.dur = modeMin(t.mode) * 60000; t.remain = t.dur; }
  t.endAt = Date.now() + t.remain;
  t.running = true;
  timerEvent(true);
  sfx("click");
  if (t.mode === "focus") sayKind("cheer");
  if (state.settings.notify && "Notification" in window && Notification.permission === "default") Notification.requestPermission();
  save(); refresh();
}
function pauseTimer() {
  const t = T();
  if (!t.running) return;
  t.remain = Math.max(1000, t.endAt - Date.now());
  t.running = false;
  timerEvent(false);
  save(); refresh();
}
// 배경음악(bgm.js)이 듣는 이벤트
const timerEvent = (running) => document.dispatchEvent(new CustomEvent("study-timer", { detail: { running, mode: T().mode } }));
function resetTimer(mode) {
  const t = T();
  t.running = false; t.remain = 0; t.dur = 0; t.endAt = 0;
  if (mode) t.mode = mode;
}
function stopTimer() {
  const t = T();
  const elapsedMin = Math.floor((timerDur() - timerLeft()) / 60000);
  if (t.mode === "break") { resetTimer("focus"); timerEvent(false); save(); refresh(); return; }
  const partial = elapsedMin >= CONFIG.minRewardMin;
  confirmModal("정말 그만할까요?",
    partial ? `지금까지 집중한 <b>${elapsedMin}분</b>만큼은 보상을 받아요.<br>(완주 보상과 세션 횟수는 제외)` : `${CONFIG.minRewardMin}분 미만이라 보상이 없어요… 그래도 그만할까요?`,
    "그만하기", () => {
      resetTimer("focus");
      timerEvent(false);
      if (partial) grantFocus(elapsedMin, false);
      else { sfx("sad"); sayKind("fail"); }
      save(); refresh();
    }, true);
}
function grantFocus(min, full) {
  const t = T(), s = state.stats, d = today();
  const elif = min * CONFIG.elifPerMin, exp = min * CONFIG.expPerMin;
  s.totalMin += min;
  s.days[d] = (s.days[d] || 0) + min;
  s.subjects[t.subject] = (s.subjects[t.subject] || 0) + min;
  state.daily.focusMin += min; state.weekly.focusMin += min;
  if (full) { s.sessions++; state.daily.sessions++; state.weekly.sessions++; }
  markStudied();
  addElif(elif);
  const c = SADO_MAP[state.partner];
  const linked = full && t.todoId ? state.todos.find((x) => x.id === t.todoId && !x.done) : null;
  const line = c ? fmt(rand(linesOf(c, full ? "done" : "fail")), c) : "";
  sfx(full ? "done" : "coin");
  if (full) confetti(50);
  modal(`<h2>${full ? "집중 완료!" : "중간 정산"}</h2>
    ${c ? `<img class="modal-emote" src="${portrait(c, true)}" alt="">` : ""}
    <p>${c ? `<b>${esc(c.name)}</b>: “${esc(line)}”` : ""}</p>
    <div class="reward-row">
      <span class="reward-chip">📚 ${min}분</span>
      <span class="reward-chip"><i class="ic-elif"></i>+${elif}</span>
      <span class="reward-chip">⭐ EXP +${exp}</span>
    </div>
    ${linked ? `<p>연결된 의뢰 “<b>${esc(linked.text)}</b>”도 끝냈나요?</p>` : ""}
    <div class="modal-actions">
      ${linked ? '<button class="btn pink" id="m-todo">의뢰도 해결!</button>' : ""}
      ${full ? '<button class="btn mint" id="m-break">☕ 휴식 시작</button>' : ""}
      <button class="btn yellow" data-close>확인</button>
    </div>`, (el, close) => {
      const a = el.querySelector("#m-todo");
      if (a) a.onclick = () => { a.disabled = true; a.textContent = "해결 완료 ✔"; completeTodo(linked.id); };
      const b = el.querySelector("#m-break");
      if (b) b.onclick = () => { close(); resetTimer("break"); startTimer(); };
    });
  addExp(exp); // 레벨업 모달은 보상 모달 뒤에 나오도록
}
function timerComplete() {
  const t = T();
  const mode = t.mode, min = Math.round(t.dur / 60000);
  resetTimer(mode === "focus" ? "break" : "focus");
  sfx("bell");
  notify(mode === "focus" ? "집중 완료! 🎉" : "휴식 끝! 다시 달려볼까요?", mode === "focus" ? `${min}분 집중 성공. 보상을 받아가세요!` : "다음 집중을 시작해요.");
  if (mode === "focus") {
    grantFocus(min, true);
    if (state.settings.auto) startTimer();
  } else {
    say("휴식 끝! 다시 집중해 볼까요?");
    toast("☕ 휴식 끝!");
    if (state.settings.auto) startTimer();
  }
  save(); refresh();
}
function notify(title, body) {
  if (!state.settings.notify || !("Notification" in window) || Notification.permission !== "granted" || !document.hidden) return;
  try { new Notification(title, { body, icon: SADO_MAP[state.partner] ? chibiSrc(SADO_MAP[state.partner]) : undefined }); } catch (e) { /* 무시 */ }
}

/* ───── 모집 ───── */
function rollRarity() {
  state.pity++;
  let r;
  if (state.pity >= CONFIG.pity) r = 3;
  else {
    const x = Math.random();
    r = x < RARITY[3].rate ? 3 : x < RARITY[3].rate + RARITY[2].rate ? 2 : 1;
  }
  if (r === 3) state.pity = 0;
  return r;
}
function acquire(c) {
  const o = state.owned[c.id];
  if (!o) { state.owned[c.id] = { n: 1, emo: c.emote ? 1 : 0 }; return { isNew: true, extra: "" }; }
  o.n++;
  if (c.emote && (o.emo || 1) < 4) { o.emo = (o.emo || 1) + 1; return { isNew: false, extra: `표정 ${o.emo} 해금!` }; }
  const k = CONFIG.dupeShards[c.rarity];
  addCandy(k);
  return { isNew: false, extra: `별사탕 +${k}` };
}
function pull(n) {
  const cost = n === 10 ? CONFIG.pull10Cost : CONFIG.pullCost;
  if (state.elif < cost) { toast(`엘리프가 ${cost - state.elif}개 부족해요! 공부하러 가요!`); sfx("sad"); return; }
  state.elif -= cost;
  const rs = [];
  for (let i = 0; i < n; i++) rs.push(rollRarity());
  if (n === 10 && !rs.some((r) => r >= 2)) rs[9] = 2; // 10회 모집은 ★2 이상 1명 확정
  const results = rs.map((r) => {
    const c = rand(SADO.filter((x) => x.rarity === r));
    return { c, ...acquire(c) };
  });
  state.stats.pulls += n;
  state.history = [...results.map((x) => x.c.id).reverse(), ...state.history].slice(0, 40);
  save();
  gachaShow(results);
}
function gachaShow(results) {
  const best = Math.max(...results.map((x) => x.c.rarity));
  const st = document.createElement("div");
  st.className = "gacha-stage" + (best === 3 ? " r3" : "");
  st.innerHTML = `<div class="letter c${best}"><span class="seal">교</span></div><div class="gacha-tip">편지를 눌러 열어보세요!</div>`;
  document.body.appendChild(st);
  sfx("click");
  const letter = st.querySelector(".letter");
  letter.onclick = () => {
    letter.classList.add("open");
    sfx(best === 3 ? "r3" : best === 2 ? "r2" : "flip");
    setTimeout(() => {
      st.innerHTML = `<div class="gacha-results ${results.length === 1 ? "one" : ""}">${results.map((x, i) => `
        <div class="g-card c${x.c.rarity}" data-i="${i}">
          ${x.isNew ? '<span class="new">NEW!</span>' : ""}${x.extra ? `<span class="extra">${esc(x.extra)}</span>` : ""}
          <div class="in"><div class="back">?</div>
          <div class="face"><span class="st">${stars(x.c.rarity)}</span><img src="${x.c.emote ? `assets/emotes/${x.c.id}/1.gif` : chibiSrc(x.c)}" alt=""><span class="nm">${esc(x.c.name)}</span></div></div>
        </div>`).join("")}</div>
        <div class="gacha-tip">카드를 눌러 뒤집어요!</div>
        <div class="gacha-actions"><button class="btn white" id="g-all">모두 열기</button><button class="btn yellow hidden" id="g-ok">확인</button></div>`;
      const cards = [...st.querySelectorAll(".g-card")];
      const check = () => {
        if (cards.every((c) => c.classList.contains("flip"))) {
          st.querySelector("#g-ok").classList.remove("hidden");
          st.querySelector("#g-all").classList.add("hidden");
          st.querySelector(".gacha-tip").textContent = best === 3 ? "✨ 전설 사도 등장! ✨" : "모집 완료!";
        }
      };
      const flip = (el) => {
        if (el.classList.contains("flip")) return;
        el.classList.add("flip");
        const r = results[+el.dataset.i].c.rarity;
        sfx(r === 3 ? "r3" : r === 2 ? "r2" : "flip");
        if (r === 3) confetti(40);
        check();
      };
      cards.forEach((el) => (el.onclick = () => flip(el)));
      st.querySelector("#g-all").onclick = () => cards.forEach((el, i) => setTimeout(() => flip(el), i * 110));
      st.querySelector("#g-ok").onclick = () => {
        st.remove();
        const top = results.find((x) => x.isNew && x.c.rarity === 3) || results.find((x) => x.isNew);
        if (top) say(`${top.c.name}: “${fmt(rand(linesOf(top.c, "idle")), top.c)}”`, false);
        refresh();
      };
    }, 450);
  };
}
function renderGacha() {
  const owned = Object.keys(state.owned).length;
  $("g-total").textContent = SADO.length;
  $("g-owned").textContent = owned;
  $("pity-bar").style.width = (state.pity / CONFIG.pity) * 100 + "%";
  $("pity-left").textContent = `${CONFIG.pity - state.pity}회`;
  $("cost1").textContent = CONFIG.pullCost;
  $("cost10").textContent = CONFIG.pull10Cost;
  $("pull1").disabled = state.elif < CONFIG.pullCost;
  $("pull10").disabled = state.elif < CONFIG.pull10Cost;
  $("rates").innerHTML = `확률 — ★★★ ${RARITY[3].rate * 100}% · ★★ ${RARITY[2].rate * 100}% · ★ ${RARITY[1].rate * 100}%<br>
    ${CONFIG.pity}회 안에 ★★★ 확정 · 10회 모집 시 ★★ 이상 1명 확정<br>
    중복 사도는 별사탕으로 바뀌고(움직이는 표정 사도는 표정 먼저 해금), 별사탕은 도감에서 원하는 사도와 교환할 수 있어요.`;
  $("history").innerHTML = state.history.map((id) => {
    const c = SADO_MAP[id];
    return c ? `<img class="r${c.rarity}" src="${chibiSrc(c)}" title="${esc(c.name)}" alt="">` : "";
  }).join("");
}

/* ───── 도감 ───── */
let sadoTab = "list";
function renderSado() {
  document.querySelectorAll("#sado-seg button").forEach((b) => b.classList.toggle("on", b.dataset.s === sadoTab));
  $("sado-list-wrap").classList.toggle("hidden", sadoTab !== "list");
  $("bg-wrap").classList.toggle("hidden", sadoTab !== "bg");
  if (sadoTab === "bg") return renderBg();
  const own = $("f-own").value, pers = $("f-pers").value, rare = $("f-rare").value, q = $("f-q").value.trim().toLowerCase();
  const list = SADO.filter((c) =>
    (own === "all" || (own === "own") === !!state.owned[c.id]) &&
    (!pers || c.pers === pers) && (!rare || c.rarity === +rare) &&
    (!q || c.name.toLowerCase().includes(q) || c.en.toLowerCase().includes(q)));
  $("sado-count").textContent = `${Object.keys(state.owned).length} / ${SADO.length}`;
  $("sado-grid").innerHTML = list.map((c) => {
    const o = state.owned[c.id];
    return `<button class="sado-card ${o ? "" : "locked"} r${c.rarity}" data-sado="${c.id}" title="${esc(c.name)}">
      <span class="st">${stars(c.rarity)}</span>
      ${o && o.n > 1 ? `<span class="cnt">×${o.n}</span>` : ""}
      ${state.partner === c.id ? '<span class="partner-mark">💛</span>' : ""}
      ${c.emote ? `<span class="emo-mark">표정 ${o ? o.emo : 0}/4</span>` : ""}
      <img src="${chibiSrc(c)}" alt="" loading="lazy">
      <span class="nm">${esc(c.name)}</span></button>`;
  }).join("");
}
function sadoDetail(id) {
  const c = SADO_MAP[id], o = state.owned[id];
  const cost = CONFIG.exchangeCost[c.rarity];
  const emotes = c.emote ? `<div class="emote-row">${[1, 2, 3, 4].map((i) =>
    o && i <= o.emo ? `<div><img src="assets/emotes/${c.id}/${i}.gif" alt=""></div>` : "<div>?</div>").join("")}</div>
    <p class="hint">중복으로 영입할 때마다 표정이 하나씩 해금돼요.</p>` : "";
  modal(`<img class="detail-img" src="${o ? portrait(c) : chibiSrc(c)}" style="${o ? "" : "filter:grayscale(1) opacity(.6)"}" alt="">
    <h2 style="margin-top:12px">${esc(c.name)}</h2>
    <div class="detail-meta">
      <span class="tag" style="background:${PERS[c.pers].grad};color:#fff">${PERS[c.pers].label}</span>
      <span class="tag" style="background:var(--paper);color:${RARITY[c.rarity].color}">${stars(c.rarity)} ${RARITY[c.rarity].name}</span>
      ${o ? `<span class="tag" style="background:var(--paper)">보유 ×${o.n}</span>` : ""}
    </div>
    <p style="margin:4px 0;color:var(--ink-soft)">${esc(c.en)} · ${o ? esc(titleOf(c)) : "아직 만나지 못한 사도예요."}</p>
    ${o ? `<p>“${esc(fmt(rand(linesOf(c, "idle")), c))}”</p>` : ""}
    ${emotes}
    <div class="modal-actions">
      ${o && state.partner !== id ? '<button class="btn yellow" id="m-partner">💛 대표 사도로 설정</button>' : ""}
      ${o && state.partner === id ? '<span class="tag" style="background:var(--yellow);font-size:15px;padding:6px 14px">💛 지금 대표 사도</span>' : ""}
      ${!o ? `<button class="btn pink" id="m-ex" ${state.candy < cost ? "disabled" : ""}><i class="ic-candy"></i> ${cost}개로 교환 영입</button>` : ""}
    </div>
    ${!o ? `<p class="hint">별사탕 ${state.candy} / ${cost}</p>` : ""}`,
    (el, close) => {
      const p = el.querySelector("#m-partner");
      if (p) p.onclick = () => { state.partner = id; save(); renderPartner(); sayKind("idle"); close(); refresh(); };
      const x = el.querySelector("#m-ex");
      if (x) x.onclick = () => {
        if (state.candy < cost) return;
        state.candy -= cost; acquire(c); save(); close();
        sfx("r3"); confetti(60); toast(`🍬 ${c.name} 영입!`);
        refresh(); sadoDetail(id);
      };
    });
}
function renderBg() {
  $("bg-grid").innerHTML = BACKGROUNDS.map((b, i) => {
    const un = state.unlockedBg.includes(b.id);
    return `<button class="bg-item ${un ? "" : "locked"} ${state.bg === b.id ? "on" : ""}" data-bg="${b.id}" ${un ? "" : "disabled"}>
      <img src="assets/bg/${b.id}.jpg" alt="" loading="lazy"><span>${un ? esc(b.name) : `🔒 레벨 ${i + 1} 달성 시 해금`}</span></button>`;
  }).join("");
}

/* ───── 기록 ───── */
function renderStats() {
  const s = state.stats, h = Math.floor(s.totalMin / 60), m = s.totalMin % 60;
  $("stat-cards").innerHTML = [
    ["⏱️", `${h}시간 ${m}분`, "누적 집중"],
    ["🔥", `${currentStreak()}일`, `연속 공부 (최고 ${s.bestStreak}일)`],
    ["✅", `${s.sessions}회`, "완주한 세션"],
    ["📜", `${s.todosDone}개`, "해결한 의뢰"],
    ["📖", `${Object.keys(state.owned).length}명`, "영입한 사도"],
    ["✉️", `${s.pulls}회`, "모집 횟수"],
    ["👉", `${s.pokes}번`, "볼따구 찌르기"],
    ["🏆", `${state.claimed.ach.length}/${ACHIEVEMENTS.length}`, "업적"],
  ].map(([i, b, t]) => `<div class="stat"><i>${i}</i><b>${b}</b><small>${t}</small></div>`).join("");
  const days = [...Array(7)].map((_, i) => daysAgo(6 - i));
  const max = Math.max(state.settings.goal, ...days.map((d) => s.days[d] || 0));
  const wd = ["일", "월", "화", "수", "목", "금", "토"];
  $("week-chart").innerHTML = days.map((d, i) => {
    const v = s.days[d] || 0;
    return `<div class="col ${i === 6 ? "today" : ""} ${v >= state.settings.goal ? "goal" : ""}">
      <b>${v}분</b><div class="colbar" style="height:${(v / max) * 100}%"></div>
      <small>${i === 6 ? "오늘" : wd[new Date(d + "T00:00").getDay()]}</small></div>`;
  }).join("");
  const subs = Object.entries(s.subjects).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const smax = subs.length ? subs[0][1] : 1;
  $("subj-list").innerHTML = subs.map(([k, v]) =>
    `<div class="row"><span>${esc(k)}</span><span class="bar"><i style="width:${(v / smax) * 100}%"></i></span><b>${Math.floor(v / 60)}h ${v % 60}m</b></div>`).join("");
  const st = state.settings;
  $("s-name").value = state.name;
  $("s-goal").value = st.goal;
  $("s-subjects").value = st.subjects.join(", ");
  $("s-sound").checked = st.sound;
  $("s-notify").checked = st.notify;
}

/* ───── 처음 시작 ───── */
function onboarding() {
  let pick = EMOTE_SADO[0].id;
  modal(`<h2>어서 오세요, 교주님!</h2>
    <p>엘리아스에 오신 걸 환영해요.<br>함께 공부할 <b>첫 사도</b>를 골라주세요.</p>
    <div class="starter-grid">${EMOTE_SADO.map((c, i) =>
      `<button data-pick="${c.id}" class="${i === 0 ? "on" : ""}"><img src="assets/emotes/${c.id}/1.gif" alt=""><span>${esc(c.name)}</span></button>`).join("")}</div>
    <label style="display:flex;flex-direction:column;gap:6px;font-family:var(--font-title);text-align:left">교주님의 이름은?
      <input id="m-name" maxlength="12" placeholder="교주" value=""></label>
    <div class="modal-actions"><button class="btn yellow big" id="m-start">공부 시작!</button></div>`,
    (el, close) => {
      el.querySelectorAll("[data-pick]").forEach((b) => (b.onclick = () => {
        pick = b.dataset.pick; sfx("click");
        el.querySelectorAll("[data-pick]").forEach((x) => x.classList.toggle("on", x === b));
      }));
      el.querySelector("#m-start").onclick = () => {
        state.name = el.querySelector("#m-name").value.trim() || "교주";
        state.started = true;
        state.owned[pick] = { n: 1, emo: 1 };
        state.partner = pick;
        state.elif = CONFIG.startElif;
        rollover();
        save(); close();
        renderPartner(); sfx("level"); confetti(80);
        say(`${state.name}님! 오늘부터 잘 부탁해요!`, false);
        modal(`<h2>시작 선물 🎁</h2><p>모집에 쓸 수 있는 <b>엘리프 ${CONFIG.startElif}개</b>를 드려요!<br>공부하고, 의뢰를 해결하고, 임무를 깨면 엘리프가 쌓여요.<br>모은 엘리프로 <b>136명의 사도</b>를 모집해 보세요!</p>
          <div class="modal-actions"><button class="btn pink" id="m-g">바로 모집하러 가기</button><button class="btn yellow" data-close>좋아요!</button></div>`,
          (e2, c2) => { e2.querySelector("#m-g").onclick = () => { c2(); go("gacha"); }; });
        refresh();
      };
    }, { noClose: true });
}

/* ───── 이벤트 ───── */
document.addEventListener("click", (e) => {
  const g = e.target.closest("[data-go]");
  if (g) return go(g.dataset.go);
  const tab = e.target.closest("#tabs button");
  if (tab) return go(tab.dataset.view);
  const cl = e.target.closest("[data-claim]");
  if (cl && !cl.disabled) { const [k, id] = cl.dataset.claim.split(":"); claimQuest(k, id); save(); return refresh(); }
  const dn = e.target.closest("[data-done]");
  if (dn) {
    const li = dn.closest(".todo"); li.classList.add("bye");
    return setTimeout(() => completeTodo(dn.dataset.done), 220);
  }
  const del = e.target.closest("[data-del]");
  if (del) {
    const x = state.todos.find((t) => t.id === del.dataset.del);
    return confirmModal("의뢰 삭제", `“${esc(x.text)}” 의뢰를 지울까요?`, "삭제", () => {
      state.todos = state.todos.filter((t) => t !== x);
      if (state.timer.todoId === x.id) state.timer.todoId = "";
      save(); refresh();
    }, true);
  }
  const fc = e.target.closest("[data-focus]");
  if (fc) return go("focus:" + fc.dataset.focus);
  const sd = e.target.closest("[data-sado]");
  if (sd) return sadoDetail(sd.dataset.sado);
  const bgb = e.target.closest("[data-bg]");
  if (bgb) { state.bg = bgb.dataset.bg; save(); applyBg(); sfx("click"); return renderBg(); }
});

$("partner").onclick = poke;
$("partner").addEventListener("animationend", (e) => { if (e.animationName === "squish") $("partner").classList.remove("squish"); });
$("profile-btn").onclick = () => go("stats");
$("mini-timer").onclick = () => go("timer");

$("mode-seg").onclick = (e) => {
  const b = e.target.closest("button"); const t = T();
  if (!b || t.running || t.remain) return;
  t.mode = b.dataset.mode; save(); renderTimer();
};
$("t-start").onclick = startTimer;
$("t-pause").onclick = pauseTimer;
$("t-stop").onclick = stopTimer;
$("t-subject").onchange = (e) => { T().subject = e.target.value; save(); };
$("t-todo").onchange = (e) => { T().todoId = e.target.value; save(); };
document.querySelectorAll(".presets [data-p]").forEach((b) => (b.onclick = () => {
  const [f, r] = b.dataset.p.split(",").map(Number);
  state.settings.focus = f; state.settings.brk = r; sfx("click"); save(); renderTimer();
}));
const clampNum = (v, lo, hi, dflt) => { v = Math.round(+v); return Number.isFinite(v) && v >= lo ? Math.min(hi, v) : dflt; };
$("t-focus").onchange = (e) => { state.settings.focus = clampNum(e.target.value, 1, 240, 25); save(); renderTimer(); };
$("t-break").onchange = (e) => { state.settings.brk = clampNum(e.target.value, 1, 60, 5); save(); renderTimer(); };
$("t-auto").onchange = (e) => { state.settings.auto = e.target.checked; save(); };

$("todo-diff").onclick = (e) => { const b = e.target.closest("button"); if (b) { newDiff = b.dataset.d; renderTodos(); } };
$("todo-form").onsubmit = (e) => {
  e.preventDefault();
  const text = $("todo-text").value.trim();
  if (!text) return;
  state.todos.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), text, diff: newDiff, daily: $("todo-daily").checked, done: null, created: today() });
  $("todo-text").value = "";
  sfx("click");
  const c = SADO_MAP[state.partner];
  if (c) say(`“${text}” 의뢰 접수! ${rand(["같이 해치워요!", "할 수 있어요!", "기대할게요!"])}`, false);
  save(); refresh();
};
$("todo-clear").onclick = () => { state.todos = state.todos.filter((x) => !x.done || x.daily); save(); refresh(); };

$("quest-seg").onclick = (e) => { const b = e.target.closest("button"); if (b) { questTab = b.dataset.q; renderQuests(); } };
$("claim-all").onclick = () => {
  const list = { daily: DAILY_QUESTS, weekly: WEEKLY_QUESTS, ach: ACHIEVEMENTS }[questTab];
  let sum = 0;
  for (const q of list) sum += claimQuest(questTab, q.id, true);
  if (sum) { sfx("coin"); toast(`🎁 보상 모두 받기 — 엘리프 +${sum}`); }
  save(); refresh();
};

$("pull1").onclick = () => pull(1);
$("pull10").onclick = () => pull(10);

$("sado-seg").onclick = (e) => { const b = e.target.closest("button"); if (b) { sadoTab = b.dataset.s; renderSado(); } };
["f-own", "f-pers", "f-rare"].forEach((id) => ($(id).onchange = renderSado));
$("f-q").oninput = renderSado;
$("f-pers").innerHTML += Object.entries(PERS).map(([k, p]) => `<option value="${k}">${p.label}</option>`).join("");

$("s-name").onchange = (e) => { state.name = e.target.value.trim() || "교주"; save(); refresh(); };
$("s-goal").onchange = (e) => { state.settings.goal = clampNum(e.target.value, 10, 900, 120); save(); refresh(); };
$("s-subjects").onchange = (e) => {
  const list = e.target.value.split(",").map((x) => x.trim()).filter(Boolean);
  state.settings.subjects = list.length ? [...new Set(list)] : SUBJECTS_DEFAULT.slice();
  if (!state.settings.subjects.includes(T().subject)) T().subject = state.settings.subjects[0];
  save(); refresh();
};
$("s-sound").onchange = (e) => { state.settings.sound = e.target.checked; save(); sfx("click"); };
$("s-notify").onchange = (e) => {
  state.settings.notify = e.target.checked; save();
  if (e.target.checked && "Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission().then((p) => { if (p !== "granted") toast("브라우저에서 알림이 차단돼 있어요"); });
  }
};
$("s-export").onclick = () => {
  const blob = new Blob([JSON.stringify(state, null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `trickcal-study-${today()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
$("s-import").onchange = (e) => {
  const f = e.target.files[0];
  if (!f) return;
  f.text().then((txt) => {
    const s = JSON.parse(txt);
    if (!s || s.v !== 1 || !s.owned) throw new Error("bad");
    localStorage.setItem(SAVE_KEY, txt);
    location.reload();
  }).catch(() => toast("올바른 저장 파일이 아니에요"));
};
$("s-reset").onclick = () => confirmModal("처음부터 다시?", "레벨, 사도, 기록이 <b>모두 사라져요</b>. 정말 초기화할까요?", "초기화", () => {
  localStorage.removeItem(SAVE_KEY); location.reload();
}, true);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { const x = document.querySelector(".modal .x"); if (x) x.click(); }
});

/* ───── 시작 ───── */
applyBg();
$("banner").style.backgroundImage = 'url("assets/bg/2year-anniversary.jpg")';
$("banner-feat").innerHTML = SADO.filter((c) => c.rarity === 3).sort(() => Math.random() - 0.5).slice(0, 3)
  .map((c, i) => `<img src="${chibiSrc(c)}" style="--r:${[-6, 3, 8][i]}deg" alt="">`).join("");
rollover();
if (!state.started) {
  $("bubble-text").textContent = "누가 왔나 봐요…?";
  $("partner-img").src = "assets/chibi/erpin.webp";
  onboarding();
} else {
  renderPartner(true);
  chatter();
}
refresh();

// 타이머 틱 (탭을 닫았다 열어도 endAt 기준으로 계산)
setInterval(() => {
  const t = T();
  if (t.running && Date.now() >= t.endAt) timerComplete();
  else if (t.running || view === "timer") updateClock();
}, 250);
// 사도 잡담 & 날짜 넘어가면 갱신
setInterval(() => { if (!modalOpen && !document.hidden) chatter(); }, 18000);
setInterval(() => { if (rollover()) refresh(); }, 60000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
})();
