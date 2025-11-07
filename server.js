import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

// 현재 파일 경로
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env 불러오기
dotenv.config();

// OpenAI 클라이언트 생성
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Express 서버 생성
const app = express();
app.use(cors());
app.use(express.json());

// index.html 제공
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// 분석 API
app.post("/analyze", async (req, res) => {
    try {
        const { answers } = req.body;

        // GPT 요청
        const completion = await client.responses.create({
            model: "gpt-4o-mini",   // ✅ 최신 모델
            input: `
            시니어 건강 분석 챗봇입니다.
            사용자의 선택 답변: ${answers.join(", ")}
            
            아래 형식으로 답변하세요:
            1) 통증 원인 분석
            2) 생활 관리 조언
            3) 필요 시 병원 방문 기준
            4) 추천 건강 정보(시니어 친화적 톤)
            `
        });

        const output = completion.output_text || "분석 결과를 생성하지 못했습니다.";

        res.json({ result: output });

    } catch (error) {
        console.error("🚨 서버 분석 오류:", error);
        res.json({ result: "❌ 서버 오류가 발생했습니다. 다시 시도해주세요." });
    }
});

// 서버 실행
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ 노을빛하루 메가 챗봇 서버 실행됨: http://localhost:${PORT}`);
});
