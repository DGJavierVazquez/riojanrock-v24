(() => {
  const grid = document.getElementById('youtubeGrid');
  const loading = document.getElementById('youtubeLoading');
  if (!grid) return;

  const channelUrl = 'https://www.youtube.com/@riojanrocklarioja1599';

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function render(videos) {
    if (loading) loading.remove();

    if (!videos.length) {
      grid.innerHTML = `
        <div class="youtube-empty">
          <strong>Contenido en YouTube</strong>
          <span>Los últimos videos aparecerán aquí cuando el canal publique contenido.</span>
        </div>`;
      return;
    }

    grid.innerHTML = videos.slice(0, 3).map(video => {
      const id = encodeURIComponent(video.id);
      const title = escapeHtml(video.title || 'Video RIOJANROCK');
      const thumb = video.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
      const url = video.url || `https://www.youtube.com/watch?v=${id}`;

      return `
        <a class="youtube-card" href="${url}" target="_blank" rel="noopener">
          <div class="youtube-thumb">
            <img src="${thumb}" alt="${title}" loading="lazy">
            <span class="youtube-play" aria-hidden="true">▶</span>
          </div>
          <div class="youtube-info">
            <small>YouTube · RIOJANROCK</small>
            <h3>${title}</h3>
          </div>
        </a>`;
    }).join('');
  }

  async function loadYouTube() {
    try {
      const response = await fetch('assets/youtube.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        render(data);
        return;
      }
    } catch (error) {
      console.warn('No se pudo cargar youtube.json:', error);
    }

    render([]);
  }

  loadYouTube();
})();
