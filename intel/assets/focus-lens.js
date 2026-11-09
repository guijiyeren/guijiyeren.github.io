/* Same-event intersections only. No trend, causal, or demand inference. */
(()=>{'use strict';
 const unique=sources=>[...new Map((sources||[]).filter(s=>s.id!=null).map(s=>[String(s.id),s])).values()];
 function lens(items,term,partner=''){
  const base=(items||[]).find(x=>x.term===term);if(!base)return null;
  const sources=unique(base.sources),ids=new Set(sources.map(s=>String(s.id)));
  const related=items.filter(x=>x.term!==term).map(x=>{const shared=unique(x.sources).filter(s=>ids.has(String(s.id)));return {term:x.term,count:shared.length};}).filter(x=>x.count>0).sort((a,b)=>b.count-a.count||a.term.localeCompare(b.term));
  const other=items.find(x=>x.term===partner),otherIds=new Set(unique(other?.sources).map(s=>String(s.id))),matched=partner?sources.filter(s=>otherIds.has(String(s.id))):sources;
  return {base,partner:partner||'',sources:matched,count:partner?matched.length:base.count,related,partial:base.count>sources.length||!!(partner&&other&&other.count>otherIds.size)};
 }
 function brief(model){
  if(!model)return '';
  const title=model.base.term+(model.partner?' × '+model.partner:'');
  return ['# 选题素材卡：'+title,'','素材范围：近168小时本地有效情报，包含保留原证据状态的候选。',
   (model.partner?'两词同条出现':'相关情报')+'：'+model.count+'条'+(model.partial?'（仅基于当前可回查来源，可能不完整）':''),'',
   '## 待验证的问题','- 这些内容有哪些实际变化？哪些已核实，哪些仍是作者判断？','- 对我的业务或创作，有什么值得小规模试用的地方？','',
   '## 原始素材',...model.sources.slice(0,12).map((s,i)=>`${i+1}. ${String(s.title).replace(/[\r\n]+/g,' ')}\n   来源：${s.source_name||s.category||'原文'}；证据状态：${s.evidence_status||'unverified'}\n   ${s.primary_url||'暂无原文链接'}`),
   ...(model.sources.length>12?['','此卡列前12条素材，完整列表可在情报中枢继续查看。']:[]),'',
   '说明：关联仅表示同一条情报同时提及，不代表因果、商业需求或搜索量；问题是选题提示，不是已验证结论。'].join('\n');
 }
 window.__atlasTopicLens={lens,brief};
})();
