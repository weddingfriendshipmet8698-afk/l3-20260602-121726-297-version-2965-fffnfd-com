(function () {
  function bindPlayer(player) {
    var video = player.querySelector('video');
    var button = player.querySelector('[data-play-button]');
    var status = player.querySelector('[data-player-status]');
    var source = player.getAttribute('data-src');
    var hlsInstance = null;
    var isReady = false;

    function setStatus(text) {
      if (status) {
        status.textContent = text;
      }
    }

    function prepare() {
      if (!video || !source || isReady) {
        return Promise.resolve();
      }

      isReady = true;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        setStatus('播放源已加载');
        return Promise.resolve();
      }

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: false
        });
        hlsInstance.loadSource(source);
        hlsInstance.attachMedia(video);
        setStatus('HLS 播放源已加载');
        return Promise.resolve();
      }

      video.src = source;
      setStatus('浏览器将尝试直接播放');
      return Promise.resolve();
    }

    function play() {
      prepare().then(function () {
        var playPromise = video.play();
        if (playPromise && typeof playPromise.then === 'function') {
          playPromise.then(function () {
            player.classList.add('is-playing');
            setStatus('正在播放');
          }).catch(function () {
            setStatus('请再次点击播放');
          });
        } else {
          player.classList.add('is-playing');
          setStatus('正在播放');
        }
      });
    }

    if (button) {
      button.addEventListener('click', play);
    }

    if (video) {
      video.addEventListener('play', function () {
        player.classList.add('is-playing');
        setStatus('正在播放');
      });
      video.addEventListener('pause', function () {
        setStatus('已暂停');
      });
      video.addEventListener('error', function () {
        setStatus('播放源暂时无法加载');
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.slice.call(document.querySelectorAll('[data-player]')).forEach(bindPlayer);
  });
})();
