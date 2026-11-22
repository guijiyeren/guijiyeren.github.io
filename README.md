# guijiyeren.github.io

硅基野人的个人站点：

- 首页（个人品牌）：https://guijiyeren.com/
- 高性价比人生指南 · 行动版：https://guijiyeren.com/rensheng/
- 标签星云（3D 知识图谱）：https://guijiyeren.com/rensheng/graph.html
- 资源中心（脱敏展示版）：https://guijiyeren.com/resource/
- 情报中枢（公开榜单展示版）：https://guijiyeren.com/intel/
- 会动网页（3D 交互与开源酷站库）：https://guijiyeren.com/huidong/
- 视觉图鉴（整片风格、镜头组件与实时动效展厅）：https://guijiyeren.com/shijue/
- 工作台流程：https://guijiyeren.com/workflow/
- 更多项目：https://guijiyeren.com/projects/
- 常用工具：https://guijiyeren.com/tools/

## 目录结构

```
index.html            首页（V1.0）
assets/               全站公用脚本、样式与封面素材
rensheng/             高性价比人生指南 · 行动版与 3D 星图
resource/             资源中心（脱敏展示版）
intel/                情报中枢（公开榜单展示版）
huidong/              会动网页（1,050 个交互案例库）
shijue/               视觉图鉴（风格 / 组件 / 实时动效三板块展厅）
workflow/             工作台流程（三电脑协同拓扑与项目流程）
projects/             更多项目与工作台模块索引
tools/                常用工具清单
stats/                站点访问统计
daily/                每日早报跳转页
site-updates.json     全站模块更新日期与条数清单
og.png                首页分享图
```

## 更新方式

本地重新生成后推送本仓库，GitHub Pages 会自动更新（约 1 分钟）。

## 首页的更新日期

情报中枢使用 NewsNow 公开快照时间，资源中心使用脱敏导出时间，每日拆卡使用飞书已经发布的日期，视觉图鉴使用 `shijue/data.js` 构建日期与条数。执行 `python scripts/update_site_freshness.py` 可核对网站日期，已登录飞书 CLI 时可加 `--refresh-daily`。确认数据来源后加 `--write`，更新工作目录里的 `site-updates.json`。

## 联系

联系：到首页「给我留言」或点击页面底部联系方式。
