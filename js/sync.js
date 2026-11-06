/* =========================================================
   ☁️ 다른 기기와 동기화 — 동기화 코드 하나로 같은 기록을 여러 기기에서
   - 기록 → 설정 「☁️ 다른 기기와 동기화」
   - 코드를 만들면 1분마다(바뀐 게 있을 때만) · 창을 내릴 때 Firebase /sync/<코드> 에 저장
   - 다른 기기에서 코드를 넣으면 그 기록을 불러오고, 이후 두 기기가 같은 코드로 이어서 저장
   - 켤 때 다른 기기에서 저장한 더 새 기록이 있으면 불러올지 물어봄
   - 랭킹 로그인 정보도 같이 옮겨서 랭킹에 같은 사람으로 나옴
   ========================================================= */
(() => {
"use strict";
const TS = window.TS, S = () => TS.state, esc = TS.esc;
const SAVE_KEY = "trickcal-study", AUTH_KEY = "trickcal-rank-auth", DEV_KEY = "trickstudy-device";
const ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 헷갈리는 0·O·1·I 뺌
const dev = (() => { let d = ""; try { d = localStorage.getItem(DEV_KEY); if (!d) { d = "d" + Math.random().toString(36).slice(2, 10); localStorage.setItem(DEV_KEY, d); } } catch (e) { d = "d0"; } return d; })();
const sy = () => S().sync || null;
const norm = (c) => String(c || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
const pretty = (c) => c.replace(/(.{5})(?=.)/g, "$1-");
const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(20)), (b) => ABC[b % ABC.length]).join("");
const api = (...a) => (window.FB ? window.FB.api(...a) : Promise.reject(new Error("랭킹 서버 연결 없음")));
const when = (t) => { const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };

// 비교용: 동기화 정보(sync)는 빼고
const body = () => { const o = { ...S() }; delete o.sync; return JSON.stringify(o); };
let checked = false, lastBody = "", busy = false, status = "";

async function push(force) {
  const s = sy(); if (!s || !s.code || !checked || busy) return;
  const b = body(); if (!force && b === lastBody) return;
  busy = true;
  try {
    const st = S(), t = Date.now();
    let a = ""; try { a = localStorage.getItem(AUTH_KEY) || ""; } catch (e) { /* 없음 */ }
    await api(`sync/${s.code}`, { method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ v: b, a, t, dev, name: String(st.name || "").slice(0, 12), lv: st.level, total: st.stats.totalMin }) });
    lastBody = b; s.at = t; s.err = ""; TS.save(); status = `☁️ ${when(t)} 저장됨`;
  } catch (e) {
    s.err = /permission/i.test(e.message) ? "서버가 거절했어요 (보안 규칙에 sync 를 추가해 주세요)" : e.message;
    status = "⚠️ 저장 실패: " + s.err;
  }
  busy = false; paint();
}
async function fetchRemote(code) {
  const { data } = await api(`sync/${code}`);
  return data && typeof data.v === "string" ? data : null;
}
function apply(code, r) {
  checked = false; // 불러오는 동안은 저장 안 함
  const st = JSON.parse(r.v);
  st.sync = { code, at: r.t };
  localStorage.setItem(SAVE_KEY, JSON.stringify(st));
  if (r.a) localStorage.setItem(AUTH_KEY, r.a);
  location.reload();
}
const summary = (r) => `<b>${esc(r.name || "교주")}</b> · Lv.${r.lv || 1} · 누적 ${Math.floor((r.total || 0) / 60)}시간 ${(r.total || 0) % 60}분<br><small>${when(r.t)}에 저장</small>`;

/* 켤 때: 다른 기기의 더 새 기록 확인 */
async function startCheck() {
  const s = sy();
  if (!s || !s.code) { checked = true; return; }
  try {
    const r = await fetchRemote(s.code);
    if (r && r.t > (s.at || 0) + 2000 && r.dev !== dev) {
      TS.modal(`<h2>☁️ 더 새 기록이 있어요</h2><p>다른 기기에서 저장한 기록이 이 기기보다 새로워요.</p>
        <div class="sy-box">${summary(r)}</div>
        <div class="modal-actions"><button class="btn white" id="sy-keep">이 기기 기록 쓰기</button><button class="btn yellow" id="sy-pull">불러오기</button></div>`,
        (el, close) => {
          el.querySelector("#sy-pull").onclick = () => apply(s.code, r);
          el.querySelector("#sy-keep").onclick = () => { close(); checked = true; push(true); };
        }, { noClose: true });
      return;
    }
    checked = true; push(false);
  } catch (e) { checked = true; status = "⚠️ " + e.message; paint(); }
}

/* ───── 설정 화면 ───── */
function makeCode() {
  if (!window.FB) return TS.toast("랭킹 서버가 연결돼 있어야 동기화할 수 있어요.");
  S().sync = { code: newCode(), at: 0 }; TS.save(); checked = true;
  push(true).then(() => showCode());
}
function showCode() {
  const s = sy(); if (!s) return;
  TS.modal(`<h2>☁️ 동기화 코드</h2><p>다른 기기의 <b>기록 → 설정 → 코드로 불러오기</b>에 이 코드를 넣으면 같은 기록을 이어서 쓸 수 있어요.</p>
    <div class="sy-code" id="sy-code">${pretty(s.code)}</div>
    <p class="hint">⚠️ 이 코드를 아는 사람은 기록을 불러오고 덮어쓸 수 있어요. 다른 사람에게 알려 주지 마세요.</p>
    <div class="modal-actions"><button class="btn white" id="sy-copy">복사</button><button class="btn yellow" data-close>확인</button></div>`,
    (el) => { el.querySelector("#sy-copy").onclick = () => { navigator.clipboard && navigator.clipboard.writeText(pretty(s.code)).then(() => TS.toast("📋 복사했어요")); }; });
}
function askCode() {
  TS.modal(`<h2>☁️ 코드로 불러오기</h2><p>다른 기기에서 만든 동기화 코드를 넣어 주세요. <b>이 기기의 지금 기록은 그 기록으로 바뀌어요.</b></p>
    <input id="sy-in" class="sy-in" placeholder="XXXXX-XXXXX-XXXXX-XXXXX" autocomplete="off">
    <p class="hint" id="sy-msg"></p>
    <div class="modal-actions"><button class="btn white" data-close>취소</button><button class="btn yellow" id="sy-go">확인</button></div>`,
    (el) => {
      const msg = el.querySelector("#sy-msg");
      el.querySelector("#sy-go").onclick = async () => {
        const code = norm(el.querySelector("#sy-in").value);
        if (code.length !== 20) { msg.textContent = "코드는 20글자예요."; return; }
        msg.textContent = "찾는 중…";
        try {
          const r = await fetchRemote(code);
          if (!r) { msg.textContent = "이 코드로 저장된 기록이 없어요."; return; }
          el.querySelector(".modal").innerHTML = `<h2>☁️ 이 기록을 불러올까요?</h2><div class="sy-box">${summary(r)}</div>
            <p class="hint">이 기기의 지금 기록은 사라져요. 걱정되면 먼저 「데이터 내보내기」로 백업해 두세요.</p>
            <div class="modal-actions"><button class="btn white" data-close>취소</button><button class="btn yellow" id="sy-ok">불러오기</button></div>`;
          el.querySelector("#sy-ok").onclick = () => apply(code, r);
        } catch (e) { msg.textContent = /permission/i.test(e.message) ? "서버가 거절했어요 (보안 규칙에 sync 를 추가해 주세요)" : "실패: " + e.message; }
      };
    });
}
let card = null;
function paint() {
  if (!card) return;
  const s = sy();
  card.innerHTML = `<h3 class="card-title">☁️ 다른 기기와 동기화</h3>
    ${s && s.code
      ? `<p class="hint" style="margin:0 0 8px">동기화 켜짐 · ${esc(status || (s.at ? `☁️ ${when(s.at)} 저장됨` : "저장 준비 중"))}</p>
         <div class="row"><button class="btn yellow" data-sy="show">🔑 코드 보기</button><button class="btn white" data-sy="now">지금 저장</button><button class="btn white" data-sy="load">코드로 불러오기</button><button class="btn white" data-sy="off">동기화 끄기</button></div>`
      : `<p class="hint" style="margin:0 0 8px">코드를 만들면 기록이 서버에 저장돼서, 다른 기기에서 그 코드로 같은 기록을 이어서 쓸 수 있어요.</p>
         <div class="row"><button class="btn yellow" data-sy="make">🔑 동기화 코드 만들기</button><button class="btn white" data-sy="load">코드로 불러오기</button></div>`}`;
}
const settings = document.querySelector("#view-stats .card.settings");
if (settings) {
  card = document.createElement("div"); card.className = "card sy-card";
  settings.after(card);
  card.addEventListener("click", (e) => {
    const b = e.target.closest("[data-sy]"); if (!b) return;
    const k = b.dataset.sy;
    if (k === "make") makeCode();
    else if (k === "show") showCode();
    else if (k === "now") push(true);
    else if (k === "load") askCode();
    else if (k === "off") TS.modal(`<h2>동기화 끄기</h2><p>이 기기에서 더 이상 저장하지 않아요. 서버의 기록은 남아 있어서 코드로 다시 불러올 수 있어요.</p>
      <div class="modal-actions"><button class="btn white" data-close>취소</button><button class="btn red" id="sy-off">끄기</button></div>`,
      (el, close) => { el.querySelector("#sy-off").onclick = () => { delete S().sync; TS.save(); status = ""; close(); paint(); }; });
  });
  paint();
}

setInterval(() => push(false), 60000);
document.addEventListener("visibilitychange", () => { if (document.hidden) push(false); });
setTimeout(startCheck, 1500);
window.Sync = { push, status: () => status };
})();
