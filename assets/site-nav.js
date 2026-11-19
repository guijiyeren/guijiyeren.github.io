/* 全站子页面顶栏：高度同步 + 白天/夜晚开关 + 全站自动访客人数(UV)与访问次数(PV)统计 + 防护脚本 */
(function () {
  var html = document.documentElement;

  function setNavHeight() {
    var nav = document.querySelector('.site-nav');
    if (!nav) return;
    var h = Math.round(nav.getBoundingClientRect().height || nav.offsetHeight || 60);
    html.style.setProperty('--site-nav-h', h + 'px');
  }

  function isDark() {
    return html.classList.contains('dark') || html.getAttribute('data-theme') === 'night';
  }

  function syncThemeButton() {
    var btn = document.querySelector('.site-nav .sn-theme');
    if (!btn) return;
    btn.setAttribute('aria-pressed', isDark() ? 'true' : 'false');
    btn.title = isDark() ? '切换到白天' : '切换到夜晚';
  }

  function setTheme(dark) {
    html.classList.toggle('dark', dark);
    html.setAttribute('data-theme', dark ? 'night' : 'day');
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light');
      localStorage.setItem('guiji_theme', dark ? 'night' : 'day');
    } catch (e) {}
    syncThemeButton();
  }

  function setupTheme() {
    var btn = document.querySelector('.site-nav .sn-theme');
    if (!btn) return;
    syncThemeButton();
    btn.addEventListener('click', function () { setTheme(!isDark()); });
  }

  function trackVisit() {
    try {
      if (location.protocol !== 'http:' && location.protocol !== 'https:') return;
      if (localStorage.getItem('guiji_ignore_self') === '1') return;
      var p = location.pathname;
      if (p.indexOf('/stats/') >= 0 || window.__guijiHitTracked) return;
      window.__guijiHitTracked = true;

      var segs = p.replace(/^\/+|\/+$/g, '').split('/');
      var page = (segs[0] && segs[0] !== 'index.html') ? segs[0] : 'home';
      var d = new Date();
      var k = '' + d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2);

      // 1. 访问次数 (PV)
      fetch('https://abacus.jasoncameron.dev/hit/guijiyeren/' + page + '-' + k, { cache: 'no-store' }).catch(function () {});
      fetch('https://abacus.jasoncameron.dev/hit/guijiyeren/' + page + '-all', { cache: 'no-store' }).catch(function () {});

      // 2. 访问人数 (UV)：同浏览器当天该页只计 1 次，全站当天只计 1 次
      var uvPageKey = 'guiji_uv_' + page + '_' + k;
      if (!localStorage.getItem(uvPageKey)) {
        localStorage.setItem(uvPageKey, '1');
        fetch('https://abacus.jasoncameron.dev/hit/guijiyeren/uv-' + page + '-' + k, { cache: 'no-store' }).catch(function () {});
        fetch('https://abacus.jasoncameron.dev/hit/guijiyeren/uv-' + page + '-all', { cache: 'no-store' }).catch(function () {});
      }
      var uvSiteKey = 'guiji_uv_site_' + k;
      if (!localStorage.getItem(uvSiteKey)) {
        localStorage.setItem(uvSiteKey, '1');
        fetch('https://abacus.jasoncameron.dev/hit/guijiyeren/uv-site-' + k, { cache: 'no-store' }).catch(function () {});
        fetch('https://abacus.jasoncameron.dev/hit/guijiyeren/uv-site-all', { cache: 'no-store' }).catch(function () {});
      }
    } catch (e) {}
  }

  function init() {
    setNavHeight();
    setupTheme();
    trackVisit();
    if (!document.querySelector('script[src*="site-guard.js"]')) {
      var gs = document.createElement('script');
      gs.src = (location.pathname === '/' || (location.pathname.endsWith('/index.html') && location.pathname.split('/').length <= 2)) ? 'assets/site-guard.js' : '../assets/site-guard.js';
      gs.defer = true;
      document.body.appendChild(gs);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.addEventListener('resize', setNavHeight);
})();
