/* ================================
   ✅ server.js — 완전 교체본
   ================================ */
const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

/* ✅ 기본 라우팅 */
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/question.html", (req, res) => res.sendFile(path.join(__dirname, "question.html")));
app.get("/result.html", (req, res) => res.sendFile(path.join(__dirname, "result.html")));

/* ✅ affiliate.json 자동 로드 (+ 변경 감지 핫리로드) */
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

/* ✅ AI 분석 엔진 */
function analyzeTopic(topic, answers) {
  const riskWords = ["심함", "악화", "통증", "위험", "저림", "숨", "가슴", "이상", "갑자기"];
  let detected = [];
  answers.forEach(a => riskWords.forEach(r => { if (a.includes(r)) detected.push(r); }));
  const riskScore = Math.min(100, detected.length * 10);
  let level = "Mild";
  if (riskScore >= 70) level = "Severe";
  else if (riskScore >= 40) level = "Moderate";

  /* ✅ 주제별 상세진단 자동 생성 */
  let detail = "";
  switch (true) {
    case /혈압/.test(topic):
      detail = `
현재 주제는 ‘혈압 관리’이며, 위험도는 ${level} 수준으로 평가되었습니다.
응답 결과 혈압 상승 관련 단어가 일부 감지되었습니다.
현재 상태는 비교적 안정적이지만, 스트레스·염분 섭취 조절이 필요합니다.
하루 세 번 규칙적인 혈압 측정으로 변화를 관찰하세요.
두통이나 어지럼증이 동반되면 즉시 의료기관을 방문하세요.
짠 음식, 카페인, 흡연은 혈압을 상승시킬 수 있습니다.
걷기, 스트레칭 등 가벼운 운동을 꾸준히 하세요.
수면 부족은 혈압에 악영향을 주므로 7시간 이상 숙면을 권장합니다.
복용 중인 약은 임의로 중단하지 마세요.
정기적인 진료를 통해 상태를 점검하세요.`; break;
    case /자동차/.test(topic):
      detail = `
현재 주제는 ‘자동차 견적·보험비용 점검’이며, 위험도는 ${level} 수준으로 평가되었습니다.
응답 데이터를 분석한 결과, 일부 주의가 필요한 항목이 감지되었습니다.
보험 갱신 및 보장 범위를 점검하세요.
불필요한 추가비용이 발생하지 않도록 정기 점검이 필요합니다.
운전 피로도 및 시력 저하가 영향을 줄 수 있습니다.
휴식과 집중력 유지가 사고 예방에 도움됩니다.
보험료 비교 사이트를 활용해 합리적 갱신을 검토하세요.
필요 시 보험 전문가의 상담을 받아보세요.
운전 시 피로감이 누적될 경우 일시 정지를 권장합니다.
건강과 집중력 유지를 위해 수면을 충분히 취하세요.
`; break;
    case /치매|기억력/.test(topic):
      detail = `
현재 주제는 ‘치매·기억력 문제’이며, 위험도는 ${level} 수준으로 평가되었습니다.
응답 데이터에서 기억력 저하와 집중력 관련 단어가 감지되었습니다.
현재 상태는 비교적 안정적이지만 조기 관찰이 중요합니다.
두뇌 자극 활동(퍼즐, 독서, 대화 등)을 생활화하세요.
충분한 수면과 영양 섭취가 인지 기능에 도움됩니다.
스트레스와 우울감은 기억력 저하를 가속시킬 수 있습니다.
정기적인 병원 진단으로 상태를 관리하세요.
활동적인 생활을 유지하며, 대인 관계를 지속하세요.
필요 시 전문가 상담을 통해 관리 계획을 세우세요.
`; break;
    default:
      detail = `
현재 주제는 ‘${topic}’이며, 위험도는 ${level} 수준으로 평가되었습니다.
응답 데이터를 분석한 결과, 일부 주의가 필요한 단어가 감지되었습니다.
현재 상태는 비교적 안정적이나 일부 주의가 필요합니다.
생활 습관 개선과 규칙적인 수면이 도움이 됩니다.
스트레스를 줄이고 균형 잡힌 식단을 유지하세요.
가벼운 운동과 충분한 수분 섭취가 중요합니다.
정기적인 건강검진으로 상태를 주기적으로 점검하세요.
통증, 불편감, 피로감이 반복된다면 조기 진료를 권합니다.
필요 시 전문가 상담으로 정확한 진단을 받으세요.
`; break;
  }

  /* ✅ 요약 */
  const summary = [
    `주제: ${topic}`,
    `위험도 수준: ${level}`,
    `응답 수: ${answers.length}개`,
    `위험 단어 감지: ${detected.length}개`,
    `전반적으로 ${riskScore <= 30 ? "양호" : "주의"} 상태입니다.`,
    `생활습관 개선과 정기적인 점검을 권장드립니다.`,
    `증상이 지속되면 의료기관 내원을 권합니다.`,
  ];

  /* ✅ 전문가 의견 */
  const expert = [
    `AI 분석 결과, ${riskScore <= 30 ? "특별한 위험 요소는 크지 않습니다." : "주의가 필요합니다."}`,
    `${riskScore >= 50 ? "3일 내 병원 진료를 권장합니다." : "지속적인 생활관리와 점검이 필요합니다."}`
  ];

  return { topic, level, riskScore, detail, summary, expert, riskWords: detected };
}

/* ✅ 분석 API */
app.post("/analyze", (req, res) => {
  try {
    const { topic, answers } = req.body;
    if (!topic || !Array.isArray(answers)) {
      return res.json({ ok: false, error: "Invalid input" });
    }
    const result = analyzeTopic(topic, answers);
    res.json({ ok: true, result });
  } catch (err) {
    console.error("❌ 분석 중 오류:", err);
    res.json({ ok: false, error: "Server error" });
  }
});

/* ✅ 서버 실행 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ 노을빛하루 AI 서버 실행 중 (포트: ${PORT})`));
