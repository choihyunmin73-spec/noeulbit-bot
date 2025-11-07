import express from "express";
import cors from "cors";
import { OpenAI } from "openai";

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* ✅ 모든 주제를 AI가 자동 분석하는 엔드포인트 */
app.post("/analyze", async (req, res) => {
  try {
    const { topic, answers } = req.body;

    const topicNames = {
      joint: "무릎·관절",
      bp: "혈압",
      sugar: "혈당·당뇨",
      scam: "보이스피싱",
      welfare: "복지·지원금",
      phone: "스마트폰 문제",
      sleep: "불면증·수면",
      senior_ins: "시니어 보험·건강보험"
    };

    const name = topicNames[topic] || topic;

    const prompt = `
당신은 시니어에게 쉬운 표현으로 설명하는 전문 상담가입니다.
아래 정보를 기반으로 건강/생활 상태를 분석하세요.

[주제] ${name}
[사용자 답변] ${answers.join(", ")}

아래 형식을 꼭 지키세요:

1) 현재 상태 요약
2) 위험 신호 여부 (필요한 경우만)
3) 생활 개선 방법 3~5개
4) 병원·전문가 상담이 필요한 기준
5) 너무 어렵지 않게, 따뜻한 말투로

반말 금지. 의료 진단처럼 단정 금지.
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.35
    });

    res.json({ result: completion.choices[0].message.content });

  } catch (err) {
    res.json({ result: "❌ AI 분석 중 오류가 발생했습니다." });
  }
});

app.listen(3000, () => console.log("✅ AI 분석 서버 실행 중"));
