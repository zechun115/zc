// ==================== 数据洞察页 ====================
let tooltipEl = null;

// ── 全局 img 加载失败处理
(function installIconFallbackGlobal() {
  if (window.__genshinIconFallbackInstalled) return;
  window.__genshinIconFallbackInstalled = true;
  document.addEventListener('error', function (e) {
    const t = e.target;
    if (!t || !t.tagName || t.tagName !== 'IMG') return;
    const fb = t.dataset && t.dataset.fallback;
    if (t.dataset.fbApplied) { t.style.display='none'; return; }
    if (fb) {
      t.dataset.fbApplied = '1';
      try { t.src = fb; } catch(_) { /* noop */ }
      return;
    }
    t.style.display = 'none';
  }, true);
})();

function icoPng(png, alt, emoji) {
  return `<img class="insight-icon-png" src="${png}" alt="${alt||''}" onerror="this.style.display='none'" loading="lazy" width="36" height="36"/>`;
}
function kpiIcon(png, emoji, size) {
  size = size || 44;
  return `<img class="kpi-icon-png" src="${png}" alt="" onerror="this.style.display='none'" loading="lazy" style="width:${size}px;height:${size}px;object-fit:contain;filter:drop-shadow(0 0 6px rgba(201,162,39,0.45));"/>`;
}
function featIcon(png, emoji) {
  return `<img class="featured-icon-png" src="${png}" alt="" onerror="this.style.display='none'" loading="lazy" style="width:54px;height:54px;object-fit:contain;filter:drop-shadow(0 0 10px rgba(255,215,120,0.55));"/>`;
}
function findingIcon(png, emoji) {
  return `<img class="finding-ico" src="${png}" alt="" onerror="this.style.display='none'" loading="lazy"/>`;
}

// 大数字中文格式化（与 map.js fmtCN 保持一致）：707500000 → "7.08亿"
function fmtCN(n) {
  if (typeof n !== 'number' || isNaN(n)) return '0';
  if (n >= 100000000) return (n / 100000000).toFixed(2).replace(/\.?0+$/, '') + '亿';
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万';
  if (n >= 1000) return (n / 10000).toFixed(1) + '万';
  return Math.round(n).toString();
}

function showTooltip(x, y, content) {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'insight-tooltip';
    document.body.appendChild(tooltipEl);
  }
  tooltipEl.innerHTML = content;
  tooltipEl.style.left = `${x}px`;
  tooltipEl.style.top = `${y}px`;
  tooltipEl.classList.add('show');
}

function hideTooltip() {
  if (tooltipEl) {
    tooltipEl.classList.remove('show');
  }
}

function syncSampleCounts() {
  // 角色级联合分析仅使用播放、收藏、弹幕三项均有效的角色，缺失值不按 0 计入
  const census = (typeof getVerifiedTrackCensus === 'function') ? getVerifiedTrackCensus() : [];
  const validChars = CHARACTERS.filter(c => typeof c.pv === 'number' && typeof c.fav === 'number' && typeof c.danmaku === 'number');
  ['heroCharN', 'defCharN', 'noteCharN', 'matrixCharN'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = validChars.length;
  });
  ['heroCharTotalN', 'defCharTotalN'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = CHARACTERS.length;
  });
  ['heroTrackN', 'defTrackN', 'noteTrackN'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = census.length;
  });
}

(function () {
  renderKPI();
  syncSampleCounts();
  renderExecutiveSummary();
  renderPlatformMatrix();
  renderTrend();
  renderSankey();
  renderBox();
  renderElementAnalysis();
  renderWeaponAnalysis();
  renderCorrelation();
  renderPhenomenon();
  renderKeyFindings();
})();

/* 执行摘要：所有数值实时计算，保证文案与图表口径一致 */
function renderExecutiveSummary() {
  const lead = document.getElementById('execSummaryLead');
  const f1 = document.getElementById('execFinding1');
  const f2 = document.getElementById('execFinding2');
  const f3 = document.getElementById('execFinding3');
  const f4 = document.getElementById('execFinding4');
  const lim = document.getElementById('execLimitation');
  if (!lead || !f1 || !f2 || !f3) return;

  const census = (typeof getVerifiedTrackCensus === 'function') ? getVerifiedTrackCensus() : [];
  const cmts = census.filter(t => typeof t.cmt === 'number').map(t => t.cmt);
  const plays = census.filter(t => typeof t.play === 'number').map(t => t.play);
  const cmtMedian = statMedian(cmts);
  const cmtQ3 = statQ3(cmts);
  const cmtIQR = statIQR(cmts);
  const threshold = cmtQ3 + 1.5 * cmtIQR;
  const outliers = cmts.filter(v => v > threshold);
  const cmtTotal = cmts.reduce((s, v) => s + v, 0);
  const topTrack = census.filter(t => typeof t.cmt === 'number').sort((a, b) => b.cmt - a.cmt)[0];

  // 红心数分布（客户端 UI 粗粒度标签，统计取下限；census 已透传 fav 字符串）
  const favLB = v => (typeof favLowerBound === 'function') ? (favLowerBound(v) || 0) : 0;
  const favTracks = census.filter(t => typeof t.fav === 'string');
  const favGe1w = favTracks.filter(t => favLB(t.fav) >= 10000);
  const favGe10w = favTracks.filter(t => favLB(t.fav) >= 100000);
  const favGe100w = favTracks.filter(t => favLB(t.fav) >= 1000000);
  const topFavTrack = favTracks.slice().sort((a, b) => favLB(b.fav) - favLB(a.fav))[0];

  // 角色级指标仅统计有官方角色视频数据的角色
  const validChars = CHARACTERS.filter(c => typeof c.pv === 'number' && typeof c.fav === 'number' && typeof c.danmaku === 'number');
  const pv = validChars.map(c => c.pv);
  const fav = validChars.map(c => c.fav);
  const r = (typeof statPearson === 'function') ? statPearson(pv, fav) : null;
  const rLabel = (typeof statCorrLabel === 'function') ? statCorrLabel(r) : '';
  const r2 = r === null ? null : r * r * 100;

  // 地区人均播放量的极值比，用于说明结构差异
  const regionAvg = REGIONS.map(reg => {
    const arr = validChars.filter(c => c.region === reg.id);
    return { name: reg.name, n: arr.length, avg: arr.length ? statMean(arr.map(c => c.pv)) : null };
  }).filter(x => x.n > 0 && x.avg !== null).sort((a, b) => b.avg - a.avg);
  const highestRegion = regionAvg[0];
  const lowestRegion = regionAvg[regionAvg.length - 1];

  // 星级中位数对比
  const five = validChars.filter(c => c.rarity === 5).map(c => c.pv);
  const four = validChars.filter(c => c.rarity === 4).map(c => c.pv);
  const med5 = statMedian(five);
  const med4 = statMedian(four);

  lead.innerHTML = `本页以 <strong>${CHARACTERS.length} 名可玩角色</strong>（其中 <strong>${validChars.length}</strong> 名有 B站官方角色视频实测数据）与 <strong>${census.length} 首可核实曲目</strong>（至少具备一项真实平台指标）为样本，围绕平台联动、结构差异、分布形态与互动规模四个问题展开分析。所有结论均由页面统计量实时生成，不使用预设文案。`;

  f1.innerHTML = `同一支 B站「原神」官方角色视频的播放量与收藏数的 Pearson 相关系数 <strong style="color:var(--chart-1);">r = ${r === null ? '—' : r.toFixed(3)}</strong>（${rLabel}正相关，n = ${validChars.length}）。当前线性模型可解释约 <strong>${r2 === null ? '—' : r2.toFixed(1)}%</strong> 的收藏方差；未解释部分不能归因到任何具体因素，相关关系也不等于因果。`;

  f2.innerHTML = `曲目评论数中位数 <strong>${fmtCN(cmtMedian)}</strong> 条，Q3 = ${fmtCN(cmtQ3)}，IQR = ${fmtCN(cmtIQR)}；Tukey 上界 <strong>${fmtCN(threshold)}</strong>。共 <strong>${outliers.length}</strong> 首曲目越过阈值（占 ${((outliers.length / Math.max(cmts.length, 1)) * 100).toFixed(1)}%），呈明显右偏长尾。最高为《${topTrack ? topTrack.name : '—'}》${topTrack ? fmtCN(topTrack.cmt) : '—'} 条，约占全站评论总量的 ${topTrack && cmtTotal ? ((topTrack.cmt / cmtTotal) * 100).toFixed(1) : '—'}%。`;

  f3.innerHTML = `地区官方角色视频播放均值最高为 <strong>${highestRegion ? highestRegion.name : '—'}</strong>（${highestRegion ? Math.round(highestRegion.avg) : '—'} 万，n = ${highestRegion ? highestRegion.n : '—'}），最低为 ${lowestRegion ? lowestRegion.name : '—'}（${lowestRegion ? Math.round(lowestRegion.avg) : '—'} 万），均值极值比 <strong>${highestRegion && lowestRegion && lowestRegion.avg ? (highestRegion.avg / lowestRegion.avg).toFixed(1) : '—'} 倍</strong>；5 星角色播放中位数 ${Math.round(med5)} 万，4 星 ${Math.round(med4)} 万，比值 ${med4 ? (med5 / med4).toFixed(1) : '—'}。这些是当前样本的描述性差异，均值受组内头部角色和样本量影响，不支持因果解释。`;

  if (f4) {
    const coverPct = census.length ? (favTracks.length / census.length * 100).toFixed(1) : '—';
    f4.innerHTML = `网易云红心数已实测 <strong style="color:#E2556E;">${favTracks.length}</strong> 首（占可核实样本 ${coverPct}%）：红心 ≥1万 共 <strong>${favGe1w.length}</strong> 首，≥10万 <strong>${favGe10w.length}</strong> 首，≥100万 <strong>${favGe100w.length}</strong> 首${topFavTrack ? `；红心最高的曲目为《${topFavTrack.name}》（${topFavTrack.fav}）` : ''}。红心为客户端 UI 档位标签（999+/1w+/10w+/100w+），统计一律取下限，不做精确估算。`;
  }

  if (lim) {
    lim.innerHTML = `分析局限：① 播放、收藏、弹幕虽来自同一支视频，但属于不同互动行为，不能换算为同一用户行为；② B站曲目播放量取搜索最相关视频，同专辑曲目可能共用同一支视频；③ 数据为 2026 年 10 月单次快照（网易云红心数为 2026-11-07 客户端 UI 粗粒度标签：999+/1w+/10w+/100w+，&lt;1000 为精确值，统计取下限不估算精确值），无法据此推断长期趋势；④ 曲目样本仅覆盖有真实接口数据的作品（${census.length} 首 / 官方收录 1909 首），存在收录偏差。`;
  }
}


function renderKPI() {
  const el = document.getElementById('kpiGrid');
  if (!el) return;

  const totalChars = CHARACTERS.length;
  const census = (typeof getVerifiedTrackCensus === 'function') ? getVerifiedTrackCensus() : [];
  const validChars = CHARACTERS.filter(c => typeof c.pv === 'number' && typeof c.fav === 'number' && typeof c.danmaku === 'number');
  const totalPv = validChars.reduce((s, c) => s + c.pv, 0);
  const pvArr = validChars.map(c => c.pv);
  const favArr = validChars.map(c => c.fav);
  const r = (typeof statPearson === 'function') ? statPearson(pvArr, favArr) : null;

  const kpis = [
    // 角色级联合分析有效样本 → 皇冠图标（deco/UI_ItemIcon_204.png），绿色
    { icon: kpiIcon('assets/img/deco/UI_ItemIcon_204.png', ''), label: '角色级有效样本 n', value: validChars.length.toLocaleString(), unit: '人', color: '#4ADE80' },
    // 可核实曲目样本 → 旋曜玉帛（icons/旋曜玉帛.png），紫色
    { icon: kpiIcon('assets/img/icons/旋曜玉帛.png', ''), label: '可核实曲目样本', value: census.length.toLocaleString(), unit: '首', color: '#8B5CF6' },
    // 红心数实测曲目 → 粉色（客户端 UI 粗粒度标签，2026-11-07 实测）
    { icon: kpiIcon('assets/img/icons/旋曜玉帛.png', ''), label: '红心数实测曲目（网易云）', value: census.filter(t => typeof t.fav === 'string').length.toLocaleString(), unit: '首', color: '#E2556E' },
    // 官方角色视频播放总量 → 名片装饰（deco/UI_NameCardIcon_0.png），金色
    { icon: kpiIcon('assets/img/deco/UI_NameCardIcon_0.png', ''), label: '官方角色视频播放总量', value: fmtCN(totalPv * 10000), unit: '', color: '#F59E0B' },
    // 播放 × 收藏相关系数 → 音乐宝石（deco/UI_ItemIcon_211.png），蓝金双色
    { icon: kpiIcon('assets/img/deco/UI_ItemIcon_211.png', ''), label: '播放 × 收藏 相关系数', value: r === null ? '—' : r.toFixed(3), unit: '', color: '#38BDF8' }
  ];

  el.innerHTML = kpis.map(k => `
    <div class="kpi-card kpi-card-h">
      <div class="kpi-glow" style="background:radial-gradient(circle at 20% 20%,${k.color}0a 0%,transparent 60%);"></div>
      <div class="kpi-icon-box" style="--kpi-color:${k.color};">
        <div class="kpi-icon-inner">${k.icon}</div>
      </div>
      <div class="kpi-text">
        <div class="kpi-value" style="color:${k.color};text-shadow:0 0 14px ${k.color}44;">${k.value}<span class="kpi-unit">${k.unit}</span></div>
        <div class="kpi-label">${k.label}</div>
      </div>
    </div>
  `).join('');
}

function renderPlatformMatrix() {
  const el = document.getElementById('platformMatrix');
  if (!el) return;
  const platforms = ['B站播放', 'B站收藏', 'B站弹幕'];
  const regionColors = {};
  REGIONS.forEach(r => { regionColors[r.id] = r.color; });
  
  /* ═══════════════════════════════════════════════════════════
   *  统一 story-heatmap 风格（和剧情场景/角色热力图完全一致）
   *    • 外框：border-gold + 12px 圆角 + shadow-sm
   *    • 细胞类：heatmap-cell heat-cell hlvl-X
   *    • 强度分级：与 style.css hlvl-1 ~ hlvl-5 完全对应
   * ═══════════════════════════════════════════════════════════ */
  const pfmCfg = [
    { name: 'B站播放', png: 'assets/img/deco/UI_NameCardIcon_0.png', color: '#FB7299', src: 'bilibili.com @原神 官方角色视频播放量' },
    { name: 'B站收藏', png: 'assets/img/icons/旋曜玉帛.png',         color: '#FE2C55', src: 'bilibili.com @原神 官方角色视频收藏数' },
    { name: 'B站弹幕', png: 'assets/img/deco/UI_ItemIcon_202.png',   color: '#F59E0B', src: 'bilibili.com @原神 官方角色视频弹幕数' }
  ];

  // 角色级指标仅统计有官方角色视频数据的角色
  const validChars = CHARACTERS.filter(c => typeof c.pv === 'number' && typeof c.fav === 'number' && typeof c.danmaku === 'number');
  const maxPvOne = Math.max(...validChars.map(c => c.pv));
  const maxFavOne = Math.max(...validChars.map(c => c.fav));
  const maxDmOne = Math.max(...validChars.map(c => c.danmaku));

  const ratioList = [];
  REGIONS.forEach(r => {
    const chars = validChars.filter(c => c.region === r.id);
    if (chars.length === 0) return;
    const pv = chars.reduce((s, c) => s + c.pv, 0);
    const nf = chars.reduce((s, c) => s + c.fav, 0);
    const dm = chars.reduce((s, c) => s + c.danmaku, 0);
    const mpv = maxPvOne * chars.length;
    const mnf = maxFavOne * chars.length;
    const mdm = maxDmOne * chars.length;
    [pv / mpv, nf / mnf, dm / mdm].forEach(ratio => ratioList.push(ratio));
  });
  const maxR = Math.max(...ratioList);

  let html = `<div class="story-heatmap" style="display:grid;grid-template-columns:110px repeat(${platforms.length},1fr);gap:1px;background:var(--border);border-radius:12px;overflow:hidden;border:1.5px solid var(--border-gold);box-shadow:var(--shadow-sm);min-width:560px;">`;
  // 表头
  html += `<div style="background:var(--surface-elevated);padding:12px 10px;font-size:12px;font-weight:600;text-align:center;color:var(--gold-light);border-bottom:2px solid var(--gold-dark);">地区\平台</div>`;
  pfmCfg.forEach(p => html += `<div style="background:var(--surface-elevated);padding:12px 8px;font-size:12px;font-weight:600;text-align:center;color:var(--gold-light);border-bottom:2px solid var(--gold-dark);border-left:1px solid rgba(201,162,39,0.15);" title="数据来源：${p.src}" class="matrix-header">
    <img src="${p.png}" style="width:14px;height:14px;vertical-align:-3px;margin-right:5px;" onerror="this.style.display='none'"/>
    <span style="color:${p.color};font-weight:700;">${p.name}</span>
  </div>`);

  REGIONS.forEach(r => {
    const chars = validChars.filter(c => c.region === r.id);
    if (chars.length === 0) return;
    const pv = chars.reduce((s, c) => s + c.pv, 0);
    const nf = chars.reduce((s, c) => s + c.fav, 0);
    const dm = chars.reduce((s, c) => s + c.danmaku, 0);
    const mpv = maxPvOne * chars.length;
    const mnf = maxFavOne * chars.length;
    const mdm = maxDmOne * chars.length;

    html += `<div class="heatmap-cell heat-cell h r-label" style="background:var(--surface-elevated);padding:12px 14px;font-size:12px;font-weight:600;color:${regionColors[r.id]};text-align:left;border-top:1px solid rgba(201,162,39,0.1);">${r.name}<small style="display:block;color:var(--text-quaternary);font-weight:400;font-size:10px;">有效 n=${chars.length}</small></div>`;
    [pv / mpv, nf / mnf, dm / mdm].forEach(ratio => {
      const inten = Math.round(ratio * 100);
      const norm = maxR > 0 ? ratio / maxR : 0;
      let lvl = inten === 0 ? 0 : (norm < 0.22 ? 1 : (norm < 0.42 ? 2 : (norm < 0.62 ? 3 : (norm < 0.82 ? 4 : 5))));
      const cls = inten === 0 ? 'hlvl-0' : `hlvl-${lvl}`;
      const display = inten === 0 ? '—' : `${inten}%`;
      html += `<div class="heatmap-cell heat-cell ${cls}" data-v="${inten}" style="display:flex;align-items:center;justify-content:center;border-top:1px solid rgba(201,162,39,0.08);font-weight:${inten > 60 ? 700 : 600};font-size:15px;font-variant-numeric:tabular-nums;letter-spacing:0.5px;${inten > 60 ? 'color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.35);' : ''}">${display}</div>`;
    });
  });
  html += '</div>';
  // 图例（与 story-heatmap 完全一致）
  html += `<div class="legend legend-bottom" style="margin-top:14px;justify-content:flex-end;gap:10px;flex-wrap:wrap;">
    <span style="font-size:11px;color:var(--text-tertiary);margin-right:6px;">相对全角色最大值</span>
    <span class="legend-item"><span class="legend-swatch" style="background:rgba(255,255,255,0.02);border:1px solid var(--border);"></span>—</span>
    <span class="legend-item"><span class="legend-swatch hlvl-1"></span>低</span>
    <span class="legend-item"><span class="legend-swatch hlvl-2"></span>较低</span>
    <span class="legend-item"><span class="legend-swatch hlvl-3"></span>中</span>
    <span class="legend-item"><span class="legend-swatch hlvl-4"></span>较高</span>
    <span class="legend-item"><span class="legend-swatch hlvl-5"></span>极高</span>
  </div>`;
  el.innerHTML = html;

  // 添加数据导出
  const matrixCard = el.closest('.card');
  if (matrixCard && !matrixCard.querySelector('.export-btn')) {
    const exportData = REGIONS.filter(r => validChars.some(c => c.region === r.id)).map(r => {
      const chars = validChars.filter(c => c.region === r.id);
      return {
        地区: r.name,
        角色数: chars.length,
        B站官方角色视频播放万: chars.reduce((s, c) => s + c.pv, 0),
        B站官方角色视频收藏: Math.round(chars.reduce((s, c) => s + c.fav, 0) * 1000),
        B站官方角色视频弹幕: Math.round(chars.reduce((s, c) => s + c.danmaku, 0) * 1000)
      };
    });
    const btn = document.createElement('button');
    btn.className = 'export-btn';
    btn.textContent = '导出数据';
    btn.setAttribute('aria-label', '导出此图表的数据');
    btn.addEventListener('click', () => window.exportData(exportData, 'B站官方角色视频地区矩阵数据', 'csv'));
    matrixCard.appendChild(btn);
  }
}

// ==================== 关键发现渲染 ====================
function renderKeyFindings() {
  // 角色级指标仅统计有官方角色视频数据的角色
  const validChars = CHARACTERS.filter(c => typeof c.pv === 'number' && typeof c.fav === 'number' && typeof c.danmaku === 'number');
  const topChar = [...validChars].sort((a, b) => b.pv - a.pv)[0];

  // 曲目样本统一来自 getVerifiedTrackCensus（按中文曲名去重，仅含真实指标）
  const census = (typeof getVerifiedTrackCensus === 'function') ? getVerifiedTrackCensus() : [];
  const allTracks = census.map(t => ({
    name: t.name,
    region: t.region,
    version: t.version,
    type: (t.type === 'album' ? '专辑曲目' : t.type),
    neteaseCmt: t.cmt,
    biliPlay: t.play,
    neteaseFav: (typeof t.fav === 'string') ? t.fav : null,
    albumName: t.album
  }));
  const topTrack = [...allTracks].filter(t => typeof t.neteaseCmt === 'number').sort((a, b) => b.neteaseCmt - a.neteaseCmt)[0];

  // 全站真实数据汇总（曲目级）
  const cmtTotal = allTracks.reduce((s, t) => s + (t.neteaseCmt || 0), 0);
  const playTotal = allTracks.reduce((s, t) => s + (t.biliPlay || 0), 0);
  // 官方角色视频播放总量与首位占比，用于描述集中度
  const pvTotal = validChars.reduce((s, c) => s + c.pv, 0);

  const t1 = document.getElementById('insightTop1');
  const t2 = document.getElementById('insightTop2');
  const t3 = document.getElementById('insightTop3');

  if (t1 && topChar) {
    const pvRank = statPercentileRank(validChars.map(c => c.pv), topChar.pv);
    t1.innerHTML = `
      <strong style="color:var(--gold-light);font-size:16px;">${topChar.name}</strong><br>
      <span style="color:var(--text-secondary);font-size:12px;">${rName(topChar.region)} · ${topChar.rarity}星 · ${topChar.element} · 官方角色视频播放第 1 位</span><br>
      <span style="display:inline-flex;align-items:center;gap:2px;margin-top:4px;flex-wrap:wrap;">
        <img src="assets/img/deco/UI_NameCardIcon_0.png" style="width:12px;height:12px;vertical-align:-2px;" onerror="this.style.display='none'" title="来源：bilibili.com @原神 官方角色视频播放量"/>
        <span style="color:#FB7299;font-weight:600;">${(topChar.pv).toFixed(1)}万</span>
        <span style="color:var(--text-tertiary);font-size:10px;margin-left:4px;">官方角色视频播放 · 百分位 ${pvRank === null ? '—' : pvRank.toFixed(0)}</span>
      </span>
      <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px;">占全站官方角色视频播放总量的 ${pvTotal ? ((topChar.pv / pvTotal) * 100).toFixed(1) : '—'}%</div>
    `;
  }
  if (t2 && topTrack) {
    t2.innerHTML = `
      <strong style="color:var(--gold-light);font-size:16px;">《${topTrack.name}》</strong><br>
      <span style="color:var(--text-secondary);font-size:12px;">${rName(topTrack.region)} · v${topTrack.version} · ${topTrack.type}${topTrack.albumName ? ' · ' + topTrack.albumName : ''}</span><br>
      <span style="display:inline-flex;align-items:center;gap:10px;margin-top:4px;flex-wrap:wrap;">
        ${typeof topTrack.neteaseCmt === 'number' ? `<span style="display:inline-flex;align-items:center;gap:3px;">
          <img src="assets/img/items/UI_ItemIcon_112001.png" style="width:12px;height:12px;vertical-align:-2px;" onerror="this.style.display='none'"/>
          <span style="color:#FE2C55;font-weight:600;">${fmt(topTrack.neteaseCmt)}</span>
          <span style="color:var(--text-tertiary);font-size:10px;">网易云评论</span>
        </span>` : ''}
        ${typeof topTrack.biliPlay === 'number' ? `<span style="display:inline-flex;align-items:center;gap:3px;">
          <img src="assets/img/deco/UI_NameCardIcon_0.png" style="width:12px;height:12px;vertical-align:-2px;" onerror="this.style.display='none'"/>
          <span style="color:#FB7299;font-weight:600;">${fmt(topTrack.biliPlay)}</span>
          <span style="color:var(--text-tertiary);font-size:10px;">B站播放</span>
        </span>` : ''}
        ${topTrack.neteaseFav ? `<span style="display:inline-flex;align-items:center;gap:3px;" title="网易云红心数（客户端 UI 显示值，2026-11-07 实测）">
          <span style="color:#E2556E;font-weight:600;">红心${topTrack.neteaseFav}</span>
        </span>` : ''}
      </span>
      <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px;">为曲目评论中位数的 ${cmtTotal ? (topTrack.neteaseCmt / Math.max(statMedian(census.filter(t => typeof t.cmt === 'number').map(t => t.cmt)), 1)).toFixed(1) : '—'} 倍</div>
    `;
  }
  if (t3) {
    t3.innerHTML = `
      <strong style="color:var(--gold-light);font-size:16px;">${allTracks.length} 首可核实曲目</strong><br>
      <span style="color:var(--text-secondary);font-size:12px;">去重样本 · 真实互动总量</span><br>
      <span style="display:inline-flex;align-items:center;gap:4px;margin-top:4px;flex-wrap:wrap;">
        <span style="display:inline-flex;align-items:center;gap:1px;">
          <img src="assets/img/items/UI_ItemIcon_112001.png" style="width:9px;height:9px;vertical-align:-1px;" onerror="this.style.display='none'"/>
          <span style="color:#FE2C55;font-weight:600;font-size:11px;">${fmt(cmtTotal)}</span>
          <span style="color:var(--text-tertiary);font-size:10px;">评论</span>
        </span>
        <span style="color:var(--text-quaternary);">|</span>
        <span style="display:inline-flex;align-items:center;gap:1px;">
          <img src="assets/img/deco/UI_NameCardIcon_0.png" style="width:9px;height:9px;vertical-align:-1px;" onerror="this.style.display='none'"/>
          <span style="color:#FB7299;font-weight:600;font-size:11px;">${fmt(playTotal)}</span>
          <span style="color:var(--text-tertiary);font-size:10px;">播放</span>
        </span>
        <span style="color:var(--text-quaternary);">|</span>
        <span style="display:inline-flex;align-items:center;gap:1px;" title="网易云红心数为客户端 UI 粗粒度标签，此处仅统计实测覆盖曲目数，不加总">
          <span style="color:#E2556E;font-weight:600;font-size:11px;">${allTracks.filter(t => t.neteaseFav).length}</span>
          <span style="color:var(--text-tertiary);font-size:10px;">首红心实测</span>
        </span>
      </span>
      <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px;">样本占官方收录 1909 首的 ${((allTracks.length / 1909) * 100).toFixed(1)}%</div>
    `;
  }

  // ── 给三个"关键发现"卡片标题前插入原神素材图标 PNG ──
  const findings = document.querySelectorAll('.insight-finding');
  const cfg = [
    { png: 'assets/img/deco/UI_ItemIcon_204.png' }, // 第一名皇冠图标
    { png: 'assets/img/items/UI_ItemIcon_112002.png' }, // 岩之印代表"璃月曲目"
    { png: 'assets/img/deco/UI_ItemIcon_108.png' }, // 数据洞察分析试剂
  ];
  findings.forEach((f, i) => {
    if (!cfg[i]) return;
    const h = f.querySelector('h4');
    if (!h) return;
    if (h.querySelector('.finding-ico')) return;
    h.insertAdjacentHTML('afterbegin', findingIcon(cfg[i].png, cfg[i].emoji));
  });
}

function renderTrend() {
  const svg = document.getElementById('trendSvg');
  if (!svg) return;
  svg.innerHTML = '';
  const order = ['mondstadt', 'liyue', 'inazuma', 'sumeru', 'fontaine', 'natlan', 'nodkrai', 'snezhnaya'];
  const data = order.map(rid => {
    const chars = CHARACTERS.filter(c => c.region === rid && typeof c.pv === 'number');
    if (!chars.length) return null;
    const vals = chars.map(c => c.pv);
    return {
      label: rName(rid),
      mean: statMean(vals),
      median: statMedian(vals),
      count: vals.length,
      rid,
      maxPv: Math.max(...vals),
      minPv: Math.min(...vals)
    };
  }).filter(Boolean).sort((a, b) => b.mean - a.mean);
  if (!data.length) {
    svg.innerHTML = '<text x="375" y="150" text-anchor="middle" font-size="13" fill="var(--text-tertiary)">暂无官方角色视频播放数据</text>';
    return;
  }

  const maxV = Math.max(...data.flatMap(d => [d.mean, d.median]), 1);
  const M = { l: 62, r: 24, t: 42, b: 64 }, W = 750, H = 300;
  const w = W - M.l - M.r, h = H - M.t - M.b;
  const NS = 'http://www.w3.org/2000/svg';

  // 渐变定义：均值柱按地区色生成（上亮下深），中位数柱统一紫色
  const defs = document.createElementNS(NS, 'defs');
  data.forEach(d => {
    const g = document.createElementNS(NS, 'linearGradient');
    g.setAttribute('id', `trendG-${d.rid}`);
    g.setAttribute('x1', '0%'); g.setAttribute('y1', '0%');
    g.setAttribute('x2', '0%'); g.setAttribute('y2', '100%');
    g.innerHTML = `<stop offset="0%" stop-color="${rColor(d.rid)}" stop-opacity="0.98"/><stop offset="100%" stop-color="${rColor(d.rid)}" stop-opacity="0.42"/>`;
    defs.appendChild(g);
  });
  const gMed = document.createElementNS(NS, 'linearGradient');
  gMed.setAttribute('id', 'trendG-med');
  gMed.setAttribute('x1', '0%'); gMed.setAttribute('y1', '0%');
  gMed.setAttribute('x2', '0%'); gMed.setAttribute('y2', '100%');
  gMed.innerHTML = `<stop offset="0%" stop-color="#8B5CF6" stop-opacity="0.92"/><stop offset="100%" stop-color="#8B5CF6" stop-opacity="0.38"/>`;
  defs.appendChild(gMed);
  svg.appendChild(defs);

  // 网格 + Y轴
  for (let i = 0; i <= 5; i++) {
    const y = M.t + (i / 5) * h;
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', M.l); line.setAttribute('y1', y); line.setAttribute('x2', W - M.r); line.setAttribute('y2', y);
    line.setAttribute('stroke', 'var(--border)'); line.setAttribute('stroke-width', '0.5');
    line.setAttribute('stroke-dasharray', '4,4'); line.setAttribute('stroke-opacity', '0.5');
    svg.appendChild(line);
    const lab = document.createElementNS(NS, 'text');
    lab.setAttribute('x', M.l - 10); lab.setAttribute('y', y + 3); lab.setAttribute('text-anchor', 'end');
    lab.setAttribute('font-size', '10'); lab.setAttribute('fill', 'var(--text-tertiary)');
    lab.textContent = Math.round((1 - i / 5) * maxV);
    svg.appendChild(lab);
  }

  const groupW = w / data.length;
  const barW = Math.min(20, groupW * 0.26);
  data.forEach((d, i) => {
    const groupX = M.l + i * groupW;
    const color = rColor(d.rid);
    const series = [
      { key: 'mean', val: d.mean, fill: `url(#trendG-${d.rid})`, color, label: '均值' },
      { key: 'median', val: d.median, fill: 'url(#trendG-med)', color: '#8B5CF6', label: '中位数' }
    ];
    series.forEach((s, j) => {
      const barH = s.val / maxV * h;
      const x = groupX + groupW * 0.24 + j * (barW + 5);
      const y = M.t + h - barH;
      const rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('x', x); rect.setAttribute('y', y);
      rect.setAttribute('width', barW); rect.setAttribute('height', Math.max(1, barH));
      rect.setAttribute('rx', '3'); rect.setAttribute('fill', s.fill);
      rect.setAttribute('stroke', s.color); rect.setAttribute('stroke-opacity', '0.55'); rect.setAttribute('stroke-width', '1');
      rect.style.cursor = 'pointer';
      rect.style.transition = 'filter 0.2s ease';
      rect.addEventListener('mouseenter', (e) => {
        rect.style.filter = 'brightness(1.3)';
        showTooltip(e.clientX + 15, e.clientY - 10, `
          <div class="tooltip-title">${d.label} · ${s.label}</div>
          <div class="tooltip-item"><span class="tooltip-label">${s.label}播放</span><span class="tooltip-value">${Math.round(s.val)}万</span></div>
          <div class="tooltip-item"><span class="tooltip-label">有效角色 n</span><span class="tooltip-value">${d.count}</span></div>
          <div class="tooltip-item"><span class="tooltip-label">最高 / 最低</span><span class="tooltip-value">${Math.round(d.maxPv)} / ${Math.round(d.minPv)}万</span></div>
        `);
      });
      rect.addEventListener('mouseleave', () => { rect.style.filter = ''; hideTooltip(); });
      rect.addEventListener('click', () => { window.location.href = `region.html?r=${d.rid}`; });
      svg.appendChild(rect);
    });

    // 均值柱顶数值标签（带描边光晕，避免与网格线混叠）
    const valLab = document.createElementNS(NS, 'text');
    const meanBarH = d.mean / maxV * h;
    valLab.setAttribute('x', groupX + groupW * 0.24 + barW / 2);
    valLab.setAttribute('y', M.t + h - meanBarH - 5);
    valLab.setAttribute('text-anchor', 'middle');
    valLab.setAttribute('font-size', '9.5'); valLab.setAttribute('font-weight', '700');
    valLab.setAttribute('fill', color);
    valLab.setAttribute('paint-order', 'stroke');
    valLab.setAttribute('stroke', 'var(--surface-elevated)');
    valLab.setAttribute('stroke-width', '3');
    valLab.textContent = Math.round(d.mean);
    svg.appendChild(valLab);

    const lab = document.createElementNS(NS, 'text');
    lab.setAttribute('x', groupX + groupW / 2); lab.setAttribute('y', H - M.b + 22); lab.setAttribute('text-anchor', 'middle');
    lab.setAttribute('font-size', '11'); lab.setAttribute('fill', 'var(--text-secondary)'); lab.setAttribute('font-weight', '500');
    lab.textContent = d.label; lab.style.cursor = 'pointer';
    lab.addEventListener('click', () => { window.location.href = `region.html?r=${d.rid}`; });
    svg.appendChild(lab);

    const nlab = document.createElementNS(NS, 'text');
    nlab.setAttribute('x', groupX + groupW / 2); nlab.setAttribute('y', H - M.b + 38); nlab.setAttribute('text-anchor', 'middle');
    nlab.setAttribute('font-size', '9'); nlab.setAttribute('fill', 'var(--text-quaternary)');
    nlab.textContent = `n=${d.count}`;
    svg.appendChild(nlab);
  });

  const legendData = [{ l: '均值', c: '#C9A227', o: 0.82 }, { l: '中位数', c: '#8B5CF6', o: 0.6 }];
  legendData.forEach((x, i) => {
    const gx = M.l + i * 100, gy = 22;
    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', gx); rect.setAttribute('y', gy - 9); rect.setAttribute('width', 12); rect.setAttribute('height', 12);
    rect.setAttribute('rx', '2'); rect.setAttribute('fill', x.c); rect.setAttribute('fill-opacity', x.o);
    svg.appendChild(rect);
    const tx = document.createElementNS(NS, 'text');
    tx.setAttribute('x', gx + 18); tx.setAttribute('y', gy); tx.setAttribute('font-size', '10'); tx.setAttribute('fill', 'var(--text-secondary)');
    tx.textContent = x.l;
    svg.appendChild(tx);
  });

  const ytitle = document.createElementNS(NS, 'text');
  ytitle.setAttribute('x', 14); ytitle.setAttribute('y', M.t + h / 2); ytitle.setAttribute('text-anchor', 'middle');
  ytitle.setAttribute('font-size', '11'); ytitle.setAttribute('fill', 'var(--text-tertiary)');
  ytitle.setAttribute('transform', `rotate(-90,14,${M.t + h / 2})`);
  ytitle.textContent = '官方角色视频播放（万）';
  svg.appendChild(ytitle);

  const trendCard = svg.closest('.card');
  if (trendCard && !trendCard.querySelector('.export-btn')) {
    const exportData = data.map(d => ({ 地区: d.label, 播放均值万: Math.round(d.mean), 播放中位数万: Math.round(d.median), 有效角色数: d.count, 最高播放万: Math.round(d.maxPv), 最低播放万: Math.round(d.minPv) }));
    const btn = document.createElement('button');
    btn.className = 'export-btn';
    btn.textContent = '导出数据';
    btn.setAttribute('aria-label', '导出地区角色视频播放数据');
    btn.addEventListener('click', () => window.exportData(exportData, '地区角色视频播放对比', 'csv'));
    trendCard.appendChild(btn);
  }
}

function renderSankey() {
  const svg = document.getElementById('sankeySvg');
  if (!svg) return;
  svg.innerHTML = '';
  const NS = 'http://www.w3.org/2000/svg';

  // 同一批三项指标完整的角色；三组仅比较各自总量，不构成顺序转化。
  const validChars = CHARACTERS.filter(c => typeof c.pv === 'number' && typeof c.fav === 'number' && typeof c.danmaku === 'number');
  const stages = [
    { name: 'B站播放', value: validChars.reduce((s, c) => s + c.pv, 0) * 10000, color: '#FB7299', iconPng: 'assets/img/deco/UI_NameCardIcon_0.png' },
    { name: 'B站收藏', value: validChars.reduce((s, c) => s + c.fav, 0) * 1000, color: '#FE2C55', iconPng: 'assets/img/items/UI_ItemIcon_112001.png' },
    { name: 'B站弹幕', value: validChars.reduce((s, c) => s + c.danmaku, 0) * 1000, color: '#F59E0B', iconPng: 'assets/img/deco/UI_ItemIcon_202.png' }
  ];
  const base = stages[0].value || 1;
  stages.forEach(s => { s.rate = s.value / base * 100; });

  const W = 700, H = 280, M = { l: 96, r: 150, t: 44, b: 48 };
  const maxW = W - M.l - M.r;

  // 渐变定义：每条指标条从亮到暗，轨道更立体
  const defs = document.createElementNS(NS, 'defs');
  stages.forEach((s, i) => {
    const g = document.createElementNS(NS, 'linearGradient');
    g.setAttribute('id', `skG-${i}`);
    g.setAttribute('x1', '0%'); g.setAttribute('y1', '0%');
    g.setAttribute('x2', '100%'); g.setAttribute('y2', '0%');
    g.innerHTML = `<stop offset="0%" stop-color="${s.color}" stop-opacity="0.95"/><stop offset="100%" stop-color="${s.color}" stop-opacity="0.55"/>`;
    defs.appendChild(g);
  });
  svg.appendChild(defs);

  const title = document.createElementNS(NS, 'text');
  title.setAttribute('x', 20); title.setAttribute('y', 24);
  title.setAttribute('font-size', '13'); title.setAttribute('font-weight', '600'); title.setAttribute('fill', 'var(--gold-light)');
  title.textContent = `同一批 ${validChars.length} 名角色视频的三项指标总量（播放 = 100%）`;
  svg.appendChild(title);

  stages.forEach((s, i) => {
    const y = M.t + i * 62;
    const barW = Math.max(2, s.value / base * maxW);

    const label = document.createElementNS(NS, 'text');
    label.setAttribute('x', M.l - 12); label.setAttribute('y', y + 20);
    label.setAttribute('text-anchor', 'end'); label.setAttribute('font-size', '12');
    label.setAttribute('fill', 'var(--text-secondary)'); label.setAttribute('font-weight', '600');
    label.textContent = s.name;
    svg.appendChild(label);

    const bg = document.createElementNS(NS, 'rect');
    bg.setAttribute('x', M.l); bg.setAttribute('y', y); bg.setAttribute('width', maxW); bg.setAttribute('height', 30);
    bg.setAttribute('rx', '6'); bg.setAttribute('fill', 'var(--surface)');
    bg.setAttribute('stroke', 'var(--border-gold)'); bg.setAttribute('stroke-opacity', '0.28'); bg.setAttribute('stroke-width', '1');
    svg.appendChild(bg);

    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', M.l); rect.setAttribute('y', y); rect.setAttribute('width', barW); rect.setAttribute('height', 30);
    rect.setAttribute('rx', '6'); rect.setAttribute('fill', `url(#skG-${i})`);
    rect.setAttribute('stroke', s.color); rect.setAttribute('stroke-opacity', '0.5'); rect.setAttribute('stroke-width', '1');
    rect.style.cursor = 'pointer';
    rect.style.transition = 'filter 0.2s ease';
    rect.addEventListener('mouseenter', (e) => {
      rect.style.filter = 'brightness(1.25)';
      showTooltip(e.clientX + 15, e.clientY - 10, `
        <div class="tooltip-title"><img src="${s.iconPng}" onerror="this.style.display='none'" style="width:16px;height:16px;vertical-align:-3px;margin-right:4px;"/>${s.name}</div>
        <div class="tooltip-item"><span class="tooltip-label">总量</span><span class="tooltip-value">${fmtCN(s.value)}</span></div>
        <div class="tooltip-item"><span class="tooltip-label">相对播放总量</span><span class="tooltip-value">${s.rate.toFixed(1)}%</span></div>
        <div class="tooltip-item"><span class="tooltip-label">有效角色 n</span><span class="tooltip-value">${validChars.length}</span></div>
        <div class="tooltip-item"><span class="tooltip-label">说明</span><span class="tooltip-value">同一视频的不同互动指标，不可相加或换算为转化率</span></div>
      `);
    });
    rect.addEventListener('mouseleave', () => { rect.style.filter = ''; hideTooltip(); });
    svg.appendChild(rect);

    const value = document.createElementNS(NS, 'text');
    value.setAttribute('x', M.l + maxW + 10); value.setAttribute('y', y + 13);
    value.setAttribute('font-size', '11'); value.setAttribute('fill', s.color); value.setAttribute('font-weight', '700');
    value.setAttribute('paint-order', 'stroke');
    value.setAttribute('stroke', 'var(--surface-elevated)');
    value.setAttribute('stroke-width', '3');
    value.textContent = fmtCN(s.value);
    svg.appendChild(value);

    const pct = document.createElementNS(NS, 'text');
    pct.setAttribute('x', M.l + maxW + 10); pct.setAttribute('y', y + 27);
    pct.setAttribute('font-size', '10'); pct.setAttribute('fill', 'var(--text-tertiary)');
    pct.textContent = `占播放总量 ${s.rate.toFixed(1)}%`;
    svg.appendChild(pct);
  });

  const note = document.createElementNS(NS, 'text');
  note.setAttribute('x', 20); note.setAttribute('y', H - 14);
  note.setAttribute('font-size', '9'); note.setAttribute('fill', 'var(--text-tertiary)');
  note.textContent = '数据来源：B站「原神」官方账号角色视频，同一支视频的播放/收藏/弹幕。三条互不相连，仅比较规模。';
  svg.appendChild(note);

  const sankeyCard = svg.closest('.card');
  if (sankeyCard && !sankeyCard.querySelector('.export-btn')) {
    const exportData = stages.map(s => ({ 指标: s.name, 总量: s.value, 相对播放总量: s.rate.toFixed(2) + '%', 有效角色数: validChars.length }));
    const btn = document.createElement('button');
    btn.className = 'export-btn';
    btn.textContent = '导出数据';
    btn.setAttribute('aria-label', '导出官方角色视频互动规模数据');
    btn.addEventListener('click', () => window.exportData(exportData, '官方角色视频互动规模数据', 'csv'));
    sankeyCard.appendChild(btn);
  }
}

function renderBox() {
  const svg = document.getElementById('boxSvg');
  if (!svg) return;
  svg.innerHTML = '';
  const NS = 'http://www.w3.org/2000/svg';

  const five = CHARACTERS.filter(c => c.rarity === 5 && typeof c.pv === 'number').map(c => c.pv);
  const four = CHARACTERS.filter(c => c.rarity === 4 && typeof c.pv === 'number').map(c => c.pv);

  function stats(arr) {
    return {
      min: Math.min(...arr),
      q1: statQ1(arr),
      med: statMedian(arr),
      q3: statQ3(arr),
      max: Math.max(...arr),
      avg: statMean(arr)
    };
  }

  const s5 = stats(five), s4 = stats(four);
  const all = [...five, ...four];
  const minV = Math.min(...all), maxV = Math.max(...all);

  // 分箱统计，构建镜像直方图
  const binCount = 12;
  const binWidth = (maxV - minV) / binCount || 1;
  const bins5 = new Array(binCount).fill(0);
  const bins4 = new Array(binCount).fill(0);

  five.forEach(v => {
    const idx = Math.min(binCount - 1, Math.floor((v - minV) / binWidth));
    bins5[idx]++;
  });
  four.forEach(v => {
    const idx = Math.min(binCount - 1, Math.floor((v - minV) / binWidth));
    bins4[idx]++;
  });

  const maxCount = Math.max(...bins5, ...bins4, 1);

  const W = 600, H = 220;
  const M = { l: 70, r: 30, t: 40, b: 55 };
  const w = W - M.l - M.r;
  const halfH = (H - M.t - M.b) / 2;
  const binW = w / binCount;

  // 渐变定义
  const defs = document.createElementNS(NS, 'defs');
  const grad5 = document.createElementNS(NS, 'linearGradient');
  grad5.setAttribute('id', 'distGrad5');
  grad5.setAttribute('x1', '0%'); grad5.setAttribute('y1', '0%');
  grad5.setAttribute('x2', '0%'); grad5.setAttribute('y2', '100%');
  grad5.innerHTML = `<stop offset="0%" stop-color="#F59E0B" stop-opacity="0.9"/><stop offset="100%" stop-color="#F59E0B" stop-opacity="0.35"/>`;
  defs.appendChild(grad5);

  const grad4 = document.createElementNS(NS, 'linearGradient');
  grad4.setAttribute('id', 'distGrad4');
  grad4.setAttribute('x1', '0%'); grad4.setAttribute('y1', '100%');
  grad4.setAttribute('x2', '0%'); grad4.setAttribute('y2', '0%');
  grad4.innerHTML = `<stop offset="0%" stop-color="#6366F1" stop-opacity="0.9"/><stop offset="100%" stop-color="#6366F1" stop-opacity="0.35"/>`;
  defs.appendChild(grad4);
  svg.appendChild(defs);

  // 标题
  const title = document.createElementNS(NS, 'text');
  title.setAttribute('x', W / 2); title.setAttribute('y', 24);
  title.setAttribute('text-anchor', 'middle');
  title.setAttribute('font-size', '14'); title.setAttribute('font-weight', '600');
  title.setAttribute('fill', 'var(--gold-light)');
  title.textContent = '5星 vs 4星角色官方视频播放量分布对比';
  svg.appendChild(title);

  // 网格线与X轴标签
  for (let i = 0; i <= 4; i++) {
    const v = minV + (i / 4) * (maxV - minV);
    const x = M.l + (i / 4) * w;
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', x); line.setAttribute('y1', M.t);
    line.setAttribute('x2', x); line.setAttribute('y2', H - M.b);
    line.setAttribute('stroke', 'var(--border)'); line.setAttribute('stroke-width', '0.5');
    line.setAttribute('stroke-dasharray', '3,5'); line.setAttribute('stroke-opacity', '0.4');
    svg.appendChild(line);

    const lab = document.createElementNS(NS, 'text');
    lab.setAttribute('x', x); lab.setAttribute('y', H - M.b + 18);
    lab.setAttribute('text-anchor', 'middle');
    lab.setAttribute('font-size', '9'); lab.setAttribute('fill', 'var(--text-tertiary)');
    lab.textContent = Math.round(v);
    svg.appendChild(lab);
  }

  // 中心分隔线
  const centerLine = document.createElementNS(NS, 'line');
  centerLine.setAttribute('x1', M.l); centerLine.setAttribute('y1', M.t + halfH);
  centerLine.setAttribute('x2', M.l + w); centerLine.setAttribute('y2', M.t + halfH);
  centerLine.setAttribute('stroke', 'var(--border)'); centerLine.setAttribute('stroke-width', '1');
  centerLine.setAttribute('stroke-opacity', '0.6');
  svg.appendChild(centerLine);

  // 绘制镜像直方图
  for (let i = 0; i < binCount; i++) {
    const x = M.l + i * binW + 1;
    const bw = binW - 2;
    const rangeStart = minV + i * binWidth;
    const rangeEnd = minV + (i + 1) * binWidth;

    // 5星：上半部分，向上延伸
    const h5 = (bins5[i] / maxCount) * (halfH - 10);
    if (h5 > 0) {
      const rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('x', x); rect.setAttribute('y', M.t + halfH - h5);
      rect.setAttribute('width', bw); rect.setAttribute('height', h5);
      rect.setAttribute('fill', 'url(#distGrad5)');
      rect.setAttribute('stroke', '#F59E0B'); rect.setAttribute('stroke-opacity', '0.5'); rect.setAttribute('stroke-width', '1');
      rect.setAttribute('rx', '2');
      rect.style.cursor = 'pointer';
      rect.style.transition = 'filter 0.2s ease';
      rect.addEventListener('mouseenter', (e) => {
        rect.style.filter = 'brightness(1.3)';
        showTooltip(e.clientX + 15, e.clientY - 10, `
          <div class="tooltip-title">5星角色分布</div>
          <div class="tooltip-item"><span class="tooltip-label">播放区间</span><span class="tooltip-value">${Math.round(rangeStart)}-${Math.round(rangeEnd)}万</span></div>
          <div class="tooltip-item"><span class="tooltip-label">角色数</span><span class="tooltip-value">${bins5[i]}人</span></div>
        `);
      });
      rect.addEventListener('mouseleave', () => { rect.style.filter = ''; hideTooltip(); });
      svg.appendChild(rect);
    }

    // 4星：下半部分，向下延伸
    const h4 = (bins4[i] / maxCount) * (halfH - 10);
    if (h4 > 0) {
      const rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('x', x); rect.setAttribute('y', M.t + halfH + 2);
      rect.setAttribute('width', bw); rect.setAttribute('height', h4);
      rect.setAttribute('fill', 'url(#distGrad4)');
      rect.setAttribute('stroke', '#6366F1'); rect.setAttribute('stroke-opacity', '0.5'); rect.setAttribute('stroke-width', '1');
      rect.setAttribute('rx', '2');
      rect.style.cursor = 'pointer';
      rect.style.transition = 'filter 0.2s ease';
      rect.addEventListener('mouseenter', (e) => {
        rect.style.filter = 'brightness(1.3)';
        showTooltip(e.clientX + 15, e.clientY - 10, `
          <div class="tooltip-title">4星角色分布</div>
          <div class="tooltip-item"><span class="tooltip-label">播放区间</span><span class="tooltip-value">${Math.round(rangeStart)}-${Math.round(rangeEnd)}万</span></div>
          <div class="tooltip-item"><span class="tooltip-label">角色数</span><span class="tooltip-value">${bins4[i]}人</span></div>
        `);
      });
      rect.addEventListener('mouseleave', () => { rect.style.filter = ''; hideTooltip(); });
      svg.appendChild(rect);
    }
  }

  // X 轴基线
  const baseLine = document.createElementNS(NS, 'line');
  baseLine.setAttribute('x1', M.l); baseLine.setAttribute('y1', H - M.b);
  baseLine.setAttribute('x2', M.l + w); baseLine.setAttribute('y2', H - M.b);
  baseLine.setAttribute('stroke', 'var(--border-gold)'); baseLine.setAttribute('stroke-width', '1');
  baseLine.setAttribute('stroke-opacity', '0.45');
  svg.appendChild(baseLine);

  // 均值/中位数标记线
  function drawStatLine(value, color, label, yOffset) {
    const x = M.l + ((value - minV) / (maxV - minV)) * w;
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', x); line.setAttribute('y1', M.t + 5);
    line.setAttribute('x2', x); line.setAttribute('y2', H - M.b - 5);
    line.setAttribute('stroke', color); line.setAttribute('stroke-width', '1.5');
    line.setAttribute('stroke-dasharray', '5,3'); line.setAttribute('opacity', '0.8');
    svg.appendChild(line);

    const lab = document.createElementNS(NS, 'text');
    lab.setAttribute('x', x + 5); lab.setAttribute('y', yOffset);
    lab.setAttribute('font-size', '9'); lab.setAttribute('font-weight', '600');
    lab.setAttribute('fill', color);
    lab.setAttribute('paint-order', 'stroke');
    lab.setAttribute('stroke', 'var(--surface-elevated)');
    lab.setAttribute('stroke-width', '3');
    lab.textContent = `${label}:${Math.round(value)}`;
    svg.appendChild(lab);
  }

  drawStatLine(s5.med, '#F59E0B', '5星中位', M.t + 14);
  drawStatLine(s4.med, '#6366F1', '4星中位', H - M.b - 8);

  // 图例
  const legend = document.createElementNS(NS, 'g');
  legend.setAttribute('transform', `translate(${M.l}, ${H - 28})`);

  const l1 = document.createElementNS(NS, 'rect');
  l1.setAttribute('x', 0); l1.setAttribute('y', 0); l1.setAttribute('width', 12); l1.setAttribute('height', 8);
  l1.setAttribute('fill', '#F59E0B'); l1.setAttribute('rx', '2');
  legend.appendChild(l1);
  const t1 = document.createElementNS(NS, 'text');
  t1.setAttribute('x', 18); t1.setAttribute('y', 7);
  t1.setAttribute('font-size', '10'); t1.setAttribute('fill', 'var(--text-secondary)');
  t1.textContent = `5星 (${five.length}人)`;
  legend.appendChild(t1);

  const l2 = document.createElementNS(NS, 'rect');
  l2.setAttribute('x', 100); l2.setAttribute('y', 0); l2.setAttribute('width', 12); l2.setAttribute('height', 8);
  l2.setAttribute('fill', '#6366F1'); l2.setAttribute('rx', '2');
  legend.appendChild(l2);
  const t2 = document.createElementNS(NS, 'text');
  t2.setAttribute('x', 118); t2.setAttribute('y', 7);
  t2.setAttribute('font-size', '10'); t2.setAttribute('fill', 'var(--text-secondary)');
  t2.textContent = `4星 (${four.length}人)`;
  legend.appendChild(t2);

  svg.appendChild(legend);

  // 添加数据导出
  const boxCard = svg.closest('.card');
  if (boxCard && !boxCard.querySelector('.export-btn')) {
    const exportData = [
      { 星级: '5星', 角色数: five.length, 最小值: s5.min, Q1: s5.q1, 中位数: s5.med, Q3: s5.q3, 最大值: s5.max, 平均值: s5.avg.toFixed(1) },
      { 星级: '4星', 角色数: four.length, 最小值: s4.min, Q1: s4.q1, 中位数: s4.med, Q3: s4.q3, 最大值: s4.max, 平均值: s4.avg.toFixed(1) }
    ];
    const btn = document.createElement('button');
    btn.className = 'export-btn';
    btn.textContent = '导出数据';
    btn.setAttribute('aria-label', '导出星级分布数据');
    btn.addEventListener('click', () => window.exportData(exportData, '星级热度分布数据', 'csv'));
    boxCard.appendChild(btn);
  }
}

function renderWeaponAnalysis() {
  const el = document.getElementById('weaponAnalysis');
  if (!el) return;
  
  const weaponColors = { '单手剑': '#7AB6FF', '双手剑': '#FF6B6B', '长柄武器': '#FFD93D', '弓': '#6BCB77', '法器': '#C99BFF' };
  const weaponIconCfg = {
    '单手剑':   { png: 'assets/img/deco/UI_ItemIcon_101.png' },
    '双手剑':   { png: 'assets/img/deco/UI_ItemIcon_102.png' },
    '长柄武器': { png: 'assets/img/deco/UI_ItemIcon_103.png' },
    '弓':       { png: 'assets/img/deco/UI_ItemIcon_104.png' },
    '法器':     { png: 'assets/img/deco/UI_ItemIcon_105.png' }
  };
  const validWeapons = ['单手剑', '双手剑', '长柄武器', '弓', '法器'];
  
  const weaponStats = {};
  validWeapons.forEach(wp => {
    const chars = CHARACTERS.filter(c => c.weapon === wp);
    // 仅统计有 B站官方角色视频实测数据的角色，无数据者不参与任何均值/中位数
    const valid = chars.filter(c => typeof c.pv === 'number' && typeof c.fav === 'number');
    weaponStats[wp] = {
      count: chars.length,
      n: valid.length,
      avgPv: valid.length > 0 ? Math.round(statMean(valid.map(c => c.pv))) : 0,
      medPv: valid.length > 0 ? Math.round(statMedian(valid.map(c => c.pv))) : 0,
      avgFav: valid.length > 0 ? Math.round(statMean(valid.map(c => c.fav))) : 0,
      fiveStar: chars.filter(c => c.rarity === 5).length,
      fourStar: chars.filter(c => c.rarity === 4).length
    };
  });
  
  const maxPv = Math.max(...validWeapons.map(wp => weaponStats[wp].avgPv));
  const totalChars = CHARACTERS.length;
  
  let html = '<div class="weapon-grid">';
  validWeapons.forEach(wp => {
    const stats = weaponStats[wp];
    const color = weaponColors[wp];
    const cfg = weaponIconCfg[wp];
    const pvWidth = maxPv > 0 ? (stats.avgPv / maxPv * 100) : 0;
    const share = ((stats.count / totalChars) * 100).toFixed(1);
    
    html += `
      <div class="weapon-card" style="border-top:3px solid ${color};">
        <div class="weapon-header">
          <div class="weapon-icon" style="background:${color}22;color:${color};display:flex;align-items:center;justify-content:center;">
            <img src="${cfg.png}" onerror="this.style.display='none'" style="width:20px;height:20px;object-fit:contain;"/>
          </div>
          <div class="weapon-name" style="color:${color};font-weight:600;">${wp}</div>
          <div class="weapon-share" style="color:var(--text-tertiary);font-size:11px;">${share}%</div>
        </div>
        <div class="weapon-stats">
          <div class="stat-row">
            <span class="stat-label">角色数 / 有效样本</span>
            <span class="stat-value">${stats.count}人 / ${stats.n}人</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">人均播放</span>
            <span class="stat-value">${stats.avgPv}万</span>
          </div>
          <div class="stat-bar-container">
            <div class="stat-bar" style="width:${pvWidth}%;background:${color};"></div>
          </div>
          <div class="stat-row">
            <span class="stat-label">中位播放</span>
            <span class="stat-value">${stats.medPv}万</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">人均收藏</span>
            <span class="stat-value">${stats.avgFav}千</span>
          </div>
          <div class="stat-row">
            <span class="star-badge gold">★★★★★ ${stats.fiveStar}</span>
            <span class="star-badge purple">★★★★ ${stats.fourStar}</span>
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';
  html += `<div class="ds-note" style="margin-top:12px;"><strong>读法说明：</strong>各武器组「有效样本 n」为拥有 B站官方角色视频实测数据的角色数，无官方视频的角色不计入均值。柱长为组内人均播放量的相对强度（最小值为 0、最大值为 100）；人均值易受组内头部角色影响，故同时给出中位播放作为典型水平。组间差异包含角色档期、剧情曝光等结构性因素，不能直接归因于武器类型本身。</div>`;
  el.innerHTML = html;
}

function renderElementAnalysis() {
  const el = document.getElementById('elementAnalysis');
  if (!el) return;
  
  // 排列顺序严格遵循原神游戏加载界面：火→水→冰→雷→风→岩→草；配色与 data.js ELEMENT_COLORS 保持一致
  const elementColors = { '火': '#FF6B6B', '水': '#4A90D9', '冰': '#7ED2F7', '雷': '#9B4AD9', '风': '#4AD9A0', '岩': '#D9A04A', '草': '#4AD94A' };
  const validElements = ['火', '水', '冰', '雷', '风', '岩', '草'];
  
  const elementStats = {};
  validElements.forEach(elem => {
    const chars = CHARACTERS.filter(c => c.element === elem);
    // 仅统计有 B站官方角色视频实测数据的角色
    const valid = chars.filter(c => typeof c.pv === 'number' && typeof c.fav === 'number');
    elementStats[elem] = {
      count: chars.length,
      n: valid.length,
      avgPv: valid.length > 0 ? Math.round(statMean(valid.map(c => c.pv))) : 0,
      medPv: valid.length > 0 ? Math.round(statMedian(valid.map(c => c.pv))) : 0,
      avgFav: valid.length > 0 ? Math.round(statMean(valid.map(c => c.fav))) : 0,
      fiveStar: chars.filter(c => c.rarity === 5).length,
      fourStar: chars.filter(c => c.rarity === 4).length
    };
  });
  
  const maxPv = Math.max(...validElements.map(elem => elementStats[elem].avgPv));
  const totalChars = CHARACTERS.length;
  
  let html = '<div class="element-grid">';
  validElements.forEach(elem => {
    const stats = elementStats[elem];
    const color = elementColors[elem];
    const pvWidth = maxPv > 0 ? (stats.avgPv / maxPv * 100) : 0;
    const share = ((stats.count / totalChars) * 100).toFixed(1);
    const elemPng = getElementSvgUrl(elem);
    
    html += `
      <div class="element-card" style="border-top:3px solid ${color};">
        <div class="element-header">
          <div class="element-icon" style="background:${color}22;color:${color};display:flex;align-items:center;justify-content:center;">
            <img src="${elemPng}" onerror="this.style.display='none'" style="width:20px;height:20px;object-fit:contain;"/>
          </div>
          <div class="element-name" style="color:${color};font-weight:600;">${elem}</div>
          <div class="element-count">${stats.count}人 · ${share}%</div>
        </div>
        <div class="element-stats">
          <div class="stat-row">
            <span class="stat-label">人均播放</span>
            <span class="stat-value">${stats.avgPv}万</span>
          </div>
          <div class="stat-bar-container">
            <div class="stat-bar" style="width:${pvWidth}%;background:${color};"></div>
          </div>
          <div class="stat-row">
            <span class="stat-label">中位播放</span>
            <span class="stat-value">${stats.medPv}万</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">人均收藏</span>
            <span class="stat-value">${stats.avgFav}千</span>
          </div>
          <div class="stat-row">
            <span class="star-badge gold">★★★★★ ${stats.fiveStar}</span>
            <span class="star-badge purple">★★★★ ${stats.fourStar}</span>
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';
  html += `<div class="ds-note" style="margin-top:12px;"><strong>读法说明：</strong>元素按原神加载界面顺序排列，各组 n 与占比已标注，均值仅使用拥有 B站官方角色视频实测数据的角色（无官方视频者不计入）。人均播放受组内头部角色拉动，中位播放更能反映典型角色水平；元素人数不均衡（草、岩等组样本较小），小样本组的均值波动更大，比较时应结合有效样本 n 与中位数一起看。</div>`;
  el.innerHTML = html;
}

function getElementIcon(el) {
  return '';
}

function renderCorrelation() {
  const el = document.getElementById('correlationChart');
  if (!el) return;
  
  // 仅纳入拥有 B站官方角色视频实测数据的角色，无数据者不参与相关系数计算
  const chars = CHARACTERS.filter(c => typeof c.pv === 'number' && typeof c.fav === 'number');
  const xMax = Math.max(...chars.map(c => c.pv));
  const yMax = Math.max(...chars.map(c => c.fav));
  
  const NS = 'http://www.w3.org/2000/svg';
  const W = 650, H = 320;
  const M = { l: 70, r: 40, t: 40, b: 50 };
  const w = W - M.l - M.r, h = H - M.t - M.b;
  
  let svgHtml = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;" id="corrSvg">`;
  
  svgHtml += '<defs>';
  svgHtml += '<linearGradient id="corrGrad" x1="0%" y1="0%" x2="100%" y2="100%">';
  svgHtml += '<stop offset="0%" stop-color="#6366F1" stop-opacity="0.2"/>';
  svgHtml += '<stop offset="100%" stop-color="#8B5CF6" stop-opacity="0.2"/>';
  svgHtml += '</linearGradient>';
  svgHtml += '<filter id="corrGlow">';
  svgHtml += '<feGaussianBlur stdDeviation="2" flood-opacity="0.3" result="coloredBlur"/>';
  svgHtml += '<feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>';
  svgHtml += '</filter>';
  svgHtml += '</defs>';
  
  for (let i = 0; i <= 5; i++) {
    const x = M.l + (i / 5) * w;
    svgHtml += `<line x1="${x}" y1="${M.t}" x2="${x}" y2="${H - M.b}" stroke="var(--border)" stroke-width="0.5" stroke-dasharray="4,4" stroke-opacity="0.5"/>`;
    svgHtml += `<text x="${x}" y="${H - M.b + 22}" text-anchor="middle" font-size="10" fill="var(--text-tertiary)">${Math.round((i / 5) * xMax)}</text>`;
    
    const y = M.t + (i / 5) * h;
    svgHtml += `<line x1="${M.l}" y1="${y}" x2="${W - M.r}" y2="${y}" stroke="var(--border)" stroke-width="0.5" stroke-dasharray="4,4" stroke-opacity="0.5"/>`;
    svgHtml += `<text x="${M.l - 10}" y="${y + 3}" text-anchor="end" font-size="10" fill="var(--text-tertiary)">${Math.round((1 - i / 5) * yMax)}</text>`;
  }
  
  const xSum = chars.reduce((s, c) => s + c.pv, 0);
  const ySum = chars.reduce((s, c) => s + c.fav, 0);
  const xMean = xSum / chars.length;
  const yMean = ySum / chars.length;
  
  const numerator = chars.reduce((s, c) => s + (c.pv - xMean) * (c.fav - yMean), 0);
  const denominator = Math.sqrt(
    chars.reduce((s, c) => s + Math.pow(c.pv - xMean, 2), 0) *
    chars.reduce((s, c) => s + Math.pow(c.fav - yMean, 2), 0)
  );
  const corr = denominator > 0 ? (numerator / denominator).toFixed(3) : null;
  const corrLabel = (typeof statCorrLabel === 'function') ? statCorrLabel(corr === null ? null : parseFloat(corr)) : '';
  const r2 = corr === null ? null : (parseFloat(corr) * parseFloat(corr) * 100).toFixed(1);

  // 四象限分割线采用中位数（右偏分布下均值会被头部角色拉高，中位数更能代表典型角色）
  const xMed = (typeof statMedian === 'function') ? statMedian(chars.map(c => c.pv)) : xMean;
  const yMed = (typeof statMedian === 'function') ? statMedian(chars.map(c => c.fav)) : yMean;
  const qN = { q1: 0, q2: 0, q3: 0, q4: 0 };
  chars.forEach(c => {
    const right = c.pv >= xMed, up = c.fav >= yMed;
    if (right && up) qN.q1++; else if (!right && up) qN.q2++; else if (!right && !up) qN.q3++; else qN.q4++;
  });

  svgHtml += `<line x1="${M.l}" y1="${M.t + (1 - yMed / yMax) * h}" x2="${W - M.r}" y2="${M.t + (1 - yMed / yMax) * h}" stroke="#C9A227" stroke-width="1.5" stroke-dasharray="6,4" stroke-opacity="0.5"/>`;
  svgHtml += `<text x="${W - M.r - 10}" y="${M.t + (1 - yMed / yMax) * h - 5}" text-anchor="middle" font-size="9" fill="#C9A227" fill-opacity="0.7">中位数</text>`;
  svgHtml += `<line x1="${M.l + (xMed / xMax) * w}" y1="${M.t}" x2="${M.l + (xMed / xMax) * w}" y2="${H - M.b}" stroke="#C9A227" stroke-width="1.5" stroke-dasharray="6,4" stroke-opacity="0.5"/>`;
  svgHtml += `<text x="${M.l + (xMed / xMax) * w}" y="${M.t - 5}" text-anchor="middle" font-size="9" fill="#C9A227" fill-opacity="0.7">中位数</text>`;
  
  chars.forEach(c => {
    const x = M.l + (c.pv / xMax) * w;
    const y = M.t + (1 - c.fav / yMax) * h;
    const color = rColor(c.region);
    const radius = c.rarity === 5 ? 5 : 3.5;
    const isHot = c.pv > xMed * 1.5;
    svgHtml += `<circle data-name="${encodeURIComponent(c.name)}" data-region="${c.region}" data-pv="${c.pv}" data-fav="${Math.round(c.fav * 1000)}" data-rarity="${c.rarity}" cx="${x}" cy="${y}" r="${radius}" fill="${color}" fill-opacity="${isHot ? 0.85 : 0.65}" stroke="var(--surface-raised)" stroke-width="${c.rarity === 5 ? 2 : 1.5}" filter="${isHot ? 'url(#corrGlow)' : ''}" style="cursor:pointer;transition:all 0.25s ease;" class="corr-point"/>`;
  });
  
  svgHtml += `<text x="${W / 2}" y="${H - 10}" text-anchor="middle" font-size="12" fill="var(--text-secondary)" font-weight="500">B站官方角色视频播放量（万）</text>`;
  svgHtml += `<text x="${15}" y="${H / 2}" text-anchor="middle" font-size="12" fill="var(--text-secondary)" font-weight="500" transform="rotate(-90,15,${H/2})">B站官方角色视频收藏数（千）</text>`;
  svgHtml += `<text x="${M.l}" y="${M.t + 22}" font-size="11" fill="#C9A227" font-weight="600">r = ${corr === null ? '—' : corr} · ${corrLabel}相关 · n = ${chars.length} · r² = ${r2 === null ? '—' : r2 + '%'}</text>`;
  svgHtml += `<text x="${M.l}" y="${M.t + 38}" font-size="10" fill="var(--text-tertiary)">虚线为中位数分割 · 四象限人数 Q1(高播放高收藏)=${qN.q1} Q2(低播放高收藏)=${qN.q2} Q3(低播放低收藏)=${qN.q3} Q4(高播放低收藏)=${qN.q4}</text>`;
  
  svgHtml += '<g transform="translate(520, 260)">';
  svgHtml += '<circle cx="10" cy="10" r="5" fill="var(--gold)" stroke="var(--surface-raised)" stroke-width="2"/>';
  svgHtml += '<text x="25" y="14" font-size="10" fill="var(--text-secondary)">★★★★★</text>';
  svgHtml += '<circle cx="95" cy="10" r="3.5" fill="var(--chart-4)" stroke="var(--surface-raised)" stroke-width="1.5"/>';
  svgHtml += '<text x="110" y="14" font-size="10" fill="var(--text-secondary)">★★★★</text>';
  svgHtml += '</g>';
  
  svgHtml += '</svg>';
  el.innerHTML = svgHtml;

  const svg = document.getElementById('corrSvg');
  if (svg) {
    svg.addEventListener('mouseover', (e) => {
      const circle = e.target;
      if (circle.classList && circle.classList.contains('corr-point')) {
        circle.setAttribute('r', circle.getAttribute('data-rarity') === '5' ? '7' : '5');
        circle.setAttribute('fill-opacity', '1');
        const name = decodeURIComponent(circle.getAttribute('data-name'));
        const region = circle.getAttribute('data-region');
        const pv = circle.getAttribute('data-pv');
        const fav = circle.getAttribute('data-fav');
        const rarity = circle.getAttribute('data-rarity') === '5' ? '★★★★★' : '★★★★';
        showTooltip(e.clientX + 15, e.clientY - 10, `
          <div class="tooltip-title">${name}</div>
          <div class="tooltip-item"><span class="tooltip-label">星级</span><span class="tooltip-value" style="color:${circle.getAttribute('data-rarity') === '5' ? '#F59E0B' : '#6366F1'};">${rarity}</span></div>
          <div class="tooltip-item"><span class="tooltip-label">地区</span><span class="tooltip-value">${rName(region)}</span></div>
          <div class="tooltip-item"><span class="tooltip-label">官方角色视频播放</span><span class="tooltip-value">${pv}万</span></div>
          <div class="tooltip-item"><span class="tooltip-label">官方角色视频收藏</span><span class="tooltip-value">${Number(fav).toLocaleString()}</span></div>
        `);
      }
    });
    svg.addEventListener('mouseout', (e) => {
      const circle = e.target;
      if (circle.classList && circle.classList.contains('corr-point')) {
        circle.setAttribute('r', circle.getAttribute('data-rarity') === '5' ? '5' : '3.5');
        circle.setAttribute('fill-opacity', circle.getAttribute('data-pv') > xMed * 1.5 ? '0.85' : '0.65');
        hideTooltip();
      }
    });
    svg.addEventListener('click', (e) => {
      const circle = e.target;
      if (circle.classList && circle.classList.contains('corr-point')) {
        const name = decodeURIComponent(circle.getAttribute('data-name'));
        window.location.href = `character-detail.html?name=${encodeURIComponent(name)}`;
      }
    });
  }
}

function renderPhenomenon() {
  const el = document.getElementById('phenomenonAnalysis');
  if (!el) return;

  // 样本与执行摘要 / 关键发现保持同一口径：getVerifiedTrackCensus（按中文曲名去重，仅含真实指标）
  // 仅保留网易云评论数（真实）可查的曲目，作为曲目热度的代理指标
  const census = (typeof getVerifiedTrackCensus === 'function') ? getVerifiedTrackCensus() : [];
  // 官方专辑 type 为英文内部标识，展示时统一映射为中文，避免出现 ep / scene 等生标识
  const TYPE_LABEL = { scene: '场景OST', character: '角色OST', ep: 'EP专辑', version: '版本OST' };
  const regionLabel = id => (id ? rName(id) : '未标注地区');
  const allTracks = census
    .filter(t => typeof t.cmt === 'number')
    .map(t => ({
      name: t.name,
      region: t.region,
      version: t.version,
      type: TYPE_LABEL[t.type] || t.type || '曲目',
      heat: t.cmt,
      play: typeof t.play === 'number' ? t.play : 0,
      fav: (typeof t.fav === 'string') ? t.fav : null
    }));
  if (!allTracks.length) {
    el.innerHTML = `<div class="insight-card" style="padding:32px;text-align:center;">
      <div class="insight-label">暂无真实平台数据（未采集到对应曲目的网易云评论数）</div></div>`;
    return;
  }
  const heats = allTracks.map(t => t.heat);
  const median = statMedian(heats);
  const q1 = statQ1(heats);
  const q3 = statQ3(heats);
  const iqr = q3 - q1;
  const threshold = q3 + 1.5 * iqr;
  const phenomenons = allTracks.filter(t => t.heat > threshold).sort((a, b) => b.heat - a.heat);
  const sng = allTracks.find(t => t.name.indexOf('神女劈观') === 0);
  const avgHeat = statMean(heats);
  const cv = statCV(heats);
  const coverage = (phenomenons.length / allTracks.length) * 100;
  const topHeat = phenomenons.length ? phenomenons[0].heat : 0;
  const topShare = topHeat ? (topHeat / heats.reduce((s, h) => s + h, 0)) * 100 : 0;

  let html = '';

  html += `<div class="insight-grid">
    <div class="insight-card" style="border-top:3px solid #3b82f6;">
      <div class="insight-icon">${icoPng('assets/img/items/UI_ItemIcon_202.png','','')}</div>
      <div class="insight-value">${median}</div>
      <div class="insight-label">评论数中位数（典型曲目）</div>
    </div>
    <div class="insight-card" style="border-top:3px solid #f59e0b;">
      <div class="insight-icon">${icoPng('assets/img/deco/UI_ItemIcon_105.png','','')}</div>
      <div class="insight-value">${threshold.toFixed(0)}</div>
      <div class="insight-label">Tukey 高异常值上界 Q3+1.5×IQR</div>
    </div>
    <div class="insight-card" style="border-top:3px solid #ef4444;">
      <div class="insight-icon">${icoPng('assets/img/deco/UI_ItemIcon_210.png','','')}</div>
      <div class="insight-value">${phenomenons.length}<span style="font-size:13px;color:var(--text-tertiary);">（${coverage.toFixed(1)}%）</span></div>
      <div class="insight-label">评论高异常值曲目数（样本占比）</div>
    </div>
    <div class="insight-card" style="border-top:3px solid #10b981;">
      <div class="insight-icon">${icoPng('assets/img/deco/UI_ItemIcon_211.png','','')}</div>
      <div class="insight-value">${avgHeat.toFixed(0)}</div>
      <div class="insight-label">平均评论数（受极值抬高）</div>
    </div>
    <div class="insight-card" style="border-top:3px solid #8B5CF6;">
      <div class="insight-icon">${icoPng('assets/img/deco/UI_ItemIcon_102.png','','')}</div>
      <div class="insight-value">${iqr.toFixed(0)}</div>
      <div class="insight-label">四分位距 IQR（Q3−Q1）</div>
    </div>
    <div class="insight-card" style="border-top:3px solid #EC4899;">
      <div class="insight-icon">${icoPng('assets/img/items/UI_ItemIcon_112001.png','','')}</div>
      <div class="insight-value">${allTracks.length}</div>
      <div class="insight-label">含网易云评论数的曲目 n（去重后）</div>
    </div>
  </div>
  <div class="ds-note" style="margin:10px 0 14px;">
    <strong>方法说明：</strong>评论数呈明显右偏长尾，均值 ${avgHeat.toFixed(0)} 高于中位数 ${median}，说明少数头部曲目抬高了均值；
    因此采用中位数与四分位距（IQR）衡量典型水平与离散程度，并用 Tukey 规则（Q3+1.5×IQR）标记高异常值。
    变异系数 CV = ${cv === null ? '—' : (cv * 100).toFixed(1) + '%'}；最高评论曲目占全样本评论总量 ${topShare.toFixed(1)}%。
    <strong>“高异常值”只表示相对当前样本分布靠右，不等于“现象级”“出圈”或社会影响力。</strong>
  </div>`;

  if (sng) {
    const ratioMed = (sng.heat / (median || 1)).toFixed(1);
    const pct = (typeof statPercentileRank === 'function') ? statPercentileRank(heats, sng.heat) : null;
    html += `<div class="featured-card">
      <div class="featured-header">
        <span class="featured-icon">${featIcon('assets/img/items/UI_ItemIcon_201.png','')}</span>
        <h3>"神女劈观" —— 人工选取的背景案例</h3>
      </div>
      <div class="featured-content">
        <p><strong>${sng.name}</strong>（${regionLabel(sng.region)} · v${sng.version}）实测 <span class="highlight">${fmt(sng.heat)}</span> 条网易云评论，
        位于样本第 <span class="highlight">${pct === null ? '—' : pct.toFixed(0)}</span> 百分位，为曲目评论中位数（${median}）的 <span class="highlight">${ratioMed} 倍</span>。</p>
        <p>该曲以京剧唱腔演绎，是游戏音乐与中国传统戏曲结合的常见讨论案例；此处作为人工选取的背景案例展示，并非由 Tukey 规则自动得出的传播结论。
        从统计视角看，它在当前评论样本中位于右端，属于高异常值；其量级不能作为全站曲目的平均水平参照。</p>
      </div>
      <div class="featured-stats">
        <div class="stat-item"><span><img src="assets/img/items/UI_ItemIcon_112001.png" onerror="this.style.display='none'" style="width:14px;height:14px;vertical-align:-2px;"/></span> <span>${fmt(sng.heat)} 评论</span></div>
        <div class="stat-item"><span><img src="assets/img/deco/UI_NameCardIcon_0.png" onerror="this.style.display='none'" style="width:14px;height:14px;vertical-align:-2px;"/></span> <span>v${sng.version} 上线</span></div>
        <div class="stat-item"><span><img src="assets/img/items/UI_ItemIcon_112001.png" onerror="this.style.display='none'" style="width:14px;height:14px;vertical-align:-2px;"/></span> <span>${regionLabel(sng.region)} · ${sng.type}</span></div>
      </div>
    </div>`;
  }

  const listTracks = phenomenons.slice(0, 15);
  html += `<div class="section-header"><img src="assets/img/items/UI_ItemIcon_202.png" onerror="this.style.display='none'" style="width:16px;height:16px;vertical-align:-3px;margin-right:4px;"/> 评论高异常值曲目清单（Tukey 规则：评论数 &gt; Q3+1.5×IQR，共 ${phenomenons.length} 首，列出前 ${listTracks.length} 首）</div>`;
  html += '<div class="ranking-list">';
  listTracks.forEach((t, i) => {
    const bar = Math.min(100, (t.heat / phenomenons[0].heat) * 100);
    const rankColor = i < 3 ? ['#F59E0B', '#94A3B8', '#CD7F32'][i] : '#64748B';
    html += `
      <div class="ranking-item">
        <div class="rank-badge" style="background:${rankColor};">${i + 1}</div>
        <div class="rank-info">
          <div class="rank-title">${t.name}</div>
          <div class="rank-meta">${regionLabel(t.region)} · v${t.version || '—'} · ${t.type}${t.fav ? ` · <span style="color:#E2556E;">红心${t.fav}</span>` : ''}</div>
          <div class="rank-bar-container">
            <div class="rank-bar" style="width:${bar}%;background:linear-gradient(90deg,${rColor(t.region)},${rColor(t.region)}88);"></div>
          </div>
        </div>
        <div class="rank-value" style="color:${rColor(t.region)};">${t.heat.toLocaleString()}</div>
      </div>`;
  });
  html += '</div>';

  el.innerHTML = html;
}
