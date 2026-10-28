// ==================== 音乐专辑页 · 严格真实性版 ====================
let albumFilter = 'all';

(function () {
  renderStats();
  renderAlbumGrid();

  document.querySelectorAll('#albumFilter .chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#albumFilter .chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      albumFilter = btn.dataset.f;
      renderAlbumGrid();
    });
  });
})();

function renderStats() {
  const total = ALBUMS.length;
  const totalTracks = ALBUMS.reduce((s, a) => s + a.trackCount, 0);          // 官方专辑总曲目数（真实元数据）
  const verifiedTracks = ALBUMS.flatMap(a => a.tracks).length;                // 我们已核实公开可搜的曲目数（真实统计）
  const coverage = ((verifiedTracks / totalTracks) * 100).toFixed(1);         // 覆盖比例
  const latest = ALBUMS.reduce((m, a) => parseFloat(a.version) > parseFloat(m) ? a.version : m, '0');
  const sceneAlbums = ALBUMS.filter(a => a.type === 'scene').length;
  const charAlbums = ALBUMS.filter(a => a.type === 'character').length;
  const epAlbums = ALBUMS.filter(a => a.type === 'ep').length;
  const versionAlbums = ALBUMS.filter(a => a.type === 'version').length;
  const albumsWithData = ALBUMS.filter(a => a.tracks.length > 0).length;       // 已有核实曲目的专辑数
  const albumsOnlyMeta = total - albumsWithData;                                // 仅保留元数据的专辑数（宁空勿假）

  document.getElementById('albumStats').innerHTML = `
    <div class="album-stat">
      <div class="stat-icon" style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);display:flex;align-items:center;justify-content:center;">
        <img src="assets/img/items/UI_ItemIcon_112001.png" style="width:20px;height:20px;object-fit:contain;" onerror="this.style.display='none'"/>
      </div>
      <div class="stat-value">${total}</div>
      <div class="stat-label">官方专辑总数</div>
    </div>
    <div class="album-stat">
      <div class="stat-icon" style="background:linear-gradient(135deg, #f093fb 0%, #f5576c 100%);display:flex;align-items:center;justify-content:center;">
        <img src="assets/img/items/UI_ItemIcon_112002.png" style="width:20px;height:20px;object-fit:contain;" onerror="this.style.display='none'"/>
      </div>
      <div class="stat-value">${totalTracks}</div>
      <div class="stat-label">收录曲目总数（官方）</div>
    </div>
    <div class="album-stat">
      <div class="stat-icon" style="background:linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);display:flex;align-items:center;justify-content:center;">
        <img src="assets/img/deco/UI_ItemIcon_210.png" style="width:20px;height:20px;object-fit:contain;" onerror="this.style.display='none'"/>
      </div>
      <div class="stat-value">${verifiedTracks}</div>
      <div class="stat-label">已核实公开曲目</div>
    </div>
    <div class="album-stat">
      <div class="stat-icon" style="background:linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);display:flex;align-items:center;justify-content:center;">
        <img src="assets/img/deco/UI_ItemIcon_202.png" style="width:20px;height:20px;object-fit:contain;" onerror="this.style.display='none'"/>
      </div>
      <div class="stat-value">${coverage}%</div>
      <div class="stat-label">核实覆盖率</div>
    </div>
    <div class="album-stat">
      <div class="stat-icon" style="background:linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);display:flex;align-items:center;justify-content:center;">
        <img src="assets/img/deco/UI_ItemIcon_203.png" style="width:20px;height:20px;object-fit:contain;" onerror="this.style.display='none'"/>
      </div>
      <div class="stat-value">v${latest}</div>
      <div class="stat-label">最新版本</div>
    </div>
    <div class="album-stat">
      <div class="stat-icon" style="background:linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);display:flex;align-items:center;justify-content:center;">
        <img src="assets/img/icons/秘境.png" style="width:20px;height:20px;object-fit:contain;" onerror="this.style.display='none'"/>
      </div>
      <div class="stat-value">${sceneAlbums}</div>
      <div class="stat-label">场景专辑</div>
    </div>
    <div class="album-stat">
      <div class="stat-icon" style="background:linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);display:flex;align-items:center;justify-content:center;">
        <img src="assets/img/deco/UI_ItemIcon_201.png" style="width:20px;height:20px;object-fit:contain;" onerror="this.style.display='none'"/>
      </div>
      <div class="stat-value">${charAlbums}</div>
      <div class="stat-label">角色专辑</div>
    </div>
    <div class="album-stat">
      <div class="stat-icon" style="background:linear-gradient(135deg, #f6d365 0%, #fda085 100%);display:flex;align-items:center;justify-content:center;">
        <img src="assets/img/deco/UI_ItemIcon_210.png" style="width:20px;height:20px;object-fit:contain;" onerror="this.style.display='none'"/>
      </div>
      <div class="stat-value">${epAlbums}</div>
      <div class="stat-label">EP专辑</div>
    </div>
    <div class="album-stat">
      <div class="stat-icon" style="background:linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%);display:flex;align-items:center;justify-content:center;">
        <img src="assets/img/deco/UI_ItemIcon_211.png" style="width:20px;height:20px;object-fit:contain;" onerror="this.style.display='none'"/>
      </div>
      <div class="stat-value">${versionAlbums}</div>
      <div class="stat-label">版本合集</div>
    </div>
    <div class="album-stat">
      <div class="stat-icon" style="background:linear-gradient(135deg, #F59E0B 0%, #B45309 100%);display:flex;align-items:center;justify-content:center;">
        <img src="assets/img/deco/UI_ItemIcon_211.png" style="width:20px;height:20px;object-fit:contain;" onerror="this.style.display='none'"/>
      </div>
      <div class="stat-value">${albumsOnlyMeta}</div>
      <div class="stat-label">仅元数据专辑（宁空勿假）</div>
    </div>
  `;
}

function renderAlbumGrid() {
  const grid = document.getElementById('albumGrid');
  if (!grid) return;

  const list = ALBUMS.filter(a => {
    if (albumFilter === 'all') return true;
    if (albumFilter === 'scene' || albumFilter === 'character' || albumFilter === 'ep' || albumFilter === 'version') return a.type === albumFilter;
    return a.region === albumFilter;
  });

  grid.innerHTML = list.map(a => {
    const region = a.region ? REGIONS.find(r => r.id === a.region) : null;
    const color = region ? region.color : '#8B5CF6';

    // 分离「有热度」与「无热度」曲目：结合TRACK_PLATFORM_DATA和ALBUMS原始数据
    const tracksWithData = a.tracks.map(t => {
      const fullData = (typeof getTrackFullData === 'function') 
        ? getTrackFullData(a, t) 
        : { neteaseFav: t.popularity || 0, neteaseCmt: 0, qqPlays: 0, biliPlays: 0, dataSource: t.source || 'estimated' };
      // realData:false 的曲目不做任何估算，避免把地区均值当成真实热度
      if (t.realData === false) {
        fullData.neteaseFav = 0; fullData.neteaseCmt = 0;
        fullData.qqPlays = 0; fullData.biliPlays = 0;
        fullData.popularity = 0; fullData.dataSource = 'unverified';
      }
      if (typeof getTrackHeatScore === 'function') {
        fullData.heatScore = getTrackHeatScore(fullData);
      } else {
        fullData.heatScore = t.popularity || 0;
      }
      fullData._raw = t;
      return fullData;
    });
    
    const withPop = tracksWithData.filter(t => t.heatScore > 0)
                            .sort((x, y) => y.heatScore - x.heatScore);
    const withoutPop = tracksWithData.filter(t => t.heatScore === 0);

    // 选出热度最高的曲目（用于TOP标注）
    const topTracks = withPop.slice(0, Math.min(3, withPop.length));

    // 展示列表：优先展示热度最高的 TOP 曲目，不足则用无热度曲目补齐
    const PREVIEW = Math.max(topTracks.length, 2);
    const previewList = [...topTracks, ...withoutPop].slice(0, PREVIEW);
    const hasMore = a.tracks.length > PREVIEW;

    // 核心曲目区：notice（平台无法核实的热度说明）与已核实曲目列表可以并存
    let tracksBlock = '';
    if (a.notice) {
      tracksBlock += `
        <div style="padding:14px 12px;border-radius:10px;border:1px dashed rgba(245,158,11,0.45);background:linear-gradient(135deg,rgba(245,158,11,0.05),rgba(245,158,11,0.02));margin-bottom:12px;">
          <div style="display:flex;align-items:flex-start;gap:8px;">
            <img src="assets/img/deco/UI_ItemIcon_204.png" style="width:16px;height:16px;flex-shrink:0;margin-top:1px;" onerror="this.style.display='none'"/>
            <div style="font-size:11.5px;line-height:1.75;color:var(--text-secondary);">${a.notice}</div>
          </div>
        </div>`;
    }
    if (previewList.length > 0) {
      const bars = previewList.map((td, idx) => {
        const t = td._raw;
        const displayName = t.name.length > 14 ? t.name.substring(0, 14) + '…' : t.name;
        const linkNetease = t.neteaseUrl || '#';
        const linkQQ = t.qqUrl || '#';
        const linkBili = t.bilibiliUrl || '#';
        const platformIcons = `
              <a href="${linkNetease}"  target="_blank" rel="noopener" title="网易云音乐直达"
                 style="color:#FE2C55;text-decoration:none;font-size:11px;" data-track="netease"><img src="assets/img/items/UI_ItemIcon_112001.png" style="width:11px;height:11px;vertical-align:-2px;" onerror="this.style.display='none'"/></a>
              <a href="${linkQQ}"       target="_blank" rel="noopener" title="QQ音乐直达"
                 style="color:#31A5E8;text-decoration:none;font-size:11px;" data-track="qq"><img src="assets/img/items/UI_ItemIcon_112002.png" style="width:11px;height:11px;vertical-align:-2px;" onerror="this.style.display='none'"/></a>
              <a href="${linkBili}"     target="_blank" rel="noopener" title="B站PV"
                 style="color:#FB7299;text-decoration:none;font-size:11px;" data-track="bili"><img src="assets/img/deco/UI_NameCardIcon_0.png" style="width:11px;height:11px;vertical-align:-2px;" onerror="this.style.display='none'"/></a>`;
        
        const hasHeat = td.heatScore > 0;
        const dataLabel = td.dataSource === 'netease_api' ? '✓实测' 
          : td.dataSource === 'region_data' ? '◈区域' 
          : td.dataSource === 'popularity_data' ? '★热度' 
          : td.dataSource === 'region_avg' ? '◇均估' 
          : td.dataSource === 'unverified' ? '未核实' 
          : '◇估算';
        // TOP 曲目标记（前 topTracks.length 首标为热门）
        const isTopTrack = idx < topTracks.length && hasHeat;
        // 曲目自身热度等级颜色
        const trackHeatColor = td.heatScore >= 75 ? '#EF4444' : td.heatScore >= 50 ? '#F59E0B' : td.heatScore >= 25 ? '#8B5CF6' : '#64748B';
        const topBadge = isTopTrack ? `<span style="display:inline-block;padding:1px 5px;border-radius:6px;font-size:8px;font-weight:700;background:${trackHeatColor}22;color:${trackHeatColor};margin-right:4px;vertical-align:middle;">TOP${idx + 1}</span>` : '';
        
        if (hasHeat) {
          const w = td.heatScore;
          // 格式化数字（输入单位为千，千→万除以10），避免浮点数精度问题
          const fmt = (n) => {
            if (typeof n !== 'number' || isNaN(n)) return '0';
            if (n >= 1000) return (n / 10).toFixed(1).replace(/\.0$/, '') + 'w';
            if (n >= 100) return Math.round(n) + 'k';
            if (n >= 10) return n.toFixed(1).replace(/\.0$/, '') + 'k';
            return n.toFixed(1).replace(/\.0$/, '') + 'k';
          };
          // qqPlays/biliPlays 口径为万，单独按万格式化
          const fmtWan = (n) => {
            if (typeof n !== 'number' || isNaN(n) || n <= 0) return '0万';
            const v = n >= 100 ? Math.round(n) : parseFloat(n.toFixed(1));
            return v + '万';
          };
          // 多平台指标显示
          const platformMetrics = [];
          if (td.neteaseFav > 0) platformMetrics.push(`<span style="color:#FE2C55;font-size:10px;"><img src="assets/img/items/UI_ItemIcon_112001.png" style="width:10px;height:10px;vertical-align:-1px;" onerror="this.style.display='none'"/>${fmt(td.neteaseFav)}</span>`);
          if (td.qqPlays > 0) platformMetrics.push(`<span style="color:#31A5E8;font-size:10px;"><img src="assets/img/items/UI_ItemIcon_112002.png" style="width:10px;height:10px;vertical-align:-1px;" onerror="this.style.display='none'"/>${fmtWan(td.qqPlays)}</span>`);
          if (td.biliPlays > 0) platformMetrics.push(`<span style="color:#FB7299;font-size:10px;"><img src="assets/img/deco/UI_NameCardIcon_0.png" style="width:10px;height:10px;vertical-align:-1px;" onerror="this.style.display='none'"/>${fmtWan(td.biliPlays)}</span>`);
          // 如果有 popularity 但无平台指标，显示综合热度值
          if (td.popularity > 0 && platformMetrics.length === 0) {
            platformMetrics.push(`<span style="color:var(--gold);font-size:10px;font-weight:600;">热度${td.popularity}</span>`);
          }
          // 热度等级标签
          const heatLabel = td.heatScore >= 75 ? '<img src="assets/img/deco/UI_ItemIcon_105.png" style="width:10px;height:10px;vertical-align:-1px;" onerror="this.style.display=\'none\'"/>现象级' : td.heatScore >= 50 ? '<img src="assets/img/deco/UI_ItemIcon_105.png" style="width:10px;height:10px;vertical-align:-1px;" onerror="this.style.display=\'none\'"/>高热度' : td.heatScore >= 25 ? '中等' : '常规';
          // tooltip 专用格式化，保留单位后缀，避免浮点数精度
          const fmtTip = (n, unit) => {
            if (typeof n !== 'number' || isNaN(n)) return '0' + unit;
            const v = n >= 100 ? Math.round(n) : parseFloat(n.toFixed(1));
            return v + unit;
          };
          
          return `
          <div class="mini-bar-row ${isTopTrack ? 'top-track' : ''}" title="曲目热度${td.heatScore}/100 (${heatLabel}) · 数据来源:${dataLabel} · 网易云${fmtTip(td.neteaseFav, 'k')} · QQ${fmtTip(td.qqPlays, 'w')} · B站${fmtTip(td.biliPlays, 'w')}${td.popularity > 0 ? ' · 综合热度:' + td.popularity : ''}">
            <div class="mini-bar-label" style="font-weight:${isTopTrack ? '600' : '500'};">
              ${topBadge}<a href="${linkNetease}" target="_blank" rel="noopener"
                 style="color:var(--text-primary);text-decoration:none;">${displayName}</a>
            </div>
            <div class="mini-bar-track" style="position:relative;">
              <div class="mini-bar-fill real" style="width:${w}%;background:linear-gradient(90deg,${trackHeatColor},${trackHeatColor}88);"></div>
              <span style="position:absolute;right:6px;top:50%;transform:translateY(-50%);font-size:10px;font-weight:700;color:${trackHeatColor};text-shadow:0 0 6px rgba(0,0,0,0.8);">${td.heatScore}</span>
            </div>
            <div class="mini-bar-val">
              <div>${platformMetrics.join('')}</div>
              <div>${platformIcons}</div>
            </div>
          </div>`;
        } else {
          return `
          <div class="mini-bar-row" title="官方专辑直达 · 暂无热度数据">
            <div class="mini-bar-label" style="font-weight:500;">
              <a href="${linkNetease}" target="_blank" rel="noopener"
                 style="color:var(--text-primary);text-decoration:none;">${displayName}</a>
            </div>
            <div class="mini-bar-track" style="background:transparent;justify-content:center;">
              <div style="font-size:10px;color:var(--text-tertiary);">官方曲库直达</div>
            </div>
            <div class="mini-bar-val">
              <div></div>
              <div>${platformIcons}</div>
            </div>
          </div>`;
        }
      }).join('');
      // 底部统计：超出预览数则引导至平台完整曲库
      const footerNote = hasMore
        ? `<a href="${a.neteaseUrl}" target="_blank" rel="noopener" style="color:${color};text-decoration:none;font-weight:600;">共 ${a.tracks.length} 首 · 查看完整曲库 →</a>`
        : `<span><span class="swatch" style="background:${color};"></span>已收录 ${a.tracks.length} 首（三平台可直接收听）</span>`;
      tracksBlock += `
        <div class="mini-bar-chart">${bars}</div>
        <div class="legend-row" style="margin-top:8px;">
          <span><span class="swatch" style="background:${color};"></span>
            <img src="assets/img/deco/UI_ItemIcon_210.png" style="width:11px;height:11px;vertical-align:-1px;margin-right:2px;" onerror="this.style.display='none'"/>${footerNote}
          </span>
        </div>
      `;
    } else if (!a.notice) {
      // 既没有 notice 也没有 tracks → 兜底提示（有 notice 时只保留 notice）
      tracksBlock = `
        <div style="padding:12px;border-radius:10px;border:1px dashed var(--border);background:var(--bg-elevated);margin-bottom:12px;text-align:center;font-size:12px;color:var(--text-tertiary);">
          该专辑暂无已核实公开曲目数据，请通过下方平台链接查看官方专辑。
        </div>`;
    }

    // 每张专辑底部统一的三平台跳转大按钮
    const platformLinks = `
      <div style="margin-top:10px;padding:10px 12px;border-top:1px solid var(--border);display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
        <span style="font-size:10.5px;color:var(--text-tertiary);margin-right:2px;">点击跳转 →</span>
        <a href="${a.neteaseUrl}" target="_blank" rel="noopener"
           style="display:inline-flex;align-items:center;gap:4px;padding:5px 9px;border-radius:7px;background:#FE2C5512;color:#FE2C55;font-size:11px;font-weight:600;text-decoration:none;flex:1;justify-content:center;min-width:90px;"
           title="在网易云音乐搜索官方专辑「${a.name}」">
          <img src="assets/img/items/UI_ItemIcon_112001.png" style="width:11px;height:11px;" onerror="this.style.display='none'"/>
          网易云
        </a>
        <a href="${a.qqUrl}" target="_blank" rel="noopener"
           style="display:inline-flex;align-items:center;gap:4px;padding:5px 9px;border-radius:7px;background:#31A5E812;color:#31A5E8;font-size:11px;font-weight:600;text-decoration:none;flex:1;justify-content:center;min-width:90px;"
           title="在QQ音乐搜索官方专辑「${a.name}」">
          <img src="assets/img/items/UI_ItemIcon_112002.png" style="width:11px;height:11px;" onerror="this.style.display='none'"/>
          QQ音乐
        </a>
        <a href="${a.bilibiliUrl}" target="_blank" rel="noopener"
           style="display:inline-flex;align-items:center;gap:4px;padding:5px 9px;border-radius:7px;background:#FB729912;color:#FB7299;font-size:11px;font-weight:600;text-decoration:none;flex:1;justify-content:center;min-width:90px;"
           title="在B站搜索「${a.name}」相关PV和演奏">
          <img src="assets/img/deco/UI_NameCardIcon_0.png" style="width:11px;height:11px;" onerror="this.style.display='none'"/>
          B站PV
        </a>
      </div>
    `;

    return `
      <div class="album-card" style="border:1px solid ${color}22;">
        <div class="album-cover" style="background:linear-gradient(135deg, ${color} 0%, ${color}99 50%, ${color}55 100%);">
          <div class="vinyl" style="--accent:${color};"></div>
          <span class="type-badge">${
            ({
              scene: ['assets/img/icons/秘境.png', '场景OST'],
              character: ['assets/img/deco/UI_ItemIcon_201.png', '角色OST'],
              ep: ['assets/img/deco/UI_ItemIcon_210.png', 'EP专辑'],
              version: ['assets/img/deco/UI_ItemIcon_211.png', '版本合集']
            }[a.type] || ['assets/img/deco/UI_ItemIcon_201.png', '角色OST'])
              .map((v, i) => i === 0
                ? `<img src="${v}" style="width:12px;height:12px;vertical-align:-2px;margin-right:3px;" onerror="this.style.display='none'"/>`
                : v).join('')
          }</span>
          <span class="version-badge">v${a.version}</span>
          <div class="cover-text-group">
            <div class="cover-title">${a.name}</div>
          </div>
        </div>
        <div class="album-body">
          <div class="album-header">
            <div class="album-meta">
              <span><img src="assets/img/deco/UI_ItemIcon_203.png" style="width:11px;height:11px;vertical-align:-1px;margin-right:3px;" onerror="this.style.display='none'"/> ${a.releaseDate}</span>
              <span><img src="assets/img/items/UI_ItemIcon_112001.png" style="width:11px;height:11px;vertical-align:-1px;margin-right:3px;" onerror="this.style.display='none'"/> ${a.trackCount} 曲</span>
              <span style="color:${color};font-weight:600;">${region ? region.name : '全角色合集'}</span>
            </div>
          </div>
          <div class="album-desc">${a.desc}</div>
          ${tracksBlock}
          ${platformLinks}
        </div>
      </div>
    `;
  }).join('');

  // 添加专辑数据导出（严格真实性版：每条都带三平台搜索URL + 验证方法）
  const albumCard = grid.closest('.card');
  if (albumCard && !albumCard.querySelector('.export-btn')) {
    const exportData = list.flatMap(a => {
      if (a.tracks.length === 0) {
        // 仅有元数据的专辑：仍然导出一行，明确标注 tracks=[] 原因 + notice
        return [{
          专辑: a.name,
          发行日期: a.releaseDate,
          官方总曲目数: a.trackCount,
          版本: 'v' + a.version,
          关联地区: a.region ? (REGIONS.find(r => r.id === a.region)?.name || a.region) : '全角色合集',
          曲目标题: '（仅展示已核实公开曲目）',
          热度popularity: '—',
          数据真实性: '该专辑曲目为氛围/过渡BGM，三平台搜索结果不唯一，宁空勿假。请点击右侧网易云/QQ音乐直达链接在官方平台查看完整曲目。',
          追溯链路: a.notice || '无法逐一核实 → 仅保留专辑元信息',
          网易云音乐专辑直达: a.neteaseUrl,
          QQ音乐专辑直达: a.qqUrl,
          B站专辑相关PV: a.bilibiliUrl,
          网易云曲目直达: '—',
          QQ音乐曲目直达: '—',
          B站曲目PV: '—',
          人工验证指引: a.notice || '点击上方三个平台链接直达官方专辑页面，在完整曲目列表中逐条核对。'
        }];
      }
      return a.tracks.map(t => ({
        专辑: a.name,
        发行日期: a.releaseDate,
        官方总曲目数: a.trackCount,
        版本: 'v' + a.version,
        关联地区: a.region ? (REGIONS.find(r => r.id === a.region)?.name || a.region) : '全角色合集',
        曲目标题: t.name,
        热度popularity: (t.popularity != null && !isNaN(t.popularity)) ? t.popularity : '—',
        数据真实性: '公开数据可追溯（网易云/QQ音乐官方专辑直达，逐首可点击收听）',
        追溯链路: t.source + ' → 网易云×0.4 + QQ×0.35 + B站PV×0.25 → ×1.2',
        网易云音乐专辑直达: a.neteaseUrl,
        QQ音乐专辑直达: a.qqUrl,
        B站专辑相关PV: a.bilibiliUrl,
        网易云曲目直达: t.neteaseUrl,
        QQ音乐曲目直达: t.qqUrl,
        B站曲目PV: t.bilibiliUrl,
        人工验证指引: t.verifyHint
      }));
    });
    const btn = document.createElement('button');
    btn.className = 'export-btn';
    btn.textContent = '导出数据（16列·含三平台链接·可追溯）';
    btn.setAttribute('aria-label', '导出专辑曲目数据，含网易云/QQ/B站三平台直达链接及人工验证指引');
    btn.addEventListener('click', () => window.exportData(exportData, '专辑曲目热度_严格真实性版_含三平台追溯链接', 'csv'));
    albumCard.appendChild(btn);
  }
}
