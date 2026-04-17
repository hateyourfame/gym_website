(function () {
  var buttons = document.querySelectorAll(".zone-tile__open[data-zone-key]");
  if (!buttons.length) return;

  function applyZoneData(btn, zone) {
    if (!zone || !zone.slides || !zone.slides.length) return;
    var captions = zone.slides.map(function (s) {
      return s.caption;
    });
    var srcs = zone.slides.map(function (s) {
      return s.src || "";
    });
    btn.setAttribute("data-zone-gallery", captions.join("|"));
    btn.setAttribute("data-gallery-title", zone.title || "Зона");
    btn.setAttribute("data-gallery-srcs", srcs.join("|"));

    var first = zone.slides.find(function (s) {
      return !!s.src;
    });
    var holder = btn.querySelector(".img-placeholder");
    if (first && holder) {
      var img = document.createElement("img");
      img.src = first.src;
      img.alt = zone.title || "Зона";
      img.className = holder.className;
      img.style.objectFit = "cover";
      img.style.width = "100%";
      img.style.height = "auto";
      holder.replaceWith(img);
    }
  }

  fetch("/api/zones", { credentials: "same-origin" })
    .then(function (r) {
      return r.json();
    })
    .then(function (data) {
      var map = {};
      ((data && data.zones) || []).forEach(function (z) {
        map[z.key] = z;
      });
      buttons.forEach(function (btn) {
        var key = btn.getAttribute("data-zone-key");
        applyZoneData(btn, map[key]);
      });
    })
    .catch(function () {});
})();
