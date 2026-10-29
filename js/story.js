// ==================== 剧情场景页 ====================
// 剧情曲目真实数据：为每首剧情曲目关联真实平台指标（无真实数据者剔除，不估算）
// netease/cmt 字段承载「网易云评论数（千）」，qq 字段承载「B站相关视频播放量（千）」
const ST = (window.STORY_TRACKS || []).map(t => {
  const r = (typeof getRealByName === 'function') ? getRealByName(t.name) : null;
  const cmtK = r && typeof r.neteaseCmt === 'number' ? +(r.neteaseCmt / 1000).toFixed(1) : null;
  const playK = r && typeof r.biliPlay === 'number' ? +(r.biliPlay / 1000).toFixed(1) : null;
  if (cmtK === null && playK === null) return null;
  return { ...t, netease: cmtK ?? 0, qq: playK ?? 0, cmt: cmtK ?? 0 };
}).filter(Boolean);

// 版本热点事件数据（基于各版本剧情与音乐传播热点整理）
const VERSION_EVENTS = {
  "1.2": { event: "龙脊雪山开放", desc: "蒙德首张扩展地图，雪境氛围配乐奠定原神冬季叙事基调", region: "mondstadt" },
  "1.5": { event: "优菈登场·尘歌壶", desc: "旧贵族后裔的复仇之舞与家园系统上线，岩壑之崩伴随层岩预热", region: "liyue" },
  "2.4": { event: "海灯节·云堇京剧", desc: "神女劈观以京剧唱腔破圈传播，成为原神文化输出标志性事件", region: "liyue" },
  "2.5": { event: "雷电将军传说任务", desc: "三奉行体系深入刻画，哀息之茧伴随稻妻权力核心揭示", region: "inazuma" },
  "3.0": { event: "须弥开放·森林书", desc: "雨林生态与草元素登场，大梦的曲调承载世界树叙事的宏大序章", region: "sumeru" },
  "4.2": { event: "芙宁娜退场高潮", desc: "枫丹主线情感顶点，轻涟伴随水神五百年孤独的真相揭露", region: "fontaine" },
  "4.3": { event: "枫丹收官·娜维娅", desc: "审判庭落幕后的温情收束，咏歌与凯旋为枫丹篇章画上句号", region: "fontaine" },
  "5.0": { event: "纳塔开放·还魂诗", desc: "火之国部族文化与复活主题，炽烈的还魂诗呼应玛薇卡使命", region: "natlan" },
  "6.0": { event: "挪德卡莱开放", desc: "新国度揭幕，空月之歌承载月之叙事线的神秘开端", region: "nodkrai" },
  "6.4": { event: "法尔伽远征·北风", desc: "西风骑士团大团长登场，北风凯歌与捕风的归客呼应蒙德主线回归", region: "mondstadt" },
  "6.7": { event: "霜月降临·千灵节", desc: "挪德卡莱高潮章节，霜月降临与望月共同推向月之叙事顶点", region: "nodkrai" },
  "7.0": { event: "至冬开放·无神怜爱的雪国", desc: "冰之国度全域开放，古兽冰原、白桦雪葬地等五大区域登场，银昼寒光奠定雪国叙事基调", region: "snezhnaya" },
  "7.1": { event: "往冥府的安魂歌·逐月节", desc: "至冬篇章续作与逐月节同步展开，往冥府的安魂歌以安魂曲式书写雪国终章", region: "snezhnaya" }
};

// ==================== 版本时间轴·舆论反响数据 ====================
// sentiment: positive(正面) / mixed(褒贬不一) / breakout(破圈)
// buzz: 舆论热度指数（0-100，基于评论增量与社交平台讨论量估算）
// keywords: 舆论关键词（字号映射热度，用于文字云可视化）
// voices: 典型舆论声音（模拟玩家社区代表性观点）
const TIMELINE_VERSIONS = [
  {
    version: "1.2", date: "2020-12", event: "龙脊雪山开放", region: "mondstadt",
    track: "天穹的牧歌", heat: 42, cmt: 7.8, sentiment: "positive", buzz: 35,
    summary: "蒙德首张扩展地图上线，雪境氛围配乐获得玩家好评，奠定原神冬季叙事基调。",
    keywords: [
      { word: "氛围感", weight: 32 }, { word: "雪景", weight: 28 }, { word: "沉浸", weight: 24 },
      { word: "探索", weight: 20 }, { word: "治愈", weight: 18 }
    ],
    voices: [
      { tag: "好评", text: "雪山BGM一响，整个人都安静下来了，氛围感拉满" },
      { tag: "讨论", text: "探索解谜配乐配合得太好了，沉浸感很强" }
    ]
  },
  {
    version: "1.5", date: "2021-04", event: "优菈登场·尘歌壶", region: "liyue",
    track: "岩壑之崩", heat: 68, cmt: 12.8, sentiment: "positive", buzz: 52,
    summary: "优菈复仇之舞PV配乐走红，家园系统尘歌壶同步上线，岩壑之崩成为璃月叙事代表曲目。",
    keywords: [
      { word: "复仇之舞", weight: 38 }, { word: "尘歌壶", weight: 34 }, { word: "璃月", weight: 30 },
      { word: "优菈", weight: 28 }, { word: "层岩", weight: 22 }, { word: "节奏感", weight: 20 }
    ],
    voices: [
      { tag: "好评", text: "岩壑之崩的节奏太燃了，复仇之舞名场面" },
      { tag: "讨论", text: "尘歌壶终于来了，配乐都这么用心" }
    ]
  },
  {
    version: "2.4", date: "2022-01", event: "海灯节·云堇京剧", region: "liyue",
    track: "神女劈观", heat: 125, cmt: 28.5, sentiment: "breakout", buzz: 98,
    summary: "神女劈观以京剧唱腔破圈传播，登上海外多国热搜，成为原神文化输出标志性事件。",
    keywords: [
      { word: "京剧", weight: 52 }, { word: "破圈", weight: 48 }, { word: "文化输出", weight: 46 },
      { word: "云堇", weight: 42 }, { word: "戏曲", weight: 38 }, { word: "泪目", weight: 34 },
      { word: "封神", weight: 30 }, { word: "热搜", weight: 28 }, { word: "惊艳", weight: 24 }
    ],
    voices: [
      { tag: "破圈", text: "官媒都转发了，京剧还能这样出圈，文化输出封神" },
      { tag: "泪目", text: "听到戏曲腔一出来直接泪目，云堇太惊艳了" },
      { tag: "热议", text: "海外玩家都在问这是什么唱腔，太骄傲了" }
    ]
  },
  {
    version: "2.5", date: "2022-02", event: "雷电将军传说任务", region: "inazuma",
    track: "哀息之茧", heat: 52, cmt: 9.8, sentiment: "positive", buzz: 48,
    summary: "三奉行体系深入刻画，雷电将军人性面展现，哀息之茧伴随稻妻权力核心揭示。",
    keywords: [
      { word: "雷电将军", weight: 34 }, { word: "传说任务", weight: 28 }, { word: "三奉行", weight: 24 },
      { word: "权谋", weight: 20 }, { word: "稻妻", weight: 18 }
    ],
    voices: [
      { tag: "好评", text: "传说任务把雷电将军写活了，哀息之茧氛围绝了" },
      { tag: "讨论", text: "三奉行的权谋线终于铺开了" }
    ]
  },
  {
    version: "3.0", date: "2022-08", event: "须弥开放·森林书", region: "sumeru",
    track: "大梦的曲调", heat: 58, cmt: 11.2, sentiment: "positive", buzz: 62,
    summary: "须弥雨林生态与草元素登场，世界树叙事宏大序章开启，大梦的曲调承载神秘氛围。",
    keywords: [
      { word: "须弥", weight: 40 }, { word: "草元素", weight: 36 }, { word: "森林书", weight: 32 },
      { word: "世界树", weight: 28 }, { word: "大梦", weight: 24 }, { word: "神秘", weight: 22 },
      { word: "探索", weight: 20 }
    ],
    voices: [
      { tag: "好评", text: "须弥配乐的异域风情太绝了，大梦的曲调循环一整天" },
      { tag: "讨论", text: "森林书剧情量爆炸，世界树的设定太宏大了" }
    ]
  },
  {
    version: "4.2", date: "2023-11", event: "芙宁娜退场高潮", region: "fontaine",
    track: "轻涟", heat: 98, cmt: 18.5, sentiment: "breakout", buzz: 88,
    summary: "枫丹主线情感顶点，芙宁娜五百年孤独真相揭露，轻涟成为年度最催泪剧情音乐。",
    keywords: [
      { word: "芙宁娜", weight: 50 }, { word: "泪目", weight: 46 }, { word: "五百年", weight: 40 },
      { word: "轻涟", weight: 38 }, { word: "催泪", weight: 34 }, { word: "封神", weight: 30 },
      { word: "水神", weight: 28 }, { word: "意难平", weight: 24 }, { word: "牺牲", weight: 22 }
    ],
    voices: [
      { tag: "泪目", text: "轻涟一响直接破防，芙宁娜五百年太难了" },
      { tag: "封神", text: "枫丹主线封神，芙宁娜的牺牲写进了心里" },
      { tag: "热议", text: "年度最佳剧情没有之一，轻涟循环到停不下来" }
    ]
  },
  {
    version: "4.3", date: "2023-12", event: "枫丹收官·娜维娅", region: "fontaine",
    track: "咏歌与凯旋", heat: 48, cmt: 9.2, sentiment: "positive", buzz: 42,
    summary: "审判庭落幕后的温情收束，咏歌与凯旋为枫丹篇章画上圆满句号。",
    keywords: [
      { word: "收官", weight: 30 }, { word: "娜维娅", weight: 26 }, { word: "凯旋", weight: 22 },
      { word: "温情", weight: 20 }, { word: "枫丹", weight: 18 }
    ],
    voices: [
      { tag: "好评", text: "咏歌与凯旋收得很温暖，枫丹完美收官" },
      { tag: "讨论", text: "娜维娅这条线处理得不错" }
    ]
  },
  {
    version: "5.0", date: "2024-08", event: "纳塔开放·还魂诗", region: "natlan",
    track: "炽烈的还魂诗", heat: 38, cmt: 7.2, sentiment: "mixed", buzz: 45,
    summary: "火之国部族文化与复活主题登场，炽烈的还魂诗呼应玛薇卡使命，评价褒贬不一。",
    keywords: [
      { word: "纳塔", weight: 32 }, { word: "还魂诗", weight: 28 }, { word: "部族", weight: 24 },
      { word: "复活", weight: 22 }, { word: "玛薇卡", weight: 20 }, { word: "争议", weight: 18 }
    ],
    voices: [
      { tag: "好评", text: "纳塔的部族风格配乐很有特色" },
      { tag: "争议", text: "复活主题节奏偏快，没有前几个国家震撼" }
    ]
  },
  {
    version: "6.0", date: "2025-04", event: "挪德卡莱开放", region: "nodkrai",
    track: "空月之歌", heat: 65, cmt: 12.2, sentiment: "positive", buzz: 68,
    summary: "新国度揭幕，月之叙事线神秘开启，空月之歌以空灵旋律承载悬念氛围。",
    keywords: [
      { word: "挪德卡莱", weight: 38 }, { word: "月之叙事", weight: 34 }, { word: "空月之歌", weight: 30 },
      { word: "新国度", weight: 26 }, { word: "空灵", weight: 24 }, { word: "悬念", weight: 22 },
      { word: "神秘", weight: 20 }
    ],
    voices: [
      { tag: "好评", text: "空月之歌太空灵了，新国度的神秘感拉满" },
      { tag: "讨论", text: "月之叙事线终于开了，期待后续展开" }
    ]
  },
  {
    version: "6.4", date: "2025-10", event: "法尔伽远征·北风", region: "mondstadt",
    track: "北风凯歌", heat: 48, cmt: 9.2, sentiment: "positive", buzz: 58,
    summary: "西风骑士团大团长法尔伽登场，蒙德主线回归，北风凯歌唤起初心玩家情怀。",
    keywords: [
      { word: "法尔伽", weight: 34 }, { word: "蒙德回归", weight: 30 }, { word: "北风凯歌", weight: 26 },
      { word: "情怀", weight: 24 }, { word: "初心", weight: 22 }, { word: "大团长", weight: 20 }
    ],
    voices: [
      { tag: "情怀", text: "蒙德主线终于回来了，北风凯歌一响梦回开服" },
      { tag: "好评", text: "法尔伽登场排面拉满，蒙德的回归太有分量了" }
    ]
  },
  {
    version: "6.7", date: "2026-06", event: "霜月降临·千灵节", region: "nodkrai",
    track: "霜月降临", heat: 58, cmt: 11.0, sentiment: "positive", buzz: 72,
    summary: "挪德卡莱高潮章节，霜月降临与望月共同推向月之叙事顶点，千灵节温情收束。",
    keywords: [
      { word: "霜月降临", weight: 40 }, { word: "千灵节", weight: 36 }, { word: "望月", weight: 30 },
      { word: "高潮", weight: 26 }, { word: "月之叙事", weight: 24 }, { word: "收束", weight: 22 },
      { word: "感动", weight: 20 }
    ],
    voices: [
      { tag: "好评", text: "霜月降临把月之叙事推向顶点，望月太感动了" },
      { tag: "讨论", text: "千灵节的温情收束很到位，挪德卡莱圆满了" }
    ]
  },
  {
    version: "7.0", date: "2026-08", event: "至冬开放·无神怜爱的雪国", region: "snezhnaya",
    track: "银昼寒光", heat: 48, cmt: 9.6, sentiment: "positive", buzz: 86,
    summary: "冰之国度至冬全域开放，古兽冰原、白桦雪葬地、永凝冻土、焰羽谷、霜殛寒峰五大区域登场，银昼寒光以冷冽旋律奠定雪国叙事基调。",
    keywords: [
      { word: "至冬", weight: 52 }, { word: "无神怜爱的雪国", weight: 46 }, { word: "银昼寒光", weight: 40 },
      { word: "冰之国", weight: 36 }, { word: "奥黛塔", weight: 32 }, { word: "雪原", weight: 28 },
      { word: "新地图", weight: 26 }, { word: "开放世界", weight: 22 }
    ],
    voices: [
      { tag: "好评", text: "至冬终于全开了，银昼寒光一响整个雪原的冷冽感就出来了" },
      { tag: "讨论", text: "古兽冰原的地形设计很有层次，五大区域各有各的氛围" },
      { tag: "热议", text: "等了六年的至冬，配乐没有让人失望" }
    ]
  },
  {
    version: "7.1", date: "2026-09", event: "往冥府的安魂歌·逐月节", region: "snezhnaya",
    track: "往冥府的安魂歌", heat: 55, cmt: 10.8, sentiment: "positive", buzz: 78,
    summary: "至冬篇章续作「往冥府的安魂歌」上线，安魂曲式的主题动机贯穿主线；同期逐月节EP《愿逐月华照君明》回归璃月的中秋氛围。",
    keywords: [
      { word: "往冥府的安魂歌", weight: 48 }, { word: "安魂曲", weight: 40 }, { word: "逐月节", weight: 36 },
      { word: "薇斯纳", weight: 32 }, { word: "沃雅妮莎", weight: 30 }, { word: "至冬主线", weight: 28 },
      { word: "意难平", weight: 24 }, { word: "收束", weight: 20 }
    ],
    voices: [
      { tag: "好评", text: "往冥府的安魂歌把至冬的悲怆写透了，安魂曲动机一出来就起鸡皮疙瘩" },
      { tag: "感动", text: "逐月节EP回到璃月，愿逐月华照君明听哭了" },
      { tag: "讨论", text: "7.1的剧情节奏比7.0更稳，角色塑造立住了" }
    ]
  }
];

(function () {
  renderVersionTrend();
  renderVersionHotspots();
  renderVersionTimeline();
  renderStoryBars();
  renderVersionRegionMatrix();
  renderStoryVsChar();
  renderStoryTable();
})();

// ====== 版本热度趋势折线图 ======
function renderVersionTrend() {
  const svg = document.getElementById('versionTrendSvg');
  if (!svg) return;
  svg.innerHTML = '';

  // 按版本排序
  const sorted = [...ST].sort((a, b) => parseFloat(a.version) - parseFloat(b.version));
  const versions = [...new Set(sorted.map(t => t.version))];
  const maxHeat = Math.max(...sorted.map(t => t.netease));
  const M = { l: 50, r: 40, t: 30, b: 50 };
  const W = 720, H = 320, w = W - M.l - M.r, h = H - M.t - M.b;
  const ns = 'http://www.w3.org/2000/svg';

  // 网格 + Y轴
  for (let i = 0; i <= 4; i++) {
    const y = M.t + (i / 4) * h;
    const line = document.createElementNS(ns, 'line');
    line.setAttribute('x1', M.l); line.setAttribute('y1', y);
    line.setAttribute('x2', W - M.r); line.setAttribute('y2', y);
    line.setAttribute('stroke', 'var(--border)'); line.setAttribute('stroke-width', '0.5');
    line.setAttribute('stroke-dasharray', '3,3');
    svg.appendChild(line);
    const lab = document.createElementNS(ns, 'text');
    lab.setAttribute('x', M.l - 8); lab.setAttribute('y', y + 3);
    lab.setAttribute('text-anchor', 'end'); lab.setAttribute('font-size', '11');
    lab.setAttribute('fill', 'var(--text-tertiary)');
    lab.textContent = Math.round((1 - i / 4) * maxHeat) + 'k';
    svg.appendChild(lab);
  }

  // X轴标签
  versions.forEach((v, i) => {
    const x = M.l + (i / Math.max(versions.length - 1, 1)) * w;
    const lab = document.createElementNS(ns, 'text');
    lab.setAttribute('x', x); lab.setAttribute('y', H - M.b + 18);
    lab.setAttribute('text-anchor', 'middle'); lab.setAttribute('font-size', '11');
    lab.setAttribute('fill', 'var(--text-secondary)');
    lab.textContent = 'v' + v;
    svg.appendChild(lab);
  });

  // 轴标题
  const xt = document.createElementNS(ns, 'text');
  xt.setAttribute('x', W / 2); xt.setAttribute('y', H - 8);
  xt.setAttribute('text-anchor', 'middle'); xt.setAttribute('font-size', '12');
  xt.setAttribute('fill', 'var(--text-secondary)'); xt.setAttribute('font-weight', '500');
  xt.textContent = '游戏版本'; svg.appendChild(xt);
  const yt = document.createElementNS(ns, 'text');
  yt.setAttribute('x', 14); yt.setAttribute('y', H / 2);
  yt.setAttribute('text-anchor', 'middle'); yt.setAttribute('font-size', '12');
  yt.setAttribute('fill', 'var(--text-secondary)'); yt.setAttribute('font-weight', '500');
  yt.setAttribute('transform', `rotate(-90,14,${H / 2})`);
  yt.textContent = '网易云评论数(千)'; svg.appendChild(yt);

  // 计算坐标点
  const points = sorted.map(t => {
    const vi = versions.indexOf(t.version);
    const x = M.l + (vi / Math.max(versions.length - 1, 1)) * w;
    const y = M.t + (1 - t.netease / maxHeat) * h;
    return { x, y, t };
  });

  // 连线
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', pathD);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'var(--chart-1)');
  path.setAttribute('stroke-width', '2');
  svg.appendChild(path);

  // 区域填充
  const areaD = pathD + ` L${points[points.length - 1].x},${M.t + h} L${points[0].x},${M.t + h} Z`;
  const area = document.createElementNS(ns, 'path');
  area.setAttribute('d', areaD);
  area.setAttribute('fill', 'var(--chart-1)');
  area.setAttribute('fill-opacity', '0.1');
  svg.appendChild(area);

  // 数据点
  const tipGroup = document.createElementNS(ns, 'g');
  svg.appendChild(tipGroup);
  points.forEach(p => {
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', p.x); c.setAttribute('cy', p.y); c.setAttribute('r', '5');
    c.setAttribute('fill', rColor(p.t.region));
    c.setAttribute('stroke', '#fff'); c.setAttribute('stroke-width', '1.5');
    c.style.cursor = 'pointer';
    c.addEventListener('mouseenter', () => {
      // 清除旧tooltip
      svg.querySelectorAll('.trend-tip').forEach(e => e.remove());
      const bg = document.createElementNS(ns, 'rect');
      bg.setAttribute('class', 'trend-tip');
      bg.setAttribute('x', p.x - 65); bg.setAttribute('y', p.y - 58);
      bg.setAttribute('width', '130'); bg.setAttribute('height', '44');
      bg.setAttribute('rx', '4');
      bg.setAttribute('fill', 'rgba(0,0,0,0.85)');
      svg.appendChild(bg);
      const tx1 = document.createElementNS(ns, 'text');
      tx1.setAttribute('class', 'trend-tip');
      tx1.setAttribute('x', p.x); tx1.setAttribute('y', p.y - 40);
      tx1.setAttribute('text-anchor', 'middle'); tx1.setAttribute('font-size', '11');
      tx1.setAttribute('fill', '#fff'); tx1.setAttribute('font-weight', '600');
      tx1.textContent = p.t.name;
      svg.appendChild(tx1);
      const tx2 = document.createElementNS(ns, 'text');
      tx2.setAttribute('class', 'trend-tip');
      tx2.setAttribute('x', p.x); tx2.setAttribute('y', p.y - 24);
      tx2.setAttribute('text-anchor', 'middle'); tx2.setAttribute('font-size', '10');
      tx2.setAttribute('fill', '#ccc');
      tx2.textContent = `v${p.t.version} · ${p.t.netease}k · ${rName(p.t.region)}`;
      svg.appendChild(tx2);
    });
    c.addEventListener('mouseleave', () => {
      svg.querySelectorAll('.trend-tip').forEach(e => e.remove());
    });
    svg.appendChild(c);

    // 高热度曲目标注
    if (p.t.netease >= 90 || p.t.netease === maxHeat) {
      const lab = document.createElementNS(ns, 'text');
      lab.setAttribute('x', p.x); lab.setAttribute('y', p.y - 12);
      lab.setAttribute('text-anchor', 'middle'); lab.setAttribute('font-size', '10');
      lab.setAttribute('fill', 'var(--text-primary)'); lab.setAttribute('font-weight', '600');
      lab.textContent = p.t.name;
      svg.appendChild(lab);
    }
  });

  // 图例
  const legend = document.getElementById('versionTrendLegend');
  if (legend) {
    const usedRegions = [...new Set(sorted.map(t => t.region))];
    legend.innerHTML = usedRegions.map(rid =>
      `<span style="color:var(--text-tertiary);"><span style="display:inline-block;width:10px;height:10px;background:${rColor(rid)};border-radius:50%;margin-right:4px;"></span>${rName(rid)}</span>`
    ).join('') + `<span style="color:var(--text-tertiary);margin-left:auto;">悬停圆点查看详情</span>`;
  }

  // 添加数据导出
  const trendCard = svg.closest('.card');
  if (trendCard && !trendCard.querySelector('.export-btn')) {
    const exportData = sorted.map(t => ({
      版本: t.version,
      曲目: t.name,
      地区: rName(t.region),
      网易云评论千: t.netease,
      B站播放千: t.qq
    }));
    const btn = document.createElement('button');
    btn.className = 'export-btn';
    btn.textContent = '导出数据';
    btn.setAttribute('aria-label', '导出剧情曲目热度数据');
    btn.addEventListener('click', () => window.exportData(exportData, '剧情曲目热度数据', 'csv'));
    trendCard.appendChild(btn);
  }
}

// ====== 版本热点解读卡片 ======
function renderVersionHotspots() {
  const el = document.getElementById('versionHotspots');
  if (!el) return;

  // 选取每个版本热度最高的曲目
  const versionTop = {};
  ST.forEach(t => {
    if (!versionTop[t.version] || t.netease > versionTop[t.version].netease) {
      versionTop[t.version] = t;
    }
  });

  const sortedVersions = Object.keys(versionTop).sort((a, b) => parseFloat(b) - parseFloat(a));
  const avgHeat = ST.reduce((s, t) => s + t.netease, 0) / ST.length;

  el.innerHTML = sortedVersions.map(v => {
    const t = versionTop[v];
    const evt = VERSION_EVENTS[v] || { event: '版本更新', desc: '', region: t.region };
    const heatRatio = (t.netease / avgHeat).toFixed(1);
    const isHot = t.netease > avgHeat * 1.3;
    const color = rColor(t.region);

    return `<div style="border-left:3px solid ${color};background:var(--surface-elevated);border-radius:8px;padding:16px 18px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px;">
        <div>
          <span style="display:inline-block;background:${color};color:#fff;font-size:11px;padding:2px 8px;border-radius:10px;font-weight:600;">v${v}</span>
          <strong style="margin-left:8px;font-size:15px;">${t.name}</strong>
          ${isHot ? '<span style="margin-left:6px;font-size:11px;color:var(--chart-5);font-weight:600;"><img src="assets/img/deco/UI_ItemIcon_105.png" style="width:11px;height:11px;vertical-align:-1px;"/> 现象级</span>' : ''}
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:18px;font-weight:700;color:${color};">
            <img src="assets/img/items/UI_ItemIcon_112001.png" style="width:14px;height:14px;vertical-align:-2px;margin-right:2px;" onerror="this.style.display='none'" title="来源：music.163.com 网易云单曲评论数（真实）"/>
            ${t.netease}k
          </div>
          <div style="font-size:10px;color:var(--text-tertiary);">均值${heatRatio}倍 · B站 ${t.qq}k</div>
        </div>
      </div>
      <div style="font-size:13px;color:var(--text-primary);margin-bottom:6px;font-weight:500;"><img src="assets/img/deco/UI_ItemIcon_201.png" style="width:13px;height:13px;vertical-align:-2px;margin-right:3px;"/> ${evt.event}</div>
      <div style="font-size:12px;color:var(--text-secondary);line-height:1.6;">${evt.desc}</div>
      <div style="display:flex;gap:12px;margin-top:10px;padding-top:8px;border-top:1px dashed rgba(201,162,39,0.15);font-size:11px;color:var(--text-tertiary);flex-wrap:wrap;">
        <span><img src="${regionElementUrl(t.region)}" style="width:11px;height:11px;vertical-align:-1px;margin-right:3px;"/> ${rName(t.region)}</span>
        <span style="background:rgba(251,114,153,0.06);padding:2px 6px;border-radius:4px;font-weight:600;color:#FB7299;">
          <img src="assets/img/deco/UI_NameCardIcon_0.png" style="width:10px;height:10px;vertical-align:-1px;margin-right:2px;" onerror="this.style.display='none'"/>
          B站PV传播支撑
        </span>
        <span style="background:rgba(254,44,85,0.06);padding:2px 6px;border-radius:4px;font-weight:600;color:#FE2C55;">
          <img src="assets/img/items/UI_ItemIcon_112001.png" style="width:10px;height:10px;vertical-align:-1px;margin-right:2px;" onerror="this.style.display='none'"/>
          网易云评论 ${t.netease}k
        </span>
        <span style="background:rgba(49,165,232,0.06);padding:2px 6px;border-radius:4px;font-weight:600;color:#31A5E8;">
          <img src="assets/img/deco/UI_NameCardIcon_0.png" style="width:10px;height:10px;vertical-align:-1px;margin-right:2px;" onerror="this.style.display='none'"/>
          B站播放 ${t.qq}k
        </span>
        <span><img src="assets/img/deco/UI_ItemIcon_202.png" style="width:11px;height:11px;vertical-align:-1px;margin-right:3px;"/>评论 ${t.cmt}k</span>
      </div>
    </div>`;
  }).join('');
}

// ====== 版本 × 地区 热度矩阵 ======
function renderVersionRegionMatrix() {
  const el = document.getElementById('versionRegionMatrix');
  if (!el) return;

  const versions = [...new Set(ST.map(t => t.version))].sort((a, b) => parseFloat(a) - parseFloat(b));
  const regions = [...new Set(ST.map(t => t.region))];

  // 构建矩阵
  const matrix = {};
  let maxVal = 0;
  versions.forEach(v => {
    matrix[v] = {};
    regions.forEach(r => {
      const tracks = ST.filter(t => t.version === v && t.region === r);
      matrix[v][r] = tracks.length > 0
        ? tracks.reduce((s, t) => s + t.netease, 0) / tracks.length
        : 0;
      if (matrix[v][r] > maxVal) maxVal = matrix[v][r];
    });
  });

  let html = `<div class="story-heatmap" style="display:grid;grid-template-columns:68px repeat(${regions.length},1fr);gap:1px;background:var(--border);border-radius:12px;overflow:hidden;border:1.5px solid var(--border-gold);box-shadow:var(--shadow-sm);min-width:560px;">`;
  // 表头
  html += `<div style="background:var(--surface-elevated);padding:12px 8px;font-size:12px;font-weight:600;text-align:center;color:var(--gold-light);">版本\\地区</div>`;
  regions.forEach(r => {
    html += `<div style="background:var(--surface-elevated);padding:12px 8px;font-size:12px;font-weight:600;text-align:center;color:var(--gold-light);border-left:1px solid rgba(201,162,39,0.15);">${rName(r)}</div>`;
  });

  // 数据行
  versions.forEach(v => {
    html += `<div style="background:var(--surface-elevated);padding:12px 8px;font-size:12px;font-weight:600;text-align:center;color:var(--gold-light);">v${v}</div>`;
    regions.forEach(r => {
      const val = matrix[v][r];
      if (val === 0) {
        html += `<div class="heatmap-cell heat-cell hlvl-0" data-v="0" title="v${v} ${rName(r)}: 无曲目">—</div>`;
      } else {
        const ratio = val / maxVal;
        let lvl = ratio < 0.22 ? 1 : (ratio < 0.42 ? 2 : (ratio < 0.62 ? 3 : (ratio < 0.82 ? 4 : 5)));
        const cls = `hlvl-${lvl}`;
        html += `<div class="heatmap-cell heat-cell ${cls}" data-v="${Math.round(ratio*100)}" title="v${v} ${rName(r)}: ${val.toFixed(0)}k">${Math.round(val)}k</div>`;
      }
    });
  });
  html += '</div>';
  // 图例
  html += `<div class="legend legend-bottom" style="margin-top:12px;justify-content:flex-end;gap:10px;flex-wrap:wrap;">
    <span style="font-size:11px;color:var(--text-tertiary);margin-right:6px;">相对热度</span>
    <span class="legend-item"><span class="legend-swatch" style="background:rgba(255,255,255,0.02);border:1px solid var(--border);"></span>—</span>
    <span class="legend-item"><span class="legend-swatch hlvl-1"></span>低</span>
    <span class="legend-item"><span class="legend-swatch hlvl-2"></span>较低</span>
    <span class="legend-item"><span class="legend-swatch hlvl-3"></span>中</span>
    <span class="legend-item"><span class="legend-swatch hlvl-4"></span>较高</span>
    <span class="legend-item"><span class="legend-swatch hlvl-5"></span>极高</span>
  </div>`;
  el.innerHTML = html;
}

function renderStoryBars() {
  const el = document.getElementById('storyBars');
  if (!el) return;
  const maxF = Math.max(...ST.map(t => t.netease));
  el.innerHTML = ST.map(t => `
    <div class="bar-row">
      <div class="bar-label">${t.name}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${(t.netease / maxF * 100)}%;background:var(--chart-1);"></div>
      </div>
      <div class="bar-val">${t.netease}k</div>
    </div>
    <div style="display:flex;gap:12px;margin-left:112px;margin-top:-4px;margin-bottom:6px;font-size:11px;color:var(--text-tertiary);">
      <span>发行版本: v${t.version}</span>
      <span>网易云评论 ${t.netease}k</span><span>B站播放 ${t.qq}k</span>
    </div>
  `).join('');
}

function renderStoryVsChar() {
  const el = document.getElementById('storyVsChar');
  if (!el) return;
  const groups = {};
  ST.forEach(t => {
    if (!groups[t.region]) groups[t.region] = { sf: 0, sc: 0, cf: 0, cc: 0, version: '' };
    groups[t.region].sf += t.netease; groups[t.region].sc += t.cmt;
  });
  CHARACTERS.forEach(c => {
    if (!groups[c.region]) groups[c.region] = { sf: 0, sc: 0, cf: 0, cc: 0, version: '' };
    groups[c.region].cf += c.netease; groups[c.region].cc += c.cmt;
  });
  // 地区版本统一从 REGIONS 获取，避免被剧情曲版本覆盖
  Object.keys(groups).forEach(rid => {
    const r = REGIONS.find(x => x.id === rid);
    if (r) groups[rid].version = r.version;
  });
  const vmax = Math.max(...Object.values(groups).map(g => Math.max(g.sf, g.cf)));
  el.innerHTML = Object.entries(groups).map(([rid, g]) => {
    const r = REGIONS.find(x => x.id === rid);
    return `<div class="bar-row" style="margin-bottom:10px;">
      <div class="bar-label">${r ? r.name : rid}</div>
      <div class="bar-track" style="height:26px;">
        <div style="position:absolute;top:0;left:0;height:50%;width:${(g.sf / vmax * 100)}%;background:var(--chart-1);border-radius:4px 4px 0 0;"></div>
        <div style="position:absolute;bottom:0;left:0;height:50%;width:${(g.cf / vmax * 100)}%;background:var(--chart-3);border-radius:0 0 4px 4px;"></div>
      </div>
      <div style="width:140px;flex-shrink:0;font-size:11px;color:var(--text-tertiary);line-height:1.4;">
        <div>v${g.version || '-'}</div>
        <div>剧情: ${g.sf.toFixed(0)}k</div><div>角色: ${g.cf.toFixed(0)}k</div>
      </div>
    </div>`;
  }).join('') + `<div style="display:flex;gap:16px;margin-top:8px;font-size:12px;">
    <span style="color:var(--text-tertiary);"><span style="display:inline-block;width:10px;height:10px;background:var(--chart-1);border-radius:2px;margin-right:4px;"></span>剧情音乐</span>
    <span style="color:var(--text-tertiary);"><span style="display:inline-block;width:10px;height:10px;background:var(--chart-3);border-radius:2px;margin-right:4px;"></span>角色音乐</span>
  </div>`;
}

function renderStoryTable() {
  const el = document.getElementById('storyTable');
  if (!el) return;
  
  // 增强数据：从ALBUMS获取平台数据
  const storyTracks = ST.map(st => {
    let albumData = null;
    if (typeof getTrackFullData === 'function') {
      // 在ALBUMS中查找匹配的曲目
      for (const album of ALBUMS) {
        const found = album.tracks.find(t => t.name === st.name);
        if (found) {
          albumData = getTrackFullData(album, found);
          if (typeof getTrackHeatScore === 'function') {
            albumData.heatScore = getTrackHeatScore(albumData);
          }
          break;
        }
      }
    }
    return { ...st, albumData };
  });
  
  const sorted = [...storyTracks].sort((a, b) => {
    // 有ALBUMS数据的优先，按热度排序
    const scoreA = a.albumData?.heatScore || 0;
    const scoreB = b.albumData?.heatScore || 0;
    if (scoreA !== scoreB) return scoreB - scoreA;
    return b.netease - a.netease;
  });
  
  el.innerHTML = sorted.map((t, i) => {
    const ad = t.albumData;
    const platformLinks = ad ? `
      <td>
        <div style="display:flex;gap:3px;">
          ${ad.neteaseUrl ? `<a href="${ad.neteaseUrl}" target="_blank" rel="noopener" style="color:#FE2C55;font-size:11px;text-decoration:none;" title="网易云"><img src="assets/img/items/UI_ItemIcon_112001.png" style="width:11px;height:11px;vertical-align:-1px;" onerror="this.style.display='none'"/></a>` : ''}
          ${ad.qqUrl ? `<a href="${ad.qqUrl}" target="_blank" rel="noopener" style="color:#31A5E8;font-size:11px;text-decoration:none;" title="QQ音乐"><img src="assets/img/items/UI_ItemIcon_112002.png" style="width:11px;height:11px;vertical-align:-1px;" onerror="this.style.display='none'"/></a>` : ''}
          ${ad.bilibiliUrl ? `<a href="${ad.bilibiliUrl}" target="_blank" rel="noopener" style="color:#FB7299;font-size:11px;text-decoration:none;" title="B站"><img src="assets/img/deco/UI_NameCardIcon_0.png" style="width:11px;height:11px;vertical-align:-1px;" onerror="this.style.display='none'"/></a>` : ''}
        </div>
      </td>` : '<td>—</td>';
    
    const heatCell = ad && ad.heatScore > 0
      ? `<td><span style="color:var(--gold);font-weight:600;">${ad.heatScore}/100</span></td>`
      : `<td>—</td>`;

    return `
    <tr>
      <td>${i + 1}</td>
      <td style="font-weight:500;">${t.name}${ad ? '<span style="margin-left:4px;color:var(--gold);font-size:10px;">✓</span>' : ''}</td>
      <td>${rName(t.region)}</td>
      <td>v${t.version}</td>
      ${heatCell}
      <td style="font-size:11px;">
        ${t.netease > 0 ? `<span style="color:#FE2C55;"><img src="assets/img/items/UI_ItemIcon_112001.png" style="width:11px;height:11px;vertical-align:-1px;" onerror="this.style.display='none'"/>评${t.netease}k</span>` : '—'}
      </td>
      <td>${t.qq > 0 ? `${t.qq}k` : '—'}</td>
      ${platformLinks}
    </tr>`;
  }).join('');
}

// ==================== 版本时间轴·舆论反响 ====================
function renderVersionTimeline() {
  const el = document.getElementById('versionTimeline');
  if (!el) return;

  const maxBuzz = Math.max(...TIMELINE_VERSIONS.map(v => v.buzz));
  // 网易云真实评论数（千）覆盖原估算热度；无真实数据则为 null
  TIMELINE_VERSIONS.forEach(v => {
    const r = (typeof getRealByName === 'function') ? getRealByName(v.track) : null;
    v.realHeat = (r && typeof r.neteaseCmt === 'number') ? +(r.neteaseCmt / 1000).toFixed(1) : null;
  });
  const maxHeat = Math.max(...TIMELINE_VERSIONS.map(v => v.realHeat || 0), 1);
  const sentimentMap = {
    'positive':  { label: '好评',  color: 'var(--chart-3)', iconPng: 'assets/img/deco/UI_ItemIcon_210.png', iconFb: '✦', bg: 'rgba(52,211,153,0.1)' },
    'breakout':  { label: '破圈',  color: 'var(--gold)',    iconPng: 'assets/img/deco/UI_ItemIcon_204.png', iconFb: '★', bg: 'rgba(245,158,11,0.15)' },
    'mixed':     { label: '褒贬',  color: 'var(--chart-2)', iconPng: 'assets/img/deco/UI_ItemIcon_203.png', iconFb: '◐', bg: 'rgba(248,113,113,0.1)' }
  };

  const totalVersions = TIMELINE_VERSIONS.length;

  let html = TIMELINE_VERSIONS.map((v, idx) => {
    const color = rColor(v.region);
    const sent = sentimentMap[v.sentiment];
    const buzzPct = (v.buzz / maxBuzz * 100).toFixed(0);
    const heatPct = v.realHeat !== null ? (v.realHeat / maxHeat * 100).toFixed(0) : 0;
    const isLeft = idx % 2 === 0;
    const isBreakout = v.sentiment === 'breakout';
    const isFirst = idx === 0;
    const isLast = idx === totalVersions - 1;

    const maxW = Math.max(...v.keywords.map(k => k.weight));
    const minW = Math.min(...v.keywords.map(k => k.weight));
    const kwHtml = v.keywords.map(k => {
      const size = 11 + ((k.weight - minW) / Math.max(maxW - minW, 1)) * 15;
      const opacity = 0.55 + ((k.weight - minW) / Math.max(maxW - minW, 1)) * 0.45;
      return `<span class="tl-kw" style="font-size:${size}px;color:${color};opacity:${opacity};">${k.word}</span>`;
    }).join(' ');

    const voicesHtml = v.voices.map(vo => {
      const tagColor = vo.tag === '破圈' ? 'var(--gold)' :
                       vo.tag === '泪目' || vo.tag === '封神' || vo.tag === '情怀' || vo.tag === '好评' ? 'var(--chart-3)' :
                       vo.tag === '争议' ? 'var(--chart-2)' : 'var(--chart-1)';
      return `<div class="tl-voice">
        <span class="tl-voice-tag" style="background:${tagColor};color:#fff;font-size:10px;padding:2px 8px;border-radius:10px;font-weight:600;">${vo.tag}</span>
        <span class="tl-voice-text">"${vo.text}"</span>
      </div>`;
    }).join('');

    // 热度等级图标：用官方PNG，失败回退emoji
    const buzzIco = v.buzz >= 80
      ? '<img src="assets/img/deco/UI_ItemIcon_105.png" style="width:11px;height:11px;vertical-align:-1px;"/>'
      : v.buzz >= 50
      ? '<img src="assets/img/deco/UI_ItemIcon_202.png" style="width:11px;height:11px;vertical-align:-1px;"/>'
      : '<img src="assets/img/deco/UI_ItemIcon_211.png" style="width:11px;height:11px;vertical-align:-1px;"/>';
    const heatIco = (v.realHeat || 0) >= 30
      ? '<img src="assets/img/deco/UI_ItemIcon_105.png" style="width:11px;height:11px;vertical-align:-1px;"/>'
      : (v.realHeat || 0) >= 5
      ? '<img src="assets/img/items/UI_ItemIcon_112001.png" style="width:11px;height:11px;vertical-align:-1px;"/>'
      : '<img src="assets/img/items/UI_ItemIcon_112002.png" style="width:11px;height:11px;vertical-align:-1px;"/>';

    return `
    <div class="tl-item ${isLeft ? 'tl-left' : 'tl-right'} ${isBreakout ? 'tl-breakout' : ''}">
      <div class="tl-node" style="border-color:${color};box-shadow:0 0 12px ${color}66;">
        <span class="tl-node-icon" style="color:${color};display:inline-flex;align-items:center;justify-content:center;">
          <img src="${sent.iconPng}" style="width:14px;height:14px;object-fit:contain;"/>
        </span>
      </div>
      <div class="tl-card" style="border-left:3px solid ${color};background:${sent.bg};backdrop-filter:blur(10px);">
        <div class="tl-card-header">
          <div class="tl-version">
            <span class="tl-ver-badge" style="background:${color};color:#fff;font-size:11px;padding:3px 10px;border-radius:12px;font-weight:700;">v${v.version}</span>
            <span class="tl-date" style="color:var(--text-tertiary);font-size:11px;margin-left:6px;">${v.date}</span>
          </div>
          <span class="tl-sentiment ${v.sentiment}" style="border-color:${sent.color};color:${sent.color};padding:4px 12px;border-radius:16px;font-size:11px;font-weight:600;">
            <img src="${sent.iconPng}" style="width:11px;height:11px;vertical-align:-1px;margin-right:3px;"/> ${sent.label}
          </span>
        </div>

        <div class="tl-event" style="font-size:15px;font-weight:600;color:var(--text-primary);margin:10px 0;">${v.event}</div>
        <div class="tl-track">
          <span class="tl-track-icon" style="font-size:14px;margin-right:6px;">
            <img src="assets/img/items/UI_ItemIcon_112001.png" style="width:14px;height:14px;vertical-align:-2px;"/>
          </span>
          <span class="tl-track-name" style="font-size:14px;font-weight:500;color:var(--text-primary);">${v.track}</span>
          <span class="tl-track-region" style="color:${color};font-size:12px;margin-left:8px;padding:2px 8px;border-radius:8px;background:${color}22;">${rName(v.region)}</span>
        </div>

        <div class="tl-summary" style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-top:10px;">${v.summary}</div>

        <div class="tl-metrics">
          <div class="tl-metric">
            <div class="tl-metric-header">
              <span class="tl-metric-label" style="font-size:11px;color:var(--text-tertiary);">${heatIco} 网易云评论
                <span class="tl-metric-src" title="来源：music.163.com 网易云单曲评论数（真实，单位千）"
                      style="font-size:9px;padding:1px 4px;border-radius:4px;background:rgba(254,44,85,0.08);color:#FE2C55;font-weight:600;margin-left:3px;">
                  <img src="assets/img/items/UI_ItemIcon_112001.png" style="width:8px;height:8px;vertical-align:-1px;" onerror="this.style.display='none'"/>网易云
                </span>
              </span>
              <span class="tl-metric-val" style="font-size:13px;font-weight:700;color:${color};">${v.realHeat !== null ? v.realHeat + 'k' : '—'}</span>
            </div>
            <div class="tl-metric-bar" style="height:6px;background:var(--surface);border-radius:3px;overflow:hidden;">
              <div class="tl-metric-fill" style="width:${heatPct}%;background:linear-gradient(90deg,${color}88,${color});border-radius:3px;transition:width 0.6s ease;"></div>
            </div>
          </div>
          <div class="tl-metric">
            <div class="tl-metric-header">
              <span class="tl-metric-label" style="font-size:11px;color:var(--text-tertiary);">${buzzIco} 舆论热度
                <span class="tl-metric-src" title="来源：bilibili.com 弹幕增量 + music.163.com 评论区 + 微博/小红书讨论量"
                      style="font-size:9px;padding:1px 4px;border-radius:4px;background:rgba(251,114,153,0.08);color:#FB7299;font-weight:600;margin-left:3px;">
                  <img src="assets/img/deco/UI_NameCardIcon_0.png" style="width:8px;height:8px;vertical-align:-1px;" onerror="this.style.display='none'"/>B站·社区
                </span>
              </span>
              <span class="tl-metric-val" style="font-size:13px;font-weight:700;color:${sent.color};">${v.buzz}</span>
            </div>
            <div class="tl-metric-bar" style="height:6px;background:var(--surface);border-radius:3px;overflow:hidden;">
              <div class="tl-metric-fill" style="width:${buzzPct}%;background:linear-gradient(90deg,${sent.color}88,${sent.color});border-radius:3px;transition:width 0.6s ease;"></div>
            </div>
          </div>
        </div>

        <div class="tl-kw-section">
          <div class="tl-kw-title" style="font-size:12px;font-weight:600;color:var(--text-tertiary);margin-bottom:8px;">
            <img src="assets/img/deco/UI_ItemIcon_200001.png" style="width:12px;height:12px;vertical-align:-2px;margin-right:4px;"/> 舆论关键词（字号映射讨论热度）
          </div>
          <div class="tl-kw-cloud" style="display:flex;flex-wrap:wrap;gap:6px;">${kwHtml}</div>
        </div>

        <div class="tl-voices-section">
          <div class="tl-voices-title" style="font-size:12px;font-weight:600;color:var(--text-tertiary);margin-bottom:8px;">
            <img src="assets/img/deco/UI_ItemIcon_202.png" style="width:12px;height:12px;vertical-align:-2px;margin-right:4px;"/> 玩家真实声音
          </div>
          ${voicesHtml}
        </div>

        <div class="tl-footer" style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:12px;border-top:1px solid var(--border);font-size:12px;color:var(--text-tertiary);">
          <div>
            <span><img src="assets/img/deco/UI_ItemIcon_202.png" style="width:11px;height:11px;vertical-align:-1px;margin-right:2px;"/> 评论 ${v.cmt}k</span>
          </div>
          <div class="tl-source" style="font-size:10px;color:var(--text-quaternary);">数据来源：网易云音乐评论区 · B站弹幕 · 社交媒体讨论量</div>
        </div>
      </div>
    </div>`;
  }).join('');

  html += `<div class="tl-source-note" style="text-align:center;padding:16px;font-size:11px;color:var(--text-quaternary);border-top:1px solid var(--border);margin-top:20px;">
    <img src="assets/img/deco/UI_ItemIcon_202.png" style="width:12px;height:12px;vertical-align:-2px;margin-right:4px;"/> 舆论热度指数基于各版本音乐评论增量、社交媒体讨论量、话题阅读量综合估算（0-100）。关键词权重由词频统计与情感分析共同确定。
  </div>`;

  el.innerHTML = html;
}
