(function () {
  var grid = document.getElementById("trainers-home-grid");
  if (!grid) return;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function render(list) {
    grid.innerHTML = "";
    var trainers = list.slice(0, 4);
    if (!trainers.length) {
      grid.innerHTML =
        '<article class="trainer-card trainer-card--rail"><div class="trainer-card__body"><h3>Команда обновляется</h3><p class="trainer-card__bio">Полный список смотрите на странице «Тренеры».</p></div></article>';
      return;
    }
    trainers.forEach(function (t) {
      var card = document.createElement("article");
      card.className = "trainer-card trainer-card--rail";
      card.innerHTML =
        '<div class="trainer-card__body">' +
        "<h3>" +
        escapeHtml(t.name) +
        "</h3>" +
        '<p class="trainer-card__role">' +
        escapeHtml(t.role) +
        "</p>" +
        '<p class="trainer-card__bio">' +
        escapeHtml(t.bio) +
        "</p>" +
        "</div>";
      grid.appendChild(card);
    });
  }

  fetch("/api/trainers", { credentials: "same-origin" })
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      render((data && data.trainers) || []);
    })
    .catch(function () {
      render([]);
    });
})();
