const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/question.html", (req, res) => res.sendFile(path.join(__dirname, "question.html")));
app.get("/result.html", (req, res) => res.sendFile(path.join(__dirname, "result.html")));

/* ✅ AI 분석 엔진: 12개 주제 자동 진단 생성 */
function analyzeTopic(topic, checks) {
  const riskWords = ["심함","악화","어려움","높음","위험","즉시","갑자기","숨","통증","가슴","저림","불면","기억","혈당","혈압"];
  let riskScore = 0;
  checks.forEach(c => riskWords.forEach(r => { if (c.includes(r)) riskScore++; }));

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
    case "관절 통증":
      detail = riskScore >= 7
        ? "무릎, 어깨 등 주요 관절에 염증 반응이 의심됩니다. 걸을 때 통증이 심하거나 붓기가 지속된다면 즉시 정형외과 진료를 권장합니다."
        : riskScore >= 4
        ? "관절에 일시적 염증 또는 퇴행성 변화가 나타날 가능성이 있습니다. 무리한 활동은 피하고, 3일 이내 병원 방문을 권장드립니다."
        : "가벼운 관절 불편감 수준으로 보이며 생활 관리만으로 개선이 가능합니다.";
      summary = ["관절 부위 염증 가능성", "무리한 활동 주의", "초기 퇴행성 변화 의심", "3일 내 진료 권장", "글루코사민·MSM 섭취 도움"];
      advice = ["스트레칭 및 온찜질로 순환 개선", "체중 관리로 관절 부담 완화"];
      supplements = ["글루코사민", "MSM", "콜라겐"];
      break;

    case "혈압 관리":
      detail = riskScore >= 7
        ? "혈압이 매우 불안정하며 어지럼·두통 증상이 나타납니다. 즉시 병원 방문이 필요합니다."
        : riskScore >= 4
        ? "혈압이 다소 높으며 염분 과다 및 스트레스 영향이 있습니다. 2~3일 내 내과 진료를 권장드립니다."
        : "혈압은 안정적이며 정기적인 측정과 식단 관리로 충분히 유지 가능합니다.";
      summary = ["혈압 수치 불안정", "염분·스트레스 영향", "2~3일 내 검진 권장", "유산소 운동 효과적", "오메가3·마그네슘 도움"];
      advice = ["저염식 식단 유지", "규칙적 수면과 휴식 확보"];
      supplements = ["오메가3", "마그네슘"];
      break;

    case "혈당·당뇨":
      detail = riskScore >= 7
        ? "혈당이 지속적으로 높아 합병증 위험이 있습니다. 즉시 내분비내과 진료를 권장합니다."
        : riskScore >= 4
        ? "혈당이 불안정하며 식습관의 영향을 받는 것으로 보입니다. 3일 이내 검진을 추천드립니다."
        : "혈당은 정상 범위로 생활 관리만으로 충분합니다.";
      summary = ["혈당 상승 경향 있음", "식습관·운동 영향 큼", "2~3일 내 검사 권장", "단 음식 섭취 줄이기", "크롬·오메가3 도움"];
      advice = ["식후 가벼운 산책", "단 음식 제한 및 수면 관리"];
      supplements = ["크롬", "오메가3", "비타민D"];
      break;

    case "불면증·수면장애":
      detail = riskScore >= 7
        ? "심각한 수면장애가 의심됩니다. 우울감·무기력 증상이 함께 있다면 전문의 상담이 필요합니다."
        : riskScore >= 4
        ? "수면의 질이 저하되어 피로가 누적되고 있습니다. 일주일 내 수면 클리닉 방문을 권장합니다."
        : "일시적인 불면 경향으로 수면 환경 조정으로 개선이 가능합니다.";
      summary = ["수면 질 저하", "스트레스 영향 있음", "수면 습관 개선 필요", "1주 내 진료 권장", "멜라토닌·테아닌 도움"];
      advice = ["취침 전 스마트폰 사용 제한", "수면 패턴 일정 유지"];
      supplements = ["멜라토닌", "테아닌", "마그네슘"];
      break;

    case "어깨·목 통증":
      detail = riskScore >= 7
        ? "경추 압박 또는 근육 긴장으로 인한 통증이 심합니다. 즉시 물리치료 또는 정형외과 진료를 권장합니다."
        : riskScore >= 4
        ? "장시간 자세 불균형이 원인으로 추정됩니다. 2~3일 내 병원 진료를 권장합니다."
        : "가벼운 근육통 수준으로 스트레칭과 휴식으로 개선이 가능합니다.";
      summary = ["근긴장성 통증", "자세 불균형 영향", "2~3일 내 진료 권장", "온찜질 효과적", "MSM·비타민B 도움"];
      advice = ["장시간 컴퓨터 작업 후 스트레칭", "온열 요법으로 혈류 개선"];
      supplements = ["MSM", "비타민B", "콜라겐"];
      break;

    case "심장·호흡·가슴통증":
      detail = riskScore >= 7
        ? "협심증 또는 부정맥 가능성이 높습니다. 즉시 응급실 내원 필요합니다."
        : riskScore >= 4
        ? "호흡 불균형이나 혈액순환 저하로 가슴 답답함이 있습니다. 1일 내 병원 방문을 권장드립니다."
        : "일시적 긴장으로 인한 증상일 수 있습니다. 휴식 후 추적 관찰하세요.";
      summary = ["가슴 통증·호흡곤란", "심혈관 질환 의심", "즉시 병원 권장", "스트레스 회피 필요", "코엔자임Q10·오메가3 도움"];
      advice = ["무리한 활동 자제", "심장전문 내과 진료"];
      supplements = ["코엔자임Q10", "오메가3"];
      break;

    case "노안·시력저하":
      detail = riskScore >= 7
        ? "시야 흐림과 건조감이 심화되어 망막 손상 가능성이 있습니다. 안과 진료가 즉시 필요합니다."
        : riskScore >= 4
        ? "시력 저하가 점진적으로 진행 중입니다. 1주 내 안과 검진을 권장합니다."
        : "경미한 피로 수준으로 눈 휴식으로 개선 가능합니다.";
      summary = ["시야 흐림·건조감", "1주 내 안과 검진 권장", "루테인·아스타잔틴 도움", "스마트폰 사용 제한", "인공눈물 병행 권장"];
      advice = ["스마트폰 밝기 조정", "정기적 시력검사"];
      supplements = ["루테인", "아스타잔틴", "비타민A"];
      break;

    case "치매·기억력 문제":
      detail = riskScore >= 7
        ? "단기 기억력 저하와 혼동이 심합니다. 즉시 신경과 내원 필요."
        : riskScore >= 4
        ? "기억력 저하와 집중력 약화가 느껴집니다. 1주 내 진료 권장."
        : "경미한 집중력 저하로 생활 관리로 개선 가능.";
      summary = ["기억력 저하", "치매 전단계 의심", "스트레스 영향", "1주 내 검진 권장", "오메가3·루테인 도움"];
      advice = ["숙면 유지", "두뇌 자극 활동 지속"];
      supplements = ["오메가3", "루테인", "비타민B"];
      break;

    case "전립선·배뇨 문제":
      detail = riskScore >= 7
        ? "배뇨 장애와 전립선 비대 가능성이 높습니다. 즉시 비뇨기과 진료를 권장합니다."
        : riskScore >= 4
        ? "배뇨 불편감이 지속 중이며 전립선 염증 가능성이 있습니다. 3일 내 검진 권장."
        : "경미한 불편 수준으로 수분 섭취 조절로 개선 가능합니다.";
      summary = ["배뇨 불편·야간뇨", "전립선염 의심", "3일 내 검진 권장", "쏘팔메토 도움", "수분 섭취 유지"];
      advice = ["카페인·알코올 제한", "규칙적 배뇨 습관 유지"];
      supplements = ["쏘팔메토", "아연", "비타민E"];
      break;

    case "종합 건강 체크":
      detail = riskScore >= 7
        ? "전반적 건강상태 저하가 감지됩니다. 피로·체중변화·수면 부족 증상이 있습니다. 2일 내 건강검진 권장."
        : riskScore >= 4
        ? "생활습관 개선이 필요합니다. 운동량과 식습관 점검을 권장합니다."
        : "건강상태 양호. 정기검진 유지 권장.";
      summary = ["체력 저하 경향", "생활습관 개선 필요", "정기검진 권장", "비타민B·C 복합체 도움", "스트레스 관리 필수"];
      advice = ["충분한 수면 확보", "균형 잡힌 식단 유지"];
      supplements = ["비타민B", "비타민C", "홍삼"];
      break;

    case "보험비용 종합점검":
      detail = riskScore >= 7
        ? "보장 누락 및 중복이 심각합니다. 즉시 보험 설계사 상담이 필요합니다."
        : riskScore >= 4
        ? "일부 중복 보장 및 비용 과다 발생 중입니다. 일주일 내 점검 권장."
        : "보장 구조 양호. 정기 점검만 필요.";
      summary = ["보험 중복 가능성", "비용 과다 위험", "1주 내 점검 권장", "보장 최적화 필요", "비교 견적 추천"];
      advice = ["보험 전문가 상담", "불필요한 특약 정리"];
      supplements = [];
      break;

    case "최저가 자동차 견적 비교":
      detail = riskScore >= 7
        ? "비용 부담이 과도한 선택을 하고 있을 가능성이 높습니다. 즉시 딜러 견적 비교 필요."
        : riskScore >= 4
        ? "보험료·유지비 비교가 부족합니다. 3일 내 재검토 권장."
        : "견적 선택 양호하나, 추가 비교 검토 권장.";
      summary = ["비용 절감 여지 있음", "보험료 비교 필요", "유지비 확인 권장", "3일 내 재점검", "온라인 견적 도움"];
      advice = ["보험사별 조건 비교", "세금 포함 총비용 확인"];
      supplements = [];
      break;

    default:
      detail = "AI 분석 결과를 불러오는 중입니다.";
      summary = ["일반 건강 상태 양호"];
      advice = ["정기 검진 권장"];
      supplements = ["종합비타민"];
  }

  return { topic, level, riskPercent, detail, summary, advice, supplements };
}

app.post("/analyze", (req, res) => {
  const { topic, checks } = req.body;
  res.json(analyzeTopic(topic, checks));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
