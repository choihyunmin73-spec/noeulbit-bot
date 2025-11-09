// ✅ server.js — affiliate.json 자동 로드 + 핫리로드 + 진단 API
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());
app.use(express.static(__dirname)); // index.html, question.html, result.html, images 등 정적 서빙

// ------------------------------
// ① affiliate.json 자동 로드 (+ 변경 감지 핫리로드)
// ------------------------------
const AFF_FILE = path.join(__dirname, "affiliate.json");
let affiliateMap = {};

function loadAffiliates() {
  try {
    const raw = fs.readFileSync(AFF_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || Array.isArray(parsed)) {
      console.error("❌ affiliate.json 포맷이 객체가 아닙니다.");
      return;
    }
    affiliateMap = parsed;
    console.log("✅ affiliate.json 로드 완료");
  } catch (e) {
    console.error("❌ affiliate.json 로드 실패:", e.message);
    affiliateMap = {};
  }
}
loadAffiliates();

// 파일 변경 시 자동 반영
try {
  fs.watchFile(AFF_FILE, { interval: 1500 }, () => {
    console.log("♻️ affiliate.json 변경 감지 → 재로딩");
    loadAffiliates();
  });
} catch (_) {
  /* 일부 호스팅에서는 watchFile 미지원일 수 있음 – 무시 */
}

// ------------------------------
// ② 라우팅
// ------------------------------
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/question.html", (req, res) => res.sendFile(path.join(__dirname, "question.html")));
app.get("/result.html", (req, res) => res.sendFile(path.join(__dirname, "result.html")));

// 선택적으로 affiliates만 별도 확인하고 싶을 때
app.get("/affiliate", (req, res) => {
  res.json(affiliateMap);
});

// ------------------------------
// ③ 진단 엔진 (사용자님이 쓰시던 버전 기반)
//    - riskScore 계산
//    - 12개 주제 문구
//    - 응답에 affiliates 동봉
// ------------------------------
function analyzeTopic(topic, checks = []) {
  const riskWords = ["심함","악화","어려움","높음","위험","즉시","갑자기","숨","통증","가슴","저림","불면","기억","혈당","혈압"];
  let riskScore = 0;
  checks.forEach(c => riskWords.forEach(r => { if ((c || "").includes(r)) riskScore++; }));

  const level =
    riskScore >= 7 ? "위험도 높음 (Severe)" :
    riskScore >= 4 ? "중등도 (Moderate)" :
    "경미함 (Mild)";

  const riskPercent = Math.min(riskScore * 10 + 30, 100);

  let detail = "";
  let summary = [];
  let opinion = [];
  let supplements = [];

  switch (topic) {
    case "관절 통증":
      detail = riskScore >= 7
        ? "무릎, 어깨 등 주요 관절에 염증 반응이 의심됩니다. 걸을 때 통증이 심하거나 붓기가 지속된다면 즉시 정형외과 진료를 권장합니다."
        : riskScore >= 4
        ? "관절에 일시적 염증 또는 퇴행성 변화가 나타날 가능성이 있습니다. 무리한 활동은 피하고, 3일 이내 병원 방문을 권장드립니다."
        : "가벼운 관절 불편감 수준으로 보이며 생활 관리만으로 개선이 가능합니다.";
      summary = ["관절 부위 염증 가능성","무리한 활동 주의","초기 퇴행성 변화 의심","3일 내 진료 권장","온찜질·스트레칭 권장","체중 관리 필요","보행 시 무릎 보호"];
      opinion = ["스트레칭과 온찜질 병행","체중 관리로 관절 부담 완화"];
      supplements = ["글루코사민","MSM","콜라겐"];
      break;

    case "혈압 관리":
      detail = riskScore >= 7
        ? "혈압이 매우 불안정하며 어지럼·두통 증상이 나타납니다. 즉시 병원 방문이 필요합니다."
        : riskScore >= 4
        ? "혈압이 다소 높으며 염분 과다 및 스트레스 영향이 있습니다. 2~3일 내 내과 진료를 권장드립니다."
        : "혈압은 안정적이며 정기적인 측정과 식단 관리로 충분히 유지 가능합니다.";
      summary = ["혈압 수치 변동","염분·스트레스 영향","2~3일 내 검진","유산소 운동 권장","수면·휴식 중요","카페인 줄이기","체중 관리"];
      opinion = ["저염식 유지","규칙적 수면과 휴식 확보"];
      supplements = ["오메가3","마그네슘","코엔자임Q10"];
      break;

    case "혈당·당뇨":
      detail = riskScore >= 7
        ? "혈당이 지속적으로 높아 합병증 위험이 있습니다. 즉시 내분비내과 진료를 권장합니다."
        : riskScore >= 4
        ? "혈당이 불안정하며 식습관의 영향을 받는 것으로 보입니다. 3일 이내 검진을 추천드립니다."
        : "혈당은 정상 범위로 생활 관리만으로 충분합니다.";
      summary = ["혈당 상승 경향","식습관·운동 영향 큼","2~3일 내 검사","단 음식 줄이기","수면 관리","식후 걷기","체중 감량 도움"];
      opinion = ["식후 20~30분 산책","정제탄수 줄이고 단백질 보강"];
      supplements = ["알파리포산","크롬","오메가3"];
      break;

    case "불면증·수면장애":
      detail = riskScore >= 7
        ? "심각한 수면장애가 의심됩니다. 우울감·무기력 증상이 함께 있다면 전문의 상담이 필요합니다."
        : riskScore >= 4
        ? "수면의 질이 저하되어 피로가 누적됩니다. 일주일 내 수면 클리닉 방문을 권장합니다."
        : "일시적 불면 경향이며 수면 환경 조정으로 개선 가능합니다.";
      summary = ["수면 질 저하","스트레스 영향","수면 습관 개선 필요","카페인 저녁 제한","전자기기 취침 전 중단","수면위생 준수","완화 기법 적용"];
      opinion = ["취침 전 스마트폰 제한","수면·기상 시간 고정"];
      supplements = ["테아닌","멜라토닌","마그네슘"];
      break;

    case "어깨·목 통증":
      detail = riskScore >= 7
        ? "경추 압박 또는 근육 긴장으로 통증이 심합니다. 즉시 물리치료 또는 정형외과 진료 권장."
        : riskScore >= 4
        ? "장시간 자세 불균형이 원인으로 추정됩니다. 2~3일 내 병원 진료 권장."
        : "가벼운 근육통 수준으로 스트레칭과 휴식으로 개선이 가능합니다.";
      summary = ["근긴장성 통증","자세 불균형 영향","2~3일 내 진료","온찜질 효과","업무 중 스트레칭","바른 자세 유지","베개 높이 점검"];
      opinion = ["컴퓨터 작업 1시간마다 스트레칭","온열 요법으로 혈류 개선"];
      supplements = ["MSM","비타민B","콜라겐"];
      break;

    case "심장·호흡·가슴통증":
      detail = riskScore >= 7
        ? "협심증/부정맥 가능성이 높습니다. 즉시 응급실 내원 필요."
        : riskScore >= 4
        ? "혈액순환 저하로 가슴 답답함이 있을 수 있습니다. 1일 내 병원 방문 권장."
        : "일시적 긴장일 수 있으니 휴식 후 경과 관찰하세요.";
      summary = ["가슴 답답함·호흡곤란","심혈관 의심","즉시 내원 고려","무리한 활동 금지","스트레스 관리","수면 확보","카페인 제한"];
      opinion = ["증상 반복 시 심전도 검사","지속 시 응급 내원"];
      supplements = ["코엔자임Q10","오메가3","폴리코사놀"];
      break;

    case "노안·시력저하":
      detail = riskScore >= 7
        ? "시야 흐림/건조감이 심화되어 망막손상 가능성. 즉시 안과 진료."
        : riskScore >= 4
        ? "시력 저하 진행 가능성. 1주 내 안과 검진 권장."
        : "경미한 피로 수준. 눈 휴식으로 개선 가능.";
      summary = ["시야 흐림·건조","야간 시력 저하","안과 검진 권장","스마트폰 사용 제한","인공눈물 병행","밝기 조절","정기 시력검사"];
      opinion = ["20-20-20 규칙(20분마다 20초, 6m 응시)","실내 습도 유지"];
      supplements = ["루테인","아스타잔틴","비타민A"];
      break;

    case "치매·기억력 문제":
      detail = riskScore >= 7
        ? "단기 기억력 저하와 혼동 심함. 즉시 신경과 내원 필요."
        : riskScore >= 4
        ? "기억력 저하·집중력 약화. 1주 내 진료 권장."
        : "경미한 집중력 저하. 생활 관리로 개선 가능.";
      summary = ["기억력 저하","치매 전단계 의심","수면·스트레스 영향","규칙적 운동 권장","두뇌 자극 활동","식단 개선","검진 계획"];
      opinion = ["숙면 유지","퍼즐·독서 등 인지활동"];
      supplements = ["오메가3","포스파티딜세린","은행잎추출물"];
      break;

    case "전립선·배뇨 문제":
      detail = riskScore >= 7
        ? "배뇨 장애와 전립선 비대 가능성 높음. 즉시 비뇨기과 진료."
        : riskScore >= 4
        ? "배뇨 불편 지속·염증 가능성. 3일 내 검진 권장."
        : "경미한 불편. 수분 조절로 개선 가능.";
      summary = ["배뇨 불편·야간뇨","전립선염 의심","검진 권장","카페인/알코올 제한","수분 유지","규칙적 배뇨 습관","좌욕 도움"];
      opinion = ["자극 음식 회피","증상 지속 시 초음파 검사"];
      supplements = ["쏘팔메토","아연","비타민E"];
      break;

    case "종합 건강 체크":
      detail = riskScore >= 7
        ? "전신 컨디션 저하. 피로·체중변화·수면 부족 동반. 2일 내 검진 권장."
        : riskScore >= 4
        ? "생활습관 개선 필요. 운동·식습관 점검 권장."
        : "전반적 양호. 정기검진 유지.";
      summary = ["체력 저하 경향","생활습관 개선","정기검진 권장","스트레스 관리","수면 확보","균형 잡힌 식단","가벼운 유산소"];
      opinion = ["주 3회 이상 30분 운동","가공식품·설탕 줄이기"];
      supplements = ["멀티비타민","유산균","오메가3"];
      break;

    case "보험비용 종합점검":
      detail = riskScore >= 7
        ? "보장 누락·중복 심각. 즉시 설계사 상담 필요."
        : riskScore >= 4
        ? "중복 보장·비용 과다 가능. 1주 내 점검 권장."
        : "보장 구조 양호. 정기 점검만 필요.";
      summary = ["보험 중복 가능성","비용 과다 위험","1주 내 점검","보장 최적화","비교 견적 추천","갱신형 확인","필요 특약만 유지"];
      opinion = ["전문가와 리모델링 상담","비갱신형 전환 검토"];
      supplements = []; // 재정 카테고리
      break;

    case "최저가 자동차 견적 비교":
      detail = riskScore >= 7
        ? "비현실적 예산/과도한 금융 부담. 즉시 조건 재설정 권장."
        : riskScore >= 4
        ? "보험료·유지비 비교 부족. 3일 내 재검토 권장."
        : "선택 양호하나 추가 비교 권장.";
      summary = ["비용 절감 여지","보험료 비교 필요","유지비 확인","총비용 계산","온라인 견적 활용","리스/렌트 비교","잔존가치 확인"];
      opinion = ["세금·보험 포함 총소유비(TCO) 계산","2곳 이상 비교견적 필수"];
      supplements = []; // 재정 카테고리
      break;

    default:
      detail = "AI 분석 결과를 불러오는 중입니다.";
      summary = ["일반 건강 상태 양호"];
      opinion = ["정기 검진 권장"];
      supplements = ["종합비타민"];
  }

  // topic별 제휴상품 매칭 (affiliate.json)
  const affiliates = affiliateMap[topic] || [];

  return {
    topic,
    level,
    riskPercent,
    detail,
    summary,
    opinion,
    supplements,  // (이름 목록)
    affiliates    // (클릭 박스용: name, url, img?)
  };
}

// ------------------------------
// ④ API
// ------------------------------
app.post("/analyze", (req, res) => {
  const { topic, checks } = req.body || {};
  const result = analyzeTopic(topic, checks);
  res.json(result);
});

// 헬스체크
app.get("/health", (_, res) => res.send("ok"));

// ------------------------------
// ⑤ 서버 실행
// ------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
