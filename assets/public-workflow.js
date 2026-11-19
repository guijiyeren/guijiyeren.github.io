(() => {
  const taskSteps = ["收到任务", "明确内容与归属", "主控分派 / 远程认领", "按项目开关确认", "回填成品与回执"];

  const machines = [
    {
      id: "main",
      badge: "总控大脑",
      name: "🖥️ 主控电脑（个人工作总台）",
      role: "统管任务交办、多 AI 协作、内容创作、知识库沉淀与对外网站发布。",
      tags: ["Obsidian 总台", "多 AI 指挥", "飞书与个人站"],
      steps: [
        "在总台接收并拆解任务，明确项目归属与验收标准",
        "派发远程任务给作图本 / 上架机，或本地直接调 AI 执行",
        "回收各机执行回执与成品目录，逐项核验后发布上线"
      ]
    },
    {
      id: "drawing",
      badge: "选品 + AI 视觉",
      name: "🎨 作图本（远程生产节点）",
      role: "专跑电商多源选品采集与 AI 批量生图 / 生视频，成品经共享盘回传主控。",
      tags: ["多源选品", "模特图 / 主副视频", "买家秀洗图"],
      steps: [
        "按周期运行阿里供货、同行淘宝、平台热销等选品采集流",
        "批量跑 AI 模特图、主副视频、多姿势买家秀与换背景洗图",
        "成品自动落盘共享目录并向主控总台回传状态回执"
      ]
    },
    {
      id: "listing",
      badge: "多平台发布 + 数据",
      name: "🚀 上架机（分发与回收节点）",
      role: "定时更新上架表格、批量上架商品、四平台视频图文分发与店铺数据采集。",
      tags: ["定时更新表格", "批量分销上架", "多平台分发 & 参谋"],
      steps: [
        "中午 / 晚间定时更新商品上架表与视频图文多表格",
        "批量分销上架商品并自动替换长图、发布新款与老款主推",
        "多平台批量发布视频图文，并采集店铺与行业竞品推广数据"
      ]
    }
  ];

  const groups = [
    {
      name: "内容与视觉制作",
      projects: [
        { name: "硅基野人", host: "主控", machine: "main", branches: [
          ["选题与对标", ["查看采集和爆款数据", "筛选题目与对标", "确定制作方向"]],
          ["视频、贴图与文章", ["接收素材", "按类型制作", "核对定稿"]],
          ["发布与核验", ["准备平台素材", "按开关确认发布", "回填链接与结果"]],
          ["飞书知识库", ["整理可公开内容", "归入对应栏目并全库巡检"]]
        ] },
        { name: "无限画布", host: "主控 / 作图本", machine: "drawing", branches: [
          ["节点画布", ["放入素材", "连接图片与视频节点"]],
          ["选模型与生成", ["选择模型与规格", "询价或模拟", "批量生成并验收"]]
        ] },
        { name: "剪辑工厂", host: "主控", machine: "main", branches: [
          ["素材或工程", ["导入录音或已有工程", "确认本次剪辑目标"]],
          ["试片与导出", ["生成试片", "修改字幕与节奏", "审片确认并导出"]]
        ] },
        { name: "会动网页", host: "主控", machine: "main", branches: [
          ["全球 3D 采集", ["同步 3D 交互酷站", "实景渲染截图并肉眼核验"]],
          ["图墙与公开站", ["更新 1,037+ 图墙库", "一键同步个人主页与飞书 09 页"]]
        ] }
      ]
    },
    {
      name: "三机电商与信息引擎",
      projects: [
        { name: "电商运营", host: "三机协同", machine: "drawing", branches: [
          ["作图本 · 选品", ["阿里供货 / 同行 / 平台热销采集", "成品回传共享仓库"]],
          ["作图本 · AI 视觉", ["模特图 / 主副视频 / 买家秀批量生成", "核对成片入库"]],
          ["上架机 · 上架分发", ["12:00 / 21:00 更新多表格", "批量上架与多平台图文视频发布"]],
          ["上架机 · 数据复盘", ["采集店铺与竞品推广数据", "回传主控复盘优化"]]
        ] },
        { name: "情报中枢", host: "主控", machine: "main", branches: [
          ["来源与同步", ["40+ 公开来源定时采集", "三层去重 + 规则与 AI 打分"]],
          ["榜单与网站", ["区分重点线索与待验证", "自动更新个人网站公开榜单"]]
        ] },
        { name: "资源中心", host: "主控", machine: "main", branches: [
          ["来源与入库", ["登记新来源", "更新 10,000+ 本地资源索引"]],
          ["查找与展示", ["按分区与评分筛选", "同步脱敏展示版到个人站"]]
        ] }
      ]
    },
    {
      name: "总台大脑与日常兵器",
      projects: [
        { name: "个人工作总台", host: "主控", machine: "main", branches: [
          ["任务流转", taskSteps],
          ["流程开关", ["按项目控制试片 / 审片 / 发布确认点", "需确认项进入「等你处理」"]],
          ["版本管理", ["核对纳入范围与差异", "提交归档并打版本标签", "确认后再回退"]]
        ] },
        { name: "兵器 · 日常自动化", host: "主控", machine: "main", branches: [
          ["多 AI 开会", ["确定议题与参与者", "各自提交独立意见", "主持人汇总结论"]],
          ["每日毒打", ["回看当天产出与卡点", "提炼次日改进项"]],
          ["每日巡检", ["核对个人网站与飞书知识库", "记录异常与未检查项"]],
          ["每日复盘", ["核对当天交接与日志", "生成复盘候选并沉淀飞书"]],
          ["每日卡片", ["筛选学习卡并查重脱敏", "核验后发布飞书"]],
          ["每日串门", ["发现相关优质内容", "准备互动草稿并登记"]],
          ["每日采集", ["同步公开情报、爆款与作品数据", "写入执行回执"]]
        ] }
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
    const detail = make("div", "public-flow-selection");
    const heading = make("h3", "public-flow-selection-title");
    const list = make("ol", "public-flow-steps");
    detail.hidden = true;
    detail.append(heading, list);
    detail.setAttribute("aria-live", "polite");

    let selected;
    const projectEls = [];

    function highlightMachine(machineId) {
      projectEls.forEach(({ el, machine }) => {
        el.classList.toggle("is-highlight", Boolean(machineId) && (machine === machineId || (machineId === "listing" && el.dataset.proj === "电商运营")));
      });
    }

    function show(button, name, steps, machineId) {
      if (selected) selected.setAttribute("aria-pressed", "false");
      selected = button;
      if (selected) selected.setAttribute("aria-pressed", "true");
      highlightMachine(machineId || "");
      heading.textContent = name;
      list.replaceChildren(...steps.map(step => make("li", "", step)));
      detail.hidden = false;
      detail.classList.remove("is-updated");
      requestAnimationFrame(() => detail.classList.add("is-updated"));
    }

    function wire(button, callback) {
      button.type = "button";
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", callback);
      return button;
    }

    // 1. 三台电脑动态协同拓扑
    const cluster = make("div", "pf-cluster");
    const cHead = make("div", "pf-cluster-head");
    const cTitle = make("div", "pf-cluster-title");
    cTitle.append(make("span", "pf-live-dot"), document.createTextNode("三台电脑实时协同拓扑（点击设备查看职责与链路）"));
    cHead.append(cTitle, make("span", "pf-cluster-sub", "主控派单 ⇄ 共享盘回传成品 ⇄ 上架机定时分发"));
    cluster.append(cHead);

    const mRow = make("div", "pf-machines");
    machines.forEach((m, idx) => {
      const btn = make("button", "pf-machine");
      btn.dataset.m = m.id;
      const top = make("div", "pf-m-top");
      top.append(make("span", "pf-m-badge", m.badge));
      btn.append(top, make("div", "pf-m-name", m.name), make("div", "pf-m-role", m.role));
      const tags = make("div", "pf-m-tags");
      m.tags.forEach(t => tags.append(make("span", "", t)));
      btn.append(tags);
      wire(btn, () => show(btn, m.name + " · 执行链路", m.steps, m.id));
      mRow.append(btn);

      if (idx < machines.length - 1) {
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

    // 2. 全景树状流程图（完整展示所有项目与兵器）
    const graph = make("div", "public-flow-tree");
    const rootWrap = make("div", "pf-root-wrap");
    const root = make("button", "public-flow-root", "⚡ 个人工作总台 · 全景流程总控");
    wire(root, () => show(root, "总台任务流转闭环", taskSteps, "main"));
    rootWrap.append(root);

    const columns = make("div", "public-flow-columns");
    for (const group of groups) {
      const column = make("div", "public-flow-column");
      column.append(make("h3", "public-flow-group", group.name));
      const projects = make("div", "public-flow-projects");
      for (const project of group.projects) {
        const card = make("section", "public-flow-project");
        card.dataset.proj = project.name;
        projectEls.push({ el: card, machine: project.machine });

        const projectButton = make("button", "public-flow-project-name");
        projectButton.append(document.createTextNode(project.name), make("span", "pf-proj-host", project.host));
        wire(projectButton, () => show(projectButton, project.name + "（" + project.host + "）", project.branches.map(([n]) => n), project.machine));
        card.append(projectButton);

        const leaves = make("ul", "public-flow-branches");
        for (const [name, steps] of project.branches) {
          const branch = make("button", "public-flow-branch", name);
          wire(branch, () => show(branch, project.name + " · " + name, steps, project.machine));
          const li = make("li");
          li.append(branch);
          leaves.append(li);
        }
        card.append(leaves);
        projects.append(card);
      }
      column.append(projects);
      columns.append(column);
    }
    graph.append(rootWrap, columns);

    // 3. 跨项目 / 跨机器流动连线
    const relationships = make("div", "public-flow-relations");
    relationships.append(make("strong", "", "跨机 & 跨项目流转："));
    for (const [from, to, steps] of [
      ["主控总台", "作图本", ["主控派发选品 / 生图单", "作图本远程执行", "成品回传共享盘与回执"]],
      ["作图本", "上架机", ["成品图与视频入仓库", "上架机定时更新表格", "批量上架与四平台分发"]],
      ["剪辑工厂", "硅基野人", ["打开已有工程", "修改字幕并导出", "交回多平台发布流程"]],
      ["情报 / 资源 / 会动网页", "个人主页 & 飞书", ["本地更新索引与实景图", "一键发布个人站", "同步沉淀飞书知识库"]]
    ]) {
      const link = make("button", "public-flow-relation", from + " → " + to);
      wire(link, () => show(link, from + " → " + to, steps));
      relationships.append(link);
    }

    host.append(cluster, graph, relationships, detail);
    // 默认展开总台闭环，一眼能看懂
    show(root, "总台任务流转闭环", taskSteps, "");
  }

  document.querySelectorAll("[data-workflow-map]").forEach(mount);
})();
