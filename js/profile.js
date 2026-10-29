/* =========================================================
   🪪 프로필 꾸미기 — 칭호 · 프레임 · 카드 테마 · 프로필 사도 · 한마디 · 뱃지
   꾸민 프로필은 랭킹에도 그대로 보임
   해금 조건은 아래 목록의 ok(s) 에서 바꿀 수 있음
   ========================================================= */
const bossKills = (s) => (s.bossHist || []).filter((h) => h.dmg >= h.max).length + (s.boss && s.boss.dmg >= s.boss.max ? 1 : 0);
const maxAff = (s) => Math.max(1, ...Object.keys(s.aff || {}).map((id) => (window.Affection ? window.Affection.level(id) : 1)));
const ownedN = (s) => Object.keys(s.owned).length;
const ssrN = (s) => SADO.filter((c) => c.rarity === 3 && s.owned[c.id]).length;

const PROFILE_TITLES = [
  { id: "rookie",    label: "새내기 교주",    cond: "기본",              ok: () => true },
  { id: "diligent",  label: "성실한 교주",    cond: "누적 집중 10시간",   ok: (s) => s.stats.totalMin >= 600 },
  { id: "scholar",   label: "엘리아스 수석",  cond: "누적 집중 50시간",   ok: (s) => s.stats.totalMin >= 3000 },
  { id: "attend",    label: "개근상",         cond: "7일 연속 공부",      ok: (s) => s.stats.bestStreak >= 7 },
  { id: "hunter",    label: "보스 사냥꾼",    cond: "보스 1회 격파",      ok: (s) => bossKills(s) >= 1 },
  { id: "slayer",    label: "보스 학살자",    cond: "보스 5회 격파",      ok: (s) => bossKills(s) >= 5 },
  { id: "balance",   label: "골고루 박사",    cond: "주간 밸런스 80점",   ok: (s) => (s.stats.bestBalance || 0) >= 80 },
  { id: "collector", label: "사도 수집가",    cond: "사도 30명 영입",     ok: (s) => ownedN(s) >= 30 },
  { id: "lover",     label: "사도 바라기",    cond: "호감도 Lv5 사도",    ok: (s) => maxAff(s) >= 5 },
  { id: "poker",     label: "볼따구 장인",    cond: "볼 찌르기 100번",    ok: (s) => s.stats.pokes >= 100 },
  { id: "gacha",     label: "모집 중독",      cond: "모집 100회",         ok: (s) => s.stats.pulls >= 100 },
  { id: "legend",    label: "전설의 교주",    cond: "레벨 20",            ok: (s) => s.level >= 20 },
];
const PROFILE_FRAMES = [
  { id: "basic",   label: "기본",   cond: "기본",            ok: () => true },
  { id: "star",    label: "별빛",   cond: "레벨 5",          ok: (s) => s.level >= 5 },
  { id: "heart",   label: "하트",   cond: "호감도 Lv3 사도", ok: (s) => maxAff(s) >= 3 },
  { id: "leaf",    label: "새싹",   cond: "주간 밸런스 80점", ok: (s) => (s.stats.bestBalance || 0) >= 80 },
  { id: "fire",    label: "불꽃",   cond: "7일 연속 공부",   ok: (s) => s.stats.bestStreak >= 7 },
  { id: "gold",    label: "황금",   cond: "보스 1회 격파",   ok: (s) => bossKills(s) >= 1 },
  { id: "rainbow", label: "무지개", cond: "레벨 15",         ok: (s) => s.level >= 15 },
];
const PROFILE_THEMES = [
  { id: "cream",    label: "크림",     cond: "기본",       ok: () => true },
  { id: "pink",     label: "딸기",     cond: "기본",       ok: () => true },
  { id: "mint",     label: "민트",     cond: "기본",       ok: () => true },
  { id: "sky",      label: "하늘",     cond: "기본",       ok: () => true },
  { id: "lavender", label: "라벤더",   cond: "기본",       ok: () => true },
  { id: "night",    label: "밤하늘",   cond: "레벨 10",    ok: (s) => s.level >= 10 },
  { id: "sunset",   label: "노을",     cond: "사도 50명",  ok: (s) => ownedN(s) >= 50 },
];
const PROFILE_BADGES = [
  { id: "streak", icon: "🔥", label: "7일 연속",     ok: (s) => s.stats.bestStreak >= 7 },
  { id: "boss",   icon: "👹", label: "보스 격파",    ok: (s) => bossKills(s) >= 1 },
  { id: "ssr",    icon: "🌟", label: "★★★ 5명",     ok: (s) => ssrN(s) >= 5 },
  { id: "bal",    icon: "⚖️", label: "밸런스 80점",  ok: (s) => (s.stats.bestBalance || 0) >= 80 },
  { id: "h10",    icon: "📚", label: "누적 10시간",  ok: (s) => s.stats.totalMin >= 600 },
  { id: "h50",    icon: "🎓", label: "누적 50시간",  ok: (s) => s.stats.totalMin >= 3000 },
  { id: "heart",  icon: "💗", label: "호감도 Lv5",   ok: (s) => maxAff(s) >= 5 },
  { id: "lv10",   icon: "🏅", label: "레벨 10",      ok: (s) => s.level >= 10 },
  { id: "gacha",  icon: "✉️", label: "모집 100회",   ok: (s) => s.stats.pulls >= 100 },
];

(() => {
"use strict";
const TS = window.TS;
const $ = (id) => document.getElementById(id);
const S = () => TS.state;
const esc = TS.esc;
const find = (list, id) => list.find((x) => x.id === id) || list[0];

function prof() {
  const s = S();
  if (!s.profile) s.profile = { title: "rookie", frame: "basic", theme: "cream", avatar: "", msg: "", badges: [] };
  return s.profile;
}
const avatarSrc = (id) => {
  const c = TS.SADO_MAP[id];
  if (!c) return "assets/chibi/erpin.webp?v=2";
  return c.emote ? `assets/emotes/${c.id}/1.webp` : TS.chibiSrc(c);
};

/* 공개용 프로필 (랭킹에 올라감) — 잠긴 건 기본값으로 */
function publicProfile() {
  const s = S(), p = prof();
  const okId = (list, id) => (find(list, id).ok(s) ? find(list, id).id : list[0].id);
  return {
    ti: okId(PROFILE_TITLES, p.title), fr: okId(PROFILE_FRAMES, p.frame), th: okId(PROFILE_THEMES, p.theme),
    av: s.owned[p.avatar] ? p.avatar : s.partner || "", m: String(p.msg || "").slice(0, 30),
    b: (p.badges || []).filter((id) => PROFILE_BADGES.some((x) => x.id === id && x.ok(s))).slice(0, 3),
  };
}
/* 다른 사람 데이터 정리 (믿을 수 없는 입력) */
function cleanProfile(p) {
  p = p && typeof p === "object" ? p : {};
  const pick = (list, id) => (list.some((x) => x.id === id) ? id : list[0].id);
  return {
    ti: pick(PROFILE_TITLES, p.ti), fr: pick(PROFILE_FRAMES, p.fr), th: pick(PROFILE_THEMES, p.th),
    av: TS.SADO_MAP[p.av] ? p.av : "", m: typeof p.m === "string" ? p.m.slice(0, 30) : "",
    b: Array.isArray(p.b) ? p.b.filter((id) => PROFILE_BADGES.some((x) => x.id === id)).slice(0, 3) : [],
  };
}

/* 프로필 카드 HTML (편집 미리보기 · 랭킹 공용) */
function avatarHTML(pp, size = "") {
  return `<span class="pav fr-${pp.fr} ${size}"><img src="${avatarSrc(pp.av)}" alt=""></span>`;
}
function cardHTML(pp, name, lv, extra = "") {
  return `<div class="pcard th-${pp.th}">
    ${avatarHTML(pp, "big")}
    <div class="pc-body">
      <span class="pc-title">${esc(find(PROFILE_TITLES, pp.ti).label)}</span>
      <b class="pc-name">${esc(name)} <small>Lv.${lv}</small></b>
      ${pp.m ? `<p class="pc-msg">“${esc(pp.m)}”</p>` : ""}
      ${pp.b.length ? `<div class="pc-badges">${pp.b.map((id) => { const x = find(PROFILE_BADGES, id); return `<span title="${esc(x.label)}">${x.icon}<small>${esc(x.label)}</small></span>`; }).join("")}</div>` : ""}
      ${extra}
    </div>
  </div>`;
}

/* ───── 편집 ───── */
function open() {
  const s = S(), p = prof();
  const draft = { ...p, badges: (p.badges || []).slice(), avatar: s.owned[p.avatar] ? p.avatar : s.partner };
  const pp = () => ({ ti: draft.title, fr: draft.frame, th: draft.theme, av: draft.avatar, m: draft.msg, b: draft.badges });
  const owned = SADO.filter((c) => s.owned[c.id]).sort((a, b) => b.rarity - a.rarity || (b.emote ? 1 : 0) - (a.emote ? 1 : 0));
  const opt = (list, key, kind) => list.map((x) => {
    const ok = x.ok(s);
    return `<button class="popt ${kind} ${draft[key] === x.id ? "on" : ""}" data-k="${key}" data-v="${x.id}" ${ok ? "" : "disabled"} title="${ok ? "" : "🔒 " + esc(x.cond)}">
      ${kind === "frame" ? `<span class="pav fr-${x.id} mini"><img src="${avatarSrc(draft.avatar)}" alt=""></span>` : ""}
      ${kind === "theme" ? `<span class="swatch th-${x.id}"></span>` : ""}
      <span>${esc(x.label)}</span>${ok ? "" : `<small>🔒 ${esc(x.cond)}</small>`}</button>`;
  }).join("");
  TS.modal(`<h2>🪪 프로필 꾸미기</h2>
    <div id="pf-preview"></div>
    <div class="pf-sec"><h4>한마디 <small>(30자, 랭킹에 보여요)</small></h4><input id="pf-msg" maxlength="30" placeholder="예) 이번 중간고사 전교 1등 간다!" value="${esc(draft.msg || "")}"></div>
    <div class="pf-sec"><h4>칭호</h4><div class="popts">${opt(PROFILE_TITLES, "title", "title")}</div></div>
    <div class="pf-sec"><h4>프레임</h4><div class="popts">${opt(PROFILE_FRAMES, "frame", "frame")}</div></div>
    <div class="pf-sec"><h4>카드 테마</h4><div class="popts">${opt(PROFILE_THEMES, "theme", "theme")}</div></div>
    <div class="pf-sec"><h4>뱃지 <small>(최대 3개)</small></h4><div class="popts">${PROFILE_BADGES.map((x) => {
      const ok = x.ok(s);
      return `<button class="popt badge ${draft.badges.includes(x.id) ? "on" : ""}" data-badge="${x.id}" ${ok ? "" : "disabled"}><span class="bi">${x.icon}</span><span>${esc(x.label)}</span>${ok ? "" : "<small>🔒</small>"}</button>`;
    }).join("")}</div></div>
    <div class="pf-sec"><h4>프로필 사도 <small>(보유 ${owned.length}명)</small></h4><div class="pf-avs">${owned.map((c) =>
      `<button class="pf-av ${draft.avatar === c.id ? "on" : ""}" data-av="${c.id}" title="${esc(c.name)}"><img src="${TS.chibiSrc(c)}" alt="" loading="lazy">${c.emote ? "<em>✨</em>" : ""}</button>`).join("")}</div></div>
    <div class="modal-actions"><button class="btn white" data-close>취소</button><button class="btn yellow" id="pf-save">저장</button></div>`,
    (el, close) => {
      const draw = () => { el.querySelector("#pf-preview").innerHTML = cardHTML(pp(), s.name, s.level); };
      draw();
      el.querySelector(".modal").classList.add("wide");
      el.querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => {
        draft[b.dataset.k] = b.dataset.v; TS.sfx("click");
        el.querySelectorAll(`[data-k="${b.dataset.k}"]`).forEach((x) => x.classList.toggle("on", x === b));
        draw();
      }));
      el.querySelectorAll("[data-badge]").forEach((b) => (b.onclick = () => {
        const id = b.dataset.badge;
        if (draft.badges.includes(id)) draft.badges = draft.badges.filter((x) => x !== id);
        else if (draft.badges.length < 3) draft.badges.push(id);
        else return TS.toast("뱃지는 3개까지!");
        b.classList.toggle("on", draft.badges.includes(id)); TS.sfx("click"); draw();
      }));
      el.querySelectorAll("[data-av]").forEach((b) => (b.onclick = () => {
        draft.avatar = b.dataset.av; TS.sfx("click");
        el.querySelectorAll("[data-av]").forEach((x) => x.classList.toggle("on", x === b));
        el.querySelectorAll(".popt.frame img").forEach((im) => (im.src = avatarSrc(draft.avatar)));
        draw();
      }));
      el.querySelector("#pf-msg").oninput = (e) => { draft.msg = e.target.value; draw(); };
      el.querySelector("#pf-save").onclick = () => {
        Object.assign(prof(), { title: draft.title, frame: draft.frame, theme: draft.theme, avatar: draft.avatar, msg: draft.msg.trim().slice(0, 30), badges: draft.badges });
        TS.save(); close(); TS.sfx("coin"); TS.toast("🪪 프로필 저장! 랭킹에도 반영돼요");
        TS.emit("profile"); TS.refresh();
      };
    });
}

/* 다른 교주 프로필 보기 (랭킹에서 클릭) */
function view(e) {
  const pp = cleanProfile(e.p);
  if (!pp.av) pp.av = e.partner;
  const fmt = (m) => (m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m}분`);
  const wk = TS.weekKey();
  TS.modal(`${cardHTML(pp, e.name, e.lv)}
    <div class="pf-stats">
      <div><small>이번 주</small><b>${fmt(e.week === wk ? e.weekMin : 0)}</b></div>
      <div><small>누적</small><b>${fmt(e.total)}</b></div>
      <div><small>보스 딜</small><b>${(e.week === wk ? e.boss : 0).toLocaleString()}</b></div>
      <div><small>사도</small><b>${e.sado}명</b></div>
      <div><small>연속</small><b>🔥${e.streak}일</b></div>
    </div>
    <div class="modal-actions"><button class="btn yellow" data-close>닫기</button></div>`);
}

/* 상단 바 이름 옆 칭호 */
TS.on("refresh", () => {
  const el = $("pname");
  if (el && S().started) el.innerHTML = `${esc(S().name)} <small class="pn-title">${esc(find(PROFILE_TITLES, publicProfile().ti).label)}</small>`;
});
$("profile-btn").onclick = () => { if (S().started) open(); };
$("profile-btn").title = "프로필 꾸미기";
$("open-profile").onclick = () => { if (S().started) open(); };

window.Profile = { open, view, publicProfile, cleanProfile, avatarHTML, cardHTML, avatarSrc };
})();
