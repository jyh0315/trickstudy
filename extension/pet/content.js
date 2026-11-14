/* 트릭스터디 펫 — 모든 페이지 아래쪽에 사도를 띄우고 돌아다니게 함 */
(() => {
  "use strict";
  if (window.top !== window || window.__trickpet) return;
  window.__trickpet = 1;
  // 트릭스터디 사이트 안에서는 이미 사도가 있으니 기본으로 숨김
  const onSite = location.host === "jyh0315.github.io" && location.pathname.startsWith("/trickstudy");
  const SIZES = { s: [140, 150], m: [190, 205], l: [250, 270] };
  const DEF = { enabled: true, size: "m", walk: true, onSite: false, x: null, off: [] };
  let cfg = { ...DEF }, frame = null, W = 150, H = 180;
  let x = 0, y = 0, vy = 0, dir = 1, target = null, mode = "idle", until = 0, last = 0, raf = 0, falling = false, grabbed = false;
  const floor = () => 0; // 화면 아래가 바닥
  const maxX = () => Math.max(0, document.documentElement.clientWidth - W);
  const post = (m) => { try { frame.contentWindow.postMessage(m, "*"); } catch (e) { /* 아직 준비 전 */ } };
  const hostOff = () => (cfg.off || []).includes(location.host) || (onSite && !cfg.onSite);

  function build() {
    if (frame) return;
    [W, H] = SIZES[cfg.size] || SIZES.m;
    frame = document.createElement("iframe");
    frame.src = chrome.runtime.getURL("pet.html");
    frame.setAttribute("allowtransparency", "true");
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    Object.assign(frame.style, {
      position: "fixed", left: "0px", bottom: "0px", width: W + "px", height: H + "px", border: "0", padding: "0", margin: "0",
      background: "transparent", colorScheme: "light", zIndex: "2147483646", pointerEvents: "auto", display: "block",
      transition: "opacity .3s", opacity: "1", maxWidth: "none", maxHeight: "none",
    });
    document.documentElement.appendChild(frame); // body 에 transform 이 걸린 사이트에서도 화면 기준으로 고정
    x = cfg.x != null ? Math.min(maxX(), Math.max(0, cfg.x)) : Math.random() * maxX();
    y = 0; place();
    last = performance.now();
    raf = requestAnimationFrame(tick);
  }
  function destroy() {
    cancelAnimationFrame(raf);
    if (frame) frame.remove();
    frame = null;
  }
  function setDir(d) { if (d !== dir) { dir = d; post({ dir }); } }
  function choose(now) {
    if (sleeping) { mode = "idle"; until = now + 5000; return; }
    if (!cfg.walk) { mode = "idle"; until = now + 4000; post({ walk: false }); return; }
    if (Math.random() < 0.55) {
      mode = "walk"; lastLook = "off"; post({ look: null });
      target = Math.random() * maxX();
      if (Math.abs(target - x) < 60) target = x < maxX() / 2 ? x + 200 : x - 200;
      target = Math.min(maxX(), Math.max(0, target));
      setDir(target > x ? 1 : -1);
      post({ walk: true });
    } else {
      mode = "idle";
      until = now + 3000 + Math.random() * 6000;
      post({ walk: false });
      if (Math.random() < 0.3) talk("chat", 45000);
      else if (Math.random() < 0.2) post({ react: "happy" });
    }
  }
  let hop = 0, hopY = 0, saved = 0;
  function place() {
    if (!frame) return;
    frame.style.transform = `translate(${Math.round(x)}px, ${-Math.round(y + hopY)}px)`;
  }
  function tick(now) {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!frame) return;
    // 전체 화면(영상 등)일 땐 숨김
    const fs = document.fullscreenElement ? "none" : "block";
    if (frame.style.display !== fs) frame.style.display = fs;
    if (grabbed) return;
    if (falling) { // 놓으면 떨어짐 (걸을 때 통통 뛰는 건 hopY 로 따로 처리)
      vy -= 1800 * dt; y += vy * dt;
      if (y <= floor()) { y = 0; vy = 0; falling = false; post({ react: "dizzy" }); until = now + 2500; mode = "idle"; }
      place(); return;
    }
    if (mode === "walk") {
      x += 55 * dt * dir; // px/초
      hop += dt * 9;
      hopY = Math.abs(Math.sin(hop)) * 6;
      if ((dir > 0 && x >= target) || (dir < 0 && x <= target) || x <= 0 || x >= maxX()) { x = Math.min(maxX(), Math.max(0, target)); hopY = 0; hop = 0; choose(now); }
    } else {
      hopY = 0;
      if (now > until) choose(now);
      else look(now);
    }
    x = Math.min(maxX(), Math.max(0, x));
    place();
    if (now - saved > 3000) { saved = now; chrome.storage.local.set({ x: Math.round(x) }); }
  }
  /* 마우스 바라보기: 서 있을 때 마우스 쪽으로 몸을 돌리고, 고개를 위아래로 */
  let mx = null, my = null, mAt = 0, flipAt = 0, lastLook = "";
  function look(now) {
    if (mx == null || !frame) return;
    const cx = x + W / 2, cy = innerHeight - y - H * 0.55;
    const fresh = Date.now() - mAt < 6000;
    if (fresh && !sleeping && Math.abs(mx - cx) > 40 && now - flipAt > 700) { const d = mx > cx ? 1 : -1; if (d !== dir) { flipAt = now; setDir(d); } }
    const msg = fresh && !sleeping ? Math.round(mx - cx) + "," + Math.round(my - cy) : "off";
    if (msg !== lastLook) { lastLook = msg; post({ look: fresh && !sleeping ? { dx: mx - cx, dy: my - cy } : null }); }
  }
  // 펫 창에서 오는 신호 (끌기·놓기)
  window.addEventListener("message", (e) => {
    if (!frame || e.source !== frame.contentWindow || !e.data || !e.data.__trickpet) return;
    const m = e.data;
    if (m.pet === "grab") { grabbed = true; mode = "idle"; hopY = 0; falling = false; }
    if (m.pet === "drag") { x = Math.min(maxX(), Math.max(0, x + m.dx)); y = Math.max(0, Math.min(innerHeight - H, y - m.dy)); place(); }
    if (m.pet === "look") { const r = frame.getBoundingClientRect(); mx = r.left + m.x; my = r.top + m.y; mAt = Date.now(); }
    if (m.pet === "drop") { grabbed = false; falling = y > 0; vy = 0; chrome.storage.local.set({ x: Math.round(x) }); }
    if (m.pet === "poke") { mode = "idle"; until = performance.now() + 3500; post({ walk: false }); }
    if (m.pet === "sulk") { mode = "idle"; until = performance.now() + 15000; setDir(-dir); post({ walk: false }); }
    if (m.pet === "sleep") { sleeping = true; mode = "idle"; post({ walk: false }); }
    if (m.pet === "wake") { sleeping = false; lastAct = Date.now(); until = performance.now() + 2500; }
    if (m.pet === "poke" || m.pet === "grab") active();
    if (m.pet === "ready") {
      post({ dir, walk: mode === "walk" });
      if (!greeted) { greeted = true; setTimeout(() => { if (VIDEO.test(location.host)) talk("video", 0); else if (STUDY.test(location.host + location.pathname)) talk("study", 0); else if (Math.random() < 0.5) talk("greet", 0); }, 2500); }
    }
  });
  /* 브라우저에서 하는 일에 반응 (이 페이지 안에서만 보고, 아무 데도 보내지 않음) */
  const VIDEO = /(^|\.)(youtube\.com|youtu\.be|netflix\.com|twitch\.tv|tiktok\.com|chzzk\.naver\.com|laftel\.net|tving\.com|wavve\.com)$/;
  const STUDY = /classroom\.google|docs\.google|ebsi\.co\.kr|ebs\.co\.kr|khanacademy|quizlet|notion\.so|mathpid|wikipedia\.org/;
  let greeted = false, sleeping = false, lastAct = Date.now(), lastTalk = 0, keys = [], scrolls = [], lastScrollY = scrollY, hiddenAt = 0;
  const cool = {};
  function talk(ev, cd) {
    const now = Date.now();
    if (!frame || grabbed || now - lastTalk < 12000 || now < (cool[ev] || 0)) return;
    lastTalk = now; cool[ev] = now + (cd || 0);
    post({ event: ev });
  }
  function active() {
    lastAct = Date.now();
    if (sleeping) { sleeping = false; post({ event: "wake" }); until = performance.now() + 2500; }
  }
  setInterval(() => { // 3분 동안 아무것도 안 하면 꾸벅꾸벅
    if (frame && !sleeping && !grabbed && Date.now() - lastAct > 180000) { sleeping = true; mode = "idle"; post({ walk: false, event: "sleep" }); }
  }, 5000);
  addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; mAt = Date.now(); if (Date.now() - lastAct > 1000) active(); }, { passive: true });
  addEventListener("keydown", (e) => {
    active();
    const t = e.target, typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA)$/.test(t.tagName));
    if (!typing) return;
    const now = Date.now();
    keys = keys.filter((k) => now - k < 20000); keys.push(now);
    if (keys.length > 60) { keys = []; talk("typing", 180000); }
  }, true);
  addEventListener("scroll", () => {
    active();
    const now = Date.now(), d = Math.abs(scrollY - lastScrollY); lastScrollY = scrollY;
    scrolls = scrolls.filter((s) => now - s.t < 2000); scrolls.push({ t: now, d });
    if (scrolls.reduce((a, s) => a + s.d, 0) > innerHeight * 6) { scrolls = []; talk("scroll", 90000); }
  }, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { hiddenAt = Date.now(); return; }
    if (hiddenAt && Date.now() - hiddenAt > 5 * 60000) { active(); setTimeout(() => talk("back", 0), 600); }
    hiddenAt = 0;
  });
  window.addEventListener("resize", () => { x = Math.min(maxX(), x); place(); });

  function apply() {
    const want = cfg.enabled && !hostOff();
    if (!want) return destroy();
    const [w, h] = SIZES[cfg.size] || SIZES.m;
    if (frame && (w !== W || h !== H)) destroy();
    build();
  }
  chrome.storage.local.get(DEF, (s) => { cfg = { ...DEF, ...s }; apply(); });
  chrome.storage.onChanged.addListener((c) => {
    let need = false;
    for (const k of ["enabled", "size", "walk", "onSite", "off"]) if (c[k]) { cfg[k] = c[k].newValue; need = true; }
    if (need) apply();
  });
})();
