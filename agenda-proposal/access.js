(function(){
  'use strict';
  var gate=document.getElementById('accessGate'),title=document.getElementById('accessGateTitle'),text=document.getElementById('accessGateText');
  function render(role){
    var allowed=role==='edit';document.body.classList.toggle('access-pending',!allowed);gate.style.display=allowed?'none':'';
    if(!allowed){title.textContent='회의자료 작성은 수정용 권한에서만 보여요.';text.textContent='왼쪽 하단 관리자모드에서 수정용 비밀번호를 입력해 주세요. 권한 확인에 실패했다면 관리자모드에서 다시 연결해 주세요.';}
  }
  var parentAccess=null;
  try{if(window.parent!==window&&window.parent.location.origin===location.origin)parentAccess=window.parent.portalAccess;}catch(e){}
  if(parentAccess&&typeof parentAccess.role==='function'){
    // 같은 출처 포털의 검증된 세션을 사용한다. iframe에서 중복 검증·키 삭제하지 않는다.
    function sync(){parentAccess.expire();render(parentAccess.role());}
    sync();setInterval(sync,1000);window.addEventListener('focus',sync);return;
  }
  var auth=PortalAccess.create({storage:localStorage,fetch:window.fetch.bind(window),
    url:'https://script.google.com/macros/s/AKfycbyhpE-DB5WAAEx7uqTCPwU-e0sPKuupkYN3YoQWALiFWe0IHFNh1y91e1VNtDmMxxoxLA/exec',token:'ITDXaUBDTmrz6DbQ3tv9R',change:render});
  function restore(){auth.restore(false).then(function(){render(auth.role());});}
  window.addEventListener('storage',restore);window.addEventListener('focus',restore);
  setInterval(function(){auth.expire();},1000);setInterval(restore,300000);restore();
})();
