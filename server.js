import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());
app.use(cors());

// ✅ __dirname 대체 코드 (ESM 환경에서 필요)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ 정적 파일 제공(index.html 포함)
app.use(express.static(path.join(__dirname)));

// ✅ 기본 페이지
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ✅ AI 분석 API
app.post("/ai-analyze", async (req, res) => {
  try {
    const { topic, answers } = req.body;

    if (!topic || !answers) {
      return res.status(400).json({ result: "데이터 부족" });
    }

    // ✅ 테스트 응답
    const reply = `
[AI 분석 결과]
선택한 항목: ${topic}
답변: ${answers.join(", ")}

✅ 서버 연결 정상 확인됨.
    `;

    res.json({ result: reply });

  } catch (
