const express = require("express");
const app = express();
app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/question", (req, res) => {
  res.sendFile(__dirname + "/question.html");
});

app.get("/result", (req, res) => {
  res.sendFile(__dirname + "/result.html");
});

// ✅ AI 분석
app.post("/analyze", (req, res) => {
  const { topic, checks } = req.body;

  const resultText =
    `[AI 건강 분석 결과]\n` +
    `주제: ${topic}\n` +
    `체크한 항목: ${checks.join(", ")}\n\n` +
    `※ 선택하신 증상을 기반으로 초기 건강 상태를 분석했습니다.\n` +
    `증상이 지속되거나 악화되면 진료가 필요할 수 있습니다.`;

  res.json({ result: resultText });
});

app.listen(3000, () => console.log("✅ 서버 작동 중 (3000번 포트)"));
