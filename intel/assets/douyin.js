/* 2026-11-02 抖音关键词采集：首页 5 条（3:4）+「抖音」页 + 悬停播放 + 设置 */
(()=>{'use strict';
const q=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const root=document.createElement('div');root.id='douyin-home';
root.innerHTML='<section id="douyin-focus" class="home-douyin"><div class="dy-head"><div><span class="dy-eyebrow">抖音 · 关键词</span><h2 id="dy-focus-title">最近一周的抖音爆款</h2></div><div class="dy-head-actions"><span class="dy-count" id="dy-count"></span><button class="dy-more" type="button">更多 →</button></div></div><div class="dy-grid dy-grid-5" id="dy-focus-grid"></div></section>';
const view=document.createElement('section');view.id='douyin';view.className='dy-view';view.hidden=true;
view.innerHTML='<div class="section-heading"><div><h2>社交媒体</h2><span class="muted" id="dy-view-sub">按设置里的关键词，搜「一周内 · 最多点赞」；悬停即播，点开看大图</span></div><div class="dy-view-actions"><button id="dy-refresh" type="button">AI 辅助</button></div></div><div class="dy-keywords" id="dy-keywords"></div><div class="dy-status" id="dy-status"></div><div class="dy-grid dy-grid-5" id="dy-all-grid"></div>';
const focusRoot=q('#focus');
const videoRoot=q('#home-video-focus');
if(videoRoot)videoRoot.before(root);else if(focusRoot)focusRoot.before(root);else q('.shell')?.append(root);
const freeRank=q('#free-rank');if(freeRank)freeRank.after(view);else q('.shell')?.append(view);
let cache=[],statusCache={},busy=false;
const WIN_LABEL={1:'一天内',7:'一周内',30:'一个月'};
const TITLE_LABEL={1:'一天',7:'一周',30:'一个月'};
const INT_LABEL={60:'每 1 小时',180:'每 3 小时',360:'每 6 小时',720:'每 12 小时',1440:'每天一次'};
function windowDays(){return Number(statusCache.window_days||7)}
function minLikes(){return Number(statusCache.min_likes||0)}
function likesText(){const n=minLikes();return n?('≥'+(n>=10000?(n/10000)+'万':n)+'赞'):'不限赞'}
function card(it){
  const cover=it.cover?'<img loading="lazy" decoding="async" src="'+esc(it.cover)+'" alt="">':'';
  const hover=it.video_url?'<video class="dy-hover" muted loop playsinline preload="none" poster="'+esc(it.cover||'')+'" src="/api/v1/douyin/video/'+encodeURIComponent(it.id)+'"></video>':'';
  const logo=it.platform==='xiaohongshu'?'/assets/logos/xiaohongshu.png':it.platform==='kuaishou'?'/assets/logos/kuaishou.png':'/assets/logos/douyin.png';
  const badge='<span class="dy-logo"><img src="'+logo+'" alt=""></span>';
  return '<button class="dy-card" type="button" data-dy="'+esc(it.id)+'" data-pf="'+esc(it.platform||'douyin')+'"><span class="dy-cover">'+cover+hover+badge+'<span class="dy-play" aria-hidden="true">▶</span><span class="dy-like">♥ '+esc(it.likes||'')+'</span></span><span class="dy-body"><span class="dy-title">'+esc(it.title||'')+'</span><span class="dy-author">@'+esc(it.author||'未知')+' · '+esc(it.published||'')+'</span></span></button>';
}
function paintFocus(){
  const grid=q('#dy-focus-grid');if(!grid)return;
  const items=cache.slice(0,12),html=items.map(card).join(''),dup=false;
  const more='<button class="dy-more-card" type="button"><span>更多</span><small>抖音 / 小红书</small></button>';
  grid.innerHTML=html?('<div class="dy-track'+(dup?'':' single')+'">'+(dup?html+html:html+more)+'</div>'):'<p class="muted">还没有采集到抖音视频，点「更多」去采集。</p>';
  if(html&&!dup)setTimeout(()=>{if(window.__atlasEffectsOn?.()===false)return;const track=grid.querySelector('.dy-track');if(!track)return;const dist=track.scrollWidth-grid.clientWidth;if(dist<30)return;track.animate([{transform:'translateX(0)'},{transform:'translateX(-'+dist+'px)'}],{duration:60000,direction:'alternate',iterations:Infinity,easing:'ease-in-out'});},80);
  q('#dy-count').textContent=cache.length?cache.length+' 条 · '+(statusCache.keywords||[]).length+' 个关键词':'';
  const all=grid.querySelectorAll('.dy-card');all.forEach((c,i)=>{if(i>=items.length)c.setAttribute('aria-hidden','true');});
  const names=(statusCache.platforms||['douyin']).map(p=>p==='douyin'?'抖音':p==='xiaohongshu'?'小红书':'快手');
  q('#dy-focus-title').textContent='最近'+(TITLE_LABEL[windowDays()]||windowDays()+'天')+'的'+names.join(' / ')+'爆款';
}
function paintAll(){
  const grid=q('#dy-all-grid');if(!grid)return;
  grid.innerHTML=cache.map(card).join('')||'<p class="muted">还没有采集到抖音视频。</p>';
  q('#dy-keywords').innerHTML=(statusCache.keywords||[]).map(k=>'<span class="dy-kw">'+esc(k)+'</span>').join('');
  const st=statusCache||{},parts=[];
  const plats=(st.platforms||['douyin']).map(p=>p==='douyin'?'抖音':p==='xiaohongshu'?'小红书':'快手').join(' + ');
  parts.push('平台 '+plats);
  parts.push('窗口 '+(WIN_LABEL[windowDays()]||windowDays()+'天'));
  parts.push(likesText());
  parts.push('自动 '+(INT_LABEL[st.interval_minutes]||st.interval_minutes+' 分钟'));
  parts.push('停顿 '+(st.pace_seconds||25)+' 秒');
  if(st.results&&st.results.length)parts.push(st.results.map(r=>(r.platform==='xiaohongshu'?'小红书':'抖音')+'·'+r.keyword+' '+r.count+'条').join('；'));
  const xhsCollected=(st.platform_counts||{}).xiaohongshu||0;
  const xhsShown=cache.filter(i=>i.platform==='xiaohongshu').length;
  if(xhsCollected&&!xhsShown)parts.push('小红书已采 '+xhsCollected+' 条，均超出当前时间窗/点赞门槛');
  if(st.last_run)parts.push('上次采集 '+String(st.last_run).replace('T',' ').slice(0,16).replace('Z',''));
  if(st.errors&&st.errors.length)parts.push('失败：'+st.errors.map(e=>e.keyword+'（'+e.error+'）').join('；'));
  q('#dy-status').textContent=parts.join(' · ');
  q('#dy-view-sub').textContent='按设置里的关键词，搜「'+(WIN_LABEL[windowDays()]||windowDays()+'天')+' · '+likesText()+' · 最多点赞」；悬停即播，点开看大图';
}
let soundOn=false;document.addEventListener('pointerdown',()=>{soundOn=true;},{once:true,capture:true});
function bindCards(scope){
  scope.querySelectorAll('.dy-more-card').forEach(b=>{b.onclick=()=>{q('.section-nav a[href="#douyin"]')?.click();};});
  scope.querySelectorAll('[data-dy]').forEach(b=>{
    b.onclick=()=>{const it=cache.find(x=>x.id===b.dataset.dy);if(it)openPlayer(it);};
    const v=b.querySelector('video.dy-hover');if(!v)return;
    const play=()=>{if(window.__atlasEffectsOn?.()===false)return;v.muted=!soundOn;v.volume=1;v.play().catch(()=>{v.muted=true;v.play().catch(()=>{})})};
    const stop=()=>{v.pause();try{v.currentTime=0}catch(e){}};
    b.addEventListener('mouseenter',play);b.addEventListener('mouseleave',stop);
    b.addEventListener('focus',play);b.addEventListener('blur',stop);
  });
}
function openPlayer(it){
  document.querySelectorAll('.dy-hover').forEach(v=>{try{v.pause()}catch(e){}});
  if(it.platform==='xiaohongshu'){
    const meta='<div class="dy-player-meta"><strong>'+esc(it.title||'')+'</strong><span>@'+esc(it.author||'')+' · ♥ '+esc(it.likes||'')+' · '+esc(it.published||'')+'</span><a id="dy-open-xhs" href="'+esc(it.url)+'" target="_blank" rel="noopener noreferrer">在小红书打开 ↗</a></div>';
    const bindOpen=()=>{const b=document.querySelector('#dy-open-xhs');if(b)b.onclick=e=>{e.preventDefault();if(window.parent!==window)parent.postMessage({type:'ATLAS_OPEN_URL',url:it.url},'app://obsidian.md');else window.open(it.url,'_blank','noopener');};};
    if(it.video_url){
      drawer('<div class="dy-native"><video class="dy-native-video" src="/api/v1/douyin/video/'+encodeURIComponent(it.id)+'" poster="'+esc(it.cover||'')+'" controls autoplay playsinline></video></div>'+meta);
      const v=document.querySelector('.dy-native-video');
      if(v)v.addEventListener('error',()=>{drawer('<div class="dy-xhs"><img src="'+esc(it.cover||'')+'" alt=""></div>'+meta);bindOpen();},{once:true});
      bindOpen();
      return;
    }
    drawer('<div class="dy-xhs"><img src="'+esc(it.cover||'')+'" alt=""></div>'+meta);
    bindOpen();
    return;
  }
  if(it.platform==='kuaishou'){
    const meta='<div class="dy-player-meta"><strong>'+esc(it.title||'')+'</strong><span>@'+esc(it.author||'')+' · ♥ '+esc(it.likes||'')+' · '+esc(it.published||'')+'</span><a id="dy-open-ks" href="'+esc(it.url)+'" target="_blank" rel="noopener noreferrer">在快手打开 ↗</a></div>';
    const bindOpen=()=>{const b=document.querySelector('#dy-open-ks');if(b)b.onclick=e=>{e.preventDefault();if(window.parent!==window)parent.postMessage({type:'ATLAS_OPEN_URL',url:it.url},'app://obsidian.md');else window.open(it.url,'_blank','noopener');};};
    if(it.video_url){
      drawer('<div class="dy-native"><video class="dy-native-video" src="/api/v1/douyin/video/'+encodeURIComponent(it.id)+'" poster="'+esc(it.cover||'')+'" controls autoplay playsinline></video></div>'+meta);
      const v=document.querySelector('.dy-native-video');
      if(v)v.addEventListener('error',()=>{drawer('<div class="dy-xhs"><img src="'+esc(it.cover||'')+'" alt=""></div>'+meta);bindOpen();},{once:true});
      bindOpen();
      return;
    }
    drawer('<div class="dy-xhs"><img src="'+esc(it.cover||'')+'" alt=""></div>'+meta);
    bindOpen();
    return;
  }
  const meta='<div class="dy-player-meta"><strong>'+esc(it.title||'')+'</strong><span>@'+esc(it.author||'')+' · ♥ '+esc(it.likes||'')+' · '+esc(it.published||'')+'</span><a href="'+esc(it.url)+'" target="_blank" rel="noopener noreferrer">在抖音打开 ↗</a></div>';
  if(it.video_url){
    drawer('<div class="dy-native"><video class="dy-native-video" src="/api/v1/douyin/video/'+encodeURIComponent(it.id)+'" poster="'+esc(it.cover||'')+'" controls autoplay playsinline></video></div>'+meta);
    const v=document.querySelector('.dy-native-video');
    if(v)v.addEventListener('error',()=>{const src='https://open.douyin.com/player/video?vid='+encodeURIComponent(it.id)+'&autoplay=1';v.outerHTML='<div class="dy-player-frame"><iframe src="'+src+'" allow="autoplay; encrypted-media; fullscreen" allowfullscreen frameborder="0" scrolling="no" title="抖音播放器"></iframe></div>';},{once:true});
    return;
  }
  const src='https://open.douyin.com/player/video?vid='+encodeURIComponent(it.id)+'&autoplay=1';
  drawer('<div class="dy-player"><div class="dy-player-frame"><iframe src="'+esc(src)+'" allow="autoplay; encrypted-media; fullscreen" allowfullscreen frameborder="0" scrolling="no" title="抖音播放器"></iframe></div></div>'+meta);
}
async function load(){
  try{
    const d=await api('/douyin?limit=80');
    cache=d.items||[];statusCache=d.status||{};
    paintFocus();paintAll();
    bindCards(q('#dy-focus-grid'));bindCards(q('#dy-all-grid'));
  }catch(e){/* keep last render */}
}
function refresh(){
  if(window.atlasOpenAiAssist)window.atlasOpenAiAssist();
  else toast('AI 辅助面板还没加载，请刷新页面');
}
q('.dy-more').onclick=()=>{q('.section-nav a[href="#douyin"]')?.click();};
q('#dy-refresh').onclick=refresh;
document.addEventListener('atlas:view',e=>{root.hidden=e.detail.id!=='focus';});
document.addEventListener('atlas:effects',e=>{
  if(!e.detail.on){document.querySelectorAll('.dy-track').forEach(t=>t.getAnimations().forEach(a=>a.cancel()));document.querySelectorAll('video.dy-hover').forEach(v=>{try{v.pause()}catch(err){}});}
  else paintFocus();
});
document.addEventListener('atlas:loaded',load);
if(state)load();
load();
function installKeywordEditor(){
  const body=q('#drawer-body');if(!body)return;
  const obs=new MutationObserver(async()=>{
    const b=q('#drawer-body');if(!b||!b.querySelector('#settings-douyin')||b.querySelector('#dy-kw-input'))return;
    let st=statusCache;
    try{st=await api('/douyin/settings');}catch(e){}
    const kw=(st.keywords||[]).join('\n'),win=String(st.window_days||7),itv=String(st.interval_minutes||360),pace=String(st.pace_seconds||25),minl=String(st.min_likes||0);
    const sec=document.createElement('section');sec.className='dy-kw-editor';
    sec.innerHTML='<h3>抖音采集设置</h3><p class="muted">关键词一行一个；窗口越短、停顿越长、点赞门槛越高，越不容易触发抖音验证。</p><div class="dy-platforms"><span>采集平台</span><label><input type="checkbox" id="dy-pf-douyin" value="douyin"> 抖音</label><label><input type="checkbox" id="dy-pf-xhs" value="xiaohongshu"> 小红书</label><label><input type="checkbox" id="dy-pf-ks" value="kuaishou"> 快手</label></div><textarea id="dy-kw-input" rows="4" placeholder="vibecoding 知识大赏"></textarea><div class="dy-kw-row"><label>采集窗口 <select id="dy-window"><option value="1">一天内</option><option value="7">一周内</option><option value="30">一个月</option></select></label><label>最低点赞 <select id="dy-min"><option value="0">不限</option><option value="1000">1000+</option><option value="10000">1万+</option><option value="50000">5万+</option><option value="100000">10万+</option></select></label><label>自动采集 <select id="dy-interval"><option value="60">每 1 小时</option><option value="180">每 3 小时</option><option value="360">每 6 小时</option><option value="720">每 12 小时</option><option value="1440">每天一次</option></select></label><label>每词停顿 <input id="dy-pace" type="number" min="5" max="300" step="5"> 秒</label></div><div class="dy-kw-actions"><button id="dy-kw-save" class="primary" type="button">保存设置</button><span id="dy-kw-state" class="muted"></span></div>';
    (b.querySelector('#settings-douyin')||b).appendChild(sec);
    const ta=sec.querySelector('#dy-kw-input'),selW=sec.querySelector('#dy-window'),selM=sec.querySelector('#dy-min'),selI=sec.querySelector('#dy-interval'),numP=sec.querySelector('#dy-pace');
    ta.value=kw;selW.value=win;selM.value=minl;selI.value=itv;numP.value=pace;
    const pf=st.platforms||['douyin'];sec.querySelector('#dy-pf-douyin').checked=pf.includes('douyin');sec.querySelector('#dy-pf-xhs').checked=pf.includes('xiaohongshu');sec.querySelector('#dy-pf-ks').checked=pf.includes('kuaishou');
    sec.querySelector('#dy-kw-save').onclick=async()=>{
      const list=ta.value.split('\n').map(x=>x.trim()).filter(Boolean);
      const platforms=[...sec.querySelectorAll('.dy-platforms input:checked')].map(x=>x.value);
      const btn=sec.querySelector('#dy-kw-save');btn.disabled=true;
      try{
        const r=await api('/douyin/settings','PUT',{keywords:list,window_days:Number(selW.value),min_likes:Number(selM.value),interval_minutes:Number(selI.value),pace_seconds:Number(numP.value),platforms});
        statusCache={...statusCache,...r};
        sec.querySelector('#dy-kw-state').textContent='已保存';
        toast('抖音设置已保存');
        await load();
      }catch(e){sec.querySelector('#dy-kw-state').textContent='保存失败：'+(e.message||'');}
      finally{btn.disabled=false;}
    };
  });
  obs.observe(body,{childList:true});
}
setTimeout(installKeywordEditor,600);
})();
