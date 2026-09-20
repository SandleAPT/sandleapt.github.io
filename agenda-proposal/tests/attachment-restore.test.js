const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(__dirname+'/../app.js','utf8');
const fn=source.slice(source.indexOf('  function storedAttachmentToFile('),source.indexOf('  function newId('));
const ctx={Blob,File,TextEncoder,Uint8Array,atob,fetch(){throw new Error('attachment restore must not fetch');}};
vm.createContext(ctx);vm.runInContext(fn,ctx);
(async()=>{
  const bytes=Buffer.from([0,1,128,255,10]);
  const f=await ctx.storedAttachmentToFile({name:'자료.pdf',type:'application/pdf',lastModified:1234,dataUrl:'data:application/pdf;base64,'+bytes.toString('base64')});
  assert.deepEqual(Buffer.from(await f.arrayBuffer()),bytes);assert.equal(f.name,'자료.pdf');assert.equal(f.lastModified,1234);
  const text=await ctx.storedAttachmentToFile({dataUrl:'data:text/plain,'+encodeURIComponent('한글 내용')});
  assert.equal(await text.text(),'한글 내용');
  await assert.rejects(ctx.storedAttachmentToFile({name:'오류.pdf',dataUrl:'broken'}),/형식/);
  await assert.rejects(ctx.storedAttachmentToFile({dataUrl:'data:application/pdf;base64,%%%'}));
  assert.equal(await ctx.storedAttachmentToFile(null),null);
  console.log('attachment restore passed: binary bytes, Korean text, metadata, invalid data, no fetch');
})().catch(e=>{console.error(e);process.exitCode=1;});
