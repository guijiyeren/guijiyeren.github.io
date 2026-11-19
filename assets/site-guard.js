/* 全站内容与图片防复制、防拖拽、防右键、防打印、防跨站嵌套与快捷键护盾（全页同步生效，输入框白名单放行） */
(function () {
  if (window.__guijiGuardActive) return;
  window.__guijiGuardActive = true;

  // 1. 域名绑定锁 + 防跨站 iframe 嵌套扒页（防止别人下载源码挂到其他域名盗版运行）
  try {
    var h = (location.hostname || '').toLowerCase();
    var allowed = h === 'guijiyeren.github.io' || h === 'localhost' || h === '127.0.0.1' || h === '';
    if (location.protocol.indexOf('http') === 0 && !allowed) {
      location.replace('https://guijiyeren.github.io/');
      return;
    }
    if (window.top !== window.self && window.top.location.origin !== window.location.origin) {
      window.top.location = window.self.location;
    }
  } catch (e) {
    try { window.top.location = window.self.location; } catch (_) {}
  }

  // 2. 禁止选中、禁止拖拽、禁止打印
  var style = document.createElement('style');
  style.textContent =
    'html, body, body * { -webkit-user-select: none !important; user-select: none !important; -webkit-touch-callout: none !important; }' +
    'input, textarea, select, [contenteditable="true"], [contenteditable=""] { -webkit-user-select: text !important; user-select: text !important; -webkit-touch-callout: default !important; }' +
    'img, video, canvas, svg { -webkit-user-drag: none !important; user-drag: none !important; }' +
    '@media print { html, body { display: none !important; visibility: hidden !important; } }' +
    'html.guiji-dt-blur body > * { filter: blur(10px) !important; pointer-events: none !important; }';
  (document.head || document.documentElement).appendChild(style);

  function isEditable(el) {
    if (!el || el.nodeType !== 1) return false;
    var tag = (el.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
  }

  function blockEvent(e) {
    if (!isEditable(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }

  // 同时挂在 window 和 document 的捕获阶段，确保任何子页框架无法绕过
  ['contextmenu', 'dragstart', 'copy', 'cut', 'selectstart'].forEach(function (evt) {
    window.addEventListener(evt, blockEvent, true);
    document.addEventListener(evt, blockEvent, true);
  });

  // 3. 拦截常见扒站 / 源码 / 保存 / 打印 / 开发者工具快捷键
  window.addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase();
    var ctrl = e.ctrlKey || e.metaKey;
    if (
      e.keyCode === 123 ||
      (ctrl && e.shiftKey && (k === 'i' || k === 'j' || k === 'c' || k === 'k')) ||
      (e.metaKey && e.altKey && (k === 'i' || k === 'j' || k === 'u')) ||
      (ctrl && (k === 'u' || k === 's' || k === 'p'))
    ) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    if (ctrl && !isEditable(e.target) && (k === 'c' || k === 'a')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);

  // 4. 访客端桌面开发者工具检测（站长本机忽略、移动端/平板忽略，避免误伤正常用户）
  var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (!isTouch) {
    setInterval(function () {
      try {
        if (localStorage.getItem('guiji_ignore_self') === '1') {
          document.documentElement.classList.remove('guiji-dt-blur');
          return;
        }
        var dw = Math.abs(window.outerWidth - window.innerWidth);
        var dh = Math.abs(window.outerHeight - window.innerHeight);
        var open = (dw > 260 && window.innerWidth > 400) || (dh > 260 && window.innerHeight > 300);
        document.documentElement.classList.toggle('guiji-dt-blur', open);
      } catch (e) {}
    }, 1000);
  }
})();
