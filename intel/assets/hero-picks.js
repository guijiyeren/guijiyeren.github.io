/* 2026-11-03：先看两条改成整圈轮播——国内热点 → 国际热点 → 词云前 8 个词各取最热一条 → 循环 */
(()=>{'use strict';
const q=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ROTATE_MS=3000;
const KEYWORD_LIMIT=6;
const PRIORITY=['智能体','OpenAI','Claude','Gemini','YouTube','DeepSeek'];
const ODD=/[\u0E00-\u0E7F\u0600-\u06FF\u0900-\u097F\u0590-\u05FF]/;
const PLATFORM_LOGOS={'今日头条':'/assets/logos/toutiao.png','百度热搜':'/assets/logos/baidu.png','澎湃新闻':'/assets/logos/thepaper.png','腾讯新闻':'/assets/logos/tencent.png','微博热搜':'/assets/logos/weibo.png','华尔街见闻':'/assets/logos/wallstreetcn.png','凤凰网':'/assets/logos/ifeng.png','财联社':'/assets/logos/cls.png','知乎热榜':'/assets/logos/zhihu.png','知乎':'/assets/logos/zhihu.png'};
function platformLogo(name){
  const key=String(name||'');
  if(PLATFORM_LOGOS[key])return PLATFORM_LOGOS[key];
  for(const [k,v] of Object.entries(PLATFORM_LOGOS))if(key.includes(k)||k.includes(key))return v;
  return '';
}
function platformRow(list){
  const plats=(list||[]).filter(x=>x&&x.name);
  if(!plats.length)return '';
  return '<div class="ps-platform-row">'+plats.map(p=>{const logo=platformLogo(p.name);return '<span class="ps-platform">'+(logo?'<img src="'+esc(logo)+'" alt="">':'<i>'+esc(p.name.slice(0,1))+'</i>')+'<b>'+esc(p.name)+'</b>'+(p.rank?'<small>第'+esc(p.rank)+'位</small>':'')+'</span>';}).join('')+'</div>';
}
let queue=[],index=0,builtAt=0,building=false;
function openUrl(url){if(!url)return;if(window.parent!==window)parent.postMessage({type:'ATLAS_OPEN_URL',url},'app://obsidian.md');else window.open(url,'_blank','noopener');}
function majorMeta(it){
  const names=(it.appearances||[]).map(a=>a.name).filter(Boolean);
  return names.length?names.slice(0,3).join(' · ')+(names.length>1?' · '+names.length+' 个平台在榜':''):(it.reason||'');
}
function majorSlides(items){
  const list=(items||[]).filter(x=>x&&x.title);
  const out=[];
  const dom=list.find(x=>x.scope!=='国际')||list[0];
  const intl=list.find(x=>x.scope==='国际');
  if(dom)out.push({kicker:'国内热点',scope:'国内',title:dom.title,meta:majorMeta(dom),url:dom.url,platforms:dom.appearances});
  if(intl)out.push({kicker:'国际热点',scope:'国际',title:intl.title,meta:majorMeta(intl),url:intl.url,platforms:intl.appearances});
  return out;
}
function hoursAgo(v){const t=Date.parse(v||'');return Number.isFinite(t)?(Date.now()-t)/3600000:999;}
async function keywordSlides(used){
  let data=null;
  try{data=await api('/focus/keywords');}catch(e){return [];}
  const all=(data.items||[]).filter(x=>x&&x.term).slice().sort((a,b)=>b.count-a.count||b.title_hits-a.title_hits);
  const ordered=[];
  for(const name of PRIORITY){const hit=all.find(x=>String(x.term).toLowerCase()===name.toLowerCase());if(hit)ordered.push(hit);}
  for(const item of all){if(ordered.length>=KEYWORD_LIMIT)break;if(!ordered.includes(item))ordered.push(item);}
  const terms=ordered.slice(0,KEYWORD_LIMIT);
  const REPO=/^[\w.-]+\s*\/\s*[\w.-]+$/;
  const clean=x=>!REPO.test(String(x.title||'').trim());
  const grab=async(term,hours)=>{try{const d=await api('/keyword-events?term='+encodeURIComponent(term)+'&hours='+hours+'&limit=20');return d.items||[];}catch(e){return [];}};
  const fetched=await Promise.all(terms.map(async t=>{
    const key=String(t.term).toLowerCase();
    const day=await grab(t.term,24);
    const titledDay=day.filter(x=>clean(x)&&String(x.title||'').toLowerCase().includes(key));
    let pool=day;
    if(!titledDay.length){const week=await grab(t.term,168);pool=day.concat(week.filter(x=>!day.some(y=>y.id===x.id)));}
    return {t,pool};
  }));
  const picked=[];
  for(const {t,pool} of fetched){
    const key=String(t.term).toLowerCase();
    const poolClean=pool.filter(clean);
    const titled=poolClean.filter(x=>String(x.title||'').toLowerCase().includes(key));
    const pick=titled.find(x=>!used.has(String(x.title||'').trim()))||poolClean.find(x=>!used.has(String(x.title||'').trim()))||titled[0]||poolClean[0]||pool[0];
    if(!pick)continue;
    const title=String(pick.title||'').trim();
    if(!title||ODD.test(title))continue;
    used.add(title);
    const fresh=hoursAgo(pick.created_at)<24;
    picked.push({kicker:t.term+' · 最热',scope:pick.category||'情报',title,meta:[pick.source_name,fresh?'今天':'近 7 天'].filter(Boolean).join(' · '),url:pick.primary_url||'',eventId:pick.id});
  }
  return picked;
}
function businessSlides(used){
  const list=(state?.focus_signals||[]).filter(x=>x&&x.title&&x.title!=='中文标题整理中'&&!ODD.test(x.title));
  const groups=[
    {kicker:'主业 · 电商',re:/电商|商品|详情页|转化|投放|选品/},
    {kicker:'工具 · 工作流',re:/工作流|智能体|自动化/},
    {kicker:'创作 · AI 生图',re:/生图|图像|图片|视觉生成/},
    {kicker:'创作 · AI 视频',re:/视频|音频|TTS|配音|漫剧/},
    {kicker:'工具 · AI 编程',re:/编程|代码|Codex|Claude Code|开发/},
  ];
  const taken=new Set(used);
  const picks=[];
  for(const g of groups){
    const hit=list.filter(x=>!taken.has(String(x.title||'').trim())&&g.re.test([x.personal_topic,x.category,x.title].filter(Boolean).join(' ')))
      .sort((a,b)=>(b.personal_score||0)-(a.personal_score||0))[0];
    if(hit){taken.add(String(hit.title).trim());picks.push({kicker:g.kicker,x:hit,score:hit.personal_score||0});}
  }
  picks.sort((a,b)=>b.score-a.score);
  return picks.slice(0,4).map(({kicker,x})=>{
    used.add(String(x.title).trim());
    return {kicker,scope:x.category||'关注',title:String(x.title).trim(),meta:[x.source_name,x.personal_score!=null?'匹配 '+x.personal_score+' 分':''].filter(Boolean).join(' · '),url:x.primary_url||'',eventId:x.id};
  });
}
async function compose(){
  let major=[];
  try{const d=await api('/major-events?limit=12');major=majorSlides(d.items||[]);}catch(e){}
  const used=new Set(major.map(x=>x.title));
  const biz=businessSlides(used);
  const words=await keywordSlides(used);
  return major.slice(0,2).concat(biz,words);
}
async function ensure(force){
  if(building)return;
  if(!force&&queue.length&&Date.now()-builtAt<10*60000)return;
  building=true;
  try{
    const next=await compose();
    if(next.length){
      queue=next;builtAt=Date.now();
      if(index>=queue.length)index=0;
      if(!q('#priority-signals .ps-stage')||!q('#priority-signals .ps-item'))index=0;
      paint();
    }
  }finally{building=false;}
}
function openSlide(it){
  if(it.eventId&&typeof showEvent==='function'){showEvent(it.eventId);return;}
  const hasUrl=!!it.url;
  drawer('<div class="news-detail"><span class="keyword-eyebrow">'+esc(it.kicker)+'</span><h2>'+esc(it.title)+'</h2><p>'+esc(it.meta||'')+'</p>'+platformRow(it.platforms)+(it.image?'<div class="ps-detail-image"><img src="'+esc(it.image)+'" alt=""></div>':'')+'<div class="drawer-actions">'+(hasUrl?'<button id="ps-read">读全文</button><button id="ps-open">在浏览器打开原文</button>':'')+'</div><div id="ps-full" class="ps-full"></div></div>');
  if(!hasUrl)return;
  const read=q('#ps-read'),full=q('#ps-full');
  read.onclick=async()=>{read.disabled=true;read.textContent='正在读取…';try{const d=await api('/read?url='+encodeURIComponent(it.url));full.innerHTML='<div class="read-full-meta">'+esc(String(d.chars||0))+' 字符'+(d.truncated?' · 已截断':'')+' · 站内读取</div><pre class="read-full-text">'+esc(d.text||'')+'</pre>';read.textContent='重新读取';}catch(e){full.innerHTML='<p class="muted">站内读取失败：'+esc(e.message)+'；可点「在浏览器打开原文」。</p>';read.textContent='重试';}read.disabled=false;};
  q('#ps-open').onclick=()=>openUrl(it.url);
}
function paint(){
  const box=q('#priority-signals');if(!box||!queue.length)return;
  if(!box.querySelector('.ps-stage'))box.innerHTML='<div class="ps-head"><span class="ps-kicker"></span><span class="ps-right"><button class="ps-why" type="button" aria-label="这些新闻是怎么筛选出来的">?</button><span class="ps-count"></span></span></div><div class="ps-stage"></div>';
  const why=box.querySelector('.ps-why');
  if(why&&!why.dataset.ready){why.dataset.ready='1';why.onclick=()=>drawer('<div class="news-detail"><span class="keyword-eyebrow">筛选机制 · 规则，不是大模型</span><h2>右边这些是怎么选出来的</h2><p>全部由本地规则和你的数据库算出来，当前没有调用大模型。</p><h3>1. 国内 / 国际热点</h3><p>取 NewsNow 的 9 个新闻榜（微博、百度、澎湃、腾讯、头条、华尔街见闻、知乎、凤凰、财联社），按标题合并同一条，按“几个平台在榜 + 最好名次”排序，过滤娱乐和政治；国内、国际各取第一条。</p><h3>2. 我的主业</h3><p>从 <code>focus_signals</code> 里按主题分组：电商、工作流、AI 视频、AI 编程等，每组取匹配分最高的一条，再按分数排序取前 4。匹配分来自你在设置里选的关注方向和关注词。</p><h3>3. 关键词</h3><p>词云按近 7 天出现条数排序，固定保留智能体、OpenAI、Claude、Gemini、YouTube、DeepSeek，再按 <code>/keyword-events</code> 取每个词近 24 小时相关度最高、时间最新的一条（标题优先命中该词）。</p><h3>4. 不是什么</h3><p>不是实时热度，也不是 AI 摘要；所有标题、来源、链接都保留原样，点开可回原文核对。</p></div>');}
  const it=queue[index%queue.length],stage=box.querySelector('.ps-stage');
  box.querySelector('.ps-kicker').innerHTML='先看 · <b>'+esc(it.kicker)+'</b>';
  box.querySelector('.ps-count').textContent=(index%queue.length+1)+' / '+queue.length;
  stage.classList.remove('is-in');
  const inner=it.image
    ?'<span class="ps-thumb"><img loading="lazy" decoding="async" src="'+esc(it.image)+'" alt=""></span><span class="ps-copy"><span class="ps-scope">'+esc(it.scope)+'</span><h3>'+esc(it.title)+'</h3><p class="ps-meta">'+esc(it.meta||'')+'</p></span>'
    :'<span class="ps-scope">'+esc(it.scope)+'</span><h3>'+esc(it.title)+'</h3><p class="ps-meta">'+esc(it.meta||'')+'</p>';
  stage.innerHTML='<a class="ps-item'+(it.image?' has-image':'')+'" href="'+esc(it.url||'#')+'"'+(it.url?'':' aria-disabled="true"')+'>'+inner+'</a><i class="ps-bar" aria-hidden="true"></i>';
  void stage.offsetWidth;
  stage.classList.add('is-in');
  stage.querySelector('.ps-item').onclick=e=>{e.preventDefault();openSlide(it);};
}
function tick(){
  if(document.hidden||queue.length<2)return;
  if(window.__atlasEffectsOn?.()===false)return;
  const box=q('#priority-signals');if(box&&box.matches(':hover'))return;
  index=(index+1)%queue.length;paint();
}
function watch(){
  const box=q('#priority-signals');
  if(!box){setTimeout(watch,500);return;}
  new MutationObserver(()=>{if(!box.querySelector('.ps-stage')||box.querySelector('.priority-signal:not(.hero-pick)')){index=0;paint();}}).observe(box,{childList:true});
  ensure(true);
}
document.addEventListener('atlas:loaded',()=>ensure(false));
watch();
setInterval(tick,ROTATE_MS);
window.__atlasHeroPicks={items:()=>queue,next:()=>tick(),refresh:()=>ensure(true)};
})();
