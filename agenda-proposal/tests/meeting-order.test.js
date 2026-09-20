const assert=require('assert');
const order=require('../meeting-order.js');

const rows=[
  order.parseRecord({id:'d1',title:'[회의자료][의결][정기][1024] 첫 안건',date:'2026-09-30',updatedAt:'2026-09-20T01:00:00Z'}),
  order.parseRecord({id:'d2',title:'[회의자료][의결][정기][2048] 둘째 안건',date:'2026-09-30',updatedAt:'2026-09-20T02:00:00Z'}),
  order.parseRecord({id:'r1',title:'[회의자료][보고][정기][1024] 첫 보고',date:'2026-09-30',updatedAt:'2026-09-20T03:00:00Z'}),
  order.parseRecord({id:'old',title:'[안건제안서] 예전 안건',date:'2026-09-30',updatedAt:'2026-09-20T04:00:00Z'})
];

order.hydrateRecord(rows[3],{data:{agendaNo:'3',meetingType:'정기',title:'예전 안건'}});

assert.equal(order.displayNumber(rows[0],rows),1);
assert.equal(order.displayNumber(rows[1],rows),2);
assert.equal(order.displayNumber(rows[2],rows),1,'보고사항은 의결안건과 번호를 따로 매긴다');
assert.equal(order.displayNumber(rows[3],rows),3,'기존 의안번호는 정렬키로 호환한다');
assert.equal(order.nextOrderKey(rows,'2026-09-30','decision'),4096);

const movedUp=order.moveOrderKey(rows[3],rows,-1);
assert(movedUp>1024&&movedUp<2048,'3호를 위로 옮기면 1호와 2호 사이 정렬키를 만든다');
rows[3].orderKey=movedUp;
assert.equal(order.displayNumber(rows[3],rows),2);
assert.equal(order.displayNumber(rows[1],rows),3);

const afterDelete=rows.filter(row=>row.id!=='d1');
assert.equal(order.displayNumber(rows[3],afterDelete),1,'앞 자료를 지우면 뒤 번호가 자동으로 당겨진다');
assert.equal(order.displayNumber(rows[2],afterDelete),1,'보고번호는 의결안건 삭제의 영향을 받지 않는다');

assert.equal(order.cleanTitle(order.buildRecordTitle({docType:'report',meetingType:'임시',orderKey:1536},'관리비 변동 보고')),'관리비 변동 보고');
assert.equal(order.parseRecord({title:'[회의자료][보고][임시][1536] 관리비 변동 보고'}).docType,'report');

const duplicate=[
  {id:'x1',date:'2026-10-01',docType:'decision',orderKey:1024,createdAt:'1'},
  {id:'x2',date:'2026-10-01',docType:'decision',orderKey:1024,createdAt:'2'},
  {id:'x3',date:'2026-10-01',docType:'decision',orderKey:1024,createdAt:'3'}
];
assert(order.moveOrderKey(duplicate[2],duplicate,-1)<1024,'기존 문서의 정렬키가 겹쳐도 순서를 바꿀 수 있다');

console.log('meeting-order tests passed');
