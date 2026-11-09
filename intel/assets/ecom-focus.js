/* 2026-11-03：电商区改为抖音/快手/小红书的社媒热卖内容，不再抓 1688/阿里。 */
(()=>{'use strict';
const PLATFORM_LABEL={douyin:'抖音',kuaishou:'快手',xiaohongshu:'小红书'};
const PLATFORM_VIEW={douyin:'在抖音打开视频',kuaishou:'在快手打开视频',xiaohongshu:'在小红书打开笔记'};
const root=document.createElement('section');root.id='home-ecom-focus';root.className='homepage-ecom';root.setAttribute('aria-label','社交媒体电商热卖');
root.innerHTML='<div class="home-ecom-head"><div><span class="home-ecom-eyebrow">ECOMMERCE · 社媒热卖</span><h2 id="home-ecom-title">电商 · 袜子热卖</h2><p id="home-ecom-meta">连接后读取抖音/快手/小红书热卖内容</p></div><div class="home-ecom-actions"><button class="ecom-more">查看电商榜单 →</button></div></div><div class="home-ecom-filters"><div id="home-ecom-platforms" class="home-ecom-tabs" role="group" aria-label="平台"></div><div id="home-ecom-tabs" class="home-ecom-tabs" role="group" aria-label="类目"></div></div><div id="home-ecom-cards" class="home-ecom-cards"><p class="home-ecom-empty">等待读取社媒热卖。</p></div>';
const video=document.querySelector('#home-video-focus');
if(video)video.after(root);else document.querySelector('#focus').before(root);
root.hidden=document.body.dataset.intelView!=='focus';
document.addEventListener('atlas:view',e=>{root.hidden=e.detail.id!=='focus';if(!root.hidden)load();});
root.querySelector('.ecom-more').onclick=()=>document.querySelector('.section-nav a[href="#free-rank"]')?.click();
let data=null,selected='',platform='';
function when(v){if(!v)return'';const d=new Date(v);return isNaN(d)?'':d.toLocaleString('zh-CN',{hour12:false,month:'2-digit',day:'2-digit'});}
function cats(){const ks=(data?.keywords||[]).filter(Boolean);const fromItems=[...new Set((data?.items||[]).map(x=>x.keyword).filter(Boolean))];return [...new Set([...ks,...fromItems])];}
function plats(){const ks=(data?.platforms||[]).filter(Boolean);const fromItems=[...new Set((data?.items||[]).map(x=>x.platform||'douyin').filter(Boolean))];return [...new Set([...ks,...fromItems])];}
function pick(){let all=(data?.items||[]).filter(g=>g&&g.title&&g.cover);if(platform)all=all.filter(g=>(g.platform||'douyin')===platform);const key=selected||cats()[0]||'';if(key)all=all.filter(g=>g.keyword===key);all.sort((a,b)=>(b.likes_num||0)-(a.likes_num||0));return {key,list:all};}
function open(g){
  const p=g.platform||'douyin',label=PLATFORM_LABEL[p]||'抖音';
  drawer('<div class="news-detail"><span class="keyword-eyebrow">'+esc(label)+' · '+esc(g.keyword||selected||'热卖')+'</span><h2>'+esc(g.title||label+'热卖内容')+'</h2><div class="ps-detail-image"><img src="'+esc(g.cover)+'" alt=""></div><p>'+esc(g.author||label)+' · '+esc(g.likes||'')+' 赞'+(g.date?' · '+esc(g.date):'')+'</p><p class="muted">这是'+esc(label)+'按点赞排序的热卖内容线索，不是商品 SKU；点开看实际展示/带货。</p><div class="drawer-actions"><button id="ecom-external">'+esc(PLATFORM_VIEW[p]||'打开原内容')+'</button></div></div>');
  document.querySelector('#ecom-external').onclick=()=>{const url=g.url||'';if(!url)return;if(window.parent!==window)window.parent.postMessage({type:'ATLAS_OPEN_URL',url},'app://obsidian.md');else window.open(url,'_blank','noopener');};
}
function paint(){
  const {key,list}=pick(),pt=root.querySelector('#home-ecom-platforms'),tabs=root.querySelector('#home-ecom-tabs'),box=root.querySelector('#home-ecom-cards');
  root.querySelector('#home-ecom-title').textContent='电商 · '+(key||'社媒')+'热卖';
  root.querySelector('#home-ecom-meta').textContent=data?.items?.length?('抖音 / 快手 / 小红书 · 按点赞 · 最近采集 '+(when(data.collected_at)||'—')):'暂无社媒热卖数据';
  const ps=plats();
  pt.innerHTML='<button class="home-ecom-tab'+(platform?'':' is-active')+'" data-platform="">全部平台</button>'+ps.map(p=>'<button class="home-ecom-tab'+(platform===p?' is-active':'')+'" data-platform="'+esc(p)+'">'+esc(PLATFORM_LABEL[p]||p)+'</button>').join('');
  pt.querySelectorAll('[data-platform]').forEach(b=>b.onclick=()=>{platform=b.dataset.platform;paint();});
  tabs.innerHTML=cats().map(k=>'<button class="home-ecom-tab'+(k===key?' is-active':'')+'" data-cat="'+esc(k)+'">'+esc(k)+'</button>').join('');
  tabs.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{selected=b.dataset.cat;paint();});
  const shown=list.slice(0,5);
  if(!shown.length){box.innerHTML='<p class="home-ecom-empty">这个平台/类目还没有热卖内容。</p>';return;}
  box.innerHTML=shown.map((g,i)=>'<article class="home-ecom-card"><button class="home-ecom-open" data-ecom="'+i+'"><div class="home-ecom-cover"><img loading="lazy" decoding="async" src="'+esc(g.cover)+'" alt=""><span class="home-ecom-badge is-'+esc(g.platform||'douyin')+'">'+esc(PLATFORM_LABEL[g.platform]||'抖音')+'</span><span class="home-ecom-rank">0'+(i+1)+'</span></div><h3>'+esc(g.title)+'</h3><p>'+esc(g.author||'')+' · '+esc(g.likes||'')+' 赞</p><span class="home-ecom-read">点开看热卖内容 ›</span></button></article>').join('');
  box.querySelectorAll('[data-ecom]').forEach(b=>b.onclick=()=>open(shown[+b.dataset.ecom]));
}
let busy=false;
async function load(){if(busy)return;busy=true;try{data=await api('/ecom-social');if(!selected)selected=cats()[0]||'';paint();}catch(e){root.querySelector('#home-ecom-meta').textContent='社媒热卖暂未更新：'+e.message;}finally{busy=false;}}
document.addEventListener('atlas:loaded',load);if(state)load();
})();
