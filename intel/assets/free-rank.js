(() => {
  'use strict';
  const q = s => document.querySelector(s);
  const esc = s => window.esc ? window.esc(String(s ?? '')) : String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const when = v => { if (!v) return ''; const d = new Date(v); return isNaN(d) ? '' : d.toLocaleString('zh-CN', { hour12: false }); };
  let timer = null, tries = 0;

  function table(head, rows) {
    return '<table class="free-rank-table"><thead><tr>' + head.map(h => '<th>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' +
      rows.map(cells => '<tr>' + cells.map((c, i) => '<td' + (i === 0 ? ' class="rank"' : '') + '>' + c + '</td>').join('') + '</tr>').join('') +
      '</tbody></table>';
  }

  function render(d) {
    const goods = d.goods || [], authors = d.authors || [], wholesale = d.wholesale || [];
    q('#free-goods').innerHTML = goods.length ? table(['#', '商品', '销量'], goods.map(g => [
      esc(g.rank), '<strong>' + esc(g.title) + '</strong><small>佣金 ' + esc(g.commission || '—') + '</small>', esc(g.sales)
    ])) : '<p class="muted">暂无数据，点右上角采集。</p>';
    q('#free-authors').innerHTML = authors.length ? table(['#', '达人', '销售额'], authors.map(a => [
      esc(a.rank), '<strong>' + esc(a.name) + '</strong><small>粉丝 ' + esc(a.fans || '—') + '</small>', esc(a.sales)
    ])) : '<p class="muted">暂无数据，点右上角采集。</p>';
    q('#free-wholesale').innerHTML = wholesale.length ? table(['#', '货源', '月销量'], wholesale.map((w, i) => [
      String(i + 1), '<strong>' + esc(w.title) + '</strong><small>环比 ' + esc(w.growth || '—') + '</small>', esc(w.sales)
    ])) : '<p class="muted">暂无数据，点右上角采集。</p>';
    const counts = goods.length + authors.length + wholesale.length;
    q('#free-rank-status').textContent = d.running ? '采集中…' : (d.collected_at ? '最近采集 ' + when(d.collected_at) + ' · ' + counts + ' 条' : '尚未采集');
    if (d.errors && Object.keys(d.errors).length) q('#free-rank-status').textContent += ' · 部分来源失败';
  }

  async function load() {
    try {
      const d = await api('/free-rank');
      render(d);
      if (d.running && tries++ < 40) { clearTimeout(timer); timer = setTimeout(load, 2000); }
      else tries = 0;
    } catch (e) { q('#free-rank-status').textContent = '读取失败：' + e.message; }
  }

  q('#free-rank-sync').onclick = async () => {
    const b = q('#free-rank-sync');
    b.disabled = true; b.textContent = '采集中…'; tries = 0;
    try {
      await api('/free-rank/sync', 'POST');
      q('#free-rank-status').textContent = '采集中（约 30 秒）…';
      clearTimeout(timer); timer = setTimeout(load, 1500);
    } catch (e) { q('#free-rank-status').textContent = '启动失败：' + e.message; }
    finally { b.disabled = false; b.textContent = '采集免费榜单'; }
  };

  document.addEventListener('atlas:loaded', load);
  document.addEventListener('atlas:view', e => { if (e.detail && e.detail.id === 'free-rank') load(); });
  load();
})();
