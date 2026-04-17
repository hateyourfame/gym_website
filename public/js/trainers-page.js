(function () {
  var track = document.getElementById("trainers-track");
  if (!track) return;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function render(trainers) {
    track.innerHTML = "";
    if (!trainers.length) {
      track.innerHTML =
        '<article class="trainer-card trainer-card--rail"><div class="trainer-card__body"><h3>Список обновляется</h3><p class="trainer-card__bio">Тренеров пока не добавили в админке.</p></div></article>';
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
      track.appendChild(card);
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
