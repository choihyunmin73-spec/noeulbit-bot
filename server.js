import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());
app.use(cors());

// ✅ __dirname 사용 가능하게 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ index.html, css, js 등 정적 제공
app.use(express.static(__dirname));

// ✅ 홈화면 index.html 제공
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ✅ AI 분석 엔드포인트
app.post("/ai-analyze", async (req, res) => {
  try {
    const { topic, answers } = req.body;

    if (!topic || !answers) {
      return res.status(400).json({ result: "데이터 부족" });
    }

    const reply = `
[AI 분석 결과]
선택항목: ${topic}
답변: ${answers.join(", ")}

✅ 서버 연결 정상 작동 중입니다.
    `;

    res.json({ result: reply });

  } catch (error) {
    res.status(500).json({ result: "AI 분석 오류" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("✅ Node Server Running on Port", PORT));
