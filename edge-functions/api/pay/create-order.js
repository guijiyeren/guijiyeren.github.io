/* EdgeOne Pages Edge Function: /api/pay/create-order
 * 支持环境变量 PAY_PROVIDER:
 *   sandbox       - 沙箱联调模式（默认，完整跑通下单->付款->自动发授权码->解锁闭环）
 *   external_card - 免备案外链收款/发卡平台（配置 EXTERNAL_PAY_URL）
 *   hupijiao      - 虎皮椒个人微信/支付宝扫码即时回调（配置 PAY_APP_ID / PAY_SECRET / PAY_NOTIFY_URL）
 */
const PLAN_PRICES = {
  "wiki-full": { name: "实战知识库 · 全库通行证", price: 99 },
  "ecom-pack": { name: "电商老板 · 单款上架准备包", price: 9.9 },
  "ecom-workbench": { name: "电商老板 · 轻量工作台自助版", price: 99 },
  "ecom-pilot": { name: "电商老板 · 1对1单款上新试点", price: 999 },
  "media-pipeline": { name: "自媒体人 · 内容流水线实战包", price: 199 },
  "side-hustle": { name: "搞钱案例拆解与65期复盘精选", price: 49 }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

async function md5Hex(str) {
  // 简易纯 JS MD5 用于虎皮椒签名（若接入微信/支付宝直连可在后续按需扩展）
  const bytes = new TextEncoder().encode(str);
  const k = new Uint32Array([
    0xd76aa478,0xe8c7b756,0x242070db,0xc1bdceee,0xf57c0faf,0x4787c62a,0xa8304613,0xfd469501,
    0x698098d8,0x8b44f7af,0xffff5bb1,0x895cd7be,0x6b901122,0xfd987193,0xa679438e,0x49b40821,
    0xf61e2562,0xc040b340,0x265e5a51,0xe9b6c7aa,0xd62f105d,0x02441453,0xd8a1e681,0xe7d3fbc8,
    0x21e1cde6,0xc33707d6,0xf4d50d87,0x455a14ed,0xa9e3e905,0xfcefa3f8,0x676f02d9,0x8d2a4c8a,
    0xfffa3942,0x8771f681,0x6d9d6122,0xfde5380c,0xa4beea44,0x4bdecfa9,0xf6bb4b60,0xbebfbc70,
    0x289b7ec6,0xeaa127fa,0xd4ef3085,0x04881d05,0xd9d4d039,0xe6db99e5,0x1fa27cf8,0xc4ac5665,
    0xf4292244,0x432aff97,0xab9423a7,0xfc93a039,0x655b59c3,0x8f0ccc92,0xffeff47d,0x85845dd1,
    0x6fa87e4f,0xfe2ce6e0,0xa3014314,0x4e0811a1,0xf7537e82,0xbd3af235,0x2ad7d2bb,0xeb86d391
  ]);
  const s = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
  const bitLen = bytes.length * 8;
  const padLen = ((56 - ((bytes.length + 1) % 64)) + 64) % 64;
  const buf = new Uint8Array(bytes.length + 1 + padLen + 8);
  buf.set(bytes);
  buf[bytes.length] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(buf.length - 8, bitLen >>> 0, true);
  dv.setUint32(buf.length - 4, Math.floor(bitLen / 0x100000000), true);
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  for (let off = 0; off < buf.length; off += 64) {
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F, g;
      if (i < 16) { F = (B & C) | ((~B) & D); g = i; }
      else if (i < 32) { F = (D & B) | ((~D) & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | (~D)); g = (7 * i) % 16; }
      F = (F + A + k[i] + dv.getUint32(off + g * 4, true)) >>> 0;
      A = D; D = C; C = B;
      B = (B + ((F << s[i]) | (F >>> (32 - s[i])))) >>> 0;
    }
    a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
  }
  const res = new Uint8Array(16);
  const rdv = new DataView(res.buffer);
  rdv.setUint32(0, a0, true); rdv.setUint32(4, b0, true); rdv.setUint32(8, c0, true); rdv.setUint32(12, d0, true);
  return Array.from(res).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ ok: false, error: "无效请求体" }, 400);
  }

  const planId = String(body.planId || "");
  const channel = body.channel === "alipay" ? "alipay" : "wechat";
  const contact = String(body.contact || "").slice(0, 120);
  const plan = PLAN_PRICES[planId];
  if (!plan) {
    return json({ ok: false, error: "无效的套餐编号" }, 400);
  }

  const provider = (env && env.PAY_PROVIDER) || "sandbox";
  const orderId = "GJ" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
  const orderObj = {
    orderId,
    planId,
    planName: plan.name,
    amount: plan.price,
    channel,
    contact,
    provider,
    paid: false,
    createdAt: new Date().toISOString()
  };

  if (env && env.WIKI_KV) {
    await env.WIKI_KV.put("order:" + orderId, JSON.stringify(orderObj), { expirationTtl: 7200 });
  }

  if (provider === "external_card") {
    return json({
      ok: true,
      mode: "external_card",
      orderId,
      payUrl: (env && env.EXTERNAL_PAY_URL) || "",
      tip: "请前往发卡/收款页完成支付，拿到授权码后在知识库「授权码」页签直接输入解锁。"
    });
  }

  if (provider === "hupijiao" && env && env.PAY_APP_ID && env.PAY_SECRET) {
    const params = {
      version: "1.1",
      appid: env.PAY_APP_ID,
      trade_order_id: orderId,
      total_fee: String(plan.price),
      title: plan.name,
      time: String(Math.floor(Date.now() / 1000)),
      notify_url: env.PAY_NOTIFY_URL || (new URL("/api/pay/notify", request.url)).toString(),
      return_url: (new URL("/wiki/", request.url)).toString(),
      nonce_str: Math.random().toString(36).slice(2, 12),
      type: channel === "alipay" ? "ALIPAY" : "WAP"
    };
    const keys = Object.keys(params).sort();
    const rawSign = keys.map(k => `${k}=${params[k]}`).join("&") + env.PAY_SECRET;
    params.hash = await md5Hex(rawSign);
    const resp = await fetch(env.PAY_GATEWAY_URL || "https://api.xunhupay.com/payment/do.html", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    const resJson = await resp.json();
    if (resJson && resJson.errcode === 0) {
      return json({
        ok: true,
        mode: "hupijiao",
        orderId,
        payUrl: resJson.url || "",
        qrImg: resJson.url_qrcode || ""
      });
    }
    return json({ ok: false, error: (resJson && resJson.errmsg) || "支付网关下单失败" }, 502);
  }

  return json({
    ok: true,
    mode: "sandbox",
    orderId,
    plan: { id: planId, name: plan.name, price: plan.price }
  });
}
