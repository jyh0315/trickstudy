"use strict";
const $ = (id) => document.getElementById(id);
const DEF = { enabled: true, walk: true, size: "m", follow: true, onSite: false, off: [], partner: "erpin", skin: 0 };
let host = "";
const ids = Object.keys(PET_DATA).sort((a, b) => PET_DATA[a].n.localeCompare(PET_DATA[b].n, "ko"));
$("sado").innerHTML = ids.map((id) => `<option value="${id}">${PET_DATA[id].n}</option>`).join("");
function fillSkins(id, cur) {
  const d = PET_DATA[id] || PET_DATA.erpin;
  $("skin").innerHTML = d.skins.map((s, i) => `<option value="${i}">${i === 0 ? "기본" : s[1].replace("Skin", "스킨")}</option>`).join("");
  $("skin").value = String(Math.min(cur || 0, d.skins.length - 1));
}
function render(s) {
  $("enabled").checked = s.enabled; $("walk").checked = s.walk; $("follow").checked = s.follow; $("onSite").checked = s.onSite;
  $("pick").hidden = s.follow;
  document.querySelectorAll("#size button").forEach((b) => b.classList.toggle("on", b.dataset.v === s.size));
  $("sado").value = s.partner; fillSkins(s.partner, s.skin);
  const d = PET_DATA[s.partner];
  $("cur").textContent = s.follow ? `지금: ${d ? d.n : s.partner} — 트릭스터디에 들어가면 대표 사도로 바뀌어요.` : "";
  $("hide").checked = (s.off || []).includes(host);
  $("host").textContent = host || "(이 페이지는 설정할 수 없어요)";
  $("hide").disabled = !host;
}
const set = (o) => chrome.storage.local.set(o, () => chrome.storage.local.get(DEF, render));
$("enabled").onchange = (e) => set({ enabled: e.target.checked });
$("walk").onchange = (e) => set({ walk: e.target.checked });
$("follow").onchange = (e) => set({ follow: e.target.checked });
$("onSite").onchange = (e) => set({ onSite: e.target.checked });
$("sado").onchange = (e) => set({ partner: e.target.value, skin: 0 });
$("skin").onchange = (e) => set({ skin: +e.target.value });
document.querySelectorAll("#size button").forEach((b) => (b.onclick = () => set({ size: b.dataset.v })));
$("hide").onchange = (e) => chrome.storage.local.get(DEF, (s) => {
  const off = new Set(s.off || []);
  e.target.checked ? off.add(host) : off.delete(host);
  set({ off: [...off] });
});
chrome.tabs && chrome.tabs.query({ active: true, currentWindow: true }, (t) => {
  try { const u = new URL(t[0].url); if (/^https?:$/.test(u.protocol)) host = u.host; } catch (e) { /* 무시 */ }
  chrome.storage.local.get(DEF, render);
});
if (!chrome.tabs) chrome.storage.local.get(DEF, render);
