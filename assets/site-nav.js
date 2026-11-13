/* 全站子页面顶栏：高度同步 + 白天/夜晚开关 */
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
    // 初始可能只设了 class=dark（人生指南），补一次 data-theme 让图标状态一致
    syncThemeButton();
    btn.addEventListener('click', function () { setTheme(!isDark()); });
  }

  function init() {
    setNavHeight();
    setupTheme();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  window.addEventListener('resize', setNavHeight);
})();
