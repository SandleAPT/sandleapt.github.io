(function(root){
  "use strict";
  function json(url,options,onProgress){
    var body=JSON.parse(options.body||"{}");
    var tries=body.action==="get"||body.action==="list"?3:1;
    var total=tries;
    function attempt(){
      var controller=new AbortController(),timer;
      return new Promise(function(resolve,reject){
        timer=setTimeout(function(){controller.abort();reject(new Error("응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요."));},15000);
        fetch(url,Object.assign({},options,{cache:"no-store",signal:controller.signal}))
          .then(function(response){
            if(!response.ok)throw new Error("저장소 응답 오류 ("+response.status+")");
            return response.json();
          }).then(resolve,reject);
      }).finally(function(){clearTimeout(timer);});
    }
    function run(){
      if(onProgress)onProgress(total-tries+1,total);
      return attempt().catch(function(err){
        if(--tries<=0)throw err;
        return new Promise(function(resolve){setTimeout(resolve,700);}).then(run);
      });
    }
    return run();
  }
  root.ProposalCloud={json:json};
})(typeof window!=="undefined"?window:globalThis);
