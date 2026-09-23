# RIOJANROCK — Panel de administración

Este directorio agrega un panel de carga en:

https://dgjaviervazquez.github.io/riojanrock-v24/admin/

No es necesario editar `noticias.json` manualmente.

## Instalación

Copiá la carpeta `admin` dentro de la raíz de tu repositorio `riojanrock-v24`.

La estructura queda:

riojanrock-v24/
├─ admin/
│  ├─ index.html
│  ├─ admin.js
│  └─ admin.css
└─ ...

Después hacé Commit + Push desde GitHub Desktop.

## Primer uso

El panel necesita un Fine-grained Personal Access Token de GitHub. El token se ingresa en el panel y no está escrito en los archivos.

En GitHub:

1. Settings → Developer settings → Fine-grained personal access tokens.
2. New token.
3. Resource owner: `DGJavierVazquez`.
4. Repository access: Only select repositories.
5. Seleccionar `riojanrock-v24`.
6. Repository permissions → Contents → Read and write.
7. Crear el token y copiarlo.

Después entrás a `/admin/`, pegás el token y presionás CONECTAR.

## Qué hace al publicar

El panel:
1. Optimiza la imagen.
2. La guarda en `assets/noticias/`.
3. Lee `assets/noticias/noticias.json`.
4. Inserta la nueva noticia al comienzo.
5. Guarda el JSON en GitHub.
6. GitHub Pages publica la actualización.

El endpoint de GitHub permite crear o actualizar archivos del repositorio mediante la API y admite fine-grained tokens con permiso Contents: write. No se necesita permiso Workflows para este panel porque no modifica `.github/workflows`. Consulte la documentación oficial de GitHub para la API de Contents.

## Seguridad

No publiques un token en HTML, JavaScript ni GitHub.
El panel es una página estática y su única autenticación real es el token de GitHub que ingresa el administrador.
El token permanece en memoria de la pestaña y se pierde al cerrar o recargar el panel.
Si el token se compromete, revocalo desde GitHub y generá uno nuevo.

## Limitación de esta primera versión

Este panel publica nuevas noticias. Todavía no incluye editar ni borrar noticias. Eso se puede agregar como segunda etapa.
