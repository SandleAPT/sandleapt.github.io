const assert=require('assert');
const fs=require('fs');
const path=require('path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'app.js'),'utf8');

const ids=[...html.matchAll(/id="([^"]+)"/g)].map(match=>match[1]);
const duplicates=ids.filter((id,index)=>ids.indexOf(id)!==index);
assert.deepEqual(duplicates,[],'HTML id must be unique');

for(const id of [...js.matchAll(/getElementById\("([^"]+)"\)/g)].map(match=>match[1])){
  assert(ids.includes(id),`missing HTML id: ${id}`);
}

assert(html.includes('name="docType" value="decision"'));
assert(html.includes('name="docType" value="report"'));
assert(html.includes('id="agendaNo" type="hidden"'),'number is automatic, not manually selected');
assert(html.includes('id="followupField" hidden'));
assert(html.includes('./meeting-order.js?v=1'));
assert(js.includes('같은 회의일 안에서 번호가 자동 정리됩니다.'));
assert(js.includes('moveDocument(doc.id,-1)'));
assert(js.includes('의결한다|승인한다|선정한다|확정한다|변경한다|집행한다'));

console.log('form contract tests passed');
