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

/* ✅ AI 분석 엔진 (자동 진단 생성 버전) */
function analyzeTopic(topic, checks) {
  const riskWords = ["심함", "악화", "어려움", "높음", "위험", "즉시", "갑자기", "숨", "통증", "가슴", "저림"];
  let riskScore = 0;

  checks.forEach(c => {
    riskWords.forEach(r => {
      if (c.includes(r)) riskScore++;
    });
  });

  const level =
    riskScore >= 7 ? "위험도 높음 (Severe)" :
    riskScore >= 4 ? "중등도 (Moderate)" :
    "경미함 (Mild)";

  const riskPercent = Math.min(riskScore * 10 + 30, 100);

  let detail = "";
  let summary = [];
  let advice = [];
  let supplements = [];

  switch (topic) {
    case "혈압 관리":
      detail = riskScore >= 7
        ? "혈압이 불안정하며 두통과 어지럼이 동반됩니다. 즉시 병원 진료를 권장합니다."
        : riskScore >= 4
        ? "혈압이 다소 높으며 스트레스, 식습관의 영향이 있습니다. 2~3일 내 진료 권장."
        : "혈압은 안정적입니다. 주기적 측정과 식단 관리로 유지하세요.";
      summary = [
        "혈압 수치 변동 감지",
        "스트레스 및 염분 과다 영향",
        "운동·수면 관리 필요",
        "2~3일 내 진료 권장",
        "오메가3·마그네슘 도움됨"
      ];
      advice = [
        "저염식 식단 유지",
        "가벼운 유산소 운동 지속"
      ];
      supplements = ["오메가3", "마그네슘"];
      break;

    case "치매·기억력 문제":
      detail = riskScore >= 7
        ? "단기 기억력 저하가 심화되며 혼동 증상이 있습니다. 즉시 신경과 내원 권장."
        : riskScore >= 4
        ? "기억력 저하와 집중력 약화가 나타납니다. 일주일 내 검진 권장."
        : "경미한 집중력 저하로 생활 관리로 개선 가능합니다.";
      summary = [
        "기억력 감소 및 집중력 저하",
        "스트레스·수면 영향 있음",
        "치매 전단계 가능성",
        "일주일 내 전문의 검진 권장",
        "오메가3·루테인 도움됨"
      ];
      advice = [
        "7시간 이상 숙면 유지",
        "두뇌 자극 활동(독서·퍼즐 등) 권장"
      ];
      supplements = ["오메가3", "루테인", "비타민B"];
      break;

    case "혈당·당뇨":
      detail = riskScore >= 7
        ? "혈당이 지속적으로 높게 유지되어 합병증 위험이 있습니다. 즉시 내분비내과 진료 필요."
        : riskScore >= 4
        ? "식습관 불균형으로 혈당 상승이 우려됩니다. 2~3일 내 검사 권장."
        : "혈당은 안정적이며 생활 관리 유지로 충분합니다.";
      summary = [
        "식후 피로 및 갈증 증가",
        "단 음식 섭취 과다 가능",
        "운동 부족 영향",
        "2~3일 내 혈당 검사 권장",
        "크롬·오메가3 도움됨"
      ];
      advice = [
        "단 음식을 줄이고 규칙적 식사",
        "식후 가벼운 산책 권장"
      ];
      supplements = ["오메가3", "크롬", "비타민D"];
      break;

    default:
      detail = "AI 분석 결과에 따라 추가 설명이 준비됩니다.";
      summary = ["상세 데이터 부족", "일반 건강 상태 양호"];
      advice = ["규칙적 생활 유지", "정기 검진 권장"];
      supplements = ["종합비타민"];
  }

  return { topic, level, riskPercent, detail, summary, advice, supplements };
}

/* ✅ 결과 요청 API */
app.post("/analyze", (req, res) => {
  const { topic, checks } = req.body;
  const result = analyzeTopic(topic, checks);
  res.json(result);
});

/* ✅ 서버 실행 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
