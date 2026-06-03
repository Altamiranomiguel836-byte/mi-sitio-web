(function () {
  'use strict';

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isInicio = document.body.classList.contains('page--inicio');

  /* ══════════════════════════════════════════════════════════════
     SCROLL RESTORATION — siempre empieza desde arriba
     ══════════════════════════════════════════════════════════════ */
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  /* pageshow cubre carga normal Y bfcache (back/forward) */
  window.addEventListener('pageshow', function () {
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  });

  /* ══════════════════════════════════════════════════════════════
     PAGE LOADER
     ══════════════════════════════════════════════════════════════ */
  var loader = document.querySelector('.page-loader');
  if (loader && !prefersReduced) {
    document.body.classList.add('is-loading');
    window.addEventListener('load', function () {
      setTimeout(function () {
        loader.classList.add('is-done');
        document.body.classList.remove('is-loading');
      }, 150);
    });
    /* Fallback: si load tarda mucho */
    setTimeout(function () {
      loader.classList.add('is-done');
      document.body.classList.remove('is-loading');
    }, 2000);
  } else if (loader) {
    loader.classList.add('is-done');
  }

  /* ══════════════════════════════════════════════════════════════
     STICKY HEADER
     ══════════════════════════════════════════════════════════════ */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 10);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ══════════════════════════════════════════════════════════════
     HERO SCROLL COMPRESSION (solo página inicio)
     ══════════════════════════════════════════════════════════════ */
  if (isInicio && !prefersReduced) {
    var heroEl = document.querySelector('.hero');
    if (heroEl) {
      var COMPRESS_ZONE = 0.45; /* fracción del hero donde ocurre el efecto */
      var onHeroScroll = function () {
        var scrollY   = window.scrollY;
        var heroH     = heroEl.offsetHeight;
        var progress  = Math.min(scrollY / (heroH * COMPRESS_ZONE), 1);
        var scale     = 1 - progress * 0.07;
        var opacity   = 1 - progress * 0.35;
        heroEl.style.transform = 'scale(' + scale.toFixed(4) + ')';
        heroEl.style.opacity   = opacity.toFixed(4);
      };
      window.addEventListener('scroll', onHeroScroll, { passive: true });
      onHeroScroll(); /* estado inicial */
    }
  }

  /* ══════════════════════════════════════════════════════════════
     MOBILE NAV
     ══════════════════════════════════════════════════════════════ */
  var toggle = document.querySelector('.nav-toggle');
  var nav    = document.querySelector('.main-nav');
  if (toggle && nav) {
    var closeNav = function () {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';
    };

    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.innerHTML = open
        ? '<i class="fas fa-xmark" aria-hidden="true"></i>'
        : '<i class="fas fa-bars" aria-hidden="true"></i>';
    });

    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') &&
          !nav.contains(e.target) && !toggle.contains(e.target)) {
        closeNav();
      }
    });

    nav.querySelectorAll('.main-nav__link').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });
  }

  /* ══════════════════════════════════════════════════════════════
     REVEAL SYSTEM
     ══════════════════════════════════════════════════════════════ */

  /* Separar elementos del hero (animados por CSS + JS stagger)
     del resto (animados por IntersectionObserver) */
  var hero = document.querySelector('.hero');
  var heroRevealSet = new Set();
  if (hero) {
    hero.querySelectorAll('[data-reveal], [data-reveal-stagger]').forEach(function (el) {
      heroRevealSet.add(el);
    });
  }

  var allRevealEls = document.querySelectorAll('[data-reveal], [data-reveal-stagger]');
  var nonHeroEls   = Array.from(allRevealEls).filter(function (el) {
    return !heroRevealSet.has(el);
  });

  if (prefersReduced) {
    /* Accesibilidad: sin animaciones */
    allRevealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {

    /* ——— IntersectionObserver para secciones fuera del viewport inicial ——— */
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            /* Doble RAF garantiza que el browser pintó el estado inicial
               (opacity:0 / translateY) antes de iniciar la transición */
            var el = entry.target;
            requestAnimationFrame(function () {
              requestAnimationFrame(function () {
                el.classList.add('is-visible');
              });
            });
            observer.unobserve(el);
          }
        });
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.06 }
    );

    if (isInicio) {
      /* ——— En inicio: secuenciar después del hero ——— */
      /* Las animaciones CSS del hero terminan ~1 550 ms después de carga.
         Los elementos ya visibles en el viewport inicial se revelan en
         cascada a partir de ese momento. Los demás usan scroll-reveal. */
      var HERO_END_MS  = 1550;
      var STAGGER_STEP = 180;  /* ms entre elemento y elemento */

      window.addEventListener('load', function () {
        /* Tiempo transcurrido desde que el navegador empezó a cargar la página.
           Usado para calcular cuánto falta para que terminen las animaciones del hero. */
        var elapsed = performance.now();
        var delay   = Math.max(80, HERO_END_MS - elapsed);

        var initiallyVisible = [];
        var belowFold        = [];
        var vh = window.innerHeight;

        nonHeroEls.forEach(function (el) {
          var rect = el.getBoundingClientRect();
          if (rect.top < vh && rect.bottom > 0) {
            initiallyVisible.push(el);
          } else {
            belowFold.push(el);
          }
        });

        /* Revelar los elementos del viewport inicial en secuencia,
           sincronizados con el final de las animaciones del hero */
        initiallyVisible.forEach(function (el, i) {
          setTimeout(function () {
            requestAnimationFrame(function () {
              requestAnimationFrame(function () {
                el.classList.add('is-visible');
              });
            });
          }, delay + i * STAGGER_STEP);
        });

        /* Elementos debajo del fold: scroll-triggered normal */
        belowFold.forEach(function (el) {
          observer.observe(el);
        });
      });

    } else {
      /* ——— Otras páginas: reveal normal por scroll ——— */
      nonHeroEls.forEach(function (el) {
        observer.observe(el);
      });
    }

    /* ——— Hero staggered entrance (stats y otros con data-reveal dentro del hero) ——— */
    if (heroRevealSet.size > 0) {
      var heroReveals  = Array.from(heroRevealSet).filter(function (el) {
        return el.hasAttribute('data-reveal');
      });
      var heroStaggers = Array.from(heroRevealSet).filter(function (el) {
        return el.hasAttribute('data-reveal-stagger');
      });

      function revealHero() {
        heroReveals.forEach(function (el, i) {
          setTimeout(function () { el.classList.add('is-visible'); }, 80 + i * 85);
        });
        var base = 80 + heroReveals.length * 85;
        heroStaggers.forEach(function (el, i) {
          setTimeout(function () { el.classList.add('is-visible'); }, base + i * 100);
        });
      }

      if (document.readyState === 'complete') {
        revealHero();
      } else {
        window.addEventListener('load', revealHero);
      }
    }
  }

  /* ══════════════════════════════════════════════════════════════
     SERVICE CARDS — overlay al hacer clic / tap
     ══════════════════════════════════════════════════════════════ */
  document.querySelectorAll('.service-card').forEach(function (card) {
    card.addEventListener('click', function () {
      var isActive = card.classList.contains('is-active');
      document.querySelectorAll('.service-card.is-active').forEach(function (c) {
        c.classList.remove('is-active');
        c.setAttribute('aria-expanded', 'false');
      });
      if (!isActive) {
        card.classList.add('is-active');
        card.setAttribute('aria-expanded', 'true');
      }
    });

    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.service-card')) {
      document.querySelectorAll('.service-card.is-active').forEach(function (c) {
        c.classList.remove('is-active');
        c.setAttribute('aria-expanded', 'false');
      });
    }
  });

  /* ══════════════════════════════════════════════════════════════
     CONTACT FORM
     ══════════════════════════════════════════════════════════════ */
  var form     = document.getElementById('contact-form');
  var feedback = document.getElementById('form-feedback');
  if (form && feedback) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      feedback.hidden = false;
      feedback.classList.remove('is-success', 'is-error');

      if (!form.checkValidity()) {
        feedback.textContent = 'Revisa los campos obligatorios: nombre, email y mensaje.';
        feedback.classList.add('is-error');
        return;
      }

      var nombre    = form.nombre.value.trim();
      var email     = form.email.value.trim();
      var telefono  = form.telefono.value.trim();
      var tipo      = form.tipo.value;
      var mensaje   = form.mensaje.value.trim();
      var tipoLabel = tipo
        ? form.tipo.options[form.tipo.selectedIndex].text
        : 'No especificado';

      var body = [
        'Nombre: '           + nombre,
        'Email: '            + email,
        telefono ? 'Teléfono: ' + telefono : '',
        'Tipo de proyecto: ' + tipoLabel,
        '',
        mensaje
      ].filter(Boolean).join('\n');

      var subject  = encodeURIComponent('Proyecto web — ' + nombre);
      var mailBody = encodeURIComponent(body);
      window.location.href =
        'mailto:miguel.galvez@gmail.com?subject=' + subject + '&body=' + mailBody;

      feedback.textContent =
        'Se abrirá tu cliente de correo con el mensaje listo. ' +
        'Si no aparece, escríbeme a miguel.galvez@gmail.com.';
      feedback.classList.add('is-success');
      form.reset();
    });
  }
})();
