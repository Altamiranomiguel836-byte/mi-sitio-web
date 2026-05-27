(function () {

  /* ——— Mobile nav ——— */
  var btn = document.querySelector('.nav-btn');
  var nav = document.querySelector('.nav');

  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? '✕' : '☰';
    });

    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && !btn.contains(e.target)) {
        nav.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = '☰';
      }
    });

    nav.querySelectorAll('.nav__link').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = '☰';
      });
    });
  }

  /* ——— Contact form ——— */
  var form = document.getElementById('contact-form');
  var feedback = document.getElementById('form-feedback');

  if (form && feedback) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      feedback.hidden = false;
      feedback.className = 'form-feedback';

      if (!form.checkValidity()) {
        feedback.textContent = 'Revisa los campos obligatorios: nombre, email y mensaje.';
        feedback.classList.add('is-error');
        return;
      }

      var nombre   = form.nombre.value.trim();
      var email    = form.email.value.trim();
      var telefono = form.telefono.value.trim();
      var tipo     = form.tipo.value;
      var mensaje  = form.mensaje.value.trim();
      var tipoLabel = tipo ? form.tipo.options[form.tipo.selectedIndex].text : 'No especificado';

      var body = [
        'Nombre: ' + nombre,
        'Email: ' + email,
        telefono ? 'Teléfono: ' + telefono : '',
        'Tipo: ' + tipoLabel,
        '',
        mensaje
      ].filter(Boolean).join('\n');

      window.location.href = 'mailto:miguel.galvez@gmail.com'
        + '?subject=' + encodeURIComponent('Proyecto web — ' + nombre)
        + '&body=' + encodeURIComponent(body);

      feedback.textContent = 'Se abrirá tu cliente de correo. Si no aparece, escríbeme directamente a miguel.galvez@gmail.com.';
      feedback.classList.add('is-success');
      form.reset();
    });
  }

})();
