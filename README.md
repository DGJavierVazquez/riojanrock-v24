# RIOJANROCK — v24

## Agenda

La agenda usa seis posiciones fijas dentro de `assets/agenda/`:

- `01.jpg`
- `02.jpg`
- `03.jpg`
- `04.jpg`
- `05.jpg`
- `06.jpg`

La web detecta cuáles existen y arma el carrusel automáticamente. No hace falta editar JavaScript, JSON ni archivos de configuración.

Para cambiar un flyer, reemplazá el archivo correspondiente manteniendo el mismo número.

Formatos recomendados: JPG.

## Publicación

El sitio se publica como contenido estático mediante GitHub Pages.


## Noticias
La portada lee `assets/noticias/noticias.json` y muestra las 3 notas más recientes. Cada nota abre `noticia.html?id=...`.
Para reemplazar las notas de prueba, editá el JSON y cambiá las imágenes dentro de `assets/noticias/`.
