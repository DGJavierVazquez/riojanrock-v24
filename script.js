const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

function openRadioPlayer(event) {
  if (event) event.preventDefault();

  const features = [
    'popup=yes',
    'width=410',
    'height=640',
    'resizable=yes',
    'scrollbars=no',
    'toolbar=no',
    'menubar=no',
    'location=no',
    'status=no'
  ].join(',');

  const player = window.open('player.html', 'riojanrockPlayer', features);

  // Pop-up blocked? Fall back to normal navigation.
  if (!player) {
    window.location.href = 'player.html';
    return;
  }

  try { player.focus(); } catch {}
}

document.querySelectorAll('[data-open-player]').forEach(link => {
  link.addEventListener('click', openRadioPlayer);
});

const revealTargets = document.querySelectorAll('.section, .hero-copy, .hero-agenda, .band-card');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .08 });
  revealTargets.forEach(el => {
    el.classList.add('reveal');
    observer.observe(el);
  });
} else {
  revealTargets.forEach(el => el.classList.add('is-visible'));
}
