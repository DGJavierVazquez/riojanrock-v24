(() => {
  const grid = document.getElementById('newsGrid');
  const loading = document.getElementById('newsLoading');
  if (!grid) return;

  function esc(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  async function load() {
    try {
      const response = await fetch('assets/noticias/noticias.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const items = await response.json();

      if (!Array.isArray(items) || !items.length) {
        throw new Error('Sin noticias');
      }

      if (loading) loading.remove();

      grid.innerHTML = items.slice(0, 3).map(item => `
        <a class="news-card" href="noticia.html?id=${encodeURIComponent(item.id)}">
          <div class="news-thumb">
            <img src="${esc(item.imagen)}" alt="${esc(item.titulo)}" loading="lazy">
          </div>
          <div class="news-info">
            <div class="news-meta"><span>${esc(item.categoria)}</span><time>${esc(item.fecha)}</time></div>
            <h3>${esc(item.titulo)}</h3>
            <p>${esc(item.bajada)}</p>
            <span class="news-more">LEER NOTICIA ↗</span>
          </div>
        </a>
      `).join('');
    } catch (error) {
      console.warn('No se pudo cargar noticias:', error);
      if (loading) loading.remove();
      grid.innerHTML = `
        <div class="news-empty">
          <strong>Noticias</strong>
          <span>Las novedades aparecerán aquí.</span>
        </div>`;
    }
  }

  load();
})();
