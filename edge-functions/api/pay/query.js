/* EdgeOne Pages Edge Function: /api/pay/query?orderId=...&orderToken=...
 * 支持两种模式无缝自动放行：
 *   1) 已绑定 WIKI_KV 时优先读取回调写入的支付结果
 *   2) 未绑定 WIKI_KV（或回调尚未到达）时，验签 orderToken 后直接实时向蓝兔/虎皮椒官方查单，
 *      确认付款后确定性派生永久有效的 GJ2-00000000-... 授权码并下发 WIKI_DEK_B64 秒开知识库。
 */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

function safeEqual(a, b) {
  const sa = String(a || "");
  const sb = String(b || "");
  if (!sa || !sb || sa.length !== sb.length) return false;
  let diff = 0;
  for (let i = 0; i < sa.length; i++) diff |= sa.charCodeAt(i) ^ sb.charCodeAt(i);
  return diff === 0;
}

function md5Hex(str) {
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

function fromB64Url(b64u) {
  let s = b64u.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function verifyOrderToken(secret, token, expectedOrderId) {
  if (!secret || !token || typeof token !== "string") return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expectedSig = (await hmacHex(secret, "ORD|" + body)).slice(0, 32);
  if (!safeEqual(sig, expectedSig)) return null;
  let parsed;
  try {
    parsed = JSON.parse(fromB64Url(body));
  } catch (e) {
    return null;
  }
  if (!parsed || parsed.o !== expectedOrderId) return null;
  if (!parsed.t || Date.now() - Number(parsed.t) > 2 * 3600 * 1000) return null;
  return parsed;
}

async function deriveOrderLicense(adminToken, orderId) {
  if (!adminToken || !orderId) return "";
  const raw6 = (await hmacHex(adminToken, "ORD6|" + orderId)).slice(0, 6);
  const sig10 = (await hmacHex(adminToken, "GJ2|00000000|" + raw6)).slice(0, 10);
  return `GJ2-00000000-${raw6}-${sig10}`;
}

async function queryLantuPaid(env, orderId, channel) {
  const useAli = channel === "alipay";
  const mchId = String((useAli ? env.LANTU_ALI_MCH_ID : (env.LANTU_WX_MCH_ID || env.PAY_APP_ID)) || "").trim();
  const mchKey = String((useAli ? env.LANTU_ALI_KEY : (env.LANTU_WX_KEY || env.PAY_SECRET)) || "").trim();
  if (!mchId || !mchKey) return false;

  const endpoint = useAli
    ? "https://api.ltzf.cn/api/alipay/get_pay_order"
    : "https://api.ltzf.cn/api/wxpay/get_pay_order";
  const params = {
    mch_id: mchId,
    out_trade_no: orderId,
    timestamp: String(Math.floor(Date.now() / 1000))
  };
  const keys = Object.keys(params).sort();
  const rawSign = keys.map(k => `${k}=${params[k]}`).join("&") + `&key=${mchKey}`;
  params.sign = md5Hex(rawSign).toUpperCase();

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString()
  });
  const resJson = await resp.json().catch(() => null);
  return Boolean(resJson && Number(resJson.code) === 0 && resJson.data && Number(resJson.data.pay_status) === 1);
}

async function queryHupijiaoPaid(env, orderId) {
  const appid = String((env && env.PAY_APP_ID) || "").trim();
  const secret = String((env && env.PAY_SECRET) || "").trim();
  if (!appid || !secret) return false;

  let queryUrl = "https://api.xunhupay.com/payment/query.html";
  if (env.PAY_GATEWAY_URL && env.PAY_GATEWAY_URL.includes("do.html")) {
    queryUrl = env.PAY_GATEWAY_URL.replace("do.html", "query.html");
  }
  const params = {
    appid,
    out_trade_order: orderId,
    time: String(Math.floor(Date.now() / 1000)),
    nonce_str: Math.random().toString(36).slice(2, 12)
  };
  const keys = Object.keys(params).sort();
  const rawSign = keys.map(k => `${k}=${params[k]}`).join("&") + secret;
  params.hash = md5Hex(rawSign).toLowerCase();

  const resp = await fetch(queryUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  const resJson = await resp.json().catch(() => null);
  if (!resJson || Number(resJson.errcode) !== 0) return false;
  return Boolean((resJson.data && resJson.data.status === "OD") || resJson.status === "OD");
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const orderId = (url.searchParams.get("orderId") || "").trim();
  const orderToken = (url.searchParams.get("orderToken") || "").trim();
  if (!orderId) return json({ ok: false, paid: false, error: "缺少 orderId" }, 400);

  let order = null;
  if (env && env.WIKI_KV) {
    const raw = await env.WIKI_KV.get("order:" + orderId);
    if (raw) {
      try { order = JSON.parse(raw); } catch (e) { order = null; }
      if (order && order.paid) {
        return json({
          ok: true,
          paid: true,
          orderId: order.orderId,
          planId: order.planId,
          licenseCode: order.licenseCode,
          dek: env.WIKI_DEK_B64 || null
        });
      }
    }
  }

  const signSecret = (env && (env.WIKI_ADMIN_TOKEN || env.LANTU_WX_KEY || env.PAY_SECRET)) || "";
  const tokData = orderToken ? await verifyOrderToken(signSecret, orderToken, orderId) : null;
  if (orderToken && !tokData) {
    return json({ ok: false, paid: false, error: "订单校验令牌无效" }, 403);
  }

  const provider = String((tokData && tokData.pr) || (order && order.provider) || (env && env.PAY_PROVIDER) || "").toLowerCase();
  const channel = (tokData && tokData.c) || (order && order.channel) || "wechat";
  const planId = (tokData && tokData.p) || (order && order.planId) || "wiki-full";

  let paidNow = false;
  if (provider === "lantu" && (tokData || order)) {
    paidNow = await queryLantuPaid(env, orderId, channel).catch(() => false);
  } else if (provider === "hupijiao" && (tokData || order)) {
    paidNow = await queryHupijiaoPaid(env, orderId).catch(() => false);
  }

  if (paidNow) {
    const adminToken = (env && env.WIKI_ADMIN_TOKEN) || "";
    const licenseCode = (order && order.licenseCode) || await deriveOrderLicense(adminToken, orderId);

    if (env && env.WIKI_KV) {
      const updated = Object.assign(order || { orderId, planId, channel, provider }, {
        paid: true,
        status: "paid",
        licenseCode,
        paidAt: new Date().toISOString()
      });
      await env.WIKI_KV.put("order:" + orderId, JSON.stringify(updated), { expirationTtl: 86400 * 30 });
      if (licenseCode) {
        await env.WIKI_KV.put("lic:" + licenseCode, JSON.stringify({
          code: licenseCode,
          status: "active",
          plan: planId,
          label: "扫码自动开通",
          orderId,
          createdAt: new Date().toISOString()
        }));
      }
    }

    return json({
      ok: true,
      paid: true,
      orderId,
      planId,
      licenseCode,
      dek: (env && env.WIKI_DEK_B64) || null
    });
  }

  return json({ ok: true, paid: false, orderId });
}
