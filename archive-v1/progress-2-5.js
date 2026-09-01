(function(){
const flow=document.querySelector('.flow-review');
const hero=document.querySelector('.hero');
if(!hero)return;
const panel=document.createElement('section');
panel.className='roadmap-status';
panel.innerHTML=`<div class="roadmap-status-head"><div><strong>현재 작업 위치</strong><div class="roadmap-deferred">2단계는 세부 컨펌 없이 전체 흐름을 한 번에 만든 뒤 검토하는 방식으로 진행 중이야.</div></div><span>2.5 전체 검토</span></div><div class="roadmap-stage-row"><div class="roadmap-stage done"><b>1</b>탐색·검색</div><div class="roadmap-stage next"><b>2</b>관리자 입력</div><div class="roadmap-stage"><b>3</b>회의록 연결</div><div class="roadmap-stage"><b>4</b>저장·권한</div><div class="roadmap-stage"><b>5</b>다른 주제 검증</div><div class="roadmap-stage"><b>6</b>실제 이관</div><div class="roadmap-stage"><b>7</b>최종 통합</div></div><div class="roadmap-status-grid"><article class="roadmap-box"><h3>2단계에서 만든 것</h3><ul><li>별도 관리자 작업대</li><li>새 자료 → AI 초안 흐름</li><li>분류·관계 검토함</li><li>public / resident / private</li><li>발행 대기와 미리보기</li></ul></article><article class="roadmap-box"><h3>이번에 전체로 볼 것</h3><ul><li>업무가 너무 잘게 쪼개지지 않았는지</li><li>관리자가 직접 입력할 것이 과하지 않은지</li><li>검토 → 발행 이동이 자연스러운지</li></ul><div class="roadmap-deferred">관리 화면은 프로토타입이라 실제 저장·인증은 아직 연결하지 않았어.</div></article><article class="roadmap-box next-box"><h3>수정 후 다음은 3단계</h3><p><b>회의록 작성 기능과 Archive 연결</b></p><ul><li>기존 회의 작성 구조 확인</li><li>회의·안건 필드 매핑</li><li>저장 시 Archive 초안 자동 생성</li><li>1페이지 회의록 유지 검증</li></ul></article></div>`;
(flow||hero).insertAdjacentElement('afterend',panel);
})();