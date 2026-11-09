/* Dedicated homepage video row; the full original issue stays in 视频情报. */
(()=>{'use strict';let snapshot=null,covers={},busy=false,offset=0,allItems=[],hovered=false;
 const root=document.createElement('section');root.id='home-video-focus';root.className='homepage-video';root.setAttribute('aria-label','视频情报独立专区');
 root.innerHTML='<div class="home-video-head"><div><span class="home-video-eyebrow">VIDEO BRIEF · 视频情报</span><h2>先看视频线索</h2><p id="home-video-meta">连接后读取本机已有视频快照</p></div><button class="video-focus-more">阅读整期视频情报 →</button></div><div id="home-video-cards" class="home-video-cards"><p class="home-video-empty">等待读取真实视频内容。</p></div>';
 document.querySelector('#focus').before(root);root.hidden=document.body.dataset.intelView!=='focus';document.addEventListener('atlas:view',e=>{root.hidden=e.detail.id!=='focus';});
 root.querySelector('.video-focus-more').onclick=()=>document.querySelector('.section-nav a[href="#video-radar"]').click();
 function embedFor(url){
    const u=String(url||'');
    let m=/bilibili\.com\/video\/(BV[\w]+)/i.exec(u)||/b23\.tv\/(BV[\w]+)/i.exec(u);
    if(m)return 'https://player.bilibili.com/player.html?bvid='+m[1]+'&autoplay=1&high_quality=1&danmaku=0';
    m=/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/i.exec(u);
    if(m)return 'https://www.youtube-nocookie.com/embed/'+m[1]+'?autoplay=1';
    return '';
 }
 function open(r){
    const list=r?.samples||[], s=list.find(x=>x.embed)||list[0], url=s?.url||r?.url||'', embed=String(s?.embed||embedFor(url)).replace(/^\/\//,'https://');
    if(embed){
      drawer('<div class="inline-player"><iframe src="'+esc(embed)+'" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen frameborder="0" title="视频播放"></iframe></div><div class="inline-player-meta"><strong>'+esc(s.title||r.title||"")+'</strong><span>'+esc(s.meta||"")+'</span>'+(url?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">在浏览器打开 ↗</a>':'')+'</div>');
      return;
    }
    drawer('<div class="news-detail"><span class="keyword-eyebrow">视频线索 · 站内</span><h2>'+esc(r.title||'')+'</h2><p>'+esc(r.summary||r.why||'这条暂时没有可用的站内播放器。')+'</p>'+(url?'<div class="drawer-actions"><button id="video-external">在浏览器打开原视频</button></div>':'')+'</div>');
    if(url)document.querySelector('#video-external').onclick=()=>{if(window.parent!==window)window.parent.postMessage({type:'ATLAS_OPEN_URL',url},'app://obsidian.md');else window.open(url,'_blank','noopener');};
  }
 function dayAge(day){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(day||'');if(!m)return null;const a=new Date(+m[1],+m[2]-1,+m[3]),b=new Date();b.setHours(0,0,0,0);return Math.round((b-a)/86400000);}
 function metaText(){
  const age=dayAge(snapshot?.day),daily=state?.daily,bits=[(snapshot?.day||'')+' 期'];
  if(age===0)bits.push('今天');else if(age!==null&&age>0)bits.push(age+' 天前');
  if(daily?.status==='running')bits.push('今日更新中');
  else if(age!==null&&age>0)bits.push('今天还没更新');
  bits.push('作者判断，待核实');
  return bits.join(' · ');
 }
 function paint(){
  const list=root.querySelector('#home-video-cards');
  if(!snapshot?.headlines?.length){list.innerHTML='<p class="home-video-empty">当前暂无视频快照，可在视频情报页查看同步状态。</p>';return;}
  const source=Array.isArray(snapshot.topics)&&snapshot.topics.length?snapshot.topics:(snapshot.headlines||[]),heads=source.filter(r=>r.samples?.length),represented=new Set((state?.focus_signals||[]).map(e=>e.radar?.anchor).filter(Boolean)),available=[...heads.filter(r=>!represented.has(new URL(r.url).hash.slice(1))),...heads.filter(r=>represented.has(new URL(r.url).hash.slice(1)))],used=new Set([...document.querySelectorAll('#signals img,#event-stream img')].map(i=>i.src));
  allItems=available;
  if(offset>=allItems.length)offset=0;
  const picks=allItems.length<=5?allItems:allItems.slice(offset,offset+5);
  for(const e of state?.focus_signals||[]){const c=covers[e.id];if(c?.url)used.add(new URL(c.url,location.href).href);}
  root.querySelector('#home-video-meta').textContent=metaText()+(allItems.length>5?' · 第 '+(offset+1)+'–'+Math.min(offset+5,allItems.length)+' / '+allItems.length+' 条 · 5 秒换一批':'');
  root.querySelector('#home-video-meta').dataset.stale=String((dayAge(snapshot.day)||0)>0&&state?.daily?.status!=='running');
  list.innerHTML=picks.map((r,i)=>{const linked=snapshot.focus_import?.linked?.find(x=>x.section==='r-head'&&x.anchor===new URL(r.url).hash.slice(1)),original=covers[linked?.event_id]?.label==='原文配图'?covers[linked.event_id].url:null,choices=[original,...r.samples.map(s=>s.cover)].filter(Boolean),url=choices.find(c=>!used.has(new URL(c,location.href).href))||choices[0]||'/assets/reading-art/news.svg';used.add(new URL(url,location.href).href);const sample=(r.samples||[]).find(x=>x.embed)||r.samples?.[0]||{},host=String(sample.url||sample.embed||''),logo=/bilibili|b23/.test(host)?'/assets/logos/bilibili.png':(/youtu/.test(host)?'/assets/logos/youtube.png':(/(^|\/\/)(x\.com|twitter\.com)/.test(host)||/twimg/.test(host))?'/assets/logos/x.png':(/weibo/.test(host)?'/assets/logos/weibo.png':'/assets/logos/bilibili.png'));return '<article class="home-video-card"><button class="home-video-open" data-video-pick="'+i+'" aria-label="播放原视频：'+esc(r.title)+'"><div class="home-video-cover"><img src="'+esc(url)+'" referrerpolicy="no-referrer" alt="视频代表作原封面"><span class="home-video-logo"><img src="'+logo+'" alt=""></span><span class="home-video-number">'+String(offset+i+1).padStart(2,'0')+'</span><span class="home-video-play" aria-hidden="true">▶</span></div><h3>'+esc(r.title)+'</h3><p>'+esc(r.summary||r.why||'查看作者原判断与代表作')+'</p><span class="home-video-read">点开播放 ▶</span></button></article>';}).join('');
  list.querySelectorAll('[data-video-pick]').forEach(b=>b.onclick=()=>open(picks[+b.dataset.videoPick]));
  list.querySelectorAll('.home-video-card').forEach((card,i)=>{
    const pick=picks[i],s=pick?.samples?.find(x=>x.embed)||pick?.samples?.[0],src=String(s?.embed||embedFor(s?.url)).replace(/^\/\//,'https://');
    if(!src)return;
    card.addEventListener('mouseenter',()=>{
      if(window.__atlasEffectsOn?.()===false)return;
      if(card.querySelector('.home-video-hover'))return;
      const cover=card.querySelector('.home-video-cover');if(!cover)return;
      const f=document.createElement('iframe');
      f.className='home-video-hover';
      f.src=src+(/autoplay=/.test(src)?'':'&autoplay=1');
      f.allow='autoplay; encrypted-media; picture-in-picture';
      f.setAttribute('scrolling','no');
      f.setAttribute('title',s.title||pick.title||'视频预览');
      cover.append(f);
    });
    card.addEventListener('mouseleave',()=>{card.querySelector('.home-video-hover')?.remove();});
  });
  list.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{img.hidden=true;const label=document.createElement('span');label.className='home-video-cover-missing';label.textContent='原封面暂不可用 · 点击仍可查看代表作';img.parentElement.append(label);},{once:true}));
 }
 async function reload(){if(busy||!state)return;busy=true;try{[snapshot,covers]=await Promise.all([api('/radar'),api('/reading-covers').then(r=>r.images||{})]);paint();window.__atlasRadarDay=snapshot?.day||'';window.renderHeadStats?.();}catch(ex){root.querySelector('#home-video-meta').textContent='视频快照暂未更新：'+ex.message+'；可进入整期查看。';}finally{busy=false;}}
 root.addEventListener('pointerenter',()=>{hovered=true});root.addEventListener('pointerleave',()=>{hovered=false});
 setInterval(()=>{if(!allItems.length||document.hidden||root.hidden||hovered)return;if(window.__atlasEffectsOn?.()===false)return;offset=offset+5>=allItems.length?0:offset+5;paint();},5000);
 document.addEventListener('atlas:effects',e=>{if(e.detail.on)offset=0;});
 document.addEventListener('atlas:loaded',reload);if(state)reload();window.__atlasVideoFocus={reload,get picks(){return (snapshot?.topics?.length||snapshot?.headlines?.length)||0;},get all(){return allItems.length;},get offset(){return offset;}};
})();
