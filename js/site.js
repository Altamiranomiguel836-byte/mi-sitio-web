(function () {
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Page loader */
  var loader = document.querySelector(".page-loader");
  if (loader && !prefersReduced) {
    document.body.classList.add("is-loading");
    window.addEventListener("load", function () {
      setTimeout(function () {
        loader.classList.add("is-done");
        document.body.classList.remove("is-loading");
      }, 150);
    });
    setTimeout(function () {
      loader.classList.add("is-done");
      document.body.classList.remove("is-loading");
    }, 2000);
  } else if (loader) {
    loader.classList.add("is-done");
  }

  /* Sticky header */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 10);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* Mobile nav */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.innerHTML = open
        ? '<i class="fas fa-xmark" aria-hidden="true"></i>'
        : '<i class="fas fa-bars" aria-hidden="true"></i>';
    });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("is-open") && !nav.contains(e.target) && !toggle.contains(e.target)) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';
      }
    });
    nav.querySelectorAll(".main-nav__link").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.innerHTML = '<i class="fas fa-bars" aria-hidden="true"></i>';
      });
    });
  }

  /* Collect hero reveal elements — handled with entrance stagger */
  var hero = document.querySelector(".hero");
  var heroRevealSet = new Set();
  if (hero) {
    hero.querySelectorAll("[data-reveal], [data-reveal-stagger]").forEach(function (el) {
      heroRevealSet.add(el);
    });
  }

  /* Scroll reveal — skip hero elements */
  var allRevealEls = document.querySelectorAll("[data-reveal], [data-reveal-stagger]");
  var nonHeroEls = Array.from(allRevealEls).filter(function (el) {
    return !heroRevealSet.has(el);
  });

  if (!prefersReduced) {
    if (nonHeroEls.length) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -5% 0px", threshold: 0.07 }
      );
      nonHeroEls.forEach(function (el) { observer.observe(el); });
    }

    /* Hero staggered entrance */
    if (heroRevealSet.size > 0) {
      var heroReveals  = Array.from(heroRevealSet).filter(function (el) { return el.hasAttribute("data-reveal"); });
      var heroStaggers = Array.from(heroRevealSet).filter(function (el) { return el.hasAttribute("data-reveal-stagger"); });

      function revealHero() {
        heroReveals.forEach(function (el, i) {
          setTimeout(function () { el.classList.add("is-visible"); }, 80 + i * 85);
        });
        var baseDelay = 80 + heroReveals.length * 85;
        heroStaggers.forEach(function (el, i) {
          setTimeout(function () { el.classList.add("is-visible"); }, baseDelay + i * 100);
        });
      }

      if (document.readyState === "complete") {
        revealHero();
      } else {
        window.addEventListener("load", revealHero);
      }
    }
  } else {
    allRevealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ——— Service cards: click / tap toggles overlay on touch devices ——— */
  document.querySelectorAll('.service-card').forEach(function (card) {
    /* Close all other active cards when one opens */
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

    /* Keyboard: Enter / Space triggers same as click */
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });

  /* Clicking outside closes active card */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.service-card')) {
      document.querySelectorAll('.service-card.is-active').forEach(function (c) {
        c.classList.remove('is-active');
        c.setAttribute('aria-expanded', 'false');
      });
    }
  });

  /* Contact form */
  var form = document.getElementById("contact-form");
  var feedback = document.getElementById("form-feedback");
  if (form && feedback) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      feedback.hidden = false;
      feedback.classList.remove("is-success", "is-error");

      if (!form.checkValidity()) {
        feedback.textContent = "Revisa los campos obligatorios: nombre, email y mensaje.";
        feedback.classList.add("is-error");
        return;
      }

      var nombre   = form.nombre.value.trim();
      var email    = form.email.value.trim();
      var telefono = form.telefono.value.trim();
      var tipo     = form.tipo.value;
      var mensaje  = form.mensaje.value.trim();
      var tipoLabel = tipo ? form.tipo.options[form.tipo.selectedIndex].text : "No especificado";

      var body = [
        "Nombre: " + nombre,
        "Email: " + email,
        telefono ? "Teléfono: " + telefono : "",
        "Tipo de proyecto: " + tipoLabel,
        "",
        mensaje
      ].filter(Boolean).join("\n");

      var subject  = encodeURIComponent("Proyecto web — " + nombre);
      var mailBody = encodeURIComponent(body);
      window.location.href = "mailto:miguel.galvez@gmail.com?subject=" + subject + "&body=" + mailBody;

      feedback.textContent = "Se abrirá tu cliente de correo con el mensaje listo. Si no aparece, escríbeme a miguel.galvez@gmail.com.";
      feedback.classList.add("is-success");
      form.reset();
    });
  }
})();
