const assert=require('node:assert/strict');
const {create,allowed}=require('../access.js');
function fixture(){
  const values=new Map(),changes=[];let reply={ok:true,role:'edit'};
  const storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
  const auth=create({storage,url:'test',token:'test',change:r=>changes.push(r),fetch:async()=>({ok:true,json:async()=>reply})});
  return {auth,storage,changes,setReply:r=>{reply=r;}};
}
(async()=>{
  for(const role of ['', 'view','edit']){
    assert(allowed({},role));assert.equal(allowed({adminOnly:true},role),role==='edit');assert.equal(allowed({memberOnly:true},role),!!role);
  }
  const f=fixture();await f.auth.login('test-edit',false);assert.equal(f.auth.role(),'edit');
  f.setReply({ok:true,role:'view'});await f.auth.login('test-view',true);assert.equal(f.auth.role(),'view');
  assert.equal(f.storage.getItem('sandle_admin_trust'),'1');
  f.setReply({ok:false,role:'edit'});await assert.rejects(f.auth.login('invalid',false));assert.equal(f.auth.role(),'');assert(!f.storage.getItem('sandle_admin_key'));
  f.setReply({ok:true,role:'edit'});await f.auth.login('test-edit',false);
  f.storage.setItem('sandle_admin_unlock_at',String(Date.now()-86400001));f.auth.expire();assert.equal(f.auth.role(),'');
  await f.auth.login('test-edit',false);f.setReply({ok:false});await f.auth.restore(true);assert.equal(f.auth.role(),'');
  let resolve;const storage=f.storage;
  const raced=create({storage,url:'test',token:'test',change(){},fetch:()=>new Promise(r=>{resolve=r;})});
  const pending=raced.login('test-edit',false);raced.logout();resolve({ok:true,json:async()=>({ok:true,role:'edit'})});await pending;
  assert.equal(raced.role(),'');assert(!storage.getItem('sandle_admin_key'));
  console.log('Portal access passed: role matrix, login, downgrade, wrong key, expiry, revocation, stale login after logout');
})().catch(error=>{console.error(error);process.exitCode=1;});
