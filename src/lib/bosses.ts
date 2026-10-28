// 침략전 보스. 문제집에서 맞힌 문제 1개 = DAMAGE_PER_CORRECT 데미지.
export interface Boss {
  id: string;
  name: string;
  desc: string;
  hp: number;
  color: string;
  accent: string;
  reward: { elif: number; exp: number };
}

export const DAMAGE_PER_CORRECT = 10;

export const BOSSES: Boss[] = [
  { id: "slime", name: "숙제 슬라임", desc: "말랑말랑, 미루면 커진다", hp: 200, color: "#A8E6A1", accent: "#5DBB63", reward: { elif: 150, exp: 80 } },
  { id: "golem", name: "벼락치기 골렘", desc: "시험 전날 밤에만 깨어난다", hp: 400, color: "#D2C4B0", accent: "#9C8566", reward: { elif: 300, exp: 160 } },
  { id: "ghost", name: "망각 유령", desc: "외운 걸 훔쳐 간다", hp: 600, color: "#D9C8FF", accent: "#8A6FE0", reward: { elif: 450, exp: 240 } },
  { id: "dragon", name: "슬럼프 드래곤", desc: "의욕을 먹고 자란다", hp: 900, color: "#FFB8B8", accent: "#E0616B", reward: { elif: 700, exp: 360 } },
  { id: "king", name: "기말고사 마왕", desc: "최종 보스. 쓰러뜨리면 1회차 클리어!", hp: 1400, color: "#FFE08A", accent: "#E0A800", reward: { elif: 1200, exp: 600 } },
];

// 마왕을 쓰러뜨리면 HP가 늘어난 채로 처음부터 다시 돈다.
export function bossFor(index: number) {
  const loop = Math.floor(index / BOSSES.length);
  const base = BOSSES[index % BOSSES.length];
  const mult = 1 + loop * 0.5;
  return {
    ...base,
    loop,
    hp: Math.round(base.hp * mult),
    reward: { elif: Math.round(base.reward.elif * mult), exp: Math.round(base.reward.exp * mult) },
  };
}
