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

// ==================== 版本时间轴数据（真实指标驱动） ====================
// 各版本上线时间与主题事件（官方公开版本节点），用于时间轴排序与事件标注
// 曲目、网易云评论、B站播放等指标全部在渲染时从 ST（真实采集数据）中读取，不预设任何模拟值
const VERSION_DATES = {
  '1.2':'2020-12','1.5':'2021-04','2.4':'2022-01','2.5':'2022-02','3.0':'2022-08',
  '4.2':'2023-11','4.3':'2023-12','5.0':'2024-08','6.0':'2025-04','6.4':'2025-10',
  '6.7':'2026-06','7.0':'2026-08','7.1':'2026-09'
};

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
  const medHeat = (typeof statMedian === 'function') ? statMedian(ST.filter(t => t.netease > 0).map(t => t.netease)) : 0;
  const allHeats = ST.filter(t => t.netease > 0).map(t => t.netease);

  el.innerHTML = sortedVersions.map(v => {
    const t = versionTop[v];
    const evt = VERSION_EVENTS[v] || { event: '版本更新', desc: '', region: t.region };
    const heatRatio = medHeat ? (t.netease / medHeat).toFixed(1) : '—';
    const pct = (typeof statPercentileRank === 'function') ? statPercentileRank(allHeats, t.netease) : null;
    const isHot = pct !== null && pct >= 90;
    const color = rColor(t.region);

    return `<div style="border-left:3px solid ${color};background:var(--surface-elevated);border-radius:8px;padding:16px 18px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px;">
        <div>
          <span style="display:inline-block;background:${color};color:#fff;font-size:11px;padding:2px 8px;border-radius:10px;font-weight:600;">v${v}</span>
          <strong style="margin-left:8px;font-size:15px;">${t.name}</strong>
          ${isHot ? '<span style="margin-left:6px;font-size:11px;color:var(--chart-5);font-weight:600;"><img src="assets/img/deco/UI_ItemIcon_105.png" style="width:11px;height:11px;vertical-align:-1px;"/> 头部 10%</span>' : ''}
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:18px;font-weight:700;color:${color};">
            <img src="assets/img/items/UI_ItemIcon_112001.png" style="width:14px;height:14px;vertical-align:-2px;margin-right:2px;" onerror="this.style.display='none'" title="来源：music.163.com 网易云单曲评论数（真实）"/>
            ${t.netease}k
          </div>
          <div style="font-size:10px;color:var(--text-tertiary);">中位数 ${heatRatio}倍 · 分位 ${pct === null ? '—' : 'P' + pct.toFixed(0)} · B站 ${t.qq}k</div>
        </div>
      </div>
      <div style="font-size:13px;color:var(--text-primary);margin-bottom:6px;font-weight:500;"><img src="assets/img/deco/UI_ItemIcon_201.png" style="width:13px;height:13px;vertical-align:-2px;margin-right:3px;"/> ${evt.event}</div>
      <div style="font-size:12px;color:var(--text-secondary);line-height:1.6;">${evt.desc}</div>
      <div style="display:flex;gap:12px;margin-top:10px;padding-top:8px;border-top:1px dashed rgba(201,162,39,0.15);font-size:11px;color:var(--text-tertiary);flex-wrap:wrap;">
        <span><img src="${regionElementUrl(t.region)}" style="width:11px;height:11px;vertical-align:-1px;margin-right:3px;"/> ${rName(t.region)}</span>
        <span style="background:rgba(254,44,85,0.06);padding:2px 6px;border-radius:4px;font-weight:600;color:#FE2C55;">
          <img src="assets/img/items/UI_ItemIcon_112001.png" style="width:10px;height:10px;vertical-align:-1px;margin-right:2px;" onerror="this.style.display='none'"/>
          网易云评论 ${t.netease}k
        </span>
        <span style="background:rgba(251,114,153,0.06);padding:2px 6px;border-radius:4px;font-weight:600;color:#FB7299;">
          <img src="assets/img/deco/UI_NameCardIcon_0.png" style="width:10px;height:10px;vertical-align:-1px;margin-right:2px;" onerror="this.style.display='none'"/>
          B站播放 ${t.qq}k
        </span>
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

// ==================== 版本时间轴·真实指标驱动 ====================
function renderVersionTimeline() {
  const el = document.getElementById('versionTimeline');
  if (!el) return;

  // 每个版本取「网易云评论数最高」的剧情曲作为代表曲目（全部来自真实采集数据）
  const byVersion = {};
  ST.forEach(t => {
    if (!VERSION_EVENTS[t.version]) return;
    if (!byVersion[t.version] || t.netease > byVersion[t.version].netease) byVersion[t.version] = t;
  });
  const versions = Object.keys(byVersion).sort((a, b) => parseFloat(a) - parseFloat(b));
  if (!versions.length) {
    el.innerHTML = '<div class="insight-card" style="padding:28px;text-align:center;"><div class="insight-label">暂无真实平台数据</div></div>';
    return;
  }

  const heats = ST.map(t => t.netease).filter(v => v > 0);
  const median = (typeof statMedian === 'function') ? statMedian(heats) : 0;
  const maxHeat = Math.max(...heats, 1);
  const maxPlay = Math.max(...versions.map(v => byVersion[v].qq), 1);

  let html = versions.map((v, idx) => {
    const t = byVersion[v];
    const color = rColor(t.region);
    const realHeat = t.netease > 0 ? t.netease : null;
    const play = t.qq > 0 ? t.qq : null;
    const heatPct = realHeat !== null ? (realHeat / maxHeat) * 100 : 0;
    const playPct = play !== null ? (play / maxPlay) * 100 : 0;
    const pct = (realHeat !== null && typeof statPercentileRank === 'function') ? statPercentileRank(heats, realHeat) : null;
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
              <span class="tl-metric-val" style="font-size:13px;font-weight:700;color:${color};">${realHeat !== null ? realHeat + 'k' : '—'}</span>
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
              <span class="tl-metric-val" style="font-size:13px;font-weight:700;color:#FB7299;">${play !== null ? play + 'k' : '—'}</span>
            </div>
            <div class="tl-metric-bar" style="height:6px;background:var(--surface);border-radius:3px;overflow:hidden;">
              <div class="tl-metric-fill" style="width:${playPct}%;background:linear-gradient(90deg,#FB729988,#FB7299);border-radius:3px;transition:width 0.6s ease;"></div>
            </div>
          </div>
        </div>

        <div class="tl-footer" style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:12px;border-top:1px solid var(--border);font-size:12px;color:var(--text-tertiary);">
          <div>
            <span>剧情曲样本中位数 ${median}k</span>
          </div>
          <div class="tl-source" style="font-size:10px;color:var(--text-quaternary);">数据来源：网易云音乐单曲评论 · B站相关视频播放（均为实测）</div>
        </div>
      </div>
    </div>`;
  }).join('');

  html += `<div class="tl-source-note" style="text-align:center;padding:16px;font-size:11px;color:var(--text-quaternary);border-top:1px solid var(--border);margin-top:20px;">
    <img src="assets/img/deco/UI_ItemIcon_202.png" style="width:12px;height:12px;vertical-align:-2px;margin-right:4px;" onerror="this.style.display='none'"/>
    读法：每个版本取评论数最高的剧情曲为代表，评论分位基于全部可核实剧情曲样本（n = ${heats.length}）计算；分位越高表示该曲越接近分布右端。样本为单次快照，不反映版本上线后的长期累积趋势。
  </div>`;

  el.innerHTML = html;
}
