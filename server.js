// ✅ server.js 완전교체본
// 노을빛하루 AI 진단 시스템 - Express 서버
//---------------------------------------------------

const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

//-------------------------------
// 기본 설정
//-------------------------------
app.use(express.json());
app.use(express.static(__dirname));

//-------------------------------
// affiliate.json 핫리로드
//-------------------------------
let affiliateData = {};
const affiliatePath = path.join(__dirname, "affiliate.json");

function loadAffiliate() {
  try {
    affiliateData = JSON.parse(fs.readFileSync(affiliatePath, "utf8"));
    console.log("✅ affiliate.json 로드 완료");
  } catch (e) {
    console.error("❌ affiliate.json 로드 오류:", e);
  }
}
loadAffiliate();

// 파일 변경 감지 핫리로드
fs.watchFile(affiliatePath, () => {
  console.log("🔁 affiliate.json 변경 감지 → 다시 로드");
  loadAffiliate();
});

//-------------------------------
// 위험 단어 사전
//-------------------------------
const riskWords = [
  "통증","저림","가슴","숨","위험","심함","악화",
  "갑자기","호흡","이상","어지러움","두통","붓기"
];

//-------------------------------
// AI 분석 함수
//-------------------------------
function analyzeTopic(topic, answers) {
  let riskCount = 0;
  let total = answers.length;
  
  answers.forEach(a => {
    riskWords.forEach(w => { if (a.includes(w)) riskCount++; });
  });

  const riskPercent = Math.min(100, Math.round((riskCount / Math.max(total,1)) * 100));
  const level = riskPercent > 60 ? "High" : riskPercent > 30 ? "Moderate" : "Mild";

  //-------------------------------
  // 상세진단 (15줄)
  //-------------------------------
  const detail = [];
  if (total === 0) {
    detail.push("응답이 없어 기본 안전 수칙을 중심으로 안내합니다.");
    detail.push("현재 상태는 비교적 안정적입니다.");
    detail.push("규칙적인 수면과 충분한 수분 섭취를 권장합니다.");
    detail.push("가벼운 스트레칭과 산책으로 순환을 돕습니다.");
    detail.push("과로를 피하고 휴식을 자주 취하세요.");
    detail.push("스트레스를 완화할 수 있는 취미를 가지세요.");
    detail.push("균형 잡힌 식단으로 면역력을 높이세요.");
    detail.push("증상이 지속되면 의료 상담을 받으세요.");
  } else {
    detail.push(`현재 주제는 '${topic}'이며, 위험도는 ${level} 수준으로 평가되었습니다.`);
    detail.push("AI가 응답 내용을 기반으로 종합 분석을 수행했습니다.");
    detail.push("위험 단어가 감지되어 주의가 필요합니다.");
    detail.push("현재 상태는 비교적 안정적이나 일부 개선이 필요합니다.");
    detail.push("수면, 스트레스, 식습관을 함께 점검해 보세요.");
    detail.push("하루 30분 이내의 가벼운 운동이 도움이 됩니다.");
    detail.push("카페인, 알코올, 흡연을 줄이는 것이 좋습니다.");
    detail.push("충분한 수분 섭취와 균형 잡힌 영양이 필요합니다.");
    detail.push("심리적 안정이 신체 회복에 긍정적 영향을 줍니다.");
    detail.push("통증이나 불편감이 반복된다면 진료를 권장합니다.");
    detail.push("필요 시 전문의 상담을 통해 정확한 진단을 받으세요.");
    detail.push("생활습관을 기록해 두면 개선 경과를 확인하기 좋습니다.");
    detail.push("가벼운 통증이라도 3일 이상 지속되면 병원 방문을 추천합니다.");
    detail.push("건강 상태가 양호하더라도 정기 검진을 유지하세요.");
    detail.push("생활관리와 경과 관찰을 병행하시기 바랍니다.");
  }

  //-------------------------------
  // 요약 (7줄)
  //-------------------------------
  const summary = [
    `주제: ${topic}`,
    `위험도 수준: ${level}`,
    `응답 수: ${total}개`,
    `위험 단어 수: ${riskCount}개`,
    "전반적으로 안정적이며 생활관리 중심의 접근이 권장됩니다.",
    "정기 검진과 식습관 개선으로 건강을 유지하세요.",
    "필요 시 관련 전문의 상담을 병행하세요."
  ];

  //-------------------------------
  // 전문가 의견 (2줄)
  //-------------------------------
  const opinion = [
    `AI 분석 결과, 전반적인 위험 수준은 '${level}'입니다.`,
    "지속적인 생활 관리와 정기 검진으로 건강을 유지하세요."
  ];

  return { topic, total, riskCount, riskPercent, level, detail, summary, opinion };
}

//-------------------------------
// API: 분석 처리
//-------------------------------
app.post("/analyze", (req, res) => {
  try {
    const { topic, answers } = req.body;
    const result = analyzeTopic(topic, answers);
    res.json({ ok: true, result });
  } catch (e) {
    console.error("❌ 분석 오류:", e);
    res.json({ ok: false, error: e.message });
  }
});

//-------------------------------
// 기본 라우팅
//-------------------------------
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/question.html", (req, res) => res.sendFile(path.join(__dirname, "question.html")));
app.get("/result.html", (req, res) => res.sendFile(path.join(__dirname, "result.html")));

//-------------------------------
app.listen(PORT, () => console.log(`✅ 서버 실행 중: http://localhost:${PORT}`));
