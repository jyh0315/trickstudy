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
      <h3 class="card-title">🗓️ 내 시간표 <span class="count">${tt.length}</span><button class="btn yellow small gcal-btn" data-gimport="tt">📥 구글 캘린더에서 가져오기</button>${tt.length ? '<button class="btn white small" data-ics="tt">📅 내보내기</button>' : ""}</h3>
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
      <h3 class="card-title">📌 D-day 목록<button class="btn yellow small gcal-btn" data-gimport>📥 구글 캘린더에서 가져오기</button>${list.length ? '<button class="btn white small" data-ics="dd">📅 내보내기</button>' : ""}</h3>
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

/* ───── 구글 캘린더 → 사이트 (가져오기) ─────
   ① 자동: 구글 로그인으로 앞으로 N일 일정을 읽어 옴 (구글 클라우드에서 만든 OAuth 클라이언트 ID 필요, 설정에 한 번 붙여넣기)
   ② 파일: 구글 캘린더에서 내보낸 .ics 파일을 올리면 읽어 옴 (설정 필요 없음)
   고른 일정은 D-day 로 들어감 (이미 들어온 일정은 gid 로 구분해서 다시 안 들어감) */
const GCAL_DAYS = 120;
const gcfg = () => { const s = sch(); if (!s.gcal) s.gcal = { clientId: "" }; return s.gcal; };
let gisReady = null;
function loadGis() {
  if (gisReady) return gisReady;
  gisReady = new Promise((ok, fail) => {
    const sc = document.createElement("script");
    sc.src = "https://accounts.google.com/gsi/client"; sc.onload = ok; sc.onerror = () => { gisReady = null; fail(new Error("구글 로그인 스크립트를 불러오지 못했어요")); };
    document.head.appendChild(sc);
  });
  return gisReady;
}
async function gToken() {
  await loadGis();
  return new Promise((ok, fail) => {
    const tc = google.accounts.oauth2.initTokenClient({
      client_id: gcfg().clientId, scope: "https://www.googleapis.com/auth/calendar.readonly",
      callback: (r) => (r.error ? fail(new Error(r.error)) : ok(r.access_token)),
      error_callback: (e) => fail(new Error(e.message || e.type || "로그인 취소")),
    });
    tc.requestAccessToken();
  });
}
async function fetchGoogle(kind = "dd") {
  const token = await gToken();
  const H = { Authorization: "Bearer " + token };
  const cals = (await (await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader", { headers: H })).json()).items || [];
  const from = new Date(), to = new Date(Date.now() + GCAL_DAYS * 864e5), out = [];
  for (const c of cals.filter((c) => c.selected !== false)) {
    // 시간표: 반복 일정 원본(RRULE)을 그대로 받음 · D-day: 반복을 하나하나 펼쳐서 받음
    const q = new URLSearchParams(kind === "tt" ? { timeMin: from.toISOString(), singleEvents: "false", maxResults: "250" } : { timeMin: from.toISOString(), timeMax: to.toISOString(), singleEvents: "true", orderBy: "startTime", maxResults: "250" });
    const j = await (await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(c.id)}/events?${q}`, { headers: H })).json();
    if (kind === "tt") {
      for (const e of j.items || []) {
        const rr = (e.recurrence || []).find((r) => r.startsWith("RRULE:"));
        if (!rr || !e.start || !e.start.dateTime) continue;
        const w = weeklyOf(rr.slice(6), new Date(e.start.dateTime));
        if (w) out.push({ gid: e.id, title: e.summary || "(제목 없음)", days: w, start: hhmm(new Date(e.start.dateTime)), end: hhmm(new Date(e.end.dateTime)), cal: c.summaryOverride || c.summary || "" });
      }
      continue;
    }
    for (const e of j.items || []) {
      if (!e.start) continue;
      const allDay = !!e.start.date, st = allDay ? e.start.date : e.start.dateTime;
      const d = new Date(allDay ? st + "T00:00" : st);
      out.push({ gid: e.id, title: e.summary || "(제목 없음)", date: TS.dateKey(d), time: allDay ? "" : `${p2(d.getHours())}:${p2(d.getMinutes())}`, cal: c.summaryOverride || c.summary || "" });
    }
  }
  return out;
}
const hhmm = (d) => `${p2(d.getHours())}:${p2(d.getMinutes())}`;
// RRULE 이 "매주"(INTERVAL 1)이고 아직 안 끝났으면 요일 목록(0=일 … 6=토), 아니면 null
function weeklyOf(rule, start) {
  const R = Object.fromEntries(rule.split(";").map((kv) => kv.split("=")));
  if (R.FREQ !== "WEEKLY" || (R.INTERVAL && R.INTERVAL !== "1")) return null;
  if (R.UNTIL) { const u = R.UNTIL.match(/^(\d{4})(\d{2})(\d{2})/); if (u && `${u[1]}-${u[2]}-${u[3]}` < TS.today()) return null; }
  const BY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  const days = R.BYDAY ? R.BYDAY.split(",").map((d) => BY.indexOf(d.slice(-2))).filter((d) => d >= 0) : [start.getDay()];
  return days.length ? days : null;
}
// .ics 파일 읽기 (VEVENT 의 SUMMARY · DTSTART 만, 반복 일정은 첫 회만)
function parseIcs(text, kind = "dd") {
  const lines = text.replace(/\r?\n[ \t]/g, "").split(/\r?\n/), out = [];
  let ev = null;
  for (const l of lines) {
    if (l === "BEGIN:VEVENT") ev = {};
    else if (l === "END:VEVENT") { if (ev && ev.date) out.push(ev); ev = null; }
    else if (ev) {
      const i = l.indexOf(":"), key = l.slice(0, i), val = l.slice(i + 1);
      if (key.startsWith("SUMMARY")) ev.title = val.replace(/\\([,;\\])/g, "$1").replace(/\\n/gi, " ");
      else if (key.startsWith("UID")) ev.gid = val;
      else if (key === "RRULE") ev.rrule = val;
      else if (key.startsWith("DTEND")) { const d = icsDate(val); if (d) ev.endD = d; }
      else if (key.startsWith("DTSTART")) {
        const dd = icsDate(val); if (dd) ev.startD = dd;
        const m = val.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z?))?/);
        if (!m) continue;
        let d = new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
        if (m[7] === "Z") d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]));
        ev.date = TS.dateKey(d); ev.time = m[4] ? `${p2(d.getHours())}:${p2(d.getMinutes())}` : "";
      }
    }
  }
  if (kind === "tt") return out.filter((e) => e.rrule && e.time && e.startD && e.endD).map((e) => {
    const w = weeklyOf(e.rrule, e.startD);
    return w && { gid: e.gid || `${e.title}-${e.time}`, title: e.title || "(제목 없음)", days: w, start: hhmm(e.startD), end: hhmm(e.endD) };
  }).filter(Boolean);
  const today = TS.today(), until = TS.dateKey(new Date(Date.now() + GCAL_DAYS * 864e5));
  return out.filter((e) => e.date >= today && e.date <= until).map((e) => ({ ...e, title: e.title || "(제목 없음)", gid: e.gid || `${e.date}-${e.title}` }));
}
function icsDate(val) {
  const m = val.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z?))?/);
  if (!m) return null;
  return m[7] === "Z" ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])) : new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
}
// 반복 일정 고르기 → 시간표로
function pickImportTT(items, from) {
  const have = new Set(sch().tt.map((x) => x.gid).filter(Boolean));
  if (!items.length) return TS.toast("📅 매주 반복되는 일정이 없어요 (시간표는 '매주 반복' 일정만 가져와요)");
  items.sort((a, b) => Math.min(...a.days.map((d) => (d + 6) % 7)) - Math.min(...b.days.map((d) => (d + 6) % 7)) || a.start.localeCompare(b.start));
  TS.modal(`<h2>📥 ${from}에서 시간표 가져오기</h2>
    <p class="hint">구글 캘린더의 <b>매주 반복</b> 일정을 시간표로 넣어요. 넣을 것만 골라 주세요. (이미 넣은 일정은 회색)</p>
    <div class="gimp-tools"><button class="link" id="gi-all">전체 선택</button> · <button class="link" id="gi-none">전체 해제</button></div>
    <ul class="gimp-list">${items.map((e, i) => `<li class="${have.has(e.gid) ? "done" : ""}"><label>
      <input type="checkbox" data-gi="${i}" ${have.has(e.gid) ? "disabled" : "checked"}>
      <b>${e.days.slice().sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => DAYS[d]).join("·")} ${e.start}~${e.end}</b><span>${esc(e.title)}</span>${e.cal ? `<small>${esc(e.cal)}</small>` : ""}</label></li>`).join("")}</ul>
    <div class="modal-actions"><button class="btn white" data-close>취소</button><button class="btn yellow" id="gi-ok">시간표에 넣기</button></div>`,
  (el, close) => {
    const boxes = [...el.querySelectorAll("[data-gi]:not(:disabled)")];
    el.querySelector("#gi-all").onclick = () => boxes.forEach((b) => (b.checked = true));
    el.querySelector("#gi-none").onclick = () => boxes.forEach((b) => (b.checked = false));
    el.querySelector("#gi-ok").onclick = () => {
      const picked = boxes.filter((b) => b.checked).map((b) => items[+b.dataset.gi]);
      picked.forEach((e, i) => sch().tt.push({ id: uid(), gid: e.gid, title: e.title.slice(0, 30), days: e.days, start: e.start, end: e.end, color: COLORS[(sch().tt.length + i) % COLORS.length] }));
      TS.save(); close(); renderTT(); TS.refresh();
      TS.sfx("coin"); TS.toast(picked.length ? `🗓️ 시간표 ${picked.length}개 가져왔어요!` : "고른 일정이 없어요");
    };
  });
}
// 가져온 일정 고르기 → D-day 로
function pickImport(events, from) {
  const have = new Set(sch().dd.map((x) => x.gid).filter(Boolean));
  events.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const fresh = events.filter((e) => !have.has(e.gid));
  if (!events.length) return TS.toast(`📅 앞으로 ${GCAL_DAYS}일 안에 일정이 없어요`);
  TS.modal(`<h2>📥 ${from}에서 가져오기</h2>
    <p class="hint">D-day 로 넣을 일정을 골라 주세요. (앞으로 ${GCAL_DAYS}일 · 이미 넣은 일정은 회색)</p>
    <div class="gimp-tools"><button class="link" id="gi-all">전체 선택</button> · <button class="link" id="gi-none">전체 해제</button> · <label><input type="checkbox" id="gi-exam"> 시험·마감만</label></div>
    <ul class="gimp-list">${events.map((e, i) => `<li class="${have.has(e.gid) ? "done" : ""}"><label>
      <input type="checkbox" data-gi="${i}" ${have.has(e.gid) ? "disabled" : ""}>
      <b>${e.date.slice(5).replace("-", "/")}${e.time ? " " + e.time : ""}</b><span>${esc(e.title)}</span>${e.cal ? `<small>${esc(e.cal)}</small>` : ""}</label></li>`).join("")}</ul>
    <div class="modal-actions"><button class="btn white" data-close>취소</button><button class="btn yellow" id="gi-ok">D-day로 넣기</button></div>`,
  (el, close) => {
    const boxes = [...el.querySelectorAll("[data-gi]:not(:disabled)")];
    const KW = /시험|고사|평가|마감|제출|모의|수능|중간|기말|퀴즈|test|exam|due/i;
    el.querySelector("#gi-all").onclick = () => boxes.forEach((b) => (b.checked = true));
    el.querySelector("#gi-none").onclick = () => boxes.forEach((b) => (b.checked = false));
    el.querySelector("#gi-exam").onchange = (ev) => boxes.forEach((b) => (b.checked = ev.target.checked && KW.test(events[+b.dataset.gi].title)));
    boxes.forEach((b) => (b.checked = KW.test(events[+b.dataset.gi].title))); // 시험·마감은 미리 체크
    el.querySelector("#gi-ok").onclick = () => {
      const picked = boxes.filter((b) => b.checked).map((b) => events[+b.dataset.gi]);
      for (const e of picked) sch().dd.push({ id: uid(), gid: e.gid, title: e.title.slice(0, 30), date: e.date, time: e.time });
      TS.save(); close(); renderDD(); TS.refresh();
      TS.sfx("coin"); TS.toast(picked.length ? `📌 D-day ${picked.length}개 가져왔어요!` : "고른 일정이 없어요");
    };
  });
  if (!fresh.length) TS.toast("새로 가져올 일정이 없어요 (전부 이미 들어와 있어요)");
}
function openImport(kind = "dd") {
  const id = gcfg().clientId;
  TS.modal(`<h2>📥 구글 캘린더에서 ${kind === "tt" ? "시간표" : "D-day"} 가져오기</h2>
    ${kind === "tt" ? '<p class="hint">구글 캘린더에서 <b>매주 반복</b>으로 만든 일정(학원·수업 등)이 시간표로 들어와요.</p>' : ""}
    <div class="gimp-way">
      <h3>① 자동으로 가져오기 ${id ? '<span class="tag" style="background:#c6ecae">설정됨</span>' : '<span class="tag">처음 한 번 설정 필요</span>'}</h3>
      <p class="hint">구글 로그인 한 번으로 앞으로 ${GCAL_DAYS}일 일정을 읽어 와요 (읽기만 해요).</p>
      <div class="tt-row"><input id="gi-cid" placeholder="OAuth 클라이언트 ID (….apps.googleusercontent.com)" value="${esc(id)}" style="flex:1"><button class="btn yellow" id="gi-go">가져오기</button></div>
      <details class="gimp-help"><summary>클라이언트 ID 만드는 법 (10분, 처음 한 번만)</summary><ol>
        <li><a href="https://console.cloud.google.com/projectcreate" target="_blank" rel="noopener">구글 클라우드 콘솔</a>에서 새 프로젝트 만들기 (이름 아무거나)</li>
        <li><a href="https://console.cloud.google.com/apis/library/calendar-json.googleapis.com" target="_blank" rel="noopener">Google Calendar API</a> → <b>사용</b></li>
        <li><a href="https://console.cloud.google.com/auth/branding" target="_blank" rel="noopener">OAuth 동의 화면</a> → 시작하기 → 앱 이름·이메일 입력, 대상 <b>외부</b> → 만들기</li>
        <li>동의 화면의 <b>대상(Audience)</b> → 테스트 사용자에 <b>내 구글 이메일</b> 추가</li>
        <li><a href="https://console.cloud.google.com/auth/clients" target="_blank" rel="noopener">클라이언트</a> → 클라이언트 만들기 → 유형 <b>웹 애플리케이션</b><br>승인된 자바스크립트 원본에 <code>https://jyh0315.github.io</code> 추가 → 만들기</li>
        <li>나온 <b>클라이언트 ID</b>를 위 칸에 붙여넣고 가져오기</li>
      </ol><p class="hint">로그인할 때 "확인되지 않은 앱" 경고가 나오면 <b>고급 → (앱 이름)(으)로 이동</b>을 누르면 돼요 (내가 만든 앱이라 괜찮아요).</p></details>
    </div>
    <div class="gimp-way">
      <h3>② 파일로 가져오기 <span class="tag" style="background:#c6ecae">설정 필요 없음</span></h3>
      <p class="hint"><a href="https://calendar.google.com/calendar/r/settings/export" target="_blank" rel="noopener">구글 캘린더 설정 › 내보내기</a>로 받은 zip을 풀어서 나온 <b>.ics</b> 파일을 올려 주세요.</p>
      <input type="file" id="gi-file" accept=".ics,text/calendar" multiple>
    </div>
    <div class="modal-actions"><button class="btn white" data-close>닫기</button></div>`,
  (el, close) => {
    el.querySelector("#gi-go").onclick = async () => {
      const v = el.querySelector("#gi-cid").value.trim();
      if (!/\.apps\.googleusercontent\.com$/.test(v)) return TS.toast("클라이언트 ID는 ….apps.googleusercontent.com 으로 끝나요");
      gcfg().clientId = v; TS.save();
      const b = el.querySelector("#gi-go"); b.disabled = true; b.textContent = "불러오는 중…";
      try { const evs = await fetchGoogle(kind); close(); kind === "tt" ? pickImportTT(evs, "구글 캘린더") : pickImport(evs, "구글 캘린더"); }
      catch (err) { b.disabled = false; b.textContent = "가져오기"; TS.toast("가져오기 실패: " + err.message); }
    };
    el.querySelector("#gi-file").onchange = async (ev) => {
      const files = [...ev.target.files];
      if (!files.length) return;
      const texts = await Promise.all(files.map((f) => f.text()));
      close();
      if (kind === "tt") pickImportTT(texts.flatMap((t) => parseIcs(t, "tt")), "캘린더 파일");
      else pickImport(texts.flatMap((t) => parseIcs(t)), "캘린더 파일");
    };
  });
}

document.addEventListener("click", (e) => {
  const gi = e.target.closest("[data-gimport]");
  if (gi) return openImport(gi.dataset.gimport || "dd");
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
