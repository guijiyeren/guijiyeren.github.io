/* 硅基野人 · 实战知识库解密阅读器（目录树、高保真排版、PPT翻页、音频/MP4/HLS解密播放、全文搜索） */
(function () {
  'use strict';

  var Auth = window.GuijiWikiAuth;
  var BLANK_IMG = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  var HOME_NODE = 'LJ5UwgCwziAVUpkqYKTcTsbXnwg';
  var session = null;
  var manifest = null;
  var nodeMap = {};
  var parentMap = {};
  var searchIndex = null;
  var activeNode = null;
  var activeFrag = '';
  var activeMedia = {};
  var blobCache = new Map();
  var activeHlsInstances = [];
  var imgObserver = null;
  var tocObserver = null;
  var fontSizes = [14.5, 15.5, 16.5, 18];
  var fontIdx = 1;

  // ====== 主题同步 ======
  function toggleTheme() {
    var html = document.documentElement;
    var next = html.getAttribute('data-theme') === 'night' ? 'day' : 'night';
    html.setAttribute('data-theme', next);
    try { localStorage.setItem('guiji_theme', next); } catch (e) {}
  }
  ['gateThemeBtn', 'appThemeBtn'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('click', toggleTheme);
  });

  // ====== 门禁 UI ======
  var gateEl = document.getElementById('wkGate');
  var appEl = document.getElementById('wkApp');
  var tabBtns = document.querySelectorAll('[data-gate-tab]');
  var tabPanels = document.querySelectorAll('[data-gate-panel]');

  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var t = btn.getAttribute('data-gate-tab');
      tabBtns.forEach(function (b) {
        var on = b.getAttribute('data-gate-tab') === t;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      tabPanels.forEach(function (p) {
        p.classList.toggle('is-on', p.getAttribute('data-gate-panel') === t);
      });
    });
  });

  var pwInput = document.getElementById('passcodeInput');
  var togglePwBtn = document.getElementById('togglePwBtn');
  if (togglePwBtn && pwInput) {
    togglePwBtn.addEventListener('click', function () {
      var show = pwInput.type === 'password';
      pwInput.type = show ? 'text' : 'password';
      togglePwBtn.textContent = show ? '隐藏' : '显示';
    });
  }

  document.getElementById('passcodeForm').addEventListener('submit', async function (ev) {
    ev.preventDefault();
    var errEl = document.getElementById('passcodeErr');
    var btn = document.getElementById('passcodeSubmit');
    errEl.textContent = '';
    btn.disabled = true;
    btn.textContent = '正在解密验证…';
    try {
      var remember = document.getElementById('rememberPass').checked;
      var s = await Auth.unlockWithPasscode(pwInput.value, remember, './');
      await bootReader(s);
      pwInput.value = '';
    } catch (e) {
      errEl.textContent = e.message || '密码验证失败';
    } finally {
      btn.disabled = false;
      btn.textContent = '立即解锁知识库 →';
    }
  });

  document.getElementById('licenseForm').addEventListener('submit', async function (ev) {
    ev.preventDefault();
    var errEl = document.getElementById('licenseErr');
    var btn = document.getElementById('licenseSubmit');
    var inp = document.getElementById('licenseInput');
    errEl.textContent = '';
    btn.disabled = true;
    btn.textContent = '正在核验授权码…';
    try {
      var remember = document.getElementById('rememberLicense').checked;
      var s = await Auth.unlockWithLicense(inp.value, remember, './');
      await bootReader(s);
    } catch (e) {
      errEl.textContent = e.message || '授权码验证失败';
    } finally {
      btn.disabled = false;
      btn.textContent = '验证授权码进入 →';
    }
  });

  function openCheckoutHandler() {
    Auth.openCheckout({
      base: './',
      onPaid: function (newSession) {
        bootReader(newSession);
      }
    });
  }
  var openPayGateEl = document.getElementById('openPayFromGate');
  if (openPayGateEl) openPayGateEl.addEventListener('click', openCheckoutHandler);
  var openPayTopEl = document.getElementById('openPayTopBtn');
  if (openPayTopEl) openPayTopEl.addEventListener('click', openCheckoutHandler);

  document.getElementById('lockBtn').addEventListener('click', function () {
    document.documentElement.classList.remove('wk-has-session');
    Auth.lockSession();
    location.reload();
  });

  // ====== 解密工具 ======
  async function fetchDecryptedBytes(relPath) {
    var fetcher = Auth.fetchWithRetry || fetch;
    var res = await fetcher(relPath, {}, 3, 20000);
    if (!res.ok) throw new Error('资源加载失败 (' + res.status + ')');
    var buf = await res.arrayBuffer();
    return Auth.decryptBytes(session.cryptoKey, buf);
  }

  async function fetchDecryptedJson(relPath) {
    var plain = await fetchDecryptedBytes(relPath);
    return JSON.parse(new TextDecoder().decode(plain));
  }

  async function getMediaBlobUrl(relPath, mime) {
    var cacheKey = relPath;
    if (blobCache.has(cacheKey)) return blobCache.get(cacheKey);
    var plain = await fetchDecryptedBytes(relPath);
    var blob = new Blob([plain], { type: mime || 'application/octet-stream' });
    var url = URL.createObjectURL(blob);
    blobCache.set(cacheKey, url);
    return url;
  }

  function cleanupMediaPlayers() {
    activeHlsInstances.forEach(function (h) {
      try { h.destroy(); } catch (e) {}
    });
    activeHlsInstances = [];
    if (imgObserver) { imgObserver.disconnect(); imgObserver = null; }
    if (tocObserver) { tocObserver.disconnect(); tocObserver = null; }
  }

  // ====== 启动阅读器 ======
  async function bootReader(unlockedSession) {
    session = unlockedSession;
    try {
      manifest = await fetchDecryptedJson('data/manifest.enc');
    } catch (e) {
      var msg = String((e && e.message) || '');
      if (e && (e.name === 'OperationError' || msg.indexOf('加密') >= 0)) {
        Auth.lockSession();
        throw new Error('密钥已变更或会话过期，请重新验证');
      }
      throw new Error('网络波动导致目录加载超时，请再点一次「立即解锁知识库」');
    }

    nodeMap = {};
    parentMap = {};
    (manifest.flat || []).forEach(function (n) {
      nodeMap[n.node_token] = n;
      if (n.parent_node_token) parentMap[n.node_token] = n.parent_node_token;
    });

    gateEl.hidden = true;
    document.documentElement.classList.add('wk-has-session');
    appEl.hidden = false;
    appEl.classList.remove('wk-entering');
    void appEl.offsetWidth;
    appEl.classList.add('wk-entering');
    window.scrollTo(0, 0);
    document.getElementById('treeCount').textContent = '共 ' + manifest.count + ' 页 · 已本地解密';

    renderTree(manifest.tree || [], '');
    var target = parseRoute();
    await loadPage(target.node, target.frag, false);
  }

  function parseRoute() {
    var sp = new URLSearchParams(location.search);
    var p = sp.get('p') || (manifest && manifest.homeNode) || HOME_NODE;
    if (!nodeMap[p] && manifest && manifest.flat && manifest.flat.length) {
      p = manifest.flat[0].node_token;
    }
    var frag = (location.hash || '').replace(/^#/, '');
    return { node: p, frag: frag };
  }

  window.addEventListener('popstate', function () {
    if (!manifest) return;
    var r = parseRoute();
    loadPage(r.node, r.frag, false);
  });

  // ====== 目录树渲染与筛选 ======
  var expandedSet = new Set();
  function expandAncestors(ntok) {
    var cur = parentMap[ntok];
    while (cur) {
      expandedSet.add(cur);
      cur = parentMap[cur];
    }
  }

  function renderTree(nodes, filterText) {
    var treeEl = document.getElementById('wkTree');
    var q = (filterText || '').trim().toLowerCase();

    function matchesSubtree(node) {
      if (!q) return true;
      if (node.title.toLowerCase().indexOf(q) >= 0) return true;
      return (node.children || []).some(matchesSubtree);
    }

    function buildBranch(list) {
      var ul = document.createElement('div');
      list.forEach(function (n) {
        if (!matchesSubtree(n)) return;
        var hasKids = n.children && n.children.length > 0;
        var isOpen = q ? true : expandedSet.has(n.node_token);

        var wrap = document.createElement('div');
        wrap.className = 'wk-tree-item';

        var row = document.createElement('div');
        row.className = 'wk-tree-row' + (n.node_token === activeNode ? ' is-active' : '');
        row.setAttribute('data-node', n.node_token);

        if (hasKids) {
          var exp = document.createElement('button');
          exp.type = 'button';
          exp.className = 'wk-tree-exp';
          exp.textContent = isOpen ? '▾' : '▸';
          exp.setAttribute('aria-label', '展开或折叠');
          exp.addEventListener('click', function (ev) {
            ev.stopPropagation();
            if (expandedSet.has(n.node_token)) expandedSet.delete(n.node_token);
            else expandedSet.add(n.node_token);
            renderTree(manifest.tree, document.getElementById('treeFilter').value);
          });
          row.appendChild(exp);
        } else {
          var sp = document.createElement('span');
          sp.className = 'wk-tree-spacer';
          row.appendChild(sp);
        }

        var lbl = document.createElement('span');
        lbl.className = 'wk-tree-label';
        lbl.textContent = n.title;
        lbl.title = n.title;
        row.appendChild(lbl);

        row.addEventListener('click', function () {
          if (hasKids && !expandedSet.has(n.node_token)) expandedSet.add(n.node_token);
          loadPage(n.node_token, '', true);
          closeMobileSidebar();
        });

        wrap.appendChild(row);

        if (hasKids) {
          var childBox = document.createElement('div');
          childBox.className = 'wk-tree-children';
          childBox.hidden = !isOpen;
          childBox.appendChild(buildBranch(n.children));
          wrap.appendChild(childBox);
        }
        ul.appendChild(wrap);
      });
      return ul;
    }

    treeEl.innerHTML = '';
    treeEl.appendChild(buildBranch(nodes));
  }

  document.getElementById('treeFilter').addEventListener('input', function (ev) {
    renderTree(manifest.tree || [], ev.target.value);
  });

  // 移动端侧栏
  var sidebarEl = document.getElementById('wkSidebar');
  var sidebarMask = document.getElementById('sidebarMask');
  function closeMobileSidebar() {
    sidebarEl.classList.remove('is-open');
    sidebarMask.classList.remove('is-open');
  }
  document.getElementById('sidebarToggle').addEventListener('click', function () {
    var open = !sidebarEl.classList.contains('is-open');
    sidebarEl.classList.toggle('is-open', open);
    sidebarMask.classList.toggle('is-open', open);
  });
  sidebarMask.addEventListener('click', closeMobileSidebar);

  // ====== 加载并渲染单页 ======
  async function loadPage(ntok, frag, pushUrl) {
    if (!ntok) return;
    cleanupMediaPlayers();
    activeNode = ntok;
    activeFrag = frag || '';
    expandAncestors(ntok);
    renderTree(manifest.tree || [], document.getElementById('treeFilter').value);

    if (pushUrl) {
      var nextUrl = '?p=' + encodeURIComponent(ntok) + (activeFrag ? '#' + encodeURIComponent(activeFrag) : '');
      history.pushState({ node: ntok, frag: activeFrag }, '', nextUrl);
    }

    var bodyEl = document.getElementById('wkDocBody');
    var titleEl = document.getElementById('wkDocTitle');
    titleEl.textContent = (nodeMap[ntok] && nodeMap[ntok].title) || '加载中…';
    bodyEl.innerHTML = '<p style="color:var(--muted)">正在本地解密内容…</p>';

    var page;
    try {
      page = await fetchDecryptedJson('data/pages/' + ntok + '.enc');
    } catch (e) {
      bodyEl.innerHTML = '<div style="padding:18px;border:1px solid var(--line);border-radius:12px">' +
        '<p style="color:var(--muted);margin-bottom:10px">页面加载遇到网络波动，暂未拉取成功。</p>' +
        '<button type="button" class="wk-m-btn primary" id="wkRetryPageBtn">重新加载本页</button>' +
      '</div>';
      var rbtn = document.getElementById('wkRetryPageBtn');
      if (rbtn) rbtn.addEventListener('click', function () { loadPage(ntok, activeFrag, false); });
      return;
    }
    activeMedia = page.media || {};
    document.title = page.title + ' · 硅基野人知识库';

    // 面包屑
    var crumbsEl = document.getElementById('wkCrumbs');
    var crumbParts = ['<a href="?p=' + HOME_NODE + '" class="wk-link-internal" data-node="' + HOME_NODE + '">首页</a>'];
    (page.ancestors || []).forEach(function (a) {
      if (a.node_token === HOME_NODE) return;
      crumbParts.push('<span>/</span><a href="?p=' + a.node_token + '" class="wk-link-internal" data-node="' + a.node_token + '">' + escHtml(a.title) + '</a>');
    });
    crumbsEl.innerHTML = crumbParts.join(' ');

    titleEl.textContent = page.title;
    var mins = Math.max(1, Math.round((page.charCount || 300) / 450));
    document.getElementById('wkDocMeta').innerHTML =
      '<span>约 ' + (page.charCount || 0) + ' 字</span>' +
      '<span>预计阅读 ' + mins + ' 分钟</span>';

    bodyEl.innerHTML = page.html.replace(/(<img\b[^>]*?)\ssrc=""/g, '$1 src="' + BLANK_IMG + '" data-loading="1"');

    // 子页面导航卡
    var chBox = document.getElementById('wkChildrenBox');
    if (page.children && page.children.length) {
      chBox.hidden = false;
      chBox.innerHTML = '<h3>本栏目下级页面（' + page.children.length + '）</h3><div class="wk-children-grid">' +
        page.children.map(function (c) {
          return '<a class="wk-child-pill wk-link-internal" href="?p=' + c.node_token + '" data-node="' + c.node_token + '">' + escHtml(c.title) + '</a>';
        }).join('') + '</div>';
    } else {
      chBox.hidden = true;
      chBox.innerHTML = '';
    }

    // 上下篇
    var pnEl = document.getElementById('wkPrevNext');
    var pnHtml = '';
    if (page.prev) {
      pnHtml += '<a class="wk-pn-card prev wk-link-internal" href="?p=' + page.prev.node_token + '" data-node="' + page.prev.node_token + '"><small>← 上一篇</small><b>' + escHtml(page.prev.title) + '</b></a>';
    } else {
      pnHtml += '<div></div>';
    }
    if (page.next) {
      pnHtml += '<a class="wk-pn-card next wk-link-internal" href="?p=' + page.next.node_token + '" data-node="' + page.next.node_token + '"><small>下一篇 →</small><b>' + escHtml(page.next.title) + '</b></a>';
    }
    pnEl.innerHTML = pnHtml;

    // 右侧大纲 TOC
    renderToc(page.toc || []);

    // 绑定内链、复制代码、图片懒加载、音视频/PPT组件
    bindInternalLinks(document.getElementById('wkArticle'));
    bindCodeCopy(bodyEl);
    hydrateImages(bodyEl);
    hydrateMediaSlots(bodyEl);

    // 滚动定位
    if (activeFrag) {
      setTimeout(function () {
        var targetEl = document.getElementById(activeFrag);
        if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else window.scrollTo(0, 0);
      }, 60);
    } else {
      window.scrollTo(0, 0);
    }
  }

  function renderToc(toc) {
    var el = document.getElementById('wkTocList');
    if (!toc.length) {
      el.innerHTML = '<div style="font-size:12px;color:var(--muted)">本页无分级标题</div>';
      return;
    }
    el.innerHTML = toc.map(function (t) {
      return '<a class="wk-toc-link lvl-' + t.level + '" href="#' + escHtml(t.id) + '" data-toc-id="' + escHtml(t.id) + '">' + escHtml(t.text) + '</a>';
    }).join('');
    el.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        var tid = a.getAttribute('data-toc-id');
        var target = document.getElementById(tid);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    if ('IntersectionObserver' in window) {
      tocObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var id = en.target.id;
          el.querySelectorAll('.wk-toc-link').forEach(function (l) {
            l.classList.toggle('is-on', l.getAttribute('data-toc-id') === id);
          });
        });
      }, { rootMargin: '-64px 0px -70% 0px' });
      toc.forEach(function (t) {
        var h = document.getElementById(t.id);
        if (h) tocObserver.observe(h);
      });
    }
  }

  function bindInternalLinks(scope) {
    scope.querySelectorAll('a.wk-link-internal').forEach(function (a) {
      a.addEventListener('click', function (ev) {
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
        ev.preventDefault();
        var ntok = a.getAttribute('data-node');
        var frag = a.getAttribute('data-frag') || '';
        loadPage(ntok, frag, true);
      });
    });
    scope.querySelectorAll('a.wk-file-link').forEach(function (a) {
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        var slot = a.getAttribute('data-media-slot');
        var info = activeMedia[slot];
        if (info && info.encFiles && info.encFiles.length) {
          triggerDownload(info.encFiles[0], info.name, info.mime, a);
        }
      });
    });
  }

  function bindCodeCopy(scope) {
    scope.querySelectorAll('.wk-copy-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var box = btn.closest('.wk-code-box');
        var code = box ? box.querySelector('code') : null;
        if (!code) return;
        var text = code.textContent || '';
        function done() {
          btn.textContent = '✓ 已复制';
          setTimeout(function () { btn.textContent = '复制'; }, 1600);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(done);
        } else {
          done();
        }
      });
    });
  }

  // ====== 图片懒加载解密与灯箱 ======
  function hydrateImages(scope) {
    var imgs = Array.prototype.slice.call(scope.querySelectorAll('img.wk-img[data-slot]'));
    async function loadImg(img) {
      if (img.dataset.loaded) return;
      img.dataset.loaded = '1';
      img.removeAttribute('loading');
      var slot = img.getAttribute('data-slot');
      var info = activeMedia[slot];
      if (!info || !info.enc) {
        img.removeAttribute('data-loading');
        return;
      }
      try {
        img.src = await getMediaBlobUrl(info.enc, info.mime);
        img.removeAttribute('data-loading');
      } catch (e) {
        img.removeAttribute('data-loading');
        img.alt = '图片解密失败';
      }
    }

    // 首屏前 4 张立刻加载，其余用大预加载区懒解密
    imgs.slice(0, 4).forEach(loadImg);
    var rest = imgs.slice(4);
    if (rest.length && 'IntersectionObserver' in window) {
      imgObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          loadImg(en.target);
          imgObserver.unobserve(en.target);
        });
      }, { rootMargin: '1200px 0px' });
      rest.forEach(function (im) { imgObserver.observe(im); });
    } else {
      rest.forEach(loadImg);
    }

    scope.querySelectorAll('img.wk-zoomable').forEach(function (im) {
      im.addEventListener('click', function () {
        if (!im.src || im.getAttribute('data-loading') === '1') return;
        openLightbox(im.src, im.alt);
      });
    });
  }

  var lbMask = document.getElementById('wkLightbox');
  var lbImg = document.getElementById('lbImg');
  var lbCap = document.getElementById('lbCap');
  function openLightbox(src, cap) {
    lbImg.src = src;
    lbCap.textContent = cap || '';
    lbMask.hidden = false;
    lbMask.setAttribute('aria-hidden', 'false');
  }
  function closeLightbox() {
    lbMask.hidden = true;
    lbMask.setAttribute('aria-hidden', 'true');
  }
  document.getElementById('lbClose').addEventListener('click', closeLightbox);
  lbMask.addEventListener('click', function (ev) { if (ev.target === lbMask) closeLightbox(); });

  // ====== 音视频 / PPT / 附件槽位渲染 ======
  function hydrateMediaSlots(scope) {
    scope.querySelectorAll('.wk-media-slot[data-slot]').forEach(function (box) {
      var slot = box.getAttribute('data-slot');
      var info = activeMedia[slot];
      if (!info) return;
      if (info.type === 'audio') renderAudioSlot(box, info);
      else if (info.type === 'pptx') renderPptxSlot(box, info);
      else if (info.type === 'video') renderVideoSlot(box, info);
      else renderFileSlot(box, info);
    });
  }

  async function triggerDownload(encPath, filename, mime, btnEl) {
    var oldTxt = btnEl ? btnEl.textContent : '';
    if (btnEl) { btnEl.disabled = true; btnEl.textContent = '解密下载中…'; }
    try {
      var url = await getMediaBlobUrl(encPath, mime);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename || 'file';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      if (btnEl) { btnEl.disabled = false; btnEl.textContent = oldTxt; }
    }
  }

  function renderAudioSlot(box, info) {
    var files = info.encFiles || [];
    var curIdx = 0;
    box.innerHTML =
      '<div class="wk-m-head">' +
        '<div class="wk-m-title">🎧 <span>' + escHtml(info.name) + '</span></div>' +
        '<div class="wk-m-actions">' +
          '<span class="wk-m-meta">' + fmtSize(info.size) + '</span>' +
          '<button type="button" class="wk-m-btn" data-spd>1.0x</button>' +
          '<button type="button" class="wk-m-btn" data-dl>下载音频</button>' +
        '</div>' +
      '</div>' +
      '<div class="wk-audio-body">' +
        '<button type="button" class="wk-m-btn primary" data-load>▶ 解密播放音频</button>' +
        '<audio controls preload="none" hidden style="width:100%"></audio>' +
      '</div>' +
      (files.length > 1 ? '<div class="wk-audio-parts"></div>' : '');

    var audioEl = box.querySelector('audio');
    var loadBtn = box.querySelector('[data-load]');
    var spdBtn = box.querySelector('[data-spd]');
    var dlBtn = box.querySelector('[data-dl]');
    var speeds = [1, 1.25, 1.5, 2];
    var spdIdx = 0;

    async function loadTrack(idx, autoplay) {
      curIdx = idx;
      loadBtn.disabled = true;
      loadBtn.textContent = '解密加载中…';
      try {
        var url = await getMediaBlobUrl(files[idx], info.mime);
        audioEl.src = url;
        audioEl.hidden = false;
        audioEl.playbackRate = speeds[spdIdx];
        loadBtn.hidden = true;
        if (autoplay) audioEl.play().catch(function () {});
      } catch (e) {
        loadBtn.disabled = false;
        loadBtn.textContent = '加载失败，重试';
      }
    }

    loadBtn.addEventListener('click', function () { loadTrack(curIdx, true); });
    spdBtn.addEventListener('click', function () {
      spdIdx = (spdIdx + 1) % speeds.length;
      spdBtn.textContent = speeds[spdIdx] + 'x';
      audioEl.playbackRate = speeds[spdIdx];
    });
    dlBtn.addEventListener('click', function () {
      var dlName = files.length > 1 ? ('part' + (curIdx + 1) + '-' + info.name) : info.name;
      triggerDownload(files[curIdx], dlName, info.mime, dlBtn);
    });
    if (files.length > 1) {
      var partsWrap = box.querySelector('.wk-audio-parts');
      files.forEach(function (_, idx) {
        var pb = document.createElement('button');
        pb.type = 'button';
        pb.className = 'wk-m-btn' + (idx === 0 ? ' primary' : '');
        pb.textContent = '第 ' + (idx + 1) + ' 段';
        pb.addEventListener('click', function () {
          partsWrap.querySelectorAll('button').forEach(function (b, k) { b.classList.toggle('primary', k === idx); });
          loadTrack(idx, true);
        });
        partsWrap.appendChild(pb);
      });
    }
  }

  function renderPptxSlot(box, info) {
    if (info.mode === 'fallback' || !(info.slides && info.slides.length)) {
      var pages = info.fallbackPages || [];
      box.innerHTML =
        '<div class="wk-m-head"><div class="wk-m-title">📊 <span>' + escHtml(info.name) + '</span></div>' +
        '<div class="wk-m-actions">' + (info.origEnc ? '<button type="button" class="wk-m-btn primary" data-dl-ppt>下载原 PPTX</button>' : '') + '</div></div>' +
        '<div class="wk-ppt-fallback">' + pages.map(function (p) {
          return '<div class="wk-ppt-fb-card"><b>第 ' + p.page + ' 页</b><div>' + p.texts.map(escHtml).join('<br>') + '</div></div>';
        }).join('') + '</div>';
      var fbBtn = box.querySelector('[data-dl-ppt]');
      if (fbBtn) fbBtn.addEventListener('click', function () { triggerDownload(info.origEnc, info.name, 'application/vnd.openxmlformats-officedocument.presentationml.presentation', fbBtn); });
      return;
    }

    var slides = info.slides;
    var cur = 0;
    box.innerHTML =
      '<div class="wk-m-head">' +
        '<div class="wk-m-title">📊 <span>' + escHtml(info.name) + '</span></div>' +
        '<div class="wk-m-actions">' +
          '<span class="wk-m-meta">' + slides.length + ' 页</span>' +
          '<button type="button" class="wk-m-btn" data-full>⛶ 全屏演示</button>' +
          (info.origEnc ? '<button type="button" class="wk-m-btn primary" data-dl-ppt>下载原 PPTX</button>' : '') +
        '</div>' +
      '</div>' +
      '<div class="wk-ppt-stage"><img alt="幻灯片" loading="lazy"></div>' +
      '<div class="wk-ppt-bar">' +
        '<div class="wk-ppt-nav">' +
          '<button type="button" class="wk-m-btn" data-prev>‹ 上一页</button>' +
          '<span data-page>1 / ' + slides.length + '</span>' +
          '<button type="button" class="wk-m-btn" data-next>下一页 ›</button>' +
        '</div>' +
        '<span class="wk-m-meta">点击图片或按全屏可放大浏览</span>' +
      '</div>';

    var imgEl = box.querySelector('.wk-ppt-stage img');
    var pageEl = box.querySelector('[data-page]');

    async function showSlide(i) {
      cur = ((i % slides.length) + slides.length) % slides.length;
      pageEl.textContent = (cur + 1) + ' / ' + slides.length;
      try {
        imgEl.src = await getMediaBlobUrl(slides[cur], 'image/webp');
        if (cur + 1 < slides.length) getMediaBlobUrl(slides[cur + 1], 'image/webp').catch(function () {});
      } catch (e) {}
    }

    box.querySelector('[data-prev]').addEventListener('click', function () { showSlide(cur - 1); });
    box.querySelector('[data-next]').addEventListener('click', function () { showSlide(cur + 1); });
    var dlBtn = box.querySelector('[data-dl-ppt]');
    if (dlBtn) dlBtn.addEventListener('click', function () {
      triggerDownload(info.origEnc, info.name, 'application/vnd.openxmlformats-officedocument.presentationml.presentation', dlBtn);
    });
    box.querySelector('[data-full]').addEventListener('click', function () {
      openPptFullscreen(info.name, slides, cur, showSlide);
    });
    imgEl.addEventListener('click', function () {
      openPptFullscreen(info.name, slides, cur, showSlide);
    });

    // 懒加载第一张幻灯片
    if ('IntersectionObserver' in window) {
      var ob = new IntersectionObserver(function (ens) {
        if (ens[0].isIntersecting) { showSlide(0); ob.disconnect(); }
      }, { rootMargin: '250px 0px' });
      ob.observe(box);
    } else {
      showSlide(0);
    }
  }

  // PPT 全屏模态框
  var pptModal = document.getElementById('pptModal');
  var pptModalState = null;
  function openPptFullscreen(title, slides, startIdx, syncFn) {
    pptModalState = { slides: slides, idx: startIdx, sync: syncFn };
    document.getElementById('pptModalTitle').textContent = title;
    pptModal.hidden = false;
    pptModal.setAttribute('aria-hidden', 'false');
    renderPptModalSlide();
  }
  async function renderPptModalSlide() {
    if (!pptModalState) return;
    var s = pptModalState;
    s.idx = ((s.idx % s.slides.length) + s.slides.length) % s.slides.length;
    document.getElementById('pptModalPage').textContent = (s.idx + 1) + ' / ' + s.slides.length;
    document.getElementById('pptModalImg').src = await getMediaBlobUrl(s.slides[s.idx], 'image/webp');
    if (s.sync) s.sync(s.idx);
  }
  document.getElementById('pptModalPrev').addEventListener('click', function () { if (pptModalState) { pptModalState.idx--; renderPptModalSlide(); } });
  document.getElementById('pptModalNext').addEventListener('click', function () { if (pptModalState) { pptModalState.idx++; renderPptModalSlide(); } });
  document.getElementById('pptModalClose').addEventListener('click', function () {
    pptModal.hidden = true;
    pptModal.setAttribute('aria-hidden', 'true');
    pptModalState = null;
  });

  function renderVideoSlot(box, info) {
    box.innerHTML =
      '<div class="wk-m-head">' +
        '<div class="wk-m-title">🎬 <span>' + escHtml(info.name) + '</span></div>' +
        '<div class="wk-m-actions"><span class="wk-m-meta">' + fmtSize(info.size) + (info.mode === 'hls' ? ' · 分段秒播' : '') + '</span></div>' +
      '</div>' +
      '<div class="wk-video-wrap">' +
        '<div class="wk-video-poster"><img alt="视频封面"><button type="button" class="wk-play-fab">▶ 点击播放视频</button></div>' +
        '<video controls playsinline hidden></video>' +
      '</div>';

    var posterBox = box.querySelector('.wk-video-poster');
    var posterImg = posterBox.querySelector('img');
    var playBtn = posterBox.querySelector('.wk-play-fab');
    var videoEl = box.querySelector('video');

    if (info.posterEnc) {
      getMediaBlobUrl(info.posterEnc, 'image/webp').then(function (u) { posterImg.src = u; }).catch(function () {});
    }

    posterBox.addEventListener('click', async function () {
      playBtn.disabled = true;
      playBtn.textContent = '正在解密加载…';
      try {
        if (info.mode === 'mp4') {
          var url = await getMediaBlobUrl(info.enc, 'video/mp4');
          posterBox.hidden = true;
          videoEl.hidden = false;
          videoEl.src = url;
          videoEl.play().catch(function () {});
        } else if (winHlsAvailable()) {
          startEncryptedHls(info.playlistEnc, videoEl, posterBox);
        } else {
          playBtn.textContent = '当前浏览器不支持加密分片播放';
        }
      } catch (e) {
        playBtn.disabled = false;
        playBtn.textContent = '加载失败，点此重试';
      }
    });
  }

  function winHlsAvailable() {
    return typeof window.Hls !== 'undefined' && window.Hls.isSupported();
  }

  function startEncryptedHls(playlistEncPath, videoEl, posterBox) {
    var BaseLoader = window.Hls.DefaultConfig.loader;
    function EncryptedLoader(config) {
      BaseLoader.call(this, config);
    }
    EncryptedLoader.prototype = Object.create(BaseLoader.prototype);
    EncryptedLoader.prototype.load = function (context, config, callbacks) {
      var origOnSuccess = callbacks.onSuccess;
      var origRespType = context.responseType;
      var isEnc = context.url && context.url.indexOf('.enc') >= 0;
      if (isEnc) context.responseType = 'arraybuffer';
      callbacks.onSuccess = function (response, stats, ctx, networkDetails) {
        if (isEnc && response && response.data instanceof ArrayBuffer) {
          Auth.decryptBytes(session.cryptoKey, response.data).then(function (plain) {
            ctx.responseType = origRespType;
            response.data = (origRespType === 'arraybuffer') ? plain : new TextDecoder().decode(plain);
            origOnSuccess(response, stats, ctx, networkDetails);
          }).catch(function (err) {
            callbacks.onError({ code: 500, text: err.message }, ctx, networkDetails);
          });
          return;
        }
        origOnSuccess(response, stats, ctx, networkDetails);
      };
      BaseLoader.prototype.load.call(this, context, config, callbacks);
    };

    var hls = new window.Hls({ loader: EncryptedLoader });
    activeHlsInstances.push(hls);
    hls.loadSource(playlistEncPath);
    hls.attachMedia(videoEl);
    hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
      posterBox.hidden = true;
      videoEl.hidden = false;
      videoEl.play().catch(function () {});
    });
  }

  function renderFileSlot(box, info) {
    var files = info.encFiles || [];
    box.innerHTML =
      '<div class="wk-file-body">' +
        '<div class="wk-m-title">📦 <span>' + escHtml(info.name) + '</span> <span class="wk-m-meta">(' + fmtSize(info.size) + ')</span></div>' +
        '<div class="wk-m-actions"></div>' +
      '</div>';
    var act = box.querySelector('.wk-m-actions');
    files.forEach(function (f, idx) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'wk-m-btn primary';
      b.textContent = files.length > 1 ? ('下载分卷 ' + (idx + 1)) : '解密下载文件';
      b.addEventListener('click', function () {
        var dlName = files.length > 1 ? ('part' + (idx + 1) + '-' + info.name) : info.name;
        triggerDownload(f, dlName, info.mime, b);
      });
      act.appendChild(b);
    });
  }

  // ====== 全文搜索 ======
  var searchModal = document.getElementById('searchModal');
  var searchInput = document.getElementById('searchModalInput');
  var searchResults = document.getElementById('searchResults');
  var searchStatus = document.getElementById('searchStatus');

  async function openSearchModal() {
    searchModal.hidden = false;
    searchModal.setAttribute('aria-hidden', 'false');
    searchInput.focus();
    if (!searchIndex && session) {
      searchStatus.textContent = '首次打开正在加载全库索引…';
      searchIndex = await fetchDecryptedJson('data/search.enc');
      searchStatus.textContent = '全库 93 篇索引就绪，输入关键词秒搜';
    }
  }
  function closeSearchModal() {
    searchModal.hidden = true;
    searchModal.setAttribute('aria-hidden', 'true');
  }
  document.getElementById('searchOpenBtn').addEventListener('click', openSearchModal);
  document.getElementById('searchCloseBtn').addEventListener('click', closeSearchModal);
  searchModal.addEventListener('click', function (ev) { if (ev.target === searchModal) closeSearchModal(); });

  searchInput.addEventListener('input', function () {
    if (!searchIndex) return;
    var q = searchInput.value.trim();
    if (!q) {
      searchResults.innerHTML = '';
      searchStatus.textContent = '输入关键词开始搜索';
      return;
    }
    var terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    var hits = [];
    searchIndex.forEach(function (doc) {
      var tl = doc.title.toLowerCase();
      var tx = doc.text.toLowerCase();
      var score = 0;
      for (var i = 0; i < terms.length; i++) {
        var term = terms[i];
        var inTitle = tl.indexOf(term) >= 0;
        var pos = tx.indexOf(term);
        if (!inTitle && pos < 0) return;
        score += (inTitle ? 10 : 0) + (pos >= 0 ? 2 : 0);
      }
      hits.push({ doc: doc, score: score, pos: Math.max(0, tx.indexOf(terms[0])) });
    });
    hits.sort(function (a, b) { return b.score - a.score; });
    searchStatus.textContent = '找到 ' + hits.length + ' 篇相关页面';
    searchResults.innerHTML = hits.slice(0, 30).map(function (h) {
      var start = Math.max(0, h.pos - 30);
      var snip = h.doc.text.slice(start, start + 110);
      return '<a class="wk-sr-item" href="?p=' + h.doc.t + '" data-node="' + h.doc.t + '">' +
        '<div class="wk-sr-title">' + highlightText(h.doc.title, terms) + '</div>' +
        '<div class="wk-sr-path">' + escHtml(h.doc.path) + '</div>' +
        '<div class="wk-sr-snip">' + highlightText(snip, terms) + '…</div>' +
      '</a>';
    }).join('');
    searchResults.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        closeSearchModal();
        loadPage(a.getAttribute('data-node'), '', true);
      });
    });
  });

  function highlightText(str, terms) {
    var safe = escHtml(str);
    terms.forEach(function (t) {
      if (!t) return;
      var re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      safe = safe.replace(re, '<mark>$1</mark>');
    });
    return safe;
  }

  // ====== 配套模板与交付包下载 ======
  var packsModal = document.getElementById('packsModal');
  var packsList = document.getElementById('packsList');
  var packsCache = null;

  async function openPacksModal() {
    if (!packsModal) return;
    packsModal.hidden = false;
    packsModal.setAttribute('aria-hidden', 'false');
    if (!packsCache) {
      packsList.innerHTML = '<div style="color:var(--muted);font-size:13px">正在读取清单…</div>';
      try {
        var r = await (Auth.fetchWithRetry || fetch)('data/packs.json?t=' + Date.now(), { cache: 'no-store' }, 2, 10000);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        packsCache = await r.json();
      } catch (e) {
        packsList.innerHTML = '<div style="color:#dc2626;font-size:13px">暂时无法加载清单，请刷新重试。</div>';
        return;
      }
    }
    var items = (packsCache && packsCache.packs) || [];
    if (!items.length) {
      packsList.innerHTML = '<div style="color:var(--muted);font-size:13px">暂无可下载资料包</div>';
      return;
    }
    packsList.innerHTML = items.map(function (pk, idx) {
      return '<div style="border:1px solid var(--line);border-radius:12px;padding:14px;background:var(--surface2);display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">' +
        '<div style="flex:1 1 260px;min-width:0">' +
          '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><b>📦 ' + escHtml(pk.name) + '</b><span style="font-size:11px;padding:2px 8px;border-radius:999px;background:var(--blue-soft);color:var(--blue);font-weight:700">' + escHtml(pk.plan) + '</span></div>' +
          '<div style="font-size:12.5px;color:var(--ink2);margin-top:5px">' + escHtml(pk.desc) + '</div>' +
          '<div style="font-size:11.5px;color:var(--muted);margin-top:4px">压缩包：' + escHtml(pk.filename) + '（' + fmtSize(pk.size) + '）</div>' +
        '</div>' +
        '<button type="button" class="wk-m-btn primary" data-pack-idx="' + idx + '">解密下载 →</button>' +
      '</div>';
    }).join('');
    packsList.querySelectorAll('[data-pack-idx]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var pk = items[Number(btn.getAttribute('data-pack-idx'))];
        if (pk) triggerDownload(pk.encPath, pk.filename, 'application/zip', btn);
      });
    });
  }
  function closePacksModal() {
    if (!packsModal) return;
    packsModal.hidden = true;
    packsModal.setAttribute('aria-hidden', 'true');
  }
  var openPacksBtn = document.getElementById('openPacksBtn');
  if (openPacksBtn) openPacksBtn.addEventListener('click', openPacksModal);
  var packsCloseBtn = document.getElementById('packsCloseBtn');
  if (packsCloseBtn) packsCloseBtn.addEventListener('click', closePacksModal);
  if (packsModal) packsModal.addEventListener('click', function (ev) { if (ev.target === packsModal) closePacksModal(); });

  // 字号调节 & 键盘快捷键
  document.getElementById('fontSizeBtn').addEventListener('click', function () {
    fontIdx = (fontIdx + 1) % fontSizes.length;
    document.documentElement.style.setProperty('--doc-font', fontSizes[fontIdx] + 'px');
  });

  document.addEventListener('keydown', function (ev) {
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
      if (session) { ev.preventDefault(); openSearchModal(); }
    } else if (ev.key === 'Escape') {
      if (!searchModal.hidden) closeSearchModal();
      if (packsModal && !packsModal.hidden) closePacksModal();
      if (!lbMask.hidden) closeLightbox();
      if (!pptModal.hidden) document.getElementById('pptModalClose').click();
    } else if (!pptModal.hidden && pptModalState) {
      if (ev.key === 'ArrowLeft') { pptModalState.idx--; renderPptModalSlide(); }
      if (ev.key === 'ArrowRight') { pptModalState.idx++; renderPptModalSlide(); }
    }
  });

  function escHtml(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function fmtSize(num) {
    if (!num) return '';
    if (num < 1024) return num + ' B';
    if (num < 1024 * 1024) return (num / 1024).toFixed(1) + ' KB';
    return (num / 1024 / 1024).toFixed(1) + ' MB';
  }

  // ====== 启动检查与预热配置 ======
  Auth.loadAuthConfig('./').catch(function () {});
  Auth.tryRestoreSession().then(function (restored) {
    if (restored) {
      bootReader(restored).catch(function () {
        document.documentElement.classList.remove('wk-has-session');
        gateEl.hidden = false;
        appEl.hidden = true;
      });
    } else {
      document.documentElement.classList.remove('wk-has-session');
      gateEl.hidden = false;
      appEl.hidden = true;
    }
  });
})();
