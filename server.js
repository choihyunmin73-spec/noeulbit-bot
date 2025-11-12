import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

/* ✅ 기본 라우팅 */
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/question.html", (req, res) => res.sendFile(path.join(__dirname, "question.html")));
app.get("/loading.html", (req, res) => res.sendFile(path.join(__dirname, "loading.html")));
app.get("/result.html", (req, res) => res.sendFile(path.join(__dirname, "result.html")));

/* ✅ GPT 기반 분석 API */
app.post("/analyze", async (req, res) => {
  try {
    const { topic, answers } = req.body;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      console.error("❌ OpenAI API 키가 설정되어 있지 않습니다.");
      return res.json({ ok: false, error: "API key missing" });
    }

    // ✅ 위험도 계산
    const riskWords = ["심함","악화","어려움","높음","위험","즉시","갑자기","숨","통증","가슴","저림"];
    let riskCount = 0;
    answers.forEach(a => {
      riskWords.forEach(r => {
        if (a.includes(r)) riskCount++;
      });
    });
    const riskScore = Math.min(Math.round((riskCount / (answers.length * 0.8)) * 100), 100);

    // ✅ GPT 분석 프롬프트
    const answerSummary = answers.map((a, i) => `Q${i + 1}: ${a}`).join("\n");
    const prompt = `
당신은 시니어 건강 전문가 AI입니다.
주제: ${topic}
사용자의 응답:
${answerSummary}

이 데이터를 기반으로 다음 3가지를 생성하세요:
1. 상세 진단 결과 (3~5문장)
2. 핵심 요약 (1~2문장)
3. 전문가 조언 (2~3문장, 현실적인 행동 조언)
출력은 JSON 형태로:
{"detail":"...","summary":"...","expert":"..."}
    `.trim();

    // ✅ OpenAI 호출
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
    let text = data?.choices?.[0]?.message?.content || "{}";
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { detail: text, summary: "요약 생성 실패", expert: "전문가 의견 생성 실패" };
    }

    // ✅ 최종 응답
    res.json({
      ok: true,
      result: {
        detail: parsed.detail,
        summary: parsed.summary,
        expert: parsed.expert,
        riskCount,
        riskScore
      }
    });

  } catch (err) {
    console.error("❌ 분석 오류:", err);
    res.json({ ok: false, error: "서버 오류" });
  }
});

/* ✅ Render 서버 포트 설정 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ 노을빛하루 AI 서버 실행 중: http://localhost:${PORT}`);
});

/* ✅ 404 예외 처리 */
app.use((req, res) => {
  res.status(404).send(`
    <body style="background:#0d1420;color:#fff;font-family:sans-serif;text-align:center;padding:60px">
      <h2>🚫 페이지를 찾을 수 없습니다.</h2>
      <p>주소를 다시 확인해 주세요.</p>
    </body>
  `);
});
