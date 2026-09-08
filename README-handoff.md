## Plan retrabajado (contra el estado real del repo, sesión Claude)

Esto reescribe la secuencia de 13 pasos de arriba a la luz de lo que ya está construido
en este repo. No cambia el diseño ni la paleta — solo el orden, qué falta, qué ya existe,
y una decisión que hay que tomar antes de escribir la primera línea.

### ⚠️ Decisión bloqueante: ¿quién es "primary action"?

Esta tabla dice **Lima = progress, primary action, un highlight por pantalla** e
**Índigo = headings, data, chrome, primary surfaces**. Pero lo que ya implementamos esta
sesión (botones, `StatusPill` activo, barras de progreso, badges) usa **Índigo sólido** como
color de relleno de acción, y Lima casi no se usa todavía (solo como acento del shelf
Trending y el punto de la fecha "Target"). Son roles invertidos respecto a esta spec.

Antes del Paso 1 hay que confirmar uno de los dos:
- **(a)** Recolorear lo ya hecho: botones/pills/barras pasan de Índigo sólido a Lima sólido,
  Índigo queda para texto/headers/superficies de fondo (como dice esta tabla).
- **(b)** Mantener lo ya hecho (Índigo = acción) y tratar esta tabla como desactualizada en
  ese único punto.

Todo lo demás del plan es compatible con cualquiera de las dos — pero hay que elegir antes,
porque si no cada paso nuevo va a contradecir al anterior.

### Paso por paso

**Paso 1 — Tokens y tipografía.** Válido tal cual, con dos aclaraciones: hoy no existe
ningún custom property de color en `globals.css` (todo es hex arbitrario de Tailwind
inline por componente), así que este paso *crea* los tokens, no los "reemplaza" — la
migración real de cada componente a esos tokens pasa en los pasos 2, 3, 6, 8, 9 y 10 a
medida que se tocan. Tipografía: hoy la app usa Geist Sans/Geist Mono vía `next/font` en
`app/layout.js` — hay que reemplazar esas dos fuentes por las tres nuevas.

**Paso 2 — Bottom nav.** `components/nav/BottomNav.js` existe pero quedó afuera de la
migración de color de esta sesión: sigue en paleta ámbar vieja (`#20180f`, `#a89a7f`, fondo
`#fffdf9`, borde `#eee3ce`) y solo tiene 3 tabs (Home/Stats/Profile), no 4. El paso tal como
está escrito lo cubre bien — no hace falta ajustar nada, solo saber que arranca más atrás de
lo que el plan asume.

**Paso 3 — Library.** Ya existen `HomeSearchBar`, `CurrentReadingCard`, `ReadingGoalCard`,
`MotivationCard`, `BookShelfRow` (carrusel "Currently reading") y `DiscoveryShelfRow`
(Trending/New releases/6 géneros) — este paso los reordena y reestiliza, no los crea de
cero. Dos puntos a tener en cuenta:
- El contador mono y la barra Lima de "Pick up where you left off" y el botón "Start a
  session" dependen de que exista `/dashboard/read` (Paso 2 ya lo crea vacío) — no
  requiere que el Paso 4/5 estén terminados, el botón puede apuntar ahí desde ya.
- "Discovery shelf más pequeño y apagado": la sesión pasada hicimos los shelves **más
  vibrantes** a pedido explícito (colores sólidos con alpha 0.8, no pasteles). Leo esto
  como "bajarle prioridad de layout" (más chico, al final, tapas más chicas), no como
  "sacarle color" — si la idea era literalmente apagar el color, avisen antes de tocarlo.

**Paso 4 — Sesiones de lectura.** Sin conflictos. `lib/books/notes.js` ya tiene el patrón
exacto que pide este paso (subcolección dentro de `books/{id}`) — `sessions.js` lo puede
calcar 1 a 1. Un punto que el plan no resuelve: ¿`endSession` también actualiza
`book.currentPage` (vía `updateUserBookProgress`, que ya existe), o el progreso del libro y
las sesiones quedan como dos fuentes de verdad separadas? Si no se sincronizan, el Paso 6
("At your pace, terminarás around X") va a tener que elegir de cuál de las dos leer.

**Paso 5 — Modo enfoque.** Sin conflictos. El plan no dice cómo `/dashboard/read` sabe qué
libro estás leyendo — falta decidir: ¿query param (`?book=id`), el primer libro con
`status=reading`, o una pantalla previa para elegir si hay más de uno "currently reading"?

**Paso 6 — Detalle de libro.** Gran parte de la interacción ya existe y encaja bastante
bien con la spec: `StatusPill` ya es un pill Índigo, `CurrentPageEditor` ya es el stepper,
`PersonalRatingStars` ya existe, y `BookDatesEditor` ya es una hoja que sube desde abajo en
mobile (`items-end` + esquinas redondeadas arriba) — muy cerca del patrón "hoja inferior"
que pide el resto del plan. Lo nuevo: header a Lavanda exacto (hoy es un gradiente violeta
parecido pero no ese hex), portada a 132×198 (hoy es ~160px de ancho), la columna "Sessions"
en las stats de 3 columnas (depende del Paso 4), y el borde izquierdo lima de 3px en notas.

**Paso 7 — Agregación de stats.** Ya existe la mitad de esta lógica, pero *inline* dentro
de `app/dashboard/stats/page.js` (libros terminados por año, páginas totales, stats
mensuales, calendario de racha) en vez de en `lib/books/stats.js`. Este paso es más
"extraer y extender" que "crear de cero": lo que falta agregar de verdad es distribución
por género, distribución de ratings, libro más largo/más corto, comparación año contra año,
y color dominante de portada por libro (necesario para el Paso 8 — hoy no se extrae ni se
guarda en ningún lado; hay que decidir si se calcula al vuelo con canvas en el cliente o se
precalcula al agregar el libro).

**Paso 8 — Muro de lomos.** Sin conflictos, pero depende de resolver el color dominante del
Paso 7 antes de poder pintar el muro con datos reales.

**Paso 9 — Stats, el resto.** Sin conflictos, se apoya en los Pasos 7-8.

**Paso 10 — Perfil público.** El más grande de los nuevos. Hoy `lib/users/users.js` no
tiene `pinnedQuote`, `hiddenStats`, ni ningún campo de favoritos — hay que sumarlos. El plan
no especifica el nombre/forma del campo de "My top four" (¿`favoriteBookIds: string[]` en
el doc de usuario, ordenado? ¿una subcolección?) — conviene decidirlo antes de escribir la
server action. `/dashboard/settings` no existe: este paso implica partir el actual
`app/dashboard/profile/page.js` (303 líneas, hoy mezcla identidad + link de admin + ajustes)
en dos: la nueva vidriera pública editable, y `/dashboard/settings` con lo que hoy ya hay ahí.

**Paso 11 — Onboarding.** `LoginForm.js` ya existe, como dice el plan. La meta anual que
este paso pide guardar **hoy no se persiste en ningún lado** — `ReadingGoalCard` recibe
`goal={20}` hardcodeado en `app/dashboard/page.js`. Este paso tiene que sumar el campo real
(`yearlyGoal` en el user, o donde se decida) y una función para actualizarlo, y el Paso 3
va a tener que leer ese valor real en vez del 20 fijo cuando este paso esté listo.

**Paso 12 — Wrapped.** Sin conflictos, depende de que los Pasos 7 y 8 estén terminados
(usa `getYearStats` y una versión chica del muro de lomos).

**Paso 13 — Pulido.** Sin cambios, queda igual al final.

### Nota aparte: el nombre

El logo que armamos en el Bookly Mark Studio (artifact de esta sesión) todavía dice
"Bookly" como texto de prueba — si "Quire" ya es definitivo, ese wordmark hay que
actualizarlo ahí antes de sacar el mark final.

---

| File | Screen |
| --- | --- |
| 01-onboarding.png | Onboarding, step 1 (Google auth) |
| 02-library.png | Library / home |
| 03-book-detail.png | Book detail |
| 04-focus-mode.png | Focus mode (reading session) |
| 05-stats-wall.png | Stats — Wall layout (spine wall hero) |
| 06-stats-cards.png | Stats — Cards layout |
| 07-profile-shelf.png | Profile — public shelf |
| 08-profile-card.png | Profile — reader card |
| 09-wrapped.png | Wrapped, beat 1 of 5 |

## Color styles
| Style name | Hex | Role |
| --- | --- | --- |
| Índigo | #322F7A | headings, data, chrome, primary surfaces |
| Lima | #C9E265 | progress, primary action, one highlight per screen |
| Lavanda | #EDEBF7 | tracks, empty slots, quote card |
| Carbón | #1C1B1F | body text, focus mode background |
| Fondo | #FAFBF5 | app background |
| Divisor | #E6E2DC | borders, hairlines |
| Índigo 60 | #5A56A8 | borders on indigo surfaces |
| Índigo 40 | #9D99C6 | secondary text on indigo |
| Texto 70 | #5D5A55 | secondary text on light |
| Texto 50 | #8B877E | meta text, mono labels |

## Text styles
| Style | Font | Size / line height | Tracking |
| --- | --- | --- | --- |
| Display XL | Bricolage Grotesque SemiBold | 64 / 61 | −4.5% |
| Display L | Bricolage Grotesque SemiBold | 44 / 44 | −4% |
| Display M | Bricolage Grotesque SemiBold | 34 / 36 | −3% |
| Title | Bricolage Grotesque SemiBold | 21 / 24 | −2.5% |
| Card title | Bricolage Grotesque SemiBold | 17 / 20 | −2% |
| Body | Instrument Sans Regular | 14.5 / 22 | 0 |
| Body strong | Instrument Sans SemiBold | 13.5 / 18 | 0 |
| Caption | Instrument Sans Regular | 12.5 / 17 | 0 |
| Label mono | JetBrains Mono Medium | 10.5 / 12, uppercase | +14% |
| Data mono | JetBrains Mono Medium | 56 / 56, tabular | −2% |

## Geometry
- Card radius 22, sheet radius 28 (top corners only), pill radius 999, cover radius 6, phone radius 46.
- Screen padding 20. Card padding 18. Gap between cards 12.
- Card fill Fondo/white on Divisor 1px border; shadow 0 2 10 rgba(28,27,31,.04).
- Tab bar 96 tall, 1px Divisor top border, center Read button 54×54 raised −16.
- Book covers 0.66 aspect. Spine width 22 on the wall, 11 small, 9 mini.

## Notes on the spine wall
Spine height = (pages ÷ 656) × 200 + 8, clamped to the tallest book in the year.
Fill is the book's dominant cover color. Build it as an auto-layout row, bottom-aligned,
gap 5, and use a component with a height variable per instance.
