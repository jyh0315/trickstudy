/* 트릭스터디 펫 — 페이지 아래에 뜨는 작은 창 안에서 사도(Spine)를 그림
   부모(content.js)와 postMessage 로 주고받음
   부모 → 여기: {walk: true/false, dir: 1/-1}, {react: "happy"}, {event: "chat"|"sleep"|"wake"|"typing"|"scroll"|"back"|"video"|"study"|"greet"}
   여기 → 부모: {pet: "drag", dx, dy}, {pet: "drop"}, {pet: "ready"}, {pet: "poke"}, {pet: "sulk"} */
"use strict";
const HOSTS = [
  (d, f) => "https://jyh0315.github.io/trickstudy-assets/l2d/" + d.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "") + "/" + f,
  (d, f) => "https://lootandwaifus.com/l2d/trickcal/" + encodeURIComponent(d) + "/" + encodeURIComponent(f),
];
const L = {
  poke: ["교주님, 공부 중이에요?", "헤헤, 같이 있어요!", "조금만 더 힘내요!", "쉬엄쉬엄 해요~", "오늘도 화이팅!", "물 마셨어요?", "딴짓 감시 중이에요 👀", "에헤헤~", "불렀어요?", "네? 저요?", "{name}, 여기 있어요!", "콕! 찔렸다~"],
  head: ["머, 머리는 왜요…", "헤헤… 머리 만져 주는 거예요?", "모자… 아니 머리 망가져요!", "칭찬이죠? 칭찬 맞죠?"],
  tickle: ["꺄하하! 간지러워요!", "거긴 안 돼요~ 히히!", "으햐햐 그만~!", "간지럼은 반칙이에요!"],
  combo: ["왜 자꾸 찔러요!", "그, 그만 좀 눌러요!", "아야야… 세게 누르지 마요!", "교주님 심심해요?"],
  angry: ["진짜 화났어요! 흥!", "더 누르면 삐질 거예요!", "으으으… 참는 중이에요!"],
  sulky: ["흥. 이제 말 안 해요.", "…삐졌어요.", "모른 척할 거예요."],
  makeup: ["…이번만 봐 줄게요.", "흥, 다시 친해진 거예요.", "알았어요, 화 풀었어요!"],
  pat: ["헤헤… 쓰다듬어 주는 거예요?", "기분 좋아요~", "더 해 줘도 돼요!", "에헤헤, 따뜻해요."],
  sleepyPat: ["스르르… 졸려요…", "이러다 잠들겠어요… Zzz", "으음… 5분만…"],
  grab: ["으앗! 내려 줘요!", "높아요 높아!", "어디 데려가는 거예요?", "날고 있어요~!"],
  dropHi: ["아야! 어지러워요…", "엉덩방아 찧었어요…", "살살 내려 줘요!"],
  dropLo: ["착지 성공!", "휴, 무사해요!", "여기가 새 자리예요?"],
  wake: ["앗, 졸았던 거 아니에요!", "흐암… 깼어요!", "Zzz… 네? 공부요!"],
  sleep: ["Zzz…", "쿨쿨…", "음냐… 교주님…"],
  chat: ["오늘 목표 정했어요?", "자세 바르게 앉아요!", "눈 깜빡이기 잊지 마요~", "스트레칭 한 번 해요!", "간식 먹고 싶다…", "집중력 최고예요!", "물 한 잔 어때요?", "할 수 있어요!", "어려우면 조금씩 나눠서 해요.", "옆에서 응원 중이에요 📣"],
  morning: ["좋은 아침이에요! ☀️", "아침은 먹었어요?", "오늘 하루도 힘내요!"],
  lunch: ["점심 먹을 시간이에요!", "배고파요… 밥 먹어요!"],
  evening: ["저녁 먹었어요?", "오늘 하루 수고했어요!"],
  night: ["벌써 밤이에요… 너무 무리하지 마요.", "졸리면 자는 것도 공부예요!"],
  late: ["이 시간엔 자야죠! 😴", "교주님, 내일 피곤해요…", "늦었어요… 얼른 자요!"],
  typing: ["열공 중이네요! ✍️", "타닥타닥~ 멋져요!", "손가락 바쁘다~"],
  scroll: ["스크롤 너무 빨라요~ 어지러워요!", "천천히 읽어요~", "뭘 그렇게 찾아요?"],
  back: ["어디 갔다 왔어요? 기다렸어요!", "돌아왔다! 다시 시작해요!", "오래 기다렸잖아요~"],
  video: ["영상 보는 거예요? 공부 영상 맞죠? 👀", "딴짓 아니죠…?", "조금만 보고 공부해요!"],
  study: ["좋아요, 공부 사이트!", "집중 모드 ON!", "같이 공부해요!"],
};
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
        p.skeleton.scaleX = -dir; // 사도 그림은 원래 왼쪽을 봄
        setupLook(p);
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
const line = (k) => rand(L[k] || L.poke).replace("{name}", name);
// 감정 → 쓸 수 있는 애니메이션 (사도마다 있는 게 달라서 순서대로 찾아봄)
const MOOD = {
  happy: /^(Happy|Smile|Laugh|Dance|Proud|Pride)_/, shy: /^(Shy|Happy)_/, angry: /^(Angry|Mad|Sulky)_/, sulky: /^(Sulky|Angry|Sad)_/,
  sad: /^(Sad|Sorry|Tear)_/, dizzy: /^(Panic|Surprise|Sweat|Dizzy)_/, surprise: /^(Surprise|Panic)_/, sleep: /^(Sleep|Tired|Close)_/,
  eat: /^Eat_/, dance: /^(Dance|Happy)_/, think: /^(Thinking|Think|Serious|Idle)_/, laugh: /^(Laugh|Happy|Smile)_/,
};
let sleeping = false;
function react(kind) {
  if (!player || !anims.length) return;
  const st = player.animationState;
  let seq = [], loop = false;
  if (kind === "touch" && anims.includes("Touch_Idle") && anims.includes("Touch_End")) seq = ["Touch_Idle", "Touch_End"];
  else if (kind === "pat" && anims.some((n) => /^Pat_/.test(n))) seq = pick(/^Pat_Idle/).slice(0, 1).concat(anims.includes("Pat_End") ? ["Pat_End"] : []);
  else if (kind === "tickle" && anims.some((n) => /^Tickle_/.test(n))) { const ti = pick(/^Tickle_Idle/); seq = (ti.length ? [rand(ti)] : []).concat(anims.includes("Tickle_End") ? ["Tickle_End"] : []); }
  if (!seq.length) {
    const h = pick(MOOD[kind] || MOOD.happy);
    if (h.length) seq = [rand(h)];
    else { const f = pick(MOOD.happy); if (f.length) seq = [rand(f)]; }
  }
  if (kind === "sleep") loop = true;
  if (!seq.length) return;
  sleeping = kind === "sleep";
  st.setAnimation(0, seq[0], loop && seq.length === 1);
  seq.slice(1).forEach((n) => st.addAnimation(0, n, false, 0));
  if (!(loop && seq.length === 1)) st.addAnimation(0, rand(idles.length ? idles : [anims[0]]), true, 0);
}
function timeLine() {
  const h = new Date().getHours();
  return h < 5 ? "late" : h < 10 ? "morning" : h >= 11 && h < 14 ? "lunch" : h >= 17 && h < 20 ? "evening" : h >= 22 ? "night" : null;
}
// 부모가 알려 주는 일들 → 대사 + 표정
const EVENTS = {
  chat: () => { const t = Math.random() < 0.35 && timeLine(); const k = t || "chat"; say(line(k)); react(k === "late" || k === "night" ? "sleep" : k === "lunch" ? "eat" : rand(["happy", "think", "dance", "happy"])); if (k === "late" || k === "night") setTimeout(wakeUp, 4000); },
  sleep: () => { if (sleeping) return; say(line("sleep"), 4000); react("sleep"); },
  wake: () => wakeUp(true),
  typing: () => { say(line("typing")); react("happy"); },
  scroll: () => { say(line("scroll")); react("dizzy"); },
  back: () => { wakeUp(); say(line("back")); react("happy"); },
  video: () => { say(line("video")); react(rand(["surprise", "sulky", "think"])); },
  study: () => { say(line("study")); react("dance"); },
  greet: () => { const t = timeLine(); say(t ? line(t) : line("poke")); react(t === "lunch" ? "eat" : "happy"); },
};
function wakeUp(talk) {
  if (!sleeping) return;
  sleeping = false;
  if (player) player.animationState.setAnimation(0, rand(idles.length ? idles : [anims[0]]), true);
  if (talk) { say(line("wake")); react("surprise"); }
}
/* 마우스 바라보기: 애니메이션 위에 머리 뼈 각도를 살짝 더함 */
let lookT = 0, lookA = 0;
function setupLook(p) {
  const sk = p.skeleton;
  const head = ["Head", "S1_Head", "S2_Head", "S3_Head", "Head_Root", "S1_Head_Root", "S3_Head_Root"].map((n) => sk.findBone(n)).find(Boolean);
  if (!head) return;
  const st = p.animationState, ap = st.apply.bind(st);
  st.apply = (s2) => {
    const r = ap(s2);
    lookA += (lookT - lookA) * 0.12;
    if (Math.abs(lookA) > 0.05) head.rotation += lookA;
    return r;
  };
}
function setLook(v) {
  if (!v || sleeping) { lookT = 0; return; }
  const up = Math.atan2(-v.dy, Math.max(60, Math.abs(v.dx))) * 180 / Math.PI; // 위쪽이면 +
  lookT = Math.max(-14, Math.min(16, up * 0.35)); // + = 고개 들기
}
function setDir(d) {
  dir = d;
  if (player && player.skeleton) player.skeleton.scaleX = -d;
  fb.style.transform = `translateX(-50%) scaleX(${-d})`;
}

window.addEventListener("message", (e) => {
  if (e.source !== window.parent) return;
  const m = e.data || {};
  if (m.dir) setDir(m.dir);
  if (m.walk != null) walking = m.walk;
  if (m.react) react(m.react);
  if (m.say) say(m.say);
  if ("look" in m) setLook(m.look);
  if (m.event && EVENTS[m.event]) EVENTS[m.event]();
});

/* 누르기 = 콕 찌르기(머리/몸/다리 다르게, 연타하면 화냄) · 끌기 = 옮기기 · 꾹 누르기 = 쓰다듬기(오래 누르면 잠듦) */
let down = null, moved = false, longT = 0, sleepT = 0, clicks = [], sulkUntil = 0, sulkHits = 0, grabT = 0;
const zone = (e) => { const r = stage.getBoundingClientRect(); const v = (e.clientY - r.top) / r.height; return v < 0.5 ? "head" : v > 0.8 ? "feet" : "body"; };
stage.addEventListener("pointerdown", (e) => {
  down = { x: e.screenX, y: e.screenY, sy: e.screenY, zone: zone(e) }; moved = false;
  stage.setPointerCapture(e.pointerId);
  clearTimeout(longT); clearTimeout(sleepT);
  if (sleeping) { wakeUp(true); parentPost({ pet: "wake" }); down.done = true; return; }
  if (Date.now() < sulkUntil) return;
  longT = setTimeout(() => {
    if (moved || !down) return;
    react("pat"); say(line("pat")); down.pat = true;
    sleepT = setTimeout(() => { if (down && down.pat && !moved) { say(line("sleepyPat"), 3500); react("sleep"); parentPost({ pet: "sleep" }); } }, 2200);
  }, 600);
});
let lookSent = 0;
stage.addEventListener("pointermove", (e) => {
  if (!down) { const t = performance.now(); if (t - lookSent > 80) { lookSent = t; parentPost({ pet: "look", x: e.clientX, y: e.clientY }); } return; }
  const dx = e.screenX - down.x, dy = e.screenY - down.y;
  if (!moved && Math.hypot(dx, dy) < 5) return;
  if (!moved) {
    moved = true; clearTimeout(longT); clearTimeout(sleepT); sleeping = false;
    stage.classList.add("drag"); react("dizzy"); say(line("grab")); parentPost({ pet: "grab" });
    clearInterval(grabT); grabT = setInterval(() => say(line("grab"), 1800), 2600);
  }
  down.x = e.screenX; down.y = e.screenY;
  parentPost({ pet: "drag", dx, dy });
});
function poke(where) {
  const now = Date.now();
  if (now < sulkUntil) { // 삐진 동안엔 몇 번 더 눌러 줘야 풀림
    if (++sulkHits >= 4) { sulkUntil = 0; sulkHits = 0; clicks = []; say(line("makeup")); react("shy"); }
    else { say(rand(["…", "흥.", "안 들려요~", "(모른 척)"]), 1500); react("sulky"); }
    return;
  }
  clicks = clicks.filter((t) => now - t < 2500); clicks.push(now);
  const n = clicks.length;
  if (n >= 9) { sulkUntil = now + 15000; sulkHits = 0; clicks = []; say(line("sulky"), 4000); react("sulky"); parentPost({ pet: "sulk" }); return; }
  if (n >= 6) { say(line("angry")); react("angry"); return; }
  if (n >= 4) { say(line("combo")); react(rand(["angry", "dizzy"])); return; }
  if (where === "head") { say(line("head")); react(anims.some((x) => /^Pat_/.test(x)) && Math.random() < 0.5 ? "pat" : "shy"); return; }
  if (where === "feet") { say(line("tickle")); react("tickle"); return; }
  const r = Math.random();
  if (r < 0.12) { const t = timeLine(); if (t) { say(line(t)); react(t === "lunch" ? "eat" : "happy"); return; } }
  if (r < 0.2) { say(rand(["간식 줄 거예요? 🍪", "냠냠… 아무것도 안 먹었어요!"])); react("eat"); return; }
  if (r < 0.28) { say(rand(["춤춰 볼까요? ♪", "랄랄라~ ♪"])); react("dance"); return; }
  if (r < 0.35) { say(rand(["깜짝이야!", "으앗, 놀랐잖아요!"])); react("surprise"); return; }
  react("touch"); say(line("poke"));
}
const up = (e) => {
  if (!down) return;
  clearTimeout(longT); clearTimeout(sleepT); clearInterval(grabT);
  stage.classList.remove("drag");
  if (moved) { const fell = down.sy - e.screenY; parentPost({ pet: "drop" }); setTimeout(() => say(line(fell > 120 ? "dropHi" : "dropLo")), fell > 120 ? 450 : 0); if (fell <= 120) react("happy"); }
  else if (!down.pat && !down.done) { poke(down.zone); parentPost({ pet: "poke" }); }
  down = null;
};
stage.addEventListener("pointerup", up);
stage.addEventListener("pointercancel", up);
let hoverT = 0;
stage.addEventListener("pointerenter", () => { clearTimeout(hoverT); hoverT = setTimeout(() => { if (!down && !sleeping && Math.random() < 0.3) { say(rand(["뭐 해요?", "저 보는 거예요?", "헤헤, 안녕하세요!", "손 흔들어 줄게요 👋"])); react("shy"); } }, 900); });
stage.addEventListener("pointerleave", () => clearTimeout(hoverT));

chrome.storage.local.get({ partner: "erpin", skin: 0 }, (s) => load(s.partner, s.skin));
chrome.storage.onChanged.addListener((c) => { if (c.partner || c.skin) chrome.storage.local.get({ partner: "erpin", skin: 0 }, (s) => { ready = false; if (player) try { player.dispose(); } catch (e) { /* 무시 */ } fb.style.display = "none"; load(s.partner, s.skin); }); });
