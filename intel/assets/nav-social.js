/* 2026-11-02 导航重排：重点情报 / 热点雷达 / 视频情报 / 电商榜单 / 社交媒体 */
(()=>{'use strict';
const nav=document.querySelector('.section-nav');
if(!nav)return;
function order(){
  const links=[...nav.querySelectorAll('a[href^="#"]')];
  const map={};links.forEach(a=>{map[a.getAttribute('href')]=a;});
  if(map['#douyin'])map['#douyin'].textContent='社交媒体';
  const seq=['#focus','#newsnow','#video-radar','#free-rank','#douyin','#github','#research','#library','#source-control'];
  const used=new Set();
  seq.forEach(h=>{const a=map[h];if(a){nav.append(a);used.add(h);}});
  links.forEach(a=>{const h=a.getAttribute('href');if(!used.has(h))nav.append(a);});
}
setTimeout(order,200);setTimeout(order,900);setTimeout(order,2000);
document.addEventListener('atlas:loaded',order);
document.addEventListener('atlas:view',()=>setTimeout(order,50));
})();
