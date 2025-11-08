// ===============================
// ✅ Basic Express Server
// ===============================
const express = require("express");
const path = require("path");
const fetch = require("node-fetch");

const app = express();

app.use(express.json());
app.use(express.static(__dirname)); // ✅ HTML, JS, CSS 서빙

// ===============================
// ✅ 기본 페이지 라우팅
// ===============================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/question.html", (req, res) => {
  res.sendFile(path.join(__dirname, "question.html"));
});

app.get("/result", (req, res) => {
  res.sendFile(path.join(__dirname, "result.html"));
});

// ===============================
// ✅ Topic 분석 엔진 (기존 기능 유지)
// ===============================
function analyzeTopic(topic, checks) {
  const riskWords = ["심함", "악화", "어려움", "높음", "위험", "즉시", "갑자기", "숨", "통증", "가슴", "저림"];

  let riskScore = 0;
  checks.forEach(c => {
    riskWords.forEach(r => {
      if (c.includes(r)) riskScore++;
    });
  });

  let severity = "낮음";
  if (riskScore >= 6) severity = "높음";
  else if (riskScore >= 3) severity = "중간";

  let action = "생활 관리가 필요합니다.";
  if (severity === "높음") action = "전문가 상담이 권장됩니다.";
  if (severity === "중간") action = "조기 관리 및 관찰이 필요합니다.";

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

  const tipsCommon = [
    "충분한 수분 섭취",
    "가벼운 스트레칭",
    "규칙적 수면 유지",
    "짧은 산책으로 활동량 증가",
    "과로 피하고 휴식"
  ];

  const redFlags = [];
  checks.forEach(c => {
    if (c.includes("숨") || c.includes("가슴"))
      redFlags.push("가슴 통증 또는 호흡 곤란 발생 시 즉시 진료 필요");
    if (c.includes("갑자기"))
      redFlags.push("갑작스러운 증상 변화는 위험 신호일 수 있습니다");
    if (c.includes("심함"))
      redFlags.push("일상생활 지장·심한 통증은 진료 필요");
  });

  return {
    topic,
    checks,
    severity,
    action,
    dept: deptMap[topic] || "상담 필요",
    tips: tipsCommon,
    redflags: redFlags
  };
}

// ===============================
// ✅ /analyze API (기존 기능 유지)
// ===============================
app.post("/analyze", (req, res) => {
  const { topic, checks } = req.body;

  if (!topic || !checks) {
    return res.json({ error: "invalid request" });
  }

  const result = analyzeTopic(topic, checks);
  res.json(result);
});

// ===============================
// ✅ GPT API – /api/chat
// ===============================
app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage) {
      return res.status(400).json({ error: "Message required" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY missing" });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: userMessage }]
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "(no response)";

    res.json({ reply });
  } catch (err) {
    console.error("GPT API Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===============================
// ✅ Render 포트
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
