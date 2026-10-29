/* =========================================================
   🎭 움직이는 사도 (Spine) — 대표 사도 · 스킨 · 클릭 반응
   - 애니메이션 데이터는 lootandwaifus.com 에서 불러옴 (spine-data.js)
   - 못 불러오면 기존 그림(치비/표정)으로 자동 대체
   반응: 클릭 = 콕 찌르기 / 길게 누르기 = 쓰다듬기 / 문지르기(드래그) = 간지럽히기
         연타 = 어지러움·화남 / 집중 완료·선물·레벨업 등에도 반응
   스킨: 기본 스킨은 무료, 나머지는 호감도 Lv(2·4·6·8…) 달성 또는 별사탕으로 해금
   ========================================================= */
const SKIN_COST = 50;
const LOAD_TIMEOUT = 25000;               // 이 시간 안에 못 불러오면 그림으로 표시                     // 스킨 1개 해금 별사탕
const skinAffLv = (idx) => idx * 2;       // idx번째 스킨 무료 해금 호감도 레벨
const LIVE_REACT = {                      // 반응 → 애니메이션 후보 (있는 것 중에서 고름)
  touch:    [["Touch_Idle", "Touch_End"]],
  pat:      [["Pat_Idle", "Pat_Idle", "Pat_End"]],
  tickle:   [["Tickle_Idle_1", "Tickle_Idle_2", "Tickle_End"], ["Tickle_Idle_1", "Tickle_End"]],
  happy:    [/^Happy_/],
  dance:    [/^Dance_/, /^Happy_/],
  proud:    [/^Proud_/, /^Happy_/],
  sad:      [/^Sad_/],
  angry:    [/^Angry_/],
  dizzy:    [/^Dizzy_/, /^Panic_/, /^Angry_/],
  surprise: [/^Surprise_/, /^Happy_/],
  shy:      [/^Shy_/, /^Happy_/],
  eat:      [/^Eat_/, /^Happy_/],
  talk:     [/^Talk_/, /^Happy_/],
};
const LIVE_LINES = {
  pat:    ["헤헤… 쓰다듬어 주는 거예요?", "기분 좋아요~", "더 해줘요!", "{name}, 머리 쓰담쓰담 좋아해요."],
  tickle: ["꺄하하! 간지러워요!", "그, 그만~ 히히히!", "간지럼은 반칙이에요!"],
  dizzy:  ["으아아 그만 찔러요!!", "어, 어지러워요…", "볼이 남아나질 않아요!"],
};

(() => {
"use strict";
const TS = window.TS;
const $ = (id) => document.getElementById(id);
const S = () => TS.state;
const rand = (a) => a[Math.floor(Math.random() * a.length)];

let webgl = null;
function hasWebGL() {
  if (webgl === null) {
    try { webgl = !!document.createElement("canvas").getContext("webgl"); } catch (e) { webgl = false; }
  }
  return webgl;
}
const liveOn = () => S().settings.live !== false;
const canLive = (id) => liveOn() && !!SPINE_DATA[id] && !!window.spine && hasWebGL();

/* ───── 스킨 상태 ───── */
function skinState(id) {
  const s = S();
  if (!s.skins) s.skins = {};
  if (!s.skins[id]) s.skins[id] = { own: [0], cur: 0 };
  return s.skins[id];
}
const affLv = (id) => (window.Affection ? window.Affection.level(id) : 1);
const skinOwned = (id, i) => i === 0 || skinState(id).own.includes(i) || affLv(id) >= skinAffLv(i);
const curSkin = (id) => { const st = skinState(id); return skinOwned(id, st.cur) ? st.cur : 0; };

/* ───── Spine 플레이어 하나 ───── */
function mount(container, id, opts = {}) {
  if (!canLive(id)) { opts.onFail && opts.onFail(); return null; }
  const d = SPINE_DATA[id], idx = Math.min(opts.skin != null ? opts.skin : curSkin(id), d.skins.length - 1);
  // 우리 저장소(trickstudy-assets) 먼저, 안 되면 원래 사이트
  const bases = SPINE_HOSTS.map((h) => encodeURI(h.url + h.dir(d.dir) + "/" + d.skins[idx][0]));
  let hostIdx = 0;
  const host = document.createElement("div");
  host.className = "live-host";
  container.appendChild(host);
  const ctrl = { id, host, ready: false, anims: [], idles: [], player: null, play, dispose, busyUntil: 0 };
  let tries = 0, giveUp = 0, failed = false;
  function create(full) {
    tries++;
    const base = bases[hostIdx];
    host.innerHTML = "";
    const cfg = {
      skelUrl: base + ".skel.asset", atlasUrl: base + ".atlas.asset",
      showControls: false, showLoading: false, alpha: true, // 로딩 로고 안 보이게 (그동안 기존 그림이 보임) backgroundColor: "#00000000", premultipliedAlpha: false,
      viewport: { padLeft: "6%", padRight: "6%", padTop: "8%", padBottom: "3%", transitionTime: 0 },
      success: (p) => {
        clearTimeout(giveUp);
        if (failed) return;
        const data = p.skeleton.data;
        ctrl.anims = data.animations.map((a) => a.name);
        ctrl.idles = ctrl.anims.filter((n) => /^Idle_/.test(n));
        if (!full) { // 스킨·애니 이름이 다를 때
          const sk = data.skins.find((x) => x.name === "Normal") || data.skins.find((x) => x.name !== "default");
          if (sk) { p.skeleton.setSkin(sk); p.skeleton.setSlotsToSetupPose(); }
          p.animationState.setAnimation(0, ctrl.idles[0] || ctrl.anims[0], true);
        }
        ctrl.ready = true;
        container.classList.add("live-ready");
        opts.onReady && opts.onReady(ctrl);
      },
      error: (p, msg) => {
        clearTimeout(giveUp);
        if (failed) return;
        try { p.dispose(); } catch (e) { /* 무시 */ }
        if (full) return create(false);                                   // 스킨·애니 이름이 달라서 실패했을 수도
        if (hostIdx < bases.length - 1) { hostIdx++; return create(true); } // 다음 서버
        console.warn("live load failed", id, msg);
        host.remove();
        opts.onFail && opts.onFail();
      },
    };
    if (full) { cfg.skin = "Normal"; cfg.animation = "Idle_1"; }
    ctrl.player = new spine.SpinePlayer(host, cfg);
    // 너무 오래 걸리면 포기하고 그림으로 (느린 인터넷·그래픽 문제)
    clearTimeout(giveUp);
    giveUp = setTimeout(() => {
      if (ctrl.ready) return;
      failed = true;
      console.warn("live load timeout", id);
      try { ctrl.player.dispose(); } catch (e) { /* 무시 */ }
      host.remove();
      opts.onFail && opts.onFail();
    }, LOAD_TIMEOUT);
  }
  function play(kind) {
    if (!ctrl.ready) return false;
    const st = ctrl.player.animationState, have = (n) => ctrl.anims.includes(n);
    let seq = null;
    for (const c of LIVE_REACT[kind] || []) {
      if (Array.isArray(c)) { if (c.every(have)) { seq = c; break; } }
      else { const m = ctrl.anims.filter((n) => c.test(n)); if (m.length) { seq = [rand(m)]; break; } }
    }
    if (!seq) return false;
    st.setAnimation(0, seq[0], false);
    let dur = ctrl.player.skeleton.data.findAnimation(seq[0]).duration;
    for (const n of seq.slice(1)) { st.addAnimation(0, n, false, 0); dur += ctrl.player.skeleton.data.findAnimation(n).duration; }
    st.addAnimation(0, rand(ctrl.idles.length ? ctrl.idles : [ctrl.anims[0]]), true, 0);
    ctrl.busyUntil = Date.now() + dur * 1000;
    return true;
  }
  function dispose() {
    clearInterval(watch);
    try { ctrl.player && ctrl.player.dispose(); } catch (e) { /* 무시 */ }
    host.remove();
    container.classList.remove("live-ready");
  }
  // 화면에서 사라지면 자동 정리 (모달 닫힘 등) + 가끔 다른 대기 동작
  const watch = setInterval(() => {
    if (!host.isConnected) return dispose();
    if (ctrl.ready && ctrl.idles.length > 1 && Date.now() > ctrl.busyUntil && Math.random() < 0.15) {
      ctrl.player.animationState.setAnimation(0, rand(ctrl.idles), true);
    }
  }, 4000);
  create(true);
  return ctrl;
}

/* ───── 대표 사도 무대 ───── */
let stage = null, stageKey = "";
const failedIds = new Set(); // 이번 접속에서 못 불러온 사도 (새로고침하면 다시 시도)
function mountStage(force) {
  const id = S().partner, box = $("partner");
  const key = id + ":" + curSkin(id || "") + ":" + liveOn();
  if (!force && key === stageKey) return;
  stageKey = key;
  if (stage) { stage.dispose(); stage = null; }
  box.classList.remove("live-ready");
  if (!id || !S().started) return;
  if (failedIds.has(key)) return;
  stage = mount(box, id, { onFail: () => { stage = null; failedIds.add(key); } });
}
function react(kind) { if (stage) return stage.play(kind); return false; }

/* 클릭 · 길게 누르기 · 문지르기 */
let down = null, gesture = "", pokes = [];
const partner = $("partner");
partner.addEventListener("pointerdown", (e) => {
  gesture = "";
  down = { x: e.clientX, y: e.clientY, moved: 0, t: Date.now() };
  down.timer = setTimeout(() => {
    if (!down || down.moved > 20) return;
    gesture = "pat";
    react("pat"); hearts(); TS.say(TS.fmt(rand(LIVE_LINES.pat), TS.SADO_MAP[S().partner]), false);
  }, 550);
});
partner.addEventListener("pointermove", (e) => {
  if (!down) return;
  down.moved += Math.hypot(e.movementX || 0, e.movementY || 0);
  if (!gesture && down.moved > 90) {
    gesture = "tickle";
    clearTimeout(down.timer);
    react("tickle"); TS.say(rand(LIVE_LINES.tickle), false);
  }
});
const up = () => { if (down) clearTimeout(down.timer); down = null; };
// 쓰다듬기·간지럽히기 뒤에 따라오는 클릭은 '콕 찌르기'로 치지 않음
partner.addEventListener("click", (e) => { if (gesture) { e.stopImmediatePropagation(); gesture = ""; } }, true);
partner.addEventListener("pointerup", up);
partner.addEventListener("pointerleave", up);
TS.on("poke", () => {
  if (gesture) return; // 쓰다듬기·간지럽히기 중이면 콕 반응은 생략
  const now = Date.now();
  pokes = pokes.filter((t) => now - t < 2000).concat(now);
  if (pokes.length >= 4) { pokes = []; if (react("dizzy")) setTimeout(() => TS.say(rand(LIVE_LINES.dizzy), false), 50); }
  else react("touch");
});
function hearts() {
  for (let i = 0; i < 6; i++) {
    const h = document.createElement("span");
    h.className = "live-heart"; h.textContent = rand(["💗", "💕", "💖"]);
    h.style.left = 20 + Math.random() * 60 + "%";
    h.style.animationDelay = i * 0.12 + "s";
    partner.appendChild(h);
    setTimeout(() => h.remove(), 1800);
  }
}

/* 게임 이벤트에 반응 */
TS.on("focus", ({ full }) => react(full ? (Math.random() < 0.5 ? "dance" : "happy") : "sad"));
TS.on("todo", () => react("happy"));
TS.on("levelup", () => react("dance"));
TS.on("gift", () => react("eat"));
TS.on("pull", () => react("surprise"));
TS.on("partner", () => mountStage());
TS.on("refresh", () => mountStage());
document.addEventListener("study-timer", (e) => { if (e.detail.running && e.detail.mode === "focus") react("proud"); });

/* ───── 스킨 (사도 상세 창) ───── */
TS.detailHooks.push((c) => {
  const d = SPINE_DATA[c.id];
  if (!d) return "";
  const st = skinState(c.id), cur = curSkin(c.id);
  return `<div class="skin-box"><div class="aff-head"><b>🎨 스킨</b><span>${d.skins.filter((_, i) => skinOwned(c.id, i)).length} / ${d.skins.length}</span></div>
    <div class="skin-row">${d.skins.map(([, label], i) => {
      const own = skinOwned(c.id, i);
      return `<button class="skin-chip ${own ? "own" : ""} ${i === cur ? "on" : ""}" data-skin="${c.id}:${i}">
        <b>${TS.esc(i === 0 ? "기본" : label.replace("Skin", "스킨"))}</b>
        <small>${i === cur ? "장착 중" : own ? "보유" : `🔒 호감도 Lv${skinAffLv(i)} · 🍬${SKIN_COST}`}</small></button>`;
    }).join("")}</div>
    ${canLive(c.id) ? "" : `<p class="hint" style="margin:6px 0 0">${liveOn() ? "이 기기에서는 움직이는 사도를 표시할 수 없어요." : "기록 → 설정에서 ‘움직이는 사도’를 켜면 스킨이 보여요."}</p>`}</div>`;
});
function skinModal(id, i) {
  const c = TS.SADO_MAP[id], d = SPINE_DATA[id], own = skinOwned(id, i), cur = curSkin(id);
  const label = i === 0 ? "기본" : d.skins[i][1].replace("Skin", "스킨");
  TS.modal(`<h2>🎨 ${TS.esc(c.name)} · ${TS.esc(label)}</h2>
    <div class="skin-preview" id="skin-prev"><span class="skin-loading">불러오는 중…</span></div>
    <div class="skin-acts">${["happy", "touch", "pat", "dance", "sad"].map((k) => `<button class="btn small white" data-sk-act="${k}">${{ happy: "😊 기뻐", touch: "👉 콕", pat: "🤚 쓰담", dance: "💃 춤", sad: "😢 슬퍼" }[k]}</button>`).join("")}</div>
    <div class="modal-actions">
      ${own ? (i === cur ? '<span class="tag" style="background:var(--yellow);font-size:15px;padding:6px 14px">장착 중</span>' : '<button class="btn yellow" id="sk-eq">이 스킨 장착</button>')
        : `<button class="btn pink" id="sk-buy" ${S().candy < SKIN_COST ? "disabled" : ""}><i class="ic-candy"></i> ${SKIN_COST}개로 해금</button>`}
      <button class="btn white" data-close>닫기</button>
    </div>
    ${own ? "" : `<p class="hint">호감도 Lv${skinAffLv(i)}이 되면 무료로 해금돼요 (지금 Lv${affLv(id)}) · 별사탕 ${S().candy}개</p>`}`,
    (el, close) => {
      const prev = mount(el.querySelector("#skin-prev"), id, {
        skin: i,
        onReady: () => { const l = el.querySelector(".skin-loading"); if (l) l.remove(); },
        onFail: () => { const l = el.querySelector(".skin-loading"); if (l) l.textContent = "애니메이션을 불러올 수 없어요 😢"; },
      });
      el.querySelectorAll("[data-sk-act]").forEach((b) => (b.onclick = () => prev && prev.play(b.dataset.skAct)));
      const eq = el.querySelector("#sk-eq");
      if (eq) eq.onclick = () => { skinState(id).cur = i; TS.save(); TS.toast(`🎨 ${c.name} 스킨 변경!`); close(); mountStage(true); TS.refresh(); };
      const buy = el.querySelector("#sk-buy");
      if (buy) buy.onclick = () => {
        if (S().candy < SKIN_COST) return;
        S().candy -= SKIN_COST;
        const st = skinState(id); st.own.push(i); st.cur = i;
        TS.save(); TS.sfx("r3"); TS.confetti(60); TS.toast(`🎨 ${c.name} ${label} 해금!`);
        close(); mountStage(true); TS.refresh();
      };
    });
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-skin]");
  if (!b) return;
  const [id, i] = b.dataset.skin.split(":");
  const back = b.closest(".modal-back");
  if (back) back.querySelector("[data-close]").click();
  skinModal(id, +i);
});

/* 설정: 움직이는 사도 켜기/끄기 */
TS.on("stats", () => {
  const box = $("s-live");
  if (box) box.checked = liveOn();
});
const sl = $("s-live");
if (sl) sl.onchange = (e) => { S().settings.live = e.target.checked; TS.save(); mountStage(true); };

window.Live = { mount, react, canLive, curSkin, skinState };
})();
