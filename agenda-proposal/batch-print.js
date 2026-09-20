(function(){
  'use strict';
  window.ProposalPrint={create:function(api){
    var dialog=document.createElement('dialog');
    dialog.className='print-picker';
    dialog.innerHTML='<h2>인쇄할 회의자료 선택</h2><p>최근 회의일순 · 같은 날짜는 의결안건, 보고사항의 번호순입니다.<br>저장된 표지·본문을 연달아 출력합니다. 각 자료의 ‘첨부 포함’을 체크하면 PDF·JPG·PNG를 본문 뒤에 함께 출력합니다. HWP는 한글에서 별도 인쇄해 주세요.</p><div class="print-actions"><button type="button" data-all>전체 선택</button><button type="button" data-none>선택 해제</button></div><div class="print-list"></div><p role="status" aria-live="polite"></p><div class="print-actions"><button type="button" data-current>현재 작성본 인쇄</button><button type="button" data-close>닫기</button><button type="button" class="primary" data-print disabled>선택한 자료 인쇄</button></div>';
    document.body.appendChild(dialog);
    var list=dialog.querySelector('.print-list'),status=dialog.querySelector('[role=status]'),submit=dialog.querySelector('[data-print]'),rows=[],busy=false;
    var stage=document.createElement('div');stage.id='printBatch';stage.setAttribute('aria-hidden','true');document.body.appendChild(stage);
    function selected(){return Array.from(list.querySelectorAll('input.print-document:checked')).map(function(input){return rows[Number(input.value)];});}
    function count(){var n=selected().length;submit.disabled=busy||!n;submit.textContent='선택한 '+n+'건 인쇄';}
    function lock(value){busy=value;dialog.querySelectorAll('button,input').forEach(function(el){el.disabled=value;});count();}
    function clear(){document.body.classList.remove('batch-printing');stage.replaceChildren();}
    function print(){if(document.body.classList.contains('access-pending')){clear();dialog.close();return;}dialog.close();document.body.classList.add('batch-printing');window.print();}
    dialog.addEventListener('cancel',function(e){if(busy)e.preventDefault();});
    dialog.querySelector('[data-close]').onclick=function(){dialog.close();};
    dialog.querySelector('[data-all]').onclick=function(){list.querySelectorAll('input.print-document').forEach(function(el){el.checked=true;});count();};
    dialog.querySelector('[data-none]').onclick=function(){list.querySelectorAll('input').forEach(function(el){el.checked=false;});count();};
    list.onchange=count;
    dialog.querySelector('[data-current]').onclick=function(){
      clear();if(!api.fit()){status.textContent='현재 작성본이 A4 한 장을 넘습니다. 내용을 줄여 주세요.';return;}api.currentPages().forEach(function(page){stage.appendChild(page.cloneNode(true));});
      stripIds();print();
    };
    function stripIds(){stage.querySelectorAll('[id]').forEach(function(node){node.removeAttribute('id');});}
    submit.onclick=async function(){
      var docs=selected();if(!docs.length||busy)return;
      lock(true);clear();
      try{
        for(var i=0;i<docs.length;i++){
          status.textContent='인쇄 준비 중… '+(i+1)+' / '+docs.length+' · '+docs[i].title;
          var payload=await api.load(docs[i]);
          var pages=render(docs[i],payload);
          pages.forEach(function(page){stage.appendChild(page);});
          if(!fitPages(pages))throw new Error('‘'+docs[i].title+'’의 내용이 A4 한 장을 넘습니다. 내용을 줄인 후 다시 선택해 주세요.');
          var host=list.querySelector('[data-attachments="'+rows.indexOf(docs[i])+'"]');
          var include=host.querySelector('input.print-include').checked;
          var files=include?(payload.attachments||[]).filter(function(file){return window.ProposalAttachmentPrint.kind(file)!=='file';}):[];
          for(var f=0;f<files.length;f++){
            var file=files[f];
            status.textContent='첨부 인쇄 준비 중… '+file.name;
            await window.ProposalAttachmentPrint.append(file,stage);
          }
        }
        if(document.body.classList.contains('access-pending'))throw new Error('수정용 권한을 다시 확인해 주세요.');
        stripIds();status.textContent=docs.length+'건 준비 완료';print();
      }catch(error){clear();status.textContent='인쇄 준비 실패: '+error.message;}
      finally{lock(false);}
    };
    function fitPages(pages){
      return [10.5,10.25,10].some(function(size,i){
        pages.forEach(function(page){page.style.setProperty('--doc-size',size+'pt');page.style.setProperty('--doc-line',[1.62,1.58,1.54][i]);page.style.setProperty('--section-gap',[12,10,8][i]+'px');});
        return pages.every(function(page){return page.scrollHeight<=page.clientHeight+1;});
      });
    }
    function render(doc,payload){
      var pages=api.currentPages().map(function(page){return page.cloneNode(true);});
      var data=payload.data||payload,cfg=api.config[doc.docType];
      function node(id){return pages[0].querySelector('#'+id)||pages[1].querySelector('#'+id);}
      function text(id,value){var el=node(id);el.textContent=value;el.classList.remove('empty');}
      var date=data.decisionDate||doc.date,parts=date.split('-');
      var header=parts.length===3?'제'+api.term+'기 '+parts[0]+'년'+parts[1]+'월'+((data.meetingType||doc.meetingType)?' '+(data.meetingType||doc.meetingType):'')+' 입주자대표회의':'';
      text('pMeetingHeaderCover',header);text('pMeetingHeaderBody',header);
      text('pAgendaNo','제 '+api.number(doc)+' 호');text('pDecisionMeta',api.date(date));
      text('pTitle',data.title||doc.title);text('pProposer',data.proposer||'-');text('pDate',api.date(data.date));
      ['Decision','Background','Details','Cost','Basis','Refs'].forEach(function(key){api.renderText(node('p'+key),data[key.toLowerCase()],'-');});
      var labels={pNumberLabel:'numberLabel',pTypeLabel:'typeLabel',pMeetingDateLabel:'meetingDateLabel',pSubmissionDateLabel:'submissionDateLabel',pDecisionHeading:'decisionHeading',pBackgroundHeading:'backgroundHeading',pCostHeading:'costHeading',pRefsHeading:'refsHeading',pBasisLabel:'basisLabel',pRefsLabel:'refsLabel'};
      Object.keys(labels).forEach(function(id){text(id,cfg[labels[id]]);});
      text('pProposerLabel',doc.docType==='report'?'보 고 자':'제 출 자');
      var attachments=node('pAttachments');attachments.replaceChildren();
      var ul=document.createElement('ul');(payload.attachments||[]).forEach(function(file,i){var li=document.createElement('li');li.textContent='※ 첨부'+(i+1)+': '+(file.name||'첨부파일');ul.appendChild(li);});attachments.appendChild(ul);
      return pages;
    }
    return {open:async function(){
      if(busy)return;clear();list.replaceChildren();rows=[];status.textContent='저장된 자료를 확인하고 있어요…';dialog.showModal();lock(true);
      try{
        rows=api.sort(await api.list());
        rows.forEach(function(doc,i){var label=document.createElement('label');label.className='print-choice';var input=document.createElement('input');input.type='checkbox';input.className='print-document';input.value=String(i);var span=document.createElement('span');span.textContent=api.date(doc.date)+' · '+(doc.docType==='report'?'보고':'의결')+' '+api.number(doc)+'호 · '+doc.title;label.append(input,span);list.appendChild(label);var host=document.createElement("div");host.className="print-attachments";host.setAttribute("data-attachments",String(i));var option=document.createElement('label');option.className='print-attachment';
          var include=document.createElement('input');include.type='checkbox';include.className='print-include';include.setAttribute('aria-label',doc.title+' 첨부 포함');
          option.append(include,document.createTextNode('첨부 포함 · PDF·이미지가 있으면 함께 출력'));host.appendChild(option);list.appendChild(host);});
        status.textContent=rows.length?'출력할 자료를 체크해 주세요. 저장 전 수정 내용은 현재 작성본에만 반영됩니다.':'저장된 회의자료가 없습니다. 현재 작성본은 바로 인쇄할 수 있어요.';
      }catch(error){status.textContent='목록을 불러오지 못했습니다: '+error.message;}
      finally{lock(false);}
    }};
  }};
})();
