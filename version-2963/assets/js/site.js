(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function initMenu() {
    var button = document.querySelector("[data-menu-toggle]");
    var menu = document.querySelector("[data-mobile-menu]");
    if (!button || !menu) {
      return;
    }
    button.addEventListener("click", function () {
      var open = button.classList.toggle("is-open");
      menu.classList.toggle("is-open", open);
      document.body.classList.toggle("no-scroll", open);
      button.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function initHero() {
    var root = document.querySelector("[data-hero]");
    if (!root) {
      return;
    }
    var slides = Array.prototype.slice.call(root.querySelectorAll("[data-hero-slide]"));
    var dots = Array.prototype.slice.call(root.querySelectorAll("[data-hero-dot]"));
    if (slides.length < 2) {
      return;
    }
    var index = 0;
    var timer;
    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === index);
      });
    }
    function play() {
      clearInterval(timer);
      timer = setInterval(function () {
        show(index + 1);
      }, 5200);
    }
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        show(i);
        play();
      });
    });
    root.addEventListener("mouseenter", function () {
      clearInterval(timer);
    });
    root.addEventListener("mouseleave", play);
    show(0);
    play();
  }

  function initSearch() {
    var roots = Array.prototype.slice.call(document.querySelectorAll("[data-grid-root]"));
    roots.forEach(function (root) {
      var cards = Array.prototype.slice.call(root.querySelectorAll("[data-card]"));
      var input = document.querySelector("[data-search-input]");
      var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-filter-button]"));
      var active = "all";
      function apply() {
        var q = input ? input.value.trim().toLowerCase() : "";
        cards.forEach(function (card) {
          var text = (card.getAttribute("data-search") || "").toLowerCase();
          var bucket = card.getAttribute("data-bucket") || "";
          var extra = card.getAttribute("data-extra") || "";
          var passText = !q || text.indexOf(q) !== -1;
          var passFilter = active === "all" || bucket === active || extra.indexOf(active) !== -1;
          card.hidden = !(passText && passFilter);
        });
      }
      if (input) {
        input.addEventListener("input", apply);
      }
      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          active = button.getAttribute("data-filter-button") || "all";
          buttons.forEach(function (item) {
            item.classList.toggle("is-active", item === button);
          });
          apply();
        });
      });
      apply();
    });
  }

  window.initMoviePlayer = function (url) {
    var video = document.querySelector("[data-player-video]");
    var overlay = document.querySelector("[data-player-overlay]");
    var button = document.querySelector("[data-player-button]");
    var message = document.querySelector("[data-player-message]");
    if (!video || !overlay || !button) {
      return;
    }
    var prepared = false;
    var readyToPlay = false;
    var pendingPlay = false;
    var hls = null;
    function setMessage(text) {
      if (message) {
        message.textContent = text || "";
      }
    }
    function playVideo() {
      var playPromise = video.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch(function () {
          setMessage("点击画面开始播放");
          overlay.classList.remove("is-hidden");
        });
      }
    }
    function prepare() {
      if (prepared) {
        return true;
      }
      prepared = true;
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          readyToPlay = true;
          if (pendingPlay) {
            pendingPlay = false;
            playVideo();
          }
        });
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            setMessage("播放暂时不可用，请稍后再试");
            overlay.classList.remove("is-hidden");
            if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            }
          }
        });
        return true;
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
        readyToPlay = true;
        return true;
      }
      setMessage("播放暂时不可用，请稍后再试");
      overlay.classList.remove("is-hidden");
      return false;
    }
    function start() {
      if (!prepare()) {
        return;
      }
      video.controls = true;
      overlay.classList.add("is-hidden");
      setMessage("");
      if (!readyToPlay && hls) {
        pendingPlay = true;
        return;
      }
      playVideo();
    }
    function toggle() {
      if (video.paused) {
        start();
      } else {
        video.pause();
      }
    }
    overlay.addEventListener("click", start);
    button.addEventListener("click", function (event) {
      event.stopPropagation();
      start();
    });
    video.addEventListener("click", toggle);
    video.addEventListener("play", function () {
      overlay.classList.add("is-hidden");
    });
    video.addEventListener("pause", function () {
      if (!video.ended) {
        overlay.classList.remove("is-hidden");
      }
    });
    video.addEventListener("ended", function () {
      overlay.classList.remove("is-hidden");
    });
    window.addEventListener("beforeunload", function () {
      if (hls) {
        hls.destroy();
      }
    });
  };

  ready(function () {
    initMenu();
    initHero();
    initSearch();
  });
})();
