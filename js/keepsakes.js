/* =========================================================
   💝 애장품 (게임 파일에서 뽑은 그림 70장 — assets/keepsakes/<n>.webp)
   - 사도 호감도 레벨이 오를 때마다 아직 없는 애장품 하나를 받음
     (주인 사도(id)가 정해진 애장품은 그 사도가 호감도 Lv5 가 되면 그걸 먼저)
   - 이름은 그림을 보고 붙인 것. id(주인 사도)는 알게 되면 채우기
   ========================================================= */
const KEEPSAKES = [
  ["000", "보석 박힌 마법서"], ["001", "편지 묶음"], ["002", "빵 그림 티켓"], ["003", "오두막 스노우볼"], ["004", "수저 틀"],
  ["005", "낡은 금빛 지도"], ["006", "해골 토끼 인형"], ["007", "나무 관절 인형"], ["008", "낚시 도구함"], ["009", "새싹 화분"],
  ["010", "파란 장미 꽃다발"], ["011", "꽃 화관"], ["012", "휴대용 게임기"], ["013", "나무 받침과 편지"], ["014", "풍경 스케치북"],
  ["015", "장식 거울"], ["016", "흔들의자"], ["017", "흑백 단체 사진"], ["018", "노트북"], ["019", "낙서 가득한 책"],
  ["020", "리본 묶은 크레용"], ["021", "초승달 일기장"], ["022", "사인 CD"], ["023", "가시 왕관과 보석"], ["024", "젤리 디저트"],
  ["025", "작전 지도"], ["026", "비석 모양 패"], ["027", "은빛 점퍼"], ["028", "초록 버튼 패드"], ["029", "잎사귀 열쇠고리"],
  ["030", "병 속의 고양이"], ["031", "흑요석 단검"], ["032", "분홍 쿠션"], ["033", "아이스 레몬티"], ["034", "황금 트로피"],
  ["035", "검은 갑옷 조각"], ["036", "해골 선글라스"], ["037", "분홍 후드티"], ["038", "카세트 플레이어"], ["039", "패딩 점퍼"],
  ["040", "로봇 저금통"], ["041", "토끼 조각상"], ["042", "보트 열쇠"], ["043", "나무 그루터기 상자"], ["044", "돌고래 인형"],
  ["045", "나무 그림책"], ["046", "토끼 다이어리"], ["047", "금화"], ["048", "포도 주스 파우치"], ["049", "그림 두루마리"],
  ["050", "홍차 찻잔"], ["051", "게임 카트리지"], ["052", "펼친 연구 노트"], ["053", "고급 파이프"], ["054", "덤벨 사진 키링"],
  ["055", "잎사귀 주사위"], ["056", "분홍 털모자"], ["057", "유리 돔 속 꼬마"], ["058", "깃펜 상자"], ["059", "나무 메달"],
  ["060", "붉은 뿔 허수아비"], ["061", "금화 바구니"], ["062", "우유팩"], ["063", "채소 바구니"], ["064", "휴대용 선풍기"],
  ["065", "줄무늬 목도리"], ["066", "연꽃"], ["067", "가시 고리"], ["068", "은잔"], ["069", "사진 케이스"],
].map(([n, name]) => ({ n, name, id: null }));

(() => {
"use strict";
const TS = window.TS;
if (!TS) return;
const S = () => TS.state;
const src = (k) => `assets/keepsakes/${k.n}.webp`;
const owned = () => { if (!Array.isArray(S().keeps)) S().keeps = []; return S().keeps; };
const has = (n) => owned().includes(n);
const KMAP = new Map(KEEPSAKES.map((k) => [k.n, k]));
const affLv = (id) => (TS.affLevel ? TS.affLevel(id) : 1);

/* 호감도 레벨업 → 애장품 하나 (주인 사도 것이 있고 Lv5 이상이면 그걸 먼저) */
function grant(id, lv) {
  const mine = KEEPSAKES.find((k) => k.id === id && !has(k.n));
  let k = mine && lv >= 5 ? mine : null;
  if (!k) { const pool = KEEPSAKES.filter((x) => !has(x.n) && !x.id); if (!pool.length) return null; k = pool[Math.floor(Math.random() * pool.length)]; }
  owned().push(k.n); TS.save && TS.save();
  return k;
}
TS.keepsakeGrant = grant;
TS.keepsakeHTML = (k) => `<div class="ks-got"><img src="${src(k)}" alt=""><div><b>💝 애장품을 받았어요!</b><span>${TS.esc(k.name)}</span></div></div>`;

/* 사도 상세 창: 그 사도의 애장품 (주인이 정해진 것만) */
TS.detailHooks.push((c) => {
  const k = KEEPSAKES.find((x) => x.id === c.id); if (!k) return "";
  const open = has(k.n);
  return `<div class="ks-slot ${open ? "" : "lock"}"><img src="${src(k)}" alt=""><div><b>💝 애장품</b><span>${open ? TS.esc(k.name) : "호감도 Lv5에 열려요"}</span></div></div>`;
});

/* 모음 창 */
function openBook() {
  const n = owned().length;
  TS.modal(`<h2>💝 애장품 모음 <small>${n} / ${KEEPSAKES.length}</small></h2>
    <p class="hint">사도의 <b>호감도 레벨이 오를 때마다</b> 애장품을 하나씩 받아요. 집중·선물·볼 찌르기로 호감도를 올려 보세요!</p>
    <div class="ks-grid">${KEEPSAKES.map((k) => {
      const o = has(k.n), who = k.id && TS.SADO_MAP[k.id];
      return `<div class="ks-it ${o ? "" : "lock"}" title="${o ? TS.esc(k.name) : "아직 못 받은 애장품"}"><img src="${src(k)}" alt="" loading="lazy"><span>${o ? TS.esc(k.name) : "?"}${o && who ? `<em>${TS.esc(who.name)}</em>` : ""}</span></div>`;
    }).join("")}</div>
    <div class="modal-actions"><button class="btn yellow" data-close>닫기</button></div>`);
}
TS.openKeepsakes = openBook;
function addButton() {
  const seg = document.getElementById("sado-seg"); if (!seg || document.getElementById("ks-btn")) return;
  const b = document.createElement("button"); b.id = "ks-btn"; b.type = "button"; b.className = "ks-btn";
  seg.appendChild(b); b.onclick = (e) => { e.stopPropagation(); openBook(); };
  const upd = () => { b.textContent = `💝 애장품 ${owned().length}/${KEEPSAKES.length}`; };
  upd(); TS.on && TS.on("refresh", upd);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addButton); else addButton();
})();
