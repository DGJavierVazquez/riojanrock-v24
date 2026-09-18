(() => {
  const slides = document.getElementById('agendaSlides');
  const dots = document.getElementById('agendaDots');
  const loading = document.getElementById('agendaLoading');
  const prev = document.querySelector('.agenda-prev');
  const next = document.querySelector('.agenda-next');

  if (!slides || !dots) return;

  const flyerFiles = [
    '01.jpg',
    '02.jpg',
    '03.jpg',
    '04.jpg',
    '05.jpg',
    '06.jpg'
  ];

  const fallback = [
    {
      src: 'assets/agenda/placeholder.svg',
      href: 'https://www.instagram.com/riojanrock/',
      alt: 'Agenda RIOJANROCK'
    }
  ];

  let items = [];
  let current = 0;
  let timer = null;

  function imageExists(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  async function getFlyers() {
    const checks = await Promise.all(
      flyerFiles.map(async file => {
        const src = `assets/agenda/${file}`;
        const exists = await imageExists(src);

        if (!exists) return null;

        return {
          src,
          href: 'https://www.instagram.com/riojanrock/',
          alt: `Agenda RIOJANROCK ${file.slice(0, 2)}`
        };
      })
    );

    return checks.filter(Boolean);
  }

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
    slides.querySelectorAll('.agenda-slide').forEach((el, i) => {
      el.classList.toggle('is-active', i === current);
    });

    dots.querySelectorAll('.agenda-dot').forEach((el, i) => {
      el.classList.toggle('is-active', i === current);
    });
  }

  function show(index, manual = false) {
    if (!items.length) return;

    current = (index + items.length) % items.length;
    update();

    if (manual) restart();
  }

  function restart() {
    clearInterval(timer);

    if (items.length > 1) {
      timer = setInterval(() => show(current + 1), 5000);
    }
  }

  prev?.addEventListener('click', () => show(current - 1, true));
  next?.addEventListener('click', () => show(current + 1, true));

  getFlyers().then(render);
})();
