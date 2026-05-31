(function () {
  'use strict';

  var CART_KEY = 'ales_cart';

  /* ——— Storage ——— */
  function load() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
    catch (e) { return []; }
  }

  function save(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  /* ——— Cart operations ——— */
  function addItem(id, name, price) {
    var cart = load();
    var existing = cart.find(function (c) { return c.id === id; });
    if (existing) {
      existing.qty++;
    } else {
      cart.push({ id: id, name: name, price: price, qty: 1 });
    }
    save(cart);
    refresh();
    openDrawer();
  }

  function removeItem(id) {
    save(load().filter(function (c) { return c.id !== id; }));
    refresh();
  }

  function changeQty(id, delta) {
    var cart = load();
    var item = cart.find(function (c) { return c.id === id; });
    if (!item) return;
    item.qty = Math.max(0, item.qty + delta);
    if (item.qty === 0) cart = cart.filter(function (c) { return c.id !== id; });
    save(cart);
    refresh();
  }

  function clearCart() {
    save([]);
    refresh();
  }

  /* ——— Helpers ——— */
  function fmt(n) {
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function totalPrice() {
    return load().reduce(function (s, c) { return s + c.price * c.qty; }, 0);
  }

  function totalItems() {
    return load().reduce(function (s, c) { return s + c.qty; }, 0);
  }

  /* ——— DOM updates ——— */
  function refresh() {
    updateBadge();
    renderItems();
  }

  function updateBadge() {
    var count = totalItems();
    document.querySelectorAll('.cart-badge').forEach(function (el) {
      el.textContent = count;
      el.classList.toggle('is-visible', count > 0);
    });
  }

  function renderItems() {
    var body = document.getElementById('cart-items');
    var footer = document.getElementById('cart-footer');
    var totalEl = document.getElementById('cart-total-amt');
    if (!body) return;

    var cart = load();

    if (cart.length === 0) {
      body.innerHTML =
        '<div class="cart-empty">' +
          '<i class="fas fa-cart-shopping" aria-hidden="true"></i>' +
          '<p>Tu carrito está vacío</p>' +
        '</div>';
      if (footer) footer.hidden = true;
      return;
    }

    if (footer) footer.hidden = false;

    body.innerHTML = cart.map(function (item) {
      return (
        '<div class="cart-item">' +
          '<div class="cart-item__info">' +
            '<span class="cart-item__name">' + esc(item.name) + '</span>' +
            '<span class="cart-item__subtotal">' + fmt(item.price * item.qty) + '</span>' +
          '</div>' +
          '<div class="cart-item__row">' +
            '<div class="cart-item__qty">' +
              '<button class="cart-qty-btn" data-action="dec" data-id="' + esc(item.id) + '" aria-label="Menos cantidad">−</button>' +
              '<span class="cart-qty-num">' + item.qty + '</span>' +
              '<button class="cart-qty-btn" data-action="inc" data-id="' + esc(item.id) + '" aria-label="Más cantidad">+</button>' +
            '</div>' +
            '<button class="cart-remove-btn" data-id="' + esc(item.id) + '" aria-label="Eliminar ' + esc(item.name) + '">' +
              '<i class="fas fa-trash-can" aria-hidden="true"></i>' +
            '</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    if (totalEl) totalEl.textContent = fmt(totalPrice());
  }

  /* ——— Drawer ——— */
  function openDrawer() {
    var drawer = document.getElementById('cart-drawer');
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('cart-is-open');
    var closeBtn = document.getElementById('cart-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeDrawer() {
    var drawer = document.getElementById('cart-drawer');
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('cart-is-open');
  }

  /* ——— Inject drawer HTML (once) ——— */
  function injectDrawer() {
    if (document.getElementById('cart-drawer')) return;
    var el = document.createElement('div');
    el.setAttribute('class', 'cart-drawer');
    el.setAttribute('id', 'cart-drawer');
    el.setAttribute('aria-hidden', 'true');
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Carrito de compras');
    el.innerHTML =
      '<div class="cart-drawer__overlay" id="cart-overlay"></div>' +
      '<aside class="cart-drawer__panel">' +
        '<div class="cart-drawer__head">' +
          '<h2 class="cart-drawer__title">' +
            '<i class="fas fa-cart-shopping" aria-hidden="true"></i> Carrito' +
          '</h2>' +
          '<button class="cart-drawer__close" id="cart-close" aria-label="Cerrar carrito">' +
            '<i class="fas fa-xmark" aria-hidden="true"></i>' +
          '</button>' +
        '</div>' +
        '<div class="cart-drawer__body" id="cart-items"></div>' +
        '<div class="cart-drawer__footer" id="cart-footer" hidden>' +
          '<div class="cart-total">' +
            '<span>Total estimado</span>' +
            '<strong id="cart-total-amt">$0</strong>' +
          '</div>' +
          '<button class="btn btn--primary cart-checkout-btn" id="cart-checkout">' +
            '<i class="fas fa-paper-plane" aria-hidden="true"></i>' +
            ' Solicitar cotización' +
          '</button>' +
          '<button class="btn btn--ghost cart-clear-btn" id="cart-clear">Vaciar carrito</button>' +
        '</div>' +
      '</aside>';
    document.body.appendChild(el);
  }

  /* ——— Checkout ——— */
  function checkout() {
    var cart = load();
    if (!cart.length) return;

    var lines = cart.map(function (c) {
      return c.name + (c.qty > 1 ? ' ×' + c.qty : '') + ' — ' + fmt(c.price * c.qty);
    });
    lines.push('');
    lines.push('Total estimado: ' + fmt(totalPrice()));

    var qs = '?tipo=ecommerce&msg=' + encodeURIComponent(lines.join('\n'));
    window.location.href = 'contacto.html' + qs;
  }

  /* ——— Event delegation (single listener) ——— */
  function wire() {
    document.addEventListener('click', function (e) {
      /* Cart toggle */
      if (e.target.closest('#cart-toggle')) {
        var drawer = document.getElementById('cart-drawer');
        if (drawer && drawer.classList.contains('is-open')) {
          closeDrawer();
        } else {
          openDrawer();
        }
        return;
      }

      /* Close via X or overlay */
      if (e.target.closest('#cart-close') || e.target.closest('#cart-overlay')) {
        closeDrawer();
        return;
      }

      /* Qty buttons */
      var qtyBtn = e.target.closest('.cart-qty-btn');
      if (qtyBtn) {
        changeQty(qtyBtn.dataset.id, qtyBtn.dataset.action === 'inc' ? 1 : -1);
        return;
      }

      /* Remove button */
      var removeBtn = e.target.closest('.cart-remove-btn');
      if (removeBtn) {
        removeItem(removeBtn.dataset.id);
        return;
      }

      /* Clear cart */
      if (e.target.closest('#cart-clear')) {
        clearCart();
        return;
      }

      /* Checkout */
      if (e.target.closest('#cart-checkout')) {
        checkout();
        return;
      }

      /* Add to cart */
      var addBtn = e.target.closest('[data-add-to-cart]');
      if (addBtn) {
        var id    = addBtn.dataset.cartId;
        var name  = addBtn.dataset.cartName;
        var price = parseFloat(addBtn.dataset.cartPrice);
        if (!id || !name || isNaN(price)) return;

        addItem(id, name, price);

        /* Visual feedback */
        var orig = addBtn.innerHTML;
        addBtn.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> ¡Agregado!';
        addBtn.disabled = true;
        setTimeout(function () {
          addBtn.innerHTML = orig;
          addBtn.disabled = false;
        }, 1400);
        return;
      }
    });

    /* Escape key closes drawer */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
    });
  }

  /* ——— Pre-fill contacto.html form from URL params ——— */
  function prefillContactForm() {
    var form = document.getElementById('contact-form');
    if (!form || !window.location.search) return;

    var params = new URLSearchParams(window.location.search);
    var msg  = params.get('msg');
    var tipo = params.get('tipo');

    if (msg && form.mensaje) form.mensaje.value = msg;
    if (tipo && form.tipo) {
      var opt = form.tipo.querySelector('option[value="' + tipo + '"]');
      if (opt) form.tipo.value = tipo;
    }
  }

  /* ——— Init ——— */
  function init() {
    injectDrawer();
    refresh();
    wire();
    prefillContactForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Public API */
  window.AlesCart = { add: addItem, remove: removeItem };
})();
