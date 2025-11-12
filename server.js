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

다음 세 가지를 JSON 형식
