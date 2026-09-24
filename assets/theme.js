/* Zlatarna BB theme — behaviour */
(function () {
  'use strict';

  var body = document.body;
  var root = (body && body.getAttribute('data-shop-root')) || '/';
  if (root.slice(-1) !== '/') root += '/';
  var STR = {};
  try { STR = JSON.parse((document.getElementById('CartStrings') || {}).textContent || '{}'); } catch (e) {}

  function money(cents) {
    var fmt = (body && body.getAttribute('data-money-format')) || '€{{amount_with_comma_separator}}';
    var v = (Number(cents || 0) / 100).toFixed(2).split('.');
    var comma = /comma/.test(fmt);
    var intPart = v[0].replace(/\B(?=(\d{3})+(?!\d))/g, comma ? '.' : ',');
    var amount = comma ? intPart + ',' + v[1] : intPart + '.' + v[1];
    if (/no_decimals/.test(fmt)) amount = intPart;
    return fmt.replace(/\{\{\s*amount\w*\s*\}\}/, amount);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---------- Hero video ----------
  function initHeroVideos(scope) {
    (scope || document).querySelectorAll('[data-hero] video').forEach(function (v) {
      v.muted = true; v.loop = true; v.controls = false;
      v.removeAttribute('controls'); v.setAttribute('playsinline', '');
      var p = v.play && v.play();
      if (p && p.catch) p.catch(function () {});
    });
  }

  // ---------- Mobile menu ----------
  function initMenu(scope) {
    (scope || document).querySelectorAll('[data-menu-toggle]').forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', function () {
        var nav = document.getElementById(btn.getAttribute('aria-controls'));
        if (!nav) return;
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        nav.hidden = open;
        document.documentElement.classList.toggle('menu-open', !open);
      });
    });
  }

  // ---------- Tabbed carousels ----------
  function initTabs(scope) {
    (scope || document).querySelectorAll('[data-tabbed]').forEach(function (wrap) {
      if (wrap.dataset.bound) return;
      wrap.dataset.bound = '1';
      var tabs = Array.prototype.slice.call(wrap.querySelectorAll('[role="tab"]'));
      var panes = Array.prototype.slice.call(wrap.querySelectorAll('[role="tabpanel"]'));
      function select(i, focus) {
        tabs.forEach(function (t, j) {
          var on = i === j;
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          t.tabIndex = on ? 0 : -1;
          if (on && focus) t.focus();
        });
        panes.forEach(function (p, j) { p.hidden = i !== j; if (i === j) p.scrollLeft = 0; });
      }
      tabs.forEach(function (t, i) {
        t.addEventListener('click', function () { select(i); });
        t.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight') { e.preventDefault(); select((i + 1) % tabs.length, true); }
          if (e.key === 'ArrowLeft') { e.preventDefault(); select((i - 1 + tabs.length) % tabs.length, true); }
        });
      });
      function current() { return panes.filter(function (p) { return !p.hidden; })[0]; }
      function scrollBy(dir) {
        var p = current(); if (!p) return;
        var card = p.querySelector('.panel');
        var step = card ? card.getBoundingClientRect().width : 300;
        p.scrollBy({ left: dir * step, behavior: 'smooth' });
      }
      var prev = wrap.querySelector('[data-prev]');
      var next = wrap.querySelector('[data-next]');
      if (prev) prev.addEventListener('click', function () { scrollBy(-1); });
      if (next) next.addEventListener('click', function () { scrollBy(1); });
      select(0);
    });
  }

  // ---------- Quantity steppers ----------
  function initQty(scope) {
    (scope || document).querySelectorAll('[data-qty]').forEach(function (q) {
      if (q.dataset.bound) return;
      q.dataset.bound = '1';
      var input = q.querySelector('input');
      function step(d) {
        var min = input.hasAttribute('min') ? Number(input.min) : 1;
        var v = Math.max(min, (parseInt(input.value, 10) || 0) + d);
        input.value = v;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
      var m = q.querySelector('[data-qty-minus]');
      var p = q.querySelector('[data-qty-plus]');
      if (m) m.addEventListener('click', function () { step(-1); });
      if (p) p.addEventListener('click', function () { step(1); });
    });
  }

  // ---------- Product page ----------
  function initProduct(scope) {
    (scope || document).querySelectorAll('[data-product]').forEach(function (el) {
      if (el.dataset.bound) return;
      el.dataset.bound = '1';

      var thumbs = el.querySelectorAll('[data-thumb]');
      var slides = el.querySelectorAll('[data-slide]');
      function show(id) {
        thumbs.forEach(function (x) { x.setAttribute('aria-current', x.getAttribute('data-thumb') === String(id) ? 'true' : 'false'); });
        slides.forEach(function (s) { s.classList.toggle('is-active', s.getAttribute('data-slide') === String(id)); });
      }
      thumbs.forEach(function (t) {
        t.addEventListener('click', function () { show(t.getAttribute('data-thumb')); });
      });

      var json = el.querySelector('[data-variants]');
      if (!json) return;
      var variants = JSON.parse(json.textContent);
      var form = el.querySelector('form[action*="/cart/add"]');
      var idInput = form && form.querySelector('input[name="id"]');
      var priceEl = el.querySelector('[data-price]');
      var selectedEl = el.querySelector('[data-selected]');
      var submit = form && form.querySelector('[type="submit"][name="add"]');
      var label = submit && submit.querySelector('[data-add-label]');

      function update() {
        var chosen = Array.prototype.map.call(el.querySelectorAll('fieldset[data-option]'), function (fs) {
          var c = fs.querySelector('input:checked');
          return c ? c.value : null;
        });
        var match = variants.filter(function (v) {
          return v.options.every(function (o, i) { return o === chosen[i]; });
        })[0];
        if (!match) { if (submit) submit.disabled = true; return; }
        if (idInput) idInput.value = match.id;
        if (priceEl) priceEl.textContent = money(match.price);
        if (selectedEl) selectedEl.textContent = chosen.join(' / ');
        if (submit) {
          submit.disabled = !match.available;
          if (label) label.textContent = match.available ? submit.getAttribute('data-label') : submit.getAttribute('data-soldout');
        }
        if (match.featured_media && match.featured_media.id) show(match.featured_media.id);
        if (window.history && window.history.replaceState) {
          var url = new URL(window.location.href);
          url.searchParams.set('variant', match.id);
          window.history.replaceState({}, '', url.toString());
        }
      }
      el.querySelectorAll('fieldset[data-option] input').forEach(function (i) {
        i.addEventListener('change', update);
      });
    });
  }

  // ---------- Cart (AJAX + drawer) ----------
  var drawer = document.querySelector('[data-cart-drawer]');
  var lastFocus = null;

  function setCount(n) {
    document.querySelectorAll('[data-cart-count]').forEach(function (c) {
      c.textContent = n;
      c.hidden = !n;
    });
  }

  function renderCart(cart) {
    setCount(cart.item_count);
    if (!drawer) return;
    var list = drawer.querySelector('[data-cart-items]');
    var foot = drawer.querySelector('[data-cart-foot]');
    var sub = drawer.querySelector('[data-cart-subtotal]');
    if (!cart.item_count) {
      list.innerHTML = '<div class="drawer__empty"><p>' + esc(STR.empty || '') + '</p><a class="btn btn--sans" href="' + esc(STR.allUrl || '/collections/all') + '">' + esc(STR.continue || '') + '</a></div>';
      foot.hidden = true;
      return;
    }
    foot.hidden = false;
    if (sub) sub.textContent = money(cart.total_price);
    list.innerHTML = cart.items.map(function (item, i) {
      var img = item.image ? item.image.replace(/(\.[a-z]+)(\?|$)/i, '_200x$1$2') : '';
      var variant = item.variant_title && item.variant_title !== 'Default Title' ? '<span class="citem__meta">' + esc(item.variant_title) + '</span>' : '';
      var props = '';
      if (item.properties) {
        Object.keys(item.properties).forEach(function (k) {
          var val = item.properties[k];
          if (val && k.charAt(0) !== '_') props += '<span class="citem__meta">' + esc(k) + ': ' + esc(val) + '</span>';
        });
      }
      return '<div class="citem citem--drawer" data-line="' + (i + 1) + '">' +
        '<a class="citem__img" href="' + esc(item.url) + '">' + (img ? '<img src="' + esc(img) + '" alt="" loading="lazy" width="100" height="100">' : '') + '</a>' +
        '<div class="citem__info"><a class="citem__title" href="' + esc(item.url) + '">' + esc(item.product_title) + '</a>' + variant + props +
        '<span class="citem__meta">' + money(item.final_price) + '</span>' +
        '<div class="citem__row"><div class="qty qty--sm">' +
          '<button type="button" class="qty__btn" data-line-change="-1" aria-label="' + esc(STR.dec || '') + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M5 12h14"/></svg></button>' +
          '<span class="qty__value">' + item.quantity + '</span>' +
          '<button type="button" class="qty__btn" data-line-change="1" aria-label="' + esc(STR.inc || '') + '"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></button>' +
        '</div><button type="button" class="citem__remove" data-line-remove>' + esc(STR.remove || '') + '</button></div></div>' +
        '<div class="citem__total">' + money(item.final_line_price) + '</div></div>';
    }).join('');
  }

  function fetchCart() {
    return fetch(root + 'cart.js', { headers: { Accept: 'application/json' }, credentials: 'same-origin' }).then(function (r) { return r.json(); });
  }

  function openDrawer(showNotice) {
    if (!drawer) { window.location.href = (body && body.getAttribute('data-cart-url')) || '/cart'; return; }
    lastFocus = document.activeElement;
    var notice = drawer.querySelector('[data-cart-notice]');
    if (notice) notice.hidden = !showNotice;
    drawer.hidden = false;
    drawer.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(function () { drawer.classList.add('is-open'); });
    document.documentElement.classList.add('drawer-open');
    var panel = drawer.querySelector('.drawer__panel');
    if (panel) panel.focus();
  }
  function closeDrawer() {
    if (!drawer || drawer.hidden) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('drawer-open');
    setTimeout(function () { drawer.hidden = true; }, 250);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function changeLine(line, qty) {
    if (drawer) drawer.classList.add('is-loading');
    return fetch(root + 'cart/change.js', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ line: line, quantity: qty })
    }).then(function (r) { return r.json(); }).then(function (cart) {
      renderCart(cart);
    }).finally(function () { if (drawer) drawer.classList.remove('is-loading'); });
  }

  function initCart() {
    if (drawer) {
      drawer.addEventListener('click', function (e) {
        if (e.target.closest('[data-cart-close]')) { closeDrawer(); return; }
        var row = e.target.closest('[data-line]');
        if (!row) return;
        var line = Number(row.getAttribute('data-line'));
        var ch = e.target.closest('[data-line-change]');
        if (ch) {
          var cur = Number(row.querySelector('.qty__value').textContent) || 0;
          changeLine(line, Math.max(0, cur + Number(ch.getAttribute('data-line-change'))));
        }
        if (e.target.closest('[data-line-remove]')) changeLine(line, 0);
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });
    }

    // Header cart icon opens the drawer (not on the cart page itself)
    document.addEventListener('click', function (e) {
      var opener = e.target.closest('[data-cart-open]');
      if (!opener || !drawer || /\/cart\/?$/.test(window.location.pathname)) return;
      e.preventDefault();
      fetchCart().then(function (cart) { renderCart(cart); openDrawer(false); });
    });

    // AJAX add to cart for every product form (product page + cards)
    document.addEventListener('submit', function (e) {
      var form = e.target;
      if (!form.matches || !form.matches('form[action*="/cart/add"]')) return;
      if (e.submitter && e.submitter.name === 'checkout') return;
      if (!window.fetch || !window.FormData) return;
      e.preventDefault();
      var btn = form.querySelector('[type="submit"]');
      var labelEl = btn && (btn.querySelector('[data-add-label]') || btn.querySelector('span'));
      var oldLabel = labelEl ? labelEl.textContent : '';
      if (btn) { btn.disabled = true; btn.classList.add('is-loading'); }
      if (labelEl && STR.adding) labelEl.textContent = STR.adding;
      var err = form.querySelector('.form-error');
      if (err) err.remove();
      fetch(root + 'cart/add.js', {
        method: 'POST', credentials: 'same-origin',
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: new FormData(form)
      }).then(function (r) {
        return r.json().then(function (data) { if (!r.ok) throw data; return data; });
      }).then(function () {
        return fetchCart();
      }).then(function (cart) {
        renderCart(cart);
        openDrawer(true);
      }).catch(function (data) {
        var msg = (data && (data.description || data.message)) || STR.error || 'Error';
        var p = document.createElement('p');
        p.className = 'form-error'; p.setAttribute('role', 'alert'); p.textContent = msg;
        form.appendChild(p);
      }).finally(function () {
        if (btn) { btn.disabled = false; btn.classList.remove('is-loading'); }
        if (labelEl) labelEl.textContent = oldLabel;
      });
    });

    // Cart page: quantity changes submit the form automatically
    document.querySelectorAll('[data-cart-form]').forEach(function (f) {
      var t;
      f.addEventListener('change', function (e) {
        if (!e.target.matches('[data-cart-qty]')) return;
        clearTimeout(t);
        t = setTimeout(function () {
          var u = document.createElement('input');
          u.type = 'hidden'; u.name = 'update'; u.value = '1';
          f.appendChild(u);
          f.submit();
        }, 450);
      });
    });
  }

  // ---------- Collection filters / sort ----------
  function initFacets(scope) {
    (scope || document).querySelectorAll('[data-facets]').forEach(function (form) {
      if (form.dataset.bound) return;
      form.dataset.bound = '1';
      function go() {
        var fd = new FormData(form);
        var params = new URLSearchParams();
        fd.forEach(function (v, k) { if (v !== '') params.append(k, v); });
        window.location.href = form.getAttribute('action') + (params.toString() ? '?' + params.toString() : '');
      }
      form.addEventListener('change', function (e) {
        if (e.target.type === 'number') return;
        go();
      });
      form.addEventListener('submit', function (e) { e.preventDefault(); go(); });
      // close other dropdowns when one opens
      var facets = form.querySelectorAll('[data-facet]');
      facets.forEach(function (d) {
        d.addEventListener('toggle', function () {
          if (d.open) facets.forEach(function (o) { if (o !== d) o.open = false; });
        });
      });
      document.addEventListener('click', function (e) {
        if (!e.target.closest('[data-facet]')) facets.forEach(function (o) { o.open = false; });
      });
    });
  }

  // ---------- Product recommendations ----------
  function initRecommendations(scope) {
    (scope || document).querySelectorAll('[data-recommendations]').forEach(function (el) {
      if (el.dataset.bound || !el.getAttribute('data-url')) return;
      el.dataset.bound = '1';
      fetch(el.getAttribute('data-url')).then(function (r) { return r.text(); }).then(function (html) {
        var tmp = document.createElement('div');
        tmp.innerHTML = html;
        var fresh = tmp.querySelector('[data-recommendations]');
        if (fresh && fresh.innerHTML.trim()) el.innerHTML = fresh.innerHTML;
      }).catch(function () {});
    });
  }

  function initAll(scope) {
    initHeroVideos(scope);
    initMenu(scope);
    initTabs(scope);
    initQty(scope);
    initProduct(scope);
    initFacets(scope);
    initRecommendations(scope);
  }

  function boot() { initAll(document); initCart(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  document.addEventListener('shopify:section:load', function (e) { initAll(e.target); });
})();
