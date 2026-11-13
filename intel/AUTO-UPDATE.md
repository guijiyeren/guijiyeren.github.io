# 情报中枢 · 云端自动更新

## 已经能自动更新的

GitHub Actions 工作流：`.github/workflows/update-intel.yml`

- 每天 **06:00 Asia/Shanghai** 自动运行（也可手动 Run workflow）
- 读取 **NewsNow 公开 API**，刷新 `intel/data/api/newsnow.json`
- 覆盖榜单：抖音、GitHub 趋势、Hacker News、微博、知乎、B 站、今日头条、百度、虎扑、少数派、Product Hunt 等 27 个公开榜
- 只读取公开缓存数据，不需要本机、不需要登录态；失败时保留上一份榜单
- 更新后自动 commit，GitHub Pages 自动重新发布

## 目前还不能完全云端的

- **小红书热榜**：NewsNow 没有公开的小红书 board，公开第三方接口不稳定/带风控，暂保留快照，不伪造更新。
- **视频情报（深海雷达 MCP）**：上游是 MCP + 网页，当前快照来自本地/带登录态环境；GitHub Actions 没有这层登录态，暂未接入云端，页面保留已恢复的视频板块。
- 抖音/小红书**视频爆款案例**（不是热榜）仍是本地采集快照；热榜已每天更新。

要完全覆盖小红书和视频 MCP，需要把采集器部署到一台有登录态/浏览器的服务器，或接入一个可用的云端 MCP 服务。
