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

  /* ---- Living background: spotlight follows pointer (desktop) / scroll (mobile) ---- */
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var root = document.documentElement;
  if (!reduce) {
    var sx = 60, sy = 24, tx = 60, ty = 24, spotOn = false;
    function spotTick() {
      sx += (tx - sx) * 0.1; sy += (ty - sy) * 0.1;
      root.style.setProperty('--mx', sx.toFixed(1) + '%');
      root.style.setProperty('--my', sy.toFixed(1) + '%');
      if (Math.abs(tx - sx) > 0.1 || Math.abs(ty - sy) > 0.1) requestAnimationFrame(spotTick); else spotOn = false;
    }
    function spotWake() { if (!spotOn) { spotOn = true; requestAnimationFrame(spotTick); } }
    if (fine) {
      window.addEventListener('pointermove', function (e) {
        tx = e.clientX / window.innerWidth * 100; ty = e.clientY / window.innerHeight * 100; spotWake();
      }, { passive: true });
    } else {
      var spotScroll = function () {
        var h = document.body.scrollHeight - window.innerHeight;
        var y = lenis ? lenis.scroll : window.scrollY;
        ty = 18 + (h > 0 ? y / h : 0) * 46; spotWake();
      };
      if (lenis) lenis.on('scroll', spotScroll); else window.addEventListener('scroll', spotScroll, { passive: true });
    }
  }

  /* ---- Custom trailing cursor + magnetic buttons (desktop, non-reduced) ---- */
  if (fine && !reduce) {
    var cursor = document.getElementById('cursor');
    var cx = -100, cy = -100, px = -100, py = -100;
    window.addEventListener('pointermove', function (e) { cx = e.clientX; cy = e.clientY; }, { passive: true });
    (function cursorTick() {
      px += (cx - px) * 0.18; py += (cy - py) * 0.18;
      if (cursor) { cursor.style.setProperty('--cx', px.toFixed(1) + 'px'); cursor.style.setProperty('--cy', py.toFixed(1) + 'px'); }
      requestAnimationFrame(cursorTick);
    })();
    document.querySelectorAll('.work-tile').forEach(function (t) {
      t.addEventListener('pointerenter', function () { if (cursor) cursor.classList.add('big'); });
      t.addEventListener('pointerleave', function () { if (cursor) cursor.classList.remove('big'); });
    });
    document.querySelectorAll('.nav-cta, .btn, .service-cta').forEach(function (el) {
      el.classList.add('magnetic');
      el.addEventListener('pointermove', function (e) {
        var b = el.getBoundingClientRect();
        var dx = e.clientX - (b.left + b.width / 2), dy = e.clientY - (b.top + b.height / 2);
        el.style.transform = 'translate(' + (dx * 0.25).toFixed(1) + 'px,' + (dy * 0.4).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }
})();
