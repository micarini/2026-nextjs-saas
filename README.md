# Next.js SaaS Starter with Firebase

Starter profesional para construir aplicaciones SaaS con Next.js, Firebase Authentication, Firebase Admin SDK, Cloud Firestore y Tailwind CSS.

La base prioriza renderizado server-side, rutas protegidas, sesion HTTP-only, aislamiento de datos por usuario y una estructura extensible para adaptar la entidad principal a cada producto. En este proyecto la entidad principal es `books`, un seguimiento de lectura personal con perfiles publicos.

## SaaS

Una SaaS, o Software as a Service, es una aplicacion accesible desde internet en la que los usuarios utilizan funcionalidades sin instalar software localmente. La aplicacion se ejecuta en infraestructura remota y entrega su interfaz mediante el navegador.

En terminos funcionales, una SaaS suele incluir:

- Registro e inicio de sesion.
- Gestion de informacion propia por usuario.
- Panel privado o dashboard.
- Persistencia de datos.
- Rutas publicas y rutas protegidas.
- Roles y permisos.
- Funcionalidades especificas asociadas a un dominio.

Casos posibles:

- Gestor de proyectos.
- Administrador de gastos.
- Seguimiento de habitos.
- Catalogo de productos.
- Organizador de contenido.
- Registro de suscripciones.
- Administrador de clientes.
- Plataforma de publicaciones.
- Seguimiento de postulaciones.
- Panel de recursos educativos.

## Caracteristicas

- Next.js con App Router.
- JavaScript.
- Tailwind CSS.
- Dark mode.
- Tipografia Geist mediante `next/font`.
- Firebase Authentication.
- Inicio de sesion con email y contrasena.
- Inicio de sesion con Google.
- Sesion server-side mediante cookie HTTP-only.
- Firebase Admin SDK para validacion segura desde servidor.
- Cloud Firestore como base de datos.
- Rutas protegidas mediante middleware.
- Dashboard privado en `/dashboard`.
- Perfiles de usuario en la coleccion `users`.
- Roles simples mediante `user_type`.
- ABM de libros en `/dashboard/books`.
- Notas de lectura por libro, en subcoleccion `notes`.
- Busqueda de libros por titulo/autor via Google Books y Open Library.
- Ruta publica por libro en `/books/[id]`.
- Perfil publico por usuario en `/u/[username]`, con estanterias agrupadas por genero.
- Portada de libro opcional mediante URL externa (sin upload de archivos).

## Arquitectura

El proyecto utiliza App Router y separa responsabilidades entre servidor y cliente.

- Las paginas son Server Components por defecto.
- Las operaciones de escritura utilizan Server Actions.
- La sesion se valida en servidor con Firebase Admin SDK.
- Los datos privados se filtran por `userId`.
- Los Client Components se utilizan para interactividad de UI, autenticacion client-side y formularios con estado local.

Estructura principal:

```txt
app/
  api/
    session/
      login/
      logout/
  dashboard/
    books/
      [id]/
      new/
    profile/
    more/
    users/
      [uid]/
  books/
    [id]/
  u/
    [username]/
  login/

components/
  books/
  nav/
  users/

lib/
  books/
    providers/
  firebase/
  users/
```

## Requisitos

- Node.js compatible con Next.js 16.
- Proyecto Firebase.
- Authentication habilitado.
- Cloud Firestore habilitado.
- Cuenta de servicio de Firebase Admin SDK.

Cloud Storage for Firebase es opcional. El modo predeterminado utiliza imagenes locales dentro de `public`.

## Configuracion

1. Instalar dependencias:

```bash
npm install
```

2. Copiar las variables de entorno:

```bash
cp .env.example .env
```

3. Completar `.env` con los datos de Firebase Web App y Firebase Admin SDK.

4. En Firebase Console habilitar Authentication con:

- Email/Password.
- Google.

5. Habilitar Cloud Firestore.

6. Mantener `FIREBASE_STORAGE=false` para utilizar imagenes locales.

7. Ejecutar el servidor de desarrollo:

```bash
npm run dev
```

8. Abrir la aplicacion:

```txt
http://localhost:3000
```

## Variables De Entorno

Ejemplo completo:

```bash
# Firebase Web App
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Storage
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
FIREBASE_STORAGE=false

# Firebase Admin SDK
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Las variables con prefijo `NEXT_PUBLIC_` son visibles desde el cliente. Las variables `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY` son privadas y se utilizan desde Firebase Admin SDK en el servidor.

La clave privada debe conservar los saltos de linea escapados mediante `\n`.

El archivo `.env` no debe subirse al repositorio.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Autenticacion

El proyecto incluye autenticacion con Firebase Authentication.

Metodos incluidos:

- Email y contrasena.
- Google.

Al iniciar sesion, el cliente obtiene el ID token de Firebase y lo envia a `/api/session/login`. El servidor crea una session cookie HTTP-only que luego se valida desde Server Components, Server Actions y middleware.

Las rutas privadas redirigen a `/login` si no existe una sesion valida.

## Usuarios Y Roles

Cada usuario autenticado tiene un documento asociado en la coleccion `users`.

Ejemplo:

```js
{
  email: "usuario@example.com",
  displayName: "Usuario",
  provider: "google.com",
  user_type: "user",
  createdAt: "...",
  updatedAt: "...",
  lastLoginAt: "..."
}
```

Los usuarios creados desde la web se registran con `user_type: "user"`.

Si un usuario tiene `user_type: "admin"`, puede acceder al panel de administracion de usuarios desde `/dashboard/users`.

Para crear el primer administrador, modificar manualmente en Firestore el documento correspondiente dentro de `users` y cambiar `user_type` a `"admin"`.

## Firestore

El ABM principal utiliza la coleccion `books`.

Cada documento guarda la relacion con el usuario autenticado mediante `userId`.

Ejemplo:

```js
{
  userId: "uid-del-usuario",
  title: "El nombre del viento",
  author: "Patrick Rothfuss",
  genre: "fantasy",
  status: "reading",
  rating: null,
  coverUrl: "https://...",
  isbn: "9788401352836",
  totalPages: 620,
  currentPage: 180,
  startDate: Timestamp,
  finishDate: null,
  targetDate: null,
  published: true,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

Cada libro tiene ademas una subcoleccion `notes` con las anotaciones de lectura:

```js
{
  text: "Buen ritmo en el segundo acto.",
  page: 210,
  createdAt: serverTimestamp()
}
```

El acceso a datos privados debe conservar siempre la validacion de propiedad:

- Un usuario solo lista sus propios libros.
- Un usuario solo edita sus propios libros.
- Un usuario solo elimina sus propios libros (y sus notas asociadas).
- Los libros publicados (`published: true`) pueden consultarse desde rutas publicas, tanto en `/books/[id]` como en el perfil publico `/u/[username]`.

## Adaptacion De La Entidad Principal

El starter parte originalmente de una entidad generica `items` como referencia inicial. En este proyecto ya fue reemplazada por `books`. Para construir otro producto a partir de este mismo starter, la entidad principal puede reemplazarse nuevamente por una entidad propia del dominio.

Ejemplos:

- `projects`
- `products`
- `expenses`
- `clients`
- `posts`
- `courses`

Al adaptar la entidad, revisar:

- Nombre de la coleccion en Firestore.
- Rutas dentro de `/dashboard`.
- Server Actions de creacion, edicion y eliminacion.
- Campos del formulario.
- Validaciones.
- Listados privados.
- Vistas publicas, si corresponde.
- Carpeta de imagenes locales.
- Reglas de Storage, si se usa Firebase Storage.

## Imagenes (Boilerplate Heredado, No Usado Por `books`)

> Esta seccion documenta capacidades heredadas del starter original (imagen local y upload a Cloud Storage). La entidad `books` de este proyecto **no las usa**: la portada de un libro (`coverUrl`) se ingresa siempre como una URL externa en el formulario, sin subir archivos. Se conserva la documentacion como referencia para quien adapte el starter a otra entidad que si necesite upload de imagenes.

El starter soporta dos estrategias para imagenes:

- Imagen local en `public`, activa por defecto.
- Cloud Storage for Firebase, opcional mediante `FIREBASE_STORAGE=true`.

### Imagen Local

Esta es la opcion predeterminada.

Las imagenes deben ubicarse dentro de la carpeta `public`. Por ejemplo:

```txt
public/
  items/
    ejemplo.jpg
```

En el formulario debe ingresarse solamente el nombre del archivo:

```txt
ejemplo.jpg
```

La aplicacion transforma ese valor en la ruta publica:

```txt
/items/ejemplo.jpg
```

Documento resultante:

```js
{
  imageUrl: "/items/ejemplo.jpg",
  imagePath: ""
}
```

Para otra entidad, usar una carpeta equivalente. Por ejemplo:

```txt
public/
  products/
    producto.jpg
```

## Firebase Storage Opcional (Boilerplate Heredado, No Usado Por `books`)

> Igual que la seccion anterior, esto es boilerplate heredado del starter. `books` no sube archivos a Storage.

Cloud Storage for Firebase puede activarse para permitir upload de archivos desde el formulario, en una entidad que lo requiera.

Configuracion requerida:

1. Habilitar Cloud Storage for Firebase en Firebase Console.
2. Verificar que el proyecto este en plan Blaze si Firebase lo requiere.
3. Completar `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`.
4. Configurar `FIREBASE_STORAGE=true`.
5. Reiniciar el servidor de desarrollo.

Reglas sugeridas para Storage, usando `items` como nombre de entidad de ejemplo (no una coleccion presente en este proyecto):

```js
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /items/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

En modo Storage, las imagenes se guardan con este formato:

```txt
items/{uid-del-usuario}/{id-del-item-o-uploads}/{timestamp}.jpg
```

Documento resultante:

```js
{
  imageUrl: "https://firebasestorage.googleapis.com/...",
  imagePath: "items/uid/itemId/archivo.jpg"
}
```

Para otra entidad, actualizar la ruta y las reglas. Por ejemplo, con `products`:

- Carpeta local: `public/products`.
- Ruta local guardada: `/products/imagen.jpg`.
- Ruta en Storage: `products/{uid}/{id}/{archivo}`.
- Regla de Storage: `match /products/{userId}/{allPaths=**}`.

## Pricing De Firebase

Valores consultados en la pagina oficial de Firebase Pricing el 27 de agosto de 2026.

Fuente: https://firebase.google.com/pricing

### Plan Spark

Spark es el plan sin costo inicial y no requiere metodo de pago.

Limites relevantes:

- Authentication: email/password y proveedores sociales incluidos.
- Authentication con Identity Platform: hasta 50.000 usuarios activos mensuales.
- Cloud Firestore Standard: 1 GiB de datos almacenados.
- Cloud Firestore Standard: 50.000 lecturas de documentos por dia.
- Cloud Firestore Standard: 20.000 escrituras de documentos por dia.
- Cloud Firestore Standard: 20.000 eliminaciones de documentos por dia.
- Cloud Firestore Standard: 10 GiB de egreso de red por mes.
- Firebase Hosting: 10 GB de almacenamiento.
- Firebase Hosting: 360 MB por dia de transferencia.

Consideracion sobre Storage:

- En proyectos nuevos, Firebase puede requerir actualizar a Blaze para utilizar Cloud Storage for Firebase.
- Por ese motivo, este starter usa imagenes locales por defecto y deja Storage como opcion configurable.

### Plan Blaze

Blaze es el plan de pago por uso. Requiere vincular una cuenta de facturacion, incluye cuotas sin costo y cobra el uso excedente segun el producto.

Cuotas sin costo relevantes en Blaze:

- Authentication con Identity Platform: hasta 50.000 usuarios activos mensuales; luego aplica pricing de Google Cloud.
- Cloud Firestore Standard: hasta 1 GiB de datos almacenados; luego aplica pricing de Google Cloud.
- Cloud Firestore Standard: hasta 50.000 lecturas por dia; luego aplica pricing de Google Cloud.
- Cloud Firestore Standard: hasta 20.000 escrituras por dia; luego aplica pricing de Google Cloud.
- Cloud Firestore Standard: hasta 20.000 eliminaciones por dia; luego aplica pricing de Google Cloud.
- Cloud Firestore Standard: hasta 10 GiB de egreso por mes; luego aplica pricing de Google Cloud.

Cloud Storage en Blaze para buckets `*.firebasestorage.app` y buckets adicionales:

- Hasta 5 GB-mes almacenados sin costo; luego aplica pricing de Google Cloud Storage.
- Hasta 100 GB descargados por mes sin costo; luego aplica pricing de Google Cloud Storage.
- Hasta 5.000 operaciones de upload por mes sin costo; luego aplica pricing de Google Cloud Storage.
- Hasta 50.000 operaciones de download por mes sin costo; luego aplica pricing de Google Cloud Storage.

Cloud Storage en Blaze para buckets legacy `*.appspot.com`:

- Hasta 5 GB almacenados sin costo; luego USD 0,026 por GB.
- Hasta 1 GB descargado por dia sin costo; luego USD 0,12 por GB.
- Hasta 20.000 operaciones de upload por dia sin costo; luego USD 0,05 cada 10.000 operaciones.
- Hasta 50.000 operaciones de download por dia sin costo; luego USD 0,004 cada 10.000 operaciones.

Los importes pueden variar por region, producto y cambios de pricing. Para estimaciones productivas debe utilizarse la calculadora oficial de Firebase.

## Desarrollo

Comandos habituales:

```bash
npm run dev
npm run lint
npm run build
```

En desarrollo, Next.js compila rutas bajo demanda. La navegacion puede sentirse mas lenta que en una build productiva ejecutada con:

```bash
npm run build
npm run start
```
