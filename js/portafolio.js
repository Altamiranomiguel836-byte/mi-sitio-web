(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════════
     FILTRO DE PROYECTOS
     ══════════════════════════════════════════════════════════════ */
  var filterBtns = document.querySelectorAll('.pf-filter-btn');
  var cards      = document.querySelectorAll('.pf-card');

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = btn.dataset.filter;

      filterBtns.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');

      cards.forEach(function (card) {
        var match = filter === 'all' || card.dataset.category === filter;
        if (match) {
          card.classList.remove('is-hidden');
          /* doble RAF para la transición de reveal */
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              card.style.opacity  = '1';
              card.style.transform = '';
            });
          });
        } else {
          card.style.opacity  = '0';
          card.style.transform = 'translateY(12px)';
          /* Ocultar después de la transición */
          setTimeout(function () { card.classList.add('is-hidden'); }, 300);
        }
      });
    });
  });

  /* Estilo inicial de cards para transición suave */
  cards.forEach(function (card) {
    card.style.transition = 'opacity .3s ease, transform .3s ease, border-color .35s ease, box-shadow .35s ease';
  });

  /* ══════════════════════════════════════════════════════════════
     CONTADOR ANIMADO DE MÉTRICAS
     ══════════════════════════════════════════════════════════════ */
  function animateCounter(el, target, duration) {
    var start  = 0;
    var startT = null;
    function step(ts) {
      if (!startT) startT = ts;
      var progress = Math.min((ts - startT) / duration, 1);
      /* ease-out cúbico */
      var ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(ease * target);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var metricEls = document.querySelectorAll('.pf-metric__val[data-count]');
  if (metricEls.length > 0) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el     = entry.target;
          var target = parseInt(el.dataset.count, 10);
          animateCounter(el, target, 1400);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    metricEls.forEach(function (el) { io.observe(el); });
  }
})();
