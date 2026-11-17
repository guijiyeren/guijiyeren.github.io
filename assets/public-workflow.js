(() => {
  const taskSteps = ["收到任务", "明确内容与归属", "认领并推进", "按项目规则确认", "回填结果"];
  const groups = [
    {
      name: "内容与制作",
      projects: [
        { name: "硅基野人", branches: [
          ["选题与对标", ["查看采集和爆款数据", "筛选题目与对标", "确定制作方向"]],
          ["视频、贴图与文章", ["接收素材", "按类型制作", "核对定稿"]],
          ["发布与核验", ["准备平台素材", "按现有流程确认", "核对并登记结果"]],
          ["飞书知识库", ["整理可公开内容", "归入对应知识库栏目"]]
        ] },
        { name: "无限画布", branches: [
          ["节点画布", ["放入素材", "连接节点"]],
          ["选模型与生成", ["选择模型和规格", "询价或模拟", "查看生成结果"]]
        ] },
        { name: "剪辑工厂", branches: [
          ["素材或工程", ["导入录音或选已有工程", "确认本次剪辑目标"]],
          ["试片与导出", ["做试片", "修改字幕与剪辑", "查看并导出"]]
        ] }
      ]
    },
    {
      name: "经营与信息",
      projects: [
        { name: "电商运营", branches: [
          ["选品与仓库", ["查看选品线索", "采集到仓库"]],
          ["上架与推广", ["核对素材和上架包", "上架后看推广与复盘"]]
        ] },
        { name: "情报中枢", branches: [
          ["来源与同步", ["选择公开来源", "同步并检查各来源"]],
          ["榜单与网站", ["查看榜单和线索", "更新公开展示"]]
        ] },
        { name: "资源中心", branches: [
          ["来源与入库", ["登记新来源", "更新本地索引"]],
          ["查找与展示", ["筛选已收录资源", "同步脱敏展示版"]]
        ] }
      ]
    },
    {
      name: "资料与共用",
      projects: [
        { name: "个人工作总台", branches: [
          ["任务流转", taskSteps],
          ["流程开关", ["按项目设置试片、审片和成品确认", "按原规则确认发布"], true],
          ["版本管理", ["核对差异和纳入范围", "保存版本", "确认后回退"], true]
        ] },
        { name: "工作台模块", branches: [
          ["多 AI 开会", ["确定议题与参与者", "各自提交意见", "主持人汇总结论"]],
          ["每日毒打", ["回看当天结果", "找出卡点", "明确下一步"]],
          ["每日巡检", ["核对网站和知识库", "记录异常和未检查项"]],
          ["每日复盘", ["核对工作记录", "给出复盘候选", "选中后整理"]],
          ["每日卡片", ["检查重复与隐私", "选卡", "核验发布"], true],
          ["每日串门", ["找到相关内容", "按流程准备互动草稿", "登记结果"], true],
          ["每日采集", ["读取公开来源和作品数据", "核对采集结果", "写回执"], true]
        ] }
      ]
    }
  ];

  function make(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function mount(host) {
    const compact = host.dataset.workflowMap === "home";
    const graph = make("div", "public-flow-tree");
    const root = make("button", "public-flow-root", "个人工作总台");
    const columns = make("div", "public-flow-columns");
    const relationships = make("div", "public-flow-relations");
    const detail = make("div", "public-flow-selection");
    const heading = make("h3", "public-flow-selection-title");
    const list = make("ol", "public-flow-steps");
    detail.hidden = true;
    detail.append(heading, list);
    detail.setAttribute("aria-live", "polite");

    let selected;
    function show(button, name, steps) {
      if (selected) selected.setAttribute("aria-pressed", "false");
      selected = button;
      if (selected) selected.setAttribute("aria-pressed", "true");
      heading.textContent = name;
      list.replaceChildren(...steps.map(step => make("li", "", step)));
      detail.hidden = false;
      detail.classList.remove("is-updated");
      requestAnimationFrame(() => {
        detail.classList.add("is-updated");
        if (detail.getBoundingClientRect().bottom > window.innerHeight) {
          detail.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
        }
      });
    }

    function wire(button, callback) {
      button.type = "button";
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", callback);
      return button;
    }

    wire(root, () => show(root, "任务流转", taskSteps));
    graph.append(root, columns);
    for (const group of groups) {
      const column = make("div", "public-flow-column");
      const title = make("h3", "public-flow-group", group.name);
      const projects = make("div", "public-flow-projects");
      column.append(title, projects);
      for (const project of group.projects) {
        const card = make("section", "public-flow-project");
        const branches = project.branches.filter(([, , more]) => !compact || !more);
        const projectButton = make("button", "public-flow-project-name", project.name);
        wire(projectButton, () => show(projectButton, project.name, branches.map(([name]) => name)));
        card.append(projectButton);
        const leaves = make("ul", "public-flow-branches");
        for (const [name, steps] of branches) {
          const branch = make("button", "public-flow-branch", name);
          wire(branch, () => show(branch, name, steps));
          const item = make("li");
          item.append(branch);
          leaves.append(item);
        }
        card.append(leaves);
        projects.append(card);
      }
      columns.append(column);
    }
    relationships.append(make("strong", "", "跨项目连接"));
    for (const [from, to, steps] of [
      ["剪辑工厂", "硅基野人", ["打开已有工程", "修改并导出", "交回作品流程"]],
      ["情报中枢", "个人网站", ["核对公开榜单", "更新网站展示"]],
      ["资源中心", "个人网站", ["更新本地索引", "同步公开展示版"]]
    ]) {
      const link = make("button", "public-flow-relation", from + " → " + to);
      wire(link, () => show(link, from + " → " + to, steps));
      relationships.append(link);
    }
    host.append(graph, relationships, detail);
  }

  document.querySelectorAll("[data-workflow-map]").forEach(mount);
})();
