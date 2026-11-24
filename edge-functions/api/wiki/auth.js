/* EdgeOne Pages Edge Function: /api/wiki/auth
 * 环境变量未配置时返回 { fallback: "envelope" }，前端无缝降级到本地 WebCrypto 解密 auth.json。
 * 环境变量（在 EdgeOne 控制台设置，切勿写进仓库）：
 *   WIKI_DEK_B64   - 与本地 .secrets/wiki_master.key 一致的 Base64 主密钥
 *   WIKI_PASSCODE  - 可选，覆盖口令；设为 DISABLED 则停用口令仅允许授权码
 *   WIKI_KV        - 可选，绑定 EdgeOne KV 命名空间，用于验证在线售卖的动态授权码
 */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const dekB64 = env && env.WIKI_DEK_B64;
  if (!dekB64) {
    return json({ fallback: "envelope" });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ ok: false, error: "请求格式无效" }, 400);
  }

  const type = String(body.type || "");
  const cred = String(body.credential || "").trim();
  if (!cred) {
    return json({ ok: false, error: "请输入口令或授权码" }, 400);
  }

  if (type === "passcode") {
    const serverPass = env.WIKI_PASSCODE;
    if (!serverPass) return json({ fallback: "envelope" });
    if (serverPass === "DISABLED") {
      return json({ ok: false, error: "公开口令已停用，请使用正式授权码登录" }, 403);
    }
    if (cred === serverPass) {
      return json({ ok: true, dek: dekB64, plan: "full", label: "口令访问" });
    }
    return json({ ok: false, error: "访问密码不正确" }, 401);
  }

  if (type === "license") {
    const norm = cred.toUpperCase();
    if (!env.WIKI_KV) {
      return json({ fallback: "envelope" });
    }
    const raw = await env.WIKI_KV.get("lic:" + norm);
    if (!raw) {
      return json({ fallback: "envelope" });
    }
    try {
      const lic = JSON.parse(raw);
      if (lic.status !== "active") {
        return json({ ok: false, error: "该授权码已停用" }, 403);
      }
      if (lic.expiresAt && Date.parse(lic.expiresAt) < Date.now()) {
        return json({ ok: false, error: "该授权码已过期，请续费" }, 403);
      }
      return json({ ok: true, dek: dekB64, plan: lic.plan || "wiki-full", label: lic.label || "正式授权" });
    } catch (e) {
      return json({ ok: false, error: "授权记录损坏，请联系客服" }, 500);
    }
  }

  return json({ ok: false, error: "不支持的认证类型" }, 400);
}
