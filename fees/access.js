'use strict';
let feesRole='',feesAuth=null,feesLoginBusy=false;
const feesEditTabs=['decisions','audit','auditcheck'];
function feesCanEdit(){return feesRole==='edit';}
function feesTabAllowed(tab){return feesEditTabs.includes(tab)?feesCanEdit():tab==='checks'?!!feesRole:['detail','trend'].includes(tab);}
function feesApplyRole(role){
  const previous=feesRole;feesRole=role;
  document.querySelectorAll('.tabs button').forEach(button=>{button.hidden=!feesTabAllowed(button.dataset.tab);});
  if((previous||DATA)&&previous!==role){location.reload();return;}
  if(role)appBoot();
}
async function feesSignIn(inputId,messageId){
  if(feesLoginBusy)return;
  const input=document.getElementById(inputId),message=document.getElementById(messageId),key=input?input.value.trim():'';
  if(!key){if(message)message.textContent='비밀번호를 입력해 주세요.';return;}
  feesLoginBusy=true;if(message)message.textContent='권한 확인 중…';
  try{await feesAuth.login(key,localStorage.getItem('sandle_admin_trust')==='1');}
  catch(error){if(message)message.textContent=error.message||'권한 확인에 실패했습니다.';}
  finally{feesLoginBusy=false;if(input)input.value='';}
}
function feesInitAccess(){
  feesAuth=PortalAccess.create({storage:localStorage,fetch:window.fetch.bind(window),url:GAS_URL,token:GAS_TOKEN,change:feesApplyRole});
  feesApplyRole('');feesAuth.restore(false).then(()=>{if(!feesRole)appBoot();});
  function check(){if(!feesLoginBusy)feesAuth.restore(false);}
  window.addEventListener('storage',event=>{if(!event.key||['sandle_admin_key','sandle_admin_unlock_at','sandle_admin_trust'].includes(event.key))check();});
  window.addEventListener('focus',check);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
  setInterval(check,300000);setInterval(()=>{if(!feesLoginBusy)feesAuth.expire();},1000);
}
