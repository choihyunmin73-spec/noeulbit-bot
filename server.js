const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== 한국어 라벨 =====
const CATEGORY_LABEL = {
  joint: "관절",
  cardio: "심혈관",
  diabetes: "당뇨",
  neuro: "신경",
  etc: "기타"
};

const ANSWER_LABEL = {
  stair_pain: "계단 통증",
  duration_lt_1w: "1주 미만",
  duration_ge_1w: "1주 이상",
  mild: "약함",
  moderate: "중등도",
  severe: "심함",
  walk: "걷기",
  swelling: "붓기 동반",
  heat: "열감 동반",
  night_pain: "야간 통증",
  chest_pain: "가슴 통증",
  dyspnea: "호흡곤란",
  numbness: "저림/마비",
  vision_change: "시야 변화"
};

// ===== 규칙 기반 분석 =====
function buildAdvice(category, answers) {
  const has = (k) => answers.includes(k);

  // ---- 관절 ----
  if (category === "joint") {
    const short = has("duration_lt_1w");
    const long = has("duration_ge_1w");
    const mild = has("mild");
    const mod = has("moderate");
    const sev = has("severe");
    const stair = has("stair_pain");
    const swelling = has("swelling");
    const heat = has("heat");
    const night = has("night_pain");

    if (sev || swelling || heat || night || long) {
      return {
        summary: "진료가 필요한 관절 통증 소견입니다.",
        actions: [
          "가동을 줄이고 냉/온찜질을 무리 없이 시행하세요.",
          "가능하면 같은 날 정형외과 진료를 권장드립니다.",
          "필요 시 X-ray/초음파 상담이 도움이 됩니다."
        ],
        red: [
          swelling ? "붓기 동반" : "",
          heat ? "열감 동반" : "",
          night ? "야간 통증" : "",
          sev ? "보행이 어려울 정도의 통증" : "",
          long ? "1주 이상 지속" : ""
        ].filter(Boolean)
      };
    }

    if (short && mild) {
      const detail = stair
        ? "초기 무릎 통증 가능성이 높습니다."
        : "가벼운 초기 관절 통증으로 보입니다.";
      return {
        summary: detail,
        actions: [
          "계단·쪼그려 앉기 동작을 잠시 줄여주세요.",
          "평지 걷기와 아이스 마사지(10–15분)를 하루 2–3회 시행하세요.",
          "진통제/소염제는 필요 시만 복용해주세요.",
          "48–72시간 경과를 보고 악화 시 진료를 권장드립니다."
        ],
        red: ["붓기·열감이 심해짐", "보행 어려움", "밤에 깨는 통증"]
      };
    }

    if (mod || short) {
      return {
        summary: "경도–중등도 관절 통증으로 보입니다.",
        actions: [
          "무리한 하중 동작은 줄여주세요.",
          "따뜻한 찜질·스트레칭은 통증 범위 안에서만 하세요.",
          "1주 내 호전이 없으면 영상검사를 받아보세요."
        ],
        red: ["붓기/열감 증가", "보행 곤란", "야간 통증 발생"]
      };
    }
  }

  // ---- 심혈관 ----
  if (category === "cardio") {
    if (has("chest_pain") || has("dyspnea")) {
      return {
        summary: "심혈관 위험 증상이 의심됩니다.",
        actions: [
          "즉시 심장내과 또는 응급실 방문을 권장드립니다.",
          "안정된 상태에서 이동하며 보호자 동행이 좋습니다."
        ],
        red: ["가슴 통증", "호흡곤란", "식은땀/어지럼"]
      };
    }
    return {
      summary: "기본 심혈관 체크 결과입니다.",
      actions: [
        "혈압을 주기적으로 확인하세요.",
        "짠 음식·과음 줄이고 걷기 운동을 유지하세요."
      ],
      red: []
    };
  }

  // ---- 당뇨 ----
  if (category === "diabetes") {
    return {
      summary: "혈당 관리가 필요해 보입니다.",
      actions: [
        "식후 2시간 혈당을 확인해보세요.",
        "단순당·정제 탄수화물을 줄여보세요.",
        "20–30분 정도 가벼운 걷기 운동이 좋습니다."
      ],
      red: ["심한 갈증/다뇨/체중 감소 시 즉시 진료"]
    };
  }

  // ---- 기본 ----
  return {
    summary: "기본 안내 결과입니다.",
    actions: ["증상 경과를 기록하고 필요 시 상담을 권장드립니다."],
    red: []
  };
}

// ===== 결과 텍스트 생성 =====
function renderResult(category, answers) {
  const cat = CATEGORY_LABEL[category] || category;
  const ans = answers.map(a => ANSWER_LABEL[a] || a).join(", ");

  const info = buildAdvice(category, answers);

  const actions = info.actions.map(a => `- ${a}`).join("\n");
  const red = info.red.length ? info.red.map(a => `- ${a}`).join("\n") : "- 해당 없음";

  return `
[AI 분석 결과]
선택 분야: ${cat}
응답 요약: ${ans}

요약 판단: ${info.summary}

권장 행동:
${actions}

즉시 진료 권고 증상:
${red}

서버 연결 상태: 정상 작동 중.
  `.trim();
}

// ===== API 엔드포인트 =====
app.post("/analyze", (req, res) => {
  try {
    const { category, answers } = req.body;

    const text = renderResult(category, answers || []);
    res.json({ text });
  } catch (e) {
    res.json({ text: "분석 중 오류가 발생했습니다." });
  }
});

// ===== 정적 페이지 =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ Server running on port", PORT));
