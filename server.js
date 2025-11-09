// ==============================
// 🌇 노을빛하루 AI 진단 서버 (affiliate.json 연동 버전)
// ==============================
const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();

app.use(express.json());
app.use(express.static(__dirname)); // HTML, CSS, JS, JSON 서빙

// ==============================
// ✅ affiliate.json 자동 로드
// ==============================
let affiliateData = {};
try {
  const filePath = path.join(__dirname, "affiliate.json");
  if (fs.existsSync(filePath)) {
    affiliateData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    console.log("✅ affiliate.json 로드 완료");
  } else {
    console.warn("⚠️ affiliate.json 파일이 없습니다. 제휴상품 표시가 제한됩니다.");
  }
} catch (err) {
  console.error("❌ affiliate.json 로드 오류:", err);
}

// ==============================
// ✅ 기본 라우팅
// ==============================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.get("/question.html", (req, res) => {
  res.sendFile(path.join(__dirname, "question.html"));
});
app.get("/result.html", (req, res) => {
  res.sendFile(path.join(__dirname, "result.html"));
});
app.get("/affiliate.json", (req, res) => {
  res.sendFile(path.join(__dirname, "affiliate.json"));
});

// ==============================
// ✅ AI 진단 분석 로직
// ==============================
function analyzeTopic(topic, checks) {
  const riskWords = ["심함", "악화", "어려움", "높음", "위험", "갑자기", "숨", "통증", "저림"];
  let riskScore = 0;
  checks.forEach(c => {
    riskWords.forEach(r => {
      if (c.includes(r)) riskScore++;
    });
  });

  const riskPercent = Math.min(100, riskScore * 10);
  const level =
    riskPercent === 0 ? "정상 단계" :
    riskPercent <= 30 ? "경미함 단계" :
    riskPercent <= 60 ? "주의 단계" :
    "고위험 단계";

  let detail = "";
  let advice = [];
  let summary = [];
  let categoryKey = "종합 건강 체크";

  // ==============================
  // 🧠 주제별 상세 로직
  // ==============================
  if (topic.includes("혈압")) {
    categoryKey = "혈압 관리";
    detail = "혈압 관리가 필요한 단계입니다. 꾸준한 운동과 식이조절이 중요합니다.";
    advice = [
      "짜게 먹는 습관을 줄이세요.",
      "가벼운 유산소 운동을 매일 30분 이상 하세요.",
      "혈압은 일정한 시간에 매일 체크하세요."
    ];
    summary = ["혈압 수치 안정화 필요", "식단 조절 및 꾸준한 운동"];
  } 
  else if (topic.includes("혈당") || topic.includes("당뇨")) {
    categoryKey = "혈당·당뇨";
    detail = "혈당이 높을 가능성이 있습니다. 식사 후 활동량을 늘리고 단 음식을 줄이세요.";
    advice = [
      "식후 30분 산책이 좋습니다.",
      "단 음료, 빵, 과일주스 섭취를 줄이세요."
    ];
    summary = ["혈당 관리 필요", "식단 개선 및 운동 필수"];
  }
  else if (topic.includes("수면") || topic.includes("불면")) {
    categoryKey = "불면증·수면장애";
    detail = "수면의 질이 낮아지고 있습니다. 스트레스와 카페인 섭취를 조절하세요.";
    advice = [
      "잠들기 전 휴대폰 사용을 줄이세요.",
      "카페인 음료를 오후 이후 피하세요."
    ];
    summary = ["수면 질 개선 필요", "수면 환경 정비"];
  }
  else if (topic.includes("관절") || topic.includes("무릎") || topic.includes("어깨") || topic.includes("목")) {
    categoryKey = "관절 통증";
    detail = "관절 피로와 통증이 감지됩니다. 자세 교정과 영양 보충이 필요합니다.";
    advice = [
      "무릎에 무리가는 동작을 피하세요.",
      "체중 관리가 관절 건강에 도움이 됩니다."
    ];
    summary = ["관절 피로 누적", "스트레칭 및 영양 보충 권장"];
  }
  else if (topic.includes("시력") || topic.includes("눈") || topic.includes("노안")) {
    categoryKey = "노안·시력저하";
    detail = "눈의 피로도가 높습니다. 장시간 스마트폰 사용을 줄이세요.";
    advice = [
      "1시간마다 10분씩 먼 곳을 바라보세요.",
      "루테인과 아스타잔틴 섭취를 권장합니다."
    ];
    summary = ["시력 피로 완화 필요", "항산화 영양소 섭취 권장"];
  }
  else if (topic.includes("기억력") || topic.includes("치매")) {
    categoryKey = "치매·기억력 문제";
    detail = "기억력 저하 징후가 있습니다. 두뇌 활동을 꾸준히 유지하세요.";
    advice = [
      "매일 글쓰기나 독서로 뇌를 자극하세요.",
      "균형 잡힌 식단이 도움이 됩니다."
    ];
    summary = ["기억력 저하 가능성", "두뇌 자극 활동 권장"];
  }
  else if (topic.includes("전립선") || topic.includes("배뇨")) {
    categoryKey = "전립선·배뇨 문제";
    detail = "전립선 기능 저하 또는 배뇨 장애 가능성이 있습니다.";
    advice = [
      "카페인 섭취를 줄이세요.",
      "물을 자주, 조금씩 섭취하세요."
    ];
    summary = ["전립선 건강 관리 필요", "생활습관 개선 필요"];
  }

  // ==============================
  // ✅ affiliate.json 상품 연결
  // ==============================
  const supplements = affiliateData[categoryKey] || affiliateData["종합 건강 체크"] || [];

  return {
    topic,
    level,
    riskPercent,
    detail,
    summary,
    opinion: advice,
    supplements
  };
}

// ==============================
// ✅ API 엔드포인트
// ==============================
app.post("/analyze", (req, res) => {
  try {
    const { topic, checks } = req.body;
    const result = analyzeTopic(topic, checks);
    res.json(result);
  } catch (error) {
    console.error("❌ 분석 오류:", error);
    res.status(500).json({ error: "서버 내부 오류" });
  }
});

// ==============================
// ✅ 서버 실행
// ==============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 노을빛하루 AI 서버 실행중 (포트: ${PORT})`));
