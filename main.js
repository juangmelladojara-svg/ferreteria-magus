/* ============================================================
   FERRETERÍA MAGUS — main.js v2
   Handles: nav scroll, hamburger, scroll-reveal, qty buttons,
            cart counter, search, newsletter
   ============================================================ */
(function () {
  'use strict';

  // ── NAV SCROLL ──
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // ── HAMBURGER ──
  const hamburger = document.getElementById('hamburger');
  const mobileNav = document.getElementById('mobile-nav');

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', String(isOpen));
    mobileNav.hidden = !isOpen;
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close mobile nav on link click
  if (mobileNav) {
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        mobileNav.hidden = true;
        document.body.style.overflow = '';
      });
    });
  }

  // ── SCROLL REVEAL ──
  const revealEls = document.querySelectorAll('.reveal-item');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.10 });
    revealEls.forEach(el => observer.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('visible'));
  }

  // ── QUANTITY BUTTONS ──
  // Delegated event — works for all .qty-btn elements
  document.addEventListener('click', e => {
    const btn = e.target.closest('.qty-btn');
    if (!btn) return;
    const wrap = btn.closest('.qty-wrap');
    const input = wrap.querySelector('.qty-input');
    let val = parseInt(input.value, 10) || 1;
    if (btn.classList.contains('qty-plus')) {
      val = Math.min(val + 1, parseInt(input.max, 10) || 999);
    } else if (btn.classList.contains('qty-minus')) {
      val = Math.max(val - 1, parseInt(input.min, 10) || 1);
    }
    input.value = val;
  });

  // Clamp on manual input
  document.querySelectorAll('.qty-input').forEach(input => {
    input.addEventListener('change', () => {
      const min = parseInt(input.min, 10) || 1;
      const max = parseInt(input.max, 10) || 999;
      let val = parseInt(input.value, 10);
      if (isNaN(val) || val < min) val = min;
      if (val > max) val = max;
      input.value = val;
    });
  });

  // ── CART ──
  let cartCount = 0;
  const cartCountEl = document.getElementById('cart-count');

  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      // Get quantity from the sibling qty-input in the same product-actions
      const wrap = btn.closest('.product-actions');
      const qtyInput = wrap ? wrap.querySelector('.qty-input') : null;
      const qty = qtyInput ? parseInt(qtyInput.value, 10) || 1 : 1;

      cartCount += qty;
      if (cartCountEl) cartCountEl.textContent = cartCount;

      // Tactile feedback
      const original = btn.textContent;
      btn.textContent = `+${qty} ✓`;
      btn.style.background = '#16a34a';
      btn.style.borderColor = '#16a34a';
      setTimeout(() => {
        btn.textContent = original;
        btn.style.background = '';
        btn.style.borderColor = '';
      }, 1600);
    });
  });

  // ── SEARCH ──
  const searchBtn = document.getElementById('search-btn');
  const searchInput = document.getElementById('search-input');

  function doSearch() {
    const q = (searchInput ? searchInput.value : '').trim();
    if (q) {
      // Placeholder: in a real implementation, redirect or filter
      console.log('Buscando:', q);
      // Example: window.location.href = `/buscar?q=${encodeURIComponent(q)}`;
    }
  }
  if (searchBtn) searchBtn.addEventListener('click', doSearch);
  if (searchInput) {
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') doSearch();
    });
  }

  // ── NEWSLETTER ──
  const newsletterForm = document.querySelector('.newsletter-form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', e => {
      e.preventDefault();
      const input = newsletterForm.querySelector('.input');
      const email = input.value.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        input.style.borderColor = '#dc2626';
        input.focus();
        return;
      }
      input.style.borderColor = '';
      const btn = newsletterForm.querySelector('.btn');
      btn.textContent = '¡Suscrito!';
      btn.style.background = '#16a34a';
      btn.style.borderColor = '#16a34a';
      input.value = '';
      setTimeout(() => {
        btn.textContent = 'Suscribirse';
        btn.style.background = '';
        btn.style.borderColor = '';
      }, 2500);
    });
  }

  // ── SMOOTH ANCHOR SCROLL ──
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const id = anchor.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const navHeight = nav ? nav.offsetHeight : 104;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 8;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

})();
