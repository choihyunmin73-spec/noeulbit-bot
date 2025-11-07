const express = require("express");
const app = express();
app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/result", (req, res) => {
  res.sendFile(__dirname + "/result.html");
});

// ✅ AI 분석 결과(임시) — 나중에 GPT API로 교체 가능
app.post("/analyze", (req, res) => {
  const topic = req.body.topic;

  const fakeResponse = `[AI 건강 분석 결과]\n선택 항목: ${topic}\n\n초기 증상 체크가 필요합니다.\n간단한 생활 조절 및 추가 점검을 권장드립니다.\n\n※ 본 결과는 참고용이며, 정확한 진단은 의료진 상담이 필요합니다.`;

  res.json({ result: fakeResponse });
});

app.listen(3000, () => console.log("✅ 노을빛하루 AI 서버 작동 중 (3000번 포트)"));
