/* ============================================================
   情报中枢 · 头部导航条（2026-11-01 建，2026-11-02 加固）
   把页内那排栏目链接并进页头，页头贴顶常驻。
   其它脚本会动这排导航：reading-first.js 会把它挪到 .command-hero 前面，
   personal-reading.js 会往它后面插内容。所以这里不只是「加载时挪一次」，
   而是任何脚本、任何时候把它搬出页头，下一帧就收回来。
   ============================================================ */
(() => {
  "use strict";

  const findShell = () => document.querySelector("main.shell") || document.querySelector(".shell");
  const findHead = (shell) => (shell && shell.querySelector(".page-head")) || document.querySelector(".page-head");
  const findNav = () => document.querySelector(".section-nav");

  /* 1. 栏目并进页头（重复执行也无害；找不到就返回 false，等下一次机会） */
  function attachNav() {
    const nav = findNav();
    if (!nav) return false;
    const shell = findShell();
    const head = findHead(shell);
    if (!head) return false;
    if (nav.parentElement !== head) head.appendChild(nav);
    head.classList.add("has-nav");
    return true;
  }

  const first = attachNav();

  /* 2. 跟随 .shell 的内边距，让栏横跨整页边到边 */
  function syncPad() {
    const shell = findShell();
    if (!shell) return;
    const cs = getComputedStyle(shell);
    document.documentElement.style.setProperty("--ph-hp", cs.paddingLeft || "32px");
  }
  syncPad();

  /* 3. 记高度：锚点跳转要留出这段 */
  function syncHeight() {
    const head = findHead(findShell());
    if (!head) return;
    document.documentElement.style.setProperty("--ph-head-h", head.offsetHeight + "px");
  }
  syncHeight();

  /* 4. 滚动后加一点投影，和正文分开 */
  const onScroll = () => {
    const head = findHead(findShell());
    if (head) head.classList.toggle("is-stuck", window.scrollY > 4);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* 5. 视口变化重算 */
  let raf = 0;
  function relayout() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      syncPad();
      syncHeight();
    });
  }
  window.addEventListener("resize", relayout);
  if (window.ResizeObserver) {
    const head = findHead(findShell());
    if (head) new ResizeObserver(relayout).observe(head);
  }

  /* 6. 谁把导航搬出页头，就收回来（观察整页子树，不只是 .shell 的直接子节点）
        页头被换掉、数据加载后重排、别的脚本晚一步动手，都能兜住。 */
  let queued = 0;
  function check() {
    if (queued) return;
    queued = 1;
    const run = () => {
      if (!queued) return;
      queued = 0;
      if (attachNav()) { syncPad(); syncHeight(); }
    };
    requestAnimationFrame(run);
    setTimeout(run, 120);   // 窗口被最小化/遮挡时 rAF 会被节流，补一个定时兜底
  }
  if (window.MutationObserver) {
    new MutationObserver(check).observe(document.body, { childList: true, subtree: true });
  }

  /* 7. 几个确定的时间点再兜一次：DOM 就绪、图片/数据回来、连接后重排 */
  const retries = [0, 300, 800, 1500, 3000, 6000];
  for (const ms of retries) setTimeout(() => { attachNav(); relayout(); }, ms);
  for (const ev of ["DOMContentLoaded", "load"]) {
    window.addEventListener(ev, () => { attachNav(); relayout(); });
  }
  document.addEventListener("atlas:loaded", () => { attachNav(); relayout(); });
  document.addEventListener("atlas:view", () => { attachNav(); relayout(); });
  document.addEventListener("readystatechange", () => { attachNav(); relayout(); });

  /* 8. 运行时排错用：别处想确认导航在不在，可以查这个 */
  window.__atlasHeadNav = {
    attached: () => first && findNav()?.parentElement === findHead(findShell()),
    reattach: () => { const ok = attachNav(); relayout(); return ok; },
  };
})();
