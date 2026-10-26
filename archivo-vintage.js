(() => {
  const grid = document.getElementById('vintageGrid');
  const search = document.getElementById('vintageSearch');
  const category = document.getElementById('vintageCategoryFilter');
  const year = document.getElementById('vintageYearFilter');
  const results = document.getElementById('vintageResults');
  if (!grid || !search || !category || !year || !results) return;

  let allVintage = [];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[char]));

  function parseDate(value) {
    const match = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return 0;
    return new Date(Number(match[3]), Number(match[2])-1, Number(match[1])).getTime();
  }

  function getYear(value) {
    const match = String(value || '').match(/\/(\d{4})$/);
    return match ? match[1] : '';
  }

  function buildFilters() {
    const categories = [...new Set(allVintage.map(n => String(n.categoria || '').trim()).filter(Boolean))]
      .sort((a,b) => a.localeCompare(b,'es'));
    category.innerHTML = '<option value="all">TODAS LAS CATEGORÍAS</option>' +
      categories.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');

    const years = [...new Set(allVintage.map(n => getYear(n.fecha)).filter(Boolean))].sort().reverse();
    year.innerHTML = '<option value="all">TODOS LOS AÑOS</option>' +
      years.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('');
  }

  function filtered() {
    const q = search.value.trim().toLocaleLowerCase('es');
    const cat = category.value;
    const y = year.value;
    return [...allVintage].sort((a,b) => parseDate(b.fecha)-parseDate(a.fecha)).filter(item => {
      const matchCat = cat === 'all' || item.categoria === cat;
      const matchYear = y === 'all' || getYear(item.fecha) === y;
      const text = [item.titulo,item.bajada,item.categoria,item.fuente,
        ...(Array.isArray(item.texto) ? item.texto : [])].join(' ').toLocaleLowerCase('es');
      return matchCat && matchYear && (!q || text.includes(q));
    });
  }

  function render() {
    const items = filtered();
    results.textContent = `${items.length} ${items.length === 1 ? 'CRÓNICA' : 'CRÓNICAS'}`;

    if (!items.length) {
      grid.innerHTML = `<div class="archive-empty"><strong>El archivo está esperando nuevas crónicas.</strong><span>Desde el panel de administración, elegí “ARCHIVO VINTAGE” al cargar o editar una nota histórica.</span></div>`;
      return;
    }

    grid.innerHTML = items.map(item => `
      <a class="archive-card vintage-card" href="noticia.html?id=${encodeURIComponent(item.id)}">
        <div class="archive-card-image">
          <img src="${esc(item.imagen || 'assets/logo.svg')}" alt="${esc(item.titulo)}" loading="lazy">
        </div>
        <div class="archive-card-copy">
          <div class="vintage-ribbon">ARCHIVO VINTAGE · PUBLICACIÓN ORIGINAL</div>
          <div class="archive-card-meta"><span>${esc(item.categoria || 'CRÓNICA')}</span><time>${esc(item.fecha || '')}</time></div>
          <h2>${esc(item.titulo || 'Sin título')}</h2>
          <p>${esc(item.bajada || '')}</p>
          <span class="archive-read">LEER CRÓNICA ↗</span>
        </div>
      </a>
    `).join('');
  }

  async function init() {
    try {
      const response = await fetch('assets/noticias/noticias.json',{cache:'no-store'});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('El archivo de noticias no tiene el formato esperado.');
      allVintage = data.filter(item => item.tipoPublicacion === 'vintage');
      buildFilters();
      render();
    } catch (error) {
      console.error('No se pudo cargar Archivo Vintage:', error);
      results.textContent = 'NO SE PUDO CARGAR EL ARCHIVO';
      grid.innerHTML = '<div class="archive-empty"><strong>Archivo temporalmente no disponible.</strong><span>Recargá la página en unos minutos.</span></div>';
    }
  }

  search.addEventListener('input',render);
  category.addEventListener('change',render);
  year.addEventListener('change',render);
  init();
})();
