/* ============================================================
   CAPABLANCA SABANETA — COMPONENTES AVANZADOS
   Slider del hero, máquina de escribir, contadores, barras de
   habilidad, pestañas, flip cards, modales, ticker y muro social.
   Cada módulo se desactiva solo si su marcado no está en la página.
   ============================================================ */
(function () {
  'use strict';

  var DATA = window.CLUB || {};
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ==========================================================
     1. PRELOADER
     ========================================================== */
  function initPreloader() {
    var pl = $('.preloader');
    if (!pl) return;
    function done() {
      pl.classList.add('is-done');
      window.setTimeout(function () { pl.remove(); }, 700);
    }
    if (document.readyState === 'complete') { window.setTimeout(done, 350); }
    else { window.addEventListener('load', function () { window.setTimeout(done, 350); }); }
    // Red de seguridad: nunca dejar la página tapada si algo falla al cargar.
    window.setTimeout(done, 4500);
  }

  /* ==========================================================
     2. SLIDER DEL HERO — autoplay cada 3 s
     ========================================================== */
  function initHeroSlider() {
    var root = $('.hero__slider');
    if (!root) return;
    var slides = $$('.hero__slide', root);
    if (slides.length < 2) return;

    var dotsHost = $('.hero__dots');
    var counterNow = $('.hero__counter b');
    var counterAll = $('.hero__counter i');
    var index = 0, timer = null, paused = false;
    var DELAY = 3000;

    // Construye los puntos
    var dots = [];
    if (dotsHost) {
      slides.forEach(function (_, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'hero__dot' + (i === 0 ? ' is-active' : '');
        b.setAttribute('aria-label', 'Ir a la imagen ' + (i + 1) + ' de ' + slides.length);
        b.addEventListener('click', function () { go(i); restart(); });
        dotsHost.appendChild(b);
        dots.push(b);
      });
    }
    if (counterAll) counterAll.textContent = String(slides.length).padStart(2, '0');

    function go(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) {
        var on = n === index;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
        // Reinicia el Ken Burns forzando un reflujo
        if (on && !reduce) {
          var img = s.querySelector('img');
          if (img) { img.style.animation = 'none'; void img.offsetWidth; img.style.animation = ''; }
        }
      });
      dots.forEach(function (d, n) { d.classList.toggle('is-active', n === index); });
      if (counterNow) counterNow.textContent = String(index + 1).padStart(2, '0');
    }
    function next() { go(index + 1); }
    function prev() { go(index - 1); }
    function start() {
      if (timer || paused) return;
      timer = window.setInterval(next, DELAY);
    }
    function stop() { window.clearInterval(timer); timer = null; }
    function restart() { stop(); start(); }

    var prevBtn = $('.hero__arrow--prev');
    var nextBtn = $('.hero__arrow--next');
    if (prevBtn) prevBtn.addEventListener('click', function () { prev(); restart(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { next(); restart(); });

    // Pausa al pasar el cursor o al enfocar con teclado
    var hero = root.closest('.hero') || root.parentElement;
    ['mouseenter', 'focusin'].forEach(function (ev) {
      hero.addEventListener(ev, function () { paused = true; stop(); });
    });
    ['mouseleave', 'focusout'].forEach(function (ev) {
      hero.addEventListener(ev, function () { paused = false; start(); });
    });
    // Pausa si la pestaña no está visible (ahorra batería)
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else start();
    });

    // Gestos táctiles
    var x0 = null;
    root.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) { if (dx < 0) next(); else prev(); restart(); }
      x0 = null;
    }, { passive: true });

    // Teclado
    document.addEventListener('keydown', function (e) {
      if ($('.lightbox.is-open') || $('.modal.is-open')) return;
      if (e.key === 'ArrowLeft') { prev(); restart(); }
      if (e.key === 'ArrowRight') { next(); restart(); }
    });

    go(0);
    start();
  }

  /* ==========================================================
     3. MÁQUINA DE ESCRIBIR
     ========================================================== */
  function initTypewriter() {
    $$('[data-typewriter]').forEach(function (el) {
      var words;
      try { words = JSON.parse(el.getAttribute('data-typewriter')); }
      catch (err) { words = [el.getAttribute('data-typewriter')]; }
      if (!words || !words.length) return;

      el.textContent = '';

      // El texto que se escribe letra a letra sería ruido constante para un
      // lector de pantalla, así que se oculta a la accesibilidad y se ofrece
      // una versión estática con todas las frases.
      var sr = document.createElement('span');
      sr.className = 'sr-only';
      sr.textContent = words.join('. ') + '.';
      el.appendChild(sr);

      var out = document.createElement('span');
      out.className = 'typewriter__text';
      out.setAttribute('aria-hidden', 'true');
      var caret = document.createElement('span');
      caret.className = 'typewriter__caret';
      caret.setAttribute('aria-hidden', 'true');
      el.appendChild(out);
      el.appendChild(caret);

      if (reduce) { out.textContent = words[0]; return; }

      var w = 0, c = 0, deleting = false;
      function tick() {
        var word = words[w];
        c = deleting ? c - 1 : c + 1;
        out.textContent = word.slice(0, c);
        var wait = deleting ? 45 : 85;
        if (!deleting && c === word.length) { wait = 1900; deleting = true; }
        else if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; wait = 380; }
        window.setTimeout(tick, wait);
      }
      window.setTimeout(tick, 550);
    });
  }

  /* ==========================================================
     4. BARRAS DE HABILIDAD
     ========================================================== */
  function initSkills() {
    var bars = $$('.skill__fill');
    if (!bars.length) return;
    function fill(el) {
      var pct = Math.max(0, Math.min(100, parseFloat(el.getAttribute('data-pct')) || 0));
      el.style.width = pct + '%';
      var lbl = el.closest('.skill') && el.closest('.skill').querySelector('.skill__pct');
      if (!lbl) return;
      if (reduce) { lbl.textContent = pct + '%'; return; }
      var start = null, dur = 1500;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        lbl.textContent = Math.round(pct * (1 - Math.pow(1 - p, 3))) + '%';
        if (p < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    }
    if (!('IntersectionObserver' in window)) { bars.forEach(fill); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { fill(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.4 });
    bars.forEach(function (b) { io.observe(b); });
  }

  /* ==========================================================
     5. PESTAÑAS
     ========================================================== */
  function initTabs() {
    $$('[data-tabs]').forEach(function (group) {
      var btns = $$('.tabs__btn', group);
      var panels = $$('.tabs__panel', group);
      if (!btns.length) return;

      function select(i) {
        btns.forEach(function (b, n) {
          b.setAttribute('aria-selected', String(n === i));
          b.tabIndex = n === i ? 0 : -1;
        });
        panels.forEach(function (p, n) { p.hidden = n !== i; });
      }
      btns.forEach(function (b, i) {
        b.addEventListener('click', function () { select(i); });
        b.addEventListener('keydown', function (e) {
          var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
          if (!d) return;
          e.preventDefault();
          var n = (i + d + btns.length) % btns.length;
          btns[n].focus();
          select(n);
        });
      });
      select(0);
    });
  }

  /* ==========================================================
     6. FLIP CARDS (toque en móvil / teclado)
     ========================================================== */
  function initFlip() {
    $$('.flip').forEach(function (card) {
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', 'Ver más información');
      function toggle() { card.classList.toggle('is-flipped'); }
      card.addEventListener('click', toggle);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });
  }

  /* ==========================================================
     7. MODALES
     ========================================================== */
  function initModal() {
    var modal = $('.modal');
    if (!modal) return;
    var box = $('.modal__box', modal);
    var last = null;

    function open(html) {
      last = document.activeElement;
      box.innerHTML = html;
      var close = document.createElement('button');
      close.type = 'button';
      close.className = 'modal__close';
      close.setAttribute('aria-label', 'Cerrar');
      close.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';
      close.addEventListener('click', hide);
      box.appendChild(close);
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('no-scroll');
      close.focus({ preventScroll: true });
    }
    function hide() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('no-scroll');
      if (last) last.focus({ preventScroll: true });
    }

    modal.addEventListener('click', function (e) { if (e.target === modal) hide(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) hide();
    });

    // Disparadores: data-modal apunta al id de una plantilla
    $$('[data-modal]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var tpl = document.getElementById(btn.getAttribute('data-modal'));
        if (tpl) open(tpl.innerHTML);
      });
    });
  }

  /* ==========================================================
     8. TICKER — duplica el contenido para un bucle continuo
     ========================================================== */
  function initTicker() {
    $$('.ticker__track').forEach(function (track) {
      var group = $('.ticker__group', track);
      if (!group) return;
      var copy = group.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      track.appendChild(copy);
    });
  }

  /* ==========================================================
     9. MURO SOCIAL DE INSTAGRAM
     --------------------------------------------------------
     Tres modos, en orden de preferencia:

     a) FEED EN VIVO — si `CLUB.instagram.feedUrl` apunta a un
        endpoint JSON, se consulta en cada carga y el muro queda
        siempre al día. Instagram NO permite leer un perfil
        público directamente desde el navegador (hace falta token
        y el CORS lo bloquea), así que ese endpoint debe ser:
          · un servicio tipo Behold.so / LightWidget / SnapWidget, o
          · una función serverless propia que hable con la
            Instagram Graph API con un token de larga duración.
        Formato esperado: un arreglo (o {data:[...]}) de objetos con
        { permalink, media_url, caption, media_type, timestamp }.

     b) PUBLICACIONES CURADAS — lo que está activo hoy. Se toman
        de `CLUB.instagram.posts` en data.js, con las imágenes
        reales del club servidas desde assets/img.

     c) Si algo falla, se degrada al modo (b) sin romper la página.
     ========================================================== */
  function initSocialWall() {
    var host = $('#social-wall');
    if (!host) return;
    var ig = DATA.instagram || {};
    var profile = (DATA.contacto && DATA.contacto.instagram) || 'https://www.instagram.com/capablanca_sabaneta/';

    function skeletons(n) {
      var out = '';
      for (var i = 0; i < n; i++) out += '<div class="igskeleton"></div>';
      host.innerHTML = out;
    }

    function card(p, featured) {
      var img = esc(p.image || p.media_url || '');
      var link = esc(p.permalink || profile);
      var cap = esc(p.caption || '');
      var short = cap.length > 170 ? cap.slice(0, 170) + '…' : cap;
      var badge = featured
        ? '<span class="igcard__badge"><svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.5 6 .8-4.4 4.2 1.1 6L12 16.6 6.7 19.5l1.1-6L3.4 9.3l6-.8z"/></svg>Destacada</span>'
        : '';
      var type = (p.media_type || '').toUpperCase();
      var typeIco = type === 'VIDEO'
        ? '<svg viewBox="0 0 24 24"><path d="M4 5h16v14H4z"/><path d="M10 9l5 3-5 3z"/></svg>'
        : type === 'CAROUSEL_ALBUM'
          ? '<svg viewBox="0 0 24 24"><rect x="7" y="3" width="14" height="14" rx="2"/><path d="M3 7v12a2 2 0 002 2h12"/></svg>'
          : '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/></svg>';

      return '<a class="igcard reveal" href="' + link + '" target="_blank" rel="noopener"' +
        ' aria-label="Ver publicación en Instagram: ' + short + '">' +
        badge +
        '<span class="igcard__go" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8"/></svg></span>' +
        '<img src="' + img + '" alt="' + esc(p.alt || cap || 'Publicación del Club Capablanca Sabaneta') + '" loading="lazy" decoding="async">' +
        '<span class="igcard__ov">' +
          '<span class="igcard__cap">' + short + '</span>' +
          '<span class="igcard__meta">' + typeIco + '<span>Ver en Instagram</span></span>' +
        '</span>' +
      '</a>';
    }

    function render(posts, featuredCount) {
      if (!posts || !posts.length) { host.innerHTML = ''; return; }
      host.innerHTML = posts.map(function (p, i) {
        return card(p, i < (featuredCount || 0));
      }).join('');
      if (window.CAPA && window.CAPA.refreshReveal) window.CAPA.refreshReveal();
    }

    function fallback() {
      render(ig.posts || [], ig.featuredCount || 2);
    }

    if (ig.feedUrl) {
      skeletons((ig.posts || []).length || 8);
      var ctrl = window.AbortController ? new AbortController() : null;
      var to = window.setTimeout(function () { if (ctrl) ctrl.abort(); }, 6000);

      window.fetch(ig.feedUrl, ctrl ? { signal: ctrl.signal } : undefined)
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (json) {
          window.clearTimeout(to);
          var list = Array.isArray(json) ? json : (json.data || json.posts || []);
          if (!list.length) throw new Error('feed vacío');
          render(list.slice(0, ig.limit || 8), ig.featuredCount || 2);
        })
        .catch(function () {
          window.clearTimeout(to);
          // Nunca dejamos el muro roto: volvemos a las publicaciones curadas.
          fallback();
        });
    } else {
      fallback();
    }
  }

  /* ==========================================================
     10. TESTIMONIOS
     ========================================================== */
  function initTestimonios() {
    var host = $('#testimonios');
    if (!host || !DATA.testimonios) return;

    host.innerHTML = DATA.testimonios.map(function (t, i) {
      var n = Math.max(0, Math.min(5, t.estrellas || 5));
      var stars = '';
      for (var s = 0; s < n; s++) {
        stars += '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5 6.1 20.6l1.2-6.5L2.5 9.5l6.6-.9z"/></svg>';
      }
      var inicial = (t.nombre || '?').trim().charAt(0).toUpperCase();
      return '<article class="quote reveal" data-delay="' + (i % 4) + '">' +
        '<div class="stars" role="img" aria-label="' + n + ' de 5 estrellas">' + stars + '</div>' +
        '<p>' + esc(t.texto) + '</p>' +
        '<div class="quote__who">' +
          '<span class="quote__av" aria-hidden="true">' + esc(inicial) + '</span>' +
          '<span><span class="quote__name">' + esc(t.nombre) + '</span>' +
          '<span class="quote__role">' + esc(t.rol) + '</span></span>' +
        '</div>' +
      '</article>';
    }).join('');

    if (window.CAPA && window.CAPA.refreshReveal) window.CAPA.refreshReveal();
  }

  /* ==========================================================
     11. PARALLAX SUAVE
     ========================================================== */
  function initParallax() {
    var els = $$('[data-parallax]');
    if (!els.length || reduce) return;
    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.15;
        var offset = (r.top + r.height / 2 - vh / 2) * speed;
        el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ==========================================================
     ARRANQUE
     ========================================================== */
  function boot() {
    initPreloader();
    initHeroSlider();
    initTypewriter();
    initSkills();
    initTabs();
    initFlip();
    initModal();
    initTicker();
    initSocialWall();
    initTestimonios();
    initParallax();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
