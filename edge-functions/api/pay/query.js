/* EdgeOne Pages Edge Function: /api/pay/query?orderId=... */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const orderId = (url.searchParams.get("orderId") || "").trim();
  if (!orderId) return json({ ok: false, paid: false, error: "缺少 orderId" }, 400);
  if (!env || !env.WIKI_KV) {
    return json({ ok: true, paid: false, mode: "no-kv" });
  }
  const raw = await env.WIKI_KV.get("order:" + orderId);
  if (!raw) return json({ ok: false, paid: false, error: "订单不存在或已过期" }, 404);
  const order = JSON.parse(raw);
  return json({
    ok: true,
    paid: Boolean(order.paid),
    orderId: order.orderId,
    planId: order.planId,
    licenseCode: order.paid ? order.licenseCode : null,
    dek: order.paid ? (env.WIKI_DEK_B64 || null) : null
  });
}
