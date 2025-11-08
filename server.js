// ✅ Noeulbit Haru AI Diagnosis Server (stable full set)
const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

/* Routes */
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/question.html", (req, res) => res.sendFile(path.join(__dirname, "question.html")));
app.get("/result.html", (req, res) => res.sendFile(path.join(__dirname, "result.html")));

/* Simple analyzer matching result.html fields */
function analyzeTopic(topic, checks = []) {
  const riskWords = ["심함","악화","어려움","위험","높음","즉시","갑자기","숨","호흡","가슴","저림","통증"];
  let score = 0;
  checks.forEach(c => riskWords.forEach(w => { if (c && c.includes(w)) score++; }));

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const percent = clamp(Math.round(12 + score * 12), 5, 95);

  let severity = "낮음";
  if (score >= 5) severity = "높음";
  else if (score >= 2) severity = "중간";

  const actionMap = { "낮음":"생활 관리가 필요합니다.", "중간":"조기 관리 및 관찰이 필요합니다.", "높음":"전문의 상담을 권장합니다." };
  const action = actionMap[severity];

  const deptMap = {
    "관절 통증":"정형외과",
    "혈압 관리":"순환기내과",
    "혈당·당뇨":"내분비내과",
    "불면증·수면장애":"신경과 / 정신건강의학과",
    "어깨·목 통증":"정형외과 / 재활의학과",
    "심장·호흡·가슴통증":"순환기내과 / 호흡기내과",
    "노안·시력저하":"안과",
    "치매·기억력 문제":"신경과",
    "전립선·배뇨 문제":"비뇨의학과",
    "종합 건강 체크":"가정의학과",
    "보이스피싱 예방":"해당 없음",
    "복지·생활지원금":"해당 없음"
  };
  const dept = deptMap[topic] || "상담 필요";

  const tipsCommon = [
    "충분한 수분 섭취","가벼운 스트레칭","규칙적 수면 유지",
    "짧은 산책으로 활동량 증가","과로 피하고 휴식"
  ];

  const redflags = [];
  checks.forEach(c => {
    if (!c) return;
    if (c.includes("가슴") || c.includes("숨")) redflags.push("가슴 통증·호흡곤란 시 즉시 진료");
    if (c.includes("갑자기")) redflags.push("갑작스런 증상 변화는 응급 신호일 수 있음");
    if (c.includes("심함")) redflags.push("일상에 지장을 주는 심한 통증은 진료 필요");
  });

  const aiSummary =
    `현재 응답을 바탕으로 '${topic}' 관련 상태는 '${severity}' 수준으로 추정됩니다. ` +
    (severity === "높음"
      ? "증상이 악화하거나 지속되면 지체 없이 전문의 상담을 권장합니다. "
      : severity === "중간"
      ? "생활·약물 순응도를 점검하고, 증상 변화에 유의하세요. "
      : "기본 생활 관리와 주기적 점검으로 유지가 가능해 보입니다. ") +
    `권장 진료과는 '${dept}'이며, 아래 셀프 케어 가이드를 우선 적용해 보세요.`;

  return { topic, checks, severity, action, dept, tips: tipsCommon, redflags, percent, aiSummary };
}

app.post("/analyze", (req, res) => {
  const { topic, checks } = req.body || {};
  if (!topic || !Array.isArray(checks)) return res.status(400).json({ error: "invalid request" });
  res.json(analyzeTopic(topic, checks));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
