/* 让子页面的固定/吸顶导航知道全站顶栏的实际高度（含手机换行） */
(function () {
  function setNavHeight() {
    var nav = document.querySelector('.site-nav');
    if (!nav) return;
    var h = Math.round(nav.getBoundingClientRect().height || nav.offsetHeight || 60);
    document.documentElement.style.setProperty('--site-nav-h', h + 'px');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setNavHeight);
  else setNavHeight();
  window.addEventListener('resize', setNavHeight);
})();
