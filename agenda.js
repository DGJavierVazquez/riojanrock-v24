(() => {
  const slides = document.getElementById('agendaSlides');
  const dots = document.getElementById('agendaDots');
  const loading = document.getElementById('agendaLoading');
  const prev = document.querySelector('.agenda-prev');
  const next = document.querySelector('.agenda-next');
  if (!slides || !dots) return;

  let items = [];
  let current = 0;
  let timer = null;

  const fallback = [
    { src: 'assets/agenda/placeholder.svg', href: 'https://www.instagram.com/riojanrock/', alt: 'Agenda RIOJANROCK' }
  ];

  function render(list) {
    items = list.length ? list : fallback;
    slides.innerHTML = '';
    dots.innerHTML = '';

    items.forEach((item, index) => {
      const slide = document.createElement('div');
      slide.className = 'agenda-slide' + (index === 0 ? ' is-active' : '');
      const link = document.createElement('a');
      link.href = item.href || 'https://www.instagram.com/riojanrock/';
      link.target = '_blank';
      link.rel = 'noopener';
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.alt || `Flyer de agenda ${index + 1}`;
      img.loading = index === 0 ? 'eager' : 'lazy';
      link.appendChild(img);
      slide.appendChild(link);
      slides.appendChild(slide);

      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'agenda-dot' + (index === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', `Mostrar flyer ${index + 1}`);
      dot.addEventListener('click', () => show(index, true));
      dots.appendChild(dot);
    });

    loading?.classList.add('is-hidden');
    current = 0;
    update();
    restart();
  }

  function update() {
    slides.querySelectorAll('.agenda-slide').forEach((el, i) => el.classList.toggle('is-active', i === current));
    dots.querySelectorAll('.agenda-dot').forEach((el, i) => el.classList.toggle('is-active', i === current));
  }

  function show(index, manual = false) {
    if (!items.length) return;
    current = (index + items.length) % items.length;
    update();
    if (manual) restart();
  }

  function restart() {
    clearInterval(timer);
    if (items.length > 1) timer = setInterval(() => show(current + 1), 5000);
  }

  prev?.addEventListener('click', () => show(current - 1, true));
  next?.addEventListener('click', () => show(current + 1, true));

  // En local (file://) el navegador no puede listar una carpeta.
  // Como los flyers se numeran 01-, 02-, 03-..., probamos esos nombres
  // y solo incorporamos los archivos que realmente existen.
  function probeLocalFlyers(max = 50) {
    const extensions = ['jpeg', 'jpg', 'png', 'webp'];
    const found = [];
    const jobs = [];
    for (let n = 1; n <= max; n++) {
      const prefix = String(n).padStart(2, '0');
      for (const ext of extensions) {
        jobs.push(new Promise(resolve => {
          const img = new Image();
          const src = `assets/agenda/${prefix}-probe.${ext}`;
          // We cannot wildcard filenames, so this probe is used only for the
          // known generated manifest below. It is kept as a fallback path.
          resolve(null);
        }));
      }
    }
    return Promise.all(jobs).then(() => []);
  }

  async function loadAgenda() {
    // En el servidor local, /api/agenda inspecciona directamente la carpeta.
    // En GitHub Pages usamos agenda-data.js / agenda.json como respaldo.
    try {
      const response = await fetch('/api/agenda', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length) return data;
      }
    } catch (error) {
      // Si estamos en file:// o en GitHub Pages, usamos los datos estáticos.
    }

    if (Array.isArray(window.RR_AGENDA_DATA) && window.RR_AGENDA_DATA.length) {
      return window.RR_AGENDA_DATA;
    }

    try {
      const response = await fetch('assets/agenda/agenda.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data) && data.length) return data;
    } catch (error) {
      // Sin servidor no se puede listar una carpeta local por seguridad del navegador.
    }
    return [];
  }

  loadAgenda().then(render);

  // En desarrollo local, revisa la carpeta cada 8 segundos. Si cambió la lista,
  // reconstruye el carrusel sin reiniciar el servidor.
  let lastSignature = '';
  async function refreshLocalAgenda() {
    try {
      const response = await fetch('/api/agenda', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      const signature = JSON.stringify(data.map(item => item.src));
      if (signature && signature !== lastSignature) {
        lastSignature = signature;
        render(data);
      }
    } catch (error) {}
  }
  refreshLocalAgenda();
  setInterval(refreshLocalAgenda, 8000);
})();
