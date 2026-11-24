/* EdgeOne Pages Edge Function: /api/lead
 * 接收单人群广告落地页「领免费见面礼」提交的称呼、邮箱与 UTM 投放参数，写入 KV 留存。
 */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ ok: false, error: "无效请求" }, 400);
  }

  const email = String(body.email || "").trim().slice(0, 120);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: "邮箱格式不正确" }, 400);
  }

  const audience = String(body.audience || "unknown").trim().slice(0, 40);
  const name = String(body.name || "").trim().slice(0, 60) || "朋友";
  const extra = String(body.extra || "").trim().slice(0, 300);
  const pageUrl = String(body.pageUrl || "").trim().slice(0, 400);
  const utm = body.utm && typeof body.utm === "object" ? {
    utm_source: String(body.utm.utm_source || "").slice(0, 80),
    utm_medium: String(body.utm.utm_medium || "").slice(0, 80),
    utm_campaign: String(body.utm.utm_campaign || "").slice(0, 120),
    utm_content: String(body.utm.utm_content || "").slice(0, 120)
  } : {};

  let saved = false;
  if (env && env.WIKI_KV) {
    const id = "lead:" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
    const record = {
      id,
      audience,
      name,
      email,
      extra,
      utm,
      pageUrl,
      createdAt: new Date().toISOString()
    };
    await env.WIKI_KV.put(id, JSON.stringify(record), { expirationTtl: 86400 * 180 });
    const recentRaw = await env.WIKI_KV.get("leads:recent");
    let recent = [];
    try { recent = recentRaw ? JSON.parse(recentRaw) : []; } catch (e) { recent = []; }
    recent = [record].concat(recent).slice(0, 200);
    await env.WIKI_KV.put("leads:recent", JSON.stringify(recent), { expirationTtl: 86400 * 180 });
    saved = true;
  }

  return json({ ok: true, saved });
}
