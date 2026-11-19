/* 全站子页面公用底部挂载器：关于我 / 联系方式 / 给我留言 / 页脚 */
(function () {
  var host = document.querySelector('[data-site-footer]');
  if (!host) return;
  var base = host.getAttribute('data-base') || '../';

  host.innerHTML =
    '<div class="sf-band">' +
      '<section id="about-brief">' +
        '<div class="sf-wrap">' +
          '<div class="sf-head"><div class="eyebrow2">About Me</div><h2>关于我</h2></div>' +
          '<div class="sf-about-card">' +
            '<img src="' + base + 'assets/logo.png" alt="硅基野人" loading="lazy" decoding="async">' +
            '<div class="sf-about-body">' +
              '<h3>硅基野人 · 10 年电商人，正在实战 AI 无人公司</h3>' +
              '<p>一个碳基老板，带着一群硅基员工。把选品、上架、文案、剪辑、发布拆成流程交给 AI，同时把路上攒下的好工具、好案例与全套工作台拆开公开分享。</p>' +
            '</div>' +
            '<a class="sf-about-go" href="' + base + '#about">查看完整关于我 →</a>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section id="follow">' +
        '<div class="sf-wrap">' +
          '<div class="sf-head"><div class="eyebrow2">Contact</div><h2>联系方式</h2></div>' +
          '<div class="sf-contacts">' +
            '<a class="sf-contact-card" href="' + base + '"><img src="' + base + 'assets/icon-github.png" alt="个人主页" loading="lazy" decoding="async"><span>个人主页</span></a>' +
            '<a class="sf-contact-card" href="https://guijiyeren.feishu.cn/wiki/LJ5UwgCwziAVUpkqYKTcTsbXnwg" target="_blank" rel="noopener"><img src="' + base + 'assets/icon-feishu.png" alt="飞书知识库" loading="lazy" decoding="async"><span>飞书知识库</span></a>' +
            '<a class="sf-contact-card" href="#" data-mail="49,53,52,54,52,55,64,113,113,46,99,111,109"><img src="' + base + 'assets/icon-qqmail.png" alt="QQ邮箱" loading="lazy" decoding="async"><span>QQ邮箱</span></a>' +
            '<a class="sf-contact-card" href="#message"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="color:#2563eb"><path d="M21 12a8.5 8.5 0 0 1-8.5 8.5H5L3 22v-6.5A8.5 8.5 0 0 1 12.5 3.5h0A8.5 8.5 0 0 1 21 12z"/></svg><span>给我留言</span></a>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section id="message">' +
        '<div class="sf-wrap">' +
          '<div class="sf-head"><div class="eyebrow2">Message</div><h2>给我留言</h2><p>有问题、想合作，直接写。提交后会发到我的邮箱，不公开展示。</p></div>' +
          '<form class="msg-form" id="msgForm" novalidate>' +
            '<div class="mf-row">' +
              '<label>怎么称呼你<input name="name" maxlength="40" placeholder="称呼"></label>' +
              '<label>邮箱（方便回复）<input name="contact" maxlength="80" placeholder="可以不填"></label>' +
            '</div>' +
            '<label>留言内容<textarea name="message" rows="4" maxlength="1000" placeholder="想说的话、想聊的合作…" required></textarea></label>' +
            '<input type="text" name="_honey" class="mf-hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
            '<div class="mf-foot">' +
              '<span class="mf-note">提交后直接进邮箱，不会公开显示。</span>' +
              '<button class="btn-primary" type="submit" id="msgSubmit">发送留言 →</button>' +
            '</div>' +
            '<p class="mf-status" id="msgStatus" role="status"></p>' +
          '</form>' +
        '</div>' +
      '</section>' +
      '<footer id="page-end"><div class="in"><div>© 2026 <b>硅基野人</b> · 本站 V1.0 · 内容由 AI 参与生产，我负责拍板</div><div>知识库：<a href="https://guijiyeren.feishu.cn/wiki/LJ5UwgCwziAVUpkqYKTcTsbXnwg" target="_blank" rel="noopener">飞书</a> · <a href="' + base + '">返回首页</a></div></div></footer>' +
    '</div>' +
    '<div class="mail-mask" id="mailMask"><div class="mail-box"><img src="' + base + 'assets/email-card.png" alt="邮箱" loading="lazy" decoding="async"><div class="mail-actions"><button type="button" class="mail-copy" id="mailCopy">一键复制邮箱</button><button type="button" class="mail-close" id="mailClose">关闭</button></div><p class="mail-tip">邮箱用图片显示，避免被爬虫采集；需要发信时点「复制」。</p></div></div>' +
    '<div class="msg-mask" id="msgMask"><div class="msg-box"><div class="msg-check">✓</div><h3>感谢你的留言</h3><p>我们会第一时间查看。<br>祝您生活愉快，工作顺利！</p><button type="button" class="msg-ok" id="msgOk">关闭</button></div></div>' +
    '<div class="msg-mask" id="msgWarnMask"><div class="msg-box warn"><div class="msg-check warn">!</div><h3>留言未发送</h3><p id="msgWarnText">内容里含有疑似广告信息，换个说法再发。</p><button type="button" class="msg-ok warn" id="msgWarnOk">我知道了</button></div></div>';

  // Bind mail popup
  var mask = document.getElementById('mailMask');
  if (mask) {
    document.querySelectorAll('[data-mail]').forEach(function (el) {
      el.addEventListener('click', function (ev) { ev.preventDefault(); mask.classList.add('on'); });
    });
    document.getElementById('mailClose').addEventListener('click', function () { mask.classList.remove('on'); });
    mask.addEventListener('click', function (ev) { if (ev.target === mask) mask.classList.remove('on'); });
    document.getElementById('mailCopy').addEventListener('click', function () {
      var addr = String.fromCharCode(49,53,52,54,52,55,64,113,113,46,99,111,109);
      var b = this;
      function done() { b.textContent = '已复制'; setTimeout(function () { b.textContent = '一键复制邮箱'; }, 1600); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(addr).then(done).catch(done);
      else {
        var ta = document.createElement('textarea'); ta.value = addr; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(ta); done();
      }
    });
  }

  // Load msg-form.js if not already loaded
  if (!document.querySelector('script[src*="msg-form.js"]')) {
    var s = document.createElement('script');
    s.src = base + 'assets/msg-form.js';
    s.defer = true;
    document.body.appendChild(s);
  }
})();
