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

(function () {
  renderKPI();
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

function renderKPI() {
  const el = document.getElementById('kpiGrid');
  if (!el) return;

  const totalChars = CHARACTERS.length;
  // 音乐曲目总数：以 ALBUMS 官方专辑曲库为权威口径（43张专辑 / 1909首），
  // 数据来自网易云音乐 + QQ音乐 HOYO-MiX 官方发行专辑，逐首可点击追溯。
  const totalTracks = ALBUMS.reduce((s, a) => s + (a.trackCount || 0), 0);
  const totalPv = CHARACTERS.reduce((s, c) => s + c.pv, 0);
  const avgPv = Math.round(totalPv / totalChars);
  const totalNetease = CHARACTERS.reduce((s, c) => s + c.netease, 0);
  const totalQQ = CHARACTERS.reduce((s, c) => s + c.qq, 0);
  // 综合热度（万）：先统一换算到「万」（netease/qq 原始单位为千，÷10 = 万），
  // 再按 平均PV×0.4 + 平均网易云收藏×0.35 + 平均QQ收藏×0.25 加权
  const totalHeat = totalPv / totalChars * 0.4 + totalNetease / 10 / totalChars * 0.35 + totalQQ / 10 / totalChars * 0.25;
  // 统一数值格式：整数则不带小数，非整数则保留1位小数
  const heatDisp = totalHeat >= 100 ? Math.round(totalHeat).toLocaleString() : (Math.round(totalHeat * 10) / 10).toFixed(1);

  const kpis = [
    // 角色总数 → 皇冠图标（deco/UI_ItemIcon_204.png），绿色
    { icon: kpiIcon('assets/img/deco/UI_ItemIcon_204.png', ''), label: '角色总数', value: totalChars.toLocaleString(), unit: '人', color: '#4ADE80' },
    // 音乐曲目 → 旋曜玉帛（icons/旋曜玉帛.png，原神官方音乐纪念道具），紫色
    { icon: kpiIcon('assets/img/icons/旋曜玉帛.png', ''), label: '音乐曲目', value: totalTracks.toLocaleString(), unit: '首', color: '#8B5CF6' },
    // 平均 PV → 名片装饰（deco/UI_NameCardIcon_0.png），金色
    { icon: kpiIcon('assets/img/deco/UI_NameCardIcon_0.png', ''), label: '平均PV', value: avgPv.toLocaleString(), unit: '万', color: '#F59E0B' },
    // 综合热度 → 音乐宝石（deco/UI_ItemIcon_211.png），蓝金双色
    { icon: kpiIcon('assets/img/deco/UI_ItemIcon_211.png', ''), label: '综合热度', value: heatDisp, unit: '万', color: '#38BDF8' }
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
  const platforms = ['B站PV', '网易云', 'QQ音乐'];
  const regionColors = {};
  REGIONS.forEach(r => { regionColors[r.id] = r.color; });
  
  /* ═══════════════════════════════════════════════════════════
   *  统一 story-heatmap 风格（和剧情场景/角色热力图完全一致）
   *    • 外框：border-gold + 12px 圆角 + shadow-sm
   *    • 细胞类：heatmap-cell heat-cell hlvl-X
   *    • 强度分级：与 style.css hlvl-1 ~ hlvl-5 完全对应
   * ═══════════════════════════════════════════════════════════ */
  const pfmCfg = [
    { name: 'B站PV',   png: 'assets/img/deco/UI_NameCardIcon_0.png', color: '#FB7299', src: 'bilibili.com 官方账号角色PV播放量' },
    { name: '网易云',  png: 'assets/img/icons/旋曜玉帛.png',         color: '#FE2C55', src: 'music.163.com 角色OST收藏量' },
    { name: 'QQ音乐',  png: 'assets/img/deco/UI_ItemIcon_211.png',     color: '#31A5E8', src: 'y.qq.com 角色数字专辑收藏量' }
  ];

  const ratioList = [];
  REGIONS.forEach(r => {
    const chars = CHARACTERS.filter(c => c.region === r.id);
    if (chars.length === 0) return;
    const pv = chars.reduce((s, c) => s + c.pv, 0);
    const nf = chars.reduce((s, c) => s + c.netease, 0);
    const qf = chars.reduce((s, c) => s + c.qq, 0);
    const mpv = Math.max(...CHARACTERS.map(c => c.pv)) * chars.length;
    const mnf = Math.max(...CHARACTERS.map(c => c.netease)) * chars.length;
    const mqf = Math.max(...CHARACTERS.map(c => c.qq)) * chars.length;
    [pv / mpv, nf / mnf, qf / mqf].forEach(ratio => ratioList.push(ratio));
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
    const chars = CHARACTERS.filter(c => c.region === r.id);
    if (chars.length === 0) return;
    const pv = chars.reduce((s, c) => s + c.pv, 0);
    const nf = chars.reduce((s, c) => s + c.netease, 0);
    const qf = chars.reduce((s, c) => s + c.qq, 0);
    const mpv = Math.max(...CHARACTERS.map(c => c.pv)) * chars.length;
    const mnf = Math.max(...CHARACTERS.map(c => c.netease)) * chars.length;
    const mqf = Math.max(...CHARACTERS.map(c => c.qq)) * chars.length;

    html += `<div class="heatmap-cell heat-cell h r-label" style="background:var(--surface-elevated);padding:12px 14px;font-size:12px;font-weight:600;color:${regionColors[r.id]};text-align:left;border-top:1px solid rgba(201,162,39,0.1);">${r.name}</div>`;
    [pv / mpv, nf / mnf, qf / mqf].forEach(ratio => {
      const inten = Math.round(ratio * 100);
      const norm = maxR > 0 ? ratio / maxR : 0;
      let lvl = inten === 0 ? 0 : (norm < 0.22 ? 1 : (norm < 0.42 ? 2 : (norm < 0.62 ? 3 : (norm < 0.82 ? 4 : 5))));
      const cls = inten === 0 ? 'hlvl-0' : `hlvl-${lvl}`;
      const display = inten === 0 ? '—' : `${inten}%`;
      html += `<div class="heatmap-cell heat-cell ${cls}" data-v="${inten}" style="border-top:1px solid rgba(201,162,39,0.08);font-weight:${inten > 60 ? 700 : 500};font-size:13px;${inten > 60 ? 'color:#fff;' : ''}">${display}</div>`;
    });
  });
  html += '</div>';
  // 图例（与 story-heatmap 完全一致）
  html += `<div class="legend legend-bottom" style="margin-top:14px;justify-content:flex-end;gap:10px;flex-wrap:wrap;">
    <span style="font-size:11px;color:var(--text-tertiary);margin-right:6px;">归一化热度</span>
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
    const exportData = REGIONS.filter(r => CHARACTERS.some(c => c.region === r.id)).map(r => {
      const chars = CHARACTERS.filter(c => c.region === r.id);
      return {
        地区: r.name,
        角色数: chars.length,
        PV总播放量万: chars.reduce((s, c) => s + c.pv, 0),
        网易云总收藏: chars.reduce((s, c) => s + c.netease, 0) * 1000,
        QQ音乐总收藏: chars.reduce((s, c) => s + c.qq, 0) * 1000
      };
    });
    const btn = document.createElement('button');
    btn.className = 'export-btn';
    btn.textContent = '导出数据';
    btn.setAttribute('aria-label', '导出此图表的数据');
    btn.addEventListener('click', () => window.exportData(exportData, '跨平台热度矩阵数据', 'csv'));
    matrixCard.appendChild(btn);
  }
}

// ==================== 关键发现渲染 ====================
function renderKeyFindings() {
  const topChar = [...CHARACTERS].sort((a, b) => b.pv - a.pv)[0];
  
  // 合成曲目数据：优先使用ALBUMS的真实数据
  let allTracks = [];
  if (typeof getAllTracksSummary === 'function') {
    allTracks = getAllTracksSummary().map(t => ({
      name: t.trackName,
      region: t.albumRegion,
      // 统一排序口径为「收藏量·千」：优先取 neteaseFav（单位千）；
      // 无收藏数据时用 heatScore(0-100) 线性映射 ×1.5（100分≈150千）
      heat: t.neteaseFav > 0 ? t.neteaseFav : Math.round(t.heatScore * 1.5),
      version: t.albumVersion,
      type: t.albumType + ' OST',
      neteaseFav: t.neteaseFav,
      qqPlays: t.qqPlays,
      biliPlays: t.biliPlays,
      albumName: t.albumName,
      neteaseUrl: t.neteaseUrl,
      qqUrl: t.qqUrl,
      bilibiliUrl: t.bilibiliUrl,
      source: 'album'
    }));
  }
  
  // 补足基础数据
  const basicTracks = [
    ...STORY_TRACKS.map(t => ({ name: t.name, region: t.region, heat: t.netease, version: t.version, type: '剧情曲', source: 'basic' })),
    ...Object.entries(REGION_TRACKS).flatMap(([rid, arr]) => arr.map(t => ({ name: t.name, region: rid, heat: t.fav, version: t.version, type: '地区BGM', source: 'basic' })))
  ];
  
  // 合并：如果有ALBUMS数据则优先，否则用基础数据
  if (allTracks.length === 0) {
    allTracks = basicTracks;
  } else {
    // 补充基础数据中独有的曲目
    basicTracks.forEach(bt => {
      if (!allTracks.find(at => at.name === bt.name)) {
        allTracks.push(bt);
      }
    });
  }
  
  const topTrack = [...allTracks].sort((a, b) => b.heat - a.heat)[0];

  const netEaseTotal = CHARACTERS.reduce((s, c) => s + c.netease, 0);
  const qqTotal = CHARACTERS.reduce((s, c) => s + c.qq, 0);
  const platformDiff = ((netEaseTotal - qqTotal) / qqTotal * 100).toFixed(0);

  const t1 = document.getElementById('insightTop1');
  const t2 = document.getElementById('insightTop2');
  const t3 = document.getElementById('insightTop3');

  if (t1 && topChar) {
    t1.innerHTML = `
      <strong style="color:var(--gold-light);font-size:16px;">${topChar.name}</strong><br>
      <span style="color:var(--text-secondary);font-size:12px;">${rName(topChar.region)} · ${topChar.rarity}星 · ${topChar.element}</span><br>
      <span style="display:inline-flex;align-items:center;gap:2px;margin-top:4px;">
        <img src="assets/img/deco/UI_NameCardIcon_0.png" style="width:12px;height:12px;vertical-align:-2px;" onerror="this.style.display='none'" title="来源：bilibili.com 角色PV官方播放量"/>
        <span style="color:#FB7299;font-weight:600;">${(topChar.pv).toFixed(1)}万</span>
        <span style="color:var(--text-tertiary);font-size:10px;margin-left:4px;">B站PV</span>
      </span>
    `;
  }
  if (t2 && topTrack) {
    const isAlbumTrack = topTrack.source === 'album';
    // heat 已统一为「收藏量·千」口径，直接展示
    const heatDisplay = `${topTrack.heat.toLocaleString()}千`;
    const platformDetail = isAlbumTrack ? `
      <div style="display:flex;gap:6px;margin-top:4px;">
        ${topTrack.neteaseFav > 0 ? `<span style="color:#FE2C55;font-size:10px;"><img src="assets/img/items/UI_ItemIcon_112001.png" style="width:10px;height:10px;vertical-align:-1px;" onerror="this.style.display='none'"/>${topTrack.neteaseFav}k</span>` : ''}
        ${topTrack.qqPlays > 0 ? `<span style="color:#31A5E8;font-size:10px;"><img src="assets/img/items/UI_ItemIcon_112002.png" style="width:10px;height:10px;vertical-align:-1px;" onerror="this.style.display='none'"/>${topTrack.qqPlays}w</span>` : ''}
        ${topTrack.biliPlays > 0 ? `<span style="color:#FB7299;font-size:10px;"><img src="assets/img/deco/UI_NameCardIcon_0.png" style="width:10px;height:10px;vertical-align:-1px;" onerror="this.style.display='none'"/>${topTrack.biliPlays}w</span>` : ''}
      </div>` : '';
    const trackLinks = isAlbumTrack ? `
      <div style="display:flex;gap:4px;margin-top:3px;">
        ${topTrack.neteaseUrl ? `<a href="${topTrack.neteaseUrl}" target="_blank" rel="noopener" style="color:#FE2C55;font-size:10px;text-decoration:none;">网易云</a>` : ''}
        ${topTrack.qqUrl ? `<a href="${topTrack.qqUrl}" target="_blank" rel="noopener" style="color:#31A5E8;font-size:10px;text-decoration:none;">QQ音乐</a>` : ''}
        ${topTrack.bilibiliUrl ? `<a href="${topTrack.bilibiliUrl}" target="_blank" rel="noopener" style="color:#FB7299;font-size:10px;text-decoration:none;">B站</a>` : ''}
      </div>` : '';
    t2.innerHTML = `
      <strong style="color:var(--gold-light);font-size:16px;">《${topTrack.name}》</strong><br>
      <span style="color:var(--text-secondary);font-size:12px;">${rName(topTrack.region)} · v${topTrack.version} · ${topTrack.type}${topTrack.albumName ? ' · ' + topTrack.albumName : ''}</span><br>
      <span style="display:inline-flex;align-items:center;gap:2px;margin-top:4px;">
        <img src="assets/img/items/UI_ItemIcon_112001.png" style="width:12px;height:12px;vertical-align:-2px;" onerror="this.style.display='none'"/>
        <span style="color:#FE2C55;font-weight:600;">${heatDisplay}</span>
        <span style="color:var(--text-tertiary);font-size:10px;margin-left:4px;">网易云收藏</span>
      </span>
      ${platformDetail}
      ${trackLinks}
    `;
  }
  if (t3) {
    t3.innerHTML = `
      <strong style="color:var(--gold-light);font-size:16px;">网易云领先 ${platformDiff}%</strong><br>
      <span style="color:var(--text-secondary);font-size:12px;">角色音乐收藏量对比</span><br>
      <span style="display:inline-flex;align-items:center;gap:4px;margin-top:4px;flex-wrap:wrap;">
        <span style="display:inline-flex;align-items:center;gap:1px;">
          <img src="assets/img/items/UI_ItemIcon_112001.png" style="width:9px;height:9px;vertical-align:-1px;" onerror="this.style.display='none'"/>
          <span style="color:#FE2C55;font-weight:600;font-size:11px;">${fmt(netEaseTotal * 1000)}</span>
        </span>
        <span style="color:var(--text-quaternary);">|</span>
        <span style="display:inline-flex;align-items:center;gap:1px;">
          <img src="assets/img/deco/UI_ItemIcon_211.png" style="width:9px;height:9px;vertical-align:-1px;" onerror="this.style.display='none'"/>
          <span style="color:#31A5E8;font-weight:600;font-size:11px;">${fmt(qqTotal * 1000)}</span>
        </span>
      </span>
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
  const data = order.map((rid, i) => {
    const chars = CHARACTERS.filter(c => c.region === rid);
    if (chars.length === 0) return { x: i, label: rName(rid), val: 0, color: '#94a3b8', count: 0, rid };
    return { 
      x: i, 
      label: rName(rid), 
      val: chars.reduce((s, c) => s + c.pv, 0) / chars.length, 
      color: rColor(rid),
      count: chars.length,
      rid,
      maxPv: Math.max(...chars.map(c => c.pv)),
      minPv: Math.min(...chars.map(c => c.pv))
    };
  });
  const maxV = Math.max(...data.map(d => d.val));
  const M = { l: 60, r: 30, t: 45, b: 55 }, W = 750, H = 300;
  const w = W - M.l - M.r, h = H - M.t - M.b;
  const NS = 'http://www.w3.org/2000/svg';

  const defs = document.createElementNS(NS, 'defs');
  const grad = document.createElementNS(NS, 'linearGradient');
  grad.setAttribute('id', 'trendGrad');
  grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%'); grad.setAttribute('x2', '0%'); grad.setAttribute('y2', '100%');
  grad.innerHTML = `<stop offset="0%" stop-color="#C9A227" stop-opacity="0.25"/><stop offset="50%" stop-color="#6366F1" stop-opacity="0.15"/><stop offset="100%" stop-color="#6366F1" stop-opacity="0"/>`;
  defs.appendChild(grad);
  
  const shadow = document.createElementNS(NS, 'filter');
  shadow.setAttribute('id', 'lineShadow');
  shadow.innerHTML = `<feDropShadow dx="0" dy="3" stdDeviation="4" flood-opacity="0.3"/>`;
  defs.appendChild(shadow);
  
  const glow = document.createElementNS(NS, 'filter');
  glow.setAttribute('id', 'pointGlow');
  glow.innerHTML = `<feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>`;
  defs.appendChild(glow);
  
  svg.appendChild(defs);

  for (let i = 0; i <= 5; i++) {
    const y = M.t + (i / 5) * h;
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', M.l); line.setAttribute('y1', y); line.setAttribute('x2', W - M.r); line.setAttribute('y2', y);
    line.setAttribute('stroke', 'var(--border)'); line.setAttribute('stroke-width', '0.5'); line.setAttribute('stroke-dasharray', '4,4');
    line.setAttribute('stroke-opacity', '0.5');
    svg.appendChild(line);
    const lab = document.createElementNS(NS, 'text');
    lab.setAttribute('x', M.l - 10); lab.setAttribute('y', y + 3); lab.setAttribute('text-anchor', 'end');
    lab.setAttribute('font-size', '10'); lab.setAttribute('fill', 'var(--text-tertiary)');
    lab.textContent = Math.round((1 - i / 5) * maxV);
    svg.appendChild(lab);
  }

  const pts = data.map(d => `${M.l + (d.x / (data.length - 1)) * w},${M.t + (1 - d.val / maxV) * h}`).join(' ');
  
  const areaPts = pts + ` ${M.l + w},${H - M.b} ${M.l},${H - M.b}`;
  const area = document.createElementNS(NS, 'polygon');
  area.setAttribute('points', areaPts); area.setAttribute('fill', 'url(#trendGrad)');
  svg.appendChild(area);

  const polyline = document.createElementNS(NS, 'polyline');
  polyline.setAttribute('points', pts); polyline.setAttribute('fill', 'none');
  polyline.setAttribute('stroke', '#C9A227'); polyline.setAttribute('stroke-width', '3'); 
  polyline.setAttribute('stroke-linecap', 'round'); polyline.setAttribute('stroke-linejoin', 'round');
  polyline.setAttribute('filter', 'url(#lineShadow)');
  svg.appendChild(polyline);

  data.forEach(d => {
    const cx = M.l + (d.x / (data.length - 1)) * w;
    const cy = M.t + (1 - d.val / maxV) * h;
    
    const bg = document.createElementNS(NS, 'circle');
    bg.setAttribute('cx', cx); bg.setAttribute('cy', cy); bg.setAttribute('r', '12');
    bg.setAttribute('fill', d.color); bg.setAttribute('fill-opacity', '0.08');
    bg.setAttribute('transition', 'r 0.25s');
    svg.appendChild(bg);
    
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', cx); c.setAttribute('cy', cy); c.setAttribute('r', '6');
    c.setAttribute('fill', d.color); c.setAttribute('stroke', 'var(--surface-raised)'); 
    c.setAttribute('stroke-width', '2.5');
    c.setAttribute('filter', 'url(#pointGlow)');
    c.style.cursor = 'pointer';
    c.style.transition = 'all 0.25s ease';
    c.addEventListener('mouseenter', (e) => {
      c.setAttribute('r', '9');
      c.setAttribute('stroke-width', '3');
      bg.setAttribute('r', '16');
      bg.setAttribute('fill-opacity', '0.15');
      showTooltip(e.clientX + 15, e.clientY - 10, `
        <div class="tooltip-title">${d.label}</div>
        <div class="tooltip-item"><span class="tooltip-label">平均PV</span><span class="tooltip-value">${Math.round(d.val)}万</span></div>
        <div class="tooltip-item"><span class="tooltip-label">角色数</span><span class="tooltip-value">${d.count}人</span></div>
        <div class="tooltip-item"><span class="tooltip-label">最高PV</span><span class="tooltip-value">${Math.round(d.maxPv)}万</span></div>
        <div class="tooltip-item"><span class="tooltip-label">最低PV</span><span class="tooltip-value">${Math.round(d.minPv)}万</span></div>
      `);
    });
    c.addEventListener('mouseleave', () => {
      c.setAttribute('r', '6');
      c.setAttribute('stroke-width', '2.5');
      bg.setAttribute('r', '12');
      bg.setAttribute('fill-opacity', '0.08');
      hideTooltip();
    });
    c.addEventListener('click', () => {
      window.location.href = `region.html?r=${d.rid}`;
    });
    svg.appendChild(c);

    const lab = document.createElementNS(NS, 'text');
    lab.setAttribute('x', cx); lab.setAttribute('y', H - M.b + 24); lab.setAttribute('text-anchor', 'middle');
    lab.setAttribute('font-size', '12'); lab.setAttribute('fill', 'var(--text-secondary)'); 
    lab.setAttribute('font-weight', '500');
    lab.textContent = d.label;
    lab.style.cursor = 'pointer';
    lab.addEventListener('click', () => {
      window.location.href = `region.html?r=${d.rid}`;
    });
    svg.appendChild(lab);

    const vlab = document.createElementNS(NS, 'text');
    vlab.setAttribute('x', cx); vlab.setAttribute('y', cy - 16); vlab.setAttribute('text-anchor', 'middle');
    vlab.setAttribute('font-size', '11'); vlab.setAttribute('fill', '#C9A227'); 
    vlab.setAttribute('font-weight', '700');
    vlab.textContent = Math.round(d.val);
    svg.appendChild(vlab);
    
    const clab = document.createElementNS(NS, 'text');
    clab.setAttribute('x', cx); clab.setAttribute('y', cy + 22); clab.setAttribute('text-anchor', 'middle');
    clab.setAttribute('font-size', '9'); clab.setAttribute('fill', 'var(--text-tertiary)'); 
    clab.textContent = `${d.count}人`;
    svg.appendChild(clab);
  });

  // 添加洞察标注
  const annotations = [
    { x: M.l + (1 / (data.length - 1)) * w, y: M.t + (1 - data[1].val / maxV) * h, text: '璃月峰值', dy: -24, color: '#C9A227' },
    { x: M.l + (5 / (data.length - 1)) * w, y: M.t + (1 - data[5].val / maxV) * h, text: '纳塔积累期', dy: 18, color: '#D9A04A' }
  ];
  annotations.forEach(ann => {
    const g = document.createElementNS(NS, 'g');
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', ann.x); line.setAttribute('y1', ann.y);
    line.setAttribute('x2', ann.x); line.setAttribute('y2', ann.y + ann.dy);
    line.setAttribute('stroke', ann.color); line.setAttribute('stroke-width', '1');
    line.setAttribute('stroke-dasharray', '3,2'); line.setAttribute('opacity', '0.6');
    g.appendChild(line);
    const text = document.createElementNS(NS, 'text');
    text.setAttribute('x', ann.x); text.setAttribute('y', ann.y + ann.dy + (ann.dy > 0 ? 12 : -4));
    text.setAttribute('text-anchor', 'middle'); text.setAttribute('font-size', '10');
    text.setAttribute('fill', ann.color); text.setAttribute('font-weight', '600');
    text.textContent = ann.text;
    g.appendChild(text);
    svg.appendChild(g);
  });

  // 添加数据导出
  const trendCard = svg.closest('.card');
  if (trendCard && !trendCard.querySelector('.export-btn')) {
    const exportData = data.map(d => ({ 地区: d.label, 平均PV万: Math.round(d.val), 角色数: d.count, 最高PV万: Math.round(d.maxPv), 最低PV万: Math.round(d.minPv) }));
    const btn = document.createElement('button');
    btn.className = 'export-btn';
    btn.textContent = '导出数据';
    btn.setAttribute('aria-label', '导出此图表的数据');
    btn.addEventListener('click', () => window.exportData(exportData, '地区热度趋势数据', 'csv'));
    trendCard.appendChild(btn);
  }
}

function renderSankey() {
  const svg = document.getElementById('sankeySvg');
  if (!svg) return;
  svg.innerHTML = '';
  const NS = 'http://www.w3.org/2000/svg';

  const totalPv = CHARACTERS.reduce((s, c) => s + c.pv, 0) * 10000;
  const totalNetease = CHARACTERS.reduce((s, c) => s + c.netease, 0) * 1000;
  const totalQQ = CHARACTERS.reduce((s, c) => s + c.qq, 0) * 1000;
  const totalComments = CHARACTERS.reduce((s, c) => s + c.cmt, 0) * 1000;

  // 漏斗阶段：从内容曝光到音乐平台转化再到深度行为
  const stages = [
    { name: 'B站PV曝光', value: totalPv, color: '#FB7299', iconPng: 'assets/img/deco/UI_NameCardIcon_0.png', desc: '官方角色PV总播放量' },
    { name: '网易云收藏', value: totalNetease, color: '#FE2C55', iconPng: 'assets/img/items/UI_ItemIcon_112001.png', desc: '网易云音乐总收藏量' },
    { name: 'QQ音乐收藏', value: totalQQ, color: '#31A5E8', iconPng: 'assets/img/items/UI_ItemIcon_112002.png', desc: 'QQ音乐总收藏量' },
    { name: '评论互动', value: totalComments, color: '#F59E0B', iconPng: 'assets/img/deco/UI_ItemIcon_202.png', desc: 'B站PV总评论量' }
  ];

  // 计算转化率（以前一阶段为基准）
  stages.forEach((s, i) => {
    s.rate = i === 0 ? 100 : (s.value / stages[0].value * 100);
    s.prevRate = i === 0 ? 100 : (s.value / stages[i - 1].value * 100);
  });

  const W = 700, H = 280;
  const M = { l: 40, r: 40, t: 50, b: 60 };
  const stageCount = stages.length;
  const gap = 36;
  const stageW = (W - M.l - M.r - (stageCount - 1) * gap) / stageCount;
  const maxH = H - M.t - M.b;
  const maxValue = stages[0].value;

  // 渐变定义
  const defs = document.createElementNS(NS, 'defs');
  stages.forEach((s, i) => {
    const grad = document.createElementNS(NS, 'linearGradient');
    grad.setAttribute('id', `funnelGrad${i}`);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '0%'); grad.setAttribute('y2', '100%');
    grad.innerHTML = `<stop offset="0%" stop-color="${s.color}" stop-opacity="0.95"/><stop offset="100%" stop-color="${s.color}" stop-opacity="0.55"/>`;
    defs.appendChild(grad);
  });
  svg.appendChild(defs);

  // 标题
  const title = document.createElementNS(NS, 'text');
  title.setAttribute('x', W / 2); title.setAttribute('y', 28);
  title.setAttribute('text-anchor', 'middle');
  title.setAttribute('font-size', '14'); title.setAttribute('font-weight', '600');
  title.setAttribute('fill', 'var(--gold-light)');
  title.textContent = '跨平台音乐传播转化漏斗';
  svg.appendChild(title);

  stages.forEach((s, i) => {
    const x = M.l + i * (stageW + gap);
    const h = maxValue > 0 ? maxH * (s.value / maxValue) : 0;
    const y = M.t + (maxH - h);

    // 与前一个阶段的连接线（梯形）
    if (i > 0) {
      const prevH = maxH * (stages[i - 1].value / maxValue);
      const prevY = M.t + (maxH - prevH);
      const prevX = x - gap;
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', `M${prevX},${prevY} L${x},${y} L${x},${y + h} L${prevX},${prevY + prevH} Z`);
      path.setAttribute('fill', s.color);
      path.setAttribute('fill-opacity', '0.22');
      svg.appendChild(path);
    }

    // 主漏斗条
    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', x); rect.setAttribute('y', y);
    rect.setAttribute('width', stageW); rect.setAttribute('height', h);
    rect.setAttribute('fill', `url(#funnelGrad${i})`);
    rect.setAttribute('rx', '8');
    rect.setAttribute('stroke', s.color);
    rect.setAttribute('stroke-width', '1.5');
    rect.style.cursor = 'pointer';
    rect.addEventListener('mouseenter', (e) => {
      showTooltip(e.clientX + 15, e.clientY - 10, `
        <div class="tooltip-title"><img src="${s.iconPng}" onerror="this.style.display='none'" style="width:16px;height:16px;vertical-align:-3px;margin-right:4px;"/>${s.name}</div>
        <div class="tooltip-item"><span class="tooltip-label">数值</span><span class="tooltip-value">${fmtCN(s.value)}</span></div>
        <div class="tooltip-item"><span class="tooltip-label">占首阶段</span><span class="tooltip-value">${s.rate.toFixed(1)}%</span></div>
        ${i > 0 ? `<div class="tooltip-item"><span class="tooltip-label">阶段转化</span><span class="tooltip-value">${s.prevRate.toFixed(1)}%</span></div>` : ''}
        <div class="tooltip-item"><span class="tooltip-label">说明</span><span class="tooltip-value">${s.desc}</span></div>
      `);
    });
    rect.addEventListener('mouseleave', hideTooltip);
    svg.appendChild(rect);

    // 数值标签
    const valText = document.createElementNS(NS, 'text');
    valText.setAttribute('x', x + stageW / 2); valText.setAttribute('y', y + h / 2 - 4);
    valText.setAttribute('text-anchor', 'middle');
    valText.setAttribute('font-size', '12'); valText.setAttribute('font-weight', '700');
    valText.setAttribute('fill', 'white');
    valText.textContent = fmtCN(s.value);
    svg.appendChild(valText);

    // 百分比标签
    const rateText = document.createElementNS(NS, 'text');
    rateText.setAttribute('x', x + stageW / 2); rateText.setAttribute('y', y + h / 2 + 10);
    rateText.setAttribute('text-anchor', 'middle');
    rateText.setAttribute('font-size', '10');
    rateText.setAttribute('fill', 'rgba(255,255,255,0.92)');
    rateText.textContent = `${s.rate.toFixed(1)}%`;
    svg.appendChild(rateText);

    // 阶段名称
    const nameText = document.createElementNS(NS, 'text');
    nameText.setAttribute('x', x + stageW / 2); nameText.setAttribute('y', M.t + maxH + 22);
    nameText.setAttribute('text-anchor', 'middle');
    nameText.setAttribute('font-size', '12'); nameText.setAttribute('font-weight', '600');
    nameText.setAttribute('fill', 'var(--text-secondary)');
    nameText.textContent = s.name;
    svg.appendChild(nameText);

    // 阶段转化率箭头
    if (i > 0) {
      const arrowText = document.createElementNS(NS, 'text');
      arrowText.setAttribute('x', x - gap / 2); arrowText.setAttribute('y', M.t + maxH / 2 + 4);
      arrowText.setAttribute('text-anchor', 'middle');
      arrowText.setAttribute('font-size', '10'); arrowText.setAttribute('font-weight', '600');
      arrowText.setAttribute('fill', s.color);
      arrowText.textContent = `↓${s.prevRate.toFixed(1)}%`;
      svg.appendChild(arrowText);
    }
  });

  // 数据来源说明
  const sourceNote = document.createElementNS(NS, 'text');
  sourceNote.setAttribute('x', W / 2);
  sourceNote.setAttribute('y', H - 12);
  sourceNote.setAttribute('text-anchor', 'middle');
  sourceNote.setAttribute('font-size', '9');
  sourceNote.setAttribute('fill', 'var(--text-tertiary)');
  sourceNote.textContent = '数据来源：B站PV · 网易云收藏 · QQ音乐收藏 · B站评论';
  svg.appendChild(sourceNote);

  // 添加数据导出
  const sankeyCard = svg.closest('.card');
  if (sankeyCard && !sankeyCard.querySelector('.export-btn')) {
    const exportData = stages.map(s => ({
      阶段: s.name,
      数值: s.value,
      占首阶段比例: s.rate.toFixed(2) + '%',
      阶段转化率: s.prevRate.toFixed(2) + '%'
    }));
    const btn = document.createElement('button');
    btn.className = 'export-btn';
    btn.textContent = '导出数据';
    btn.setAttribute('aria-label', '导出转化漏斗数据');
    btn.addEventListener('click', () => window.exportData(exportData, '平台转化漏斗数据', 'csv'));
    sankeyCard.appendChild(btn);
  }
}

function renderBox() {
  const svg = document.getElementById('boxSvg');
  if (!svg) return;
  svg.innerHTML = '';
  const NS = 'http://www.w3.org/2000/svg';

  const five = CHARACTERS.filter(c => c.rarity === 5).map(c => c.pv);
  const four = CHARACTERS.filter(c => c.rarity === 4).map(c => c.pv);

  function stats(arr) {
    const s = [...arr].sort((a, b) => a - b);
    return {
      min: s[0], q1: s[Math.floor(s.length * 0.25)], med: s[Math.floor(s.length * 0.5)],
      q3: s[Math.floor(s.length * 0.75)], max: s[s.length - 1], avg: arr.reduce((a, b) => a + b, 0) / arr.length
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
  title.textContent = '5星 vs 4星角色PV热度分布对比';
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
      rect.setAttribute('rx', '2');
      rect.style.cursor = 'pointer';
      rect.addEventListener('mouseenter', (e) => {
        showTooltip(e.clientX + 15, e.clientY - 10, `
          <div class="tooltip-title">5星角色分布</div>
          <div class="tooltip-item"><span class="tooltip-label">PV区间</span><span class="tooltip-value">${Math.round(rangeStart)}-${Math.round(rangeEnd)}万</span></div>
          <div class="tooltip-item"><span class="tooltip-label">角色数</span><span class="tooltip-value">${bins5[i]}人</span></div>
        `);
      });
      rect.addEventListener('mouseleave', hideTooltip);
      svg.appendChild(rect);
    }

    // 4星：下半部分，向下延伸
    const h4 = (bins4[i] / maxCount) * (halfH - 10);
    if (h4 > 0) {
      const rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('x', x); rect.setAttribute('y', M.t + halfH + 2);
      rect.setAttribute('width', bw); rect.setAttribute('height', h4);
      rect.setAttribute('fill', 'url(#distGrad4)');
      rect.setAttribute('rx', '2');
      rect.style.cursor = 'pointer';
      rect.addEventListener('mouseenter', (e) => {
        showTooltip(e.clientX + 15, e.clientY - 10, `
          <div class="tooltip-title">4星角色分布</div>
          <div class="tooltip-item"><span class="tooltip-label">PV区间</span><span class="tooltip-value">${Math.round(rangeStart)}-${Math.round(rangeEnd)}万</span></div>
          <div class="tooltip-item"><span class="tooltip-label">角色数</span><span class="tooltip-value">${bins4[i]}人</span></div>
        `);
      });
      rect.addEventListener('mouseleave', hideTooltip);
      svg.appendChild(rect);
    }
  }

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
    weaponStats[wp] = {
      count: chars.length,
      avgPv: chars.length > 0 ? Math.round(chars.reduce((s, c) => s + c.pv, 0) / chars.length) : 0,
      avgFav: chars.length > 0 ? Math.round(chars.reduce((s, c) => s + c.netease, 0) / chars.length) : 0,
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
            <span class="stat-label">角色数</span>
            <span class="stat-value">${stats.count}人</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">平均PV</span>
            <span class="stat-value">${stats.avgPv}万</span>
          </div>
          <div class="stat-bar-container">
            <div class="stat-bar" style="width:${pvWidth}%;background:${color};"></div>
          </div>
          <div class="stat-row">
            <span class="stat-label">平均收藏</span>
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
    elementStats[elem] = {
      count: chars.length,
      avgPv: chars.length > 0 ? Math.round(chars.reduce((s, c) => s + c.pv, 0) / chars.length) : 0,
      avgFav: chars.length > 0 ? Math.round(chars.reduce((s, c) => s + c.netease, 0) / chars.length) : 0,
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
            <span class="stat-label">平均PV</span>
            <span class="stat-value">${stats.avgPv}万</span>
          </div>
          <div class="stat-bar-container">
            <div class="stat-bar" style="width:${pvWidth}%;background:${color};"></div>
          </div>
          <div class="stat-row">
            <span class="stat-label">平均收藏</span>
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
  el.innerHTML = html;
}

function getElementIcon(el) {
  return '';
}

function renderCorrelation() {
  const el = document.getElementById('correlationChart');
  if (!el) return;
  
  const chars = CHARACTERS.filter(c => c.pv > 0 && c.netease > 0);
  const xMax = Math.max(...chars.map(c => c.pv));
  const yMax = Math.max(...chars.map(c => c.netease));
  
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
  const ySum = chars.reduce((s, c) => s + c.netease, 0);
  const xMean = xSum / chars.length;
  const yMean = ySum / chars.length;
  
  const numerator = chars.reduce((s, c) => s + (c.pv - xMean) * (c.netease - yMean), 0);
  const denominator = Math.sqrt(
    chars.reduce((s, c) => s + Math.pow(c.pv - xMean, 2), 0) *
    chars.reduce((s, c) => s + Math.pow(c.netease - yMean, 2), 0)
  );
  const corr = denominator > 0 ? (numerator / denominator).toFixed(2) : '0.00';
  
  svgHtml += `<line x1="${M.l}" y1="${M.t + (1 - yMean / yMax) * h}" x2="${W - M.r}" y2="${M.t + (1 - yMean / yMax) * h}" stroke="#C9A227" stroke-width="1.5" stroke-dasharray="6,4" stroke-opacity="0.5"/>`;
  svgHtml += `<text x="${W - M.r - 10}" y="${M.t + (1 - yMean / yMax) * h - 5}" text-anchor="middle" font-size="9" fill="#C9A227" fill-opacity="0.7">均值</text>`;
  svgHtml += `<line x1="${M.l + (xMean / xMax) * w}" y1="${M.t}" x2="${M.l + (xMean / xMax) * w}" y2="${H - M.b}" stroke="#C9A227" stroke-width="1.5" stroke-dasharray="6,4" stroke-opacity="0.5"/>`;
  svgHtml += `<text x="${M.l + (xMean / xMax) * w}" y="${M.t - 5}" text-anchor="middle" font-size="9" fill="#C9A227" fill-opacity="0.7">均值</text>`;
  
  chars.forEach(c => {
    const x = M.l + (c.pv / xMax) * w;
    const y = M.t + (1 - c.netease / yMax) * h;
    const color = rColor(c.region);
    const radius = c.rarity === 5 ? 5 : 3.5;
    const isHot = c.pv > xMean * 1.5;
    svgHtml += `<circle data-name="${encodeURIComponent(c.name)}" data-region="${c.region}" data-pv="${c.pv}" data-fav="${c.netease}" data-rarity="${c.rarity}" cx="${x}" cy="${y}" r="${radius}" fill="${color}" fill-opacity="${isHot ? 0.85 : 0.65}" stroke="var(--surface-raised)" stroke-width="${c.rarity === 5 ? 2 : 1.5}" filter="${isHot ? 'url(#corrGlow)' : ''}" style="cursor:pointer;transition:all 0.25s ease;" class="corr-point"/>`;
  });
  
  svgHtml += `<text x="${W / 2}" y="${H - 10}" text-anchor="middle" font-size="12" fill="var(--text-secondary)" font-weight="500">PV播放量（万）</text>`;
  svgHtml += `<text x="${15}" y="${H / 2}" text-anchor="middle" font-size="12" fill="var(--text-secondary)" font-weight="500" transform="rotate(-90,15,${H/2})">网易云收藏（千）</text>`;
  svgHtml += `<text x="${W - M.r - 70}" y="${M.t + 22}" text-anchor="middle" font-size="11" fill="#C9A227" font-weight="600">相关系数: ${corr}</text>`;
  
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
          <div class="tooltip-item"><span class="tooltip-label">PV播放</span><span class="tooltip-value">${pv}万</span></div>
          <div class="tooltip-item"><span class="tooltip-label">网易云收藏</span><span class="tooltip-value">${fav}</span></div>
        `);
      }
    });
    svg.addEventListener('mouseout', (e) => {
      const circle = e.target;
      if (circle.classList && circle.classList.contains('corr-point')) {
        circle.setAttribute('r', circle.getAttribute('data-rarity') === '5' ? '5' : '3.5');
        circle.setAttribute('fill-opacity', circle.getAttribute('data-pv') > xMean * 1.5 ? '0.85' : '0.65');
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

  // 合并剧情曲与地区BGM，按曲目名去重（同名优先保留 STORY_TRACKS 中字段更全的记录），避免重复计数
  const seenTrackNames = new Set();
  const allTracks = [];
  [
    ...STORY_TRACKS.map(t => ({ name: t.name, region: t.region, heat: t.netease, version: t.version, type: '剧情曲' })),
    ...Object.entries(REGION_TRACKS).flatMap(([rid, arr]) => arr.map(t => ({ name: t.name, region: rid, heat: t.fav, version: t.version, type: '地区BGM' })))
  ].forEach(t => {
    if (!seenTrackNames.has(t.name)) { seenTrackNames.add(t.name); allTracks.push(t); }
  });
  const heats = allTracks.map(t => t.heat).sort((a, b) => a - b);
  const median = heats[Math.floor(heats.length * 0.5)];
  const q3 = heats[Math.floor(heats.length * 0.75)];
  const q1 = heats[Math.floor(heats.length * 0.25)];
  const iqr = q3 - q1;
  const threshold = q3 + 1.5 * iqr;
  const phenomenons = allTracks.filter(t => t.heat > threshold).sort((a, b) => b.heat - a.heat);
  const sng = allTracks.find(t => t.name === '神女劈观');
  const avgHeat = heats.reduce((s, h) => s + h, 0) / heats.length;

  let html = '';

  html += `<div class="insight-grid">
    <div class="insight-card" style="border-top:3px solid #3b82f6;">
      <div class="insight-icon">${icoPng('assets/img/items/UI_ItemIcon_202.png','','')}</div>
      <div class="insight-value">${median}</div>
      <div class="insight-label">全曲目热度中位数</div>
    </div>
    <div class="insight-card" style="border-top:3px solid #f59e0b;">
      <div class="insight-icon">${icoPng('assets/img/deco/UI_ItemIcon_105.png','','')}</div>
      <div class="insight-value">${threshold.toFixed(0)}</div>
      <div class="insight-label">异常值阈值</div>
    </div>
    <div class="insight-card" style="border-top:3px solid #ef4444;">
      <div class="insight-icon">${icoPng('assets/img/deco/UI_ItemIcon_210.png','','')}</div>
      <div class="insight-value">${phenomenons.length}</div>
      <div class="insight-label">现象级曲目数</div>
    </div>
    <div class="insight-card" style="border-top:3px solid #10b981;">
      <div class="insight-icon">${icoPng('assets/img/deco/UI_ItemIcon_211.png','','')}</div>
      <div class="insight-value">${avgHeat.toFixed(0)}</div>
      <div class="insight-label">平均热度</div>
    </div>
    <div class="insight-card" style="border-top:3px solid #8B5CF6;">
      <div class="insight-icon">${icoPng('assets/img/deco/UI_ItemIcon_102.png','','')}</div>
      <div class="insight-value">${iqr.toFixed(0)}</div>
      <div class="insight-label">四分位距(IQR)</div>
    </div>
    <div class="insight-card" style="border-top:3px solid #EC4899;">
      <div class="insight-icon">${icoPng('assets/img/items/UI_ItemIcon_112001.png','','')}</div>
      <div class="insight-value">${allTracks.length}</div>
      <div class="insight-label">总曲目数</div>
    </div>
  </div>`;

  if (sng) {
    const ratio = (sng.heat / avgHeat).toFixed(1);
    html += `<div class="featured-card">
      <div class="featured-header">
        <span class="featured-icon">${featIcon('assets/img/items/UI_ItemIcon_201.png','')}</span>
        <h3>"神女劈观" —— 京剧跨界的现象级出圈</h3>
      </div>
      <div class="featured-content">
        <p><strong>${sng.name}</strong>（${rName(sng.region)} · v${sng.version}）以 <span class="highlight">${sng.heat}千</span> 收藏量位居全曲目前列，
        是全曲目平均热度（${avgHeat.toFixed(0)}）的 <span class="highlight">${ratio}倍</span>。</p>
        <p>该曲由云堇以京剧唱腔演绎，将中国传统戏曲融入游戏音乐，在2.4版本海灯节期间引发全网传播，
        成为原神音乐文化输出的标志性作品，体现了"传统艺术×游戏媒介"的创新传播价值。</p>
      </div>
      <div class="featured-stats">
        <div class="stat-item"><span><img src="assets/img/deco/UI_ItemIcon_105.png" onerror="this.style.display='none'" style="width:14px;height:14px;vertical-align:-2px;"/></span> <span>${sng.heat.toLocaleString()}千 收藏</span></div>
        <div class="stat-item"><span><img src="assets/img/deco/UI_NameCardIcon_0.png" onerror="this.style.display='none'" style="width:14px;height:14px;vertical-align:-2px;"/></span> <span>v${sng.version} 上线</span></div>
        <div class="stat-item"><span><img src="assets/img/items/UI_ItemIcon_112001.png" onerror="this.style.display='none'" style="width:14px;height:14px;vertical-align:-2px;"/></span> <span>${rName(sng.region)} 剧情曲</span></div>
      </div>
    </div>`;
  }

  html += '<div class="section-header"><img src="assets/img/items/UI_ItemIcon_202.png" onerror="this.style.display=\'none\'" style="width:16px;height:16px;vertical-align:-3px;margin-right:4px;"/> 异常值曲目清单（基于IQR统计方法识别）</div>';
  html += '<div class="ranking-list">';
  phenomenons.forEach((t, i) => {
    const bar = Math.min(100, (t.heat / phenomenons[0].heat) * 100);
    const rankColor = i < 3 ? ['#F59E0B', '#94A3B8', '#CD7F32'][i] : '#64748B';
    html += `
      <div class="ranking-item">
        <div class="rank-badge" style="background:${rankColor};">${i + 1}</div>
        <div class="rank-info">
          <div class="rank-title">${t.name}</div>
          <div class="rank-meta">${rName(t.region)} · v${t.version} · ${t.type}</div>
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
