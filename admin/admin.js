(() => {
  const CONFIG = {
    owner: 'DGJavierVazquez',
    repo: 'riojanrock-v24',
    branch: 'main',
    newsPath: 'assets/noticias/noticias.json',
    apiBase: 'https://api.github.com'
  };

  const $ = id => document.getElementById(id);
  let token = '';
  let editingId = null;
  let editingOriginal = null;
  let currentNews = [];

  const loginView = $('loginView');
  const adminView = $('adminView');
  const formPanel = $('formPanel');
  const tokenInput = $('token');
  const loginStatus = $('loginStatus');
  const publishStatus = $('publishStatus');
  const form = $('newsForm');
  const publishBtn = $('publishBtn');
  const imageInput = $('image');
  const previewImage = $('previewImage');
  const previewPlaceholder = $('previewPlaceholder');
  const newsList = $('newsList');

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
      headers: {...authHeaders(), ...(options.headers || {})}
    });

    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch {}

    if (!response.ok) {
      throw new Error(data?.message || `HTTP ${response.status}`);
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

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  function slugify(text) {
    return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      .slice(0, 72) || 'noticia';
  }

  function toInputDate(displayDate) {
    const m = String(displayDate || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : new Date().toISOString().slice(0,10);
  }

  function formatDateDisplay(value) {
    const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : value || '';
  }

  async function readNewsFile() {
    const data = await github(
      `/repos/${encodeURIComponent(CONFIG.owner)}/${encodeURIComponent(CONFIG.repo)}/contents/${CONFIG.newsPath}?ref=${encodeURIComponent(CONFIG.branch)}`
    );
    return {sha: data.sha, items: JSON.parse(base64ToUtf8(data.content))};
  }

  async function getFileMeta(path) {
    return github(
      `/repos/${encodeURIComponent(CONFIG.owner)}/${encodeURIComponent(CONFIG.repo)}/contents/${path}?ref=${encodeURIComponent(CONFIG.branch)}`
    );
  }

  async function putFile(path, contentBase64, message, sha = null) {
    const body = {message, content: contentBase64, branch: CONFIG.branch};
    if (sha) body.sha = sha;
    return github(
      `/repos/${encodeURIComponent(CONFIG.owner)}/${encodeURIComponent(CONFIG.repo)}/contents/${path}`,
      {
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(body)
      }
    );
  }

  async function deleteFile(path, sha, message) {
    return github(
      `/repos/${encodeURIComponent(CONFIG.owner)}/${encodeURIComponent(CONFIG.repo)}/contents/${path}`,
      {
        method:'DELETE',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          message,
          sha,
          branch:CONFIG.branch
        })
      }
    );
  }

  function bytesToBlob(bytes, type) {
    return new Blob([bytes], {type});
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
      const ctx = canvas.getContext('2d', {alpha:false});
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0,0,width,height);
      ctx.drawImage(img,0,0,width,height);

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
      if (!blob) throw new Error('No se pudo procesar la imagen.');

      const bytes = new Uint8Array(await blob.arrayBuffer());
      return {bytes, blob, width, height};
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
      await loadNews();
      showNewForm(false);
    } catch (error) {
      token = '';
      setStatus(loginStatus, `No se pudo conectar: ${error.message}`, 'err');
    }
  }

  async function loadNews() {
    newsList.innerHTML = '<div class="empty-state">Cargando noticias…</div>';
    try {
      const newsFile = await readNewsFile();
      currentNews = Array.isArray(newsFile.items) ? newsFile.items : [];
      renderNewsList();
    } catch (error) {
      newsList.innerHTML = `<div class="empty-state">No se pudo cargar la lista: ${escapeHtml(error.message)}</div>`;
    }
  }

  function renderNewsList() {
    if (!currentNews.length) {
      newsList.innerHTML = '<div class="empty-state">No hay noticias publicadas.</div>';
      return;
    }

    newsList.innerHTML = currentNews.map(item => `
      <article class="news-row">
        <img src="${escapeHtml(item.imagen || '')}" alt="">
        <div>
          <div class="news-row-meta">
            <span>${escapeHtml(item.categoria || 'NOVEDADES')}</span> · ${escapeHtml(item.fecha || '')}
          </div>
          <h3>${escapeHtml(item.titulo || '')}</h3>
          <p>${escapeHtml(item.bajada || '')}</p>
        </div>
        <div class="news-row-actions">
          <button class="btn ghost small edit-btn" data-id="${escapeHtml(item.id)}">EDITAR</button>
          <button class="btn danger small delete-btn" data-id="${escapeHtml(item.id)}">ELIMINAR</button>
        </div>
      </article>
    `).join('');

    newsList.querySelectorAll('.edit-btn').forEach(btn =>
      btn.addEventListener('click', () => editNews(btn.dataset.id))
    );
    newsList.querySelectorAll('.delete-btn').forEach(btn =>
      btn.addEventListener('click', () => deleteNews(btn.dataset.id))
    );
  }

  function showNewForm(scroll = true) {
    editingId = null;
    editingOriginal = null;
    form.reset();
    $('date').value = new Date().toISOString().slice(0,10);
    $('source').value = 'RIOJANROCK';
    $('formHeading').textContent = 'Nueva noticia';
    publishBtn.textContent = 'PUBLICAR NOTICIA';
    $('imageHelp').textContent = 'Obligatoria al crear. Al editar, dejala vacía para conservar la imagen actual.';
    $('currentImageRow').classList.add('hidden');
    previewImage.hidden = true;
    previewImage.removeAttribute('src');
    previewPlaceholder.hidden = false;
    $('previewMeta').textContent = 'NOVEDADES · FECHA';
    $('previewTitle').textContent = 'Título de la noticia';
    $('previewExcerpt').textContent = 'La bajada aparecerá acá.';
    setStatus(publishStatus, '');
    formPanel.classList.remove('hidden');
    if (scroll) formPanel.scrollIntoView({behavior:'smooth', block:'start'});
  }

  function editNews(id) {
    const item = currentNews.find(n => n.id === id);
    if (!item) return;

    editingId = id;
    editingOriginal = JSON.parse(JSON.stringify(item));

    $('title').value = item.titulo || '';
    $('category').value = item.categoria || 'NOVEDADES';
    $('date').value = toInputDate(item.fecha);
    $('excerpt').value = item.bajada || '';
    $('body').value = Array.isArray(item.texto) ? item.texto.join('\n\n') : '';
    $('source').value = item.fuente || 'RIOJANROCK';
    imageInput.value = '';

    $('formHeading').textContent = 'Editar noticia';
    publishBtn.textContent = 'GUARDAR CAMBIOS';
    $('imageHelp').textContent = 'Opcional. Si elegís una imagen nueva, reemplazará la actual.';

    if (item.imagen) {
      $('currentImage').src = item.imagen;
      $('currentImageRow').classList.remove('hidden');
    } else {
      $('currentImageRow').classList.add('hidden');
    }

    previewImage.hidden = true;
    previewPlaceholder.hidden = true;
    $('previewMeta').textContent = `${item.categoria || 'NOVEDADES'} · ${item.fecha || ''}`;
    $('previewTitle').textContent = item.titulo || 'Título de la noticia';
    $('previewExcerpt').textContent = item.bajada || '';

    setStatus(publishStatus, '');
    formPanel.classList.remove('hidden');
    formPanel.scrollIntoView({behavior:'smooth', block:'start'});
  }

  async function publish(event) {
    event.preventDefault();

    const title = $('title').value.trim();
    const category = $('category').value;
    const date = $('date').value;
    const excerpt = $('excerpt').value.trim();
    const body = $('body').value.trim();
    const source = $('source').value.trim() || 'RIOJANROCK';
    const file = imageInput.files?.[0];

    if (!title || !category || !date || !excerpt || !body) {
      setStatus(publishStatus, 'Completá todos los campos obligatorios.', 'err');
      return;
    }

    if (!editingId && !file) {
      setStatus(publishStatus, 'Al crear una noticia tenés que seleccionar una imagen.', 'err');
      return;
    }

    publishBtn.disabled = true;
    publishBtn.textContent = editingId ? 'GUARDANDO…' : 'PUBLICANDO…';

    try {
      const newsFile = await readNewsFile();
      const paragraphs = body.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
      let imagePath = editingOriginal?.imagen || '';
      let oldImagePath = editingOriginal?.imagen || '';

      if (file) {
        setStatus(publishStatus, 'Procesando imagen…');
        const image = await prepareImage(file);
        const stamp = date.replaceAll('-','');
        const base = `${stamp}-${slugify(title)}`;
        imagePath = `assets/noticias/${base}.jpg`;

        // If the path already exists and belongs to another article, add a suffix.
        if (imagePath !== oldImagePath) {
          let candidate = imagePath;
          let suffix = 2;
          while (currentNews.some(n => n.imagen === candidate && n.id !== editingId)) {
            candidate = `assets/noticias/${base}-${suffix++}.jpg`;
          }
          imagePath = candidate;
        }

        let existingSha = null;
        try {
          const meta = await getFileMeta(imagePath);
          existingSha = meta.sha;
        } catch (_) {}

        setStatus(publishStatus, 'Subiendo imagen…');
        await putFile(
          imagePath,
          bytesToBase64(image.bytes),
          editingId ? `Noticias: actualizar imagen ${title}` : `Noticias: imagen ${title}`,
          existingSha
        );
      }

      const id = editingId || `${date.replaceAll('-','')}-${slugify(title)}`;

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

      let nextItems;
      if (editingId) {
        nextItems = currentNews.map(n => n.id === editingId ? item : n);
      } else {
        nextItems = [item, ...currentNews];
      }

      setStatus(publishStatus, 'Guardando la noticia en GitHub…');
      await putFile(
        CONFIG.newsPath,
        utf8ToBase64(JSON.stringify(nextItems, null, 2) + '\n'),
        editingId ? `Noticias: editar ${title}` : `Noticias: ${title}`,
        newsFile.sha
      );

      // On edit, if the image changed, remove the old image after JSON is updated.
      // Requests are intentionally serial: GitHub warns that content updates/deletes
      // can conflict when executed concurrently.
      if (editingId && oldImagePath && oldImagePath !== imagePath) {
        try {
          const oldMeta = await getFileMeta(oldImagePath);
          await deleteFile(oldImagePath, oldMeta.sha, `Noticias: eliminar imagen anterior de ${title}`);
        } catch (error) {
          console.warn('No se pudo eliminar la imagen anterior:', error);
        }
      }

      editingId = null;
      editingOriginal = null;
      setStatus(
        publishStatus,
        editingId ? '' : (file ? 'Noticia guardada correctamente.' : 'Noticia guardada correctamente.'),
        'ok'
      );

      await loadNews();
      showNewForm(false);
      setStatus(publishStatus, 'Cambios publicados. GitHub Pages puede tardar unos minutos en reflejarlos.', 'ok');
    } catch (error) {
      console.error(error);
      setStatus(publishStatus, `No se pudo guardar: ${error.message}`, 'err');
    } finally {
      publishBtn.disabled = false;
      publishBtn.textContent = editingId ? 'GUARDAR CAMBIOS' : 'PUBLICAR NOTICIA';
    }
  }

  async function deleteNews(id) {
    const item = currentNews.find(n => n.id === id);
    if (!item) return;

    const confirmed = confirm(
      `¿Eliminar la noticia?\n\n"${item.titulo}"\n\nEsta acción quitará la noticia del sitio y eliminará su imagen del repositorio.`
    );
    if (!confirmed) return;

    try {
      const newsFile = await readNewsFile();
      const nextItems = newsFile.items.filter(n => n.id !== id);

      setStatus(publishStatus, 'Eliminando noticia…');

      await putFile(
        CONFIG.newsPath,
        utf8ToBase64(JSON.stringify(nextItems, null, 2) + '\n'),
        `Noticias: eliminar ${item.titulo}`,
        newsFile.sha
      );

      // Delete image after JSON update, serially.
      if (item.imagen) {
        try {
          const meta = await getFileMeta(item.imagen);
          await deleteFile(item.imagen, meta.sha, `Noticias: eliminar imagen de ${item.titulo}`);
        } catch (error) {
          console.warn('La noticia se eliminó del JSON, pero no se pudo eliminar su imagen:', error);
        }
      }

      setStatus(publishStatus, 'Noticia eliminada correctamente. La web se actualizará después del despliegue.', 'ok');
      await loadNews();
    } catch (error) {
      setStatus(publishStatus, `No se pudo eliminar: ${error.message}`, 'err');
    }
  }

  function clearForm() {
    showNewForm(false);
  }

  function logout() {
    token = '';
    tokenInput.value = '';
    adminView.classList.add('hidden');
    loginView.classList.remove('hidden');
    formPanel.classList.add('hidden');
    setStatus(publishStatus, '');
  }

  imageInput.addEventListener('change', () => {
    const file = imageInput.files?.[0];
    if (!file) {
      previewImage.hidden = true;
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
  $('newBtn').addEventListener('click', () => showNewForm(true));
  $('reloadBtn').addEventListener('click', loadNews);
  $('cancelEditBtn').addEventListener('click', () => formPanel.classList.add('hidden'));
  $('clearBtn').addEventListener('click', clearForm);
  form.addEventListener('submit', publish);

  $('date').value = new Date().toISOString().slice(0,10);
})();
