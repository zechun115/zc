// ==================== 导航栏逻辑 ====================
(function () {
  /* ────────────────────────────────────────────────────────
   * 导航栏图标：全站统一使用「内联 SVG + 原神官方风格渐变配色」
   *    做法：使用 data URI（SVG inline）保证风格一致、
   *    100% 可加载（无网络/跨域/404 风险），不用 onerror。
   *    同时支持旧版本 tab 带 emoji 前缀时自动替换为图标 + 纯文字。
   * ──────────────────────────────────────────────────────── */

  /* ════════════════════════════════════════════════════════════════════
 *  6 个导航图标（全部使用原神游戏内官方 UI 图标，语义一一对应）
 *    地图中枢 → 传送锚点（游戏内地图传送点图标）
 *    角色音乐 → 皇冠（游戏内角色稀有度/命座 UI 图标）
 *    剧情场景 → 秘境（游戏内剧情副本入口图标）
 *    地区探索 → 七天神像（游戏内各地区解锁图标）
 *    数据洞察 → 圣章石（游戏内古代数据记录石碑图标）
 *    音乐专辑 → 旋曜玉帛（游戏内音乐唱片道具图标）
 *    素材来源：assets/img/icons/、assets/img/deco/（米哈游官方游戏贴图）
 *    不使用自绘 SVG / emoji，纯官方游戏贴图，保证原神视觉统一。
 * ════════════════════════════════════════════════════════════════════ */

const NAV_ICON_MAP = {
  "index.html":     { src: "assets/img/icons/传送锚点.png",       alt: "地图中枢" },
  "character.html": { src: "assets/img/deco/UI_ItemIcon_204.png", alt: "角色音乐" },
  "story.html":     { src: "assets/img/icons/秘境.png",           alt: "剧情场景" },
  "region.html":    { src: "assets/img/icons/七天神像.png",       alt: "地区探索" },
  "insight.html":   { src: "assets/img/icons/圣章石.png",         alt: "数据洞察" },
  "album.html":     { src: "assets/img/icons/旋曜玉帛.png",       alt: "音乐专辑" },
};
/* ════════════════════════════════════════════════════════════════════
 *  品牌 Logo（原神音乐数据）：使用游戏内「千音雅集」道具图标
 *    千音雅集为游戏内常驻音乐演奏玩法的曲谱集道具，与本站主题完全对应。
 *    素材来源：米哈游观测枢官方 wiki（assets/img/icons/千音雅集.png）
 * ════════════════════════════════════════════════════════════════════ */
const BRAND_LOGO = "assets/img/icons/千音雅集.png";
const ICON_SIZE = 18;

/* —— 替换顶部 Logo（游戏内「千音雅集」道具图标 + 金色渐变标题字）—— */
function applyBrandLogo() {
  const brand = document.querySelector('.navbar .nav-logo, .navbar .brand-logo');
  if (!brand) return;
  /* —— 品牌名：永久禁用跳转（展示用 Logo，不再是超链接）—— */
  brand.style.pointerEvents = 'none';
  brand.style.cursor = 'default';
  brand.innerHTML = '';
  const img = document.createElement('img');
  img.className = 'brand-logo-img';
  img.alt = '原神音乐数据';
  img.style.cssText = 'width:32px;height:32px;object-fit:contain;vertical-align:-8px;margin-right:10px;filter:drop-shadow(0 0 6px rgba(245,158,11,0.45));';
  img.src = BRAND_LOGO;
  img.onerror = function () { this.style.display = 'none'; };
  const text = document.createElement('span');
  text.textContent = '原神音乐数据';
  text.style.cssText = 'font-size:17px;font-weight:800;letter-spacing:0.5px;background:linear-gradient(180deg,#FFE69A 0%,#C9A227 45%,#8B6E1E 100%);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:0 0 14px rgba(201,162,39,0.35);';
  brand.appendChild(img);
  brand.appendChild(text);
}

/* —— 替换导航 tab 的图标（官方 PNG）—— */
function applyNavIcons() {
  const tabs = document.querySelectorAll('.nav-tabs > .nav-tab');
  if (!tabs.length) return;
  tabs.forEach(tab => {
    const href = (tab.getAttribute('href') || '').split('#')[0];
    const cfg = NAV_ICON_MAP[href];
    if (!cfg) return;
    if (tab.dataset.iconsApplied === '1') return;
    tab.dataset.iconsApplied = '1';
    let text = (tab.textContent || '').trim();
    const nonEmoji = text.replace(/^[^\u4e00-\u9fa5A-Za-z0-9]+/, '').trim();
    const img = document.createElement('img');
    img.className = 'nav-tab-icon';
    img.alt = cfg.alt;
    img.style.cssText = `width:${ICON_SIZE}px;height:${ICON_SIZE}px;object-fit:contain;display:inline-block;vertical-align:-3px;margin-right:6px;filter:drop-shadow(0 0 3px rgba(201,162,39,0.25));`;
    img.src = cfg.src;
    img.onerror = function () { this.style.display = 'none'; };
    tab.innerHTML = '';
    tab.appendChild(img);
    tab.appendChild(document.createTextNode(nonEmoji));
  });
}

  function initIcons() {
    applyBrandLogo();
    applyNavIcons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIcons);
  } else {
    initIcons();
  }

  /* ——————————————— 导航选中态 / 淡入跳转 / 移动端菜单 ——————————————— */
  const path = window.location.pathname.split('/').pop() || 'index.html';
  const navbar = document.querySelector('.navbar');
  const navTabs = document.querySelector('.nav-tabs');
  const menuBtn = document.querySelector('.nav-menu-btn');

  document.querySelectorAll('.nav-tab').forEach(tab => {
    const href = tab.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      tab.classList.add('active');
    }
    tab.addEventListener('click', function (e) {
      document.body.style.opacity = '0.7';
      document.body.style.transition = 'opacity 0.15s';
      setTimeout(() => { document.body.style.opacity = '1'; }, 50);
      if (menuBtn) {
        menuBtn.classList.remove('active');
      }
      if (navTabs) {
        navTabs.classList.remove('open');
      }
    });
  });

  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 4) navbar.classList.add('scrolled');
      else navbar.classList.remove('scrolled');
    });
  }

  if (menuBtn && navTabs) {
    menuBtn.addEventListener('click', function () {
      const isOpen = navTabs.classList.toggle('open');
      this.classList.toggle('active');
      this.setAttribute('aria-expanded', isOpen);
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });

    document.addEventListener('click', function (e) {
      if (!menuBtn.contains(e.target) && !navTabs.contains(e.target)) {
        navTabs.classList.remove('open');
        menuBtn.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }
})();
