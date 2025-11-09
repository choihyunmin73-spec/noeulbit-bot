// ==============================================
// 🌇 노을빛하루 AI 종합 진단 서버 (AI 자동 선택항목 버전)
// ==============================================
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// ✅ 기본 라우팅
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/question.html", (req, res) => res.sendFile(path.join(__dirname, "question.html")));
app.get("/result.html", (req, res) => res.sendFile(path.join(__dirname, "result.html")));

// ✅ 자동 선택항목 생성 함수
function generateOptions(question) {
  // 기본 6개 자동 선택항목
  return [
    "전혀 해당 없음",
    "조금 해당됨",
    "보통",
    "자주 해당됨",
    "항상 해당됨",
    "잘 모르겠음"
  ];
}

// ✅ 분석 API
app.post("/api/analyze", (req, res) => {
  try {
    console.log("📨 요청 수신:", req.body);

    const { topic, answers } = req.body;
    if (!topic || !answers) {
      console.log("❌ topic 또는 answers 누락");
      return res.status(400).json({ success: false, error: "데이터 누락" });
    }

    const analysisPath = path.join(__dirname, "analysis.json");
    if (!fs.existsSync(analysisPath)) {
      console.log("❌ analysis.json 파일 없음");
      return res.status(500).json({ success: false, error: "analysis.json 누락" });
    }

    const data = JSON.parse(fs.readFileSync(analysisPath, "utf8"));
    const category = data[topic];
    if (!category) {
      console.log(`❌ ${topic} 주제 데이터 없음`);
      return res.status(404).json({ success: false, error: "해당 주제 데이터 없음" });
    }

    // 결과 기본 선택 (가중치 없이 임시 계산)
    const rand = Math.floor(Math.random() * 3);
    const result =
      rand === 0 ? category.mild :
      rand === 1 ? category.moderate :
      category.severe;

    console.log("✅ 결과 전송 성공:", topic);
    return res.json({
      success: true,
      topic,
      risk: result.risk,
      detail: result.detail,
      summary: result.summary,
      opinion: result.opinion
    });
  } catch (err) {
    console.error("💥 서버 내부 오류:", err);
    return res.status(500).json({ success: false, error: "서버 내부 오류" });
  }
});

// ✅ 문항 로드 API (AI 자동 선택지 생성)
app.get("/api/survey/:topic", (req, res) => {
  try {
    const topic = req.params.topic;
    const surveyPath = path.join(__dirname, "survey.json");

    if (!fs.existsSync(surveyPath)) {
      return res.status(500).json({ success: false, error: "survey.json 누락" });
    }

    const data = JSON.parse(fs.readFileSync(surveyPath, "utf8"));
    const questions = data[topic];
    if (!questions) {
      return res.status(404).json({ success: false, error: "해당 주제 문항 없음" });
    }

    // 각 문항에 자동 선택항목 6개 부여
    const enriched = questions.map(q => ({
      q,
      opt: generateOptions(q)
    }));

    return res.json({ success: true, topic, questions: enriched });
  } catch (err) {
    console.error("💥 설문 로드 오류:", err);
    return res.status(500).json({ success: false, error: "설문 로드 실패" });
  }
});

// ✅ 헬스체크 (Render 배포 확인용)
app.get("/health", (req, res) => {
  res.json({ ok: true, message: "노을빛하루 서버 정상 작동 중 ✅" });
});

// ✅ 서버 구동
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 서버 실행 중 on port", PORT);
  console.log("📁 정적 경로:", __dirname);
});
