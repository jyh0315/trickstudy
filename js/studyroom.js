/* =========================================================
   👥 함께 공부방 — 친구와 같은 방에 들어가 서로의 사도·타이머를 보며 공부
   - 방 코드(5자리)로 만들고 들어가기, "모두의 공부방"은 누구나 들어올 수 있는 공개 방
   - Firebase /rooms/<코드>/m/<uid> = { n 이름, p 대표 사도, s 상태, sub 과목, end 끝나는 시각, rem 남은 ms, today 오늘 분, t 갱신 시각 }
     /rooms/<코드>/ping/<받는uid> = { f 보낸 이름, p 보낸 사도, t 시각 } (📣 응원)
   - 다른 사람이 집중하는 동안 집중을 마치면 "함께 집중" 보너스
   - 보안 규칙에 rooms 를 추가해야 함 (README 참고)
   ========================================================= */
const ROOM_PUBLIC = "ALL";
const ROOM_BONUS = 0.3;      // 함께 집중 보너스: 집중 분 × 0.3 엘리프
const ROOM_AWAY = 3 * 60e3;  // 이 시간 동안 소식 없으면 자리비움
const ROOM_GONE = 6 * 3600e3; // 이보다 오래되면 목록에서 숨김

(() => {
"use strict";
const TS = window.TS;
const $ = (id) => document.getElementById(id);
const esc = TS.esc;
const S = () => TS.state;
const R = () => { const s = S(); if (!s.room) s.room = { code: "", seenPing: 0 }; return s.room; };
const api = (...a) => window.FB.api(...a);

let members = {}, myUid = "", lastLoad = 0, loading = false, err = "", pollT = 0, beatT = 0;

/* 내 상태 */
function myState() {
  const s = S(), t = s.timer, now = Date.now();
  const st = t.running ? (t.mode === "focus" ? "focus" : "break") : t.remain ? "pause" : "idle";
  return {
    n: String(s.name || "교주").slice(0, 12), p: s.partner || "", s: st, sub: t.mode === "focus" ? String(t.subject || "").slice(0, 12) : "",
    end: t.running ? t.endAt : 0, rem: !t.running && t.remain ? t.remain : 0,
    today: s.stats.days[TS.today()] || 0, t: now,
  };
}
async function beat() {
  const code = R().code;
  if (!code || !window.FB) return;
  try { await api(`rooms/${code}/m/{uid}`, { method: "PUT", body: JSON.stringify(myState()) }); err = ""; }
  catch (e) { err = e.message; }
}
async function load() {
  const code = R().code;
  if (!code || loading || !window.FB) return;
  loading = true;
  try {
    const { uid, data } = await api(`rooms/${code}`);
    myUid = uid; members = (data && data.m) || {}; lastLoad = Date.now(); err = "";
    // 나한테 온 응원
    const ping = data && data.ping && data.ping[uid];
    if (ping && ping.t > (R().seenPing || 0)) {
      R().seenPing = ping.t; TS.save();
      const c = TS.SADO_MAP[ping.p];
      TS.sfx("coin");
      TS.toast(`📣 ${ping.f}님이 응원했어요!${c ? ` (${c.name}: “화이팅!”)` : ""}`);
    }
  } catch (e) { err = e.message; }
  loading = false;
  if (TS.view === "room") render();
}
function schedule() {
  clearInterval(pollT); clearInterval(beatT);
  if (!R().code) return;
  beat(); load();
  beatT = setInterval(beat, 15000);
  pollT = setInterval(() => { if (TS.view === "room" || Date.now() - lastLoad > 30000) load(); }, 5000);
}
async function join(code) {
  code = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
  if (!code) return TS.toast("방 코드를 입력해 주세요");
  if (R().code && R().code !== code) await leave(true);
  R().code = code; TS.save();
  members = {}; render(); schedule();
  TS.sfx("click");
  TS.toast(code === ROOM_PUBLIC ? "👥 모두의 공부방에 들어왔어요!" : `👥 공부방 ${code}에 들어왔어요!`);
}
async function leave(quiet) {
  const code = R().code;
  if (!code) return;
  R().code = ""; TS.save();
  clearInterval(pollT); clearInterval(beatT);
  for (const u of Object.keys(pics)) { pics[u].dispose(); delete pics[u]; }
  try { await api(`rooms/${code}/m/{uid}`, { method: "DELETE" }); } catch (e) { /* 무시 */ }
  members = {};
  if (!quiet) { TS.toast("공부방에서 나왔어요"); render(); }
}
const newCode = () => Array.from({ length: 5 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
async function cheer(uid) {
  const code = R().code, m = members[uid];
  if (!code || !m) return;
  try {
    await api(`rooms/${code}/ping/${uid}`, { method: "PUT", body: JSON.stringify({ f: String(S().name || "교주").slice(0, 12), p: S().partner || "", t: Date.now() }) });
    TS.sfx("poke"); TS.toast(`📣 ${m.n}님을 응원했어요!`);
  } catch (e) { TS.toast("응원 실패: " + e.message); }
}

/* 다른 사람이 집중 중일 때 집중을 마치면 보너스 */
TS.on("focus", ({ min, extras }) => {
  if (!R().code || !min) return;
  const now = Date.now();
  const mates = Object.entries(members).filter(([u, m]) => u !== myUid && m && now - m.t < ROOM_AWAY && (m.s === "focus" || (m.s === "break" && now - m.t < 10 * 60e3)));
  if (!mates.length) return;
  const bonus = Math.max(1, Math.round(min * ROOM_BONUS));
  TS.addElif(bonus);
  extras.push(`👥 함께 집중 +${bonus}`);
  beat();
});
// 타이머를 켜고 끌 때 바로 알림
let lastSig = "";
TS.on("refresh", () => {
  if (!R().code) return;
  const t = S().timer, sig = `${t.running}|${t.mode}|${t.endAt}|${t.remain}`;
  if (sig !== lastSig) { lastSig = sig; beat(); }
});

/* ───── 움직이는 사도 ─────
   화면은 1초마다 다시 그리지만, 사도 애니메이션은 한 번 만든 걸 계속 옮겨 끼워서 깜빡이지 않게 함
   (WebGL 개수 제한이 있어서 움직이는 사도는 최대 LIVE_MAX명, 나머지는 그림) */
const LIVE_MAX = 8;
const pics = {}; // uid → { p, node }
function attachPics(root) {
  const slots = [...root.querySelectorAll("[data-pic]")], used = new Set();
  slots.forEach((slot, i) => {
    const u = slot.dataset.pic, p = slot.dataset.p;
    used.add(u);
    let c = pics[u];
    if (c && c.p !== p) { c.dispose && c.dispose(); delete pics[u]; c = null; }
    if (!c) {
      const node = document.createElement("div");
      node.className = "rm-live";
      const img = () => { if (!node.querySelector("img")) node.innerHTML = `<img src="${TS.chibiSrc(TS.SADO_MAP[p])}" alt="">`; };
      const live = i < LIVE_MAX && window.Live && window.Live.canLive(p) ? window.Live.mount(node, p, { frame: "face", onFail: img }) : null;
      if (!live) img();
      c = pics[u] = { p, node, dispose: () => live && live.dispose() };
    }
    slot.prepend(c.node);
  });
  // 방에서 나간 사람 정리
  for (const u of Object.keys(pics)) if (!used.has(u)) { pics[u].dispose(); delete pics[u]; }
}

/* ───── 화면 ───── */
const mmss = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const fmtMin = (m) => (m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m}분`);
function statusOf(m, now) {
  if (now - m.t > ROOM_AWAY) return { cls: "away", label: "💤 자리비움" };
  if (m.s === "focus") return { cls: "focus", label: `📚 ${esc(m.sub || "집중")} · ${mmss(m.end - now)}` };
  if (m.s === "break") return { cls: "break", label: `☕ 휴식 · ${mmss(m.end - now)}` };
  if (m.s === "pause") return { cls: "pause", label: `⏸ 일시정지 · ${mmss(m.rem)}` };
  return { cls: "idle", label: "🙂 대기 중" };
}
function render() {
  const el = $("view-room");
  if (!el) return;
  const code = R().code;
  if (!code) {
    el.innerHTML = `
      <div class="card room-intro">
        <h2 class="ribbon">함께 공부방</h2>
        <p>친구와 같은 방에 들어가면 서로의 <b>사도와 타이머</b>가 보여요. 다른 사람이 집중하는 동안 집중을 마치면 <b>함께 집중 보너스</b>(집중 분 × ${ROOM_BONUS} 엘리프)를 받아요!</p>
        <div class="room-join">
          <button class="btn yellow big" id="rm-public">🌏 모두의 공부방 들어가기</button>
          <button class="btn pink big" id="rm-new">✨ 새 방 만들기</button>
        </div>
        <form class="tt-row room-code" id="rm-form" autocomplete="off">
          <input id="rm-code" placeholder="친구에게 받은 방 코드 (예: K7PQ2)" maxlength="8">
          <button class="btn white" type="submit">코드로 들어가기</button>
        </form>
      </div>`;
    $("rm-public").onclick = () => join(ROOM_PUBLIC);
    $("rm-new").onclick = () => join(newCode());
    $("rm-form").onsubmit = (e) => { e.preventDefault(); join($("rm-code").value); };
    return;
  }
  const now = Date.now();
  const list = Object.entries(members).filter(([, m]) => m && now - m.t < ROOM_GONE)
    .map(([u, m]) => ({ u, m, st: statusOf(m, now) }))
    .sort((a, b) => (a.u === myUid ? -1 : b.u === myUid ? 1 : 0) || ["focus", "break", "pause", "idle", "away"].indexOf(a.st.cls) - ["focus", "break", "pause", "idle", "away"].indexOf(b.st.cls) || b.m.today - a.m.today);
  const focusN = list.filter((x) => x.st.cls === "focus").length;
  el.innerHTML = `
    <div class="card room-head">
      <h2 class="ribbon">${code === ROOM_PUBLIC ? "모두의 공부방" : "함께 공부방"}</h2>
      <div class="room-info">
        ${code === ROOM_PUBLIC ? "<span>누구나 들어올 수 있는 공개 방이에요</span>" : `<span>방 코드</span><b class="room-codebox">${esc(code)}</b><button class="btn white small" id="rm-copy">📋 복사</button>`}
        <span class="room-count">👥 ${list.length}명 · 📚 지금 ${focusN}명 집중 중</span>
        <button class="btn red small" id="rm-leave">나가기</button>
      </div>
      ${err ? `<p class="rank-err-msg">⚠️ 서버 연결 문제: ${esc(err)}${/permission/i.test(err) ? " — Firebase 규칙에 rooms 추가가 필요해요 (README 3단계)" : ""}</p>` : ""}
      <p class="hint">다른 사람이 집중하는 동안 집중을 마치면 함께 집중 보너스! 📣를 누르면 친구에게 응원이 가요.</p>
    </div>
    <div class="room-grid">${list.map(({ u, m, st }) => {
      const c = TS.SADO_MAP[m.p] || TS.SADO_MAP.butter, me = u === myUid;
      return `<div class="room-mem ${st.cls} ${me ? "me" : ""}">
        <div class="rm-pic" data-pic="${esc(u)}" data-p="${esc(c.id)}">${st.cls === "focus" ? '<span class="rm-zz">✏️</span>' : st.cls === "away" ? '<span class="rm-zz">💤</span>' : ""}</div>
        <b>${esc(m.n)}${me ? " <small>(나)</small>" : ""}</b>
        <span class="rm-st">${st.label}</span>
        <small>오늘 ${fmtMin(m.today || 0)}</small>
        ${me ? "" : `<button class="btn white small" data-cheer="${esc(u)}">📣 응원</button>`}
      </div>`;
    }).join("") || `<p class="hint">${lastLoad ? "아직 아무도 없어요. 방 코드를 친구에게 알려 주세요!" : "불러오는 중…"}</p>`}</div>`;
  attachPics(el);
  $("rm-leave").onclick = () => leave();
  const cp = $("rm-copy");
  if (cp) cp.onclick = () => { navigator.clipboard && navigator.clipboard.writeText(code); TS.toast(`📋 방 코드 ${code} 복사했어요!`); };
  el.querySelectorAll("[data-cheer]").forEach((b) => (b.onclick = () => cheer(b.dataset.cheer)));
}
// 남은 시간 표시가 1초마다 줄어들게
setInterval(() => { if (TS.view === "room" && R().code) render(); }, 1000);

TS.views.room = () => { render(); if (R().code) load(); };
TS.on("start", schedule);
window.addEventListener("pagehide", () => { /* 탭을 닫아도 3분 뒤엔 자리비움으로 보임 */ });
window.StudyRoom = { join, leave, load };
})();
