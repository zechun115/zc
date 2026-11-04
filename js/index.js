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
  statEl('statPv', fmt(totalPv * 10000));
  statEl('statFav', fmt(totalFav * 1000));
  statEl('statCmt', fmt(totalDanmaku * 1000));
  statEl('statChars', CHARACTERS.length);
  statEl('statRegions', REGIONS.length);
  // 音乐曲目统计口径与 insight.js 一致：使用官方专辑曲目总数
  statEl('statTracks', typeof ALBUMS !== 'undefined' ? ALBUMS.reduce((s, a) => s + (a.trackCount || 0), 0) : STORY_TRACKS.length + Object.values(REGION_TRACKS).flat().length);

  renderRankLists();
  initSearch();
  initMapLoading();
});