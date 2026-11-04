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
  const total = ALBUMS.length;
  const totalTracks = ALBUMS.reduce((s, a) => s + a.trackCount, 0);
  const allReal = ALBUMS.flatMap(a => a.tracks.map(t => ({ album: a, track: t }))).filter(x => {
    const r = TRACK_REAL && x.track.ncmId ? TRACK_REAL[x.track.ncmId] : null;
    return r && (typeof r.neteaseCmt === 'number' || typeof r.biliPlay === 'number');
  });
  const realTracks = allReal.length;
  const coverage = totalTracks ? (realTracks / totalTracks * 100).toFixed(1) : '0.0';
  const cmtSum = allReal.reduce((s, x) => s + ((TRACK_REAL[x.track.ncmId]?.neteaseCmt) || 0), 0);
  const playSum = allReal.reduce((s, x) => s + ((TRACK_REAL[x.track.ncmId]?.biliPlay) || 0), 0);
  const albumsWithData = ALBUMS.filter(a => a.tracks.some(t => {
    const r = TRACK_REAL && t.ncmId ? TRACK_REAL[t.ncmId] : null;
    return r && (typeof r.neteaseCmt === 'number' || typeof r.biliPlay === 'number');
  })).length;
  const latest = ALBUMS.reduce((m, a) => parseFloat(a.version) > parseFloat(m) ? a.version : m, '0');

  const cards = [
    { v: total,          l: '官方专辑总数',      c: '#8B5CF6' },
    { v: fmtNum(totalTracks), l: '收录曲目总数（官方）', c: '#F59E0B' },
    { v: realTracks,     l: '有实测数据的曲目',    c: '#10B981' },
    { v: coverage + '%', l: '实测覆盖率',         c: '#3B82F6' },
    { v: fmtCN(cmtSum),  l: '网易云评论合计',      c: '#FE2C55' },
    { v: fmtCN(playSum), l: 'B站播放合计',         c: '#FB7299' },
    { v: 'v' + latest,   l: '最新版本',           c: '#F59E0B' },
    { v: albumsWithData, l: '有实测专辑数',        c: '#6366F1' },
  ];
  document.getElementById('albumStats').innerHTML = cards.map(c => `
    <div class="album-stat">
      <div class="stat-icon" style="background:${c.c}22;box-shadow:0 0 14px ${c.c}33;">
        <span style="color:${c.c};font-size:20px;font-weight:700;">${cards.indexOf(c) + 1}</span>
      </div>
      <div class="stat-value" style="color:${c.c};">${c.v}</div>
      <div class="stat-label">${c.l}</div>
    </div>`).join('');

  // 分析摘要
  const cmtVals = allReal.map(x => TRACK_REAL[x.track.ncmId]?.neteaseCmt).filter(v => typeof v === 'number');
  const playVals = allReal.map(x => TRACK_REAL[x.track.ncmId]?.biliPlay).filter(v => typeof v === 'number');
  const med = cmtVals.length ? statMedian(cmtVals) : 0;
  const q3 = cmtVals.length ? statQ3(cmtVals) : 0;
  const outliers = cmtVals.filter(v => v > q3 + 1.5 * (q3 - med)).length;
  document.getElementById('albumAnalysis').innerHTML =
    `<strong>分析摘要：</strong>43 张官方专辑共收录 ${fmtNum(totalTracks)} 首曲目，其中 ${realTracks} 首具备实测数据（覆盖率 ${coverage}%）；网易云评论合计 ${fmtCN(cmtSum)}，B站相关视频播放合计 ${fmtCN(playSum)}。` +
    `评论中位数 ${med ? fmtNum(med) : '—'}、Q3 ${q3 ? fmtNum(q3) : '—'}，Tukey 规则异常值 ${outliers} 首，说明<strong style="color:var(--gold-light);">右偏严重、少数曲目贡献绝大多数互动</strong>。` +
    `红心收藏总数字段因网易云官方已下架而留空，不做任何估算。`;
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
    if (cmt === null && play === null) return;
    const heat = (typeof getTrackHeatScore === 'function')
      ? getTrackHeatScore({ neteaseCmt: cmt, biliPlay: play }) : 0;
    rows.push({ album: a, track: t, cmt, play, heat });
  }));

  let sorted, maxV, unit, label, color;
  if (rankMetric === 'heat') {
    sorted = rows.sort((x, y) => y.heat - x.heat).slice(0, 20);
    maxV = 100; unit = ''; label = '综合热度'; color = '#F59E0B';
  } else if (rankMetric === 'cmt') {
    sorted = rows.filter(r => r.cmt !== null).sort((x, y) => y.cmt - x.cmt).slice(0, 20);
    maxV = sorted[0]?.cmt || 1; unit = ''; label = '网易云评论'; color = '#FE2C55';
  } else {
    sorted = rows.filter(r => r.play !== null).sort((x, y) => y.play - x.play).slice(0, 20);
    maxV = sorted[0]?.play || 1; unit = ''; label = 'B站播放'; color = '#FB7299';
  }

  const el = document.getElementById('rankList');
  if (!sorted.length) { el.innerHTML = `<div class="empty-hint">当前筛选条件下无已核实曲目</div>`; return; }

  el.innerHTML = sorted.map((r, i) => {
    const val = rankMetric === 'heat' ? r.heat : (rankMetric === 'cmt' ? r.cmt : r.play);
    const pct = Math.max(2, (val / maxV) * 100);
    const albumName = r.album.name;
    const fmtV = rankMetric === 'heat' ? val.toFixed(1) : fmtCN(val);
    const cmtTag = r.cmt !== null ? `<span style="color:#FE2C55;font-size:10px;"><img src="assets/img/items/UI_ItemIcon_112001.png" style="width:10px;height:10px;vertical-align:-1px;" onerror="this.style.display='none'"/>${fmtNum(r.cmt)}</span>` : '';
    const playTag = r.play !== null ? `<span style="color:#FB7299;font-size:10px;"><img src="assets/img/deco/UI_NameCardIcon_0.png" style="width:10px;height:10px;vertical-align:-1px;" onerror="this.style.display='none'"/>${fmtCN(r.play)}</span>` : '';
    return `
    <div class="rank-row" data-album="${encodeURIComponent(albumName)}">
      <span class="rank-no ${i < 3 ? 'top3' : ''}">${i + 1}</span>
      <a class="rank-name" href="${r.track.neteaseUrl || r.album.neteaseUrl}" target="_blank" title="点击在网易云搜索">${r.track.name}</a>
      <span class="rank-album" title="${albumName}">${albumName}</span>
      <div class="rank-bar">
        <div class="rank-fill" style="width:${pct}%;background:linear-gradient(90deg,${color}88,${color});"></div>
      </div>
      <span class="rank-val" style="color:${color};">${fmtV}</span>
      <span class="rank-meta">${cmtTag} ${playTag}</span>
    </div>`;
  }).join('');
}

/* ==================== 专辑网格 ==================== */
function renderAlbumGrid() {
  const grid = document.getElementById('albumGrid');
  const albums = filteredAlbums();
  grid.innerHTML = albums.map(a => {
    const region = REGIONS ? REGIONS.find(r => r.id === a.region) : null;
    const color = region?.color || '#8B5CF6';
    const realTracks = a.tracks.filter(t => TRACK_REAL && t.ncmId &&
      (typeof TRACK_REAL[t.ncmId]?.neteaseCmt === 'number' || typeof TRACK_REAL[t.ncmId]?.biliPlay === 'number'));
    const withHeat = realTracks.map(t => ({
      t, h: (typeof getTrackHeatScore === 'function')
        ? getTrackHeatScore({ neteaseCmt: TRACK_REAL[t.ncmId].neteaseCmt, biliPlay: TRACK_REAL[t.ncmId].biliPlay }) : 0
    })).filter(x => x.h > 0).sort((x, y) => y.h - x.h);
    const top = withHeat.slice(0, 2);

    return `
    <div class="album-mini" data-idx="${ALBUMS.indexOf(a)}">
      <div class="album-mini-cover" style="background:linear-gradient(135deg,${color},${color}55);">
        <span class="album-mini-version">v${a.version}</span>
        <span class="album-mini-type">${
          ({ scene: '场景', character: '角色', ep: 'EP', version: '合集' }[a.type] || '其他')
        }</span>
      </div>
      <div class="album-mini-body">
        <div class="album-mini-title">${a.name}</div>
        <div class="album-mini-meta">
          <span>${a.releaseDate}</span>
          <span style="color:${color};">${region?.name || '—'}</span>
          <span>${a.trackCount} 曲</span>
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
}

/* ==================== 抽屉 ==================== */
function openDrawer(idx) {
  const a = ALBUMS[idx];
  const region = REGIONS ? REGIONS.find(r => r.id === a.region) : null;
  const color = region?.color || '#8B5CF6';

  document.getElementById('drawerTitle').textContent = a.name;
  document.getElementById('drawerSub').innerHTML =
    `${a.releaseDate} · v${a.version} · ${a.trackCount} 曲 · <span style="color:${color};">${region?.name || '—'}</span> · ${a.desc || ''}`;

  const rows = a.tracks.map(t => {
    const r = TRACK_REAL && t.ncmId ? TRACK_REAL[t.ncmId] : null;
    const cmt = r && typeof r.neteaseCmt === 'number' ? r.neteaseCmt : null;
    const play = r && typeof r.biliPlay === 'number' ? r.biliPlay : null;
    const heat = (cmt !== null || play !== null) && (typeof getTrackHeatScore === 'function')
      ? getTrackHeatScore({ neteaseCmt: cmt, biliPlay: play }) : 0;
    return { t, cmt, play, heat };
  }).sort((x, y) => y.heat - x.heat);

  document.getElementById('drawerBody').innerHTML = rows.map((r, i) => {
    const has = r.heat > 0;
    return `
    <div class="drawer-row ${has ? '' : 'no-data'}">
      <span class="dr-no">${i + 1}</span>
      <span class="dr-name">${r.t.name}</span>
      <span class="dr-cmt">${r.cmt !== null ? fmtNum(r.cmt) : '—'}</span>
      <span class="dr-play">${r.play !== null ? fmtCN(r.play) : '—'}</span>
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
  document.getElementById('trackDrawer').classList.add('show');
  document.getElementById('trackDrawer').setAttribute('aria-hidden', 'false');
}

function closeDrawer() {
  document.getElementById('drawerMask').classList.remove('show');
  document.getElementById('trackDrawer').classList.remove('show');
  document.getElementById('trackDrawer').setAttribute('aria-hidden', 'true');
}

/* ==================== 通用小工具 ==================== */
function fmtNum(n) {
  if (typeof n !== 'number' || isNaN(n)) return '—';
  return n >= 10000 ? (n / 10000).toFixed(1).replace(/\.0$/, '') + '万' : String(n);
}
function fmtCN(n) {
  if (typeof n !== 'number' || isNaN(n)) return '—';
  if (n >= 100000000) return (n / 100000000).toFixed(1).replace(/\.0$/, '') + '亿';
  if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + '万';
  return n.toLocaleString();
}
function statMedian(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function statQ3(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length * 0.75)];
}
