const STREAM_URL = 'https://stream.zeno.fm/uknukavgrwzuv';
const METADATA_URL = 'https://api.zeno.fm/mounts/metadata/subscribe/uknukavgrwzuv';

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

const audio = document.getElementById('radioPlayer');
const playButtons = document.querySelectorAll('[data-radio-play]');
const playLabel = document.getElementById('playLabel');
const playerState = document.getElementById('playerState');
const volumeControls = document.querySelectorAll('#radioVolume, #stickyVolume');
const nowPlaying = document.getElementById('nowPlaying');
const nowArtist = document.getElementById('nowArtist');
const nowProgram = document.getElementById('nowProgram');
const stickyNowPlaying = document.getElementById('stickyNowPlaying');
const stickyNowArtist = document.getElementById('stickyNowArtist');
const stickyState = document.getElementById('stickyState');

function setPlayingUI(playing) {
  playButtons.forEach(btn => {
    btn.setAttribute('aria-label', playing ? 'Pausar RIOJANROCK' : 'Escuchar RIOJANROCK');
    const icon = btn.querySelector('.play-icon');
    if (icon) icon.textContent = playing ? 'Ⅱ' : '▶';
  });
  if (playLabel) playLabel.textContent = playing ? 'Pausar' : 'Escuchar';
  if (playerState) playerState.textContent = playing ? 'EN VIVO' : 'LISTO PARA ESCUCHAR';
  if (stickyState) stickyState.textContent = playing ? 'EN VIVO' : 'LISTO';
  document.body.classList.toggle('radio-playing', playing);
}

async function toggleRadio() {
  if (!audio) return;
  if (!audio.paused) {
    audio.pause();
    setPlayingUI(false);
    return;
  }
  try {
    await audio.play();
    setPlayingUI(true);
  } catch (error) {
    if (playerState) playerState.textContent = 'TOCÁ NUEVAMENTE PARA REPRODUCIR';
  }
}

playButtons.forEach(btn => btn.addEventListener('click', toggleRadio));

if (audio) {
  audio.src = STREAM_URL;
  audio.preload = 'none';
  audio.addEventListener('playing', () => setPlayingUI(true));
  audio.addEventListener('pause', () => setPlayingUI(false));
  audio.addEventListener('error', () => {
    setPlayingUI(false);
    if (playerState) playerState.textContent = 'SEÑAL NO DISPONIBLE';
  });
}

if (volumeControls.length && audio) {
  volumeControls.forEach(control => {
    control.addEventListener('input', () => {
      audio.volume = Number(control.value);
      volumeControls.forEach(other => { other.value = control.value; });
    });
  });
  audio.volume = 0.85;
}

function updateMetadata(data) {
  if (!data || typeof data !== 'object') return;

  // Zeno sends the live metadata as Server-Sent Events (SSE).
  // The useful field is streamTitle, normally: ARTISTA - TEMA.
  const streamTitle = String(data.streamTitle || '').trim();
  if (!streamTitle) return;

  const separator = streamTitle.indexOf(' - ');
  if (separator > 0) {
    const artist = streamTitle.slice(0, separator).trim();
    const song = streamTitle.slice(separator + 3).trim();
    if (nowArtist) nowArtist.textContent = artist;
    if (nowPlaying) nowPlaying.textContent = song;
    if (stickyNowArtist) stickyNowArtist.textContent = artist;
    if (stickyNowPlaying) stickyNowPlaying.textContent = song;
  } else {
    if (nowPlaying) nowPlaying.textContent = streamTitle;
    if (nowArtist) nowArtist.textContent = 'RIOJANROCK';
    if (stickyNowPlaying) stickyNowPlaying.textContent = streamTitle;
    if (stickyNowArtist) stickyNowArtist.textContent = 'RIOJANROCK';
  }

  if (nowProgram && data.program) {
    nowProgram.textContent = data.program;
  }
}

let metadataSource = null;

function connectMetadata() {
  if (!('EventSource' in window)) {
    if (nowProgram) nowProgram.textContent = 'Metadatos no compatibles con este navegador';
    return;
  }

  if (metadataSource) metadataSource.close();
  metadataSource = new EventSource(METADATA_URL);

  metadataSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      updateMetadata(data);
    } catch (error) {
      console.warn('No se pudo interpretar la metadata de Zeno:', error);
    }
  };

  metadataSource.onerror = () => {
    // EventSource automatically attempts to reconnect.
    if (nowProgram && !audio?.error) {
      nowProgram.textContent = 'Esperando información de la señal…';
    }
  };
}

connectMetadata();


const revealTargets = document.querySelectorAll('.section, .hero-copy, .hero-art, .band-card');
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
