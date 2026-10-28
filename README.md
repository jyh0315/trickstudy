# 🏰 트릭컬 스터디 — 교주님의 시험 대비

트릭컬 리바이브 감성의 게이미피케이션 공부 웹앱 (개인용 팬 프로젝트).

| 화면 | 기능 |
|---|---|
| 🏰 엘리아스 | 레벨/경험치, 시험 D-Day, 오늘의 과목별 수련 현황, 대표 사도 (눌러서 볼따구 잡아당기기) |
| ⏰ 수련장 | 과목별 집중 타이머(뽀모도로). 1분 = 💎2. 다른 탭으로 가면 딴짓 감지 → 볼따구 + 보상 감소 |
| ⚔️ 침략전 | 문제집 푼 결과(푼 문제/맞힌 문제)를 입력 → 맞힌 문제 1개 = 10 데미지. 오답만큼 볼따구 쭈욱. 보스 HP는 저장돼서 여러 번 나눠 잡기 |
| 🎁 모집 | 엘리프로 사도 모집(1회 💎100 / 10회 💎900, 50회 천장), 사도 도감, 중복은 크레용 → 칭호 구매 |

## 실제 게임 이미지 넣기

- 캐릭터: `public/characters/<id>.png` (id 목록은 `public/characters/README.md`)
  또는 `src/lib/characters.ts` 에서 `image: "https://..."`
- 화면 배경: `public/backgrounds/home.jpg`, `training.jpg`, `battle.jpg`, `recruit.jpg`
  또는 `src/lib/backgrounds.ts` 에서 `url`

이미지가 없으면 직접 그린 SD 캐릭터와 파스텔 배경이 나옵니다.

## 실행

```bash
npm install
npm run dev
```

## GitHub Pages 배포

1. 저장소 Settings → Pages → Source 를 **GitHub Actions** 로 설정
2. `main` 브랜치에 push 하면 `.github/workflows/deploy.yml` 이 자동 배포
3. 주소: https://jyh0315.github.io/trickstudy/

## (선택) Supabase 클라우드 저장

기본은 브라우저(localStorage) 자동 저장입니다. 다른 기기와 동기화하려면:

1. Supabase 프로젝트 생성 → SQL Editor 에서 `supabase/schema.sql` 실행
2. Authentication → Providers → **Anonymous sign-ins** 켜기
3. GitHub 저장소 Settings → Secrets and variables → Actions → **Variables** 에
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 등록
4. 메인 화면 맨 아래 💾 저장 카드에 클라우드 저장/불러오기 버튼이 생깁니다

## 구조

```
src/app/            페이지 (page.tsx=엘리아스, training, battle, recruit)
src/components/     AppShell(상단바·하단탭·타이머 감시), Chibi(볼따구 캐릭터), BossMonster, ui
src/store/game.ts   Zustand 게임 상태 (재화·레벨·타이머·보스·가챠) + localStorage 저장
src/lib/            캐릭터·보스·배경 데이터, Supabase
```

> 트릭컬 리바이브의 캐릭터·이미지 저작권은 에피드게임즈에 있습니다. 비공식 개인용 팬 프로젝트입니다.
