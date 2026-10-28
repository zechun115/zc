/* ==================== 统一顶栏风格注入 ====================
   全站顶部横幅：不显示人物立绘背景，统一使用原神金色纹理风格，
   保留 7 元素图标条、金色装饰角、金色标题、上下金线装饰。
   applyPageHero 接口保留兼容 character-detail.js，但不设置任何立绘图。
   © 米哈游版权所有 · 仅供个人学习与非商业用途
   ==================================================================== */

(function () {
  "use strict";

  /**
   * 激活 .page-hero 的金色纹理风格（按需求已移除人物立绘）
   * 接口为兼容保留，实际只启用 no-bg 纹理兜底层。
   */
  function applyPageHero(heroEl, charName) {
    if (!heroEl) return;
    if (charName) heroEl.dataset.hero = charName;
    // 全站统一：禁止任何人物立绘背景，强制使用金色纹理样式
    heroEl.classList.add("no-bg");
    var bg = heroEl.querySelector(".page-hero-bg");
    if (bg) {
      bg.style.backgroundImage = "";
    }
  }

  window.applyPageHero = applyPageHero;

  function initStaticHero() {
    var hero = document.querySelector(".page-hero");
    if (hero) {
      // 无论 data-hero 是否设置，都不使用人物立绘
      applyPageHero(hero, hero.dataset.hero || "");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initStaticHero);
  } else {
    initStaticHero();
  }
})();
