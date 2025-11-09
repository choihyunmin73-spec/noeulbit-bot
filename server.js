// ==============================================
// 🌇 노을빛하루 AI 자동 진단 서버 (교체본)
// - 디자인/파일구조 변경 없음
// - 문항/결과 자동생성 + 네트워크 에러 처리 강화
// ==============================================
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

// -------------------- 기본 라우팅 유지 --------------------
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/question.html", (req, res) => res.sendFile(path.join(__dirname, "question.html")));
app.get("/result.html", (req, res) => res.sendFile(path.join(__dirname, "result.html")));

// -------------------- 유틸 --------------------
const TOPICS = [
  "관절 통증","혈압 관리","혈당·당뇨","불면증·수면장애","어깨·목 통증","심장·호흡·가슴통증",
  "노안·시력저하","치매·기억력 문제","전립선·배뇨 문제","종합 건강 체크",
  "보험비용 종합점검","최저가 자동차 견적 비교"
];

// 안전한 읽기(없어도 동작)
function safeReadJSON(p) {
  try {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {}
  return null;
}
const analysisPath = path.join(__dirname, "analysis.json");
const affiliatePath = path.join(__dirname, "affiliate.json");

// -------------------- 문항 자동 생성 --------------------
// 질문 1개 = { id, text, options[6] }
function genQuestions(topic) {
  // 공통 6옵션 생성기
  const six = (arr) => (arr.length >= 6 ? arr.slice(0,6) : [...arr, ...Array(6-arr.length).fill("기타")]);

  // 자동차
  if (topic === "최저가 자동차 견적 비교") {
    return [
      {id:1, text:"현재 차량을 보유 중이신가요?", options: six(["보유(교체)", "보유(추가)", "무보유(신규)", "장기렌트중", "리스중", "기타"])},
      {id:2, text:"선호하시는 구매 방식은 무엇인가요?", options: six(["일시불", "할부", "장기렌트", "리스", "구독형", "아직 미정"])},
      {id:3, text:"월 차량 예산은 어느 정도인가요?", options: six(["30만 원 이하","30~50만 원","50~80만 원","80~100만 원","100만 원 이상","일시불(현금)"])},
      {id:4, text:"선호하는 차량 브랜드가 있나요?", options: six(["현대/기아","제네시스","르노/쉐보레","수입(토요타/혼다)","수입(벤츠/BMW/Audi)","무관"])},
      {id:5, text:"차량 구매/교체 시기는 언제인가요?", options: six(["즉시~1개월","1~3개월","3~6개월","6개월 이후","비교만 먼저","기타"])},
      {id:6, text:"차량 용도는 무엇이 가장 가까운가요?", options: six(["출퇴근","가족/여행","업무용","취미/서브","장거리 위주","기타"])},
      {id:7, text:"관심 연료/구동 방식은?", options: six(["가솔린","디젤","하이브리드","전기","LPG","무관"])},
      {id:8, text:"가장 중요하게 보는 요소는 무엇인가요?", options: six(["가격","연비","디자인","브랜드","안전성","유지비"])},
      {id:9, text:"선호 차급은?", options: six(["경/소형","준중형","중형","대형","SUV/MPV","픽업/기타"])},
      {id:10,text:"필요 옵션이 있나요?", options: six(["ADAS 안전옵션","통풍/열선시트","파노라마/선루프","대화면 네비","4WD","무관"])},
    ];
  }

  // 보험
  if (topic === "보험비용 종합점검") {
    return [
      {id:1, text:"현재 유지 중인 보험을 선택하세요.", options: six(["실손","암/중대질병","종합(생/손보)","자동차","운전자","모름"])},
      {id:2, text:"월 보험료 총액은?", options: six(["5만↓","5~10만","10~20만","20~30만","30만↑","모름"])},
      {id:3, text:"가장 줄이고 싶은 항목은?", options: six(["불필요 특약","중복 담보","자동차 보험","운전자","실손","모름"])},
      {id:4, text:"최근 2년 내 보험금 청구 경험?", options: six(["없음","1회","2~3회","4회↑","기억안남","검토필요"])},
      {id:5, text:"가장 중요한 기준은?", options: six(["보험료 절감","보장 강화","병원비 대비","사고대응","노후대비","균형"])},
      {id:6, text:"가족 구성(피보험자)은?", options: six(["본인 단독","부부","자녀 1","자녀 2+","부모 포함","기타"])},
      {id:7, text:"자동차 보험 갱신 시기는?", options: six(["1개월↓","1~3개월","3개월↑","갱신 미정","없음","모름"])},
      {id:8, text:"희망 작업은?", options: six(["보험료 비교","보장 분석","중복 정리","특약 최적화","전문가 상담","아직 탐색"])},
      {id:9, text:"건강 상태/병력으로 보장 공백 우려?", options: six(["우려없음","경미","보통","높음","모름","상담희망"])},
    ];
  }

  // 헬스케어 류(공통 자동)
  const lib = {
    "관절 통증":[
      ["통증 부위는?",["무릎","허리","어깨","손목","발목","기타"]],
      ["통증 기간은?",["1주↓","1주~1개월","1~3개월","3개월↑","간헐적","기타"]],
      ["악화 요인은?",["계단","오래 서기","운동 후","아침 강직","추위/습기","모름"]],
      ["통증 강도는?",["가벼움","보통","심함","매우 심함","변동","모름"]],
      ["치료/보조?",["없음","자세교정","냉/온찜질","물리치료","약물","주사/시술"]],
      ["체중 영향?",["정상","약간 과체중","과체중","비만","감량중","모름"]],
      ["운동 습관?",["없음","가벼운 걷기","스트레칭","수영/사이클","근력운동","기타"]],
      ["보조기구 사용?",["무","테이핑","보호대","지팡이","깔창","기타"]],
    ],
    "혈압 관리":[
      ["최근 수축기 혈압?",["120↓","120~129","130~139","140~159","160↑","모름"]],
      ["두통/어지럼?",["없음","가끔","자주","심함","운동 후","모름"]],
      ["염분 섭취?",["낮음","보통","다소 높음","높음","외식 잦음","모름"]],
      ["카페인/흡연?",["무","카페인多","흡연","둘다","간헐","모름"]],
      ["운동 빈도?",["없음","주1~2","주3~4","매일","비정기","모름"]],
      ["체중 변화?",["증가","유지","감소","감량중","급격변화","모름"]],
      ["수면 시간?",["6h↓","6~7h","7~8h","8h↑","불규칙","모름"]],
      ["스트레스?",["낮음","보통","높음","매우 높음","변동","모름"]],
    ],
    "혈당·당뇨":[
      ["공복 혈당?",["<100","100~109","110~125","≥126","모름","검사예정"]],
      ["식후 졸림/갈증?",["없음","가끔","자주","심함","야뇨","모름"]],
      ["복부비만?",["무","경도","중등","고도","감량중","모름"]],
      ["야식/당분?",["거의無","가끔","자주","매우 자주","음료/과일多","모름"]],
      ["운동?",["없음","걷기","근력","유산소","혼합","비정기"]],
      ["수면?",["양호","부족","불면","코골이","교대근무","모름"]],
      ["가족력?",["무","있음(부모)","있음(형제)","있음(기타)","모름","미응답"]],
      ["검사 계획?",["1주내","1개월내","3개월내","정기검사","미정","모름"]],
    ],
    "불면증·수면장애":[
      ["입면 소요시간?",["<15분","15~30분","30~60분",">60분","불규칙","모름"]],
      ["자주 깨는가?",["아니오","가끔","자주","매우 자주","새벽각성","모름"]],
      ["전자기기 사용?",["취침전 無","30분전 중단","직전 사용","누워서 사용","야간알림 多","모름"]],
      ["카페인/야식?",["거의 無","오후만","저녁까지","야식/야음료","변동","모름"]],
      ["스트레스/불안?",["낮음","보통","높음","매우 높음","변동","모름"]],
      ["낮잠?",["없음","가끔(≤20m)","자주(>20m)","오후 늦게","교대근무","모름"]],
      ["수면환경?",["어둡고 조용함","조명 약간","밝음/소음","온도 불편","침구 불편","모름"]],
      ["수면시간?",["<5h","5~6h","6~7h","7~8h","8h↑","불규칙"]],
    ]
  };

  if (lib[topic]) {
    return lib[topic].map((q,i)=>({ id:i+1, text:q[0], options:six(q[1]) }));
  }

  // 기타 주제는 안전한 기본 템플릿
  const fallback = [
    "증상이 가장 불편한 시간대는?","증상 빈도는?",
    "최근 악화 요인은?","관리/치료 경험은?","생활 습관 영향은?",
    "검사 계획은?","가족력/과거력?","가장 원하는 개선 목표는?"
  ];
  return fallback.map((t,i)=>({
    id:i+1,
    text:t,
    options:six(["없음","가끔","자주","심함","모름","상담필요"])
  }));
}

// -------------------- 결과 자동 생성 --------------------
function pickLevelFrom(answers=[]) {
  // 간단 휴리스틱: 강한/비용/심함 키워드 포함수로 결정
  const s = answers.join(" ");
  const score =
    (s.match(/심함|매우|높음|고도|>60분|≥126|160↑|100만/g)||[]).length*2 +
    (s.match(/자주|불규칙|야식|흡연|과체중|비만|없음\(운동|관리\)/g)||[]).length;
  if (score >= 4) return "severe";
  if (score >= 2) return "moderate";
  return "mild";
}

function loadAnalysis(topic, level){
  const base = safeReadJSON(analysisPath) || {};
  const t = base[topic] && base[topic][level];
  if (t) return t;

  // 기본 문구 자동 생성(누락 보호)
  const riskMap = { mild: 55, moderate: 75, severe: 92 };
  const template = (title)=>({
    risk: riskMap[level],
    detail: [
      `${title}과 관련된 지표가 ${level==="mild"?"경미하게":level==="moderate"?"지속적으로":"높게"} 관찰됩니다.`,
      "생활 습관 및 환경 요인의 영향이 큽니다.",
      "핵심 항목 위주로 점검을 권장합니다.",
      "필요 시 전문 진료/상담을 고려하세요.",
      "1~4주 단위로 재평가를 권장합니다."
    ],
    summary: [
      `${title} 위험도: ${riskMap[level]}%`,
      "관리 포인트를 요약했습니다.",
      "운동·수면·식단·스트레스 관리가 핵심입니다.",
      "정기적인 기록과 재점검이 필요합니다."
    ],
    opinion: [
      "지속 가능한 수준에서 시작하고 점진적으로 강화하세요.",
      "무리한 시도보다 일관성이 중요합니다."
    ]
  });

  if (topic.includes("자동차")) return template("자동차 비용/구성");
  if (topic.includes("보험")) return template("보험료/보장");
  return template("건강지표");
}

// -------------------- API --------------------
// 문항 제공
app.get("/api/survey/:topic", (req, res) => {
  try {
    const topic = decodeURIComponent(req.params.topic || "");
    if (!TOPICS.includes(topic)) return res.status(400).json({ error: "알 수 없는 주제" });
    const questions = genQuestions(topic);
    // 8~12개 보장
    const sliceN = Math.min(Math.max(questions.length,8),12);
    return res.json({ topic, questions: questions.slice(0, sliceN) });
  } catch (e) {
    console.error("💥 문항 오류:", e);
    return res.status(500).json({ error: "서버 내부 오류" });
  }
});

// 결과 분석
app.post("/api/analyze", (req, res) => {
  try {
    const { topic, answers } = req.body || {};
    if (!topic) return res.status(400).json({ success:false, error:"topic 누락" });

    const q = genQuestions(topic);
    const ans = Array.isArray(answers) && answers.length ? answers : q.map(x=>x.options[0]);
    const level = pickLevelFrom(ans);
    const result = loadAnalysis(topic, level);

    const affiliates = safeReadJSON(affiliatePath) || {};
    const recos = affiliates[topic] || [];

    return res.json({
      success: true,
      topic,
      level,
      risk: result.risk,
      detail: result.detail,
      summary: result.summary,
      opinion: result.opinion,
      affiliates: recos
    });
  } catch (e) {
    console.error("💥 분석 오류:", e);
    return res.status(500).json({ success:false, error:"서버 내부 오류" });
  }
});

// 헬스 체크
app.get("/health", (_, res) => res.json({ ok:true }));

// 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 running on ${PORT}`));
