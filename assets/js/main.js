/* ============================================================
   CLUB CAPABLANCA SABANETA — Comportamiento del sitio
   Vanilla JS, sin dependencias. Cada módulo se auto-desactiva
   si su marcado no existe en la página actual.
   ============================================================ */
(function () {
  'use strict';

  var DATA = window.CLUB || {};
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- 1. Barra de progreso de lectura ---------- */
  function initProgress() {
    var bar = $('.progress-bar');
    if (!bar) return;
    var ticking = false;

    function update() {
      var doc = document.documentElement;
      var scrollable = doc.scrollHeight - window.innerHeight;
      var pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
      pct = Math.max(0, Math.min(100, pct));
      bar.style.width = pct.toFixed(2) + '%';
      bar.parentElement.setAttribute('aria-valuenow', Math.round(pct));
      ticking = false;
    }
    function onScroll() {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  /* ---------- 2. Header con estado al hacer scroll ---------- */
  function initHeader() {
    var header = $('.header');
    if (!header) return;
    var ticking = false;
    function update() {
      header.classList.toggle('is-stuck', window.scrollY > 40);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------- 3. Menú móvil ---------- */
  function initDrawer() {
    var burger = $('.burger');
    var drawer = $('.drawer');
    if (!burger || !drawer) return;

    function setOpen(open) {
      burger.setAttribute('aria-expanded', String(open));
      drawer.classList.toggle('is-open', open);
      document.body.classList.toggle('no-scroll', open);
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      if (open) {
        var first = drawer.querySelector('a');
        if (first) first.focus({ preventScroll: true });
      }
    }

    burger.addEventListener('click', function () {
      setOpen(burger.getAttribute('aria-expanded') !== 'true');
    });
    $$('a, .btn', drawer).forEach(function (el) {
      el.addEventListener('click', function () { setOpen(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
        setOpen(false);
        burger.focus();
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1040 && drawer.classList.contains('is-open')) setOpen(false);
    });
  }

  /* ---------- 4. Enlace activo según la página ---------- */
  function initActiveNav() {
    var file = window.location.pathname.split('/').pop() || 'index.html';
    $$('.nav a, .drawer a').forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('#')[0];
      if (href && href === file) a.setAttribute('aria-current', 'page');
    });
  }

  /* ---------- 5. Aparición progresiva ---------- */
  function initReveal() {
    var items = $$('.reveal');
    if (!items.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 6. Contadores animados ---------- */
  function initCounters() {
    var nums = $$('[data-count]');
    if (!nums.length) return;

    function run(el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      var prefix = el.getAttribute('data-prefix') || '';
      if (reduceMotion) { el.textContent = prefix + target + suffix; return; }
      var dur = 1400, start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + Math.round(target * eased) + suffix;
        if (p < 1) window.requestAnimationFrame(step);
      }
      window.requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { run(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    nums.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 7. Acordeón accesible ---------- */
  function initAccordion(scope) {
    $$('.acc__btn', scope || document).forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;

      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        // Cierra los demás del mismo grupo
        var group = btn.closest('[data-accordion]');
        if (group && !open) {
          $$('.acc__btn[aria-expanded="true"]', group).forEach(function (other) {
            var op = document.getElementById(other.getAttribute('aria-controls'));
            other.setAttribute('aria-expanded', 'false');
            if (op) op.style.height = '0px';
          });
        }
        btn.setAttribute('aria-expanded', String(!open));
        panel.style.height = open ? '0px' : panel.scrollHeight + 'px';
      });

      panel.addEventListener('transitionend', function (e) {
        if (e.propertyName === 'height' && btn.getAttribute('aria-expanded') === 'true') {
          panel.style.height = 'auto';
        }
      });
      window.addEventListener('resize', function () {
        if (btn.getAttribute('aria-expanded') === 'true') panel.style.height = 'auto';
      });
    });
  }

  /* ---------- 8. Lightbox de galería ---------- */
  function initLightbox() {
    var box = $('.lightbox');
    var triggers = $$('[data-lightbox]');
    if (!box || !triggers.length) return;

    var img = $('.lightbox__img', box);
    var cap = $('.lightbox__cap', box);
    var index = 0;
    var lastFocus = null;

    function show(i) {
      index = (i + triggers.length) % triggers.length;
      var t = triggers[index];
      img.src = t.getAttribute('data-lightbox');
      img.alt = t.getAttribute('data-alt') || '';
      cap.textContent = t.getAttribute('data-cap') || '';
    }
    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      box.classList.add('is-open');
      box.setAttribute('aria-hidden', 'false');
      document.body.classList.add('no-scroll');
      $('.lightbox__close', box).focus({ preventScroll: true });
    }
    function close() {
      box.classList.remove('is-open');
      box.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('no-scroll');
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    }

    triggers.forEach(function (t, i) {
      t.addEventListener('click', function () { open(i); });
      // Algunos disparadores no son <button> (p. ej. la imagen del flyer):
      // se les da rol y foco para que también funcionen con teclado.
      if (t.tagName !== 'BUTTON' && t.tagName !== 'A') {
        t.setAttribute('role', 'button');
        if (!t.hasAttribute('tabindex')) t.tabIndex = 0;
        t.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
        });
      }
    });
    $('.lightbox__close', box).addEventListener('click', close);
    $('.lightbox__prev', box).addEventListener('click', function () { show(index - 1); });
    $('.lightbox__next', box).addEventListener('click', function () { show(index + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
  }

  /* ---------- 9. Calendario de torneos ---------- */
  function initTorneos() {
    var host = $('#torneos-lista');
    if (!host) return;

    var MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    var wa = 'https://wa.me/' + DATA.contacto.whatsapp + '?text=' + encodeURIComponent(DATA.mensajes.torneos);

    var lista = (DATA.torneos || [])
      .filter(function (t) {
        var parts = String(t.fecha).split('-');
        return new Date(+parts[0], +parts[1] - 1, +parts[2]) >= hoy;
      })
      .sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; });

    if (!lista.length) {
      // Estado vacío honesto: no inventamos fechas que el club no ha confirmado.
      host.innerHTML =
        '<div class="card center reveal" style="padding:2.5rem 1.5rem;grid-column:1/-1">' +
          '<div class="card__icon" style="margin-inline:auto">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/></svg>' +
          '</div>' +
          '<h3>Calendario en preparación</h3>' +
          '<p style="max-width:52ch;margin-inline:auto">Estamos confirmando las fechas de la próxima temporada de torneos. ' +
          'Escríbenos por WhatsApp y te avisamos apenas se publique la convocatoria.</p>' +
          '<a class="btn btn--dark btn--sm" style="margin-top:1.25rem" href="' + wa + '" target="_blank" rel="noopener">Avísenme de los torneos</a>' +
        '</div>';
      initReveal();
      return;
    }

    host.innerHTML = lista.map(function (t) {
      var p = String(t.fecha).split('-');
      var d = new Date(+p[0], +p[1] - 1, +p[2]);
      var tags = '';
      if (t.ritmo)     tags += '<span class="tag tag--gold">' + esc(t.ritmo) + '</span>';
      if (t.categoria) tags += '<span class="tag tag--ink">' + esc(t.categoria) + '</span>';
      if (t.lugar)     tags += '<span class="tag">' + esc(t.lugar) + '</span>';
      return '<article class="tcard reveal">' +
        '<div class="tcard__date"><span class="tcard__day">' + d.getDate() + '</span>' +
        '<span class="tcard__mon">' + MESES[d.getMonth()] + ' ' + d.getFullYear() + '</span></div>' +
        '<div><h3 class="tcard__title">' + esc(t.titulo) + '</h3>' +
        (t.nota ? '<p class="muted">' + esc(t.nota) + '</p>' : '') +
        '<div class="tcard__meta">' + tags + '</div></div>' +
        '<a class="btn btn--dark btn--sm" href="' + wa + '" target="_blank" rel="noopener">Inscribirme</a>' +
      '</article>';
    }).join('');
    initReveal();
  }

  /* ---------- 10. Preguntas frecuentes ---------- */
  function initFaq() {
    var host = $('#faq-lista');
    if (!host || !DATA.faq) return;
    host.innerHTML = DATA.faq.map(function (item, i) {
      var id = 'faq-panel-' + i;
      return '<div class="acc reveal">' +
        '<button class="acc__btn" type="button" aria-expanded="false" aria-controls="' + id + '">' +
          '<span>' + esc(item.q) + '</span>' +
          '<span class="acc__ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span>' +
        '</button>' +
        '<div class="acc__panel" id="' + id + '" role="region"><p>' + esc(item.a) + '</p></div>' +
      '</div>';
    }).join('');
    initAccordion(host);
    initReveal();
  }

  /* ---------- 11. Galería dinámica ---------- */
  function initGaleria() {
    var host = $('#galeria-lista');
    if (!host || !DATA.galeria) return;
    host.innerHTML = DATA.galeria.map(function (g) {
      return '<button class="gitem reveal" type="button" data-lightbox="' + g.src + '" ' +
        'data-cap="' + esc(g.cap) + '" data-alt="' + esc(g.alt) + '" aria-label="Ampliar: ' + esc(g.cap) + '">' +
        '<img src="' + g.src + '" alt="' + esc(g.alt) + '" loading="lazy" decoding="async">' +
        '<span class="gitem__zoom" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5M11 8v6M8 11h6"/></svg></span>' +
        '<span class="gitem__cap">' + esc(g.cap) + '</span>' +
      '</button>';
    }).join('');
    initReveal();
  }

  /* ---------- 12. Formulario → WhatsApp ---------- */
  function initForm() {
    var form = $('#form-inscripcion');
    if (!form) return;
    var status = $('.form__status', form);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;

      $$('[required]', form).forEach(function (input) {
        var field = input.closest('.field');
        var valid = input.value.trim() !== '' && input.checkValidity();
        field.classList.toggle('has-error', !valid);
        if (!valid && ok) { input.focus(); ok = false; }
      });
      if (!ok) return;

      var v = function (name) {
        var el = form.elements[name];
        return el ? el.value.trim() : '';
      };

      var lineas = [
        'Hola Club Capablanca Sabaneta, quiero inscribirme.',
        '',
        'Nombre: ' + v('nombre'),
        'Teléfono: ' + v('telefono'),
        'Interesado en: ' + v('programa'),
        'Modalidad: ' + v('modalidad'),
        'Nivel actual: ' + v('nivel')
      ];
      if (v('mensaje')) lineas.push('', 'Mensaje: ' + v('mensaje'));
      lineas.push('', '(Enviado desde el formulario de la página web)');

      var url = 'https://wa.me/' + DATA.contacto.whatsapp + '?text=' + encodeURIComponent(lineas.join('\n'));
      var win = window.open(url, '_blank', 'noopener');

      if (status) {
        status.textContent = win
          ? 'Abrimos WhatsApp con tus datos listos. Solo pulsa enviar para que recibamos tu solicitud.'
          : 'Tu navegador bloqueó la ventana emergente. Escríbenos directamente al ' + DATA.contacto.telefono + '.';
        status.classList.add('is-visible');
      }
    });

    // Limpia el error al corregir
    $$('input, select, textarea', form).forEach(function (input) {
      input.addEventListener('input', function () {
        var field = input.closest('.field');
        if (field) field.classList.remove('has-error');
      });
    });
  }

  /* ---------- 13. Botón volver arriba ---------- */
  function initToTop() {
    var btn = $('.fab--top');
    if (!btn) return;
    window.addEventListener('scroll', function () {
      btn.classList.toggle('is-visible', window.scrollY > 700);
    }, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- 14. Año actual en el pie ---------- */
  function initYear() {
    $$('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ---------- Utilidad ---------- */
  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ---------- API pública ----------
     components.js inyecta tarjetas (muro social) después del
     arranque y necesita volver a registrar las animaciones de
     entrada sobre ese marcado nuevo. */
  window.CAPA = {
    refreshReveal: initReveal,
    refreshAccordion: initAccordion
  };

  /* ---------- Arranque ---------- */
  function boot() {
    initProgress();
    initHeader();
    initDrawer();
    initActiveNav();
    initTorneos();
    initFaq();
    initGaleria();
    initReveal();
    initCounters();
    initAccordion();
    initLightbox();
    initForm();
    initToTop();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
