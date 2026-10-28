// ==================== 全站优化脚本 ====================

// 安全渲染（优先使用 data.js 中定义的实现，否则提供基础版本）
window.safeRender = window.safeRender || function(containerId, renderFn, fallbackHtml) {
  try {
    renderFn();
  } catch (err) {
    console.error('[safeRender] 渲染失败:', err);
    if (containerId) {
      const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
      if (container) {
        container.innerHTML = fallbackHtml || `
          <div style="text-align:center;padding:48px 24px;color:var(--text-secondary);">
            <div style="font-size:18px;font-weight:600;color:var(--gold-light);margin-bottom:8px;">内容加载失败</div>
            <div style="font-size:13px;color:var(--text-tertiary);">${err.message || '未知错误'}</div>
          </div>`;
      }
    }
  }
};

(function () {
  'use strict';

  // ===== 页面加载完成后隐藏加载器 =====
  function hideLoader() {
    const loader = document.querySelector('.page-loader');
    if (loader) {
      loader.classList.add('hidden');
      setTimeout(() => loader.remove(), 500);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideLoader);
  } else {
    hideLoader();
  }
  window.addEventListener('load', hideLoader);

  // ===== 回到顶部按钮 =====
  const scrollTopBtn = document.createElement('button');
  scrollTopBtn.className = 'scroll-top';
  scrollTopBtn.setAttribute('aria-label', '回到顶部');
  scrollTopBtn.innerHTML = '↑';
  scrollTopBtn.title = '回到顶部';
  document.body.appendChild(scrollTopBtn);

  let scrollTimer = null;
  window.addEventListener('scroll', () => {
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      if (window.scrollY > 400) {
        scrollTopBtn.classList.add('visible');
      } else {
        scrollTopBtn.classList.remove('visible');
      }
    }, 50);
  }, { passive: true });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ===== 图片懒加载监听 =====
  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    img.addEventListener('load', function () {
      this.classList.add('loaded');
    });
    if (img.complete) img.classList.add('loaded');
  });

  // ===== 头像加载优化 =====
  // 原先针对 Fandom Wiki CDN（static.wikia.nocookie.net）的 ORB 检测与降级逻辑已移除：
  // 全站头像现已改用本地素材（assets/img/avatar/，由 crawl_assets.py 爬取），
  // 不再依赖外部 CDN，故无需 ORB 探测（此前探测会触发 ERR_BLOCKED_BY_ORB 控制台告警）。
  // 各业务 JS 内的 <img> 已自带 onerror 三级兜底：本地头像 → 首字母占位。

  // ===== 滚动触发动画（增强版） =====
  function initScrollAnimations() {
    if (!('IntersectionObserver' in window)) {
      // 降级：直接显示所有元素
      document.querySelectorAll('.scroll-animate, .scroll-scale, .scroll-slide-left, .scroll-slide-right').forEach(el => {
        el.classList.add('visible');
      });
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px 40px 0px' });

    // 自动为各类元素添加动画类（如果尚未添加）
    const selectors = [
      '.card:not(.scroll-animate):not(.scroll-scale)',
      '.data-card:not(.scroll-animate)',
      'header:not(.scroll-animate)',
      '.kpi-grid:not(.scroll-animate)',
      '.insight-finding:not(.scroll-animate)',
      '.timeline-item:not(.scroll-animate)',
      '.album-item:not(.scroll-animate)',
      '.rank-item:not(.scroll-animate)'
    ];

    selectors.forEach((sel, idx) => {
      document.querySelectorAll(sel).forEach((el, i) => {
        // 交替使用不同动画效果
        const animClass = idx % 3 === 0 ? 'scroll-animate' : idx % 3 === 1 ? 'scroll-scale' : 'scroll-animate';
        el.classList.add(animClass);
        if (i < 4) el.classList.add('scroll-animate-delay-' + (i + 1));
        observer.observe(el);
      });
    });

    // 已手动标记的元素也加入观察
    document.querySelectorAll('.scroll-animate, .scroll-scale, .scroll-slide-left, .scroll-slide-right').forEach(el => {
      if (!el.classList.contains('visible')) observer.observe(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
  } else {
    initScrollAnimations();
  }

  // ===== 卡片渐入（旧版兼容） =====
  if ('IntersectionObserver' in window) {
    const cardObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = 'running';
          cardObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px 50px 0px' });

    document.querySelectorAll('.card').forEach((card, i) => {
      if (!card.style.animationDelay) card.style.animationDelay = `${i * 0.05}s`;
      if (!card.style.animationPlayState) card.style.animationPlayState = 'paused';
      cardObserver.observe(card);
    });
  }

  // ===== 骨架屏自动移除 =====
  function removeSkeletons() {
    document.querySelectorAll('.skeleton').forEach(el => {
      el.classList.remove('skeleton', 'skeleton-text', 'skeleton-title', 'skeleton-circle', 'skeleton-card');
    });
  }
  window.addEventListener('load', removeSkeletons);
  setTimeout(removeSkeletons, 3000);

  // ===== 网络状态监听 =====
  const networkStatus = document.createElement('div');
  networkStatus.className = 'network-status';
  document.body.appendChild(networkStatus);

  let networkTimer = null;
  function showNetworkStatus(online) {
    networkStatus.textContent = online ? '网络已恢复' : '网络已断开，部分功能可能受限';
    networkStatus.className = 'network-status ' + (online ? 'online' : 'offline') + ' show';
    if (networkTimer) clearTimeout(networkTimer);
    networkTimer = setTimeout(() => {
      networkStatus.classList.remove('show');
    }, online ? 2000 : 5000);
  }

  window.addEventListener('online', () => showNetworkStatus(true));
  window.addEventListener('offline', () => showNetworkStatus(false));

  // ===== 页面可见性API：后台暂停动画节省资源 =====
  document.addEventListener('visibilitychange', () => {
    const animElements = document.querySelectorAll('.card, .scroll-animate, .scroll-scale');
    if (document.hidden) {
      animElements.forEach(el => { el.style.animationPlayState = 'paused'; });
    } else {
      animElements.forEach(el => { el.style.animationPlayState = 'running'; });
    }
  });

  // ===== 错误边界封装 =====
  window.safeRender = function(containerId, renderFn, fallbackHtml) {
    const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
    if (!container) return;
    try {
      renderFn(container);
    } catch (err) {
      console.error('[safeRender] 渲染失败:', err);
      container.innerHTML = fallbackHtml || `
        <div class="error-boundary">
          <div class="error-boundary-title">内容加载失败</div>
          <div class="error-boundary-msg">${err.message || '未知错误'}</div>
          <button class="error-boundary-retry" onclick="location.reload()">刷新页面</button>
        </div>
      `;
    }
  };

  // ===== 键盘快捷键 =====
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Home 回到顶部
    if ((e.ctrlKey || e.metaKey) && e.key === 'Home') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // ESC 关闭 tooltip/popup
    if (e.key === 'Escape') {
      document.querySelectorAll('.tooltip.show, .map-popup.show').forEach(t => t.classList.remove('show'));
    }
    // Ctrl/Cmd + E 导出当前页面数据（如果有）
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      const exportBtn = document.querySelector('.export-btn');
      if (exportBtn) {
        e.preventDefault();
        exportBtn.click();
      }
    }
    // 演示模式快捷键：数字键 1-6 快速切换页面
    if (!e.ctrlKey && !e.metaKey && !e.altKey && /^[1-6]$/.test(e.key)) {
      const pages = ['index.html', 'character.html', 'story.html', 'region.html', 'insight.html', 'album.html'];
      const target = pages[parseInt(e.key) - 1];
      if (target && !location.href.includes(target)) {
        e.preventDefault();
        location.href = target;
      }
    }
  });

  // ===== 外部链接安全 =====
  document.querySelectorAll('a[target="_blank"]').forEach(a => {
    if (!a.rel) a.rel = 'noopener noreferrer';
  });

  // ===== 控制台欢迎信息 =====
  console.log('%c提瓦特音乐数据可视化', 'color:#C9A227;font-size:20px;font-weight:bold;');
  console.log('%c原神音乐热度跨平台数据分析平台', 'color:#D4C9B8;font-size:12px;');
  console.log('%c数据版本：7.1 | 角色：' + (typeof CHARACTERS !== 'undefined' ? CHARACTERS.length : '?') + '人', 'color:#9B8E7B;font-size:11px;');

  // ===== 全局数据导出函数 =====
  window.exportData = function(data, filename, format = 'csv') {
    if (!data || data.length === 0) return;
    let content = '';
    const keys = Object.keys(data[0]);
    if (format === 'csv') {
      content = keys.join(',') + '\n';
      content += data.map(row => keys.map(k => {
        const v = row[k];
        if (v === null || v === undefined) return '';
        const s = String(v);
        if (s.includes(',') || s.includes('\n') || s.includes('"')) return '"' + s.replace(/"/g, '""') + '"';
        return s;
      }).join(',')).join('\n');
    } else if (format === 'json') {
      content = JSON.stringify(data, null, 2);
    }
    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename + '.' + format;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ===== 为图表卡片添加导出按钮 =====
  document.querySelectorAll('.card[data-export]').forEach(card => {
    if (card.querySelector('.export-btn')) return; // 避免重复
    const btn = document.createElement('button');
    btn.className = 'export-btn';
    btn.textContent = '导出数据';
    btn.setAttribute('aria-label', '导出此图表的数据');
    btn.addEventListener('click', () => {
      const exportDataAttr = card.getAttribute('data-export');
      const exportFileAttr = card.getAttribute('data-export-file') || 'data';
      try {
        const data = JSON.parse(exportDataAttr);
        if (Array.isArray(data) && data.length > 0) {
          window.exportData(data, exportFileAttr, 'csv');
        }
      } catch (e) {
        console.warn('导出数据解析失败', e);
      }
    });
    card.appendChild(btn);
  });

  // ===== 地图懒加载支持 =====
  window.initMapLazy = function(containerSelector, initFn) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    // 如果已经在视口内，直接初始化
    const rect = container.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      initFn();
      return;
    }

    // 否则使用 Intersection Observer 懒加载
    const mapObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          initFn();
          mapObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: '200px 0px' });

    mapObserver.observe(container);
  };

  // ===== 性能监控（开发模式） =====
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perf = performance.getEntriesByType('navigation')[0];
        if (perf) {
          console.log('[Perf] DOM加载:', Math.round(perf.domContentLoadedEventEnd) + 'ms');
          console.log('[Perf] 完全加载:', Math.round(perf.loadEventEnd) + 'ms');
          console.log('[Perf] 资源数:', performance.getEntriesByType('resource').length);
        }
      }, 0);
    });
  }
})();
