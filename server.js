// ===============================
// server.js — Noeulbit Haru AI Diagnosis (Render 전용 완전판)
// ===============================
const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// ✅ JSON 즉시 반영 (캐시 방지)
const loadJSON = (fname) => {
  delete require.cache[require.resolve(path.join(__dirname, fname))];
  return JSON.parse(fs.readFileSync(path.join(__dirname, fname), "utf-8"));
};

// ✅ 데이터 로드
const SURVEY_DEF = loadJSON("survey.json");
const ANALYSIS_DEF = loadJSON("analysis.json");

// ===============================
// 1️⃣ 설문 자동 생성
// ===============================
function generateSurvey(topic) {
  const def = SURVEY_DEF[topic];
  if (!def) return null;
  const { count = 10, seeds = [], option_pool = [] } = def;

  const questions = [];
  for (let i = 0; i < count; i++) {
    const seed = seeds[i % seeds.length] || `추가 문항 ${i + 1}`;
    const options = [];
    while (options.length < Math.max(6, def.min_options || 6)) {
      const pick = option_pool[Math.floor(Math.random() * option_pool.length)];
      if (!options.includes(pick)) options.push(pick);
    }
    questions.push({
      id: `q${i + 1}`,
      text: seed,
      options,
    });
  }
  return { topic, questions };
}

// ===============================
// 2️⃣ 위험도 판정 (단순 랜덤 + 키워드 가중)
// ===============================
function pickSeverity(answers) {
  const riskWords = ["심함", "위험", "통증", "호흡", "가슴", "저림", "어지럼"];
  let score = 0;
  (answers || []).forEach((a) => {
    riskWords.forEach((w) => {
      if (a && a.includes(w)) score++;
    });
  });
  const r = Math.random() * (10 + score);
  if (r > 8) return "severe";
  if (r > 4) return "moderate";
  return "mild";
}

// ===============================
// 3️⃣ API — 설문 불러오기
// ===============================
app.get("/api/survey", (req, res) => {
  const topic = req.query.topic;
  const survey = generateSurvey(topic);
  if (!survey) return res.status(404).json({ error: "Unknown topic" });
  res.json(survey);
});

// ===============================
// 4️⃣ API — 결과 분석
// ===============================
app.post("/api/analyze", (req, res) => {
  const { topic, answers } = req.body;
  const tdef = ANALYSIS_DEF[topic];
  if (!tdef) return res.status(404).json({ error: "Unknown topic" });

  const severity = pickSeverity(answers);
  const block = tdef[severity];
  const score =
    severity === "severe"
      ? 85 + Math.floor(Math.random() * 10)
      : severity === "moderate"
      ? 60 + Math.floor(Math.random() * 10)
      : 25 + Math.floor(Math.random() * 10);

  const payload = {
    topic,
    severity,
    risk: block.risk,
    detail: block.detail,
    summary: block.summary,
    opinion: block.opinion,
    graph: { riskScore: score },
    affiliates: {
      products: [
        { name: "추천 영양제 (예시)", url: "#", note: "상품 링크 교체 필요" },
        { name: "오메가3 / 루테인", url: "#", note: "주제별 맞춤 링크" },
      ],
      insurance: [
        { name: "시니어 실손보험", url: "#", note: "보험사 연결 필요" },
        { name: "건강보장 특약", url: "#", note: "연결 링크 교체" },
      ],
    },
  };
  res.json(payload);
});

// ===============================
// 5️⃣ 라우팅
// ===============================
app.get("/", (_, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/question.html", (_, res) =>
  res.sendFile(path.join(__dirname, "question.html"))
);
app.get("/result.html", (_, res) =>
  res.sendFile(path.join(__dirname, "result.html"))
);

// ===============================
// 6️⃣ Render 포트
// ===============================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`✅ Noeulbit Haru AI Diagnosis Running on ${PORT}`)
);
