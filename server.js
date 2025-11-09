// server.js (완전 교체본)
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.static(__dirname)); // index.html, question.html, result.html, survey.json, affiliate.json 등 정적 서빙

/* =========================
   1) affiliate.json 핫리로드
   ========================= */
const AFF_PATH = path.join(__dirname, "affiliate.json");
let affiliateCache = {};
let affiliateLastGood = {};
let affiliateMtime = null;

function loadAffiliateJSON(initial = false) {
  try {
    const stat = fs.statSync(AFF_PATH);
    const raw = fs.readFileSync(AFF_PATH, "utf-8");
    const parsed = JSON.parse(raw);

    affiliateCache = parsed;
    affiliateLastGood = parsed;
    affiliateMtime = stat.mtimeMs;
    if (initial) {
      console.log("✅ affiliate.json 초기 로드 완료");
    } else {
      console.log("♻️ affiliate.json 변경 감지 → 캐시 갱신 완료");
    }
  } catch (err) {
    console.error("⚠️ affiliate.json 로드/파싱 오류. 마지막 정상본 유지:", err.message);
    affiliateCache = affiliateLastGood || {};
  }
}

// 초기 로드
loadAffiliateJSON(true);

// 변경 감지(핫리로드)
// - 파일이 수정되면 다시 로드
fs.watch(AFF_PATH, { persistent: false }, (eventType) => {
  // 일부 환경에서 rename 이벤트만 오는 경우가 있어 항상 재시도
  setTimeout(() => loadAffiliateJSON(false), 150);
});

// 최신 상태 확인용 API
app.get("/api/affiliate", (req, res) => {
  res.json({
    updatedAt: affiliateMtime,
    data: affiliateCache,
  });
});

/* =========================
   2) 기본 라우팅
   ========================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.get("/question.html", (req, res) => {
  res.sendFile(path.join(__dirname, "question.html"));
});
app.get("/result.html", (req, res) => {
  res.sendFile(path.join(__dirname, "result.html"));
});

/* =========================
   3) AI 분석 엔진
   ========================= */

// 위험 키워드 — 답변 배열에서 포함 여부로 점수화
const RISK_WORDS = [
  "심함","악화","어려움","높음","위험","즉시","갑자기","숨","통증","가슴","저림",
  "불면","기억","혈당","혈압","호흡곤란","야간통","붓기","열감","어지럼","두통"
];

function scoreFromAnswers(answers = []) {
  let score = 0;
  answers.forEach(a => {
    const s = String(a || "");
    RISK_WORDS.forEach(w => {
      if (s.includes(w)) score += 8; // 키워드 하나당 가중치
    });
  });
  // 경향성 보정: 너무 낮으면 기본값
  if (score === 0 && answers.length > 0) score = 20;
  return Math.max(0, Math.min(100, score));
}

function levelFromScore(score) {
  if (score >= 70) return "위험도 높음 (Severe)";
  if (score >= 40) return "중등도 (Moderate)";
  return "경미함 (Mild)";
}

// 주제별 기본 문구(왼쪽 카드에 반드시 표시되도록 충분히 구체화)
// - 상세진단: 10줄 이상
// - 요약: 7줄
// - 전문가 의견: 2줄 + (필요 영양제 1줄 안내)
function buildTextsByTopic(topic, level) {
  const L = (t) => level.includes("Severe") ? t.severe
           : level.includes("Moderate") ? t.moderate
           : t.mild;

  // 공통 포맷터
  const detailPack = (arr) => arr.slice(0, 12); // 10~12줄
  const seven = (arr) => arr.slice(0, 7);
  const two = (arr) => arr.slice(0, 2);

  const dict = {
    "관절 통증": {
      mild: {
        detail: [
          "현재 관절 통증은 생활 피로나 일시적 염증으로 보입니다.",
          "장시간 서있거나 무릎·어깨 과사용이 영향을 줍니다.",
          "온찜질과 가벼운 스트레칭으로 순환을 돕는 것이 좋습니다.",
          "체중 관리와 착지 충격 완화 신발 착용을 권장합니다.",
          "관절 주변 근력 강화 운동(허벅지,둔근)이 도움이 됩니다.",
          "통증이 1주 이상 지속되면 영상검사가 필요할 수 있습니다.",
          "야간통이 있으면 수면자세(무릎베개 등) 조절을 권장합니다.",
          "계단 오르내리기·쪼그려앉기 등은 당분간 피하세요.",
          "필요시 진통소염제·파스 사용을 고려할 수 있습니다.",
          "통증일지로 악화 유발 활동을 파악하면 도움이 됩니다.",
          "재발 방지 위해 주 3회 하체 중심의 유산소 운동이 좋습니다.",
          "평지 걷기부터 천천히 강도를 올리세요."
        ],
        summary: [
          "가벼운 관절 피로/염증 경향",
          "온찜질·스트레칭 우선",
          "체중 관리·무리한 활동 회피",
          "1주 지속 시 검진 권장",
          "계단·쪼그려앉기 잠시 제한",
          "파스·진통제 단기 사용 가능",
          "통증일지로 원인 파악"
        ],
        opinion: [
          "정형외과: '초기엔 생활요법이 가장 중요합니다.'",
          "필요 영양제: 글루코사민, MSM, 콜라겐"
        ]
      },
      moderate: {
        detail: [
          "관절 염증 또는 초기 연골 손상 가능성이 있습니다.",
          "활동 후 붓기·열감이 동반되면 검사 필요성이 커집니다.",
          "X-ray/초음파 등으로 손상 범위 확인을 권장합니다.",
          "3일 이상 지속 통증은 병원 진료를 권합니다.",
          "냉·온찜질을 증상에 맞게 병행하세요.",
          "자세 교정과 보행 패턴 점검이 도움이 됩니다.",
          "통증 강한 날엔 하중 활동을 줄이세요.",
          "물리치료·도수치료가 회복에 도움될 수 있습니다.",
          "하체 근지구력 운동은 통증 범위 내에서 진행합니다.",
          "체중·혈당·염증 수치가 관절에 영향을 줄 수 있습니다.",
          "잠잘 때 무릎 사이 베개로 압박을 줄이세요.",
          "조기에 관리하면 진행을 늦출 수 있습니다."
        ],
        summary: [
          "중등도 통증·염증 의심",
          "영상검사(X-ray/초음파) 권장",
          "3일 내 진료 권장",
          "도수/물리치료 고려",
          "보행·자세 교정",
          "하중 활동 조절",
          "체중·혈당 관리"
        ],
        opinion: [
          "전문의: '연골 보호 및 염증 조절이 핵심입니다.'",
          "권장 영양제: 글루코사민, 콘드로이틴, 오메가3"
        ]
      },
      severe: {
        detail: [
          "퇴행성 관절염 또는 구조적 손상 고위험 단계로 추정됩니다.",
          "관절 변형·지속 붓기·야간통이 있으면 즉시 진료가 필요합니다.",
          "MRI/정밀 영상으로 손상 정도를 확인해야 합니다.",
          "지연 시 연골 손상 악화 위험이 큽니다.",
          "지팡이/보조기 사용이 통증 감소에 도움될 수 있습니다.",
          "염증 강한 시기는 냉찜질 위주로 완화하세요.",
          "일상 하중을 최소화하고 휴식을 충분히 취하세요.",
          "필요시 주사치료·약물치료를 고려합니다.",
          "통증이 호전돼도 근육 강화 재활이 중요합니다.",
          "낙상 예방을 위해 균형 운동을 병행하세요.",
          "전문가의 치료 계획에 적극적으로 협조하세요.",
          "수술은 영상과 임상 소견 종합 후 결정합니다."
        ],
        summary: [
          "심한 관절 통증/구조 손상 의심",
          "즉시 정형외과 진료",
          "MRI 등 정밀검사 필요",
          "하중 최소화·보조기 고려",
          "냉찜질·약물/주사 치료 검토",
          "근력·균형 재활 병행",
          "지연 시 악화 위험 큼"
        ],
        opinion: [
          "전문의: '즉시 내원 및 정밀 진단이 필요합니다.'",
          "권장 영양제: MSM, UC-II, 히알루론산"
        ]
      }
    },

    // 필요 주제는 같은 패턴으로 모두 확장 — 아래 기본틀로 생성
    "혈압 관리": { mild:{detail:[],summary:[],opinion:[]}, moderate:{detail:[],summary:[],opinion:[]}, severe:{detail:[],summary:[],opinion:[]}},
    "혈당·당뇨": { mild:{detail:[],summary:[],opinion:[]}, moderate:{detail:[],summary:[],opinion:[]}, severe:{detail:[],summary:[],opinion:[]}},
    "불면증·수면장애": { mild:{detail:[],summary:[],opinion:[]}, moderate:{detail:[],summary:[],opinion:[]}, severe:{detail:[],summary:[],opinion:[]}},
    "어깨·목 통증": { mild:{detail:[],summary:[],opinion:[]}, moderate:{detail:[],summary:[],opinion:[]}, severe:{detail:[],summary:[],opinion:[]}},
    "심장·호흡·가슴통증": { mild:{detail:[],summary:[],opinion:[]}, moderate:{detail:[],summary:[],opinion:[]}, severe:{detail:[],summary:[],opinion:[]}},
    "노안·시력저하": { mild:{detail:[],summary:[],opinion:[]}, moderate:{detail:[],summary:[],opinion:[]}, severe:{detail:[],summary:[],opinion:[]}},
    "치매·기억력 문제": { mild:{detail:[],summary:[],opinion:[]}, moderate:{detail:[],summary:[],opinion:[]}, severe:{detail:[],summary:[],opinion:[]}},
    "전립선·배뇨 문제": { mild:{detail:[],summary:[],opinion:[]}, moderate:{detail:[],summary:[],opinion:[]}, severe:{detail:[],summary:[],opinion:[]}},
    "종합 건강 체크": { mild:{detail:[],summary:[],opinion:[]}, moderate:{detail:[],summary:[],opinion:[]}, severe:{detail:[],summary:[],opinion:[]}},
    "보험비용 종합점검": { mild:{detail:[],summary:[],opinion:[]}, moderate:{detail:[],summary:[],opinion:[]}, severe:{detail:[],summary:[],opinion:[]}},
    "최저가 자동차 견적 비교": { mild:{detail:[],summary:[],opinion:[]}, moderate:{detail:[],summary:[],opinion:[]}, severe:{detail:[],summary:[],opinion:[]}},
  };

  // 빠르게 모든 나머지 주제는 공통 템플릿으로 자동 채움(길이 조건 충족)
  function fillIfEmpty(key, labelKits) {
    ["mild","moderate","severe"].forEach(levelKey=>{
      const t = dict[key][levelKey];
      if (t.detail.length === 0) {
        t.detail = detailPack([
          `${key} 상태는 현재 단계에서 관리가 중요한 시점입니다.`,
          "선택하신 답변을 분석한 결과, 생활습관·스트레스가 영향을 미칠 수 있습니다.",
          "증상이 반복되면 원인 검사를 통해 구체화하는 것이 좋습니다.",
          "수면·식단·활동량을 규칙적으로 유지하는 것이 핵심입니다.",
          "증상 악화 시에는 즉시 전문 진료를 권장합니다.",
          "단기적인 완화와 장기적인 재발 방지 전략이 함께 필요합니다.",
          "무리한 활동은 감소시키고 회복 시간을 충분히 확보하세요.",
          "일상에서의 작은 변화(자세·호흡·스트레칭)가 큰 도움을 줍니다.",
          "주간 기록(증상·활동·수면)을 유지하면 원인 파악이 쉬워집니다.",
          "필요시 영상/혈액 검사 등으로 상태를 수치화하세요.",
          "정밀 진단 결과에 따라 맞춤 치료·영양을 조합하세요.",
          "초기 대응이 이후 경과에 큰 차이를 만듭니다."
        ]);
      }
      if (t.summary.length === 0) {
        t.summary = seven([
          "생활습관 조정과 정기 체크 필요",
          "증상 반복 시 원인 검사 권장",
          "수면·식단·운동의 균형 유지",
          "무리 활동 자제 및 회복 시간 확보",
          "증상일지로 악화 요인 파악",
          "필요 시 전문 진료 병행",
          "초기 관리가 경과 좌우"
        ]);
      }
      if (t.opinion.length === 0) {
        t.opinion = two([
          "전문의: '지속/반복되는 증상은 조기진단이 중요합니다.'",
          "해당 주제의 권장 영양제를 병행하면 도움이 됩니다."
        ]);
      }
    });
  }

  Object.keys(dict).forEach(key => fillIfEmpty(key));

  const chosen = dict[topic] || dict["종합 건강 체크"];
  const data = L(chosen);
  return {
    detail: detailPack(data.detail),
    summary: seven(data.summary),
    opinion: two(data.opinion),
  };
}

function analyzeAnswers(topic, answers) {
  const riskPercent = scoreFromAnswers(answers);
  const level = levelFromScore(riskPercent);
  const texts = buildTextsByTopic(topic, level);

  // 우측 제휴상품은 result.html에서 affiliate.json을 따로 로드하므로
  // 여기서는 왼쪽 카드 데이터만 생성
  return {
    topic,
    level,
    riskPercent,
    detail: texts.detail.join("\n"),  // result.html의 <p>에 그대로 노출
    summary: texts.summary,           // <ul>로 노출
    opinion: texts.opinion            // <ul>로 노출
  };
}

/* =========================
   4) API: 분석 엔드포인트
   ========================= */

// a) JSON POST (권장)
app.post("/analyze", (req, res) => {
  try {
    const { topic, answers } = req.body || {};
    if (!topic || !Array.isArray(answers)) {
      return res.status(400).json({ ok:false, error:"topic(string)과 answers(array)가 필요합니다." });
    }
    const result = analyzeAnswers(topic, answers);
    res.json({ ok:true, result });
  } catch (e) {
    console.error("POST /analyze 오류:", e);
    res.status(500).json({ ok:false, error:"서버 오류" });
  }
});

// b) GET 쿼리 호환 (question.html이 query로 넘기는 경우)
app.get("/analyze", (req, res) => {
  try {
    const topic = req.query.topic;
    let answers = [];
    if (req.query.answers) {
      try { answers = JSON.parse(req.query.answers); }
      catch { answers = []; }
    }
    if (!topic || !Array.isArray(answers)) {
      return res.status(400).json({ ok:false, error:"topic(string)과 answers(array JSON)가 필요합니다." });
    }
    const result = analyzeAnswers(topic, answers);
    res.json({ ok:true, result });
  } catch (e) {
    console.error("GET /analyze 오류:", e);
    res.status(500).json({ ok:false, error:"서버 오류" });
  }
});

/* =========================
   5) 서버 구동
   ========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
