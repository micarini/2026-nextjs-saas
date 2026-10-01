# Documentación de Quire

Esta carpeta explica el funcionamiento de cada pantalla de la aplicación y la relación entre UI, server actions, persistencia, APIs externas e inteligencia artificial.

Toda la documentación está reunida en este único archivo. Los encabezados de segundo nivel identifican
cada página o servicio y permiten navegar desde el índice de contenidos del editor o del visor Markdown.

## Arquitectura resumida

Las páginas de `app/` son Server Components por defecto. Autentican con `getCurrentUser`, leen Firestore mediante `lib/books`, `lib/users` y `lib/firebase`, y delegan la interacción en componentes client cuando necesitan estado, formularios o transiciones.

Los libros se buscan en Google Books, Open Library y Hardcover. Gemini solo participa en BookBot: genera un plan de búsqueda y elige entre candidatos reales devueltos por los catálogos. La UI nunca muestra un libro inventado por el modelo.

## Metodología de documentación

Cada página se documenta a partir de su Server Component en `app/`, sus componentes client, server actions y módulos de `lib/`; no se infieren contratos que no estén en el código. El recorrido recomendado es: (1) identificar autenticación y redirects, (2) seguir lecturas y mutaciones hasta Firestore o proveedores externos, (3) anotar el modelo normalizado y los límites de error, (4) describir el flujo visible en orden y (5) verificarlo con una prueba manual de éxito y casos límite. Las secciones de IA distinguen el prompt/selección del modelo de la validación local: ningún resultado generado se considera factual sin contrastarlo con un proveedor. Los ejemplos son fragmentos JavaScript reales o equivalentes directos del repositorio; deben mantenerse pequeños y actualizarse junto con el código.

# Documentación detallada por página y servicio


---

# `/dashboard/books/new` — Alta de libros

## Objetivo y decisiones de diseño
La ruta histórica redirige al dashboard; el alta vive en componentes reutilizables. La búsqueda ofrece preview antes de mutar para evitar agregar accidentalmente un libro como `Want to read`.

## Flujo
1. `AddBookFlow` permite buscar o introducir metadata manual.
2. `searchBooksAction` normaliza resultados de proveedores.
3. `SelectSearchResultForm` enlaza a `/dashboard/books/preview`.
4. `BookForm` valida y llama explícitamente a `createBook` con estado y metadata.
5. Se redirige al detalle persistido.

## Modelo y archivos
El formulario construye el mismo modelo de libro del detalle; `parseBookForm` conserva páginas y para `read` establece `currentPage = totalPages`. Participan `BookForm`, `BookSearchResults`, `SelectSearchResultForm`, `app/dashboard/books/new/actions.js` y `lib/books/search.js`.

## APIs e IA
Google Books, Open Library y Hardcover; no Gemini.

## Ejemplo
```jsx
<Link href={`/dashboard/books/preview?title=${encodeURIComponent(book.title)}`}>
  Ver libro
</Link>
```

## Casos y verificación
Probar alta manual sin páginas, búsqueda vacía, duplicado, estado `Finished`, cancelación de preview y campos malformados. Verificar que solo el submit explícito crea el documento.

## Normalización del alta
El formulario transforma strings de `FormData` en números y campos opcionales antes de llamar a `createBook`. Un resultado de búsqueda puede tener `pageCount` y `isbn`; `BookSearchResults` los transporta a query params de preview. La navegación es intencionalmente un `Link`, mientras que el formulario manual es la mutación.

Recrear con dos caminos: búsqueda `{ title: "Dune", pageCount: 412 } → preview → Add book` y manual `{ status: "read", totalPages: 412 } → currentPage: 412`. Probar cancelar el primer camino: Firestore debe seguir igual.

---

# `/dashboard/users/[uid]/edit` — Editar usuario

## Objetivo y diseño
Permite al administrador modificar un perfil concreto sin exponer controles a usuarios normales.

## Flujo
1. Verifica rol administrador.
2. Carga `getUserProfile(uid)`.
3. `UserForm` edita campos y ejecuta `updateUser`.
4. Se devuelve al listado con resultado de la operación.

## Modelo y archivos
UID objetivo y campos de perfil persistidos en Auth/Firestore. Código: `app/dashboard/users/[uid]/edit/page.js`, `app/dashboard/users/actions.js`, `components/users/UserForm.js`.

## APIs/IA y ejemplo
Firebase Admin; no IA.
```js
const profile = await getUserProfile(params.uid)
```

## Casos y verificación
UID inexistente, operador no admin, username ocupado y cambios parciales. Confirmar que no se puede editar otro usuario manipulando la URL sin autorización.

## Edición segura
`params.uid` identifica el objetivo, no al operador. Primero se carga el perfil para rellenar `UserForm`; al guardar, `updateUser` debe verificar de nuevo el rol del operador y validar campos como email/username. Un UID inexistente debe producir estado 404 o mensaje controlado, nunca un formulario vacío que parezca editable.

Probar modificar solo el nombre, username ocupado y acceso como no administrador manipulando la URL.

---

# `/dashboard/users` — Administración de usuarios

## Objetivo y diseño
Pantalla restringida a `user_type === "admin"`; separa operaciones administrativas de la experiencia normal.

## Flujo
1. Verifica sesión y rol.
2. `listUserProfiles` carga usuarios.
3. `UserForm` crea y actions actualizan/eliminan usuarios.
4. Se revalida/redirige tras cada mutación.

## Modelo y archivos
Perfil Auth/Firestore: UID, email, username, rol y preferencias. Código: `app/dashboard/users/page.js`, `actions.js`, `UserForm`, `UsernameForm`.

## APIs/IA y ejemplo
Firebase Admin; no IA.
```js
if (user.user_type !== 'admin') redirect('/dashboard')
```

## Casos y verificación
Usuario anónimo/no admin, email duplicado, eliminación de sí mismo y error de Auth. Confirmar que las actions vuelven a comprobar autorización en servidor.

## Autorización y operaciones
El chequeo de `user_type` en la página mejora UX, pero cada action debe repetirlo porque un cliente puede invocar una action sin seguir la pantalla. `listUserProfiles` devuelve perfiles; la creación combina Auth y Firestore y la eliminación debe manejar el orden de ambas fuentes.

Ejemplo de decisión: `{ user_type: "reader" }` recibe redirect/error; `{ user_type: "admin" }` puede ver `UserForm`. Probar email duplicado, eliminación parcial y operador que intenta eliminarse a sí mismo.

---

# `/dashboard/books/[id]` — Detalle y preview

## Objetivo y decisiones de diseño
Reutiliza una sola pantalla para libro guardado y preview. La preview (`id=preview`) es deliberadamente no destructiva: mostrar, elegir estado y confirmar son acciones separadas.

## Flujo paso a paso
1. Para un ID guardado, `getUserBook` carga el documento y se obtienen metadata, notas y relacionados.
2. Para preview, se leen query params, se consulta `listUserBooks` y se compara por ISBN/`isSameBook`.
3. Si existe coincidencia, se redirige al detalle real; si no, se muestran datos públicos y botón **Add book**.
4. El usuario selecciona estado; `createBook` solo corre al confirmar.
5. En un libro existente, `BookCompletionFlow`, rating, fechas, progreso y notas usan actions específicas.

## Modelo de datos
Metadata: título, autor, ISBN, portada, páginas, descripción y géneros. Datos personales: `status`, `currentPage`, `rating`, `startedAt`, `finishedAt`, objetivo y notas. `read` fija la página total y puede abrir el prompt de finalización.

## Archivos/componentes/actions
`app/dashboard/books/[id]/page.js`, `actions.js`, `BookCompletionFlow`, `PersonalRatingStars`, `BookDatesEditor`, `NotesList`, `RelatedBooksSection`, `getBookMetadata`, `getRelatedBooks`, `listBookNotes`.

## APIs e IA
No usa IA. Metadata/relacionados pueden consultar Google Books, Open Library y Hardcover.

## Ejemplo real
```js
if (existingBook) redirect(`/dashboard/books/${existingBook.id}`)
await createBook(formData)
```

## Casos límite y verificación
Probar ISBN ausente, misma obra con edición distinta, query incompleta, estado `Finished`, libro ya existente con rating, nota vacía y proveedor sin portada. Confirmar que preview nunca crea documentos y que los datos personales existentes sobreviven.

## Razón de la separación preview/detalle
La identidad pública (ISBN, título y autor) no equivale a pertenencia a la biblioteca. Por eso la preview compara con `isSameBook`, pero solo el submit confirmado crea el documento. En un libro existente se preservan rating, progreso, fechas y estado: volver a abrir una recomendación no debe resetear datos personales.

Para recrearlo, separar `loadPublicMetadata`, `findExistingBook` y `persistBook`. Una entrada preview con `{ isbn: "978...", title: "Dune" }` produce redirect si coincide por ISBN; sin coincidencia produce formulario. Verificar también la rama `Finished`: `currentPage` debe ser `totalPages` y el prompt de finalización aparece una sola vez.

---

# `/dashboard/categories/[genre]` — Categorías

## Objetivo y diseño
Permite explorar un género validado sin mezclarlo con la biblioteca. `getCategoryConfig` rechaza slugs desconocidos y limita la consulta a 40 resultados.

## Flujo
1. Se valida el slug y obtiene configuración.
2. En paralelo se consultan `getCategoryBooks(genre, 40)` y `listUserBooks`.
3. `CategoryBookList` marca coincidencias y enlaza a preview/detalle.

## Modelo y archivos
Resultados son metadata externa; coincidencias usan identidad de libro del usuario. Participan `app/dashboard/categories/[genre]/page.js`, `lib/discovery/categories.js`, `lib/books/genres.js` y `CategoryBookList`.

## APIs/IA y ejemplo
Usa Google Books/Open Library; no IA.
```js
const config = getCategoryConfig(params.genre)
const books = await getCategoryBooks(config.slug, 40)
```

## Casos y verificación
Slug inválido, cero resultados, duplicados y libro ya guardado. Verificar límite, estado visual y que seleccionar no guarda automáticamente.

## Normalización y relación con biblioteca
El slug de URL se valida contra `getCategoryConfig`; la etiqueta visual y la consulta al proveedor se derivan de esa configuración, no de texto arbitrario. Los resultados externos se comparan con la colección local para marcar “ya agregado”. Esa marca es informativa: seleccionar un resultado abre preview.

Entrada `{ genre: "science-fiction" }` puede producir configuración canónica y hasta 40 libros. Probar slug desconocido, categorías sin resultados y una portada nula; ningún fallo del catálogo debe borrar la lectura local.

---

# `/dashboard` — Dashboard principal

## Objetivo y decisiones de diseño
Concentra progreso personal y descubrimiento sin mezclar libros externos con la biblioteca. La página server-side carga datos independientes en paralelo y deja las interacciones a componentes client.

## Flujo paso a paso
1. Autentica y verifica onboarding.
2. En paralelo ejecuta `listUserBooks(user.uid)`, `getTrendingBooks(16)`, `getNewReleases(16)` y `getBooksBySubject(tag.subject, 16)`.
3. Deriva `continueReading` (`status === "reading"`) y terminados (`status === "read"`).
4. Renderiza búsqueda, progreso, objetivo, estantes y navegación.

## Modelo de datos
Cada libro incluye identidad externa, título/autor, portada, páginas, `status`, `currentPage`, rating y fechas. El perfil aporta géneros y `annualGoal`; los estantes de discovery son resultados efímeros de catálogos.

## Archivos/componentes
`app/dashboard/page.js`; `HomeSearchBar`, `CurrentReadingCard`, `ReadingGoalCard`, `BookShelfRow`, `MotivationCard`, `DiscoveryShelfRow`, `BottomNav`; `lib/books/books.js` y `lib/discovery/*`.

## APIs e IA
No usa Gemini. Discovery consulta Google Books/Open Library/Hardcover según módulo; los errores de una fuente no deben borrar la biblioteca local.

## Ejemplo real
```js
const continueReading = books.filter(book => book.status === 'reading')
await Promise.all([listUserBooks(uid), getTrendingBooks(16), getNewReleases(16)])
```

## Casos límite y verificación
Probar biblioteca vacía, varios libros en lectura, género sin resultados, proveedor caído y objetivo no definido. Verificar que tocar un resultado externo abre preview y no crea automáticamente.

## Cómo se forma cada sección
La consulta local y las tres consultas de discovery son independientes, por eso `Promise.all` reduce latencia. `continueReading` usa el estado persistido y no un cálculo de porcentaje; el porcentaje se presenta con `currentPage / totalPages` en `CurrentReadingCard`. El objetivo compara terminados con `annualGoal`; trending, releases y subjects son listas efímeras y nunca se mezclan en `listUserBooks`.

Entrada ilustrativa: un libro `{ status: "reading", currentPage: 40, totalPages: 200 }` aparece en “continue reading”, mientras uno `{ status: "read" }` aparece en terminados. Si el proveedor devuelve `[]`, el estante se muestra vacío pero la biblioteca local permanece.

---

# `/dashboard/import` — Importación Goodreads

## Objetivo y diseño
Importa una exportación CSV sin IA, en lotes pequeños para controlar memoria, errores y límites de proveedores. La metadata se enriquece, pero el estado personal del archivo es la autoridad.

## Flujo
1. `GoodreadsImport` recibe el archivo y valida CSV.
2. `parseGoodreadsExport` normaliza ISBN, título/serie, fechas y estado.
3. `importGoodreadsBatch` procesa hasta 20 filas por lote.
4. Para portada/metadata se intenta Google Books y luego Open Library.
5. Se muestran éxitos y errores parciales.

## Modelo y archivos
El CSV se mapea al documento de libro; `GOODREADS_MAX_BATCH_SIZE=20` y la reseña se limita a 5000 caracteres. Participan `components/import/GoodreadsImport.js`, `app/dashboard/import/actions.js`, `lib/import/goodreadsCsv.js`, `goodreadsImport.js`.

## APIs/IA
Google Books/Open Library; no Gemini.

## Ejemplo
```js
for (const batch of batches(rows, GOODREADS_MAX_BATCH_SIZE)) {
  await importGoodreadsBatch(batch)
}
```

## Casos y verificación
CSV vacío, columnas faltantes, ISBN con guiones, fechas inválidas, duplicados, fila corrupta y fallo de proveedor. Verificar reintento idempotente y reporte por fila.

## Mapeo de filas
`parseGoodreadsExport` limpia ISBN (incluido `ISBN13`), separa series del título, convierte fechas y traduce `Exclusive Shelf` a los estados de la aplicación. La reseña se recorta a `GOODREADS_MAX_REVIEW_LENGTH`; `GOODREADS_MAX_BATCH_SIZE` evita una action gigantesca.

Ejemplo: `{ "Title": "Dune (Saga #1)", "ISBN13": "(=978...)", "Exclusive Shelf": "read" }` se convierte en título base, ISBN limpio y estado `read`. Una fila inválida debe aparecer como error individual para que las demás continúen. Verificar duplicados y reintento del mismo CSV.

---

# `/` — Inicio y onboarding

**Implementación:** `app/page.js`, `app/onboarding/actions.js`.

## Objetivo y decisiones de diseño
Es la puerta de entrada: evita mostrar un dashboard sin contexto y separa autenticación, onboarding y contenido. `getCurrentUser` identifica la sesión; un perfil con onboarding terminado redirige a `/dashboard`, mientras que un perfil nuevo recibe `OnboardingFlow`. Si Firebase está temporalmente no disponible se muestra `DatabaseUnavailable`, no una colección vacía engañosa.

## Flujo paso a paso
1. Se obtiene la sesión y el perfil mediante `getCurrentUser`/`getCurrentUserProfile`.
2. `checkOnboardingStatus` decide si falta configurar preferencias.
3. `OnboardingFlow` recoge géneros, objetivo anual y preferencias.
4. `finishOnboarding` persiste esos valores y navega al dashboard; `skipGoal` permite continuar sin objetivo.
5. `tasteTags` transforma géneros en etiquetas de descubrimiento posteriores.

## Modelo de datos
El perfil de usuario contiene identidad, `onboardingCompleted`, géneros/taste tags y `annualGoal`. El objetivo es opcional; los libros aún no se crean durante este flujo.

## Archivos, componentes y actions
`components/onboarding/OnboardingFlow.js`, `hero/CoverWall.js`, `hero/covers.js`, `hero/exitTimeline.js`, `hero/useColumnCount.js`, `lib/users/users.js`, `lib/books/tasteTags.js` y las actions citadas.

## APIs e IA
No invoca catálogos ni Gemini. Usa Firebase indirectamente a través de las acciones y lecturas de perfil.

## Ejemplo real
```js
if (profile?.onboardingCompleted) redirect('/dashboard')
return <OnboardingFlow profile={profile} />
```

## Casos límite y verificación
Probar usuario anónimo, usuario con onboarding completo, `skipGoal`, recarga durante el guardado y error/cuota de Firebase. Verificar que ningún paso cree libros y que el redirect no ocurra antes de persistir.

## Cómo recrearlo
El flujo se puede reconstruir como una máquina de estados: `anonymous → authenticated → needs_onboarding → dashboard`. La lectura de perfil debe ocurrir después de conocer el UID; `finishOnboarding` recibe un `FormData`, normaliza géneros y objetivo y escribe una sola fuente de verdad. Un perfil de entrada `{ onboardingCompleted: false, genres: ["fantasy"], annualGoal: "12" }` termina como preferencias persistidas y una redirección, pero no como un libro.

## Detalles de UI y prueba
`OnboardingFlow` mantiene el paso actual en cliente y delega persistencia a actions. `CoverWall` y sus helpers son presentación, no lógica de negocio. Simular refresh en cada paso, doble submit y error de Firebase: el botón debe bloquearse o tolerar repetición y el mensaje de error no debe fingir que el onboarding terminó.

---

# `/dashboard/library` — Biblioteca

## Objetivo y decisiones de diseño
Presenta únicamente la colección persistida del usuario y permite filtrarla/navegarla sin recalcular recomendaciones. Los estados son datos personales (`to_read`, `reading`, `read`, `dnf`).

## Flujo
1. Se valida sesión.
2. `listUserBooks(user.uid)` lee Firestore.
3. `LibraryView` entrega filtros y navegación; cada tarjeta enlaza al detalle.
4. Las mutaciones se realizan en el detalle mediante server actions.

## Modelo de datos
El documento de libro combina metadata de catálogo con estado, progreso, rating personal, fechas, notas y propietario. La identidad se compara por ID/ISBN y `isSameBook` cuando corresponde.

## Archivos/APIs
`app/dashboard/library/page.js`, `AllBooksLibrary`/`LibraryShelf`, componentes de estante y `lib/books/books.js`. No hay endpoint específico ni IA.

## Ejemplo
```js
const books = await listUserBooks(user.uid)
return <LibraryView books={books} />
```

## Casos y pruebas
Probar cero libros, filtros por cada estado, duplicados de edición, libro eliminado y permisos cruzados. Confirmar persistencia tras recargar y que los metadatos personales no se sobreescriben.

## Filtrado y recreación
La página entrega el array original a la vista de biblioteca; los filtros son proyecciones, no nuevas escrituras. Un filtro “reading” equivale a `books.filter(book => book.status === "reading")`. Cada item debe conservar su `id` para abrir `/dashboard/books/[id]`; una búsqueda o recomendación externa usa preview y no entra aquí hasta confirmar el alta.

Probar estados desconocidos, portada ausente, dos ediciones con el mismo título y una colección grande. El resultado visible puede tener menos campos, pero no debe perder `id`, estado ni progreso.

---

# `/login` — Login

## Objetivo y decisiones de diseño
`app/login/page.js` conserva una URL conocida pero delega el flujo vigente en `/`; así no se duplican formularios ni reglas de sesión.

## Flujo paso a paso
1. `/login` redirige a `/`.
2. El flujo de inicio obtiene credenciales/token del cliente.
3. `app/api/session/login/route.js` valida con Firebase Admin, crea la cookie de sesión y asegura el perfil.
4. Las páginas protegidas consultan `getCurrentUser`; logout pasa por `app/api/session/logout/route.js`.

## Modelo de datos
La sesión se representa por cookie segura; el perfil Firestore queda asociado al UID de Firebase y contiene el tipo de usuario.

## Archivos y APIs
`app/login/page.js`, `app/page.js`, `lib/firebase/session.js`, `app/api/session/login/route.js` y `logout/route.js`.

## IA y ejemplo
No hay IA ni APIs de libros.
```js
redirect('/')
```

## Casos límite y verificación
Comprobar credenciales inválidas, cookie ausente/expirada, logout y acceso directo a una ruta protegida. Confirmar que nunca se renderiza información privada sin sesión.

## Contrato práctico
La página no contiene un formulario alternativo: su salida observable es la redirección. El endpoint de login recibe la credencial que entiende Firebase Admin, crea la cookie y garantiza el perfil; las páginas nunca deben aceptar un UID enviado por el cliente como autoridad. El caso `{ cookie: ausente }` produce usuario nulo y redirect; una cookie inválida no debe exponer el motivo interno.

## Recreación y verificación
Implementar primero `getCurrentUser`, luego un guard en cada Server Component y por último login/logout. Probar sesión nueva, sesión expirada, dos pestañas y logout seguido de Back: el servidor debe volver a rechazar la ruta protegida.

---

# `/dashboard/profile` — Perfil

## Objetivo y diseño
Centraliza preferencias visibles, cuatro libros destacados, cita fijada y cierre de sesión; las mutaciones son explícitas y server-side.

## Flujo
1. Carga perfil y biblioteca autenticados.
2. `PinnedQuotePicker` selecciona un libro y `savePinnedQuoteBook` persiste.
3. `saveTopFour` guarda destacados.
4. `logout` elimina sesión.

## Modelo y archivos
Perfil: preferencias, `topFour` y libro de cita fijada; libros referenciados deben pertenecer al usuario. Código: `app/dashboard/profile/page.js`, `actions.js`, `PinnedQuotePicker`.

## APIs/IA y ejemplo
Firebase vía actions; no IA.
```js
await saveTopFour(formData)
```

## Casos y verificación
Perfil sin libros, IDs eliminados, selección repetida y logout. Confirmar autorización por UID y persistencia al recargar.

## Reglas de persistencia
`PinnedQuotePicker` recibe libros del usuario y no debería aceptar un ID ajeno; las actions son la última barrera. `saveTopFour` conserva referencias a la biblioteca y `savePinnedQuoteBook` actualiza el libro de cita sin copiar metadata. Esto evita que cambiar el título externo desincronice el perfil.

Recrear con biblioteca vacía, seleccionar cuatro libros, reemplazar uno y cerrar sesión. Tras recargar deben persistir solo referencias válidas y ninguna nota privada debe volverse pública por este formulario.

---

# `/books/[id]` — Detalle público

## Objetivo y diseño
Presenta una ficha publicada de solo lectura, independiente de la biblioteca privada.

## Flujo
1. `getPublishedBook(id)` carga el documento.
2. Se muestran portada, título, autor, género, estado y rating agregado.
3. `RatingStars` renderiza la valoración sin mutación.

## Modelo y archivos
Documento publicado con identidad del libro y campos visibles; no incluye notas ni progreso privado. Código: `app/books/[id]/page.js`, `components/books/RatingStars.js`.

## APIs/IA y ejemplo
Firestore; no IA.
```js
const book = await getPublishedBook(params.id)
```

## Casos y verificación
ID inexistente, portada faltante, rating cero y documento no publicado. Confirmar que la ruta no permite editar.

## Contrato de solo lectura
`getPublishedBook(id)` debe devolver únicamente el documento publicado que corresponde al ID. La ficha puede mostrar rating cero y portada vacía como valores válidos; `RatingStars` es presentación y no implica una action de votación en esta ruta.

Para recrearla basta cargar, comprobar existencia y mapear `{ title, author, genre, status, rating, coverUrl }` a la vista. Probar ID inexistente y documento privado: ambos deben quedar fuera.

---

# `/u/[username]` — Perfil público

## Objetivo y diseño
Expone solo libros publicados, no la biblioteca privada completa. Agrupa por géneros para una navegación legible.

## Flujo
1. Busca usuario por nombre.
2. Obtiene libros publicados.
3. Agrupa según `lib/books/genres.js` y renderiza `BookShelfRow`.
4. Cada libro apunta a detalle público.

## Modelo y archivos
Usuario identificado por `username`; libro público contiene metadata y estado/rating publicado. Código: `app/u/[username]/page.js`, `lib/users/users.js`, `BookShelfRow`.

## APIs/IA y ejemplo
Firestore; no IA ni catálogos.
```js
const books = await getPublishedBooks(profile.uid)
```

## Casos y verificación
Nombre inexistente, usuario sin publicaciones, género desconocido y datos privados. Confirmar que no se filtran notas/progreso privado.

## Frontera de privacidad
La consulta pública debe filtrar por usuario y por el indicador de publicación antes de agrupar. `BookShelfRow` recibe resúmenes visuales, no documentos completos con notas, progreso o fechas privadas. Si el usuario existe pero no tiene libros publicados, el resultado correcto es un perfil vacío.

Probar username con mayúsculas/espacios según la normalización real, usuario inexistente y un libro retirado de publicación. Confirmar que cambiar una biblioteca privada no cambia la vista pública hasta publicar.

---

# `/dashboard/read` — Modo lectura

## Objetivo y decisiones de diseño
`FocusMode` concentra lectura y progreso, separando el estado efímero de la sesión del documento de libro. El libro se toma de `searchParams.book` o del primero en estado `reading`.

## Flujo
1. Se autentica y lista la biblioteca.
2. Se selecciona el libro; se comprueba conexión Spotify.
3. `FocusMode` permite avanzar páginas, iniciar/finalizar sesión y registrar notas.
4. `read/actions.js` actualiza progreso, fechas y sesión; las notas usan actions de libros.
5. OAuth Spotify conecta y playlist crea música de lectura.

## Modelo de datos
Libro: `currentPage`/`totalPages`, estado y fechas. Sesión: usuario, libro, inicio/fin y progreso. Integración: tokens Spotify almacenados de forma segura.

## Archivos/APIs
`app/dashboard/read/page.js`, `actions.js`, `FocusMode`, `lib/books/sessions.js`, `app/api/spotify/*`, `lib/spotify-api.js`.

## IA y ejemplo
No hay IA en el modo lectura ni en la generación de playlists de Spotify. La playlist no analiza la sinopsis, el contenido, los temas ni el título del libro: usa únicamente el género persistido (`book.genre`) y lo transforma en un género de búsqueda compatible con Spotify. Por ejemplo, `fantasy` se busca como `ambient`, `classic` como `classical` y, si no hay resultados, se prueban géneros de fallback (`ambient`, `study` y `classical`). El título y el autor solo se usan para nombrar y describir la playlist.

La única función con IA generativa de la aplicación es BookBot (`/dashboard/recommendations`), que usa Gemini junto con resultados verificados de Google Books/Open Library; sus recomendaciones no se guardan automáticamente. Spotify recibe una consulta de género y devuelve canciones del catálogo, no contenido generado por IA.
```js
const selected = books.find(b => b.id === searchParams.book) ?? books.find(b => b.status === 'reading')
```

## Casos y verificación
Sin libro en lectura, ID inexistente, progreso mayor que páginas, refresh durante sesión, Spotify desconectado y revocación OAuth. Confirmar que finalizar marca fechas una sola vez.

## Estado y sesiones
El libro seleccionado es una lectura persistida; la sesión de lectura es un registro separado que permite iniciar/finalizar sin duplicar el libro. `FocusMode` mantiene controles interactivos en cliente, pero las actions vuelven a validar UID en servidor. Para un libro de 400 páginas en la página 120, avanzar debe persistir 121 (o el valor validado por la action), nunca una página negativa o mayor al total.

La integración Spotify es opcional: sin token se oculta o deshabilita la playlist, pero el progreso sigue funcionando. Verificar recarga, dos sesiones abiertas y finalización repetida.

Al crear una playlist, la URL devuelta por Spotify se guarda en `book.spotifyUrl` mediante la action `setBookSpotifyUrl`. El reproductor superior se vincula automáticamente a esa URL y el botón queda deshabilitado con el estado “Playlist already created”, incluso después de recargar, para evitar crear playlists duplicadas. Si el libro ya tiene una URL de Spotify válida, se considera que ya tiene playlist vinculada.

---

# `/dashboard/recommendations` — BookBot

## Objetivo y decisiones de diseño
BookBot ofrece descubrimiento conversacional basado en la biblioteca, pero mantiene una frontera clara entre sugerir y guardar. La página es server-side y calcula los cinco géneros más frecuentes; el chat y sus chips son client-side. Las tarjetas abren una preview interna, nunca ejecutan `createBook` al tocarse.

## Flujo paso a paso
1. `getCurrentUser` autentica; sin sesión se redirige a `/`.
2. `listUserBooks(user.uid)` obtiene la biblioteca.
3. `getFavoriteGenres` normaliza `genres`/`genre`, cuenta ocurrencias y conserva cinco géneros.
4. `BookRecommendationBot` envía mensaje e historial a `/api/book-recommendations`.
5. La API genera candidatos verificados y devuelve texto, tarjetas y `followUps` contextuales.
6. El usuario puede abrir `/dashboard/books/preview`, elegir estado y confirmar **Add book**.

## Modelo de datos
La página recibe `favoriteGenres`; el chat mantiene mensajes, historial y recomendaciones de sesión. Cada tarjeta contiene metadata de catálogo (título, autor, ISBN, páginas, portada), no un documento de biblioteca. La biblioteca y sus estados se consultan como contexto, no se modifican durante la respuesta.

## Archivos, componentes y actions
`app/dashboard/recommendations/page.js`, `components/recommendations/BookRecommendationBot.js`, `components/nav/BottomNav.js`, `lib/recommendations/tasteProfile.js`, `lib/ai/bookbot.js` y `app/api/book-recommendations/route.js`. No hay server action de alta en esta página.

## APIs e IA
El chat consume `/api/book-recommendations`; esa ruta combina Gemini con Google Books/Open Library y tiene fallback determinista. `buildTasteProfile` distingue libros queridos, rechazados, en lectura y pendientes para que el prompt no repita la biblioteca.

## Ejemplo real
```jsx
<BookRecommendationBot favoriteGenres={favoriteGenres} />
```

## Casos límite y testing manual
Probar biblioteca vacía, géneros en formatos distintos, consulta libre (“fantasy books under 100 pages”), Gemini no disponible y repetición de una recomendación. Confirmar que aparecen follow-ups, que el límite de páginas se cumple, que una tarjeta abre preview y que cancelar **Add book** deja la biblioteca intacta.

---

# `/dashboard/stats` — Estadísticas

## Objetivo y decisiones de diseño
Esta página convierte documentos de libros y días de lectura en un objeto `stats` serializable. La decisión importante es calcular en el Server Component (`app/dashboard/stats/page.js`) y mantener los componentes visuales puros: así no se exponen consultas de Firestore al navegador y todos los agregados se reproducen a partir de las mismas entradas. No se usa IA ni una API externa.

La implementación actual calcula el año calendario actual (`new Date().getFullYear()`), no un año elegido por el usuario. También conserva una decisión de compatibilidad: un libro con `status === "read"` y sin `finishDate` se cuenta en el año actual. Un libro terminado con fecha inválida recibe el mismo tratamiento; esto evita que lecturas antiguas desaparezcan silenciosamente, aunque conviene corregir la fecha del documento.

## Flujo paso a paso
1. `getCurrentUser()` valida la sesión; si no existe, `redirect("/")` detiene el render.
2. `Promise.all` obtiene `listUserBooks(user.uid)` y `getUserReadingDays(user.uid)` en paralelo.
3. Se separan terminados del año actual y del anterior comprobando estado y año de `finishDate`.
4. Se calculan páginas, objetivo, porcentaje, meses, géneros, ratings, extremos, horas, comparación anual y libros del año.
5. `StatsDashboard` permite cambiar entre vista `wall` y `cards`; ambas reciben exactamente el mismo objeto.
6. `StatsWall` compone `MonthlyBars`, `GoalRing`, `YearBooks`, `ReadingHeatmap`, `GenreStats`, `RatingStats` y `BookExtremes`. `StatsCards` reutiliza parte de esos componentes en tarjetas compactas.
7. `ReadingHeatmap` llama a `changeReadingDay(date, color)`. La action vuelve a autenticar, ejecuta `updateUserReadingDay` y hace `revalidatePath`.

## Normalización de fechas
`toDate(value)` acepta cuatro representaciones reales: `Date`, Timestamp de Firebase con `.toDate()`, objeto `{ seconds }` y valores que `new Date` pueda interpretar (por ejemplo, ISO). Las fechas inválidas devuelven `null` en vez de romper el render.

```js
function toDate(value) {
  if (typeof value?.toDate === "function") return value.toDate();
  if (typeof value === "object" && typeof value.seconds === "number") {
    return new Date(value.seconds * 1000);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
```

`finishDate` es la fecha principal. Para el total anual solo se aceptan libros con estado exactamente `read` y cuya fecha tenga el año actual; sin fecha se aplica el fallback descrito arriba. Los días guardados se filtran por prefijo `YYYY-`, por lo que `2026-02-03` pertenece a 2026 y `2025-12-31` no.

## Normalización de páginas y tiempo
`getBookPages` intenta `totalPages` y, si no existe o no es positivo, `currentPage`; convierte con `parseInt` y devuelve cero ante `NaN`. Para libros terminados, `getBookPagesRead` usa el total: terminar un libro de 300 páginas cuenta 300 aunque `currentPage` esté vacío. Para libros no terminados usa únicamente `currentPage`, evitando sumar páginas futuras.

El tiempo busca `readingMinutes`, `minutesRead` o `readingTimeMinutes`. Solo números positivos se suman. El total se convierte a horas con un decimal (`Math.round(minutes / 60 * 10) / 10`); si no hay ningún registro, `hoursRead` es `null` y la UI muestra `—`/“not tracked yet”.

Ejemplo de entrada:

```js
[
  { status: "read", totalPages: "300", finishDate: "2026-03-10", rating: 5 },
  { status: "reading", totalPages: 450, currentPage: 80, readingMinutes: 90 }
]
```

El primer libro aporta 300 páginas terminadas; el segundo aporta 80 páginas actuales y 1.5 horas. No se suman 450 páginas del libro todavía en lectura.

## Normalización y agregación de géneros
`getBookGenres` acepta `genre` como string separado por comas o array; también considera `genres`, `categories` y `shelves` como fallback. Se da prioridad a `genre`, pero se descarta el valor por defecto `fantasy` cuando existe metadata más significativa. `canonicalGenre` recorta, pasa a minúsculas, reemplaza `_`/`-` por espacios y compara contra `GENRES` para devolver la etiqueta canónica; si no hay coincidencia, `normalizeGenre` convierte la primera letra de cada palabra a mayúscula. Sin datos se usa `Other`.

Después, un `Map` cuenta cada género por libro terminado, no por número de etiquetas duplicadas. Ejemplo: `genre: "science_fiction, fantasy"` se transforma en `Science Fiction` y `Fantasy`; dos libros con `fantasy` producen `{ name: "Fantasy", count: 2 }`. La lista se ordena descendente por `count`.

## Agregados concretos
- **Libros terminados:** cantidad de elementos en `finishedBooksThisYear`.
- **Páginas:** reducción de todos los libros mediante `getBookPagesRead`.
- **Meta:** si se terminaron más de 30, meta = terminados + 10; en caso contrario es 30. `goalProgress` es `Math.min(100, Math.round(finished / goal * 100))`.
- **Meses:** array fijo de 12 objetos `{ label, monthIndex, books, pages, bookItems }`; cada terminado incrementa el mes de `finishDate`, o el mes actual si falta fecha.
- **Ratings:** cinco objetos para 5, 4, 3, 2 y 1; se cuenta igualdad numérica, por eso el string `"5"` funciona.
- **Extremos:** se filtran libros con páginas positivas, se ordenan descendente y se toma primero/último.
- **Comparación:** `differenceFromLastYear = totalBooksFinished - previousYearCount`.
- **Días:** `readingDayCount` es la longitud de los días del año guardados; no se infieren sesiones automáticamente.

El objeto resultante tiene `year`, `annualGoal`, `goalProgress`, `booksFinished`, `pagesRead`, `hoursRead`, `monthly`, `genres`, `ratings`, `longest`, `shortest`, `previousYear`, `previousYearCount`, `differenceFromLastYear`, `activityDays`, `readingDayCount`, `fiveStarReads`, `fiveStarTitles` y `yearBooks`.

## Componentes y responsabilidades
`StatsDashboard` solo controla `view` con `useState`. `StatsWall` calcula el texto de libros restantes y distribuye secciones grandes. `StatsCards` presenta métricas compactas y abrevia páginas >= 1000 como `1.2k`. `MonthlyBars` dibuja libros/páginas por mes; `GoalRing` recibe porcentaje; `YearBooks` usa el resumen de cada libro; `GenreStats` y `RatingStats` muestran distribuciones; `BookExtremes` muestra mayor/menor paginación; `ReadingHeatmap` edita días y colores.

## Ejemplo de entrada y salida
Con dos terminados en marzo y mayo, 500 y 300 páginas, y un terminado el año anterior, una salida mínima es:

```js
{
  year: 2026,
  booksFinished: 2,
  pagesRead: 800,
  annualGoal: 30,
  goalProgress: 7,
  previousYearCount: 1,
  differenceFromLastYear: 1,
  monthly: [
    /* enero ... */
    { label: "M", monthIndex: 2, books: 1, pages: 500, bookItems: [...] },
    /* abril */
    { label: "M", monthIndex: 4, books: 1, pages: 300, bookItems: [...] }
  ],
  ratings: [
    { rating: 5, count: 1 }, { rating: 4, count: 0 },
    { rating: 3, count: 1 }, { rating: 2, count: 0 }, { rating: 1, count: 0 }
  ]
}
```

## Archivos y APIs
`app/dashboard/stats/page.js` contiene las funciones de normalización y agregación; `app/dashboard/stats/actions.js` contiene `changeReadingDay`; `lib/users/users.js` lee y actualiza días; `lib/books/books.js` lee libros; `lib/books/genres.js` define el catálogo canónico. La UI vive en `components/stats/StatsDashboard.js`, `StatsWall.js`, `StatsCards.js` y los componentes de `components/stats/`.

## IA
No participa IA. Esto es intencional: las métricas deben ser auditables, deterministas y explicables a partir de documentos Firestore.

## Casos límite y verificación manual
Probar biblioteca vacía, objetivo implícito de 30, más de 30 terminados, `totalPages` como string, solo `currentPage`, rating sin valor, género desconocido, fechas Timestamp/ISO/inválidas, `finishDate` ausente, lectura en progreso y año sin días. Comparar manualmente una muestra de tres libros con la salida, cambiar un día en el heatmap y recargar. Confirmar que una fecha inválida no rompe la página, que un libro `reading` no aporta todas sus páginas y que `revalidatePath` refleja el color guardado.

---

# `/dashboard/stats/wrapped` — Reading Wrapped

## Objetivo y diseño
Ofrece una narración visual anual a partir de datos propios, manteniendo el cálculo determinista y compartiendo la misma fuente de estadísticas.

## Flujo
1. Se autentica y carga libros.
2. Se determina año y objetivo anual.
3. `buildReadingStats(books, year, annualGoal)` genera el resumen.
4. `WrappedStory` muestra terminados, páginas, géneros y avance.

## Modelo y archivos
Usa el modelo de libro persistido y la salida de `lib/stats/buildReadingStats.js`; la UI está en `app/dashboard/stats/wrapped/page.js` y `components/stats/WrappedStory.js`.

## APIs/IA y ejemplo
No hay APIs externas ni IA.
```js
<WrappedStory stats={stats} year={year} />
```

## Casos y verificación
Año sin libros, libro sin fecha, objetivo ausente y navegación atrás. Verificar que los totales coinciden con `/dashboard/stats`.

## Relación con estadísticas
Wrapped no recalcula reglas distintas: recibe el mismo tipo de resumen producido por `buildReadingStats`. Así, “2 libros y 800 páginas” debe coincidir con Stats. `WrappedStory` transforma esos números en escenas; no modifica libros.

Ejemplo: `{ year: 2026, booksFinished: 2, pagesRead: 800, genres: [{name: "Fantasy", count: 2}] }` genera una historia anual aunque falten portadas. Probar año sin libros y confirmar que los ceros se presentan como estado válido, no como error.

---

# Proveedores de libros, búsqueda y portadas

## Objetivo y decisiones de diseño
La capa de proveedores normaliza fuentes heterogéneas y conserva una identidad común para UI, preview y deduplicación. Se priorizan portadas y se evita que una fuente caída invalide toda la búsqueda.

## Flujo paso a paso
1. `lib/books/search.js` consulta Hardcover, Google Books y Open Library según disponibilidad.
2. Normaliza título, autores, ISBN, páginas, rating, descripción y portada.
3. Agrupa ediciones y deduplica por ISBN/título/autor.
4. `bookMetadata.js` completa una ficha; `relatedBooks.js` busca autor y subjects.
5. Discovery usa `trending.js`, `newReleases.js`, `subjects.js` y `categories.js`.
6. `app/api/book-cover/route.js` sirve portadas mediante proxy HTTPS.

## Modelo de datos
El resultado canónico contiene `title`, `authors`, `isbn`, `cover`, `description`, `pageCount`, `rating`, `ratingsCount` y `source`; los campos pueden ser nulos. La identidad compartida usa ISBN y `isSameBook` como respaldo.

## APIs/seguridad
Las APIs externas son Google Books, Open Library, Hardcover y NYT según ruta. El proxy de portada mantiene allowlist de hosts Google Books, Open Library, NYT y Firebase Storage; no acepta URLs arbitrarias.

## Archivos
`lib/books/search.js`, `bookMetadata.js`, `relatedBooks.js`, `providers/googleBooks.js`, `openLibrary.js`, `hardcover.js`, `app/api/book-cover/route.js`, `lib/discovery/*`.

## IA
No hay IA en esta capa; BookBot la consume como fuente factual.

## Ejemplo real
```js
const results = await searchBooks(query)
const unique = results.filter((book, i, all) => all.findIndex(x => isSameBook(x, book)) === i)
```

## Casos límite y verificación
ISBN ausente, ediciones repetidas, portada http, rate limit, timeout y respuesta malformada. Probar allowlist con host permitido y rechazado; confirmar que la UI funciona con metadata parcial.

## Normalización reproducible
Un proveedor puede llamar al campo de páginas `pageCount`, `number_of_pages` o devolverlo ausente. Los adaptadores lo convierten al campo común antes de que `search.js` agrupe. La deduplicación intenta ISBN y luego una identidad aproximada de título/autor; por eso una edición sin ISBN no debe eliminar automáticamente otra con ISBN distinto sin aplicar `isSameBook`.

Ejemplo de salida canónica: `{ title: "Dune", authors: ["Frank Herbert"], isbn: "978...", pageCount: 412, coverUrl: "https...", source: "google" }`. Si solo existe título y autor, la UI sigue pudiendo abrir preview, pero debe tolerar `pageCount: 0` y portada vacía. Para el proxy, probar URL permitida, esquema no HTTPS y hostname parecido (por ejemplo, `evil-googlebooks.example`): solo el host exacto de la allowlist es válido.

---

# `/api/book-recommendations` — BookBot

## Objetivo y decisiones de diseño
La ruta convierte lenguaje natural en recomendaciones verificables. Gemini no inventa fichas: primero propone búsquedas y después elige exclusivamente candidatos devueltos por catálogos. El fallback determinista mantiene funcionalidad cuando falta la clave o falla el modelo.

## Flujo paso a paso
1. Verifica sesión y lee `listUserBooks`.
2. `buildTasteProfile` resume géneros, autores, ratings y estados; el historial conversacional aporta contexto.
3. Detecta intención (género, popularidad, límite de páginas, tono, sorpresa o búsqueda libre).
4. `planSearch` genera títulos/consultas; se consultan Google Books y Open Library.
5. Se normalizan, deduplican y filtran candidatos ya guardados.
6. `pickBooks` devuelve selección estructurada; se generan respuesta, `followUps` y tarjetas.
7. Ante error se usa ranking por reglas y se aplica igualmente el límite de páginas.

## Modelo de datos
Entrada JSON: mensaje e historial. Candidato: título, autor, ISBN, descripción, portada, páginas, rating y fuente. Salida: texto, recomendaciones, follow-ups y metadatos de búsqueda. El cliente nunca puede imponer un libro que no esté en candidatos.

## Archivos y APIs
`app/api/book-recommendations/route.js`, `lib/ai/bookbot.js`, `lib/ai/gemini.js`, `lib/recommendations/tasteProfile.js`, `lib/books/search.js`, proveedores Google/Open Library.

## IA
`gemini.js` llama `generateContent` con `GEMINI_API_KEY`, `GEMINI_MODEL` opcional y JSON estructurado. Debe tratarse como selector no confiable: validación, catálogo y filtro local son obligatorios.

## Ejemplo real
```js
const response = await fetch('/api/book-recommendations', {
  method: 'POST', headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({ message, history })
})
```

## Casos límite y verificación
Probar mensaje vacío, usuario sin libros, “fantasy books under 100 pages”, repetición del historial, Gemini caído, JSON inválido y catálogos vacíos. Verificar que ninguna recomendación duplica biblioteca, que `pages <= 100` se respeta y que las tarjetas enlazan a preview sin guardar.

## Contrato de entrada y salida
Una entrada mínima es `{ "message": "fantasy books under 100 pages", "history": [] }`. El detector extrae el límite `100`, construye consultas y filtra cada candidato con `pageCount <= 100`. La respuesta contiene texto para el chat, recomendaciones serializables y `followUps`; si el modelo devuelve JSON incompleto, la ruta descarta esa parte y conserva candidatos válidos o activa fallback.

## Decisiones para recrearlo
El orden es deliberado: buscar primero y pedir selección después evita presentar títulos alucinados. El historial sirve para evitar repeticiones, pero el filtro contra `listUserBooks` se ejecuta localmente y no se delega a Gemini. Probar límites expresados en inglés y español, biblioteca con el candidato ya guardado y respuesta 500 de Gemini.

---

# APIs de sesión

## Objetivo y diseño
Centralizan autenticación en cookies de servidor y dejan a las páginas una única lectura (`getCurrentUser`). Esto evita duplicar tokens o confiar en identidad enviada por el navegador.

## Flujo
1. Login recibe credenciales/token y valida con Firebase Admin.
2. Crea cookie de sesión y asegura perfil Firestore.
3. Cada request protegido ejecuta `getCurrentUser`.
4. Logout invalida/elimina cookie y termina acceso.

## Modelo de datos
Cookie firmada con expiración; perfil asociado a Firebase UID, email, username y `user_type`. Nunca se guardan libros en la cookie.

## Archivos y APIs
`app/api/session/login/route.js`, `logout/route.js`, `lib/firebase/session.js`, `lib/firebase/admin.js`.

## IA y ejemplo
No hay IA.
```js
const user = await getCurrentUser()
if (!user) redirect('/')
```

## Casos y verificación
Token inválido/expirado, cookie manipulada, logout repetido, sesión de otro usuario y concurrencia. Verificar flags seguros, respuestas de error no verbosas y autorización server-side.

## Secuencia y errores
Login debe validar antes de escribir la cookie y asociar el perfil al UID emitido por Firebase. Logout debe ser idempotente: eliminar una cookie ya ausente sigue siendo éxito. Las lecturas protegidas no deben confiar en `userId` del body; `getCurrentUser` es la fuente de identidad.

Entrada/salida conceptual: credencial válida → `{ uid, sessionCookie }` en servidor y respuesta sin token sensible; credencial inválida → error controlado. Probar expiración, replay de cookie y acceso concurrente desde dos cuentas.

---

# APIs de Spotify y foco de lectura

## Objetivo y decisiones de diseño
Spotify es opcional: el modo lectura funciona sin conexión y solo añade reproducción/playlist cuando OAuth terminó correctamente.

## Flujo paso a paso
1. `/api/spotify/connect` crea estado firmado y redirige a Spotify.
2. `/callback` valida estado, intercambia código y guarda autorización.
3. `/playlist` autentica usuario y crea playlist de lectura usando `lib/spotify-api.js`.
4. `/dashboard/read` consulta conexión; `FocusMode` usa `toSpotifyEmbedUrl` para reproducir.

## Modelo de datos
Estado OAuth y tokens pertenecen al usuario; una playlist contiene nombre y tracks derivados de libros/sesión. Los tokens no se exponen a componentes públicos.

## Archivos y APIs
`app/api/spotify/connect/route.js`, `callback/route.js`, `playlist/route.js`, `lib/spotify.js`, `lib/spotify-api.js`, `components/read/FocusMode.js`.

## IA y ejemplo
No hay IA.
```js
const response = await fetch('/api/spotify/playlist', {
  method: 'POST', body: JSON.stringify({ bookId })
})
```

## Casos y verificación
Usuario sin conexión, state alterado, callback sin code, token revocado, playlist duplicada y track no encontrado. Probar OAuth completo y modo lectura offline; confirmar que la sesión de Firebase sigue siendo requisito.

## Estado OAuth y recreación
El parámetro `state` enlaza inicio y callback y evita aceptar un código iniciado por otra sesión. El callback debe rechazar estado ausente o distinto antes del intercambio. La playlist recibe referencias de libros, busca tracks mediante el cliente Spotify y tolera tracks sin coincidencia en vez de abortar toda la playlist.

Ejemplo: una cuenta sin autorización produce 401/redirect al conectar; una cuenta autorizada puede recibir `{ playlistId, url }`. Verificar que tokens permanecen en servidor, que un callback repetido no expone credenciales y que FocusMode sigue permitiendo leer sin Spotify.
