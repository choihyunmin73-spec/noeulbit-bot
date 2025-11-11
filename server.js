const express = require("express");
const path = require("path");
const app = express();

// ✅ Render 서버용: public 접근 허용
app.use(express.json());
app.use(express.static(__dirname));

/* ✅ 기본 라우팅 */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/question.html", (req, res) => {
  res.sendFile(path.join(__dirname, "question.html"));
});

app.get("/result.html", (req, res) => {
  res.sendFile(path.join(__dirname, "result.html"));
});

app.get("/loading.html", (req, res) => {
  res.sendFile(path.join(__dirname, "loading.html"));
});

/* ✅ AI 분석 엔진 (기본 분석용) */
function analyzeTopic(topic, checks) {
  const riskWords = ["통증", "어려움", "위험", "높음", "갑자기", "숨", "저림", "심함"];
  let riskCount = 0;
  checks.forEach((c) => {
    riskWords.forEach((r) => {
      if (c.includes(r)) riskCount++;
    });
  });

  let riskScore = Math.min((riskCount / checks.length) * 100, 100);
  let riskLevel = "Mild";
  if (riskScore >= 70) riskLevel = "Severe";
  else if (riskScore >= 40) riskLevel = "Moderate";

  return { topic, riskCount, riskScore, riskLevel };
}

/* ✅ 분석 요청 API */
app.post("/analyze", (req, res) => {
  const { topic, checks } = req.body;
  if (!topic || !checks) {
    return res.status(400).json({ error: "Invalid data" });
  }
  const result = analyzeTopic(topic, checks);
  res.json(result);
});

/* ✅ 포트 실행 (Render 환경 자동포트) */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
