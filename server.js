const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();

app.use(express.json());
app.use(express.static(__dirname)); // ✅ HTML, CSS, JS 등 정적 파일 접근 허용

// ✅ 메인 페이지
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ✅ 설문 페이지
app.get("/question", (req, res) => {
  res.sendFile(path.join(__dirname, "question.html"));
});

// ✅ 결과 페이지 (여기 누락되면 Cannot GET /result 발생)
app.get("/result", (req, res) => {
  res.sendFile(path.join(__dirname, "result.html"));
});

// ✅ 설문 데이터 로드
app.get("/survey", (req, res) => {
  fs.readFile(path.join(__dirname, "survey.json"), "utf8", (err, data) => {
    if (err) {
      console.error("survey.json 읽기 오류:", err);
      res.status(500).send("설문 데이터를 불러올 수 없습니다.");
    } else {
      res.json(JSON.parse(data));
    }
  });
});

// ✅ AI 분석용 예시 API (결과 페이지 생성용)
app.post("/analyze", (req, res) => {
  const { topic, answers } = req.body;

  // 간단한 AI 결과 예시 (원래는 맞춤 분석 로직)
  const result = {
    title: `${topic} 진단 결과`,
    summary: `${answers.length}개의 응답을 기반으로 한 간단한 분석 결과입니다.`,
    recommendation: "필요시 전문가 상담을 권장합니다."
  };

  res.json(result);
});

// ✅ 포트 설정
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
