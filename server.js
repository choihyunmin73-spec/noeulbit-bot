import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("✅ Server OK / AI Analyzer API Running");
});

app.post("/ai-analyze", async (req, res) => {
  try {
    const { topic, answers } = req.body;

    // ✅ 안전 장치
    if (!topic || !answers) {
      return res.status(400).json({ result: "데이터 부족" });
    }

    // ✅ 여기서 AI 분석 대신, 테스트용 가짜 응답
    const reply = `
[AI 분석 결과]
선택한 항목: ${topic}
답변: ${answers.join(", ")}

✅ 서버 연결 정상 확인됨.
    `;

    res.json({ result: reply });

  } catch (error) {
    res.status(500).json({ result: "AI 분석 오류" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("✅ Node Server Running on Port", PORT));
