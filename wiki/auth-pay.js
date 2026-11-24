/* 实战知识库 · 门禁加解密与商业支付收银台共享模块（无任何明文密码/密钥） */
(function (win) {
  'use strict';

  var SESSION_KEY = 'guiji_wiki_session_v1';
  var DEFAULT_TTL_MS = 7 * 24 * 3600 * 1000;

  function toB64(bytes) {
    var bin = '';
    var arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    for (var i = 0; i < arr.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, arr.subarray(i, i + 0x8000));
    }
    return btoa(bin);
  }

  function fromB64(b64) {
    var bin = atob(b64);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  async function sha256Hex(str) {
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }

  async function importDek(dekBytes) {
    return crypto.subtle.importKey('raw', dekBytes, { name: 'AES-GCM' }, false, ['decrypt']);
  }

  async function decryptBytes(cryptoKey, arrayBuffer) {
    if (!arrayBuffer || arrayBuffer.byteLength <= 28) {
      throw new Error('加密数据长度异常');
    }
    var u8 = new Uint8Array(arrayBuffer);
    var iv = u8.subarray(0, 12);
    var ct = u8.subarray(12);
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, cryptoKey, ct);
  }

  async function unwrapEnvelope(secret, env, kdfCfg) {
    if (!env || !env.salt || !env.iv || !env.wrapped) {
      throw new Error('缺少加密信封');
    }
    var baseKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    var kek = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: fromB64(env.salt),
        iterations: (kdfCfg && kdfCfg.iterations) || 200000,
        hash: (kdfCfg && kdfCfg.hash) || 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    var plainBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromB64(env.iv) },
      kek,
      fromB64(env.wrapped)
    );
    return new Uint8Array(plainBuf);
  }

  function normalizeInput(str) {
    return String(str || '')
      .replace(/\u3000/g, ' ')
      .replace(/[\uFF01-\uFF5E]/g, function (ch) {
        return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
      })
      .trim();
  }

  async function fetchWithRetry(url, opts, retries, timeoutMs) {
    var maxRetries = typeof retries === 'number' ? retries : 3;
    var waitMs = typeof timeoutMs === 'number' ? timeoutMs : 15000;
    var lastErr = null;
    for (var attempt = 1; attempt <= maxRetries; attempt++) {
      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var tid = ctrl ? setTimeout(function () { ctrl.abort(); }, waitMs) : null;
      try {
        var reqOpts = Object.assign({}, opts || {});
        if (ctrl && !reqOpts.signal) reqOpts.signal = ctrl.signal;
        var res = await fetch(url, reqOpts);
        if (tid) clearTimeout(tid);
        if (res.ok || (res.status < 500 && res.status !== 429) || attempt === maxRetries) {
          return res;
        }
        lastErr = new Error('HTTP ' + res.status);
      } catch (e) {
        if (tid) clearTimeout(tid);
        lastErr = e;
        if (attempt === maxRetries) throw e;
      }
      await new Promise(function (r) { setTimeout(r, 500 * attempt); });
    }
    throw lastErr || new Error('网络请求失败');
  }

  var authCache = {};
  async function loadAuthConfig(base) {
    var root = base || './';
    if (authCache[root]) return authCache[root];
    var res = await fetchWithRetry(root + 'data/auth.json?t=' + Date.now(), { cache: 'no-store' }, 3, 12000);
    if (!res.ok) throw new Error('无法读取访问配置');
    var data = await res.json();
    authCache[root] = data;
    return data;
  }

  function saveSession(dekBytes, meta, remember) {
    var payload = JSON.stringify({
      dek: toB64(dekBytes),
      plan: meta.plan || 'full',
      label: meta.label || '已解锁',
      mode: meta.mode || 'envelope',
      expiresAt: Date.now() + DEFAULT_TTL_MS
    });
    try {
      sessionStorage.setItem(SESSION_KEY, payload);
      if (remember) localStorage.setItem(SESSION_KEY, payload);
      else localStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  }

  function lockSession() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_KEY);
    } catch (e) {}
  }

  async function tryRestoreSession() {
    var raw = null;
    try {
      raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
    } catch (e) {}
    if (!raw) return null;
    try {
      var parsed = JSON.parse(raw);
      if (!parsed.dek || (parsed.expiresAt && Date.now() > parsed.expiresAt)) {
        lockSession();
        return null;
      }
      var dekBytes = fromB64(parsed.dek);
      var cryptoKey = await importDek(dekBytes);
      return {
        dekBytes: dekBytes,
        cryptoKey: cryptoKey,
        plan: parsed.plan || 'full',
        label: parsed.label || '已解锁',
        mode: parsed.mode || 'session'
      };
    } catch (e) {
      lockSession();
      return null;
    }
  }

  async function tryServerAuth(type, credential) {
    var h = (win.location && win.location.hostname || '').toLowerCase();
    var p = (win.location && win.location.port) || '';
    if (h === 'guijiyeren.github.io' || ((h === '127.0.0.1' || h === 'localhost') && p !== '8788')) {
      return { fallback: true };
    }
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var tid = ctrl ? setTimeout(function () { ctrl.abort(); }, 4500) : null;
    try {
      var res = await fetch('/api/wiki/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: type, credential: credential }),
        signal: ctrl ? ctrl.signal : undefined
      });
      if (tid) clearTimeout(tid);
      var ct = (res.headers.get('content-type') || '').toLowerCase();
      if (!ct.includes('application/json')) return { fallback: true };
      var j = await res.json();
      if (j && j.fallback) return { fallback: true };
      return j;
    } catch (e) {
      if (tid) clearTimeout(tid);
      return { fallback: true };
    }
  }

  async function unlockWithPasscode(passcode, remember, base) {
    var clean = normalizeInput(passcode);
    if (!clean) throw new Error('请输入访问密码');

    var cfg = await loadAuthConfig(base);
    if (cfg.passcodeEnabled && cfg.passcodeEnvelope && !cfg.preferServerAuth) {
      try {
        var dekBytes = await unwrapEnvelope(clean, cfg.passcodeEnvelope, cfg.kdf);
        var cryptoKey = await importDek(dekBytes);
        var meta = { plan: 'full', label: '密码访问', mode: 'envelope' };
        saveSession(dekBytes, meta, remember);
        return Object.assign({ dekBytes: dekBytes, cryptoKey: cryptoKey }, meta);
      } catch (e) {}
    }

    var srv = await tryServerAuth('passcode', clean);
    if (srv && !srv.fallback) {
      if (srv.ok && srv.dek) {
        var sDek = fromB64(srv.dek);
        var sKey = await importDek(sDek);
        var sMeta = { plan: srv.plan || 'full', label: srv.label || '密码访问', mode: 'server' };
        saveSession(sDek, sMeta, remember);
        return Object.assign({ dekBytes: sDek, cryptoKey: sKey }, sMeta);
      }
      throw new Error(srv.error || '访问密码不正确');
    }

    if (!cfg.passcodeEnabled || !cfg.passcodeEnvelope) {
      throw new Error('密码通道已关闭，请使用正式授权码进入');
    }
    throw new Error('访问密码不正确，请核对后重试');
  }

  async function unlockWithLicense(code, remember, base) {
    var norm = normalizeInput(code).toUpperCase();
    if (!norm) throw new Error('请输入授权码');

    var cfg = await loadAuthConfig(base);
    var list = cfg.licenses || [];
    if (list.length && !cfg.preferServerAuth) {
      var hint = (await sha256Hex(norm)).slice(0, 8);
      var candidates = list.filter(function (item) { return item.hint === hint; });
      if (!candidates.length) candidates = list;
      for (var i = 0; i < candidates.length; i++) {
        var lic = candidates[i];
        try {
          var dekBytes = await unwrapEnvelope(norm, lic, cfg.kdf);
          if (lic.expiresAt && Date.parse(lic.expiresAt) < Date.now()) {
            throw new Error('该授权码已到期，请续费后使用');
          }
          var cryptoKey = await importDek(dekBytes);
          var meta = { plan: lic.plan || 'full', label: lic.label || '正式授权', mode: 'license' };
          saveSession(dekBytes, meta, remember);
          return Object.assign({ dekBytes: dekBytes, cryptoKey: cryptoKey }, meta);
        } catch (err) {
          if (err && err.message && err.message.indexOf('到期') >= 0) throw err;
        }
      }
    }

    var srv = await tryServerAuth('license', norm);
    if (srv && !srv.fallback) {
      if (srv.ok && srv.dek) {
        var sDek = fromB64(srv.dek);
        var sKey = await importDek(sDek);
        var sMeta = { plan: srv.plan || 'full', label: srv.label || '正式授权', mode: 'server' };
        saveSession(sDek, sMeta, remember);
        return Object.assign({ dekBytes: sDek, cryptoKey: sKey }, sMeta);
      }
      throw new Error(srv.error || '授权码无效或已过期');
    }

    if (!list.length) {
      throw new Error('当前尚无离线授权码，请使用访问密码或通过在线下单开通');
    }
    throw new Error('授权码无效，请检查是否输入正确');
  }

  /* ====== 商业支付收银台弹窗（前后端全打通 + 本地无后端时平滑演示） ====== */
  var payModalEl = null;
  var pollTimer = null;

  function ensurePayStyles() {
    if (document.getElementById('guijiPayStyle')) return;
    var st = document.createElement('style');
    st.id = 'guijiPayStyle';
    st.textContent = [
      '#guijiPayMask{position:fixed;inset:0;z-index:320;background:rgba(7,11,22,.7);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto}',
      '#guijiPayMask[hidden]{display:none}',
      '.gp-card{width:min(660px,100%);background:var(--surface,#fff);color:var(--ink,#0f172a);border:1px solid var(--line,#e2e8f0);border-radius:20px;padding:22px;box-shadow:0 30px 90px rgba(0,0,0,.45);max-height:92vh;overflow-y:auto}',
      'html[data-theme="night"] .gp-card{background:#0f172a;color:#e2e8f0;border-color:#243247}',
      '.gp-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding-bottom:12px;border-bottom:1px solid var(--line,#e2e8f0)}',
      '.gp-head h3{font-size:19px;margin:0}',
      '.gp-close{border:1px solid var(--line,#e2e8f0);background:transparent;color:inherit;border-radius:999px;padding:4px 12px;cursor:pointer;font-size:13px}',
      '.gp-plans{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0}',
      '@media(max-width:600px){.gp-plans{grid-template-columns:1fr}}',
      '.gp-plan{text-align:left;padding:11px 12px;border-radius:12px;border:1.5px solid var(--line,#e2e8f0);background:var(--surface2,#f8fafc);color:inherit;cursor:pointer;position:relative}',
      'html[data-theme="night"] .gp-plan{background:#111c33;border-color:#243247}',
      '.gp-plan.is-on{border-color:#2563eb;background:rgba(37,99,235,.09)}',
      '.gp-plan-top{display:flex;justify-content:space-between;align-items:center;gap:6px}',
      '.gp-plan-top b{font-size:13.5px;line-height:1.35}',
      '.gp-badge{font-size:10.5px;font-weight:700;padding:2px 7px;border-radius:999px;background:#dbeafe;color:#1d4ed8;white-space:nowrap}',
      '.gp-price{font-size:18px;font-weight:800;color:#2563eb;margin-top:4px}',
      '.gp-sub{font-size:11.5px;color:#64748b;margin-top:3px;line-height:1.45}',
      '.gp-delivery{font-size:12.5px;padding:10px 12px;border-radius:10px;background:rgba(37,99,235,.07);border:1px solid rgba(37,99,235,.22);margin-bottom:12px;line-height:1.6}',
      '.gp-row{display:flex;gap:8px;margin:10px 0}',
      '.gp-ch{flex:1;padding:10px;border-radius:10px;border:1.5px solid var(--line,#e2e8f0);background:var(--surface2,#f8fafc);color:inherit;font-weight:700;font-size:13.5px;cursor:pointer}',
      'html[data-theme="night"] .gp-ch{background:#111c33;border-color:#243247}',
      '.gp-ch.is-on{border-color:#2563eb;color:#2563eb;background:rgba(37,99,235,.1)}',
      '.gp-input{width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--line,#e2e8f0);background:var(--surface2,#f8fafc);color:inherit;font-size:13.5px}',
      'html[data-theme="night"] .gp-input{background:#111c33;border-color:#243247}',
      '.gp-submit{width:100%;margin-top:12px;border:0;border-radius:12px;padding:13px 16px;font-size:15px;font-weight:700;color:#fff;background:linear-gradient(135deg,#1e40af,#2563eb);cursor:pointer}',
      '.gp-stage{margin-top:14px;padding:16px;border-radius:14px;border:1px solid var(--line,#e2e8f0);background:var(--surface2,#f8fafc);text-align:center}',
      'html[data-theme="night"] .gp-stage{background:#111c33;border-color:#243247}',
      '.gp-qr-mock{width:168px;height:168px;margin:10px auto;border-radius:12px;background:#fff;border:1px solid #cbd5e1;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#0f172a;padding:10px;font-size:12px}',
      '.gp-ok-box{padding:12px;border-radius:12px;background:#ecfdf5;border:1px solid #6ee7b7;color:#065f46;font-size:13.5px;line-height:1.65;text-align:left}',
      '.gp-code{font-family:ui-monospace,monospace;font-size:17px;font-weight:800;letter-spacing:1px;margin:6px 0;color:#047857}'
    ].join('');
    document.head.appendChild(st);
  }

  function closeCheckout() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    if (payModalEl) payModalEl.hidden = true;
  }

  async function openCheckout(opts) {
    opts = opts || {};
    var base = opts.base || './';
    ensurePayStyles();
    var cfg = await loadAuthConfig(base);
    var plans = (cfg.commerce && cfg.commerce.plans) || [];
    if (!plans.length) return;

    var selectedPlanId = opts.planId || plans[0].id;
    var selectedChannel = 'wechat';

    if (!payModalEl) {
      payModalEl = document.createElement('div');
      payModalEl.id = 'guijiPayMask';
      payModalEl.hidden = true;
      payModalEl.addEventListener('click', function (ev) {
        if (ev.target === payModalEl) closeCheckout();
      });
      document.body.appendChild(payModalEl);
    }

    function getPlan() {
      return plans.find(function (p) { return p.id === selectedPlanId; }) || plans[0];
    }

    function escHtml(s) {
      return String(s || '').replace(/[&<>"']/g, function (c) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
      });
    }

    function render() {
      var cur = getPlan();
      var plansHtml = plans.map(function (p) {
        var on = p.id === cur.id ? ' is-on' : '';
        return '<button type="button" class="gp-plan' + on + '" data-pid="' + escHtml(p.id) + '">' +
          '<div class="gp-plan-top"><b>' + escHtml(p.name) + '</b>' + (p.badge ? '<span class="gp-badge">' + escHtml(p.badge) + '</span>' : '') + '</div>' +
          '<div class="gp-price">' + escHtml(p.priceText || ('¥' + p.price)) + '</div>' +
          '<div class="gp-sub">' + escHtml(p.subtitle) + '</div>' +
        '</button>';
      }).join('');

      payModalEl.innerHTML =
        '<div class="gp-card" role="dialog" aria-label="开通商业授权收银台">' +
          '<div class="gp-head">' +
            '<h3>💎 开通实战授权 · 自助收银台</h3>' +
            '<button type="button" class="gp-close" id="gpCloseBtn">✕ 关闭</button>' +
          '</div>' +
          '<div class="gp-plans">' + plansHtml + '</div>' +
          '<div class="gp-delivery"><b>交付说明：</b>' + escHtml(cur.delivery) + '</div>' +
          '<div class="gp-row">' +
            '<button type="button" class="gp-ch' + (selectedChannel === 'wechat' ? ' is-on' : '') + '" data-ch="wechat">💚 微信支付</button>' +
            '<button type="button" class="gp-ch' + (selectedChannel === 'alipay' ? ' is-on' : '') + '" data-ch="alipay">💙 支付宝</button>' +
          '</div>' +
          '<input type="text" class="gp-input" id="gpContact" placeholder="选填：微信 / 邮箱（方便接收回执或预约 1 对 1 对焦）">' +
          '<button type="button" class="gp-submit" id="gpPayBtn">立即支付 ' + escHtml(cur.priceText || ('¥' + cur.price)) + ' 并获取授权码 →</button>' +
          '<div class="gp-stage" id="gpStage" hidden></div>' +
        '</div>';

      payModalEl.hidden = false;
      document.getElementById('gpCloseBtn').addEventListener('click', closeCheckout);
      payModalEl.querySelectorAll('.gp-plan').forEach(function (btn) {
        btn.addEventListener('click', function () {
          selectedPlanId = btn.getAttribute('data-pid');
          render();
        });
      });
      payModalEl.querySelectorAll('.gp-ch').forEach(function (btn) {
        btn.addEventListener('click', function () {
          selectedChannel = btn.getAttribute('data-ch');
          render();
        });
      });
      document.getElementById('gpPayBtn').addEventListener('click', startOrder);
    }

    async function handlePaid(payload) {
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
      var stage = document.getElementById('gpStage');
      if (!stage) return;
      var code = payload.licenseCode || '';
      var hasRealDek = Boolean(payload.dek);
      if (hasRealDek) {
        var dekBytes = fromB64(payload.dek);
        var cryptoKey = await importDek(dekBytes);
        var meta = { plan: payload.planId || selectedPlanId, label: '已购授权', mode: 'paid' };
        saveSession(dekBytes, meta, true);
        if (typeof opts.onPaid === 'function') {
          opts.onPaid(Object.assign({ dekBytes: dekBytes, cryptoKey: cryptoKey, licenseCode: code }, meta));
        }
      }
      stage.hidden = false;
      stage.innerHTML =
        '<div class="gp-ok-box">' +
          '<div><b>✅ 订单支付成功！</b>（订单号：' + escHtml(payload.orderId || 'OK') + '）</div>' +
          (code ? '<div>您的专属授权码：</div><div class="gp-code">' + escHtml(code) + '</div>' : '') +
          (hasRealDek
            ? '<div>已自动为您激活访问权限。<a href="' + escHtml(base) + '" style="font-weight:800;color:#047857;text-decoration:underline">立即进入知识库 →</a></div>'
            : '<div style="margin-top:6px;font-size:12.5px">说明：当前为本地静态预览联调（未连接 EdgeOne 云端环境变量），正式发布至 EdgeOne 并填入商户参数后即可真收款并自动签发可解锁的真实授权码。</div>') +
        '</div>';
    }

    async function startOrder() {
      var cur = getPlan();
      var contact = (document.getElementById('gpContact').value || '').trim();
      var payBtn = document.getElementById('gpPayBtn');
      var stage = document.getElementById('gpStage');
      payBtn.disabled = true;
      payBtn.textContent = '正在创建订单…';
      stage.hidden = false;
      stage.innerHTML = '正在连接收银台…';

      var orderRes = null;
      var h = (win.location && win.location.hostname || '').toLowerCase();
      var p = (win.location && win.location.port) || '';
      var skipApi = (h === 'guijiyeren.github.io' || ((h === '127.0.0.1' || h === 'localhost') && p !== '8788'));
      if (!skipApi) {
        try {
          var r = await fetch('/api/pay/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planId: cur.id, channel: selectedChannel, contact: contact })
          });
          if (r.ok && (r.headers.get('content-type') || '').includes('application/json')) {
            orderRes = await r.json();
          }
        } catch (e) {}
      }

      payBtn.disabled = false;
      payBtn.textContent = '立即支付 ' + (cur.priceText || ('¥' + cur.price)) + ' 并获取授权码 →';

      if (!orderRes || !orderRes.ok) {
        // 纯静态托管 / 本地调试兜底沙箱流程
        var simId = 'SIM-' + Date.now().toString(36).toUpperCase();
        stage.innerHTML =
          '<div><b>收银台联调演示</b> · 订单号 <code>' + escHtml(simId) + '</code></div>' +
          '<div class="gp-qr-mock">' +
            '<div style="font-size:32px;margin-bottom:6px">' + (selectedChannel === 'wechat' ? '💚' : '💙') + '</div>' +
            '<div><b>' + (selectedChannel === 'wechat' ? '微信支付' : '支付宝') + '</b></div>' +
            '<div style="color:#2563eb;font-weight:800;font-size:15px;margin-top:4px">' + escHtml(cur.priceText || ('¥' + cur.price)) + '</div>' +
            '<div style="font-size:10.5px;color:#64748b;margin-top:4px">沙箱演示通道</div>' +
          '</div>' +
          '<button type="button" class="gp-submit" id="gpSimConfirm" style="margin-top:6px;background:linear-gradient(135deg,#059669,#10b981)">模拟买家付款成功（演示闭环）→</button>';
        document.getElementById('gpSimConfirm').addEventListener('click', function () {
          handlePaid({ orderId: simId, planId: cur.id, licenseCode: 'DEMO-PREVIEW-ONLY', dek: null });
        });
        return;
      }

      if (orderRes.mode === 'sandbox') {
        stage.innerHTML =
          '<div><b>沙箱测试订单</b> · 订单号 <code>' + escHtml(orderRes.orderId) + '</code></div>' +
          '<div class="gp-qr-mock">' +
            '<div style="font-size:32px;margin-bottom:6px">' + (selectedChannel === 'wechat' ? '💚' : '💙') + '</div>' +
            '<div><b>' + escHtml(cur.name) + '</b></div>' +
            '<div style="color:#2563eb;font-weight:800;font-size:15px;margin-top:4px">' + escHtml(cur.priceText) + '</div>' +
          '</div>' +
          '<button type="button" class="gp-submit" id="gpSandboxPay" style="margin-top:6px;background:linear-gradient(135deg,#059669,#10b981)">模拟完成支付并签发授权码 →</button>';
        document.getElementById('gpSandboxPay').addEventListener('click', async function () {
          var nr = await fetch('/api/pay/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: orderRes.orderId, action: 'sandbox_pay' })
          });
          var nj = await nr.json();
          if (nj && nj.ok) {
            handlePaid(nj);
          }
        });
        return;
      }

      if (orderRes.mode === 'external_card') {
        stage.innerHTML =
          '<div><b>自助发卡 / 扫码支付通道</b> · 订单号 <code>' + escHtml(orderRes.orderId) + '</code></div>' +
          '<p style="font-size:13px;margin:8px 0">' + escHtml(orderRes.tip || '请点击下方链接完成支付，拿到授权码后可直接解锁。') + '</p>' +
          (orderRes.payUrl ? '<a class="gp-submit" style="display:inline-block;text-decoration:none" href="' + escHtml(orderRes.payUrl) + '" target="_blank" rel="noopener">前往付款获取授权码 ↗</a>' : '');
        return;
      }

      // alipay_f2f / wechat_native / hupijiao 轮询模式
      stage.innerHTML =
        '<div><b>请使用' + (selectedChannel === 'wechat' ? '微信' : '支付宝') + '扫码支付</b> · <code>' + escHtml(orderRes.orderId) + '</code></div>' +
        (orderRes.qrImg ? '<img src="' + escHtml(orderRes.qrImg) + '" alt="支付二维码" style="width:180px;height:180px;margin:10px auto;display:block;border-radius:10px">' : '') +
        (orderRes.payUrl ? '<div style="margin:8px 0"><a href="' + escHtml(orderRes.payUrl) + '" target="_blank" rel="noopener">手机端点击直接拉起支付 ↗</a></div>' : '') +
        '<div style="font-size:12px;color:#64748b">支付成功后页面将自动识别并解锁知识库…</div>';
      pollTimer = setInterval(async function () {
        try {
          var qr = await fetch('/api/pay/query?orderId=' + encodeURIComponent(orderRes.orderId));
          var qj = await qr.json();
          if (qj && qj.paid) handlePaid(qj);
        } catch (e) {}
      }, 2200);
    }

    render();
  }

  win.GuijiWikiAuth = {
    loadAuthConfig: loadAuthConfig,
    fetchWithRetry: fetchWithRetry,
    tryRestoreSession: tryRestoreSession,
    unlockWithPasscode: unlockWithPasscode,
    unlockWithLicense: unlockWithLicense,
    decryptBytes: decryptBytes,
    lockSession: lockSession,
    openCheckout: openCheckout
  };
})(window);
