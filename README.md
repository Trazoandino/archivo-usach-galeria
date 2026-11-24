# Archivo USACH · Galería pública 3D

Edición estática para GitHub Pages, con siete escaneos ya presentes en la biblioteca del proyecto. Incluye búsqueda, filtro por colección, fotografías y visor de splats SPZ y mallas Draco. No requiere backend, base de datos, autenticación, cuentas de alumnos ni servicios de almacenamiento pagados. Los modelos sólo se descargan cuando se abre el visor 3D.

La portada reproduce la vista **Exposición de Taller** del prototipo React: identidad FARAC turquesa, navegación por once talleres, cuatro secciones por taller, selección de semestre y ocho tarjetas por taller. Los 88 lugares de exposición reutilizan los siete escaneos y las vistas de la biblioteca. Los títulos de proyectos, estudiantes y docentes son **datos de demostración**, copiados de `libraryData.ts`, sin atribuirles la autoría de los modelos. Una aclaración aparece al final de la exposición y en Información de la galería. El diálogo de cada modelo conserva sus metadatos de origen.

Repositorio y Explorar muestran el catálogo de los siete registros reales, con búsqueda y filtros; Inicio conserva la presentación de la colección. Ninguna vista incluye inicio de sesión, entregas ni administración. Las opciones de visualización sólo cambian la densidad de las tarjetas en el navegador.

Esta carpeta contiene una exportación independiente. No publicar el directorio completo del proyecto ni el frontend de administración. No contiene bases de datos, credenciales, matrículas ni documentos privados. El código activo del resto de la plataforma permanece en su repositorio original.

## Desarrollo y compilación

Requiere Node.js 24 y npm.

```powershell
npm ci
npm run dev
npm run build
```

La carpeta `dist/` contiene todo el sitio. Las rutas relativas permiten alojarlo bajo `https://USUARIO.github.io/REPOSITORIO/` o en un dominio propio. Las fichas usan enlaces `#modelo=ID`, sin rutas de servidor ni reglas de redirección.

## Publicación en GitHub Pages

1. Crear un repositorio público dedicado, por ejemplo `archivo-usach-galeria`.
2. Subir **el contenido de esta carpeta como raíz del repositorio**, incluyendo `.github/workflows/pages.yml`, `package-lock.json` y los archivos de `public/`.
3. En Settings → Pages → Build and deployment, seleccionar **GitHub Actions**.
4. Hacer push a `main` o ejecutar manualmente el workflow «Publicar galería en GitHub Pages».
5. Esperar el éxito de la acción y abrir la URL que devuelve el despliegue.

El workflow compila y publica sólo `dist/`. Usa el token temporal de Actions con los permisos mínimos para Pages y no requiere guardar tokens personales en el código. El tamaño de los recursos públicos de esta selección es aproximadamente 53 MiB; el sitio completo sigue muy por debajo del límite de 1 GB de Pages.

## Recursos y créditos

- `src/libraryScans.ts`: catálogo y metadatos copiados de la biblioteca existente; aquí se edita la selección pública.
- `public/biblioteca/escaneos/`: vistas previas de cada maqueta.
- `public/biblioteca/escaneos/3d/`: seis SPZ y una malla Draco con su textura.
- Cada ficha enlaza a `https://scaniverse.com/scan/ID` y conserva la cuenta de publicación indicada en el catálogo original. Esa cuenta no se presenta como autoría del proyecto. Los apellidos y años se derivan exclusivamente del título original.
- El encargo Polideportivo y sus docentes se toman del catálogo existente. No se asignan nombres de autores desconocidos.
- `public/identidad-usach/`: escudo usado en el proyecto existente.
- `public/models/decoders/draco/`: decodificadores y avisos de licencia Draco/Three, conservados del proyecto.
- Visor adaptado de `src/features/library/LibraryScanViewer.tsx` y `LibraryViewCube.tsx` de la plataforma. Fuentes Inter y Archivo mediante sus paquetes de Fontsource.

Los modelos y fotografías serán públicos al desplegar. Añadir sólo material autorizado para difusión; guardar los originales y registros privados fuera de este repositorio. No se incluyen los modelos externos de prueba de `public/models/benchmarks`.

## Verificación del despliegue estático

```powershell
npx playwright install chromium
npm run build
npm run preview -- --port 4176 --strictPort --base /archivo-usach/
# En otra consola, desde esta carpeta:
npm run verify
```

La comprobación usa una subruta como Pages, carga los siete modelos, prueba búsqueda sin tildes, filtros, vista móvil, fotografías, enlaces directos y cierre del diálogo. Falla si hay errores de red, errores JavaScript o peticiones a `/api/`. Capturas en `test-results/` (no se versionan). Puede cambiarse la URL con `GALLERY_TEST_URL`.

## Agregar o reemplazar modelos

Actualizar el catálogo y copiar el SPZ o el DRC y su JPG, además de las vistas `ID-1.webp`, `ID-2.webp`, etc. Los recursos están servidos localmente desde Pages. Para almacenamiento externo habrá que configurar URLs HTTPS y CORS, además de verificar sus cuotas; esta versión no utiliza ningún servicio de cobro por uso.
