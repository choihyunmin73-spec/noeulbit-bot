// ==============================================
// 🌇 노을빛하루 AI 종합 진단 서버 (최신 안정 완전 교체본)
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

// ✅ 분석 API (AI 진단 결과 처리)
app.post("/api/analyze", (req, res) => {
  try {
    const { topic, answers } = req.body;
    console.log("📨 요청 수신:", topic, answers);

    if (!topic || !answers || !Array.isArray(answers)) {
      console.log("❌ 요청 데이터 누락 또는 형식 오류");
      return res.status(400).json({ success: false, error: "데이터 형식이 올바르지 않습니다." });
    }

    // ✅ analysis.json 로드
    const analysisPath = path.join(__dirname, "analysis.json");
    if (!fs.existsSync(analysisPath)) {
      console.log("❌ analysis.json 파일이 존재하지 않습니다.");
      return res.status(500).json({ success: false, error: "analysis.json 누락" });
    }

    const data = JSON.parse(fs.readFileSync(analysisPath, "utf8"));
    const category = data[topic];

    if (!category) {
      console.log(`❌ ${topic} 주제 데이터 없음`);
      return res.status(404).json({ success: false, error: "해당 주제 데이터가 없습니다." });
    }

    // ✅ 단순 분류 (임시: 랜덤하게 mild/moderate/severe 선택)
    const severityKeys = Object.keys(category);
    const chosenKey = severityKeys[Math.floor(Math.random() * severityKeys.length)];
    const result = category[chosenKey];

    if (!result) {
      console.log(`❌ ${topic} 결과 누락 (${chosenKey})`);
      return res.status(500).json({ success: false, error: "결과 데이터 누락" });
    }

    console.log(`✅ 결과 생성 완료: ${topic} (${chosenKey})`);
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
    return res.status(500).json({ success: false, error: "서버 내부 오류 발생" });
  }
});

// ✅ 헬스체크 (Render / 로컬 공용)
app.get("/health", (req, res) => {
  res.json({ ok: true, message: "✅ 노을빛하루 서버 정상 작동 중" });
});

// ✅ 서버 실행
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 서버 실행 중 on port", PORT);
  console.log("📁 정적 경로:", __dirname);
});
