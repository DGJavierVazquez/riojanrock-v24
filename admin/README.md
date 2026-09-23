# RIOJANROCK — Panel de administración

URL pública:
`https://dgjaviervazquez.github.io/riojanrock-v24/admin/`

Funciones:
- Nueva noticia
- Editar noticia
- Eliminar noticia
- Reemplazar imagen al editar

El panel usa un Fine-grained Personal Access Token de GitHub con:
- Repository: `DGJavierVazquez/riojanrock-v24`
- Contents: Read and write

No requiere permisos de Workflows.

Las operaciones de actualización y eliminación de archivos se hacen de forma secuencial para evitar conflictos con la API de Contents de GitHub.

El token se mantiene solo en memoria de la pestaña del navegador y no está escrito en los archivos del sitio.
