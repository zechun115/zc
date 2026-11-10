// ==================== 音乐专辑页 · 重构版 ====================
let albumFilter = 'all';
let rankMetric = 'heat';

(function () {
  renderStats();
  renderRankings();
  renderAlbumGrid();

  // 筛选器
  document.querySelectorAll('#albumFilter .chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#albumFilter .chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      albumFilter = btn.dataset.f;
      renderRankings();   // 联动：排行榜跟着筛选器走
      renderAlbumGrid();
    });
  });

  // 排行榜 Tab
  document.querySelectorAll('#rankTabs .rank-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#rankTabs .rank-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      rankMetric = btn.dataset.metric;
      renderRankings();
    });
  });

  // 抽屉关闭
  document.getElementById('drawerClose').addEventListener('click', closeDrawer);
  document.getElementById('drawerMask').addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
})();

/* ==================== KPI 总览 ==================== */
function renderStats() {
  const hasData = r => r && (typeof r.neteaseCmt === 'number' || typeof r.biliPlay === 'number' || (typeof favLowerBound === 'function' && favLowerBound(r.neteaseFav) !== null));
  const total = ALBUMS.length;
  const totalTracks = ALBUMS.reduce((s, a) => s + a.trackCount, 0);
  const allReal = ALBUMS.flatMap(a => a.tracks.map(t => ({ album: a, track: t }))).filter(x => {
    const r = TRACK_REAL && x.track.ncmId ? TRACK_REAL[x.track.ncmId] : null;
    return r && hasData(r);
  });
  const realTracks = allReal.length;
  const coverage = totalTracks ? (realTracks / totalTracks * 100).toFixed(1) : '0.0';
  const cmtSum = allReal.reduce((s, x) => s + ((TRACK_REAL[x.track.ncmId]?.neteaseCmt) || 0), 0);
  const playSum = allReal.reduce((s, x) => s + ((TRACK_REAL[x.track.ncmId]?.biliPlay) || 0), 0);
  const favVals = allReal.map(x => TRACK_REAL[x.track.ncmId]?.neteaseFav).filter(v => typeof favLowerBound === 'function' && favLowerBound(v) !== null);
  const favHot = favVals.filter(v => favLowerBound(v) >= 100000).length;
  const albumsWithData = ALBUMS.filter(a => a.tracks.some(t => {
    const r = TRACK_REAL && t.ncmId ? TRACK_REAL[t.ncmId] : null;
    return r && hasData(r);
  })).length;

  ['albumHeroCount', 'albumGridCount'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = total;
  });

  const cards = [
    { v: total,             l: '官方专辑总数',        c: '#8B5CF6', icon: 'assets/img/icons/旋曜玉帛.png' },
    { v: fmtNum(totalTracks), l: '收录曲目总数（官方）', c: '#F59E0B', icon: 'assets/img/items/UI_ItemIcon_112001.png' },
    { v: realTracks,        l: '有实测数据的曲目',     c: '#10B981', icon: 'assets/img/deco/UI_ItemIcon_108.png' },
    { v: coverage + '%',    l: '实测覆盖率',          c: '#3B82F6', icon: 'assets/img/deco/UI_ItemIcon_211.png' },
    { v: favVals.length,    l: '红心数实测曲目',       c: '#E2556E', icon: 'assets/img/items/UI_ItemIcon_210.png' },
    { v: favHot,            l: '红心 ≥10万 曲目',     c: '#EF4444', icon: 'assets/img/elements/UI_Element_Fire.png' },
    { v: fmtCN(cmtSum),     l: '网易云评论合计',       c: '#FE2C55', icon: 'assets/img/deco/UI_ItemIcon_204.png' },
    { v: fmtCN(playSum),    l: 'B站播放合计',          c: '#FB7299', icon: 'assets/img/deco/UI_NameCardIcon_0.png' }
  ];
  document.getElementById('albumStats').innerHTML = cards.map(c => `
    <div class="album-stat">
      <div class="stat-icon" style="background:${c.c}1f;box-shadow:0 0 14px ${c.c}2e;">
        <img src="${c.icon}" onerror="this.style.display='none'" style="width:20px;height:20px;object-fit:contain;" alt="">
      </div>
      <div class="stat-value" style="color:${c.c};">${c.v}</div>
      <div class="stat-label">${c.l}</div>
    </div>`).join('');

  // 评论分布摘要：统一复用 data.js 的分位数实现，真实 0 保留在样本中。
  const cmtVals = allReal.map(x => TRACK_REAL[x.track.ncmId]?.neteaseCmt).filter(v => typeof v === 'number' && isFinite(v));
  const med = cmtVals.length ? statMedian(cmtVals) : null;
  const q1 = cmtVals.length ? statQ1(cmtVals) : null;
  const q3 = cmtVals.length ? statQ3(cmtVals) : null;
  const iqr = cmtVals.length ? statIQR(cmtVals) : null;
  const upper = cmtVals.length ? q3 + 1.5 * iqr : null;
  const outlierVals = upper === null ? [] : cmtVals.filter(v => v > upper);
  const outlierTrackShare = cmtVals.length ? outlierVals.length / cmtVals.length * 100 : null;
  const outlierCmtShare = cmtSum > 0 ? outlierVals.reduce((s, v) => s + v, 0) / cmtSum * 100 : null;
  let skewness = null;
  if (cmtVals.length > 2) {
    const mean = statMean(cmtVals);
    const m2 = statMean(cmtVals.map(v => Math.pow(v - mean, 2)));
    const m3 = statMean(cmtVals.map(v => Math.pow(v - mean, 3)));
    if (m2 > 0) skewness = Math.sqrt(cmtVals.length * (cmtVals.length - 1)) / (cmtVals.length - 2) * m3 / Math.pow(m2, 1.5);
  }
  const skewLabel = skewness === null ? '无法计算'
    : Math.abs(skewness) < 0.5 ? '近似对称'
    : Math.abs(skewness) < 1 ? (skewness > 0 ? '轻度右偏' : '轻度左偏')
    : (skewness > 0 ? '明显右偏' : '明显左偏');
  const pctText = v => v === null ? '—' : v.toFixed(1) + '%';

  // 红心标签分布按当前数据动态统计，避免静态文案与数据不一致。
  const favDist = {};
  favVals.forEach(v => { const k = String(v); favDist[k] = (favDist[k] || 0) + 1; });
  const bucket = { exact: 0, '999+': 0, '1w+': 0, '10w+': 0, '100w+': 0 };
  Object.entries(favDist).forEach(([k, n]) => { if (/^\d+$/.test(k)) bucket.exact += n; else if (bucket[k] !== undefined) bucket[k] += n; });
  const favDistText = [`精确值(<1000) ${bucket.exact} 首`, `999+ ${bucket['999+']} 首`, `1w+ ${bucket['1w+']} 首`, `10w+ ${bucket['10w+']} 首`, `100w+ ${bucket['100w+']} 首`].join(' / ');
  // 核心结论：分条渲染，每条先给标题再给统计依据，全部由当前数据动态计算。
  const cmtMean = cmtVals.length ? statMean(cmtVals) : null;
  const medVsMean = (med !== null && cmtMean !== null && med > 0) ? (cmtMean / med) : null;
  const topAlbumShare = (() => {
    // 评论量最高的 5 张专辑占全部评论的比例（头部集中度）
    const byAlbum = {};
    allReal.forEach(x => {
      const v = TRACK_REAL[x.track.ncmId]?.neteaseCmt;
      if (typeof v === 'number') byAlbum[x.album.name] = (byAlbum[x.album.name] || 0) + v;
    });
    const totalCmt = Object.values(byAlbum).reduce((s, v) => s + v, 0);
    if (!totalCmt) return null;
    return Object.values(byAlbum).sort((a, b) => b - a).slice(0, 5).reduce((s, v) => s + v, 0) / totalCmt * 100;
  })();

  const concl = [];
  concl.push(['分布明显右偏，比较以中位数为基准',
    `${cmtVals.length} 首评论有效曲目：中位数 <em>${fmtNum(med)}</em>、均值 <em>${fmtNum(cmtMean)}</em>` +
    `${medVsMean ? `，均值是中位数的 <em>${medVsMean.toFixed(1)} 倍</em>` : ''}；` +
    `Q1 ${fmtNum(q1)}、Q3 ${fmtNum(q3)}、IQR ${fmtNum(iqr)}。` +
    `校正偏度 <em>${skewness === null ? '—' : skewness.toFixed(2)}</em>（${skewLabel}），均值被少数热门曲拉高，代表不了典型曲目。`]);
  concl.push(['曲目热度高度集中在少数作品',
    `按 Tukey 规则（Q3 + 1.5×IQR = <em>${fmtNum(upper)}</em>），评论量高异常值 <em>${outlierVals.length} 首</em>，` +
    `仅占有效曲目 <em>${pctText(outlierTrackShare)}</em>，却贡献了全部评论量的 <em>${pctText(outlierCmtShare)}</em>` +
    `${topAlbumShare !== null ? `；评论量最高的 5 张专辑合计占 <em>${topAlbumShare.toFixed(1)}%</em>` : ''}。` +
    `异常值只描述长尾结构，不代表数据错误，也不等于"现象级"判定。`]);
  concl.push(['红心数是客户端 UI 粒度，统计取下限',
    `${favVals.length} 首曲目经桌面客户端逐首实测：${favDistText}。` +
    `≥1000 的曲目只有标签区间、没有精确值，排序与热度加权一律使用<strong>区间下限</strong>，不做任何估算；` +
    `${totalTracks - favVals.length} 首未能核实到同曲的红心数诚实留空。`]);
  concl.push(['样本覆盖与口径',
    `${total} 张专辑（${albumsWithData} 张有实测曲目）共收录 ${fmtNum(totalTracks)} 首，其中 ${realTracks} 首（<em>${coverage}%</em>）具备至少一项实测指标。` +
    `评论来自网易云逐首接口、播放来自 B站「原神+曲名」最相关视频，两者口径不同、不可相加；同一支 PV 可能命中多首曲目，播放量反映的是"相关视频热度"。`]);

  document.getElementById('albumAnalysis').innerHTML = concl.map(([t, b], i) => `
    <li class="an-concl-item">
      <span class="cc-idx">${i + 1}</span>
      <span class="cc-body"><span class="cc-title">${t}</span>${b}</span>
    </li>`).join('');
}

/* ==================== 排行榜 ==================== */
function filteredAlbums() {
  if (albumFilter === 'all') return ALBUMS;
  if (['scene', 'character', 'ep', 'version'].includes(albumFilter))
    return ALBUMS.filter(a => a.type === albumFilter);
  return ALBUMS.filter(a => a.region === albumFilter);
}

function renderRankings() {
  const albums = filteredAlbums();
  const rows = [];
  albums.forEach(a => a.tracks.forEach(t => {
    const r = TRACK_REAL && t.ncmId ? TRACK_REAL[t.ncmId] : null;
    if (!r) return;
    const cmt = typeof r.neteaseCmt === 'number' ? r.neteaseCmt : null;
    const play = typeof r.biliPlay === 'number' ? r.biliPlay : null;
    const fav = typeof r.neteaseFav === 'string' ? r.neteaseFav : null;
    const favLow = (typeof favLowerBound === 'function') ? favLowerBound(fav) : null;
    if (cmt === null && play === null && favLow === null) return;
    const heat = (typeof getTrackHeatScore === 'function')
      ? getTrackHeatScore({ neteaseCmt: cmt, biliPlay: play, neteaseFav: fav }) : 0;
    rows.push({ album: a, track: t, cmt, play, fav, favLow, heat });
  }));

  let sorted, maxV, unit, label, color, validRows, condition;
  if (rankMetric === 'heat') {
    validRows = rows;
    sorted = [...validRows].sort((x, y) => y.heat - x.heat).slice(0, 20);
    maxV = 100; unit = ''; label = '综合热度'; color = '#F59E0B';
    condition = '至少有一项有效红心、评论或播放指标，缺失项按可用权重重新归一';
  } else if (rankMetric === 'fav') {
    validRows = rows.filter(r => r.favLow !== null);
    sorted = [...validRows].sort((x, y) => y.favLow - x.favLow).slice(0, 20);
    maxV = sorted[0]?.favLow || 1; unit = ''; label = '网易云红心'; color = '#E2556E';
    condition = '客户端红心标签可识别，排序使用标签下限而非估算精确值';
  } else if (rankMetric === 'cmt') {
    validRows = rows.filter(r => r.cmt !== null);
    sorted = [...validRows].sort((x, y) => y.cmt - x.cmt).slice(0, 20);
    maxV = sorted[0]?.cmt || 1; unit = ''; label = '网易云评论'; color = '#FE2C55';
    condition = '网易云评论为有效数值';
  } else {
    validRows = rows.filter(r => r.play !== null);
    sorted = [...validRows].sort((x, y) => y.play - x.play).slice(0, 20);
    maxV = sorted[0]?.play || 1; unit = ''; label = 'B站播放'; color = '#FB7299';
    condition = 'B站相关视频播放为有效数值';
  }

  const zeroCount = rankMetric === 'fav' ? validRows.filter(r => r.favLow === 0).length
    : rankMetric === 'cmt' ? validRows.filter(r => r.cmt === 0).length
    : rankMetric === 'play' ? validRows.filter(r => r.play === 0).length : null;
  const sampleNote = document.getElementById('rankSampleNote');
  if (sampleNote) {
    sampleNote.innerHTML = `<strong style="color:var(--gold-light);">${label}榜：</strong>${condition}；当前筛选有效 n=${validRows.length}，展示前 ${sorted.length} 首` +
      `${zeroCount === null ? '' : `，其中实测 0 值 ${zeroCount} 首`}。真实 0 计入样本，缺失值不进入对应指标榜单，二者不相互替代。`;
  }

  const el = document.getElementById('rankList');
  if (!sorted.length) { el.innerHTML = `<div class="empty-hint">当前筛选条件下无已核实曲目</div>`; return; }

  el.innerHTML = sorted.map((r, i) => {
    const val = rankMetric === 'heat' ? r.heat : (rankMetric === 'fav' ? r.favLow : (rankMetric === 'cmt' ? r.cmt : r.play));
    const pct = Math.max(2, (val / maxV) * 100);
    const albumName = r.album.name;
    // 红心榜主值直接用客户端标签；其余榜单用人类可读格式。避免与右侧 meta 重复显示"红心xx"两遍。
    const fmtV = rankMetric === 'heat' ? val.toFixed(1) : (rankMetric === 'fav' ? r.fav : fmtCN(val));
    const cmtTag = r.cmt !== null ? `<span style="color:#FE2C55;font-size:10px;"><img src="assets/img/items/UI_ItemIcon_112001.png" style="width:10px;height:10px;vertical-align:-1px;" onerror="this.style.display='none'"/>${fmtNum(r.cmt)}</span>` : '';
    const playTag = r.play !== null ? `<span style="color:#FB7299;font-size:10px;"><img src="assets/img/deco/UI_NameCardIcon_0.png" style="width:10px;height:10px;vertical-align:-1px;" onerror="this.style.display='none'"/>${fmtCN(r.play)}</span>` : '';
    // 当前榜单的主值列已展示该指标，meta 里只放另外两项指标，避免同一数值出现两遍。
    const favTag = (r.fav !== null && rankMetric !== 'fav') ? `<span style="color:#E2556E;font-size:10px;" title="网易云红心/收藏数（客户端 UI 显示值）">红心${r.fav}</span>` : '';
    const cmtTag2 = (r.cmt !== null && rankMetric !== 'cmt') ? cmtTag : '';
    const playTag2 = (r.play !== null && rankMetric !== 'play') ? playTag : '';
    return `
    <div class="rank-row" data-album="${encodeURIComponent(albumName)}" title="点击查看《${albumName}》完整曲目">
      <span class="rank-no ${i < 3 ? 'top3' : ''}">${i + 1}</span>
      <a class="rank-name" href="${r.track.neteaseUrl || r.album.neteaseUrl}" target="_blank" title="点击在网易云打开《${r.track.name}》">${r.track.name}</a>
      <span class="rank-album" title="${albumName}">${albumCoverThumb(r.album, 20, -5)}<span style="vertical-align:middle;">${albumName}</span></span>
      <div class="rank-bar">
        <div class="rank-fill" style="width:${pct}%;background:linear-gradient(90deg,${color}88,${color});"></div>
      </div>
      <span class="rank-val" style="color:${color};">${fmtV}</span>
      <span class="rank-meta">${favTag} ${cmtTag2} ${playTag2}</span>
    </div>`;
  }).join('');

  // 点击行 → 打开所属专辑抽屉（曲名链接除外，那里保留网易云直达）
  el.querySelectorAll('.rank-row').forEach(row => {
    row.addEventListener('click', e => {
      if (e.target.closest('a')) return;
      const name = decodeURIComponent(row.dataset.album || '');
      const idx = ALBUMS.findIndex(a => a.name === name);
      if (idx >= 0) openDrawer(idx);
    });
  });
}

/* ==================== 专辑网格 ==================== */
function renderAlbumGrid() {
  const grid = document.getElementById('albumGrid');
  const albums = filteredAlbums();
  const countEl = document.getElementById('albumGridCount');
  if (countEl) {
    countEl.textContent = albums.length === ALBUMS.length
      ? `${albums.length}`
      : `筛选出 ${albums.length} / ${ALBUMS.length}`;
  }

  if (!albums.length) {
    grid.innerHTML = `<div class="empty-hint" style="grid-column:1/-1;">当前筛选条件下没有专辑</div>`;
    return;
  }

  grid.innerHTML = albums.map(a => {
    const region = REGIONS ? REGIONS.find(r => r.id === a.region) : null;
    const color = region?.color || '#8B5CF6';
    const realTracks = a.tracks.filter(t => TRACK_REAL && t.ncmId &&
      (typeof TRACK_REAL[t.ncmId]?.neteaseCmt === 'number' || typeof TRACK_REAL[t.ncmId]?.biliPlay === 'number' || typeof TRACK_REAL[t.ncmId]?.neteaseFav === 'string'));
    const withHeat = realTracks.map(t => ({
      t, h: (typeof getTrackHeatScore === 'function')
        ? getTrackHeatScore({ neteaseCmt: TRACK_REAL[t.ncmId].neteaseCmt, biliPlay: TRACK_REAL[t.ncmId].biliPlay, neteaseFav: TRACK_REAL[t.ncmId].neteaseFav }) : 0
    })).filter(x => x.h > 0).sort((x, y) => y.h - x.h);
    const top = withHeat.slice(0, 2);
    const coverSrc = albumCoverSrc(a);

    return `
    <div class="album-mini" data-idx="${ALBUMS.indexOf(a)}">
      <div class="album-mini-cover" style="background:linear-gradient(135deg,${color},${color}55);overflow:hidden;" title="点击展开《${a.name}》曲目详情">
        ${coverSrc ? `<img src="${coverSrc}" alt="${a.name} 封面" loading="lazy" onerror="this.style.display='none'" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;"/>` : ''}
        <span class="album-mini-version">v${a.version}</span>
        <span class="album-mini-type">${
          ({ scene: '场景', character: '角色', ep: 'EP', version: '合集' }[a.type] || '其他')
        }</span>
      </div>
      <div class="album-mini-body">
        <div class="album-mini-title" title="${a.name}">${a.name}</div>
        <div class="album-mini-meta">
          <span>${a.releaseDate}</span>
          <span style="color:${color};">${region?.name || '—'}</span>
          <span>${a.trackCount} 曲</span>
          ${a.type === 'character' ? '<span style="color:var(--gold);">角色主题 OST</span>' : ''}
        </div>
        ${top.length ? `
        <div class="album-mini-top">
          ${top.map((x, i) => {
            const cmt = TRACK_REAL[x.t.ncmId].neteaseCmt;
            const play = TRACK_REAL[x.t.ncmId].biliPlay;
            return `
            <div class="mini-heat">
              <span class="mini-heat-no" style="color:${color};">#${i + 1}</span>
              <span class="mini-heat-name">${x.t.name.length > 14 ? x.t.name.slice(0, 14) + '…' : x.t.name}</span>
              <div class="mini-heat-bar"><div class="mini-heat-fill" style="width:${x.h}%;background:${color};"></div></div>
              <span class="mini-heat-val">${x.h.toFixed(0)}</span>
            </div>`;
          }).join('')}
        </div>` : `<div class="mini-empty">${a.trackCount} 曲 · 暂无实测数据</div>`}
        <div class="album-mini-actions">
          <button class="mini-btn mini-expand" data-idx="${ALBUMS.indexOf(a)}">展开详情 ▸</button>
          <a href="${a.neteaseUrl || '#'}" target="_blank" class="mini-btn mini-link" style="color:#FE2C55;">网易云 →</a>
          <a href="${a.bilibiliUrl || '#'}" target="_blank" class="mini-btn mini-link" style="color:#FB7299;">B站 →</a>
        </div>
      </div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.mini-expand').forEach(btn => {
    btn.addEventListener('click', () => openDrawer(Number(btn.dataset.idx)));
  });
  // 封面与标题点击同样展开抽屉（链接与按钮除外）
  grid.querySelectorAll('.album-mini').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('a, .mini-btn')) return;
      if (!e.target.closest('.album-mini-cover, .album-mini-title')) return;
      openDrawer(Number(card.dataset.idx));
    });
  });
}

/* ==================== 抽屉 ==================== */
let drawerLastFocus = null;
function openDrawer(idx) {
  const a = ALBUMS[idx];
  const region = REGIONS ? REGIONS.find(r => r.id === a.region) : null;
  const color = region?.color || '#8B5CF6';
  drawerLastFocus = document.activeElement;

  document.getElementById('drawerTitle').textContent = a.name;
  const dc = document.getElementById('drawerCover');
  if (dc) {
    const src = albumCoverSrc(a);
    if (src) { dc.style.display = ''; dc.src = src; dc.alt = a.name + ' 封面'; }
    else { dc.style.display = 'none'; dc.removeAttribute('src'); }
  }
  document.getElementById('drawerSub').innerHTML =
    `${a.releaseDate} · v${a.version} · ${a.trackCount} 曲 · <span style="color:${color};">${region?.name || '—'}</span> · ${a.desc || ''}`;

  const rows = a.tracks.map(t => {
    const r = TRACK_REAL && t.ncmId ? TRACK_REAL[t.ncmId] : null;
    const cmt = r && typeof r.neteaseCmt === 'number' ? r.neteaseCmt : null;
    const play = r && typeof r.biliPlay === 'number' ? r.biliPlay : null;
    const fav = r && typeof r.neteaseFav === 'string' ? r.neteaseFav : null;
    const heat = (cmt !== null || play !== null || fav !== null) && (typeof getTrackHeatScore === 'function')
      ? getTrackHeatScore({ neteaseCmt: cmt, biliPlay: play, neteaseFav: fav }) : 0;
    return { t, cmt, play, fav, heat };
  }).sort((x, y) => y.heat - x.heat);

  document.getElementById('drawerBody').innerHTML = `
    <div class="drawer-row drawer-row-head" style="font-weight:700;color:var(--text-tertiary);font-size:11px;">
      <span class="dr-no">#</span><span class="dr-name">曲名</span><span class="dr-fav">红心</span><span class="dr-cmt">评论</span><span class="dr-play">B站播放</span><span></span><span class="dr-heat">热度</span><span></span>
    </div>` + rows.map((r, i) => {
    const has = r.heat > 0;
    return `
    <div class="drawer-row ${has ? '' : 'no-data'}">
      <span class="dr-no">${i + 1}</span>
      <span class="dr-name" title="${r.t.name}">${r.t.name}</span>
      <span class="dr-fav" title="${r.fav !== null ? '网易云红心/收藏数（客户端 UI 显示值）' : '该曲目未核实到红心数，诚实留空'}">${r.fav !== null ? r.fav : '—'}</span>
      <span class="dr-cmt" title="${r.cmt !== null ? '网易云评论总数（2026-11-04 实测）' : '该曲目暂无评论实测'}">${r.cmt !== null ? fmtNum(r.cmt) : '—'}</span>
      <span class="dr-play" title="${r.play !== null ? 'B站「原神+曲名」最相关视频播放量' : '该曲目暂无B站相关视频播放实测'}">${r.play !== null ? fmtCN(r.play) : '—'}</span>
      <div class="dr-bar"><div class="dr-fill" style="width:${r.heat}%;background:${color};"></div></div>
      <span class="dr-heat" style="color:${color};">${r.heat ? r.heat.toFixed(0) : '—'}</span>
      <div class="dr-links">
        <a href="${r.t.neteaseUrl || a.neteaseUrl || '#'}" target="_blank" title="网易云" style="color:#FE2C55;text-decoration:none;">
          <img src="assets/img/items/UI_ItemIcon_112001.png" style="width:12px;height:12px;vertical-align:-2px;" onerror="this.style.display='none'"/>
        </a>
        <a href="${r.t.bilibiliUrl || a.bilibiliUrl || '#'}" target="_blank" title="B站" style="color:#FB7299;text-decoration:none;">
          <img src="assets/img/deco/UI_NameCardIcon_0.png" style="width:12px;height:12px;vertical-align:-2px;" onerror="this.style.display='none'"/>
        </a>
      </div>
    </div>`;
  }).join('') + `
    <div class="drawer-foot">
      <a href="${a.neteaseUrl || '#'}" target="_blank" class="foot-btn foot-nc">网易云专辑直达</a>
      <a href="${a.bilibiliUrl || '#'}" target="_blank" class="foot-btn foot-bili">B站专辑相关</a>
    </div>`;

  document.getElementById('drawerMask').classList.add('show');
  const drawer = document.getElementById('trackDrawer');
  drawer.classList.add('show');
  drawer.setAttribute('aria-hidden', 'false');
  // 锁定背景滚动，聚焦关闭按钮便于键盘操作
  document.body.style.overflow = 'hidden';
  document.getElementById('drawerBody').scrollTop = 0;
  document.getElementById('drawerClose').focus({ preventScroll: true });
}

function closeDrawer() {
  document.getElementById('drawerMask').classList.remove('show');
  const drawer = document.getElementById('trackDrawer');
  drawer.classList.remove('show');
  drawer.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  if (drawerLastFocus && drawerLastFocus.isConnected) {
    try { drawerLastFocus.focus({ preventScroll: true }); } catch (e) { /* 忽略 */ }
  }
  drawerLastFocus = null;
}

/* ==================== 通用小工具 ==================== */
/* 专辑封面：本地缓存于 assets/img/album/{网易云专辑ID}.jpg（经 /api/v1/album 校验名称后下载） */
function albumCoverSrc(a) {
  return (a && a.neteaseAlbumId) ? 'assets/img/album/' + a.neteaseAlbumId + '.jpg' : null;
}
function albumCoverThumb(a, size, va) {
  const src = albumCoverSrc(a);
  if (!src) return '';
  return `<img src="${src}" alt="${a.name} 封面" loading="lazy" onerror="this.style.display='none'" style="width:${size}px;height:${size}px;border-radius:4px;object-fit:cover;vertical-align:${va || -4}px;margin-right:5px;border:1px solid var(--border);flex:0 0 ${size}px;"/>`;
}
function fmtNum(n) {
  if (typeof n !== 'number' || isNaN(n)) return '—';
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万';
  return String(Math.round(n * 10) / 10);
}
function fmtCN(n) {
  if (typeof n !== 'number' || isNaN(n)) return '—';
  if (n >= 100000000) return (n / 100000000).toFixed(1).replace(/\.0$/, '') + '亿';
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万';
  return n.toLocaleString();
}
