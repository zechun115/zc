// ==================== 剧情场景页 ====================
// 缺失指标始终保留为 null；真实 0 是有效观测，不与缺失混同。
const storyIsNumber = v => typeof v === 'number' && Number.isFinite(v);
const storyMedian = values => {
  const valid = (values || []).filter(storyIsNumber);
  return valid.length && typeof statMedian === 'function' ? statMedian(valid) : null;
};
const storyFmtK = value => {
  if (!storyIsNumber(value)) return '—';
  const fixed = value.toFixed(1);
  return `${fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed}k`;
};
const storyFmtWan = value => storyIsNumber(value) ? `${value.toFixed(1)}万` : '—';

// 剧情页独立提示层，避免依赖其他页面脚本。
let storyTipEl = null;
function storyShowTip(x, y, html) {
  if (!storyTipEl) {
    storyTipEl = document.createElement('div');
    storyTipEl.style.cssText = 'position:fixed;z-index:9999;max-width:280px;padding:12px 14px;background:var(--surface-elevated,#1a1712);border:1px solid var(--border-gold,#c9a22788);border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.35);font-size:12px;line-height:1.6;color:var(--text-primary,#f5f0e6);pointer-events:none;';
    document.body.appendChild(storyTipEl);
  }
  storyTipEl.innerHTML = `<div style="font-weight:700;color:var(--gold-light,#e6c86e);margin-bottom:6px;">${html.title || ''}</div>` +
    (html.items || []).map(([k, v]) => `<div style="display:flex;justify-content:space-between;gap:14px;"><span style="color:var(--text-tertiary,#a79f92);">${k}</span><span>${v}</span></div>`).join('');
  storyTipEl.style.display = 'block';
  const tw = storyTipEl.offsetWidth || 260, th = storyTipEl.offsetHeight || 100;
  storyTipEl.style.left = Math.min(window.innerWidth - tw - 10, x + 12) + 'px';
  storyTipEl.style.top = Math.min(window.innerHeight - th - 10, y + 12) + 'px';
}
function storyHideTip() {
  if (storyTipEl) storyTipEl.style.display = 'none';
}

// 与 getRealByName 使用同一套专辑曲名匹配规则，结果在 ST 初始化时复用。
function findStoryAlbumData(name) {
  if (typeof ALBUMS === 'undefined' || typeof getTrackFullData !== 'function') return null;
  const n = (name || '').trim();
  for (const album of ALBUMS) {
    const track = album.tracks.find(x => x.name === n || (x.name.split(' ')[0] || '') === n);
    if (track && track.ncmId && typeof TRACK_REAL !== 'undefined' && TRACK_REAL[track.ncmId]) {
      return getTrackFullData(album, track);
    }
  }
  return null;
}

// netease/cmt 为网易云评论数（千），biliK 为 B站相关视频播放量（千）；原始计数同时保留。
const ST = ((typeof STORY_TRACKS !== 'undefined' ? STORY_TRACKS : null) || []).map(t => {
  const r = (typeof getRealByName === 'function') ? getRealByName(t.name) : null;
  const neteaseCmt = r && storyIsNumber(r.neteaseCmt) ? r.neteaseCmt : null;
  const biliPlay = r && storyIsNumber(r.biliPlay) ? r.biliPlay : null;
  const fav = r && typeof r.neteaseFav === 'string' ? r.neteaseFav : null;
  const albumData = findStoryAlbumData(t.name);
  const heatScore = typeof getTrackHeatScore === 'function'
    ? getTrackHeatScore({ neteaseCmt, biliPlay, neteaseFav: fav })
    : 0;
  if (albumData) albumData.heatScore = heatScore;
  return {
    ...t,
    neteaseCmt,
    biliPlay,
    netease: storyIsNumber(neteaseCmt) ? neteaseCmt / 1000 : null,
    biliK: storyIsNumber(biliPlay) ? biliPlay / 1000 : null,
    cmt: storyIsNumber(neteaseCmt) ? neteaseCmt / 1000 : null,
    fav,
    albumData,
    heatScore
  };
});

// 版本节点说明：event 为版本主题（与 STORY_TRACKS 中的曲目对应），
// desc 只陈述本项目数据里能核实的曲目名与该版本专辑，不写数据外的剧情细节。
const VERSION_EVENTS = {
  "1.2": { event: "龙脊雪山开放", desc: "剧情曲《天穹的牧歌》；对应专辑《漩涡、落星与冰山》（蒙德场景 OST，17 首）", region: "mondstadt" },
  "1.5": { event: "优菈登场 · 尘歌壶上线", desc: "剧情曲《岩壑之崩》；该版本在已收录的 43 张专辑中没有对应发行", region: "liyue" },
  "2.4": { event: "海灯节 · 云堇京剧", desc: "剧情曲《神女劈观》；对应《佚落迁忘之岛》（稻妻场景 OST，60 首）与《飞彩镌流年》EP（3 首，含该曲人声与器乐两版）。此处仅作背景说明，传播结论不由本页统计生成", region: "liyue" },
  "2.5": { event: "稻妻主线推进", desc: "剧情曲《哀息之茧》；该版本在已收录专辑中没有对应发行", region: "inazuma" },
  "3.0": { event: "须弥开放 · 森林书", desc: "剧情曲《大梦的曲调》；对应《智妙明论之林》（须弥场景 OST，100 首）与《闪耀的群星3》（26 首）", region: "sumeru" },
  "4.2": { event: "枫丹主线高潮", desc: "剧情曲《轻涟》；对应 EP《轻涟 La vaguelette》（2 首）", region: "fontaine" },
  "4.3": { event: "枫丹篇章收束", desc: "剧情曲《咏歌与凯旋》；对应《万流始源之海》（枫丹场景 OST，68 首）", region: "fontaine" },
  "5.0": { event: "纳塔开放 · 还魂诗", desc: "剧情曲《炽烈的还魂诗》；对应《炽炎交逐之原》（纳塔场景 OST，78 首）与《闪耀的群星5》（32 首）", region: "natlan" },
  "6.0": { event: "挪德卡莱开放", desc: "剧情曲《空月之歌》；对应《幽暮衬映之月》（挪德卡莱场景 OST，97 首）", region: "nodkrai" },
  "6.4": { event: "法尔伽远征 · 北风", desc: "剧情曲《月之终曲》《北风凯歌》《捕风的归客》；对应《霄灯映明月》EP（9 首）", region: "mondstadt" },
  "6.7": { event: "霜月降临 · 千灵节", desc: "剧情曲《千灵节序曲》《望月》《霜月降临》；该版本在已收录专辑中没有对应发行", region: "nodkrai" },
  "7.0": { event: "至冬开放 · 无神怜爱的雪国", desc: "剧情曲《无神怜爱的雪国》《银昼寒光》《黑雪鹄的夜梦》；对应《悯宥慈怜之垠》（至冬 EP，102 首）", region: "snezhnaya" },
  "7.1": { event: "往冥府的安魂歌 · 逐月节", desc: "剧情曲《往冥府的安魂歌》《琴弦呀琴弦》《愿逐月华照君明》；对应 EP《愿逐月华照君明》（3 首）", region: "snezhnaya" }
};

// ==================== 版本时间轴数据（真实指标驱动） ====================
// 各版本上线时间与主题事件（官方公开版本节点），用于时间轴排序与事件标注
// 曲目、网易云评论、B站播放等指标全部在渲染时从 ST（真实采集数据）中读取，不预设任何模拟值
const VERSION_DATES = {
  '1.2':'2020-12','1.5':'2021-04','2.4':'2022-01','2.5':'2022-02','3.0':'2022-08',
  '4.2':'2023-11','4.3':'2023-12','5.0':'2024-08','6.0':'2025-04','6.4':'2025-10',
  '6.7':'2026-06','7.0':'2026-08','7.1':'2026-09'
};

(function () {
  renderStoryKpis();
  renderStoryConclusions();
  renderVersionTrend();
  renderVersionHotspots();
  renderVersionTimeline();
  renderStoryBars();
  renderVersionRegionMatrix();
  renderStoryVsChar();
  renderStoryTable();
})();

// ====== 顶部 KPI：先给出样本规模，再谈结论 ======
function renderStoryKpis() {
  const el = document.getElementById('storyKpis');
  if (!el) return;
  const defined = ST.length;
  const cmtValid = ST.filter(t => storyIsNumber(t.neteaseCmt));
  const playValid = ST.filter(t => storyIsNumber(t.biliPlay));
  const favValid = ST.filter(t => t.fav);
  const cmtSum = cmtValid.reduce((s, t) => s + t.neteaseCmt, 0);
  const playSum = playValid.reduce((s, t) => s + t.biliPlay, 0);
  const versions = new Set(ST.map(t => t.version)).size;
  const medCmt = storyMedian(cmtValid.map(t => t.neteaseCmt));

  const cards = [
    { icon: 'assets/img/deco/UI_ItemIcon_210.png', v: defined, l: '剧情曲定义数', tip: 'STORY_TRACKS 中定义的剧情曲总数' },
    { icon: 'assets/img/items/UI_ItemIcon_112001.png', v: cmtValid.length, l: '评论有效 n', tip: `网易云评论有实测值的曲目数${defined > cmtValid.length ? `（缺失 ${defined - cmtValid.length} 首不按 0 计）` : ''}` },
    { icon: 'assets/img/deco/UI_NameCardIcon_0.png', v: playValid.length, l: 'B站播放有效 n', tip: 'B站相关视频有实测播放量的曲目数' },
    { icon: 'assets/img/items/UI_ItemIcon_202.png', v: fmt(cmtSum), l: '评论总量', tip: `仅累计 ${cmtValid.length} 首有效样本；总播放 ${playSum ? fmt(playSum) : '—'}` },
    { icon: 'assets/img/items/UI_ItemIcon_201.png', v: versions, l: '覆盖版本数', tip: `红心实测 ${favValid.length} 首（客户端 UI 粗粒度标签）` },
    { icon: 'assets/img/deco/UI_ItemIcon_105.png', v: medCmt === null ? '—' : fmt(Math.round(medCmt)), l: '评论中位数', tip: `全样本 ${cmtValid.length} 首有效评论的中位数，代表典型水平` }
  ];
  el.innerHTML = cards.map(c => `
    <div class="kpi-card" title="${c.tip}">
      <div class="kpi-icon"><img src="${c.icon}" onerror="this.style.display='none'" class="kpi-icon-img" alt=""></div>
      <div class="kpi-content">
        <div class="kpi-value">${c.v}</div>
        <div class="kpi-label">${c.l}</div>
      </div>
    </div>`).join('');
}

// ====== 核心结论：由当前数据动态计算，随数据变化 ======
function renderStoryConclusions() {
  const el = document.getElementById('storyConclusions');
  if (!el) return;
  const cmtValid = ST.filter(t => storyIsNumber(t.neteaseCmt));
  const playValid = ST.filter(t => storyIsNumber(t.biliPlay));
  const items = [];
  const push = (title, body) => items.push(`<li class="an-concl-item"><span class="cc-idx">${items.length + 1}</span><span class="cc-body"><span class="cc-title">${title}</span>${body}</span></li>`);

  if (cmtValid.length) {
    const sum = cmtValid.reduce((s, t) => s + t.neteaseCmt, 0);
    const med = storyMedian(cmtValid.map(t => t.neteaseCmt));
    const top = [...cmtValid].sort((a, b) => b.neteaseCmt - a.neteaseCmt)[0];
    const topShare = sum > 0 ? (top.neteaseCmt / sum * 100) : null;
    const ratio = med ? (top.neteaseCmt / med) : null;
    push('剧情曲评论分布极度右偏，单一曲目主导总量',
      `评论最高的《${top.name}》为 <em>${fmt(top.neteaseCmt)}</em>，是全样本中位数（${med === null ? '—' : fmt(Math.round(med))}）的 <em>${ratio === null ? '—' : Math.round(ratio)} 倍</em>` +
      `${topShare !== null ? `，一首曲子就占全部有效样本评论总量的 <em>${topShare.toFixed(1)}%</em>` : ''}。` +
      `均值会被这一首拉高，因此本页版本聚合与分组比较一律使用<em>中位数</em>，榜单阅读时也应注意头部曲目的支配地位。`);
  }

  const defined = ST.length;
  const noCmt = defined - cmtValid.length;
  const noPlay = defined - playValid.length;
  const both = ST.filter(t => storyIsNumber(t.neteaseCmt) && storyIsNumber(t.biliPlay)).length;
  push('两个平台的覆盖范围不对齐，不能交叉填充',
    `${defined} 首剧情曲中，评论有效 <em>${cmtValid.length}</em> 首（缺失 ${noCmt} 首）、B站播放有效 <em>${playValid.length}</em> 首（缺失 ${noPlay} 首），两项同时有效仅 <em>${both}</em> 首。` +
    `缺失一律显示“—”而不按 0 处理，评论榜与播放榜也各自只在其有效样本内排序；两榜名次不能互相比较或拼合。`);

  const byVersion = {};
  cmtValid.forEach(t => { byVersion[t.version] = (byVersion[t.version] || 0) + 1; });
  const vEntries = Object.entries(byVersion);
  const n1 = vEntries.filter(([, c]) => c === 1).length;
  const maxN = vEntries.reduce((m, [, c]) => Math.max(m, c), 0);
  if (vEntries.length) {
    push('版本聚合的样本很小，跨版本比较只作描述',
      `${vEntries.length} 个有有效评论的版本中，<em>${n1} 个</em>版本仅有 1 首有效样本（最多 n=${maxN}）。` +
      `n=1 时“版本中位数”就是那一首曲子本身，不反映该版本整体；因此本页把图表明确称为<em>单次快照</em>，不做版本热度升降或趋势判断。`);
  }

  if (playValid.length && typeof REGIONS !== 'undefined') {
    // 找单条内容中位数差距最大的地区，作为描述性对照的例子
    let best = null;
    REGIONS.forEach(region => {
      const sVals = ST.filter(t => t.region === region.id && storyIsNumber(t.biliPlay)).map(t => t.biliPlay);
      const cVals = CHARACTERS.filter(c => c.region === region.id && storyIsNumber(c.pv)).map(c => c.pv * 10000);
      if (sVals.length >= 2 && cVals.length >= 3) {
        const sm = statMedian(sVals), cm = statMedian(cVals);
        const hi = Math.max(sm, cm), lo = Math.min(sm, cm);
        if (lo > 0 && (!best || hi / lo > best.ratio)) best = { name: region.name, sm, cm, ratio: hi / lo, hiIsStory: sm > cm };
      }
    });
    push('与角色视频的对照是描述性的，两侧样本来源不同',
      `同一地区内，剧情曲与官方角色视频的单条内容播放中位数分属两个集合（人工选择的剧情曲 vs 官方角色视频），选择机制不同、n 也不同。` +
      (best ? `差距最明显的是${best.name}：${best.hiIsStory ? '剧情曲' : '角色视频'}中位数（${fmt(Math.round(best.hiIsStory ? best.sm : best.cm))}）约为另一侧（${fmt(Math.round(best.hiIsStory ? best.cm : best.sm))}）的 <em>${best.ratio.toFixed(1)} 倍</em>，` : '') +
      `但这只描述当前两组内容的差异，<em>不能</em>推断剧情音乐与角色内容谁传播更强。`);
  }

  el.innerHTML = `<ol class="an-concl-list">${items.join('')}</ol>` +
    `<div class="ds-note" style="margin-top:10px;">以上结论全部由当前数据动态计算（n=${defined}，评论有效 n=${cmtValid.length}）；数据更新后数值与措辞会随之变化，不含任何人工设定的固定数值。</div>`;
}


// ====== 各版本入选剧情曲的当前评论快照对比 ======
function renderVersionTrend() {
  const svg = document.getElementById('versionTrendSvg');
  if (!svg) return;
  svg.innerHTML = '';

  // 单次快照：每个版本聚合为「有效评论中位数」，不使用同一版本多首曲目依次连线。
  const versions = [...new Set(ST.map(t => t.version))]
    .filter(v => ST.some(t => t.version === v && storyIsNumber(t.neteaseCmt)))
    .sort((a, b) => parseFloat(a) - parseFloat(b));
  const versionStats = versions.map(v => {
    const tracks = ST.filter(t => t.version === v);
    const valid = tracks.filter(t => storyIsNumber(t.neteaseCmt));
    const vals = valid.map(t => t.neteaseCmt);
    const regions = [...new Set(tracks.map(t => t.region))];
    return {
      version: v,
      val: vals.length ? statMedian(vals) / 1000 : 0,
      n: vals.length,
      trackCount: tracks.length,
      zeroCount: vals.filter(x => x === 0).length,
      region: regions[0] || 'other'
    };
  });
  if (!versionStats.length) {
    svg.innerHTML = `<text x="360" y="160" text-anchor="middle" font-size="13" fill="var(--text-tertiary)">暂无可核实的剧情曲评论数据</text>`;
    return;
  }
  const maxHeat = Math.max(...versionStats.map(t => t.val), 1);
  const M = { l: 58, r: 30, t: 34, b: 55 };
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
  versionStats.forEach((d, i) => {
    const x = M.l + ((i + 0.5) / versionStats.length) * w;
    const lab = document.createElementNS(ns, 'text');
    lab.setAttribute('x', x); lab.setAttribute('y', H - M.b + 18);
    lab.setAttribute('text-anchor', 'middle'); lab.setAttribute('font-size', '11');
    lab.setAttribute('fill', 'var(--text-secondary)');
    lab.textContent = 'v' + d.version;
    svg.appendChild(lab);
  });

  // 轴标题
  const xt = document.createElementNS(ns, 'text');
  xt.setAttribute('x', W / 2); xt.setAttribute('y', H - 8);
  xt.setAttribute('text-anchor', 'middle'); xt.setAttribute('font-size', '12');
  xt.setAttribute('fill', 'var(--text-secondary)'); xt.setAttribute('font-weight', '500');
  xt.textContent = '游戏版本（单次快照，不表示时间演化）'; svg.appendChild(xt);
  const yt = document.createElementNS(ns, 'text');
  yt.setAttribute('x', 14); yt.setAttribute('y', H / 2);
  yt.setAttribute('text-anchor', 'middle'); yt.setAttribute('font-size', '12');
  yt.setAttribute('fill', 'var(--text-secondary)'); yt.setAttribute('font-weight', '500');
  yt.setAttribute('transform', `rotate(-90,14,${H / 2})`);
  yt.textContent = '评论中位数（千条）'; svg.appendChild(yt);

  const barW = Math.min(34, w / versionStats.length * 0.55);

  // 渐变定义：每根柱按地区色上亮下深
  const defs = document.createElementNS(ns, 'defs');
  const usedRegionIds = [...new Set(versionStats.map(d => d.region))];
  usedRegionIds.forEach(rid => {
    const g = document.createElementNS(ns, 'linearGradient');
    g.setAttribute('id', `stG-${rid}`);
    g.setAttribute('x1', '0%'); g.setAttribute('y1', '0%');
    g.setAttribute('x2', '0%'); g.setAttribute('y2', '100%');
    g.innerHTML = `<stop offset="0%" stop-color="${rColor(rid)}" stop-opacity="0.95"/><stop offset="100%" stop-color="${rColor(rid)}" stop-opacity="0.45"/>`;
    defs.appendChild(g);
  });
  svg.appendChild(defs);

  versionStats.forEach((d, i) => {
    const x = M.l + ((i + 0.5) / versionStats.length) * w - barW / 2;
    const barH = d.val / maxHeat * h;
    const y = M.t + h - barH;
    const color = rColor(d.region);

    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', x); rect.setAttribute('y', y);
    rect.setAttribute('width', barW); rect.setAttribute('height', Math.max(1, barH));
    rect.setAttribute('rx', '4'); rect.setAttribute('fill', `url(#stG-${d.region})`);
    rect.setAttribute('stroke', color); rect.setAttribute('stroke-opacity', '0.55'); rect.setAttribute('stroke-width', '1');
    rect.style.cursor = 'pointer';
    rect.style.transition = 'filter 0.2s ease';
    rect.addEventListener('mouseenter', (e) => {
      rect.style.filter = 'brightness(1.3)';
      storyShowTip(e.clientX, e.clientY, {
        title: `v${d.version} 剧情曲评论快照`,
        items: [
          ['有效评论中位数', storyFmtK(d.val)],
          ['有效样本', `n=${d.n} / 定义 ${d.trackCount} 首`],
          ['评论实测 0', `${d.zeroCount} 首`]
        ]
      });
    });
    rect.addEventListener('mouseleave', () => { rect.style.filter = ''; storyHideTip(); });
    svg.appendChild(rect);

    const val = document.createElementNS(ns, 'text');
    val.setAttribute('x', x + barW / 2); val.setAttribute('y', Math.max(M.t + 11, y - 6));
    val.setAttribute('text-anchor', 'middle'); val.setAttribute('font-size', '10');
    val.setAttribute('fill', 'var(--text-secondary)'); val.setAttribute('font-weight', '600');
    val.setAttribute('paint-order', 'stroke');
    val.setAttribute('stroke', 'var(--surface-elevated)');
    val.setAttribute('stroke-width', '3');
    val.textContent = d.n ? storyFmtK(d.val) : '—';
    svg.appendChild(val);

    const nLab = document.createElementNS(ns, 'text');
    nLab.setAttribute('x', x + barW / 2); nLab.setAttribute('y', H - M.b + 32);
    nLab.setAttribute('text-anchor', 'middle'); nLab.setAttribute('font-size', '9');
    nLab.setAttribute('fill', 'var(--text-quaternary)');
    nLab.textContent = `n=${d.n}`;
    svg.appendChild(nLab);
  });

  const legend = document.getElementById('versionTrendLegend');
  if (legend) {
    const usedRegions = [...new Set(versionStats.map(t => t.region))];
    legend.innerHTML = usedRegions.map(rid =>
      `<span style="color:var(--text-tertiary);"><span style="display:inline-block;width:10px;height:10px;background:${rColor(rid)};border-radius:2px;margin-right:4px;"></span>${rName(rid)}</span>`
    ).join('') + `<span style="color:var(--text-tertiary);margin-left:auto;">每根柱 = 该版本有效评论中位数，悬停查看 n 与真实 0 值</span>`;
  }

  const trendCard = svg.closest('.card');
  if (trendCard && !trendCard.querySelector('.export-btn')) {
    const exportData = versionStats.map(t => ({
      版本: t.version,
      评论中位数千: t.val,
      有效评论曲目数: t.n,
      该版本定义曲目数: t.trackCount,
      评论实测0值曲目数: t.zeroCount
    }));
    const btn = document.createElement('button');
    btn.className = 'export-btn';
    btn.textContent = '导出数据';
    btn.setAttribute('aria-label', '导出剧情曲目版本快照数据');
    btn.addEventListener('click', () => window.exportData(exportData, '剧情曲目版本评论快照', 'csv'));
    trendCard.appendChild(btn);
  }
}

// ====== 版本热点曲目（当前评论快照） ======
function renderVersionHotspots() {
  const el = document.getElementById('versionHotspots');
  if (!el) return;

  // 只在评论有效样本内选每版本代表，缺失值不参与“最高”比较。
  const validTracks = ST.filter(t => storyIsNumber(t.neteaseCmt));
  if (!validTracks.length) {
    el.innerHTML = '<div class="ds-note">暂无可核实的剧情曲评论数据，无法比较版本代表曲目。</div>';
    return;
  }
  const versionTop = {};
  validTracks.forEach(t => {
    if (!versionTop[t.version] || t.neteaseCmt > versionTop[t.version].neteaseCmt) {
      versionTop[t.version] = t;
    }
  });

  const sortedVersions = Object.keys(versionTop).sort((a, b) => parseFloat(b) - parseFloat(a));
  const allHeats = validTracks.map(t => t.neteaseCmt);
  const medHeat = storyMedian(allHeats);

  el.innerHTML = sortedVersions.map(v => {
    const t = versionTop[v];
    const evt = VERSION_EVENTS[v] || { event: '版本更新', desc: '' };
    const heatRatio = medHeat ? (t.neteaseCmt / medHeat).toFixed(1) : '—';
    const pct = (typeof statPercentileRank === 'function') ? statPercentileRank(allHeats, t.neteaseCmt) : null;
    const isHot = pct !== null && pct >= 90;
    const color = rColor(t.region);

    return `<div style="border-left:3px solid ${color};background:var(--surface-elevated);border-radius:8px;padding:16px 18px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px;">
        <div>
          <span style="display:inline-block;background:${color};color:#fff;font-size:11px;padding:2px 8px;border-radius:10px;font-weight:600;">v${v}</span>
          <strong style="margin-left:8px;font-size:15px;">${t.name}</strong>
          ${isHot ? '<span style="margin-left:6px;font-size:11px;color:var(--chart-5);font-weight:600;"><img src="assets/img/deco/UI_ItemIcon_105.png" style="width:11px;height:11px;vertical-align:-1px;"/> 评论前 10%</span>' : ''}
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:18px;font-weight:700;color:${color};">
            <img src="assets/img/items/UI_ItemIcon_112001.png" style="width:14px;height:14px;vertical-align:-2px;margin-right:2px;" onerror="this.style.display='none'" title="来源：music.163.com 网易云单曲评论数（真实）"/>
            ${fmt(t.neteaseCmt)}
          </div>
          <div style="font-size:10px;color:var(--text-tertiary);">全样本中位数 ${heatRatio} 倍 · 分位 ${pct === null ? '—' : 'P' + pct.toFixed(0)} · B站 ${storyIsNumber(t.biliPlay) ? fmt(t.biliPlay) : '—'}</div>
        </div>
      </div>
      <div style="font-size:13px;color:var(--text-primary);margin-bottom:6px;font-weight:500;"><img src="assets/img/deco/UI_ItemIcon_201.png" style="width:13px;height:13px;vertical-align:-2px;margin-right:3px;"/> ${evt.event}</div>
      <div style="font-size:12px;color:var(--text-secondary);line-height:1.6;">${evt.desc} <span style="color:var(--text-quaternary);">（背景说明，非本页统计结论）</span></div>
      <div style="display:flex;gap:12px;margin-top:10px;padding-top:8px;border-top:1px dashed rgba(201,162,39,0.15);font-size:11px;color:var(--text-tertiary);flex-wrap:wrap;">
        <span><img src="${regionElementUrl(t.region)}" style="width:11px;height:11px;vertical-align:-1px;margin-right:3px;"/> ${rName(t.region)}</span>
        <span style="background:rgba(254,44,85,0.06);padding:2px 6px;border-radius:4px;font-weight:600;color:#FE2C55;">
          <img src="assets/img/items/UI_ItemIcon_112001.png" style="width:10px;height:10px;vertical-align:-1px;margin-right:2px;" onerror="this.style.display='none'"/>
          网易云评论 ${fmt(t.neteaseCmt)}
        </span>
        <span style="background:rgba(251,114,153,0.06);padding:2px 6px;border-radius:4px;font-weight:600;color:#FB7299;">
          <img src="assets/img/deco/UI_NameCardIcon_0.png" style="width:10px;height:10px;vertical-align:-1px;margin-right:2px;" onerror="this.style.display='none'"/>
          B站播放 ${storyIsNumber(t.biliPlay) ? fmt(t.biliPlay) : '缺失'}
        </span>
        ${t.fav ? `<span style="background:rgba(226,85,110,0.06);padding:2px 6px;border-radius:4px;font-weight:600;color:#E2556E;" title="网易云红心数（客户端 UI 显示值，2026-11-07 实测）">红心 ${t.fav}</span>` : ''}
      </div>
    </div>`;
  }).join('') + `<div class="ds-note">读法：每个版本仅在该版本“评论数有效”的剧情曲中选取评论最高者；分位基于 ${allHeats.length} 首有效样本。单次快照不能比较版本上线后的长期表现。</div>`;
}

// ====== 版本 × 地区 评论快照矩阵 ======
function renderVersionRegionMatrix() {
  const el = document.getElementById('versionRegionMatrix');
  if (!el) return;

  const versions = [...new Set(ST.map(t => t.version))].sort((a, b) => parseFloat(a) - parseFloat(b));
  const regions = [...new Set(ST.map(t => t.region))];

  // 中位数只使用评论有效值（含真实 0）；定义曲目数、有效 n、0 值数分别记录。
  const matrix = {};
  let maxVal = 0;
  versions.forEach(v => {
    matrix[v] = {};
    regions.forEach(r => {
      const tracks = ST.filter(t => t.version === v && t.region === r);
      const vals = tracks.map(t => t.neteaseCmt).filter(storyIsNumber);
      const val = vals.length ? statMedian(vals) / 1000 : null;
      matrix[v][r] = {
        val,
        defined: tracks.length,
        n: vals.length,
        zeroCount: vals.filter(x => x === 0).length
      };
      if (val !== null && val > maxVal) maxVal = val;
    });
  });

  let html = `<div class="story-heatmap" style="display:grid;grid-template-columns:68px repeat(${regions.length},1fr);gap:1px;background:var(--border);border-radius:12px;overflow:hidden;border:1.5px solid var(--border-gold);box-shadow:var(--shadow-sm);min-width:560px;">`;
  html += `<div style="background:var(--surface-elevated);padding:12px 8px;font-size:12px;font-weight:600;text-align:center;color:var(--gold-light);">版本\\地区</div>`;
  regions.forEach(r => {
    html += `<div style="background:var(--surface-elevated);padding:12px 8px;font-size:12px;font-weight:600;text-align:center;color:var(--gold-light);border-left:1px solid rgba(201,162,39,0.15);">${rName(r)}</div>`;
  });

  versions.forEach(v => {
    html += `<div style="background:var(--surface-elevated);padding:12px 8px;font-size:12px;font-weight:600;text-align:center;color:var(--gold-light);">v${v}</div>`;
    regions.forEach(r => {
      const cell = matrix[v][r];
      if (cell.defined === 0) {
        html += `<div class="heatmap-cell heat-cell hlvl-0" data-v="0" title="v${v} ${rName(r)}：该版本此地区未定义剧情曲">无曲目</div>`;
      } else if (cell.val === null) {
        html += `<div class="heatmap-cell heat-cell hlvl-0" data-v="0" title="v${v} ${rName(r)}：定义 ${cell.defined} 首，均无有效评论数">无数据</div>`;
      } else {
        const ratio = maxVal > 0 ? cell.val / maxVal : 0;
        let lvl = ratio < 0.22 ? 1 : (ratio < 0.42 ? 2 : (ratio < 0.62 ? 3 : (ratio < 0.82 ? 4 : 5)));
        html += `<div class="heatmap-cell heat-cell hlvl-${lvl}" data-v="${Math.round(ratio * 100)}" title="v${v} ${rName(r)}：评论中位数 ${storyFmtK(cell.val)}；有效 n=${cell.n}/${cell.defined}（真实 0 值 ${cell.zeroCount} 首）">${storyFmtK(cell.val)}</div>`;
      }
    });
  });
  html += '</div>';
  html += `<div class="legend legend-bottom" style="margin-top:12px;justify-content:flex-end;gap:10px;flex-wrap:wrap;">
    <span style="font-size:11px;color:var(--text-tertiary);margin-right:6px;">相对评论强度</span>
    <span class="legend-item"><span class="legend-swatch" style="background:rgba(255,255,255,0.02);border:1px solid var(--border);"></span>无数据</span>
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
  const rows = ST.filter(t => storyIsNumber(t.neteaseCmt)).sort((a, b) => b.neteaseCmt - a.neteaseCmt);
  if (!rows.length) {
    el.innerHTML = '<div class="ds-note">暂无可核实的剧情曲评论数据。</div>';
    return;
  }
  const maxF = Math.max(...rows.map(t => t.neteaseCmt), 1);
  el.innerHTML = rows.map(t => `
    <div class="bar-row">
      <div class="bar-label">${t.name}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${t.neteaseCmt / maxF * 100}%;background:var(--chart-1);"></div>
      </div>
      <div class="bar-val">${fmt(t.neteaseCmt)}</div>
    </div>
    <div style="display:flex;gap:12px;margin-left:112px;margin-top:-4px;margin-bottom:6px;font-size:11px;color:var(--text-tertiary);">
      <span>发行版本: v${t.version}</span>
      <span>网易云评论 ${fmt(t.neteaseCmt)}</span>
      <span>B站播放 ${storyIsNumber(t.biliPlay) ? fmt(t.biliPlay) : '缺失'}</span>
      ${t.fav ? `<span style="color:#E2556E;">红心 ${t.fav}</span>` : ''}
    </div>
  `).join('') + `<div class="ds-note" style="margin-top:10px;">评论有效 n=${rows.length}；真实 0 值 ${rows.filter(t => t.neteaseCmt === 0).length} 首。B站播放缺失显示“缺失”，不按 0 参与展示。</div>`;
}

function renderStoryVsChar() {
  const el = document.getElementById('storyVsChar');
  if (!el) return;
  // 两侧分别计算“每首曲目”和“每名角色”的中位数，不把不同样本量的总量直接比较。
  const rows = REGIONS.map(region => {
    const storyVals = ST.filter(t => t.region === region.id && storyIsNumber(t.biliPlay)).map(t => t.biliPlay);
    const charVals = CHARACTERS.filter(c => c.region === region.id && storyIsNumber(c.pv)).map(c => c.pv * 10000);
    return {
      name: region.name,
      storyMedian: storyVals.length ? statMedian(storyVals) : null,
      storyN: storyVals.length,
      charMedian: charVals.length ? statMedian(charVals) : null,
      charN: charVals.length
    };
  }).filter(r => r.storyMedian !== null || r.charMedian !== null);
  if (!rows.length) {
    el.innerHTML = '<div class="ds-note">暂无可比较的 B站播放数据。</div>';
    return;
  }
  const vmax = Math.max(...rows.flatMap(r => [r.storyMedian || 0, r.charMedian || 0]), 1);
  el.innerHTML = rows.map(r => `
    <div style="padding:10px 0;border-bottom:1px solid var(--border);">
      <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:600;margin-bottom:6px;"><span>${r.name}</span><span style="color:var(--text-quaternary);">各集合中位数</span></div>
      <div style="display:flex;align-items:center;gap:8px;font-size:11px;margin-bottom:4px;">
        <span style="width:78px;color:var(--chart-1);">剧情曲 n=${r.storyN}</span>
        <div style="flex:1;height:12px;background:var(--surface);border-radius:4px;overflow:hidden;"><div style="width:${r.storyMedian === null ? 0 : r.storyMedian / vmax * 100}%;height:100%;background:var(--chart-1);"></div></div>
        <span style="width:80px;text-align:right;color:var(--text-secondary);">${r.storyMedian === null ? '—' : fmt(Math.round(r.storyMedian))}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;font-size:11px;">
        <span style="width:78px;color:var(--chart-3);">角色视频 n=${r.charN}</span>
        <div style="flex:1;height:12px;background:var(--surface);border-radius:4px;overflow:hidden;"><div style="width:${r.charMedian === null ? 0 : r.charMedian / vmax * 100}%;height:100%;background:var(--chart-3);"></div></div>
        <span style="width:80px;text-align:right;color:var(--text-secondary);">${r.charMedian === null ? '—' : fmt(Math.round(r.charMedian))}</span>
      </div>
    </div>
  `).join('') + `<div class="ds-note" style="margin-top:10px;">比较单位均为“单条内容的中位数播放量”，不是地区总量。两侧样本来自不同视频集合（人工选择的剧情曲 vs 官方角色视频），样本规模与选择机制不同，只能描述当前两组内容的差异，不能据此判断剧情音乐与角色内容谁传播更强。</div>`;
}

function renderStoryTable() {
  const el = document.getElementById('storyTable');
  if (!el) return;

  // ST 初始化时已完成统一的曲名匹配与热度计算，明细表不再二次精确匹配。
  const sorted = [...ST].sort((a, b) => {
    const ha = storyIsNumber(a.heatScore) ? a.heatScore : 0;
    const hb = storyIsNumber(b.heatScore) ? b.heatScore : 0;
    if (ha !== hb) return hb - ha;
    return (storyIsNumber(b.neteaseCmt) ? b.neteaseCmt : -1) - (storyIsNumber(a.neteaseCmt) ? a.neteaseCmt : -1);
  });

  el.innerHTML = sorted.map((t, i) => {
    const ad = t.albumData;
    const platformLinks = ad ? `
      <td>
        <div style="display:flex;gap:3px;">
          ${ad.neteaseUrl ? `<a href="${ad.neteaseUrl}" target="_blank" rel="noopener" style="color:#FE2C55;font-size:11px;text-decoration:none;" title="网易云"><img src="assets/img/items/UI_ItemIcon_112001.png" style="width:11px;height:11px;vertical-align:-1px;" onerror="this.style.display='none'"/></a>` : ''}
          ${ad.bilibiliUrl ? `<a href="${ad.bilibiliUrl}" target="_blank" rel="noopener" style="color:#FB7299;font-size:11px;text-decoration:none;" title="B站"><img src="assets/img/deco/UI_NameCardIcon_0.png" style="width:11px;height:11px;vertical-align:-1px;" onerror="this.style.display='none'"/></a>` : ''}
        </div>
      </td>` : '<td>—</td>';

    const heatCell = storyIsNumber(t.heatScore) && t.heatScore > 0
      ? `<td><span style="color:var(--gold);font-weight:600;">${t.heatScore}/100</span></td>`
      : `<td>—</td>`;

    return `
    <tr>
      <td>${i + 1}</td>
      <td style="font-weight:500;">${t.name}${ad ? '<span style="margin-left:4px;color:var(--gold);font-size:10px;">✓</span>' : ''}</td>
      <td>${rName(t.region)}</td>
      <td>v${t.version}</td>
      ${heatCell}
      <td style="font-size:11px;">
        ${t.fav ? `<span style="color:#E2556E;" title="网易云红心/收藏数（客户端 UI 显示值）">红心${t.fav}</span> ` : ''}${storyIsNumber(t.neteaseCmt) ? `<span style="color:#FE2C55;"><img src="assets/img/items/UI_ItemIcon_112001.png" style="width:11px;height:11px;vertical-align:-1px;" onerror="this.style.display='none'"/>评${fmt(t.neteaseCmt)}</span>` : '<span style="color:var(--text-quaternary);">评论缺失</span>'}
      </td>
      <td>${storyIsNumber(t.biliPlay) ? fmt(t.biliPlay) : '<span style="color:var(--text-quaternary);">缺失</span>'}</td>
      ${platformLinks}
    </tr>`;
  }).join('');
}

// ==================== 版本时间轴·真实指标驱动 ====================
function renderVersionTimeline() {
  const el = document.getElementById('versionTimeline');
  if (!el) return;

  // 每个版本仅在“评论数有效”的剧情曲中取最高者作为代表；缺失值不冒充 0。
  const byVersion = {};
  ST.forEach(t => {
    if (!VERSION_EVENTS[t.version] || !storyIsNumber(t.neteaseCmt)) return;
    if (!byVersion[t.version] || t.neteaseCmt > byVersion[t.version].neteaseCmt) byVersion[t.version] = t;
  });
  const versions = Object.keys(byVersion).sort((a, b) => parseFloat(a) - parseFloat(b));
  if (!versions.length) {
    el.innerHTML = '<div class="insight-card" style="padding:28px;text-align:center;"><div class="insight-label">暂无可核实的剧情曲评论数据</div></div>';
    return;
  }

  const heats = ST.map(t => t.neteaseCmt).filter(storyIsNumber);
  const median = storyMedian(heats);
  const maxHeat = Math.max(...heats, 1);
  const maxPlay = Math.max(...versions.map(v => byVersion[v].biliPlay).filter(storyIsNumber), 1);

  let html = versions.map((v, idx) => {
    const t = byVersion[v];
    const color = rColor(t.region);
    const realHeat = t.neteaseCmt;
    const play = storyIsNumber(t.biliPlay) ? t.biliPlay : null;
    const heatPct = (realHeat / maxHeat) * 100;
    const playPct = play !== null ? (play / maxPlay) * 100 : 0;
    const pct = typeof statPercentileRank === 'function' ? statPercentileRank(heats, realHeat) : null;
    const level = pct === null ? '样本不足'
      : pct >= 90 ? '头部（前 10%）'
      : pct >= 70 ? '高位（前 30%）'
      : pct >= 50 ? '中上水平'
      : pct >= 30 ? '中下水平' : '尾部（后 30%）';
    const evt = VERSION_EVENTS[v] || { event: '版本更新', desc: '' };
    const isLeft = idx % 2 === 0;

    return `
    <div class="tl-item ${isLeft ? 'tl-left' : 'tl-right'}">
      <div class="tl-node" style="border-color:${color};box-shadow:0 0 12px ${color}66;">
        <span class="tl-node-icon" style="color:${color};display:inline-flex;align-items:center;justify-content:center;">
          <img src="assets/img/deco/UI_ItemIcon_210.png" style="width:14px;height:14px;object-fit:contain;" onerror="this.style.display='none'"/>
        </span>
      </div>
      <div class="tl-card" style="border-left:3px solid ${color};background:var(--surface-elevated);backdrop-filter:blur(10px);">
        <div class="tl-card-header">
          <div class="tl-version">
            <span class="tl-ver-badge" style="background:${color};color:#fff;font-size:11px;padding:3px 10px;border-radius:12px;font-weight:700;">v${v}</span>
            <span class="tl-date" style="color:var(--text-tertiary);font-size:11px;margin-left:6px;">${VERSION_DATES[v] || '—'}</span>
          </div>
          <span class="tl-sentiment" style="border:1px solid ${color};color:${color};padding:4px 12px;border-radius:16px;font-size:11px;font-weight:600;">
            评论分位 ${pct === null ? '—' : 'P' + pct.toFixed(0)} · ${level}
          </span>
        </div>

        <div class="tl-event" style="font-size:15px;font-weight:600;color:var(--text-primary);margin:10px 0;">${evt.event}</div>
        <div class="tl-track">
          <span class="tl-track-icon" style="font-size:14px;margin-right:6px;">
            <img src="assets/img/items/UI_ItemIcon_112001.png" style="width:14px;height:14px;vertical-align:-2px;" onerror="this.style.display='none'"/>
          </span>
          <span class="tl-track-name" style="font-size:14px;font-weight:500;color:var(--text-primary);">${t.name}</span>
          <span class="tl-track-region" style="color:${color};font-size:12px;margin-left:8px;padding:2px 8px;border-radius:8px;background:${color}22;">${rName(t.region)}</span>
        </div>

        <div class="tl-summary" style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-top:10px;">${evt.desc || ''}</div>

        <div class="tl-metrics">
          <div class="tl-metric">
            <div class="tl-metric-header">
              <span class="tl-metric-label" style="font-size:11px;color:var(--text-tertiary);">网易云评论
                <span class="tl-metric-src" title="来源：music.163.com 网易云单曲评论总数（真实）"
                      style="font-size:9px;padding:1px 4px;border-radius:4px;background:rgba(254,44,85,0.08);color:#FE2C55;font-weight:600;margin-left:3px;">
                  <img src="assets/img/items/UI_ItemIcon_112001.png" style="width:8px;height:8px;vertical-align:-1px;" onerror="this.style.display='none'"/>网易云
                </span>
              </span>
              <span class="tl-metric-val" style="font-size:13px;font-weight:700;color:${color};">${fmt(realHeat)}</span>
            </div>
            <div class="tl-metric-bar" style="height:6px;background:var(--surface);border-radius:3px;overflow:hidden;">
              <div class="tl-metric-fill" style="width:${heatPct}%;background:linear-gradient(90deg,${color}88,${color});border-radius:3px;transition:width 0.6s ease;"></div>
            </div>
          </div>
          <div class="tl-metric">
            <div class="tl-metric-header">
              <span class="tl-metric-label" style="font-size:11px;color:var(--text-tertiary);">B站相关视频播放
                <span class="tl-metric-src" title="来源：bilibili.com「原神 + 曲名」搜索最相关视频播放量（真实）"
                      style="font-size:9px;padding:1px 4px;border-radius:4px;background:rgba(251,114,153,0.08);color:#FB7299;font-weight:600;margin-left:3px;">
                  <img src="assets/img/deco/UI_NameCardIcon_0.png" style="width:8px;height:8px;vertical-align:-1px;" onerror="this.style.display='none'"/>B站
                </span>
              </span>
              <span class="tl-metric-val" style="font-size:13px;font-weight:700;color:#FB7299;">${play !== null ? fmt(play) : '—'}</span>
            </div>
            <div class="tl-metric-bar" style="height:6px;background:var(--surface);border-radius:3px;overflow:hidden;">
              <div class="tl-metric-fill" style="width:${playPct}%;background:linear-gradient(90deg,#FB729988,#FB7299);border-radius:3px;transition:width 0.6s ease;"></div>
            </div>
          </div>
        </div>

        <div class="tl-footer" style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:12px;border-top:1px solid var(--border);font-size:12px;color:var(--text-tertiary);">
          <div>
            <span>剧情曲评论中位数 ${median === null ? '—' : fmt(Math.round(median))}（n=${heats.length}）</span>
          </div>
          <div class="tl-source" style="font-size:10px;color:var(--text-quaternary);">数据来源：网易云音乐单曲评论 · B站相关视频播放（均为实测）</div>
        </div>
      </div>
    </div>`;
  }).join('');

  html += `<div class="tl-source-note" style="text-align:center;padding:16px;font-size:11px;color:var(--text-quaternary);border-top:1px solid var(--border);margin-top:20px;">
    <img src="assets/img/deco/UI_ItemIcon_202.png" style="width:12px;height:12px;vertical-align:-2px;margin-right:4px;" onerror="this.style.display='none'"/>
    读法：每个版本只在评论有效的剧情曲中取最高者为代表，评论分位基于全部可核实剧情曲样本（n = ${heats.length}）计算；分位越高表示该曲越接近分布右端。B站播放缺失显示“—”，不按 0 处理。样本为单次快照，不反映版本上线后的长期累积变化。
  </div>`;

  el.innerHTML = html;
}
