/* 全站子页面顶栏：高度同步 + 白天/夜晚开关 + 全站自动访客计数 */
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
      var p = location.pathname;
      if (p.indexOf('/stats/') >= 0 || window.__guijiHitTracked) return;
      window.__guijiHitTracked = true;
      var page = 'home';
      if (p.indexOf('/rensheng/') >= 0) page = 'rensheng';
      else if (p.indexOf('/resource/') >= 0) page = 'resource';
      else if (p.indexOf('/intel/') >= 0) page = 'intel';
      else if (p.indexOf('/huidong/') >= 0) page = 'huidong';
      else if (p.indexOf('/workflow/') >= 0) page = 'workflow';
      else if (p.indexOf('/projects/') >= 0) page = 'projects';
      else if (p.indexOf('/tools/') >= 0) page = 'tools';
      var d = new Date();
      var k = '' + d.getFullYear() + ('0' + (d.getMonth() + 1)).slice(-2) + ('0' + d.getDate()).slice(-2);
      fetch('https://abacus.jasoncameron.dev/hit/guijiyeren/' + page + '-' + k, { cache: 'no-store' }).catch(function () {});
      fetch('https://abacus.jasoncameron.dev/hit/guijiyeren/' + page + '-all', { cache: 'no-store' }).catch(function () {});
    } catch (e) {}
  }

  function init() {
    setNavHeight();
    setupTheme();
    trackVisit();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.addEventListener('resize', setNavHeight);
})();
