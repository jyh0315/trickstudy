/* 트릭스터디 사이트에 들어가면 대표 사도·스킨을 펫에 맞춰 줌 ("트릭스터디 대표 사도 따라가기"가 켜져 있을 때) */
(() => {
  "use strict";
  let last = "";
  function read() {
    try {
      const s = JSON.parse(localStorage.getItem("trickcal-study") || "null");
      if (!s || !s.partner) return;
      const sk = (s.skins && s.skins[s.partner] && s.skins[s.partner].cur) || 0;
      const key = s.partner + ":" + sk;
      if (key === last) return;
      last = key;
      chrome.storage.local.get({ follow: true }, (c) => { if (c.follow) chrome.storage.local.set({ partner: s.partner, skin: sk }); });
    } catch (e) { /* 저장 기록이 없거나 깨짐 */ }
  }
  read();
  setInterval(read, 4000);
})();
