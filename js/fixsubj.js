/* =========================================================
   ✏️ 과목 기록 옮기기 — 다른 과목으로 잘못 들어간 공부 시간 고치기
   - 기록 → 과목별 누적 카드의 「✏️ 과목 기록 고치기」
   - 누적(stats.subjects) · 날짜별(stats.subjDays) · 연도별(stats.yr) 모두 옮김
   ========================================================= */
(() => {
"use strict";
const TS = window.TS, S = () => TS.state, esc = TS.esc;
const $ = (id) => document.getElementById(id);

function move(day, from, to, min) {
  const st = S().stats;
  const sd = (st.subjDays = st.subjDays || {});
  const d = (sd[day] = sd[day] || {});
  min = Math.min(min, d[from] || 0, (st.subjects || {})[from] || 0);
  if (min <= 0) return 0;
  const shift = (o) => { o[from] = (o[from] || 0) - min; if (o[from] <= 0) delete o[from]; o[to] = (o[to] || 0) + min; };
  shift(d); shift(st.subjects);
  const y = day.slice(0, 4);
  if (st.yr && st.yr[y] && st.yr[y].subj && (st.yr[y].subj[from] || 0) >= min) shift(st.yr[y].subj);
  TS.save(); TS.refresh();
  return min;
}

function open() {
  const st = S().stats, sd = st.subjDays || {};
  const days = Object.keys(sd).filter((d) => Object.values(sd[d]).some((m) => m > 0)).sort().reverse().slice(0, 14);
  if (!days.length) return TS.toast("아직 옮길 과목 기록이 없어요.");
  const subs = S().settings.subjects;
  TS.modal(`<h2>✏️ 과목 기록 고치기</h2>
    <p class="hint">다른 과목으로 잘못 들어간 공부 시간을 옮겨요. 엘리프·경험치는 그대로예요.</p>
    <div class="fx-form">
      <label>날짜 <select id="fx-day">${days.map((d) => `<option>${d}</option>`).join("")}</select></label>
      <label>잘못 들어간 과목 <select id="fx-from"></select></label>
      <label>원래 과목 <select id="fx-to">${subs.map((x) => `<option>${esc(x)}</option>`).join("")}</select></label>
      <label>옮길 시간(분) <input id="fx-min" type="number" min="1" step="1"></label>
    </div>
    <div class="modal-actions"><button class="btn white" data-close>취소</button><button class="btn yellow" id="fx-ok">옮기기</button></div>`,
  (el, close) => {
    const q = (s) => el.querySelector(s);
    const fill = () => {
      const d = sd[q("#fx-day").value] || {};
      q("#fx-from").innerHTML = Object.entries(d).filter(([, m]) => m > 0).map(([k, m]) => `<option value="${esc(k)}">${esc(k)} (${m}분)</option>`).join("");
      setMax();
    };
    const setMax = () => { const m = (sd[q("#fx-day").value] || {})[q("#fx-from").value] || 0; q("#fx-min").max = m; q("#fx-min").value = m; };
    q("#fx-day").onchange = fill; q("#fx-from").onchange = setMax;
    fill();
    q("#fx-ok").onclick = () => {
      const from = q("#fx-from").value, to = q("#fx-to").value, n = Math.floor(+q("#fx-min").value);
      if (!from || !to || from === to) return TS.toast("서로 다른 과목을 골라 주세요.");
      if (!(n > 0)) return TS.toast("옮길 시간을 적어 주세요.");
      const done = move(q("#fx-day").value, from, to, n);
      close();
      TS.toast(done ? `✏️ ${from} ${done}분 → ${to}(으)로 옮겼어요!` : "옮길 시간이 없어요.");
    };
  });
}

const list = $("subj-list");
if (list) {
  const b = document.createElement("button");
  b.className = "btn white small"; b.textContent = "✏️ 과목 기록 고치기"; b.style.marginTop = "8px";
  b.onclick = open;
  list.after(b);
}
window.FixSubj = { open, move };
})();
