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
    (document.body || document.documentElement).appendChild(frame);
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
  function place() {
    if (!frame) return;
    frame.style.transform = `translate(${x}px, ${-y}px)`;
  }
  function setDir(d) { if (d !== dir) { dir = d; post({ dir }); } }
  function choose(now) {
    if (!cfg.walk) { mode = "idle"; until = now + 4000; post({ walk: false }); return; }
    if (Math.random() < 0.55) {
      mode = "walk";
      target = Math.random() * maxX();
      if (Math.abs(target - x) < 60) target = x < maxX() / 2 ? x + 200 : x - 200;
      target = Math.min(maxX(), Math.max(0, target));
      setDir(target > x ? 1 : -1);
      post({ walk: true });
    } else {
      mode = "idle";
      until = now + 3000 + Math.random() * 6000;
      post({ walk: false });
      if (Math.random() < 0.25) post({ react: "happy" });
    }
  }
  let hop = 0, saved = 0;
  function tick(now) {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!frame) return;
    // 전체 화면(영상 등)일 땐 숨김
    frame.style.display = document.fullscreenElement ? "none" : "block";
    if (grabbed) return;
    if (falling || y > 0) { // 놓으면 떨어짐
      vy -= 1800 * dt; y += vy * dt;
      if (y <= floor()) { y = 0; vy = 0; if (falling) { falling = false; post({ react: "dizzy" }); until = now + 2500; mode = "idle"; } }
      place(); return;
    }
    if (mode === "walk") {
      const speed = 55; // px/초
      const step = speed * dt * dir;
      x += step;
      hop += dt * 9;
      y = Math.abs(Math.sin(hop)) * 7; // 통통 뛰는 걸음
      if ((dir > 0 && x >= target) || (dir < 0 && x <= target)) { x = target; y = 0; hop = 0; choose(now); }
    } else if (now > until) choose(now);
    x = Math.min(maxX(), Math.max(0, x));
    place();
    if (now - saved > 3000) { saved = now; chrome.storage.local.set({ x: Math.round(x) }); }
  }
  // 펫 창에서 오는 신호 (끌기·놓기)
  window.addEventListener("message", (e) => {
    if (!frame || e.source !== frame.contentWindow || !e.data || !e.data.__trickpet) return;
    const m = e.data;
    if (m.pet === "grab") { grabbed = true; mode = "idle"; }
    if (m.pet === "drag") { x = Math.min(maxX(), Math.max(0, x + m.dx)); y = Math.max(0, Math.min(innerHeight - H, y - m.dy)); place(); }
    if (m.pet === "drop") { grabbed = false; falling = y > 0; vy = 0; chrome.storage.local.set({ x: Math.round(x) }); }
    if (m.pet === "poke") { mode = "idle"; until = performance.now() + 3500; post({ walk: false }); }
    if (m.pet === "ready") post({ dir, walk: mode === "walk" });
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
