(function(){
  'use strict';
  window.ProposalReferences={apply:function(root,data,files){
    var basis=root.querySelector('#pBasis'),refs=root.querySelector('#pRefs');
    var showBasis=data.showBasis!==false&&!!String(data.basis||'').trim();
    var showRefs=data.showRefs!==false&&!!String(data.refs||'').trim();
    [[basis,'showBasisTitle'],[refs,'showRefsTitle']].forEach(function(pair){
      var row=pair[0].parentElement,hidden=data[pair[1]]===false;
      row.querySelector('b').hidden=hidden;row.classList.toggle('without-title',hidden);
    });
    basis.parentElement.hidden=!showBasis;refs.parentElement.hidden=!showRefs;
    root.querySelector('#refsSection').hidden=!showBasis&&!showRefs&&!(files||[]).length;
  }};
})();
