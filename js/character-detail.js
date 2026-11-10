// ==================== 角色详情页 ====================

(function () {
  const params = new URLSearchParams(window.location.search);
  const name = params.get('name');
  if (!name) {
    document.getElementById('detailContent').innerHTML = `
      <div class="card" style="text-align:center;padding:60px 20px;">
        <h3>未指定角色</h3>
        <p class="subtitle">请从地图或角色列表中选择一个角色</p>
        <a href="character.html" class="back-btn">← 前往角色列表</a>
      </div>`;
    return;
  }

  const char = CHARACTERS.find(c => c.name === name);
  if (!char) {
    document.getElementById('detailContent').innerHTML = `
      <div class="card" style="text-align:center;padding:60px 20px;">
        <h3>角色「${name}」未找到</h3>
        <p class="subtitle">数据可能尚未收录，敬请期待</p>
        <a href="character.html" class="back-btn">← 返回角色列表</a>
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

  // 同地区其他角色按 B站官方角色视频播放量降序，无数据者排在最后
  const peers = allChars.filter(c => c.name !== char.name)
    .sort((a, b) => (typeof b.pv === 'number' ? b.pv : -1) - (typeof a.pv === 'number' ? a.pv : -1));
  // 条形归一基准：同地区（含本角色）最高播放，避免硬编码上限造成比例失真
  const peersMaxPv = Math.max(
    typeof char.pv === 'number' ? char.pv : 0,
    ...peers.map(p => typeof p.pv === 'number' ? p.pv : 0)
  );

  // ---- 统计基准（仅纳入有官方角色视频实测数据的角色，无数据者不参与任何统计） ----
  const validChars = CHARACTERS.filter(c => typeof c.pv === 'number' && typeof c.fav === 'number' && typeof c.danmaku === 'number');
  const allPv = validChars.map(c => c.pv);
  const allFav = validChars.map(c => c.fav);
  const allDm = validChars.map(c => c.danmaku);
  const pctOf = (arr, v) => (typeof v !== 'number' || typeof statPercentileRank !== 'function') ? null : Math.round(statPercentileRank(arr, v));
  const pvPct = pctOf(allPv, char.pv);
  const favPct = pctOf(allFav, char.fav);
  const dmPct = pctOf(allDm, char.danmaku);
  const pvMedian = (typeof statMedian === 'function') ? statMedian(allPv) : null;
  const pvQ1 = (typeof statQ1 === 'function') ? statQ1(allPv) : null;
  const pvQ3 = (typeof statQ3 === 'function') ? statQ3(allPv) : null;
  const pvIQR = (typeof statIQR === 'function') ? statIQR(allPv) : null;
  const pvTukey = (pvQ3 !== null && pvIQR !== null) ? pvQ3 + 1.5 * pvIQR : null;
  const pvVsMedian = (pvMedian && pvMedian > 0 && typeof char.pv === 'number') ? (char.pv / pvMedian) : null;
  const pvIsOutlier = pvTukey !== null && typeof char.pv === 'number' && char.pv > pvTukey;
  const pctTag = v => v === null ? '—' : `P${v}`;
  // 通俗读法：百分位 → 「超过 xx% 的角色」；满值（全样本最高）单独措辞，避免出现"超过 100%"的字面歧义
  const pctText = v => v === null ? '—' : (v >= 100 ? '高于其余全部角色' : `超过 <em>${v}%</em> 的角色`);
  const pctShort = v => v === null ? '—' : (v >= 100 ? '全样本最高' : `超过${v}%`);
  const hasData = typeof char.pv === 'number';

  // ---- 比值指标（次/万播放）：剥离曝光规模后的互动效率，与绝对值榜单互补 ----
  const favRateOf = c => (typeof c.pv === 'number' && typeof c.fav === 'number' && c.pv > 0) ? (c.fav / c.pv * 1000) : null;
  const dmRateOf = c => (typeof c.pv === 'number' && typeof c.danmaku === 'number' && c.pv > 0) ? (c.danmaku / c.pv * 1000) : null;
  const charFavRate = hasData ? favRateOf(char) : null;
  const charDmRate = hasData ? dmRateOf(char) : null;
  const favRates = validChars.map(favRateOf).filter(v => v !== null);
  const dmRates = validChars.map(dmRateOf).filter(v => v !== null);
  const favRateMed = favRates.length ? statMedian(favRates) : null;
  const dmRateMed = dmRates.length ? statMedian(dmRates) : null;
  const fmtRate = v => v === null ? '—' : (Math.round(v * 10) / 10).toFixed(1);
  const rateVsMed = (rate, med) => (rate !== null && med !== null && med > 0) ? (rate / med) : null;

  // ---- 分组中位数对照（同星级 / 同元素 / 同武器），只作描述性比较 ----
  const groupPvMed = pred => {
    const arr = validChars.filter(pred).map(c => c.pv).filter(v => typeof v === 'number');
    return { n: arr.length, med: arr.length ? statMedian(arr) : null };
  };
  const sameRarity = hasData ? groupPvMed(c => c.rarity === char.rarity) : null;
  const sameElem = hasData ? groupPvMed(c => c.element === char.element) : null;
  const sameWpn = hasData ? groupPvMed(c => c.weapon === char.weapon) : null;

  // ---- 地区内排名（同地区有官方角色视频数据的角色） ----
  const regionValidChars = hasData
    ? validChars.filter(c => c.region === char.region).sort((a, b) => b.pv - a.pv)
    : [];
  const regionRank = hasData && regionValidChars.length
    ? regionValidChars.findIndex(c => c.name === char.name) + 1
    : null;

  // 三指标条形图：各自独立归一（分母为该指标的全样本最大值），金色刻度线为全样本中位数
  const platformBars = [
    { label: 'B站播放', val: char.pv, max: Math.max(...allPv), med: pvMedian, scale: 10000, pct: pvPct, color: 'var(--chart-4)' },
    { label: 'B站收藏', val: char.fav, max: Math.max(...allFav), med: statMedian(allFav), scale: 1000, pct: favPct, color: 'var(--chart-1)' },
    { label: 'B站弹幕', val: char.danmaku, max: Math.max(...allDm), med: statMedian(allDm), scale: 1000, pct: dmPct, color: 'var(--chart-3)' }
  ];
  const medLine = item => (item.med && item.max > 0 && item.med <= item.max)
    ? `<span title="全样本中位数 ${fmt(item.med * item.scale)}" style="position:absolute;top:-2px;bottom:-2px;left:${(item.med / item.max * 100).toFixed(1)}%;width:2px;background:var(--gold);opacity:0.85;border-radius:1px;"></span>`
    : '';

  const pvRank = hasData ? validChars.slice().sort((a, b) => b.pv - a.pv).findIndex(c => c.name === char.name) + 1 : null;
  const favRank = hasData ? validChars.slice().sort((a, b) => b.fav - a.fav).findIndex(c => c.name === char.name) + 1 : null;

  // 官方角色视频（B站投稿，含 BV 号）与该角色的主题 OST（闪耀的群星）。
  // 数据来自 js/char-music.js，均由官方投稿页与官方专辑曲目表核对生成。
  const officialVideos = (typeof CHAR_OFFICIAL_VIDEOS !== 'undefined' && CHAR_OFFICIAL_VIDEOS[char.name]) || [];
  const themeMusics = (typeof CHAR_THEME_MUSIC !== 'undefined' && CHAR_THEME_MUSIC[char.name]) || [];
  // 本页角色级指标（CHARACTERS.pv）对应的那条官方视频：播放量误差 < 1% 视为同一条
  const pvSourceVideo = (typeof char.pv === 'number' && char.pv > 0)
    ? officialVideos.find(v => typeof v.play === 'number' && Math.abs(v.play / 10000 - char.pv) <= char.pv * 0.01) || null
    : null;

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

  // ---- 数据画像小结（分条结论，全部由当前样本动态计算） ----
  const conclItems = [];
  if (hasData) {
    /* ① 分布位置：排名 + 通俗百分位 + 中位数倍数 + Tukey 归属 */
    const pvOutlierCount = pvTukey !== null ? validChars.filter(c => c.pv > pvTukey).length : 0;
    conclItems.push([`在 ${validChars.length} 名有效角色中的位置`,
      `把这 ${validChars.length} 名有官方角色视频的角色按播放量从高到低排队，该角色排第 <em>${pvRank}</em> 名，播放量比其中${pctText(pvPct)}（P${pvPct}）；` +
      `队里正中间那名角色是 <em>${fmt(pvMedian * 10000)}</em>（中位数），该角色约为 TA 的 <em>${pvVsMedian === null ? '—' : pvVsMedian.toFixed(2)} 倍</em>。` +
      (pvIsOutlier
        ? `TA 属于<strong>播放量特别突出的极少数</strong>——全样本只有 <em>${pvOutlierCount}</em> 人超过统计学的异常判定线（Q3 + 1.5×IQR = ${fmt(pvTukey * 10000)}）。正是这类角色把"平均数"抬得很高，所以跨角色比较看<strong>排名和中位数</strong>更靠谱。`
        : `TA 低于异常判定线（${fmt(pvTukey * 10000)}），和占大多数的典型角色处在同一档。`)]);

    /* ② 互动效率：单位播放的收藏 / 弹幕，与曝光规模解耦 */
    const favV = rateVsMed(charFavRate, favRateMed);
    const dmV = rateVsMed(charDmRate, dmRateMed);
    const effWord = v => v === null ? '—' : (v >= 1.05 ? '高于' : v <= 0.95 ? '低于' : '基本等于');
    conclItems.push(['互动效率：每万播放换来多少收藏与弹幕',
      `收藏率 <em>${fmtRate(charFavRate)}</em> 次/万播放（全样本中位 ${fmtRate(favRateMed)}），${effWord(favV)}典型水平` +
      `${favV !== null ? `（${(Math.abs(favV - 1) * 100).toFixed(0)}%）` : ''}；` +
      `弹幕率 <em>${fmtRate(charDmRate)}</em> 次/万播放（中位 ${fmtRate(dmRateMed)}）。` +
      `这一层效率差异与播放量大小基本无关，播放量再大也不自动带来更高的收藏转化；同为效率指标的两者数值不同，也不能互相替代。`]);

    /* ③ 同类对照：同星级 / 同元素 / 同武器的播放中位数 */
    const grpLine = (label, g) => g && g.n >= 3 && g.med !== null
      ? `${label}共 ${g.n} 人，同组典型水平（中位数）是 <em>${fmt(g.med * 10000)}</em>，该角色是 TA 的 <em>${(char.pv / g.med).toFixed(2)} 倍</em>`
      : `${label}同组可统计人数不足 3 人，不做对照`;
    conclItems.push(['同类对照：同为 5 星 / 同元素 / 同武器',
      `${grpLine(`同 ${char.rarity} 星`, sameRarity)}；${grpLine(`${char.element} 元素`, sameElem)}；${grpLine(char.weapon, sameWpn)}。` +
      `各分组人数有限（3–40 人），倍数只描述当前样本里"和 TA 同类的大多数人"的水平，不代表全部角色。`]);

    /* ④ 地区内部位置 */
    const regionMed = regionValidChars.length >= 3 ? statMedian(regionValidChars.map(c => c.pv)) : null;
    conclItems.push([`${region?.name || '所属地区'}地区内位置`,
      regionRank && regionValidChars.length > 1
        ? `在${region?.name || ''}地区 ${regionValidChars.length} 名有官方角色视频数据的角色中，该角色播放量排第 <em>${regionRank}</em> 名` +
          (regionRank === 1 ? `——是全地区官方视频播放量<strong>最高</strong>的角色` : `——也就是说，全地区只有 <em>${regionRank - 1}</em> 名角色的官方视频播放量比 TA 高`) +
          `${regionMed !== null ? `；地区内正中间那名角色（中位数）是 ${fmt(regionMed * 10000)}` : ''}。` +
          `同地区角色都由官方同一渠道发布，宣传资源相近，所以地区内排名更多反映角色本身受关注的程度。`
        : `该地区有官方角色视频数据的角色不足 2 人，无法做地区内比较。`]);
  } else {
    conclItems.push(['无官方角色视频数据', '该角色没有 B站「原神」官方账号发布的官方角色视频，所有角色级指标（播放 / 收藏 / 弹幕）缺失，因此不参与任何排名、百分位与分组统计——缺失不按 0 计入。下方的曲目数据属于曲目级指标，与角色级不同源。']);
  }
  const profileConclHtml = `
    <!-- 数据画像小结 -->
    <div class="card" style="margin-top:20px;">
      <h3>${ic('assets/img/deco/UI_ItemIcon_105.png')}数据画像小结 <span class="method-tag" style="margin-left:8px;">${hasData ? `n = ${validChars.length}` : '无有效指标'}</span></h3>
      <p class="subtitle">以下结论全部由当前数据动态计算；跨平台曲目指标不在本卡范围内。</p>
      <ol class="an-concl-list">
        ${conclItems.map(([t, b], i) => `
          <li class="an-concl-item">
            <span class="cc-idx">${i + 1}</span>
            <span class="cc-body"><span class="cc-title">${t}</span>${b}</span>
          </li>
        `).join('')}
      </ol>
    </div>`;

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
            <div class="v" style="color:${color};">${hasData ? char.pv.toLocaleString() + '万' : '—'}</div>
            <div class="l">${hasData ? `B站官方视频播放 · 第${pvRank}/${validChars.length}名 · ${pctShort(pvPct)}` : '无官方角色视频数据'}</div>
          </div>
          <div class="char-stat">
            <div class="v">${hasData ? fmt(char.fav * 1000) : '—'}</div>
            <div class="l">${hasData ? `视频收藏 · 第${favRank}/${validChars.length}名 · ${pctShort(favPct)}` : '无官方角色视频数据'}</div>
          </div>
          <div class="char-stat">
            <div class="v">${hasData ? fmt(char.danmaku * 1000) : '—'}</div>
            <div class="l">官方视频弹幕 · ${hasData ? pctShort(dmPct) : '—'}</div>
          </div>
        </div>
      </div>
    </div>

    ${profileConclHtml}

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

    <!-- B站官方角色视频 & 音乐数据 -->
    <div class="two-col">
      <div class="card">
        <h3>${ic('assets/img/deco/UI_ItemIcon_105.png')}官方角色视频表现</h3>
        <p class="subtitle">B站「原神」官方角色视频 · 全样本排名与分布位置（n = ${validChars.length}）</p>
        ${hasData ? `
        <div style="text-align:center;padding:16px 0;">
          <div style="font-size:42px;font-weight:700;background:var(--gold-gradient);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:1px;">${char.pv.toLocaleString()}万</div>
          <div style="font-size:12px;color:var(--text-tertiary);margin-top:4px;">B站官方角色视频累计播放</div>
        </div>
        ${(() => {
          const sorted = validChars.slice().sort((a, b) => b.pv - a.pv);
          const rank = sorted.findIndex(c => c.name === char.name) + 1;
          const maxPv = sorted[0].pv;
          return `<div style="padding:12px 0;border-top:1px solid rgba(212,168,86,0.1);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <span style="font-size:12px;color:var(--text-secondary);">全样本排名</span>
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
        <div style="padding:12px 0 0;border-top:1px solid rgba(212,168,86,0.1);font-size:12px;line-height:1.9;color:var(--text-secondary);">
          <strong style="color:var(--gold-light);">排名解读：</strong>
          ${validChars.length} 名角色按播放量从高到低排队，该角色是<strong>第 ${pvRank} 名</strong>；换个说法，播放量${pvPct >= 100 ? '高于其余全部角色' : `比其中 <strong>${pvPct}%</strong> 的角色都高`}。
          队列正中间那名角色是 <strong>${pvMedian === null ? '—' : fmt(pvMedian * 10000)}</strong>（中位数，即"典型角色"的水平），该角色是 TA 的 <strong>${pvVsMedian === null ? '—' : pvVsMedian.toFixed(2)} 倍</strong>。
          ${pvIsOutlier
            ? `该角色和少数极热门角色一起，把"平均数"抬得远高于中位数——所以本页用<strong>排名和中位数</strong>做比较，而不是平均数。`
            : `该角色处在正常范围（低于异常判定线 ${pvTukey === null ? '—' : fmt(pvTukey * 10000)}），和大多数角色在同一档。`}
          <div style="margin-top:6px;font-size:10.5px;color:var(--text-quaternary);">
            统计参考：Q1 ${pvQ1 === null ? '—' : fmt(pvQ1 * 10000)}（播放量最低的 25% 分界）、Q3 ${pvQ3 === null ? '—' : fmt(pvQ3 * 10000)}（最高的 25% 分界）、四分位距 IQR ${pvIQR === null ? '—' : fmt(pvIQR * 10000)}、异常判定线 Q3 + 1.5×IQR = ${pvTukey === null ? '—' : fmt(pvTukey * 10000)}。
          </div>
        </div>` : `
        <div style="text-align:center;padding:48px 16px;color:var(--text-tertiary);font-size:13px;line-height:1.9;">
          该角色暂无「原神」官方账号发布的官方角色视频，<br>没有可核实的播放/收藏/弹幕数据，因此不参与任何排名与统计。
        </div>`}
      </div>

      <div class="card">
        <h3>${ic('assets/img/deco/UI_ItemIcon_108.png')}三指标对比</h3>
        <p class="subtitle">三种指标各自独立归一（分母为该指标全样本最大值），仅表示指标内相对位置，量纲不同不可横向比较</p>
        <div>
          ${platformBars.map(item => `
            <div style="margin-bottom:10px;">
              <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px;">
                <span style="color:var(--text-secondary);">${item.label} <span style="color:var(--text-quaternary);font-size:10px;">${item.pct === null ? '—' : pctShort(item.pct)}</span></span>
                <span style="font-weight:600;">${typeof item.val === 'number' ? fmt(item.val * item.scale) : '—'}</span>
              </div>
              <div style="position:relative;height:8px;background:var(--surface);border-radius:4px;overflow:visible;">
                <div style="width:${(typeof item.val === 'number' && item.max > 0) ? ((item.val / item.max) * 100).toFixed(0) : 0}%;height:100%;background:${item.color};border-radius:4px;transition:width 0.8s;"></div>
                ${medLine(item)}
              </div>
            </div>
          `).join('')}
          <div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(212,168,86,0.1);font-size:11px;line-height:1.8;color:var(--text-tertiary);">
            三项指标均取自同一支 B站「原神」官方账号发布的官方角色视频（播放量 / 收藏数 / 弹幕数）。三者统计口径不同，<strong>不可相加，也不可换算</strong>；条形仅反映该角色在同一指标内的相对位置，<span style="color:var(--gold);">金色刻度线</span>为该指标的全样本中位数，越过金线即高于典型水平。
          </div>
        </div>
      </div>
    </div>

    <!-- 官方角色视频与主题音乐 -->
    <div class="card music-section" id="musicSection">
      <h3>${ic('assets/img/items/UI_ItemIcon_112001.png')}官方角色视频与主题音乐</h3>
      <p class="subtitle">左侧是 B站「原神」官方账号（uid 401742377）发布的该角色视频，标题与播放量取自官方投稿页，点击可跳转核实；右侧是 HOYO-MiX《闪耀的群星 The Stellar Moments》收录的该角色主题 OST。<strong>曲名与 PV 名并不相同</strong>——同一支演示的配乐另有曲名，两列一一对应但不可混用。</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:16px;align-items:start;">

        <!-- 官方视频 -->
        <div>
          <div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--gold-light);letter-spacing:0.5px;margin-bottom:8px;">
            ${ic('assets/img/deco/UI_NameCardIcon_0.png', 14, 14)}官方角色视频（B站）
          </div>
          ${officialVideos.length ? officialVideos.map(v => {
            const isSource = pvSourceVideo && v.bvid === pvSourceVideo.bvid;
            return `
            <a href="https://www.bilibili.com/video/${v.bvid}" target="_blank" rel="noopener"
               style="display:block;padding:10px 12px;border:1px solid ${isSource ? 'rgba(201,162,39,0.5)' : 'var(--border)'};border-radius:8px;margin-bottom:8px;text-decoration:none;background:${isSource ? 'rgba(201,162,39,0.06)' : 'transparent'};">
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px;">
                <span style="font-size:10px;padding:1px 6px;border-radius:3px;background:${color}22;color:${color};border:1px solid ${color}44;">${v.type}</span>
                <span style="font-size:14px;font-weight:600;color:var(--text-primary);">「${v.pv}」</span>
                ${isSource ? `<span style="font-size:10px;padding:1px 6px;border-radius:3px;background:rgba(201,162,39,0.15);color:var(--gold);border:1px solid rgba(201,162,39,0.4);">本页指标来源</span>` : ''}
              </div>
              <div style="display:flex;justify-content:space-between;gap:8px;font-size:11px;color:var(--text-tertiary);">
                <span>播放 ${fmt(v.play)}</span>
                <span style="color:var(--text-quaternary);">${v.bvid} ↗</span>
              </div>
            </a>`;
          }).join('') : `
          <div style="padding:20px 14px;text-align:center;border:1px dashed var(--border);border-radius:8px;">
            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;">项目视频清单未收录该角色的官方投稿</div>
            <div style="font-size:11px;color:var(--text-quaternary);line-height:1.7;">该角色的官方投稿未收录进本项目视频清单，因此无法提供 BV 号；${hasData ? '角色级指标仍取自官方投稿实测数据' : '且没有官方角色视频，故无角色级指标'}，此处不作补录或推测。</div>
          </div>`}
        </div>

        <!-- 主题 OST -->
        <div>
          <div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--gold-light);letter-spacing:0.5px;margin-bottom:8px;">
            ${ic('assets/img/items/UI_ItemIcon_112001.png', 14, 14)}角色主题 OST（闪耀的群星）
          </div>
          ${themeMusics.length ? themeMusics.map(m => `
          <div style="padding:10px 12px;border:1px solid var(--border);border-left:3px solid ${color};border-radius:8px;margin-bottom:8px;">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">
              <div style="min-width:0;">
                <div style="font-size:14px;font-weight:600;color:var(--text-primary);line-height:1.4;">${m.track}</div>
                <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px;">
                  ${m.album.replace('原神-', '')} · v${m.albumVersion} · ${m.kindCN}
                  ${m.pvMatched ? ` · 对应 PV「${m.pvName}」` : ''}
                </div>
              </div>
            </div>
            <div style="display:flex;gap:10px;flex-wrap:wrap;font-size:11px;color:var(--text-tertiary);margin-top:6px;">
              ${m.cmt !== null ? `<span style="color:#FE2C55;">网易云 ${fmt(m.cmt)} 评论</span>` : '<span>评论：无实测</span>'}
              ${m.fav ? `<span style="color:#E2556E;">红心 ${m.fav}</span>` : ''}
              ${m.pvMatched && m.pvPlay != null ? `<span style="color:#FB7299;" title="对应官方 PV「${m.pvName}」投稿的实测播放量">B站 ${fmt(m.pvPlay)} 播放</span>` : (m.play !== null ? `<span style="color:#FB7299;">B站 ${fmt(m.play)} 播放</span>` : '')}
            </div>
            <div style="display:flex;gap:12px;margin-top:8px;font-size:11px;">
              ${m.neteaseUrl ? `<a href="${m.neteaseUrl}" target="_blank" rel="noopener" style="color:#FE2C55;text-decoration:none;">${icSm('assets/img/items/UI_ItemIcon_112001.png')}网易云收听 ↗</a>` : ''}
              ${m.bvid ? `<a href="https://www.bilibili.com/video/${m.bvid}" target="_blank" rel="noopener" style="color:#FB7299;text-decoration:none;">${icSm('assets/img/deco/UI_NameCardIcon_0.png')}${m.pvType}「${m.pvName}」↗</a>` : ''}
            </div>
          </div>`).join('') : `
          <div style="padding:28px 16px;text-align:center;border:1px dashed var(--border);border-radius:8px;">
            <div style="width:44px;height:44px;margin:0 auto 10px;border-radius:50%;background:${color}18;display:flex;align-items:center;justify-content:center;">
              <img src="assets/img/items/UI_ItemIcon_112001.png" onerror="this.style.display='none'" style="width:22px;height:22px;object-fit:contain;opacity:0.7;"/>
            </div>
            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:4px;">该角色暂无已发行的角色主题 OST</div>
            <div style="font-size:11px;color:var(--text-quaternary);line-height:1.7;max-width:420px;margin:0 auto;">
              《闪耀的群星》Vol.1–6 收录的是角色演示/角色PV 的官方配乐，并非每个角色都已发行。<br>这里不把地区 BGM 或同区域曲目当作「角色主题曲」。
            </div>
          </div>`}
          <div style="margin-top:4px;font-size:11px;line-height:1.7;color:var(--text-quaternary);">
            曲目顺序与 PV 类型对应关系来自官方专辑曲目表；网易云链接指向官方专辑内的该曲，未收录曲目一律留空、不作估算。
          </div>
        </div>
      </div>
    </div>

    <!-- 同地区角色 -->
    <div class="card">
      <h3>${ic('assets/img/icons/七天神像.png', 18, 18)}同地区其他角色</h3>
      <p class="subtitle">${region?.name} 地区的其他角色官方角色视频表现，按播放量降序；条形以同地区最高播放为 100% 归一（曲目推荐与角色无专属关联）</p>
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
            <div style="font-size:11px;color:var(--text-tertiary);">${typeof p.pv === 'number' ? '官方角色视频播放 ' + fmt(p.pv * 10000) : '暂无真实平台数据'}</div>
            ${typeof p.pv === 'number' && peersMaxPv > 0 ? `
            <div style="margin-top:6px;height:4px;background:var(--surface);border-radius:2px;overflow:hidden;" title="以同地区最高播放 ${fmt(peersMaxPv * 10000)} 为 100%">
              <div style="width:${(p.pv / peersMaxPv * 100).toFixed(0)}%;height:100%;background:${pColor};border-radius:2px;"></div>
            </div>` : ''}
          </a>
        `}).join('')}
      </div>
    </div>

    <!-- 地区推荐音乐 -->
    ${regionTracks.length > 0 || (typeof getTracksByRegion === 'function' && getTracksByRegion(char.region).length > 0) ? `
    <div class="card">
      <h3>${ic('assets/img/items/UI_ItemIcon_112002.png', 18, 18)}${region?.name}地区推荐音乐</h3>
      <p class="subtitle">按该地区综合热度排序的人工精选样本；这不是该角色专属曲目，也不代表该地区全部官方专辑的完整统计</p>
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
                    ? `${t.neteaseFav ? `<span style="color:#E2556E;" title="网易云红心/收藏数（客户端 UI 显示值）">红心${t.neteaseFav}</span>` : ''}${t.neteaseCmt !== null && t.neteaseCmt !== undefined ? `<span style="color:#FE2C55;">网易云${fmt(t.neteaseCmt)}评论</span>` : ''}${t.biliPlay !== null && t.biliPlay !== undefined ? `<span style="color:#FB7299;">B站${fmt(t.biliPlay)}播放</span>` : ''}`
                    : `<span>暂无真实平台数据</span>`
                  }
                </div>
              </div>
              <div style="font-size:12px;color:var(--text-tertiary);flex-shrink:0;">${rName(char.region)}</div>
              ${isAlbumData && (t.neteaseUrl || t.bilibiliUrl) ? `
                <div style="display:flex;gap:4px;flex-shrink:0;">
                  ${t.neteaseUrl ? `<a href="${t.neteaseUrl}" target="_blank" rel="noopener" style="color:#FE2C55;font-size:11px;text-decoration:none;">${ic('assets/img/items/UI_ItemIcon_112001.png')}网易云</a>` : ''}
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

  // 智能返回：从站内页面（角色列表/地区页等）进入时后退一步，恢复来源页与滚动位置；
  // 直达/新标签打开时保持原行为回到地图中枢
  const backLink = document.getElementById('smartBack');
  if (backLink) {
    let refPage = '';
    try { refPage = (document.referrer || '').split('/').pop().split('?')[0]; } catch (e) { refPage = ''; }
    const sameSite = document.referrer && new URL(document.referrer).origin === location.origin;
    if (sameSite && refPage && refPage !== 'character-detail.html' && history.length > 1) {
      const labelMap = { 'character.html': '返回角色列表', 'region.html': '返回地区探索', 'index.html': '返回地图', 'insight.html': '返回数据洞察', 'story.html': '返回剧情场景', 'album.html': '返回音乐专辑' };
      backLink.textContent = '← ' + (labelMap[refPage] || '返回上一页');
      backLink.addEventListener('click', (e) => {
        e.preventDefault();
        history.back();
      });
    }
  }
}
