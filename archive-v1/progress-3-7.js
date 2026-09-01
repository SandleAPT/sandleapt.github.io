(function(){
const flow=document.querySelector('.flow-review');
const hero=document.querySelector('.hero');
if(!hero)return;
const panel=document.createElement('section');
panel.className='roadmap-status';
panel.innerHTML=`<div class="roadmap-status-head"><div><strong>현재 작업 위치</strong><div class="roadmap-deferred">각 단계는 담당 AI가 자동 검증과 실제 데이터 검증을 마친 뒤 다음 단계로 이어가고, 중간 체크포인트를 저장해 다른 AI도 같은 자리에서 계속할 수 있게 해.</div></div><span>3단계 검증 완료</span></div><div class="roadmap-stage-row"><div class="roadmap-stage done"><b>1</b>탐색·검색</div><div class="roadmap-stage"><b>2</b>관리자 입력<br><small>보완 가능</small></div><div class="roadmap-stage done"><b>3</b>회의록 연결</div><div class="roadmap-stage next"><b>4</b>저장·권한</div><div class="roadmap-stage"><b>5</b>다른 주제 검증</div><div class="roadmap-stage"><b>6</b>실제 이관</div><div class="roadmap-stage"><b>7</b>최종 통합</div></div><div class="roadmap-status-grid"><article class="roadmap-box"><h3>3단계 검증 결과</h3><ul><li>실제 회의 213건 변환 통과</li><li>안건 1,125개 Fragment 변환 통과</li><li>JSON 오류·중복 ID 0건</li><li>과거 분류명 최신 taxonomy 정규화</li></ul></article><article class="roadmap-box"><h3>원본은 그대로 유지</h3><ul><li>기존 회의 작성 화면 변경 없음</li><li>기존 클라우드 저장 방식 변경 없음</li><li>1페이지 회의록·PDF 출력 유지</li></ul><div class="roadmap-deferred">사용자 피드백이 오면 관련 완료 단계를 새 소번호로 다시 열어 보완해.</div></article><article class="roadmap-box next-box"><h3>다음 체크포인트</h3><p><b>4.1 저장소 역할 분리</b></p><ul><li>공개 메타데이터</li><li>외부 원본 참조</li><li>resident/private 제외 원칙</li><li>권한 경계 자동 검증</li></ul><a href="./admin/#meetingImport" style="display:inline-block;margin-top:8px;font-weight:900;color:#6e5011;text-decoration:none">검증된 회의록 연결 보기 →</a></article></div>`;
(flow||hero).insertAdjacentElement('afterend',panel);
})();
