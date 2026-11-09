/* 2026-11-02 关键词弹窗顶部：先给今天的采集，再给历史来源 */
(()=>{'use strict';
const q=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let busy=false,lastTerm='',seq=0;
function current(){const detail=q('#drawer-body .keyword-detail');if(!detail)return null;const h2=detail.querySelector('h2');if(!h2)return null;const term=(h2.textContent||'').trim();if(!term||term.includes('×')||term.length>40)return null;return {detail,term};}
async function run(){
  if(busy)return;
  const cur=current();if(!cur)return;
  if(cur.term===lastTerm&&q('#kw-live'))return;
  const my=++seq;busy=true;lastTerm=cur.term;
  const box=document.createElement('div');box.id='kw-live';box.className='kw-live';
  box.innerHTML='<div class="kw-live-head"><span>正在读取今天关于「'+esc(cur.term)+'」的采集…</span></div>';
  cur.detail.prepend(box);
  try{
    const live=await api('/keyword-events?term='+encodeURIComponent(cur.term)+'&hours=24&limit=10');
    if(my!==seq)return;
    const items=(live.items||[]).slice().sort((a,b)=>new Date(b.collected_at||b.published_at||0)-new Date(a.collected_at||a.published_at||0));
    box.innerHTML='<div class="kw-live-head"><span>今天采集到</span><b>'+(live.total||0)+'</b><span>条 · 近 24 小时</span></div>'+(items.length?'<div class="kw-live-list">'+items.map((x,i)=>'<button class="kw-live-row" data-event="'+esc(x.id)+'"><i class="kw-live-num">'+(i+1)+'</i><span class="kw-live-copy"><b>'+esc(x.title)+'</b><small>'+esc(x.source_name||x.category||'')+'</small></span></button>').join('')+'</div>':'<p class="kw-live-empty">今天没有直接命中的条目，下面是这个词的历史来源。</p>');
    bindEvents(box);
  }catch(ex){
    if(my!==seq)return;
    box.innerHTML='<div class="kw-live-head"><span>今天的采集读取失败</span></div><p class="kw-live-empty">'+esc(ex.message||'')+'</p>';
  }finally{busy=false;}
}
new MutationObserver(()=>setTimeout(run,30)).observe(q('#drawer-body'),{childList:true});
window.addEventListener('click',()=>setTimeout(run,80),true);
})();
