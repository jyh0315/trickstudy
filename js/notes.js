/* 📝 노트 탭 — 필기 노트 목록 · 새 노트 · 파일로 저장/불러오기 · PDF · AI(Gemini) 설정
   노트는 이 브라우저의 IndexedDB "trickstudy-notes" 에 노트마다 따로 저장 (필기 화면 note.html 과 같은 곳)
   AI 키는 이 브라우저 localStorage 에만 (사이트·GitHub 에는 올라가지 않음) */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (t) => String(t == null ? "" : t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  /* ───── 저장소: 공용 (js/note-store.js) ───── */
  const NS = window.NoteStore;
  const { getNote, putNote, delNote, allNotes, putImg, delImg, imgIds } = NS;
  const newId = () => "n" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

  const PAPER = { lined: ["📏", "줄 노트"], blank: ["⬜", "무지"], grid: ["▦", "격자"] };
  const ago = (t) => {
    const m = Math.round((Date.now() - t) / 60000);
    if (m < 1) return "방금"; if (m < 60) return m + "분 전";
    const h = Math.round(m / 60); if (h < 24) return h + "시간 전";
    return new Date(t).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
  };

  /* ───── AI(Gemini) 설정 — note.html 과 같은 키 이름 ───── */
  const GKEY = "trickstudy-gemini", FKEY = "trickstudy-note-fixes", UKEY = "trickstudy-gemini-usage", GAPI = "https://generativelanguage.googleapis.com/v1beta/";
  const getJ = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || "null") || d; } catch (e) { return d; } };
  const setJ = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 무시 */ } };
  async function gemErr(r) { let m = r.status + ""; try { const j = await r.json(); m = (j.error && (j.error.message || j.error.status)) || m; } catch (e) { /* 무시 */ } return m; }
  async function gemModels(key) {
    const r = await fetch(GAPI + "models?pageSize=200", { headers: { "x-goog-api-key": key } });
    if (!r.ok) throw new Error(await gemErr(r));
    const j = await r.json();
    return (j.models || []).filter((m) => (m.supportedGenerationMethods || []).includes("generateContent")).map((m) => m.name.replace(/^models\//, ""));
  }
  function rankModels(list) { // 빠른 것부터: flash-lite > flash, 정식 > 미리보기, 높은 버전 (손글씨 옮기기엔 lite 로 충분하고 훨씬 빠름)
    const ok = list.filter((n) => /^gemini-(\d+(\.\d+)?)-flash(-lite)?(-\d{3}|-latest|-preview[\w-]*)?$/.test(n) || /^gemini-flash(-lite)?-latest$/.test(n));
    const ver = (n) => { const m = n.match(/gemini-(\d+(?:\.\d+)?)/); return m ? parseFloat(m[1]) : 0; };
    const sc = (n) => (/lite/.test(n) ? 200 : 0) + (/preview|exp/.test(n) ? 0 : 100) + ver(n) * 10 - (/latest/.test(n) ? 5 : 0);
    return ok.sort((a, b) => sc(b) - sc(a));
  }
  function tidyOf(g) { // 정리 모델 기본 = lite 가 아닌 가장 좋은 flash
    if (g.tidyModel) return g.tidyModel;
    const ver = (n) => { const m = n.match(/gemini-(\d+(?:\.\d+)?)/); return m ? parseFloat(m[1]) : 0; };
    const sc = (n) => (/lite/.test(n) ? 0 : 200) + (/preview|exp/.test(n) ? 0 : 100) + ver(n) * 10 - (/latest/.test(n) ? 5 : 0);
    return [...(g.models || [])].sort((a, b) => sc(b) - sc(a))[0] || g.model;
  }
  function aiHTML() {
    const g0 = getJ(GKEY, {});
    if (g0.models && g0.models.length && !g0.picked) { const ms = rankModels(g0.models); if (ms.length && (ms[0] !== g0.model || ms.join() !== g0.models.join())) { g0.models = ms; g0.model = ms[0]; setJ(GKEY, g0); } } // 기본 = 가장 빠른 flash-lite
    const g = getJ(GKEY, {}), fx = getJ(FKEY, []), u = getJ(UKEY, {}), today = new Date().toLocaleDateString("sv");
    const used = u.date === today ? u.n || 0 : 0;
    const st = g.key && g.model ? `<span class="nt-chip ok">✅ 사용 중 · ${esc(g.model)}</span>` : g.key ? `<span class="nt-chip warn">키 확인 필요</span>` : `<span class="nt-chip">키 없음</span>`;
    return `<h2 class="ribbon">🔑 AI 글씨 인식 설정</h2>
      <p class="hint" style="margin-top:0">구글 <b>Gemini</b> 키를 넣으면 손글씨(한국어·수식)를 읽고 정리해 줘요. 키는 <b>이 브라우저에만</b> 저장돼요. ${st}</p>
      <div class="nt-ai">
        <input type="password" id="nt-key" placeholder="${g.key ? "••••••••" + esc(g.key.slice(-4)) + " (바꾸려면 새 키 붙여 넣기)" : "Gemini API 키 붙여 넣기"}" autocomplete="off" spellcheck="false">
        <button class="btn yellow" id="nt-key-save">저장·확인</button>
        ${g.models && g.models.length ? `<label class="nt-ml">📖 읽기 <select id="nt-model" title="손글씨 읽기 — 빠른 모델 추천 (flash-lite)">${g.models.map((m) => `<option ${m === g.model ? "selected" : ""}>${esc(m)}</option>`).join("")}</select></label>
          <label class="nt-ml">🤖 정리 <select id="nt-tidy" title="AI 정리(순서·소제목) — 조금 높은 모델 추천 (flash)">${g.models.map((m) => `<option ${m === tidyOf(g) ? "selected" : ""}>${esc(m)}</option>`).join("")}</select></label>` : ""}
        ${g.key ? '<button class="btn" id="nt-key-del">키 지우기</button>' : ""}
      </div>
      <p class="hint">📊 오늘 보낸 횟수 <b>${used}</b>번 · ✏️ 기억한 고친 글자 <b>${fx.length}</b>개 ${fx.length ? '<button class="btn small" id="nt-fix-clear">고친 기록 지우기</button>' : ""}<br>
      키 만드는 곳: aistudio.google.com → Get API key (만 18세 이상). 키는 채팅·메시지에 붙여 넣지 마세요.</p>`;
  }
  function bindAI(card) {
    const save = $("nt-key-save");
    if (save) save.onclick = async () => {
      const v = $("nt-key").value.trim(), g = getJ(GKEY, {}), key = v || g.key;
      if (!key) return TS.toast("키를 붙여 넣어 주세요");
      save.disabled = true; save.textContent = "확인 중…";
      try {
        const ms = rankModels(await gemModels(key));
        if (!ms.length) throw new Error("쓸 수 있는 flash 모델이 없어요");
        setJ(GKEY, { key, models: ms.slice(0, 12), model: ms[0] });
        TS.toast("🔑 키 확인 완료! " + ms[0] + " 로 읽을게요");
      } catch (e) { setJ(GKEY, { key }); TS.toast("키 확인 실패: " + e.message); }
      card.innerHTML = aiHTML(); bindAI(card);
    };
    const ts = $("nt-tidy");
    if (ts) ts.onchange = () => { const g = getJ(GKEY, {}); g.tidyModel = ts.value; setJ(GKEY, g); TS.toast("🤖 정리 모델: " + ts.value); };
    const sel = $("nt-model");
    if (sel) sel.onchange = () => { const g = getJ(GKEY, {}); g.model = sel.value; g.picked = true; /* 직접 고른 건 그대로 둠 */ setJ(GKEY, g); card.innerHTML = aiHTML(); bindAI(card); };
    const del = $("nt-key-del");
    if (del) del.onclick = () => { try { localStorage.removeItem(GKEY); } catch (e) { /* 무시 */ } TS.toast("키를 지웠어요"); card.innerHTML = aiHTML(); bindAI(card); };
    const fc = $("nt-fix-clear");
    if (fc) fc.onclick = () => { setJ(FKEY, []); TS.toast("고친 기록을 지웠어요"); card.innerHTML = aiHTML(); bindAI(card); };
  }

  /* ───── 파일로 저장 / 불러오기 (.tnote = 노트 하나, .tnotes = 전체 묶음) ───── */
  async function saveBlob(blob, name, ext, desc) {
    if (window.showSaveFilePicker) { // 크롬: 저장 위치·이름을 고르는 창 (한글 이름 그대로)
      try {
        const h = await window.showSaveFilePicker({ suggestedName: name, types: [{ description: desc, accept: { "application/json": [ext] } }] });
        const w = await h.createWritable(); await w.write(blob); await w.close();
        return true;
      } catch (e) { if (e && e.name === "AbortError") return false; } // 취소면 끝, 다른 오류면 아래 방식으로
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name; a.style.display = "none";
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
    return true;
  }
  async function exportNote(id) {
    const n = await getNote(id);
    if (!n) return;
    if (await saveBlob(await NS.noteFile(n), NS.fileName(n) + ".tnote", ".tnote", "트릭스터디 노트")) TS.toast("💾 노트 파일을 저장했어요");
  }
  async function exportAll() {
    const d = new Date(), stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (await saveBlob(await NS.bundleFile(), `트릭스터디 노트 전체 ${stamp}.tnotes`, ".tnotes", "트릭스터디 노트 묶음")) { NS.markFull(); TS.toast("⬇️ 노트 전체를 한 파일로 저장했어요"); renderBackup(); }
  }
  async function importOne(n, imgs) {
    for (const [k, url] of Object.entries(imgs || {})) { if (!n.data || !JSON.stringify(n.data.strokes || []).includes(k)) continue; const b = await (await fetch(url)).blob(); await putImg(k, b); }
    const old = await getNote(n.id);
    if (old && old.updated >= (n.updated || 0)) { if (JSON.stringify(old.data) === JSON.stringify(n.data)) return 0; n.id = newId(); n.title = (n.title || "노트") + " (불러옴)"; } // 같은 노트면 건너뜀, 다르면 사본
    await putNote(n); return 1;
  }
  async function importFile(file) {
    try {
      const d = JSON.parse(await file.text());
      let n = 0;
      if (d && d.app === "trickstudy-note" && d.note) n = await importOne(d.note, d.imgs);
      else if (d && d.app === "trickstudy-notes" && Array.isArray(d.notes)) { for (const x of d.notes) n += await importOne(x, d.imgs); }
      else throw new Error("트릭스터디 노트 파일이 아니에요");
      TS.toast(n ? `📂 노트 ${n}개를 불러왔어요` : "📂 이미 같은 노트가 있어요");
      listSig = ""; loadList();
    } catch (e) { TS.toast("불러오기 실패: " + (e.message || e)); }
  }

  /* ───── 새 노트 ───── */
  function newNoteModal() {
    TS.modal(`<h2 class="ribbon">📝 새 노트</h2>
      <label class="nt-f">제목 <small>(과목·단원을 넣으면 AI가 글씨를 더 잘 읽어요)</small>
        <input id="nn-title" maxlength="40" placeholder="예: 생명과학Ⅰ 세포 분열" autocomplete="off"></label>
      <div class="nt-f">종이
        <div class="nt-papers" id="nn-paper">
          ${Object.entries(PAPER).map(([k, [ic, lb]], i) => `<button data-v="${k}" class="${i === 0 ? "on" : ""}"><span class="nt-pv ${k}"></span>${ic} ${lb}</button>`).join("")}
        </div></div>
      <div class="nt-f">보기
        <div class="nt-papers" id="nn-mode"><button data-v="inf" class="on">📜 무한 (A4가 아래로 이어짐)</button><button data-v="page">📄 한 장씩 넘기기</button></div></div>
      <button class="btn pink big" id="nn-go" style="width:100%;margin-top:10px">✏️ 필기 시작</button>`, (m, close) => {
      const pick = (id) => m.querySelector(`#${id} .on`).dataset.v;
      m.querySelectorAll(".nt-papers").forEach((g) => g.querySelectorAll("button").forEach((b) => (b.onclick = () => { g.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); })));
      const ti = m.querySelector("#nn-title"); setTimeout(() => ti.focus(), 50);
      m.querySelector("#nn-go").onclick = async () => {
        const n = { id: newId(), title: ti.value.trim() || "제목 없는 노트", paper: pick("nn-paper"), mode: pick("nn-mode"), created: Date.now(), updated: Date.now(), pages: [], data: { strokes: [], meta: {}, nextId: 1, heads: [] } };
        try { await putNote(n); } catch (e) { return TS.toast("노트를 만들지 못했어요: " + (e.message || e)); }
        close(); location.href = "note.html?id=" + encodeURIComponent(n.id);
      };
      ti.onkeydown = (e) => { if (e.key === "Enter") m.querySelector("#nn-go").click(); };
    });
  }

  /* ───── 목록 ───── */
  let listSig = "";
  async function loadList() {
    const box = $("nt-list");
    if (!box) return;
    let notes = [];
    try { notes = await allNotes(); } catch (e) { box.innerHTML = `<p class="hint">이 브라우저에서는 노트 저장소를 쓸 수 없어요 (${esc(e.message || e)})</p>`; return; }
    notes.sort((a, b) => (b.updated || 0) - (a.updated || 0));
    const sig = notes.map((n) => n.id + ":" + n.updated + ":" + n.title).join("|") + "|" + Math.floor(Date.now() / 60000);
    if (sig === listSig) return;
    listSig = sig;
    if (!notes.length) { box.innerHTML = `<div class="nt-empty">아직 노트가 없어요. <b>＋ 새 노트</b>로 첫 필기를 시작해 보세요!</div>`; return; }
    box.innerHTML = notes.map((n) => {
      const [ic, lb] = PAPER[n.paper] || PAPER.lined, st = n.stats || {};
      const sums = (n.pages || []).map((p) => p && p.summary).filter(Boolean);
      return `<div class="nt-item" data-id="${esc(n.id)}">
        <a class="nt-open" href="note.html?id=${encodeURIComponent(n.id)}">
          <span class="nt-thumb ${esc(n.paper || "lined")}">${ic}</span>
          <span class="nt-info"><b>${esc(n.title || "제목 없는 노트")}</b>
            <small>${lb} · ${st.pages || 1}쪽 · 덩어리 ${st.blocks || 0}개${st.imgs ? ` · 사진 ${st.imgs}장` : ""} · ${ago(n.updated || n.created)}</small>
            ${sums.length ? `<small class="nt-sum">${esc(sums.slice(0, 3).join(" / "))}</small>` : ""}</span></a>
        <span class="nt-btns">
          <button class="btn small" data-act="pdf" title="A4 PDF (첫 장에 대표 사도와 제목)">📕 PDF</button>
          <button class="btn small" data-act="file" title="노트 파일(.tnote)로 저장">💾</button>
          <button class="btn small" data-act="ren" title="이름 바꾸기">✏️</button>
          <button class="btn small" data-act="del" title="지우기">🗑</button>
        </span></div>`;
    }).join("");
    box.querySelectorAll(".nt-item").forEach((it) => {
      const id = it.dataset.id;
      it.querySelectorAll("[data-act]").forEach((b) => (b.onclick = async () => {
        const act = b.dataset.act;
        if (act === "pdf") location.href = "note.html?id=" + encodeURIComponent(id) + "&pdf=1";
        if (act === "file") exportNote(id);
        if (act === "ren") {
          const n = await getNote(id); if (!n) return;
          TS.modal(`<h2 class="ribbon">✏️ 이름 바꾸기</h2><input id="rn-t" class="nt-in" maxlength="40" value="${esc(n.title || "")}"><button class="btn yellow" id="rn-ok" style="margin-top:10px;width:100%">바꾸기</button>`, (m, close) => {
            const t = m.querySelector("#rn-t"); setTimeout(() => { t.focus(); t.select(); }, 50);
            const go = async () => { n.title = t.value.trim() || n.title; n.updated = Date.now(); await putNote(n); close(); listSig = ""; loadList(); };
            m.querySelector("#rn-ok").onclick = go; t.onkeydown = (e) => { if (e.key === "Enter") go(); };
          });
        }
        if (act === "del") {
          const n = await getNote(id); if (!n) return;
          TS.confirmModal("🗑 노트 지우기", `「${esc(n.title)}」를 지울까요? 되돌릴 수 없어요. (필요하면 먼저 💾 파일로 저장해 두세요)`, "지우기", async () => {
            await delNote(id); for (const k of imgIds(n)) { try { await delImg(k); } catch (e) { /* 무시 */ } }
            TS.toast("노트를 지웠어요"); listSig = ""; loadList();
          }, true);
        }
      }));
    });
  }

  /* ───── 백업 ─────
     폴더를 한 번 골라 두면 노트가 바뀔 때 그 폴더에 .tnote 로 자동 저장 (크롬북 '파일' 앱의 Google Drive 폴더를 고르면 드라이브에도 올라감)
     폴더가 없거나 연결이 끊기면 며칠마다 "전체 백업 파일 받기"를 권함 */
  const days = (t) => (t ? Math.floor((Date.now() - t) / 864e5) : Infinity);
  async function renderBackup(autoRun) {
    const box = $("nt-backup"); if (!box) return;
    let perm = "none", dir = null;
    try { dir = await NS.getDir(); perm = await NS.dirPermission(false); } catch (e) { /* 폴더 기능 없음 */ }
    if (autoRun && perm === "granted") { try { const n = await NS.backupChanged(); if (n > 0) TS.toast(`📁 노트 ${n}개를 백업 폴더에 저장했어요`); } catch (e) { /* 무시 */ } }
    const log = NS.backupLog(), last = Math.max(log._at && perm === "granted" ? log._at : 0, log._full || 0);
    const count = (await allNotes()).length, d = days(last);
    const warn = count && perm !== "granted" && d >= 3;
    const status = NS.dirBroken() ? `⚠️ 이 기기에서는 자동 백업 폴더를 쓸 수 없었어요. 대신 <b>⬇️ 전체 백업 파일 받기</b>로 가끔 저장해 주세요. <button class="btn small" id="bk-retry">폴더 다시 시도</button>`
      : perm === "granted" ? `✅ 자동 백업 중 · 📁 <b>${esc(dir.name)}</b> · 마지막 ${log._at ? ago(log._at) : "-"}`
      : perm === "prompt" ? `🔒 백업 폴더 <b>${esc(dir.name)}</b> 연결이 끊겼어요 — 아래 버튼을 눌러 다시 허락해 주세요`
        : `📁 자동 백업 폴더가 없어요. 노트는 <b>이 브라우저에만</b> 있어서, 인터넷 기록(사이트 데이터)을 지우면 사라져요.`;
    box.className = "nt-backup" + (warn ? " warn" : "");
    box.innerHTML = `<div class="nt-bk-st">${warn ? `⚠️ <b>${d === Infinity ? "한 번도" : d + "일 동안"}</b> 백업하지 않았어요. ` : ""}${status}</div>
      <div class="nt-actions" style="margin:6px 0 0">
        ${NS.canFolder() ? (perm === "prompt" ? '<button class="btn yellow small" id="bk-re">🔓 다시 연결</button>' : `<button class="btn ${perm === "granted" ? "" : "yellow "}small" id="bk-pick">📁 ${perm === "granted" ? "폴더 바꾸기" : "자동 백업 폴더 정하기"}</button>`) : ""}
        ${perm !== "none" ? '<button class="btn small" id="bk-off">끄기</button>' : ""}
        <button class="btn small" id="bk-all">⬇️ 전체 백업 파일 받기</button>
      </div>
      ${NS.canFolder() && perm === "none" ? '<p class="hint" style="margin-top:6px">💡 크롬북이면 <b>파일 앱 → Google Drive</b> 안의 폴더를 고르면 드라이브에도 자동으로 올라가요.</p>' : ""}`;
    const on = (id, fn) => { const b = $(id); if (b) b.onclick = fn; };
    on("bk-pick", async () => { try { await NS.pickDir(); const n = await NS.backupChanged(); TS.toast(`📁 백업 폴더를 정했어요 · 노트 ${Math.max(0, n)}개 저장`); } catch (e) { if (!e || e.name !== "AbortError") TS.toast("폴더를 못 열었어요: " + ((e && e.message) || e)); } renderBackup(); });
    on("bk-re", async () => { if ((await NS.dirPermission(true)) === "granted") { const n = await NS.backupChanged(); TS.toast(`📁 다시 연결했어요 · 노트 ${Math.max(0, n)}개 저장`); } renderBackup(); });
    on("bk-off", async () => { await NS.clearDir(); TS.toast("자동 백업을 껐어요"); renderBackup(); });
    on("bk-all", exportAll);
    on("bk-retry", () => { try { localStorage.removeItem("trickstudy-note-dir-reading"); } catch (e) { /* 무시 */ } renderBackup(); });
  }

  function render() {
    const el = $("view-note");
    if (!el) return;
    if (el.dataset.built !== "1") {
      el.dataset.built = "1";
      el.innerHTML = `<div class="card">
          <h2 class="ribbon">📝 필기 노트</h2>
          <p class="hint" style="margin-top:0">스타일러스로 A4 노트에 필기하면 AI가 글씨를 읽어 <b>정리본</b>으로 바꾸고, 글과 그림을 덩어리로 나눠 <b>자동 배치·정리</b>해 줘요.</p>
          <div class="nt-actions">
            <button class="btn pink big" id="nt-new">＋ 새 노트</button>
            <button class="btn" id="nt-import">📂 노트 파일 불러오기</button>
            <input type="file" id="nt-file" accept=".tnote,.tnotes,application/json" multiple hidden>
          </div>
          <div class="nt-list" id="nt-list"><p class="hint">불러오는 중…</p></div>
          <div class="nt-backup" id="nt-backup"></div>
        </div>
        <div class="card" id="nt-ai-card"></div>`;
      $("nt-new").onclick = newNoteModal;
      $("nt-import").onclick = () => $("nt-file").click();
      $("nt-file").onchange = async (e) => { for (const f of e.target.files) await importFile(f); e.target.value = ""; };
      const card = $("nt-ai-card"); card.innerHTML = aiHTML(); bindAI(card);
      renderBackup(true); render.t = Date.now();
    } else if (!render.t || Date.now() - render.t > 60e3) { render.t = Date.now(); renderBackup(true); } // 탭에 돌아올 때 바뀐 노트 백업
    loadList();
  }
  TS.views.note = render;
  // 필기 화면에서 "← 노트" 로 돌아오면 노트 탭 열기
  TS.on("start", () => { if (location.hash === "#note") { TS.go("note"); history.replaceState(null, "", location.pathname + location.search); } });
})();
