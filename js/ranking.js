/* =========================================================
   🏆 랭킹 — Firebase Realtime Database (REST API, SDK 없음)
   데이터 위치: /ranking/<uid>
   apiKey 를 넣고 Firebase 콘솔에서 '익명 로그인'을 켜면
   다른 사람이 내 기록을 덮어쓰지 못하게 보호할 수 있음 (README 참고)
   ========================================================= */
const FIREBASE = {
  dbURL: "https://trickstudy-default-rtdb.asia-southeast1.firebasedatabase.app",
  apiKey: "", // 선택: 프로젝트 설정 → 웹 API 키
};

(() => {
"use strict";
const TS = window.TS;
const $ = (id) => document.getElementById(id);
const S = () => TS.state;
const esc = TS.esc;
const AUTH_KEY = "trickcal-rank-auth";

function rk() {
  const s = S();
  if (!s.rank) s.rank = { on: true, uid: "u" + Array.from(crypto.getRandomValues(new Uint8Array(10)), (b) => b.toString(16).padStart(2, "0")).join("") };
  return s.rank;
}

/* ───── 익명 로그인 (apiKey 가 있을 때만) ───── */
async function auth() {
  if (!FIREBASE.apiKey) return { uid: rk().uid, token: "" };
  let a = null;
  try { a = JSON.parse(localStorage.getItem(AUTH_KEY)); } catch (e) { /* 없음 */ }
  if (a && a.exp > Date.now() + 60000) return { uid: a.uid, token: a.idToken };
  let res, j;
  if (a && a.refreshToken) {
    res = await fetch(`https://securetoken.googleapis.com/v1/token?key=${FIREBASE.apiKey}`, {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=refresh_token&refresh_token=" + encodeURIComponent(a.refreshToken),
    });
    j = await res.json();
    if (res.ok) a = { uid: j.user_id, idToken: j.id_token, refreshToken: j.refresh_token, exp: Date.now() + j.expires_in * 1000 };
  }
  if (!res || !res.ok) {
    res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE.apiKey}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ returnSecureToken: true }),
    });
    j = await res.json();
    if (!res.ok) throw new Error("익명 로그인 실패: " + ((j.error && j.error.message) || res.status));
    a = { uid: j.localId, idToken: j.idToken, refreshToken: j.refreshToken, exp: Date.now() + j.expiresIn * 1000 };
  }
  localStorage.setItem(AUTH_KEY, JSON.stringify(a));
  return { uid: a.uid, token: a.idToken };
}
async function api(path, opts = {}) {
  const { uid, token } = await auth();
  const url = `${FIREBASE.dbURL}/${path.replace("{uid}", uid)}.json${token ? "?auth=" + token : ""}`;
  const res = await fetch(url, opts);
  if (!res.ok) {
    let msg = res.status;
    try { msg = (await res.json()).error || msg; } catch (e) { /* 무시 */ }
    throw new Error(String(msg));
  }
  return { uid, data: await res.json() };
}

/* ───── 내 기록 올리기 ───── */
function myEntry() {
  const s = S(), st = s.stats, wk = TS.weekKey(), td = TS.today();
  const wkMin = Object.entries(st.days).filter(([d]) => d >= wk).reduce((a, [, m]) => a + m, 0);
  const b = s.boss && s.boss.week === wk ? s.boss.dmg : 0;
  return {
    name: String(s.name).slice(0, 12), lv: s.level, partner: s.partner || "",
    week: wk, weekMin: wkMin, day: td, dayMin: st.days[td] || 0,
    total: st.totalMin, sado: Object.keys(s.owned).length,
    boss: Math.round(b), streak: st.streak, t: Date.now(),
    p: window.Profile ? window.Profile.publicProfile() : null, // 꾸민 프로필
    ...Object.assign({}, ...RANK_EXTRA.map((fn) => fn())),     // 이벤트 등 모듈 추가 필드
  };
}
let upTimer = 0, lastErr = "";
async function upload() {
  if (!rk().on || !S().started) return;
  try {
    await api("ranking/{uid}", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(myEntry()) });
    lastErr = "";
  } catch (e) { lastErr = e.message; console.warn("ranking upload", e); }
}
function scheduleUpload(ms = 3000) { clearTimeout(upTimer); upTimer = setTimeout(upload, ms); }
["focus", "levelup", "pull", "todo", "start", "partner", "profile"].forEach((ev) => TS.on(ev, () => scheduleUpload()));

/* ───── 랭킹 화면 ───── */
const RANK_EXTRA = window.RANK_EXTRA = [];   // () => 랭킹에 올릴 추가 필드
const TABS = window.RANK_TABS = [
  { id: "week",  label: "이번 주",  val: (e, wk) => (e.week === wk ? e.weekMin : 0), fmt: "min" },
  { id: "day",   label: "오늘",     val: (e, wk, td) => (e.day === td ? e.dayMin : 0), fmt: "min" },
  { id: "total", label: "누적",     val: (e) => e.total, fmt: "min" },
  { id: "boss",  label: "보스 딜",  val: (e, wk) => (e.week === wk ? e.boss : 0), fmt: "dmg" },
  { id: "lv",    label: "레벨",     val: (e) => e.lv, fmt: "lv" },
  { id: "sado",  label: "사도 수",  val: (e) => e.sado, fmt: "sado" },
];
let tab = "week", cache = null, cacheAt = 0, loading = false, loadErr = "";
const num = (v, max = 1e7) => (Number.isFinite(+v) ? Math.max(0, Math.min(max, Math.round(+v))) : 0);
function clean(uid, e) {
  if (!e || typeof e !== "object") return null;
  return {
    uid, name: String(e.name || "???").slice(0, 12), lv: num(e.lv, 999), partner: TS.SADO_MAP[e.partner] ? e.partner : "", p: e.p,
    week: String(e.week || ""), weekMin: num(e.weekMin), day: String(e.day || ""), dayMin: num(e.dayMin, 1440),
    total: num(e.total), sado: num(e.sado, 999), boss: num(e.boss), streak: num(e.streak, 9999), t: num(e.t, 1e15),
    ev: e.ev && typeof e.ev === "object" ? { id: String(e.ev.id || "").slice(0, 24), c: num(e.ev.c) } : null,
  };
}
const fmtVal = (v, f) => f === "min" ? (v >= 60 ? `${Math.floor(v / 60)}시간 ${v % 60}분` : `${v}분`)
  : f === "dmg" ? v.toLocaleString() : f === "lv" ? `Lv.${v}` : f === "charm" ? `🧧 ${v.toLocaleString()}` : `${v}명`;
const ago = (t) => { const m = Math.floor((Date.now() - t) / 60000); return m < 1 ? "방금" : m < 60 ? `${m}분 전` : m < 1440 ? `${Math.floor(m / 60)}시간 전` : `${Math.floor(m / 1440)}일 전`; };

async function load(force) {
  if (loading || (!force && cache && Date.now() - cacheAt < 30000)) return;
  loading = true; loadErr = ""; render();
  try {
    if (rk().on) await upload();
    const { uid, data } = await api("ranking");
    meUid = uid;
    cache = Object.entries(data || {}).map(([u, e]) => clean(u, e)).filter(Boolean);
    cacheAt = Date.now();
  } catch (e) {
    loadErr = e.message;
  }
  loading = false;
  if (TS.view === "rank") render();
}
async function myUid() { try { return (await auth()).uid; } catch (e) { return rk().uid; } }
let meUid = "";

function render() {
  const el = $("view-rank");
  const t = TABS.find((x) => x.id === tab), wk = TS.weekKey(), td = TS.today();
  const list = (cache || []).map((e) => ({ e, v: t.val(e, wk, td) })).sort((a, b) => b.v - a.v || b.e.lv - a.e.lv);
  const shown = list.filter((x) => x.v > 0 || tab === "lv" || tab === "sado");
  const myIdx = shown.findIndex((x) => x.e.uid === meUid);
  // 꾸민 프로필 (없으면 기본)
  const pp = (e) => {
    const x = window.Profile ? window.Profile.cleanProfile(e.p) : { ti: "rookie", fr: "basic", th: "cream", av: "", m: "", b: [] };
    if (!x.av) x.av = e.partner;
    return x;
  };
  const av = (e) => (window.Profile ? window.Profile.avatarHTML(pp(e)) : `<img src="${face(e)}" alt="">`);
  const titleOf = (e) => (window.Profile ? (PROFILE_TITLES.find((x) => x.id === pp(e).ti) || PROFILE_TITLES[0]).label : "");
  const face = (e) => {
    const c = TS.SADO_MAP[e.partner];
    return c ? TS.chibiSrc(c) : "assets/chibi/erpin.webp?v=2";
  };
  const podium = shown.slice(0, 3);
  el.innerHTML = `
    <div class="card rank-head">
      <h2 class="ribbon">교주 랭킹</h2>
      <div class="rank-me">
        ${myIdx >= 0 ? `내 순위 <b>${myIdx + 1}위</b> / ${shown.length}명 · ${fmtVal(shown[myIdx].v, t.fmt)}` : rk().on ? "아직 순위에 없어요. 공부하면 바로 올라가요!" : "랭킹에 참여하지 않는 중"}
        <span class="rank-tools">
          <label class="check"><input type="checkbox" id="rk-on" ${rk().on ? "checked" : ""}> 랭킹 참여</label>
          <button class="btn white small" id="rk-refresh">${loading ? "불러오는 중…" : "🔄 새로고침"}</button>
        </span>
      </div>
      <div class="seg rank-seg">${TABS.filter((x) => !x.show || x.show()).map((x) => `<button data-rt="${x.id}" class="${x.id === tab ? "on" : ""}">${x.label}</button>`).join("")}</div>
    </div>
    ${loadErr ? `<div class="card rank-err"><b>랭킹 서버에 연결하지 못했어요</b><p>${esc(loadErr)}</p><p class="hint">Firebase 콘솔 → Realtime Database → 규칙(Rules)에서 <code>ranking</code> 읽기/쓰기가 허용돼 있는지 확인해 주세요. (README에 규칙 예시가 있어요)</p></div>` : ""}
    ${lastErr && !loadErr ? `<p class="hint">⚠️ 내 기록 업로드 실패: ${esc(lastErr)}</p>` : ""}
    ${podium.length ? `<div class="podium">${[1, 0, 2].filter((i) => podium[i]).map((i) => {
      const { e, v } = podium[i];
      return `<div class="pod p${i + 1} th-${pp(e).th} ${e.uid === meUid ? "me" : ""}" data-who="${esc(e.uid)}">
        <span class="medal">${["🥇", "🥈", "🥉"][i]}</span>
        <div class="pod-card">
        ${av(e)}
        <span class="pc-title">${esc(titleOf(e))}</span>
        <b>${esc(e.name)}</b><small>Lv.${e.lv}</small>
        <em>${fmtVal(v, t.fmt)}</em>
        </div>
        <div class="pod-base">${i + 1}</div></div>`;
    }).join("")}</div>` : ""}
    <div class="card ${loadErr && !cache ? "hidden" : ""}">
      <ol class="rank-list">${shown.slice(3).map((x, i) => `<li class="th-${pp(x.e).th} ${x.e.uid === meUid ? "me" : ""}" data-who="${esc(x.e.uid)}">
        <span class="rk">${i + 4}</span>${av(x.e)}<span class="nm"><span class="pc-title">${esc(titleOf(x.e))}</span> ${esc(x.e.name)} <small>Lv.${x.e.lv}${x.e.streak > 1 ? ` · 🔥${x.e.streak}일` : ""}${pp(x.e).b.length ? " · " + pp(x.e).b.map((id) => (PROFILE_BADGES.find((z) => z.id === id) || {}).icon).join("") : ""}</small>${pp(x.e).m ? `<em class="rk-msg">“${esc(pp(x.e).m)}”</em>` : ""}</span>
        <b>${fmtVal(x.v, t.fmt)}</b><small class="ago">${ago(x.e.t)}</small></li>`).join("") ||
        `<li class="empty">${cache ? (shown.length ? "4위부터는 아직 아무도 없어요!" : "아직 기록이 없어요. 첫 번째 교주가 되어보세요!") : loading ? "불러오는 중…" : ""}</li>`}</ol>
      ${cacheAt ? `<p class="hint">업데이트: ${ago(cacheAt)} · 기록은 집중·의뢰·레벨업 때 자동으로 올라가요</p>` : ""}
    </div>`;
  el.querySelectorAll("[data-rt]").forEach((b) => (b.onclick = () => { tab = b.dataset.rt; TS.sfx("click"); render(); }));
  el.querySelectorAll("[data-who]").forEach((r) => (r.onclick = () => {
    const e = (cache || []).find((x) => x.uid === r.dataset.who);
    if (e && window.Profile) window.Profile.view(e);
  }));
  $("rk-refresh").onclick = () => load(true);
  $("rk-on").onchange = async (e) => {
    rk().on = e.target.checked; TS.save();
    if (!rk().on) {
      try { await api("ranking/{uid}", { method: "DELETE" }); TS.toast("랭킹에서 내 기록을 지웠어요"); } catch (err) { TS.toast("삭제 실패: " + err.message); }
      cache = (cache || []).filter((x) => x.uid !== meUid);
    } else { TS.toast("랭킹 참여!"); load(true); }
    render();
  };
}
TS.views.rank = () => { render(); load(false); };
TS.on("boot", async () => { meUid = await myUid(); });
})();
