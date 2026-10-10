const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(__dirname+'/../access.js','utf8');
for(const initial of ['','view','edit']){
 let role=initial,pending=true,tick;const nodes={accessGate:{style:{}},accessGateTitle:{},accessGateText:{}};
 const context={document:{getElementById:id=>nodes[id],body:{classList:{toggle:(c,v)=>pending=v}}},location:{origin:'https://example.test'},setInterval:fn=>tick=fn,window:{parent:{location:{origin:'https://example.test'},portalAccess:{role:()=>role,expire(){}}},addEventListener(){}},PortalAccess:{create(){throw Error('Embedded app must not verify again');}}};
 vm.runInNewContext(source,context);assert.equal(pending,initial!=='edit');role='';tick();assert(pending);role='view';tick();assert(pending);role='edit';tick();assert(!pending);
}
console.log('Proposal parent session: all roles and revocation passed');
