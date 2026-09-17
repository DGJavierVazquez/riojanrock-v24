# RIOJANROCK — v24

## Agenda por carpeta

La agenda se alimenta de `assets/agenda/`.

### Trabajo local
No abras `index.html` directamente con `file://`: Chrome impide que una página enumere los archivos de una carpeta local.

Usá `run-local.bat`. Esto inicia un servidor local y abre:

`http://127.0.0.1:8000`

Después simplemente copiá tus flyers a:

`assets/agenda/`

Formatos admitidos: JPG, JPEG, PNG, WEBP y GIF.

La web consulta `/api/agenda` y detecta nuevos archivos automáticamente cada 8 segundos. No hay que editar HTML, JavaScript ni `agenda.json`.

Para mantener el orden, numerá los archivos:

- `01-CadenaP.jpeg`
- `02-Larra.jpeg`
- `03-Festival.png`

### Publicación
Para GitHub Pages, la carpeta puede seguir siendo la fuente de los flyers. El proyecto debe generar `agenda-data.js` durante el deploy mediante GitHub Actions, ya que GitHub Pages es un hosting estático.
