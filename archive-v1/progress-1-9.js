(function(){
const flow=document.querySelector('.flow-review');
const hero=document.querySelector('.hero');
if(!hero)return;
const panel=document.createElement('section');
panel.className='roadmap-status';
panel.innerHTML=`<div class="roadmap-status-head"><div><strong>현재 작업 위치</strong><div class="roadmap-deferred">큰 단계가 바뀌기 전에 무엇을 끝냈고, 무엇을 미뤄도 되는지 확인하는 판이야.</div></div><span>1단계 임시 확정</span></div><div class="roadmap-stage-row"><div class="roadmap-stage done"><b>1</b>탐색·검색</div><div class="roadmap-stage next"><b>2</b>관리자 입력</div><div class="roadmap-stage"><b>3</b>회의록 연결</div><div class="roadmap-stage"><b>4</b>저장·권한</div><div class="roadmap-stage"><b>5</b>다른 주제 검증</div><div class="roadmap-stage"><b>6</b>실제 이관</div><div class="roadmap-stage"><b>7</b>최종 통합</div></div><div class="roadmap-status-grid"><article class="roadmap-box"><h3>1단계에서 완료한 것</h3><ul><li>첫 화면과 전체 주제 탐색</li><li>주제 상세·개별 기록 상세</li><li>검색 A/B 프로토타입</li><li>화면 구성과 데이터 구조 분리</li></ul></article><article class="roadmap-box"><h3>지금 안 정해도 되는 것</h3><ul><li>A/B 최종 검색 레이아웃</li><li>실제 GA4 관심도 집계</li><li>대규모 실제 자료 이관</li></ul><div class="roadmap-deferred">이 항목들은 뒤 단계에서 실제 자료와 기능을 더 붙인 뒤 결정해도 데이터 재작업이 없도록 유지해.</div></article><article class="roadmap-box next-box"><h3>다음은 2단계</h3><p><b>2.1 관리자 영역 화면 샘플</b>부터 시작해.</p><ul><li>회의 작성</li><li>새 자료 등록</li><li>분류 검토</li><li>관계 검토</li><li>발행 대기</li></ul><div class="roadmap-deferred">아직 2.1 작업은 시작하지 않은 상태야.</div></article></div>`;
(flow||hero).insertAdjacentElement('afterend',panel);
})();