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
      window.location.href = 'catalogo.html?q=' + encodeURIComponent(q);
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

  // ── DEPARTMENT BROWSER ──
  const DEPT_ICONS = {
    'Ferreteria':                 '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    'Herramientas':               '<path d="M3 3h7v7H3z"/><path d="M14 3h7v7h-7z"/><path d="M14 14h7v7h-7z"/><path d="M3 14h7v7H3z"/>',
    'Gasfiteria':                 '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>',
    'Electricidad':               '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
    'Pinturas y Quimicos':        '<path d="M19 11l-8-8-8.5 8.5a5.5 5.5 0 0 0 7.78 7.78L19 11z"/><path d="M20 16.5a2.5 2.5 0 1 1 5 0c0 2.5-2.5 4-2.5 4s-2.5-1.5-2.5-4z"/>',
    'Limpieza':                   '<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.04z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.04z"/>',
    'Adhesivos y Pegamentos':     '<path d="M7 4V2h10v2M9 20h6M12 4v16M8 8h8"/>',
    'Seguridad':                  '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    'Materiales de Construccion': '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
    'Tuberias y Conexiones':      '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>',
    'Riego':                      '<line x1="12" y1="22" x2="12" y2="11"/><path d="M5 9l7-7 7 7"/><path d="M5 9h14"/>',
    'Aceites y Lubricantes':      '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
    'Soldadura':                  '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    'Insumos':                    '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
    'default':                    '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>'
  };

  const deptGrid = document.getElementById('dept-grid');
  if (deptGrid) {
    fetch('products.json')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) { deptGrid.innerHTML = ''; return; }

        // Contar por categoría y ordenar de mayor a menor
        const counts = {};
        data.productos.forEach(p => { counts[p.categoria] = (counts[p.categoria] || 0) + 1; });
        const cats = Object.entries(counts).sort((a, b) => b[1] - a[1]);

        deptGrid.innerHTML = cats.map(([cat, n]) => {
          const icon = DEPT_ICONS[cat] || DEPT_ICONS['default'];
          const slug = encodeURIComponent(cat);
          return `
            <a href="catalogo.html?cat=${slug}" class="dept-card reveal-item" aria-label="${cat} — ${n} productos">
              <div class="dept-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  ${icon}
                </svg>
              </div>
              <div class="dept-info">
                <span class="dept-name">${cat}</span>
                <span class="dept-count">${n.toLocaleString('es-CL')} productos</span>
              </div>
              <svg class="dept-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>`;
        }).join('');

        // Activar reveal en tarjetas dinámicas
        if ('IntersectionObserver' in window) {
          const revealObs = new IntersectionObserver(entries => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObs.unobserve(entry.target);
              }
            });
          }, { threshold: 0.08 });
          deptGrid.querySelectorAll('.reveal-item').forEach(el => revealObs.observe(el));
        } else {
          deptGrid.querySelectorAll('.reveal-item').forEach(el => el.classList.add('visible'));
        }
      })
      .catch(() => { deptGrid.innerHTML = ''; });
  }

})();

