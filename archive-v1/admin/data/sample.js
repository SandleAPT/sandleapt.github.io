window.SANDLE_ADMIN_SAMPLE = {
  topics: ["선거 · 선관위", "작은도서관", "주차", "하자판결금", "헬스장 · GX", "규약 · 계약", "재정 · 회계", "기타"],
  documentTypes: ["회의·안건", "관리규약", "운영규정", "계약", "공고·안내", "공문", "보험증권", "판결·결정", "회계자료", "기타"],
  scopes: [
    {value:"all_residents", label:"전체"},
    {value:"sale", label:"분양"},
    {value:"rental", label:"임차"},
    {value:"mixed", label:"혼합"},
    {value:"external", label:"대외"}
  ],
  items: [
    {
      id:"sample-classify",
      sample:true,
      title:"주차 운영 관련 안내 — 샘플",
      documentType:"공고·안내",
      date:"2026-08-20",
      scope:"all_residents",
      source:"샘플 원본 위치",
      note:"2단계 분류 검토 화면을 확인하기 위한 샘플 데이터",
      visibility:"public",
      suggestions:{topic:"주차", organization:"관리사무소", temporalStatus:"current", confidence:72},
      classificationApproved:false,
      classificationHeld:false,
      relation:{target:"주차 운영 기준 — 샘플", type:"implements", evidence:"inferred", approved:false, skipped:false},
      published:false
    },
    {
      id:"sample-relation",
      sample:true,
      title:"작은도서관 운영규정 개정 — 샘플",
      documentType:"운영규정",
      date:"2023-06-07",
      scope:"all_residents",
      source:"샘플 원본 위치",
      note:"관계 검토 흐름을 보여주는 샘플 데이터",
      visibility:"public",
      suggestions:{topic:"작은도서관", organization:"작은도서관", temporalStatus:"current", confidence:95},
      classificationApproved:true,
      classificationHeld:false,
      relation:{target:"작은도서관 운영규정 제정본 — 샘플", type:"supersedes", evidence:"verified", approved:false, skipped:false},
      published:false
    },
    {
      id:"sample-publish",
      sample:true,
      title:"체육시설 배상책임보험 — 샘플",
      documentType:"보험증권",
      date:"2026-07-22",
      scope:"all_residents",
      source:"샘플 원본 위치",
      note:"발행 대기와 공개등급 선택을 확인하기 위한 샘플 데이터",
      visibility:"public",
      suggestions:{topic:"헬스장 · GX", organization:"커뮤니티 운영", temporalStatus:"current", confidence:91},
      classificationApproved:true,
      classificationHeld:false,
      relation:{target:"커뮤니티 운영 기록 — 샘플", type:"contract_for", evidence:"verified", approved:true, skipped:false},
      published:false
    }
  ]
};