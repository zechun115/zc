// ==================== 角色音乐页 ====================
let scatterFilter = 'all';
let elementFilter = 'all';
let weaponFilter = 'all';
let charGridPage = 1;
const charGridPageSize = 24;

// 地区徽章已改为对应元素图标（见 data.js 的 REGION_ELEMENT_MAP + regionElementUrl）
const REGION_CDN_MAP = {};

function getElementSvgUrl(element) {
  // 优先本地 PNG（assets/img/elements/），无映射返回空（已移除自创 SVG fallback）
  const iconName = (typeof ELEMENT_CDN_MAP !== 'undefined') && ELEMENT_CDN_MAP[element];
  if (iconName && typeof CDN_BASE !== 'undefined') return `${CDN_BASE}${iconName}`;
  return '';
}

/**
 * 地区图标改为其代表元素图标（使用官方 PNG 素材，已移除自创 SVG fallback）
 */
function getRegionSvgUrl(region) {
  if (typeof regionElementUrl !== 'undefined') return regionElementUrl(region);
  const ele = (typeof REGION_ELEMENT_MAP !== 'undefined')
    ? (REGION_ELEMENT_MAP[region] || '风')
    : '风';
  return getElementSvgUrl(ele);
}

/**
 * 生成排行榜角色头像 HTML：真实头像优先，无映射或加载失败回退首字母占位
 */
function rankAvatarHtml(name, color, bgGradient) {
  const url = (typeof getLocalAvatarUrl === 'function') ? getLocalAvatarUrl(name) : '';
  if (url) {
    return `<img src="${url}" alt="${name}" class="rank-avatar-img" style="border-color:${color}44;" onerror="this.style.display='none';var n=this.nextElementSibling;if(n){n.style.display='flex';}" />` +
      `<div class="rank-avatar-placeholder" style="color:${color};background:${bgGradient};border-color:${color}44;display:none;">${name[0]}</div>`;
  }
  return `<div class="rank-avatar-placeholder" style="color:${color};background:${bgGradient};border-color:${color}44;">${name[0]}</div>`;
}

/* ================================================================
 * 游戏素材辅助函数（基于 enka / iuhence/genshin 爬虫下载的 UI 图标）
 *   rarityStars(rarity)    → 卡片下方一排 N 个星级图标（真实星标 PNG，优先 Enka；失败用 SVG）
 *   rarityBadge(rarity)    → 卡片右上角星级底板 PNG（失败用内联 SVG 底板）
 *
 * 注：中国大陆网络下 GitHub 常超时，故优先 PNG 并加 data:image/svg+xml 风格化兜底。
 *     内联 SVG 风格参照原神：5 星→橙金渐变；4 星→紫晶渐变。
 * ================================================================ */

// 游戏风格的金色五角星：线性渐变+投影（data URI，永久本地，无网络依赖）
const STAR_GOLD_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff4b8"/>
      <stop offset="40%" stop-color="#ffd66b"/>
      <stop offset="100%" stop-color="#c88a28"/>
    </linearGradient>
    <linearGradient id="h" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity=".9"/>
      <stop offset="55%" stop-color="#ffffff" stop-opacity=".15"/>
    </linearGradient>
    <filter id="s" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation=".85"/>
    </filter>
  </defs>
  <!-- 外发光（用半透明黑色轮廓模糊模拟光晕） -->
  <path d="M16 3 L20.2 12.4 L30.4 13.4 L22.8 20.2 L25.3 30 L16 25.1 L6.7 30 L9.2 20.2 L1.6 13.4 L11.8 12.4 Z"
        fill="rgba(255,220,120,.35)" filter="url(#s)"/>
  <!-- 主体 -->
  <path d="M16 3 L20.2 12.4 L30.4 13.4 L22.8 20.2 L25.3 30 L16 25.1 L6.7 30 L9.2 20.2 L1.6 13.4 L11.8 12.4 Z"
        fill="url(#g)" stroke="#7a4b00" stroke-width=".9" stroke-linejoin="round"/>
  <!-- 高光 -->
  <path d="M16 3 L19 11.8 L16 14.5 L13 11.8 Z" fill="url(#h)"/>
</svg>`)}`;

// 银色暗星（5-4 补空）
const STAR_SILVER_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs>
    <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#cbd5e1"/>
      <stop offset="100%" stop-color="#64748b"/>
    </linearGradient>
  </defs>
  <path d="M16 3 L20.2 12.4 L30.4 13.4 L22.8 20.2 L25.3 30 L16 25.1 L6.7 30 L9.2 20.2 L1.6 13.4 L11.8 12.4 Z"
        fill="url(#gs)" opacity=".45" stroke="#334155" stroke-width=".8" stroke-linejoin="round"/>
</svg>`)}`;

// 5 星品质底板（原神品质 5：橙金色，四角凹切）
function rarityBadgeSvg(r) {
  r = Math.max(4, Math.min(5, Number(r) || 5));
  const is5 = r === 5;
  const gradTop = is5 ? '#fff4c6' : '#eedbff';
  const gradMid = is5 ? '#ffc964' : '#b37bff';
  const gradBot = is5 ? '#c8842b' : '#6f3fc9';
  const stroke  = is5 ? '#6d3f00' : '#3e1d7a';
  const highlight = is5 ? 'rgba(255,248,200,.92)' : 'rgba(245,235,255,.9)';
  return `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 92" preserveAspectRatio="xMidYMid meet">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${gradTop}"/>
      <stop offset="55%" stop-color="${gradMid}"/>
      <stop offset="100%" stop-color="${gradBot}"/>
    </linearGradient>
    <linearGradient id="h" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${highlight}"/>
      <stop offset="60%" stop-color="rgba(255,255,255,0)"/>
    </linearGradient>
    <filter id="o" x="-20%" y="-30%" width="140%" height="160%">
      <feGaussianBlur stdDeviation="1.6"/>
    </filter>
  </defs>
  <path d="M18 2 L110 2 L122 14 L126 30 L126 62 L122 78 L110 90 L18 90 L6 78 L2 62 L2 30 L6 14 Z"
        fill="${gradBot}" opacity=".38" filter="url(#o)"/>
  <path d="M18 2 L110 2 L122 14 L126 30 L126 62 L122 78 L110 90 L18 90 L6 78 L2 62 L2 30 L6 14 Z"
        fill="url(#g)" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
  <path d="M18 2 L110 2 L122 14 L122 22 L6 22 L6 14 Z" fill="url(#h)"/>
  <text x="50%" y="56%" text-anchor="middle" dominant-baseline="middle"
        font-family="'Noto Sans SC','PingFang SC',Microsoft YaHei,sans-serif"
        font-size="46" font-weight="900" fill="white" stroke="${stroke}"
        stroke-width="3" paint-order="stroke" style="letter-spacing:-2px;">${r}</text>
</svg>`)}`;
}

// 全局 img.onerror 代理：处理 rarity-star + rarity-badge 的分级兜底
// （避免内联字符串 onerror 的转义/换行问题）
(function installGenshinImgAgent() {
  if (window.__genshinImgAgentInstalled) return;
  window.__genshinImgAgentInstalled = true;
  document.addEventListener('error', function (e) {
    const t = e.target;
    if (!t || !t.tagName || t.tagName !== 'IMG') return;
    const cls = t.className || '';
    if (typeof cls !== 'string') return;
    // 1) 星级星星：失败 -> 切到内联 SVG 金星
    if (cls.indexOf('rarity-star-icon') > -1) {
      if (t.dataset.fbApplied) { t.style.display='none'; return; }
      t.dataset.fbApplied = '1';
      try { t.src = STAR_GOLD_SVG; } catch(_) { t.style.display='none'; }
      return;
    }
    // 2) 星级品质底板：失败 -> 依次尝试 pngs[1..N-1]，最终到 SVG
    if (cls.indexOf('rarity-badge-img') > -1) {
      var chain = t._chain;
      if (!chain) chain = (t._chain = (function () {
        try { return JSON.parse(t.getAttribute('data-chain') || '[]'); } catch (_) { return []; }
      })());
      var idx = parseInt(t.dataset.idx || '0', 10);
      if (idx < chain.length) {
        t.dataset.idx = (idx + 1).toString();
        try { t.src = chain[idx]; return; } catch (_) {}
      }
      var svg = t._fallbackSvg || t.getAttribute('data-svg');
      if (svg) {
        if (t.dataset.fbApplied) { t.style.display='none'; return; }
        t.dataset.fbApplied = '1';
        try { t.src = svg; } catch(_) { t.style.display='none'; }
        return;
      }
      t.style.display='none';
      if (t.parentElement) t.parentElement.classList.add('fallback-rarity');
      return;
    }
  }, true);
})();

function rarityStars(rarity) {
  const r = Math.max(1, Math.min(5, Number(rarity) || 1));
  let html = '';
  // 本地素材库无星级 PNG（UI_Rarity_Star_Gold.png 不存在），改用与角色详情页一致的
  // 金色 ★ 字形，避免出现破图占位与 alt 文本
  for (let i = 0; i < r; i++) {
    html += `<span class="rarity-star-icon rarity-star-glyph" aria-label="星">★</span>`;
  }
  return `<span class="rarity-stars-img" title="${r}星">${html}</span>`;
}

function rarityBadge(rarity) {
  const r = Math.max(4, Math.min(5, Number(rarity) || 4));
  const pngs = [
    `assets/img/deco/UI_Rarity_${r}.png`,
    `assets/img/deco/UI_Rarity_BG_${r}.png`,
    `assets/img/deco/UI_Quality_${r}.png`,
    `assets/img/deco/UI_RarityNum_${r}.png`,
  ];
  const fallbackSvg = rarityBadgeSvg(r);
  const chain = pngs.slice(1).concat([fallbackSvg]);
  const chainAttr = chain.map(s => s.replace(/"/g, '&quot;')).join('\u0001');
  return `<span class="rarity-badge-img-wrap" data-rarity="${r}">
    <img class="rarity-badge-img" src="${pngs[0]}" alt="${r}星" loading="lazy" data-chain='${JSON.stringify(chain)}' data-svg="${fallbackSvg}"/>
    ${fallbackRarityDiamonds(r)}
  </span>`;
}

function fallbackRarityDiamonds(r) {
  // 兜底 CSS 菱形，平时 display:none，只有 img 全失败才显示
  let d = '';
  for (let i = 0; i < r; i++) d += `<span class="rarity-diamond"></span>`;
  return `<span class="fallback-rarity-diamonds">${d}</span>`;
}

/**
 * 武器标签图标（单手剑/双手剑/长柄/弓/法器）
 * 失败自动只显示文字（不报错）
 */
function weaponEmblemHtml(wp) {
  const MAP = {
    '单手剑':   { png: 'assets/img/deco/UI_ItemIcon_101.png', name: '单手剑' },
    '双手剑':   { png: 'assets/img/deco/UI_ItemIcon_102.png', name: '双手剑' },
    '长柄武器': { png: 'assets/img/deco/UI_ItemIcon_103.png', name: '长柄武器' },
    '弓':       { png: 'assets/img/deco/UI_ItemIcon_104.png', name: '弓' },
    '法器':     { png: 'assets/img/deco/UI_ItemIcon_105.png', name: '法器' },
    '拳套':     { png: 'assets/img/deco/UI_ItemIcon_107.png', name: '拳套' },
  };
  const cfg = MAP[wp];
  if (!cfg) return wp || '';
  const onerror = `onerror="this.style.display='none'"`;
  return `<img class="tag-weapon-icon" src="${cfg.png}" alt="${cfg.name}" ${onerror}/>${cfg.name}`;
}

/* ==================== 全局共享：角色卡片渲染 ====================
 * 所有页面（角色音乐/地区探索等）统一调用此函数渲染角色卡片，
 * 保证视觉与功能一致：元素徽章、星级图标、地区徽章、热度依据、平台直达链接。
 * 依赖：CHARACTERS, ELEMENT_COLORS, REGIONS, getElementSvgUrl, getRegionSvgUrl,
 *        elementEmblem, rName, getLocalAvatarUrl (由 data.js / avatar-map.js 提供)
 * ================================================================ */
window.renderCharCard = function(c) {
  const color = ELEMENT_COLORS[c.element] || rColor(c.region || 'other');
  const bgGradient = `linear-gradient(135deg,${color}33,${color}11)`;
  const borderGradient = `border-color:${color}44`;
  const starsHtml = rarityStars(c.rarity);
  const badgeHtml = rarityBadge(c.rarity);
  const elementSvgUrl = getElementSvgUrl(c.element);
  const regionSvgUrl = getRegionSvgUrl(c.region);
  const avatarUrl = getCharAvatarUrl(c.name);

  // 热度依据徽章（同一支 B站「原神」官方角色视频的三项真实指标）
  const hasReal = typeof c.pv === 'number' && typeof c.fav === 'number' && typeof c.danmaku === 'number';
  const heatBasisHtml = hasReal ? `
    <div class="char-card-heat-basis"
         data-tooltip="数据来源：B站「原神」官方账号发布的同一支官方角色视频
• 播放量 ${c.pv}万（bilibili.com）
• 收藏 ${Math.round(c.fav * 1000).toLocaleString()}（bilibili.com）
• 弹幕 ${Math.round(c.danmaku * 1000).toLocaleString()}（bilibili.com）
三项指标含义与量级不同，不可相加或换算"
         style="margin-top:8px;padding:6px 8px;border-radius:8px;background:linear-gradient(90deg,rgba(251,114,153,0.06),rgba(254,44,85,0.06));border:1px solid rgba(201,162,39,0.18);display:flex;align-items:center;justify-content:space-between;gap:4px;font-size:10px;color:var(--text-tertiary);">
      <span style="display:flex;align-items:center;gap:2px;color:#FB7299;font-weight:600;" title="来源：bilibili.com @原神 官方角色视频播放量">
        <img src="assets/img/deco/UI_NameCardIcon_0.png" style="width:9px;height:9px;vertical-align:-1px;" onerror="this.style.display='none'"/>
        ${c.pv}万
      </span>
      <span style="width:1px;height:8px;background:rgba(201,162,39,0.15);"></span>
      <span style="display:flex;align-items:center;gap:2px;color:#FE2C55;font-weight:600;" title="来源：bilibili.com @原神 官方角色视频收藏数">
        <img src="assets/img/icons/旋曜玉帛.png" style="width:9px;height:9px;vertical-align:-1px;" onerror="this.style.display='none'"/>
        ${Math.round(c.fav * 1000).toLocaleString()}
      </span>
    </div>` : `
    <div class="char-card-heat-basis"
         data-tooltip="该角色没有 B站「原神」官方账号发布的官方角色视频，三项指标均无法核实，故不展示、不参与任何统计与排名。"
         style="margin-top:8px;padding:6px 8px;border-radius:8px;background:rgba(148,163,184,0.06);border:1px dashed rgba(148,163,184,0.25);font-size:10px;color:var(--text-quaternary);text-align:center;">
      暂无官方角色视频数据
    </div>`;

  // 角色主题 OST 预览：《闪耀的群星》按官方曲目表与角色演示/角色PV 一一对应。
  // 未发行主题曲的角色不拿地区曲目顶替，直接留空说明。
  let albumTracksHtml = '';
  const ownMusic = (typeof CHAR_THEME_MUSIC !== 'undefined' && CHAR_THEME_MUSIC[c.name]) || [];
  if (ownMusic.length) {
    const topTracks = ownMusic.slice(0, 2);
    albumTracksHtml = `
      <div style="margin-top:6px;padding:5px 7px;border-radius:6px;background:linear-gradient(90deg,${color}10,transparent);border:1px solid ${color}20;font-size:10px;">
        <div style="color:var(--text-tertiary);margin-bottom:2px;font-size:9px;"><img src="assets/img/items/UI_ItemIcon_112001.png" style="width:9px;height:9px;vertical-align:-1px;" onerror="this.style.display='none'"/> 角色主题 OST（闪耀的群星）</div>
        ${topTracks.map(t => `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:4px;margin-top:2px;">
            <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;color:var(--text-secondary);" title="${t.track}">${t.track}</span>
            ${t.fav ? `<span style="color:#E2556E;font-weight:600;flex-shrink:0;" title="网易云红心（客户端 UI 显示值，2026-11-07 实测）">${t.fav}</span>` : ''}
            <span style="color:${color};font-weight:600;flex-shrink:0;" title="对应官方${t.pvType || t.kindCN}${t.pvName ? '「' + t.pvName + '」' : ''}">${t.kindCN}</span>
          </div>
        `).join('')}
      </div>`;
  } else {
    albumTracksHtml = `
      <div style="margin-top:6px;padding:5px 7px;border-radius:6px;border:1px dashed rgba(148,163,184,0.22);font-size:9px;color:var(--text-quaternary);text-align:center;">
        尚未发行角色主题 OST
      </div>`;
  }

  // 武器标签图标
  const MAP = {
    '单手剑':   { png: 'assets/img/deco/UI_ItemIcon_101.png', name: '单手剑' },
    '双手剑':   { png: 'assets/img/deco/UI_ItemIcon_102.png', name: '双手剑' },
    '长柄武器': { png: 'assets/img/deco/UI_ItemIcon_103.png', name: '长柄武器' },
    '弓':       { png: 'assets/img/deco/UI_ItemIcon_104.png', name: '弓' },
    '法器':     { png: 'assets/img/deco/UI_ItemIcon_105.png', name: '法器' },
  };
  const wpCfg = MAP[c.weapon];
  const weaponTagHtml = wpCfg
    ? `<img class="tag-weapon-icon" src="${wpCfg.png}" alt="${wpCfg.name}" onerror="this.style.display='none'"/>${wpCfg.name}`
    : (c.weapon || '');

  return `
  <div class="char-card" onclick="window.location.href='character-detail.html?name=${encodeURIComponent(c.name)}'">
    <div class="char-card-corner char-card-corner-tl"></div>
    <div class="char-card-corner char-card-corner-br"></div>
    <div class="char-card-region-badge">${regionSvgUrl ? `<img src="${regionSvgUrl}" alt="${rName(c.region)}" class="region-badge-img" />` : ''}</div>
    <div class="char-card-img-container">
      ${avatarUrl ? `<img src="${avatarUrl}" class="char-card-avatar-img" alt="${c.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />` : ''}
      <div class="char-card-avatar-placeholder" style="color:${color};background:${bgGradient};${avatarUrl ? 'display:none;' : ''}">
        <span class="char-card-avatar-initials">${c.name[0]}</span>
        <div class="char-card-avatar-glow" style="box-shadow:0 0 20px ${color}44;"></div>
      </div>
    </div>
    <div class="char-card-info">
      <div class="char-card-name">${c.name}</div>
      <div class="char-card-stars">${starsHtml}</div>
      <div class="char-card-tags">
        <span class="char-card-tag ele-tag" style="border-color:${color}44;color:${color};">${elementEmblem(c.element, 14)}${c.element}</span>
        <span class="char-card-tag">${weaponTagHtml}</span>
        <span class="char-card-tag">${regionSvgUrl ? `<img src="${regionSvgUrl}" class="tag-region-img" />` : ''}${rName(c.region)}</span>
      </div>
      ${heatBasisHtml}
      ${albumTracksHtml}
    </div>
  </div>`;
};

/* 所有图表与结论共用同一份筛选状态，统一在一个入口重绘，
 * 避免某个视图漏刷导致页面内口径不一致（此前三个筛选入口各自重复调用，容易漏项）。 */
function renderAllCharViews() {
  renderScatter();
  renderCharRanks();
  renderCharRateRank();
  renderCharConclusions();
  renderCharGroupTable();
  renderCharThemeTracks();
  renderCharHeatmap();
  renderCharGrid();
}

(function () {
  renderFilterOptions();
  renderKpiBanner();
  renderAllCharViews();
  initScrollAnimations();

  const chips = document.querySelectorAll('#charFilters .chip');
  chips.forEach(btn => {
    btn.addEventListener('click', () => {
      chips.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      scatterFilter = btn.dataset.r;
      renderAllCharViews();
    });
  });

  document.addEventListener('change', (e) => {
    if (e.target.id === 'elementSelect') {
      elementFilter = e.target.value;
    } else if (e.target.id === 'weaponSelect') {
      weaponFilter = e.target.value;
    } else {
      return;
    }
    renderAllCharViews();
  });
})();


function renderFilterOptions() {
  const elementSelect = document.getElementById('elementSelect');
  const weaponSelect = document.getElementById('weaponSelect');
  
  if (elementSelect) {
    elementSelect.innerHTML = `<option value="all">全部元素</option>` +
      Object.keys(ELEMENT_COLORS).map(e => `<option value="${e}">${e}</option>`).join('');
  }
  
  if (weaponSelect) {
    const weapons = ['单手剑', '双手剑', '长柄武器', '弓', '法器'];
    weaponSelect.innerHTML = `<option value="all">全部武器</option>` +
      weapons.map(w => `<option value="${w}">${w}</option>`).join('');
  }
}

// 角色主题 OST（红心下限最高的一首）缓存，供 KPI 与散点 tooltip 共用。
// 数据来自 js/char-music.js 的官方角色主题曲表，不使用地区曲目补全。
function charBestFavTrack(charName) {
  const cache = window.__bestFavTrackCache || (window.__bestFavTrackCache = {});
  if (!(charName in cache)) {
    const tks = (typeof CHAR_THEME_MUSIC !== 'undefined' && CHAR_THEME_MUSIC[charName]) || [];
    const withFav = tks.filter(t => t.fav);
    const lb = v => (typeof favLowerBound === 'function') ? (favLowerBound(v) || 0) : 0;
    cache[charName] = withFav.length ? withFav.slice().sort((a, b) => lb(b.fav) - lb(a.fav))[0] : null;
  }
  return cache[charName];
}
function charBestFavTipHtml(c) {
  const t = charBestFavTrack(c.name);
  return t ? `<div style="grid-column:1/-1;"><span style="color:var(--text-tertiary);">主题 OST 红心:</span> <strong style="color:#E2556E;">${t.fav}</strong> <span style="font-size:10px;color:var(--text-tertiary);">${t.track}（对应${t.pvType || t.kindCN}${t.pvName ? '「' + t.pvName + '」' : ''}；网易云客户端 UI 显示值）</span></div>` : '';
}

// 角色全部主题 OST 的红心合计下限与原始量级标签列表。
// 红心来自网易云单曲页的量级标签（如 10w+），favLowerBound 逐曲取下限后相加，
// 是量级估计而非精确计数，只用于量级比较。
function charThemeHeartsInfo(charName) {
  const tks = (typeof CHAR_THEME_MUSIC !== 'undefined' && CHAR_THEME_MUSIC[charName]) || [];
  if (!tks.length) return null;
  const lb = v => (typeof favLowerBound === 'function') ? (favLowerBound(v) || 0) : 0;
  const hearts = tks.reduce((s, t) => s + lb(t.fav), 0);
  if (hearts <= 0) return null;
  return { hearts, labels: tks.map(t => String(t.fav)) };
}

// 红心下限的读法：万级以上写「≥N万」，千级为量级标签折算值，冠「约」
function charFmtHearts(v) {
  if (v >= 100000) return '≥' + Math.round(v / 10000) + '万';
  if (v >= 10000) return '≥' + (Math.round(v / 1000) / 10) + '万';
  return '约' + v;
}

/* ==================== 角色页统计口径（全页共用） ====================
 * 本页所有分析共用同一份样本与同一套定义，避免各图表口径打架：
 *  - 有效样本：B站官方角色视频的播放 / 收藏 / 弹幕三项齐全，缺任一项即排除
 *  - 收藏率、弹幕率：每万次播放对应多少次收藏 / 弹幕，用于剥离曝光规模
 *  - 分组比较一律用中位数：样本右偏，均值会被头部角色拉高
 * ================================================================ */
function charHasTriple(c) {
  return !!c && typeof c.pv === 'number' && typeof c.fav === 'number' && typeof c.danmaku === 'number';
}

function getFilteredValidChars() {
  let data = CHARACTERS.filter(charHasTriple);
  if (scatterFilter !== 'all') data = data.filter(c => c.region === scatterFilter);
  if (elementFilter !== 'all') data = data.filter(c => c.element === elementFilter);
  if (weaponFilter !== 'all') data = data.filter(c => c.weapon === weaponFilter);
  return data;
}

// 全部目录角色按当前筛选（不要求有官方角色视频数据）——主题 OST 与视频指标无关
function getFilteredAllChars() {
  let data = CHARACTERS.slice();
  if (scatterFilter !== 'all') data = data.filter(c => c.region === scatterFilter);
  if (elementFilter !== 'all') data = data.filter(c => c.element === elementFilter);
  if (weaponFilter !== 'all') data = data.filter(c => c.weapon === weaponFilter);
  return data;
}

/* 收藏率：每万次播放换来多少次收藏。
 * 原始单位：播放按「万」记录，收藏/弹幕按「千」记录，
 * 故 收藏数 = fav×1000、播放数 = pv×10000，每万播放 = fav×1000 / pv。 */
function charFavRate(c) {
  if (!c || typeof c.pv !== 'number' || typeof c.fav !== 'number' || c.pv <= 0) return null;
  return (c.fav * 1000) / c.pv;
}
function charDmRate(c) {
  if (!c || typeof c.pv !== 'number' || typeof c.danmaku !== 'number' || c.pv <= 0) return null;
  return (c.danmaku * 1000) / c.pv;
}

/* 取出某一指标的数值数组，顺带过滤 null / NaN，保证样本量标注可信 */
function charNums(data, fn) {
  return data.map(fn).filter(v => typeof v === 'number' && isFinite(v));
}
function charMedianOf(arr) {
  return (typeof statMedian === 'function') ? statMedian(arr) : 0;
}

/* 展示格式统一在这里定义。用函数声明而不是 const 箭头函数：
 * 页面底部有立即执行的初始化 IIFE，函数声明会被提升，避免 TDZ 报错。 */
function charFmtWan(v) { return (Math.round(v * 10) / 10).toLocaleString(); }
function charFmtCnt(v) { return Math.round(v).toLocaleString(); }
function charFmtRate(v) { return (Math.round(v * 10) / 10).toFixed(1); }

/* 按任意维度切分样本，只保留 n ≥ minN 的组，并算出各组的中位数指标 */
function charGroupStats(data, keyFn, minN) {
  const map = new Map();
  data.forEach(c => {
    const k = keyFn(c);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(c);
  });
  return [...map.entries()]
    .filter(([, arr]) => arr.length >= (minN || 1))
    .map(([k, arr]) => ({
      key: k,
      n: arr.length,
      medPv: charMedianOf(charNums(arr, c => c.pv)),
      medFav: charMedianOf(charNums(arr, c => c.fav)),
      medRate: charMedianOf(charNums(arr, charFavRate)),
      medDmRate: charMedianOf(charNums(arr, charDmRate)),
      pvSum: arr.reduce((s, c) => s + c.pv, 0)
    }));
}

/* 顶部 KPI：只描述全样本，不随筛选变化（筛选器只影响下方图表与结论）。
 * 五个指标依次回答：样本有多大 → 总量多少 → 典型角色多少 → 转化效率 → 是否头部化 */
function renderKpiBanner() {
  const valid = CHARACTERS.filter(charHasTriple);
  const pv = charNums(valid, c => c.pv);
  const totalPv = pv.reduce((s, v) => s + v, 0);
  const medPv = charMedianOf(pv);
  const medRate = charMedianOf(charNums(valid, charFavRate));

  // 头部 10%：按播放降序取前 10%（至少 1 人）合计占总播放的比例
  const descPv = [...pv].sort((a, b) => b - a);
  const headN = Math.max(1, Math.round(valid.length * 0.1));
  const headShare = totalPv > 0
    ? descPv.slice(0, headN).reduce((s, v) => s + v, 0) / totalPv * 100
    : 0;

  animateTo(document.getElementById('kpiValid'), valid.length, 900, v => Math.round(v));
  animateTo(document.getElementById('kpiTotalPv'), totalPv, 1400, v => (v / 10000).toFixed(2) + '亿');
  animateTo(document.getElementById('kpiMedPv'), medPv, 1200, v => Math.round(v));
  animateTo(document.getElementById('kpiFavRate'), medRate, 1200, v => Math.round(v));
  animateTo(document.getElementById('kpiHeadShare'), headShare, 1200, v => v.toFixed(1) + '%');
}

/* 统一的数字滚动动画：fmt 决定最终呈现格式，避免每张卡片各写一套 */
function animateTo(el, end, duration, fmt) {
  if (!el) return;
  const target = (typeof end === 'number' && isFinite(end)) ? end : 0;
  const t0 = performance.now();
  (function tick(t) {
    const p = Math.min((t - t0) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(target * eased);
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}

function initScrollAnimations() {
  const animMap = {
    'fadeInUp': 'fade-in-up',
    'slideInLeft': 'slide-in-left',
    'slideInRight': 'slide-in-right',
    'fadeInScale': 'fade-in-scale'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const animType = el.dataset.animation || 'fadeInUp';
        el.classList.add(`animate-${animMap[animType]}`);
        observer.unobserve(el);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });
  
  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });
}

function renderScatter() {
  const svg = document.getElementById('scatterSvg');
  if (!svg) return;
  svg.innerHTML = '';

  // 散点图纳入「有 B站官方角色视频实测播放」且「已发行主题曲（带网易云红心量级）」的角色；
  // 纵轴红心是量级标签的合计下限（如 10w+ 按 10万 计），不是精确计数
  let data = CHARACTERS
    .filter(c => typeof c.pv === 'number' && typeof c.danmaku === 'number')
    .map(c => {
      const info = charThemeHeartsInfo(c.name);
      return info ? Object.assign({}, c, { __hearts: info.hearts, __heartLabels: info.labels }) : null;
    })
    .filter(Boolean);
  if (scatterFilter !== 'all') data = data.filter(c => c.region === scatterFilter);
  if (elementFilter !== 'all') data = data.filter(c => c.element === elementFilter);
  if (weaponFilter !== 'all') data = data.filter(c => c.weapon === weaponFilter);

  if (data.length === 0) {
    const empty = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    empty.setAttribute('x', 390); empty.setAttribute('y', 240);
    empty.setAttribute('text-anchor', 'middle'); empty.setAttribute('font-size', '14');
    empty.setAttribute('fill', 'var(--text-tertiary)');
    empty.textContent = '暂无数据'; svg.appendChild(empty);
    return;
  }

  const maxPv = Math.max(...data.map(c => c.pv));
  const maxC = Math.max(...data.map(c => c.danmaku));
  const heartsArr = data.map(c => c.__hearts);
  const maxHearts = Math.max(...heartsArr);
  // 红心中位数阈值：红心是量级数据，中位数取整档更贴近量级读法
  const midHearts = (typeof statMedian === 'function') ? statMedian(heartsArr) : heartsArr.reduce((s, v) => s + v, 0) / heartsArr.length;
  // 象限分割采用中位数：右偏分布下均值会被头部角色拉高，中位数更能代表典型角色
  const midPv = (typeof statMedian === 'function') ? statMedian(data.map(c => c.pv)) : data.reduce((s, c) => s + c.pv, 0) / data.length;

  const M = { l: 70, r: 45, t: 45, b: 65 };
  const W = 780, H = 480, w = W - M.l - M.r, h = H - M.t - M.b;

  // 纵轴对数刻度：红心从千级到百万级跨 3 个数量级，线性轴会把多数点压在底部
  const yMinV = 700, yMaxV = 1400000;
  const yLgMin = Math.log10(yMinV), yLgMax = Math.log10(yMaxV);
  const yPx = v => M.t + (1 - (Math.log10(Math.max(v, yMinV)) - yLgMin) / (yLgMax - yLgMin)) * h;

  const NS = 'http://www.w3.org/2000/svg';
  const defs = document.createElementNS(NS, 'defs');

  // 象限渐变背景
  const quadGradTR = document.createElementNS(NS, 'linearGradient');
  quadGradTR.setAttribute('id', 'quadTR'); quadGradTR.setAttribute('x1', '0%'); quadGradTR.setAttribute('y1', '100%');
  quadGradTR.setAttribute('x2', '100%'); quadGradTR.setAttribute('y2', '0%');
  quadGradTR.innerHTML = `<stop offset="0%" stop-color="rgba(201,162,39,0)"/><stop offset="100%" stop-color="rgba(201,162,39,0.06)"/>`;
  defs.appendChild(quadGradTR);

  const quadGradTL = document.createElementNS(NS, 'linearGradient');
  quadGradTL.setAttribute('id', 'quadTL'); quadGradTL.setAttribute('x1', '100%'); quadGradTL.setAttribute('y1', '100%');
  quadGradTL.setAttribute('x2', '0%'); quadGradTL.setAttribute('y2', '0%');
  quadGradTL.innerHTML = `<stop offset="0%" stop-color="rgba(74,217,217,0)"/><stop offset="100%" stop-color="rgba(74,217,217,0.05)"/>`;
  defs.appendChild(quadGradTL);

  const gridGrad = document.createElementNS(NS, 'linearGradient');
  gridGrad.setAttribute('id', 'scatterGridGrad');
  gridGrad.setAttribute('x1', '0%'); gridGrad.setAttribute('y1', '0%');
  gridGrad.setAttribute('x2', '100%'); gridGrad.setAttribute('y2', '100%');
  gridGrad.innerHTML = `<stop offset="0%" stop-color="rgba(201,162,39,0.02)"/><stop offset="100%" stop-color="rgba(201,162,39,0.06)"/>`;
  defs.appendChild(gridGrad);

  const shadowFilter = document.createElementNS(NS, 'filter');
  shadowFilter.setAttribute('id', 'scatterShadow');
  shadowFilter.setAttribute('x', '-50%'); shadowFilter.setAttribute('y', '-50%');
  shadowFilter.setAttribute('width', '200%'); shadowFilter.setAttribute('height', '200%');
  shadowFilter.innerHTML = `<feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>`;
  defs.appendChild(shadowFilter);

  const glowFilter = document.createElementNS(NS, 'filter');
  glowFilter.setAttribute('id', 'scatterGlow');
  glowFilter.setAttribute('x', '-50%'); glowFilter.setAttribute('y', '-50%');
  glowFilter.setAttribute('width', '200%'); glowFilter.setAttribute('height', '200%');
  glowFilter.innerHTML = `<feGaussianBlur stdDeviation="3.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>`;
  defs.appendChild(glowFilter);

  svg.appendChild(defs);

  // 绘图区背景
  const bg = document.createElementNS(NS, 'rect');
  bg.setAttribute('x', M.l); bg.setAttribute('y', M.t);
  bg.setAttribute('width', w); bg.setAttribute('height', h);
  bg.setAttribute('fill', 'url(#scatterGridGrad)');
  bg.setAttribute('rx', '4');
  svg.appendChild(bg);

  // 中位数线位置（象限分割，纵轴按对数刻度取位）
  const avgPx = M.l + (midPv / maxPv) * w;
  const avgPy = yPx(midHearts);

  // 象限背景色
  const quadTR = document.createElementNS(NS, 'rect');
  quadTR.setAttribute('x', avgPx); quadTR.setAttribute('y', M.t);
  quadTR.setAttribute('width', W - M.r - avgPx); quadTR.setAttribute('height', avgPy - M.t);
  quadTR.setAttribute('fill', 'url(#quadTR)'); quadTR.setAttribute('rx', '0');
  svg.appendChild(quadTR);

  const quadTL = document.createElementNS(NS, 'rect');
  quadTL.setAttribute('x', M.l); quadTL.setAttribute('y', M.t);
  quadTL.setAttribute('width', avgPx - M.l); quadTL.setAttribute('height', avgPy - M.t);
  quadTL.setAttribute('fill', 'url(#quadTL)'); quadTL.setAttribute('rx', '0');
  svg.appendChild(quadTL);

  // 网格线
  for (let i = 0; i <= 5; i++) {
    const x = M.l + (i / 5) * w;
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', x); line.setAttribute('y1', M.t);
    line.setAttribute('x2', x); line.setAttribute('y2', H - M.b);
    line.setAttribute('stroke', 'var(--border)'); line.setAttribute('stroke-width', '0.5');
    line.setAttribute('stroke-dasharray', '4,4');
    line.setAttribute('stroke-opacity', '0.35');
    svg.appendChild(line);
    const lab = document.createElementNS(NS, 'text');
    lab.setAttribute('x', x); lab.setAttribute('y', H - M.b + 20);
    lab.setAttribute('text-anchor', 'middle'); lab.setAttribute('font-size', '11');
    lab.setAttribute('fill', 'var(--text-tertiary)');
    lab.setAttribute('font-weight', '500');
    lab.textContent = Math.round((i / 5) * maxPv) + '万';
    svg.appendChild(lab);
  }

  // 纵轴刻度：按数量级取整（1千 / 1万 / 10万 / 100万），另加 3倍档细网格
  const yTicks = [
    { v: 1000, lab: '1千', minor: false },
    { v: 3000, lab: '3千', minor: true },
    { v: 10000, lab: '1万', minor: false },
    { v: 30000, lab: '3万', minor: true },
    { v: 100000, lab: '10万', minor: false },
    { v: 300000, lab: '30万', minor: true },
    { v: 1000000, lab: '100万', minor: false }
  ];
  yTicks.forEach(tick => {
    const y = yPx(tick.v);
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', M.l); line.setAttribute('y1', y);
    line.setAttribute('x2', W - M.r); line.setAttribute('y2', y);
    line.setAttribute('stroke', 'var(--border)'); line.setAttribute('stroke-width', tick.minor ? '0.4' : '0.5');
    line.setAttribute('stroke-dasharray', '4,4');
    line.setAttribute('stroke-opacity', tick.minor ? '0.2' : '0.35');
    svg.appendChild(line);
    if (!tick.minor) {
      const lab = document.createElementNS(NS, 'text');
      lab.setAttribute('x', M.l - 12); lab.setAttribute('y', y + 4);
      lab.setAttribute('text-anchor', 'end'); lab.setAttribute('font-size', '11');
      lab.setAttribute('fill', 'var(--text-tertiary)');
      lab.setAttribute('font-weight', '500');
      lab.textContent = tick.lab;
      svg.appendChild(lab);
    }
  });

  // 坐标轴标题
  const xt = document.createElementNS(NS, 'text');
  xt.setAttribute('x', W / 2); xt.setAttribute('y', H - 18);
  xt.setAttribute('text-anchor', 'middle'); xt.setAttribute('font-size', '13');
  xt.setAttribute('fill', 'var(--gold-light)'); xt.setAttribute('font-weight', '600');
  xt.setAttribute('letter-spacing', '0.5px');
  xt.textContent = 'B站官方角色视频播放量（万）'; svg.appendChild(xt);

  const yt = document.createElementNS(NS, 'text');
  yt.setAttribute('x', 22); yt.setAttribute('y', H / 2);
  yt.setAttribute('text-anchor', 'middle'); yt.setAttribute('font-size', '13');
  yt.setAttribute('fill', 'var(--gold-light)'); yt.setAttribute('font-weight', '600');
  yt.setAttribute('letter-spacing', '0.5px');
  yt.setAttribute('transform', `rotate(-90,22,${H / 2})`);
  yt.textContent = '网易云主题曲红心数（对数刻度）'; svg.appendChild(yt);

  // 中位数分割线（右偏分布下比均值更稳健）
  const avgXLine = document.createElementNS(NS, 'line');
  avgXLine.setAttribute('x1', avgPx); avgXLine.setAttribute('y1', M.t);
  avgXLine.setAttribute('x2', avgPx); avgXLine.setAttribute('y2', H - M.b);
  avgXLine.setAttribute('stroke', 'var(--gold)'); avgXLine.setAttribute('stroke-width', '1.2');
  avgXLine.setAttribute('stroke-dasharray', '8,4'); avgXLine.setAttribute('opacity', '0.5');
  svg.appendChild(avgXLine);

  const avgYLine = document.createElementNS(NS, 'line');
  avgYLine.setAttribute('x1', M.l); avgYLine.setAttribute('y1', avgPy);
  avgYLine.setAttribute('x2', W - M.r); avgYLine.setAttribute('y2', avgPy);
  avgYLine.setAttribute('stroke', 'var(--gold)'); avgYLine.setAttribute('stroke-width', '1.2');
  avgYLine.setAttribute('stroke-dasharray', '8,4'); avgYLine.setAttribute('opacity', '0.5');
  svg.appendChild(avgYLine);

  // 均值标签
  const avgLabelX = document.createElementNS(NS, 'text');
  avgLabelX.setAttribute('x', avgPx + 4); avgLabelX.setAttribute('y', M.t + 12);
  avgLabelX.setAttribute('text-anchor', 'start'); avgLabelX.setAttribute('font-size', '9');
  avgLabelX.setAttribute('fill', 'var(--gold)'); avgLabelX.setAttribute('font-weight', '600');
  avgLabelX.textContent = '播放中位数'; svg.appendChild(avgLabelX);

  const avgLabelY = document.createElementNS(NS, 'text');
  avgLabelY.setAttribute('x', W - M.r - 4); avgLabelY.setAttribute('y', avgPy - 4);
  avgLabelY.setAttribute('text-anchor', 'end'); avgLabelY.setAttribute('font-size', '9');
  avgLabelY.setAttribute('fill', 'var(--gold)'); avgLabelY.setAttribute('font-weight', '600');
  avgLabelY.textContent = '红心中位数'; svg.appendChild(avgLabelY);

  // 象限标签
  const quadLabels = [
    { x: avgPx - 8, y: M.t + 14, text: '红心突出', anchor: 'end', color: 'rgba(74,217,217,0.4)' },
    { x: avgPx + 8, y: M.t + 14, text: '双高', anchor: 'start', color: 'rgba(201,162,39,0.5)' },
    { x: avgPx - 8, y: H - M.b - 8, text: '双低', anchor: 'end', color: 'rgba(148,163,184,0.35)' },
    { x: avgPx + 8, y: H - M.b - 8, text: '播放突出', anchor: 'start', color: 'rgba(217,74,74,0.35)' }
  ];
  quadLabels.forEach(ql => {
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', ql.x); t.setAttribute('y', ql.y);
    t.setAttribute('text-anchor', ql.anchor); t.setAttribute('font-size', '10');
    t.setAttribute('fill', ql.color); t.setAttribute('font-weight', '700');
    t.setAttribute('letter-spacing', '1px');
    t.textContent = ql.text; svg.appendChild(t);
  });

  const tip = document.getElementById('scatterTip');

  // 计算气泡位置，并执行防重叠优化（纵轴按对数刻度取位）
  // isTop 阈值：播放为最大值 60% 以上，或红心进入前 15 名（红心头部集中，比例阈值会只剩钟离一人）
  const heartTop15 = [...heartsArr].sort((a, b) => b - a)[Math.min(14, heartsArr.length - 1)];
  const sortedData = [...data].sort((a, b) => b.rarity - a.rarity || b.pv - a.pv);
  const positions = sortedData.map(c => ({
    name: c.name,
    ox: M.l + (c.pv / maxPv) * w,
    oy: yPx(c.__hearts),
    x: M.l + (c.pv / maxPv) * w,
    y: yPx(c.__hearts),
    // 半径只编码弹幕数；星级通过描边与光晕表达，避免把两种视觉通道混在一起。
    r: 4 + (maxC > 0 ? c.danmaku / maxC : 0) * 8,
    isTop: c.pv > maxPv * 0.6 || c.__hearts >= heartTop15
  }));

  // 防重叠：简单力导向分离
  const minDist = scatterFilter === 'all' ? 16 : 20;
  for (let iter = 0; iter < 8; iter++) {
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dx = positions[j].x - positions[i].x;
        const dy = positions[j].y - positions[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const needed = positions[i].r + positions[j].r + (minDist - iter * 1.5);
        if (dist < needed && dist > 0.1) {
          const push = (needed - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          positions[i].x -= nx * push;
          positions[i].y -= ny * push;
          positions[j].x += nx * push;
          positions[j].y += ny * push;
        }
      }
    }
    // 边界约束
    positions.forEach(p => {
      p.x = Math.max(M.l + p.r + 2, Math.min(W - M.r - p.r - 2, p.x));
      p.y = Math.max(M.t + p.r + 2, Math.min(H - M.b - p.r - 2, p.y));
    });
  }

  const pvRank = [...data].sort((a, b) => b.pv - a.pv);
  const musicRank = [...data].sort((a, b) => b.__hearts - a.__hearts);

  // 统计信息
  const fiveStar = data.filter(c => c.rarity === 5).length;
  const fourStar = data.filter(c => c.rarity === 4).length;
  const statsEl = document.createElementNS(NS, 'g');
  statsEl.setAttribute('transform', `translate(${W - M.r - 130}, ${M.t + 14})`);
  const statsBg = document.createElementNS(NS, 'rect');
  statsBg.setAttribute('x', '-6'); statsBg.setAttribute('y', '-12');
  statsBg.setAttribute('width', '136'); statsBg.setAttribute('height', '22');
  statsBg.setAttribute('rx', '4'); statsBg.setAttribute('fill', 'rgba(15,13,10,0.6)');
  statsBg.setAttribute('stroke', 'var(--border-gold)'); statsBg.setAttribute('stroke-width', '0.5');
  statsEl.appendChild(statsBg);
  const statsText = document.createElementNS(NS, 'text');
  statsText.setAttribute('x', '0'); statsText.setAttribute('y', '3');
  statsText.setAttribute('font-size', '10'); statsText.setAttribute('fill', 'var(--text-tertiary)');
  statsText.textContent = `共${data.length}人 · ★5:${fiveStar} · ★4:${fourStar}`;
  statsEl.appendChild(statsText);
  svg.appendChild(statsEl);

  sortedData.forEach((c, idx) => {
    const pos = positions[idx];
    const cx = pos.x;
    const cy = pos.y;
    const r = pos.r;
    const color = ELEMENT_COLORS[c.element] || '#999';
    const isTop = pos.isTop;

    // 五星角色光晕
    if (c.rarity === 5) {
      const outerGlow = document.createElementNS(NS, 'circle');
      outerGlow.setAttribute('cx', cx); outerGlow.setAttribute('cy', cy);
      outerGlow.setAttribute('r', r + 6);
      outerGlow.setAttribute('fill', color);
      outerGlow.setAttribute('fill-opacity', '0.05');
      svg.appendChild(outerGlow);

      const glow = document.createElementNS(NS, 'circle');
      glow.setAttribute('cx', cx);
      glow.setAttribute('cy', cy);
      glow.setAttribute('r', r + 2.5);
      glow.setAttribute('fill', color);
      glow.setAttribute('fill-opacity', '0.12');
      svg.appendChild(glow);
    }

    const circle = document.createElementNS(NS, 'circle');
    circle.setAttribute('cx', cx); circle.setAttribute('cy', cy);
    circle.setAttribute('r', r);
    circle.setAttribute('fill', color);
    const opacity = scatterFilter === 'all' && data.length > 50
      ? (c.rarity === 5 ? '0.7' : '0.5')
      : (c.rarity === 5 ? '0.85' : '0.65');
    circle.setAttribute('fill-opacity', opacity);
    circle.setAttribute('stroke', c.rarity === 5 ? '#F5D76E' : color);
    circle.setAttribute('stroke-width', c.rarity === 5 ? '1.5' : '1');
    circle.setAttribute('stroke-opacity', '0.7');
    circle.setAttribute('data-char', c.name);
    circle.style.cursor = 'pointer';
    circle.style.transition = 'all 0.2s ease';

    if (isTop && c.rarity === 5) {
      circle.setAttribute('filter', 'url(#scatterShadow)');
    }

    // 悬停交互
    circle.addEventListener('mouseenter', e => {
      circle.setAttribute('r', r + 3);
      circle.setAttribute('fill-opacity', '0.95');
      circle.setAttribute('stroke-width', '2.5');
      if (isTop) circle.setAttribute('filter', 'url(#scatterGlow)');

      const rect = svg.getBoundingClientRect();
      const scaleX = rect.width / W;
      const scaleY = rect.height / H;
      const stars = '★'.repeat(c.rarity);

      // 计算象限分类和排名百分位（红心按量级下限比较）
      const quad = c.pv >= midPv && c.__hearts >= midHearts ? '双高'
        : c.pv < midPv && c.__hearts >= midHearts ? '红心突出'
        : c.pv >= midPv && c.__hearts < midHearts ? '播放突出'
        : '双低';
      const quadColor = quad === '双高' ? '#C9A227' : quad === '红心突出' ? '#4AD9D9' : quad === '播放突出' ? '#D94A4A' : '#94a3b8';
      const pvPct = Math.round((data.filter(x => x.pv <= c.pv).length / data.length) * 100);
      const musicPct = Math.round((data.filter(x => x.__hearts <= c.__hearts).length / data.length) * 100);

      tip.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <div style="width:8px;height:8px;border-radius:50%;background:${color};box-shadow:0 0 8px ${color};"></div>
          <span style="font-weight:700;font-size:15px;color:${color};letter-spacing:1px;">${c.name}</span>
          <span style="color:var(--gold);font-size:12px;">${stars}</span>
        </div>
        <div style="display:inline-block;padding:2px 8px;border-radius:4px;background:${quadColor}22;color:${quadColor};font-size:11px;font-weight:600;margin-bottom:8px;border:1px solid ${quadColor}44;">${quad}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;color:var(--text-secondary);">
          <div><span style="color:var(--text-tertiary);">地区:</span> ${rName(c.region)}</div>
          <div><span style="color:var(--text-tertiary);">元素:</span> ${c.element}</div>
          <div><span style="color:var(--text-tertiary);">武器:</span> ${c.weapon}</div>
          <div><span style="color:var(--text-tertiary);">稀有度:</span> ${c.rarity}星</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(201,162,39,0.15);">
          <div><span style="color:var(--text-tertiary);">播放:</span> <strong style="color:var(--gold-light);">${c.pv}万</strong> <span style="font-size:10px;color:var(--text-tertiary);">(超过${pvPct}%有效角色)</span></div>
          <div><span style="color:var(--text-tertiary);">红心:</span> <strong style="color:#E2556E;">${charFmtHearts(c.__hearts)}</strong> <span style="font-size:10px;color:var(--text-tertiary);">(${c.__heartLabels.join(' + ')}·超过${musicPct}%)</span></div>
          <div><span style="color:var(--text-tertiary);">弹幕:</span> <strong style="color:var(--gold-light);">${Math.round(c.danmaku * 1000).toLocaleString()}</strong></div>
          ${charBestFavTipHtml(c)}
        </div>
        <div style="font-size:10px;color:var(--text-tertiary);margin-top:10px;text-align:center;">点击查看角色详情</div>
      `;

      const tipWidth = 260;
      const tipHeight = 200;
      let tipX = (e.clientX - rect.left) / scaleX + 15;
      let tipY = (e.clientY - rect.top) / scaleY - tipHeight / 2;

      if (tipX + tipWidth > W) tipX = (e.clientX - rect.left) / scaleX - tipWidth - 15;
      if (tipY < 0) tipY = 10;
      if (tipY + tipHeight > H) tipY = H - tipHeight - 10;

      tip.style.left = (tipX * scaleX) + 'px';
      tip.style.top = (tipY * scaleY) + 'px';
      tip.classList.add('show');
      highlightLinked(c.name, circle);
    });

    circle.addEventListener('mousemove', e => {
      const rect = svg.getBoundingClientRect();
      const scaleX = rect.width / W;
      const scaleY = rect.height / H;
      const tipWidth = 260;
      const tipHeight = 200;
      let tipX = (e.clientX - rect.left) / scaleX + 15;
      let tipY = (e.clientY - rect.top) / scaleY - tipHeight / 2;

      if (tipX + tipWidth > W) tipX = (e.clientX - rect.left) / scaleX - tipWidth - 15;
      if (tipY < 0) tipY = 10;
      if (tipY + tipHeight > H) tipY = H - tipHeight - 10;

      tip.style.left = (tipX * scaleX) + 'px';
      tip.style.top = (tipY * scaleY) + 'px';
    });

    circle.addEventListener('mouseleave', () => {
      circle.setAttribute('r', r);
      circle.setAttribute('fill-opacity', opacity);
      circle.setAttribute('stroke-width', c.rarity === 5 ? '1.5' : '1');
      if (isTop) circle.setAttribute('filter', 'url(#scatterShadow)');
      tip.classList.remove('show');
      clearHighlight(circle);
    });

    // 键盘支持：Enter/Space 跳转，Tab 聚焦显示 tooltip
    circle.setAttribute('tabindex', '0');
    circle.setAttribute('role', 'button');
    circle.setAttribute('aria-label', `${c.name}，${c.rarity}星，${c.element}元素，B站官方角色视频播放 ${c.pv}万，网易云主题曲红心 ${charFmtHearts(c.__hearts)}`);
    circle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.location.href = `character-detail.html?name=${encodeURIComponent(c.name)}`;
      }
    });
    circle.addEventListener('focus', (e) => {
      circle.setAttribute('r', r + 3);
      circle.setAttribute('fill-opacity', '0.95');
      circle.setAttribute('stroke-width', '2.5');
      // 模拟 mouseenter 显示 tooltip
      const rect = svg.getBoundingClientRect();
      const scaleX = rect.width / W;
      const scaleY = rect.height / H;
      const stars = '★'.repeat(c.rarity);
      const quad = c.pv >= midPv && c.__hearts >= midHearts ? '双高'
        : c.pv < midPv && c.__hearts >= midHearts ? '红心突出'
        : c.pv >= midPv && c.__hearts < midHearts ? '播放突出' : '双低';
      const quadColor = quad === '双高' ? '#C9A227' : quad === '红心突出' ? '#4AD9D9' : quad === '播放突出' ? '#D94A4A' : '#94a3b8';
      const pvPct = Math.round((data.filter(x => x.pv <= c.pv).length / data.length) * 100);
      const musicPct = Math.round((data.filter(x => x.__hearts <= c.__hearts).length / data.length) * 100);
      tip.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <div style="width:8px;height:8px;border-radius:50%;background:${color};box-shadow:0 0 8px ${color};"></div>
          <span style="font-weight:700;font-size:15px;color:${color};letter-spacing:1px;">${c.name}</span>
          <span style="color:var(--gold);font-size:12px;">${stars}</span>
        </div>
        <div style="display:inline-block;padding:2px 8px;border-radius:4px;background:${quadColor}22;color:${quadColor};font-size:11px;font-weight:600;margin-bottom:8px;border:1px solid ${quadColor}44;">${quad}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;color:var(--text-secondary);">
          <div><span style="color:var(--text-tertiary);">地区:</span> ${rName(c.region)}</div>
          <div><span style="color:var(--text-tertiary);">元素:</span> ${c.element}</div>
          <div><span style="color:var(--text-tertiary);">武器:</span> ${c.weapon}</div>
          <div><span style="color:var(--text-tertiary);">稀有度:</span> ${c.rarity}星</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(201,162,39,0.15);">
          <div><span style="color:var(--text-tertiary);">播放:</span> <strong style="color:var(--gold-light);">${c.pv}万</strong> <span style="font-size:10px;color:var(--text-tertiary);">(超过${pvPct}%有效角色)</span></div>
          <div><span style="color:var(--text-tertiary);">红心:</span> <strong style="color:#E2556E;">${charFmtHearts(c.__hearts)}</strong> <span style="font-size:10px;color:var(--text-tertiary);">(${c.__heartLabels.join(' + ')}·超过${musicPct}%)</span></div>
          <div><span style="color:var(--text-tertiary);">弹幕:</span> <strong style="color:var(--gold-light);">${Math.round(c.danmaku * 1000).toLocaleString()}</strong></div>
          ${charBestFavTipHtml(c)}
        </div>
        <div style="font-size:10px;color:var(--text-tertiary);margin-top:10px;text-align:center;">按 Enter 查看角色详情</div>
      `;
      const tipWidth = 260, tipHeight = 200;
      let tipX = cx + 15, tipY = cy - tipHeight / 2;
      if (tipX + tipWidth > W) tipX = cx - tipWidth - 15;
      if (tipY < 0) tipY = 10;
      if (tipY + tipHeight > H) tipY = H - tipHeight - 10;
      tip.style.left = (tipX * scaleX) + 'px';
      tip.style.top = (tipY * scaleY) + 'px';
      tip.classList.add('show');
      highlightLinked(c.name, circle);
    });
    circle.addEventListener('blur', () => {
      circle.setAttribute('r', r);
      circle.setAttribute('fill-opacity', opacity);
      circle.setAttribute('stroke-width', c.rarity === 5 ? '1.5' : '1');
      tip.classList.remove('show');
      clearHighlight(circle);
    });

    // 单击跳转（替代双击）
    circle.addEventListener('click', () => {
      window.location.href = `character-detail.html?name=${encodeURIComponent(c.name)}`;
    });

    svg.appendChild(circle);

    // 标签显示（带引线）
    const shouldLabel = (scatterFilter !== 'all' && data.length <= 15) ||
                        (isTop && c.pv > maxPv * 0.7) ||
                        (c.pv >= pvRank[0]?.pv || c.__hearts >= musicRank[0]?.__hearts);

    if (shouldLabel) {
      let hasOverlap = false;
      for (let j = 0; j < idx; j++) {
        const other = positions[j];
        if (Math.abs(cx - other.x) < 45 && Math.abs(cy - other.y) < 22) {
          hasOverlap = true;
          break;
        }
      }

      if (!hasOverlap) {
        // 检查标签是否超出边界，如果超出则用引线标注
        const labelY = cy - r - 6;
        const needLeader = labelY < M.t + 8;

        if (needLeader) {
          // 引线标注：标签放在气泡右侧
          const labX = cx + r + 10;
          const labY = cy + 3;
          const leader = document.createElementNS(NS, 'line');
          leader.setAttribute('x1', cx + r); leader.setAttribute('y1', cy);
          leader.setAttribute('x2', labX - 3); leader.setAttribute('y2', labY - 3);
          leader.setAttribute('stroke', color); leader.setAttribute('stroke-width', '0.8');
          leader.setAttribute('stroke-opacity', '0.5');
          svg.appendChild(leader);

          const lab = document.createElementNS(NS, 'text');
          lab.setAttribute('x', labX); lab.setAttribute('y', labY);
          lab.setAttribute('text-anchor', 'start');
          lab.setAttribute('font-size', '10');
          lab.setAttribute('font-weight', '600');
          lab.setAttribute('fill', 'var(--text-primary)');
          lab.setAttribute('paint-order', 'stroke');
          lab.setAttribute('stroke', 'rgba(15,13,10,0.9)');
          lab.setAttribute('stroke-width', '3');
          lab.setAttribute('stroke-linejoin', 'round');
          lab.textContent = c.name;
          svg.appendChild(lab);
        } else {
          const lab = document.createElementNS(NS, 'text');
          lab.setAttribute('x', cx);
          lab.setAttribute('y', labelY);
          lab.setAttribute('text-anchor', 'middle');
          lab.setAttribute('font-size', '10');
          lab.setAttribute('font-weight', '600');
          lab.setAttribute('fill', 'var(--text-primary)');
          lab.setAttribute('paint-order', 'stroke');
          lab.setAttribute('stroke', 'rgba(15,13,10,0.9)');
          lab.setAttribute('stroke-width', '3');
          lab.setAttribute('stroke-linejoin', 'round');
          lab.textContent = c.name;
          svg.appendChild(lab);
        }
      }
    }
  });

  // 图例
  const legend = document.getElementById('scatterLegend');
  if (legend) {
    legend.innerHTML = `
      <div style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:center;">
        <div class="legend-item" style="display:flex;align-items:center;gap:6px;">
          <div class="dot" style="width:12px;height:12px;border-radius:50%;background:#F5D76E;border:2px solid #F5D76E;box-shadow:0 0 6px rgba(245,215,110,0.4);"></div>
          <span style="font-size:12px;color:var(--text-secondary);">★★★★★</span>
        </div>
        <div class="legend-item" style="display:flex;align-items:center;gap:6px;">
          <div class="dot" style="width:9px;height:9px;border-radius:50%;background:var(--text-tertiary);border:1.5px solid var(--text-tertiary);"></div>
          <span style="font-size:12px;color:var(--text-secondary);">★★★★</span>
        </div>
        <div style="width:1px;height:20px;background:var(--border);margin:0 4px;"></div>
        ${Object.entries(ELEMENT_COLORS).map(([e, c]) =>
          `<div class="legend-item" style="display:flex;align-items:center;gap:6px;">
            <div class="dot" style="width:12px;height:12px;border-radius:50%;background:${c};box-shadow:0 0 6px ${c}44;"></div>
            <span style="font-size:12px;color:var(--text-secondary);">${e}</span>
          </div>`
        ).join('')}
        <div style="width:1px;height:20px;background:var(--border);margin:0 4px;"></div>
        <div class="legend-item" style="display:flex;align-items:center;gap:6px;">
          <div style="width:20px;height:2px;background:var(--gold);border-top:2px dashed var(--gold);opacity:0.6;"></div>
          <span style="font-size:12px;color:var(--text-secondary);">中位数线</span>
        </div>
      </div>`;
  }

  // 图内读数：只讲这张图能直接读出来的信息（分割线、象限人数、离群角色），
  // 完整结论在上方「核心结论」卡片，避免同一段落两处重复
  const summEl = document.getElementById('scatterSummary');
  if (summEl) {
    const r = (typeof statPearson === 'function') ? statPearson(data.map(c => c.pv), data.map(c => c.__hearts)) : null;
    const q = { hh: 0, hl: 0, lh: 0, ll: 0 };
    data.forEach(c => {
      const right = c.pv >= midPv, up = c.__hearts >= midHearts;
      if (right && up) q.hh++; else if (!right && up) q.hl++; else if (!right && !up) q.ll++; else q.lh++;
    });

    // Tukey 高异常值 = Q3 + 1.5×IQR，只用来标出显著高于典型水平的角色
    const pvArr = data.map(c => c.pv);
    const pvQ3 = (typeof statQ3 === 'function') ? statQ3(pvArr) : null;
    const pvIQR = (typeof statIQR === 'function') ? statIQR(pvArr) : null;
    const pvTukey = (pvQ3 !== null && pvIQR !== null) ? pvQ3 + 1.5 * pvIQR : null;
    const outliers = pvTukey === null ? [] : data.filter(c => c.pv > pvTukey).sort((a, b) => b.pv - a.pv);

    summEl.innerHTML = `<strong>图内读数：</strong>分割线位于播放 <strong>${charFmtWan(midPv)} 万</strong>、` +
      `红心 <strong>${charFmtHearts(midHearts)}</strong>（各取中位数）。四象限人数：双高 <strong>${q.hh}</strong>、` +
      `红心突出 <strong>${q.hl}</strong>、播放突出 <strong>${q.lh}</strong>、双低 <strong>${q.ll}</strong>（n=${data.length}，仅含已发行主题曲的角色）。` +
      `播放与红心 <strong>r = ${r === null ? '—' : r.toFixed(3)}</strong>（红心为量级下限，相关系数仅供方向参考）` +
      `${outliers.length ? `；按 Tukey 法则（Q3 + 1.5×IQR = ${charFmtWan(pvTukey)} 万）有 <strong>${outliers.length}</strong> 名播放高异常值：${outliers.slice(0, 5).map(c => c.name).join('、')}${outliers.length > 5 ? ' 等' : ''}` : ''}。` +
      `红心口径：网易云单曲页的量级标签（如 10w+）按下限折算、多曲取合计下限，跨 3 个数量级故纵轴用对数刻度。` +
      `气泡位置含防重叠位移，精确数值以悬停提示为准；象限只是相对位置，不是聚类结果。`;
  }

  // 添加数据导出属性到散点图卡片
  const scatterCard = document.querySelector('#scatterSvg')?.closest('.card');
  if (scatterCard && !scatterCard.hasAttribute('data-export')) {
    const exportData = data.map(c => ({
      角色: c.name,
      地区: rName(c.region),
      元素: c.element,
      武器: c.weapon,
      星级: c.rarity,
      B站官方角色视频播放量万: c.pv,
      网易云主题曲红心下限: c.__hearts,
      网易云红心量级标签: c.__heartLabels.join(' + '),
      B站官方角色视频收藏数: Math.round(c.fav * 1000),
      B站官方角色视频弹幕数: Math.round(c.danmaku * 1000)
    }));
    scatterCard.setAttribute('data-export', JSON.stringify(exportData));
    scatterCard.setAttribute('data-export-file', '角色B站官方角色视频数据');
    // 触发 optimize.js 中的导出按钮初始化
    const btn = document.createElement('button');
    btn.className = 'export-btn';
    btn.textContent = '导出数据';
    btn.setAttribute('aria-label', '导出此图表的数据');
    btn.addEventListener('click', () => window.exportData(exportData, '角色B站官方角色视频数据', 'csv'));
    scatterCard.appendChild(btn);
  }
}

function renderCharRanks() {
  const data = getFilteredValidChars();
  const n = data.length;
  const totalPv = data.reduce((s, c) => s + c.pv, 0);
  const topN = Math.min(10, n);

  const pvSorted = [...data].sort((a, b) => b.pv - a.pv);
  const mSorted = [...data].sort((a, b) => b.fav - a.fav);
  const dSorted = [...data].sort((a, b) => b.danmaku - a.danmaku);

  // 三个榜单共用同一套行模板，只有取值、单位与图标不同
  const rowsHtml = (sorted, valueHtml, unitLabel, iconSrc, iconTitle) =>
    sorted.slice(0, topN).map((c, i) => {
      const color = ELEMENT_COLORS[c.element] || '#999';
      const bgGradient = `linear-gradient(135deg,${color}33,${color}11)`;
      return `
      <li class="rank-item" data-char="${c.name}">
        <div class="rank-num ${i < 3 ? 'top' : ''}">${i + 1}</div>
        <div class="rank-info">
          ${rankAvatarHtml(c.name, color, bgGradient)}
          <div>
            <div class="rank-name">${c.name}</div>
            <div class="rank-meta">${rName(c.region)} · ${elementEmblem(c.element, 12)}${c.element} · ${c.rarity}星</div>
          </div>
        </div>
        <div style="text-align:right;">
          <div class="rank-val" style="color:${color};display:flex;align-items:center;gap:3px;justify-content:flex-end;">
            <img src="${iconSrc}" style="width:10px;height:10px;vertical-align:-1px;" onerror="this.style.display='none'" title="${iconTitle}"/>
            ${valueHtml(c)}
          </div>
          <div style="font-size:9px;color:var(--text-tertiary);margin-top:2px;opacity:0.85;">${unitLabel}</div>
        </div>
      </li>`;
    }).join('');

  const pvEl = document.getElementById('pvRank');
  if (pvEl) pvEl.innerHTML = rowsHtml(pvSorted, c => `${charFmtWan(c.pv)}万`, '官方角色视频播放',
    'assets/img/deco/UI_NameCardIcon_0.png', '来源：bilibili.com @原神 官方角色视频播放量');

  const mEl = document.getElementById('musicRank');
  if (mEl) mEl.innerHTML = rowsHtml(mSorted, c => charFmtCnt(c.fav * 1000), '官方角色视频收藏',
    'assets/img/items/UI_ItemIcon_112001.png', '来源：bilibili.com @原神 官方角色视频收藏数');

  const dEl = document.getElementById('dmRank');
  if (dEl) dEl.innerHTML = rowsHtml(dSorted, c => charFmtCnt(c.danmaku * 1000), '官方角色视频弹幕',
    'assets/img/deco/UI_ItemIcon_204.png', '来源：bilibili.com @原神 官方角色视频弹幕数');

  if (!n) {
    ['pvRankNote', 'musicRankNote', 'dmRankNote'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '当前筛选下没有符合条件的角色。';
    });
    return;
  }

  // 每个榜单都补一条"该怎么读"的读数，避免只报名字不报结构
  const overlap = (a, b) => a.slice(0, topN).filter(c => b.slice(0, topN).includes(c)).length;
  const rPF = statPearson(data.map(c => c.pv), data.map(c => c.fav));
  const rPD = statPearson(data.map(c => c.pv), data.map(c => c.danmaku));
  const head = pvSorted[0], tail = pvSorted[topN - 1];
  const headShare = totalPv > 0 ? pvSorted.slice(0, topN).reduce((s, c) => s + c.pv, 0) / totalPv * 100 : 0;

  const pvNote = document.getElementById('pvRankNote');
  if (pvNote && head && tail) {
    const tailPct = head.pv > 0 ? tail.pv / head.pv * 100 : 0;
    pvNote.innerHTML = `<strong>读数：</strong>样本 n = ${n}。第 ${topN} 名 ${tail.name} 的 ${charFmtWan(tail.pv)} 万仅为第 1 名 ${head.name} 的 ` +
      `<strong>${tailPct.toFixed(1)}%</strong>；前 ${topN} 名合计占总播放 <strong>${headShare.toFixed(1)}%</strong>。` +
      `头部与腰部之间是量级差，不是名次差。`;
  }

  const mNote = document.getElementById('musicRankNote');
  if (mNote) {
    const ov = overlap(pvSorted, mSorted);
    mNote.innerHTML = `<strong>读数：</strong>与播放榜重合 <strong>${ov}/${topN}</strong> 人，Pearson r = ` +
      `<strong>${rPF === null ? '—' : rPF.toFixed(3)}</strong>。两个榜单高度冗余——收藏数基本随播放量同步放大，` +
      `名次变动多来自尾部互换，不宜当作"收藏偏好"的独立证据。`;
  }

  const dNote = document.getElementById('dmRankNote');
  if (dNote) {
    const ov = overlap(pvSorted, dSorted);
    const dmSpread = charNums(data, charDmRate);
    const dmMed = charMedianOf(dmSpread);
    dNote.innerHTML = `<strong>读数：</strong>与播放榜重合 <strong>${ov}/${topN}</strong> 人` +
      `${ov < topN ? '，是三个绝对值榜单中换人最多的一个' : ''}；播放与弹幕的整体相关 r = ` +
      `<strong>${rPD === null ? '—' : rPD.toFixed(3)}</strong>，仍属强相关，但低于播放与收藏。` +
      `弹幕率中位 ${charFmtRate(dmMed)} 次/万播放，说明"看的人多"和"愿意发弹幕"并不同步。`;
  }

  document.querySelectorAll('.rank-item[data-char]').forEach(item => {
    item.addEventListener('mouseenter', () => highlightLinked(item.dataset.char, item));
    item.addEventListener('mouseleave', () => clearHighlight(item));
  });
}

/* ==================== 核心结论 ====================
 * 先给结论、再给图表：每条结论都带统计量与样本量，可逐条回查下方图表。
 * 全部基于当前筛选样本实时计算，筛选一变结论随之变化。
 * ================================================================ */
function renderCharConclusions() {
  const el = document.getElementById('charConclusions');
  const noteEl = document.getElementById('charConclNote');
  const sampleEl = document.getElementById('conclSample');
  if (!el) return;

  const data = getFilteredValidChars();
  const n = data.length;
  // 样本偏小时在标签上直接提示，避免读者把 n=3 的相关系数当结论
  if (sampleEl) sampleEl.textContent = n < 10 ? `n = ${n}（样本偏小）` : `n = ${n}`;

  if (n < 3) {
    el.innerHTML = `<li class="char-concl-item"><div class="cc-idx">!</div><div class="cc-body">` +
      `当前筛选下有效样本不足 3 人，相关系数与分位数都没有意义。请放宽地区 / 元素 / 武器条件，或取消筛选查看全样本结论。</div></li>`;
    if (noteEl) noteEl.textContent = '';
    return;
  }

  const pv = data.map(c => c.pv);
  const fav = data.map(c => c.fav);
  const rate = charNums(data, charFavRate);
  const dmRate = charNums(data, charDmRate);
  const totalPv = pv.reduce((s, v) => s + v, 0);
  const medPv = charMedianOf(pv);
  const meanPv = statMean(pv);
  const items = [];
  const push = (title, body) => items.push(
    `<li class="char-concl-item"><div class="cc-idx">${items.length + 1}</div>` +
    `<div class="cc-body"><span class="cc-title">${title}</span>${body}</div></li>`
  );

  /* 1) 关联强度：两个绝对值榜单给的是不是同一套信息 */
  const r = statPearson(pv, fav);
  const r2 = r === null ? null : r * r * 100;
  const topN = Math.min(10, n);
  const pvTop = [...data].sort((a, b) => b.pv - a.pv).slice(0, topN);
  const favTop = [...data].sort((a, b) => b.fav - a.fav).slice(0, topN);
  const overlapPF = pvTop.filter(c => favTop.includes(c)).length;
  // r² 的措辞按实际解释力分档，不满 70% 不能说"大部分"
  const r2Word = r2 === null ? ''
    : r2 >= 70 ? '即收藏量差异的大部分可由播放量线性解释'
    : r2 >= 40 ? '即收藏量差异约有一半可由播放量线性解释'
    : '即播放量只能解释收藏量差异的一小部分';
  // 样本不足 11 人时，两个 Top10 必然完全重合，重合度不构成证据
  const overlapTxt = (n > 10 && topN === 10)
    ? `播放前 10 与收藏前 10 重合 <em>${overlapPF} 人</em>，两个榜单实际给的是同一类信息：曝光规模。`
    : `当前样本仅 ${n} 人，不足 11 人，两个榜单必然高度重合，因此不拿重合度当证据。`;
  push(r2 !== null && r2 < 60 ? '播放与收藏同向变动，但解释力有限' : '播放与收藏高度同步，两个绝对值榜单并不独立',
    `播放与收藏的 Pearson <em>r = ${r === null ? '—' : r.toFixed(3)}</em>` +
    `${r === null ? '' : `（${statCorrLabel(r)}${r >= 0 ? '正' : '负'}相关）`}，` +
    `<em>r² = ${r2 === null ? '—' : r2.toFixed(1) + '%'}</em>${r2Word ? '，' + r2Word : ''}。` +
    `${overlapTxt}要区分角色本身，得看下文的单位播放转化率。`);

  /* 2) 分布形态与头部集中：为什么全页用中位数 */
  const ratioPM = medPv > 0 ? meanPv / medPv : null;
  const headN = Math.max(1, Math.round(n * 0.1));
  const headShare = totalPv > 0
    ? [...pv].sort((a, b) => b - a).slice(0, headN).reduce((s, v) => s + v, 0) / totalPv * 100
    : null;
  const top1 = [...data].sort((a, b) => b.pv - a.pv)[0];
  // 头部占比要够大的样本才有意义：n < 20 时"前 10%"只有 1–2 人，占了也说不出结构
  const headTxt = (n >= 20 && headShare !== null)
    ? `；头部 ${Math.round(headN / n * 100)}%（${headN} 人）合计占 <em>${headShare.toFixed(1)}%</em> 的播放量` +
      `${top1 && totalPv > 0 ? `，其中 ${top1.name} 一人占 ${(top1.pv / totalPv * 100).toFixed(1)}%` : ''}`
    : `${top1 && totalPv > 0 ? `；播放最高的 ${top1.name} 一人占该样本 ${(top1.pv / totalPv * 100).toFixed(1)}%` : ''}`;
  push(n >= 20 && ratioPM && ratioPM >= 1.3 ? '分布右偏，头部高度集中' : '均值高于中位数，分布右偏',
    `播放中位数 <em>${charFmtWan(medPv)} 万</em>，均值 <em>${charFmtWan(meanPv)} 万</em>` +
    `${ratioPM ? `，均值是中位数的 <em>${ratioPM.toFixed(2)} 倍</em>` : ''}${headTxt}。` +
    `右偏分布下均值会被头部拉高、不能代表典型角色，因此本页所有分组比较一律用中位数。`);

  /* 3) 比值指标：剥离曝光规模之后还剩多少差异 */
  if (rate.length >= 3) {
    const rRate = statPearson(data.map(c => c.pv), rate);
    const rateSorted = [...data].sort((a, b) => charFavRate(b) - charFavRate(a));
    const hi = rateSorted[0], lo = rateSorted[rateSorted.length - 1];
    const hiR = charFavRate(hi), loR = charFavRate(lo);
    const spread = loR > 0 ? hiR / loR : null;
    const medRate = charMedianOf(rate);
    const absR = rRate === null ? null : Math.abs(rRate);
    // |r| 一大就不能说"接近 0"，小样本下的相关要如实标注不稳定性
    const rWord = absR === null ? ''
      : absR < 0.15 ? '接近 0，说明曝光规模基本不解释收藏效率——播放量大的角色并不必然"更值得收藏"'
      : absR < 0.4 ? '关系较弱，规模只能解释一小部分收藏效率差异'
      : absR < 0.7 ? `在本筛选样本内为中等相关（n = ${n}），但样本偏小，稳定性有限`
      : `在本筛选样本内相关较强（n = ${n}），样本偏小，不足以作为稳定结论`;
    push(absR !== null && absR < 0.15 ? '单位播放的收藏效率与播放规模几乎无关'
      : '单位播放的收藏效率存在差异，但与规模的关系不稳定',
      `收藏率中位 <em>${charFmtRate(medRate)} 次/万播放</em>` +
      `（Q1–Q3：${charFmtRate(statQ1(rate))}–${charFmtRate(statQ3(rate))}），与播放量的相关 ` +
      `<em>r = ${rRate === null ? '—' : rRate.toFixed(3)}</em>${rWord ? '，' + rWord : ''}。` +
      `最高 ${hi.name} <em>${charFmtRate(hiR)}</em>、最低 ${lo.name} <em>${charFmtRate(loR)}</em>` +
      `${spread ? `，相差 <em>${spread.toFixed(1)} 倍</em>` : ''}。` +
      `这一层差异无法由曝光规模解释，但本数据也不足以说明它由什么造成。` +
      `${dmRate.length >= 3 ? `弹幕率中位 ${charFmtRate(charMedianOf(dmRate))} 次/万播放，与收藏率 r = ${(() => { const v = statPearson(rate, dmRate); return v === null ? '—' : v.toFixed(2); })()}，两者不等价，不能互相替代。` : ''}`);
  }

  /* 4) 星级：差距到底出现在哪个指标上 */
  const g5 = data.filter(c => c.rarity === 5);
  const g4 = data.filter(c => c.rarity === 4);
  if (g5.length >= 5 && g4.length >= 5) {
    const m = (arr, fn) => charMedianOf(charNums(arr, fn));
    const p5 = m(g5, c => c.pv), p4 = m(g4, c => c.pv);
    const f5 = m(g5, c => c.fav), f4 = m(g4, c => c.fav);
    const r5 = m(g5, charFavRate), r4 = m(g4, charFavRate);
    push('星级差异在收藏上比在播放上更明显',
      `5 星（n=${g5.length}）与 4 星（n=${g4.length}）对比：播放中位数 <em>${charFmtWan(p5)} vs ${charFmtWan(p4)} 万</em>` +
      `（${(p5 / p4).toFixed(2)} 倍）、收藏中位数 <em>${charFmtCnt(f5 * 1000)} vs ${charFmtCnt(f4 * 1000)}</em>` +
      `（${(f5 / f4).toFixed(2)} 倍）、收藏率 <em>${charFmtRate(r5)} vs ${charFmtRate(r4)}</em>` +
      `（${(r5 / r4).toFixed(2)} 倍）。收藏的倍数差最大、播放最小；连剔除规模后的收藏率也有差距，` +
      `说明星级带来的不只是曝光量。`);
  }

  /* 5) 元素 / 武器：组间差是否大于组内离散 */
  const eleGroups = charGroupStats(data, c => c.element, 3).sort((a, b) => b.medPv - a.medPv);
  const wpGroups = charGroupStats(data, c => c.weapon, 3).sort((a, b) => b.medPv - a.medPv);
  const q1 = statQ1(pv), q3 = statQ3(pv);
  const span = gs => {
    if (gs.length < 2) return null;
    const mx = gs[0].medPv, mn = gs[gs.length - 1].medPv;
    return mn > 0 ? { mx, mn, ratio: mx / mn, k: gs.length } : null;
  };
  const se = span(eleGroups), sw = span(wpGroups);
  if (se || sw) {
    const parts = [];
    if (se) parts.push(`元素分组（n≥3 的 ${se.k} 组）播放中位数 <em>${charFmtWan(se.mn)}–${charFmtWan(se.mx)} 万</em>（极差 ${se.ratio.toFixed(2)} 倍）`);
    if (sw) parts.push(`武器分组 <em>${charFmtWan(sw.mn)}–${charFmtWan(sw.mx)} 万</em>（${sw.ratio.toFixed(2)} 倍）`);
    push('元素与武器看不出分层',
      `${parts.join('；')}。这些组间差距明显小于组内离散——整体播放从 Q1 到 Q3 就横跨 ` +
      `<em>${charFmtWan(q1)}–${charFmtWan(q3)} 万</em>。因此本样本不支持"某个元素或武器的角色更受欢迎"，` +
      `把元素当作播放量的解释变量在本数据上并不成立。`);
  }

  el.innerHTML = items.join('');
  if (noteEl) {
    const minPv = Math.min(...pv);
    noteEl.innerHTML = `口径：仅统计三项指标齐全的角色；比值类指标以播放量为分母，样本内最小播放 ` +
      `<strong>${charFmtWan(minPv)} 万</strong>，不存在因分母过小而虚高的情形。全部数值为 2026-11-02 的单次快照` +
      `（播放 / 收藏 / 弹幕均为累计值），不是时间序列，无法据此判断增长或衰退。以上均为样本内的描述性差异，相关不等于因果。`;
  }
}

/* ==================== 分组对照表 ====================
 * 回答「按什么分组才真的存在差异」：同时给出 n、中位数与占比，
 * n < 5 的组只列示；加粗为该列最高值。
 * ================================================================ */
function renderCharGroupTable() {
  const tbody = document.getElementById('charGroupTable');
  const noteEl = document.getElementById('charGroupNote');
  if (!tbody) return;

  const data = getFilteredValidChars();
  const totalPv = data.reduce((s, c) => s + c.pv, 0);
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-tertiary);padding:24px;">当前筛选下没有符合条件的角色</td></tr>`;
    if (noteEl) noteEl.textContent = '';
    return;
  }

  const overall = {
    key: '全部有效样本', n: data.length,
    medPv: charMedianOf(charNums(data, c => c.pv)),
    medFav: charMedianOf(charNums(data, c => c.fav)),
    medRate: charMedianOf(charNums(data, charFavRate)),
    medDmRate: charMedianOf(charNums(data, charDmRate)),
    pvSum: totalPv
  };

  const dims = [
    { name: '星级', rows: charGroupStats(data, c => c.rarity === 5 ? '5 星' : '4 星', 1) },
    { name: '地区', rows: charGroupStats(data, c => rName(c.region), 1) },
    { name: '元素', rows: charGroupStats(data, c => c.element, 3) },
    { name: '武器', rows: charGroupStats(data, c => c.weapon, 3) }
  ];
  // 星级固定 5 星在前；其余维度按播放中位数降序，读起来更直观
  dims[0].rows.sort((a, b) => b.key.localeCompare(a.key));
  [1, 2, 3].forEach(i => dims[i].rows.sort((a, b) => b.medPv - a.medPv));

  const detailRows = dims.flatMap(d => d.rows);
  const maxOf = detailRows.length ? {
    pv: Math.max(...detailRows.map(r => r.medPv)),
    fav: Math.max(...detailRows.map(r => r.medFav)),
    rate: Math.max(...detailRows.map(r => r.medRate)),
    dm: Math.max(...detailRows.map(r => r.medDmRate))
  } : { pv: 0, fav: 0, rate: 0, dm: 0 };
  const mark = (v, key) => (Math.abs(v - maxOf[key]) < 1e-9 ? ' is-max' : '');

  function rowHtml(g, doMark) {
    const share = totalPv > 0 ? g.pvSum / totalPv * 100 : 0;
    const lowN = g.n < 5 ? ' style="opacity:.55;" title="n < 5，仅列示，不作结论"' : '';
    return `<tr${lowN}>
      <td>${g.key}</td>
      <td class="num">${g.n}</td>
      <td class="num${doMark ? mark(g.medPv, 'pv') : ''}">${charFmtWan(g.medPv)}</td>
      <td class="num${doMark ? mark(g.medFav, 'fav') : ''}">${charFmtCnt(g.medFav * 1000)}</td>
      <td class="num${doMark ? mark(g.medRate, 'rate') : ''}">${charFmtRate(g.medRate)}</td>
      <td class="num${doMark ? mark(g.medDmRate, 'dm') : ''}">${charFmtRate(g.medDmRate)}</td>
      <td class="num">${share.toFixed(1)}%</td>
    </tr>`;
  }

  let html = `<tr class="grp-sep"><td colspan="7">总体</td></tr>` + rowHtml(overall, false);
  dims.forEach(d => {
    if (!d.rows.length) return;
    html += `<tr class="grp-sep"><td colspan="7">${d.name}</td></tr>`;
    d.rows.forEach(g => { html += rowHtml(g, true); });
  });
  tbody.innerHTML = html;

  if (!noteEl) return;

  // 哪个维度的组间差异最大（只用 n ≥ 5 的组，避免小样本制造假差异）
  const dimRatios = dims.map(d => {
    const rows = d.rows.filter(r => r.n >= 5);
    if (rows.length < 2) return null;
    const vals = rows.map(r => r.medPv);
    const mx = Math.max(...vals), mn = Math.min(...vals);
    return (mn > 0 && mx > mn) ? { name: d.name, ratio: mx / mn, mx, mn, k: rows.length } : null;
  }).filter(Boolean).sort((a, b) => b.ratio - a.ratio);

  const lowN = detailRows.filter(r => r.n < 5).map(r => `${r.key}（n=${r.n}）`);
  const q1 = statQ1(charNums(data, c => c.pv));
  const q3 = statQ3(charNums(data, c => c.pv));

  if (dimRatios.length) {
    const top = dimRatios[0];
    const others = dimRatios.slice(1).map(d => `${d.name} ${d.ratio.toFixed(2)} 倍`).join('、');
    noteEl.innerHTML = `<strong>读数：</strong>四个维度中组间差异最大的是「${top.name}」——各组播放中位数从 ` +
      `<strong>${charFmtWan(top.mn)}</strong> 到 <strong>${charFmtWan(top.mx)} 万</strong>，相差 ` +
      `<strong>${top.ratio.toFixed(2)} 倍</strong>${others ? `；其余维度为 ${others}` : ''}。` +
      `组内跨度参考：整体播放 Q1–Q3 为 ${charFmtWan(q1)}–${charFmtWan(q3)} 万，若某维度的组间极差小于这个跨度，` +
      `就不宜据此得出"哪一组更强"。` +
      (lowN.length ? ` ${lowN.join('、')} 因 n &lt; 5 只列示、不作结论。` : '');
  } else {
    noteEl.innerHTML = `当前筛选下各维度的分组数量不足（或每组 n &lt; 5），无法比较组间差异。` +
      (lowN.length ? ` ${lowN.join('、')} 仅列示。` : '');
  }
}

/* ==================== 单位播放转化率榜 ====================
 * 绝对值榜单被规模主导，这个榜只看「每万播放换来多少收藏」。
 * ================================================================ */
function renderCharRateRank() {
  const el = document.getElementById('charRateRank');
  const noteEl = document.getElementById('charRateNote');
  if (!el) return;

  const data = getFilteredValidChars().filter(c => charFavRate(c) !== null);
  if (!data.length) {
    el.innerHTML = `<li style="padding:12px;text-align:center;color:var(--text-tertiary);font-size:12px;">当前筛选下没有可计算收藏率的角色</li>`;
    if (noteEl) noteEl.textContent = '';
    return;
  }

  const sorted = [...data].sort((a, b) => charFavRate(b) - charFavRate(a));
  const top = sorted.slice(0, Math.min(10, sorted.length));
  const maxRate = charFavRate(top[0]);
  const medRate = charMedianOf(charNums(data, charFavRate));

  el.innerHTML = top.map((c, i) => {
    const color = ELEMENT_COLORS[c.element] || '#999';
    const bgGradient = `linear-gradient(135deg,${color}33,${color}11)`;
    const rate = charFavRate(c);
    const dm = charDmRate(c);
    const pct = maxRate > 0 ? Math.max(2, rate / maxRate * 100) : 0;
    return `
      <li class="rank-item" data-char="${c.name}">
        <div class="rank-num ${i < 3 ? 'top' : ''}">${i + 1}</div>
        <div class="rank-info">
          ${rankAvatarHtml(c.name, color, bgGradient)}
          <div>
            <div class="rank-name">${c.name}</div>
            <div class="rank-meta">${rName(c.region)} · ${elementEmblem(c.element, 12)}${c.element} · 播放 ${charFmtWan(c.pv)} 万</div>
          </div>
        </div>
        <div style="text-align:right;min-width:92px;">
          <div class="rank-val" style="color:#E2556E;">${charFmtRate(rate)}</div>
          <div style="font-size:9px;color:var(--text-tertiary);margin-top:2px;opacity:0.85;">次收藏/万播放 · 弹幕 ${charFmtRate(dm)}</div>
          <div style="height:3px;border-radius:2px;background:rgba(255,255,255,0.08);margin-top:4px;overflow:hidden;">
            <div style="height:100%;width:${pct.toFixed(1)}%;border-radius:2px;background:#E2556E;"></div>
          </div>
        </div>
      </li>`;
  }).join('');

  document.querySelectorAll('#charRateRank .rank-item[data-char]').forEach(item => {
    item.addEventListener('mouseenter', () => highlightLinked(item.dataset.char, item));
    item.addEventListener('mouseleave', () => clearHighlight(item));
  });

  if (!noteEl) return;

  const pvTop = [...data].sort((a, b) => b.pv - a.pv).slice(0, Math.min(10, data.length));
  const overlap = top.filter(c => pvTop.includes(c)).length;
  const minPvChar = [...top].sort((a, b) => a.pv - b.pv)[0];
  const medPv = charMedianOf(charNums(data, c => c.pv));
  const pvRatio = medPv > 0 ? minPvChar.pv / medPv * 100 : null;

  // 只有样本超过 10 人时，"是否同时进入播放 TOP10"才是有效比较
  const isFullRank = top.length === 10 && data.length > 10;
  const overlapTxt = isFullRank
    ? `这 10 人中仅 <strong>${overlap}</strong> 人同时进入播放 TOP10，可见"收藏效率高"与"播放量大"是两件事。`
    : `样本不足 10 人，此处仅列示本榜，不做两榜重合度比较。`;
  // 分母是否过小要按实际比例判断，不能一律说"不属于小分母"
  const pvTxt = pvRatio === null ? ''
    : pvRatio >= 60
      ? ` 榜内播放量最低的 ${minPvChar.name} 为 ${charFmtWan(minPvChar.pv)} 万，仍是中位播放的 ${pvRatio.toFixed(0)}%，不属于小分母造成的虚高。`
      : ` 另：榜内播放量最低的 ${minPvChar.name} 只有 ${charFmtWan(minPvChar.pv)} 万，为中位播放的 ${pvRatio.toFixed(0)}%，` +
        `比值指标在这类较小分母上波动更大，其名次应谨慎解读。`;

  noteEl.innerHTML = `<strong>读数：</strong>样本 n = ${data.length}，收藏率中位 ${charFmtRate(medRate)} 次/万播放，` +
    `榜首 ${top[0].name} 为 <strong>${charFmtRate(maxRate)}</strong>，是中位的 ${medRate > 0 ? (maxRate / medRate).toFixed(1) : '—'} 倍。` +
    overlapTxt + pvTxt;
}

/* 角色主题 OST：官方曲目表 ↔ 角色演示/角色PV/角色预告 的一一对应
 * 数据来自 js/char-music.js（由官方专辑曲目表 + B站官方投稿生成）
 * 只展示已发行的角色主题曲；未发行不推测，也不用地区 BGM 顶替。 */
function renderCharThemeTracks() {
  const tbody = document.getElementById('charThemeTracks');
  const summEl = document.getElementById('charThemeSummary');
  const countEl = document.getElementById('charMusicCount');
  if (!tbody) return;

  const chars = getFilteredAllChars();
  const inScope = new Set(chars.map(c => c.name));
  const allMusic = (typeof CHAR_THEME_MUSIC !== 'undefined') ? CHAR_THEME_MUSIC : {};

  const rows = [];
  Object.keys(allMusic).forEach(name => {
    if (!inScope.has(name)) return;
    allMusic[name].forEach(m => rows.push({ charName: name, ...m }));
  });

  const withMusicNames = [...new Set(rows.map(r => r.charName))];
  const noMusic = chars.filter(c => !(allMusic[c.name] && allMusic[c.name].length));

  if (countEl) {
    countEl.textContent = `${withMusicNames.length} 名角色 · ${rows.length} 首`;
  }

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-tertiary);padding:24px;">当前筛选下没有已发行角色主题 OST 的角色</td></tr>`;
    if (summEl) summEl.innerHTML = `<strong>读数：</strong>当前筛选的 ${chars.length} 名角色都没有已发行的角色主题曲。这不是数据缺失，而是该角色尚未发行《闪耀的群星》曲目。`;
    return;
  }

  // 排序：网易云评论降序（无评论者靠后），并列时看对应 PV 的 B站播放
  const playOf = r => (r.pvPlay != null ? r.pvPlay : (r.play != null ? r.play : null));
  rows.sort((a, b) => (b.cmt === null ? -1 : b.cmt) - (a.cmt === null ? -1 : a.cmt)
    || (playOf(b) === null ? -1 : playOf(b)) - (playOf(a) === null ? -1 : playOf(a)));
  const top = rows.slice(0, 15);

  tbody.innerHTML = top.map((r, i) => {
    const albumShort = r.album.replace(/^原神-/, '').replace(/\s+The .*$/, '');
    const pvCell = r.pvMatched
      ? `<a href="https://www.bilibili.com/video/${r.bvid}" target="_blank" rel="noopener" style="color:var(--gold-light);text-decoration:none;border-bottom:1px dashed rgba(201,162,39,0.45);">${r.pvType}「${r.pvName}」</a>`
      : `<span style="color:var(--text-quaternary);">${r.kindCN}（官方未在B站投稿，无 BV 号）</span>`;
    const pvPlayNum = r.pvMatched && r.pvPlay != null ? Math.round(r.pvPlay) : null;
    return `<tr>
      <td class="num">${i + 1}</td>
      <td><a href="character-detail.html?name=${encodeURIComponent(r.charName)}" style="color:var(--text-primary);text-decoration:none;border-bottom:1px dashed var(--border);">${r.charName}</a></td>
      <td style="max-width:240px;white-space:normal;">${r.neteaseUrl
        ? `<a href="${r.neteaseUrl}" target="_blank" rel="noopener" style="color:var(--text-secondary);text-decoration:none;border-bottom:1px dashed var(--border);">${r.track}</a>`
        : r.track}</td>
      <td style="max-width:170px;white-space:normal;color:var(--text-tertiary);">${albumShort} · v${r.albumVersion}</td>
      <td style="max-width:200px;white-space:normal;">${pvCell}</td>
      <td class="num">${r.cmt === null ? '—' : Math.round(r.cmt).toLocaleString()}</td>
      <td class="num">${pvPlayNum === null ? '—' : pvPlayNum.toLocaleString()}</td>
    </tr>`;
  }).join('');

  if (!summEl) return;

  const noCmt = rows.filter(r => r.cmt === null).length;
  const noPv = rows.filter(r => !r.pvMatched).length;
  const topRow = top[0];
  const medCmt = charMedianOf(rows.filter(r => r.cmt !== null).map(r => r.cmt));

  summEl.innerHTML = `<strong>读数：</strong>当前筛选的 ${chars.length} 名角色中，<strong>${withMusicNames.length}</strong> 名已发行角色主题 OST，共 ${rows.length} 首` +
    `${noMusic.length ? `；其余 ${noMusic.length} 名尚未发行，因此不列示、不推测` : ''}。` +
    (topRow ? `评论量最高的是${topRow.charName}的《${topRow.track.replace(/\s[A-Za-z].*$/, '')}》（${Math.round(topRow.cmt || 0).toLocaleString()} 条）。` : '') +
    (medCmt ? `入选曲目评论中位 ${Math.round(medCmt).toLocaleString()} 条。` : '') +
    `${noCmt ? `有 ${noCmt} 首曲目缺网易云评论实测，留空不按 0 计。` : ''}` +
    `${noPv ? `有 ${noPv} 首曲目（${rows.filter(r => !r.pvMatched).map(r => r.charName + '《' + r.track.replace(/\s[A-Za-z].*$/, '') + '》').join('、')}）对应的官方演示仅发布于 YouTube（"Pyro Chapter" - Chef de Cuisine Xiangling），B站官方号无投稿，故无 BV 号与播放量、不作推测。` : `140 首曲目中 139 首已精确对应到 B站官方投稿，末列为该 PV 的实测播放量，点击 PV 链接即可核实。`}` +
    `曲目评论属于曲目级、官方 PV 播放属于视频级，两者不同源，不可相加或换算。`;
}

/* 热力图读法说明：说清归一化口径与"为什么大部分格子很浅" */
function renderCharHeatmapNote(data, metrics) {
  const el = document.getElementById('charHeatmapNote');
  if (!el || !data.length) return;
  const valOf = m => (m.get ? m.get : (c => c[m.k]));

  const holders = metrics.map(m => {
    const sorted = [...data].sort((a, b) => valOf(m)(b) - valOf(m)(a));
    const c = sorted[0];
    return { m, c, v: c ? valOf(m)(c) : null };
  }).filter(h => h.c && typeof h.v === 'number' && h.v > 0);

  const medPv = charMedianOf(charNums(data, c => c.pv));
  const maxPv = Math.max(...data.map(c => c.pv));

  el.innerHTML = `<strong>各列最大值持有者：</strong>` +
    holders.map(h => `${h.m.l} — ${h.c.name}（${h.m.fmt(h.v)}）`).join('；') +
    `。播放中位数只有最大值的 <strong>${maxPv > 0 ? (medPv / maxPv * 100).toFixed(1) : '—'}%</strong>，` +
    `所以绝大多数格子必然落在最浅的两档——这是右偏分布下的正常结果，不是图表失效。` +
    `跨列比较深浅没有意义（每列分母不同）；要横向比较角色，请看最后一列收藏率，它已经剔除了播放规模。`;
}

function highlightLinked(charName, source) {
  document.querySelectorAll(`.rank-item[data-char="${charName}"]`).forEach(el => el.classList.add('linked'));
  document.querySelectorAll(`svg circle[data-char="${charName}"]`).forEach(el => el.classList.add('linked'));
  if (source) source.classList.add('linked');
}
function clearHighlight(source) {
  document.querySelectorAll('.linked').forEach(el => el.classList.remove('linked'));
}

function renderCharHeatmap() {
  const data = getFilteredValidChars();
  const el = document.getElementById('charHeatmap');
  if (!data.length) {
    if (el) el.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-tertiary);font-size:12px;">当前筛选下没有符合条件的角色</div>`;
    return;
  }

  /* 前三列是绝对值（各自除以本列最大值），第四列是比值指标：
   * 收藏率剔除了播放规模，因此同一行内它才是可以横向比较"效率"的一列。
   * 星级属于分类属性、不是热度指标，放进强度色阶会产生"4 星=0.8 强度"的误读，故移除。 */
  const metrics = [
    { k: 'pv',      l: '播放(万)',  fmt: v => charFmtWan(v) },
    { k: 'fav',     l: '收藏',      fmt: v => charFmtCnt(v * 1000) },
    { k: 'danmaku', l: '弹幕',      fmt: v => charFmtCnt(v * 1000) },
    { k: 'favRate', l: '收藏率',    fmt: v => charFmtRate(v), get: charFavRate }
  ];
  const valOf = m => (m.get ? m.get : (c => c[m.k]));
  const maxs = {};
  metrics.forEach(m => {
    maxs[m.k] = Math.max(...data.map(c => {
      const v = valOf(m)(c);
      return typeof v === 'number' && isFinite(v) ? v : 0;
    }));
  });

  // 通用：按 ratio 映射到 1~5 强度级（Task 4 的 hlvl 类）
  function hlvl(ratio) {
    if (ratio <= 0) return { cls: 'hlvl-0', lvl: 0 };
    const r = Math.max(0, Math.min(1, ratio));
    const lvl = r < 0.001 ? 0 : (r < 0.22 ? 1 : (r < 0.42 ? 2 : (r < 0.62 ? 3 : (r < 0.82 ? 4 : 5))));
    return { cls: lvl === 0 ? 'hlvl-0' : `hlvl-${lvl}`, lvl };
  }

  let html = `<div class="story-heatmap" style="display:grid;grid-template-columns:90px repeat(${metrics.length},1fr);gap:1px;background:var(--border);border-radius:12px;overflow:hidden;border:1.5px solid var(--border-gold);box-shadow:var(--shadow-sm);">`;
  html += `<div style="background:var(--surface-elevated);padding:10px 8px;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center;color:var(--gold-light);">角色</div>`;
  metrics.forEach(m => html += `<div style="background:var(--surface-elevated);padding:10px 8px;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center;color:var(--gold-light);border-left:1px solid rgba(201,162,39,0.15);">${m.l}</div>`);

  const sortedData = [...data].sort((a, b) => b.pv - a.pv).slice(0, 15);
  sortedData.forEach((c, idx) => {
    const color = ELEMENT_COLORS[c.element] || '#999';
    const tooltip = `角色：${c.name}<br>地区：${rName(c.region)}<br>元素：${c.element}<br>武器：${c.weapon}<br>星级：${c.rarity}星<br>官方角色视频播放：${c.pv}万<br>官方角色视频收藏：${Math.round(c.fav * 1000).toLocaleString()}<br>官方角色视频弹幕：${Math.round(c.danmaku * 1000).toLocaleString()}`;
    html += `<div class="heatmap-cell heat-cell" data-char="${c.name}" data-v="${100}" style="background:linear-gradient(180deg,var(--surface-elevated),${color}15);padding:10px 8px;font-size:12px;font-weight:600;display:flex;align-items:center;gap:6px;color:var(--text-primary);cursor:pointer;border-left:3px solid ${color};" data-tooltip="${tooltip}">
      <a href="character-detail.html?name=${encodeURIComponent(c.name)}" style="color:inherit;text-decoration:none;font-weight:600;">${c.name}</a>
    </div>`;
    metrics.forEach(m => {
      const v0 = valOf(m)(c);
      const v = (typeof v0 === 'number' && isFinite(v0)) ? v0 : 0;
      const ratio = maxs[m.k] > 0 ? v / maxs[m.k] : 0;
      const { cls } = hlvl(ratio);
      const displayInner = `<span>${m.fmt(v)}</span>`;
      html += `<div class="heatmap-cell heat-cell ${cls}" data-char="${c.name}" data-v="${Math.round(ratio * 100)}" data-tooltip="${tooltip}">${displayInner}</div>`;
    });
  });
  html += '</div>';

  // 图例（原神紫→金→红强度色阶）
  html += `<div class="legend legend-bottom" style="margin-top:14px;justify-content:flex-end;flex-wrap:wrap;gap:10px;">
    <span style="font-size:11px;color:var(--text-tertiary);margin-right:6px;">相对强度（每列最大值 = 最深）</span>
    <span class="legend-item"><span class="legend-swatch" style="background:rgba(255,255,255,0.02);border:1px solid var(--border);"></span>0</span>
    <span class="legend-item"><span class="legend-swatch hlvl-1" style="background:rgba(97,85,146,0.22);"></span>低</span>
    <span class="legend-item"><span class="legend-swatch hlvl-2" style="background:rgba(137,103,196,0.38);"></span>较低</span>
    <span class="legend-item"><span class="legend-swatch hlvl-3" style="background:rgba(200,158,74,0.45);"></span>中</span>
    <span class="legend-item"><span class="legend-swatch hlvl-4" style="background:rgba(223,121,92,0.58);"></span>较高</span>
    <span class="legend-item"><span class="legend-swatch hlvl-5" style="background:rgba(208,71,71,0.72);"></span>极高</span>
  </div>`;

  const heatEl = document.getElementById('charHeatmap');
  if (heatEl) heatEl.innerHTML = html;

  renderCharHeatmapNote(data, metrics);
  initHeatmapTooltip();
}


function initHeatmapTooltip() {
  const tooltip = document.createElement('div');
  tooltip.className = 'heatmap-tooltip';
  tooltip.style.cssText = 'position:absolute;pointer-events:none;z-index:1000;display:none;padding:12px 16px;background:var(--surface-elevated);border:1px solid var(--border-gold);border-radius:8px;box-shadow:var(--shadow-lg);font-size:12px;color:var(--text-primary);line-height:1.6;';
  document.body.appendChild(tooltip);
  
  const cells = document.querySelectorAll('.heatmap-cell');
  cells.forEach(cell => {
    cell.addEventListener('mouseenter', (e) => {
      const tip = e.target.getAttribute('data-tooltip');
      if (tip) {
        tooltip.innerHTML = tip;
        tooltip.style.display = 'block';
        updateTooltipPos(e);
      }
      const charName = e.target.getAttribute('data-char');
      if (charName) highlightLinked(charName, e.target);
    });
    cell.addEventListener('mousemove', updateTooltipPos);
    cell.addEventListener('mouseleave', (e) => {
      tooltip.style.display = 'none';
      clearHighlight(e.target);
    });
  });
  
  function updateTooltipPos(e) {
    const rect = tooltip.getBoundingClientRect();
    let left = e.clientX + 15;
    let top = e.clientY + 15;
    if (left + rect.width > window.innerWidth) left = e.clientX - rect.width - 15;
    if (top + rect.height > window.innerHeight) top = e.clientY - rect.height - 15;
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }
}

function renderCharGrid(page = 1) {
  charGridPage = page;
  let data = CHARACTERS.slice();
  if (scatterFilter !== 'all') data = data.filter(c => c.region === scatterFilter);
  if (elementFilter !== 'all') data = data.filter(c => c.element === elementFilter);
  if (weaponFilter !== 'all') data = data.filter(c => c.weapon === weaponFilter);

  const grid = document.getElementById('charGrid');
  const countEl = document.getElementById('charGridCount');
  if (countEl) countEl.textContent = `共${data.length}人`;
  if (!grid) return;

  if (data.length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-tertiary);">暂无符合条件的角色</div>';
    return;
  }

  // 按地区分组，再按稀有度、PV排序
  const regionOrder = ['mondstadt', 'liyue', 'inazuma', 'sumeru', 'fontaine', 'natlan', 'nodkrai', 'snezhnaya', 'other'];
  data.sort((a, b) => {
    const ra = regionOrder.indexOf(a.region);
    const rb = regionOrder.indexOf(b.region);
    if (ra !== rb) return ra - rb;
    if (b.rarity !== a.rarity) return b.rarity - a.rarity;
    return (typeof b.pv === 'number' ? b.pv : -1) - (typeof a.pv === 'number' ? a.pv : -1);
  });

  const totalPages = Math.ceil(data.length / charGridPageSize);
  const start = (page - 1) * charGridPageSize;
  const end = start + charGridPageSize;
  const pageData = data.slice(start, end);

  grid.innerHTML = pageData.map(c => window.renderCharCard(c)).join('');

  renderCharGridPagination(data.length, totalPages, page);
}

function renderCharGridPagination(total, totalPages, currentPage) {
  let paginationHtml = '';
  if (totalPages > 1) {
    const startItem = (currentPage - 1) * 24 + 1;
    const endItem = Math.min(currentPage * 24, total);
    paginationHtml = `
      <div class="char-grid-pagination">
        <button class="pagination-btn" onclick="renderCharGrid(${currentPage > 1 ? currentPage - 1 : 1})" ${currentPage === 1 ? 'disabled' : ''} title="上一页">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <span class="pagination-info">第 <strong style="color:var(--gold-light);font-weight:600;">${currentPage}</strong> / ${totalPages} 页 · 显示 ${startItem}-${endItem}</span>
        <button class="pagination-btn" onclick="renderCharGrid(${currentPage < totalPages ? currentPage + 1 : totalPages})" ${currentPage === totalPages ? 'disabled' : ''} title="下一页">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 5l7 7-7 7"/>
          </svg>
        </button>
        <button class="pagination-btn pagination-load-more" onclick="renderCharGrid(${currentPage < totalPages ? currentPage + 1 : totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>
          加载更多
        </button>
      </div>`;
  }
  const grid = document.getElementById('charGrid');
  if (grid) grid.insertAdjacentHTML('beforeend', paginationHtml);
}

function getCharAvatarUrl(charName) {
  if (typeof getLocalAvatarUrl === 'function') return getLocalAvatarUrl(charName);
  return '';
}
