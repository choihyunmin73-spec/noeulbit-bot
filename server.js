// ==============================================
// 🌇 노을빛하루 AI 자동 진단 서버 (완성본)
// ==============================================
const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();

// ✅ CORS 허용 (Render / 로컬 / 프론트엔드 모두)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.use(express.json());
app.use(express.static(__dirname));

// ✅ 기본 페이지 라우팅
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/question.html", (req, res) => res.sendFile(path.join(__dirname, "question.html")));
app.get("/result.html", (req, res) => res.sendFile(path.join(__dirname, "result.html")));

// ✅ 파일 경로
const surveyPath = path.join(__dirname, "survey.json");
const analysisPath = path.join(__dirname, "analysis.json");

// ✅ 문항 자동 로드 API
app.get("/api/survey/:topic", (req, res) => {
  try {
    const topic = req.params.topic;
    if (!fs.existsSync(surveyPath))
      return res.json({ success: false, error: "survey.json 누락" });

    const survey = JSON.parse(fs.readFileSync(surveyPath, "utf8"));
    const questions = survey[topic];

    if (!questions)
      return res.json({ success: false, error: "해당 주제 문항 없음" });

    res.json({ success: true, topic, questions });
  } catch (e) {
    console.error("💥 문항 불러오기 오류:", e);
    res.json({ success: false, error: "서버 내부 오류" });
  }
});

// ✅ AI 자동 분석 API (문항 + 결과 자동 생성)
app.post("/api/analyze", (req, res) => {
  try {
    const { topic, answers = [] } = req.body;
    if (!topic)
      return res.json({ success: false, error: "topic 누락" });

    // 파일 확인
    if (!fs.existsSync(analysisPath))
      return res.json({ success: false, error: "analysis.json 누락" });
    if (!fs.existsSync(surveyPath))
      return res.json({ success: false, error: "survey.json 누락" });

    const survey = JSON.parse(fs.readFileSync(surveyPath, "utf8"));
    const analysis = JSON.parse(fs.readFileSync(analysisPath, "utf8"));
    const category = analysis[topic];

    if (!category)
      return res.json({ success: false, error: `${topic} 주제 데이터 없음` });

    // ✅ AI가 문항 기반으로 자동 답변 생성
    const questions = survey[topic] || [];
    const userAnswers = answers.length ? answers : questions.map(q => `${q.split(" ")[0]} 관련 있음`);

    // ✅ 위험 단계 자동 랜덤 선택
    const levels = ["mild", "moderate", "severe"];
    const selectedLevel = levels[Math.floor(Math.random() * levels.length)];
    const result = category[selectedLevel];

    if (!result)
      return res.json({ success: false, error: "결과 데이터 누락" });

    console.log(`✅ [${topic}] 자동 결과 (${selectedLevel}) 생성 완료`);

    // ✅ 표준 응답 구조
    res.json({
      success: true,
      topic,
      level: selectedLevel,
      risk: result.risk,
      questions,
      answers: userAnswers,
      detail: result.detail,
      summary: result.summary,
      opinion: result.opinion
    });
  } catch (err) {
    console.error("💥 분석 오류:", err);
    res.json({ success: false, error: "서버 내부 오류" });
  }
});

// ✅ 헬스 체크 (Render용)
app.get("/health", (req, res) => {
  res.json({ ok: true, message: "노을빛하루 서버 정상 작동 중 ✅" });
});

// ✅ 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 노을빛하루 서버 실행 중 on port ${PORT}`);
});
