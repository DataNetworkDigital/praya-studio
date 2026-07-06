(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Smooth momentum scroll (Lenis) ---- */
  var lenis = null;
  if (!reduce && typeof Lenis !== 'undefined' && !/nolenis/.test(location.search)) {
    lenis = new Lenis({ duration: 1.1, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  function scrollToId(id) {
    var el = document.querySelector(id);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: 0 });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  }

  /* ---- Anchor links ---- */
  document.querySelectorAll('a[data-link]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var href = a.getAttribute('href');
      if (href && href.charAt(0) === '#') { e.preventDefault(); scrollToId(href); }
    });
  });

  /* ---- Reveal on scroll ---- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal, .reveal-mask, .stagger').forEach(function (el) { io.observe(el); });

  /* ---- Count-up stats ---- */
  var countIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target, to = parseInt(el.dataset.to, 10);
      countIO.unobserve(el);
      if (reduce) { el.textContent = to; return; }
      var start = performance.now(), dur = 1400;
      function step(now) {
        var p = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * to);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('.stat-num').forEach(function (el) { countIO.observe(el); });

  /* ---- Nav: scrolled bg, active section, sliding indicator, light sections ---- */
  var nav = document.getElementById('nav');
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var indicator = document.getElementById('navIndicator');
  var sideLabel = document.getElementById('sideLabel');
  var SECTION_NAMES = { hero: 'Studio', about: 'About', services: 'Services', work: 'Work', results: 'Results', contact: 'Contact' };

  function moveIndicator(link) {
    if (!indicator || !link) return;
    indicator.style.width = link.offsetWidth + 'px';
    indicator.style.transform = 'translateX(' + link.offsetLeft + 'px)';
  }

  function setActive(id) {
    var active = null;
    links.forEach(function (l) {
      var on = l.getAttribute('href') === '#' + id;
      l.classList.toggle('is-active', on);
      if (on) active = l;
    });
    moveIndicator(active);
  }

  var sections = Array.prototype.slice.call(document.querySelectorAll('main section[id]'));
  var navIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        var id = en.target.id;
        var mapped = ({ results: 'work', contact: 'contact' })[id] || id;
        setActive(mapped);
        nav.classList.toggle('on-light', en.target.classList.contains('section-olive'));
        nav.classList.toggle('on-cream', en.target.classList.contains('section-cream'));
        if (sideLabel && SECTION_NAMES[id]) sideLabel.textContent = SECTION_NAMES[id];
      }
    });
  }, { threshold: 0.5 });
  sections.forEach(function (s) { navIO.observe(s); });

  function onScroll() {
    var y = lenis ? lenis.scroll : window.scrollY;
    nav.classList.toggle('scrolled', y > 40);
  }
  if (lenis) lenis.on('scroll', onScroll); else window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  window.addEventListener('load', function () {
    var current = links.find(function (l) { return l.classList.contains('is-active'); }) || links[0];
    moveIndicator(current);
  });
  window.addEventListener('resize', function () {
    var current = links.find(function (l) { return l.classList.contains('is-active'); }) || links[0];
    moveIndicator(current);
  });

  /* ---- Mobile menu ---- */
  var burger = document.getElementById('navBurger');
  function closeMenu() { document.body.classList.remove('menu-open'); if (lenis) lenis.start(); }
  if (burger) {
    burger.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      if (lenis) { open ? lenis.stop() : lenis.start(); }
    });
  }
  document.querySelectorAll('[data-close]').forEach(function (a) {
    a.addEventListener('click', function () { closeMenu(); });
  });

  /* ---- Hero parallax (subtle, desktop, non-reduced) ---- */
  var heroBg = document.getElementById('heroBg');
  if (heroBg && !reduce) {
    function parallax() {
      var y = lenis ? lenis.scroll : window.scrollY;
      if (y < window.innerHeight) heroBg.style.transform = 'translateY(' + (y * 0.14) + 'px)';
    }
    if (lenis) lenis.on('scroll', parallax); else window.addEventListener('scroll', parallax, { passive: true });
  }
})();
