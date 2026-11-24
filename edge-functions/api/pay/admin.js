/* EdgeOne Pages Edge Function: /api/pay/admin
 * 老板专属订单核销与授权码管理接口（校验环境变量 WIKI_ADMIN_TOKEN）。
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
  for (let i = 0; i < sa.length; i++) {
    diff |= sa.charCodeAt(i) ^ sb.charCodeAt(i);
  }
  return diff === 0;
}

function genLicenseCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const g = [];
  for (let i = 0; i < 3; i++) {
    let s = "";
    for (let j = 0; j < 4; j++) s += chars[bytes[i * 4 + j] % chars.length];
    g.push(s);
  }
  return "GJ-" + g.join("-");
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

async function issueSignedCode(secret, days) {
  let exp8 = "00000000";
  let expiresAt = null;
  if (days > 0) {
    const d = new Date(Date.now() + days * 86400 * 1000);
    expiresAt = d.toISOString();
    exp8 = d.toISOString().slice(0, 10).replace(/-/g, "");
  }
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let rand6 = "";
  for (let i = 0; i < 6; i++) rand6 += chars[bytes[i] % chars.length];
  const sig10 = (await hmacHex(secret, "GJ2|" + exp8 + "|" + rand6)).slice(0, 10);
  return { code: "GJ2-" + exp8 + "-" + rand6 + "-" + sig10, expiresAt };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const serverToken = env && env.WIKI_ADMIN_TOKEN;
  if (!serverToken) {
    return json({ ok: false, error: "云端尚未配置 WIKI_ADMIN_TOKEN" }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }

  const provided = request.headers.get("x-admin-token") || body.adminToken || "";
  if (!safeEqual(provided, serverToken)) {
    return json({ ok: false, error: "管理密码不正确" }, 401);
  }

  const hasKv = Boolean(env && env.WIKI_KV);
  const hasDek = Boolean(env && env.WIKI_DEK_B64);
  const payProvider = (env && env.PAY_PROVIDER) || "qr_direct";
  const action = String(body.action || "list");

  if (action === "list") {
    let orders = [];
    let licenses = [];
    if (hasKv) {
      const oRaw = await env.WIKI_KV.get("orders:recent");
      let oIds = [];
      try { oIds = oRaw ? JSON.parse(oRaw) : []; } catch (e) { oIds = []; }
      const oList = await Promise.all(oIds.slice(0, 50).map(id => env.WIKI_KV.get("order:" + id)));
      orders = oList.filter(Boolean).map(s => { try { return JSON.parse(s); } catch (e) { return null; } }).filter(Boolean);

      const lRaw = await env.WIKI_KV.get("licenses:recent");
      let lCodes = [];
      try { lCodes = lRaw ? JSON.parse(lRaw) : []; } catch (e) { lCodes = []; }
      const lList = await Promise.all(lCodes.slice(0, 50).map(c => env.WIKI_KV.get("lic:" + c)));
      licenses = lList.filter(Boolean).map((s, idx) => {
        try {
          const obj = JSON.parse(s);
          if (!obj.code) obj.code = lCodes[idx];
          return obj;
        } catch (e) { return null; }
      }).filter(Boolean);
    }
    return json({ ok: true, orders, licenses, hasKv, hasDek, payProvider });
  }

  if (action === "issue") {
    const plan = String(body.plan || "wiki-full").slice(0, 40);
    const label = String(body.label || "正式会员").slice(0, 80);
    const days = Number(body.days || 0);
    const issued = await issueSignedCode(serverToken, days);
    const licenseCode = issued.code;
    const nowIso = new Date().toISOString();
    const record = {
      code: licenseCode,
      status: "active",
      plan,
      label,
      expiresAt: issued.expiresAt,
      createdAt: nowIso
    };
    if (hasKv) {
      await env.WIKI_KV.put("lic:" + licenseCode, JSON.stringify(record));
      const lRaw = await env.WIKI_KV.get("licenses:recent");
      let lCodes = [];
      try { lCodes = lRaw ? JSON.parse(lRaw) : []; } catch (e) { lCodes = []; }
      lCodes = [licenseCode].concat(lCodes.filter(c => c !== licenseCode)).slice(0, 100);
      await env.WIKI_KV.put("licenses:recent", JSON.stringify(lCodes));
    }
    return json({ ok: true, licenseCode, record, persistedInKv: hasKv });
  }

  if (!hasKv) {
    return json({ ok: false, error: "尚未绑定 WIKI_KV 存储空间" }, 503);
  }

  if (action === "approve_order") {
    const orderId = String(body.orderId || "").trim();
    if (!orderId) return json({ ok: false, error: "缺少 orderId" }, 400);
    const raw = await env.WIKI_KV.get("order:" + orderId);
    if (!raw) return json({ ok: false, error: "订单不存在或已过期" }, 404);
    const order = JSON.parse(raw);
    if (order.paid && order.licenseCode) {
      return json({ ok: true, orderId, licenseCode: order.licenseCode, order });
    }
    const licenseCode = genLicenseCode();
    const nowIso = new Date().toISOString();
    order.paid = true;
    order.status = "paid";
    order.licenseCode = licenseCode;
    order.paidAt = nowIso;
    await env.WIKI_KV.put("order:" + orderId, JSON.stringify(order), { expirationTtl: 86400 * 30 });

    const licRec = {
      code: licenseCode,
      status: "active",
      plan: order.planId || "wiki-full",
      label: order.planName || "官网订单授权",
      contact: order.contact || "",
      orderId,
      createdAt: nowIso
    };
    await env.WIKI_KV.put("lic:" + licenseCode, JSON.stringify(licRec));

    const lRaw = await env.WIKI_KV.get("licenses:recent");
    let lCodes = [];
    try { lCodes = lRaw ? JSON.parse(lRaw) : []; } catch (e) { lCodes = []; }
    lCodes = [licenseCode].concat(lCodes.filter(c => c !== licenseCode)).slice(0, 100);
    await env.WIKI_KV.put("licenses:recent", JSON.stringify(lCodes));

    return json({ ok: true, orderId, licenseCode, order });
  }

  if (action === "revoke") {
    const code = String(body.code || "").trim().toUpperCase();
    if (!code) return json({ ok: false, error: "缺少授权码" }, 400);
    const raw = await env.WIKI_KV.get("lic:" + code);
    if (!raw) return json({ ok: false, error: "未找到该云端授权码" }, 404);
    const rec = JSON.parse(raw);
    rec.status = "revoked";
    rec.revokedAt = new Date().toISOString();
    await env.WIKI_KV.put("lic:" + code, JSON.stringify(rec));
    return json({ ok: true, code, status: "revoked" });
  }

  return json({ ok: false, error: "不支持的操作类型" }, 400);
}
