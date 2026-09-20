const assert=require('assert'),fs=require('fs'),vm=require('vm');
const {parseHTML}=require('linkedom');const {window,document}=parseHTML('<html><head></head><body></body></html>');
let destroyed=0;
function FakeImage(){const image=document.createElement('img');Object.defineProperty(image,'src',{set(value){image.setAttribute('src',value);queueMicrotask(()=>image.onload());}});return image;}
const create=document.createElement.bind(document);document.createElement=function(tag){const el=create(tag);if(tag==='canvas'){el.getContext=()=>({});el.toDataURL=()=> 'data:image/png;base64,AA==';}return el;};
window.pdfjsLib={getDocument:()=>({promise:Promise.resolve({numPages:2,getPage:async()=>({getViewport:({scale})=>({width:600*scale,height:800*scale}),render:()=>({promise:Promise.resolve()}),cleanup(){}})}),destroy:async()=>{destroyed++;}})};
const context={window,document,Image:FakeImage,setTimeout,clearTimeout,Uint8Array,atob};vm.createContext(context);vm.runInContext(fs.readFileSync(__dirname+'/../attachment-print.js','utf8'),context);
(async()=>{const api=window.ProposalAttachmentPrint,stage=create('div');
await api.append({name:'사진.jpg',dataUrl:'data:image/jpeg;base64,AA=='},stage);assert.equal(stage.children.length,1);
await api.append({name:'자료.pdf',dataUrl:'data:application/pdf;base64,AA=='},stage);assert.equal(stage.children.length,3);assert(stage.lastChild.textContent.includes('2 / 2'));assert.equal(destroyed,1);
await assert.rejects(api.append({name:'자료.hwp'},stage),/별도로/);await assert.rejects(api.append({name:'없음.pdf'},stage),/데이터/);
assert.equal(stage.children.length,3);console.log('Attachment print passed: image, all PDF pages, cleanup, unsupported and missing-data errors.');})().catch(e=>{console.error(e);process.exitCode=1;});
