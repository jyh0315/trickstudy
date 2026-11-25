/* =========================================================
   💌 데이트 — 대표 사도와 함께 보내는 짧은 이야기 (트릭컬 「빵주 라운지」 데이트를 트릭스터디식으로)
   - 데이트권: 하루 공부 목표를 채우면 1장 (최대 3장, 처음엔 1장 줌)
   - 장소: 이번 주 장소 3곳 (2곳 + 공부 데이트 1곳), 매주 목요일에 바뀜
   - 같은 장소라도 랜덤 이벤트(불꽃놀이·별똥별·오로라…)로 대화가 달라짐
   - 중간의 만지기 순간: 쓰다듬기·꿀밤·간지럽히기·볼 당기기에 따라 반응이 달라짐 (호감도는 같음)
   - 대사록·되감기 없음 → 다른 반응이 보고 싶으면 다시 데이트
   - 선물: 엘리프로 사서 데이트 때 건넴 (종류별 주간 구매 제한, 월요일 초기화)
   - 끝나면 호감도 + 추억 사진(폴라로이드)이 데이트 앨범에
   ========================================================= */
(() => {
"use strict";
const TS = window.TS, S = () => TS.state, esc = TS.esc, rand = TS.rand;
const $ = (id) => document.getElementById(id);
const AFF_DATE = 50, MAX_TICKETS = 3;
const V = (id) => (typeof voiceOf === "function" ? voiceOf(id) : null) || {};

/* ───── 장소 ───── */
const PLACES = [
  { id: "bakery", name: "빵집 거리", bg: "016", music: "28. Bakery In Peace.mp3", day: 1, ev: ["rain", "pet", "sample"],
    say: ["갓 구운 빵 냄새 맡아 봐. 여기 오면 배가 저절로 고파진다니까.", "갓 구운 빵 냄새 나죠? 여기 오면 배가 저절로 고파져요."] },
  { id: "tree", name: "세계수 언덕", bg: "026", music: "02. Day Life.mp3", day: 1, ev: ["rainbow", "pet", "wind"],
    say: ["여기서 보면 마을이 한눈에 보여. 내가 좋아하는 자리야.", "여기서 보면 마을이 한눈에 보여요. 제가 좋아하는 자리예요."] },
  { id: "flower", name: "왕채소 농장", bg: "117", music: "27. Fairy Town Street.mp3", day: 1, ev: ["butterfly", "rainbow", "wind"],
    say: ["저 당근 봐, 나보다 커! 하나 뽑아 갈까?", "저 당근 좀 보세요, 저보다 커요! 하나 뽑아 갈까요?"] },
  { id: "picnic", name: "초원 피크닉", bg: "120", music: "34. Life Is Comedy.mp3", day: 1, ev: ["pet", "rain", "butterfly"],
    say: ["돗자리 펴자! 도시락은… 아, 간식만 잔뜩 가져왔네.", "돗자리 펴요! 도시락은… 앗, 간식만 잔뜩 가져왔네요."] },
  { id: "beach", name: "바닷가", bg: "139", music: "40. Sugar Free.mp3", day: 1, ev: ["sunset", "shell", "fireworks"],
    say: ["바다다~! 발 담가 보자, 차갑고 좋을 거야.", "바다예요~! 발 담가 봐요, 차갑고 좋을 거예요."] },
  { id: "lake", name: "호숫가 산책길", bg: "136", music: "17. Crystal Lake.mp3", day: 1, ev: ["sunset", "star", "wind"],
    say: ["물이 엄청 맑지? 천천히 걸으면서 얘기하자.", "물이 엄청 맑죠? 천천히 걸으면서 얘기해요."] },
  { id: "moon", name: "달빛 호수", bg: "114", music: "18. Aurora.mp3", day: 0, ev: ["star", "aurora", "fireworks"],
    say: ["밤에 오니까 완전 다른 곳 같아… 조금 무섭기도 하고.", "밤에 오니까 완전 다른 곳 같아요… 조금 무섭기도 하고요."] },
  { id: "snow", name: "눈 내리는 밤", bg: "144", music: "18. Aurora.mp3", day: 0, ev: ["aurora", "star", "snowball"],
    say: ["으으, 추워! 근데 눈 오는 밤은 좋더라.", "으으, 추워요! 그래도 눈 오는 밤은 좋아요."] },
  { id: "festival", name: "축제 거리", bg: "061", music: "34. Life Is Comedy.mp3", day: 1, ev: ["fireworks", "sample", "pet"],
    say: ["축제다! 뭐부터 할까? 다 해 보자!", "축제예요! 뭐부터 할까요? 다 해 봐요!"] },
  { id: "square", name: "요정 마을 광장", bg: "093", music: "27. Fairy Town Street.mp3", day: 1, ev: ["pet", "rain", "rainbow"],
    say: ["오늘은 광장이 꽤 조용하네. 산책하기 딱 좋다.", "오늘은 광장이 꽤 조용하네요. 산책하기 딱 좋아요."] },
];
// 📚 공부 데이트 장소: 데이트가 끝나면 같이 공부(집중 타이머 + 화면보호기)
const STUDY_PLACES = [
  { id: "library", name: "도서관", bg: "059", music: "03. Lounge.mp3", study: true, ev: ["rain", "sleepy", "book"],
    say: ["쉿, 도서관에선 조용히. …그래도 너랑 오니까 좀 설렌다.", "쉿, 도서관에선 조용히요. …그래도 {c}랑 오니까 좀 설레요."] },
  { id: "bookshop", name: "고서점 카페", bg: "151", music: "28. Bakery In Peace.mp3", study: true, ev: ["rain", "book", "sleepy"],
    say: ["여기 커피 냄새 좋지? 공부도 잘될 것 같아.", "여기 커피 냄새 좋죠? 공부도 잘될 것 같아요."] },
];
const ALL_PLACES = PLACES.concat(STUDY_PLACES);
const bgUrl = (p) => `assets/ssbg/${p.bg}.webp`;

/* ───── 이벤트 (같은 장소라도 대화가 달라짐) ───── */
const EVENTS = {
  fireworks: { icon: "🎆", name: "불꽃놀이", fx: { flash: 1, sfx: "boom" }, n: "펑— 하늘에 커다란 불꽃이 피어올랐다.", say: ["우와아! 봤어? 방금 하트 모양이었어!", "우와아! 보셨어요? 방금 하트 모양이었어요!"] },
  star: { icon: "🌠", name: "별똥별", fx: { flash: 1, sfx: "magic" }, n: "밤하늘을 가로질러 별똥별이 떨어졌다.", say: ["앗, 별똥별! 소원 빌었어? 나는… 비밀이야.", "앗, 별똥별! 소원 비셨어요? 저는… 비밀이에요."] },
  aurora: { icon: "🌌", name: "오로라", fx: { sfx: "magic" }, n: "하늘에 초록빛 오로라가 커튼처럼 일렁였다.", say: ["…예쁘다. 이런 건 혼자 보면 아까워.", "…예뻐요. 이런 건 혼자 보면 아까워요."] },
  rain: { icon: "🌧️", name: "소나기", fx: { sfx: "drop" }, n: "갑자기 소나기가 쏟아졌다. 둘이서 처마 밑으로 뛰어들었다.", say: ["으앗, 다 젖었어! …근데 좀 웃기다, 그치?", "으앗, 다 젖었어요! …근데 좀 웃기죠?"] },
  rainbow: { icon: "🌈", name: "무지개", fx: { sfx: "magic" }, n: "비가 그친 하늘에 무지개가 걸렸다.", say: ["무지개다! 끝까지 가면 보물 있대. 가 볼래?", "무지개예요! 끝까지 가면 보물이 있대요. 가 볼래요?"] },
  pet: { icon: "🐾", name: "꼬마 동물", fx: { sfx: "pop" }, n: "풀숲에서 꼬마 동물 한 마리가 쪼르르 다가왔다.", say: ["귀여워! 쓰다듬어도 되나? …물면 어떡하지.", "귀여워요! 쓰다듬어도 될까요? …물면 어떡하죠."] },
  sunset: { icon: "🌅", name: "노을", fx: {}, n: "하늘이 천천히 주황빛으로 물들었다.", say: ["벌써 해가 지네. 너랑 있으면 시간이 너무 빨리 가.", "벌써 해가 지네요. {c}랑 있으면 시간이 너무 빨리 가요."] },
  wind: { icon: "🍃", name: "바람", fx: { sfx: "run" }, n: "휘이잉— 세찬 바람에 모자가 날아갈 뻔했다.", say: ["으아앗! 잡았다… 휴, 큰일 날 뻔했네.", "으아앗! 잡았다… 휴, 큰일 날 뻔했어요."] },
  butterfly: { icon: "🦋", name: "나비", fx: {}, n: "나비 한 마리가 날아와 사도의 머리 위에 앉았다.", say: ["어? 나한테 왜… 움직이면 안 되겠지? 그치?", "어? 저한테 왜… 움직이면 안 되겠죠? 그쵸?"] },
  shell: { icon: "🐚", name: "조개껍데기", fx: { sfx: "pop" }, n: "모래 속에서 반짝이는 조개껍데기를 발견했다.", say: ["이거 예쁘다! 너 가져. 오늘 기념품이야.", "이거 예뻐요! {c} 가지세요. 오늘 기념품이에요."] },
  snowball: { icon: "⛄", name: "눈싸움", fx: { shake: 1, sfx: "bonk" }, n: "퍽! 어디선가 눈뭉치가 날아왔다.", say: ["누구야?! …방금 거 내가 아니라 저쪽이야! 진짜야!", "누구예요?! …방금 거 제가 아니라 저쪽이에요! 진짜예요!"] },
  sample: { icon: "🍰", name: "시식", fx: { sfx: "eat" }, n: "가게 앞에서 시식용 간식을 나눠 주고 있었다.", say: ["공짜래! 하나만… 아니 두 개만 먹자.", "공짜래요! 하나만… 아니 두 개만 먹어요."] },
  sleepy: { icon: "💤", name: "꾸벅꾸벅", fx: {}, n: "조용한 분위기에 사도가 꾸벅꾸벅 졸기 시작했다.", say: ["…안 졸았어. 눈 감고 생각한 거야.", "…안 졸았어요. 눈 감고 생각한 거예요."] },
  book: { icon: "📖", name: "재밌는 책", fx: {}, n: "사도가 책장에서 이상한 제목의 책을 꺼내 왔다.", say: ["『공부 안 하고 천재 되는 법』… 이거 진짜일까?", "『공부 안 하고 천재 되는 법』… 이거 진짜일까요?"] },
};

/* ───── 선물 (엘리프로 사기 · 종류별 주간 제한, 월요일 초기화) ───── */
const GIFTS = [
  { id: "ribbon", icon: "🎀", name: "리본", cost: 60, aff: 10, week: 3 },
  { id: "cake", icon: "🍰", name: "조각 케이크", cost: 90, aff: 15, week: 3 },
  { id: "flower", icon: "💐", name: "꽃다발", cost: 140, aff: 25, week: 2 },
  { id: "doll", icon: "🧸", name: "곰 인형", cost: 240, aff: 45, week: 1 },
];
const GIFT_SAY = {
  ribbon: ["리본? …어울릴까? 지금 달아 볼게.", "리본이요? …어울릴까요? 지금 달아 볼게요."],
  cake: ["케이크다! 반은 너 줄게. …3분의 1.", "케이크다! 반은 드릴게요. …3분의 1이요."],
  flower: ["꽃다발…? 이런 거 처음 받아 봐. 고마워.", "꽃다발…? 이런 거 처음 받아 봐요. 고마워요."],
  doll: ["곰 인형! 오늘부터 얘랑 같이 잘 거야!", "곰 인형! 오늘부터 이 아이랑 같이 잘 거예요!"],
};

/* ───── 상태 ───── */
function D() {
  const s = S();
  if (!s.date) s.date = { tickets: 1, ticketDay: "", inv: {}, buys: {}, buyWeek: "", album: [], n: 0, place: "" };
  const d = s.date;
  // 오늘 공부 목표를 채웠으면 데이트권 1장 (하루 한 번)
  const min = s.stats.days[TS.today()] || 0;
  if (min >= s.settings.goal && d.ticketDay !== TS.today()) { d.ticketDay = TS.today(); if (d.tickets < MAX_TICKETS) { d.tickets++; TS.toast && TS.toast("💌 공부 목표 달성! 데이트권 +1"); } TS.save(); }
  if (d.buyWeek !== TS.weekKey()) { d.buyWeek = TS.weekKey(); d.buys = {}; }
  return d;
}
// 목요일마다 바뀌는 이번 주 장소 (2곳 + 공부 데이트 1곳)
function thuWeek() { const t = new Date(); t.setHours(0, 0, 0, 0); const days = Math.floor((t - new Date(2024, 0, 4)) / 864e5); return Math.floor(days / 7); } // 2024-01-04 = 목요일
function seeded(n) { let x = (n * 2654435761) >>> 0; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
function weekPlaces() {
  const r = seeded(thuWeek() + 7), L = PLACES.slice();
  const a = L.splice(Math.floor(r() * L.length), 1)[0], b = L.splice(Math.floor(r() * L.length), 1)[0];
  return [a, b, STUDY_PLACES[thuWeek() % STUDY_PLACES.length]];
}
const daysToThu = () => { const d = new Date().getDay(); return ((4 - d + 7) % 7) || 7; };

/* ───── 말투 ───── */
const casual = (id) => { const s = V(id).s; return s === "ban" || s === "old"; };
const callOf = (id) => V(id).c || "교주";
const T = (id, pair) => String(casual(id) ? pair[0] : pair[1]).replace(/\{c\}/g, callOf(id));
const real = (id, k) => { const L = V(id)[k]; return L && L.length ? rand(L) : null; };

/* ───── 대본 만들기 ───── */
function buildEp(id, place, gift) {
  const c = TS.SADO_MAP[id], ev = EVENTS[rand(place.ev)], s = S();
  const todayMin = s.stats.days[TS.today()] || 0, subj = (s.timer && s.timer.subject) || "공부";
  const L = [];
  L.push({ bg: bgUrl(place), loc: `💌 ${place.name}` });
  L.push({ in: id, at: "C", f: "happy" });
  L.push({ s: id, t: T(id, ["{c}, 왔어? 오늘은 내가 먼저 와 있었지!", "{c}, 오셨어요? 오늘은 제가 먼저 와 있었어요!"]), f: "happy", e: "♥" });
  L.push({ n: `${c.name}와(과) ${place.name}에 왔다.` });
  L.push({ s: id, t: T(id, place.say), f: "talk" });
  // 오늘 공부 이야기
  L.push({ s: id, t: T(id, ["근데 오늘은 공부 많이 했어?", "근데 오늘은 공부 많이 하셨어요?"]), f: "talk", e: "?" });
  L.push({ choice: todayMin ? [`${subj} 위주로 ${todayMin}분 했어!`, "비밀~", "오늘은 좀 쉬었어…"] : ["아직 못 했어…", "비밀~", "이따 같이 하자!"],
    r: todayMin ? [{ s: id, t: T(id, [`${todayMin}분이나? 대단하다! 상으로 오늘은 내가 놀아 줄게.`, `${todayMin}분이나요? 대단해요! 상으로 오늘은 제가 놀아 드릴게요.`]), f: "proud" },
      { s: id, t: T(id, ["뭐야, 궁금하잖아! …나중엔 꼭 알려 줘.", "에이, 궁금하잖아요! …나중엔 꼭 알려 주세요."]), f: "angry" },
      { s: id, t: T(id, ["쉬는 것도 공부야. 오늘은 푹 놀자.", "쉬는 것도 공부예요. 오늘은 푹 놀아요."]), f: "happy" }]
      : [{ s: id, t: T(id, ["그럼 데이트 끝나고 꼭 하는 거다? 약속!", "그럼 데이트 끝나고 꼭 하는 거예요? 약속!"]), f: "angry" },
      { s: id, t: T(id, ["뭐야, 궁금하잖아!", "에이, 궁금하잖아요!"]), f: "angry" },
      { s: id, t: T(id, ["좋아! 그 말 잊으면 안 돼.", "좋아요! 그 말 잊으면 안 돼요."]), f: "happy" }] });
  // 랜덤 이벤트
  L.push({ ...ev.fx, n: `${ev.icon} ${ev.n}` });
  L.push({ s: id, t: T(id, ev.say), f: "surprise", e: "!" });
  const idle = real(id, "idle"); if (idle) L.push({ s: id, t: idle, f: "talk" });
  // 만지기 순간
  const knock = real(id, "knock"), pat = real(id, "pat"), poke = real(id, "poke");
  L.push({ n: `${c.name}이(가) 슬쩍 가까이 다가왔다.` });
  L.push({ touch: id, prompt: "…어떻게 할까?", r: {
    pat: [{ s: id, t: pat || T(id, ["헤헤… 쓰다듬어 주는 거야? 조금만 더.", "헤헤… 쓰다듬어 주시는 거예요? 조금만 더요."]), f: "shy", e: "♥" }],
    smash: [{ s: id, t: knock || T(id, ["아얏! 갑자기 왜 때려?!", "아얏! 갑자기 왜 때리세요?!"]), f: "angry", e: "💢" }, { s: id, t: T(id, ["…다음엔 나도 똑같이 해 줄 거야.", "…다음엔 저도 똑같이 해 드릴 거예요."]), f: "angry" }],
    tickle: [{ s: id, t: T(id, ["깔깔깔! 그, 그만! 숨 막혀~!", "깔깔깔! 그, 그만요! 숨 막혀요~!"]), f: "happy" }, { s: id, t: T(id, ["하아… 데이트에서 간지럼은 반칙이야!", "하아… 데이트에서 간지럼은 반칙이에요!"]), f: "angry", e: "💢" }],
    pull: [{ s: id, t: poke || T(id, ["으에에… 볼 늘어나잖아!", "으에에… 볼 늘어나잖아요!"]), f: "surprise", e: "💧" }],
  } });
  // 선물
  if (gift) {
    L.push({ n: `준비해 온 ${gift.icon} ${gift.name}을(를) 건넸다.` });
    L.push({ s: id, t: T(id, GIFT_SAY[gift.id]), f: "happy", e: "♥" });
  }
  // 마무리
  L.push({ s: id, t: T(id, ["벌써 갈 시간이네…", "벌써 갈 시간이네요…"]), f: "sad" });
  L.push({ choice: ["다음에 또 오자", "다음엔 내가 장소 고를게"], r: [
    { s: id, t: T(id, ["응! 약속한 거다? 새끼손가락 걸어!", "네! 약속이에요. 새끼손가락 걸어요!"]), f: "happy", e: "♥" },
    { s: id, t: T(id, ["오, 기대할게! 시시한 데면 꿀밤이야.", "오, 기대할게요! 시시한 곳이면 꿀밤이에요."]), f: "proud" }] });
  if (place.study) L.push({ s: id, t: T(id, ["그럼 이제… 같이 공부할까? 옆에 있어 줄게.", "그럼 이제… 같이 공부할까요? 옆에 있어 드릴게요."]), f: "talk" });
  else { const pl = real(id, "partner") || real(id, "lvup"); L.push({ s: id, t: pl || T(id, ["오늘 고마웠어, {c}.", "오늘 고마웠어요, {c}."]), f: "happy" }); }
  return { ep: { id: "date-" + Date.now(), title: `${place.name} 데이트`, bgm: place.music, lines: L }, ev };
}

/* ───── 데이트 시작 ───── */
function start(placeId, giftId) {
  const d = D(), id = S().partner, place = ALL_PLACES.find((p) => p.id === placeId);
  if (!place || !id || !window.Story) return;
  if (d.tickets <= 0) return TS.toast && TS.toast("데이트권이 없어요. 오늘 공부 목표를 채우면 1장!");
  const gift = giftId && (d.inv[giftId] || 0) > 0 ? GIFTS.find((g) => g.id === giftId) : null;
  d.tickets--; if (gift) d.inv[gift.id]--;
  TS.save();
  const { ep, ev } = buildEp(id, place, gift);
  window.Story.play(ep, { date: true, onEnd: (res) => finish(id, place, ev, gift, res) });
}
const TOUCH_KO = { pat: "✋ 쓰다듬기", smash: "🔨 꿀밤", tickle: "🤭 간지럽히기", pull: "😆 볼 당기기", "": "" };
function finish(id, place, ev, gift, res) {
  const d = D(), c = TS.SADO_MAP[id], add = AFF_DATE + (gift ? gift.aff : 0);
  if (window.Affection && window.Affection.gain) window.Affection.gain(id, add);
  d.n++;
  const memo = { t: Date.now(), id, place: place.id, ev: Object.keys(EVENTS).find((k) => EVENTS[k] === ev), touch: res.touch || "", gift: gift ? gift.id : "" };
  d.album.unshift(memo); d.album = d.album.slice(0, 60);
  TS.save();
  if (place.study) setTimeout(() => offerStudy(id), 400);
  return `<h3>💌 ${esc(place.name)} 데이트 끝!</h3>
    ${polaroid(memo)}
    <p class="reward-chip">💗 ${esc(c.name)} 호감도 +${add}</p>
    <p class="hint">${ev.icon} ${esc(ev.name)}${res.touch ? " · " + TOUCH_KO[res.touch] : ""} — 다른 이벤트·반응이 보고 싶으면 다시 데이트해요.</p>`;
}
function offerStudy(id) {
  const c = TS.SADO_MAP[id];
  TS.modal(`<h2>📚 같이 공부할까요?</h2><img class="modal-emote" src="${TS.portrait(c, true)}" alt="">
    <p>${esc(c.name)}이(가) 화면보호기에서 옆에 있어 줘요.</p>
    <div class="modal-actions"><button class="btn" data-close>다음에</button><button class="btn yellow" id="dt-study">▶ 집중 시작</button></div>`, (m, close) => {
    m.querySelector("#dt-study").onclick = () => {
      close();
      const s = S(); if (!s.ss) s.ss = {}; const was = s.ss.source; s.ss.source = "partner";
      if (TS.timer.t.mode === "focus" && !TS.timer.t.running) TS.timer.start();
      if (window.ScreenSaver) window.ScreenSaver.open();
      TS.on("ss-close", () => { if (was !== undefined) s.ss.source = was; });
    };
  });
}

/* ───── 추억 사진 ───── */
function polaroid(m) {
  const p = ALL_PLACES.find((x) => x.id === m.place) || PLACES[0], c = TS.SADO_MAP[m.id], ev = EVENTS[m.ev] || {};
  const g = m.gift && GIFTS.find((x) => x.id === m.gift);
  return `<figure class="dt-pola"><div class="dt-pic" style="background-image:url('${bgUrl(p)}')">${c ? `<img src="${TS.portrait(c, true)}" alt="">` : ""}<i>${ev.icon || ""}${g ? g.icon : ""}</i></div>
    <figcaption><b>${esc(p.name)}</b><small>${new Date(m.t).toLocaleDateString("ko-KR")} · ${esc(c ? c.name : "")}${m.touch ? " · " + TOUCH_KO[m.touch] : ""}</small></figcaption></figure>`;
}

/* ───── 데이트 창 ───── */
function open(tab) {
  const s = S(), id = s.partner, c = TS.SADO_MAP[id];
  if (!c) return TS.toast && TS.toast("먼저 대표 사도를 정해 주세요");
  const d = D(), places = weekPlaces();
  const first = !tab;
  tab = tab || "date";
  const invite = (() => { const v = first ? TS.voice(id, "pat") : null; return (v && v.text) || real(id, "call") || T(id, ["{c}, 오늘 같이 나갈래?", "{c}, 오늘 같이 나갈래요?"]); })();
  const giftRow = GIFTS.filter((g) => (d.inv[g.id] || 0) > 0);
  const tabs = [["date", "💌 데이트"], ["shop", "🎁 선물 가게"], ["album", `📷 앨범 ${d.album.length}`]];
  const body = tab === "shop" ? `<p class="hint">엘리프로 선물을 사 두면 데이트 때 건넬 수 있어요. 호감도가 더 올라요. 종류별 주간 구매 제한은 <b>월요일</b>에 초기화돼요.</p>
      <div class="dt-shop">${GIFTS.map((g) => { const left = g.week - (d.buys[g.id] || 0); return `<div class="dt-gift"><span class="dt-gi">${g.icon}</span><b>${g.name}</b><small>호감도 +${g.aff} · 가진 것 ${d.inv[g.id] || 0}</small>
        <button class="btn pink small" data-buy="${g.id}" ${left <= 0 || s.elif < g.cost ? "disabled" : ""}><i class="ic-elif"></i> ${g.cost}</button><em>이번 주 ${left}/${g.week}</em></div>`; }).join("")}</div>`
    : tab === "album" ? (d.album.length ? `<div class="dt-album">${d.album.map(polaroid).join("")}</div>` : `<p class="hint">아직 추억 사진이 없어요. 데이트하면 한 장씩 남아요!</p>`)
    : `<div class="dt-places">${places.map((p) => `<button class="dt-place" data-place="${p.id}" ${d.tickets <= 0 ? "disabled" : ""}><img src="${bgUrl(p)}" alt="" loading="lazy"><b>${p.study ? "📚 " : ""}${esc(p.name)}</b><small>${p.study ? "끝나고 같이 공부" : p.ev.map((k) => EVENTS[k].icon).join(" ") + " 이벤트"}</small></button>`).join("")}</div>
      <div class="dt-giftpick"><span>선물:</span>${giftRow.length ? `<label><input type="radio" name="dtg" value="" checked> 없음</label>` + giftRow.map((g) => `<label><input type="radio" name="dtg" value="${g.id}"> ${g.icon} ${g.name} ×${d.inv[g.id]}</label>`).join("") : `<small class="hint">없음 — 🎁 선물 가게에서 살 수 있어요</small>`}</div>
      <p class="hint">장소는 <b>목요일</b>마다 바뀌어요 (${daysToThu()}일 남음). 대사록·되감기가 없으니 다른 반응이 보고 싶으면 다시 데이트해요.</p>`;
  TS.modal(`<div class="dt-wrap">
    <div class="dt-head"><img src="${TS.portrait(c, true)}" alt=""><div><b>${esc(c.name)}</b><p class="dt-bub">“${esc(invite)}”</p>
      <span class="dt-ticket">💌 데이트권 <b>${d.tickets}</b> / ${MAX_TICKETS}</span><small class="hint"> 하루 공부 목표(${s.settings.goal}분)를 채우면 1장</small></div></div>
    <div class="seg small dt-tabs">${tabs.map(([k, t]) => `<button data-dtab="${k}" class="${k === tab ? "on" : ""}">${t}</button>`).join("")}</div>
    ${body}
    <div class="modal-actions"><button class="btn" data-close>닫기</button></div></div>`, (m, close) => {
    m.querySelectorAll("[data-dtab]").forEach((b) => (b.onclick = () => { close(); open(b.dataset.dtab); }));
    m.querySelectorAll("[data-place]").forEach((b) => (b.onclick = () => { const g = m.querySelector("input[name=dtg]:checked"); close(); start(b.dataset.place, g ? g.value : ""); }));
    m.querySelectorAll("[data-buy]").forEach((b) => (b.onclick = () => {
      const g = GIFTS.find((x) => x.id === b.dataset.buy); if (!g || s.elif < g.cost || (d.buys[g.id] || 0) >= g.week) return;
      s.elif -= g.cost; d.buys[g.id] = (d.buys[g.id] || 0) + 1; d.inv[g.id] = (d.inv[g.id] || 0) + 1;
      TS.sfx("coin"); TS.save(); TS.refresh(); close(); open("shop");
    }));
  }, { cls: "dt-modal" });
}

/* ───── 로비 버튼 ───── */
const anchor = document.getElementById("gift-btn");
if (anchor) {
  const b = document.createElement("button");
  b.className = "btn pink small"; b.id = "date-btn"; b.textContent = "💌 데이트"; b.title = "대표 사도와 데이트";
  b.onclick = () => open(); anchor.after(b);
}
TS.on("refresh", () => { const b = $("date-btn"); if (b && S().started) D(); if (b && S().date) b.textContent = `💌 데이트${S().date.tickets ? " " + S().date.tickets : ""}`; });
window.DateMode = { open, start, places: ALL_PLACES, events: EVENTS };
})();
