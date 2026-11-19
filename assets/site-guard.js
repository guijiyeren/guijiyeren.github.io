/* 全站内容与图片防复制、防拖拽、防右键、防打印、防跨站嵌套与快捷键护盾（输入框白名单放行） */
(function () {
  if (window.__guijiGuardActive) return;
  window.__guijiGuardActive = true;

  // 防跨站 iframe 嵌套扒页
  try {
    if (window.top !== window.self && window.top.location.origin !== window.location.origin) {
      window.top.location = window.self.location;
    }
  } catch (e) {
    try { window.top.location = window.self.location; } catch (_) {}
  }

  var style = document.createElement('style');
  style.textContent =
    'body, body * { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }' +
    'input, textarea, select, [contenteditable="true"], [contenteditable=""] { -webkit-user-select: text !important; user-select: text !important; -webkit-touch-callout: default !important; }' +
    'img, video, canvas, svg { -webkit-user-drag: none; user-drag: none; }' +
    '@media print { body { display: none !important; } }';
  (document.head || document.documentElement).appendChild(style);

  function isEditable(el) {
    if (!el) return false;
    var tag = (el.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
  }

  document.addEventListener('contextmenu', function (e) { if (!isEditable(e.target)) e.preventDefault(); }, { capture: true });
  document.addEventListener('dragstart', function (e) { if (!isEditable(e.target)) e.preventDefault(); }, { capture: true });
  document.addEventListener('copy', function (e) { if (!isEditable(e.target)) e.preventDefault(); }, { capture: true });
  document.addEventListener('cut', function (e) { if (!isEditable(e.target)) e.preventDefault(); }, { capture: true });
  document.addEventListener('selectstart', function (e) { if (!isEditable(e.target)) e.preventDefault(); }, { capture: true });

  document.addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase();
    var ctrl = e.ctrlKey || e.metaKey;
    if (e.keyCode === 123 || (ctrl && e.shiftKey && (k === 'i' || k === 'j' || k === 'c'))) {
      e.preventDefault();
      return false;
    }
    if (ctrl && (k === 'u' || k === 's' || k === 'p')) {
      e.preventDefault();
      return false;
    }
    if (ctrl && !isEditable(e.target) && (k === 'c' || k === 'a')) {
      e.preventDefault();
      return false;
    }
  }, { capture: true });
})();
