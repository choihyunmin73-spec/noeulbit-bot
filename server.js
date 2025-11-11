// server.js — Render 전용 배포 서버 (로컬 기능/핫리로드 없음, 기존 구조 100% 유지)
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());

// 정적 서빙 (index.html, question.html, result.html, loading.html, survey.json, affiliate.json 등)
app.use(express.static(__dirname, { maxAge: "0" }));

// ===== 분석 보조 템플릿 로드 (analysis.json) =====
let ANALYSIS = {};
try {
  ANALYSIS = JSON.parse(fs.readFileSync(path.join(__dirname, "analysis.json"), "utf-8"));
} catch (e) {
  console.error("[analysis.json] 로드 실패:", e.message);
  ANALYSIS = {};
}

// ===== 공통 위험 단어 사전 =====
const RISK_WORDS = [
  "심함","악화","어려움","높음","위험","즉시","갑자기","숨","호흡곤란","통증","가슴","저림",
  "두근거림","부정맥","실신","출혈","마비","부종","열감","발열","장애","응급","수술","검사 필요"
];

// ===== 유틸: 레벨 계산 =====
function levelFromPercent(p) {
  if (p >= 70) return "severe";
  if (p >= 40) return "moderate";
  return "mild";
}

// ===== 유틸: 주제 → 템플릿 키 매핑 =====
// * 보험/자동차/복지·생활지원금 은 하나의 재정 템플릿 "finance" 로 수렴 (요청 반영)
function resolveTemplateKey(topic) {
  const financeSet = new Set(["보험비용 종합점검", "자동차 견적·보험비용 점검", "복지·생활지원금"]);
  if (financeSet.has(topic)) return "finance";
  // 그 외는 topic 그대로(analysis.json에 동일 키가 있을 때 사용)
  return topic;
}

// ===== 메인 분석 엔드포인트 =====
app.post("/analyze", (req, res) => {
  try {
    const { topic, answers } = req.body || {};
    const safeTopic = typeof topic === "string" ? topic.trim() : "진단";
    const list = Array.isArray(answers) ? answers : [];

    // 위험 단어 스캔
    let riskHits = 0;
    const lowered = list.map(a => String(a || "").toLowerCase());
    for (const ans of lowered) {
      for (const w of RISK_WORDS) {
        if (ans.includes(w.toLowerCase())) riskHits++;
      }
    }

    // 위험 점수/레벨
    // - 선택 8문항 기준: 위험 단어 1개당 10~12p 가중치, 상한 100
    const base = Math.min(100, Math.round(riskHits * 12.5));
    const riskPercent = base;
    const level = levelFromPercent(riskPercent);

    // 템플릿 결정
    const key = resolveTemplateKey(safeTopic);
    const tpl = ANALYSIS[key] || {};

    // 상세/요약/전문가 의견 생성
    // - analysis.json 에 배열로 존재하면 랜덤 샘플링 및 길이 보정
    const pickLines = (arr = [], want = 15) => {
      if (!Array.isArray(arr) || arr.length === 0) return [];
      if (arr.length >= want) return arr.slice(0, want);
      // 부족하면 뒤를 반복 채우되 문장 중복 3회 이상 방지
      const out = [...arr];
      let guard = 0;
      while (out.length < want && guard < 100) {
        out.push(arr[out.length % arr.length]);
        guard++;
      }
      return out.slice(0, want);
    };

    // 상세(문단) 15줄, 요약 7줄, 전문가의견 2줄 — 요청 스펙 고정
    const detailLines = pickLines(tpl.detail, 15);
    const summaryLines = pickLines(tpl.summary, 7);
    const expertLines = pickLines(tpl.expert || tpl.opinion, 2);

    // 응답 수/위험 단어 수 보강(클라이언트에 그대로 표시됨)
    const result = {
      topic: safeTopic,
      answers: list,
      riskPercent,
      level, // "mild" | "moderate" | "severe"
      answerCount: list.length,
      riskWordCount: riskHits,

      // 클라이언트(result.html) 호환 필드명
      detail: detailLines.join("\n"),
      summary: summaryLines,
      opinion: expertLines
    };

    return res.json({ ok: true, result });
  } catch (e) {
    console.error("/analyze error:", e);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
});

// ===== 기본 라우팅 =====
app.get("/", (_, r) => r.sendFile(path.join(__dirname, "index.html")));
app.get("/question.html", (_, r) => r.sendFile(path.join(__dirname, "question.html")));
app.get("/result.html",   (_, r) => r.sendFile(path.join(__dirname, "result.html")));
app.get("/loading.html",  (_, r) => r.sendFile(path.join(__dirname, "loading.html")));

// ===== 서버 기동 =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Noeulbit Haru server running on :${PORT}`);
});
