import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

/* ✅ 기본 라우팅 */
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/question.html", (req, res) => res.sendFile(path.join(__dirname, "question.html")));
app.get("/result.html", (req, res) => res.sendFile(path.join(__dirname, "result.html")));

/* ✅ 제휴상품 JSON 제공 */
app.get("/affiliate-live", (req, res) => {
  try {
    const data = fs.readFileSync(path.join(__dirname, "affiliate.json"), "utf8");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.send(data);
  } catch (err) {
    console.error("affiliate.json 불러오기 오류:", err);
    res.status(500).json({ error: "파일 로드 오류" });
  }
});

/* ✅ GPT 기반 분석 API */
app.post("/analyze", async (req, res) => {
  try {
    const { topic, answers } = req.body;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      console.error("❌ OpenAI API 키가 없습니다.");
      return res.json({ ok: false, error: "API key missing" });
    }

    const summary = answers.map((a, i) => `Q${i + 1}: ${a}`).join("\n");
    const prompt = `
당신은 시니어 건강 전문가 AI입니다.
주제: ${topic}
사용자의 응답:
${summary}

다음 세 가지를 JSON 형식으로 만들어 주세요:
{"detail":"(3~5문장 분석)", "summary":"(핵심요약 2문장)", "expert":"(전문가 조언 2~3문장)"}
`.trim();

    const gptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });

    const data = await gptResponse.json();
    let resultText = data?.choices?.[0]?.message?.content || "{}";
    let result;
    try {
      result = JSON.parse(resultText);
    } catch {
      result = { detail: resultText, summary: "요약 생성 실패", expert: "전문가 의견 생성 실패" };
    }

    res.json({ ok: true, result });
  } catch (err) {
    console.error("분석 오류:", err);
    res.json({ ok: false, error: "서버 오류" });
  }
});

/* ✅ Render 포트 설정 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ 노을빛하루 AI 서버 실행 중: http://localhost:${PORT}`);
});

/* ✅ 404 처리 */
app.use((req, res) => {
  res.status(404).send(`
    <body style="background:#0d1420;color:#fff;font-family:sans-serif;text-align:center;padding:60px">
      <h2>🚫 페이지를 찾을 수 없습니다.</h2>
      <p>주소를 다시 확인해 주세요.</p>
    </body>
  `);
});
