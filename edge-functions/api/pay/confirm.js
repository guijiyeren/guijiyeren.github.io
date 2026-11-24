/* EdgeOne Pages Edge Function: /api/pay/confirm
 * 买家扫码/下单后提交联系微信/邮箱与确认付款声明，写入 WIKI_KV 待老板后台一键核销。
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
    return json({ ok: false, error: "无效请求体" }, 400);
  }

  const orderId = String(body.orderId || "").trim();
  const contact = String(body.contact || "").trim().slice(0, 120);
  const remark = String(body.remark || "").trim().slice(0, 200);
  if (!orderId) {
    return json({ ok: false, error: "缺少 orderId" }, 400);
  }

  if (!env || !env.WIKI_KV) {
    return json({ ok: true, mode: "no-kv", orderId, status: "buyer_claimed_paid" });
  }

  const raw = await env.WIKI_KV.get("order:" + orderId);
  if (!raw) {
    return json({ ok: false, error: "订单不存在或已过期" }, 404);
  }

  const order = JSON.parse(raw);
  order.status = order.paid ? "paid" : "buyer_claimed_paid";
  if (contact) order.contact = contact;
  if (remark) order.remark = remark;
  order.claimedAt = new Date().toISOString();

  await env.WIKI_KV.put("order:" + orderId, JSON.stringify(order), { expirationTtl: 86400 * 30 });
  return json({ ok: true, orderId, status: order.status });
}
