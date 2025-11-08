// ==========================
// 노을빛하루 AI 진단 시스템 서버
// ==========================
const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(__dirname)); // ✅ 정적 파일(index, css, 이미지 등) 직접 서빙

// ==========================
// 기본 라우팅
// ==========================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/question.html", (req, res) => {
  res.sendFile(path.join(__dirname, "question.html"));
});

app.get("/result.html", (req, res) => {
  res.sendFile(path.join(__dirname, "result.html"));
});

// ==========================
// AI 분석 로직 (간단 진단형)
// ==========================
function analyzeTopic(topic, answers) {
  // 위험 단어 패턴 (문항 분석용)
  const riskWords = ["심함", "악화", "어려움", "위험", "높음", "갑자기", "통증", "저림"];
  let score = 0;

  answers.forEach((a) => {
    riskWords.forEach((r) => {
      if (a.includes(r)) score++;
    });
  });

  // 결과 텍스트 생성
  let resultText = "";
  if (score >= 4) {
    resultText = "위험도 높음";
  } else if (score >= 2) {
    resultText = "주의 필요";
  } else {
    resultText = "양호";
  }

  // 맞춤 메시지
  let message = "";
  if (topic.includes("관절")) {
    message =
      "관절의 염증 가능성이 높습니다. 통증 부위의 온찜질과 충분한 휴식을 취하세요. 지속 시 정형외과 진료를 권장합니다.";
  } else if (topic.includes("혈압")) {
    message =
      "혈압 변동이 잦다면 생활습관 조절이 필요합니다. 나트륨 섭취를 줄이고 가벼운 유산소 운동을 병행하세요.";
  } else if (topic.includes("혈당")) {
    message =
      "혈당이 불안정할 수 있습니다. 식사 후 가벼운 걷기와 함께 당분 섭취량을 점검해보세요.";
  } else if (topic.includes("불면")) {
    message =
      "수면 패턴 불균형이 의심됩니다. 취침 전 스마트폰 사용을 줄이고 일정한 시간에 잠자리에 드는 습관을 들이세요.";
  } else if (topic.includes("어깨") || topic.includes("목")) {
    message =
      "장시간 같은 자세로 인한 근육 긴장일 수 있습니다. 1시간마다 스트레칭을 하여 긴장을 풀어주세요.";
  } else if (topic.includes("심장")) {
    message =
      "가슴 답답함이나 통증이 자주 발생한다면 심장 기능 검사가 필요할 수 있습니다. 전문의 상담을 권장합니다.";
  } else if (topic.includes("치매") || topic.includes("기억")) {
    message =
      "최근 기억력 저하가 있다면 뇌 건강 관리가 중요합니다. 충분한 수면과 규칙적인 두뇌 활동을 병행하세요.";
  } else if (topic.includes("시력") || topic.includes("노안")) {
    message =
      "눈의 피로 누적이 원인일 수 있습니다. 1시간마다 눈을 쉬게 하고, 40cm 이상 거리에서 화면을 보세요.";
  } else if (topic.includes("전립선")) {
    message =
      "배뇨 불편감이 지속된다면 비뇨기과 검진을 권장합니다. 수분은 충분히 섭취하되, 자기 전 음료는 줄이세요.";
  } else if (topic.includes("보이스피싱")) {
    message =
      "최근 문자·전화로 개인정보를 요구하는 사례가 많습니다. 절대 응답하지 말고 신고하세요.";
  } else if (topic.includes("복지") || topic.includes("지원금")) {
    message =
      "정부 및 지자체의 다양한 지원금이 있습니다. 복지로(www.bokjiro.go.kr)에서 내게 맞는 혜택을 확인해보세요.";
  } else {
    message =
      "전반적인 건강 상태는 안정적입니다. 다만 불편함이 지속된다면 전문의 상담을 권장합니다.";
  }

  return { resultText, message };
}

// ==========================
// API: 분석 요청 처리
// ==========================
app.post("/api/analyze", (req, res) => {
  const { topic, answers } = req.body;

  if (!topic || !answers) {
    return res.status(400).json({ error: "Invalid request data" });
  }

  const { resultText, message } = analyzeTopic(topic, answers);
  res.json({ topic, resultText, message });
});

// ==========================
// 서버 실행
// ==========================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(`✅ Noeulbit Haru AI Diagnosis Server running on port ${PORT}`)
);
