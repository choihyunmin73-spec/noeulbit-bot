// server.js — Noeulbit Haru AI Auto Diagnosis (Render Only)
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.static(__dirname)); // index.html, question.html, result.html 정적서빙

// ---------- JSON 로드 유틸 ----------
const loadJSON = (fname) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, fname), "utf-8"));

const SURVEY_DEF = loadJSON("survey.json");      // 확장형 정의(시드+옵션풀)
const ANALYSIS_DEF = loadJSON("analysis.json");  // 12개 주제 × 3단계 결과문구

// ---------- 설문 자동 생성(확장형) ----------
function generateSurvey(topic) {
  const def = SURVEY_DEF[topic];
  if (!def) return null;

  const { count = 10, seeds = [], option_pool = [], style = "multi" } = def;

  // 질문 뽑기: 시드가 부족하면 자동 혼합 생성
  const questions = [];
  const basePool = seeds.slice();

  // 자동 생성(시드가 count보다 적으면 변형 생성)
  let i = 0;
  while (questions.length < count) {
    const seed = basePool[i % basePool.length] || `추가 문항 ${i + 1}`;
    // 간단 변형
    const variant =
      i < seeds.length
        ? seed
        : seed.replace(/(있나요|있습니까|하시나요|하십니까|중인가요|인가요)/g, (m) => {
            const alts = ["한가요", "체크해볼까요", "인지가요", "여부를 알려주세요"];
            return alts[Math.floor(Math.random() * alts.length)];
          });

    // 보기 6개 이상 자동 뽑기(중복 제거)
    const opts = [];
    const used = new Set();
    while (opts.length < Math.max(6, def.min_options || 6)) {
      const pick = option_pool[Math.floor(Math.random() * option_pool.length)];
      if (!used.has(pick)) {
        used.add(pick);
        opts.push(pick);
      }
      if (used.size === option_pool.length) break;
    }

    questions.push({
      id: `q${questions.length + 1}`,
      text: variant,
      type: style === "scale" ? "scale" : "single", // 기본 단일선택
      options: style === "scale" ? ["없음", "가끔", "자주", "심함", "매우 심함"] : opts,
    });
    i++;
  }
  return { topic, questions };
}

// ---------- 위험도 자동 선택(랜덤) + 점수화 ----------
function pickSeverity(answers) {
  // 답변에 위험단어가 많을수록 높은 단계가 나올 확률 약간 증가
  const riskWords = ["심함", "매우 심함", "위험", "통증", "호흡", "가슴", "저림", "어지럼", "빈맥", "고혈압", "고혈당"];
  let score = 0;
  (answers || []).forEach((a) => {
    riskWords.forEach((w) => {
      if (typeof a === "string" && a.includes(w)) score += 1;
      if (Array.isArray(a) && a.some((x) => String(x).includes(w))) score += 1;
    });
  });

  // 가중 랜덤
  const r = Math.random() * (10 + score);
  if (r > 8) return "severe";
  if (r > 4) return "moderate";
  return "mild";
}

// ---------- API ----------
// 설문 가져오기(자동 생성)
app.get("/api/survey", (req, res) => {
  const topic = req.query.topic;
  const survey = generateSurvey(topic);
  if (!survey) return res.status(404).json({ error: "Unknown topic" });
  res.json(survey);
});

// 분석 사전정의 가져오기(디버그/점검용)
app.get("/api/analysis", (req, res) => {
  res.json({ topics: Object.keys(ANALYSIS_DEF) });
});

// 결과 분석
app.post("/api/analyze", (req, res) => {
  const { topic, answers } = req.body || {};
  if (!topic) return res.status(400).json({ error: "topic required" });

  const tdef = ANALYSIS_DEF[topic];
  if (!tdef) return res.status(404).json({ error: "Unknown topic" });

  const severity = pickSeverity(answers || []);
  const block = tdef[severity];

  // 간단한 점수 & 그래프 수치(0~100)
  const graphScore =
    severity === "severe" ? 85 + Math.floor(Math.random() * 10)
    : severity === "moderate" ? 55 + Math.floor(Math.random() * 15)
    : 20 + Math.floor(Math.random() * 20);

  const payload = {
    topic,
    severity,                 // mild/moderate/severe
    risk: block.risk,
    detail: block.detail,
    summary: block.summary,
    opinion: block.opinion,
    graph: { riskScore: graphScore }, // 좌측 그래프용
    affiliates: {
      // 우측 제휴 박스(링크는 사용자가 교체)
      products: [
        { name: "관절 영양제(예시)", url: "#", note: "해당 주제에 맞게 교체" },
        { name: "오메가3(예시)", url: "#", note: "해당 주제에 맞게 교체" },
      ],
      insurance: [
        { name: "시니어 실손보험(예시)", url: "#", note: "해당 주제에 맞게 교체" },
        { name: "암/뇌심혈관 특약(예시)", url: "#", note: "해당 주제에 맞게 교체" },
      ],
    },
  };

  res.json(payload);
});

// 라우팅
app.get("/", (_, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/question.html", (_, res) => res.sendFile(path.join(__dirname, "question.html")));
app.get("/result.html", (_, res) => res.sendFile(path.join(__dirname, "result.html")));

// Render 포트
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Noeulbit Haru AI running on ${PORT}`));
