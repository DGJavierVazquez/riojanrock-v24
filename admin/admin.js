(() => {
  const CONFIG = {
    owner: 'DGJavierVazquez',
    repo: 'riojanrock-v24',
    branch: 'main',
    newsPath: 'assets/noticias/noticias.json',
    apiBase: 'https://api.github.com'
  };

  const $ = (id) => document.getElementById(id);
  let token = '';

  const loginView = $('loginView');
  const adminView = $('adminView');
  const tokenInput = $('token');
  const loginStatus = $('loginStatus');
  const publishStatus = $('publishStatus');
  const form = $('newsForm');
  const publishBtn = $('publishBtn');
  const imageInput = $('image');
  const previewImage = $('previewImage');
  const previewPlaceholder = $('previewPlaceholder');

  function setStatus(el, message, kind = '') {
    el.className = `status ${kind}`.trim();
    el.textContent = message || '';
  }

  function authHeaders() {
    return {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`,
      'X-GitHub-Api-Version': '2026-03-10'
    };
  }

  async function github(path, options = {}) {
    const response = await fetch(`${CONFIG.apiBase}${path}`, {
      ...options,
      headers: {
        ...authHeaders(),
        ...(options.headers || {})
      }
    });

    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch {}

    if (!response.ok) {
      const message = data?.message || `HTTP ${response.status}`;
      throw new Error(message);
    }

    return data;
  }

  function bytesToBase64(bytes) {
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
    }
    return btoa(binary);
  }

  function utf8ToBase64(text) {
    return bytesToBase64(new TextEncoder().encode(text));
  }

  function base64ToUtf8(value) {
    const clean = String(value).replace(/\n/g, '');
    const binary = atob(clean);
    const bytes = Uint8Array.from(binary, ch => ch.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function slugify(text) {
    return String(text)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 72) || 'noticia';
  }

  function formatDateDisplay(value) {
    if (!value) return 'FECHA';
    const parts = value.split('-');
    if (parts.length !== 3) return value;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  async function readNewsFile() {
    const data = await github(
      `/repos/${encodeURIComponent(CONFIG.owner)}/${encodeURIComponent(CONFIG.repo)}/contents/${CONFIG.newsPath}?ref=${encodeURIComponent(CONFIG.branch)}`
    );
    return {
      sha: data.sha,
      items: JSON.parse(base64ToUtf8(data.content))
    };
  }

  async function putFile(path, contentBase64, message, sha = null) {
    const body = {
      message,
      content: contentBase64,
      branch: CONFIG.branch
    };
    if (sha) body.sha = sha;

    return github(
      `/repos/${encodeURIComponent(CONFIG.owner)}/${encodeURIComponent(CONFIG.repo)}/contents/${path}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );
  }

  async function prepareImage(file, maxWidth = 1600, quality = 0.82) {
    const src = URL.createObjectURL(file);

    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = src;
      });

      const ratio = Math.min(1, maxWidth / img.naturalWidth);
      const width = Math.max(1, Math.round(img.naturalWidth * ratio));
      const height = Math.max(1, Math.round(img.naturalHeight * ratio));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const blob = await new Promise(resolve =>
        canvas.toBlob(resolve, 'image/jpeg', quality)
      );

      if (!blob) throw new Error('No se pudo procesar la imagen.');

      const bytes = new Uint8Array(await blob.arrayBuffer());

      return {
        bytes,
        blob,
        width,
        height
      };
    } finally {
      URL.revokeObjectURL(src);
    }
  }

  async function connect() {
    const value = tokenInput.value.trim();
    if (!value) {
      setStatus(loginStatus, 'Pegá tu token de GitHub.', 'err');
      return;
    }

    setStatus(loginStatus, 'Verificando acceso…');

    try {
      token = value;

      await github('/user');
      await github(`/repos/${encodeURIComponent(CONFIG.owner)}/${encodeURIComponent(CONFIG.repo)}`);

      loginView.classList.add('hidden');
      adminView.classList.remove('hidden');
      setStatus(loginStatus, '');
      $('date').value = new Date().toISOString().slice(0, 10);
    } catch (error) {
      token = '';
      setStatus(loginStatus, `No se pudo conectar: ${error.message}`, 'err');
    }
  }

  function logout() {
    token = '';
    tokenInput.value = '';
    adminView.classList.add('hidden');
    loginView.classList.remove('hidden');
    setStatus(publishStatus, '');
    setStatus(loginStatus, 'Sesión cerrada.');
  }

  function clearForm() {
    form.reset();
    $('date').value = new Date().toISOString().slice(0, 10);
    previewImage.hidden = true;
    previewImage.removeAttribute('src');
    previewPlaceholder.hidden = false;
    $('previewMeta').textContent = 'NOVEDADES · FECHA';
    $('previewTitle').textContent = 'Título de la noticia';
    $('previewExcerpt').textContent = 'La bajada aparecerá acá.';
    setStatus(publishStatus, '');
  }

  async function publish(event) {
    event.preventDefault();
    if (!token) {
      setStatus(publishStatus, 'La sesión no está conectada.', 'err');
      return;
    }

    const title = $('title').value.trim();
    const category = $('category').value;
    const date = $('date').value;
    const excerpt = $('excerpt').value.trim();
    const body = $('body').value.trim();
    const source = $('source').value.trim() || 'RIOJANROCK';
    const file = imageInput.files?.[0];

    if (!title || !category || !date || !excerpt || !body || !file) {
      setStatus(publishStatus, 'Completá todos los campos obligatorios.', 'err');
      return;
    }

    publishBtn.disabled = true;
    publishBtn.textContent = 'PUBLICANDO…';
    setStatus(publishStatus, 'Preparando imagen y leyendo noticias actuales…');

    try {
      const image = await prepareImage(file);
      const dateStamp = date.replaceAll('-', '');
      const base = `${dateStamp}-${slugify(title)}`;
      const imagePath = `assets/noticias/${base}.jpg`;

      setStatus(publishStatus, 'Subiendo imagen…');

      await putFile(
        imagePath,
        bytesToBase64(image.bytes),
        `Noticias: imagen ${title}`
      );

      const newsFile = await readNewsFile();
      const paragraphs = body
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(Boolean);

      const id = `${dateStamp}-${slugify(title)}`;

      const item = {
        id,
        fecha: formatDateDisplay(date),
        categoria: category,
        titulo: title,
        bajada: excerpt,
        imagen: imagePath,
        texto: paragraphs,
        fuente: source
      };

      const nextItems = [item, ...newsFile.items.filter(x => x.id !== id)];

      setStatus(publishStatus, 'Guardando la noticia en GitHub…');

      await putFile(
        CONFIG.newsPath,
        utf8ToBase64(JSON.stringify(nextItems, null, 2) + '\n'),
        `Noticias: ${title}`,
        newsFile.sha
      );

      setStatus(
        publishStatus,
        'Publicada correctamente. GitHub Pages puede tardar unos minutos en reflejar el cambio.',
        'ok'
      );

      clearForm();
      setStatus(
        publishStatus,
        'Publicada correctamente. GitHub Pages puede tardar unos minutos en reflejar el cambio.',
        'ok'
      );
    } catch (error) {
      console.error(error);
      setStatus(
        publishStatus,
        `No se pudo publicar: ${error.message}`,
        'err'
      );
    } finally {
      publishBtn.disabled = false;
      publishBtn.textContent = 'PUBLICAR NOTICIA';
    }
  }

  imageInput.addEventListener('change', () => {
    const file = imageInput.files?.[0];
    if (!file) {
      previewImage.hidden = true;
      previewPlaceholder.hidden = false;
      return;
    }

    const src = URL.createObjectURL(file);
    previewImage.src = src;
    previewImage.hidden = false;
    previewPlaceholder.hidden = true;
    previewImage.onload = () => URL.revokeObjectURL(src);
  });

  $('title').addEventListener('input', () => {
    $('previewTitle').textContent = $('title').value || 'Título de la noticia';
  });

  $('excerpt').addEventListener('input', () => {
    $('previewExcerpt').textContent = $('excerpt').value || 'La bajada aparecerá acá.';
  });

  $('category').addEventListener('change', () => {
    $('previewMeta').textContent = `${$('category').value} · ${formatDateDisplay($('date').value)}`;
  });

  $('date').addEventListener('change', () => {
    $('previewMeta').textContent = `${$('category').value} · ${formatDateDisplay($('date').value)}`;
  });

  $('connectBtn').addEventListener('click', connect);
  $('logoutBtn').addEventListener('click', logout);
  $('clearBtn').addEventListener('click', clearForm);
  form.addEventListener('submit', publish);

  $('date').value = new Date().toISOString().slice(0, 10);
})();
