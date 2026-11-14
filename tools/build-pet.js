// 트릭스터디 펫(크롬 확장) 빌드: 사도 목록·스킨 데이터와 spine 런타임을 복사하고 zip 으로 묶음
// 사용: node tools/build-pet.js
const fs = require("fs"), vm = require("vm"), path = require("path"), { execSync } = require("child_process");
const R = path.join(__dirname, ".."), OUT = path.join(R, "extension/pet");
const c = { window: {} }; vm.createContext(c);
vm.runInContext(fs.readFileSync(path.join(R, "js/sado.js"), "utf8") + "\n" + fs.readFileSync(path.join(R, "js/spine-data.js"), "utf8") + ";this.A=SADO;this.D=SPINE_DATA;", c);
const names = Object.fromEntries(c.A.map((s) => [s.id, s.name]));
const data = {};
for (const [id, v] of Object.entries(c.D)) data[id] = { n: names[id] || id, dir: v.dir, skins: v.skins };
fs.writeFileSync(path.join(OUT, "data.js"), "/* 자동 생성 (tools/build-pet.js) */\nconst PET_DATA = " + JSON.stringify(data) + ";\n");
fs.copyFileSync(path.join(R, "js/vendor/spine-player.min.js"), path.join(OUT, "spine-player.min.js"));
fs.copyFileSync(path.join(R, "js/vendor/SPINE-LICENSE.txt"), path.join(OUT, "SPINE-LICENSE.txt"));
fs.copyFileSync(path.join(R, "css/spine-player.css"), path.join(OUT, "spine-player.css"));
const icon = path.join(R, "assets/chibi/erpin.webp");
for (const s of [16, 48, 128]) execSync(`convert "${icon}" -resize ${s}x${s} -background none -gravity center -extent ${s}x${s} "${path.join(OUT, `icon${s}.png`)}"`);
const zip = path.join(R, "extension/trickstudy-pet.zip");
try { fs.unlinkSync(zip); } catch (e) { /* 없음 */ }
execSync(`cd "${path.join(R, "extension")}" && zip -qr trickstudy-pet.zip pet`);
console.log("ok", Object.keys(data).length, "사도 →", zip, (fs.statSync(zip).size / 1024).toFixed(0) + "KB");
