const fs=require('fs'),vm=require('vm'),assert=require('assert');
const buttons=['detail','trend','checks','decisions','audit','auditcheck'].map(tab=>({dataset:{tab},classList:{add(){},remove(){}}}));
let selected=[],loads=[],boots=0,gates=0;
const context={document:{querySelectorAll:s=>s==='.tabs button'?buttons:[],getElementById:id=>({classList:{add(){selected.push(id);}}})},location:{reload(){}},appBoot(){boots++},appShowGate(){gates++},loadAudit(){loads.push('audit')},loadAuditChecks(){loads.push('auditcheck')}};
vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/../access.js','utf8'),context);
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
vm.runInContext(html.split('\n').find(line=>line.startsWith("document.querySelectorAll('.tabs button').forEach(b=>b.onclick=")),context);
for(const role of ['', 'view','edit']){
 vm.runInContext('feesApplyRole('+JSON.stringify(role)+')',context);
 for(const button of buttons){const restricted=['decisions','audit','auditcheck'].includes(button.dataset.tab),allowed=!!role&&(!restricted||role==='edit');assert.equal(button.hidden,!allowed);selected=[];button.onclick();assert.equal(selected.includes(button.dataset.tab),allowed);}
}
assert.deepEqual(loads,['audit','auditcheck']);
assert(html.includes("feesCanEdit()?fetch('decisions.json"));
for(const name of ['loadAudit','loadAuditChecks'])assert(html.includes('async function '+name+'(){if(!feesCanEdit())return;'));
console.log('Fees access passed: public/view/edit visibility, direct tab clicks, restricted loader gates');
