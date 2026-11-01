/* =========================================================
   ♾️ 무한 레벨 등급 · 🎊 연말 정산
   - 레벨 10마다 등급(새싹 → … → 신화), 100부터는 '초월 ★n'으로 끝없이
     상단 레벨 배지 색이 등급마다 바뀜, 60레벨부터 등급 칭호
   - 연말 정산: 12/20 ~ 다음 해 1/31 로비 배너, 기록 탭에서 언제든 '올해 결산 미리보기'
     한 해 공부 시간 · 공부한 날 · 최고의 날/달 · 과목 · 연속 · 시간대 · 함께한 사도 · 수집 · 시즌
   테스트: ?recap=2026
   ========================================================= */
const LV_RANKS = [
  { from: 1,  name: "새싹",       icon: "🌱", c1: "#c6ecae", c2: "#7fcf6a" },
  { from: 10, name: "견습",       icon: "📘", c1: "#cfe6ff", c2: "#6cb8ff" },
  { from: 20, name: "정식",       icon: "📗", c1: "#d8f5e4", c2: "#3fbf7f" },
  { from: 30, name: "숙련",       icon: "📙", c1: "#ffe3c2", c2: "#ff9f43" },
  { from: 40, name: "베테랑",     icon: "🎖️", c1: "#ffd1dc", c2: "#ff5f8f" },
  { from: 50, name: "엘리트",     icon: "💠", c1: "#e3d6ff", c2: "#8a5cff" },
  { from: 60, name: "마스터",     icon: "🏅", c1: "#fff1a8", c2: "#e0a400" },
  { from: 70, name: "그랜드마스터", icon: "🏆", c1: "#ffe08a", c2: "#ff7a00" },
  { from: 80, name: "레전드",     icon: "👑", c1: "#ffb3b3", c2: "#d8253e" },
  { from: 90, name: "신화",       icon: "🌌", c1: "#b9a4ff", c2: "#3b1f8f" },
  { from: 100, name: "초월",      icon: "♾️", c1: "#a8fff0", c2: "#7c4dff" },
];
const LvRank = {
  of(lv) {
    const r = LV_RANKS.slice().reverse().find((x) => lv >= x.from) || LV_RANKS[0];
    const star = lv >= 100 ? Math.floor((lv - 100) / 10) + 1 : 0;
    return { ...r, star, label: star ? `${r.name} ★${star}` : r.name, idx: LV_RANKS.indexOf(r) };
  },
  upHTML(lv) {
    const r = LvRank.of(lv), prev = LvRank.of(lv - 1);
    if (r.label === prev.label) return `<p class="hint" style="margin:6px 0 0">${r.icon} ${r.label} 등급 · 다음 등급까지 ${10 - (lv % 10)}레벨</p>`;
    return `<p class="lvr-up" style="--c1:${r.c1};--c2:${r.c2}">${r.icon} 등급 상승! <b>${r.label}</b> 교주</p>`;
  },
};
window.LvRank = LvRank;
// 등급 칭호 (60레벨부터) + 초월
LV_RANKS.filter((r) => r.from >= 60).forEach((r) => PROFILE_TITLES.push({ id: "rk" + r.from, label: `${r.name} 교주`, cond: `레벨 ${r.from}`, ok: (s) => s.level >= r.from }));
PROFILE_TITLES.push({ id: "rk150", label: "초월 ★6 교주", cond: "레벨 150", ok: (s) => s.level >= 150 });
PROFILE_BADGES.push({ id: "lv100", icon: "♾️", label: "레벨 100", ok: (s) => s.level >= 100 });

(() => {
"use strict";
const TS = window.TS;
const $ = (id) => document.getElementById(id);
const S = () => TS.state;
const esc = TS.esc;

/* ───── 레벨 배지 색 ───── */
function paintLv() {
  const b = document.querySelector(".lv-badge"); if (!b) return;
  const r = LvRank.of(S().level);
  b.style.setProperty("--c1", r.c1); b.style.setProperty("--c2", r.c2);
  b.classList.add("lvr"); b.classList.toggle("lvr-top", r.from >= 60);
  b.title = `${r.label} 등급`;
  b.dataset.rank = r.icon;
}
TS.on("refresh", paintLv);
TS.on("levelup", paintLv);

/* ───── 올해 기록 (연말 정산용, 지금부터 쌓임) ───── */
const Y = (d = new Date()) => String(d.getFullYear());
function yr(y = Y()) {
  const st = S().stats;
  if (!st.yr) st.yr = {};
  if (!st.yr[y]) st.yr[y] = { subj: {}, partner: {}, hours: Array(24).fill(0), sessions: 0, todos: 0, hard: 0, pulls: 0, pokes: 0, lvStart: S().level, ownStart: Object.keys(S().owned).length, longest: 0 };
  return st.yr[y];
}
TS.on("focus", (x) => {
  const r = yr(), h = new Date().getHours();
  r.subj[x.subject || "기타"] = (r.subj[x.subject || "기타"] || 0) + x.min;
  if (x.partner) r.partner[x.partner] = (r.partner[x.partner] || 0) + x.min;
  // 끝난 시각 기준으로 공부한 시간대에 나눠 담기
  let left = x.min, hh = h;
  while (left > 0) { const m = Math.min(60, left); r.hours[(hh + 24) % 24] += m; left -= m; hh--; }
  if (x.full) r.sessions++;
  r.longest = Math.max(r.longest, x.min);
  TS.save();
});
TS.on("todo", (t) => { const r = yr(); r.todos++; if (t.diff === "hard") r.hard++; });
TS.on("pull", (res) => { yr().pulls += res.length; });
TS.on("poke", () => { yr().pokes++; });
TS.on("start", () => { yr(); });

/* ───── 계산 ───── */
function calc(y) {
  const s = S(), st = s.stats, r = (st.yr && st.yr[y]) || null;
  const days = Object.entries(st.days || {}).filter(([d, m]) => d.startsWith(y) && m > 0).sort();
  const total = days.reduce((a, [, m]) => a + m, 0);
  const months = Array(12).fill(0), wd = Array(7).fill(0);
  days.forEach(([d, m]) => { months[+d.slice(5, 7) - 1] += m; wd[new Date(d + "T00:00").getDay()] += m; });
  const best = days.reduce((b, x) => (x[1] > b[1] ? x : b), ["", 0]);
  // 그해 가장 긴 연속 공부
  let streak = 0, cur = 0, prev = null;
  days.forEach(([d]) => {
    const t = new Date(d + "T00:00").getTime();
    cur = prev && Math.round((t - prev) / 864e5) === 1 ? cur + 1 : 1; prev = t; streak = Math.max(streak, cur);
  });
  const subjSrc = r && Object.keys(r.subj).length ? r.subj : st.subjects || {};
  const subj = Object.entries(subjSrc).filter(([, m]) => m > 0).sort((a, b) => b[1] - a[1]);
  const pEntries = r ? Object.entries(r.partner).sort((a, b) => b[1] - a[1]) : [];
  const partner = pEntries.length ? pEntries[0][0] : s.partner;
  const hours = r && r.hours.some((x) => x) ? r.hours : null;
  const seasons = Object.entries((s.season && s.season.hist) || {}).filter(([id]) => id.startsWith(y)).map(([id, v]) => ({ id, ...v }));
  if (s.season && s.season.id.startsWith(y) && window.SeasonPass) seasons.push({ id: s.season.id, lv: window.SeasonPass.lv(), sp: s.season.sp, now: true });
  return { y, total, days: days.length, months, wd, best, streak, subj, partner, partnerMin: pEntries.length ? pEntries[0][1] : 0, hours, seasons, r,
    lvGain: r ? s.level - r.lvStart : s.level - 1, level: s.level, owned: Object.keys(s.owned).length, ownGain: r ? Object.keys(s.owned).length - r.ownStart : Object.keys(s.owned).length };
}
const hm = (m) => (m >= 60 ? `${Math.floor(m / 60)}시간${m % 60 ? ` ${m % 60}분` : ""}` : `${m}분`);
const md = (d) => `${+d.slice(5, 7)}월 ${+d.slice(8, 10)}일`;
function timeType(h) {
  if (!h) return null;
  const sum = (a, b) => h.slice(a, b).reduce((x, y) => x + y, 0);
  const g = [["🌅 아침형 교주", "해 뜨는 시간에 제일 집중했어요", sum(5, 11)], ["☀️ 한낮의 교주", "낮에 꾸준히 달렸어요", sum(11, 17)],
    ["🌆 저녁형 교주", "저녁에 불태웠어요", sum(17, 22)], ["🦉 올빼미 교주", "모두 잠든 밤에 공부했어요", sum(22, 24) + sum(0, 5)]];
  const top = g.sort((a, b) => b[2] - a[2])[0];
  const peak = h.indexOf(Math.max(...h));
  return { name: top[0], desc: top[1], peak };
}
function persona(c) {
  const avg = c.days ? c.total / c.days : 0;
  if (c.streak >= 30) return ["🐢 꾸준함의 화신", "멈추지 않는 거북이는 결국 결승선에 닿아요."];
  if (c.best[1] >= avg * 3 && c.best[1] >= 240) return ["🌪️ 몰아치는 폭풍", "한 번 불붙으면 아무도 못 말려요!"];
  if (c.subj.length >= 5 && c.subj[0][1] < c.total * 0.35) return ["⚖️ 균형 잡힌 현자", "모든 과목을 골고루 사랑했어요."];
  if (c.days >= 150) return ["📚 성실한 책벌레", "공부가 생활이 된 한 해였어요."];
  if (c.total >= 6000) return ["🔥 열정 가득 교주", "엄청난 시간을 쏟아부었어요!"];
  return ["🌱 쑥쑥 자라는 새싹", "이제 막 시작된 여정, 내년이 더 기대돼요!"];
}

/* ───── 슬라이드 ───── */
function slides(c) {
  const ch = TS.SADO_MAP[c.partner] || TS.SADO_MAP[S().partner], nm = ch ? TS.shortName(ch) : "";
  const face = ch ? `<img class="yr-chibi" src="${TS.chibiSrc(ch)}" alt="">` : "";
  const say = (t) => (ch ? `<p class="yr-say">${face}<span>${esc(TS.fmt(t, ch))}</span></p>` : "");
  const mx = Math.max(1, ...c.months), bestM = c.months.indexOf(Math.max(...c.months));
  const tt = timeType(c.hours), [pName, pDesc] = persona(c);
  const out = [];
  out.push(`<div class="yr-s yr-intro"><small>TRICKSTUDY</small><h1>${c.y}<br>연말 정산</h1><p>교주님의 한 해를 돌아볼게요</p>${ch ? `<img class="yr-big" src="${TS.portrait(ch)}" alt="">` : ""}</div>`);
  out.push(`<div class="yr-s"><p class="yr-k">올해 집중한 시간</p><h2 class="yr-num">${Math.floor(c.total / 60).toLocaleString()}<small>시간</small> ${c.total % 60}<small>분</small></h2>
    <p>영화 <b>${Math.round(c.total / 120)}</b>편을 볼 수 있는 시간이에요</p>
    <p class="yr-k" style="margin-top:22px">공부한 날</p><h2 class="yr-num">${c.days}<small>일</small></h2>
    ${say(c.days >= 100 ? "{name}는 교주님이 매일 오는 게 제일 좋았어요!" : "같이 공부한 날들, 하나하나 다 기억하고 있어요!")}</div>`);
  out.push(`<div class="yr-s"><p class="yr-k">가장 불태운 달</p><h2 class="yr-num">${bestM + 1}<small>월</small></h2>
    <div class="yr-bars">${c.months.map((m, i) => `<span class="${i === bestM ? "on" : ""}"><i style="height:${(m / mx) * 100}%"></i><small>${i + 1}</small></span>`).join("")}</div>
    ${c.best[0] ? `<p>최고의 하루는 <b>${md(c.best[0])}</b> — 무려 <b>${hm(c.best[1])}</b>!</p>` : ""}</div>`);
  if (c.subj.length) {
    const tot = c.subj.reduce((a, [, m]) => a + m, 0);
    out.push(`<div class="yr-s"><p class="yr-k">가장 많이 공부한 과목</p><h2 class="yr-num yr-word">${esc(c.subj[0][0])}</h2>
      <ol class="yr-rank">${c.subj.slice(0, 5).map(([n, m], i) => `<li><b>${i + 1}</b><span>${esc(n)}</span><em><i style="width:${(m / c.subj[0][1]) * 100}%"></i></em><small>${Math.round((m / tot) * 100)}%</small></li>`).join("")}</ol></div>`);
  }
  out.push(`<div class="yr-s"><p class="yr-k">최장 연속 공부</p><h2 class="yr-num">${c.streak}<small>일</small></h2>
    ${tt ? `<p class="yr-k" style="margin-top:22px">교주님의 공부 시간대</p><h2 class="yr-num yr-word">${tt.name}</h2><p>${tt.desc} · 가장 많이 공부한 시간 <b>${tt.peak}시</b></p>
      <div class="yr-hours">${c.hours.map((m, i) => `<i style="height:${(m / Math.max(1, ...c.hours)) * 100}%" title="${i}시"></i>`).join("")}</div>` : ""}
    ${c.r ? `<p>끝까지 집중 <b>${c.r.sessions}</b>회 · 의뢰 해결 <b>${c.r.todos}</b>개${c.r.longest ? ` · 한 번에 최장 <b>${hm(c.r.longest)}</b>` : ""}</p>` : ""}</div>`);
  if (ch) out.push(`<div class="yr-s"><p class="yr-k">올해 가장 오래 함께한 사도</p><img class="yr-big" src="${TS.portrait(ch)}" alt=""><h2 class="yr-num yr-word">${esc(ch.name)}</h2>
    ${c.partnerMin ? `<p>함께한 집중 <b>${hm(c.partnerMin)}</b></p>` : ""}${say("올해 {name}와 함께해 줘서 고마워요, 교주님. 내년에도 옆에 있을게요!")}</div>`);
  out.push(`<div class="yr-s"><p class="yr-k">성장 기록</p>
    <div class="yr-grid">
      <div><small>교주 레벨</small><b>Lv.${c.level}</b><em>+${c.lvGain}</em></div>
      <div><small>등급</small><b>${LvRank.of(c.level).icon} ${LvRank.of(c.level).label}</b></div>
      <div><small>사도</small><b>${c.owned}명</b><em>${c.ownGain >= 0 ? "+" : ""}${c.ownGain}</em></div>
      <div><small>모집</small><b>${c.r ? c.r.pulls : S().stats.pulls}회</b></div>
      ${c.seasons.map((x) => { const I = Season.info(x.id); return `<div><small>${I.K.icon} ${esc(I.full)}${x.now ? " (진행 중)" : ""}</small><b>${x.lv}단계</b></div>`; }).join("")}
      ${S().reborn ? `<div><small>환생</small><b>🔁 ${S().reborn.n}회</b></div>` : ""}
    </div></div>`);
  out.push(`<div class="yr-s yr-end"><p class="yr-k">${c.y} 교주님은…</p><h2 class="yr-num yr-word">${pName}</h2><p>${pDesc}</p>
    <div class="yr-card">
      <b>${esc(S().name)} · ${c.y}</b>
      <span>⏰ ${hm(c.total)}</span><span>📅 ${c.days}일</span><span>🔥 ${c.streak}일 연속</span>
      ${c.subj.length ? `<span>📚 ${esc(c.subj[0][0])}</span>` : ""}${ch ? `<span>💛 ${esc(nm)}</span>` : ""}<span>${LvRank.of(c.level).icon} Lv.${c.level}</span>
    </div>
    ${say(+c.y < new Date().getFullYear() || new Date().getMonth() === 11 ? "내년에도 같이 공부해요! 새해 복 많이 받으세요, 교주님!" : "아직 올해가 남았어요! 끝까지 같이 달려요!")}
    <button class="btn yellow" data-yrclose>닫기</button></div>`);
  return out;
}
function open(y = Y()) {
  const c = calc(y), list = slides(c);
  let i = 0;
  const ov = document.createElement("div");
  ov.className = "yr-overlay";
  // 배경: 해금한 일러스트가 장마다 바뀌며 천천히 줌 + 색 필터 + 눈·별 파티클 + 사도 퍼레이드
  const bgs = (S().unlockedBg || []).filter((id) => BACKGROUNDS.some((b) => b.id === id));
  const pool = bgs.length >= 3 ? bgs : BACKGROUNDS.map((b) => b.id);
  const R = (a, b) => a + Math.random() * (b - a);
  const parts = Array.from({ length: 34 }, (_, k) => {
    const ch = k % 3 === 0 ? "❄" : k % 3 === 1 ? "✦" : "•";
    return `<i class="yr-pt ${k % 3 === 1 ? "tw" : ""}" style="left:${R(0, 100)}%;font-size:${R(8, k % 3 === 0 ? 22 : 14)}px;animation-duration:${R(9, 20)}s,${R(1.5, 4)}s;animation-delay:-${R(0, 20)}s,-${R(0, 4)}s;opacity:${R(.35, .9)}">${ch}</i>`;
  }).join("");
  const own = Object.keys(S().owned).sort(() => Math.random() - 0.5).slice(0, 9).map((id) => TS.SADO_MAP[id]).filter(Boolean);
  // 움직이는 사도(Spine)가 되는 사도를 앞으로 → 최대 PARADE_LIVE명은 애니메이션, 나머지는 그림
  const PARADE_LIVE = 5;
  const canL = (c) => window.Live && window.Live.canLive(c.id);
  own.sort((a, b) => canL(b) - canL(a));
  const nLive = own.filter(canL).length;
  const cnt = Math.min(own.length, nLive >= 3 ? Math.min(nLive, PARADE_LIVE) : own.length);
  const parade = own.slice(0, cnt).map((c, k) => `<div class="yr-pd ${k < PARADE_LIVE && canL(c) ? "live" : ""}" data-pd="${c.id}" style="left:${(k + 0.5) * (100 / cnt)}%;animation-delay:-${R(0, 3)}s"></div>`).join("");
  ov.innerHTML = `<div class="yr-bg"><div class="yr-img"></div><div class="yr-img"></div><div class="yr-tint"></div><div class="yr-orb o1"></div><div class="yr-orb o2"></div><div class="yr-orb o3"></div></div>
    <div class="yr-parts">${parts}</div><div class="yr-parade">${parade}</div>
    <div class="yr-prog">${list.map(() => "<i></i>").join("")}</div><button class="yr-x" data-yrclose>✕</button><div class="yr-stage"></div><p class="yr-tip">화면을 눌러 넘기기</p>`;
  document.body.appendChild(ov);
  const lives = [];
  ov.querySelectorAll(".yr-pd").forEach((el) => {
    const c = TS.SADO_MAP[el.dataset.pd];
    const img = () => { el.classList.remove("live"); if (!el.querySelector("img")) el.innerHTML = `<img src="${TS.chibiSrc(c)}" alt="">`; };
    const l = el.classList.contains("live") ? window.Live.mount(el, c.id, { frame: "story", onFail: img }) : null;
    if (l) lives.push(l); else img();
  });
  const PAL = [["#2a1b5e", "#c2185b"], ["#0f2a5e", "#6a3cff"], ["#5e1b3a", "#ff7a3c"], ["#123f4a", "#2bb39b"], ["#1b1446", "#3f6bff"], ["#4a1240", "#ff5fa2"], ["#3b2a0e", "#e0a400"], ["#2a1b5e", "#ff8fb1"]];
  let flip = 0;
  const show = () => {
    const imgs = ov.querySelectorAll(".yr-img");
    flip ^= 1;
    imgs[flip].style.backgroundImage = `url("assets/bg/${pool[(i * 3 + y.length) % pool.length]}.jpg")`;
    imgs[flip].classList.add("on"); imgs[flip ^ 1].classList.remove("on");
    imgs[flip].style.animation = "none"; void imgs[flip].offsetWidth; imgs[flip].style.animation = "";
    const [a, b] = PAL[i % PAL.length];
    ov.style.setProperty("--ya", a); ov.style.setProperty("--yb", b);
    ov.classList.toggle("yr-last", i === list.length - 1);
    ov.querySelector(".yr-stage").innerHTML = list[i];
    ov.querySelectorAll(".yr-prog i").forEach((b, k) => b.classList.toggle("on", k <= i));
    if (i === list.length - 1) { TS.confetti && TS.confetti(80); TS.sfx("level"); } else TS.sfx("click");
  };
  ov.addEventListener("click", (e) => {
    if (e.target.closest("[data-yrclose]")) { lives.forEach((l) => { try { l.dispose(); } catch (_) { /* 무시 */ } }); ov.remove(); const s = S(); s.recapSeen = s.recapSeen || {}; s.recapSeen[y] = 1; TS.save(); renderBanner(); return; }
    const back = e.clientX < window.innerWidth * 0.3;
    i = Math.max(0, Math.min(list.length - 1, i + (back ? -1 : 1)));
    show();
  });
  show();
}

/* ───── 입구: 로비 배너 (12/20 ~ 1/31) · 기록 탭 ───── */
function recapYear() {
  const d = new Date(), m = d.getMonth() + 1, day = d.getDate();
  if (m === 12 && day >= 20) return Y(d);
  if (m === 1) return String(d.getFullYear() - 1);
  return null;
}
function renderBanner() {
  const y = recapYear(), lobby = $("view-lobby");
  let b = $("yr-banner");
  if (!y || !lobby || !S().started) { if (b) b.remove(); return; }
  if (!b) { b = document.createElement("button"); b.id = "yr-banner"; b.className = "yr-banner"; b.onclick = () => open(recapYear()); lobby.prepend(b); }
  const seen = S().recapSeen && S().recapSeen[y];
  b.innerHTML = `🎊 <b>${y} 연말 정산</b> 도착! <small>${seen ? "다시 보기" : "교주님의 한 해를 확인해 봐요"}</small>${seen ? "" : '<em class="sn-lb-new">NEW</em>'}`;
}
function statsEntry() {
  const host = $("grass-card"); if (!host) return;
  let box = $("yr-entry");
  if (!box) { box = document.createElement("div"); box.id = "yr-entry"; box.className = "card yr-entry"; host.before(box); }
  const years = [...new Set(Object.keys(S().stats.days || {}).map((d) => d.slice(0, 4)))].sort().reverse();
  if (!years.includes(Y())) years.unshift(Y());
  const r = LvRank.of(S().level), next = r.from >= 100 ? (Math.floor(S().level / 10) + 1) * 10 : (LV_RANKS[r.idx + 1] || {}).from;
  box.innerHTML = `<h3 class="card-title">🎊 연말 정산 · ♾️ 레벨 등급</h3>
    <div class="yr-entry-row">
      <span class="lvr-chip" style="--c1:${r.c1};--c2:${r.c2}">${r.icon} ${r.label}</span>
      <small>Lv.${S().level} · 다음 등급까지 ${Math.max(0, next - S().level)}레벨 (25레벨부터 레벨업 경험치 고정, 끝없이 올라가요)</small>
    </div>
    <div class="yr-entry-row">${years.map((y) => `<button class="btn ${y === Y() ? "yellow" : "white"} small" data-yropen="${y}">${y === Y() ? `📊 ${y} 결산 미리보기` : `📜 ${y} 연말 정산`}</button>`).join("")}</div>`;
  box.querySelectorAll("[data-yropen]").forEach((b) => (b.onclick = () => open(b.dataset.yropen)));
}
TS.on("refresh", (v) => { if (v === "stats") statsEntry(); if (v === "lobby") renderBanner(); });
TS.on("start", renderBanner);
try { const q = new URLSearchParams(location.search).get("recap"); if (q) TS.on("start", () => setTimeout(() => open(q), 600)); } catch (e) { /* 무시 */ }

paintLv();
window.Recap = { open, calc };
})();
