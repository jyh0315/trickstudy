/* =========================================================
   🧭 처음 시작 튜토리얼 — 대표 사도가 화면 곳곳을 짚으며 안내
   - 처음 시작(이름·사도 고르기)이 끝나고 창이 모두 닫히면 자동으로 한 번
   - 기록 → 설정의 「🧭 튜토리얼 다시 보기」로 언제든 다시
   ========================================================= */
(() => {
"use strict";
const TS = window.TS;
const $ = (id) => document.getElementById(id);
const S = () => TS.state;
const esc = TS.esc;

const STEPS = [
  { view: "lobby", sel: null, t: "어서 오세요, {me} 교주님!", d: "트릭스터디는 <b>공부할수록 사도들과 함께 성장하는</b> 곳이에요. 제가 하나씩 알려 드릴게요!" },
  { view: "lobby", sel: "#partner", t: "저는 대표 사도예요", d: "<b>누르면 콕</b>, <b>빠르게 두 번 누르면 꿀밤</b>, <b>길게 누르면 쓰다듬기</b>예요. 같이 공부할수록 <b>호감도</b>가 올라가요." },
  { view: "timer", sel: '[data-view="timer"]', t: "⏰ 집중", d: "공부의 시작! <b>25분 집중 → 5분 휴식</b>을 반복해요. 집중한 시간만큼 <b>엘리프·경험치</b>를 받아요. 중간에 그만두면… 제가 반성문을 써요." },
  { view: "todo", sel: '[data-view="todo"]', t: "📜 의뢰", d: "오늘 할 일을 적어 두는 곳이에요. 하루에 <b>쉬움 3 · 보통 2 · 어려움 1</b>개까지 받을 수 있어요." },
  { view: "quest", sel: '[data-view="quest"]', t: "🎯 임무", d: "매일·매주 목표를 채우면 보상이 쌓여요. <b>빨간 점</b>이 보이면 받으러 가요!" },
  { view: "season", sel: '[data-view="season"]', t: "🎖️ 시즌", d: "학기마다 새로 시작하는 <b>시즌 패스</b>예요. 공부할수록 단계가 올라가고, 시즌 한정 칭호·프레임을 모을 수 있어요." },
  { view: "gacha", sel: '[data-view="gacha"]', t: "✉️ 모집", d: "모은 엘리프로 <b>사도 " + SADO.length + "명</b>을 모집해요. 처음 받은 엘리프로 <b>10회 모집</b>부터 해 봐요! ★★★는 <b>3%</b>, 50번 안에 한 명은 꼭 와요. 중복은 표정 → 돌파 → 별사탕으로 바뀌어요." },
  { view: "sado", sel: '[data-view="sado"]', t: "📖 사도", d: "모은 사도 도감이에요. 사도를 눌러서 <b>대표 사도</b>를 바꾸고, 돌파·친밀도 대사·어사이드를 볼 수 있어요." },
  { view: "story", sel: '[data-view="story"]', t: "🎬 이야기", d: "트릭컬 메인 스토리와 사도 이야기를 볼 수 있어요. <b>공부한 시간만큼</b> 다음 이야기가 열려요!" },
  { view: "boss", sel: '[data-view="boss"]', t: "👹 보스", d: "집중할 때마다 보스에게 데미지가 들어가요. 매주 새 보스가 나와요." },
  { view: "rank", sel: '[data-view="rank"]', t: "🏆 랭킹 · 👥 공부방", d: "다른 교주님들과 공부 시간을 겨루거나, 공부방에서 <b>같이 공부</b>할 수 있어요." },
  { view: "lobby", sel: "#ss-btn", t: "🌙 화면보호기", d: "공부하는 동안 켜 두면 사도들이 화면을 돌아다니며 응원해요. 움직이는 CG 배경도 있어요." },
  { view: "lobby", sel: "#talk-btn", t: "💬 대화 · 💌 편지", d: "가진 사도들끼리 가끔 대화를 나눠요. 매주 월요일엔 제가 지난주 공부를 <b>편지</b>로 정리해 드릴게요." },
  { view: "stats", sel: '[data-view="stats"]', t: "📊 기록", d: "공부 기록·잔디·과목 밸런스를 볼 수 있어요. <b>설정</b>에서 이름·음성·움직이는 사도를 바꾸고, <b>데이터 내보내기</b>로 백업도 해 두세요!" },
  { view: "lobby", sel: null, t: "준비 끝!", d: "그럼 첫 집중을 시작해 볼까요? 교주님 옆에서 계속 응원할게요!", last: true },
];

let ov = null, i = 0;
function start() {
  if (ov) return;
  i = 0;
  ov = document.createElement("div");
  ov.className = "tu-overlay";
  ov.innerHTML = `<div class="tu-hole"></div><div class="tu-card"><img class="tu-chibi" alt=""><div class="tu-body"><b class="tu-t"></b><p class="tu-d"></p>
    <div class="tu-nav"><span class="tu-n"></span><button class="btn white small" data-tu="skip">건너뛰기</button><button class="btn white small" data-tu="prev">이전</button><button class="btn yellow small" data-tu="next">다음</button></div></div></div>`;
  document.body.appendChild(ov);
  ov.addEventListener("click", (e) => {
    const b = e.target.closest("[data-tu]");
    if (!b) return;
    if (b.dataset.tu === "skip") return end();
    if (b.dataset.tu === "prev") { i = Math.max(0, i - 1); return show(); }
    if (STEPS[i].last) { end(); TS.go("timer"); return; }
    i++; show();
  });
  window.addEventListener("resize", place);
  show();
}
function show() {
  const st = STEPS[i], c = TS.SADO_MAP[S().partner] || TS.SADO_MAP.erpin;
  ov.querySelector(".tu-chibi").src = TS.chibiSrc(c);
  ov.querySelector(".tu-t").textContent = st.t.replace("{me}", S().name || "교주");
  ov.querySelector(".tu-d").innerHTML = st.d;
  ov.querySelector(".tu-n").textContent = `${i + 1} / ${STEPS.length}`;
  ov.querySelector('[data-tu="prev"]').style.visibility = i ? "visible" : "hidden";
  ov.querySelector('[data-tu="next"]').textContent = st.last ? "집중하러 가기!" : "다음";
  // 그 창으로 바꿔서 보여주기
  if (st.view && TS.view !== st.view) TS.go(st.view);
  document.querySelectorAll(".tu-tab").forEach((x) => x.classList.remove("tu-tab"));
  const tab = st.sel && /data-view/.test(st.sel) && document.querySelector(st.sel);
  if (tab) tab.classList.add("tu-tab");
  const el = st.sel && !tab && document.querySelector(st.sel);
  if (el) el.scrollIntoView({ block: "center", behavior: "smooth" }); else window.scrollTo({ top: 0, behavior: "smooth" });
  setTimeout(place, 380);
  TS.sfx("click");
}
function place() {
  if (!ov) return;
  const st = STEPS[i], hole = ov.querySelector(".tu-hole"), card = ov.querySelector(".tu-card");
  const isTab = st.sel && /data-view/.test(st.sel);
  // 창 설명: 탭을 누른 것처럼 그 창 전체를 밝게 보여주고, 설명은 화면 아래에
  if (isTab) {
    const v = document.getElementById("view-" + st.view);
    const r0 = v ? v.getBoundingClientRect() : null;
    if (r0) {
      const top = Math.max(r0.top, 6), bottom = Math.min(r0.bottom, innerHeight - 6);
      Object.assign(hole.style, { left: r0.left - 6 + "px", top: top - 6 + "px", width: r0.width + 12 + "px", height: Math.max(40, bottom - top) + 12 + "px" });
      hole.classList.remove("none");
    }
    card.classList.remove("mid"); card.classList.add("bottom");
    card.style.left = card.style.top = card.style.width = "";
    return;
  }
  card.classList.remove("bottom");
  const el = st.sel && document.querySelector(st.sel);
  if (!el || !el.offsetParent) { hole.classList.add("none"); card.classList.add("mid"); card.style.left = card.style.top = ""; return; }
  hole.classList.remove("none"); card.classList.remove("mid");
  const r = el.getBoundingClientRect(), pad = 8;
  Object.assign(hole.style, { left: r.left - pad + "px", top: r.top - pad + "px", width: r.width + pad * 2 + "px", height: r.height + pad * 2 + "px" });
  // 설명 카드는 강조한 곳 아래(공간이 없으면 위)에
  const cw = Math.min(380, innerWidth - 24), ch = card.offsetHeight || 170;
  let top = r.bottom + 16; if (top + ch > innerHeight - 10) top = Math.max(10, r.top - ch - 16);
  const left = Math.min(Math.max(12, r.left + r.width / 2 - cw / 2), innerWidth - cw - 12);
  Object.assign(card.style, { left: left + "px", top: top + "px", width: cw + "px" });
}
function end() {
  if (!ov) return;
  ov.remove(); ov = null; window.removeEventListener("resize", place);
  document.querySelectorAll(".tu-tab").forEach((x) => x.classList.remove("tu-tab"));
  S().tutorialDone = 1; TS.save();
}

// 처음 시작이 끝나고 창이 모두 닫히면 한 번
setInterval(() => {
  const s = S();
  if (ov || !s.started || s.tutorialDone || TS.modalOpen || document.querySelector("#title, .ld-overlay, #story, .gacha-stage")) return;
  start();
}, 1200);

// 기록 → 설정에 다시 보기 버튼
const prof = $("open-profile");
if (prof) {
  const b = document.createElement("button");
  b.className = "btn white small"; b.textContent = "🧭 튜토리얼 다시 보기"; b.style.marginLeft = "6px";
  b.onclick = () => { TS.go("lobby"); setTimeout(start, 300); };
  prof.after(b);
}
window.Tutorial = { start };
})();
