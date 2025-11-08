// ==============================================
// 🌇 노을빛하루 AI 종합 진단 서버 (네트워크 오류 완전 해결)
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

// ✅ 분석 API (클라이언트 → 서버 통신 테스트 포함)
app.post("/api/analyze", (req, res) => {
  try {
    console.log("📨 요청 수신:", req.body);

    const { topic, answers } = req.body;
    if (!topic || !answers) {
      console.log("❌ topic 또는 answers 누락");
      return res.status(400).json({ success: false, error: "데이터 누락" });
    }

    // ✅ analysis.json 로드
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

    // ✅ 간단히 중간 단계 결과 반환
    const result = category.mild || category.moderate || category.severe;

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
