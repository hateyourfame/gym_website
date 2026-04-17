(function () {
  var openers = document.querySelectorAll(".zone-tile__open[data-zone-gallery]");
  if (!openers.length) return;

  var root = document.createElement("div");
  root.className = "zone-lightbox";
  root.setAttribute("hidden", "");
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-label", "Галерея зоны");
  root.innerHTML =
    '<div class="zone-lightbox__top">' +
    '<button type="button" class="zone-lightbox__back" id="zone-lb-back">← Назад в галерею</button>' +
    "</div>" +
    '<div class="zone-lightbox__main">' +
    '<button type="button" class="zone-lightbox__nav zone-lightbox__nav--prev" id="zone-lb-prev" aria-label="Предыдущее фото">‹</button>' +
    '<div class="zone-lightbox__stage">' +
    '<div class="zone-lightbox__stage-inner" id="zone-lb-stage"></div>' +
    '<p class="zone-lightbox__caption" id="zone-lb-caption"></p>' +
    "</div>" +
    '<button type="button" class="zone-lightbox__nav zone-lightbox__nav--next" id="zone-lb-next" aria-label="Следующее фото">›</button>' +
    "</div>" +
    '<div class="zone-lightbox__thumbs" id="zone-lb-thumbs"></div>';

  document.body.appendChild(root);

  var slides = [];
  var index = 0;
  var lastFocus = null;

  var stageEl = document.getElementById("zone-lb-stage");
  var captionEl = document.getElementById("zone-lb-caption");
  var thumbsEl = document.getElementById("zone-lb-thumbs");
  var btnBack = document.getElementById("zone-lb-back");
  var btnPrev = document.getElementById("zone-lb-prev");
  var btnNext = document.getElementById("zone-lb-next");

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }

  function parseSlides(btn) {
    var raw = btn.getAttribute("data-zone-gallery") || "";
    var title = btn.getAttribute("data-gallery-title") || "Зона";
    var srcRaw = btn.getAttribute("data-gallery-srcs") || "";
    var urls = srcRaw
      ? srcRaw.split("|").map(function (x) {
          return x.trim();
        })
      : [];
    var parts = raw
      .split("|")
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
    if (!parts.length) parts.push("Фото 1");
    return parts.map(function (cap, i) {
      return {
        caption: cap,
        label: title + " · " + (i + 1),
        src: urls[i] || "",
      };
    });
  }

  function renderSlide() {
    var s = slides[index];
    if (!s) return;
    var hasSrc = s.src && s.src.length > 0;
    if (hasSrc) {
      stageEl.innerHTML = "";
      var img = document.createElement("img");
      img.src = s.src;
      img.alt = s.caption;
      img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;";
      stageEl.appendChild(img);
    } else {
      stageEl.innerHTML =
        '<div class="img-placeholder img-placeholder--wide" data-label="' +
        escapeAttr(s.caption) +
        '"><span>' +
        escapeHtml(s.caption.length > 20 ? s.caption.slice(0, 18) + "…" : s.caption) +
        "</span></div>";
    }
    captionEl.textContent = s.caption;
    btnPrev.disabled = index <= 0;
    btnNext.disabled = index >= slides.length - 1;

    var thumbNodes = thumbsEl.querySelectorAll(".zone-lightbox__thumb");
    thumbNodes.forEach(function (btn, i) {
      btn.classList.toggle("is-active", i === index);
    });
  }

  function buildThumbs() {
    thumbsEl.innerHTML = "";
    slides.forEach(function (s, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "zone-lightbox__thumb";
      b.setAttribute("aria-label", "Фото " + (i + 1));
      b.addEventListener("click", function () {
        index = i;
        renderSlide();
      });
      if (s.src) {
        var im = document.createElement("img");
        im.src = s.src;
        im.alt = "";
        im.style.cssText = "width:100%;height:100%;object-fit:cover;";
        b.appendChild(im);
      } else {
        b.innerHTML =
          '<div class="img-placeholder" data-label="' +
          escapeAttr(s.caption) +
          '"><span>' +
          (i + 1) +
          "</span></div>";
      }
      thumbsEl.appendChild(b);
    });
  }

  function openFromButton(btn) {
    slides = parseSlides(btn);
    index = 0;
    buildThumbs();
    renderSlide();
    lastFocus = document.activeElement;
    root.removeAttribute("hidden");
    document.body.style.overflow = "hidden";
    btnBack.focus();
  }

  function closeLb() {
    root.setAttribute("hidden", "");
    document.body.style.overflow = "";
    slides = [];
    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
    }
  }

  function go(delta) {
    var n = index + delta;
    if (n < 0 || n >= slides.length) return;
    index = n;
    renderSlide();
  }

  openers.forEach(function (btn) {
    btn.addEventListener("click", function () {
      openFromButton(btn);
    });
  });

  btnBack.addEventListener("click", closeLb);
  btnPrev.addEventListener("click", function () {
    go(-1);
  });
  btnNext.addEventListener("click", function () {
    go(1);
  });

  document.addEventListener("keydown", function (e) {
    if (root.hasAttribute("hidden")) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeLb();
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      go(1);
    }
  });
})();
