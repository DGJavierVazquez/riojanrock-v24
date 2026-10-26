(() => {
  const grid = document.getElementById('archiveGrid');
  const search = document.getElementById('newsSearch');
  const category = document.getElementById('categoryFilter');
  const results = document.getElementById('archiveResults');
  if (!grid || !search || !category || !results) return;

  let allNews = [];

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[char]));

  function parseDate(value) {
    const match = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return 0;
    return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1])).getTime();
  }

  function sortNewestFirst(items) {
    return [...items].sort((a, b) => parseDate(b.fecha) - parseDate(a.fecha));
  }

  function buildCategories() {
    const values = [...new Set(allNews.map(item => String(item.categoria || '').trim()).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'es'));
    category.innerHTML = '<option value="all">TODAS LAS CATEGORÍAS</option>' +
      values.map(value => `<option value="${esc(value)}">${esc(value)}</option>`).join('');
  }

  function getFiltered() {
    const query = search.value.trim().toLocaleLowerCase('es');
    const selectedCategory = category.value;

    return sortNewestFirst(allNews).filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.categoria === selectedCategory;
      const text = [item.titulo, item.bajada, item.categoria, item.fuente,
        ...(Array.isArray(item.texto) ? item.texto : [])].join(' ').toLocaleLowerCase('es');
      return matchesCategory && (!query || text.includes(query));
    });
  }

  function render() {
    const items = getFiltered();
    results.textContent = `${items.length} ${items.length === 1 ? 'NOTICIA' : 'NOTICIAS'}`;

    if (!items.length) {
      grid.innerHTML = `<div class="archive-empty"><strong>No encontramos noticias.</strong><span>Probá con otra búsqueda o categoría.</span></div>`;
      return;
    }

    grid.innerHTML = items.map(item => `
      <a class="archive-card" href="noticia.html?id=${encodeURIComponent(item.id)}">
        <div class="archive-card-image">
          <img src="${esc(item.imagen || 'assets/logo.svg')}" alt="${esc(item.titulo)}" loading="lazy">
        </div>
        <div class="archive-card-copy">
          <div class="archive-card-meta"><span>${esc(item.categoria || 'NOVEDADES')}</span><time>${esc(item.fecha || '')}</time></div>
          <h2>${esc(item.titulo || 'Sin título')}</h2>
          <p>${esc(item.bajada || '')}</p>
          <span class="archive-read">LEER NOTICIA ↗</span>
        </div>
      </a>
    `).join('');
  }

  async function init() {
    try {
      const response = await fetch('assets/noticias/noticias.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('El archivo de noticias no tiene el formato esperado.');
      allNews = data;
      buildCategories();
      render();
    } catch (error) {
      console.error('No se pudo cargar el archivo de noticias:', error);
      results.textContent = 'NO SE PUDO CARGAR EL ARCHIVO';
      grid.innerHTML = `<div class="archive-empty"><strong>Archivo temporalmente no disponible.</strong><span>Recargá la página en unos minutos.</span></div>`;
    }
  }

  search.addEventListener('input', render);
  category.addEventListener('change', render);
  init();
})();
