/* 트릭컬 그림·소리 목록(trickcal-assets.json) 만들기
   사용: node tools/make-asset-manifest.js   (사도·스킨·배경이 늘면 다시 돌리기) */
const fs = require("fs"), path = require("path"), vm = require("vm");
const ROOT = path.join(__dirname, ".."), A = (p) => path.join(ROOT, "assets", p);
const SITE = "https://jyh0315.github.io/trickstudy/", L2D = "https://jyh0315.github.io/trickstudy-assets/";
const ctx = { window: {} }; vm.createContext(ctx);
const load = (f, names) => vm.runInContext(fs.readFileSync(path.join(ROOT, "js", f), "utf8") + ";" + names.map((n) => `this.${n}=${n};`).join(""), ctx);
load("sado.js", ["SADO"]); load("spine-data.js", ["SPINE_DATA", "SPINE_HOSTS"]); load("data.js", ["RARITY", "PERS", "BACKGROUNDS"]);
load("sado-voice.js", ["SADO_VOICE"]); load("artifacts.js", ["ARTIFACTS"]); load("keepsakes.js", ["KEEPSAKES"]); load("cg-catalog.js", ["CG_CATALOG"]); load("ssbg-list.js", ["SS_BACKGROUNDS"]);
const petSrc = fs.readFileSync(path.join(ROOT, "js/pet.js"), "utf8"); vm.runInContext(petSrc.slice(0, petSrc.indexOf("(() =>")) + ";this.PETS=PETS;this.PET_GRADES=PET_GRADES;", ctx);
const ls = (d) => (fs.existsSync(A(d)) ? fs.readdirSync(A(d)).sort() : []);
const u = (p) => SITE + "assets/" + p.split("/").map(encodeURIComponent).join("/");
const dirOf = (d) => d.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
const voices = new Set(ls("voice"));

// 말투: s 말 높임 · c 교주 부르는 말 · t 말버릇 (「트릭컬 사도 정리」 문서에서 뽑은 실제 대사 바탕)
const STYLE = { jon: "존댓말 (~요)", da: "하십시오체 (~습니다/~니까)", ban: "반말", old: "옛말투 (~거라, ~느냐, ~구나)", hao: "하오체 (~하오, ~시오)" };
const SITU = { idle: "평소", cheer: "응원·출발", done: "해냈을 때", fail: "실패", poke: "볼 찌르기", pat: "쓰다듬기", partner: "대표 사도로 고를 때", bday: "생일 축하", sorry: "미안할 때", unfav: "싫은 것", load: "로딩", equip: "장비", promo: "성장", lvup: "레벨업", win: "이김", lose: "짐", call: "부르기", knock: "노크·불렀을 때", aff: "친밀도 대사(Lv1~7)", job: "일하는 중", aside: "혼잣말" };
const speechOf = (id) => {
  const v = ctx.SADO_VOICE[id]; if (!v) return null;
  return { style: STYLE[v.s] || v.s, calls_player: v.c, habit: v.t || null, sample: [...(v.idle || []).slice(0, 4), ...(v.done || []).slice(0, 1), ...(v.pat || []).slice(0, 1)] };
};
const sado = ctx.SADO.map((c) => {
  const sp = ctx.SPINE_DATA[c.id];
  const v = ["pull", "pat"].map((k) => `${c.id}-${k}.mp3`).filter((f) => voices.has(f));
  return {
    id: c.id, name: c.name, en: c.en, rarity: c.rarity, rarity_name: (ctx.RARITY[c.rarity] || {}).name, personality: (ctx.PERS[c.pers] || {}).label || c.pers,
    speech: speechOf(c.id),
    chibi: u(`chibi/${c.id}.webp`),
    emotes: c.emote ? [1, 2, 3, 4].map((i) => u(`emotes/${c.id}/${i}.webp`)) : [],
    voice: v.map((f) => u("voice/" + f)),
    spine: sp ? sp.skins.map(([file, label]) => ({ skin: label, skel: `${L2D}l2d/${dirOf(sp.dir)}/${file}.skel.asset`, atlas: `${L2D}l2d/${dirOf(sp.dir)}/${file}.atlas.asset` })) : [],
  };
});
const bgName = Object.fromEntries(ctx.BACKGROUNDS.map((b) => [b.id, b.name]));
const out = {
  about: "트릭컬 RE:VIVE 팬 제작 학습 사이트 '트릭스터디'에 모아 둔 그림·움직이는 사도·소리 목록. 원저작권은 에피드게임즈. 개인·팬 용도로만 (재배포·판매 금지).",
  generated: new Date().toISOString().slice(0, 10),
  base: { site: SITE + "assets/", spine: L2D + "l2d/", spine_player_js: SITE + "js/vendor/spine-player.min.js" },
  notes: {
    spine: "Spine 4.1 바이너리(.skel.asset) + 아틀라스(.atlas.asset, 텍스처 .webp). spine_player_js 로 띄움. premultipliedAlpha:true + 이음새 고침(안내서 참고). 애니메이션 이름은 Idle_* 가 기본 대기 동작.",
    cors: "두 주소 모두 access-control-allow-origin: * — 다른 사이트에서 불러오기·캔버스 그리기 가능.",
  },
  sado,
  backgrounds: {
    game: ctx.SS_BACKGROUNDS.map((n) => u(`ssbg/${n}.webp`)),
    illustrations: ls("bg").map((f) => ({ name: bgName[f.replace(/\.\w+$/, "")] || f.replace(/\.\w+$/, ""), url: u("bg/" + f) })),
    title: u("title-bg.webp"),
  },
  artifacts: ctx.ARTIFACTS.map((g) => ({ id: g.id, name: g.name, en: g.en, rarity: g.rarity, owner: g.char || null, url: u(`artifacts/${g.id}.webp`) })),
  keepsakes: ctx.KEEPSAKES.map((k) => ({ n: k.n, name: k.name, url: u(`keepsakes/${k.n}.webp`) })),
  pets: ctx.PETS.map((p) => ({ id: p.id, name: p.name, grade: (ctx.PET_GRADES[p.grade] || {}).label, url: SITE + p.img })),
  emoticons_bolddagu: [1, 2].flatMap((k) => Array.from({ length: 24 }, (_, i) => {
    const n = `bolddagu${k}-${String(i + 1).padStart(2, "0")}`;
    return { name: n, gif_small_106: `${L2D}kakao/s/${n}.gif`, gif_medium_160: `${L2D}kakao/m/${n}.gif`, gif_large_256: `${L2D}kakao/l/${n}.gif`, webp_small: u(`kakao/${n}.webp`) };
  })),
  story_cg: Object.fromEntries(["main", "theme"].map((kind) => [kind, ctx.CG_CATALOG[kind].map((e) => ({ ep: e.ep, title: e.t, images: e.f.map((f) => u(`story/cg/${kind}/${String(e.ep).padStart(2, "0")}/${f}.webp`)) }))])),
  videos: ls("video").filter((f) => f.endsWith(".webm")).map((f) => ({ video: u("video/" + f), poster: voices && fs.existsSync(A("video/" + f.replace(".webm", ".jpg"))) ? u("video/" + f.replace(".webm", ".jpg")) : null })),
  bgm: ls("bgm").filter((f) => /\.mp3$/.test(f)).map((f) => ({ title: f.replace(/^\d+\.\s*/, "").replace(/\.mp3$/, ""), url: u("bgm/" + f) })),
};
const counts = Object.fromEntries(Object.entries(out).filter(([, v]) => Array.isArray(v)).map(([k, v]) => [k, v.length]));
counts.spine_skins = sado.reduce((a, s) => a + s.spine.length, 0); counts.story_cg_images = ["main", "theme"].reduce((a, k) => a + out.story_cg[k].reduce((b, e) => b + e.images.length, 0), 0);
counts.backgrounds = out.backgrounds.game.length + out.backgrounds.illustrations.length;
out.counts = counts;
out.voice_lines = SITE + "trickcal-voice.json";
fs.writeFileSync(path.join(ROOT, "trickcal-assets.json"), JSON.stringify(out, null, 1));
// 사도별 전체 대사 (상황별) — 대사·대화 쓸 때 참고용
const voice = { about: "사도별 말투와 실제 대사 (상황별). 팬 제작 학습 사이트 트릭스터디가 「트릭컬 사도 정리」 문서에서 모은 것. 원저작권 에피드게임즈.", situations: SITU, styles: STYLE,
  sado: Object.fromEntries(ctx.SADO.filter((c) => ctx.SADO_VOICE[c.id]).map((c) => { const v = ctx.SADO_VOICE[c.id]; const lines = {}; for (const k of Object.keys(SITU)) if (v[k] != null) lines[k] = v[k]; return [c.id, { name: c.name, style: STYLE[v.s] || v.s, calls_player: v.c, habit: v.t || null, lines }]; })) };
fs.writeFileSync(path.join(ROOT, "trickcal-voice.json"), JSON.stringify(voice));
console.log(counts);
