/* 2026-11-02：详情弹窗里加「读全文」，走本机 /read（Jina Reader，免登录） */
(()=>{'use strict';
const q=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function add(){
  const body=q('#drawer-body');if(!body||body.querySelector('#read-full-block'))return;
  const links=[...body.querySelectorAll('a[href^="http"]')].map(a=>a.href).filter(u=>!/^https?:\/\/(127\.0\.0\.1|localhost)/.test(u));
  const url=links[0];if(!url)return;
  let host='';try{host=new URL(url).hostname}catch(e){host=''}
  const box=document.createElement('div');box.id='read-full-block';box.className='read-full';
  box.innerHTML='<div class="read-full-head"><button type="button" class="read-full-btn">读全文 · 免登录</button><span class="read-full-src">'+esc(host)+'</span></div><div class="read-full-body" hidden></div>';
  body.appendChild(box);
  const btn=box.querySelector('.read-full-btn'),out=box.querySelector('.read-full-body');
  btn.onclick=async()=>{
    btn.disabled=true;btn.textContent='正在读取…';
    try{
      const d=await api('/read?url='+encodeURIComponent(url));
      out.hidden=false;
      out.innerHTML='<div class="read-full-meta">'+esc(String(d.chars||0))+' 字符'+(d.truncated?' · 已截断':'')+' · 来源 '+esc(host)+'</div><pre class="read-full-text">'+esc(d.text||'')+'</pre>';
      btn.textContent='重新读取';btn.disabled=false;
      out.scrollIntoView({block:'nearest'});
    }catch(e){
      out.hidden=false;out.innerHTML='<p class="read-full-err">'+esc(e.message||'读取失败')+'</p>';
      btn.textContent='重试';btn.disabled=false;
    }
  };
}
const orig=window.showEvent;
if(typeof orig==='function'){
  window.showEvent=async function(id){await orig(id);try{add()}catch(e){}};
}
})();
