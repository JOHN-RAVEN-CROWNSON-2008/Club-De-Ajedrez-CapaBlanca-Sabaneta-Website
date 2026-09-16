# Guía de conexión a Supabase — Club de Ajedrez Capablanca Sabaneta

Esta guía deja la base de datos y el almacenamiento de archivos completamente
funcionales en Supabase y conectados a las tres aplicaciones del repositorio
(Web Pública, Panel de Administración y Portal de Afiliados), con datos reales
—nada de `localStorage` ni información quemada— para los flujos que pediste:

- **Administrador:** crear eventos/torneos, publicar archivos, guías,
  resoluciones y actas, administrar el calendario de clases, subir fotos a la
  galería y redactar blogs.
- **Afiliado:** modificar su información personal, adjuntar soportes de pago
  y confirmar inscripción a torneos.

## 0. Qué se tocó en el código para que esto sea real (léelo antes de empezar)

El esquema SQL (`supabase_schema.sql`) ya traía prácticamente todas las tablas
necesarias y el panel de administración y el portal de afiliados **ya leían y
escribían contra Supabase real** (no eran un prototipo con datos mock). Al
auditar el flujo completo para esta guía aparecieron 4 problemas que se
corrigieron directamente en el código, porque de lo contrario la conexión a
Supabase real se habría sentido "rota" aunque siguieras esta guía al pie de la
letra:

1. **IDs inválidos al crear registros.** Los formularios de crear evento,
   documento, foto de galería, entrada de blog, trofeo, horario, anuncio y
   pago generaban IDs de cliente como `'doc-' + Date.now()` (ej.
   `doc-1737000000000`). Las columnas `id` de esas tablas son `UUID`, así que
   Postgres rechaza esos valores con `invalid input syntax for type uuid`.
   Con Supabase desconectado el error no se notaba (todo vivía en el estado
   local de React); con Supabase real, **crear cualquier registro habría
   fallado silenciosamente**. Se reemplazaron todos esos IDs por
   `crypto.randomUUID()`.
2. **"Aprobar solicitud de afiliación" mentía.** El botón intentaba crear una
   fila en `profiles` directamente, pero `profiles.id` es una llave foránea
   hacia `auth.users(id)` — no puede existir un perfil sin una cuenta de
   autenticación real detrás. El insert fallaba dentro de un `try/catch` que
   tragaba el error y el panel igual mostraba "¡Afiliación aprobada!". Ahora
   "Aprobar" solo cambia el estado de la solicitud (eso sí es real) y le dice
   al administrador que debe pedirle al aspirante que se registre en el
   Portal de Afiliados con el mismo correo; el trigger `handle_new_user` crea
   el perfil automáticamente en ese momento.
3. **No existía forma real de subir archivos**, solo campos de texto para
   pegar una URL. Se añadió `src/lib/storage.ts` y el componente
   `src/components/common/FileUploadField.tsx`, y se conectaron a:
   - Galería (admin) → bucket `gallery`.
   - Documentos / guías / resoluciones / actas (admin) → bucket `documents`.
   - Soportes de pago (afiliado) → bucket privado `payment-receipts`, con
     botón "Ver comprobante" en el panel de administración que genera un
     enlace firmado temporal (el bucket no es público).
4. **Los botones "Entrar como Demo"** en los formularios de login de admin y
   de afiliados creaban una sesión falsa en `localStorage` sin pasar por
   Supabase, sin importar si ya habías configurado credenciales reales. Ahora
   solo aparecen cuando `.env` **no** tiene credenciales reales, para que no
   generen una falsa sensación de sesión activa una vez conectada la base de
   datos real.

Con eso resuelto, seguir los pasos de abajo deja el sistema funcionando de
verdad, de punta a punta.

---

## 1. Prerrequisitos

- Cuenta gratuita en [supabase.com](https://supabase.com).
- Node.js 18 o superior instalado.
- Este repositorio clonado en tu máquina.

---

## 2. Crear el proyecto en Supabase

1. Entra a [supabase.com/dashboard](https://supabase.com/dashboard) → **New
   project**.
2. Organización: la tuya (o crea una nueva, ej. "Club Capablanca").
3. Nombre del proyecto: `capablanca-sabaneta` (o el que prefieras).
4. Contraseña de la base de datos: genera una segura y guárdala aparte — la
   necesitarás si alguna vez te conectas por `psql`, no para el `.env` del
   frontend.
5. Región: la más cercana a Colombia (`South America (São Paulo)` si está
   disponible; si no, `US East` es la siguiente mejor opción por latencia).
6. Plan: **Free** es suficiente para arrancar.
7. Espera 1-2 minutos a que Supabase aprovisione el proyecto.

---

## 3. Ejecutar el esquema completo (`supabase_schema.sql`)

1. En el panel de Supabase, ve a **SQL Editor** → **New query**.
2. Abre el archivo [`supabase_schema.sql`](./supabase_schema.sql) de este
   repositorio, cópialo **completo** y pégalo en el editor.
3. Pulsa **Run**. El script es idempotente (usa `IF NOT EXISTS`,
   `ON CONFLICT DO NOTHING/UPDATE` y `DROP POLICY IF EXISTS`), así que puedes
   volver a ejecutarlo sin miedo si alguna vez necesitas reaplicarlo.
4. Deberías ver `Success. No rows returned` (o similar). Si ves un error,
   revisa que copiaste el archivo completo — el script crea tablas, funciones,
   triggers, políticas RLS, **buckets de Storage** y datos semilla en ese
   orden, y algunas sentencias dependen de las anteriores.

Lo que este script deja creado:

| Categoría | Contenido |
|---|---|
| Tablas | `profiles`, `site_settings`, `posts` (blog), `events` (torneos/calendario), `documents` (archivos/guías/resoluciones/actas), `tournament_registrations`, `contact_messages`, `gallery`, `membership_payments`, `class_schedules`, `club_announcements`, `tournament_matches`, `class_attendance`, `club_trophies`, `membership_applications` |
| Seguridad | RLS activado en las 15 tablas, función `is_admin()`, políticas específicas por tabla y por rol |
| Automatización | Trigger `on_auth_user_created` → crea el perfil automáticamente cuando alguien se registra |
| Storage | Buckets `gallery` (público), `documents` (público) y `payment-receipts` (privado), con políticas de lectura/escritura por rol |
| Datos iniciales | Configuración general del sitio, horarios de clase, un anuncio, 2 torneos de ejemplo con partidas, palmarés histórico y 3 solicitudes de afiliación de ejemplo |

### 3.1 Verificar el Storage

Ve a **Storage** en el panel de Supabase y confirma que aparecen tres buckets:
`gallery`, `documents` (ambos con el ícono de "público") y
`payment-receipts` (privado). Si no aparecen, vuelve a correr solo la sección
**20. ALMACENAMIENTO** del script.

---

## 4. Configurar Authentication

1. Ve a **Authentication → URL Configuration**.
2. **Site URL:** `http://localhost:5180` durante desarrollo (el puerto de la
   web pública). Cuando despliegues a producción, cámbialo por tu dominio
   real.
3. **Redirect URLs:** añade una fila por cada puerto que uses en local, y
   luego los dominios reales de producción:
   ```
   http://localhost:5180/**
   http://localhost:5181/**
   http://localhost:5182/**
   ```
4. Ve a **Authentication → Providers → Email** y confirma que **Email** está
   habilitado.
5. **Confirmación de correo:** por defecto Supabase exige que el usuario
   confirme su correo antes de poder iniciar sesión. Para pruebas locales
   rápidas puedes desactivar temporalmente "Confirm email" en
   **Authentication → Providers → Email → Confirm email**. Para producción,
   déjalo activado y configura un proveedor SMTP propio en
   **Authentication → Settings → SMTP** (el correo por defecto de Supabase
   tiene límites muy bajos de envío, no sirve para producción real).

---

## 5. Obtener credenciales y completar `.env`

1. Ve a **Project Settings → API**.
2. Copia **Project URL** y la clave **anon / public** (¡nunca copies la
   `service_role`, esa no va en el frontend!).
3. En la raíz del repositorio, crea `.env` a partir de `.env.example` (si aún
   no existe) y complétalo:

```env
VITE_SUPABASE_URL=https://tu-proyecto-real.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-real

# Opcionales — ver sección 9 "Servicios opcionales"
VITE_RESEND_API_KEY=
VITE_RESEND_FROM_EMAIL=notificaciones@ajedrezcapablanca.com
VITE_WHATSAPP_PHONE=573002545835
VITE_WHATSAPP_API_TOKEN=
VITE_WHATSAPP_PHONE_NUMBER_ID=

VITE_APP_NAME="Club Deportivo de Ajedrez Capablanca Sabaneta"
VITE_PUBLIC_PORT=5180
VITE_ADMIN_PORT=5181
VITE_MEMBERS_PORT=5182
```

El archivo `.env` ya está en `.gitignore`, así que no se sube al repositorio.

`src/lib/supabase.ts` detecta automáticamente si las credenciales son reales
(`isSupabaseConfigured()`); mientras el `.env` tenga los valores de ejemplo,
la app sigue funcionando en modo demo con datos locales, sin tocar Supabase.

---

## 6. Instalar dependencias y levantar las tres apps

```bash
npm install
```

Cada app corre en su propio puerto fijo (así lo exige el diseño del proyecto,
ver `.env.example`):

```bash
npm run dev:public   # http://localhost:5180 → sitio público
npm run dev:admin    # http://localhost:5181 → panel de administración
npm run dev:members  # http://localhost:5182 → portal de afiliados
```

Puedes abrir los tres a la vez en tres terminales distintas.

---

## 7. Crear el primer administrador real

No existe (ni debe existir) un formulario público para autorregistrarse como
administrador. El camino correcto:

1. Abre `http://localhost:5182/registro-afiliado` (o `/afiliados` en el
   puerto 5182) y regístrate con tu correo real, como si fueras un afiliado
   cualquiera. Esto crea tu usuario en `auth.users` y, por el trigger
   `handle_new_user`, tu fila en `profiles` con `role = 'student'`.
2. En el **SQL Editor** de Supabase, promuévete a administrador:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE correo = 'tu-correo-real@ejemplo.com';
   ```
3. Cierra sesión y entra en `http://localhost:5181/admin/login` (o
   `/admin/login` del puerto 5181) con ese mismo correo y contraseña. Ya
   deberías ver el panel con tu rol de administrador.

Repite el paso 2 para cualquier otro correo que deba tener acceso
administrativo (entrenadores, junta directiva, etc.).

---

## 8. Probar los flujos reales, por rol

Con las tres apps corriendo y sesión de administrador activa, verifica cada
funcionalidad pedida contra la base de datos real (revisa en el **Table
Editor** de Supabase que la fila realmente aparezca después de cada acción):

### Como administrador (`/admin`)

- [ ] **Eventos/Torneos:** sección *Torneos* → "Nuevo Torneo". Verifica la
      fila nueva en `public.events`.
- [ ] **Calendario de clases:** sección *Horarios* → añade un horario.
      Verifica `public.class_schedules`.
- [ ] **Archivos, guías, resoluciones y actas:** sección *Repositorio* →
      "Añadir Documento" → sube un PDF real desde tu equipo (no pegues una
      URL) y elige la categoría **Resolución** o **Acta**. Verifica que el
      archivo aparece en **Storage → documents** y la fila en
      `public.documents`.
- [ ] **Fotos de galería:** sección *Galería* → "Añadir Fotografía" → sube una
      imagen real. Verifica **Storage → gallery** y `public.gallery`.
- [ ] **Blogs:** sección *Blog* → redacta y publica una entrada. Verifica
      `public.posts` y que se vea en `http://localhost:5180/blog`.
- [ ] **Revisar un pago de afiliado:** sección *Cuotas y Pagos* → cuando un
      afiliado reporte un pago con comprobante (ver abajo), usa el botón de
      ícono de ojo para abrir el comprobante con un enlace firmado, y
      apruébalo o recházalo.

### Como afiliado (`/afiliados`)

Primero regístrate como un afiliado nuevo (o usa la cuenta creada en el paso
7 antes de promoverla) desde `/registro-afiliado`.

- [ ] **Modificar información personal:** pestaña *Mi Perfil* → edita nombre,
      teléfono, ciudad, categoría, Elo → "Guardar". Verifica el cambio en
      `public.profiles`.
- [ ] **Adjuntar soporte de pago:** pestaña *Cuotas* → "Reportar Pago" → sube
      una foto o PDF del comprobante, completa periodo/monto/referencia →
      enviar. Verifica el archivo en **Storage → payment-receipts** (dentro de
      una carpeta con tu `user_id`) y la fila en `public.membership_payments`
      con `status = pending`.
- [ ] **Confirmar inscripción a torneo:** pestaña *Torneos* → elige un torneo
      abierto → "Inscribirme". Verifica la fila en
      `public.tournament_registrations`.

---

## 9. Servicios opcionales (no son necesarios para lo anterior)

- **Resend** (`VITE_RESEND_API_KEY`): envía el correo de bienvenida al
  registrarse. Sin esta clave, el registro sigue funcionando normalmente,
  simplemente no se envía el correo (revisa `src/services/resendService.ts`).
- **WhatsApp Cloud API** (`VITE_WHATSAPP_API_TOKEN`,
  `VITE_WHATSAPP_PHONE_NUMBER_ID`): sin configurarla, los botones de
  WhatsApp del panel simplemente abren `wa.me` con el mensaje prellenado
  (comportamiento normal de un link de WhatsApp, no requiere API).

Ninguno de los dos bloquea las funcionalidades de la sección 8.

---

## 10. Publicación / despliegue

Cada app se compila por separado. Ninguno de los tres `vite.config.*.ts`
define un `outDir` propio, así que las tres compilan hacia la misma carpeta
`dist/` por defecto — compílalas y despliega **una por una** (build, sube esa
`dist/`, y recién ahí compila la siguiente) para no pisar la salida anterior:

```bash
npx vite build --config vite.config.public.ts   # compila y despliega dist/ como sitio público
npx vite build --config vite.config.admin.ts    # compila y despliega dist/ como panel admin
npx vite build --config vite.config.members.ts  # compila y despliega dist/ como portal de afiliados
```

Despliega cada `dist/` a su propio subdominio o ruta (ej.
`www.club.com`, `admin.club.com`, `afiliados.club.com`), y en cada hosting
configura las mismas variables `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
como variables de entorno de build. Actualiza también **Site URL** y
**Redirect URLs** en Supabase con los dominios reales (ver sección 4).

---

## 11. Limitaciones conocidas (documentadas, no ocultas)

- **Aprobar una solicitud de afiliación** solo cambia su estado a
  `approved`; no crea la cuenta de acceso automáticamente (ver sección 0,
  punto 2). El aspirante debe registrarse él mismo con el mismo correo. Si
  más adelante quieres automatizar esto por completo (crear la cuenta y
  enviar la contraseña inicial desde el panel), se necesita una Supabase Edge
  Function con la `service_role` key en el servidor — esa clave nunca debe
  vivir en el frontend.
- Los buckets `gallery` y `documents` son **públicos**: cualquiera con el
  enlace directo puede ver el archivo, aunque no aparezca listado si no está
  publicado. No subas ahí documentos confidenciales (usa `payment-receipts`,
  que es privado, como referencia de patrón si necesitas otro bucket
  privado).
- Los archivos subidos a un formulario que se cancela antes de enviarlo
  quedan huérfanos en el bucket (suben al elegir el archivo, no al enviar el
  formulario). No afecta la operación diaria; si el volumen crece, conviene
  un barrido periódico similar al de cualquier limpieza de Storage.
