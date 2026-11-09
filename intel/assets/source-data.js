/* 2026-11-03：左侧来源图标 / 来源管理点开后，先看这个来源最近的数据，再看入口与状态。 */
(()=>{'use strict';
const when=v=>{if(!v)return'';const d=new Date(v);return isNaN(d)?'':d.toLocaleString('zh-CN',{hour12:false,month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});};
function openExternal(url){if(!url)return;if(window.parent!==window)window.parent.postMessage({type:'ATLAS_OPEN_URL',url},'app://obsidian.md');else window.open(url,'_blank','noopener');}
function renderData(box,data){
  const items=(data&&data.items)||[];
  box.innerHTML='<div class="source-data-head"><strong>最近数据</strong><span>'+items.length+' 条 · 仅有效期内</span></div>'+
    (items.length?items.map((x,i)=>'<button class="source-data-row" type="button" data-event-id="'+esc(x.event_id||'')+'" data-url="'+esc(x.url||'')+'"><i>'+(i+1)+'</i><span><b>'+esc(x.title||'')+'</b><small>'+esc(when(x.published_at||x.first_seen_at))+' · '+esc(x.authority||'')+'</small></span></button>').join(''):'<p class="muted">这个来源当前没有有效期内的数据。</p>');
  box.querySelectorAll('.source-data-row').forEach(b=>{b.onclick=()=>{if(b.dataset.eventId)showEvent(b.dataset.eventId);else if(b.dataset.url)openExternal(b.dataset.url);};});
}
function showSource(id){
  if(id==='newsnow'&&window.showNewsNowSource)return window.showNewsNowSource();
  const s=state.sources.find(x=>x.id===id);if(!s)return;
  drawer('<h2>'+esc(s.name)+'</h2><span class="tag '+(sourceState(s)==='good'?'good':'warn')+'">'+esc(sourceLabel(s))+'</span><div id="source-data" class="source-data"><p class="muted">正在读取这个来源最近的数据…</p></div><details class="source-meta settings-details"><summary>入口、状态与操作</summary><dl class="kv"><dt>接入方式</dt><dd>'+esc(s.connector)+'</dd><dt>来源属性</dt><dd>'+esc(s.authority)+'</dd><dt>授权状态</dt><dd>'+esc(s.auth_state)+'</dd><dt>最近成功</dt><dd>'+date(s.last_success)+'</dd><dt>近24小时接收</dt><dd>'+s.accepted_24h+'</dd><dt>近24小时过滤</dt><dd>'+s.rejected_24h+'</dd><dt>更新间隔</dt><dd>'+s.interval_min+' 分钟</dd><dt>下次允许运行</dt><dd>'+date(s.next_attempt)+'</dd><dt>最近错误</dt><dd>'+esc(errorText(s.last_error))+'</dd></dl><p>'+esc(s.config.reason||'仅使用公开可访问的数据入口；单一来源发布不代表独立事实核实。')+'</p><div class="drawer-actions">'+(s.connector==='manual'?'<button id="source-import">导入链接</button>':s.auth_state==='public'?'<button id="source-run">同步这个来源</button>':'')+(s.auth_state==='public'?'<button id="source-toggle">'+(s.enabled?'暂停来源':'启用来源')+'</button>':'')+'</div></details>');
  if($('#source-run'))$('#source-run').onclick=()=>syncOne(s.id);
  if($('#source-toggle'))$('#source-toggle').onclick=async()=>{try{await api('/sources/'+s.id,'PATCH',{enabled:!s.enabled});await load(false);showSource(s.id);}catch(e){toast(e.message);}};
  if($('#source-import'))$('#source-import').onclick=()=>importForm(s.id);
  api('/sources/'+encodeURIComponent(s.id)+'/items').then(d=>{const box=$('#source-data');if(box)renderData(box,d);}).catch(e=>{const box=$('#source-data');if(box)box.innerHTML='<p class="muted">数据读取失败：'+esc(e.message)+'</p>';});
}
window.showSource=showSource;
})();
