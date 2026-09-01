(function(){
  const store=window.SandleAdminStore;
  const views=window.SandleAdminViews||{};
  const root=document.getElementById('adminView');
  const nav=document.getElementById('adminNav');
  const title=document.getElementById('adminCurrentTitle');
  const previewDialog=document.getElementById('adminPreviewDialog');
  const previewClose=document.getElementById('adminPreviewClose');
  if(!store||!root||!nav)return;
  let current='dashboard';
  const titles={dashboard:'2단계 테스트 홈',register:'2.2 새 자료 등록',visibility:'2.3 공개 등급',classification:'2.4 분류 검토',relations:'2.4 관계 검토',publish:'발행 대기',meeting:'회의 작성 연결'};
  function updateBadges(){
    const c=store.getCounts();
    const map={classification:c.classification,relations:c.relations,publish:c.publish};
    Object.entries(map).forEach(([key,val])=>{const el=nav.querySelector(`[data-count="${key}"]`);if(el){el.textContent=val;el.hidden=!val;}});
  }
  function render(view){
    if(!views[view])view='dashboard';current=view;
    nav.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
    if(title)title.textContent=titles[view]||'관리 작업대';
    views[view](root,store);updateBadges();
    try{history.replaceState(null,'','#'+view);}catch(e){}
    window.scrollTo({top:0,behavior:'smooth'});
  }
  nav.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>render(b.dataset.view));
  window.addEventListener('sandle-admin:navigate',e=>render(e.detail||'dashboard'));
  store.subscribe(()=>{updateBadges();render(current);});
  if(previewClose)previewClose.onclick=()=>{if(previewDialog.open&&typeof previewDialog.close==='function')previewDialog.close();else previewDialog.removeAttribute('open');};
  if(previewDialog)previewDialog.addEventListener('click',e=>{if(e.target===previewDialog&&previewClose)previewClose.click();});
  const initial=(location.hash||'').replace('#','');render(views[initial]?initial:'dashboard');
})();