/* =========================================================
   💌 주간 공부 편지 — 매주 월요일, 대표 사도가 지난주 공부를 편지로 정리해 줌
   - 내용: 총 공부 시간 · 공부한 날 · 목표 달성한 날 · 가장 열심히 한 날 · 과목별 · 지난주와 비교
   - 말투: 성격(순수·냉정·광기·활발·우울·특수)별 기본 말투 + 사도별 말버릇(LETTER_VOICE)
     사도별 말버릇은 나무위키 정리(「트릭컬 사도 정리」)를 바탕으로 함. 새 사도는 LETTER_VOICE 에 추가
   - 편지는 받은 시점의 숫자를 저장해 두고, 글은 열 때마다 만들어서 말투를 고치면 옛 편지에도 반영됨
   ========================================================= */

/* 성격별 기본 말투. 함수 인자 d = 편지 데이터(아래 build 참고), me = 교주 이름 */
const LETTER_TONE = {
  pure: {
    hi: (d) => `사랑하는 ${d.me}님께!`,
    total: (d) => `지난주에 교주님은 무려 ${d.totalT}이나 공부했어요! ${d.days}일이나 책상에 앉았다니, 정말 대단해요.`,
    zero: () => `지난주엔 공부 기록이 하나도 없었어요… 혹시 많이 바빴어요? 괜찮아요, 이번 주에 같이 다시 시작해요!`,
    best: (d) => `제일 열심히 한 날은 ${d.bestT}이었어요. 그날 교주님 옆에서 엄청 뿌듯했어요!`,
    top: (d) => `${d.topEul} 제일 많이 했네요. ${d.low ? `${d.low}도 조금만 챙겨 주면 더 좋을 것 같아요!` : ""}`,
    up: (d) => `지난번보다 ${d.diffT} 더 했어요! 쑥쑥 자라는 게 눈에 보여요.`,
    down: (d) => `지난번보다는 ${d.diffT} 줄었지만, 괜찮아요. 쉬어 가는 주도 필요하니까요.`,
    goal: (d) => (d.goalDays ? `목표도 ${d.goalDays}번이나 채웠어요. 반짝반짝!` : `이번 주엔 하루 목표를 한 번 채워 봐요. 할 수 있어요!`),
    bye: () => `이번 주도 옆에서 응원할게요. 언제나 교주님 편이에요!`,
  },
  cool: {
    hi: (d) => `${d.me}에게.`,
    total: (d) => `지난주 기록: 총 ${d.totalT}, ${d.days}일 공부. …나쁘지 않네.`,
    zero: () => `지난주 공부 기록 0분. 변명은 안 들을게. 이번 주엔 하루 25분부터 다시 해.`,
    best: (d) => `가장 많이 한 날은 ${d.bestT}. 그 집중력, 다른 날에도 쓸 수 있잖아.`,
    top: (d) => `${d.top} 위주로 했더라. ${d.low ? `${d.lowEun} 거의 손을 안 댔고. 균형 맞춰.` : ""}`,
    up: (d) => `지난번보다 ${d.diffT} 늘었어. 이 흐름 유지해.`,
    down: (d) => `지난번보다 ${d.diffT} 줄었어. 이유는 네가 제일 잘 알겠지.`,
    goal: (d) => (d.goalDays ? `목표 달성 ${d.goalDays}일. 숫자로는 합격이야.` : `목표 달성 0일. 목표를 낮추든 시간을 늘리든 정해.`),
    bye: () => `이번 주 계획, 미리 세워 둬. …기대는 하고 있으니까.`,
  },
  mad: {
    hi: (d) => `크히히! ${d.me}에게 보내는 편지다!`,
    total: (d) => `지난주에 ${d.totalT}이나 불태웠어! ${d.days}일 동안 문제집을 박살 냈다고! 크히히!`,
    zero: () => `지난주 공부… 0분?! 문제집이 심심해서 울고 있어! 이번 주엔 전부 부숴버리자!`,
    best: (d) => `${d.bestT}엔 진짜 폭주했더라! 그날 문제집 비명 소리가 들렸어!`,
    top: (d) => `${d.top}만 신나게 때려 부쉈네! ${d.low ? `${d.low}도 박살 낼 차례야!` : ""}`,
    up: (d) => `지난번보다 ${d.diffT} 더 부쉈어! 더! 더 세게!`,
    down: (d) => `지난번보다 ${d.diffT} 덜 부쉈잖아! 힘을 아끼는 거야? 크히히…`,
    goal: (d) => (d.goalDays ? `목표를 ${d.goalDays}번 쓰러뜨렸어! 다음 사냥감은 어디야?!` : `목표를 한 번도 못 잡았어! 이번 주엔 꼭 사냥하자!`),
    bye: () => `이번 주도 같이 다 부숴버리자! 크히히히!`,
  },
  jolly: {
    hi: (d) => `${d.me}님 안녕안녕~!`,
    total: (d) => `지난주에 ${d.totalT} 공부했어요! ${d.days}일이나요! 짝짝짝~!`,
    zero: () => `지난주는 공부 휴가였나 봐요! 헤헤, 이번 주엔 같이 신나게 달려 봐요!`,
    best: (d) => `${d.bestT}이 최고 기록이에요! 그날 교주님 완전 반짝반짝했어요!`,
    top: (d) => `${d.topEul} 제일 많이 했어요! ${d.low ? `${d.low}도 같이 놀아 줘요~` : ""}`,
    up: (d) => `지난번보다 ${d.diffT} 더 했어요! 레벨 업~!`,
    down: (d) => `지난번보다 ${d.diffT} 덜 했지만, 이번 주에 확 올리면 돼요!`,
    goal: (d) => (d.goalDays ? `목표를 ${d.goalDays}번 달성! 축하 파티 해야겠어요!` : `이번 주엔 목표 달성 파티 꼭 해요!`),
    bye: () => `이번 주도 신나게 가 보자고요! 출발~!`,
  },
  gloomy: {
    hi: (d) => `…${d.me}에게.`,
    total: (d) => `지난주에 ${d.totalT}… ${d.days}일이나 공부했구나. …조금 놀랐어.`,
    zero: () => `…지난주엔 공부를 안 했네. 나도 그럴 때 있어. …이번 주엔 같이 조금만 해 보자.`,
    best: (d) => `${d.bestT}엔 오래 했더라. …옆에서 보고 있었어.`,
    top: (d) => `${d.topEul} 제일 많이 했어. ${d.low ? `…${d.lowEun} 좀 외로워 보여.` : ""}`,
    up: (d) => `지난번보다 ${d.diffT} 늘었어. …잘했어. 진짜로.`,
    down: (d) => `지난번보다 ${d.diffT} 줄었어. …괜찮아. 지친 거면 쉬어도 돼.`,
    goal: (d) => (d.goalDays ? `목표도 ${d.goalDays}번 채웠어. …대단해.` : `목표는 아직 못 채웠어. …천천히 해도 돼.`),
    bye: () => `…이번 주도 옆에 있을게.`,
  },
  special: {
    hi: (d) => `친애하는 ${d.me}님께.`,
    total: (d) => `지난주, 교주님은 ${d.totalT} 동안 ${d.days}일을 배움에 바치셨어요.`,
    zero: () => `지난주엔 배움의 기록이 비어 있었어요. 새로운 한 주는 언제나 다시 시작할 기회예요.`,
    best: (d) => `${d.bestT}의 교주님은 특히 빛났답니다.`,
    top: (d) => `${d.top}에 가장 마음을 쏟으셨네요. ${d.low ? `${d.low}에도 조금 눈길을 주시길.` : ""}`,
    up: (d) => `지난번보다 ${d.diffT} 더 나아가셨어요.`,
    down: (d) => `지난번보다 ${d.diffT} 적었지만, 쉼도 배움의 일부랍니다.`,
    goal: (d) => (d.goalDays ? `목표를 ${d.goalDays}번 이루셨어요.` : `이번 주엔 목표 하나를 이뤄 보아요.`),
    bye: () => `늘 곁에서 지켜볼게요.`,
  },
};

/* 사도별 말버릇 — 성격 기본 말투 중 바꾸고 싶은 줄만 덮어씀 */
const LETTER_VOICE = {
  erpin: { // 에르핀: 엘리아스의 위대한 여왕(자칭), 빵·간식 좋아함, 해맑은 반말
    hi: (d) => `위대한 여왕 에르핀이 ${d.me}에게 편지를 쓴다!`,
    total: (d) => `지난주에 교주가 ${d.totalT}이나 공부했대! ${d.days}일이나! 여왕이 칭찬해 줄게, 에헴!`,
    zero: () => `교주! 지난주에 공부 하나도 안 했지?! 여왕은 다 알아! …그래도 이번 주에 하면 용서해 줄게!`,
    best: (d) => `${d.bestT}엔 진짜 열심히 하더라! 에르핀은 그날 빵 세 개 먹으면서 구경했어!`,
    top: (d) => `${d.topEul} 제일 많이 했네! ${d.low ? `${d.low}도 해야 돼! 여왕의 명령이야!` : ""}`,
    up: (d) => `지난번보다 ${d.diffT}이나 더 했어! 역시 에르핀이 고른 교주야!`,
    down: (d) => `지난번보다 ${d.diffT} 덜 했잖아! …에르핀도 빵 먹느라 바빴으니까 봐줄게.`,
    goal: (d) => (d.goalDays ? `목표도 ${d.goalDays}번이나 채웠어! 여왕이 훈장 줄게!` : `목표는 한 번도 못 채웠어… 이번 주엔 꼭 채우는 거다!`),
    bye: () => `이번 주도 열심히 하면 여왕이 빵… 아니 상을 줄게! 진짜야!`,
  },
  ner: { // 네르: 세계수 교단 사제장, 공손하고 단정한 존댓말, 완벽주의, 교단 재정 걱정
    hi: (d) => `세계수 교단 사제장 네르가 ${d.me} 교주님께 올립니다.`,
    total: (d) => `지난주 교주님의 수행 기록은 총 ${d.totalT}, ${d.days}일이에요. 꼼꼼히 기록해 두었어요.`,
    zero: () => `지난주 수행 기록이 비어 있네요. …교주님, 저는 화나지 않았어요. 정말이에요.`,
    best: (d) => `${d.bestT}의 수행이 가장 훌륭했어요. 수양록에 따로 표시해 두었답니다.`,
    top: (d) => `${d.topEul} 가장 많이 하셨어요. ${d.low ? `${d.lowEun} 조금 부족하니, 이번 주에 보충해 주세요.` : ""}`,
    up: (d) => `지난번보다 ${d.diffT} 늘었어요. 세계수께서도 기뻐하실 거예요.`,
    down: (d) => `지난번보다 ${d.diffT} 줄었어요. 교단의 재정만큼이나 걱정되네요.`,
    goal: (d) => (d.goalDays ? `하루 목표는 ${d.goalDays}번 달성하셨어요. 완벽까지 조금 남았네요.` : `하루 목표는 아직 달성하지 못하셨어요. 계획부터 다시 세워 볼까요?`),
    bye: () => `이번 주도 세계수의 가호가 함께하길. 수양록, 잊지 말고 채워 주세요.`,
  },
  butter: { // 버터: 활발, 간식·장난 좋아함
    hi: (d) => `${d.me}님! 버터예요~!`,
    total: (d) => `지난주에 ${d.totalT}이나 공부했어요! ${d.days}일이나요! 버터가 박수 쳐 줄게요, 짝짝짝!`,
    zero: () => `지난주엔 공부를 안 했네요? 헤헤, 버터랑 너무 놀았나 봐요! 이번 주엔 같이 해요!`,
    best: (d) => `${d.bestT}엔 진짜 오래 했어요! 버터는 옆에서 간식 지켜 줬어요!`,
    top: (d) => `${d.topEul} 제일 많이 했어요! ${d.low ? `${d.low}도 심심하대요~` : ""}`,
    up: (d) => `지난번보다 ${d.diffT} 더 했어요! 우와아, 교주님 최고!`,
    down: (d) => `지난번보다 ${d.diffT} 덜 했지만 괜찮아요! 이번 주에 버터가 끌어 줄게요!`,
    goal: (d) => (d.goalDays ? `목표 달성 ${d.goalDays}번! 축하 간식 먹어야 해요!` : `이번 주엔 목표 달성하고 간식 파티 해요!`),
    bye: () => `이번 주 다 끝나면 버터랑 간식 먹는 거예요! 약속!`,
  },
  kommy: { // 코미: 귀찮음, 나른한 말투로 말끝 흐림, 책에서 본 어려운 단어
    hi: (d) => `${d.me}… 코미가 편지 쓰는 거 귀찮은데… 써 줄게…`,
    total: (d) => `지난주에 ${d.totalT}… ${d.days}일이나 했어… 코미보다 부지런해…`,
    zero: () => `지난주 공부 0분… 코미랑 똑같네… 근데 교주는 시험 있잖아… 해야 해…`,
    best: (d) => `${d.bestT}엔 오래 했더라… 코미는 그날 낮잠 잤어…`,
    top: (d) => `${d.top}만 했어… 이런 걸 편식이라고 하던데… 책에서 봤어… ${d.low ? `${d.low}도…` : ""}`,
    up: (d) => `지난번보다 ${d.diffT} 늘었어… 성장 곡선이라는 거래… 책에서 봤어…`,
    down: (d) => `지난번보다 ${d.diffT} 줄었어… 워라밸이야…? 코미는 좋다고 생각해…`,
    goal: (d) => (d.goalDays ? `목표도 ${d.goalDays}번 채웠어… 대단해… 코미는 못 해…` : `목표는… 못 채웠네… 코미도 목표 같은 거 없어…`),
    bye: () => `이번 주도… 화이팅… 코미는 이제 잘게…`,
  },
  daya: { // 다야: 용족의 수장, 고풍스러운 하대체 "~느니라", "그대", 당황하면 "따얏!"
    hi: (d) => `${d.me}, 그대에게 용족의 수장 다야가 서신을 보내노라.`,
    total: (d) => `지난주 그대는 ${d.totalT}을 수련에 바쳤구나. ${d.days}일이라니, 다이아몬드처럼 단단하도다!`,
    zero: () => `지난주 그대의 수련 기록이 없구나. …따얏! 이, 이러면 안 되느니라!`,
    best: (d) => `${d.bestT}의 그대는 다이아몬드보다 빛났느니라.`,
    top: (d) => `${d.topEul} 가장 많이 갈고닦았구나. ${d.low ? `허나 ${d.lowEun} 소홀했으니, 균형 또한 강함이니라.` : ""}`,
    up: (d) => `지난번보다 ${d.diffT} 더 정진하였구나. 과연 짐이 선망하는 자로다.`,
    down: (d) => `지난번보다 ${d.diffT} 줄었구나. 짐도 단련을 하루도 거르지 않거늘…`,
    goal: (d) => (d.goalDays ? `목표를 ${d.goalDays}번 이루었구나. 훌륭하도다!` : `아직 목표를 이루지 못했구나. 이번 주엔 짐에게 보여 주거라.`),
    bye: () => `이번 주도 그대의 빛나는 노력을 기대하겠노라.`,
  },
  ifrit: { // 이프리트: 불의 고위 정령, 거친 반말·호통, 실은 소심
    hi: (d) => `야, ${d.me}! 이프리트다!`,
    total: (d) => `지난주에 ${d.totalT}이나 불태웠다고?! ${d.days}일이나?! …흥, 제법이잖아.`,
    zero: () => `공부 0분이라니! 나한테 이래라저래라 하는 건 싫지만… 너도 좀 해라!`,
    best: (d) => `${d.bestT}엔 아주 활활 타올랐더라! 그 불꽃 꺼뜨리지 마!`,
    top: (d) => `${d.top}만 바싹 구웠네! ${d.low ? `${d.lowEun} 아직 날것이잖아! 그것도 구워!` : ""}`,
    up: (d) => `지난번보다 ${d.diffT} 더 불태웠어! 시끄러워, 칭찬하는 거 아니야!`,
    down: (d) => `지난번보다 ${d.diffT} 덜 탔잖아! 장작이 모자라?!`,
    goal: (d) => (d.goalDays ? `목표 ${d.goalDays}번 달성! …히, 히어로 같네.` : `목표 0번! 이, 이번 주엔 꼭 해! …해 줄 거지?`),
    bye: () => `이번 주도 활활 타오르라고! …응원하는 거 아니거든!`,
  },
  rim: { // 림: 질서의 유령, 느긋하고 담담, 썰렁 개그
    hi: (d) => `나는 림… ${d.me}에게 편지를 써…`,
    total: (d) => `지난주 공부 ${d.totalT}, ${d.days}일… 공부를 '공'들여서 '부'지런히 했구나… 후후…`,
    zero: () => `지난주 공부 0분… 질서가 무너졌어… 셰이디가 좋아하겠네…`,
    best: (d) => `${d.bestT}이 제일 길었어… 그날은 질서정연했지…`,
    top: (d) => `${d.topEul} 제일 많이 했네… ${d.low ? `${d.low}… 이름처럼 '외'로워 보여… 후후…` : ""}`,
    up: (d) => `지난번보다 ${d.diffT} 늘었어… 균형이 좋아지고 있어…`,
    down: (d) => `지난번보다 ${d.diffT} 줄었어… 혼돈이 조금 섞였나 봐…`,
    goal: (d) => (d.goalDays ? `목표 ${d.goalDays}번 달성… 질서의 유령도 인정할게…` : `목표는 아직이야… 천천히 질서를 세워 보자…`),
    bye: () => `이번 주도 질서 있게… 셰이디처럼 어지르지 말고…`,
  },
  mayo: { // 마요: 수집가, "~임" 음슴체
    hi: (d) => `${d.me}에게. 마요임.`,
    total: (d) => `지난주 공부 ${d.totalT}, ${d.days}일임. 컬렉션 가치 올라가는 중임.`,
    zero: () => `지난주 공부 0분임. 컬렉션 가치 떨어지는 중임. 곤란함.`,
    best: (d) => `${d.bestT}이 최고 기록임. 희귀 기록으로 보관함.`,
    top: (d) => `${d.topEul} 제일 많이 모았음. ${d.low ? `${d.lowEun} 수집 덜 됨. 세트 맞춰야 함.` : ""}`,
    up: (d) => `지난번보다 ${d.diffT} 늘었음. 시세 상승 중임.`,
    down: (d) => `지난번보다 ${d.diffT} 줄었음. 시세 하락임.`,
    goal: (d) => (d.goalDays ? `목표 ${d.goalDays}번 달성함. 수집 완료 도장 찍어 줌.` : `목표 달성 0번임. 아직 미수집 상태임.`),
    bye: () => `이번 주도 열심히 하셈. 희귀 컬렉션은 관리가 중요함.`,
  },
};

(() => {
"use strict";
const TS = window.TS;
const $ = (id) => document.getElementById(id);
const esc = TS.esc;
const S = () => TS.state;
const DAYS = ["월", "화", "수", "목", "금", "토", "일"];

function box() { const s = S(); if (!s.letters) s.letters = { last: "", list: [] }; return s.letters; }
const addDays = (key, n) => { const d = new Date(key + "T00:00"); d.setDate(d.getDate() + n); return TS.dateKey(d); };
// 받침 있으면 a, 없으면 b (수학을 / 과학은 / 영어를)
const josa = (w, a, b) => { if (!w) return ""; const c = w.charCodeAt(w.length - 1); return w + (c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 ? a : b); };
const fmtMin = (m) => (m >= 60 ? `${Math.floor(m / 60)}시간${m % 60 ? ` ${m % 60}분` : ""}` : `${m}분`);
const fmtDay = (key) => { const d = new Date(key + "T00:00"); return `${d.getMonth() + 1}월 ${d.getDate()}일(${DAYS[(d.getDay() + 6) % 7]})`; };

/* 한 주(월요일 key) 기록 모으기 */
function weekStats(mon) {
  const st = S().stats, sd = st.subjDays || {}, goal = S().settings.goal;
  const daysArr = [], subj = {};
  for (let i = 0; i < 7; i++) {
    const k = addDays(mon, i), m = st.days[k] || 0;
    daysArr.push({ k, m });
    for (const [s, v] of Object.entries(sd[k] || {})) subj[s] = (subj[s] || 0) + v;
  }
  const total = daysArr.reduce((a, x) => a + x.m, 0);
  const best = daysArr.reduce((a, x) => (x.m > a.m ? x : a), { m: 0 });
  return { mon, total, days: daysArr.filter((x) => x.m > 0).length, goalDays: daysArr.filter((x) => x.m >= goal).length, best: best.m ? best : null, daysArr, subj };
}
function build(mon) {
  const w = weekStats(mon), prev = weekStats(addDays(mon, -7));
  return { week: mon, from: S().partner, total: w.total, days: w.days, goalDays: w.goalDays, best: w.best, bars: w.daysArr.map((x) => x.m), subj: w.subj, prevTotal: prev.total, at: Date.now(), read: false };
}

/* 편지 글 만들기: 사도 말버릇 → 없으면 성격 기본 말투 */
function compose(L) {
  const c = TS.SADO_MAP[L.from] || TS.SADO_MAP.butter;
  const base = LETTER_TONE[c.pers] || LETTER_TONE.pure, v = LETTER_VOICE[c.id] || {};
  const say = (k, d) => (v[k] || base[k])(d);
  const subj = Object.entries(L.subj || {}).sort((a, b) => b[1] - a[1]);
  const d = {
    me: S().name || "교주", totalT: fmtMin(L.total), days: L.days, goalDays: L.goalDays,
    bestT: L.best ? `${fmtDay(L.best.k)} (${fmtMin(L.best.m)})` : "",
    top: subj[0] ? subj[0][0] : "", low: subj.length > 1 && subj[subj.length - 1][1] < subj[0][1] / 3 ? subj[subj.length - 1][0] : "",
    diffT: fmtMin(Math.abs(L.total - L.prevTotal)),
  };
  d.topEul = josa(d.top, "을", "를"); d.lowEun = josa(d.low, "은", "는");
  if (!L.total) return [say("hi", d), say("zero", d), say("bye", d)];
  const lines = [say("hi", d), say("total", d)];
  if (L.best) lines.push(say("best", d));
  if (d.top) lines.push(say("top", d).trim());
  if (L.prevTotal && L.total !== L.prevTotal) lines.push(say(L.total > L.prevTotal ? "up" : "down", d));
  lines.push(say("goal", d), say("bye", d));
  return lines;
}

/* ───── 편지 확인: 월요일이 지나면 지난주 편지 1통 ───── */
function check() {
  if (!S().started) return;
  const lb = box(), lastMon = addDays(TS.weekKey(), -7);
  if (lb.last === lastMon) return;
  const first = !lb.last;
  lb.last = lastMon;
  // 처음 켠 사람은 기록이 있을 때만 (빈 편지로 시작하지 않게)
  const L = build(lastMon);
  if (first && !L.total) { TS.save(); return; }
  lb.list.unshift(L);
  lb.list = lb.list.slice(0, 20);
  TS.save();
  setTimeout(() => TS.toast(`💌 ${(TS.SADO_MAP[L.from] || {}).name || "사도"}에게서 지난주 편지가 왔어요!`), 1500);
  refreshBtn();
}

/* ───── 화면 ───── */
function letterHTML(L, preview) {
  const c = TS.SADO_MAP[L.from] || TS.SADO_MAP.butter, lines = compose(L);
  const max = Math.max(1, ...L.bars), goal = S().settings.goal;
  const subj = Object.entries(L.subj || {}).sort((a, b) => b[1] - a[1]);
  return `<div class="letter-paper pers-${c.pers}">
      <div class="lp-head"><img src="${TS.chibiSrc(c)}" alt=""><div><small>${preview ? "이번 주 미리보기" : `${fmtDay(L.week)} 주`}</small><b>${esc(c.name)}의 편지</b></div></div>
      <div class="lp-body">${lines.map((t, i) => `<p class="${i === 0 ? "lp-hi" : ""}">${esc(t)}</p>`).join("")}</div>
      <div class="lp-stats">
        <div class="lp-bars">${L.bars.map((m, i) => `<span title="${fmtMin(m)}"><i style="height:${(m / max) * 100}%" class="${m >= goal ? "goal" : ""}"></i><small>${DAYS[i]}</small></span>`).join("")}</div>
        <ul><li><b>${fmtMin(L.total)}</b>총 공부</li><li><b>${L.days}일</b>공부한 날</li><li><b>${L.goalDays}일</b>목표 달성</li>
          <li><b>${L.prevTotal ? `${L.total >= L.prevTotal ? "▲" : "▼"} ${fmtMin(Math.abs(L.total - L.prevTotal))}` : "-"}</b>지난주 대비</li></ul>
        ${subj.length ? `<div class="lp-subj">${subj.map(([s, m]) => `<span>${esc(s)} <b>${fmtMin(m)}</b></span>`).join("")}</div>` : ""}
      </div>
      <div class="lp-sign">— ${esc(c.name)}</div>
    </div>`;
}
function open() {
  const lb = box();
  const unread = lb.list.find((x) => !x.read);
  const pick = (L) => { if (L) { L.read = true; TS.save(); refreshBtn(); } };
  let cur = unread || lb.list[0] || null;
  pick(cur);
  const draw = (el) => {
    const isPrev = cur === "preview";
    const L = isPrev ? { ...build(TS.weekKey()), from: S().partner } : cur;
    el.querySelector("#lt-view").innerHTML = L ? letterHTML(L, isPrev) : '<p class="hint" style="text-align:center">아직 받은 편지가 없어요. 이번 주 공부를 마치면 다음 주 월요일에 첫 편지가 와요!</p>';
    el.querySelectorAll("[data-lt]").forEach((b) => b.classList.toggle("on", (b.dataset.lt === "preview" && isPrev) || lb.list[+b.dataset.lt] === cur));
  };
  TS.modal(`<h2>💌 사도의 편지함</h2>
    <div class="seg small lt-tabs"><button data-lt="preview">✏️ 이번 주 미리보기</button>${lb.list.map((L, i) => `<button data-lt="${i}">${L.read ? "" : "🆕 "}${fmtDay(L.week).replace(/\(.\)/, "")} 주</button>`).join("")}</div>
    <div id="lt-view"></div>
    <div class="modal-actions"><button class="btn yellow" data-close>닫기</button></div>`,
  (el) => {
    el.querySelectorAll("[data-lt]").forEach((b) => (b.onclick = () => { cur = b.dataset.lt === "preview" ? "preview" : lb.list[+b.dataset.lt]; if (cur !== "preview") pick(cur); draw(el); }));
    draw(el);
    TS.sfx("coin");
  });
}

/* 헤더 💌 버튼 (안 읽은 편지 있으면 빨간 점) */
const btn = document.createElement("button");
btn.className = "ss-top mail-top"; btn.id = "mail-btn"; btn.title = "사도의 편지함"; btn.innerHTML = `💌<em class="dot hidden"></em>`;
const ss = $("ss-btn"); if (ss) ss.before(btn);
btn.onclick = open;
function refreshBtn() { btn.querySelector(".dot").classList.toggle("hidden", !box().list.some((x) => !x.read)); }

TS.on("start", check);
TS.on("refresh", refreshBtn);
window.Letter = { open, check, compose, build };
})();
