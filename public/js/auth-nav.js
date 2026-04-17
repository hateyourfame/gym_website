(function () {
  async function refreshAuthNav() {
    var slot = document.getElementById("auth-slot");
    if (!slot) return;
    try {
      var r = await fetch("/api/me", { credentials: "same-origin" });
      var data = await r.json();
      if (!data.user) {
        slot.innerHTML =
          '<a href="login.html" class="nav__auth-link">Вход</a>' +
          '<a href="register.html" class="nav__auth-link nav__auth-link--accent">Регистрация</a>';
        return;
      }
      var u = data.user;
      var extra = "";
      if (u.role === "admin") {
        extra = '<a href="admin.html" class="nav__auth-link">Админ</a>';
      }
      slot.innerHTML =
        '<a href="dashboard.html" class="nav__auth-link">Кабинет</a>' +
        extra +
        '<button type="button" class="nav__auth-btn" id="logout-btn">Выход</button>';
      var btn = document.getElementById("logout-btn");
      if (btn) {
        btn.addEventListener("click", async function () {
          await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
          window.location.href = "index.html";
        });
      }
    } catch (e) {
      slot.innerHTML =
        '<span class="nav__auth-link" style="opacity:0.7">Нет связи с сервером</span>' +
        '<a href="login.html" class="nav__auth-link">Вход</a>';
    }
  }

  document.addEventListener("DOMContentLoaded", refreshAuthNav);
})();
