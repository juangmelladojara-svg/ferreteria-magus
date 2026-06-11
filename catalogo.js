/* ============================================================
   FERRETERÍA MAGUS — catalogo.js
   Carga products.json y maneja filtros, búsqueda, paginación
   ============================================================ */
(function () {
  'use strict';

  // ── CONFIG ──
  const POR_PAGINA  = 40;
  let   todosLosProductos = [];
  let   filtrados         = [];
  let   paginaActual      = 1;
  let   vistaActual       = 'grid';   // 'grid' | 'list'
  let   categoriaActiva   = 'todas';
  let   soloConStock      = true;
  let   ordenActual       = 'nombre-asc';
  let   busquedaActual    = '';
  let   precioMin         = null;
  let   precioMax         = null;

  // ── ELEMENTOS ──
  const grid         = document.getElementById('products-grid');
  const pagination   = document.getElementById('pagination');
  const resultsCount = document.getElementById('results-count');
  const emptyState   = document.getElementById('empty-state');
  const catList      = document.getElementById('cat-list');
  const searchInput  = document.getElementById('search-input');
  const sortSelect   = document.getElementById('sort-select');
  const filterStock  = document.getElementById('filter-stock');
  const priceMin     = document.getElementById('price-min');
  const priceMax     = document.getElementById('price-max');
  const cartCountEl  = document.getElementById('cart-count');
  const totalCountEl = document.getElementById('total-count');
  const updateDateEl = document.getElementById('update-date');

  let cartCount = 0;

  // ── CARGAR DATOS ──
  fetch('products.json')
    .then(r => {
      if (!r.ok) throw new Error('products.json no encontrado');
      return r.json();
    })
    .then(data => {
      todosLosProductos = data.productos || [];

      // Fecha de actualización
      if (data.generado && updateDateEl) {
        const d = new Date(data.generado);
        updateDateEl.textContent = d.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
      }
      if (totalCountEl) totalCountEl.textContent = todosLosProductos.length.toLocaleString('es-CL');

      // Leer parámetros URL (?cat=Ferreteria&q=tornillo)
      const params = new URLSearchParams(window.location.search);
      const urlCat = params.get('cat');
      const urlQ   = params.get('q');
      if (urlQ) {
        busquedaActual = urlQ;
        if (searchInput) searchInput.value = urlQ;
      }

      // Estado inicial del checkbox de stock
      soloConStock = filterStock ? filterStock.checked : true;

      buildCatList(data.categorias || []);

      // Pre-seleccionar categoría si viene en la URL
      if (urlCat && data.categorias.includes(urlCat)) {
        categoriaActiva = urlCat;
      }

      aplicarFiltros();

      // Scroll a resultados si llegamos con filtro
      if (urlCat || urlQ) {
        setTimeout(() => {
          document.querySelector('.catalog-layout')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    })
    .catch(() => {
      // products.json no existe aún — mostrar mensaje amistoso
      grid.innerHTML = `
        <div class="empty-state" style="display:block;grid-column:1/-1">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <h3>Catálogo no cargado aún</h3>
          <p>Coloca tu archivo Excel en esta carpeta y ejecuta:<br><code style="background:var(--bg-3);padding:4px 8px;border-radius:4px;font-size:0.82rem;">node convertir-excel.js tu-archivo.xlsx</code></p>
        </div>`;
      if (resultsCount) resultsCount.textContent = '0 productos';
    });

  // ── CONSTRUIR LISTA DE CATEGORÍAS ──
  function buildCatList(categorias) {
    if (!catList) return;
    catList.innerHTML = '';

    // Botón "Todas"
    const btnTodas = document.createElement('button');
    btnTodas.className = 'cat-btn' + (categoriaActiva === 'todas' ? ' active' : '');
    btnTodas.dataset.cat = 'todas';
    const totalStock = todosLosProductos.filter(p => !soloConStock || p.enStock).length;
    btnTodas.innerHTML = `<span>Todas</span><span class="cat-count">${totalStock.toLocaleString('es-CL')}</span>`;
    btnTodas.addEventListener('click', () => setCat('todas'));
    catList.appendChild(btnTodas);

    categorias.forEach(cat => {
      const count = todosLosProductos.filter(p => p.categoria === cat && (!soloConStock || p.enStock)).length;
      const btn   = document.createElement('button');
      btn.className    = 'cat-btn' + (cat === categoriaActiva ? ' active' : '');
      btn.dataset.cat  = cat;
      btn.innerHTML    = `<span>${cat}</span><span class="cat-count">${count.toLocaleString('es-CL')}</span>`;
      btn.addEventListener('click', () => setCat(cat));
      catList.appendChild(btn);
    });
  }

  function setCat(cat) {
    categoriaActiva = cat;
    paginaActual    = 1;
    catList.querySelectorAll('.cat-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.cat === cat);
    });
    aplicarFiltros();
  }

  // ── FILTROS ──
  function aplicarFiltros() {
    const q = busquedaActual.toLowerCase().trim();

    filtrados = todosLosProductos.filter(p => {
      if (soloConStock && !p.enStock) return false;
      if (categoriaActiva !== 'todas' && p.categoria !== categoriaActiva) return false;
      if (q && !p.nombre.toLowerCase().includes(q)) return false;
      if (precioMin !== null && p.precio < precioMin) return false;
      if (precioMax !== null && p.precio > precioMax) return false;
      return true;
    });

    // Ordenar
    filtrados.sort((a, b) => {
      switch (ordenActual) {
        case 'nombre-asc':   return a.nombre.localeCompare(b.nombre, 'es');
        case 'nombre-desc':  return b.nombre.localeCompare(a.nombre, 'es');
        case 'precio-asc':   return a.precio - b.precio;
        case 'precio-desc':  return b.precio - a.precio;
        case 'stock-desc':   return b.stock - a.stock;
        default:             return 0;
      }
    });

    paginaActual = 1;
    renderPage();
  }

  // ── RENDER ──
  function renderPage() {
    const total    = filtrados.length;
    const inicio   = (paginaActual - 1) * POR_PAGINA;
    const fin      = Math.min(inicio + POR_PAGINA, total);
    const pagina   = filtrados.slice(inicio, fin);

    // Results count
    if (resultsCount) {
      resultsCount.textContent = `${total.toLocaleString('es-CL')} producto${total !== 1 ? 's' : ''}`;
    }

    // Empty state
    if (emptyState) emptyState.hidden = total > 0;

    // Render tarjetas
    grid.innerHTML = '';
    pagina.forEach(p => {
      grid.appendChild(buildCard(p));
    });

    renderPagination(total);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function buildCard(p) {
    const card = document.createElement('article');
    card.className = 'prod-card';

    const precioFmt  = p.precio > 0
      ? `$${p.precio.toLocaleString('es-CL')}`
      : 'Consultar';
    const stockClass = p.enStock ? 'in' : 'out';
    const stockText  = p.enStock ? `Stock: ${p.stock.toLocaleString('es-CL')} ${p.unidad}` : 'Sin stock';

    card.innerHTML = `
      <div class="prod-card-img">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
        ${p.subcategoria || p.categoria}
      </div>
      <div class="prod-card-body">
        <span class="prod-categoria">${p.categoria}</span>
        <h3 class="prod-nombre">${p.nombre}</h3>
        <span class="prod-stock-badge ${stockClass}">${stockText}</span>
        <span class="prod-precio">${precioFmt}</span>
      </div>
      <div class="prod-card-footer">
        <div class="prod-qty-wrap">
          <button class="prod-qty-btn minus" aria-label="Restar">−</button>
          <input type="number" class="prod-qty-input" value="1" min="1" max="${Math.max(p.stock,999)}" aria-label="Cantidad" />
          <button class="prod-qty-btn plus" aria-label="Sumar">+</button>
        </div>
        <button class="btn-add-cart" ${!p.enStock ? 'disabled' : ''} data-nombre="${p.nombre}">
          ${p.enStock ? 'Agregar' : 'Sin stock'}
        </button>
      </div>`;

    // Eventos qty
    const qtyInput = card.querySelector('.prod-qty-input');
    card.querySelector('.minus').addEventListener('click', () => {
      qtyInput.value = Math.max(1, parseInt(qtyInput.value) - 1);
    });
    card.querySelector('.plus').addEventListener('click', () => {
      const max = parseInt(qtyInput.max) || 999;
      qtyInput.value = Math.min(max, parseInt(qtyInput.value) + 1);
    });

    // Evento carrito
    const addBtn = card.querySelector('.btn-add-cart');
    if (p.enStock) {
      addBtn.addEventListener('click', () => {
        const qty = parseInt(qtyInput.value) || 1;
        cartCount += qty;
        if (cartCountEl) cartCountEl.textContent = cartCount;
        const orig = addBtn.textContent;
        addBtn.textContent = `+${qty} ✓`;
        addBtn.style.background = '#16a34a';
        setTimeout(() => {
          addBtn.textContent = orig;
          addBtn.style.background = '';
        }, 1500);
      });
    }

    return card;
  }

  // ── PAGINACIÓN ──
  function renderPagination(total) {
    if (!pagination) return;
    const totalPages = Math.ceil(total / POR_PAGINA);
    pagination.innerHTML = '';
    if (totalPages <= 1) return;

    const addBtn = (label, page, disabled = false, active = false) => {
      const btn = document.createElement('button');
      btn.className = 'page-btn' + (active ? ' active' : '');
      btn.textContent = label;
      btn.disabled = disabled;
      btn.addEventListener('click', () => { paginaActual = page; renderPage(); });
      pagination.appendChild(btn);
    };

    const addEllipsis = () => {
      const span = document.createElement('span');
      span.className = 'page-ellipsis';
      span.textContent = '…';
      pagination.appendChild(span);
    };

    addBtn('‹', paginaActual - 1, paginaActual === 1);

    const range = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= paginaActual - 2 && i <= paginaActual + 2)) {
        range.push(i);
      }
    }

    let prev = null;
    range.forEach(page => {
      if (prev !== null && page - prev > 1) addEllipsis();
      addBtn(page, page, false, page === paginaActual);
      prev = page;
    });

    addBtn('›', paginaActual + 1, paginaActual === totalPages);
  }

  // ── EVENTOS ──
  if (filterStock) {
    filterStock.addEventListener('change', () => {
      soloConStock = filterStock.checked;
      paginaActual = 1;
      aplicarFiltros();
    });
  }

  if (searchInput) {
    let debounce;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        busquedaActual = searchInput.value;
        paginaActual   = 1;
        aplicarFiltros();
      }, 280);
    });
  }

  if (document.getElementById('search-btn')) {
    document.getElementById('search-btn').addEventListener('click', () => {
      busquedaActual = searchInput ? searchInput.value : '';
      paginaActual   = 1;
      aplicarFiltros();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      ordenActual  = sortSelect.value;
      paginaActual = 1;
      aplicarFiltros();
    });
  }

  let debouncePrice;
  function onPriceChange() {
    clearTimeout(debouncePrice);
    debouncePrice = setTimeout(() => {
      precioMin    = priceMin && priceMin.value ? parseInt(priceMin.value) : null;
      precioMax    = priceMax && priceMax.value ? parseInt(priceMax.value) : null;
      paginaActual = 1;
      aplicarFiltros();
    }, 400);
  }
  if (priceMin) priceMin.addEventListener('input', onPriceChange);
  if (priceMax) priceMax.addEventListener('input', onPriceChange);

  // Limpiar filtros
  function limpiarFiltros() {
    busquedaActual  = '';
    categoriaActiva = 'todas';
    soloConStock    = true;
    precioMin       = null;
    precioMax       = null;
    if (searchInput)   searchInput.value   = '';
    if (filterStock)   filterStock.checked = true;
    if (priceMin)      priceMin.value      = '';
    if (priceMax)      priceMax.value      = '';
    if (sortSelect)    sortSelect.value    = 'nombre-asc';
    catList.querySelectorAll('.cat-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === 'todas'));
    paginaActual = 1;
    aplicarFiltros();
  }

  document.getElementById('clear-filters')?.addEventListener('click', limpiarFiltros);
  document.getElementById('empty-clear')?.addEventListener('click', limpiarFiltros);

  // Vista grid/list
  const viewGrid = document.getElementById('view-grid');
  const viewList = document.getElementById('view-list');
  viewGrid?.addEventListener('click', () => {
    vistaActual = 'grid';
    grid.classList.remove('list-view');
    viewGrid.classList.add('active');
    viewList?.classList.remove('active');
  });
  viewList?.addEventListener('click', () => {
    vistaActual = 'list';
    grid.classList.add('list-view');
    viewList.classList.add('active');
    viewGrid?.classList.remove('active');
  });

  // Sidebar mobile toggle
  const sidebar       = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');

  // Crear overlay
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  document.body.appendChild(overlay);

  sidebarToggle?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
    overlay.classList.toggle('show');
  });
  overlay.addEventListener('click', () => {
    sidebar?.classList.remove('open');
    overlay.classList.remove('show');
  });

  // Nav scroll
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav?.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

})();
