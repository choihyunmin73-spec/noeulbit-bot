// ===============================
// ✅ Basic Express Server (CommonJS 버전)
// ===============================
const express = require("express");
const path = require("path");
const fetch = require("node-fetch");

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
// ✅ Topic 분석 엔진
// ===============================
function analyzeTopic(topic, checks) {
  const riskWords = ["심함", "악화", "어려움", "높음", "위험", "즉시", "갑자기", "숨", "통증", "가슴", "저림"];
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

  let riskScore = 0;
  checks.forEach(c => riskWords.forEach(r => { if (c.includes(r)) riskScore++; }));

  let severity = "낮음";
  if (riskScore >= 6) severity = "높음";
  else if (riskScore >= 3) severity = "중간";

  const percent = Math.min(100, Math.round((riskScore / 8) * 100));

  let action = "생활 관리가 필요합니다.";
  if (severity === "높음") action = "전문의 상담이 권장됩니다.";
  else if (severity === "중간") action = "조기 관리 및 관찰이 필요합니다.";

  return {
    topic,
    severity,
    percent,
    action,
    dept: deptMap[topic] || "상담 필요"
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
app.listen(PORT, () => console.log("✅ Server running on port", PORT));
