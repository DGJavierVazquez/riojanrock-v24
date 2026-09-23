const STREAM_URL = 'https://stream.zeno.fm/uknukavgrwzuv';
const METADATA_URL = 'https://api.zeno.fm/mounts/metadata/subscribe/uknukavgrwzuv';

const audio = document.getElementById('audio');
const playButton = document.getElementById('playButton');
const playIcon = document.getElementById('playIcon');
const volume = document.getElementById('volume');
const stateText = document.getElementById('stateText');
const stateDot = document.getElementById('stateDot');
const song = document.getElementById('song');
const artist = document.getElementById('artist');
const message = document.getElementById('message');
const closeLink = document.getElementById('closeLink');

audio.src = STREAM_URL;
audio.volume = 0.85;

function setPlaying(playing) {
  playIcon.textContent = playing ? 'Ⅱ' : '▶';
  playButton.setAttribute(
    'aria-label',
    playing ? 'Pausar RIOJANROCK' : 'Reproducir RIOJANROCK'
  );
  stateText.textContent = playing ? 'EN VIVO' : 'LISTO PARA ESCUCHAR';
  stateDot.classList.toggle('is-live', playing);
}

async function playRadio() {
  message.textContent = '';
  try {
    await audio.play();
    setPlaying(true);
  } catch (error) {
    setPlaying(false);
    message.textContent = 'El navegador bloqueó el inicio automático. Presioná reproducir.';
  }
}

function pauseRadio() {
  audio.pause();
  setPlaying(false);
}

playButton.addEventListener('click', () => {
  if (audio.paused) playRadio();
  else pauseRadio();
});

volume.addEventListener('input', () => {
  audio.volume = Number(volume.value);
});

audio.addEventListener('playing', () => {
  setPlaying(true);
});

audio.addEventListener('pause', () => {
  setPlaying(false);
});

audio.addEventListener('error', () => {
  setPlaying(false);
  message.textContent = 'Señal no disponible. Intentá reproducir nuevamente.';
});

function updateMetadata(data) {
  if (!data || typeof data !== 'object') return;
  const streamTitle = String(data.streamTitle || '').trim();
  if (!streamTitle) return;

  const separator = streamTitle.indexOf(' - ');
  if (separator > 0) {
    artist.textContent = streamTitle.slice(0, separator).trim();
    song.textContent = streamTitle.slice(separator + 3).trim();
  } else {
    song.textContent = streamTitle;
    artist.textContent = 'RIOJANROCK';
  }
}

if ('EventSource' in window) {
  const source = new EventSource(METADATA_URL);
  source.onmessage = event => {
    try { updateMetadata(JSON.parse(event.data)); }
    catch (error) { console.warn('Metadata inválida de Zeno:', error); }
  };
}

// Intento de autoplay. Como la ventana normalmente se abre
// desde un clic del usuario, muchos navegadores lo permiten.
// Si no, el botón queda listo para reproducir manualmente.
window.addEventListener('load', () => {
  setTimeout(playRadio, 250);
});

closeLink.addEventListener('click', event => {
  event.preventDefault();
  window.close();
});
