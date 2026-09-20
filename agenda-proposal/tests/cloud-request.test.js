const assert=require('assert');
const fs=require('fs');
const vm=require('vm');
const code=fs.readFileSync(__dirname+'/../cloud-request.js','utf8');
async function request(action,replies,timeout=false){
  let calls=0;
  const context={AbortController,fetch:()=>{const result=replies[calls++];return result instanceof Error?Promise.reject(result):Promise.resolve(result);},
    setTimeout:(fn,ms)=>setTimeout(fn,ms===15000?(timeout?5:1000):0),clearTimeout};
  vm.createContext(context);vm.runInContext(code,context);
  try{return {value:await context.ProposalCloud.json('https://example.invalid',{body:JSON.stringify({action})}),calls};}
  catch(error){return {error,calls};}
}
(async()=>{
  const ok={ok:true,json:async()=>({ok:true,item:{json:'{}'}})};
  let r=await request('get',[new Error('network'),{ok:false,status:404},ok]);
  assert.equal(r.calls,3);assert(r.value.item);
  r=await request('get',[{ok:true,json:async()=>{throw new SyntaxError('HTML');}},ok]);
  assert.equal(r.calls,2);assert(r.value.ok);
  r=await request('get',[{ok:true,json:async()=>({ok:false,error:'denied'})}]);
  assert.equal(r.calls,1);assert.equal(r.value.error,'denied');
  r=await request('get',Array(3).fill({ok:true,json:()=>new Promise(()=>{})}),true);
  assert.equal(r.calls,3);assert(r.error.message.includes('지연'));
  r=await request('save',[new Error('network'),ok]);
  assert.equal(r.calls,1);assert(r.error,'writes must not retry');
  console.log('cloud request tests passed: retry, HTML, denied, timeout, no write retry');
})().catch(e=>{console.error(e);process.exitCode=1;});
