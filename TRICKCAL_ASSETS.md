# 트릭컬 그림·소리 모음 안내서

트릭스터디(트릭컬 RE:VIVE 팬 제작 학습 사이트)에 모아 둔 그림·움직이는 사도·소리를
**다른 AI 대화나 다른 프로젝트에서 그대로 불러 쓰기** 위한 안내서예요.

- 전체 목록(JSON): **https://jyh0315.github.io/trickstudy/trickcal-assets.json**
- 이 안내서: https://jyh0315.github.io/trickstudy/TRICKCAL_ASSETS.md
- 움직이는 사도 예제: https://jyh0315.github.io/trickstudy/examples/spine-sado.html

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
- 볼따구콘 이모티콘(움직이는 GIF):  S + kakao/gif/bolddagu1-01~24.gif, bolddagu2-01~24.gif (106px)
                                    L + kakao/m/…gif (159px), L + kakao/l/…gif (212px)
- 스토리 CG:                        S + story/cg/main/<화 2자리>/<번호>.webp, story/cg/theme/<화 2자리>/<번호>.webp
- 사도 목소리(짧은 대사):           S + voice/<사도id>-pull.mp3, <사도id>-pat.mp3 (있는 사도만)
- 배경음악(BGM, 큼):                JSON 의 bgm[]

[사도 정보]
JSON 의 sado[] 에 id, 한글 이름(name), 영문(en), 등급(rarity 1~3), 성격(personality: 순수/냉정/광기/활발/우울/특별)이 있어.
예) butter 버터, erpin 에르핀, kommy 코미, vivi 비비, ui 우이, yomi 요미, chloe 클로에, xxionx 시온 더 다크불릿 …

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
<script>
// 이음새(얇은 선) 방지
(function(){const T=spine.GLTexture;if(!T||T.__pma)return;T.__pma=true;T.DISABLE_UNPACK_PREMULTIPLIED_ALPHA_WEBGL=false;
const up=T.prototype.update;T.prototype.update=function(m){const gl=this.context.gl;gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);try{up.call(this,m)}finally{gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false)}}})();
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
