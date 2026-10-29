# 트릭스터디 ~교주님 공부하세요!~ 📚✨

트릭컬 사도들과 함께하는 개인용 공부 사이트.
공부하면 엘리프가 쌓이고, 엘리프로 사도를 모집하는 게임 같은 공부 도우미예요.

## 기능

| 메뉴 | 내용 |
| --- | --- |
| 🏠 로비 | 대표 사도가 오늘 할 일을 알려줘요 (남은 의뢰, 목표 시간, 받을 보상). 사도 볼을 찌를 수 있음 |
| ⏰ 집중 | 뽀모도로 타이머 (25/5, 50/10, 90/15, 직접 설정). 과목·의뢰 연결, 탭을 닫아도 계속 흐름 |
| 📜 의뢰 | 할 일 목록. 난이도별 보상, 매일 반복 의뢰 |
| 🎯 임무 | 일일 / 주간 임무, 업적 |
| ✉️ 모집 | 사도 136명 뽑기. 50회 천장, 10회 모집 시 ★★ 이상 확정 |
| 📖 사도 | 도감, 대표 사도 설정, 별사탕 교환소, 배경 일러스트 (레벨업마다 해금) |
| 📊 기록 | 누적 시간, 연속 공부, 최근 7일 그래프, 과목별 통계, 설정, 데이터 내보내기 |

- 집중 1분 = 엘리프 4개 + EXP 2 → 25분 집중하면 1회 모집 가능
- 움직이는 표정(GIF)이 있는 사도(버터, 클로에, 에르핀, 코미, 우이, 비비, 시온, 요미)는 중복으로 뽑을 때마다 표정이 해금돼요
- 나머지 중복은 별사탕으로 바뀌고, 도감에서 원하는 사도와 교환할 수 있어요

## v1.1 추가 기능

| 기능 | 내용 |
| --- | --- |
| 👌 시작 화면 | 사도 볼을 잡아당겨서 시작 (Enter 키로도 가능) |
| 👹 주간 보스 | 매주 월요일 새 보스. 집중 1분 = 10 데미지, 의뢰 해결 50~200. HP 50% 상자 · 격파 보상 |
| 💗 호감도 · 선물 | 대표 사도와 함께 집중하면 호감도 상승. 레벨마다 새 대사 + 보스 데미지 보너스. 성격별 최애 선물은 2배 |
| 🗓️ 시간표 · D-day | 의뢰 → 시간표/D-day 탭. 로비에서 진행 중 일정의 남은 시간, 다음 일정까지 남은 시간 표시. 시작 10분 전 알림 |
| 🌱 공부 잔디 | 기록 탭에 최근 1년 GitHub 잔디 |
| 📺 미니 타이머 | 다른 창 위에 떠 있는 작은 타이머 (크롬 PC: 버튼 있는 미니 창, 그 외: 영상 PiP) |
| 🏆 랭킹 | Firebase로 이번 주 / 오늘 / 누적 / 보스 딜 / 레벨 / 사도 수 랭킹 |

## v1.3 추가 기능

| 기능 | 내용 |
| --- | --- |
| 🪪 프로필 꾸미기 | 상단 이름 클릭. 칭호 12종 · 프레임 7종 · 카드 테마 7종 · 프로필 사도 · 한마디 · 뱃지 3개. 해금 조건은 `js/profile.js`. 랭킹에 그대로 보이고, 누르면 프로필 카드가 열림 |
| ⚖️ 과목 밸런스 | 같은 과목 하루 90분 초과분은 보상 절반 · 보스 약점 과목(지난주 제일 적게 한 과목) 데미지 2배 · 골고루 임무(일일 3과목×20분, 주간 4과목×60분) · 주간 밸런스 점수 · 추천 과목 · 편식 잔소리. 수치는 `js/balance.js` 의 `BALANCE` |
| 📖 보스 도감 | 보스 탭 아래에 8명 전원, 등장 순서(이번 주 → n주 뒤), 격파 횟수 |

## v2.0 움직이는 사도 · 스킨 · 아티팩트 선물 · 화면보호기

- **🎭 움직이는 사도**: 사도 136명 전원이 게임 속 애니메이션(Spine)으로 움직여요. 애니메이션 데이터는 lootandwaifus.com 에서 불러와요 (`js/spine-data.js`). 못 불러오면 그림으로 자동 대체. 기록 → 설정에서 끌 수 있어요
- **반응**: 클릭 = 콕 / 길게 누르기 = 쓰다듬기(하트) / 문지르기 = 간지럽히기 / 연타 = 어지러움. 집중 완료·의뢰·레벨업·선물·모집에도 반응
- **🎨 스킨**: 사도 상세 창에서 선택. 기본은 무료, 나머지는 호감도 Lv 2·4·6·8… 또는 별사탕 50개로 해금
- **🎁 아티팩트 선물**: 트릭컬 아티팩트 89종(`js/artifacts.js`). 그 사도 전용 아티팩트는 호감도 3배, 성격 증표는 2배
- **🌙 화면보호기**: 상단 🌙 버튼. 배경 일러스트가 천천히 움직이며 바뀌고 사도들이 번갈아 등장. 큰 시계·타이머·오늘 집중·D-day 표시, 화면 꺼짐 방지, Esc로 나가기. "집중 시작하면 자동으로 켜기" 옵션

## 📘 심플 모드

캐릭터 그림이 부담스러운 사람용. 기능은 그대로고 보이는 것만 바뀜.
- 시작 화면 아래 **화면 모드: 🎀 캐릭터 / 📘 심플** 에서 고르기 (기록 → 설정에서도 바꿀 수 있음)
- 사도 그림 → 이름 첫 글자 아이콘, 배경 일러스트 → 차분한 색, 사도 대사 → 일반 응원 문구
- 화면보호기는 시계 + 공부 명언만, 선물은 이모지 아이콘
- 이 모드에서는 캐릭터·배경 이미지를 아예 불러오지 않음 (기기마다 따로 저장)

## 🎉 이벤트: 두근두근 기말고사 대작전 (2026.11.17 ~ 11.30)

기말고사(12/1 ~ 12/4) **전 2주 동안** 시험 준비를 하는 이벤트예요.

- **11/10부터 미리보기**: 이벤트 탭이 생기고, 시험 준비 도구(시험 시간표·범위 체크리스트)를 미리 쓸 수 있어요
- **11/17 ~ 11/30 본 이벤트**: 🧧 합격 부적 모으기, 일일·기간 미션, 출석 도장 7회, 집중 보상 ×1.5, 이벤트 랭킹
- **12/1 ~ 12/4 시험 기간**: 사도들이 시험 응원 대사, 이벤트 화면에 시험 D-day
- **12/7까지 상점 교환 기간**, 12/11에 이벤트 탭이 사라져요 (한정 꾸미기와 공부 기록은 계속 남아요)
- 시험 준비: 시험 범위를 체크할 때마다 「기말고사 마왕」 HP가 깎이고, 범위를 다 끝내면 격파
- **🔥 단체 레이드**: 이벤트 기간의 모든 집중·범위 체크가 공동 보스 「기말고사 대마왕」(HP 150,000)에 데미지. 격파하면 공동 보상(부적 1500·엘리프 30000·별사탕 900)을 **데미지 비율대로** 나눠 받고 1~3위는 MVP 뱃지. 못 잡으면 30%만. 데이터는 Firebase `/raid` (보안 규칙 아래 참고)
- 미리 보고 싶으면 주소 뒤에 `?event=on` (시작 전 화면 `?event=pre`, 종료 후 `?event=after`, 원래대로 `?event=off`)
- 날짜·미션·상점 구성은 `js/event.js` 맨 위 `EVENTS` 에서 바꾸고, 다음 이벤트도 여기에 추가하면 돼요

## 🏆 랭킹 (Firebase) 설정 · 보안

### 1단계: 익명 로그인 켜기 (내 기록은 나만 고칠 수 있게)
1. Firebase 콘솔 → **Authentication → 시작하기 → 로그인 방법 → 익명** 사용 설정
2. 프로젝트 설정(⚙️) → 일반 → **웹 API 키**를 복사해서 `js/ranking.js` 의 `apiKey` 에 넣기

### 2단계: 관리자 등록
1. 사이트 → 기록 → 설정의 **내 랭킹 ID** 복사 (apiKey 를 넣은 뒤의 ID)
2. `js/ranking.js` 의 `admins: ["여기에 ID"]` 에 넣기 → 랭킹 화면에 🛡️ 관리 버튼이 생김
3. Firebase 콘솔 → Realtime Database → 데이터에서 `admins/<내 ID>` 를 `true` 로 추가

### 3단계: 보안 규칙 (Realtime Database → 규칙 → 붙여넣고 게시)
```json
{
  "rules": {
    ".read": false,
    ".write": false,
    "admins": { ".read": false, ".write": false },
    "raid": {
      "$event": {
        ".read": true,
        "$uid": {
          ".write": "auth != null && (auth.uid === $uid || root.child('admins').child(auth.uid).val() === true)",
          ".validate": "newData.hasChildren(['n','d','t']) && newData.child('n').isString() && newData.child('n').val().length <= 12 && newData.child('d').isNumber() && newData.child('d').val() >= 0 && newData.child('t').isNumber() && newData.child('t').val() <= now + 600000 && (!data.exists() || (newData.child('t').val() >= data.child('t').val() + 5000 && newData.child('d').val() >= data.child('d').val() && newData.child('d').val() <= data.child('d').val() + (now - data.child('t').val()) / 60000 * 20 + 400)) && (data.exists() || newData.child('d').val() <= 3000)"
        }
      }
    },
    "ranking": {
      ".read": true,
      "$uid": {
        ".write": "auth != null && (auth.uid === $uid || root.child('admins').child(auth.uid).val() === true)",
        ".validate": "newData.hasChildren(['name','lv','t','total','weekMin','dayMin','boss','sado']) && newData.child('name').isString() && newData.child('name').val().length <= 12 && newData.child('lv').isNumber() && newData.child('lv').val() >= 1 && newData.child('lv').val() <= 300 && newData.child('t').isNumber() && newData.child('t').val() <= now + 600000 && (!data.exists() || newData.child('t').val() >= data.child('t').val() + 5000) && newData.child('total').isNumber() && newData.child('total').val() >= 0 && (data.exists() ? newData.child('total').val() <= data.child('total').val() + (now - data.child('t').val()) / 60000 + 30 : newData.child('total').val() <= 6000) && newData.child('weekMin').isNumber() && newData.child('weekMin').val() >= 0 && newData.child('weekMin').val() <= 10080 && newData.child('weekMin').val() <= newData.child('total').val() + 1 && newData.child('dayMin').isNumber() && newData.child('dayMin').val() >= 0 && newData.child('dayMin').val() <= 1440 && newData.child('boss').isNumber() && newData.child('boss').val() <= newData.child('weekMin').val() * 45 + 6000 && newData.child('sado').isNumber() && newData.child('sado').val() <= 136"
      }
    }
  }
}
```
- 로그인한 본인(또는 관리자)만 기록을 쓰거나 지울 수 있어요
- 누적 공부 시간은 **실제로 흐른 시간보다 빨리 늘 수 없어요** (처음 등록은 100시간까지)
- 하루 24시간·일주일 168시간 초과, 레벨 300 초과, 공부 시간에 안 맞는 보스 데미지 등은 서버가 거절
- 5초에 한 번까지만 저장 가능
- 사이트에서도 같은 기준으로 비정상 기록을 숨기고, 관리자는 🛡️ 랭킹 관리에서 지울 수 있어요
- 게임이 브라우저에서 돌아가서 100% 막을 수는 없어요. 위 규칙은 “말이 안 되는 기록”을 막는 거예요

## 🎵 배경음악

- 상단 🎵 버튼 → **내 PC 음악 추가**: PC에 있는 mp3를 고르면 이 브라우저에 저장돼서 다음에도 남아 있어요
- 또는 저장소의 `assets/bgm/` 폴더에 mp3를 올리면 목록에 자동으로 나와요
- **상황별 자동 전환**: 집중 / 휴식 / 보스 / 로비에 맞는 곡으로 바뀜. 보스 화면에선 HP에 따라 `Phase 1~3` 곡
- 곡 제목으로 자동 분류되고(`js/bgm.js` 의 `TAG_RULES`), 목록에서 곡마다 상황을 바꿀 수 있음
- "타이머 시작하면 같이 재생", "시작 화면에서 볼 당기면 재생", 셔플, 볼륨, 단축키 **M** (재생/정지)

## 배포

`main` 브랜치에 push하면 `.github/workflows/deploy.yml` 이 GitHub Pages로 그대로 배포해요 (빌드 없음).
`index.html` 을 그냥 브라우저로 열어도 동작해요.

## 고치고 싶을 때

- `js/sado.js` — 사도 목록 (이름, 등급, 성격). 한글 이름은 영문 이름을 보고 붙인 거라 실제 게임과 다를 수 있어요
- `js/data.js` — 대사, 확률, 보상 수치, 임무, 배경 이름
- `js/boss.js` (보스 목록·대사) · `js/affection.js` (선물·호감도 대사) · `js/bgm.js` (곡 분류)
- `css/style.css` — 디자인

저장 데이터는 브라우저 localStorage에 있어요. 다른 기기로 옮길 땐 기록 → 데이터 내보내기/불러오기.
