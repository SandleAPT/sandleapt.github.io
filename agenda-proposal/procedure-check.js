(function(){
  'use strict';
  var editor=document.querySelector('.editor');
  var refsField=document.getElementById('refsField');
  if(!editor||!refsField)return;

  var style=document.createElement('style');
  style.textContent='\
  .procedure-card{border:1px solid #d8d0bd;background:#fffaf0;border-radius:12px;padding:12px 13px;margin:2px 0 16px;display:grid;gap:10px}\
  .procedure-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.procedure-head b{font-size:13px}.procedure-head small{font-size:10.5px;color:#7a7468;text-align:right;line-height:1.35}\
  .procedure-help{font-size:11.5px;color:#6f6b62;line-height:1.5;margin-top:-3px}\
  .procedure-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.procedure-q{display:grid;gap:4px}.procedure-q span{font-size:11.5px;font-weight:800;color:#514d45}\
  .procedure-q select{width:100%;border:1px solid #ddd7ca;border-radius:9px;background:#fff;padding:8px 9px;color:#2b2a26;font:inherit;font-size:12px;outline:none}.procedure-q select:focus{border-color:#c19a43;box-shadow:0 0 0 3px rgba(181,132,26,.10)}\
  .procedure-result{border-radius:10px;border:1px solid #d7e1d2;background:#f3f8f0;padding:10px 11px;display:grid;gap:5px}.procedure-result.warn{border-color:#ead39a;background:#fff8e6}.procedure-result.danger{border-color:#e2b5ac;background:#fff0ed}\
  .procedure-line{display:grid;grid-template-columns:78px 1fr;gap:7px;font-size:11.5px;line-height:1.45}.procedure-line strong{font-weight:900}.procedure-line span{color:#4e4a43}\
  .procedure-basis{font-size:10.5px;color:#7a7468;line-height:1.45;border-top:1px dashed #ddd4c3;padding-top:7px;margin-top:2px}\
  @media(max-width:700px){.procedure-grid{grid-template-columns:1fr}.procedure-head{flex-direction:column;gap:4px}.procedure-head small{text-align:left}}\
  @media print{.procedure-card{display:none!important}}';
  document.head.appendChild(style);

  var card=document.createElement('section');
  card.className='procedure-card';
  card.setAttribute('aria-label','절차 확인');
  card.innerHTML='\
    <div class="procedure-head"><b>절차 확인</b><small>작성 보조용 · A4에는 출력되지 않아요.</small></div>\
    <div class="procedure-help">잘 모르겠으면 그대로 두어도 돼요. 작성한 내용에서 먼저 추정하고, 공사 범위나 돈의 출처가 정해지면 결과가 더 정확해집니다.</div>\
    <div class="procedure-grid">\
      <label class="procedure-q"><span>공사 성격</span><select id="procWork"><option value="auto">작성내용에서 판단</option><option value="repair">기존 상태 그대로 보수·복구</option><option value="alter">벽·시설 철거/신설, 면적·용도 변경 있음</option><option value="unknown">아직 잘 모름</option></select></label>\
      <label class="procedure-q"><span>비용은 어디서?</span><select id="procFund"><option value="auto">작성내용에서 판단</option><option value="lh">LH·사업주체가 부담</option><option value="budget">편성된 관리비·수선유지비</option><option value="ltr">장기수선충당금</option><option value="misc">잡수입</option><option value="unknown">아직 미정</option></select></label>\
      <label class="procedure-q" id="procPlanWrap"><span>장기수선계획</span><select id="procPlan"><option value="auto">해당 여부 모름</option><option value="in">계획에 이미 포함</option><option value="regular">3년 정기조정으로 반영</option><option value="early">3년 전 수시조정이 필요</option><option value="na">장충금 사용 안 함</option></select></label>\
      <label class="procedure-q"><span>예산 확보</span><select id="procBudget"><option value="auto">아직 확인 안 함</option><option value="yes">확보됨</option><option value="no">확보 안 됨</option></select></label>\
    </div>\
    <div class="procedure-result" id="procResult"></div>\
    <div class="procedure-basis">기준: 공동주택관리법 제29조·제35조, 시행령 제35조 및 별표 3, 시행규칙 제15조, 산들마을 관리규약 제62조·제62조의2·제63조. 실제 범위가 달라지면 결과도 달라질 수 있으므로 행위허가 여부와 회계 재원은 관리사무소가 최종 확인하는 용도입니다.</div>';
  refsField.parentNode.insertBefore(card,refsField);

  var work=document.getElementById('procWork');
  var fund=document.getElementById('procFund');
  var plan=document.getElementById('procPlan');
  var budget=document.getElementById('procBudget');
  var result=document.getElementById('procResult');
  var watched=['title','background','details','decision','cost'].map(function(id){return document.getElementById(id);}).filter(Boolean);

  function allText(){return watched.map(function(x){return x.value||'';}).join(' ');}
  function inferWork(){
    var t=allText();
    if(/철거|증축|증설|용도\s*변경|용도변경|벽\s*설치|벽체|칸막이|공간\s*변경|면적\s*변경/.test(t))return 'alter';
    if(/누수|곰팡이|보수|복구|수선|방수|도장|마감/.test(t))return 'repair';
    return 'unknown';
  }
  function inferFund(){
    var t=allText();
    if(/잡수입/.test(t))return 'misc';
    if(/장기수선|장충금/.test(t))return 'ltr';
    if(/수선유지비|관리비/.test(t))return 'budget';
    if(/LH|사업주체|시공사/.test(t))return 'lh';
    return 'unknown';
  }
  function line(label,text){return '<div class="procedure-line"><strong>'+label+'</strong><span>'+text+'</span></div>';}
  function render(){
    var w=work.value==='auto'?inferWork():work.value;
    var f=fund.value==='auto'?inferFund():fund.value;
    var p=plan.value;
    var b=budget.value;
    var resident='', permit='', decision='', check=[], level='';

    if(w==='repair'){
      resident='현재 범위라면 통상 불필요';
      permit='기존 상태를 되돌리는 보수라면 통상 행위허가 대상은 아님';
    }else if(w==='alter'){
      resident='필요할 가능성이 큼 — 변경 범위에 따라 동의비율이 달라짐';
      permit='행위허가·신고 대상 여부를 먼저 확인해야 함';
      level='danger';
      check.push('벽·시설 철거/신설, 면적·용도 변경 범위를 도면이나 견적으로 특정');
    }else{
      resident='아직 판단 어려움';
      permit='공사 범위를 먼저 확인해야 함';
      level='warn';
    }

    if(f==='ltr'){
      decision='장기수선충당금 사용계획서 작성 + 입주자대표회의 의결 필요';
      if(p==='early'){
        resident='전체 입주자 과반수의 서면동의 필요';
        check.push('3년이 지나기 전 장기수선계획 수시조정 절차 진행');
        level='danger';
      }else if(p==='in'){
        check.push('현재 장기수선계획의 공종·시기·금액 범위와 맞는지 확인');
      }else if(p==='regular'){
        check.push('3년 정기조정으로 반영된 사항인지 기록 확인');
      }else{
        check.push('장기수선계획에 이미 있는지, 수시조정이 필요한지 확인');
        if(level!=='danger')level='warn';
      }
    }else if(f==='misc'){
      decision='잡수입 사용은 산들마을 관리규약 제63조에 따라 용도·재원별 절차 확인 필요';
      check.push('어떤 종류의 잡수입인지와 제63조상 주민동의 대상인지 관리사무소 회계 확인');
      if(level!=='danger')level='warn';
    }else if(f==='budget'){
      decision='편성된 예산 범위와 사업자 선정·계약 절차를 확인해 관리주체가 집행';
    }else if(f==='lh'){
      decision='LH·사업주체 부담이면 비용 재원 때문에 주민동의를 받는 것은 아님';
      check.push('LH 보수 범위·착수 일정·책임관계를 문서로 확인');
    }else{
      decision='재원 확정 전에는 집행 절차를 확정하기 어려움';
      check.push('관리사무소가 보수 범위·예상비용·회계 재원을 먼저 확인');
      if(level!=='danger')level='warn';
    }

    if(b==='no'){
      check.push('예산 미확보 상태에서 입주자등에게 채무부담이 생기는 공사는 진행할 수 없음');
      level='danger';
    }else if(b==='auto'&&f!=='lh'){
      check.push('집행 전 예산이 확보되어 있는지 확인');
    }

    if(w==='repair'&&f==='lh'){
      resident='현재 적힌 누수·곰팡이 보수 범위라면 통상 불필요';
    }
    if(!check.length)check.push('공사 범위와 재원이 확정되면 관리사무소에서 최종 절차 확인');
    result.className='procedure-result'+(level?' '+level:'');
    result.innerHTML=line('주민동의',resident)+line('행위허가',permit)+line('누가 처리?',decision)+line('확인할 것',check.join(' · '));
  }

  [work,fund,plan,budget].forEach(function(x){x.addEventListener('change',render);});
  watched.forEach(function(x){x.addEventListener('input',render);x.addEventListener('change',render);});
  document.getElementById('sampleBtn').addEventListener('click',function(){setTimeout(function(){work.value='repair';fund.value='auto';plan.value='auto';budget.value='auto';render();},0);});
  document.getElementById('newBtn').addEventListener('click',function(){setTimeout(function(){if(!document.getElementById('title').value.trim()){work.value='auto';fund.value='auto';plan.value='auto';budget.value='auto';render();}},0);});
  document.getElementById('libraryList').addEventListener('click',function(e){if(e.target&&e.target.tagName==='BUTTON'&&e.target.textContent==='불러오기'){setTimeout(function(){work.value='auto';fund.value='auto';plan.value='auto';budget.value='auto';render();},50);}});
  render();
})();