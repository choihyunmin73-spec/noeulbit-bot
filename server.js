// ✅ 완전 통합본 server.js
// (노을빛하루 AI 진단 시스템 + affiliate.json 핫리로드 완전버전)

const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();
app.use(express.json());
app.use(express.static(__dirname));

// ✅ affiliate.json 자동 로드 (+ 변경 시 핫리로드)
let affiliateData = {};
const affiliatePath = path.join(__dirname, "affiliate.json");

function loadAffiliate() {
  try {
    const raw = fs.readFileSync(affiliatePath, "utf8");
    affiliateData = JSON.parse(raw);
    console.log("✅ affiliate.json 로드 완료");
  } catch (err) {
    console.error("❌ affiliate.json 로드 실패:", err.message);
  }
}
loadAffiliate();

// 파일 변경 시 자동 리로드
fs.watchFile(affiliatePath, { interval: 1000 }, () => {
  console.log("♻️ affiliate.json 변경 감지, 다시 로드 중...");
  loadAffiliate();
});

// ✅ 기본 라우팅
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/question.html", (req, res) => res.sendFile(path.join(__dirname, "question.html")));
app.get("/result", (req, res) => res.sendFile(path.join(__dirname, "result.html")));

// ✅ AI 진단 엔진
function analyzeTopic(topic, checks) {
  const riskWords = ["심함", "악화", "위험", "즉시", "갑자기", "통증", "저림", "어려움"];
  let riskScore = 0;
  checks.forEach(c => {
    riskWords.forEach(w => { if (c.includes(w)) riskScore++; });
  });
  const riskPercent = Math.min(100, riskScore * 15);

  // ✅ 주제별 상세진단 / 요약 / 전문가의견
  const topics = {
    "관절 통증": {
      detail: [
        "관절 부위의 연골 마모가 진행될 가능성이 있습니다.",
        "무릎이나 손목 등 특정 부위에 지속적인 통증이 동반될 수 있습니다.",
        "초기에는 단순 근육통으로 착각하기 쉽지만, 반복될 경우 염증 가능성이 있습니다.",
        "오래 서 있거나 걷는 활동 시 통증이 심해질 수 있습니다.",
        "체중 부담이 큰 경우 증상이 악화될 수 있으니 관리가 필요합니다.",
        "관절 내부 윤활액 감소로 인한 마찰이 원인일 수 있습니다.",
        "통증 부위가 붓거나 열감을 느끼는 경우 병원 진료가 필요합니다.",
        "꾸준한 스트레칭과 온찜질이 도움이 됩니다.",
        "계단 오르내리기보다는 평지 걷기가 좋습니다.",
        "3일 이상 통증이 지속되면 정형외과 진료를 권장합니다."
      ],
      summary: [
        "무릎·손목 관절에 통증이 잦음",
        "체중 부담이 원인이 될 수 있음",
        "염증 가능성 배제 필요",
        "평지 위주 걷기 권장",
        "3일 이상 통증 지속 시 병원 방문",
        "온찜질·스트레칭 병행 필요",
        "무리한 활동 피해야 함"
      ],
      opinion: [
        "관절 보호를 위해 장시간 서 있는 것을 피하세요.",
        "증상이 지속되면 정형외과 검진을 받는 것이 좋습니다."
      ]
    },
    "혈압 관리": {
      detail: [
        "혈압 수치가 일시적으로 상승했을 가능성이 있습니다.",
        "짠 음식 섭취, 스트레스, 수면 부족이 주요 원인입니다.",
        "두통·어지럼증이 반복되면 고혈압 초기 증상일 수 있습니다.",
        "기상 직후 측정 시 혈압이 더 높게 나올 수 있습니다.",
        "염분을 줄이고 수분 섭취를 늘려야 합니다.",
        "규칙적인 유산소 운동이 필요합니다.",
        "혈압약 복용 중이라면 정기 측정이 중요합니다.",
        "카페인 섭취를 줄이는 것이 좋습니다.",
        "3일 이상 두통 지속 시 병원 내원 권장.",
        "60세 이상은 6개월마다 혈압 검진 권장."
      ],
      summary: [
        "혈압 상승 원인: 스트레스·염분",
        "수면 부족도 큰 영향을 미침",
        "유산소 운동 및 식단 조절 필요",
        "카페인 줄이기 권장",
        "두통 지속 시 병원 진료 필요",
        "정기적 혈압 측정 필수",
        "염분 섭취 조절"
      ],
      opinion: [
        "저염식과 꾸준한 운동이 혈압 조절에 가장 중요합니다.",
        "혈압 변동이 잦다면 의사 상담을 권장합니다."
      ]
    },
    "혈당·당뇨": {
      detail: [
        "혈당이 일시적으로 상승했을 수 있습니다.",
        "단 음식 섭취 후 피로감이 느껴지면 주의해야 합니다.",
        "혈당 수치가 높으면 갈증, 잦은 소변 증상이 나타납니다.",
        "운동 부족이 혈당 조절을 어렵게 합니다.",
        "공복 시에도 피로하다면 내당능 저하일 수 있습니다.",
        "야식과 과식은 혈당 상승의 주요 원인입니다.",
        "스트레스가 인슐린 저항성을 높일 수 있습니다.",
        "규칙적 식사와 걷기운동이 필요합니다.",
        "3일 이상 피로·갈증 지속 시 내과 방문 권장.",
        "정기적 혈당 체크 습관화 필요."
      ],
      summary: [
        "혈당 상승 징후 있음",
        "단 음식·야식 피해야 함",
        "운동 부족은 혈당 조절 악화",
        "수면과 스트레스 관리 중요",
        "갈증·피로 지속 시 내과 방문",
        "식사 후 30분 걷기 권장",
        "정기 혈당 측정 필요"
      ],
      opinion: [
        "규칙적 운동이 혈당 조절에 큰 도움이 됩니다.",
        "공복 혈당이 높으면 병원 진료를 권장합니다."
      ]
    },
    // ⚙️ 이하 동일 구조로 9개 주제 추가 가능
  };

  const base = topics[topic] || {
    detail: ["상세 진단 데이터 없음."],
    summary: ["요약 데이터 없음."],
    opinion: ["전문가 의견 데이터 없음."]
  };

  return {
    topic,
    riskPercent,
    level: riskPercent >= 70 ? "위험" : riskPercent >= 40 ? "주의" : "양호",
    detail: base.detail,
    summary: base.summary,
    opinion: base.opinion,
    supplements: affiliateData[topic] ? affiliateData[topic].map(x => x.name) : []
  };
}

// ✅ 결과 API
app.post("/api/analyze", (req, res) => {
  const { topic, checks } = req.body;
  if (!topic || !Array.isArray(checks)) {
    return res.status(400).json({ error: "잘못된 요청" });
  }
  const result = analyzeTopic(topic, checks);
  res.json(result);
});

// ✅ 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 노을빛하루 서버 실행 중: http://localhost:${PORT}`));
