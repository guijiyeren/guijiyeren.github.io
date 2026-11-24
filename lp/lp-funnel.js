/* 单人群广告落地页共有漏斗引擎：UTM 参数捕获 + 免费见面礼留资解锁 + 充 Token 式收银台交互样机 */
(function (win, doc) {
  'use strict';

  var cfg = win.LP_CONFIG || {};
  var aud = cfg.audience || 'ecom';
  var storeKey = 'guiji_lp_gift_v1_' + aud;

  function getUtm() {
    var qs = new URLSearchParams(win.location.search || '');
    return {
      utm_source: qs.get('utm_source') || '',
      utm_medium: qs.get('utm_medium') || '',
      utm_campaign: qs.get('utm_campaign') || '',
      utm_content: qs.get('utm_content') || ''
    };
  }

  function isLocalHost() {
    var h = win.location.hostname;
    return h === '127.0.0.1' || h === 'localhost';
  }

  // 主题切换
  var themeBtn = doc.getElementById('lpThemeBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = doc.documentElement.getAttribute('data-theme') === 'night' ? 'day' : 'night';
      doc.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('guiji_theme', next); } catch (e) {}
    });
  }

  // 滚动到免费见面礼表单
  doc.querySelectorAll('[data-scroll-gift]').forEach(function (el) {
    el.addEventListener('click', function () {
      var target = doc.getElementById('giftSection');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // ====== 1. 免费见面礼表单与当场解锁 ======
  var form = doc.getElementById('giftForm');
  var unlockBox = doc.getElementById('giftUnlockBox');
  var errEl = doc.getElementById('giftFormErr');
  var submitBtn = doc.getElementById('giftSubmitBtn');

  function showUnlocked(emailText) {
    if (!form || !unlockBox) return;
    form.hidden = true;
    unlockBox.hidden = false;
    var who = unlockBox.querySelector('[data-unlock-email]');
    if (who && emailText) who.textContent = emailText;
  }

  try {
    var savedGift = localStorage.getItem(storeKey);
    if (savedGift) {
      var parsed = JSON.parse(savedGift);
      if (parsed && parsed.email) showUnlocked(parsed.email);
    }
  } catch (e) {}

  var resetBtn = doc.getElementById('giftResetBtn');
  if (resetBtn && form && unlockBox) {
    resetBtn.addEventListener('click', function () {
      try { localStorage.removeItem(storeKey); } catch (e) {}
      unlockBox.hidden = true;
      form.hidden = false;
      if (errEl) errEl.textContent = '';
    });
  }

  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (errEl) errEl.textContent = '';
      var fd = new FormData(form);
      if (fd.get('_honey')) return;

      var name = String(fd.get('name') || '').trim();
      var email = String(fd.get('email') || '').trim();
      var extra = String(fd.get('extra') || '').trim();

      if (!name) {
        if (errEl) errEl.textContent = '请填一下怎么称呼你。';
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        if (errEl) errEl.textContent = '请填写一个正确的电子邮箱，方便给你留档与发更新提醒。';
        return;
      }

      var utm = getUtm();
      var oldLabel = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '正在为你解锁见面礼…';
      }

      var finishUnlock = function () {
        try {
          localStorage.setItem(storeKey, JSON.stringify({ name: name, email: email, ts: Date.now() }));
        } catch (e) {}
        showUnlocked(email);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = oldLabel;
        }
      };

      if (isLocalHost()) {
        setTimeout(finishUnlock, 150);
        return;
      }

      var FS_URL = 'https://formsubmit.co/ajax/' + String.fromCharCode(49,53,52,54,52,55,64,113,113,46,99,111,109);
      var msgLines = [
        '【来源落地页】' + (cfg.audienceName || aud),
        '【领取见面礼】' + (cfg.giftTitle || ''),
        '【对方称呼】' + name,
        '【对方邮箱】' + email,
        extra ? ('【情况备注】' + extra) : '',
        '【广告来源参数】' + JSON.stringify(utm),
        '【页面地址】' + win.location.href
      ].filter(Boolean).join('\n');

      var p1 = fetch(FS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: name,
          email: email,
          message: msgLines,
          _subject: '[广告线索-' + (cfg.audienceName || aud) + '] 领取免费见面礼',
          _template: 'table',
          _captcha: 'false'
        })
      }).catch(function () {});

      var p2 = fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audience: aud,
          name: name,
          email: email,
          extra: extra,
          utm: utm,
          pageUrl: win.location.href
        })
      }).catch(function () {});

      Promise.race([
        Promise.allSettled([p1, p2]),
        new Promise(function (r) { setTimeout(r, 2500); })
      ]).then(finishUnlock);
    });
  }

  // ====== 2. 统一「充 Token 式扫码秒开通」交互样机弹窗 ======
  var offers = cfg.offers || {};
  var maskEl = null;
  var timerId = null;
  var remainSec = 179;
  var currentCh = 'wechat';

  function formatSec(sec) {
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function ensureModal() {
    if (maskEl) return maskEl;
    maskEl = doc.createElement('div');
    maskEl.className = 'tok-mask';
    maskEl.id = 'tokPayMask';
    maskEl.setAttribute('role', 'dialog');
    maskEl.setAttribute('aria-modal', 'true');
    maskEl.innerHTML =
      '<div class="tok-box">' +
        '<div class="tok-demo-banner">' +
          '<span>🧪</span>' +
          '<span><strong>收银台流程演示（尚未接入真实收款商户，不会扣款）</strong>：展示用户扫码后 1 秒自动开通的交互效果，接入即时扫码通道后立即变为真实收款码。</span>' +
        '</div>' +
        '<div class="tok-head">' +
          '<div><h3>扫码开通 · 付款后自动放行</h3><div class="tok-head-sub">无需加微信或人工发码，到账即刻进入知识库</div></div>' +
          '<button type="button" class="tok-close" id="tokCloseBtn" aria-label="关闭窗口">✕</button>' +
        '</div>' +
        '<div class="tok-order-card">' +
          '<div class="tok-order-name"><b id="tokPlanName"></b><div class="tok-order-chips" id="tokChips"></div></div>' +
          '<div class="tok-price" id="tokPlanPrice"></div>' +
        '</div>' +
        '<div id="tokWaitView">' +
          '<div class="tok-channels">' +
            '<button type="button" class="tok-ch is-on" data-ch="wechat">🟢 微信扫码（推荐）</button>' +
            '<button type="button" class="tok-ch" data-ch="alipay">🔵 支付宝扫码</button>' +
          '</div>' +
          '<div class="tok-qr-stage">' +
            '<div class="tok-qr-frame" id="tokQrFrame">' +
              '<svg viewBox="0 0 120 120" aria-label="动态订单收款码样式演示">' +
                '<rect width="120" height="120" fill="#ffffff"/>' +
                '<rect x="8" y="8" width="30" height="30" rx="4" fill="#0f172a"/><rect x="13" y="13" width="20" height="20" rx="2" fill="#ffffff"/><rect x="18" y="18" width="10" height="10" rx="1" fill="#0f172a"/>' +
                '<rect x="82" y="8" width="30" height="30" rx="4" fill="#0f172a"/><rect x="87" y="13" width="20" height="20" rx="2" fill="#ffffff"/><rect x="92" y="18" width="10" height="10" rx="1" fill="#0f172a"/>' +
                '<rect x="8" y="82" width="30" height="30" rx="4" fill="#0f172a"/><rect x="13" y="87" width="20" height="20" rx="2" fill="#ffffff"/><rect x="18" y="92" width="10" height="10" rx="1" fill="#0f172a"/>' +
                '<path d="M46 10h8v8h-8zm16 0h12v8H62zm-16 14h18v8H46zm22 6h8v14h-8zM10 46h8v12h-8zm14 4h14v8H24zm24-4h12v10H48zm18 8h10v8H66zm18-8h26v8H84zm10 14h16v8H94zM46 66h12v12H46zm20 4h14v8H66zm20 6h12v14H86zm-38 14h14v8H48zm20 0h12v12H68zm28 12h14v10H96zm-48 10h24v8H48z" fill="#0f172a"/>' +
              '</svg>' +
              '<span class="tok-qr-badge">样机演示码</span>' +
            '</div>' +
            '<div class="tok-qr-meta"><span>订单号：<strong id="tokOrderId"></strong></span><span>有效期：<strong id="tokCountdown">02:59</strong></span></div>' +
            '<div class="tok-live-row"><span class="tok-dot"></span><span id="tokLiveHint">请用微信扫一扫付款，付完自动跳转开通…</span></div>' +
          '</div>' +
          '<button type="button" class="tok-sim-btn" id="tokSimPayBtn">模拟手机扫码已付款 → 看用户秒开通效果</button>' +
          '<p class="tok-wait-tip">点击上方绿色按钮可体验客户付完后 1 秒自动开通的画面</p>' +
        '</div>' +
        '<div class="tok-ok-box" id="tokSuccessView" hidden>' +
          '<div class="tok-ok-icon">✓</div>' +
          '<h4>付款成功！权限已自动开通</h4>' +
          '<p class="tok-ok-sub">接通真实收款通道后，用户付完钱 1~2 秒自动切到此画面并免密解锁知识库，全程 0 人工干预。</p>' +
          '<div class="tok-code-card">' +
            '<div style="text-align:left"><div style="font-size:11.5px;color:var(--muted)">自动签发专属授权码（示例）：</div><div class="tok-code-val" id="tokIssuedCode"></div></div>' +
            '<button type="button" class="tok-copy-btn" id="tokCopyBtn">复制授权码</button>' +
          '</div>' +
          '<a class="tok-go-btn" href="../../wiki/">立即进入知识库开始看 →</a>' +
          '<button type="button" class="tok-reset-link" id="tokBackWaitBtn">← 返回继续看扫码等待界面</button>' +
        '</div>' +
      '</div>';
    doc.body.appendChild(maskEl);

    maskEl.querySelectorAll('.tok-ch').forEach(function (b) {
      b.addEventListener('click', function () { setChannel(b.getAttribute('data-ch')); });
    });

    doc.getElementById('tokSimPayBtn').addEventListener('click', function () {
      var sim = doc.getElementById('tokSimPayBtn');
      sim.disabled = true;
      sim.textContent = '检测到手机已付款，正在自动开通权限…';
      setTimeout(function () {
        doc.getElementById('tokWaitView').hidden = true;
        doc.getElementById('tokSuccessView').hidden = false;
        sim.disabled = false;
        sim.textContent = '模拟手机扫码已付款 → 看用户秒开通效果';
      }, 450);
    });

    doc.getElementById('tokBackWaitBtn').addEventListener('click', function () {
      doc.getElementById('tokSuccessView').hidden = true;
      doc.getElementById('tokWaitView').hidden = false;
    });

    doc.getElementById('tokCopyBtn').addEventListener('click', function () {
      var cBtn = doc.getElementById('tokCopyBtn');
      var code = doc.getElementById('tokIssuedCode').textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).catch(function () {});
      cBtn.textContent = '已复制 ✓';
      setTimeout(function () { cBtn.textContent = '复制授权码'; }, 1500);
    });

    doc.getElementById('tokCloseBtn').addEventListener('click', closeModal);
    maskEl.addEventListener('click', function (e) { if (e.target === maskEl) closeModal(); });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && maskEl.classList.contains('is-open')) closeModal();
    });
    return maskEl;
  }

  function setChannel(ch) {
    currentCh = ch === 'alipay' ? 'alipay' : 'wechat';
    maskEl.querySelectorAll('.tok-ch').forEach(function (el) {
      el.classList.toggle('is-on', el.getAttribute('data-ch') === currentCh);
    });
    var frame = doc.getElementById('tokQrFrame');
    frame.classList.toggle('alipay', currentCh === 'alipay');
    doc.getElementById('tokLiveHint').textContent = currentCh === 'alipay'
      ? '请用支付宝扫一扫付款，付完自动跳转开通…'
      : '请用微信扫一扫付款，付完自动跳转开通…';
  }

  function openModal(offerId) {
    var m = ensureModal();
    var item = offers[offerId] || Object.values(offers)[0] || { name: '实战知识库通行证', price: '¥99', chips: ['全库畅看', '1 秒自动开通'] };
    doc.getElementById('tokPlanName').textContent = item.name;
    doc.getElementById('tokPlanPrice').textContent = item.price;
    doc.getElementById('tokChips').innerHTML = (item.chips || []).map(function (c) { return '<span>' + c + '</span>'; }).join('');
    doc.getElementById('tokOrderId').textContent = 'GJ-DEMO-' + String(Math.floor(1000 + Math.random() * 8999));
    doc.getElementById('tokIssuedCode').textContent = 'GJ-DEMO-' + aud.toUpperCase() + '-2026';

    doc.getElementById('tokSuccessView').hidden = true;
    doc.getElementById('tokWaitView').hidden = false;
    setChannel('wechat');

    if (timerId) clearInterval(timerId);
    remainSec = 179;
    doc.getElementById('tokCountdown').textContent = formatSec(remainSec);
    timerId = setInterval(function () {
      if (remainSec > 0) remainSec -= 1;
      var el = doc.getElementById('tokCountdown');
      if (el) el.textContent = formatSec(remainSec);
    }, 1000);

    m.classList.add('is-open');
  }

  function closeModal() {
    if (maskEl) maskEl.classList.remove('is-open');
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  doc.querySelectorAll('[data-tok-buy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      openModal(btn.getAttribute('data-tok-buy'));
    });
  });
})(window, document);
