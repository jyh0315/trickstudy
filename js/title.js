/* =========================================================
   시작 화면 — "볼을 잡아당겨서 시작하기!"
   사도 얼굴을 캔버스에 그리고, 잡은 지점 주변만 늘어나게 왜곡(liquify)
   충분히 당겼다 놓으면 뾰옹~ 하고 시작
   ========================================================= */
(() => {
"use strict";
const TS = window.TS;


/* 모드 전환 스위치 (시작 화면 아래) — 누르면 시작 화면을 다시 그림 */
function modeSwitch(root, done, cleanup) {
  const el = document.createElement("div");
  el.className = "ttl-mode";
  const plain = TS.isPlain();
  el.innerHTML = `<span>화면 모드</span>
    <button data-mode="chara" class="${plain ? "" : "on"}">🎀 캐릭터</button>
    <button data-mode="plain" class="${plain ? "on" : ""}">📘 심플</button>`;
  el.querySelectorAll("[data-mode]").forEach((b) => (b.onclick = (e) => {
    e.stopPropagation();
    const want = b.dataset.mode === "plain";
    if (want === TS.isPlain()) return;
    TS.setPlain(want);
    TS.applyBg(); TS.renderPartner(); TS.refresh();
    cleanup();
    root.remove();
    window.TitleScreen.show(done);
  }));
  root.appendChild(el);
}

/* 심플 모드 시작 화면: 캐릭터 없이 버튼으로 시작 */
function showPlain(done) {
  const root = document.createElement("div");
  root.id = "title";
  root.className = "ttl-plain";
  root.innerHTML = `
    <div class="tp-card">
      <div class="tp-logo">📘 공부 플래너</div>
      <div class="tp-sub">오늘도 차근차근, 한 걸음씩</div>
      <div class="tp-clock" id="tp-clock"></div>
      <button class="btn yellow big" id="tp-start">시작하기</button>
      <div class="tp-hint">Enter 키로도 시작할 수 있어요</div>
    </div>
    <div class="ttl-dday hidden" id="ttl-dday"></div>`;
  document.body.appendChild(root);
  document.body.classList.add("title-open");
  const clock = () => { const n = new Date(); root.querySelector("#tp-clock").textContent = n.toLocaleString("ko-KR", { month: "long", day: "numeric", weekday: "long", hour: "2-digit", minute: "2-digit" }); };
  clock();
  renderDday(root.querySelector("#ttl-dday"));
  const timer = setInterval(() => { clock(); renderDday(root.querySelector("#ttl-dday")); }, 1000);
  let finished = false;
  const cleanup = () => { finished = true; clearInterval(timer); document.removeEventListener("keydown", onKey); };
  const finish = () => {
    if (finished) return;
    cleanup();
    TS.sfx("click");
    root.classList.add("bye");
    document.body.classList.remove("title-open");
    if (window.BGM) window.BGM.onStart();
    setTimeout(() => { root.remove(); done(); }, 450);
  };
  const onKey = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); finish(); } };
  document.addEventListener("keydown", onKey);
  root.querySelector("#tp-start").onclick = finish;
  modeSwitch(root, done, cleanup);
}

/* 게임 시작 화면처럼: 들판 배경 + 사도 3명(대표 사도는 앞에 크게), 아무 볼이나 잡아당기면 시작 */
function pickCast(main) {
  const has = (id) => window.Live && window.Live.canLive(id);
  const owned = Object.keys(TS.state.owned).filter((id) => id !== main && has(id)).sort(() => Math.random() - 0.5);
  const extra = ["erpin", "butter", "kommy", "ui", "chloe", "xxionx"].filter((id) => id !== main && !owned.includes(id) && has(id));
  return [main, ...owned, ...extra].slice(0, 3);
}
function showScene(done, mainId) {
  const cast = pickCast(mainId);
  const root = document.createElement("div");
  root.id = "title";
  root.className = "ttl-scene";
  root.innerHTML = `
    <div class="ttl-bg" style="background-image:url('assets/title-bg.webp')"></div>
    <div class="ttl-logo"><span class="l2">트릭스터디</span><span class="l1">~교주님 공부하세요!~</span></div>
    <div class="ttl-ver">Ver 5.4 · 교주 전용</div>
    <div class="ttl-copy">♥ Trickcal fan-made study</div>
    <div class="ttl-cast">${cast.map((id, i) => `<div class="ttl-actor a${i}" data-id="${id}"></div>`).join("")}</div>
    <div class="ttl-sweep"></div>
    <div class="ttl-hint" id="ttl-hint">볼을 잡아당겨서 시작하기!</div>
    <div class="ttl-dday hidden" id="ttl-dday"></div>
    <div class="ttl-tap" id="ttl-tap">
      <div class="ttl-tap-msg">화면을 터치해 주세요</div>
    </div>`;
  root.classList.add("wait", "tapwait"); // ① 화면 터치 → 메인 테마 ② 사도들이 솨악~ 등장 ③ 볼 당겨서 시작
  document.body.appendChild(root);
  document.body.classList.add("title-open");
  let t0 = 0, tapped = false;
  const tap = () => {
    if (tapped) return;
    tapped = true; t0 = Date.now();
    if (window.BGM) window.BGM.title(); // 터치(사용자 조작) 직후라 바로 재생됨
    TS.sfx("click");
    root.classList.remove("tapwait");
    setTimeout(() => root.querySelector("#ttl-tap").remove(), 700);
  };
  // 크롬은 손가락을 '뗄 때'(click)만 소리 재생 허락으로 침 → pointerdown 말고 click
  root.querySelector("#ttl-tap").addEventListener("click", tap);
  const waitT = setInterval(() => {
    if (!tapped) return;
    const n = root.querySelectorAll(".ttl-actor.live").length;
    if (n < actors.length && Date.now() - t0 < 3500) return;
    clearInterval(waitT);
    root.classList.replace("wait", "intro");
    TS.sfx("flip");
    setTimeout(() => root.classList.remove("intro"), 1800);
  }, 80);
  const hint = root.querySelector("#ttl-hint");
  renderDday(root.querySelector("#ttl-dday"));
  const ddTimer = setInterval(() => renderDday(root.querySelector("#ttl-dday")), 1000);
  let finished = false, drag = null;
  const actors = [...root.querySelectorAll(".ttl-actor")].map((el) => ({ el, id: el.dataset.id, live: mountLive(el, el.dataset.id, "bust") }));
  // 겹쳐 있어서, 누른 곳에서 볼이 가장 가까운 사도를 잡음
  const castEl = root.querySelector(".ttl-cast");
  castEl.addEventListener("pointerdown", (e) => {
    if (finished || drag || e.button > 0) return;
    let best = null, bd = Infinity;
    for (const a of actors) {
      if (!a.live.ready()) continue;
      const d = a.live.near(e.clientX, e.clientY);
      if (d < bd) { bd = d; best = a; }
    }
    if (!best || bd > Math.max(90, best.el.clientWidth * 0.22)) return;
    e.preventDefault();
    castEl.setPointerCapture(e.pointerId);
    drag = { a: best, sx: e.clientX, sy: e.clientY, dx: 0, dy: 0 };
    best.live.grab(e.clientX, e.clientY);
    best.el.classList.add("pulling");
    if (!TS.voice(best.id, "pull")) TS.sfx("poke");
  });
  castEl.addEventListener("pointermove", (e) => {
    if (!drag) return;
    drag.dx = e.clientX - drag.sx; drag.dy = e.clientY - drag.sy;
    drag.a.live.move(e.clientX, e.clientY);
    hint.textContent = Math.hypot(drag.dx, drag.dy) > far() ? "놓으면 시작!" : "쭈우욱~";
  });
  const up = () => {
    if (!drag) return;
    const d = drag, a = d.a; drag = null;
    if (Math.hypot(d.dx, d.dy) > far()) { finished = true; a.live.release(() => finish()); }
    else { hint.textContent = "조금 더 세게 당겨주세요!"; TS.sfx("click"); a.live.release(() => a.el.classList.remove("pulling")); }
  };
  castEl.addEventListener("pointerup", up);
  castEl.addEventListener("pointercancel", up);
  const far = () => Math.min(window.innerWidth, window.innerHeight) * 0.16;
  function finish() {
    finished = true;
    TS.sfx("level");
    clearInterval(waitT);
    root.classList.remove("intro", "wait");
    root.classList.add("go"); // 로고가 가운데로 크게
    if (window.BGM) window.BGM.onStart();
    setTimeout(() => {
      root.classList.add("bye");
      document.body.classList.remove("title-open");
      setTimeout(() => { clearInterval(ddTimer); actors.forEach((a) => a.live.dispose()); root.remove(); done(); }, 550);
    }, 1300);
  }
  const onKey = (e) => {
    if (finished) return document.removeEventListener("keydown", onKey);
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    if (!tapped) return tap(); // 첫 Enter는 터치와 같음
    document.removeEventListener("keydown", onKey); finish();
  };
  document.addEventListener("keydown", onKey);
  modeSwitch(root, done, () => { finished = true; clearInterval(ddTimer); clearInterval(waitT); actors.forEach((a) => a.live.dispose()); document.removeEventListener("keydown", onKey); document.body.classList.remove("title-open"); });
}

function show(done) {
  if (TS.isPlain()) return showPlain(done);
  const mainId = (TS.SADO_MAP[TS.state.partner] ? TS.state.partner : "butter");
  if (window.Live && window.Live.canLive(mainId)) return showScene(done, mainId);
  const s = TS.state;
  const c = TS.SADO_MAP[s.partner] || TS.SADO_MAP.butter;
  const src = TS.emoteSrc(c);
  const root = document.createElement("div");
  root.id = "title";
  root.innerHTML = `
    <div class="ttl-bg" style="background-image:url('assets/bg/${s.bg || "trickcal"}.jpg')"></div>
    <div class="ttl-logo"><span class="l2">트릭스터디</span><span class="l1">~교주님 공부하세요!~</span></div>
    <div class="ttl-ver">Ver 5.4 · 교주 전용</div>
    <div class="ttl-copy">♥ Trickcal fan-made study</div>
    <div class="ttl-face" id="ttl-face">
      <img id="ttl-img" src="${src}" alt="" draggable="false">
      <canvas id="ttl-cv" width="420" height="420"></canvas>
      <span class="ttl-hand">👌</span>
      <span class="ttl-pop" id="ttl-pop">뾰옹~!</span>
    </div>
    <div class="ttl-hint" id="ttl-hint">볼을 잡아당겨서 시작하기!</div>
    <div class="ttl-dday hidden" id="ttl-dday"></div>`;
  document.body.appendChild(root);
  document.body.classList.add("title-open");

  const face = root.querySelector("#ttl-face"), img = root.querySelector("#ttl-img");
  const cv = root.querySelector("#ttl-cv"), g = cv.getContext("2d", { willReadFrequently: true });
  const hint = root.querySelector("#ttl-hint");
  renderDday(root.querySelector("#ttl-dday"));
  const ddTimer = setInterval(() => renderDday(root.querySelector("#ttl-dday")), 1000);
  const W = cv.width, H = cv.height, R = W * 0.42;
  const live = mountLive(face, c.id);
  let srcData = null, out = null, canWarp = true;
  let drag = null; // { gx, gy, sx, sy, dx, dy }
  let finished = false;

  const toCanvas = (e) => {
    const r = face.getBoundingClientRect(); // 캔버스는 숨겨진 상태일 수 있어서 틀 기준
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  function capture() {
    g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
    // object-fit: cover
    const iw = img.naturalWidth || 1, ih = img.naturalHeight || 1, k = Math.max(W / iw, H / ih);
    g.drawImage(img, (W - iw * k) / 2, (H - ih * k) / 2, iw * k, ih * k);
    try { srcData = g.getImageData(0, 0, W, H); out = g.createImageData(W, H); canWarp = true; }
    catch (err) { canWarp = false; } // file:// 로 열면 캔버스 읽기가 막힘 → CSS로 대체
    face.classList.toggle("nowarp", !canWarp);
  }
  function warp(dx, dy, gx, gy) {
    const len = Math.hypot(dx, dy), maxL = R * 0.6;
    if (len > maxL) { dx *= maxL / len; dy *= maxL / len; }
    if (!canWarp) {
      img.style.transformOrigin = `${(gx / W) * 100}% ${(gy / H) * 100}%`;
      img.style.transform = `translate(${dx / 3}px, ${dy / 3}px) scale(${1 + Math.abs(dx) / 600}, ${1 + Math.abs(dy) / 600})`;
      return;
    }
    const sd = srcData.data, od = out.data;
    od.set(sd);
    const cx = gx + dx, cy = gy + dy, R2 = R * R;
    const x0 = Math.max(0, Math.floor(cx - R)), x1 = Math.min(W - 1, Math.ceil(cx + R));
    const y0 = Math.max(0, Math.floor(cy - R)), y1 = Math.min(H - 1, Math.ceil(cy + R));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const ex = x - cx, ey = y - cy, r2 = ex * ex + ey * ey;
        if (r2 >= R2) continue;
        const f = 1 - r2 / R2, w = f * f;
        let sx = Math.round(x - dx * w), sy = Math.round(y - dy * w);
        sx = sx < 0 ? 0 : sx >= W ? W - 1 : sx; sy = sy < 0 ? 0 : sy >= H ? H - 1 : sy;
        const si = (sy * W + sx) * 4, oi = (y * W + x) * 4;
        od[oi] = sd[si]; od[oi + 1] = sd[si + 1]; od[oi + 2] = sd[si + 2]; od[oi + 3] = sd[si + 3];
      }
    }
    g.putImageData(out, 0, 0);
    // 당길수록 볼이 빨개짐
    const k = Math.min(1, Math.hypot(dx, dy) / maxL);
    const grad = g.createRadialGradient(cx, cy, 0, cx, cy, R * 0.45);
    grad.addColorStop(0, `rgba(255,110,140,${0.35 * k})`);
    grad.addColorStop(1, "rgba(255,110,140,0)");
    g.fillStyle = grad; g.fillRect(cx - R, cy - R, R * 2, R * 2);
  }
  function springBack(d, after) {
    const t0 = performance.now();
    const step = (now) => {
      const t = (now - t0) / 1000;
      const a = Math.exp(-7 * t) * Math.cos(20 * t);
      warp(d.dx * a, d.dy * a, d.gx, d.gy);
      if (t < 0.6) requestAnimationFrame(step);
      else { warp(0, 0, d.gx, d.gy); face.classList.remove("pulling"); img.style.transform = ""; after && after(); }
    };
    requestAnimationFrame(step);
  }

  face.addEventListener("pointerdown", (e) => {
    if (finished) return;
    e.preventDefault();
    face.setPointerCapture(e.pointerId);
    if (live.ready()) {
      drag = { live: true, sx: e.clientX, sy: e.clientY, dx: 0, dy: 0 };
      live.grab(e.clientX, e.clientY);
      face.classList.add("pulling");
      if (!TS.voice(c.id, "pull")) TS.sfx("poke");
      return;
    }
    capture();
    const p = toCanvas(e);
    drag = { gx: p.x, gy: p.y, sx: p.x, sy: p.y, dx: 0, dy: 0 };
    face.classList.add("pulling");
    if (!TS.voice(c.id, "pull")) TS.sfx("poke");
  });
  face.addEventListener("pointermove", (e) => {
    if (!drag) return;
    if (drag.live) {
      drag.dx = e.clientX - drag.sx; drag.dy = e.clientY - drag.sy;
      live.move(e.clientX, e.clientY);
      hint.textContent = Math.hypot(drag.dx, drag.dy) > face.clientWidth * 0.3 ? "놓으면 시작!" : "쭈우욱~";
      return;
    }
    const p = toCanvas(e);
    drag.dx = p.x - drag.sx; drag.dy = p.y - drag.sy;
    warp(drag.dx, drag.dy, drag.gx, drag.gy);
    hint.textContent = Math.hypot(drag.dx, drag.dy) > W * 0.3 ? "놓으면 시작!" : "쭈우욱~";
  });
  const release = () => {
    if (!drag) return;
    const d = drag; drag = null;
    if (d.live) {
      const far = Math.hypot(d.dx, d.dy) > face.clientWidth * 0.3;
      if (far) { finished = true; live.release(() => finish(null)); }
      else { hint.textContent = "조금 더 세게 당겨주세요!"; TS.sfx("click"); live.release(() => face.classList.remove("pulling")); }
      return;
    }
    if (Math.hypot(d.dx, d.dy) > W * 0.3) finish(d);
    else { hint.textContent = "조금 더 세게 당겨주세요!"; TS.sfx("click"); springBack(d); }
  };
  face.addEventListener("pointerup", release);
  face.addEventListener("pointercancel", release);

  function finish(d) {
    if (finished && d) return;
    finished = true;
    TS.sfx("level");
    const pop = root.querySelector("#ttl-pop");
    pop.classList.add("show");
    hint.textContent = "출발!";
    const go = () => {
      root.classList.add("bye");
      document.body.classList.remove("title-open");
      if (window.BGM) window.BGM.onStart(); // 사용자 조작 직후라 자동재생 가능
      setTimeout(() => { clearInterval(ddTimer); live.dispose(); root.remove(); done(); }, 550);
    };
    if (d) springBack(d, go); else go();
  }
  const onKey = (e) => {
    if (finished) return document.removeEventListener("keydown", onKey);
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); document.removeEventListener("keydown", onKey); finish(null); }
  };
  document.addEventListener("keydown", onKey);
  modeSwitch(root, done, () => { finished = true; clearInterval(ddTimer); document.removeEventListener("keydown", onKey); document.body.classList.remove("title-open"); });
}
/* ───── 움직이는 사도(Spine)로 진짜 볼 당기기 ─────
   트릭컬 스켈레톤엔 볼 뼈(Character_Ball_Move = 한쪽 볼, *_Ball_L = 반대쪽 볼)가 있어서
   그 뼈를 끌면 볼 살이 늘어남. 잡는 동안 Touch_Idle(꼬집힌 얼굴), 놓으면 띠용 돌아오고 Touch_End */
function mountLive(face, id, frame = "face") {
  const none = { ready: () => false, near: () => Infinity, grab() {}, move() {}, release(cb) { cb && cb(); }, dispose() {} };
  if (!window.Live || !window.Live.canLive(id)) return none;
  const box = document.createElement("div");
  box.className = "ttl-live";
  face.appendChild(box);
  let ctrl = null, ok = false, bones = [];
  const pull = { bone: null, wx: 0, wy: 0, start: null, on: false };
  ctrl = window.Live.mount(box, id, {
    frame,
    onReady: (c) => {
      const sk = c.player.skeleton;
      const ball = sk.findBone("Character_Ball_Move");
      const left = sk.bones.find((b) => /^(S\d+_)?(F_)?Ball_L$/.test(b.data.name));
      bones = [ball, left].filter(Boolean);
      if (!bones.length || !c.anims.includes("Touch_Idle")) return; // 볼 뼈가 없으면 기존 방식
      const orig = sk.updateWorldTransform.bind(sk);
      sk.updateWorldTransform = function (...a) {
        // 꼬집힌 얼굴의 붉은 기운(glow·Shy) 효과는 여기선 회색 얼룩으로 보여서 숨김
        if (pull.on) for (const sl of sk.slots) if (sl.attachment && /glow|shy|blush/i.test(sl.attachment.name)) sl.attachment = null;
        orig(...a);
        if (!pull.bone || (!pull.wx && !pull.wy)) return;
        // 화면(월드) 기준으로 끈 만큼 → 부모 뼈 기준 이동량으로 바꿔서 적용
        const par = pull.bone.parent;
        const o = { x: par.worldX, y: par.worldY }, t = { x: par.worldX + pull.wx, y: par.worldY + pull.wy };
        par.worldToLocal(o); par.worldToLocal(t);
        const dx = t.x - o.x, dy = t.y - o.y;
        pull.bone.x += dx; pull.bone.y += dy;
        orig(...a);
        pull.bone.x -= dx; pull.bone.y -= dy;
      };
      ok = true;
      face.classList.add("live");
    },
  });
  if (!ctrl) { box.remove(); return none; }
  const toWorld = (cx, cy) => {
    const p = ctrl.player, cvs = p.canvas, r = cvs.getBoundingClientRect();
    const v = p.sceneRenderer.camera.screenToWorld(new spine.Vector3(cx - r.left, cy - r.top, 0), r.width, r.height);
    return { x: v.x, y: v.y };
  };
  const st = () => ctrl.player.animationState;
  let springT = 0;
  return {
    ready: () => ok,
    // 누른 곳 ↔ 가장 가까운 볼 뼈 거리 (화면 px)
    near(cx, cy) {
      const w = toWorld(cx, cy), r = ctrl.player.canvas.getBoundingClientRect();
      const k = r.width / ctrl.player.config.viewport.width;
      return Math.min(...bones.map((b) => Math.hypot(b.worldX - w.x, b.worldY - w.y))) * k;
    },
    grab(cx, cy) {
      cancelAnimationFrame(springT);
      const w = toWorld(cx, cy);
      pull.bone = bones.reduce((a, b) => (Math.hypot(b.worldX - w.x, b.worldY - w.y) < Math.hypot(a.worldX - w.x, a.worldY - w.y) ? b : a));
      pull.start = w; pull.wx = pull.wy = 0; pull.on = true;
      ctrl.busyUntil = Infinity;
      st().setAnimation(0, "Touch_Idle", true);
    },
    move(cx, cy) {
      const w = toWorld(cx, cy);
      let dx = w.x - pull.start.x, dy = w.y - pull.start.y;
      // 너무 늘리면 얼굴이 찢어져 보여서 살짝만 (끝으로 갈수록 뻣뻣하게)
      const len = Math.hypot(dx, dy), max = 85;
      if (len > 0) { const k = (max * Math.tanh(len / (max * 1.6))) / len; dx *= k; dy *= k; }
      pull.wx = dx; pull.wy = dy;
    },
    release(cb) {
      const x0 = pull.wx, y0 = pull.wy, t0 = performance.now();
      const step = (now) => {
        const t = (now - t0) / 1000, a = Math.exp(-6 * t) * Math.cos(22 * t);
        pull.wx = x0 * a; pull.wy = y0 * a;
        if (t < 0.7) { springT = requestAnimationFrame(step); return; }
        pull.wx = pull.wy = 0;
        if (ctrl.anims.includes("Touch_End")) st().setAnimation(0, "Touch_End", false);
        st().addAnimation(0, ctrl.idles[0] || ctrl.anims[0], true, 0);
        ctrl.busyUntil = Date.now() + 3000;
        setTimeout(() => (pull.on = false), 3000);
        cb && cb();
      };
      springT = requestAnimationFrame(step);
    },
    dispose() { cancelAnimationFrame(springT); ctrl.dispose(); },
  };
}

/* 시작 화면 D-day 보드: 가장 가까운 D-day는 크게 + 실시간 카운트다운 */
function renderDday(el) {
  if (!el || !window.Schedule) return;
  const list = window.Schedule.ddSorted().filter((d) => d.dayDiff >= 0 && (d.leftMin > 0 || !d.x.time));
  el.classList.toggle("hidden", !list.length);
  if (!list.length) return;
  const esc = TS.esc, [top, ...rest] = list;
  const left = (d) => {
    if (d.leftMin <= 0) return "오늘이에요!";
    const s = Math.floor(d.leftMin * 60), day = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
    return day ? `${day}일 ${h}시간 ${m}분 남음` : `${h}시간 ${m}분 ${s % 60}초 남음`;
  };
  el.className = "ttl-dday" + (top.dayDiff <= 3 ? " soon" : "");
  el.innerHTML = `
    <div class="ttl-dd-head">📌 D-day</div>
    <div class="ttl-dd-top"><b>${top.label}</b><span>${esc(top.x.title)}</span></div>
    <div class="ttl-dd-left">${left(top)}</div>
    ${rest.length ? `<ul>${rest.slice(0, 3).map((d) => `<li class="${d.dayDiff <= 3 ? "soon" : ""}"><b>${d.label}</b>${esc(d.x.title)}</li>`).join("")}</ul>` : ""}`;
}
window.TitleScreen = { show };
})();
