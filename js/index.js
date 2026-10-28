function renderRankLists() {
  const pvRank = [...CHARACTERS].sort((a, b) => b.pv - a.pv).slice(0, 6);
  const musicRank = [...CHARACTERS].sort((a, b) => (b.netease + b.qq) - (a.netease + a.qq)).slice(0, 6);

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
      <div class="rank-value">${fmt((c.netease + c.qq) * 1000)}</div>
    </div>
  `).join('');
}

function initRegionTabs() {
  const tabs = document.querySelectorAll('.region-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const region = tab.dataset.region;
      // 「全大陆」按钮带 data-region="all"，交由下方 selectRegion（map.js 内部按 'all' 处理）；
      // 只有「全部地图」视图按钮没有 data-region，这里直接跳过
      if (!region) return;
      // 地图飞行和详情面板更新由 map.js 中的 selectRegion 统一处理
      // selectRegion 内部会调用 flyToRegion / fitToMondstadt
      if (typeof window.selectRegion === 'function') {
        window.selectRegion(region);
      }
    });
  });
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
  const totalPv = CHARACTERS.reduce((s, c) => s + c.pv, 0);
  const totalNetease = CHARACTERS.reduce((s, c) => s + c.netease, 0);
  const totalQQ = CHARACTERS.reduce((s, c) => s + c.qq, 0);
  const totalCmt = CHARACTERS.reduce((s, c) => s + c.cmt, 0);
  // 音乐总收藏：统一使用角色数据中的 netease + qq 字段，覆盖全部角色
  const totalFav = CHARACTERS.reduce((s, c) => s + c.netease + c.qq, 0);

  const statEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  statEl('statPv', fmt(totalPv * 10000));
  statEl('statFav', fmt(totalFav * 1000));
  statEl('statCmt', fmt(totalCmt * 1000));
  statEl('statChars', CHARACTERS.length);
  statEl('statRegions', REGIONS.length);
  // 音乐曲目统计口径与 insight.js 一致：使用官方专辑曲目总数
  statEl('statTracks', typeof ALBUMS !== 'undefined' ? ALBUMS.reduce((s, a) => s + (a.trackCount || 0), 0) : STORY_TRACKS.length + Object.values(REGION_TRACKS).flat().length);

  renderRankLists();
  initRegionTabs();
  initSearch();
  initMapLoading();
});