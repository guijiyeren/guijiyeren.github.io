/**
 * Three.js 案例库 — 站点总配置
 *
 * 数据来自 magiccreator.ai/astra 社区画廊与 awesome-gpt-6-astra 仓库：
 * 均为 GPT-6 Astra 生成、已部署公网、可直接在浏览器打开的 three.js / WebGL 作品。
 * 每张卡片的海报图是本地真实截图（assets/posters/），点击卡片在新窗口打开原站。
 */
globalThis.SITE_CONFIG = {
  contacts: { email: "rockeymen@gmail.com", wechat: "rockeymen", x: "https://x.com/Rockeymen" },
  /* ---------- 1. 站点身份 ---------- */
  galleryMusic: {src: 'assets/audio/dream-culture.mp3'},
  site: {
    name: 'Three.js 案例库',
    nameEn: 'Three.js Cases',
    brandMark: 'Three',
    brandDot: '.',
    brandText: 'js',
    url: 'https://threejs.cc',
    clarityProjectId: 'z7n9ndtqhu',
    gaMeasurementId: 'G-BTC977LYQG',
    bingVerification: 'D6BC8C6FEB46F4B8F564EB57A45DC47A',
    /* SEO 专用标题（用于 <title>/og:title，与首页 hero 文案解耦，可堆关键词） */
    seoTitleZh: 'Three.js 案例库 · 互动 3D 网页、WebGL 游戏与特效',
    seoTitleEn: 'Three.js Examples · Interactive 3D Demos & WebGL Games',
    titleZh: 'Three.js 案例库',
    titleEn: 'Three.js Cases',
    introZh: '提交作品请发送至 <a href="mailto:rockeymen@gmail.com">rockeymen@gmail.com</a>',
    introEn: 'Submit your work to <a href="mailto:rockeymen@gmail.com">rockeymen@gmail.com</a>',
    descriptionZh: '探索 900 多个可在线体验的 Three.js 案例，80 多个开源作品可查看源码、参考实现。每日收录最新的热门 3D 作品，按主题发现 3D 游戏、创意网页和 WebGL 特效。',
    descriptionEn: 'Explore 900+ Three.js demos and learn from 80+ open-source projects. Discover trending 3D projects daily, from browser games to creative sites and WebGL effects.',
    keywords: [
      'three.js', 'Three.js', 'WebGL', 'GPT-6 Astra', 'Astra',
      '3D 游戏', '3D 网页游戏', '独立游戏', '独立开发者',
      '3D 艺术', '生成艺术',
      'three.js 案例', 'three.js 教程', 'Three.js demos',
      'WebGL games', 'indie games', 'indie developer', '3D art'
    ],
    footerText: 'Curated from community sources. All works belong to their creators.',
    copyright: '© 2026 · Three.js 案例库',
    copyrightEn: '© 2026 · Three.js Cases'
  },

  /* ---------- 2. 数据字段语义 ---------- */
  fields: {
    metric: 'views',
    metricLabelZh: '浏览',
    metricLabelEn: 'views',
    metricIcon: '★',
    categoryField: 'category',
    tagsField: 'tags'
  },

  /* ---------- 3. 分类 ---------- */
  categories: [
    {key: 'city', label: {zh: '地图', en: 'Map'}},
    {key: 'showcase', label: {zh: '产品展示', en: 'Showcase'}},
    {key: 'art', label: {zh: '视觉艺术', en: 'Visual art'}},
    {key: 'sim', label: {zh: '物理模拟', en: 'Physics'}},
    {key: 'site', label: {zh: '站点', en: 'Sites'}},
    {key: 'science', label: {zh: '科普教育', en: 'Science'}},
    {key: 'tools', label: {zh: '开发工具', en: 'Tools'}},
    {key: 'action', label: {zh: '动作射击', en: 'Action'}},
    {key: 'puzzle', label: {zh: '解谜策略', en: 'Puzzle'}},
    {key: 'strategy', label: {zh: '模拟经营', en: 'Sim'}},
    {key: 'rpg', label: {zh: '角色冒险', en: 'RPG'}},
    {key: 'race', label: {zh: '竞速体育', en: 'Racing'}},
    {key: 'experimental', label: {zh: '多人', en: 'Multiplayer'}}
  ],
  gameCategories: ['action', 'puzzle', 'strategy', 'rpg', 'race', 'experimental'],
  showTrending: false,

  /* ---------- 3.5 首页精选 ---------- */
  hot: {
    label: {zh: '每周精选', en: 'Featured'},
    ids: [
      'scale-rockeymen-xyz',
      'painting3d-rockeymen-xyz',
      'carrier-anomaly-arcade',
      'saltline-fable-52',
      'tidewater-dgreenheck',
      'crimson-loong',
      'raspberry-luruke-com',
      'roamdial-com',
      'eric1hua-github-io-hemu-ski',
      'verdant-forest-lexn8-chatgpt-site',
      'abyssal-living-deep-netlify-app',
      'myriad-million-bot-swarm-fable-52',
      'tokyo-drift-fable-52',
      'fire-in-ice-fable-52',
      'steeldawn-rts',
      'nightclub-drift-speed',
      'cell-rockeymen-xyz',
      'cosmos-rockeymen-xyz-cosmic-web',
      'aquarium-rockeymen-xyz'
    ]
  },

  /* ---------- 4. 排序方式 ---------- */
  sorts: [
    {key: 'likes', label: {zh: '最热门', en: 'Most liked'}},
    {key: 'new', label: {zh: '最近', en: 'Recent'}}
  ],

  /* ---------- 5. 功能开关 ---------- */
  features: {
    i18n: true,
    ranking: false,           // 没有可靠的热度数据，关闭排行榜
    externalLinks: true,      // 卡片右上角提供原站链接
    detailModal: false,       // 不需要弹窗，点击即跳转
    detailPages: true,        // 保留静态详情页，供搜索引擎收录
    copyCommand: false,
    adSlot: false,
    submitCta: true,
    urlState: true,

    imageCards: {
      enabled: true,
      textCardTail: 0,        // 全部使用图片卡片
      placeholder: true
    }
  },

  /* ---------- 6. 详情弹窗 / 详情页 ---------- */
  detail: {
    meta: [
      {field: 'category', kind: 'category'},
      {field: 'author', kind: 'text'},
      {field: 'updated', kind: 'text', prefixZh: '发布于 ', prefixEn: 'published '}
    ],
    copyField: '',
    copyLabelZh: '',
    copyLabelEn: '',
    bodySource: 'overview',
    primaryAction: {field: 'url', labelZh: '访问原站', labelEn: 'Visit site'},
    secondaryAction: {field: '', labelZh: '', labelEn: ''}
  },

  /* ---------- 7. 投稿 / 招商 ---------- */
  cta: {
    submitTitleZh: '有作品？<br /><em>让更多人看到它。</em>',
    submitTitleEn: 'Built something?<br /><em>Let others find it.</em>',
    submitButtonZh: '提交收录',
    submitButtonEn: 'Submit a case',
    submitUrl: 'mailto:rockeymen@gmail.com?subject=threejs.cc%20提交收录',
    contactEmail: 'rockeymen@gmail.com',
    adSlotEmail: 'hello@threejs.cc',
    adSlotTitleZh: '广告招商位',
    adSlotDescZh: '把你的产品展示给这里的目标用户，获取首页曝光。'
  },

  /* ---------- 8. 数据源 ---------- */
  source: {
    type: 'manual',
    options: {}
  },

  /* ---------- 8.5 构建 ---------- */
  build: {
    staticCardCount: 24       // 首页首批卡片数量
  },

  /* ---------- 9. 文案 ---------- */
  ui: {
    zh: {
      heroTitle: 'Three<b class="hero-title-js">.js</b> 案例库',
      hero: '提交作品请发送至 <a href="mailto:rockeymen@gmail.com">rockeymen@gmail.com</a>',
      heroAlt: '840 个 Astra 与经典 three.js 网页案例',
      search: '搜索名称或关键词…',
      searchLabel: '搜索',
      all: '全部',
      collectedThisWeek: '本周收录',
      item: '案例',
      trending: '热度榜',
      sortLabel: '排序',
      empty: '没有找到匹配的案例。',
      clear: '清除筛选',
      viewAll: '查看全部',
      loadMore: '加载更多案例',
      rankingTitle: '本周最受欢迎',
      rankingDesc: '按热度排列<br />的社区选择。',
      close: '关闭',
      copy: '复制',
      copied: '已复制 ✓',
      detailLabel: '简介',
      detailEmpty: '暂无详细介绍。',
      statItems: '个案例',
      statCategories: '个分类'
    },
    en: {
      heroTitle: 'Three<b class="hero-title-js">.js</b> Cases',
      hero: 'Submit your work to <a href="mailto:rockeymen@gmail.com">rockeymen@gmail.com</a>',
      heroAlt: '840 Astra & classic three.js web cases',
      search: 'Search names or keywords…',
      searchLabel: 'Search',
      all: 'All',
      collectedThisWeek: 'This week',
      item: 'cases',
      trending: 'Trending',
      sortLabel: 'Sort',
      empty: 'No matching cases found.',
      clear: 'Clear filters',
      viewAll: 'View all',
      loadMore: 'Load more cases',
      rankingTitle: 'Most loved this week',
      rankingDesc: 'Ranked by popularity<br />and community momentum.',
      close: 'Close',
      copy: 'Copy',
      copied: 'Copied ✓',
      detailLabel: 'Overview',
      detailEmpty: 'No detailed description yet.',
      statItems: 'cases',
      statCategories: 'categories'
    }
  }
};

// Temporary login/likes pause: remove count-based sorting.
SITE_CONFIG.sorts = SITE_CONFIG.sorts.filter(option => option.key !== 'likes');
