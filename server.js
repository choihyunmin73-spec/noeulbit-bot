// ==========================================
// 🌇 노을빛하루 AI 종합 진단 서버 (완전 교체본)
// ==========================================

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.static(__dirname)); // 정적 파일 (HTML/CSS/JS)

// ----------------------------------------------------
// ✅ 기본 라우트: index, question, result
// ----------------------------------------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/question.html", (req, res) => {
  res.sendFile(path.join(__dirname, "question.html"));
});

app.get("/result.html", (req, res) => {
  res.sendFile(path.join(__dirname, "result.html"));
});

// ----------------------------------------------------
// ✅ 분석 요청 처리 (결과 전송)
// ----------------------------------------------------
app.post("/api/analyze", (req, res) => {
  try {
    const { topic, answers } = req.body;

    if (!topic || !answers) {
      return res.status(400).json({
        success: false,
        message: "입력 데이터가 누락되었습니다."
      });
    }

    console.log("📩 [AI 요청 수신]", topic, answers.length + "개 문항");

    // 📂 analysis.json 로드
    const analysisPath = path.join(__dirname, "analysis.json");
    const analysisData = JSON.parse(fs.readFileSync(analysisPath, "utf8"));

    // ✅ 주제 기반 분석 데이터 가져오기
    const category = analysisData[topic];
    if (!category) {
      return res.status(404).json({
        success: false,
        message: `해당 주제(${topic})에 대한 분석 데이터가 없습니다.`
      });
    }

    // ✅ 예시로 첫 번째 섹션을 반환
    const result = category.mild || category.moderate || category.severe;

    // ✅ 반환 데이터
    return res.json({
      success: true,
      topic,
      risk: result.risk,
      detail: result.detail,
      summary: result.summary,
      opinion: result.opinion
    });
  } catch (error) {
    console.error("❌ 분석 처리 중 오류:", error);
    return res.status(500).json({
      success: false,
      message: "서버 내부 오류가 발생했습니다."
    });
  }
});

// ----------------------------------------------------
// ✅ 서버 구동
// ----------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 [SERVER STARTED] 노을빛하루 서버 실행 중 (포트: ${PORT})`);
  console.log(`📂 정적 파일 경로: ${__dirname}`);
});
