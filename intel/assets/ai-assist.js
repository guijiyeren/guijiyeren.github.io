/* 2026-11-03：AI 辅助面板。只生成提示词/复制，不启动浏览器、不自动采集。 */
(()=>{'use strict';
const AGENTS=[
  {id:'claude',name:'Claude',logo:'/assets/logos/agents/claude.png'},
  {id:'codex',name:'Codex',logo:'/assets/logos/agents/codex.png'},
  {id:'workbuddy',name:'WorkBuddy',logo:'/assets/logos/agents/workbuddy.png'},
  {id:'deepseek',name:'DeepSeek',logo:'/assets/logos/agents/deepseek.png'},
  {id:'doubao',name:'豆包',logo:'/assets/logos/agents/doubao.png'}
];
 const DEFAULT_KEYWORD='袜子';
function promptFor(kw){
  const k=String(kw||DEFAULT_KEYWORD).trim()||DEFAULT_KEYWORD;
  return `请帮我采集以下内容，按平台分开返回，不要合并：\n\n关键词：${k}\n\n1. 抖音\n搜索「${k}」，按点赞排序，半年内，取 8 条；返回标题、作者、点赞、封面、链接。\n\n2. 快手\n搜索「${k}」，按点赞排序，取 8 条；返回标题、作者、点赞、封面、链接。\n\n3. 小红书\n搜索「${k}」，按点赞排序，取 8 条；返回标题、作者、点赞、封面、笔记链接。\n\n4. 电商\n看「${k}」类目热卖，取 5 个商品/内容；返回标题、图片、价格或销量、链接。\n\n要求：只返回公开内容；每条保留原始链接；不要修改标题；不要编造价格或销量。`;
}
function toast(msg){if(window.toast)return window.toast(msg);const el=document.createElement('div');el.textContent=msg;el.style.cssText='position:fixed;left:50%;bottom:36px;transform:translateX(-50%);background:#111d;color:#fff;padding:9px 14px;border-radius:8px;z-index:99999;font-size:12px';document.body.appendChild(el);setTimeout(()=>el.remove(),2200);}
async function copy(text){
  try{await navigator.clipboard.writeText(text);return true;}catch(e){}
  const ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;left:-9999px;top:0';document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand('copy');}catch(e){}ta.remove();return ok;
}
function open(){
  const body='<div class="ai-assist">'+
    '<div class="ai-assist-head"><div><span class="keyword-eyebrow">AI 辅助 · 不自动采集</span><h2>把浏览器活交给 AI</h2></div><span class="ai-assist-badge">提示词</span></div>'+
    '<p class="ai-assist-note">这里只生成提示词；点下面的 AI 图标复制，再粘贴给它。不会自动开浏览器、不会调用任何账号。</p>'+
    '<label class="ai-assist-label">采集关键词<input id="ai-assist-keyword" value="'+esc(DEFAULT_KEYWORD)+'" autocomplete="off"></label>'+
    '<textarea id="ai-assist-prompt" class="ai-assist-prompt" spellcheck="false"></textarea>'+
    '<div class="ai-assist-actions"><button id="ai-assist-copy" class="primary">复制提示词</button><span id="ai-assist-tip" class="muted">选一个 AI，点图标即复制</span></div>'+
    '<div class="ai-assist-agents">'+AGENTS.map(a=>'<button type="button" class="ai-agent" data-agent="'+a.id+'" title="复制给 '+esc(a.name)+'"><img src="'+a.logo+'" alt="" loading="lazy"><span>'+esc(a.name)+'</span></button>').join('')+'</div>'+
    '</div>';
  drawer(body);
  const kw=document.querySelector('#ai-assist-keyword'),ta=document.querySelector('#ai-assist-prompt');
  const sync=()=>{ta.value=promptFor(kw.value);};
  sync();
  kw.addEventListener('input',sync);
  document.querySelector('#ai-assist-copy').onclick=async()=>{const ok=await copy(ta.value);toast(ok?'提示词已复制':'复制失败，请手动全选复制');};
  document.querySelectorAll('.ai-agent').forEach(btn=>btn.onclick=async()=>{
    const a=AGENTS.find(x=>x.id===btn.dataset.agent)||{name:btn.textContent.trim()};
    const text='【交给 '+a.name+'】\n'+ta.value;
    const ok=await copy(text);
    document.querySelectorAll('.ai-agent').forEach(x=>x.classList.remove('is-active'));
    btn.classList.add('is-active');
    document.querySelector('#ai-assist-tip').textContent=ok?('已复制 · 粘贴给 '+a.name):'复制失败，请手动复制';
    toast(ok?('已复制，去 '+a.name+' 粘贴'):'复制失败，请手动复制');
  });
}
function mount(){
  const sync=document.querySelector('#sync');
  if(!sync||document.querySelector('#ai-assist'))return;
  const b=document.createElement('button');b.id='ai-assist';b.type='button';b.textContent='AI 辅助';b.title='生成需要 AI/浏览器处理的提示词，不自动采集';
  b.onclick=open;sync.after(b);
}
window.atlasOpenAiAssist=open;
mount();
document.addEventListener('atlas:view',mount);
})();
