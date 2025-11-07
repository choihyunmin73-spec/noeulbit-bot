const express = require("express");
const app = express();
app.use(express.json());
app.use(express.static(__dirname));

/* ✅ 위험도 계산 함수 */
function calcSeverity(checks) {
    const high = ["심함","매우 심함","악화","위험","즉시","지속됨","걷기 어려움","숨 가쁨","원인 없음"];
    let score = 0;

    checks.forEach(c => {
        high.forEach(h => { if (c.includes(h)) score += 1; });
    });

    if(score >= 4) return "높음";
    if(score >= 2) return "중간";
    return "낮음";
}

/* ✅ 권장 진료과 */
function getDept(topic){
    const map = {
        "관절 통증": "정형외과",
        "혈압 관리": "순환기내과",
        "혈당·당뇨": "내분비내과",
        "불면증·수면장애": "신경과 / 정신건강의학과",
        "어깨·목 통증": "정형외과 / 재활의학과",
        "심장·호흡·가슴통증": "순환기내과 / 흉부외과",
        "노안·시력저하": "안과",
        "치매·기억력 문제": "신경과",
        "전립선·배뇨 문제": "비뇨의학과",
        "종합 건강 체크": "가정의학과",
        "보이스피싱 예방": "금융보안센터 상담",
        "복지·생활지원금": "주민센터 복지 상담"
    };
    return map[topic] || "해당 없음";
}

/* ✅ 셀프케어 자동 생성 */
function makeTips(topic){
    const base = {
        "관절 통증": [
            "무릎·어깨 주변 근육 스트레칭을 하루 5~10분 유지",
            "장시간 같은 자세 피하고 1시간마다 가벼운 움직임",
            "온찜질로 뻣뻣함 완화, 심한 통증 시 냉찜질"
        ],
        "혈압 관리": [
            "소금·국물 섭취 줄이고 수분은 일정하게 유지",
            "아침·저녁 가벼운 걷기 15~20분",
            "스트레스·수면 부족을 줄이는 생활 패턴 유지"
        ],
        "혈당·당뇨": [
            "식사 속도 천천히, 단 음식·과일즙은 소량으로",
            "식후 10~15분 가벼운 걷기",
            "규칙적 수면과 일정한 식사 시간 유지"
        ],
        "불면증·수면장애": [
            "잠들기 1시간 전 스마트폰·TV 사용 줄이기",
            "카페인·늦은 밤 식사 피하기",
            "침실 조도 낮추고 규칙적인 취침 시간 유지"
        ],
        "어깨·목 통증": [
            "컴퓨터·스마트폰 사용 시 40분마다 목 스트레칭",
            "베개 높이 조절, 엎드려 자는 습관 피하기",
            "근육 긴장 시 따뜻한 찜질"
        ],
        "심장·호흡·가슴통증": [
            "격한 운동은 잠시 중단하고 일정한 호흡 유지",
            "기름진 음식·과식 자제",
            "증상이 반복되면 조기 진료 필요"
        ],
        "노안·시력저하": [
            "스마트폰·책 30분 사용 후 1~2분 먼 곳 바라보기",
            "눈 건조 시 인공눈물 사용",
            "밝은 조명 아래에서 글 보기"
        ],
        "치매·기억력 문제": [
            "메모·알람·일정 정리로 일상 구조 만들기",
            "가벼운 운동과 규칙적 식사",
            "뇌 자극 활동(독서·퍼즐) 짧게 반복"
        ],
        "전립선·배뇨 문제": [
            "카페인·탄산 음료 줄이기",
            "과도한 수분 섭취는 피하고 일정하게 나누어 마시기",
            "배뇨를 오래 참지 않기"
        ],
        "종합 건강 체크": [
            "규칙적인 식사와 15분 산책",
            "수면·활동·식사 패턴 점검",
            "과도한 피로감 지속 시 검진 고려"
        ],
        "보이스피싱 예방": [
            "정부·은행은 절대 전화로 개인 정보 요구 안함",
            "문자 링크 클릭 금지",
            "의심되면 112·금융감독원 문의"
        ],
        "복지·생활지원금": [
            "주민센터·정부24에서 지원 대상 먼저 확인",
            "증빙 서류 미리 정리해두기",
            "신청 기간을 놓치지 않도록 알림 설정"
        ]
    };

    return base[topic] || ["생활 관리 팁이 제공되지 않았습니다."];
}

/* ✅ Red Flags */
function makeRedFlags(topic){
    const flags = {
        "심장·호흡·가슴통증": [
            "가슴 통증이 10분 이상 지속됨",
            "식은땀·호흡곤란·팔 저림 동반",
            "휴식해도 나아지지 않음"
        ],
        "혈압 관리": [
            "극심한 두통·시야 흐림",
            "얼굴 마비·언어 이상",
            "갑작스러운 흉통"
        ],
        "혈당·당뇨": [
            "갑작스런 극심한 갈증·빈뇨",
            "급격한 체중 변화",
            "정신 혼란"
        ],
        "관절 통증": [
            "관절 붓기·열감이 심해짐",
            "걸을 수 없을 정도의 통증"
        ]
    };

    return flags[topic] || [];
}

/* ✅ 상세 분석 자동 생성 */
function makeAnalysis(topic, severity, checks){
    const lines = [];

    lines.push(`선택하신 문항을 기반으로 현재 <b>${topic}</b> 관련 증상 패턴을 분석했습니다.`);
    lines.push(`전체 답변에서 나타난 경향은 <b>${severity} 위험도</b>와 가장 가까운 상태입니다.`);

    if(severity === "높음"){
        lines.push(`여러 문항에서 강한 증상 또는 생활 방해 요소가 반복적으로 확인되었습니다.`);
        lines.push(`증상이 진행 중이거나 일상 기능에 영향을 주는 양상으로 보입니다.`);
        lines.push(`병원 내원 또는 전문 상담을 권장드립니다.`);
    }
    else if(severity === "중간"){
        lines.push(`일부 문항에서 불편감 또는 초기 증상 변화가 확인되었습니다.`);
        lines.push(`현재 단계에서는 생활 관리와 모니터링이 중요합니다.`);
        lines.push(`증상이 반복되면 조기 진료가 도움이 됩니다.`);
    }
    else {
        lines.push(`현재 확인된 범위에서는 뚜렷한 위험 신호는 적지만, 증상 변화 여부를 지속 관찰하는 것이 좋습니다.`);
        lines.push(`규칙적인 생활 습관이 증상 예방에 도움이 될 수 있습니다.`);
    }

    return lines;
}

/* ✅ 분석 API */
app.post("/analyze",(req,res)=>{
    const { topic, checks } = req.body;

    const severity = calcSeverity(checks);
    const dept = getDept(topic);
    const tips = makeTips(topic);
    const redflags = makeRedFlags(topic);
    const analysis = makeAnalysis(topic, severity, checks);

    const action = 
        severity === "높음" ? "전문 진료 또는 초기 검사가 필요해 보입니다." :
        severity === "중간" ? "생활 관리와 모니터링이 중요합니다." :
        "생활 관리로 충분히 조절 가능한 상태입니다.";

    res.json({
        topic,
        checks,
        severity,
        action,
        dept,
        tips,
        redflags,
        analysis
    });
});

app.listen(3000, ()=>console.log("AI Health Check running on 3000"));
