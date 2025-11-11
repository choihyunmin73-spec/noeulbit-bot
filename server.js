// server.js — Render 전용. 로컬 개발용 코드/도구(예: nodemon) 일절 없음.
const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();

// ---- 기본 설정 ----
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname)); // index.html, question.html, result.html, *.json 정적 서빙

// ---- 파일 로더(캐시 없이 항상 최신 로드) ----
function readJSON(filename) {
  const p = path.join(__dirname, filename);
  const raw = fs.readFileSync(p, "utf-8");
  return JSON.parse(raw);
}

// ---- 건강 분석 엔진 (OpenAI + 규칙 기반 혼합) ----
const USE_OPENAI = !!process.env.OPENAI_API_KEY;
let openai = null;
if (USE_OPENAI) {
  // OpenAI SDK v4
  const OpenAI = require("openai");
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// 위험 단어 사전(가벼운 탐지)
const RISK_WORDS = [
  "심한", "악화", "어려움", "높음", "위험", "즉시", "갑자기", "숨", "통증",
  "가슴", "저림", "실신", "마비", "출혈", "호흡곤란", "실어증", "의식저하",
  "부정맥", "찌릿", "쥐남", "열감", "붓기", "발열", "고열", "구토", "설사",
  "혈뇨", "흑변", "시력저하", "시야장애"
];

// 레벨 산정 기준
function levelFromScore(p) {
  if (p >= 70) return "severe";
  if (p >= 40) return "moderate";
  return "mild";
}

// 규칙 기반 기본 요약/권고 생성기(응답/주제 기반)
function ruleBasedSynthesis(topic, answers, riskPercent) {
  const level = levelFromScore(riskPercent);
  const baseVisit =
    level === "severe" ? "즉시 응급실 내원 또는 119/응급실 이용이 필요합니다." :
    level === "moderate" ? "가까운 시일 내(3일 이내) 진료를 권장합니다." :
    "현재로선 비교적 양호합니다. 생활습관 관리 위주로 경과 관찰하세요.";

  // 15줄 상세(항상 15개)
  const details = [
    `선택 주제는 ‘${topic}’이며, 현재 위험도는 ${level.toUpperCase()} 수준으로 추정됩니다.`,
    `총 응답 ${answers.length}개와 선택 항목의 표현을 기준으로 상태를 분석했습니다.`,
    `위험 신호 단어 감지 결과를 반영해 지표를 계산했습니다.`,
    `현재 상태는 ${level === "mild" ? "비교적 안정적" : level === "moderate" ? "주의가 필요" : "즉각적인 조치가 필요"}한 단계로 판단됩니다.`,
    `증상/불편이 반복되면 지체 없이 전문의 상담을 받으세요.`,
    `수면, 식사, 수분 섭취, 가벼운 활동 등 기본 생활 리듬을 회복하는 것이 중요합니다.`,
    `통증·불편이 지속/악화되면 즉시 의료기관 방문을 고려하세요.`,
    `스트레스 관리와 자세 교정, 무리한 활동 피하기를 권장합니다.`,
    `필요 시 보호자/가족과 증상 기록(발생 시간·유발 요인)을 남기세요.`,
    `복약 중이라면 처방/복용 스케줄을 지키고, 이상반응 시 즉시 상담하세요.`,
    `증상 변화가 심해지거나 새로운 신호가 나타나면 진료를 서두르세요.`,
    `생활관리만으로 불충분하면 물리치료·운동치료·상담치료 등을 검토하세요.`,
    `정기 검진(혈압·혈당·혈중지표 등)으로 기초 상태를 점검하세요.`,
    `필요 시 영양제 보충으로 회복을 돕되, 기존 약과의 상호작용은 확인하세요.`,
    baseVisit
  ];

  // 7줄 요약
  const summary = [
    `주제: ${topic}`,
    `위험도: ${level.toUpperCase()}`,
    `응답 수: ${answers.length}개`,
    `현재 상태: ${level === "mild" ? "양호" : level === "moderate" ? "주의 요망" : "고위험"}`,
    `권장: ${level === "mild" ? "생활관리·경과관찰" : level === "moderate" ? "단기 내 진료 권고" : "즉시 진료/응급"}`,
    `증상 기록/유발 요인 파악 및 반복 여부 관찰`,
    `충분한 휴식·수분·균형 잡힌 식사 유지`
  ];

  // 2줄 전문가 의견
  const opinion = [
    level === "severe"
      ? "증상 경향과 위험 신호 빈도상 고위험 가능성이 큽니다."
      : "응답 기반으로 현재 단계는 정밀 위험 범주에 해당하지 않습니다.",
    level === "severe"
      ? "지체 없이 진료를 받으시고, 위험 신호(가슴통증·호흡곤란·실신 등) 시 응급실을 이용하세요."
      : "생활관리와 정기 점검을 유지하면서 증상 변화를 기록해 주세요."
  ];

  return { details, summary, opinion };
}

// GPT 보조(선택적). 실패 시 규칙 기반으로 대체
async function gptAssist(topic, answers, riskPercent) {
  const { details, summary, opinion } = ruleBasedSynthesis(topic, answers, riskPercent);

  if (!USE_OPENAI) {
    return { details, summary, opinion };
  }

  const sys = `You are a Korean medical-style assistant for seniors.
Return three arrays:
- detail: 15 concise bullet lines
- summary: 7 bullet lines
- opinion: 2 bullet lines
Tone: calm, friendly, non-alarmist. Use polite Korean.`;

  const usr = `주제: ${topic}
위험도 지표: ${riskPercent}
응답(선택항목들): ${answers.join(" | ")}

요청:
- detail 15줄
- summary 7줄
- opinion 2줄
형식: JSON {"detail":[], "summary":[], "opinion":[]}`;

  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: usr }
      ],
      temperature: 0.4
    });
    const text = resp.choices?.[0]?.message?.content?.trim() || "";
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
      const det = Array.isArray(parsed.detail) && parsed.detail.length >= 12 ? parsed.detail.slice(0, 15) : details;
      const sum = Array.isArray(parsed.summary) && parsed.summary.length >= 5 ? parsed.summary.slice(0, 7) : summary;
      const opn = Array.isArray(parsed.opinion) && parsed.opinion.length >= 2 ? parsed.opinion.slice(0, 2) : opinion;
      return { details: det, summary: sum, opinion: opn };
    }
    return { details, summary, opinion };
  } catch {
    return { details, summary, opinion };
  }
}

// 분석 API
app.post("/analyze", async (req, res) => {
  try {
    const { topic, answers } = req.body || {};
    const safeTopic = typeof topic === "string" ? topic : "알 수 없음";
    const arr = Array.isArray(answers) ? answers : [];

    // 위험단어 카운트
    let riskCount = 0;
    for (const a of arr) {
      const s = String(a || "");
      for (const w of RISK_WORDS) {
        if (s.includes(w)) riskCount++;
      }
    }
    // 간단 지표 계산(응답수/위험단어 가중치)
    const base = Math.min(100, arr.length * 4);      // 응답수 1개당 4점
    const risk = Math.min(100, riskCount * 8);       // 위험단어 1개당 8점
    const riskPercent = Math.min(100, Math.round(base * 0.4 + risk * 0.6));
    const level = levelFromScore(riskPercent);

    // GPT/규칙 혼합 생성
    const synth = await gptAssist(safeTopic, arr, riskPercent);

    const result = {
      topic: safeTopic,
      level,
      riskPercent,
      answerCount: arr.length,
      riskWordCount: riskCount,
      detail: synth.details,
      summary: synth.summary,
      opinion: synth.opinion
    };
    return res.json({ ok: true, result });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "analyze_failed" });
  }
});

// 핫 리로드: affiliate.json 변경 감지 없이 항상 최신 로드
app.get("/affiliate-live", (req, res) => {
  try {
    const map = readJSON("affiliate.json");
    res.json(map);
  } catch {
    res.status(500).json({ ok: false });
  }
});

// 라우팅(정적)
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.get("/question", (_req, res) => {
  res.sendFile(path.join(__dirname, "question.html"));
});
app.get("/result", (_req, res) => {
  res.sendFile(path.join(__dirname, "result.html"));
});

// 포트
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Noeulbit Haru AI running on :${PORT}`);
});
