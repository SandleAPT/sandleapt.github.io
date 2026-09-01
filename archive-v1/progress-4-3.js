(function(){
const flow=document.querySelector('.flow-review');
const hero=document.querySelector('.hero');
if(!hero)return;
const panel=document.createElement('section');
panel.className='roadmap-status';
panel.innerHTML=`<div class="roadmap-status-head"><div><strong>현재 작업 위치</strong><div class="roadmap-deferred">공개 포털에 둘 정보와 외부 원본을 분리하고, 공개할 수 없는 자료는 화면에서만 숨기지 않고 공개 번들 파일 자체에서 제외해.</div></div><span>4.3 공개 정책 연결</span></div><div class="roadmap-stage-row"><div class="roadmap-stage done"><b>1</b>탐색·검색</div><div class="roadmap-stage"><b>2</b>관리자 입력<br><small>보완 가능</small></div><div class="roadmap-stage done"><b>3</b>회의록 연결</div><div class="roadmap-stage next"><b>4</b>저장·권한<br><small>진행 중</small></div><div class="roadmap-stage"><b>5</b>다른 주제 검증</div><div class="roadmap-stage"><b>6</b>실제 이관</div><div class="roadmap-stage"><b>7</b>최종 통합</div></div><div class="roadmap-status-grid"><article class="roadmap-box"><h3>4.1~4.2 완료</h3><ul><li>GitHub·minutes·외부 원본 역할 분리</li><li>SourceReference v1</li><li>public 원본만 공개 참조</li><li>비공개 file_id 제거</li></ul></article><article class="roadmap-box"><h3>4.3 적용 중</h3><ul><li>허용 필드 public projection</li><li>resident/private 공개 발행 차단</li><li>관리 화면과 발행 저장 함수 이중 검사</li><li>정책 통합 테스트</li></ul><div class="roadmap-deferred">실제 입주민·관리자 로그인은 아직 제공하지 않아.</div></article><article class="roadmap-box next-box"><h3>직접 확인하기</h3><p><b>관리 도구 → 4 저장 · 권한</b></p><ul><li>저장 위치별 역할</li><li>현재 자료 공개 판정</li><li>등급 변경 후 발행 차단</li><li>인증 전 보안 경계</li></ul><a href="./admin/#storagePolicy" style="display:inline-block;margin-top:8px;font-weight:900;color:#6e5011;text-decoration:none">4단계 정책 화면 열기 →</a></article></div>`;
(flow||hero).insertAdjacentElement('afterend',panel);
})();
