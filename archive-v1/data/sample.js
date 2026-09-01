window.SANDLE_ARCHIVE_SAMPLE={
  recentRecords:[
    {date:"2026.08",kind:"회의·안건",title:"커뮤니티시설 운영 및 시설 확충",status:"논의",topicId:"gym"},
    {date:"2026.07",kind:"보험증권",title:"체육시설업자배상책임보험",status:"현행",topicId:"gym"},
    {date:"2026.07",kind:"보험증권",title:"시설소유관리자배상책임보험 — 도서관",status:"현행",topicId:"library"},
    {date:"2024.10",kind:"관리규약",title:"주민공동시설 관련 현행 규약",status:"현행",topicId:"gym"},
    {date:"2023.06",kind:"운영규정",title:"산들마을푸른숲 작은도서관 운영규정 개정",status:"현행",topicId:"library"}
  ],
  topics:[
    {
      id:"gym",label:"헬스장 · GX",visibility:"public",aliases:["헬스","체력단련장","gx","커뮤니티센터"],description:"이용료·운영·시설확충·보험·잡수입이 한 주제에서 어떻게 연결되는지 보는 샘플",
      counts:{"회의·의결":6,"현재 기준":2,"보험":1,"재정":3},
      current:[
        {kind:"관리규약",title:"공동주택관리규약 2024.10.30 개정본",note:"주민공동시설 이용과 관리 기준을 현재 규약과 연결하는 예시",tags:["current","rule"]},
        {kind:"보험",title:"체육시설업자배상책임보험",note:"2026.07.22 ~ 2027.07.22 · 체력단련장 392㎡ / 탁구장 187㎡",tags:["current","contract"]}
      ],
      timeline:[
        {date:"2025.02",title:"헬스장 관련 안건 확인",note:"임차인대표회의 회의자료에 헬스장 관련 논의가 기록됨"},
        {date:"2025.04",title:"잡수입 사용동의 관련 논의",note:"커뮤니티 운영비용과 연결 가능한 재정 흐름을 별도 관계로 묶는 예시"},
        {date:"2026.02",title:"헬스장 관련 투표·운영 논의",note:"이용 방식 또는 비용 관련 기록을 회의 안건 단위로 연결"},
        {date:"2026.03",title:"헬스장 부과 관련 기록",note:"회의 결정과 실제 부과·회계자료를 서로 다른 자료종류로 연결"},
        {date:"2026.07",title:"체육시설 배상책임보험 가입",note:"운영 현황과 안전·보험 자료를 현재 기준 영역에서 함께 제시"},
        {date:"2026.08",title:"GX룸·기구·시설확충 논의",note:"거울시트·블라인드·기구 추가 등 후속 운영 안건과 연결하는 예시"}
      ],
      records:[
        ["2026.08","회의·안건","커뮤니티시설 운영 및 시설 확충","논의"],
        ["2026.07","보험증권","체육시설업자배상책임보험","현행"],
        ["2026.03","회의·의결","헬스장 부과 관련 기록","과거"],
        ["2026.02","회의·의결","헬스장 운영·투표 관련 기록","과거"],
        ["2025.04","회의·의결","잡수입 사용동의 관련 기록","과거"],
        ["2024.10","관리규약","주민공동시설 관련 현행 규약","현행"]
      ]
    },
    {
      id:"library",label:"작은도서관",visibility:"public",aliases:["도서관","푸른숲","책"],description:"운영규정의 개정 이력과 현재 보험을 함께 보여주는 샘플",
      counts:{"운영규정":2,"보험":1,"현재 기준":2},
      current:[
        {kind:"운영규정",title:"산들마을푸른숲 작은도서관 운영규정",note:"2016.11.18 제정 · 2023.06.07 개정 기록",tags:["current","rule"]},
        {kind:"보험",title:"시설소유관리자배상책임보험",note:"2026.07.22 ~ 2027.07.22 · 가입물건 도서관 · 좌석수 150개",tags:["current","contract"]}
      ],
      timeline:[
        {date:"2016.11",title:"작은도서관 운영규정 제정",note:"회원·운영시간·대출·자료관리·이용자 약속 등을 규정"},
        {date:"2023.06",title:"운영규정 개정",note:"운영규정 문서의 버전 관계를 supersedes/amends로 연결하는 예시"},
        {date:"2026.07",title:"도서관 배상책임보험 가입",note:"현행 운영과 안전 관련 원본을 함께 제시"}
      ],
      records:[
        ["2026.07","보험증권","시설소유관리자배상책임보험 — 도서관","현행"],
        ["2023.06","운영규정","산들마을푸른숲 작은도서관 운영규정 개정","현행"],
        ["2016.11","운영규정","산들마을푸른숲 작은도서관 운영규정 제정","대체됨"]
      ]
    },
    {id:"parking",label:"주차",visibility:"public",aliases:["주차장","방문차량","차량"],description:"아직 구조 확인 전인 다음 샘플 후보",counts:{},current:[],timeline:[],records:[]},
    {id:"election",label:"선거 · 선관위",visibility:"public",aliases:["선거","선관위","동대표"],description:"공고→구성→후보→투표→결과를 사건 흐름으로 묶는 다음 샘플 후보",counts:{},current:[],timeline:[],records:[]},
    {id:"defect",label:"하자판결금",visibility:"public",aliases:["하자","판결금","하자소송"],description:"판결·수령·지급·후속조치가 어떻게 연결되는지 확인할 다음 샘플 후보",counts:{},current:[],timeline:[],records:[]}
  ]
};