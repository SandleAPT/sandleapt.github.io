(function(root){
  'use strict';
  function validUrl(value){
    var url=new URL(String(value).trim());
    if(url.protocol!=='https:'||url.hostname!=='script.google.com'||!/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url.pathname)||url.search||url.hash)throw new Error('올바른 클라우드 저장소 주소를 입력해 주세요.');
    return url.href;
  }
  function decode(text){
    var data=JSON.parse(text);
    if(data.kind!=='sandle-cloud-connection'||data.version!==1)throw new Error('산들마을 연결 설정 파일이 아닙니다.');
    return validUrl(data.url);
  }
  function open(current,onSave){
    var dialog=document.createElement('dialog');
    dialog.style.cssText='width:min(480px,calc(100vw - 40px));box-sizing:border-box;border:1px solid #d9d1c2;border-radius:14px;padding:22px;color:#30342f';
    dialog.setAttribute('aria-labelledby','cloudSettingsTitle');
    dialog.innerHTML='<h2 id="cloudSettingsTitle" style="margin:0 0 12px;font-size:19px">클라우드 연결 설정</h2>'+
      '<p style="font-size:14px;line-height:1.6">다른 기기에서는 여기서 받은 <b>연결 설정 파일</b>을 가져오면 됩니다. 수정용 비밀번호는 각 기기에서 따로 입력해 주세요.</p>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" data-action="export">연결 설정 파일 내려받기</button><button type="button" data-action="import">연결 설정 파일 가져오기</button></div>'+
      '<input type="file" accept=".json,application/json" hidden>'+
      '<details style="margin-top:18px"><summary>주소 직접 입력·복사</summary><label style="display:block;margin-top:12px">저장소 주소<textarea rows="4" spellcheck="false" style="display:block;width:100%;box-sizing:border-box;margin:6px 0;overflow-wrap:anywhere"></textarea></label><button type="button" data-action="copy">주소 복사</button></details>'+
      '<p data-status role="status" style="font-size:13px;line-height:1.5;min-height:20px">설정 파일에는 저장소 주소만 담기며, 비밀번호와 회의자료는 포함되지 않습니다.</p>'+
      '<div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" data-action="close">닫기</button><button type="button" data-action="save">연결 적용</button></div>';
    document.body.appendChild(dialog);
    var input=dialog.querySelector('textarea'),fileInput=dialog.querySelector('input'),status=dialog.querySelector('[data-status]');input.value=current;
    function report(error){status.textContent=error.message||String(error);}
    dialog.querySelector('[data-action="close"]').onclick=function(){dialog.close();};
    dialog.addEventListener('close',function(){dialog.remove();});
    dialog.querySelector('[data-action="save"]').onclick=function(){try{onSave(validUrl(input.value));dialog.close();}catch(error){report(error);}};
    dialog.querySelector('[data-action="import"]').onclick=function(){fileInput.click();};
    fileInput.onchange=async function(){
      var file=fileInput.files[0];if(!file)return;
      try{
        if(file.size>16384)throw new Error('연결 설정 파일을 선택해 주세요. 회의자료 파일은 가져올 수 없습니다.');
        input.value=decode(await file.text());
        status.textContent='설정 파일을 읽었어요. 「연결 적용」을 누르면 이 저장소에 연결합니다.';
      }catch(error){report(error);}finally{fileInput.value='';}
    };
    dialog.querySelector('[data-action="export"]').onclick=function(){
      try{
        var url=validUrl(input.value),blob=new Blob([JSON.stringify({kind:'sandle-cloud-connection',version:1,url:url},null,2)],{type:'application/json'});
        var href=URL.createObjectURL(blob),a=document.createElement('a');a.href=href;a.download='sandle-cloud-connection.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(href);},1000);
        status.textContent='다운로드한 파일을 다른 기기로 옮긴 뒤 「클라우드 연결 → 연결 설정 파일 가져오기」를 눌러 주세요.';
      }catch(error){report(error);}
    };
    dialog.querySelector('[data-action="copy"]').onclick=async function(){
      try{await navigator.clipboard.writeText(validUrl(input.value));status.textContent='주소를 복사했어요. 다른 기기의 주소 입력란에 붙여넣어 주세요.';}
      catch(error){dialog.querySelector('details').open=true;input.focus();input.select();status.textContent='주소를 선택했어요. Ctrl+C 또는 길게 눌러 복사해 주세요.';}
    };
    if(!current)status.textContent='다른 기기에서 받은 설정 파일을 가져오거나 저장소 주소를 입력해 주세요.';
    dialog.showModal();
  }
  root.ProposalCloudSettings={open:open,validUrl:validUrl,decode:decode};
})(typeof window!=='undefined'?window:globalThis);
