
(function () {
  'use strict';

  /* ── Theme Toggle ── */
  const toggle = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;
  let currentTheme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  root.setAttribute('data-theme', currentTheme);
  updateThemeIcon();

  if (toggle) {
    toggle.addEventListener('click', () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', currentTheme);
      toggle.setAttribute('aria-label', 'Switch to ' + (currentTheme === 'dark' ? 'light' : 'dark') + ' mode');
      updateThemeIcon();
    });
  }

  function updateThemeIcon() {
    if (!toggle) return;
    toggle.innerHTML = currentTheme === 'dark'
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }

  /* ── Hash Router ── */
  const pages = document.querySelectorAll('.page');
  const navLinks = document.querySelectorAll('.nav-link');
  const mobileLinks = document.querySelectorAll('.mobile-menu-link');
  let currentPage = null;
  let isTransitioning = false;

  function navigateTo(pageId, skipAnimation) {
    if (isTransitioning) return;
    if (pageId === currentPage) return;

    const nextPage = document.getElementById('page-' + pageId);
    if (!nextPage) return;

    const prevPage = currentPage ? document.getElementById('page-' + currentPage) : null;

    // Update nav
    navLinks.forEach(l => l.classList.toggle('active', l.dataset.page === pageId));

    if (prevPage && !skipAnimation) {
      isTransitioning = true;
      prevPage.classList.remove('active');
      prevPage.classList.add('exiting');

      prevPage.addEventListener('animationend', function handler() {
        prevPage.removeEventListener('animationend', handler);
        prevPage.classList.remove('exiting');
        showPage(nextPage, pageId);
        isTransitioning = false;
      });
    } else {
      if (prevPage) {
        prevPage.classList.remove('active');
        prevPage.classList.remove('exiting');
      }
      showPage(nextPage, pageId, skipAnimation);
    }
  }

  function showPage(el, pageId, skipAnimation) {
    currentPage = pageId;
    el.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Trigger reveal animations for elements in the new page
    requestAnimationFrame(() => {
      observeAnimations(el);
      // Re-observe counters
      el.querySelectorAll('.stat-number[data-count]').forEach(c => {
        c.textContent = '0';
        counterObserver.observe(c);
      });
    });
  }

  // Handle hash changes
  function onHashChange() {
    const hash = location.hash.replace('#', '') || 'home';
    navigateTo(hash);
  }

  window.addEventListener('hashchange', onHashChange);

  // Intercept all internal hash links for smoother behavior
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute('href').replace('#', '');
    if (hash && document.getElementById('page-' + hash)) {
      e.preventDefault();
      if (hash !== currentPage) {
        history.pushState(null, '', '#' + hash);
        navigateTo(hash);
      }
      // Close mobile menu if open
      closeMobileMenu();
    }
  });

  // Initial page
  const initialHash = location.hash.replace('#', '') || 'home';
  navigateTo(initialHash, true);

  /* ── Header Scroll Behavior ── */
  const header = document.getElementById('header');
  let lastScrollY = 0;

  window.addEventListener('scroll', () => {
    requestAnimationFrame(() => {
      const y = window.scrollY;
      header.classList.toggle('header--scrolled', y > 60);
      header.classList.toggle('header--hidden', y > lastScrollY && y > 300);
      lastScrollY = y;
    });
  }, { passive: true });

  /* ── Mobile Menu ── */
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');

  function closeMobileMenu() {
    if (mobileMenu && mobileMenu.classList.contains('open')) {
      mobileMenu.classList.remove('open');
      mobileMenuBtn.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.contains('open');
      if (isOpen) {
        closeMobileMenu();
      } else {
        mobileMenu.classList.add('open');
        mobileMenuBtn.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  }

  /* ── Scroll Reveal (IntersectionObserver) ── */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

  function observeAnimations(container) {
    const els = container.querySelectorAll('.anim-fade, .anim-reveal');
    els.forEach(el => {
      el.classList.remove('visible');
      revealObserver.observe(el);
    });
  }

  /* ── Counter Animation ── */
  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const duration = 1400;
    const start = performance.now();

    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(eased * target);
      if (t < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  /* ── Hero Parallax ── */
  const heroImage = document.querySelector('.hero-image');
  if (heroImage) {
    window.addEventListener('scroll', () => {
      requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < window.innerHeight && currentPage === 'home') {
          heroImage.style.transform = 'scale(1.05) translateY(' + (y * 0.12) + 'px)';
        }
      });
    }, { passive: true });
  }

  // Initial observe for the first page
  const firstPage = document.getElementById('page-' + initialHash);
  if (firstPage) observeAnimations(firstPage);

})();
