# 트릭컬 그림·소리 모음 안내서

트릭스터디(트릭컬 RE:VIVE 팬 제작 학습 사이트)에 모아 둔 그림·움직이는 사도·소리를
**다른 AI 대화나 다른 프로젝트에서 그대로 불러 쓰기** 위한 안내서예요.

- 전체 목록(JSON): **https://jyh0315.github.io/trickstudy/trickcal-assets.json**
- 사도별 말투·실제 대사(JSON): **https://jyh0315.github.io/trickstudy/trickcal-voice.json**
- 이 안내서: https://jyh0315.github.io/trickstudy/TRICKCAL_ASSETS.md
- 움직이는 사도 예제: https://jyh0315.github.io/trickstudy/examples/spine-sado.html
- **🎬 움직이는 사도 GIF·영상 만들기 도구: https://jyh0315.github.io/trickstudy/anim.html** — 사도·스킨·동작·크기·배경을 골라 GIF/WebM 으로 내려받기 (PPT·캔바·메일·카톡용). `anim.html?id=butter` 처럼 사도를 바로 열 수 있어요.

> 원저작권은 에피드게임즈(트릭컬 RE:VIVE)에 있어요. 개인·팬 용도로만 쓰고, 재배포·판매·공식인 척하는 사용은 하지 마세요.

---

## 1. 다른 AI 에 붙여넣는 프롬프트

아래 상자를 통째로 복사해서 ChatGPT·Claude·Gemini 같은 AI 대화 맨 앞에 붙여넣으세요.
그 다음에 "트릭컬 테마 ○○ 만들어 줘" 하고 이어서 부탁하면 돼요.

```
나는 트릭컬 RE:VIVE 테마로 (웹페이지 / 게임 / 굿즈 시안 / 카드 등) 을 만들고 싶어.
그림·움직이는 캐릭터·소리는 내가 미리 공개 주소로 올려 둔 모음을 써 줘.

[자료 목록 (JSON)]
https://jyh0315.github.io/trickstudy/trickcal-assets.json
- 이 주소를 직접 열 수 있으면 열어서 쓰고, 못 열면 아래 규칙으로 주소를 만들어 써.
- 목록·규칙에 없는 주소는 지어내지 마. 모르는 사도 id 는 나한테 물어봐.

[주소 규칙] (모두 HTTPS, 다른 사이트에서 불러와도 됨 — CORS 허용)
S = https://jyh0315.github.io/trickstudy/assets/
L = https://jyh0315.github.io/trickstudy-assets/
- 꼬마 그림(투명 배경 전신):        S + chibi/<사도id>.webp      예) chibi/butter.webp
- 표정 4종(일부 사도만):            S + emotes/<사도id>/1~4.webp (butter, chloe, erpin, kommy, ui, vivi, xxionx, yomi)
- 움직이는 사도(Spine 4.1):         L + l2d/<폴더>/<스킨파일>.skel.asset / .atlas.asset  (정확한 주소는 JSON 의 sado[].spine[])
  · 플레이어: https://jyh0315.github.io/trickstudy/js/vendor/spine-player.min.js
  · 예제: https://jyh0315.github.io/trickstudy/examples/spine-sado.html (이음새 고침·스킨·화면 틀 설정 포함 — 이대로 따라 할 것)
- 게임 배경(가로 1280):             S + ssbg/<번호 3자리>.webp (002~158, 중간에 빠진 번호 있음 → JSON backgrounds.game)
- 일러스트 배경:                    S + bg/<이름>.jpg (trickcal, 100day, sisters, butter, picora, …)
- 아티팩트 아이콘:                  S + artifacts/<id>.webp
- 애장품 그림:                      S + keepsakes/000~069.webp
- 펫(꼬마 동물):                    S + pets/00~78.webp
- 볼따구콘 이모티콘(움직이는 GIF):  L + kakao/s/bolddagu1-01~24.gif, bolddagu2-01~24.gif (106px)
                                    L + kakao/m/…gif (160px), L + kakao/l/…gif (256px)  ※ AI 화질 개선판
- 스토리 CG:                        S + story/cg/main/<화 2자리>/<번호>.webp, story/cg/theme/<화 2자리>/<번호>.webp
- 사도 목소리(짧은 대사):           S + voice/<사도id>-pull.mp3, <사도id>-pat.mp3 (있는 사도만)
- 배경음악(BGM, 큼):                JSON 의 bgm[]

[사도 정보]
JSON 의 sado[] 에 id, 한글 이름(name), 영문(en), 등급(rarity 1~3), 성격(personality: 순수/냉정/광기/활발/우울/특별)이 있어.
예) butter 버터, erpin 에르핀, kommy 코미, vivi 비비, ui 우이, yomi 요미, chloe 클로에, xxionx 시온 더 다크불릿 …

[코드를 못 넣는 곳(PPT·캔바·메일 등)에 움직이는 사도가 필요하면]
https://jyh0315.github.io/trickstudy/anim.html?id=<사도id> 에서 GIF/WebM 으로 뽑아서 쓰라고 안내해 줘.
네가 Claude Code 처럼 명령을 실행할 수 있으면 직접 뽑아도 돼:
  주소 옵션 ?id=<사도id>&skin=<번호 0~>&anim=<동작이름>&size=240|360|512&bg=none|white|#rrggbb|game:<번호>&fps=15|20|25&loops=1~3&auto=gif|webm
  → 헤드리스 브라우저(Playwright)로 열면 자동으로 파일이 내려받아짐 (안내서 5번에 코드 예제).

[PPT 를 만들 때]
- python-pptx 로 .pptx 를 만들고, 그림은 위 주소에서 내려받아 넣어. GIF 를 그림으로 넣으면 파워포인트 슬라이드쇼에서 움직여.
- 슬라이드 배경은 backgrounds.game(게임 배경), 장식은 꼬마 그림·볼따구콘 GIF·애장품, 움직이는 사도는 anim.html 로 뽑은 GIF.

[사도 말투 — 대사·대화·자막을 쓸 때]
- 목록 JSON 의 sado[].speech: style(존댓말/반말/하십시오체/옛말투/하오체), calls_player(교주를 부르는 말 — 예: 교주님, 교주, 교준니, 주인님), habit(말버릇), sample(실제 대사 예).
- 더 많은 실제 대사: https://jyh0315.github.io/trickstudy/trickcal-voice.json — sado.<id>.lines 에 상황별(평소 idle, 응원 cheer, 해냈을 때 done, 실패 fail, 쓰다듬기 pat, 생일 bday, 친밀도 aff …).
- 새 대사를 지을 땐 그 사도의 style·calls_player·말버릇·예시 대사의 어미와 감탄사(예: 두두 "~두!", "으헤헤헹~")를 그대로 따라. 실제 대사를 그대로 가져다 써도 좋아.
- 플레이어는 늘 "교주"(사도마다 부르는 말이 다름). 사도끼리 관계·설정을 지어내지 말고, 모르면 대사 예시 안에서만.

[만들 때 지킬 것]
- 그림은 <img src="주소"> 로 바로 쓰고, 파일을 따로 내려받으라고 하지 마.
- 배경 그림은 background: url(...) center/cover.
- BGM·영상은 용량이 크니 자동 재생하지 말고 버튼으로 켜게 해.
- 팬 제작 표시를 넣고, 공식처럼 보이게 하지 마.
```

---

## 2. 무엇이 있나요 (2026-11-23 기준)

| 종류 | 개수 | JSON 키 | 예 |
|---|---|---|---|
| 사도 (이름·등급·성격) | 137명 | `sado` | `sado[].name` |
| 꼬마 그림 | 137 | `sado[].chibi` | chibi/butter.webp |
| 표정 | 8명 × 4 | `sado[].emotes` | emotes/erpin/2.webp |
| 움직이는 사도 스킨 | 449 | `sado[].spine` | l2d/Butter/ButterSkin1.skel.asset |
| 사도 목소리 | 69명 | `sado[].voice` | voice/butter-pat.mp3 |
| 사도 말투·실제 대사 | 137명 | `sado[].speech` + trickcal-voice.json | 존댓말/반말, 호칭, 상황별 대사 21가지 |
| 배경 (게임 155 + 일러스트 14) | 169 | `backgrounds` | ssbg/017.webp |
| 아티팩트 | 89 | `artifacts` | 이름·등급·주인 사도 |
| 애장품 | 70 | `keepsakes` | 이름은 그림 보고 붙인 것 |
| 펫 | 79 | `pets` | 이름·등급 |
| 볼따구콘 이모티콘 | 48 × 3크기 | `emoticons_bolddagu` | GIF 소·중·대 + WebP |
| 스토리 CG (메인 29화·테마극장 76화) | 1,761 | `story_cg` | 화 제목별 |
| 특별 영상 (webm) | 54 | `videos` | 포스터 jpg 포함 |
| 배경음악 | 45 | `bgm` | 곡 제목 |

목록 다시 만들기(사도·스킨이 늘었을 때): 트릭스터디 저장소에서 `node tools/make-asset-manifest.js`.

---

## 3. 바로 쓰는 예제

### 그림
```html
<img src="https://jyh0315.github.io/trickstudy/assets/chibi/erpin.webp" alt="에르핀" width="200">
<div style="height:300px;background:url(https://jyh0315.github.io/trickstudy/assets/ssbg/017.webp) center/cover"></div>
```

### 움직이는 사도 (Spine 4.1)
`examples/spine-sado.html` 을 그대로 쓰는 게 가장 쉬워요. 핵심만 보면:

```html
<div id="sado" style="width:360px;height:460px"></div>
<script src="https://jyh0315.github.io/trickstudy/js/vendor/spine-player.min.js"></script>
<!-- 이음새(앞머리 등의 얇은 선)·홍조 테두리 방지 — 플레이어 바로 다음에 꼭 넣기 -->
<script src="https://jyh0315.github.io/trickstudy/js/spine-fix.js"></script>
<script>
const base="https://jyh0315.github.io/trickstudy-assets/l2d/Butter/Butter"; // JSON 의 sado[].spine[].skel 에서 .skel.asset 뺀 것
new spine.SpinePlayer("sado",{skelUrl:base+".skel.asset",atlasUrl:base+".atlas.asset",showControls:false,
  alpha:true,backgroundColor:"#00000000",premultipliedAlpha:true,
  viewport:{padLeft:"6%",padRight:"6%",padTop:"5%",padBottom:"4%"},
  success:(p)=>{const d=p.skeleton.data,a=d.animations.map(x=>x.name);
    const sk=d.skins.find(x=>x.name==="Normal")||d.skins.find(x=>x.name!=="default");
    if(sk){p.skeleton.setSkin(sk);p.skeleton.setSlotsToSetupPose();}
    const idle=a.find(n=>/^Idle_/.test(n))||a[0]; p.animationState.setAnimation(0,idle,true);
    const vp=p.config.viewport;delete vp.x;delete vp.y;delete vp.width;delete vp.height;p.setViewport(idle);}});
</script>
```
- 동작 이름 예: `Idle_1`(대기), `Happy_1~5`, `Angry_1~3`, `Sad_1`, `Panic_1~3`, `Pat_Idle`(쓰다듬기), `Eat_1` … 사도마다 조금 달라요 (`console.log` 로 확인).
- 꼭 지킬 것: `premultipliedAlpha:true` + 위 이음새 고침, 스킨을 바꾼 뒤 `setViewport` 다시 (안 하면 빈 화면).

### 이모티콘 / 소리
```html
<img src="https://jyh0315.github.io/trickstudy-assets/kakao/l/bolddagu1-05.gif" width="212">
<button onclick="new Audio('https://jyh0315.github.io/trickstudy/assets/voice/butter-pat.mp3').play()">버터 쓰다듬기</button>
```

---

## 4. 알아 둘 것
- 주소는 GitHub Pages 라 무료·공개예요. 너무 많은 사람에게 퍼뜨리지 않는 게 좋아요(개인 팬 용도).
- 사도 한글 이름·아티팩트 이름 일부는 영어 이름을 보고 붙인 것이라 게임과 다를 수 있어요.
- 애장품은 어느 사도 것인지 아직 정해지지 않았어요.
- 새 사도·스킨이 나오면 트릭스터디에 추가한 뒤 목록을 다시 만들면 같은 주소에서 바로 반영돼요.

---

## 5. Claude Code 로 PPT 만들기 (그림·움직이는 사도 자동으로)

Claude Code 에 위 1번 프롬프트를 붙이고 "트릭컬 테마로 ○○ 발표 PPT 만들어 줘" 하면 돼요. 그 AI 가 할 일은 이 순서예요.

1. 목록 받기: `curl -sO https://jyh0315.github.io/trickstudy/trickcal-assets.json`
2. 쓸 그림 내려받기: `curl -o erpin.webp https://jyh0315.github.io/trickstudy/assets/chibi/erpin.webp`
   (파워포인트는 webp 를 못 읽는 버전이 있어서 PNG 로 바꾸기: `python -c "from PIL import Image;Image.open('erpin.webp').save('erpin.png')"`)
3. 움직이는 사도 GIF 뽑기 (Playwright, Node):
```js
const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ acceptDownloads: true }), p = await ctx.newPage();
  const url = "https://jyh0315.github.io/trickstudy/anim.html?id=butter&anim=Happy_1&size=360&bg=none&auto=gif";
  const [dl] = await Promise.all([p.waitForEvent("download", { timeout: 120000 }), p.goto(url)]);
  await dl.saveAs("butter_happy.gif"); await b.close();
})();
```
   - 동작 이름을 모르면 `anim` 을 빼고 열면 대기 동작(Idle)으로 만들어져요. 동작 목록은 페이지 화면이나 콘솔에서 확인.
4. python-pptx 로 슬라이드 만들기: `slide.shapes.add_picture("butter_happy.gif", left, top, width=Inches(3))` — GIF 는 슬라이드쇼에서 움직여요.
5. 배경: `slide.shapes.add_picture("bg.png", 0, 0, prs.slide_width, prs.slide_height)` 를 먼저 넣고 그 위에 글상자.

> Claude Code 의 `/pptx` 같은 PPT 스킬이 있으면 그걸 써도 돼요. 그림 주소·GIF 만드는 방법만 위대로 따르면 돼요.

---

## 6. 말투 쓰는 법 (예)

```js
const v = await (await fetch("https://jyh0315.github.io/trickstudy/trickcal-voice.json")).json();
const d = v.sado.dudu;            // { name:"두두", style:"반말", calls_player:"교준니", lines:{ idle:[…], done:[…], pat:[…], … } }
const say = d.lines.done[Math.floor(Math.random() * d.lines.done.length)]; // "쉬워써! 야광 스티커 부치기 만큼!"
```
- 상황 이름: idle 평소 · cheer 응원 · done 해냈을 때 · fail 실패 · poke 볼 찌르기 · pat 쓰다듬기 · partner 대표로 고를 때 · bday 생일 · sorry 미안 · win/lose 이김/짐 · lvup 레벨업 · call 부르기 · aff 친밀도(Lv1~7 묶음) 등.
- AI 에게 새 대사를 부탁할 땐 "trickcal-voice.json 의 ○○ 말투·예시대로" 라고 하면 돼요.
