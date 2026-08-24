/* ============================================================
   COGNIVEIL LANDING — main.js
   Count-up stats + mobile hamburger menu
   ============================================================ */

(function () {
  'use strict';

  /* ── Easing ─────────────────────────────────────────────── */
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /* ── Count-Up Animation ─────────────────────────────────── */
  function animateCount(el, target, decimals, suffix, duration) {
    const start = performance.now();
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const current = eased * target;
      el.textContent = current.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ── Init Stats via IntersectionObserver ────────────────── */
  function initStats() {
    const statItems = document.querySelectorAll('.stat-item[data-target]');
    if (!statItems.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const valueEl = el.querySelector('.stat-value');
          if (!valueEl || el.dataset.counted) return;
          el.dataset.counted = 'true';

          const target = parseFloat(el.dataset.target);
          const decimals = parseInt(el.dataset.decimals || '0', 10);
          const suffix = el.dataset.suffix || '';
          const delay = parseInt(el.dataset.delay || '0', 10);
          const duration = parseInt(el.dataset.duration || '1500', 10);

          setTimeout(() => {
            animateCount(valueEl, target, decimals, suffix, duration);
          }, delay);

          observer.unobserve(el);
        });
      },
      { threshold: 0.25 }
    );

    statItems.forEach((item) => observer.observe(item));
  }

  /* ── Mobile Menu ────────────────────────────────────────── */
  function initMobileMenu() {
    const burgerBtn = document.getElementById('burger-btn');
    const menuOverlay = document.getElementById('menu-overlay');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileLinks = mobileMenu ? mobileMenu.querySelectorAll('a, .mobile-sign-in') : [];

    if (!burgerBtn || !menuOverlay || !mobileMenu) return;

    function openMenu() {
      burgerBtn.classList.add('open');
      burgerBtn.setAttribute('aria-expanded', 'true');
      menuOverlay.hidden = false;
      mobileMenu.hidden = false;
      document.body.classList.add('menu-open');
    }

    function closeMenu() {
      burgerBtn.classList.remove('open');
      burgerBtn.setAttribute('aria-expanded', 'false');
      menuOverlay.hidden = true;
      mobileMenu.hidden = true;
      document.body.classList.remove('menu-open');
    }

    burgerBtn.addEventListener('click', () => {
      const isOpen = burgerBtn.classList.contains('open');
      isOpen ? closeMenu() : openMenu();
    });

    menuOverlay.addEventListener('click', closeMenu);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });

    mobileLinks.forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 720) closeMenu();
    });
  }

  /* ── Boot ───────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    initStats();
    initMobileMenu();
  });
})();
