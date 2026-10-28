// Small enhancements: menu, dark mode, project filter and image viewer.
// The site still works without this file (all projects stay visible).

(function () {
  var root = document.documentElement;

  /* ---------- mobile menu ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('is-open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- preview banner ---------- */
  var banner = document.querySelector('.banner');
  var bannerClose = document.querySelector('.banner-close');
  if (banner && bannerClose) {
    try { if (sessionStorage.getItem('hide-banner')) banner.hidden = true; } catch (e) {}
    bannerClose.addEventListener('click', function () {
      banner.hidden = true;
      try { sessionStorage.setItem('hide-banner', '1'); } catch (e) {}
    });
  }

  /* ---------- highlight the current section in the nav ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav a[data-nav]'));
  var onHome = !!document.getElementById('home');
  if (onHome && navLinks.length && 'IntersectionObserver' in window) {
    var setActive = function (id) {
      navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('data-nav') === id); });
    };
    setActive('home');
    var seen = navLinks.map(function (a) { return document.getElementById(a.getAttribute('data-nav')); }).filter(Boolean);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setActive(e.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    seen.forEach(function (el) { io.observe(el); });
  }

  /* ---------- light and dark mode ---------- */
  var themeBtn = document.querySelector('.theme-btn');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var current = root.getAttribute('data-theme');
      if (!current) {
        current = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      var next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  /* ---------- project filter ---------- */
  var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  var items = Array.prototype.slice.call(document.querySelectorAll('.card-item'));

  function applyFilter(name) {
    buttons.forEach(function (b) {
      var on = b.getAttribute('data-filter') === name;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    items.forEach(function (item) {
      item.hidden = !(name === 'all' || item.getAttribute('data-category') === name);
    });
  }

  buttons.forEach(function (b) {
    b.addEventListener('click', function () { applyFilter(b.getAttribute('data-filter')); });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-filter-link]'), function (a) {
    a.addEventListener('click', function () { applyFilter(a.getAttribute('data-filter-link')); });
  });

  /* ---------- image viewer ---------- */
  var dialog = document.querySelector('.lightbox');
  var shots = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));
  if (dialog && shots.length && typeof dialog.showModal === 'function') {
    var img = dialog.querySelector('img');
    var cap = dialog.querySelector('figcaption');
    var index = 0;

    function show(i) {
      index = (i + shots.length) % shots.length;
      var s = shots[index];
      img.src = s.getAttribute('data-full');
      img.alt = s.getAttribute('data-alt') || '';
      cap.textContent = s.getAttribute('data-caption') || '';
    }

    shots.forEach(function (s, i) {
      s.addEventListener('click', function () { show(i); dialog.showModal(); });
    });
    dialog.querySelector('.lb-close').addEventListener('click', function () { dialog.close(); });
    dialog.querySelector('.lb-prev').addEventListener('click', function () { show(index - 1); });
    dialog.querySelector('.lb-next').addEventListener('click', function () { show(index + 1); });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
  } else {
    // No dialog support: let the images open in a new tab instead.
    shots.forEach(function (s) {
      s.addEventListener('click', function () { window.open(s.getAttribute('data-full'), '_blank'); });
    });
  }
})();
