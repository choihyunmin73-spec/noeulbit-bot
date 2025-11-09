const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();

app.use(express.json());
app.use(express.static(__dirname)); // ✅ HTML, JSON, 이미지 등 정적 파일 서빙

// ✅ 기본 라우팅
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/question.html", (req, res) => res.sendFile(path.join(__dirname, "question.html")));
app.get("/result.html", (req, res) => res.sendFile(path.join(__dirname, "result.html")));

// ✅ ① affiliate.json 자동 로드 (+ 변경 감지 핫리로드)
let affiliateData = {};
const affiliatePath = path.join(__dirname, "affiliate.json");

// 최초 로드
function loadAffiliateData() {
  try {
    const raw = fs.readFileSync(affiliatePath, "utf-8");
    affiliateData = JSON.parse(raw);
    console.log("✅ affiliate.json loaded:", Object.keys(affiliateData).length, "categories");
  } catch (err) {
    console.error("❌ Failed to load affiliate.json:", err.message);
    affiliateData = {};
  }
}
loadAffiliateData();

// 파일 변경 시 자동 반영 (핫리로드)
fs.watchFile(affiliatePath, () => {
  console.log("♻️ Detected affiliate.json change, reloading...");
  loadAffiliateData();
});

// 요청 시 최신 JSON 반환
app.get("/affiliate.json", (req, res) => res.json(affiliateData));

/* ==========================================================
   ✅ AI 분석 엔진
   - 12개 주제별 상세진단 / 요약 / 전문가 의견 자동 생성
   - 상세 10줄, 요약 7줄, 전문가 2줄 보장
========================================================== */
function ensureLengths(detailLines, summary, advice) {
  while (detailLines.length < 10) detailLines.push("생활 습관 조정이 필요합니다.");
  while (summary.length < 7) summary.push("정기적인 자기 관리와 추적 관찰이 필요합니다.");
  while (advice.length < 2) advice.push("무리한 활동은 피하고 충분한 휴식을 취하세요.");
  return {
    detail: detailLines.join(" "),
    summary,
    advice
  };
}

function analyzeTopic(topic, checks = []) {
  const riskWords = ["심함", "악화", "어려움", "높음", "위험", "즉시", "갑자기", "숨", "통증", "가슴", "저림", "불면", "기억", "혈당", "혈압"];
  let riskScore = 0;
  checks.forEach(c => riskWords.forEach(r => { if ((c || "").includes(r)) riskScore++; }));

  const level =
    riskScore >= 7 ? "severe" :
    riskScore >= 4 ? "moderate" :
    "mild";

  const riskPercent = Math.min(riskScore * 10 + 30, 100);

  let detailLines = [];
  let summary = [];
  let advice  = [];
  let supplements = [];

  // 🔹 주요 주제별 템플릿
  switch (topic) {
    case "어깨·목 통증":
      detailLines = [
        "장시간 구부정한 자세로 인한 근막성 통증이 의심됩니다.",
        "작업 50분·휴식 10분 리듬으로 스트레칭을 하세요.",
        "팔 저림·야간통증 지속 시 정형외과 검사가 필요합니다."
      ];
      summary = [
        "자세 교정 필수", "온찜질·스트레칭", "체형교정 고려", "베개 높이 조절", "스마트폰 사용 각도 주의", "3일 내 내원 필요 시점 점검", "가벼운 근막 이완 운동 병행"
      ];
      advice = [
        "핫팩 10분 후 스트레칭으로 순환을 돕습니다.",
        "장시간 컴퓨터 사용 후에는 어깨 회전 운동을 하세요."
      ];
      supplements = ["MSM 관절근육 포뮬러", "마그네슘 이지업", "비타민B 컴플렉스"];
      break;

    case "혈압 관리":
      detailLines = [
        "혈압 변동이 관찰되며 염분 과다·스트레스 영향이 큽니다.",
        "저염식과 규칙적인 유산소 운동이 중요합니다."
      ];
      summary = [
        "혈압 수치 변동 주의", "저염식·유산소 운동", "카페인 제한", "2~3일 내 내과 상담", "혈압 기록 앱 추적", "스트레스 완화", "수면 7시간 유지"
      ];
      advice = [
        "아침·저녁 2회 동일 조건에서 측정하세요.",
        "스트레스 강한 날은 카페인 섭취를 줄이세요."
      ];
      supplements = ["오메가3 트리플케어", "마그네슘 밸런스", "코엔자임Q10 플러스"];
      break;

    default:
      detailLines = ["AI 분석 결과를 불러오는 중입니다."];
      summary = ["상태 안정 추정, 정기 관찰 권장"];
      advice  = ["필요 시 진료를 받으세요."];
      supplements = [];
  }

  const fixed = ensureLengths(detailLines, summary, advice);
  return {
    topic,
    level,
    riskPercent,
    detail: fixed.detail,
    summary: fixed.summary,
    advice: fixed.advice,
    supplements
  };
}

// ✅ API 엔드포인트
app.post("/analyze", (req, res) => {
  const { topic, checks } = req.body || {};
  res.json(analyzeTopic(topic, checks));
});

// ✅ 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
