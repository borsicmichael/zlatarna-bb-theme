/* Zlatarna BB theme — behaviour */
(function () {
  'use strict';

  // Hero video: make sure it plays muted, looping, without controls
  function initHeroVideos(root) {
    (root || document).querySelectorAll('[data-hero] video').forEach(function (v) {
      v.muted = true;
      v.loop = true;
      v.controls = false;
      v.removeAttribute('controls');
      v.setAttribute('playsinline', '');
      var p = v.play && v.play();
      if (p && p.catch) p.catch(function () {});
    });
  }

  // Mobile menu toggle
  function initMenu(root) {
    (root || document).querySelectorAll('[data-menu-toggle]').forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', function () {
        var nav = document.getElementById(btn.getAttribute('aria-controls'));
        if (!nav) return;
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        nav.hidden = open;
      });
    });
  }

  // Tabbed carousels (collections / chain types)
  function initTabs(root) {
    (root || document).querySelectorAll('[data-tabbed]').forEach(function (wrap) {
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
      function current() {
        return panes.filter(function (p) { return !p.hidden; })[0];
      }
      var prev = wrap.querySelector('[data-prev]');
      var next = wrap.querySelector('[data-next]');
      function scrollBy(dir) {
        var p = current();
        if (!p) return;
        var card = p.querySelector('.panel');
        var step = card ? card.getBoundingClientRect().width : 300;
        p.scrollBy({ left: dir * step, behavior: 'smooth' });
      }
      if (prev) prev.addEventListener('click', function () { scrollBy(-1); });
      if (next) next.addEventListener('click', function () { scrollBy(1); });
      select(0);
    });
  }

  // Product page: gallery + option pills -> variant
  function initProduct(root) {
    (root || document).querySelectorAll('[data-product]').forEach(function (el) {
      if (el.dataset.bound) return;
      el.dataset.bound = '1';

      // Gallery
      var thumbs = el.querySelectorAll('[data-thumb]');
      var slides = el.querySelectorAll('[data-slide]');
      thumbs.forEach(function (t) {
        t.addEventListener('click', function () {
          var id = t.getAttribute('data-thumb');
          thumbs.forEach(function (x) { x.setAttribute('aria-current', x === t ? 'true' : 'false'); });
          slides.forEach(function (s) { s.classList.toggle('is-active', s.getAttribute('data-slide') === id); });
        });
      });

      // Variants
      var json = el.querySelector('[data-variants]');
      if (!json) return;
      var variants = JSON.parse(json.textContent);
      var form = el.querySelector('form[action*="/cart/add"]');
      var idInput = form && form.querySelector('input[name="id"]');
      var priceEl = el.querySelector('[data-price]');
      var selectedEl = el.querySelector('[data-selected]');
      var submit = form && form.querySelector('[type="submit"]');
      var fmt = el.getAttribute('data-money-format') || '{{amount_with_comma_separator}} €';

      function money(cents) {
        var v = (cents / 100).toFixed(2).split('.');
        var intPart = v[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        var amount = intPart + ',' + v[1];
        return fmt.replace(/\{\{\s*amount\w*\s*\}\}/, amount);
      }

      function update() {
        var chosen = Array.prototype.map.call(el.querySelectorAll('fieldset[data-option]'), function (fs) {
          var c = fs.querySelector('input:checked');
          return c ? c.value : null;
        });
        var match = variants.filter(function (v) {
          return v.options.every(function (o, i) { return o === chosen[i]; });
        })[0];
        if (!match) {
          if (submit) { submit.disabled = true; }
          return;
        }
        if (idInput) idInput.value = match.id;
        if (priceEl) priceEl.textContent = money(match.price);
        if (selectedEl) selectedEl.textContent = chosen.join(' / ');
        if (submit) {
          submit.disabled = !match.available;
          var label = match.available ? submit.getAttribute('data-label') : submit.getAttribute('data-soldout');
          submit.textContent = label;
        }
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

  function initAll(root) {
    initHeroVideos(root);
    initMenu(root);
    initTabs(root);
    initProduct(root);
  }

  document.addEventListener('DOMContentLoaded', function () { initAll(document); });
  // Theme editor support
  document.addEventListener('shopify:section:load', function (e) { initAll(e.target); });
})();
