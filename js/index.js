function renderRankLists() {
  // 仅纳入有官方角色视频实测数据的角色
  const validChars = CHARACTERS.filter(c => typeof c.pv === 'number' && typeof c.fav === 'number');
  const pvRank = validChars.slice().sort((a, b) => b.pv - a.pv).slice(0, 6);
  const musicRank = validChars.slice().sort((a, b) => b.fav - a.fav).slice(0, 6);

  const pvList = document.getElementById('pvRankList');
  const musicList = document.getElementById('musicRankList');

  pvList.innerHTML = pvRank.map((c, i) => `
    <div class="rank-item" onclick="window.location.href='character-detail.html?name=${encodeURIComponent(c.name)}'">
      <div class="rank-num ${i < 3 ? 'top top' + (i + 1) : ''}">${i + 1}</div>
      <div class="rank-name">${c.name} <span style="color:var(--text-tertiary);font-size:11px;">· ${rName(c.region)}</span></div>
      <div class="rank-value">${fmt(c.pv * 10000)}</div>
    </div>
  `).join('');

  musicList.innerHTML = musicRank.map((c, i) => `
    <div class="rank-item" onclick="window.location.href='character-detail.html?name=${encodeURIComponent(c.name)}'">
      <div class="rank-num ${i < 3 ? 'top top' + (i + 1) : ''}">${i + 1}</div>
      <div class="rank-name">${c.name} <span style="color:var(--text-tertiary);font-size:11px;">· ${rName(c.region)}</span></div>
      <div class="rank-value">${fmt(c.fav * 1000)}</div>
    </div>
  `).join('');

  // ---- 榜单读数：n、第一名占比、两榜重合度（全样本动态计算） ----
  const pvSorted = validChars.slice().sort((a, b) => b.pv - a.pv);
  const favSorted = validChars.slice().sort((a, b) => b.fav - a.fav);
  const pvTop10 = pvSorted.slice(0, 10);
  const favTop10 = favSorted.slice(0, 10);
  const overlap10 = pvTop10.filter(c => favTop10.includes(c)).length;
  const r = (typeof statPearson === 'function')
    ? statPearson(validChars.map(c => c.pv), validChars.map(c => c.fav)) : null;
  const noteEl = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };

  noteEl('pvRankNote',
    `<strong>读数：</strong>样本 n = ${validChars.length} 名有官方角色视频的角色。` +
    `第 1 名 ${pvSorted[0].name}（${fmt(pvSorted[0].pv * 10000)}）占全部播放的 ${(pvSorted[0].pv / pvSorted.reduce((s, c) => s + c.pv, 0) * 100).toFixed(1)}%，` +
    `第 6 名仅为第 1 名的 ${(pvRank[5].pv / pvRank[0].pv * 100).toFixed(1)}%——头部集中是角色级数据的普遍形态。`);
  noteEl('musicRankNote',
    `<strong>读数：</strong>播放榜与收藏榜 TOP10 重合 <strong>${overlap10}/10</strong>` +
    `${r !== null ? `（Pearson r = ${r.toFixed(3)}）` : ''}，两个绝对值榜单给的是同一类信息：曝光规模。` +
    `要区分角色本身的互动效率，需看角色音乐页的"单位播放转化率"榜。`);
}

/* ==================== 全局数据画像 ==================== */
function renderHomeConclusions() {
  const el = document.getElementById('homeConclusions');
  if (!el) return;

  const valid = CHARACTERS.filter(c => typeof c.pv === 'number' && typeof c.fav === 'number' && typeof c.danmaku === 'number');
  const pvs = valid.map(c => c.pv);
  const totalPv = pvs.reduce((s, v) => s + v, 0);
  const med = statMedian(pvs);
  const mean = statMean(pvs);
  const headN = Math.max(1, Math.round(pvs.length * 0.1));
  const headShare = totalPv > 0
    ? [...pvs].sort((a, b) => b - a).slice(0, headN).reduce((s, v) => s + v, 0) / totalPv * 100 : null;
  const r = statPearson(valid.map(c => c.pv), valid.map(c => c.fav));

  // 曲目级（不同源，仅作规模对照）
  const cmts = typeof TRACK_REAL !== 'undefined'
    ? Object.values(TRACK_REAL).map(t => t.neteaseCmt).filter(v => typeof v === 'number') : [];
  const cmtMed = cmts.length ? statMedian(cmts) : null;
  const cmtTop = cmts.length ? Math.max(...cmts) : null;
  const favTracks = (typeof TRACK_REAL !== 'undefined')
    ? Object.values(TRACK_REAL).filter(t => t && typeof t.neteaseFav === 'string').length : 0;

  el.innerHTML = [
    ['角色级：右偏分布，头部集中',
      `${valid.length} 名有官方角色视频的角色总播放 <em>${(totalPv / 10000).toFixed(2)} 亿</em>；` +
      `播放中位数 <em>${fmt(med * 10000)}</em>、均值 ${fmt(mean * 10000)}，均值被头部拉高（右偏），` +
      `播放最高的 10% 角色占 <em>${headShare === null ? '—' : headShare.toFixed(1)}%</em>。跨角色比较应以中位数与百分位为准，均值只反映总量。`],
    ['角色级：播放与收藏高度同步',
      `同一支官方角色视频内，播放与收藏的 Pearson <em>r = ${r === null ? '—' : r.toFixed(3)}</em>` +
      `${r === null ? '' : `（r² = ${(r * r * 100).toFixed(1)}%）`}` +
      `，两者同源同向，收藏榜基本是播放榜的复写；相关不等于因果，曝光规模之外的因素本数据无法识别。`],
    ['曲目级：长尾更长，两套指标不可换算',
      `${favTracks} 首曲目有网易云红心实测、${cmts.length} 首有评论数据：评论中位数 <em>${cmtMed === null ? '—' : fmt(cmtMed)}</em>、` +
      `最高 ${cmtTop === null ? '—' : fmt(cmtTop)}（约为中位数的 ${cmtMed > 0 ? (cmtTop / cmtMed).toFixed(0) : '—'} 倍）。` +
      `曲目级与角色级指标不同源、不同样本，<strong>不可相加或换算</strong>，各自分析见专辑页与洞察页。`]
  ].map(([t, b], i) => `
    <li class="an-concl-item">
      <span class="cc-idx">${i + 1}</span>
      <span class="cc-body"><span class="cc-title">${t}</span>${b}</span>
    </li>`).join('');
}

function initSearch() {
  const search = document.getElementById('mapSearch');
  const input = document.getElementById('searchInput');

  // 搜索框始终位于操作栏中，保持可用状态
  search.classList.add('show');

  function doSearch() {
    const query = input.value.trim();
    if (!query) return;

    const char = CHARACTERS.find(c => c.name.includes(query) || c.name.toLowerCase().includes(query.toLowerCase()));
    if (char) {
      window.location.href = `character-detail.html?name=${encodeURIComponent(char.name)}`;
    }
  }

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') doSearch();
  });
  document.getElementById('searchBtn').addEventListener('click', doSearch);
}

function initMapLoading() {
  const loadingEl = document.getElementById('mapLoading');
  if (loadingEl) {
    // 地图有自己的加载隐藏逻辑（map.js 中），这里作为兜底
    setTimeout(() => {
      loadingEl.classList.add('hidden');
    }, 8000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // 统计数据
  const totalPv = CHARACTERS.reduce((s, c) => s + (c.pv || 0), 0);
  // 角色级指标仅来自 B站「原神」官方角色视频（无官方角色视频的角色计 0）
  const totalFav = CHARACTERS.reduce((s, c) => s + (c.fav || 0), 0);
  const totalDanmaku = CHARACTERS.reduce((s, c) => s + (c.danmaku || 0), 0);

  const statEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  // 总量级数值：≥1亿 改用「亿」单位，比"58696.7万"直观
  const fmtTotal = n => n >= 100000000 ? (n / 100000000).toFixed(2).replace(/\.?0+$/, '') + '亿' : fmt(n);
  statEl('statPv', fmtTotal(totalPv * 10000));
  statEl('statFav', fmtTotal(totalFav * 1000));
  statEl('statCmt', fmtTotal(totalDanmaku * 1000));
  statEl('statChars', CHARACTERS.length);
  statEl('statRegions', REGIONS.length);
  // 音乐曲目统计口径与 insight.js 一致：使用官方专辑曲目总数
  statEl('statTracks', typeof ALBUMS !== 'undefined' ? ALBUMS.reduce((s, a) => s + (a.trackCount || 0), 0) : STORY_TRACKS.length + Object.values(REGION_TRACKS).flat().length);
  // 红心数实测曲目数：TRACK_REAL 中 neteaseFav 有客户端 UI 显示值的曲目（2026-11-07 实测）
  statEl('statTrackFav', typeof TRACK_REAL !== 'undefined'
    ? Object.values(TRACK_REAL).filter(r => r && typeof r.neteaseFav === 'string').length
    : '—');

  renderRankLists();
  renderHomeConclusions();
  initSearch();
  initMapLoading();
});