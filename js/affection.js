/* =========================================================
   호감도 & 선물
   - 대표 사도로 함께 집중하면 1분당 호감도 +1
   - 의뢰 해결 +3, 볼 찌르기 +1 (하루 10번까지)
   - 엘리프로 선물을 사서 줄 수 있음 (성격별 최애 선물은 2배)
   - 호감도 레벨이 오르면 새 대사 해금 + 보스 데미지 보너스
   ========================================================= */
const AFF_LEVELS = [0, 30, 80, 160, 280, 450, 680, 980, 1360, 1830]; // Lv1 ~ Lv10 필요 누적치

const GIFTS = [
  { id: "cookie",   name: "버터 쿠키",   icon: "🍪", cost: 30,  pts: 8 },
  { id: "milk",     name: "딸기우유",    icon: "🥛", cost: 60,  pts: 18 },
  { id: "doll",     name: "곰인형",      icon: "🧸", cost: 120, pts: 40, fav: "pure" },
  { id: "book",     name: "두꺼운 책",   icon: "📚", cost: 120, pts: 40, fav: "cool" },
  { id: "firework", name: "폭죽 세트",   icon: "🎆", cost: 120, pts: 40, fav: "mad" },
  { id: "cake",     name: "딸기 케이크", icon: "🍰", cost: 120, pts: 40, fav: "jolly" },
  { id: "blanket",  name: "포근한 담요", icon: "🧣", cost: 120, pts: 40, fav: "gloomy" },
  { id: "crown",    name: "반짝이 왕관", icon: "👑", cost: 400, pts: 150, fav: "special" },
];

/* 호감도 레벨별로 해금되는 대사 (idle 대사에 섞여 나옴) */
const AFF_LINES = {
  pure:    { 3: ["교주님이랑 있으면 시간이 금방 가요!"], 6: ["{name}는 교주님이 공부하는 모습이 제일 좋아요."], 10: ["교주님, 앞으로도 쭉 같이 있어 줄 거죠? 약속!"] },
  cool:    { 3: ["…요즘 꽤 성실하네. 인정해 줄게."], 6: ["네 옆자리는 내가 맡아둘게. 딴 애한테 주지 마."], 10: ["…고마워. 너라서 다행이야. 이건 비밀이야."] },
  mad:     { 3: ["크히히, 교주랑 노는 게 제일 재밌어!"], 6: ["교주를 괴롭히는 문제집은 내가 다 부숴줄게!"], 10: ["교주는 내 거야! 아무한테도 안 줘! 크히히!"] },
  jolly:   { 3: ["교주님이랑 있으면 매일이 축제 같아요!"], 6: ["오늘도 교주님 옆자리 사수 성공~!"], 10: ["교주님 최고 최고! 세상에서 제일 좋아요!"] },
  gloomy:  { 3: ["…교주 옆은 조금 따뜻해."], 6: ["…오늘도 와줘서 고마워."], 10: ["…교주가 없으면 안 될 것 같아. 진짜로."] },
  special: { 3: ["교주님과의 인연, 소중히 할게요."], 6: ["당신 곁이라면 어디든 빛나요."], 10: ["교주님은 저의 가장 특별한 사람이에요."] },
};

(() => {
"use strict";
const TS = window.TS;
const $ = (id) => document.getElementById(id);
const S = () => TS.state;

function aff() { if (!S().aff) S().aff = {}; return S().aff; }
const pts = (id) => aff()[id] || 0;
function levelOf(p) { let lv = 1; for (let i = 0; i < AFF_LEVELS.length; i++) if (p >= AFF_LEVELS[i]) lv = i + 1; return lv; }
const level = (id) => levelOf(pts(id));
function progress(id) {
  const p = pts(id), lv = levelOf(p);
  if (lv >= AFF_LEVELS.length) return { lv, cur: 1, need: 1, max: true };
  return { lv, cur: p - AFF_LEVELS[lv - 1], need: AFF_LEVELS[lv] - AFF_LEVELS[lv - 1], max: false };
}

/* 호감도 올리기 → 레벨업이면 축하 */
function gain(id, n) {
  if (!id || !S().owned[id] || n <= 0) return;
  const before = level(id);
  aff()[id] = pts(id) + n;
  const after = level(id);
  if (after > before) {
    const c = TS.SADO_MAP[id];
    const reward = 50 * after;
    TS.addElif(reward);
    const lines = AFF_LINES[c.pers][after];
    // 집중 보상 모달 뒤에 나오도록 한 박자 늦게
    setTimeout(() => {
    TS.sfx("level"); TS.confetti(50);
    TS.modal(`<h2>💗 호감도 Lv.${after}!</h2>
      <img class="modal-emote" src="${TS.portrait(c, true)}" alt="">
      <p><b>${TS.esc(c.name)}</b>: “${TS.esc(TS.fmt(lines ? lines[0] : TS.rand(TS.linesOf(c, "done")), c))}”</p>
      <div class="reward-row"><span class="reward-chip"><i class="ic-elif"></i>+${reward}</span>
      <span class="reward-chip">👹 보스 데미지 +${bonusPct(id)}%</span></div>
      ${lines ? '<p class="hint">새로운 대사가 해금됐어요!</p>' : ""}
      <div class="modal-actions"><button class="btn yellow" data-close>헤헤</button></div>`);
    }, 0);
  }
}
const bonusPct = (id) => (level(id) - 1) * 3;

/* ───── 이벤트 연결 ───── */
TS.on("focus", ({ min, partner, extras }) => {
  gain(partner, min);
  extras.push(`💗 +${min}`);
});
TS.on("todo", () => gain(S().partner, 3));
TS.on("poke", (id) => {
  const s = S(), t = TS.today();
  if (!s.affPoke || s.affPoke.d !== t) s.affPoke = { d: t, n: 0 };
  if (s.affPoke.n < 10) { s.affPoke.n++; gain(id, 1); }
});
TS.lineHooks.push((c, kind) => {
  if (kind !== "idle" || !S().owned[c.id]) return [];
  const lv = level(c.id), table = AFF_LINES[c.pers];
  return Object.keys(table).filter((k) => lv >= +k).flatMap((k) => table[k]);
});

/* ───── 화면 ───── */
function heartBar(id) {
  const p = progress(id);
  return `<div class="aff-box">
    <div class="aff-head"><b>💗 호감도 Lv.${p.lv}</b><span>${p.max ? "MAX" : `${p.cur} / ${p.need}`}</span></div>
    <span class="bar aff"><i style="width:${p.max ? 100 : (p.cur / p.need) * 100}%"></i></span>
    <div class="aff-foot">보스 데미지 +${bonusPct(id)}% · <button class="link" data-gift="${id}">🎁 선물하기</button></div>
  </div>`;
}
TS.detailHooks.push((c) => heartBar(c.id));

TS.on("refresh", () => {
  const id = S().partner;
  const el = $("np-aff");
  if (el) { el.textContent = id ? `💗${level(id)}` : ""; el.classList.toggle("hidden", !id); }
});

function openGift(id) {
  const c = TS.SADO_MAP[id];
  if (!c || !S().owned[id]) return;
  const p = progress(id);
  TS.modal(`<h2>🎁 ${TS.esc(c.name)}에게 선물</h2>
    <img class="modal-emote" src="${TS.portrait(c, true)}" alt="" style="width:110px;height:110px">
    ${heartBar(id).replace(/<div class="aff-foot">[\s\S]*?<\/div>/, "")}
    <div class="gift-grid">${GIFTS.map((g) => {
      const fav = g.fav === c.pers;
      return `<button class="gift ${fav ? "fav" : ""}" data-buy="${g.id}" ${S().elif < g.cost ? "disabled" : ""}>
        <span class="gi">${g.icon}</span><b>${g.name}</b>
        <small><i class="ic-elif"></i>${g.cost} · 💗+${fav ? g.pts * 2 : g.pts}</small>
        ${fav ? '<em>최애!</em>' : ""}</button>`;
    }).join("")}</div>
    <p class="hint">보유 엘리프 ${S().elif.toLocaleString()} · 성격마다 제일 좋아하는 선물은 호감도 2배!</p>`,
    (el, close) => {
      el.querySelectorAll("[data-buy]").forEach((b) => (b.onclick = () => {
        const g = GIFTS.find((x) => x.id === b.dataset.buy);
        if (S().elif < g.cost) return;
        const fav = g.fav === c.pers;
        S().elif -= g.cost;
        close();
        TS.sfx(fav ? "r3" : "coin");
        if (S().partner === id) {
          TS.say(fav ? `와아아! ${g.name}! 제일 좋아하는 거예요!!` : `${g.name}? 고마워요, 교주님!`);
        }
        TS.toast(`${g.icon} ${c.name}에게 ${g.name} 선물! 💗+${fav ? g.pts * 2 : g.pts}`);
        if (fav) TS.confetti(40);
        gain(id, fav ? g.pts * 2 : g.pts);
        TS.save(); TS.refresh();
      }));
    });
}

document.addEventListener("click", (e) => {
  const g = e.target.closest("[data-gift]");
  if (g) {
    const back = g.closest(".modal-back");
    if (back) back.querySelector("[data-close]").click(); // 상세 모달을 닫고 선물창
    openGift(g.dataset.gift);
  }
});
$("gift-btn").onclick = () => openGift(S().partner);

window.Affection = { level, bonusPct, gain, openGift };
})();
