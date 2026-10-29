/* =========================================================
   펫 — 펫 뽑기 · 펫 가방 · 대표 사도 아래 동행 · 화면 보호기 산책
   - 엘리프로 펫을 뽑음 (전설 / 희귀 / 고급 / 일반)
   - 중복 펫은 별사탕으로 바뀜
   - 고른 펫은 대표 사도 아래에서 왔다 갔다, 화면 보호기에서는 화면을 돌아다님
   ========================================================= */
const PET_NAMES = [
  "청설용", "뜬다고래", "쁘띠 나타", "미니 시장님", "아이돌", "핫도그마", "에르핀 더 돌잡러", "뽀리냥", "낀냥이", "쁘띠 에루",
  "핫거부크", "쁘띠 재미의 왕", "쁘띠 크레용사용", "알뺑아리", "쁘띠 머스크", "청풍여우", "에르핀 더 치어리더", "따코무너", "쁘띠 바바", "쁘띠 버터",
  "쁘띠 스피키", "야채강 콤비", "쁘띠 서버 파랑새", "쁘띠 코미", "쁘띠 리뉴아", "해파리 가비아", "쁘띠 아멜리아", "쁘띠 선글라스 릴1리",
  "까망이", "쁘띠 릴1리", "쁘띠 크르브르스", "쁘띠 먀오", "설까치", "풍뎅이", "꾸물범", "뚜따키위", "잠바", "칙귄",
  "팹새", "신나구리", "펜젤 큐", "부농 진달래", "쉽파카", "삼두 당근", "풍성땃치", "바삭범", "먹물소시지", "햄마리",
  "베베하망", "꾸워바라", "말냥젤리", "아야고", "해달수", "잎눈토끼", "잠잠양", "완전 또까틈", "팔락칠라", "쁘띠 에피콘",
  "냥푸치노", "바나덕", "식빵덕", "완드냥", "미니카 시장님", "말랑콘", "체리 달팽이", "둥실멍", "호호바깅", "젤리링",
  "도넛멍", "쁘띠 체어 캣", "네온 사우루스", "딸기 찹쌀냥", "설표", "괴도제비", "베니냥",
  "리피트", "치즈냥", "꼬끄", "사토",
];
const PET_GRADES = {
  L: { label: "전설", color: "#b06cf0", rate: 0.04, candy: 20 },
  E: { label: "희귀", color: "#4a8cf0", rate: 0.36, candy: 5 },
  A: { label: "고급", color: "#7cc23a", rate: 0.30, candy: 2 },
  C: { label: "일반", color: "#9aa0ac", rate: 0.30, candy: 1 },
};
const PETS = PET_NAMES.map((name, i) => ({
  id: "p" + String(i).padStart(2, "0"), name, img: `assets/pets/${String(i).padStart(2, "0")}.webp`,
  grade: i < 28 ? "L" : i < 75 ? "E" : i < 77 ? "A" : "C",
}));
const PET_MAP = Object.fromEntries(PETS.map((p) => [p.id, p]));
const PET_COST = 80, PET_COST10 = 720, PET_PITY = 40;

(() => {
"use strict";
const TS = window.TS;
const $ = (id) => document.getElementById(id);
const esc = TS.esc, rand = TS.rand;
const S = () => TS.state;
function pets() { const s = S(); if (!s.pets) s.pets = { owned: {}, cur: "", pity: 0 }; return s.pets; }
const curPet = () => (!TS.isPlain() && PET_MAP[pets().cur]) || null;

/* ───── 뽑기 ───── */
function rollGrade() {
  const p = pets();
  p.pity++;
  if (p.pity >= PET_PITY) { p.pity = 0; return "L"; }
  const x = Math.random();
  let acc = 0;
  for (const g of ["L", "E", "A", "C"]) { acc += PET_GRADES[g].rate; if (x < acc) { if (g === "L") p.pity = 0; return g; } }
  return "C";
}
function pull(n) {
  const cost = n === 10 ? PET_COST10 : PET_COST;
  if (S().elif < cost) { TS.toast(`엘리프가 ${cost - S().elif}개 부족해요!`); TS.sfx("sad"); return; }
  S().elif -= cost;
  const gs = Array.from({ length: n }, rollGrade);
  if (n === 10 && !gs.some((g) => g === "L" || g === "E")) gs[9] = "E"; // 10회는 희귀 이상 1마리 확정
  const res = gs.map((g) => {
    const pet = rand(PETS.filter((x) => x.grade === g));
    const o = pets().owned;
    const isNew = !o[pet.id];
    o[pet.id] = (o[pet.id] || 0) + 1;
    if (!isNew) TS.addCandy(PET_GRADES[g].candy);
    return { pet, isNew };
  });
  if (!pets().cur) pets().cur = res[0].pet.id; // 첫 펫은 바로 데리고 다님
  TS.save(); TS.refresh();
  show(res);
}
/* ───── 뽑기 연출: 알을 톡톡 두드려 깨기 → 결과 카드 뒤집기 ─────
   두드릴 때마다 금이 가고, 빛깔이 일반(회색)→고급(초록)→희귀(파랑)→전설(보라)로 한 단계씩 올라감
   (나온 것 중 가장 좋은 등급까지만 올라감). 전설이면 한 번 더 두드려야 하고 화면이 크게 흔들림 */
const G_ORDER = ["C", "A", "E", "L"];
const G_COLOR = { C: "#d9dde4", A: "#8fdc5a", E: "#5aa8ff", L: "#c47bff" };
function show(res) {
  const bestIdx = Math.max(...res.map((r) => G_ORDER.indexOf(r.pet.grade)));
  const taps = bestIdx === 3 ? 4 : 3;
  const st = document.createElement("div");
  st.className = "pet-stage";
  st.innerHTML = `
    <div class="ps-rays"></div>
    <div class="ps-egg-wrap">
      <div class="ps-egg"><svg class="ps-cracks" viewBox="0 0 100 130">
        <polyline class="c1" points="20,52 32,58 28,66 40,70"/>
        <polyline class="c2" points="58,40 66,50 60,57 72,64 68,74"/>
        <polyline class="c3" points="35,88 46,82 52,92 63,86 70,95"/>
        <polyline class="c4" points="44,20 50,30 46,38 55,46"/>
      </svg></div>
      <div class="ps-shadow"></div>
    </div>
    <div class="ps-msg">알을 톡톡 두드려 주세요!</div>
    <button class="btn white small ps-skip">건너뛰기 ⏭</button>`;
  document.body.appendChild(st);
  const egg = st.querySelector(".ps-egg"), msg = st.querySelector(".ps-msg");
  let k = 0, done = false;
  TS.sfx("click");
  const setGlow = (gi) => { st.style.setProperty("--g", G_COLOR[G_ORDER[gi]]); st.dataset.g = G_ORDER[gi]; };
  setGlow(0);
  const hit = () => {
    if (done) return;
    k++;
    const gi = Math.min(bestIdx, Math.round((k / taps) * bestIdx + 0.001 * k));
    setGlow(Math.min(gi, bestIdx));
    egg.classList.remove("hit"); void egg.offsetWidth; egg.classList.add("hit");
    st.querySelectorAll(".ps-cracks polyline").forEach((pl, i) => pl.classList.toggle("on", i < k));
    st.classList.toggle("rumble", bestIdx === 3 && k >= taps - 1);
    if (k < taps) {
      TS.sfx(gi >= 2 ? "r2" : "poke");
      msg.textContent = k === taps - 1 ? (bestIdx === 3 ? "!? 알이 심상치 않아요…!" : "조금만 더!") : ["톡!", "톡톡!", "꿈틀…?"][Math.min(k - 1, 2)];
      return;
    }
    hatch();
  };
  const hatch = () => {
    done = true;
    st.classList.remove("rumble");
    st.classList.add("burst");
    TS.sfx(bestIdx === 3 ? "r3" : bestIdx === 2 ? "r2" : "flip");
    if (bestIdx === 3) TS.confetti(90);
    setTimeout(() => reveal(), 650);
  };
  egg.addEventListener("click", hit);
  st.querySelector(".ps-skip").onclick = () => { if (!done) { k = taps; setGlow(bestIdx); hatch(); } else finishAll(); };

  function reveal() {
    st.classList.add("cards");
    st.innerHTML = `<div class="ps-rays"></div>
      <div class="pet-res ${res.length === 1 ? "one" : ""}">${res.map((r, i) => `
        <div class="pf pg-${r.pet.grade}" data-i="${i}" style="animation-delay:${i * 60}ms">
          <div class="pf-in">
            <div class="pf-back"><span>🥚</span></div>
            <div class="pf-face pet-card g-${r.pet.grade}">
              ${r.isNew ? '<span class="new">NEW!</span>' : `<span class="dup">별사탕 +${PET_GRADES[r.pet.grade].candy}</span>`}
              <img src="${r.pet.img}" alt=""><b>${esc(r.pet.name)}</b><small>${PET_GRADES[r.pet.grade].label} 펫</small>
            </div>
          </div>
        </div>`).join("")}</div>
      <div class="ps-msg">카드를 눌러 뒤집어요!</div>
      <div class="ps-actions"><button class="btn white" id="ps-all">모두 열기</button><button class="btn white hidden" id="ps-bag">🎒 펫 가방</button><button class="btn yellow hidden" id="ps-ok">확인</button></div>`;
    const cards = [...st.querySelectorAll(".pf")];
    const flip = (el) => {
      if (el.classList.contains("flip")) return;
      el.classList.add("flip");
      const g = res[+el.dataset.i].pet.grade;
      TS.sfx(g === "L" ? "r3" : g === "E" ? "r2" : "flip");
      if (g === "L") { TS.confetti(50); st.classList.remove("ps-flash"); void st.offsetWidth; st.classList.add("ps-flash"); }
      if (cards.every((c) => c.classList.contains("flip"))) {
        st.querySelector(".ps-msg").textContent = bestIdx === 3 ? "✨ 전설 펫 등장! ✨" : "부화 완료!";
        st.querySelector("#ps-all").classList.add("hidden");
        st.querySelector("#ps-ok").classList.remove("hidden");
        st.querySelector("#ps-bag").classList.remove("hidden");
      }
    };
    // 전설·희귀는 뒤집기 전에도 뒷면이 은은하게 빛나서 두근두근
    cards.forEach((el) => (el.onclick = () => flip(el)));
    if (res.length === 1) setTimeout(() => flip(cards[0]), 500);
    st.querySelector("#ps-all").onclick = () => cards.filter((c) => !c.classList.contains("flip")).forEach((el, i) => setTimeout(() => flip(el), i * 160));
    st.querySelector("#ps-ok").onclick = finishAll;
    st.querySelector("#ps-bag").onclick = () => { finishAll(); openBag(); };
  }
  function finishAll() { st.remove(); renderStage(); }
}

/* ───── 펫 가방 (도감 + 데리고 다닐 펫 고르기) ───── */
function openBag() {
  const o = pets().owned;
  const have = PETS.filter((p) => o[p.id]).length;
  TS.modal(`<h2>🐾 펫 가방 <small>${have} / ${PETS.length}</small></h2>
    <p class="hint">펫을 누르면 대표 사도 아래에 데리고 다녀요. 화면 보호기에서도 같이 돌아다녀요!</p>
    <div class="pet-grid">${PETS.map((p) => `
      <button class="pet-cell g-${p.grade} ${o[p.id] ? "" : "lock"} ${pets().cur === p.id ? "on" : ""}" data-pet="${p.id}" ${o[p.id] ? "" : "disabled"} title="${esc(p.name)}">
        <img src="${p.img}" alt="" loading="lazy"><b>${o[p.id] ? esc(p.name) : "???"}</b><small>${PET_GRADES[p.grade].label}${o[p.id] > 1 ? ` · ${o[p.id]}마리` : ""}</small>
      </button>`).join("")}</div>
    <div class="modal-actions">${pets().cur ? '<button class="btn white" id="pet-off">펫 쉬게 하기</button>' : ""}<button class="btn yellow" data-close>닫기</button></div>`,
  (el, close) => {
    el.querySelectorAll("[data-pet]").forEach((b) => (b.onclick = () => {
      pets().cur = b.dataset.pet; TS.save(); TS.sfx("coin"); close(); renderStage();
      TS.toast(`🐾 ${PET_MAP[b.dataset.pet].name}와(과) 함께해요!`);
    }));
    const off = el.querySelector("#pet-off");
    if (off) off.onclick = () => { pets().cur = ""; TS.save(); close(); renderStage(); };
  });
}

/* ───── 모집 화면에 펫 뽑기 카드 ───── */
const card = document.createElement("div");
card.className = "card pet-gacha";
card.innerHTML = `<h3 class="card-title">🐾 펫 뽑기 <button class="btn white small" id="pet-bag" style="margin-left:auto">🎒 펫 가방</button></h3>
  <div class="pet-gacha-feat"></div>
  <div class="pity"><span>전설 펫 확정까지</span><span class="bar"><i id="pet-pity-bar"></i></span><b id="pet-pity">${PET_PITY}회</b></div>
  <div class="gacha-btns">
    <button class="btn pink big" id="pet1"><span>1회 뽑기</span><small><i class="ic-elif"></i> ${PET_COST}</small></button>
    <button class="btn yellow big" id="pet10"><span>10회 뽑기</span><small><i class="ic-elif"></i> ${PET_COST10}</small></button>
  </div>
  <p class="hint">확률 — 전설 ${PET_GRADES.L.rate * 100}% · 희귀 ${PET_GRADES.E.rate * 100}% · 고급 ${PET_GRADES.A.rate * 100}% · 일반 ${PET_GRADES.C.rate * 100}%<br>
  ${PET_PITY}회 안에 전설 확정 · 10회 뽑기는 희귀 이상 1마리 확정 · 중복 펫은 별사탕으로 바뀌어요.</p>`;
const gv = $("view-gacha");
gv.insertBefore(card, gv.children[2] || null);
card.querySelector(".pet-gacha-feat").innerHTML = PETS.filter((p) => p.grade === "L").sort(() => Math.random() - 0.5).slice(0, 7).map((p) => `<img src="${p.img}" alt="">`).join("");
function renderGachaCard() {
  const left = PET_PITY - pets().pity;
  $("pet-pity-bar").style.width = (pets().pity / PET_PITY) * 100 + "%";
  $("pet-pity").textContent = `${left}회`;
  $("pet1").disabled = S().elif < PET_COST;
  $("pet10").disabled = S().elif < PET_COST10;
}
TS.on("refresh", renderGachaCard);
renderGachaCard();
$("pet1").onclick = () => pull(1);
$("pet10").onclick = () => pull(10);
$("pet-bag").onclick = openBag;
$("pet-btn").onclick = openBag;

/* ───── 대표 사도 아래 ───── */
const slot = document.createElement("div");
slot.className = "pet-slot";
slot.innerHTML = `<div class="pet-walker"><img alt=""><span class="pet-name"></span></div>`;
$("partner").after(slot);
const walker = slot.querySelector(".pet-walker");
let slotKey = "", walkT = 0, posX = 0;
function renderStage() {
  const p = curPet();
  slot.classList.toggle("hidden", !p);
  const key = p ? p.id : "";
  if (key === slotKey) return;
  slotKey = key;
  if (!p) return;
  walker.querySelector("img").src = p.img;
  walker.querySelector(".pet-name").textContent = p.name;
}
function stroll() {
  clearTimeout(walkT);
  walkT = setTimeout(stroll, 2500 + Math.random() * 3500);
  if (slot.classList.contains("hidden") || document.hidden) return;
  const range = Math.max(0, (slot.clientWidth - walker.offsetWidth) / 2);
  const nx = Math.round((Math.random() * 2 - 1) * range);
  if (Math.abs(nx - posX) < 10) { hop(walker); return; }
  walker.classList.toggle("flip", nx > posX);
  walker.classList.add("walking");
  walker.style.transform = `translateX(${nx}px)`;
  posX = nx;
  setTimeout(() => walker.classList.remove("walking"), 1600);
}
function hop(el) { el.classList.remove("hop"); void el.offsetWidth; el.classList.add("hop"); }
function hearts(host, x, y) {
  for (let i = 0; i < 4; i++) {
    const h = document.createElement("span");
    h.className = "pet-heart"; h.textContent = rand(["💗", "💕", "✨"]);
    h.style.left = x + (Math.random() * 40 - 20) + "px"; h.style.top = y + "px";
    h.style.animationDelay = i * 0.1 + "s";
    host.appendChild(h);
    setTimeout(() => h.remove(), 1400);
  }
}
walker.onclick = () => {
  hop(walker); TS.sfx("poke");
  const r = walker.getBoundingClientRect(), sr = slot.getBoundingClientRect();
  hearts(slot, r.left - sr.left + r.width / 2, 0);
};
TS.on("refresh", renderStage);
renderStage();
stroll();

/* ───── 화면 보호기에서 산책 ───── */
let ssPet = null;
function ssStart(root) {
  ssStop();
  const p = curPet();
  if (!p || !root) return;
  const el = document.createElement("div");
  el.className = "ss-pet";
  el.innerHTML = `<div class="ss-pet-in"><img src="${p.img}" alt=""></div>`;
  root.appendChild(el);
  const st = { el, x: window.innerWidth * (0.2 + Math.random() * 0.6), t: 0, root };
  el.style.transform = `translateX(${st.x}px)`;
  const walk = () => {
    if (!el.isConnected) return;
    const W = window.innerWidth - el.offsetWidth;
    const nx = Math.max(0, Math.min(W, st.x + (Math.random() < 0.5 ? -1 : 1) * (120 + Math.random() * W * 0.5)));
    const dur = Math.max(1.2, Math.abs(nx - st.x) / 70);
    el.classList.toggle("flip", nx > st.x);
    el.classList.add("walking");
    el.style.transition = `transform ${dur}s linear`;
    el.style.transform = `translateX(${nx}px)`;
    st.x = nx;
    st.t = setTimeout(() => {
      el.classList.remove("walking");
      if (Math.random() < 0.4) hop(el.firstElementChild);
      st.t = setTimeout(walk, 1500 + Math.random() * 4000); // 잠깐 쉬었다가
    }, dur * 1000);
  };
  st.t = setTimeout(walk, 1200);
  el.onclick = (e) => {
    e.stopPropagation();
    hop(el.firstElementChild); TS.sfx("poke");
    const r = el.getBoundingClientRect();
    hearts(root, r.left + r.width / 2, r.top);
  };
  ssPet = st;
}
function ssStop() { if (ssPet) { clearTimeout(ssPet.t); ssPet.el.remove(); ssPet = null; } }
TS.on("ss-open", ssStart);
TS.on("ss-close", ssStop);

window.Pets = { openBag, pull, PETS, PET_MAP };
})();
