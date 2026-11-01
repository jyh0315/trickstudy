/* =========================================================
   시간표 (매주 반복) & D-day
   - 로비에 "지금 진행 중 / 다음 일정까지 남은 시간 / D-day" 표시
   - 시작 10분 전에 사도가 알려줌
   ========================================================= */
(() => {
"use strict";
const TS = window.TS;
const $ = (id) => document.getElementById(id);
const S = () => TS.state;
const esc = TS.esc;
const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // 월요일부터
const COLORS = ["#ffd34e", "#ff8fb1", "#7fd6c2", "#8fd3ff", "#c9a6ff", "#ffb07a"];

function sch() {
  const s = S();
  if (!s.schedule) s.schedule = { tt: [], dd: [] };
  return s.schedule;
}
const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60; };
function dur(min) {
  min = Math.max(0, Math.round(min));
  const d = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60), m = min % 60;
  return [d && `${d}일`, h && `${h}시간`, (m || (!d && !h)) && `${m}분`].filter(Boolean).join(" ");
}
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* ───── 계산 ───── */
function todayItems() {
  const dow = new Date().getDay();
  return sch().tt.filter((x) => x.days.includes(dow)).sort((a, b) => toMin(a.start) - toMin(b.start));
}
function nowAndNext() {
  const n = nowMin(), items = todayItems();
  const cur = items.filter((x) => toMin(x.start) <= n && n < toMin(x.end));
  const next = items.filter((x) => toMin(x.start) > n);
  return { cur, next };
}
// 오늘 이후 가장 가까운 다음 수업 (오늘 남은 게 없을 때)
function upcomingLater() {
  const tt = sch().tt;
  if (!tt.length) return null;
  const d0 = new Date().getDay();
  for (let k = 1; k <= 7; k++) {
    const dow = (d0 + k) % 7;
    const items = tt.filter((x) => x.days.includes(dow)).sort((a, b) => toMin(a.start) - toMin(b.start));
    if (items.length) return { item: items[0], inMin: k * 1440 - nowMin() + toMin(items[0].start), dow };
  }
  return null;
}
function ddInfo(x) {
  const target = new Date(`${x.date}T${x.time || "00:00"}`);
  const dayDiff = Math.round((new Date(x.date + "T00:00") - new Date(TS.today() + "T00:00")) / 864e5);
  return { target, dayDiff, leftMin: (target - new Date()) / 60000, label: dayDiff > 0 ? `D-${dayDiff}` : dayDiff === 0 ? "D-DAY" : `D+${-dayDiff}` };
}
const ddSorted = () => sch().dd.map((x) => ({ x, ...ddInfo(x) })).sort((a, b) => a.target - b.target);

/* ───── 로비 카드 ───── */
function renderLobby() {
  const el = $("lobby-sched");
  if (!el) return;
  const { cur, next } = nowAndNext(), n = nowMin();
  const dds = ddSorted().filter((d) => d.dayDiff >= 0).slice(0, 4);
  let body = "";
  for (const x of cur) {
    const total = toMin(x.end) - toMin(x.start), done = n - toMin(x.start);
    body += `<div class="sch-now" style="--c:${x.color}">
      <div><span class="tag" style="background:${x.color}">진행 중</span> <b>${esc(x.title)}</b> <small>${x.start}~${x.end}</small></div>
      <span class="bar"><i style="width:${(done / total) * 100}%;background:${x.color}"></i></span>
      <div class="sch-left">끝나기까지 <b>${dur(toMin(x.end) - n)}</b> 남음</div></div>`;
  }
  if (next.length) {
    body += `<ul class="sch-next">${next.slice(0, 3).map((x) => `<li style="--c:${x.color}"><span class="sch-dot"></span><b>${esc(x.title)}</b><small>${x.start}~${x.end}</small><em>${dur(toMin(x.start) - n)} 후</em></li>`).join("")}</ul>`;
  } else if (!cur.length) {
    const later = upcomingLater();
    body += `<p class="sch-empty">${sch().tt.length ? "오늘 남은 시간표 일정이 없어요! 🎉" : "시간표를 등록하면 일정까지 남은 시간을 알려드려요."}
      ${later ? `<br>다음: <b>${DAYS[later.dow]}요일 ${esc(later.item.title)}</b> (${later.item.start}) — ${dur(later.inMin)} 후` : ""}</p>`;
  }
  if (dds.length) {
    body += `<div class="dd-chips">${dds.map((d) => `<span class="dd-chip ${d.dayDiff <= 3 ? "soon" : ""}"><b>${d.label}</b> ${esc(d.x.title)}<small>${d.dayDiff === 0 && d.x.time ? (d.leftMin > 0 ? dur(d.leftMin) + " 남음" : "시작!") : d.x.date.slice(5).replace("-", "/")}</small></span>`).join("")}</div>`;
  }
  el.innerHTML = `<h3 class="card-title">📅 오늘의 일정 <span class="sch-clock">${new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</span><button class="link" data-sched="tt">시간표 관리 ›</button></h3>${body}`;
}

/* ───── 의뢰 화면 하위 탭 ───── */
let pane = "todo";
function setPane(p) {
  pane = p;
  document.querySelectorAll("#todo-seg button").forEach((b) => b.classList.toggle("on", b.dataset.t === p));
  $("todo-pane").classList.toggle("hidden", p !== "todo");
  $("tt-pane").classList.toggle("hidden", p !== "tt");
  $("dd-pane").classList.toggle("hidden", p !== "dd");
  if (p === "tt") renderTT();
  if (p === "dd") renderDD();
}
$("todo-seg").onclick = (e) => { const b = e.target.closest("button"); if (b) { TS.sfx("click"); setPane(b.dataset.t); } };

/* 시간표 */
let pickDays = [], pickColor = COLORS[0];
function renderTT() {
  const tt = sch().tt;
  const all = tt.flatMap((x) => [toMin(x.start), toMin(x.end)]);
  const h0 = all.length ? Math.max(0, Math.floor(Math.min(...all) / 60)) : 9;
  const h1 = all.length ? Math.min(24, Math.ceil(Math.max(...all) / 60)) : 18;
  const HPX = 52, dowNow = new Date().getDay(), n = nowMin();
  $("tt-pane").innerHTML = `
    <div class="card">
      <h2 class="ribbon">시간표 등록</h2>
      <form class="tt-form" id="tt-form" autocomplete="off">
        <input id="tt-title" placeholder="예) 수학 학원, 영어 인강" maxlength="30" required>
        <div class="day-chips">${DAY_ORDER.map((d) => `<button type="button" data-day="${d}" class="${pickDays.includes(d) ? "on" : ""}">${DAYS[d]}</button>`).join("")}
          <button type="button" class="link" data-day="wk">평일</button></div>
        <div class="tt-row">
          <label>시작 <input type="time" id="tt-start" value="09:00" required></label>
          <label>끝 <input type="time" id="tt-end" value="10:00" required></label>
          <span class="swatches">${COLORS.map((c) => `<button type="button" data-color="${c}" style="background:${c}" class="${c === pickColor ? "on" : ""}"></button>`).join("")}</span>
          <button class="btn yellow" type="submit">추가</button>
        </div>
      </form>
    </div>
    <div class="card">
      <h3 class="card-title">🗓️ 내 시간표 <span class="count">${tt.length}</span>${tt.length ? '<button class="btn white small gcal-btn" data-ics="tt">📅 구글 캘린더로</button>' : ""}</h3>
      ${tt.length ? `<div class="tt-grid" style="--h:${(h1 - h0) * HPX}px">
        <div class="tt-times">${Array.from({ length: h1 - h0 + 1 }, (_, i) => `<span style="top:${i * HPX}px">${h0 + i}:00</span>`).join("")}</div>
        ${DAY_ORDER.map((d) => `<div class="tt-col ${d === dowNow ? "today" : ""}"><div class="tt-head">${DAYS[d]}</div><div class="tt-body">
          ${tt.filter((x) => x.days.includes(d)).map((x) => {
            const top = ((toMin(x.start) - h0 * 60) / 60) * HPX, h = ((toMin(x.end) - toMin(x.start)) / 60) * HPX;
            return `<button class="tt-block" data-tt="${x.id}" style="top:${top}px;height:${Math.max(18, h)}px;background:${x.color}" title="${esc(x.title)} ${x.start}~${x.end} (눌러서 삭제)"><b>${esc(x.title)}</b><small>${x.start}~${x.end}</small></button>`;
          }).join("")}
          ${d === dowNow && n >= h0 * 60 && n <= h1 * 60 ? `<i class="tt-nowline" style="top:${((n - h0 * 60) / 60) * HPX}px"></i>` : ""}
        </div></div>`).join("")}
      </div><p class="hint">블록을 누르면 삭제할 수 있어요. 빨간 선이 지금 시각이에요.</p>` : '<p class="hint">아직 등록된 시간표가 없어요. 위에서 요일과 시간을 골라 추가해 보세요!</p>'}
    </div>`;
  const f = $("tt-form");
  f.querySelectorAll("[data-day]").forEach((b) => (b.onclick = () => {
    if (b.dataset.day === "wk") pickDays = [1, 2, 3, 4, 5];
    else { const d = +b.dataset.day; pickDays = pickDays.includes(d) ? pickDays.filter((x) => x !== d) : [...pickDays, d]; }
    const keep = { t: $("tt-title").value, s: $("tt-start").value, e: $("tt-end").value };
    renderTT();
    $("tt-title").value = keep.t; $("tt-start").value = keep.s; $("tt-end").value = keep.e;
  }));
  f.querySelectorAll("[data-color]").forEach((b) => (b.onclick = () => {
    pickColor = b.dataset.color;
    f.querySelectorAll("[data-color]").forEach((x) => x.classList.toggle("on", x === b));
  }));
  f.onsubmit = (e) => {
    e.preventDefault();
    const title = $("tt-title").value.trim(), start = $("tt-start").value, end = $("tt-end").value;
    if (!pickDays.length) return TS.toast("요일을 하나 이상 골라주세요!");
    if (toMin(end) <= toMin(start)) return TS.toast("끝나는 시간이 시작보다 늦어야 해요");
    sch().tt.push({ id: uid(), title, days: pickDays.slice(), start, end, color: pickColor });
    TS.sfx("coin"); TS.toast(`🗓️ ‘${title}’ 시간표에 추가!`);
    TS.save(); renderTT();
  };
}
/* D-day */
function renderDD() {
  const list = ddSorted();
  $("dd-pane").innerHTML = `
    <div class="card">
      <h2 class="ribbon">D-day 등록</h2>
      <form class="tt-form" id="dd-form" autocomplete="off">
        <input id="dd-title" placeholder="예) 중간고사, 수행평가 제출" maxlength="30" required>
        <div class="tt-row">
          <label>날짜 <input type="date" id="dd-date" required min="${TS.today()}"></label>
          <label>시간 (선택) <input type="time" id="dd-time"></label>
          <button class="btn yellow" type="submit">추가</button>
        </div>
      </form>
    </div>
    <div class="card">
      <h3 class="card-title">📌 D-day 목록${list.length ? '<button class="btn white small gcal-btn" data-ics="dd">📅 전부 구글 캘린더로</button>' : ""}</h3>
      <ul class="dd-list">${list.map((d) => `<li class="${d.dayDiff < 0 ? "past" : d.dayDiff <= 3 ? "soon" : ""}">
        <b class="dd-label">${d.label}</b>
        <span class="dd-title">${esc(d.x.title)}<small>${d.x.date}${d.x.time ? " " + d.x.time : ""}</small></span>
        <span class="dd-left">${d.leftMin > 0 ? dur(d.leftMin) + " 남음" : "지남"}</span>
        <a class="icon-btn" href="${gcalLink(d.x)}" target="_blank" rel="noopener" title="구글 캘린더에 추가">📅</a>
        <button class="icon-btn" data-dd="${d.x.id}" title="삭제">🗑️</button></li>`).join("") || '<li class="empty">시험이나 마감일을 등록해 보세요!</li>'}</ul>
    </div>`;
  $("dd-form").onsubmit = (e) => {
    e.preventDefault();
    const title = $("dd-title").value.trim(), date = $("dd-date").value, time = $("dd-time").value;
    if (!date) return;
    sch().dd.push({ id: uid(), title, date, time });
    TS.sfx("coin"); TS.toast(`📌 ${title} ${ddInfo({ date, time }).label}`);
    TS.save(); renderDD();
  };
}

/* ───── 구글 캘린더 연동 (설정 없이) ─────
   - D-day 하나: 구글 캘린더 "일정 추가" 화면을 미리 채워서 새 탭으로 → 저장만 누르면 됨
   - 시간표·D-day 전체: .ics 파일로 내려받기 → 구글 캘린더 설정 › 가져오기 (시간표는 매주 반복 일정으로 들어감) */
const p2 = (n) => String(n).padStart(2, "0");
const ymd = (date) => date.replace(/-/g, "");
const hm = (t) => t.replace(":", "") + "00";
function gcalLink(x) {
  let dates;
  if (x.time) { // 시간이 있으면 1시간짜리 일정
    const [h, m] = x.time.split(":").map(Number), e = h * 60 + m + 60;
    dates = `${ymd(x.date)}T${hm(x.time)}/${ymd(x.date)}T${p2(Math.min(23, Math.floor(e / 60)))}${p2(e >= 1440 ? 59 : e % 60)}00`;
  } else { // 하루 종일
    const d = new Date(x.date + "T00:00"); d.setDate(d.getDate() + 1);
    dates = `${ymd(x.date)}/${TS.dateKey(d).replace(/-/g, "")}`;
  }
  const q = new URLSearchParams({ action: "TEMPLATE", text: `📌 ${x.title}`, dates, details: "트릭스터디 D-day", ctz: "Asia/Seoul" });
  return "https://calendar.google.com/calendar/render?" + q.toString();
}
const icsEsc = (t) => String(t).replace(/[\\,;]/g, (m) => "\\" + m).replace(/\n/g, "\\n");
function makeIcs(kind) {
  const now = new Date(), stamp = `${now.getUTCFullYear()}${p2(now.getUTCMonth() + 1)}${p2(now.getUTCDate())}T${p2(now.getUTCHours())}${p2(now.getUTCMinutes())}00Z`;
  const ev = [];
  const BY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  if (kind === "tt") {
    for (const x of sch().tt) {
      // 이번 주에서 첫 요일 날짜를 시작일로
      const d = new Date(); d.setHours(0, 0, 0, 0);
      const first = Math.min(...x.days.map((w) => (w - d.getDay() + 7) % 7));
      d.setDate(d.getDate() + first);
      const day = ymd(TS.dateKey(d));
      ev.push(["BEGIN:VEVENT", `UID:tt-${x.id}@trickstudy`, `DTSTAMP:${stamp}`, `SUMMARY:${icsEsc(x.title)}`,
        `DTSTART;TZID=Asia/Seoul:${day}T${hm(x.start)}`, `DTEND;TZID=Asia/Seoul:${day}T${hm(x.end)}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${x.days.map((w) => BY[w]).join(",")}`, "DESCRIPTION:트릭스터디 시간표", "END:VEVENT"].join("\r\n"));
    }
  } else {
    for (const x of sch().dd) {
      let dt;
      if (x.time) { const [h, m] = x.time.split(":").map(Number), e = Math.min(1439, h * 60 + m + 60); dt = [`DTSTART;TZID=Asia/Seoul:${ymd(x.date)}T${hm(x.time)}`, `DTEND;TZID=Asia/Seoul:${ymd(x.date)}T${p2(Math.floor(e / 60))}${p2(e % 60)}00`]; }
      else { const d = new Date(x.date + "T00:00"); d.setDate(d.getDate() + 1); dt = [`DTSTART;VALUE=DATE:${ymd(x.date)}`, `DTEND;VALUE=DATE:${ymd(TS.dateKey(d))}`]; }
      ev.push(["BEGIN:VEVENT", `UID:dd-${x.id}@trickstudy`, `DTSTAMP:${stamp}`, `SUMMARY:${icsEsc("📌 " + x.title)}`, ...dt,
        "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", `DESCRIPTION:${icsEsc(x.title)} 하루 전`, "END:VALARM", "END:VEVENT"].join("\r\n"));
    }
  }
  const tz = ["BEGIN:VTIMEZONE", "TZID:Asia/Seoul", "BEGIN:STANDARD", "DTSTART:19700101T000000", "TZOFFSETFROM:+0900", "TZOFFSETTO:+0900", "TZNAME:KST", "END:STANDARD", "END:VTIMEZONE"].join("\r\n");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//trickstudy//KO", "CALSCALE:GREGORIAN", `X-WR-CALNAME:트릭스터디 ${kind === "tt" ? "시간표" : "D-day"}`, tz, ...ev, "END:VCALENDAR"].join("\r\n");
}
function exportIcs(kind) {
  const blob = new Blob([makeIcs(kind)], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = kind === "tt" ? "트릭스터디-시간표.ics" : "트릭스터디-Dday.ics";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  TS.modal(`<h2>📅 구글 캘린더로 보내기</h2>
    <p><b>${a.download}</b> 파일을 내려받았어요. 이제 구글 캘린더에 넣으면 끝!</p>
    <ol class="gcal-steps">
      <li>아래 버튼으로 <b>구글 캘린더 가져오기</b> 화면을 열어요</li>
      <li><b>컴퓨터에서 파일 선택</b> → 방금 받은 파일 고르기</li>
      <li>넣을 캘린더를 고르고 <b>가져오기</b></li>
    </ol>
    ${kind === "tt" ? '<p class="hint">시간표는 매주 반복 일정으로 들어가요. 시간표를 바꾸면 다시 보내 주세요 (같은 일정은 덮어써져요).</p>' : '<p class="hint">D-day 하루 전에 알림이 와요.</p>'}
    <div class="modal-actions"><a class="btn yellow" href="https://calendar.google.com/calendar/r/settings/export" target="_blank" rel="noopener">구글 캘린더 가져오기 열기</a><button class="btn white" data-close>닫기</button></div>`);
}

document.addEventListener("click", (e) => {
  const ics = e.target.closest("[data-ics]");
  if (ics) return exportIcs(ics.dataset.ics);
  const go = e.target.closest("[data-sched]");
  if (go) { TS.go("todo"); setPane(go.dataset.sched); return; }
  const tb = e.target.closest("[data-tt]");
  if (tb) {
    const x = sch().tt.find((t) => t.id === tb.dataset.tt);
    if (x) TS.confirmModal("시간표 삭제", `‘${esc(x.title)}’ (${x.days.map((d) => DAYS[d]).join("·")} ${x.start}~${x.end}) 을 지울까요?`, "삭제", () => {
      sch().tt = sch().tt.filter((t) => t !== x); TS.save(); renderTT();
    }, true);
    return;
  }
  const db = e.target.closest("[data-dd]");
  if (db) { sch().dd = sch().dd.filter((t) => t.id !== db.dataset.dd); TS.save(); renderDD(); }
});

/* ───── 알림 & 사도 대사 ───── */
function checkAlerts() {
  const s = S(), t = TS.today();
  if (!s.schedNotified || s.schedNotified.d !== t) s.schedNotified = { d: t, ids: [] };
  const n = nowMin();
  for (const x of todayItems()) {
    const until = toMin(x.start) - n;
    if (until > 0 && until <= 10 && !s.schedNotified.ids.includes(x.id)) {
      s.schedNotified.ids.push(x.id);
      TS.say(`교주님! ${Math.ceil(until)}분 뒤에 ‘${x.title}’ 시작이에요!`, false);
      TS.toast(`⏰ ${Math.ceil(until)}분 뒤 ‘${x.title}’`);
      TS.sfx("bell");
      if (s.settings.notify && "Notification" in window && Notification.permission === "granted" && document.hidden) {
        try { new Notification(`곧 ‘${x.title}’ 시작!`, { body: `${x.start}~${x.end}` }); } catch (e) { /* 무시 */ }
      }
      TS.save();
    }
  }
}
TS.chatterHooks.push(() => {
  const { cur, next } = nowAndNext(), n = nowMin();
  if (cur.length) return `‘${cur[0].title}’ 끝나기까지 ${dur(toMin(cur[0].end) - n)} 남았어요. 힘내요!`;
  if (next.length) return `다음 일정 ‘${next[0].title}’까지 ${dur(toMin(next[0].start) - n)} 남았어요.`;
  const d = ddSorted().find((x) => x.dayDiff >= 0);
  if (d) return d.dayDiff === 0 ? `오늘이 바로 ‘${d.x.title}’ 날이에요! 파이팅!` : `‘${d.x.title}’까지 ${d.dayDiff}일 남았어요!`;
  return null;
});

TS.on("refresh", (v) => { if (v === "lobby") renderLobby(); if (v === "todo" && pane !== "todo") setPane(pane); });
setInterval(() => {
  checkAlerts();
  if (TS.view === "lobby" && !document.hidden) renderLobby();
}, 20000);
TS.on("start", checkAlerts);

window.Schedule = { nowAndNext, ddSorted, dur, toMin };
})();
