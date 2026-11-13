/* 无限画布动态封面（与个人工作台总台同款，2026-11-13） */
(function(){
function wuxianCardCover(host) {
    if (host.querySelector("canvas.ph-wuxian-canvas")) return;
    host.innerHTML = "";
    host.style.position = "relative";
    host.style.overflow = "hidden";
    host.style.background = "#04070d";
    const canvas = document.createElement("canvas");
    canvas.className = "ph-wuxian-canvas";
    canvas.setAttribute("aria-label", "无限画布动态封面");
    host.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    let W = 300, H = 230;
    const fit = () => {
      W = Math.max(1, host.clientWidth || 300);
      H = Math.max(1, host.clientHeight || 230);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = "100%";
      canvas.style.height = "100%";
    };
    fit();
    const reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const rr = (a, b) => a + Math.random() * (b - a);
    const C = [
      { x: .17, y: .34, w: .30, h: .23, rot: -.10, ph: .4, c1: "#7dd3fc", c2: "#2563eb", kind: 0 },
      { x: .77, y: .24, w: .28, h: .22, rot: .09, ph: 2.1, c1: "#fda4af", c2: "#be123c", kind: 1 },
      { x: .84, y: .70, w: .26, h: .20, rot: .12, ph: 4.3, c1: "#c4b5fd", c2: "#6d28d9", kind: 0 },
      { x: .58, y: .80, w: .32, h: .24, rot: -.04, ph: 1.2, c1: "#86efac", c2: "#15803d", kind: 2 },
      { x: .24, y: .69, w: .24, h: .18, rot: -.08, ph: 3.4, c1: "#fcd34d", c2: "#b45309", kind: 0 },
    ];
    const center = { x: .50, y: .52 };
    const pos = (card, t) => ({
      x: (card.x + Math.sin(t * .22 + card.ph) * .012) * W,
      y: (card.y + Math.cos(t * .18 + card.ph) * .012) * H,
      rot: card.rot + Math.sin(t * .16 + card.ph) * .030,
      sc: 1 + Math.sin(t * .24 + card.ph) * .018,
    });
    const round = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
    };
    const drawCard = (card, t) => {
      const p = pos(card, t), w = card.w * W * p.sc, h = card.h * H * p.sc;
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.shadowColor = card.c1 + "55"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 0;
      round(-w / 2, -h / 2, w, h, Math.min(w, h) * .10); ctx.fillStyle = "#0a1320"; ctx.fill();
      ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.save(); round(-w / 2, -h / 2, w, h, Math.min(w, h) * .10); ctx.clip();
      const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
      g.addColorStop(0, card.c1); g.addColorStop(1, card.c2);
      ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
      const sheen = ctx.createLinearGradient(-w / 2, -h / 2, -w / 2, h / 2);
      sheen.addColorStop(0, "rgba(255,255,255,.22)"); sheen.addColorStop(.35, "rgba(255,255,255,.02)"); sheen.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sheen; ctx.fillRect(-w / 2, -h / 2, w, h);
      // 画面内容：山脊 / 人像 / 星空，纯图形不写字
      ctx.globalAlpha = .32;
      if (card.kind === 1) {
        ctx.fillStyle = "rgba(255,255,255,.75)";
        ctx.beginPath(); ctx.arc(0, -h * .08, Math.min(w, h) * .19, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(10,20,35,.55)";
        ctx.beginPath(); ctx.arc(0, h * .22, Math.min(w, h) * .30, 0, Math.PI * 2); ctx.fill();
      } else if (card.kind === 2) {
        ctx.strokeStyle = "rgba(255,255,255,.65)"; ctx.lineWidth = Math.max(1, w * .012);
        ctx.beginPath(); ctx.moveTo(-w * .34, h * .18); ctx.quadraticCurveTo(-w * .05, -h * .22, w * .35, h * .10); ctx.stroke();
        ctx.globalAlpha = .18; ctx.fillStyle = "#fff";
        for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc((i / 9 - .5) * w * .85, (i % 3 - 1) * h * .22, Math.max(1, w * .012), 0, Math.PI * 2); ctx.fill(); }
      } else {
        ctx.fillStyle = "rgba(8,16,28,.42)";
        ctx.beginPath(); ctx.moveTo(-w / 2, h * .18); ctx.quadraticCurveTo(-w * .10, -h * .12, w / 2, h * .16);
        ctx.lineTo(w / 2, h / 2); ctx.lineTo(-w / 2, h / 2); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,.55)";
        ctx.beginPath(); ctx.arc(w * .18, -h * .18, Math.min(w, h) * .075, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      round(-w / 2, -h / 2, w, h, Math.min(w, h) * .10);
      ctx.strokeStyle = "rgba(255,255,255,.30)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    };
    const infinity = (cx, cy, A, t) => {
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const u = i / 120 * Math.PI * 2, den = 1 + Math.sin(u) ** 2;
        const x = cx + A * Math.cos(u) / den, y = cy + A * Math.sin(u) * Math.cos(u) / den;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
    };
    const t0 = performance.now();
    const draw = (now) => {
      // 卡片可能先在 DocumentFragment 里创建、后挂到页面；未挂载时不能直接 return，
      // 否则这一帧之后就永远不再画，canvas 会一直是透明的（2026-11-13 排查发现）。
      if (!host.isConnected) { requestAnimationFrame(draw); return; }
      try {
      const t = (now - t0) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const bg = ctx.createRadialGradient(W * .5, H * .48, 0, W * .5, H * .48, W * .75);
      bg.addColorStop(0, "#10243a"); bg.addColorStop(.5, "#071322"); bg.addColorStop(1, "#03070d");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      // 极淡点阵，不抢图
      ctx.fillStyle = "rgba(255,255,255,.045)";
      for (let x = 8; x < W; x += 18) for (let y = 8; y < H; y += 18) { ctx.beginPath(); ctx.arc(x, y, .8, 0, Math.PI * 2); ctx.fill(); }
      const cx = center.x * W, cy = center.y * H;
      // 连线
      const ps = C.map(c => pos(c, t));
      ps.forEach((p, i) => {
        const mx = (p.x + cx) / 2 + (i % 2 ? 54 : -54), my = (p.y + cy) / 2 + (i % 3 ? -34 : 34);
        const lg = ctx.createLinearGradient(p.x, p.y, cx, cy);
        lg.addColorStop(0, "rgba(125,211,252,.10)"); lg.addColorStop(.55, "rgba(196,181,253,.30)"); lg.addColorStop(1, "rgba(103,232,249,.08)");
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.quadraticCurveTo(mx, my, cx, cy);
        ctx.strokeStyle = lg; ctx.lineWidth = 1.25; ctx.shadowColor = "rgba(103,232,249,.28)"; ctx.shadowBlur = 5; ctx.stroke(); ctx.shadowBlur = 0;
        const q = .5 + .5 * Math.sin(t * .35 + i * 1.7), qx = (1 - q) * (1 - q) * p.x + 2 * (1 - q) * q * mx + q * q * cx, qy = (1 - q) * (1 - q) * p.y + 2 * (1 - q) * q * my + q * q * cy;
        const rg = ctx.createRadialGradient(qx, qy, 0, qx, qy, 5);
        rg.addColorStop(0, "rgba(255,255,255,.9)"); rg.addColorStop(1, "rgba(125,211,252,0)");
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(qx, qy, 5, 0, Math.PI * 2); ctx.fill();
      });
      // 卡片
      ps.forEach((p, i) => drawCard(C[i], t));
      // 中央无限符号
      const A = Math.min(W, H) * .115 * (1 + Math.sin(t * .45) * .015);
      ctx.save();
      infinity(cx, cy, A, t);
      ctx.strokeStyle = "rgba(103,232,249,.30)"; ctx.lineWidth = 6; ctx.shadowColor = "rgba(34,211,238,.55)"; ctx.shadowBlur = 18; ctx.stroke();
      infinity(cx, cy, A, t);
      ctx.strokeStyle = "rgba(240,253,255,.95)"; ctx.lineWidth = 2; ctx.shadowBlur = 8; ctx.stroke();
      ctx.restore();
      } catch (e) {
        try { window.__wuxianCardError = String((e && e.stack) || e); } catch (_) {}
        requestAnimationFrame(draw);
        return;
      }
      if (!reduce) requestAnimationFrame(draw);
    };
    const ro = new ResizeObserver(() => { fit(); if (reduce) draw(performance.now()); });
    try { ro.observe(host); } catch (e) {}
    requestAnimationFrame(draw);
  }
function initWuxianCovers(){
  document.querySelectorAll('[data-wuxian-cover]').forEach(function(host){ try{ wuxianCardCover(host); }catch(e){ console.error('wuxian cover', e); } });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initWuxianCovers); else initWuxianCovers();
})();
