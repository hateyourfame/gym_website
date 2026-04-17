(function () {
  var nav = document.getElementById("site-nav");
  var toggle = document.querySelector(".nav-toggle");
  var yearEl = document.getElementById("year");
  var form = document.getElementById("lead-form");
  var statusEl = document.getElementById("form-status");

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  function closeNav() {
    if (!nav || !toggle) return;
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeNav();
  });

  if (form && statusEl) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      statusEl.classList.remove("is-success", "is-error");
      statusEl.textContent = "";

      var name = form.querySelector('[name="name"]');
      var phone = form.querySelector('[name="phone"]');
      if (!name || !name.value.trim() || !phone || !phone.value.trim()) {
        statusEl.textContent = "Заполните имя и телефон.";
        statusEl.classList.add("is-error");
        return;
      }

      statusEl.textContent = "Спасибо! Заявка принята (демо: подключите сервер или форму к CRM).";
      statusEl.classList.add("is-success");
      form.reset();
    });
  }
})();
