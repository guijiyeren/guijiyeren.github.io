/* 2026-11-02：关闭弹窗时停掉里面所有声音，避免视频还在后台播 */
(()=>{'use strict';
const q=s=>document.querySelector(s);
function stopMedia(root){
  if(!root)return;
  root.querySelectorAll('video,audio').forEach(m=>{
    try{m.pause();m.currentTime=0;m.removeAttribute('src');m.load();}catch(e){}
  });
  root.querySelectorAll('iframe').forEach(f=>{
    try{f.src='about:blank';}catch(e){}
  });
}
const drawer=q('#drawer');
if(!drawer)return;
const original=window.closeDrawer;
window.closeDrawer=function(...args){
  stopMedia(drawer);
  if(typeof original==='function')return original.apply(this,args);
  drawer.hidden=true;
};
function closed(){return drawer.hidden||drawer.getAttribute('aria-hidden')==='true';}
new MutationObserver(()=>{if(closed())stopMedia(drawer);}).observe(drawer,{attributes:true,attributeFilter:['hidden','aria-hidden','class']});
document.addEventListener('click',e=>{
  if(e.target.closest('#close,.drawer-close,[data-drawer-close]'))setTimeout(()=>{if(closed())stopMedia(drawer);},0);
},true);
window.addEventListener('keydown',e=>{if(e.key==='Escape')setTimeout(()=>{if(closed())stopMedia(drawer);},0);});
})();
