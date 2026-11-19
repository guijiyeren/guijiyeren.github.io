(() => {
  const taskSteps = ["收到任务", "明确内容与归属", "主控分派 / 远程认领", "按项目开关确认", "回填成品与回执"];

  const machineMeta = [
    {
      id: "main",
      badge: "总控大脑",
      count: "9 大项目 + 7 项兵器",
      name: "🖥️ 主控电脑（个人工作总台）",
      role: "任务交办、多 AI 协作、内容创作、知识库沉淀与个人站发布。"
    },
    {
      id: "drawing",
      badge: "选品 + AI 视觉",
      count: "5 条选品 + 10 条生图视频",
      name: "🎨 作图本（远程生产节点）",
      role: "电商多源定时选品采集 + AI 批量模特图、主副视频、买家秀与洗图。"
    },
    {
      id: "listing",
      badge: "多平台发布 + 数据",
      count: "7 大分发与采集引擎",
      name: "🚀 上架机（分发与回收节点）",
      role: "定时更新上架多表格、批量分销上架、四平台图文视频发布与参谋数据采集。"
    }
  ];

  // 三台电脑各自的完整流程图定义（与本地个人工作台真实结构 1:1 对齐）
  const panels = [
    {
      id: "main",
      title: "🖥️ 主控电脑 · 个人工作总台完整流程",
      tag: "主控总台",
      desc: "统管所有项目、多 AI 派活验收、日常兵器与对外网站 / 飞书发布",
      rootLabel: "⚡ 个人工作总台 · 任务总控与多 AI 指挥",
      rootSteps: taskSteps,
      colsClass: "",
      columns: [
        {
          name: "内容与视觉制作",
          projects: [
            { name: "硅基野人", branches: [
              ["选题与对标", ["查看采集与爆款数据", "筛选题目与对标", "确定制作方向"]],
              ["视频 / 贴图 / 文章", ["接收素材", "按类型制作成片与图文", "核对定稿"]],
              ["四平台发布", ["准备抖音 / 小红书 / B站 / 快手素材", "按开关确认发布", "回填链接"]],
              ["飞书知识库", ["整理可公开实战过程", "归入对应栏目", "全库巡检零死链"]]
            ] },
            { name: "无限画布", branches: [
              ["节点画布", ["放入参考素材", "连接图生图 / 图生视频节点"]],
              ["选模型与生成", ["选择模型与规格", "询价或模拟", "批量生成并验收"]]
            ] },
            { name: "剪辑工厂", branches: [
              ["导入素材 / 工程", ["导入录音或打开已有工程", "确认本次剪辑目标"]],
              ["试片与导出", ["生成试片", "修改字幕与节奏", "审片确认并导出"]]
            ] },
            { name: "会动网页", branches: [
              ["全球 3D 采集", ["增量同步 3D 交互酷站", "实景渲染截图并肉眼核验"]],
              ["图墙与多端发布", ["更新 1,037+ 图墙库", "一键同步个人主页与飞书 09 页"]]
            ] }
          ]
        },
        {
          name: "经营、情报与资料库",
          projects: [
            { name: "电商运营（总控端）", branches: [
              ["远程派单作图本", ["下发选品与 AI 生图任务", "查看作图本实时进度"]],
              ["共享盘成品验收", ["核对模特图 / 主副视频目录", "合格素材转交上架机"]],
              ["复盘与推广优化", ["回收上架机店铺与竞品数据", "复盘点击率与转化"]]
            ] },
            { name: "情报中枢", branches: [
              ["40+ 来源采集", ["定时采集公开情报源", "标题 / 链接 / 相似度三层去重"]],
              ["打分与榜单发布", ["规则 + AI 双通道打分", "重点线索与待验证分离", "更新个人站公开榜"]]
            ] },
            { name: "资源中心", branches: [
              ["来源登记入库", ["登记新来源", "更新 10,000+ 本地资源索引"]],
              ["检索与脱敏发布", ["按 8 分区 93 分类筛选", "同步脱敏展示版到个人站"]]
            ] },
            { name: "人生指南 & 干货库", branches: [
              ["人生指南", ["767 条循证行动建议维护", "同步个人站行动版与 3D 星图"]],
              ["项目干货", ["1 万+ 圈内干货按主题归档", "随时按关键词检索参考"]]
            ] }
          ]
        },
        {
          name: "总台机制与日常兵器",
          projects: [
            { name: "总台管控机制", branches: [
              ["任务流转闭环", taskSteps],
              ["项目流程开关", ["控制试片 / 审片 / 成品确认点", "待确认项进入「等你处理」"]],
              ["版本管理", ["核对差异与纳入范围", "提交打版本标签", "确认后再回退"]]
            ] },
            { name: "兵器 · 7 项自动化", branches: [
              ["多 AI 开会", ["确定议题与参与者", "各自提交独立意见", "主持人汇总结论"]],
              ["每日毒打", ["回看当天结果与卡点", "提炼次日改进项"]],
              ["每日巡检", ["核对个人站与飞书知识库", "记录异常与未检查项"]],
              ["每日复盘", ["核对交接记录与日志", "整理复盘候选沉淀飞书"]],
              ["每日卡片", ["筛选学习卡并查重脱敏", "核验后发布飞书"]],
              ["每日串门", ["发现相关优质内容", "准备互动草稿并登记"]],
              ["每日采集", ["同步公开情报、爆款与作品数据", "写早晚执行回执"]]
            ] }
          ]
        }
      ]
    },
    {
      id: "drawing",
      title: "🎨 作图本 · 选品与 AI 视觉生产完整流程",
      tag: "远程生产节点",
      desc: "接收主控派单，专跑多源电商选品与 10 条 AI 批量生图生视频流水线，成品回传共享仓库",
      rootLabel: "🎨 作图本 · 远程接单 → 选品采集 & AI 视觉工厂",
      rootSteps: ["接收主控电脑选品 / 作图派单", "按周期运行选品采集与 AI 生图生视频流水线", "成品自动落盘共享目录", "向主控总台回传完成回执"],
      colsClass: "cols-2",
      columns: [
        {
          name: "① 电商多源选品流（5 条定时线）",
          projects: [
            {
              name: "多平台周期选品采集",
              singleCol: true,
              branches: [
                ["1. 阿里供货 · 1 天一看", ["每日定时扫描阿里供货新款", "筛出高潜款写入选品库", "同步共享目录"]],
                ["2. 同行阿里 · 2 天一看", ["每 2 天巡查同行阿里爆款动向", "提取热销款与素材"]],
                ["3. 同行淘宝 · 3 天一看", ["每 3 天抓取同行淘宝上新与销量信号", "标记对标款式"]],
                ["4. 平台热销 · 7 天一看", ["每周扫描全平台热销榜单", "捕捉趋势品与季节爆款"]],
                ["5. 阿里供货 · 插件版", ["每日插件模式补充采集", "补齐详情与规格数据入库"]]
              ]
            }
          ]
        },
        {
          name: "② AI 批量生图生视频流（10 条视觉线）",
          projects: [
            {
              name: "待处理图 · 模特与主副视频",
              singleCol: true,
              branches: [
                ["模特图（RH · 4 张/轮）", ["读取待处理商品图", "RunningHub 批量出 4 张模特上身图（约 20 分钟/轮）", "落盘待验"]],
                ["主视频（W3 · 1 视频/轮）", ["基于主图生成商品展示主视频（约 10 分钟/轮）", "自动归档"]],
                ["副视频（H3 · 1 视频/轮）", ["生成多角度补充副视频（约 10 分钟/轮）", "自动归档"]],
                ["淘宝主视频（RH · 5 视频/轮）", ["批量连续产出 5 条淘宝主视频（约 50 分钟/轮）", "打包入仓库"]]
              ]
            },
            {
              name: "无限画布 · 买家秀与爆款洗图",
              singleCol: true,
              branches: [
                ["生成多张买家秀（5 张/轮）", ["商品图进无限画布节点", "批量生成 5 张自然实拍风格买家秀"]],
                ["买家秀多姿势（5 张 × 3 轮）", ["同一商品自动延展多姿势买家秀组合", "提升详情页丰富度"]],
                ["买家秀视频（1 视频/轮）", ["将买家秀静图转为真实感动态展示视频"]],
                ["买家秀换背景（5 张/轮）", ["保留主体商品与人物，批量替换生活化实拍场景"]],
                ["长图生成多视频 & 爆款洗图", ["长图自动拆段出多条视频 / 5 张/轮爆款差异化洗图", "成品回传主控验收"]]
              ]
            }
          ]
        }
      ]
    },
    {
      id: "listing",
      title: "🚀 上架机 · 批量上架、多平台分发与数据采集完整流程",
      tag: "分发与回收节点",
      desc: "承接共享仓库合格成品，定时更新多表格、批量分销上架、四平台图文视频发布与参谋数据回收",
      rootLabel: "🚀 上架机 · 承接仓库成品 → 上架分发 & 数据回传",
      rootSteps: ["从共享仓库读取已验收的商品素材与视频", "定时更新上架表格并批量分销上架", "四平台自动批量发布视频与图文", "定时采集店铺与竞品数据回传主控复盘"],
      colsClass: "",
      columns: [
        {
          name: "① 四平台批量内容发布",
          projects: [
            {
              name: "视频批量发布",
              branches: [
                ["淘宝视频批量发", ["读取视频与文案表", "自动上传淘宝商品/逛逛视频"]],
                ["小红书视频批量发", ["自动配话题与封面", "批量发布小红书视频笔记"]],
                ["快手视频批量发", ["自动挂载商品与标签", "批量发布快手短视频"]],
                ["抖音视频批量发", ["自动填充标题话题", "批量发布抖音短视频"]]
              ]
            },
            {
              name: "图文批量发布",
              branches: [
                ["淘宝图文批量发", ["批量读取精选图文包", "自动发布淘宝图文内容"]],
                ["小红书图文批量发", ["自动排多图与正文", "批量发布小红书图文笔记"]],
                ["快手图文批量发", ["自动配图与文案", "批量发布快手图文"]],
                ["抖音图文批量发", ["自动合成多图轮播", "批量发布抖音图文"]]
              ]
            }
          ]
        },
        {
          name: "② 商品上架与表格定时更新",
          projects: [
            {
              name: "上架表格定时更新",
              singleCol: true,
              branches: [
                ["中午 12:00 · 更新上架 5 表", ["扫描已上架商品目录与 Eagle 链接", "5 分钟自动更新 5 个上架台账表"]],
                ["晚上 21:00 · 更新视频图文 5 表", ["汇总当日新出视频与图文素材", "8 分钟自动更新剩余 5 个发布表"]]
              ]
            },
            {
              name: "批量上架商品（分销）",
              singleCol: true,
              branches: [
                ["1. 分销各平台基础上架", ["读取上架包数据", "自动批量铺货分销至各店铺平台"]],
                ["2. 详情长图自动替换", ["用新洗出的差异化长图自动替换原详情页"]]
              ]
            }
          ]
        },
        {
          name: "③ 独立发布与推广数据回收",
          projects: [
            {
              name: "新款 & 老款定向发布",
              singleCol: true,
              branches: [
                ["新款发布独立（4 平台）", ["新款商品独立队列", "同步跑淘宝 / 小红书 / 快手 / 抖音视频与图文"]],
                ["老款主推同表（淘宝）", ["锁定老款主推链接", "同表持续补发淘宝图文与主推视频"]]
              ]
            },
            {
              name: "生意参谋 · 推广数据采集",
              singleCol: true,
              branches: [
                ["店铺数据采集（5 分钟）", ["定时采集本店铺流量、转化与推广表现", "回传主控复盘"]],
                ["行业竞品采集（35 分钟）", ["定时抓取全行业竞品流量与爆款走势", "反哺下一轮选品"]]
              ]
            }
          ]
        }
      ]
    }
  ];

  function make(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  function mount(host) {
    host.replaceChildren();
    let activeFilter = "all"; // 默认：全部三台电脑依次往下排！
    let selectedStepBtn = null;

    const detail = make("div", "public-flow-selection");
    const heading = make("h3", "public-flow-selection-title");
    const list = make("ol", "public-flow-steps");
    detail.append(heading, list);
    detail.setAttribute("aria-live", "polite");

    function showSteps(button, title, steps) {
      if (selectedStepBtn) selectedStepBtn.setAttribute("aria-pressed", "false");
      selectedStepBtn = button;
      if (selectedStepBtn) selectedStepBtn.setAttribute("aria-pressed", "true");
      heading.textContent = title;
      list.replaceChildren(...steps.map(s => make("li", "", s)));
      detail.classList.remove("is-updated");
      requestAnimationFrame(() => detail.classList.add("is-updated"));
    }

    // 1. 顶部三台电脑协同切换区
    const cluster = make("div", "pf-cluster");
    const cHead = make("div", "pf-cluster-head");
    const cTitle = make("div", "pf-cluster-title");
    cTitle.append(make("span", "pf-live-dot"), document.createTextNode("三台电脑全景协同（默认全部依次展开，点任意一台可单独聚焦）"));

    const pillsWrap = make("div", "pf-view-pills");
    const pillEls = {};
    [
      ["all", "全部三台依次展开"],
      ["main", "🖥️ 只看主控电脑"],
      ["drawing", "🎨 只看作图本"],
      ["listing", "🚀 只看上架机"]
    ].forEach(([id, label]) => {
      const p = make("button", "pf-pill", label);
      p.type = "button";
      p.addEventListener("click", () => setFilter(id));
      pillsWrap.append(p);
      pillEls[id] = p;
    });
    cHead.append(cTitle, pillsWrap);
    cluster.append(cHead);

    const mRow = make("div", "pf-machines");
    const machineBtns = {};
    machineMeta.forEach((m, idx) => {
      const btn = make("button", "pf-machine");
      btn.type = "button";
      btn.dataset.m = m.id;
      const top = make("div", "pf-m-top");
      top.append(make("span", "pf-m-badge", m.badge), make("span", "pf-m-count", m.count));
      btn.append(top, make("div", "pf-m-name", m.name), make("div", "pf-m-role", m.role));
      btn.addEventListener("click", () => {
        // 点同一台可切回全部，点另一台切到该台
        setFilter(activeFilter === m.id ? "all" : m.id);
      });
      mRow.append(btn);
      machineBtns[m.id] = btn;

      if (idx < machineMeta.length - 1) {
        const beam = make("div", "pf-beam");
        beam.append(
          make("span", "pf-beam-label", idx === 0 ? "派单 / 回传" : "成品 / 发布"),
          make("div", "pf-beam-track"),
          make("div", "pf-beam-track rev")
        );
        mRow.append(beam);
      }
    });
    cluster.append(mRow);

    // 2. 三台电脑完整流程图依次排布容器
    const stack = make("div", "pf-stack");
    const panelEls = {};
    const bridgeEls = [];

    panels.forEach((panel, pIdx) => {
      const sec = make("section", "pf-panel");
      sec.dataset.panel = panel.id;

      const head = make("div", "pf-panel-head");
      const titleWrap = make("div", "pf-panel-title");
      titleWrap.append(document.createTextNode(panel.title), make("span", "pf-panel-tag", panel.tag));
      head.append(titleWrap, make("span", "pf-panel-desc", panel.desc));
      sec.append(head);

      const rootWrap = make("div", "pf-root-wrap");
      const rootBtn = make("button", "public-flow-root", panel.rootLabel);
      rootBtn.type = "button";
      rootBtn.setAttribute("aria-pressed", "false");
      rootBtn.addEventListener("click", () => showSteps(rootBtn, panel.title + " · 总闭环", panel.rootSteps));
      rootWrap.append(rootBtn);
      sec.append(rootWrap);

      const cols = make("div", "public-flow-columns" + (panel.colsClass ? " " + panel.colsClass : ""));
      panel.columns.forEach(col => {
        const colEl = make("div", "public-flow-column");
        colEl.append(make("h3", "public-flow-group", col.name));
        const projs = make("div", "public-flow-projects");

        col.projects.forEach(proj => {
          const card = make("div", "public-flow-project");
          const pBtn = make("button", "public-flow-project-name", proj.name);
          pBtn.type = "button";
          pBtn.setAttribute("aria-pressed", "false");
          pBtn.addEventListener("click", () => showSteps(pBtn, panel.tag + " · " + proj.name, proj.branches.map(([n]) => n)));
          card.append(pBtn);

          const ul = make("ul", "public-flow-branches" + (proj.singleCol ? " single-col" : ""));
          proj.branches.forEach(([bName, bSteps]) => {
            const li = make("li");
            const bBtn = make("button", "public-flow-branch", bName);
            bBtn.type = "button";
            bBtn.setAttribute("aria-pressed", "false");
            bBtn.addEventListener("click", () => showSteps(bBtn, proj.name + " → " + bName, bSteps));
            li.append(bBtn);
            ul.append(li);
          });
          card.append(ul);
          projs.append(card);
        });

        colEl.append(projs);
        cols.append(colEl);
      });
      sec.append(cols);
      stack.append(sec);
      panelEls[panel.id] = sec;

      if (pIdx < panels.length - 1) {
        const bridge = make("div", "pf-bridge");
        bridge.append(
          make("div", "pf-bridge-line"),
          make("span", "pf-bridge-pill", pIdx === 0 ? "⬇ 主控电脑派单 ⇄ 共享盘回收作图本成品 ⬇" : "⬇ 作图本成品入仓库 ⇄ 上架机定时铺货与多平台分发 ⬇"),
          make("div", "pf-bridge-line")
        );
        stack.append(bridge);
        bridgeEls.push(bridge);
      }
    });

    // 3. 跨机 & 跨项目流转快捷查看
    const rel = make("div", "public-flow-relations");
    rel.append(make("strong", "", "跨机 & 跨项目流转："));
    [
      ["主控电脑 → 作图本", ["主控派发选品 / 生图单", "作图本远程执行 15 条自动化流", "成品回传共享盘并写入回执"]],
      ["作图本 → 上架机", ["模特图 / 主副视频 / 买家秀入库", "上架机 12:00 & 21:00 自动更新表格", "批量分销上架 + 四平台分发"]],
      ["上架机 → 主控电脑", ["生意参谋定时采店铺 & 竞品数据", "回传主控复盘点击率与转化", "指导下一轮选品与内容选题"]],
      ["主控电脑 → 个人主页 & 飞书", ["更新情报中枢 / 资源中心 / 会动网页", "一键推送 GitHub 个人站", "同步沉淀飞书知识库并全库巡检"]]
    ].forEach(([label, steps]) => {
      const btn = make("button", "public-flow-relation", label);
      btn.type = "button";
      btn.setAttribute("aria-pressed", "false");
      btn.addEventListener("click", () => showSteps(btn, label, steps));
      rel.append(btn);
    });

    function setFilter(mode) {
      activeFilter = mode;
      Object.entries(pillEls).forEach(([id, el]) => el.setAttribute("aria-pressed", String(id === mode)));
      Object.entries(machineBtns).forEach(([id, el]) => {
        el.setAttribute("aria-pressed", String(mode === id));
        el.classList.toggle("is-dim", mode !== "all" && mode !== id);
      });
      Object.entries(panelEls).forEach(([id, el]) => {
        el.hidden = mode !== "all" && mode !== id;
      });
      bridgeEls.forEach(b => { b.hidden = mode !== "all"; });

      const targetPanel = panels.find(p => p.id === mode);
      if (targetPanel) {
        showSteps(null, targetPanel.title + " · 执行闭环", targetPanel.rootSteps);
      } else {
        showSteps(null, "三台电脑协同总闭环（点击上方任意节点查看具体步骤）", [
          "主控电脑派单与统筹",
          "作图本跑 5 条选品 + 10 条 AI 视觉",
          "共享盘回传主控验收",
          "上架机更新 10 张表 + 四平台分发",
          "参谋数据回传主控复盘"
        ]);
      }
    }

    host.append(cluster, stack, rel, detail);
    setFilter(host.dataset.workflowMap === "home" ? "main" : "all");
  }

  document.querySelectorAll("[data-workflow-map]").forEach(mount);
})();
