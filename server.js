// ===============================
// ✅ 노을빛하루 AI 건강·생활 진단 서버 (완전 교체본)
// ===============================
const express = require("express");
const path = require("path");
const fs = require("fs");
const fetch = require("node-fetch");

const app = express();

app.use(express.json());
app.use(express.static(__dirname)); // ✅ HTML, JS, CSS, JSON 접근 허용

// ===============================
// ✅ 페이지 라우팅
// ===============================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/question", (req, res) => {
  res.sendFile(path.join(__dirname, "question.html"));
});

app.get("/result", (req, res) => {
  res.sendFile(path.join(__dirname, "result.html"));
});

// ===============================
// ✅ 설문 데이터 로드 (survey.json)
// ===============================
app.get("/survey", (req, res) => {
  const filePath = path.join(__dirname, "survey.json");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      console.error("❌ survey.json 로드 실패:", err);
      return res.status(500).json({ error: "설문 데이터를 불러올 수 없습니다." });
    }
    try {
      res.json(JSON.parse(data));
    } catch (parseErr) {
      console.error("❌ JSON 파싱 오류:", parseErr);
      res.status(500).json({ error: "설문 데이터 파싱 오류" });
    }
  });
});

// ===============================
// ✅ 결과 분석 엔진
// ===============================
app.post("/analyze", async (req, res) => {
  try {
    const { topic, checks } = req.body;
    if (!topic || !checks) {
      return res.status(400).json({ error: "topic 또는 checks 누락" });
    }

    // 간단한 로컬 분석 로직
    const riskWords = ["심함", "악화", "어려움", "높음", "위험", "즉시", "갑자기", "숨", "통증", "가슴", "저림"];
    let riskScore = 0;
    checks.forEach((c) => {
      riskWords.forEach((r) => {
        if (c.includes(r)) riskScore++;
      });
    });

    let severity = "낮음";
    if (riskScore >= 6) severity = "높음";
    else if (riskScore >= 3) severity = "중간";

    const summary =
      severity === "높음"
        ? "전문가 진료가 필요할 수 있습니다."
        : severity === "중간"
        ? "조기 관리 및 주기적 관찰이 필요합니다."
        : "생활 관리로 충분히 조절 가능한 상태입니다.";

    const deptMap = {
      "관절 통증": "정형외과",
      "혈압 관리": "순환기내과",
      "혈당·당뇨": "내분비내과",
      "불면증·수면장애": "신경과",
      "어깨·목 통증": "정형외과",
      "심장·호흡·가슴통증": "순환기내과 / 호흡기내과",
      "노안·시력저하": "안과",
      "치매·기억력 문제": "신경과",
      "전립선·배뇨 문제": "비뇨의학과",
      "종합 건강 체크": "가정의학과",
      "보이스피싱 예방": "해당 없음",
      "복지·생활지원금": "해당 없음"
    };

    const result = {
      topic,
      severity,
      summary,
      dept: deptMap[topic] || "상담 필요",
      advice: [
        "규칙적인 수면과 균형 잡힌 식사를 유지하세요.",
        "스트레스를 줄이고 가벼운 운동을 권장합니다.",
        "증상이 심해지면 가까운 병원을 방문하세요."
      ]
    };

    res.json(result);
  } catch (err) {
    console.error("❌ 분석 중 오류:", err);
    res.status(500).json({ error: "분석 중 서버 오류 발생" });
  }
});

// ===============================
// ✅ 서버 실행
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
