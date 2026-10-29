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
 * 保证视觉与功能一致：元素徽章、星级图标、地区徽章、热度依据、三平台直达链接。
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

  // 热度依据徽章（三个平台来源，可点击追溯）
  const heatBasisHtml = `
    <div class="char-card-heat-basis"
         data-tooltip="热度依据三支柱：
• B站PV：角色宣传PV播放量 ${c.pv}万（来源：bilibili.com官方账号）
• 网易云：角色BGM收藏 ${c.netease}千（来源：music.163.com专辑数据）
• QQ音乐：角色曲收藏 ${c.qq}千（来源：y.qq.com数字专辑）
综合热度按加权计算：HP ×0.4 + 网易云×0.35 + QQ×0.25"
         style="margin-top:8px;padding:6px 8px;border-radius:8px;background:linear-gradient(90deg,rgba(251,114,153,0.06),rgba(254,44,85,0.06),rgba(49,165,232,0.06));border:1px solid rgba(201,162,39,0.18);display:flex;align-items:center;justify-content:space-between;gap:4px;font-size:10px;color:var(--text-tertiary);">
      <span style="display:flex;align-items:center;gap:2px;color:#FB7299;font-weight:600;" title="来源：bilibili.com 角色PV总播放">
        <img src="assets/img/deco/UI_NameCardIcon_0.png" style="width:9px;height:9px;vertical-align:-1px;" onerror="this.style.display='none'"/>
        ${c.pv}万
      </span>
      <span style="width:1px;height:8px;background:rgba(201,162,39,0.15);"></span>
      <span style="display:flex;align-items:center;gap:2px;color:#FE2C55;font-weight:600;" title="来源：music.163.com 网易云音乐 角色OST收藏">
        <img src="assets/img/icons/旋曜玉帛.png" style="width:9px;height:9px;vertical-align:-1px;" onerror="this.style.display='none'"/>
        ${c.netease}k
      </span>
      <span style="width:1px;height:8px;background:rgba(201,162,39,0.15);"></span>
      <span style="display:flex;align-items:center;gap:2px;color:#31A5E8;font-weight:600;" title="来源：y.qq.com QQ音乐 数字专辑收藏">
        <img src="assets/img/deco/UI_ItemIcon_211.png" style="width:9px;height:9px;vertical-align:-1px;" onerror="this.style.display='none'"/>
        ${c.qq}k
      </span>
    </div>`;

  // 专辑曲目预览（从ALBUMS获取）
  let albumTracksHtml = '';
  if (typeof getTracksByCharacter === 'function') {
    const charTracks = getTracksByCharacter(c.name).map(t => ({
      ...t,
      heatScore: (typeof getTrackHeatScore === 'function') ? getTrackHeatScore(t) : (t.heatScore || 0)
    }));
    const topTracks = charTracks.slice(0, 2);
    if (topTracks.length > 0) {
      albumTracksHtml = `
        <div style="margin-top:6px;padding:5px 7px;border-radius:6px;background:linear-gradient(90deg,${color}10,transparent);border:1px solid ${color}20;font-size:10px;">
          <div style="color:var(--text-tertiary);margin-bottom:2px;font-size:9px;"><img src="assets/img/items/UI_ItemIcon_112001.png" style="width:9px;height:9px;vertical-align:-1px;" onerror="this.style.display='none'"/> 相关专辑曲目</div>
          ${topTracks.map(t => `
            <div style="display:flex;align-items:center;justify-content:space-between;gap:4px;margin-top:2px;">
              <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;color:var(--text-secondary);">${t.trackName || t.name}</span>
              <span style="color:${color};font-weight:600;flex-shrink:0;"><img src="assets/img/deco/UI_ItemIcon_105.png" style="width:9px;height:9px;vertical-align:-1px;" onerror="this.style.display='none'"/>${t.heatScore > 0 ? t.heatScore : '—'}</span>
            </div>
          `).join('')}
        </div>`;
    }
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

(function () {
  renderScatter();
  renderCharRanks();
  renderCharHeatmap();
  renderCharGrid();
  renderFilterOptions();
  renderKpiBanner();
  initScrollAnimations();

  document.querySelectorAll('#charFilters .chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#charFilters .chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      scatterFilter = btn.dataset.r;
      renderScatter();
      renderCharRanks();
      renderCharHeatmap();
      renderCharGrid();
    });
  });

  document.addEventListener('change', (e) => {
    if (e.target.id === 'elementSelect') {
      elementFilter = e.target.value;
      renderScatter();
      renderCharRanks();
      renderCharHeatmap();
      renderCharGrid();
    }
    if (e.target.id === 'weaponSelect') {
      weaponFilter = e.target.value;
      renderScatter();
      renderCharRanks();
      renderCharHeatmap();
      renderCharGrid();
    }
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

function renderKpiBanner() {
  const total = CHARACTERS.length;
  const totalPv = CHARACTERS.reduce((s, c) => s + c.pv, 0);
  const avgFav = Math.round(CHARACTERS.reduce((s, c) => s + c.netease, 0) / total);
  
  const elementCounts = {};
  CHARACTERS.forEach(c => {
    elementCounts[c.element] = (elementCounts[c.element] || 0) + 1;
  });
  const topElement = Object.entries(elementCounts).sort((a, b) => b[1] - a[1])[0][0];
  
  animateValue('kpiTotal', 0, total, 1500);
  animateValue('kpiTotalPv', 0, totalPv, 2000, true);
  animateValue('kpiAvgFav', 0, avgFav, 1500, false, true);
  
  const topEl = document.getElementById('kpiTopElement');
  if (topEl) topEl.textContent = topElement;

  // 动态切换 KPI 图标为最多元素对应的官方元素图标
  const kpiElIcon = document.querySelector('.kpi-card:last-child .kpi-icon-img');
  if (kpiElIcon && typeof ELEMENT_CDN_MAP !== 'undefined' && ELEMENT_CDN_MAP[topElement]) {
    kpiElIcon.src = 'assets/img/elements/' + ELEMENT_CDN_MAP[topElement];
    kpiElIcon.alt = topElement + '元素';
  }
}

function animateValue(id, start, end, duration, isPv = false, isFav = false) {
  const el = document.getElementById(id);
  if (!el) return;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (end - start) * easeProgress);
    
    if (isPv) {
      el.textContent = (current / 10000).toFixed(1) + '亿';
    } else if (isFav) {
      el.textContent = (current * 1000).toLocaleString();
    } else {
      el.textContent = current;
    }
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
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

  let data = CHARACTERS.slice();
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
  const maxN = Math.max(...data.map(c => c.netease));
  const maxC = Math.max(...data.map(c => c.cmt));
  // 象限分割采用中位数：右偏分布下均值会被头部角色拉高，中位数更能代表典型角色
  const midPv = (typeof statMedian === 'function') ? statMedian(data.map(c => c.pv)) : data.reduce((s, c) => s + c.pv, 0) / data.length;
  const midN = (typeof statMedian === 'function') ? statMedian(data.map(c => c.netease)) : data.reduce((s, c) => s + c.netease, 0) / data.length;

  const M = { l: 70, r: 45, t: 45, b: 65 };
  const W = 780, H = 480, w = W - M.l - M.r, h = H - M.t - M.b;

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

  // 均值线位置（象限分割）
  const avgPx = M.l + (midPv / maxPv) * w;
  const avgPy = M.t + (1 - midN / maxN) * h;

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

  for (let i = 0; i <= 5; i++) {
    const y = M.t + (i / 5) * h;
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', M.l); line.setAttribute('y1', y);
    line.setAttribute('x2', W - M.r); line.setAttribute('y2', y);
    line.setAttribute('stroke', 'var(--border)'); line.setAttribute('stroke-width', '0.5');
    line.setAttribute('stroke-dasharray', '4,4');
    line.setAttribute('stroke-opacity', '0.35');
    svg.appendChild(line);
    const lab = document.createElementNS(NS, 'text');
    lab.setAttribute('x', M.l - 12); lab.setAttribute('y', y + 4);
    lab.setAttribute('text-anchor', 'end'); lab.setAttribute('font-size', '11');
    lab.setAttribute('fill', 'var(--text-tertiary)');
    lab.setAttribute('font-weight', '500');
    lab.textContent = (Math.round((1 - i / 5) * maxN) * 1000).toLocaleString();
    svg.appendChild(lab);
  }

  // 坐标轴标题
  const xt = document.createElementNS(NS, 'text');
  xt.setAttribute('x', W / 2); xt.setAttribute('y', H - 18);
  xt.setAttribute('text-anchor', 'middle'); xt.setAttribute('font-size', '13');
  xt.setAttribute('fill', 'var(--gold-light)'); xt.setAttribute('font-weight', '600');
  xt.setAttribute('letter-spacing', '0.5px');
  xt.textContent = 'B站PV播放量（万）'; svg.appendChild(xt);

  const yt = document.createElementNS(NS, 'text');
  yt.setAttribute('x', 22); yt.setAttribute('y', H / 2);
  yt.setAttribute('text-anchor', 'middle'); yt.setAttribute('font-size', '13');
  yt.setAttribute('fill', 'var(--gold-light)'); yt.setAttribute('font-weight', '600');
  yt.setAttribute('letter-spacing', '0.5px');
  yt.setAttribute('transform', `rotate(-90,22,${H / 2})`);
  yt.textContent = '网易云收藏量'; svg.appendChild(yt);

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
  avgLabelX.textContent = 'PV中位数'; svg.appendChild(avgLabelX);

  const avgLabelY = document.createElementNS(NS, 'text');
  avgLabelY.setAttribute('x', W - M.r - 4); avgLabelY.setAttribute('y', avgPy - 4);
  avgLabelY.setAttribute('text-anchor', 'end'); avgLabelY.setAttribute('font-size', '9');
  avgLabelY.setAttribute('fill', 'var(--gold)'); avgLabelY.setAttribute('font-weight', '600');
  avgLabelY.textContent = '收藏中位数'; svg.appendChild(avgLabelY);

  // 象限标签
  const quadLabels = [
    { x: avgPx - 8, y: M.t + 14, text: '音乐出圈', anchor: 'end', color: 'rgba(74,217,217,0.4)' },
    { x: avgPx + 8, y: M.t + 14, text: '双高明星', anchor: 'start', color: 'rgba(201,162,39,0.5)' },
    { x: avgPx - 8, y: H - M.b - 8, text: '待发掘', anchor: 'end', color: 'rgba(148,163,184,0.35)' },
    { x: avgPx + 8, y: H - M.b - 8, text: 'PV带飞', anchor: 'start', color: 'rgba(217,74,74,0.35)' }
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

  // 计算气泡位置，并执行防重叠优化
  const sortedData = [...data].sort((a, b) => b.rarity - a.rarity || b.pv - a.pv);
  const positions = sortedData.map(c => ({
    name: c.name,
    ox: M.l + (c.pv / maxPv) * w,
    oy: M.t + (1 - c.netease / maxN) * h,
    x: M.l + (c.pv / maxPv) * w,
    y: M.t + (1 - c.netease / maxN) * h,
    r: (c.rarity === 5 ? 6 : 4) + (c.cmt / maxC) * 4.5,
    baseR: c.rarity === 5 ? 6 : 4,
    isTop: c.pv > maxPv * 0.6 || c.netease > maxN * 0.6
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
  const musicRank = [...data].sort((a, b) => (b.netease + b.qq) - (a.netease + a.qq));

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
    const baseR = pos.baseR;
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

      // 计算象限分类和排名百分位
      const quad = c.pv >= midPv && c.netease >= midN ? '双高明星'
        : c.pv < midPv && c.netease >= midN ? '音乐出圈'
        : c.pv >= midPv && c.netease < midN ? 'PV带飞'
        : '待发掘';
      const quadColor = quad === '双高明星' ? '#C9A227' : quad === '音乐出圈' ? '#4AD9D9' : quad === 'PV带飞' ? '#D94A4A' : '#94a3b8';
      const pvPct = Math.round((data.filter(x => x.pv < c.pv).length / data.length) * 100);
      const musicPct = Math.round((data.filter(x => x.netease < c.netease).length / data.length) * 100);

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
          <div><span style="color:var(--text-tertiary);">PV:</span> <strong style="color:var(--gold-light);">${c.pv}万</strong> <span style="font-size:10px;color:var(--text-tertiary);">(前${pvPct}%)</span></div>
          <div><span style="color:var(--text-tertiary);">收藏:</span> <strong style="color:var(--gold-light);">${(c.netease * 1000).toLocaleString()}</strong> <span style="font-size:10px;color:var(--text-tertiary);">(前${musicPct}%)</span></div>
          <div><span style="color:var(--text-tertiary);">评论:</span> <strong style="color:var(--gold-light);">${(c.cmt * 1000).toLocaleString()}</strong></div>
          <div><span style="color:var(--text-tertiary);">QQ收藏:</span> <strong style="color:var(--gold-light);">${(c.qq * 1000).toLocaleString()}</strong></div>
        </div>
        <div style="font-size:10px;color:var(--text-tertiary);margin-top:10px;text-align:center;">点击查看角色详情</div>
      `;

      const tipWidth = 260;
      const tipHeight = 180;
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
      const tipHeight = 180;
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
    circle.setAttribute('aria-label', `${c.name}，${c.rarity}星，${c.element}元素，PV ${c.pv}万，网易云收藏 ${(c.netease*1000).toLocaleString()}`);
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
      const quad = c.pv >= midPv && c.netease >= midN ? '双高明星'
        : c.pv < midPv && c.netease >= midN ? '音乐出圈'
        : c.pv >= midPv && c.netease < midN ? 'PV带飞' : '待发掘';
      const quadColor = quad === '双高明星' ? '#C9A227' : quad === '音乐出圈' ? '#4AD9D9' : quad === 'PV带飞' ? '#D94A4A' : '#94a3b8';
      const pvPct = Math.round((data.filter(x => x.pv < c.pv).length / data.length) * 100);
      const musicPct = Math.round((data.filter(x => x.netease < c.netease).length / data.length) * 100);
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
          <div><span style="color:var(--text-tertiary);">PV:</span> <strong style="color:var(--gold-light);">${c.pv}万</strong> <span style="font-size:10px;color:var(--text-tertiary);">(前${pvPct}%)</span></div>
          <div><span style="color:var(--text-tertiary);">收藏:</span> <strong style="color:var(--gold-light);">${(c.netease * 1000).toLocaleString()}</strong> <span style="font-size:10px;color:var(--text-tertiary);">(前${musicPct}%)</span></div>
          <div><span style="color:var(--text-tertiary);">评论:</span> <strong style="color:var(--gold-light);">${(c.cmt * 1000).toLocaleString()}</strong></div>
          <div><span style="color:var(--text-tertiary);">QQ收藏:</span> <strong style="color:var(--gold-light);">${(c.qq * 1000).toLocaleString()}</strong></div>
        </div>
        <div style="font-size:10px;color:var(--text-tertiary);margin-top:10px;text-align:center;">按 Enter 查看角色详情</div>
      `;
      const tipWidth = 260, tipHeight = 180;
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
                        (c.pv >= pvRank[0]?.pv || c.netease >= musicRank[0]?.netease);

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

  // 分析摘要：相关系数 + 四象限人数 + 中位数分割说明（全部按当前筛选样本实时计算）
  const summEl = document.getElementById('scatterSummary');
  if (summEl) {
    const r = (typeof statPearson === 'function') ? statPearson(data.map(c => c.pv), data.map(c => c.netease)) : null;
    const rLabel = (typeof statCorrLabel === 'function') ? statCorrLabel(r) : '';
    const r2 = r === null ? null : (r * r * 100).toFixed(1);
    const q = { q1: 0, q2: 0, q3: 0, q4: 0 };
    data.forEach(c => {
      const right = c.pv >= midPv, up = c.netease >= midN;
      if (right && up) q.q1++; else if (!right && up) q.q2++; else if (!right && !up) q.q3++; else q.q4++;
    });
    summEl.innerHTML = `<strong>分析摘要：</strong>当前样本 n = ${data.length} 名角色；PV 与网易云收藏的 Pearson 相关系数 <strong style="color:var(--gold-light);">r = ${r === null ? '—' : r.toFixed(3)}</strong>（${rLabel}正相关），r² = ${r2 === null ? '—' : r2 + '%'}，说明 PV 热度只能解释约 ${r2 === null ? '—' : r2 + '%'} 的收藏差异，其余来自平台受众与曲目发行等非 PV 因素。
      分割线取 <strong>中位数</strong>（PV ${midPv}万 / 收藏 ${midN}千），较均值更能代表典型角色。四象限人数：双高明星 ${q.q1} 人、音乐出圈 ${q.q2} 人、待发掘 ${q.q3} 人、PV带飞 ${q.q4} 人。
      <span style="color:var(--text-tertiary);">注：相关不等于因果，象限归类仅表示相对位置。</span>`;
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
      PV播放量万: c.pv,
      网易云收藏: c.netease * 1000,
      网易云评论: c.cmt * 1000,
      QQ音乐收藏: c.qq * 1000
    }));
    scatterCard.setAttribute('data-export', JSON.stringify(exportData));
    scatterCard.setAttribute('data-export-file', '角色双平台热度数据');
    // 触发 optimize.js 中的导出按钮初始化
    const btn = document.createElement('button');
    btn.className = 'export-btn';
    btn.textContent = '导出数据';
    btn.setAttribute('aria-label', '导出此图表的数据');
    btn.addEventListener('click', () => window.exportData(exportData, '角色双平台热度数据', 'csv'));
    scatterCard.appendChild(btn);
  }
}

function renderCharRanks() {
  let data = CHARACTERS.slice();
  if (scatterFilter !== 'all') data = data.filter(c => c.region === scatterFilter);
  if (elementFilter !== 'all') data = data.filter(c => c.element === elementFilter);
  if (weaponFilter !== 'all') data = data.filter(c => c.weapon === weaponFilter);
  
  const pvSorted = [...data].sort((a, b) => b.pv - a.pv).slice(0, 10);
  const pvEl = document.getElementById('pvRank');
  if (pvEl) {
    pvEl.innerHTML = pvSorted.map((c, i) => {
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
          <div class="rank-val" style="color:${color};display:flex;align-items:center;gap:3px;">
            <img src="assets/img/deco/UI_NameCardIcon_0.png" style="width:10px;height:10px;vertical-align:-1px;" onerror="this.style.display='none'" title="来源：bilibili.com 官方账号角色PV播放量"/>
            ${c.pv}万
          </div>
          <div style="font-size:9px;color:var(--text-tertiary);margin-top:2px;opacity:0.85;">B站PV</div>
        </div>
      </li>`;
    }).join('');
  }

  const mSorted = [...data].sort((a, b) => b.netease - a.netease).slice(0, 10);
  const mEl = document.getElementById('musicRank');
  if (mEl) {
    mEl.innerHTML = mSorted.map((c, i) => {
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
          <div class="rank-val" style="color:${color};display:flex;align-items:center;gap:3px;">
            <img src="assets/img/items/UI_ItemIcon_112001.png" style="width:10px;height:10px;vertical-align:-1px;" onerror="this.style.display='none'" title="来源：music.163.com 网易云音乐 角色OST收藏量"/>
            ${(c.netease * 1000).toLocaleString()}
          </div>
          <div style="font-size:9px;color:var(--text-tertiary);margin-top:2px;opacity:0.85;">网易云收藏 · QQ:${c.qq}k</div>
        </div>
      </li>`;
    }).join('');
  }

  document.querySelectorAll('.rank-item[data-char]').forEach(item => {
    item.addEventListener('mouseenter', () => highlightLinked(item.dataset.char, item));
    item.addEventListener('mouseleave', () => clearHighlight(item));
  });
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
  let data = CHARACTERS.slice();
  if (scatterFilter !== 'all') data = data.filter(c => c.region === scatterFilter);
  if (elementFilter !== 'all') data = data.filter(c => c.element === elementFilter);
  if (weaponFilter !== 'all') data = data.filter(c => c.weapon === weaponFilter);

  const metrics = [
    { k: 'pv', l: 'PV播放', unit: '万' },
    { k: 'netease', l: '网易收藏', unit: '' },
    { k: 'cmt', l: '网易评论', unit: '' },
    { k: 'qq', l: 'QQ收藏', unit: '' },
    { k: 'rarity', l: '星级', unit: '' }
  ];
  const maxs = {};
  metrics.forEach(m => { maxs[m.k] = Math.max(...data.map(c => c[m.k])); });

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
    const tooltip = `角色：${c.name}<br>地区：${rName(c.region)}<br>元素：${c.element}<br>武器：${c.weapon}<br>星级：${c.rarity}星<br>PV播放：${c.pv}万<br>网易收藏：${c.netease}千<br>网易评论：${c.cmt}千<br>QQ收藏：${c.qq}千`;
    html += `<div class="heatmap-cell heat-cell" data-char="${c.name}" data-v="${100}" style="background:linear-gradient(180deg,var(--surface-elevated),${color}15);padding:10px 8px;font-size:12px;font-weight:600;display:flex;align-items:center;gap:6px;color:var(--text-primary);cursor:pointer;border-left:3px solid ${color};" data-tooltip="${tooltip}">
      <a href="character-detail.html?name=${encodeURIComponent(c.name)}" style="color:inherit;text-decoration:none;font-weight:600;">${c.name}</a>
    </div>`;
    metrics.forEach(m => {
      const v = c[m.k];
      const ratio = maxs[m.k] > 0 ? v / maxs[m.k] : 0;
      const { cls, lvl } = hlvl(ratio);
      const displayVal = m.k === 'pv' ? v : v;
      const displayInner = (v === 0 && cls === 'hlvl-0')
        ? `<span>${displayVal}${m.unit}</span>`
        : `<span>${displayVal}${m.unit}</span>`;
      html += `<div class="heatmap-cell heat-cell ${cls}" data-char="${c.name}" data-v="${Math.round(ratio * 100)}" data-tooltip="${tooltip}">${displayInner}</div>`;
    });
  });
  html += '</div>';

  // 图例（原神紫→金→红强度色阶）
  html += `<div class="legend legend-bottom" style="margin-top:14px;justify-content:flex-end;flex-wrap:wrap;gap:10px;">
    <span style="font-size:11px;color:var(--text-tertiary);margin-right:6px;">热度强度</span>
    <span class="legend-item"><span class="legend-swatch" style="background:rgba(255,255,255,0.02);border:1px solid var(--border);"></span>0</span>
    <span class="legend-item"><span class="legend-swatch hlvl-1" style="background:rgba(97,85,146,0.22);"></span>低</span>
    <span class="legend-item"><span class="legend-swatch hlvl-2" style="background:rgba(137,103,196,0.38);"></span>较低</span>
    <span class="legend-item"><span class="legend-swatch hlvl-3" style="background:rgba(200,158,74,0.45);"></span>中</span>
    <span class="legend-item"><span class="legend-swatch hlvl-4" style="background:rgba(223,121,92,0.58);"></span>较高</span>
    <span class="legend-item"><span class="legend-swatch hlvl-5" style="background:rgba(208,71,71,0.72);"></span>极高</span>
  </div>`;

  const el = document.getElementById('charHeatmap');
  if (el) el.innerHTML = html;

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
    return b.pv - a.pv;
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
