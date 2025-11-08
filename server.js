const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

/* ✅ 기본 라우팅 */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* ✅ 질문 페이지 라우팅 */
app.get("/question.html", (req, res) => {
  res.sendFile(path.join(__dirname, "question.html"));
});

/* ✅ 결과 페이지 라우팅 */
app.get("/result.html", (req, res) => {
  res.sendFile(path.join(__dirname, "result.html"));
});

/* ✅ AI 분석 엔진 (기초형) */
function analyzeTopic(topic, answers) {
  const riskWords = ["심함", "악화", "어려움", "위험", "높음", "갑자기", "통증", "저림"];
  let score = 0;
  answers.forEach(a => {
    riskWords.forEach(r => {
      if (a.includes(r)) score++;
    });
  });
  return score >= 3 ? "위험도 높음" : score >= 1 ? "주의 필요" : "양호";
}

/* ✅ API 엔드포인트 */
app.post("/api/analyze", (req, res) => {
  const { topic, answers } = req.body;
  const result = analyzeTopic(topic, answers);
  res.json({ result });
});

/* ✅ 서버 실행 */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
