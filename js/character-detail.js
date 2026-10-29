// ==================== 角色详情页 ====================

(function () {
  const params = new URLSearchParams(window.location.search);
  const name = params.get('name');
  if (!name) {
    document.getElementById('detailContent').innerHTML = `
      <div class="card" style="text-align:center;padding:60px 20px;">
        <h3>未指定角色</h3>
        <p class="subtitle">请从地图或角色列表中选择一个角色</p>
        <a href="index.html" class="back-btn">← 返回地图</a>
      </div>`;
    return;
  }

  const char = CHARACTERS.find(c => c.name === name);
  if (!char) {
    document.getElementById('detailContent').innerHTML = `
      <div class="card" style="text-align:center;padding:60px 20px;">
        <h3>角色「${name}」未找到</h3>
        <p class="subtitle">数据可能尚未收录，敬请期待</p>
        <a href="index.html" class="back-btn">← 返回地图</a>
      </div>`;
    return;
  }

  renderCharacterDetail(char);

  // 动态注入顶栏立绘大图与标题（依赖 page-hero.js 的 applyPageHero）
  const heroEl = document.querySelector('.page-hero');
  if (heroEl) {
    const region = REGIONS.find(r => r.id === char.region);
    const titleEl = document.getElementById('heroTitle');
    const subEl = document.getElementById('heroSubtitle');
    if (titleEl) titleEl.textContent = char.name;
    if (subEl) subEl.textContent = (region ? region.name + ' · ' : '') + char.element + '元素 · ' + char.weapon + ' · 主题音乐与跨平台热度深度解析';
    if (typeof applyPageHero === 'function') applyPageHero(heroEl, char.name);
  }

  if (window.location.hash === '#music') {
    setTimeout(() => {
      document.getElementById('musicSection')?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  }
})();

function renderCharacterDetail(char) {
  const region = REGIONS.find(r => r.id === char.region);
  const color = ELEMENT_COLORS[char.element] || (region?.color || '#999');
  const allChars = CHARACTERS.filter(c => c.region === char.region);
  const regionTracks = REGION_TRACKS[char.region] || [];

  const peers = allChars.filter(c => c.name !== char.name).sort((a, b) => b.pv - a.pv);

  const pvRank = CHARACTERS.slice().sort((a, b) => b.pv - a.pv).findIndex(c => c.name === char.name) + 1;
  const neteaseRank = CHARACTERS.slice().sort((a, b) => b.netease - a.netease).findIndex(c => c.name === char.name) + 1;

  // 从ALBUMS获取真实曲目数据（无真实曲目时不展示任何虚构条目）
  let albumTracks = [];
  if (typeof getTracksByCharacter === 'function') {
    albumTracks = getTracksByCharacter(char.name);
  }
  const hasAlbumData = albumTracks.length > 0;
  const displayTracks = albumTracks.slice(0, 8);

  const starHtml = Array(5).fill(0).map((_, i) =>
    `<span class="star ${i < char.rarity ? 'gold' : 'silver'}">★</span>`
  ).join('');

  const elementClass = getElementClass(char.element);
  const weaponClass = getWeaponClass(char.weapon);

  // 官方元素图标 URL（UI_Element_*.png，来自 enka.network 本地化素材）
  const elementIconUrl = (typeof getElementSvgUrl === 'function') ? getElementSvgUrl(char.element) : '';
  // 官方武器类型图标 URL（UI_ItemIcon_101~105.png，来自 enka.network 本地化素材）
  const weaponIconUrl = (typeof getWeaponIconUrl === 'function') ? getWeaponIconUrl(char.weapon) : '';

  // 爬虫档案字段（过滤掉空值与不需要的字段）
  // crawled 来自 CHARACTER_INFO（由爬虫脚本填充），无数据时为空对象，档案卡片自动隐藏
  const crawled = (typeof CHARACTER_INFO !== 'undefined' && CHARACTER_INFO[char.name]) || {};
  const profileFields = [];
  if (crawled.title)         profileFields.push(['称号', crawled.title]);
  if (crawled.birthday)      profileFields.push(['生日', crawled.birthday]);
  if (crawled.affiliation)   profileFields.push(['所属', crawled.affiliation]);
  if (crawled.vision)        profileFields.push(['神之眼', crawled.vision]);
  if (crawled.constellation) profileFields.push(['命之座', crawled.constellation]);
  if (crawled.weapon)        profileFields.push(['武器类型', crawled.weapon]);
  if (crawled.role)          profileFields.push(['定位', crawled.role]);
  if (crawled.va)            profileFields.push(['声优', crawled.va]);
  if (crawled.releaseDate)   profileFields.push(['实装日期', crawled.releaseDate]);

  // 使用本地角色头像素材（由 crawl_assets.py 从 enka.network 爬取到本地，绕过 CORS）
  const avatarUrl = (typeof getLocalAvatarUrl === 'function') ? getLocalAvatarUrl(char.name) : '';
  const splashUrl = (typeof getLocalSplashUrl === 'function') ? getLocalSplashUrl(char.name) : '';
  const bgGradient = `linear-gradient(135deg, ${color}44, ${color}11)`;

  // 优先用立绘大图做角色头部展示，无立绘则用头像图标，两者均无则首字母兜底
  const heroImgSrc = splashUrl || avatarUrl;
  // 有立绘大图时使用竖版展示样式，否则用圆形头像样式
  const hasSplash = !!splashUrl;
  const visualHtml = `
    <div class="char-art-wrap ${hasSplash ? 'char-art-wrap-splash' : ''}" style="border-color:${color}44;background:${bgGradient};">
      ${heroImgSrc ? `<img src="${heroImgSrc}" class="${hasSplash ? 'char-splash-img' : 'char-avatar-large-img'}" alt="${char.name}立绘" style="border-color:${color}66;" onerror="this.style.display='none';var n=this.nextElementSibling;if(n){n.style.display='flex';}" />` : ''}
      <div class="char-avatar-large" style="color:${color};background:${bgGradient};border-color:${color}66;${heroImgSrc ? 'display:none;' : ''}">
        <span class="char-avatar-text">${char.name[0]}</span>
        <div class="char-avatar-glow" style="box-shadow:0 0 40px ${color}33;"></div>
      </div>
    </div>`;

  // 通用PNG图标构造（带 onerror 兜底隐藏）
  const ic = (src, w = 16, h = 16) => `<img src="${src}" onerror="this.style.display='none'" style="width:${w}px;height:${h}px;object-fit:contain;vertical-align:-3px;margin-right:4px;"/>`;
  const icSm = (src, w = 12, h = 12) => `<img src="${src}" onerror="this.style.display='none'" style="width:${w}px;height:${h}px;object-fit:contain;vertical-align:-2px;margin-right:2px;"/>`;

  const html = `
    <!-- 角色头部大图 -->
    <div class="char-hero" style="border-left:4px solid ${color};">
      <div class="char-visual">
        ${visualHtml}
      </div>
      <div class="char-info">
        <div class="char-title-row">
          <h2>${char.name}</h2>
          <div class="star-rating">${starHtml}</div>
        </div>
        <div class="char-meta">
          <span class="region-tag">
            ${region?.id ? `<img src="${getRegionSvgUrl(region.id)}" class="region-tag-icon" alt="${region.name}元素" onerror="this.style.display='none';" />` : ''}
            ${region?.name || ''}
          </span>
          <span class="element-tag ${elementClass}">
            ${elementIconUrl ? `<img src="${elementIconUrl}" class="element-tag-icon" alt="${char.element}元素" onerror="this.style.display='none';" />` : ''}
            ${char.element}
          </span>
          <span class="weapon-tag ${weaponClass}">
            ${weaponIconUrl ? `<img src="${weaponIconUrl}" class="weapon-tag-icon" alt="${char.weapon}" onerror="this.style.display='none';" />` : ''}
            ${char.weapon}
          </span>
          <span style="color:var(--text-tertiary);">v${char.version}</span>
        </div>
        <div class="char-theme">「${char.theme}」</div>
        <div class="char-desc">${char.desc}</div>
        <div class="char-stats-grid">
          <div class="char-stat">
            <div class="v" style="color:${color};">${char.pv.toLocaleString()}万</div>
            <div class="l">B站PV播放 · 第${pvRank}名</div>
          </div>
          <div class="char-stat">
            <div class="v">${fmt(char.netease * 1000)}</div>
            <div class="l">网易云收藏 · 第${neteaseRank}名</div>
          </div>
          <div class="char-stat">
            <div class="v">${fmt(char.cmt * 1000)}</div>
            <div class="l">网易云评论</div>
          </div>
          <div class="char-stat">
            <div class="v">${fmt(char.qq * 1000)}</div>
            <div class="l">QQ音乐收藏</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 角色档案（爬虫米游社/B站wiki） -->
    ${profileFields.length > 0 ? `
    <div class="card">
      <h3>${ic('assets/img/deco/UI_ItemIcon_211.png')}角色档案</h3>
      <p class="subtitle">来源：${crawled.source || 'B站wiki'} · 数据由 miyoushe_crawler.py 自动抓取</p>
      <div class="profile-grid">
        ${profileFields.map(([k, v]) => `
          <div class="profile-item">
            <div class="profile-key">${k}</div>
            <div class="profile-val">${v}</div>
          </div>
        `).join('')}
      </div>
      ${crawled.wikiUrl ? `<div class="profile-source"><a href="${crawled.wikiUrl}" target="_blank" rel="noopener">${ic('assets/img/deco/UI_ItemIcon_111.png')}查看原始Wiki页面 →</a></div>` : ''}
    </div>` : ''}

    <!-- 角色PV & 音乐数据 -->
    <div class="two-col">
      <div class="card">
        <h3>${ic('assets/img/deco/UI_ItemIcon_105.png')}PV热度数据</h3>
        <p class="subtitle">B站角色PV播放量 · 全角色排名</p>
        <div style="text-align:center;padding:16px 0;">
          <div style="font-size:42px;font-weight:700;background:var(--gold-gradient);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:1px;">${fmt(char.pv * 1000)}</div>
          <div style="font-size:12px;color:var(--text-tertiary);margin-top:4px;">B站累计播放量</div>
        </div>
        ${(() => {
          const sorted = [...CHARACTERS].sort((a, b) => b.pv - a.pv);
          const rank = sorted.findIndex(c => c.name === char.name) + 1;
          const maxPv = sorted[0].pv;
          return `<div style="padding:12px 0;border-top:1px solid rgba(212,168,86,0.1);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <span style="font-size:12px;color:var(--text-secondary);">全角色排名</span>
              <span style="font-size:16px;font-weight:700;color:var(--gold-light);">第 ${rank} / ${sorted.length} 名</span>
            </div>
            <div style="height:10px;background:var(--surface);border-radius:5px;overflow:hidden;">
              <div style="width:${(char.pv / maxPv * 100).toFixed(0)}%;height:100%;background:linear-gradient(90deg,${color}88,${color});border-radius:5px;transition:width 0.8s;"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-tertiary);margin-top:4px;">
              <span>0</span>
              <span>最高 ${sorted[0].name} ${fmt(maxPv * 10000)}</span>
            </div>
          </div>`;
        })()}
      </div>

      <div class="card">
        <h3>${ic('assets/img/deco/UI_ItemIcon_108.png')}跨平台对比</h3>
        <p class="subtitle">各平台收藏/评论量</p>
        <div style="space-y:12px;">
          ${[
            { label: '网易云收藏', val: char.netease, max: 85, color: 'var(--chart-1)' },
            { label: '网易云评论', val: char.cmt, max: 18.5, color: 'var(--chart-3)' },
            { label: 'QQ音乐收藏', val: char.qq, max: 62, color: 'var(--chart-5)' },
            { label: 'PV播放(万)', val: char.pv, max: 5767, color: 'var(--chart-4)' }
          ].map(item => `
            <div style="margin-bottom:10px;">
              <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;">
                <span style="color:var(--text-secondary);">${item.label}</span>
                <span style="font-weight:600;">${item.val.toFixed(1)}</span>
              </div>
              <div style="height:8px;background:var(--surface);border-radius:4px;overflow:hidden;">
                <div style="width:${(item.val / item.max * 100).toFixed(0)}%;height:100%;background:${item.color};border-radius:4px;transition:width 0.8s;"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- 角色主题音乐 -->
    <div class="card music-section" id="musicSection">
      <h3>${ic('assets/img/items/UI_ItemIcon_112001.png')}角色主题音乐</h3>
      <p class="subtitle">${hasAlbumData ? `${char.name} 相关的官方专辑曲目（共${displayTracks.length}首）· 数据来源于官方专辑核实` : '暂无该角色的官方专辑曲目数据'}</p>
      <div style="display:grid;gap:10px;">
        ${displayTracks.length ? displayTracks.map((m, i) => {
          // 检查是否为ALBUMS来源数据（getTrackFullData 不带 heatScore，需按真实指标现算）
          const isAlbumData = !!(m.albumId || m.ncmId || m.trackName);
          const heatScore = isAlbumData && typeof getTrackHeatScore === 'function' ? getTrackHeatScore(m) : null;
          const platformMetrics = isAlbumData ? `
            <div style="margin-top:6px;display:flex;gap:10px;font-size:11px;color:var(--text-tertiary);flex-wrap:wrap;">
              ${m.neteaseCmt !== null && m.neteaseCmt !== undefined ? `<span style="color:#FE2C55;">网易云 ${fmt(m.neteaseCmt)} 评论</span>` : ''}
              ${m.biliPlay !== null && m.biliPlay !== undefined ? `<span style="color:#FB7299;">B站 ${fmt(m.biliPlay)} 播放</span>` : ''}
            </div>` : `
            <div style="margin-top:6px;font-size:11px;color:var(--text-quaternary);">暂无真实平台数据</div>`;
          
          const trackLinks = isAlbumData ? `
            <div style="margin-top:6px;display:flex;gap:6px;">
              ${m.neteaseUrl ? `<a href="${m.neteaseUrl}" target="_blank" rel="noopener" style="color:#FE2C55;font-size:11px;text-decoration:none;">${ic('assets/img/items/UI_ItemIcon_112001.png')}网易云</a>` : ''}
              ${m.qqUrl ? `<a href="${m.qqUrl}" target="_blank" rel="noopener" style="color:#31A5E8;font-size:11px;text-decoration:none;">${ic('assets/img/items/UI_ItemIcon_112002.png')}QQ音乐</a>` : ''}
              ${m.bilibiliUrl ? `<a href="${m.bilibiliUrl}" target="_blank" rel="noopener" style="color:#FB7299;font-size:11px;text-decoration:none;">${ic('assets/img/deco/UI_NameCardIcon_0.png')}B站</a>` : ''}
            </div>` : '';
            
          return `
          <div class="music-card" style="border-left:3px solid ${color};">
            <div class="music-cover" style="background:linear-gradient(135deg, ${color}, ${color}66);"><img src="assets/img/items/UI_ItemIcon_112001.png" onerror="this.style.display='none'" style="width:28px;height:28px;object-fit:contain;position:relative;z-index:2;"/></div>
            <div class="music-info">
              <div class="music-name">${m.trackName || m.name}</div>
              <div class="music-meta">${isAlbumData ? (m.albumName || m.albumType + ' OST') : m.type} · ${isAlbumData ? ('v' + m.albumVersion) : m.duration} · ${isAlbumData ? 'HOYO-MiX' : m.composer}</div>
              ${platformMetrics}
              ${trackLinks}
            </div>
            <div class="music-data">
              <div class="big" style="color:${color};">#${i + 1}</div>
              <div style="font-size:11px;color:var(--text-tertiary);">${heatScore ? ('热度 ' + heatScore + '/100') : '热度排名'}</div>
            </div>
          </div>
          `;
        }).join('') : '<div style="padding:16px;text-align:center;font-size:12px;color:var(--text-quaternary);">该角色暂无可核实的官方专辑曲目</div>'}
      </div>
    </div>

    <!-- 同地区角色 -->
    <div class="card">
      <h3>${ic('assets/img/icons/七天神像.png', 18, 18)}同地区其他角色</h3>
      <p class="subtitle">${region?.name} 地区的其他角色音乐热度</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;">
        ${peers.map(p => {
          const pColor = ELEMENT_COLORS[p.element] || rColor(p.region);
          const pBg = `linear-gradient(135deg,${pColor}33,${pColor}11)`;
          const pAvatarUrl = (typeof getLocalAvatarUrl === 'function') ? getLocalAvatarUrl(p.name) : '';
          return `
          <a href="character-detail.html?name=${encodeURIComponent(p.name)}"
             style="padding:12px;border:1px solid var(--border);border-radius:8px;transition:all 0.15s;display:block;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
              ${pAvatarUrl
                ? `<img src="${pAvatarUrl}" alt="${p.name}" style="width:36px;height:36px;border-radius:50%;border:2px solid ${pColor}44;object-fit:cover;" onerror="this.style.display='none';var n=this.nextElementSibling;if(n){n.style.display='flex';}" /><div style="width:36px;height:36px;border-radius:50%;background:${pBg};border:2px solid ${pColor}44;display:none;align-items:center;justify-content:center;color:${pColor};font-size:14px;font-weight:700;">${p.name[0]}</div>`
                : `<div style="width:36px;height:36px;border-radius:50%;background:${pBg};border:2px solid ${pColor}44;display:flex;align-items:center;justify-content:center;color:${pColor};font-size:14px;font-weight:700;">${p.name[0]}</div>`}
              <div>
                <div style="font-weight:600;font-size:14px;">${p.name}</div>
                <div style="font-size:11px;color:var(--text-tertiary);">${p.rarity}星 · ${p.element} · v${p.version}</div>
              </div>
            </div>
            <div style="font-size:11px;color:var(--text-tertiary);">PV ${fmt(p.pv * 1000)}</div>
            <div style="margin-top:6px;height:4px;background:var(--surface);border-radius:2px;overflow:hidden;">
              <div style="width:${Math.min(p.pv / 20, 100).toFixed(0)}%;height:100%;background:${pColor};border-radius:2px;"></div>
            </div>
          </a>
        `}).join('')}
      </div>
    </div>

    <!-- 地区推荐音乐 -->
    ${regionTracks.length > 0 || (typeof getTracksByRegion === 'function' && getTracksByRegion(char.region).length > 0) ? `
    <div class="card">
      <h3>${ic('assets/img/items/UI_ItemIcon_112002.png', 18, 18)}${region?.name}地区推荐音乐</h3>
      <p class="subtitle">来自该地区的原声音乐精选（发行版本标注）${typeof getTracksByRegion === 'function' ? ' · 基于官方专辑核实数据' : ''}</p>
      <div style="display:grid;gap:8px;">
        ${(() => {
          const albumRegionTracks = typeof getTracksByRegion === 'function' ? getTracksByRegion(char.region) : [];
          const combinedTracks = albumRegionTracks.length > 0 
            ? albumRegionTracks.slice(0, 8) 
            : regionTracks.slice(0, 5);
          return combinedTracks.map(t => {
            const isAlbumData = !!(t.albumId || t.ncmId || t.trackName);
            return `
            <div style="display:flex;align-items:center;gap:12px;padding:10px;border:1px solid var(--border);border-radius:8px;transition:all 0.2s;">
              <div style="width:40px;height:40px;border-radius:6px;background:${color}22;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <img src="assets/img/items/UI_ItemIcon_112001.png" onerror="this.style.display='none'" style="width:24px;height:24px;object-fit:contain;"/>
              </div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:14px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t.trackName || t.name}</div>
                <div style="font-size:11px;color:var(--text-tertiary);display:flex;gap:8px;flex-wrap:wrap;">
                  ${isAlbumData 
                    ? `<span>v${t.albumVersion} · ${t.albumName || ''}</span>` 
                    : `<span>发行版本: v${t.version}</span>`
                  }
                  ${isAlbumData 
                    ? `${t.neteaseCmt !== null && t.neteaseCmt !== undefined ? `<span style="color:#FE2C55;">网易云${fmt(t.neteaseCmt)}评论</span>` : ''}${t.biliPlay !== null && t.biliPlay !== undefined ? `<span style="color:#FB7299;">B站${fmt(t.biliPlay)}播放</span>` : ''}`
                    : `<span>暂无真实平台数据</span>`
                  }
                </div>
              </div>
              <div style="font-size:12px;color:var(--text-tertiary);flex-shrink:0;">${rName(char.region)}</div>
              ${isAlbumData && (t.neteaseUrl || t.qqUrl || t.bilibiliUrl) ? `
                <div style="display:flex;gap:4px;flex-shrink:0;">
                  ${t.neteaseUrl ? `<a href="${t.neteaseUrl}" target="_blank" rel="noopener" style="color:#FE2C55;font-size:11px;text-decoration:none;">${ic('assets/img/items/UI_ItemIcon_112001.png')}网易云</a>` : ''}
                  ${t.qqUrl ? `<a href="${t.qqUrl}" target="_blank" rel="noopener" style="color:#31A5E8;font-size:11px;text-decoration:none;">${ic('assets/img/items/UI_ItemIcon_112002.png')}QQ音乐</a>` : ''}
                  ${t.bilibiliUrl ? `<a href="${t.bilibiliUrl}" target="_blank" rel="noopener" style="color:#FB7299;font-size:11px;text-decoration:none;">${ic('assets/img/deco/UI_NameCardIcon_0.png')}B站</a>` : ''}
                </div>
              ` : ''}
            </div>`;
          }).join('');
        })()}
      </div>
    </div>` : ''}
  `;

  document.getElementById('detailContent').innerHTML = html;

  const crumb = document.getElementById('breadcrumbRegion');
  if (crumb) {
    crumb.textContent = region?.name || '';
    crumb.href = `region.html?r=${char.region}`;
  }
  const crumbName = document.getElementById('breadcrumbName');
  if (crumbName) crumbName.textContent = char.name;
}
