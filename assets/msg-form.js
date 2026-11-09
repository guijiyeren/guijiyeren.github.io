(function(){
  var form = document.getElementById("msgForm");
  if (!form) return;
  var statusEl = document.getElementById("msgStatus");
  var btn = document.getElementById("msgSubmit");
  var warnMask = document.getElementById("msgWarnMask");
  var warnText = document.getElementById("msgWarnText");
  function showWarn(text){
    if (warnText && text) warnText.textContent = text;
    if (warnMask) warnMask.classList.add("on");
  }
  var warnOk = document.getElementById("msgWarnOk");
  if (warnOk) warnOk.addEventListener("click", function(){ if (warnMask) warnMask.classList.remove("on"); });
  if (warnMask) warnMask.addEventListener("click", function(ev){ if (ev.target === warnMask) warnMask.classList.remove("on"); });
  function setStatus(text, isErr){
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.className = "mf-status" + (isErr ? " err" : "");
  }
  var openedAt = Date.now();
  // 防广告词库：按类别计分，命中 2 类或核心类直接拦
  var SCAM = [
    /(发票|開票|开票|代开|专票|普票|税票|增值税|抵扣|报销|fapiao|fa\s*piao|\bfp\b)/i,
    /(贷款|代款|网贷|放款|下款|秒批|额度|征信|黑户|白户|过桥|垫资|资金周转|借款)/i,
    /(微信|薇信|威信|微芯|V信|v信|weixin|wechat|\bwx\b|\bvx\b|加微|加V)/i,
    /(QQ|扣扣|企鹅|加群|进群|交流群|资源群|合作群|q群|裙)/i,
    /(刷单|刷dan|\bsd\b|好评返现|返现|日结|代付|代收|兼职刷)/i,
    /(博彩|菠菜|波菜|彩票|时时彩|六合彩|棋牌|外围|上分|下分|跑分|洗码|水房|四件套|接码)/i,
    /(USDT|泰达币|比特币|以太坊|数字货币|虚拟币|挖矿|矿机|合约|带单|喊单|分析师|导师|稳赚|包赔|倍投|回血|下注)/i,
    /(办证|办証|假证|刻章|盖章|文凭|学历|资格证|职称|包过|替考|代考|考试答案)/i,
    /(黑客|破解|外挂|私服|代练|POS机|套现|洗白|删帖|水军|控评|公关|刷钻)/i,
    /(代孕|捐卵|试管|包成功|楼凤|会所|保健|spa|按摩|足疗|包夜|小姐|约炮|同城交友|相亲|征婚)/i,
    /(网赚|躺赚|睡后收入|被动收入|管道收入|裂变|分销|微商|无货源|店群|项目群)/i,
    /(高仿|复刻|A货|原单|尾单|清仓|秒杀|免费领|内部券|返利|薅羊毛|线报)/i,
    /(源码|搭建|定制开发|小程序开发|APP开发|网站开发|SEO|排名|外链|蜘蛛池|快排|站群|寄生虫|劫持|暗链|黑帽|灰产|黑产)/i
  ];
  var CORE = [0, 1, 5, 7, 8, 9]; // 发票/贷款/博彩/办证/黑客/色情医疗类单独命中即拦
  var CONTACT = /(1[3-9]\d{9})|(qq\s*[:：]?\s*\d{5,})|([a-z0-9-]+\.(com|cn|net|org|top|vip|xyz|cc|io|me))|(https?:\/\/)|(www\.)/i;
  function normText(t){
    return String(t || "")
      .replace(/[\s\u200b-\u200f\ufeff]/g, "")
      .replace(/[\uFF01-\uFF5E]/g, function(c){ return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); })
      .replace(/[.。·•\-_/\\|,+，、;；:：'"“”‘’`~!！?？()（）【】\[\]{}]/g, "")
      .toLowerCase();
  }
  var COOLDOWN = 120000;
  form.addEventListener("submit", function(ev){
    ev.preventDefault();
    var fd = new FormData(form);
    if (fd.get("_honey")) return;
    var msg = (fd.get("message") || "").toString().trim();
    if (!msg) { setStatus("先写点内容再发。", true); return; }
    if (Date.now() - openedAt < 3000) { setStatus("别急，先写完再发。", true); return; }
    var plain = normText(msg);
    if (CONTACT.test(plain)) { showWarn("留言里不要放电话、微信、QQ 或网址。直接说你的需求就行，我会看到。"); return; }
    var hits = 0, coreHit = false;
    SCAM.forEach(function(re, idx){ if (re.test(plain)) { hits += 1; if (CORE.indexOf(idx) >= 0) coreHit = true; } });
    if (coreHit || hits >= 2) { showWarn("检测到疑似广告或推广内容，这条留言没有发送。\n如果是正常合作，请用「合作」两个字简单说明需求。"); return; }
    try {
      var last = Number(localStorage.getItem("guiji_msg_last") || 0);
      if (Date.now() - last < COOLDOWN) { setStatus("刚发过一条，稍后再发。", true); return; }
    } catch (e) {}
    btn.disabled = true;
    var old = btn.textContent;
    btn.textContent = "发送中…";
    var FS_URL = "https://formsubmit.co/ajax/" + String.fromCharCode(49,53,52,54,52,55,64,113,113,46,99,111,109);
    fetch(FS_URL, {
      method: "POST",
      headers: {"Content-Type": "application/json", "Accept": "application/json"},
      body: JSON.stringify({
        name: (fd.get("name") || "匿名").toString().trim() || "匿名",
        contact: (fd.get("contact") || "").toString().trim(),
        message: msg,
        _subject: "来自 guijiyeren.github.io 的留言",
        _template: "table",
        _captcha: "false"
      })
    }).then(function(r){ return r.json(); }).then(function(j){
      var ok = j && (j.success === true || j.success === "true");
      if (ok) {
        form.reset();
        setStatus("");
        try { localStorage.setItem("guiji_msg_last", String(Date.now())); } catch (e) {}
        showMsgModal();
      } else {
        var m = (j && (j.message || j.error)) || "发送失败，稍后再试";
        if (String(m).toLowerCase().indexOf("confirm") >= 0) m += "（首次使用需点一下确认邮件）";
        setStatus(m, true);
      }
    }).catch(function(){
      setStatus("网络失败，稍后再试；也可以直接点上面的邮箱图标。", true);
    }).finally(function(){
      btn.disabled = false;
      btn.textContent = old;
    });
  });
  var mask = document.getElementById("msgMask");
  var okBtn = document.getElementById("msgOk");
  var closeTimer = null;
  function showMsgModal(){
    if (!mask) return;
    mask.classList.add("on");
    clearTimeout(closeTimer);
    closeTimer = setTimeout(closeMsgModal, 8000);
  }
  function closeMsgModal(){
    if (!mask) return;
    mask.classList.remove("on");
    clearTimeout(closeTimer);
  }
  if (okBtn) okBtn.addEventListener("click", closeMsgModal);
  if (mask) mask.addEventListener("click", function(ev){ if (ev.target === mask) closeMsgModal(); });
  window.__showMsgModal = showMsgModal;
})();