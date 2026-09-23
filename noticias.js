(() => {
  const grid = document.getElementById('newsGrid');
  if (!grid) return;

  async function loadNews() {
    try {
      const response = await fetch('assets/noticias/noticias.json', {
        cache: 'no-store'
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const items = await response.json();
      if (!Array.isArray(items) || !items.length) {
        throw new Error('No hay noticias publicadas.');
      }

      render(items.slice(0, 3));
    } catch (error) {
      console.warn('No se pudo cargar Noticias:', error);
      grid.innerHTML = `
        <div class="news-error">
          <strong>Noticias en preparación.</strong>
          <span>Próximamente vas a encontrar acá las novedades del rock riojano.</span>
        </div>
      `;
    }
  }

  function render(items) {
    grid.innerHTML = items.map(item => `
      <a class="news-card" href="noticia.html?id=${encodeURIComponent(item.id)}">
        <div class="news-thumb">
          <img src="${escapeAttr(item.imagen)}"
               alt="${escapeAttr(item.titulo)}"
               loading="lazy">
        </div>
        <div class="news-info">
          <div class="news-meta">
            <span>${escapeHtml(item.categoria || 'NOVEDADES')}</span>
            <time>${escapeHtml(item.fecha || '')}</time>
          </div>
          <h3>${escapeHtml(item.titulo)}</h3>
          <p>${escapeHtml(item.bajada || '')}</p>
          <span class="news-more">LEER NOTA ↗</span>
        </div>
      </a>
    `).join('');
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[char]));
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  loadNews();
})();
