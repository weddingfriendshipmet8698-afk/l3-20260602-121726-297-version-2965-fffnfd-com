(function () {
  var mobileButton = document.querySelector('[data-nav-toggle]');
  var mobilePanel = document.querySelector('[data-mobile-panel]');
  if (mobileButton && mobilePanel) {
    mobileButton.addEventListener('click', function () {
      mobilePanel.classList.toggle('is-open');
    });
  }

  document.querySelectorAll('.site-search').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      var input = form.querySelector('input[name="q"]');
      if (!input || !input.value.trim()) {
        event.preventDefault();
        window.location.href = 'search.html';
      }
    });
  });

  document.querySelectorAll('[data-hero]').forEach(function (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer;

    function show(nextIndex) {
      if (!slides.length) return;
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, current) {
        slide.classList.toggle('is-active', current === index);
      });
      dots.forEach(function (dot, current) {
        dot.classList.toggle('is-active', current === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
      }
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        start();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        start();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  });

  document.querySelectorAll('.local-filter').forEach(function (input) {
    var targetId = input.getAttribute('data-target');
    var target = document.getElementById(targetId);
    var empty = document.querySelector('[data-empty-for="' + targetId + '"]');
    if (!target) return;

    input.addEventListener('input', function () {
      var query = input.value.trim().toLowerCase();
      var visible = 0;
      target.querySelectorAll('.movie-card').forEach(function (card) {
        var text = [
          card.getAttribute('data-title'),
          card.getAttribute('data-kind'),
          card.getAttribute('data-year'),
          card.getAttribute('data-category'),
          card.textContent
        ].join(' ').toLowerCase();
        var matched = !query || text.indexOf(query) !== -1;
        card.style.display = matched ? '' : 'none';
        if (matched) visible += 1;
      });
      if (empty) {
        empty.classList.toggle('is-visible', visible === 0);
      }
    });
  });

  document.querySelectorAll('.player').forEach(function (player) {
    var url = player.getAttribute('data-video-url');
    var video = player.querySelector('video');
    var cover = player.querySelector('.player-cover');
    var errorBox = player.querySelector('.video-error');
    var attached = false;
    var hlsInstance = null;

    function showError() {
      if (errorBox) {
        errorBox.textContent = '播放加载失败，请稍后重试。';
        errorBox.classList.add('is-visible');
      }
    }

    function attach() {
      if (!video || !url || attached) return;
      attached = true;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({ enableWorker: true });
        hlsInstance.loadSource(url);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            showError();
          }
        });
      } else {
        video.src = url;
      }
    }

    function play() {
      attach();
      if (cover) {
        cover.classList.add('is-hidden');
      }
      var promise = video.play();
      if (promise && typeof promise.catch === 'function') {
        promise.catch(function () {
          if (cover) {
            cover.classList.remove('is-hidden');
          }
        });
      }
    }

    if (cover && video) {
      cover.addEventListener('click', play);
      video.addEventListener('play', function () {
        cover.classList.add('is-hidden');
      });
      video.addEventListener('pause', function () {
        if (video.currentTime === 0 || video.ended) {
          cover.classList.remove('is-hidden');
        }
      });
      video.addEventListener('error', showError);
    }

    window.addEventListener('beforeunload', function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  });

  var searchInput = document.getElementById('search-input');
  var categoryFilter = document.getElementById('category-filter');
  var results = document.getElementById('search-results');
  var searchEmpty = document.getElementById('search-empty');

  if (searchInput && categoryFilter && results && Array.isArray(window.SEARCH_MOVIES)) {
    var params = new URLSearchParams(window.location.search);
    var initial = params.get('q') || '';
    var categories = [];

    window.SEARCH_MOVIES.forEach(function (movie) {
      if (categories.indexOf(movie.category) === -1) {
        categories.push(movie.category);
      }
    });

    categories.forEach(function (category) {
      var option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    });

    function render() {
      var query = searchInput.value.trim().toLowerCase();
      var category = categoryFilter.value;
      var list = window.SEARCH_MOVIES.filter(function (movie) {
        var text = [movie.title, movie.type, movie.year, movie.region, movie.category, movie.oneLine, movie.tags].join(' ').toLowerCase();
        return (!category || movie.category === category) && (!query || text.indexOf(query) !== -1);
      }).slice(0, 120);

      results.innerHTML = list.map(function (movie) {
        return [
          '<article class="movie-card">',
          '<a class="poster-link" href="' + movie.url + '" aria-label="' + escapeHtml(movie.title) + '">',
          '<img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
          '<span class="play-mark">▶</span>',
          '</a>',
          '<div class="movie-card-body">',
          '<div class="meta-line"><span>' + escapeHtml(movie.type) + '</span><span>' + escapeHtml(movie.year) + '</span></div>',
          '<h3><a href="' + movie.url + '">' + escapeHtml(movie.title) + '</a></h3>',
          '<p>' + escapeHtml(movie.oneLine) + '</p>',
          '<div class="tag-row"><span>' + escapeHtml(movie.category) + '</span><span>' + escapeHtml(movie.region) + '</span></div>',
          '</div>',
          '</article>'
        ].join('');
      }).join('');

      searchEmpty.classList.toggle('is-visible', list.length === 0);
    }

    function escapeHtml(value) {
      return String(value || '').replace(/[&<>"]/g, function (char) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;'
        }[char];
      });
    }

    searchInput.value = initial;
    searchInput.addEventListener('input', render);
    categoryFilter.addEventListener('change', render);
    render();
  }
})();
