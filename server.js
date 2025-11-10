/* ================================
   ✅ server.js — 완전 교체본
   ================================ */
const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

/* ✅ 정적 페이지 라우팅 */
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/question.html", (req, res) => res.sendFile(path.join(__dirname, "question.html")));
app.get("/result.html", (req, res) => res.sendFile(path.join(__dirname, "result.html")));

/* ✅ affiliate.json 자동 로드 */
let affiliateData = {};
const AFF_PATH = path.join(__dirname, "affiliate.json");
function loadAffiliate() {
  try {
    const raw = fs.readFileSync(AFF_PATH, "utf8");
    affiliateData = JSON.parse(raw);
    console.log("✅ affiliate.json 로드 완료");
  } catch (err) {
    console.error("❌ affiliate.json 로드 실패:", err);
  }
}
loadAffiliate();
fs.watchFile(AFF_PATH, () => {
  console.log("♻️ affiliate.json 변경 감지 → 자동 재로드");
  loadAffiliate();
});

/* ✅ analysis.json 로드 */
const ANA_PATH = path.join(__dirname, "analysis.json");
let analysisData = {};
try {
  analysisData = JSON.parse(fs.readFileSync(ANA_PATH, "utf8"));
  console.log("✅ analysis.json 로드 완료");
} catch (e) {
  console.error("❌ analysis.json 로드 실패:", e);
}

/* ✅ 분석 API */
app.post("/analyze", (req, res) => {
  const { topic, answers } = req.body;
  if (!topic || !Array.isArray(answers)) {
    return res.status(400).json({ error: "topic 또는 answers 누락" });
  }

  // 위험단어 감지
  const RISK_WORDS = ["심함","매우","악화","어려움","위험","즉시","갑자기","숨","통증","가슴","저림","두근","불규칙","실신","호흡곤란","혈변","흑변","출혈","마비","고열"];
  const riskHits = answers.reduce((acc, a) => {
    const hit = RISK_WORDS.reduce((n, w) => n + (String(a).includes(w) ? 1 : 0), 0);
    return acc + hit;
  }, 0);

  // 점수 계산
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const base = Math.min(answers.length, 8) * 6;
  const risk = clamp(riskHits * 12, 0, 60);
  const score = clamp(base + risk, 0, 100);

  // 위험 등급
  let level = "mild";
  if (score >= 70) level = "severe";
  else if (score >= 40) level = "moderate";

  // 분석 json 연결
  const ana = analysisData?.[topic]?.[level];
  const detailLines = ana?.detail?.split("\n") || [];
  const summaryLines = ana?.summary ? ana.summary.split("\n") : [];
  const opinionLines = ana?.opinion ? ana.opinion.split("\n") : [];

  // 영양제 추천
  const supplements = affiliateData?.[topic] || [];

  // 결과 구성
  const result = {
    topic,
    level,
    riskScore: score,
    answersCount: answers.length,
    riskWords: riskHits,
    detail: detailLines,
    summary: summaryLines,
    opinion: opinionLines,
    supplements
  };

  res.json(result);
});

/* ✅ 서버 시작 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});
