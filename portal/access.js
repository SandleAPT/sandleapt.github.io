(function(root){
  'use strict';
  function allowed(item,role){return !!item&&(!item.adminOnly||role==='edit')&&(!item.memberOnly||role==='view'||role==='edit');}
  function create(options){
    var storage=options.storage,role='',verifiedKey='',verifiedAt=0,sequence=0;
    function read(key){try{return storage.getItem(key)||'';}catch(e){return '';}}
    function session(){
      var key=read('sandle_admin_key'),at=Number(read('sandle_admin_unlock_at'));
      var ttl=read('sandle_admin_trust')==='1'?2592000000:86400000;
      return key&&at>0&&at<=Date.now()&&Date.now()-at<ttl?key:'';
    }
    function apply(next){if(role!==next){role=next;options.change(role);}}
    function clear(){['sandle_admin_key','sandle_admin_unlock_at','sandle_admin_trust'].forEach(function(k){storage.removeItem(k);});}
    async function request(key){
      var controller=new AbortController(),timer;
      try{
        return await Promise.race([
          (async function(){var response=await options.fetch(options.url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'verify',adminKey:key,token:options.token,privateStoreUrl:read('sandle_private_url')}),signal:controller.signal});
            if(!response.ok)throw new Error('권한 확인에 실패했습니다.');
            var result=await response.json();return result&&result.ok&&(result.role==='view'||result.role==='edit')?result:{role:''};})(),
          new Promise(function(_,reject){timer=setTimeout(function(){controller.abort();reject(new Error('응답이 늦어지고 있습니다. 다시 시도해 주세요.'));},15000);})
        ]);
      }finally{clearTimeout(timer);}
    }
    function connect(result){
      if(result.role!=='edit'||!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(result.privateStoreUrl||''))return;
      var changed=read('sandle_private_url')!==result.privateStoreUrl;
      storage.setItem('sandle_private_url',result.privateStoreUrl);
      if(changed&&root.dispatchEvent&&root.Event)root.dispatchEvent(new root.Event('sandle-cloud-connected'));
    }
    async function login(key,trust){
      var ticket=++sequence;clear();verifiedKey='';apply('');
      var next=await request(key);
      if(ticket!==sequence)return false;
      if(!next.role){clear();verifiedKey='';throw new Error('비밀번호가 올바르지 않습니다.');}
      storage.setItem('sandle_admin_key',key);storage.setItem('sandle_admin_unlock_at',String(Date.now()));
      storage.setItem('sandle_admin_trust',trust?'1':'0');
      connect(next);verifiedKey=key;verifiedAt=Date.now();apply(next.role);return true;
    }
    async function restore(force){
      var key=session();
      if(!key){++sequence;verifiedKey='';apply('');return;}
      if(!force&&key===verifiedKey&&Date.now()-verifiedAt<300000)return;
      var ticket=++sequence;if(key!==verifiedKey)apply('');
      try{var next=await request(key);if(ticket!==sequence||session()!==key)return;
        connect(next);verifiedKey=key;verifiedAt=Date.now();if(!next.role)clear();apply(next.role);
      }catch(e){if(ticket===sequence){verifiedKey='';apply('');}}
    }
    function logout(){++sequence;clear();verifiedKey='';apply('');}
    function expire(){if((role||verifiedKey)&&!session()){++sequence;verifiedKey='';apply('');}}
    return {login:login,restore:restore,logout:logout,expire:expire,role:function(){return role;}};
  }
  root.PortalAccess={allowed:allowed,create:create};
  if(typeof module!=='undefined')module.exports=root.PortalAccess;
})(typeof window!=='undefined'?window:globalThis);
