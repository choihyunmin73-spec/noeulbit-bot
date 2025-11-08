//-------------------------------------------------------------
// 🌇 Noeulbit Haru AI 종합진단 서버 (완전 교체본)
//-------------------------------------------------------------
const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();

// ✅ JSON 본문 처리
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ 정적 리소스 제공 (이미지, CSS, JS, HTML 포함)
app.use(express.static(__dirname, { extensions: ["html"] }));

// ✅ 기본 라우팅
app.get("/", (req, res) => {
  console.log("✅ [접속] index.html 로드됨");
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/question", (req, res) => {
  console.log("✅ [접속] question.html 로드됨");
  res.sendFile(path.join(__dirname, "question.html"));
});

app.get("/result", (req, res) => {
  console.log("✅ [접속] result.html 로드됨");
  res.sendFile(path.join(__dirname, "result.html"));
});

// ✅ JSON 데이터 로드 API (필요 시 fetch용)
app.get("/data/analysis", (req, res) => {
  const filePath = path.join(__dirname, "analysis.json");
  try {
    const data = fs.readFileSync(filePath, "utf8");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.send(data);
    console.log("📊 [데이터] analysis.json 전송 완료");
  } catch (err) {
    console.error("❌ analysis.json 로드 오류:", err);
    res.status(500).json({ error: "analysis.json 파일을 읽을 수 없습니다." });
  }
});

app.get("/data/affiliate", (req, res) => {
  const filePath = path.join(__dirname, "affiliate.json");
  try {
    const data = fs.readFileSync(filePath, "utf8");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.send(data);
    console.log("📦 [데이터] affiliate.json 전송 완료");
  } catch (err) {
    console.error("❌ affiliate.json 로드 오류:", err);
    res.status(500).json({ error: "affiliate.json 파일을 읽을 수 없습니다." });
  }
});

app.get("/data/survey", (req, res) => {
  const filePath = path.join(__dirname, "survey.json");
  try {
    const data = fs.readFileSync(filePath, "utf8");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.send(data);
    console.log("🧠 [데이터] survey.json 전송 완료");
  } catch (err) {
    console.error("❌ survey.json 로드 오류:", err);
    res.status(500).json({ error: "survey.json 파일을 읽을 수 없습니다." });
  }
});

// ✅ 헬스체크 (Render 빌드 확인용)
app.get("/health", (req, res) => {
  res.status(200).send("OK - Noeulbit Haru AI Server is running ✅");
});

// ✅ 서버 실행 (Render/Vercel 호환)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 [SERVER STARTED]");
  console.log(`🌇 Noeulbit Haru AI Diagnostic Server running on port ${PORT}`);
  console.log("📂 Serving static files from:", __dirname);
});
