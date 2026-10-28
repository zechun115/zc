// ==================== 地区探索页 ====================
let radarTooltipEl = null;

// 数字格式化：统一处理收藏数和播放数显示
// 输入数字（千为单位），输出格式化字符串如 "125k"、"43.8w"
function fmtNum(n) {
  if (typeof n !== 'number' || isNaN(n)) return '0';
  if (n >= 1000) return (n / 10).toFixed(1).replace(/\.0$/, '') + 'w'; // 千→万 除以10
  if (n >= 100) return Math.round(n) + 'k';
  if (n >= 10) return n.toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toFixed(1).replace(/\.0$/, '') + 'k';
}
// 万单位数值格式化（qqPlays/biliPlays 口径为万，直接保留一位小数）
function fmtWan(n) {
  if (typeof n !== 'number' || isNaN(n) || n <= 0) return '0万';
  const v = n >= 100 ? Math.round(n) : parseFloat(n.toFixed(1));
  return v + '万';
}
// 用于总览表格的格式化（输入为实际数字，如740000）
function fmtTableNum(n) {
  if (typeof n !== 'number' || isNaN(n)) return '0';
  if (n >= 100000000) return (n / 100000000).toFixed(1).replace(/\.0$/, '') + '亿';
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + '千';
  return Math.round(n).toString();
}
function showRadarTooltip(x, y, html) {
  if (!radarTooltipEl) {
    radarTooltipEl = document.createElement('div');
    radarTooltipEl.className = 'radar-tooltip';
    radarTooltipEl.innerHTML = html;
    document.body.appendChild(radarTooltipEl);
  }
  radarTooltipEl.innerHTML = html;
  radarTooltipEl.style.left = `${x}px`;
  radarTooltipEl.style.top = `${y}px`;
  radarTooltipEl.classList.add('show');
}
function hideRadarTooltip() {
  if (radarTooltipEl) radarTooltipEl.classList.remove('show');
}

let curRegion = 'liyue';
// 雷达图多地区对比：默认选中八国 + 挪德卡莱（蒙德、璃月、稻妻、须弥、枫丹、纳塔、挪德卡莱、至冬）
const MAIN_REGIONS = ['mondstadt', 'liyue', 'inazuma', 'sumeru', 'fontaine', 'natlan', 'nodkrai', 'snezhnaya'];
let selectedRegions = new Set(MAIN_REGIONS);

(function () {
  const params = new URLSearchParams(window.location.search);
  const r = params.get('r');
  if (r && REGIONS.find(x => x.id === r)) {
    curRegion = r;
    if (!selectedRegions.has(curRegion)) {
      selectedRegions = new Set([curRegion]);
    }
  }

  document.querySelectorAll('#regionFilters .chip').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const rid = btn.dataset.r;
      // Ctrl/Cmd + 点击：切换多选；普通点击：单选当前地区
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (selectedRegions.has(rid)) {
          if (selectedRegions.size > 1) selectedRegions.delete(rid);
        } else {
          selectedRegions.add(rid);
        }
        curRegion = rid;
      } else {
        document.querySelectorAll('#regionFilters .chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        curRegion = rid;
        selectedRegions = new Set([rid]);
      }
      updateChipActiveState();
      renderRegion();
    });
  });

  updateChipActiveState();
  renderRegion();
})();

function updateChipActiveState() {
  document.querySelectorAll('#regionFilters .chip').forEach(b => {
    const rid = b.dataset.r;
    b.classList.toggle('active', rid === curRegion);
    b.classList.toggle('in-compare', selectedRegions.has(rid));
  });
}

function selectAllRegions() {
  selectedRegions = new Set(MAIN_REGIONS);
  renderRegion();
}

function clearComparison(keepCurrent = true) {
  selectedRegions = new Set(keepCurrent ? [curRegion] : []);
  if (!keepCurrent) curRegion = MAIN_REGIONS[0];
  updateChipActiveState();
  renderRegion();
}

function renderRegion() {
  // 基础REGION_TRACKS数据
  const basicTracks = REGION_TRACKS[curRegion] || [];
  
  // 从ALBUMS获取增强数据
  let albumTracks = [];
  if (typeof getTracksByRegion === 'function') {
    albumTracks = getTracksByRegion(curRegion);
  }
  
  // 合并数据：有ALBUMS数据的用ALBUMS，否则用REGION_TRACKS
  const combinedTracks = basicTracks.map(bt => {
    // 精确匹配优先，再按中文名模糊匹配（专辑曲名多为「中文名 英文名」，同曲只保留一行）
    const matched = albumTracks.find(at => at.trackName === bt.name)
      || albumTracks.find(at => (at.trackName.split(' ')[0] || '').trim() === bt.name)
      || albumTracks.find(at => {
          const cn = (at.trackName.split(' ')[0] || '').trim();
          return cn.length >= 2 && (at.trackName.includes(bt.name) || bt.name.includes(cn));
        });
    if (matched && typeof getTrackHeatScore === 'function') {
      matched.heatScore = getTrackHeatScore(matched);
      return { ...bt, ...matched, _source: 'album' };
    }
    return { ...bt, heatScore: 0, _source: 'basic' };
  });
  
  // 追加仅在ALBUMS中有的曲目
  albumTracks.forEach(at => {
    if (!combinedTracks.find(ct => (ct.trackName || ct.name) === at.trackName)) {
      if (typeof getTrackHeatScore === 'function') at.heatScore = getTrackHeatScore(at);
      combinedTracks.push({ ...at, name: at.trackName, fav: at.neteaseFav, cmt: at.neteaseCmt, version: at.albumVersion, _source: 'album_only' });
    }
  });
  
  const sorted = [...combinedTracks].sort((a, b) => (b.heatScore || 0) - (a.heatScore || 0) || (b.fav || 0) - (a.fav || 0));
  
  // 去重：同一曲目名只保留首条（避免无平台数据的基础曲目被误判为重复）
  const seen = new Set();
  const uniqueSorted = sorted.filter(t => {
    const key = (t.trackName || t.name || '').trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  const rankEl = document.getElementById('regionRank');
  if (rankEl) {
    rankEl.innerHTML = uniqueSorted.slice(0, 15).map((t, i) => {
      const isAlbum = t._source !== 'basic';
      const score = t.heatScore || 0;
      const platformIcons = isAlbum ? `
        <div style="display:flex;gap:3px;margin-top:3px;">
          ${t.neteaseUrl ? `<a href="${t.neteaseUrl}" target="_blank" rel="noopener" style="color:#FE2C55;font-size:10px;text-decoration:none;"><img src="assets/img/items/UI_ItemIcon_112001.png" style="width:10px;height:10px;vertical-align:-2px;" onerror="this.style.display='none'"/></a>` : ''}
          ${t.qqUrl ? `<a href="${t.qqUrl}" target="_blank" rel="noopener" style="color:#31A5E8;font-size:10px;text-decoration:none;"><img src="assets/img/items/UI_ItemIcon_112002.png" style="width:10px;height:10px;vertical-align:-2px;" onerror="this.style.display='none'"/></a>` : ''}
          ${t.bilibiliUrl ? `<a href="${t.bilibiliUrl}" target="_blank" rel="noopener" style="color:#FB7299;font-size:10px;text-decoration:none;"><img src="assets/img/deco/UI_NameCardIcon_0.png" style="width:10px;height:10px;vertical-align:-2px;" onerror="this.style.display='none'"/></a>` : ''}
        </div>` : '';
      const metrics = isAlbum ? `
        <div style="font-size:10px;color:var(--text-tertiary);display:flex;gap:4px;flex-wrap:wrap;">
          ${t.neteaseFav > 0 ? `<span style="color:#FE2C55;"><img src="assets/img/items/UI_ItemIcon_112001.png" style="width:10px;height:10px;vertical-align:-2px;" onerror="this.style.display='none'"/>${fmtNum(t.neteaseFav)}</span>` : ''}
          ${t.qqPlays > 0 ? `<span style="color:#31A5E8;"><img src="assets/img/items/UI_ItemIcon_112002.png" style="width:10px;height:10px;vertical-align:-2px;" onerror="this.style.display='none'"/>${fmtWan(t.qqPlays)}</span>` : ''}
          ${t.biliPlays > 0 ? `<span style="color:#FB7299;"><img src="assets/img/deco/UI_NameCardIcon_0.png" style="width:10px;height:10px;vertical-align:-2px;" onerror="this.style.display='none'"/>${fmtWan(t.biliPlays)}</span>` : ''}
        </div>` : '';
      return `
        <li class="rank-item">
          <div class="rank-num ${i < 3 ? 'top' : ''}">${i + 1}</div>
          <div class="rank-info">
            <div class="rank-name">${t.trackName || t.name}</div>
            <div class="rank-meta">v${t.version || t.albumVersion || '-'} · ${isAlbum ? (t.albumName || '官方专辑') : '地区OST'}</div>
            ${metrics}
            ${platformIcons}
          </div>
          <div class="rank-val">
            ${score > 0 ? `<img src="assets/img/deco/UI_ItemIcon_105.png" style="width:10px;height:10px;vertical-align:-1px;" onerror="this.style.display='none'"/>${score}` : fmtNum(t.fav || 0)}
          </div>
        </li>`;
    }).join('');
  }
  const region = REGIONS.find(r => r.id === curRegion);
  const verText = region?.version && region.version !== '0.0' ? `v${region.version}` : '--';
  const titleEl = document.getElementById('regionRankTitle');
  if (titleEl) titleEl.textContent = `${region?.name || ''}地区 · ${verText}${albumTracks.length > 0 ? ' · 专辑数据' : ''}`;

  renderRadar();

  const tableEl = document.getElementById('regionTable');
  if (tableEl) {
    const rows = Object.entries(REGION_TRACKS).map(([rid, tks]) => {
      const r = REGIONS.find(x => x.id === rid);
      const tf = tks.reduce((s, t) => s + t.fav, 0);
      const tc = tks.reduce((s, t) => s + t.cmt, 0);
      return { name: r ? r.name : rid, version: r?.version || '', n: tks.length, tf, tc };
    }).sort((a, b) => b.tf - a.tf);
    tableEl.innerHTML = rows.map(r => {
      const avgFav = r.n > 0 ? r.tf / r.n : 0;
      const avgCmt = r.n > 0 ? r.tc / r.n : 0;
      return `<tr><td>${r.name}</td><td>${r.version && r.version !== '0.0' ? 'v' + r.version : '--'}</td><td>${r.n}</td><td>${fmtTableNum(r.tf * 1000)}</td><td>${fmtTableNum(r.tc * 1000)}</td>
      <td>${fmtNum(avgFav)}</td><td>${fmtNum(avgCmt)}</td></tr>`;
    }).join('');
  }

  const charListEl = document.getElementById('regionChars');
  if (charListEl) {
    const chars = CHARACTERS.filter(c => c.region === curRegion).sort((a, b) => b.pv - a.pv);
    charListEl.innerHTML = `<div class="char-grid">${chars.map(c =>
      (typeof window.renderCharCard === 'function')
        ? window.renderCharCard(c)
        : `<div class="char-card"><div class="char-card-info"><div class="char-card-name">${c.name}</div></div></div>`
    ).join('')}</div>`;
  }
}

function renderRadar() {
  const svg = document.getElementById('radarSvg');
  if (!svg) return;
  svg.innerHTML = '';

  const dims = [
    { key: 'avgFav', label: '平均收藏' },
    { key: 'avgCmt', label: '平均评论' },
    { key: 'peakFav', label: '传播峰值' },
    { key: 'trackScale', label: '曲目规模' },
    { key: 'interaction', label: '互动深度' }
  ];

  // 计算所有地区的原始指标
  const regionMetrics = {};
  Object.entries(REGION_TRACKS).forEach(([rid, tracks]) => {
    if (!tracks.length) return;
    const tf = tracks.reduce((s, t) => s + (t.fav || 0), 0);
    const tc = tracks.reduce((s, t) => s + (t.cmt || 0), 0);
    const mf = Math.max(...tracks.map(t => t.fav || 0));
    const af = tf / tracks.length;
    const ac = tc / tracks.length;
    regionMetrics[rid] = {
      avgFav: af,
      avgCmt: ac,
      peakFav: mf,
      trackScale: tracks.length,
      interaction: af > 0 ? ac / af : 0
    };
  });

  // 对数归一化：让差距更明显同时压缩极端值
  function norm(key) {
    const vals = Object.values(regionMetrics).map(m => Math.log1p(m[key]));
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = max - min || 1;
    return rid => {
      const v = regionMetrics[rid] ? Math.log1p(regionMetrics[rid][key]) : min;
      return Math.max(0.08, Math.min(1, (v - min) / range));
    };
  }

  const norms = {};
  dims.forEach(d => { norms[d.key] = norm(d.key); });

  const cx = 150, cy = 140, R = 90, n = dims.length;
  const NS = 'http://www.w3.org/2000/svg';
  const isCompare = selectedRegions.size > 1;

  // 网格
  for (let level = 1; level <= 4; level++) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i / n) - Math.PI / 2;
      const rr = R * (level / 4);
      pts.push(`${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`);
    }
    const poly = document.createElementNS(NS, 'polygon');
    poly.setAttribute('points', pts.join(' '));
    poly.setAttribute('fill', 'none');
    poly.setAttribute('stroke', 'var(--border)');
    poly.setAttribute('stroke-width', '1');
    poly.setAttribute('stroke-opacity', '0.5');
    svg.appendChild(poly);
  }

  // 轴线和标签
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i / n) - Math.PI / 2;
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', cx); line.setAttribute('y1', cy);
    line.setAttribute('x2', cx + R * Math.cos(a)); line.setAttribute('y2', cy + R * Math.sin(a));
    line.setAttribute('stroke', 'var(--border)'); line.setAttribute('stroke-width', '1');
    line.setAttribute('stroke-dasharray', '2,2');
    svg.appendChild(line);
    const lab = document.createElementNS(NS, 'text');
    lab.setAttribute('x', cx + (R + 20) * Math.cos(a));
    lab.setAttribute('y', cy + (R + 20) * Math.sin(a) + 4);
    lab.setAttribute('text-anchor', 'middle');
    lab.setAttribute('font-size', '11');
    lab.setAttribute('font-weight', '600');
    lab.setAttribute('fill', 'var(--text-secondary)');
    lab.textContent = dims[i].label;
    svg.appendChild(lab);
  }

  // 绘制每个选中地区的数据层
  const activeRegions = Array.from(selectedRegions).filter(rid => regionMetrics[rid]);
  activeRegions.forEach((rid, idx) => {
    const vals = dims.map(d => norms[d.key](rid));
    const regionColor = rColor(rid);
    const isCurrent = rid === curRegion;
    const strokeWidth = isCurrent ? 2.5 : 1.5;
    const fillOpacity = isCurrent ? 0.14 : 0.06;
    const pointR = isCurrent ? 4 : 3;

    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i / n) - Math.PI / 2;
      const rr = R * vals[i];
      pts.push(`${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`);
    }

    // 填充区域
    const poly = document.createElementNS(NS, 'polygon');
    poly.setAttribute('points', pts.join(' '));
    poly.setAttribute('fill', regionColor);
    poly.setAttribute('fill-opacity', fillOpacity);
    poly.setAttribute('stroke', regionColor);
    poly.setAttribute('stroke-width', strokeWidth);
    poly.setAttribute('stroke-linejoin', 'round');
    poly.style.transition = 'all 0.3s ease';
    svg.appendChild(poly);

    // 数据点
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i / n) - Math.PI / 2;
      const rr = R * vals[i];
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', cx + rr * Math.cos(a));
      c.setAttribute('cy', cy + rr * Math.sin(a));
      c.setAttribute('r', pointR);
      c.setAttribute('fill', regionColor);
      c.setAttribute('stroke', 'var(--surface-raised)');
      c.setAttribute('stroke-width', '1.5');
      c.style.cursor = 'pointer';
      const raw = regionMetrics[rid][dims[i].key];
      c.addEventListener('mouseenter', (e) => {
        const displayVal = dims[i].key === 'trackScale' ? raw + '首' : raw.toFixed(1);
        showRadarTooltip(e.clientX + 12, e.clientY - 10, `
          <div class="tooltip-title" style="color:${regionColor}">${rName(rid)} · ${dims[i].label}</div>
          <div class="tooltip-item"><span class="tooltip-label">原始值</span><span class="tooltip-value">${displayVal}</span></div>
          <div class="tooltip-item"><span class="tooltip-label">归一化得分</span><span class="tooltip-value">${(vals[i]*100).toFixed(0)}</span></div>
        `);
      });
      c.addEventListener('mouseleave', hideRadarTooltip);
      svg.appendChild(c);
    }

    // 单地区模式显示数值标签
    if (!isCompare && isCurrent) {
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i / n) - Math.PI / 2;
        const rr = R * vals[i];
        const tv = document.createElementNS(NS, 'text');
        tv.setAttribute('x', cx + (rr + 12) * Math.cos(a));
        tv.setAttribute('y', cy + (rr + 12) * Math.sin(a) + 3);
        tv.setAttribute('text-anchor', 'middle');
        tv.setAttribute('font-size', '9');
        tv.setAttribute('font-weight', '700');
        tv.setAttribute('fill', regionColor);
        tv.textContent = (vals[i] * 100).toFixed(0);
        svg.appendChild(tv);
      }
    }
  });

  renderRadarLegend(activeRegions);
}

function renderRadarLegend(activeRegions) {
  const legendEl = document.getElementById('radarLegend');
  if (!legendEl) return;
  const compareHint = selectedRegions.size > 1
    ? `<span class="radar-hint">按住 Ctrl/Cmd 点击地区可增删对比</span>`
    : `<span class="radar-hint">当前为单地区视图，按住 Ctrl/Cmd 点击地区开启多选对比</span>`;
  legendEl.innerHTML = compareHint + activeRegions.map(rid => {
    const region = REGIONS.find(r => r.id === rid);
    const color = rColor(rid);
    const isCurrent = rid === curRegion;
    return `
      <div class="radar-legend-item ${isCurrent ? 'current' : ''}" data-rid="${rid}" title="${isCurrent ? '当前选中：' : '点击切换到：'}${region?.name || rid}">
        <span class="radar-legend-dot" style="background:${color};${isCurrent ? 'box-shadow:0 0 8px ' + color + '88;' : ''}"></span>
        <span class="radar-legend-name">${region?.name || rid}</span>
      </div>
    `;
  }).join('');

  legendEl.querySelectorAll('.radar-legend-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const rid = item.dataset.rid;
      if (e.ctrlKey || e.metaKey) {
        if (selectedRegions.has(rid)) {
          if (selectedRegions.size > 1) selectedRegions.delete(rid);
        } else {
          selectedRegions.add(rid);
        }
        updateChipActiveState();
        renderRadar();
      } else {
        curRegion = rid;
        selectedRegions = new Set([rid]);
        updateChipActiveState();
        renderRegion();
      }
    });
  });
}