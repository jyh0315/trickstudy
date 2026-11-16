/* 필기 노트 공용 저장소 — 트릭스터디 노트 탭(js/notes.js)과 필기 화면(note.html)이 같이 씀
   · IndexedDB "trickstudy-notes": notes(노트마다 한 칸) · img(사진)
   · 노트 파일(.tnote) 만들기 / 여러 노트 묶음(.tnotes)
   · 자동 백업: 고른 폴더(크롬북이면 Google Drive 폴더도 가능)에 바뀐 노트를 .tnote 로 덮어쓰기
   · 같은 노트를 탭 두 개에서 동시에 쓰지 않게 잠금 */
(() => {
  "use strict";
  let dbP = null;
  function idb() {
    return dbP || (dbP = new Promise((ok, no) => {
      const r = indexedDB.open("trickstudy-notes", 1);
      r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains("notes")) d.createObjectStore("notes", { keyPath: "id" }); if (!d.objectStoreNames.contains("img")) d.createObjectStore("img"); };
      r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
    }));
  }
  const tx = async (store, mode, fn) => {
    const db = await idb();
    return new Promise((ok, no) => {
      const t = db.transaction(store, mode), req = fn(t.objectStore(store));
      t.oncomplete = () => ok(req && "result" in req ? req.result : undefined);
      t.onerror = () => no(t.error); t.onabort = () => no(t.error);
    });
  };
  const SYS = "__"; // "__" 로 시작하는 id 는 설정 칸 (백업 폴더 등)
  const NS = {
    idb,
    getNote: (id) => tx("notes", "readonly", (s) => s.get(id)).then((n) => n || null),
    putNote: (n) => tx("notes", "readwrite", (s) => s.put(n)),
    delNote: (id) => tx("notes", "readwrite", (s) => s.delete(id)),
    allNotes: async () => ((await tx("notes", "readonly", (s) => s.getAll())) || []).filter((n) => !String(n.id).startsWith(SYS)),
    getImg: (id) => tx("img", "readonly", (s) => s.get(id)),
    putImg: (id, blob) => tx("img", "readwrite", (s) => s.put(blob, id)),
    delImg: (id) => tx("img", "readwrite", (s) => s.delete(id)),
    imgIds: (n) => [...new Set([...((n.data && n.data.strokes) || []).filter((s) => s.img).map((s) => s.img), ...(n.coverImg && n.coverImg.startsWith("img:") ? [n.coverImg.slice(4)] : [])])],
  };

  /* ───── 노트 파일 ───── */
  const blobToData = (b) => new Promise((ok) => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(b); });
  NS.fileName = (n) => (n.title || "노트").replace(/[\\/:*?"<>|]/g, "_").slice(0, 60);
  NS.noteFile = async (n) => {
    const imgs = {};
    for (const k of NS.imgIds(n)) { const b = await NS.getImg(k); if (b) imgs[k] = await blobToData(b); }
    return new Blob([JSON.stringify({ app: "trickstudy-note", v: 1, note: n, imgs })], { type: "application/json" });
  };
  NS.bundleFile = async () => { // 모든 노트 한 파일
    const notes = await NS.allNotes(), imgs = {};
    for (const n of notes) for (const k of NS.imgIds(n)) { if (imgs[k]) continue; const b = await NS.getImg(k); if (b) imgs[k] = await blobToData(b); }
    return new Blob([JSON.stringify({ app: "trickstudy-notes", v: 1, notes, imgs, at: Date.now() })], { type: "application/json" });
  };

  /* ───── 자동 백업 (폴더) ───── */
  const LB = "trickstudy-note-backup"; // { [노트 id]: 마지막 백업 때의 updated, _at: 마지막 백업 시각, _full: 마지막 전체 파일 받은 시각 }
  NS.backupLog = () => { try { return JSON.parse(localStorage.getItem(LB) || "{}") || {}; } catch (e) { return {}; } };
  const setLog = (l) => { try { localStorage.setItem(LB, JSON.stringify(l)); } catch (e) { /* 무시 */ } };
  NS.markFull = () => { const l = NS.backupLog(); l._full = Date.now(); setLog(l); };
  // 폴더 정보는 노트와 다른 저장소에 따로 (혹시 읽다 문제가 나도 노트 목록은 멀쩡하게)
  let dirP = null;
  const dirDb = () => dirP || (dirP = new Promise((ok, no) => { const r = indexedDB.open("trickstudy-notes-dir", 1); r.onupgradeneeded = () => r.result.createObjectStore("kv"); r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); }));
  const dirTx = async (mode, fn) => { const db = await dirDb(); return new Promise((ok, no) => { const t = db.transaction("kv", mode), q = fn(t.objectStore("kv")); t.oncomplete = () => ok(q && "result" in q ? q.result : undefined); t.onerror = () => no(t.error); }); };
  const GUARD = "trickstudy-note-dir-reading"; // 폴더 정보를 읽다 탭이 꺼진 적이 있으면 폴더 백업을 자동으로 끔
  NS.dirBroken = () => { try { return localStorage.getItem(GUARD) === "1"; } catch (e) { return false; } };
  NS.canFolder = () => !!window.showDirectoryPicker && !NS.dirBroken();
  NS.getDir = async () => {
    if (NS.dirBroken()) return null;
    try { localStorage.setItem(GUARD, "1"); } catch (e) { /* 무시 */ }
    const r = await dirTx("readonly", (s) => s.get("backupDir"));
    try { localStorage.removeItem(GUARD); } catch (e) { /* 무시 */ }
    return r ? r.handle : null;
  };
  NS.pickDir = async () => {
    const h = await window.showDirectoryPicker({ id: "trickstudy-notes", mode: "readwrite" });
    await dirTx("readwrite", (s) => s.put({ handle: h, name: h.name }, "backupDir"));
    const l = NS.backupLog(); for (const k of Object.keys(l)) if (!k.startsWith("_")) delete l[k]; setLog(l); // 새 폴더엔 전부 다시
    return h;
  };
  NS.clearDir = () => dirTx("readwrite", (s) => s.delete("backupDir"));
  // 폴더 쓰기 권한: "granted" | "prompt" | "none"(폴더 없음). ask=true 면 (버튼 누른 직후에만) 허락 창
  NS.dirPermission = async (ask) => {
    const h = await NS.getDir();
    if (!h) return "none";
    let p = await h.queryPermission({ mode: "readwrite" });
    if (p !== "granted" && ask) p = await h.requestPermission({ mode: "readwrite" });
    return p === "granted" ? "granted" : "prompt";
  };
  // 바뀐 노트만 폴더에 덮어쓰기. 반환: 백업한 개수 (권한이 없으면 -1)
  NS.backupChanged = async (onlyId) => {
    const h = await NS.getDir();
    if (!h || (await h.queryPermission({ mode: "readwrite" })) !== "granted") return -1;
    const l = NS.backupLog(); let n = 0;
    for (const note of await NS.allNotes()) {
      if (onlyId && note.id !== onlyId) continue;
      if (l[note.id] === note.updated) continue;
      const blob = await NS.noteFile(note);
      let fh; // 한글 이름이 안 되는 폴더면 영문 이름으로
      try { fh = await h.getFileHandle(`${NS.fileName(note)} (${note.id.slice(-5)}).tnote`, { create: true }); }
      catch (e) { fh = await h.getFileHandle(`note-${note.id}.tnote`, { create: true }); }
      const w = await fh.createWritable(); await w.write(blob); await w.close();
      l[note.id] = note.updated; n++;
    }
    l._at = Date.now(); setLog(l);
    return n;
  };

  /* ───── 같은 노트를 탭 두 개에서 쓰지 않게 (Web Locks + BroadcastChannel) ─────
     open(id, onLost): 잠금을 얻으면 true. 다른 탭이 쓰는 중이면 false
     takeover(id): 다른 탭에 "넘겨 줘" → 그 탭은 저장하고 손을 뗌 → 잠금을 얻으면 true */
  const held = {};
  NS.lock = {
    supported: () => !!(navigator.locks && window.BroadcastChannel),
    async open(id, onLost) {
      if (!NS.lock.supported()) return true;
      const ch = new BroadcastChannel("trickstudy-note-" + id);
      return new Promise((resolve) => {
        navigator.locks.request("trickstudy-note-" + id, { ifAvailable: true }, (lk) => {
          if (!lk) { ch.close(); resolve(false); return; }
          resolve(true);
          return new Promise((release) => {
            held[id] = { release, ch };
            ch.onmessage = async (e) => { if (e.data === "takeover") { try { await onLost(); } catch (er) { /* 무시 */ } release(); ch.postMessage("released"); delete held[id]; } };
          });
        });
      });
    },
    async takeover(id, onLost) {
      const ch = new BroadcastChannel("trickstudy-note-" + id);
      const gone = new Promise((ok) => { ch.onmessage = (e) => { if (e.data === "released") ok(); }; setTimeout(ok, 4000); });
      ch.postMessage("takeover"); await gone; ch.close();
      for (let i = 0; i < 20; i++) { if (await NS.lock.open(id, onLost)) return true; await new Promise((r) => setTimeout(r, 250)); }
      return false;
    },
  };
  window.NoteStore = NS;
})();
