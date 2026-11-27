/* =========================================================
   💝 애장품 — 게임처럼 사도 호감도 Lv.30이 되면 그 사도의 애장품과 💌 편지가 도착
   - 이름·설명·편지: 「사도정리」 문서 (assets/data/sado-notes.json, js/kyoju-note.js 가 불러옴)
   - 그림: assets/keepsakes/<n>.webp (게임 파일에서 뽑은 70장 중 주인을 알아낸 것), 없으면 사도 얼굴
   - KEEPSAKES 는 예전(5레벨마다 무작위로 주던 시절)에 받은 소품을 보여 줄 때만 씀
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
const S = () => TS.state, esc = TS.esc;
const PREVIEW = new URLSearchParams(location.search).has("preview");
const old = () => (Array.isArray(S().keeps) ? S().keeps : []);
const KMAP = new Map(KEEPSAKES.map((k) => [k.n, k]));
const affLv = (id) => (TS.affLevel ? TS.affLevel(id) : 1);
const has = (id) => PREVIEW || (S().owned[id] && affLv(id) >= 30);

TS.keepsakeGrant = () => null; // 이제 애장품은 Lv.30에만 (kyoju-note.js 의 noteLevelHTML)

function openBook() {
  TS.sadoNotes().then((D) => {
    if (!D) { TS.toast("애장품 목록을 불러오지 못했어요. 잠시 뒤 다시 눌러 주세요."); return; }
    const ids = Object.keys(D).filter((id) => D[id].ks && TS.SADO_MAP[id]);
    ids.sort((a, b) => (has(b) - has(a)) || (affLv(b) - affLv(a)) || TS.SADO_MAP[a].name.localeCompare(TS.SADO_MAP[b].name));
    const n = ids.filter(has).length, mine = old();
    TS.modal(`<h2>💝 애장품 모음 <small>${n} / ${ids.length}</small></h2>
      <p class="hint">게임처럼 사도의 <b>호감도가 Lv.30</b>이 되면 그 사도의 애장품과 💌 편지가 도착해요. 받은 애장품을 누르면 편지를 다시 읽을 수 있어요.</p>
      <div class="ks-grid">${ids.map((id) => {
        const d = D[id], c = TS.SADO_MAP[id], o = has(id);
        return `<button class="ks-it ${o ? "" : "lock"} ${d.ks.img ? "" : "face"}" ${o ? `data-letter="${id}"` : ""} title="${o ? esc(d.ks.name) : `${esc(c.name)} · 호감도 Lv.30에 도착`}">
          <img src="${TS.keepsakeSrc(id, d)}" alt="" loading="lazy"><span>${o ? esc(d.ks.name) : "?"}<em>${esc(c.name)}${o ? "" : ` · Lv.${affLv(id)}`}</em></span></button>`;
      }).join("")}</div>
      ${mine.length ? `<details class="aff-book"><summary>🎁 예전에 받은 소품 <b>${mine.length}</b></summary><div class="ks-grid small">${mine.map((k) => KMAP.get(k)).filter(Boolean).map((k) =>
        `<div class="ks-it"><img src="assets/keepsakes/${k.n}.webp" alt="" loading="lazy"><span>${esc(k.name)}</span></div>`).join("")}</div></details>` : ""}
      <div class="modal-actions"><button class="btn yellow" data-close>닫기</button></div>`, null, { cls: "ks-modal" });
  });
}
TS.openKeepsakes = openBook;
function addButton() {
  const seg = document.getElementById("sado-seg"); if (!seg || document.getElementById("ks-btn")) return;
  const b = document.createElement("button"); b.id = "ks-btn"; b.type = "button"; b.className = "ks-btn";
  seg.appendChild(b); b.onclick = (e) => { e.stopPropagation(); openBook(); };
  const upd = () => {
    const D = TS.sadoNotesData && TS.sadoNotesData();
    if (!D) { b.textContent = "💝 애장품"; return; }
    const ids = Object.keys(D).filter((id) => D[id].ks && TS.SADO_MAP[id]);
    b.textContent = `💝 애장품 ${ids.filter(has).length}/${ids.length}`;
  };
  upd(); TS.on && TS.on("refresh", upd);
  TS.sadoNotes && TS.sadoNotes().then(upd);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addButton); else addButton();
})();
