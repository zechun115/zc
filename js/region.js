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
function hasMetricValue(v) {
  return typeof v === 'number' && Number.isFinite(v);
}
// 真实指标格式化：评论数 / 播放量（输入为实际值）；0 是有效实测值，不当作缺失。
function fmtCmt(n) {
  if (!hasMetricValue(n)) return '—';
  if (n >= 100000000) return (n / 100000000).toFixed(1).replace(/\.0$/, '') + '亿';
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万';
  return String(n);
}
function fmtPlay(n) {
  return fmtCmt(n);
}
// 万单位数值格式化（保留兼容，避免旧调用报错）
function fmtWan(n) {
  if (typeof n !== 'number' || isNaN(n) || n <= 0) return '—';
  const v = n >= 100 ? Math.round(n) : parseFloat(n.toFixed(1));
  return v + '万';
}
// 用于总览表格的格式化（输入为实际数字，如740000）
function fmtTableNum(n) {
  if (!hasMetricValue(n)) return '—';
  if (n >= 100000000) return (n / 100000000).toFixed(1).replace(/\.0$/, '') + '亿';
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
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
  renderRegionKpis();
})();

// ====== 顶部 KPI：全站地区样本规模（不随当前筛选变化） ======
function renderRegionKpis() {
  const el = document.getElementById('regionKpis');
  if (!el) return;
  const rows = REGIONS.map(r => {
    const tks = (typeof getTracksByRegion === 'function') ? getTracksByRegion(r.id) : [];
    const withData = tks.filter(t => hasMetricValue(t.neteaseCmt) || hasMetricValue(t.biliPlay));
    return {
      n: withData.length,
      nc: withData.filter(t => hasMetricValue(t.neteaseCmt)).length,
      np: withData.filter(t => hasMetricValue(t.biliPlay)).length,
      nf: withData.filter(t => typeof t.neteaseFav === 'string').length,
      tc: withData.reduce((s, t) => s + (hasMetricValue(t.neteaseCmt) ? t.neteaseCmt : 0), 0),
      tp: withData.reduce((s, t) => s + (hasMetricValue(t.biliPlay) ? t.biliPlay : 0), 0)
    };
  }).filter(r => r.n > 0);
  const n = rows.reduce((s, r) => s + r.n, 0);
  const nc = rows.reduce((s, r) => s + r.nc, 0);
  const np = rows.reduce((s, r) => s + r.np, 0);
  const nf = rows.reduce((s, r) => s + r.nf, 0);
  const tc = rows.reduce((s, r) => s + r.tc, 0);
  const tp = rows.reduce((s, r) => s + r.tp, 0);
  const cards = [
    { icon: 'assets/img/icons/秘境.png', v: rows.length, l: '覆盖地区数', tip: '有至少一项实测指标的地区数（含“其他”）' },
    { icon: 'assets/img/items/UI_ItemIcon_210.png', v: n, l: '曲目样本 n', tip: '至少有一项评论或播放实测的精选曲目数' },
    { icon: 'assets/img/items/UI_ItemIcon_112001.png', v: fmtCmt(tc), l: '评论总量', tip: `仅累计评论有效的 ${nc} 首（缺失不按 0）` },
    { icon: 'assets/img/deco/UI_NameCardIcon_0.png', v: fmtPlay(tp), l: '播放总量', tip: `仅累计播放有效的 ${np} 首（缺失不按 0）` },
    { icon: 'assets/img/deco/UI_ItemIcon_201.png', v: nf, l: '红心实测 n', tip: '有客户端 UI 红心标签的曲目数（粗粒度）' },
    { icon: 'assets/img/deco/UI_ItemIcon_105.png', v: nc && nf ? Math.round(nf / Math.max(n, 1) * 100) + '%' : '—', l: '指标覆盖', tip: `有红心标签曲目占样本比例；评论覆盖 ${n ? Math.round(nc / n * 100) : 0}%、播放覆盖 ${n ? Math.round(np / n * 100) : 0}%` }
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
      combinedTracks.push({ ...at, name: at.trackName, cmt: at.neteaseCmt, version: at.albumVersion, _source: 'album_only' });
    }
  });
  
  const sorted = [...combinedTracks].sort((a, b) => (b.heatScore || 0) - (a.heatScore || 0));
  
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
          ${t.bilibiliUrl ? `<a href="${t.bilibiliUrl}" target="_blank" rel="noopener" style="color:#FB7299;font-size:10px;text-decoration:none;"><img src="assets/img/deco/UI_NameCardIcon_0.png" style="width:10px;height:10px;vertical-align:-2px;" onerror="this.style.display='none'"/></a>` : ''}
        </div>` : '';
      const metrics = isAlbum ? `
        <div style="font-size:10px;color:var(--text-tertiary);display:flex;gap:6px;flex-wrap:wrap;">
          ${t.neteaseFav ? `<span style="color:#E2556E;" title="网易云红心/收藏数（客户端 UI 显示值）">红心${t.neteaseFav}</span>` : ''}
          ${t.neteaseCmt !== null && t.neteaseCmt !== undefined ? `<span style="color:#FE2C55;" title="网易云评论数（真实）"><img src="assets/img/items/UI_ItemIcon_112001.png" style="width:10px;height:10px;vertical-align:-2px;" onerror="this.style.display='none'"/>评${fmtCmt(t.neteaseCmt)}</span>` : ''}
          ${t.biliPlay !== null && t.biliPlay !== undefined ? `<span style="color:#FB7299;" title="B站相关视频播放量（真实）"><img src="assets/img/deco/UI_NameCardIcon_0.png" style="width:10px;height:10px;vertical-align:-2px;" onerror="this.style.display='none'"/>播${fmtPlay(t.biliPlay)}</span>` : ''}
        </div>` : '<div style="font-size:10px;color:var(--text-quaternary);">暂无真实平台数据</div>';
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
            ${score > 0 ? `<img src="assets/img/deco/UI_ItemIcon_105.png" style="width:10px;height:10px;vertical-align:-1px;" onerror="this.style.display='none'"/>${score}` : '—'}
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
    // 每个指标使用各自的有效样本；真实 0 保留，缺失值不补 0。
    const rows = REGIONS.map(r => {
      const tks = (typeof getTracksByRegion === 'function') ? getTracksByRegion(r.id) : [];
      const withData = tks.filter(t => hasMetricValue(t.neteaseCmt) || hasMetricValue(t.biliPlay));
      const cmtArr = withData.filter(t => hasMetricValue(t.neteaseCmt)).map(t => t.neteaseCmt);
      const playArr = withData.filter(t => hasMetricValue(t.biliPlay)).map(t => t.biliPlay);
      const paired = withData.filter(t => hasMetricValue(t.neteaseCmt) && hasMetricValue(t.biliPlay));
      // 红心数为客户端 UI 粗粒度标签；favLowerBound 取下限参与统计，展示不做精确估算。
      const favArr = withData.filter(t => typeof t.neteaseFav === 'string');
      const favWan = (typeof favLowerBound === 'function')
        ? favArr.filter(t => (favLowerBound(t.neteaseFav) || 0) >= 10000).length
        : 0;
      const tc = cmtArr.reduce((s, v) => s + v, 0);
      const tp = playArr.reduce((s, v) => s + v, 0);
      const pairedCmt = paired.reduce((s, t) => s + t.neteaseCmt, 0);
      const pairedPlay = paired.reduce((s, t) => s + t.biliPlay, 0);
      const medCmt = cmtArr.length ? statMedian(cmtArr) : null;
      const medPlay = playArr.length ? statMedian(playArr) : null;
      const headCount = cmtArr.length ? Math.max(1, Math.ceil(cmtArr.length * 0.1)) : 0;
      const headCmt = [...cmtArr].sort((a, b) => b - a).slice(0, headCount).reduce((s, v) => s + v, 0);
      const headShare = tc > 0 ? headCmt / tc * 100 : null;
      return { id: r.id, name: r.name, version: r.version || '', n: withData.length,
        nc: cmtArr.length, np: playArr.length, nb: paired.length, nf: favArr.length, nw: favWan,
        tc, tp, pairedCmt, pairedPlay, medCmt, medPlay, headCount, headShare };
    }).filter(r => r.n > 0).sort((a, b) => b.tc - a.tc);
    tableEl.innerHTML = rows.map(r => {
      const avgCmt = r.nc > 0 ? r.tc / r.nc : null;
      const avgPlay = r.np > 0 ? r.tp / r.np : null;
      return `<tr><td>${r.name}</td><td>${r.version && r.version !== '0.0' ? 'v' + r.version : '--'}</td><td>${r.n}</td><td>${r.nf}</td><td>${r.nw}</td><td>${r.nc ? fmtTableNum(r.tc) : '—'}</td><td>${r.np ? fmtTableNum(r.tp) : '—'}</td>
      <td>${fmtTableNum(avgCmt)}<small style="color:var(--text-quaternary);">（n=${r.nc}）</small></td><td>${fmtTableNum(avgPlay)}<small style="color:var(--text-quaternary);">（n=${r.np}）</small></td>
      <td>${fmtTableNum(r.medCmt)}</td><td>${fmtTableNum(r.medPlay)}</td></tr>`;
    }).join('');

    // 结论卡：分条给出规模、集中度、典型水平与互动深度；数值全部运行时计算。
    const summEl = document.getElementById('regionSummary');
    const conclEl = document.getElementById('regionConclusions');
    if (conclEl || summEl) {
      const totals = rows.reduce((a, r) => ({
        tc: a.tc + r.tc, tp: a.tp + r.tp, n: a.n + r.n, nc: a.nc + r.nc, np: a.np + r.np,
        nb: a.nb + r.nb, nf: a.nf + r.nf, nw: a.nw + r.nw,
        pairedCmt: a.pairedCmt + r.pairedCmt, pairedPlay: a.pairedPlay + r.pairedPlay
      }), { tc: 0, tp: 0, n: 0, nc: 0, np: 0, nb: 0, nf: 0, nw: 0, pairedCmt: 0, pairedPlay: 0 });
      const sortedByCmt = [...rows].sort((a, b) => b.tc - a.tc);
      const top3Share = totals.tc > 0 ? sortedByCmt.slice(0, 3).reduce((s, r) => s + r.tc, 0) / totals.tc * 100 : null;
      const depth = totals.nb > 0 && totals.pairedPlay > 0 ? totals.pairedCmt / (totals.pairedPlay / 10000) : null;
      const topRegion = sortedByCmt[0];
      const items = [];
      const push = (title, body) => items.push(`<li class="an-concl-item"><span class="cc-idx">${items.length + 1}</span><span class="cc-body"><span class="cc-title">${title}</span>${body}</span></li>`);

      push('样本是人工精选的地区曲目，不是全量专辑',
        `共覆盖 <em>${rows.length}</em> 个地区、<em>${totals.n}</em> 首至少有一项指标的曲目（评论有效 n=${totals.nc}，播放有效 n=${totals.np}，两项同时有效 n=${totals.nb}）。` +
        `排名与结论只代表当前精选样本，样本构成变化会直接改变名次，不能当成地区全部官方音乐的体检结果。`);

      if (totals.nf) {
        push('红心为客户端 UI 粗粒度标签，只能分层不能精算',
          `红心实测 <em>${totals.nf}</em> 首（如“10万+”“1万+”），其中下限 ≥1万 的 <em>${totals.nw}</em> 首、占 ${totals.nf ? (totals.nw / totals.nf * 100).toFixed(1) + '%' : '—'}。` +
          `统计取标签下限、不做精确估算，因此红心只用于分层比较（如 ≥1万 曲目数），不参与精确排序。`);
      }

      if (topRegion) {
        push('评论总量高度集中于少数地区',
          `评论总量最高的${topRegion.name}（样本 n=${topRegion.n}，评论中位数 ${fmtTableNum(topRegion.medCmt)}），其评论量前 10% 曲目共 ${topRegion.headCount} 首、贡献该地区评论 ${topRegion.headShare === null ? '—' : topRegion.headShare.toFixed(1) + '%'}；` +
          `总量前 3 的地区合计占 <em>${top3Share === null ? '—' : top3Share.toFixed(1) + '%'}</em>。总量同时受样本规模与头部曲目影响，不能据此认定某地区音乐整体更热。`);
      }

      if (depth !== null) {
        push('互动深度是跨平台比值，仅作量级参考',
          `把各地“评论、播放同时有效”的曲目合并（n=${totals.nb}），评论总量 ÷ 播放总量 × 1万 = <em>${depth.toFixed(1)} 条/万播</em>。` +
          `评论来自网易云、播放来自 B站，并非同一批用户的行为，这个比值只描述两个平台数据的相对量级，<em>不是</em>转化率或互动率。`);
      }

      if (conclEl) {
        conclEl.innerHTML = `<ol class="an-concl-list">${items.join('')}</ol>`;
      }
      if (summEl) {
        summEl.innerHTML = `<strong>口径：</strong>各指标使用各自有效样本，真实 0 保留、缺失不补 0；均值易受长尾影响，典型水平请结合中位数阅读；红心统计取客户端标签下限。`;
      }
    }
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
    { key: 'avgCmt', label: '评论均值' },
    { key: 'avgPlay', label: '播放均值' },
    { key: 'peakPlay', label: '播放峰值' },
    { key: 'trackScale', label: '曲目规模' },
    { key: 'interaction', label: '互动深度' },
    { key: 'favShare', label: '红心覆盖' }
  ];

  // 每个维度使用各自的有效样本；评论与播放都不能拿全部曲目数作分母。
  const regionMetrics = {};
  REGIONS.forEach(r => {
    const tracks = (typeof getTracksByRegion === 'function') ? getTracksByRegion(r.id) : [];
    const cmtTracks = tracks.filter(t => hasMetricValue(t.neteaseCmt));
    const playTracks = tracks.filter(t => hasMetricValue(t.biliPlay));
    const paired = tracks.filter(t => hasMetricValue(t.neteaseCmt) && hasMetricValue(t.biliPlay));
    const withData = tracks.filter(t => hasMetricValue(t.neteaseCmt) || hasMetricValue(t.biliPlay));
    if (!withData.length) return;
    const tc = cmtTracks.reduce((s, t) => s + t.neteaseCmt, 0);
    const tp = playTracks.reduce((s, t) => s + t.biliPlay, 0);
    const pairedCmt = paired.reduce((s, t) => s + t.neteaseCmt, 0);
    const pairedPlay = paired.reduce((s, t) => s + t.biliPlay, 0);
    const peak = playTracks.length ? Math.max(...playTracks.map(t => t.biliPlay)) : 0;
    const ac = cmtTracks.length ? tc / cmtTracks.length : 0;
    const ap = playTracks.length ? tp / playTracks.length : 0;
    // 红心覆盖：红心数有客户端 UI 实测值的曲目占比（0~1）
    const nf = withData.filter(t => typeof t.neteaseFav === 'string').length;
    regionMetrics[r.id] = {
      avgCmt: ac,
      avgPlay: ap,
      peakPlay: peak,
      trackScale: withData.length,
      // 互动深度：仅使用同一组同时有评论与播放的曲目
      interaction: paired.length && pairedPlay > 0 ? pairedCmt / (pairedPlay / 10000) : 0,
      favShare: nf / withData.length,
      nCmt: cmtTracks.length,
      nPlay: playTracks.length,
      nPair: paired.length,
      nAll: withData.length
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

  const cx = 150, cy = 150, R = 106, n = dims.length;
  const NS = 'http://www.w3.org/2000/svg';
  const isCompare = selectedRegions.size > 1;

  // 网格（最外层加重，内部层级做极淡的金色交替填充，增强层次感）
  for (let level = 1; level <= 4; level++) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i / n) - Math.PI / 2;
      const rr = R * (level / 4);
      pts.push(`${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`);
    }
    const poly = document.createElementNS(NS, 'polygon');
    poly.setAttribute('points', pts.join(' '));
    poly.setAttribute('fill', level % 2 === 0 ? 'rgba(201,162,39,0.035)' : 'none');
    poly.setAttribute('stroke', 'var(--border)');
    poly.setAttribute('stroke-width', level === 4 ? '1.4' : '1');
    poly.setAttribute('stroke-opacity', level === 4 ? '0.7' : '0.45');
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
    if (isCurrent) poly.style.filter = `drop-shadow(0 0 5px ${regionColor}66)`;
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
      const validN = dims[i].key === 'avgCmt' ? regionMetrics[rid].nCmt
        : dims[i].key === 'avgPlay' || dims[i].key === 'peakPlay' ? regionMetrics[rid].nPlay
        : dims[i].key === 'interaction' ? regionMetrics[rid].nPair
        : regionMetrics[rid].nAll;
      c.addEventListener('mouseenter', (e) => {
        const displayVal = dims[i].key === 'trackScale' ? raw + '首'
          : dims[i].key === 'favShare' ? (raw * 100).toFixed(1) + '%'
          : raw.toFixed(1);
        showRadarTooltip(e.clientX + 12, e.clientY - 10, `
          <div class="tooltip-title" style="color:${regionColor}">${rName(rid)} · ${dims[i].label}</div>
          <div class="tooltip-item"><span class="tooltip-label">原始值</span><span class="tooltip-value">${displayVal}</span></div>
          <div class="tooltip-item"><span class="tooltip-label">有效样本</span><span class="tooltip-value">n=${validN}</span></div>
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
        tv.setAttribute('font-size', '10');
        tv.setAttribute('font-weight', '700');
        tv.setAttribute('fill', regionColor);
        tv.setAttribute('paint-order', 'stroke');
        tv.setAttribute('stroke', 'var(--surface-elevated)');
        tv.setAttribute('stroke-width', '3');
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