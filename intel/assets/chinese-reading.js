/* Chinese-first reading, with opt-in source text for audit. No translation in the browser UI. */
(()=>{
 'use strict';
 const q=s=>document.querySelector(s), records=new Map();
 function remember(value){
   if(Array.isArray(value)){value.forEach(remember);return;}
   if(!value||typeof value!=='object')return;
   if(value._original){
     const entries=Object.entries(value._original).map(([field,source])=>({field,source,display:value[field],full:value._chinese?.full_text?.[field]}));
     const id=value.id||value.title||entries[0]?.display;
     if(id)records.set(id,{id,title:value.title,entries,status:value._chinese?.status});
   }
   Object.entries(value).forEach(([k,v])=>{if(k!=='_original')remember(v);});
 }
 const oldApi=api;
 api=async(...args)=>{const data=await oldApi(...args);remember(data);return data;};
 function originalMarkup(record){
   const labels={title:'原文标题',excerpt:'原文摘要',description:'原文介绍',text:'原文线索',why:'原文说明',pos:'原文介绍',summary:'原文摘要'};
   const complete=record.entries.filter(e=>e.full&&e.full!==e.display).map(e=>'<details class="original-reading"><summary>展开完整中文译文</summary><p>'+esc(e.full)+'</p></details>').join('');
   return complete+'<details class="original-reading"><summary>查看采集原文</summary><p class="chinese-note">中文便于阅读，原文用于核对。机器翻译不代表事实已经核实。</p>'+record.entries.map(e=>'<p><strong>'+esc(labels[e.field]||'原文')+'</strong><br>'+esc(e.source)+'</p>').join('')+'</details>';
 }
 const oldDrawer=drawer;
 drawer=html=>{
   const probe=document.createElement('template');probe.innerHTML=html;
   const text=probe.content.textContent||'';
   const matched=[...records.values()].filter(r=>r.status!=='pending'&&r.entries.some(e=>typeof e.display==='string'&&e.display.length>15&&text.includes(e.display))).slice(0,6);
   const unique=[...new Map(matched.flatMap(r=>r.entries).map(e=>[e.source,e])).values()];
   let extra=unique.length?originalMarkup({entries:unique}):'';
   const settings=text.includes('本机运行设置');
   if(settings)extra+='<section class="original-reading"><h3>中文阅读</h3><p id="chinese-state" class="chinese-note">正在核对中文覆盖…</p><p class="chinese-note">只将公开采集文字发往免费翻译网页。私人收藏备注不发送；品牌、产品名与原链接保留。</p><button id="chinese-retry">整理尚未完成的中文</button></section>';
   oldDrawer(html+extra);
   if(settings){const adv=document.querySelector('#drawer-body .settings-advanced'),sec=document.querySelector('#drawer-body .original-reading');if(adv&&sec)adv.append(sec);}
   if(settings){updateStatus();q('#chinese-retry').onclick=async()=>{try{const r=await api('/chinese/sync','POST');toast(r.mode==='running'?'中文整理正在进行':'已开始整理中文');await updateStatus();}catch(e){toast(e.message);}};}
 };
 const oldShowEvent=showEvent;
 showEvent=async id=>{
   await oldShowEvent(id);
   const r=records.get(id);
   if(r&&!q('#drawer').hidden&&!q('#drawer-body .original-reading'))q('#drawer-body').insertAdjacentHTML('beforeend',originalMarkup(r));
 };
 async function updateStatus(){
   try{const s=await api('/chinese');const el=q('#chinese-state');if(el)el.textContent=s.pending?'已整理 '+s.translated+' 份公开文本，剩余 '+s.pending+' 份。'+(s.status==='running'?'正在继续处理。':'可点击下方按钮重试。'):'已采集的外文内容已完成中文整理。原文和原链接均保留。';}
   catch(e){const el=q('#chinese-state');if(el)el.textContent='暂时无法读取中文整理状态，请检查本机连接。';}
 }
 function tidy(){
   remember(state);remember(window.__atlasVideo?.data);
   const heading=q('.focus-heading h2');if(heading){const node=[...heading.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.includes('当前值得关注'));if(node)node.textContent=node.textContent.replace('当前值得关注','今天值得关注');}
   const button=q('#candidates');if(button)button.textContent='待核实线索';
   document.querySelectorAll('.video-card-label,.video-card [class*="grade"],.video-card [class*="rank"]').forEach(el=>{if(el.children.length===0)el.textContent=el.textContent.replace(/^S\s*必看$/,'原站S级').replace(/^A\s*值得看$/,'值得看').replace(/^B\s*可关注$/,'可关注');});
 }
 window.addEventListener('atlas:loaded',tidy);
 const observer=new MutationObserver(()=>{if(!window.__chineseTidyPending){window.__chineseTidyPending=true;requestAnimationFrame(()=>{window.__chineseTidyPending=false;tidyVideo();});}});
 function tidyVideo(){document.querySelectorAll('.video-card-label,.video-card [class*="grade"],.video-card [class*="rank"]').forEach(el=>{const text=el.textContent.trim();if(!el.children.length&&/^S\s*必看$/.test(text))el.textContent='原站S级';});}
 if(q('#video-radar'))observer.observe(q('#video-radar'),{childList:true,subtree:true});
 tidy();window.__atlasChinese={remember,updateStatus,records};
})();
