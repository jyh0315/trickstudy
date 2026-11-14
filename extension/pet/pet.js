/* 트릭스터디 펫 — 페이지 아래에 뜨는 작은 창 안에서 사도(Spine)를 그림
   부모(content.js)와 postMessage 로 주고받음
   부모 → 여기: {walk: true/false, dir: 1/-1}, {react: "happy"}
   여기 → 부모: {pet: "drag", dx, dy}, {pet: "drop"}, {pet: "ready"} */
"use strict";
const HOSTS = [
  (d, f) => "https://jyh0315.github.io/trickstudy-assets/l2d/" + d.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "") + "/" + f,
  (d, f) => "https://lootandwaifus.com/l2d/trickcal/" + encodeURIComponent(d) + "/" + encodeURIComponent(f),
];
const LINES = ["교주님, 공부 중이에요?", "헤헤, 같이 있어요!", "조금만 더 힘내요!", "쉬엄쉬엄 해요~", "오늘도 화이팅!", "물 마셨어요?", "딴짓 감시 중이에요 👀", "에헤헤~"];
const stage = document.getElementById("stage"), fb = document.getElementById("fallback"), bubble = document.getElementById("bubble");
const parentPost = (m) => window.parent.postMessage(Object.assign({ __trickpet: 1 }, m), "*");
let player = null, anims = [], idles = [], dir = 1, walking = false, ready = false, name = "";

// 이음새 선 방지: 텍스처 알파를 미리 곱해서 올림 (사이트와 같은 방식)
(function patchPMA() {
  const T = window.spine && spine.GLTexture;
  if (!T || T.__pma) return;
  T.__pma = true; T.DISABLE_UNPACK_PREMULTIPLIED_ALPHA_WEBGL = false;
  const up = T.prototype.update;
  T.prototype.update = function (mip) {
    const gl = this.context.gl;
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    try { up.call(this, mip); } finally { gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); }
  };
})();

function say(t, ms = 2600) {
  bubble.textContent = t; bubble.classList.add("on");
  clearTimeout(say.t); say.t = setTimeout(() => bubble.classList.remove("on"), ms);
}
function showFallback(id) {
  fb.src = "https://jyh0315.github.io/trickstudy/assets/chibi/" + id + ".webp";
  fb.style.display = "block";
  ready = true; parentPost({ pet: "ready" });
}
function load(id, skinIdx) {
  const d = PET_DATA[id] || PET_DATA.erpin;
  name = d.n;
  const file = (d.skins[Math.min(skinIdx || 0, d.skins.length - 1)] || d.skins[0])[0];
  const bases = HOSTS.map((h) => h(d.dir, file));
  let hi = 0;
  const tryHost = () => {
    if (hi >= bases.length) return showFallback(id);
    const base = bases[hi];
    stage.innerHTML = "";
    const host = document.createElement("div");
    stage.appendChild(host);
    let done = false;
    const giveUp = setTimeout(() => { if (done) return; done = true; try { player.dispose(); } catch (e) { /* 무시 */ } hi++; tryHost(); }, 15000);
    player = new spine.SpinePlayer(host, {
      skelUrl: base + ".skel.asset", atlasUrl: base + ".atlas.asset",
      showControls: false, showLoading: false, alpha: true, backgroundColor: "#00000000", premultipliedAlpha: true,
      viewport: { padLeft: 0, padRight: 0, padTop: 0, padBottom: 0, transitionTime: 0 },
      success: (p) => {
        if (done) return; done = true; clearTimeout(giveUp);
        const data = p.skeleton.data;
        anims = data.animations.map((a) => a.name);
        idles = anims.filter((n) => /^Idle_/.test(n));
        const sk = data.skins.find((x) => x.name === "Normal") || data.skins.find((x) => x.name !== "default");
        if (sk) { p.skeleton.setSkin(sk); p.skeleton.setSlotsToSetupPose(); }
        p.animationState.data.defaultMix = 0.2;
        p.animationState.setAnimation(0, idles[0] || anims[0], true);
        p.animationState.apply(p.skeleton); p.skeleton.updateWorldTransform();
        // 발(0)부터 머리 위까지, 모든 사도 비슷한 크기로
        const off = new spine.Vector2(), size = new spine.Vector2();
        p.skeleton.getBounds(off, size);
        const ok = Number.isFinite(off.y) && size.y > 0 && size.y < 5000;
        const top = ok ? Math.min(Math.max(off.y + size.y + 20, 650), 1000) : 820;
        const H = top + 150, W = H * (innerWidth / Math.max(1, innerHeight)); // 위쪽은 말풍선 자리
        Object.assign(p.config.viewport, { x: -W / 2, y: -20, width: W, height: H });
        p.setViewport(p.animationState.getCurrent(0).animation.name);
        p.skeleton.scaleX = dir;
        if (p.paused) p.play();
        ready = true; parentPost({ pet: "ready" });
      },
      error: () => { if (done) return; done = true; clearTimeout(giveUp); try { player.dispose(); } catch (e) { /* 무시 */ } hi++; tryHost(); },
    });
  };
  tryHost();
}
const pick = (re) => anims.filter((n) => re.test(n));
const rand = (a) => a[Math.floor(Math.random() * a.length)];
function react(kind) {
  if (!player || !anims.length) return;
  const st = player.animationState;
  let seq = [];
  if (kind === "touch" && anims.includes("Touch_Idle") && anims.includes("Touch_End")) seq = ["Touch_Idle", "Touch_End"];
  else if (kind === "pat" && anims.includes("Pat_Idle")) seq = ["Pat_Idle", "Pat_End"].filter((n) => anims.includes(n));
  else { const h = pick(kind === "sad" ? /^Sad_/ : kind === "dizzy" ? /^(Dizzy|Panic|Surprise)_/ : /^(Happy|Shy|Proud|Dance)_/); if (h.length) seq = [rand(h)]; }
  if (!seq.length) return;
  st.setAnimation(0, seq[0], false);
  seq.slice(1).forEach((n) => st.addAnimation(0, n, false, 0));
  st.addAnimation(0, rand(idles.length ? idles : [anims[0]]), true, 0);
}
function setDir(d) {
  dir = d;
  if (player && player.skeleton) player.skeleton.scaleX = d;
  fb.style.transform = `translateX(-50%) scaleX(${d})`;
}

window.addEventListener("message", (e) => {
  if (e.source !== window.parent) return;
  const m = e.data || {};
  if (m.dir) setDir(m.dir);
  if (m.walk != null) walking = m.walk;
  if (m.react) react(m.react);
  if (m.say) say(m.say);
});

/* 누르기 = 콕 찌르기 · 끌기 = 옮기기(놓으면 떨어짐) · 꾹 누르기 = 쓰다듬기 */
let down = null, moved = false, longT = 0;
stage.addEventListener("pointerdown", (e) => {
  down = { x: e.screenX, y: e.screenY }; moved = false;
  stage.setPointerCapture(e.pointerId);
  clearTimeout(longT);
  longT = setTimeout(() => { if (!moved && down) { react("pat"); say("헤헤… 쓰다듬어 주는 거예요?"); down.pat = true; } }, 600);
});
stage.addEventListener("pointermove", (e) => {
  if (!down) return;
  const dx = e.screenX - down.x, dy = e.screenY - down.y;
  if (!moved && Math.hypot(dx, dy) < 5) return;
  if (!moved) { moved = true; clearTimeout(longT); stage.classList.add("drag"); react("dizzy"); parentPost({ pet: "grab" }); }
  down.x = e.screenX; down.y = e.screenY;
  parentPost({ pet: "drag", dx, dy });
});
const up = () => {
  if (!down) return;
  clearTimeout(longT);
  stage.classList.remove("drag");
  if (moved) parentPost({ pet: "drop" });
  else if (!down.pat) { react("touch"); say(rand(LINES).replace("{name}", name)); parentPost({ pet: "poke" }); }
  down = null;
};
stage.addEventListener("pointerup", up);
stage.addEventListener("pointercancel", up);

chrome.storage.local.get({ partner: "erpin", skin: 0 }, (s) => load(s.partner, s.skin));
chrome.storage.onChanged.addListener((c) => { if (c.partner || c.skin) chrome.storage.local.get({ partner: "erpin", skin: 0 }, (s) => { ready = false; if (player) try { player.dispose(); } catch (e) { /* 무시 */ } fb.style.display = "none"; load(s.partner, s.skin); }); });
