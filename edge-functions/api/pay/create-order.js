/* EdgeOne Pages Edge Function: /api/pay/create-order
 * 统一扫码自动开通下单接口：
 *   PAY_PROVIDER = lantu     -> 蓝兔支付个人直连微信/支付宝 Native 动态扫码
 *   PAY_PROVIDER = hupijiao  -> 虎皮椒个人微信/支付宝动态扫码
 *   其他/未配置真实密钥       -> 返回 mode: "preview"，前端自动走诚实演示态
 */
const PLAN_PRICES = {
  "wiki-full": { name: "硅基野人实战知识库全库永久通行证", price: 99 },
  "ecom-pack": { name: "电商单款上架准备包", price: 9.9 },
  "ecom-workbench": { name: "轻量电商工作台自助版", price: 99 },
  "solo-workbench": { name: "个人AI工作台自助模板包与全库通行证", price: 99 },
  "ecom-pilot": { name: "电商1对1单款上新实战试点", price: 999 },
  "media-pipeline": { name: "自媒体全自动内容产线实战包", price: 199 },
  "side-hustle": { name: "副业搞钱案例拆解与65期复盘精选", price: 49 },
  "test-1fen": { name: "硅基野人扫码自动开通1分钱联调单", price: 0.01 }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

function md5Bytes(bytes) {
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

function md5Hex(str) {
  return md5Bytes(new TextEncoder().encode(str));
}

function lantuSign(requiredParams, key) {
  const keys = Object.keys(requiredParams)
    .filter(k => requiredParams[k] !== "" && requiredParams[k] !== undefined && requiredParams[k] !== null)
    .sort();
  const strA = keys.map(k => `${k}=${requiredParams[k]}`).join("&");
  return md5Hex(`${strA}&key=${key}`).toUpperCase();
}

function hupijiaoSign(params, secret) {
  const keys = Object.keys(params)
    .filter(k => k !== "hash" && params[k] !== "" && params[k] !== undefined && params[k] !== null)
    .sort();
  const raw = keys.map(k => `${k}=${params[k]}`).join("&") + secret;
  return md5Hex(raw).toLowerCase();
}

async function hmacHex(secret, msg) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function toB64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function makeOrderToken(secret, payload) {
  if (!secret) return "";
  const body = toB64Url(JSON.stringify(payload));
  const sig = (await hmacHex(secret, "ORD|" + body)).slice(0, 32);
  return body + "." + sig;
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
  const reqChannel = body.channel === "alipay" ? "alipay" : "wechat";
  const contact = String(body.contact || "").slice(0, 120);
  const plan = PLAN_PRICES[planId];
  if (!plan) {
    return json({ ok: false, error: "无效的套餐编号" }, 400);
  }

  if (planId === "test-1fen") {
    const adminTok = (env && env.WIKI_ADMIN_TOKEN) || "";
    const testKey = String(body.testKey || "");
    if (!adminTok || !testKey || testKey !== adminTok.slice(0, 8)) {
      return json({ ok: false, error: "测试套餐需要联调口令" }, 403);
    }
  }

  const provider = String((env && env.PAY_PROVIDER) || "preview").trim().toLowerCase();
  const orderId = "GJ" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
  const signSecret = (env && (env.WIKI_ADMIN_TOKEN || env.LANTU_WX_KEY || env.PAY_SECRET)) || "";
  const notifyUrl = (env && env.PAY_NOTIFY_URL) || new URL("/api/pay/notify", request.url).toString();
  const feeStr = Number(plan.price).toFixed(2);

  async function saveOrderRecord(actualChannel, extra) {
    if (!env || !env.WIKI_KV) return;
    const orderObj = Object.assign({
      orderId,
      planId,
      planName: plan.name,
      amount: plan.price,
      channel: actualChannel,
      contact,
      provider,
      status: "pending",
      paid: false,
      createdAt: new Date().toISOString()
    }, extra || {});
    await env.WIKI_KV.put("order:" + orderId, JSON.stringify(orderObj), { expirationTtl: 86400 * 30 });
    const recentRaw = await env.WIKI_KV.get("orders:recent");
    let recent = [];
    try { recent = recentRaw ? JSON.parse(recentRaw) : []; } catch (e) { recent = []; }
    recent = [orderId].concat(recent.filter(x => x !== orderId)).slice(0, 100);
    await env.WIKI_KV.put("orders:recent", JSON.stringify(recent));
  }

  // 1. 蓝兔支付（首选个人免营业执照/免备案官方直连通道）
  if (provider === "lantu" && env) {
    const wxMchId = String(env.LANTU_WX_MCH_ID || env.PAY_APP_ID || "").trim();
    const wxKey = String(env.LANTU_WX_KEY || env.PAY_SECRET || "").trim();
    const aliMchId = String(env.LANTU_ALI_MCH_ID || "").trim();
    const aliKey = String(env.LANTU_ALI_KEY || "").trim();

    const availableChannels = [];
    if (wxMchId && wxKey) availableChannels.push("wechat");
    if (aliMchId && aliKey) availableChannels.push("alipay");

    if (availableChannels.length > 0) {
      const actualChannel = availableChannels.includes(reqChannel) ? reqChannel : availableChannels[0];
      const useAli = actualChannel === "alipay";
      const mchId = useAli ? aliMchId : wxMchId;
      const mchKey = useAli ? aliKey : wxKey;
      const endpoint = useAli
        ? "https://api.ltzf.cn/api/alipay/native"
        : "https://api.ltzf.cn/api/wxpay/native";

      const reqSigned = {
        mch_id: mchId,
        out_trade_no: orderId,
        total_fee: feeStr,
        body: plan.name,
        timestamp: String(Math.floor(Date.now() / 1000)),
        notify_url: notifyUrl
      };
      const formObj = Object.assign({}, reqSigned, {
        attach: planId,
        time_expire: "5m",
        sign: lantuSign(reqSigned, mchKey)
      });

      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formObj).toString()
      });
      const resJson = await resp.json().catch(() => null);
      if (resJson && Number(resJson.code) === 0 && resJson.data) {
        const d = resJson.data;
        const qrImg = typeof d === "string" ? d : (d.QRcode_url || d.qr_code || "");
        const codeUrl = typeof d === "string" ? d : (d.code_url || "");
        const orderToken = await makeOrderToken(signSecret, {
          o: orderId, p: planId, c: actualChannel, pr: "lantu", t: Date.now()
        });
        await saveOrderRecord(actualChannel, { mchId });
        return json({
          ok: true,
          mode: "live_qr",
          provider: "lantu",
          orderId,
          orderToken,
          channel: actualChannel,
          availableChannels,
          amount: plan.price,
          planName: plan.name,
          qrImg,
          codeUrl
        });
      }
      return json({
        ok: false,
        error: (resJson && resJson.msg) || "蓝兔支付下单失败"
      }, 502);
    }
  }

  // 2. 虎皮椒（备选个人免备案聚合通道）
  if (provider === "hupijiao" && env && env.PAY_APP_ID && env.PAY_SECRET) {
    const gatewayUrl = env.PAY_GATEWAY_URL || "https://api.xunhupay.com/payment/do.html";
    const params = {
      version: "1.1",
      appid: String(env.PAY_APP_ID).trim(),
      trade_order_id: orderId,
      total_fee: String(plan.price),
      title: plan.name,
      time: String(Math.floor(Date.now() / 1000)),
      notify_url: notifyUrl,
      return_url: new URL("/wiki/", request.url).toString(),
      nonce_str: Math.random().toString(36).slice(2, 12),
      type: reqChannel === "alipay" ? "ALIPAY" : "WAP",
      attach: planId
    };
    params.hash = hupijiaoSign(params, String(env.PAY_SECRET).trim());
    const resp = await fetch(gatewayUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    const resJson = await resp.json().catch(() => null);
    if (resJson && Number(resJson.errcode) === 0) {
      const orderToken = await makeOrderToken(signSecret, {
        o: orderId, p: planId, c: reqChannel, pr: "hupijiao", t: Date.now()
      });
      await saveOrderRecord(reqChannel);
      return json({
        ok: true,
        mode: "live_qr",
        provider: "hupijiao",
        orderId,
        orderToken,
        channel: reqChannel,
        availableChannels: ["wechat", "alipay"],
        amount: plan.price,
        planName: plan.name,
        qrImg: resJson.url_qrcode || "",
        payUrl: resJson.url || ""
      });
    }
    return json({
      ok: false,
      error: (resJson && resJson.errmsg) || "虎皮椒支付下单失败"
    }, 502);
  }

  // 3. 尚未填写商户密钥：明确返回 preview 演示态
  return json({
    ok: true,
    mode: "preview",
    orderId,
    plan: { id: planId, name: plan.name, price: plan.price }
  });
}
