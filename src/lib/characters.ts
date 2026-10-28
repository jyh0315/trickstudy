// 사도(캐릭터) 목록. 여기 등급(rarity)은 이 앱의 모집 확률용이며 게임 내 등급과 다를 수 있다.
// 실제 일러스트 쓰는 법 (둘 중 하나):
//   1) public/characters/<id>.png 파일 넣기 (예: public/characters/erpin.png)
//   2) 아래 캐릭터에 image: "https://..." 처럼 이미지 주소 적기
// 둘 다 없으면 hair/eye/outfit 색으로 그린 SD 캐릭터(SVG)가 나온다.
// 캐릭터를 더 추가하려면 같은 형식으로 한 줄 넣으면 된다.

export type Rarity = 1 | 2 | 3;
export type Accessory = "ribbon" | "ears" | "horns" | "hat" | "flower" | "leaf" | "none";

export interface Character {
  id: string;
  name: string;
  rarity: Rarity;
  hair: string;
  eye: string;
  outfit: string;
  accessory: Accessory;
  lines: string[];
  image?: string;
}

export const CHARACTERS: Character[] = [
  // ★3
  { id: "erpin", name: "에르핀", rarity: 3, hair: "#FFD36E", eye: "#5BA8FF", outfit: "#FF9EC4", accessory: "ribbon",
    lines: ["교주! 에르핀이랑 공부하자!", "오늘 목표 다 하면 칭찬해 줄게~", "졸면 볼 잡아당길 거야!"] },
  { id: "ner", name: "네르", rarity: 3, hair: "#C9B6FF", eye: "#8A5CFF", outfit: "#7D6BD6", accessory: "horns",
    lines: ["…공부. 해.", "집중 안 하면 네르가 지켜본다.", "잘했어. 조금은."] },
  { id: "yomi", name: "요미", rarity: 3, hair: "#3E3A5C", eye: "#E05A7A", outfit: "#B9A6E8", accessory: "flower",
    lines: ["요미가 지켜보고 있어~", "한 문제만 더! 아니 열 문제!", "교주 최고야!"] },
  { id: "aya", name: "아야", rarity: 3, hair: "#6FD3C5", eye: "#2E9C8E", outfit: "#B5EFE4", accessory: "leaf",
    lines: ["차분하게, 천천히.", "오늘도 한 걸음 나아갔네.", "쉬는 것도 수련이야."] },
  // ★2
  { id: "butter", name: "버터", rarity: 2, hair: "#FFE9A8", eye: "#D48A2E", outfit: "#FFCF70", accessory: "ears",
    lines: ["멍! 공부 끝나면 간식!", "교주 따라갈래~", "버터도 열심히 할게!"] },
  { id: "kommy", name: "코미", rarity: 2, hair: "#9FD8FF", eye: "#3C8DDB", outfit: "#CDE9FF", accessory: "hat",
    lines: ["코미가 시간 재 줄게!", "앗, 딴짓 금지~", "벌써 이만큼 했어?"] },
  { id: "mayo", name: "마요", rarity: 2, hair: "#FFFFFF", eye: "#F07C9B", outfit: "#FFD9E4", accessory: "ears",
    lines: ["마요는 졸려…", "교주, 같이 낮잠… 아니 공부.", "끝나면 깨워 줘."] },
  { id: "daya", name: "다야", rarity: 2, hair: "#A8E6A1", eye: "#3E9B4F", outfit: "#D6F5CF", accessory: "leaf",
    lines: ["다야는 응원 담당!", "물 마시면서 해~", "파이팅 교주!"] },
  { id: "vivi", name: "비비", rarity: 2, hair: "#FFB078", eye: "#D9572B", outfit: "#FFD2B0", accessory: "ribbon",
    lines: ["효율! 효율이 중요해!", "오답 노트는 썼어?", "좋아, 다음 단원!"] },
  { id: "renewa", name: "레뉴아", rarity: 2, hair: "#B3C7FF", eye: "#4B63D9", outfit: "#DCE4FF", accessory: "flower",
    lines: ["물 흐르듯 공부하자.", "실수해도 괜찮아.", "레뉴아는 믿어."] },
  // ★1
  { id: "chloe", name: "클로에", rarity: 1, hair: "#F5C2E7", eye: "#B05FA0", outfit: "#FBE1F3", accessory: "ribbon",
    lines: ["클로에도 끼워 줘~", "예쁘게 필기하자!", "오늘 기분 최고!"] },
  { id: "ui", name: "우이", rarity: 1, hair: "#FFC8A8", eye: "#E07A5F", outfit: "#FFE3D4", accessory: "flower",
    lines: ["우이우이~", "교주 힘내!", "꽃 줄게!"] },
  { id: "sherum", name: "셰럼", rarity: 1, hair: "#D9A27A", eye: "#7A4B2A", outfit: "#F0D2B8", accessory: "ears",
    lines: ["셰럼 왔다!", "킁킁, 공부 냄새!", "같이 뛰자!"] },
  { id: "nipel", name: "니펠", rarity: 1, hair: "#8C8CA8", eye: "#55557A", outfit: "#D2D2E3", accessory: "none",
    lines: ["……응.", "조용히 집중.", "잘하고 있어."] },
  { id: "kyarot", name: "캬롯", rarity: 1, hair: "#FFA552", eye: "#C26A12", outfit: "#C9F0B8", accessory: "leaf",
    lines: ["캬롯 등장!", "당근처럼 쑥쑥!", "다 외웠어?"] },
  { id: "kisha", name: "키샤", rarity: 1, hair: "#7FB3A0", eye: "#2F6F5A", outfit: "#C7E3D8", accessory: "horns",
    lines: ["키샤 등장!", "어려운 건 나중에!", "한 판 더?"] },
];

export const PINCH_LINES = [
  "으에에… 볼 늘어나…",
  "아야야! 놔 줘 교주!",
  "쭈우욱~~ 집중할게!",
  "볼따구는 안 돼에!",
  "이제 진짜 열심히 할게…",
];

export const CHARACTER_MAP = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));

export const RARITY_STYLE: Record<Rarity, { label: string; color: string; glow: string }> = {
  1: { label: "★", color: "#9CC9A6", glow: "rgba(156,201,166,0.5)" },
  2: { label: "★★", color: "#8FB8FF", glow: "rgba(143,184,255,0.6)" },
  3: { label: "★★★", color: "#FFC93C", glow: "rgba(255,201,60,0.8)" },
};
