// 화면 배경. 실제 게임 화면을 쓰려면:
//   1) public/backgrounds/<이름>.jpg (또는 .png) 파일 넣기 — 이름: home, training, battle, recruit
//   2) 또는 아래 url 에 이미지 주소 적기
// 둘 다 없으면 기본 파스텔 배경이 나온다.
export const BACKGROUNDS: Record<string, { name: string; url?: string }> = {
  "/": { name: "home" },
  "/training/": { name: "training" },
  "/battle/": { name: "battle" },
  "/recruit/": { name: "recruit" },
};
