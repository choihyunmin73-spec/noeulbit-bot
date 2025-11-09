// ==============================================
// 🌇 노을빛하루 AI 자동 진단 서버 (문항+결과 자동 생성 버전)
// ==============================================
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// ✅ 기본 페이지 라우팅
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/question.html", (req, res) => res.sendFile(path.join(__dirname, "question.html")));
app.get("/result.html", (req, res) => res.sendFile(path.join(__dirname, "result.html")));

// ✅ survey.json & analysis.json 경로 지정
const surveyPath = path.join(__dirname, "survey.json");
const analysisPath = path.join(__dirname, "analysis.json");

// ✅ 문항 자동 로드 API
app.get("/api/survey/:topic", (req, res) => {
  try {
    const topic = req.params.topic;
    if (!fs.existsSync(surveyPath)) return res.status(500).json({ error: "survey.json 누락" });

    const survey = JSON.parse(fs.readFileSync(surveyPath, "utf8"));
    const questions = survey[topic];

    if (!questions) return res.status(404).json({ error: "해당 주제 문항 없음" });
    res.json({ topic, questions });
  } catch (e) {
    console.error("💥 문항 불러오기 오류:", e);
    res.status(500).json({ error: "서버 내부 오류" });
  }
});

// ✅ AI 자동 분석 API (문항과 결과 모두 자동 생성)
app.post("/api/analyze", (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ success: false, error: "topic 누락" });

    // ✅ 파일 확인
    if (!fs.existsSync(analysisPath)) return res.status(500).json({ success: false, error: "analysis.json 누락" });
    if (!fs.existsSync(surveyPath)) return res.status(500).json({ success: false, error: "survey.json 누락" });

    const survey = JSON.parse(fs.readFileSync(surveyPath, "utf8"));
    const analysis = JSON.parse(fs.readFileSync(analysisPath, "utf8"));
    const category = analysis[topic];

    if (!category) return res.status(404).json({ success: false, error: `${topic} 주제 데이터 없음` });

    // ✅ AI가 자동으로 질문/답변 선택
    const questions = survey[topic] || [];
    const randomAnswers = questions.map(q => `${q.split(" ")[0]} 관련 있음`);

    // ✅ 위험 단계 자동 랜덤 선택 (mild / moderate / severe)
    const levels = ["mild", "moderate", "severe"];
    const selectedLevel = levels[Math.floor(Math.random() * levels.length)];
    const result = category[selectedLevel];

    if (!result) return res.status(404).json({ success: false, error: "결과 데이터 누락" });

    console.log(`✅ [${topic}] 자동 결과 (${selectedLevel}) 생성 완료`);

    res.json({
      success: true,
      topic,
      level: selectedLevel,
      risk: result.risk,
      questions,
      answers: randomAnswers,
      detail: result.detail,
      summary: result.summary,
      opinion: result.opinion
    });
  } catch (err) {
    console.error("💥 분석 오류:", err);
    res.status(500).json({ success: false, error: "서버 내부 오류" });
  }
});

// ✅ 헬스 체크 (Render용)
app.get("/health", (req, res) => {
  res.json({ ok: true, message: "노을빛하루 서버 정상 작동 중 ✅" });
});

// ✅ 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중 on port ${PORT}`);
});
