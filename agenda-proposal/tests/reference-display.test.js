const assert=require('assert'),fs=require('fs'),vm=require('vm');
const {parseHTML}=require('linkedom');
const {document,window}=parseHTML(fs.readFileSync(__dirname+'/../index.html','utf8'));
vm.runInNewContext(fs.readFileSync(__dirname+'/../reference-display.js','utf8'),{window});
const root=document.getElementById('bodyPaper'),basis=document.getElementById('pBasis').parentElement,refs=document.getElementById('pRefs').parentElement,section=document.getElementById('refsSection');
window.ProposalReferences.apply(root,{},[]);assert(basis.hidden&&refs.hidden&&section.hidden);
const data={basis:'규정 원문',refs:'기타 원문',showBasis:false,showRefs:true};
window.ProposalReferences.apply(root,data,[]);assert(basis.hidden&&!refs.hidden&&!section.hidden);assert.equal(data.basis,'규정 원문');
window.ProposalReferences.apply(root,{showBasis:false,showRefs:false},[{name:'첨부.pdf'}]);assert(basis.hidden&&refs.hidden&&!section.hidden);
window.ProposalReferences.apply(root,{basis:'이전 저장 자료',refs:'이전 기타'},[]);assert(!basis.hidden&&!refs.hidden);
const source=fs.readFileSync(__dirname+'/../app.js','utf8');
const ctx={hideBasis:{checked:true},hideRefs:{checked:false},showBasisTitle:{checked:false},showRefsTitle:{checked:true},getDocType:()=> 'decision',ids:['basis','refs'],el:{basis:{value:'숨긴 내용'},refs:{value:'보이는 내용'},date:{value:'2026-09-21'}},setDocType(){},today:()=> '2026-09-21',applyTypeUi(){}};
vm.createContext(ctx);vm.runInContext(source.slice(source.indexOf('  function formData(){'),source.indexOf('  function normalizeMeetingType')),ctx);
vm.runInContext(source.slice(source.indexOf('  function applyData(data){'),source.indexOf('  function saveDraft()')),ctx);
const saved=ctx.formData();assert.equal(saved.showBasis,false);assert.equal(saved.basis,'숨긴 내용');ctx.hideBasis.checked=false;ctx.applyData(saved);assert.equal(ctx.hideBasis.checked,true);assert.equal(ctx.showBasisTitle.checked,false);assert.equal(ctx.el.basis.value,'숨긴 내용');ctx.applyData({basis:'구버전'});assert(!ctx.hideBasis.checked&&!ctx.hideRefs.checked&&ctx.showBasisTitle.checked&&ctx.showRefsTitle.checked);
console.log('Reference display passed: empty/hidden/restored rows, attachment-only section, flags roundtrip and legacy defaults.');

for(const title of [true,false])for(const content of [true,false]){
 window.ProposalReferences.apply(root,{basis:'규정',refs:'기타',showBasis:content,showRefs:content,showBasisTitle:title,showRefsTitle:title},[]);
 assert.equal(basis.hidden,!content);assert.equal(refs.hidden,!content);
 assert.equal(basis.querySelector('b').hidden,!title);assert.equal(refs.querySelector('b').hidden,!title);
 assert.equal(basis.classList.contains('without-title'),!title);assert.equal(section.hidden,!content);
}
console.log('Independent title/content combinations passed.');
