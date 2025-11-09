<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>노을빛하루 AI 진단 결과</title>
  <style>
    body {
      font-family: 'Pretendard', sans-serif;
      background-color: #0e1117;
      color: #fff;
      margin: 0;
      padding: 0;
    }
    h1 {
      text-align: center;
      margin-top: 40px;
      color: #bcd4ff;
      font-weight: 700;
    }
    .container {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 20px;
      padding: 40px;
    }
    .card {
      background-color: #1c1f26;
      border-radius: 12px;
      padding: 25px;
      box-shadow: 0 0 12px rgba(0, 0, 0, 0.4);
      flex: 1;
      min-width: 380px;
      max-width: 600px;
    }
    .card h2 {
      font-size: 20px;
      color: #fff;
      border-left: 4px solid #4685ff;
      padding-left: 10px;
      margin-bottom: 15px;
    }
    .card h3 {
      color: #a2b5ff;
      font-size: 16px;
      margin-top: 0;
      margin-bottom: 8px;
    }
    .bar {
      width: 100%;
      height: 6px;
      border-radius: 4px;
      background-color: #2f3542;
      margin: 10px 0 20px;
    }
    .bar-inner {
      height: 100%;
      border-radius: 4px;
      background-color: #4685ff;
      width: 0;
      transition: width 1s ease;
    }
    ul {
      margin: 10px 0;
      padding-left: 18px;
      color: #d0d3da;
    }
    li { margin-bottom: 4px; }

    .supplement-card {
      background-color: #232731;
      padding: 15px;
      border-radius: 10px;
      margin-bottom: 15px;
    }
    .supplement-card img {
      width: 28px;
      height: 28px;
      margin-right: 8px;
      vertical-align: middle;
    }
    .supplement-card strong {
      font-size: 16px;
      color: #fff;
    }
    .section-title {
      color: #99b3ff;
      font-size: 17px;
      border-left: 3px solid #4685ff;
      padding-left: 8px;
      margin-top: 25px;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <h1>노을빛하루 AI 진단 결과</h1>

  <div class="container">
    <!-- 왼쪽: 진단 상세 -->
    <div class="card" id="left-card">
      <h2 id="topic">주제</h2>
      <h3 id="level">진단 단계</h3>
      <div class="bar"><div class="bar-inner" id="riskBar"></div></div>
      <div><strong>위험도 지표:</strong> <span id="riskPercent">0</span>/100</div>

      <h3>상세 진단</h3>
      <p id="detail">데이터 불러오는 중...</p>

      <h3>요약</h3>
      <ul id="summary"></ul>

      <h3>전문가 의견</h3>
      <ul id="opinion"></ul>
    </div>

    <!-- 오른쪽: 제휴상품 및 보험 -->
    <div class="card" id="right-card">
      <h2>제휴상품 (필요하신 영양제)</h2>
      <div id="supplementList"></div>

      <h2>제휴보험 (체크해 보세요)</h2>
      <div id="insuranceList"></div>
    </div>
  </div>

  <script>
    // ✅ 서버에서 전달받은 진단 데이터 가져오기
    const result = JSON.parse(localStorage.getItem("aiResult"));

    if (result) {
      document.getElementById("topic").textContent = result.topic || "진단 결과";
      document.getElementById("level").textContent = result.level || "단계 정보 없음";
      document.getElementById("riskPercent").textContent = result.riskPercent || 0;
      document.getElementById("detail").textContent = result.detail || "상세 진단 데이터 없음";

      const riskBar = document.getElementById("riskBar");
      riskBar.style.width = `${result.riskPercent || 0}%`;

      // ✅ 요약 출력
      const summaryEl = document.getElementById("summary");
      summaryEl.innerHTML = (result.summary || [])
        .map(item => `<li>${item}</li>`)
        .join("");

      // ✅ 전문가 의견 출력 (advice → opinion 이름 통일)
      const opinionEl = document.getElementById("opinion");
      opinionEl.innerHTML = (result.opinion || result.advice || [])
        .map(item => `<li>${item}</li>`)
        .join("");

      // ✅ 제휴상품 자동 매칭 (영양제)
      const supplementMap = {
        "오메가3": { name: "오메가3 트리플케어", desc: "혈압 및 혈중 중성지방 개선 도움" },
        "마그네슘": { name: "마그네슘 밸런스", desc: "혈관 이완 및 스트레스 완화 지원" },
        "코엔자임Q10": { name: "코엔자임Q10 플러스", desc: "심혈관 에너지 개선 및 피로 회복" },
        "크롬": { name: "크롬 밸런스", desc: "혈당 조절 및 대사 기능 개선" },
        "루테인": { name: "루테인 맥스비전", desc: "눈 건강 및 황반 색소 보호" },
        "MSM": { name: "MSM 플렉스", desc: "관절 및 연골 건강 유지" },
        "콜라겐": { name: "콜라겐 1000", desc: "피부 및 연골 탄력 강화" },
        "비타민D": { name: "비타민D 데일리", desc: "면역 및 뼈 건강 지원" },
        "비타민B": { name: "비타민B 컴플렉스", desc: "에너지 대사 및 피로 개선" },
        "비타민C": { name: "비타민C 플러스", desc: "항산화 및 면역력 강화" },
        "홍삼": { name: "홍삼 데일리", desc: "면역 및 피로 개선 도움" },
        "쏘팔메토": { name: "쏘팔메토 포르테", desc: "전립선 건강 유지 및 배뇨 개선" },
        "아연": { name: "아연 밸런스", desc: "면역 및 세포 기능 강화" },
        "비타민E": { name: "비타민E 프리미엄", desc: "혈액순환 및 항산화 지원" },
        "아스타잔틴": { name: "아스타잔틴 루테인 플러스", desc: "피로한 눈 보호 및 항산화" },
        "테아닌": { name: "L-테아닌 릴렉스", desc: "스트레스 완화 및 수면 질 개선" },
        "멜라토닌": { name: "멜라토닌 슬립케어", desc: "수면 유도 및 숙면 보조" }
      };

      const supplementList = document.getElementById("supplementList");
      (result.supplements || []).forEach(s => {
        const info = supplementMap[s];
        if (info) {
          const div = document.createElement("div");
          div.classList.add("supplement-card");
          div.innerHTML = `
            <img src="https://cdn-icons-png.flaticon.com/512/2913/2913135.png" alt="${info.name}">
            <strong>${info.name}</strong><br>${info.desc}
          `;
          supplementList.appendChild(div);
        }
      });

      // ✅ 제휴보험
      const insuranceList = document.getElementById("insuranceList");
      const insuranceData = [
        { name: "고혈압·심장 보장보험", desc: "혈압·심혈관질환 보장 강화형 상품" },
        { name: "만성질환 관리형 실손", desc: "정기 내과 진료 및 검사비 보장" }
      ];
      insuranceData.forEach(item => {
        const div = document.createElement("div");
        div.classList.add("supplement-card");
        div.innerHTML = `
          <img src="https://cdn-icons-png.flaticon.com/512/2920/2920345.png" alt="${item.name}">
          <strong>${item.name}</strong><br>${item.desc}
        `;
        insuranceList.appendChild(div);
      });
    } else {
      document.getElementById("detail").textContent = "결과 데이터를 불러올 수 없습니다.";
    }
  </script>
</body>
</html>
