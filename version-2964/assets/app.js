(function () {
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
      return;
    }
    document.addEventListener("DOMContentLoaded", fn);
  }

  function setupMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var nav = document.querySelector("[data-site-nav]");
    if (!toggle || !nav) {
      return;
    }
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }

  function setupHero() {
    var hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    if (slides.length < 2) {
      return;
    }
    var current = 0;
    var timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("active", dotIndex === current);
      });
    }

    function start() {
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        stop();
        show(index);
        start();
      });
    });

    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function setupFilters() {
    var panels = Array.prototype.slice.call(document.querySelectorAll("[data-filter-panel]"));
    panels.forEach(function (panel) {
      var scope = panel.parentElement || document;
      var input = panel.querySelector("[data-search-input]");
      var yearSelect = panel.querySelector("[data-year-filter]");
      var typeSelect = panel.querySelector("[data-type-filter]");
      var reset = panel.querySelector("[data-reset-filter]");
      var cards = Array.prototype.slice.call(scope.querySelectorAll("[data-movie-card]"));

      function normalize(value) {
        return String(value || "").toLowerCase().trim();
      }

      function apply() {
        var term = normalize(input && input.value);
        var year = yearSelect ? yearSelect.value : "";
        var type = typeSelect ? typeSelect.value : "";
        cards.forEach(function (card) {
          var searchText = normalize(card.getAttribute("data-search"));
          var titleText = normalize(card.getAttribute("data-title"));
          var cardYear = card.getAttribute("data-year") || "";
          var cardType = card.getAttribute("data-type") || "";
          var textPass = !term || searchText.indexOf(term) !== -1 || titleText.indexOf(term) !== -1;
          var yearPass = !year || cardYear === year;
          var typePass = !type || cardType === type;
          card.classList.toggle("hide-card", !(textPass && yearPass && typePass));
        });
      }

      if (input) {
        input.addEventListener("input", apply);
      }
      if (yearSelect) {
        yearSelect.addEventListener("change", apply);
      }
      if (typeSelect) {
        typeSelect.addEventListener("change", apply);
      }
      if (reset) {
        reset.addEventListener("click", function () {
          if (input) {
            input.value = "";
          }
          if (yearSelect) {
            yearSelect.value = "";
          }
          if (typeSelect) {
            typeSelect.value = "";
          }
          apply();
        });
      }
    });
  }

  function setupPlayer() {
    var shell = document.querySelector("[data-player-shell]");
    var video = document.querySelector("[data-player]");
    var button = document.querySelector("[data-play-button]");
    var overlay = document.querySelector("[data-player-overlay]");
    if (!shell || !video || !button) {
      return;
    }
    var hlsInstance = null;
    var started = false;

    function play() {
      var url = button.getAttribute("data-video") || "";
      if (!url) {
        return;
      }
      if (started) {
        video.play().catch(function () {});
        return;
      }
      started = true;
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
      video.setAttribute("controls", "controls");
      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hlsInstance.loadSource(url);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          video.play().catch(function () {});
        });
      } else {
        video.src = url;
        video.addEventListener("loadedmetadata", function () {
          video.play().catch(function () {});
        }, { once: true });
        video.load();
      }
    }

    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      play();
    });
    shell.addEventListener("click", function (event) {
      if (event.target === video) {
        return;
      }
      play();
    });
    window.addEventListener("pagehide", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }

  ready(function () {
    setupMenu();
    setupHero();
    setupFilters();
    setupPlayer();
  });
})();
