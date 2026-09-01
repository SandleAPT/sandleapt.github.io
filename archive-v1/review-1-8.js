(function(){
const hero=document.querySelector('.hero');
const form=document.getElementById('searchForm');
const input=document.getElementById('searchInput');
const allTopics=document.getElementById('allTopics');
const view=document.getElementById('topicView');
if(!hero||!form||!input||!view)return;
const panel=document.createElement('section');
panel.className='flow-review';
panel.innerHTML=`<div class="flow-review-head"><strong>1.8 전체 흐름 점검</strong><span>A/B 최종 선택은 보류 · 동작만 확인</span></div><div class="flow-review-actions"><button type="button" data-flow="home">첫 화면</button><button type="button" data-flow="topic">주제 상세</button><button type="button" data-flow="search-a">검색 A</button><button type="button" data-flow="search-b">검색 B</button><button type="button" data-flow="detail">상세 팝업</button></div><p class="flow-review-note">이 버튼들은 미리보기 전용이야. 홈 → 주제 → 검색 → 상세가 끊기지 않고 이어지는지만 빠르게 확인하고, 검색 화면의 최종 구성은 나중에 바꿀 수 있게 유지해.</p>`;
hero.insertAdjacentElement('afterend',panel);
function home(){const b=view.querySelector('[data-b-home],.home-link');if(b){b.click();return;}input.value='';form.requestSubmit();}
function topic(){home();const buttons=[...(allTopics?allTopics.querySelectorAll('.topic-text-btn'):[])];const b=buttons.find(x=>x.textContent.includes('헬스장'))||buttons[0];if(b)b.click();}
function submitSearch(){input.value='헬스장';form.requestSubmit();}
function searchA(){submitSearch();const toA=view.querySelector('[data-b-mode="A"]');if(toA)toA.click();}
function searchB(){submitSearch();const toB=view.querySelector('[data-switch-b]');if(toB)toB.click();}
function detail(){let b=view.querySelector('.search-b-current,.search-a-current,.detail-item,[data-b-timeline],[data-search-timeline]');if(!b){topic();b=view.querySelector('.detail-item,[data-detail-current]');}if(b)b.click();}
panel.querySelectorAll('[data-flow]').forEach(b=>b.onclick=()=>{const key=b.dataset.flow;if(key==='home')home();if(key==='topic')topic();if(key==='search-a')searchA();if(key==='search-b')searchB();if(key==='detail')detail();});
})();