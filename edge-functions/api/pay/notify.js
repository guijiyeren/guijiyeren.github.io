/* EdgeOne Pages Edge Function: /api/pay/notify
 * 处理支付异步回调通知（蓝兔支付 / 虎皮椒），验签确认支付后在 KV 中落库并签发永久 GJ2 授权码。
 */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
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

async function deriveOrderLicense(adminToken, orderId) {
  if (!adminToken || !orderId) return "";
  const raw6 = (await hmacHex(adminToken, "ORD6|" + orderId)).slice(0, 6);
  const sig10 = (await hmacHex(adminToken, "GJ2|00000000|" + raw6)).slice(0, 10);
  return `GJ2-00000000-${raw6}-${sig10}`;
}

async function persistPaidOrder(env, orderId, planId, channel, provider) {
  const licenseCode = await deriveOrderLicense((env && env.WIKI_ADMIN_TOKEN) || "", orderId);
  if (!env || !env.WIKI_KV || !orderId) return licenseCode;

  const raw = await env.WIKI_KV.get("order:" + orderId);
  let order = null;
  if (raw) {
    try { order = JSON.parse(raw); } catch (e) { order = null; }
  }
  const finalPlan = (order && order.planId) || planId || "wiki-full";
  const finalCode = (order && order.licenseCode) || licenseCode;
  if (!order || !order.paid) {
    const updated = Object.assign(order || { orderId, planId: finalPlan, channel, provider }, {
      paid: true,
      status: "paid",
      licenseCode: finalCode,
      paidAt: new Date().toISOString()
    });
    await env.WIKI_KV.put("order:" + orderId, JSON.stringify(updated), { expirationTtl: 86400 * 30 });
    if (finalCode) {
      await env.WIKI_KV.put("lic:" + finalCode, JSON.stringify({
        code: finalCode,
        status: "active",
        plan: finalPlan,
        label: "扫码自动开通",
        orderId,
        createdAt: new Date().toISOString()
      }));
    }
  }
  return finalCode;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const provider = String((env && env.PAY_PROVIDER) || "").trim().toLowerCase();
  const ct = (request.headers.get("content-type") || "").toLowerCase();

  let payload = {};
  if (ct.includes("application/json")) {
    payload = await request.json().catch(() => ({}));
  } else if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    const fd = await request.formData().catch(() => null);
    if (fd) for (const [k, v] of fd.entries()) payload[k] = String(v);
  } else {
    const txt = await request.text().catch(() => "");
    if (txt.includes("=")) {
      for (const [k, v] of new URLSearchParams(txt).entries()) payload[k] = v;
    }
  }

  // 1. 蓝兔支付异步通知验签（7 个必填字段按 ASCII 升序 + &key=商户密钥 大写 MD5）
  if (provider === "lantu" && env) {
    const mchIdGot = String(payload.mch_id || "").trim();
    const wxMchId = String(env.LANTU_WX_MCH_ID || env.PAY_APP_ID || "").trim();
    const aliMchId = String(env.LANTU_ALI_MCH_ID || "").trim();
    const isAli = Boolean(aliMchId && mchIdGot === aliMchId);
    const mchKey = String((isAli ? env.LANTU_ALI_KEY : (env.LANTU_WX_KEY || env.PAY_SECRET)) || "").trim();
    if (!mchKey) return new Response("missing merchant key", { status: 500 });

    const reqFields = ["code", "timestamp", "mch_id", "order_no", "out_trade_no", "pay_no", "total_fee"];
    const signedObj = {};
    for (const f of reqFields) {
      if (payload[f] !== undefined && payload[f] !== "") signedObj[f] = payload[f];
    }
    const keys = Object.keys(signedObj).sort();
    const rawSign = keys.map(k => `${k}=${signedObj[k]}`).join("&") + `&key=${mchKey}`;
    const expectedSign = md5Hex(rawSign).toUpperCase();
    const gotSign = String(payload.sign || "").toUpperCase();
    if (!gotSign || gotSign !== expectedSign) {
      return new Response("invalid signature", { status: 403 });
    }
    if (String(payload.code) !== "0") {
      return new Response("FAIL", { status: 400 });
    }
    const orderId = String(payload.out_trade_no || "").trim();
    await persistPaidOrder(env, orderId, String(payload.attach || "wiki-full"), isAli ? "alipay" : "wechat", "lantu");
    return new Response("SUCCESS", { status: 200 });
  }

  // 2. 虎皮椒真实回调验签（校验 hash 与 status === "OD"）
  if (provider === "hupijiao" && env && env.PAY_SECRET) {
    const keys = Object.keys(payload).filter(k => k !== "hash" && payload[k] !== "" && payload[k] !== undefined).sort();
    const rawSign = keys.map(k => `${k}=${payload[k]}`).join("&") + String(env.PAY_SECRET).trim();
    const expectedHash = md5Hex(rawSign).toLowerCase();
    const gotHash = String(payload.hash || "").toLowerCase();
    if (!gotHash || gotHash !== expectedHash) {
      return new Response("invalid signature", { status: 403 });
    }
    if (payload.status !== "OD") {
      return new Response("fail", { status: 400 });
    }
    const orderId = String(payload.trade_order_id || "").trim();
    await persistPaidOrder(env, orderId, String(payload.attach || "wiki-full"), "wechat", "hupijiao");
    return new Response("success", { status: 200 });
  }

  return json({ ok: false, error: "未启用在线回调模式" }, 400);
}
