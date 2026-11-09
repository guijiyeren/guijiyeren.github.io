/* 2026-11-02 首页精简：把「词从哪来」收成标题旁的小叹号 */
(()=>{'use strict';
const q=s=>document.querySelector(s);
function why(){
  const h=q('#topic-keywords .keyword-heading h3');
  if(!h||q('#keyword-why'))return;
  const b=document.createElement('button');
  b.id='keyword-why';b.type='button';b.textContent='!';b.title='词从哪里来';
  b.setAttribute('aria-label','词从哪里来，数据怎么更新');
  b.onclick=()=>window.atlasCollectionInfo?.();
  h.append(b);
}
function collapse(){
  const root=q('#topic-keywords'),head=q('#topic-keywords .keyword-heading h3');
  if(!root||!head||q('#keyword-collapse'))return;
  const b=document.createElement('button');b.id='keyword-collapse';b.type='button';b.textContent='收起词云';
  b.onclick=()=>{const c=root.classList.toggle('cloud-collapsed');b.textContent=c?'展开词云':'收起词云';};
  head.append(b);
}
function all(){why();collapse();}
document.addEventListener('atlas:loaded',all);
all();
})();
