(function(){
  'use strict';
  var loading;
  function kind(file){var name=String(file.name||'').toLowerCase();return /\.pdf$/.test(name)?'pdf':/\.(png|jpe?g)$/.test(name)?'image':'file';}
  function pdfLibrary(){
    if(window.pdfjsLib)return Promise.resolve(window.pdfjsLib);
    if(!loading)loading=new Promise(function(resolve,reject){
      var script=document.createElement('script');script.src='../minutes/assets/js/vendor/pdf.bundle.js';
      script.onload=function(){Promise.resolve(window.sandlePdfReady).then(function(lib){if(!lib)throw Error('PDF 도구 로드 실패');resolve(lib);}).catch(reject);};
      script.onerror=function(){reject(Error('PDF 도구를 불러오지 못했습니다. 다시 시도해 주세요.'));};document.head.appendChild(script);
    }).catch(function(error){loading=null;throw error;});
    return loading;
  }
  function imageReady(source){return new Promise(function(resolve,reject){var image=new Image(),timer=setTimeout(function(){reject(Error('이미지 로딩 시간 초과'));},30000);image.onload=function(){clearTimeout(timer);resolve(image);};image.onerror=function(){clearTimeout(timer);reject(Error('이미지를 읽지 못했습니다.'));};image.src=source;});}
  function sheet(image,name,index,total){var page=document.createElement('article');page.className='paper attachment-paper';var caption=document.createElement('div');caption.className='attachment-caption';caption.textContent='※ '+name+(total>1?' · '+index+' / '+total:'');page.append(caption,image);return page;}
  async function append(file,stage){
    var type=kind(file);if(type==='file')throw Error(file.name+'은 한글에서 별도로 인쇄해 주세요.');
    if(!/^data:[^,]*;base64,/.test(file.dataUrl||''))throw Error(file.name+'의 파일 데이터가 없습니다.');
    if(type==='image'){stage.appendChild(sheet(await imageReady(file.dataUrl),file.name,1,1));return;}
    var lib=await pdfLibrary(),bytes=Uint8Array.from(atob(file.dataUrl.split(',')[1]),function(c){return c.charCodeAt(0);});
    var task=lib.getDocument({data:bytes,isEvalSupported:false}),pdf;
    var rejectPassword,passwordError=new Promise(function(resolve,reject){rejectPassword=reject;});
    task.onPassword=function(){rejectPassword(Error('암호가 걸린 PDF입니다. 암호를 해제한 파일로 첨부해 주세요.'));};
    try{
      pdf=await Promise.race([task.promise,passwordError]);
      for(var i=1;i<=pdf.numPages;i++){
        var page=await pdf.getPage(i),base=page.getViewport({scale:1}),viewport=page.getViewport({scale:Math.min(2,2200/Math.max(base.width,base.height))});
        var canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
        await page.render({canvasContext:canvas.getContext('2d'),viewport:viewport}).promise;
        stage.appendChild(sheet(await imageReady(canvas.toDataURL('image/png')),file.name,i,pdf.numPages));
        canvas.width=canvas.height=0;page.cleanup();
      }
    }finally{await task.destroy();}
  }
  window.ProposalAttachmentPrint={kind:kind,append:append};
})();
