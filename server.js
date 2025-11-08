// ===============================
// ✅ Basic Express Server (AI 확장 버전)
// ===============================
import express from "express";
import path from "path";
import fetch from "node-fetch";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(__dirname)); // HTML, CSS, JS, JSON 파일 서빙

// ===============================
// ✅ 기본 페이지 라우팅
// ===============================
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/question.html", (req, res) => res.sendFile(path.join(__dirname, "question.html")));
app.get("/result", (req, res) => res.sendFile(path.join(__dirname, "result.html")));

// ===============================
// ✅ Topic 분석 엔진 (AI 확장 버전)
// ===============================
function analyzeTopic(topic, checks) {
  const riskWords = ["심함", "악화", "어려움", "높음", "위험", "즉시", "갑자기", "숨", "통증", "가슴", "저림"];
  const healthTopics = ["관절 통증","혈압 관리","혈당·당뇨","불면증·수면장애","어깨·목 통증","심장·호흡·가슴통증","노안·시력저하","치매·기억력 문제","전립선·배뇨 문제","종합 건강 체크"];
  const infoTopics = ["보이스피싱 예방","복지·생활지원금"];

  let riskScore = 0;
  checks.forEach(c => riskWords.forEach(r => { if (c.includes(r)) riskScore++; }));

  let severity = "낮음";
  if (riskScore >= 6) severity = "높음";
  else if (riskScore >= 3) severity = "중간";

  const percent = Math.min(100, Math.round((riskScore / 8) * 100));

  const tipsCommon = [
    "충분한 수분 섭취",
    "가벼운 스트레칭",
    "규칙적인 수면 습관 유지",
    "짧은 산책으로 활동량 유지",
    "과로 피하고 충분한 휴식"
  ];

  const redFlags = [];
  checks.forEach(c => {
    if (c.includes("숨") || c.includes("가슴"))
      redFlags.push("가슴 통증 또는 호흡 곤란 발생 시 즉시 진료 필요");
    if (c.includes("갑자기"))
      redFlags.push("갑작스러운 증상 변화는 위험 신호일 수 있습니다");
    if (c.includes("심함"))
      redFlags.push("일상생활 지장·심한 통증은 진료 필요");
  });

  const deptMap = {
    "관절 통증": "정형외과",
    "혈압 관리": "순환기내과",
    "혈당·당뇨": "내분비내과",
    "불면증·수면장애": "신경과",
    "어깨·목 통증": "정형외과",
    "심장·호흡·가슴통증": "순환기내과 / 호흡기내과",
    "노안·시력저하": "안과",
    "치매·기억력 문제": "신경과",
    "전립선·배뇨 문제": "비뇨의학과",
    "종합 건강 체크": "가정의학과",
    "보이스피싱 예방": "해당 없음",
    "복지·생활지원금": "해당 없음"
  };

  let action = "생활 관리가 필요합니다.";
  if (severity === "높음") action = "전문의 상담이 권장됩니다.";
  else if (severity === "중간") action = "조기 관리 및 관찰이 필요합니다.";

  let aiSummary = "";
  if (healthTopics.includes(topic)) {
    aiSummary =
      severity === "높음"
        ? `현재 ${topic} 관련 위험도가 높게 나타났습니다. 최근 선택 항목 중 통증·호흡·불안 등의 단어가 다수 포함되어 있어 즉각적인 검진이 권장됩니다.`
        : severity === "중간"
        ? `현재 ${topic} 관련 중등도 수준의 관리가 필요합니다. 증상이 반복되거나 생활에 불편이 있다면 조기 진료를 권장합니다.`
        : `현재 ${topic} 관련 위험 징후는 낮으며, 꾸준한 생활 습관 관리로 유지가 가능합니다.`;
  } else if (topic === "보이스피싱 예방") {
    aiSummary = "최근 스미싱·사칭형 피해가 급증하고 있습니다. 입력하신 답변을 기준으로 보안 의심 단계는 " +
      (severity === "높음" ? "심각" : severity === "중간" ? "주의" : "양호") +
      " 수준으로 평가되었습니다. 낯선 문자나 링크는 절대 클릭하지 마세요.";
  } else if (topic === "복지·생활지원금") {
    aiSummary = "복지·지원금 정보 접근 수준은 " +
      (severity === "높음" ? "매우 낮음" : severity === "중간" ? "보통" : "양호") +
      "으로 평가됩니다. 복지로 또는 정부24에서 본인 자격을 확인해 보세요.";
  } else {
    aiSummary = "일반 정보 분석 결과, 전반적인 상태는 안정적입니다.";
  }

  return {
    topic,
    checks,
    severity,
    percent,
    aiSummary,
    action,
    dept: deptMap[topic] || "상담 필요",
    tips: tipsCommon,
    redflags: redFlags
  };
}

// ===============================
// ✅ /analyze API
// ===============================
app.post("/analyze", (req, res) => {
  const { topic, checks } = req.body;
  if (!topic || !checks) return res.json({ error: "invalid request" });
  const result = analyzeTopic(topic, checks);
  res.json(result);
});

// ===============================
// ✅ 서버 실행
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
