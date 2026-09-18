# Hoja de Ruta Maestra — Parte II
## Club Deportivo de Ajedrez Capablanca Sabaneta — Plataforma Web y de Administración Deportiva

**Proyecto:** `club-de-ajedrez-capablanca-sabaneta` (carpeta `CapablancaClubDeAjedrezWebsite`)
**Documento:** Continuación de la implementación — Parte II
**Fecha de emisión:** 2026-09-17
**Estado base:** Parte I ya implementada (sitio público + panel de administrador + portal de afiliados sobre React 18 + Vite + React Router + Supabase). Esta Parte II cubre auditoría, corrección de errores y nuevas funcionalidades.

---

## 0. Cómo usar este documento

Este archivo está escrito para ser entregado **completo, tal cual, como prompt/contexto de trabajo** a quien continúe la implementación (un desarrollador o un asistente de IA con acceso al repositorio). Por eso cada bloque sigue la misma estructura fija:

- **Objetivo** — qué problema resuelve o qué capacidad agrega.
- **Diagnóstico actual** — lo que ya existe en el código/base de datos hoy (verificado en la auditoría previa a este documento), para que no se reconstruya nada innecesariamente.
- **Tareas** — lista de verificación concreta y ordenada.
- **Base de datos** — si el bloque requiere crear o modificar tablas/columnas/buckets.
- **Seguridad** — riesgos específicos detectados y cómo mitigarlos.
- **Criterios de aceptación** — cómo se comprueba que el bloque quedó bien hecho.
- **Propuestas adicionales** — mejoras coherentes que no pidió explícitamente el punto original, pero que se derivan naturalmente de él (marcadas siempre como *propuesta*, nunca como requisito obligatorio).

**Regla de prioridad:** los bloques están numerados en el mismo orden que las instrucciones originales para que sean rastreables una a una, pero **no es obligatorio ejecutarlos en ese orden**. La sección 16 al final propone un orden de ejecución por fases (dependencias técnicas primero, features visibles después).

**Regla de no ambigüedad:** cuando una instrucción original quedó incompleta o admitía más de una lectura, se documenta explícitamente la interpretación adoptada en un recuadro `> **Nota de interpretación:**`. Si quien ejecuta el plan no está de acuerdo con esa interpretación, debe corregirla en este mismo documento antes de empezar esa tarea, no sobre la marcha.

---

## 1. Contexto técnico verificado (léase antes de empezar)

Esto es un resumen fiel de lo que ya existe en el repositorio, para que la ejecución de la Parte II parta de hechos y no de suposiciones.

**Stack:** React 18 + TypeScript + Vite 5 + React Router 6 + `@supabase/supabase-js`. Hay tres puntos de entrada de Vite (`vite.config.public.ts`, `vite.config.admin.ts`, `vite.config.members.ts`) además del `vite.config.ts` general, y el enrutamiento dentro de `src/App.tsx` también detecta el puerto de desarrollo (5180/5181/5182) para decidir a qué panel entrar. `index.html` ya no es un sitio estático: monta la SPA de React (`<div id="root">` + `/src/main.tsx`).

**Base de datos (`supabase_schema.sql`, 637 líneas):** ya existen 15 tablas (`profiles`, `site_settings`, `posts`, `events`, `documents`, `tournament_registrations`, `contact_messages`, `gallery`, `membership_payments`, `class_schedules`, `club_announcements`, `tournament_matches`, `class_attendance`, `club_trophies`, `membership_applications`), función `is_admin()`, trigger `handle_new_user()` que crea el perfil al registrarse, RLS habilitado en todas las tablas, y **tres buckets de Storage ya creados con políticas**: `gallery` (público), `documents` (público) y `payment-receipts` (privado, por carpeta de usuario). Es decir: la mayor parte de la infraestructura para documentos y comprobantes de pago **ya está construida**; lo que falta es auditar, completar huecos puntuales y conectar piezas de interfaz.

**Autenticación:** `src/context/AuthContext.tsx` usa `supabase.auth.signUp` / `signInWithPassword` reales cuando Supabase está configurado, y un modo "mock" con perfiles falsos en `localStorage` cuando no lo está (útil en desarrollo, pero debe quedar imposible de activar accidentalmente en producción — ver bloque 7).

**Hallazgo crítico de seguridad ya confirmado (no hipotético):** `.env.example` define `VITE_RESEND_API_KEY` y `VITE_WHATSAPP_API_TOKEN`, y `src/services/resendService.ts` llama `https://api.resend.com/emails` **directamente desde el navegador** usando esa llave. Cualquier variable de entorno con prefijo `VITE_` es incluida en texto plano en el bundle de JavaScript que se descarga el visitante: **la llave de Resend (y el token de WhatsApp) ya están expuestas públicamente en el sitio actual**. Esto se corrige en el bloque 7 y es la razón por la que el bloque 2 (llaves de LLM) exige una arquitectura distinta desde el principio.

**Hallazgo crítico de seguridad #2:** `src/views/public/VerifyCertificateView.tsx` es una ruta **pública** (`/verificar`, sin login) que ejecuta `supabase.from('profiles').select('*')` para poder comparar contra el FIDE ID o nombre ingresado. La política RLS actual de `profiles` es `FOR SELECT USING (auth.uid() IS NOT NULL)`, es decir, solo permite lectura a usuarios **autenticados**. Como consecuencia hoy mismo (a) la validación pública de credenciales probablemente **no retorna datos** para un visitante anónimo (bug funcional, punto 4.3.1), y (b) si en algún momento se relaja esa política para que la validación funcione, quedaría expuesta la tabla completa de perfiles — con teléfono, correo y fecha de nacimiento de todos los afiliados — a cualquier persona en internet. Se corrige en el bloque 6.

**Navbar (`src/components/common/Header.tsx` + `assets/css/styles.css`):** el header usa `position:fixed; top:5px;` con altura controlada por la variable `--header-h` (que cambia en el breakpoint de 640px). `MembersDashboardView.tsx` reserva el espacio bajo el header con `paddingTop: 'calc(var(--header-h) + 1.5rem)'` escrito en línea (no en la hoja de estilos), lo cual es una fuente típica de desincronización si `--header-h` cambia y ese valor en línea no se actualiza igual en todos los breakpoints y vistas. Ver diagnóstico completo y plan de corrección en el bloque 0.

Con este contexto, los siguientes bloques asumen que **no hay que construir desde cero** lo que ya existe: la tarea es auditar, corregir, completar y extender.

---

## 2. Bloque 0 — Auditoría continua y corrección del Navbar (instrucción #1)

### Objetivo
Establecer un proceso de mejora continua del proyecto (base de datos, diseño, front-end, seguridad) y resolver de inmediato el defecto visual reportado en la barra de navegación, como punto de partida hacia una plataforma de administración deportiva.

> **Nota de interpretación — sobre el "Cron Job cada 10 minutos":**
> Un cron que cada 10 minutos **audite** el proyecto es razonable y se implementa tal cual (ver tareas abajo). Un cron que cada 10 minutos **corrija automáticamente y sin supervisión** errores de seguridad y de base de datos en producción **no se implementa así**, por una razón concreta y no por exceso de cautela: un proceso autónomo que altera esquema, políticas RLS o código de producción cada 10 minutos sin revisión humana puede introducir una regresión o una brecha de seguridad más rápido de lo que alguien puede notarla, y no hay forma de deshacer un ciclo que ya corrió. La adaptación segura que cumple el mismo propósito — mejora continua y detección temprana — es: **auditoría automática continua + cola de hallazgos + aplicación de la corrección por un humano o por un agente de IA en una sesión supervisada**, exactamente el mismo patrón que ya usa este documento (Parte I → auditoría → Parte II). Si más adelante se desea automatizar también la corrección, debe limitarse a categorías de bajo riesgo y completamente reversibles (por ejemplo: reformateo de código, actualización de dependencias menores, regeneración de imágenes), nunca a cambios de esquema o de políticas de seguridad.
>
> **Nota adicional sobre "Cron Jobs":** en este stack (Vite + Supabase, sin backend propio persistente) un cron real solo puede vivir en dos lugares: (a) una **Supabase Edge Function programada** (`supabase functions schedule`), o (b) un runner externo (GitHub Actions con `schedule:`, o un servicio de cron como el que ya usa esta plataforma de trabajo). Cualquier automatización debe elegir uno de esos dos mecanismos — nunca un `setInterval` en el navegador, que se detiene en cuanto el usuario cierra la pestaña y no sirve como "cron" real.

### Diagnóstico actual del Navbar
`.header{position:fixed;top:5px;left:0;right:0;z-index:1100;...}` en `assets/css/styles.css` (línea 204). El espacio vacío reportado entre el borde superior del viewport y la barra puede tener varias causas independientes que deben descartarse **una por una**, no adivinarse:

1. Confirmar que ningún elemento ancestro de `.header` en el DOM (por ejemplo un futuro wrapper de `AnimatePresence`, `Framer Motion`, o cualquier `div` con `transform`, `filter`, `perspective` o `will-change: transform`) esté creando un nuevo "containing block" para el `position: fixed`. Si eso ocurre, el header deja de anclarse al viewport y se ancla a ese ancestro, generando exactamente un hueco variable como el descrito. Hoy `App.tsx` no tiene ese problema (no hay wrappers con transform), pero **debe quedar como regla de código**: nunca aplicar `transform`/`filter` a `#root`, `body` o a cualquier layout que envuelva `<Header />`.
2. Revisar si el "espacio vacío" ocurre solo en ciertos breakpoints: `--header-h` cambia en `@media (max-width:640px)` a `66px`, pero el `paddingTop` en línea de `MembersDashboardView.tsx` (`calc(var(--header-h) + 1.5rem)`) depende de que la variable CSS esté disponible en ese momento del render; si hay un flash antes de que se aplique la hoja de estilos, se percibe como salto/hueco.
3. Revisar consistencia entre vistas: la ruta `/admin` **no** usa `<PublicLayout>` (no renderiza `<Header/>` en absoluto — correcto, es un panel aparte), pero todas las páginas públicas y `/afiliados` sí. Verificar que ninguna vista de `views/public/*` o `MembersDashboardView.tsx` duplique un padding-top propio que ya no corresponda si se toca `--header-h`.
4. Confirmar en DevTools (inspección real, no solo lectura de CSS) el valor computado de `top` y la altura real renderizada del header en desktop, tablet y móvil, con y sin el aviso (`club_announcements`) activo, porque un anuncio activo en el sitio puede añadir una barra adicional que empuje el header y genere el hueco solo cuando hay un anuncio.

### Tareas
- [ ] Reproducir el bug en desktop y móvil, documentando con captura el valor computado de `top`/`height` del header y de cualquier elemento por encima de él.
- [ ] Eliminar cualquier padding/margin en línea redundante y centralizar el "alto seguro bajo el header" en una única variable CSS (`--content-offset`) usada por todas las vistas, en vez de repetir `calc(var(--header-h) + 1.5rem)` en cada componente.
- [ ] Verificar el comportamiento cuando `club_announcements` tiene un aviso `active = TRUE` con `target IN ('all','public')`: si el anuncio se renderiza como una barra fija adicional, sumar su altura a `--content-offset` dinámicamente (no con un valor fijo).
- [ ] Añadir una regla de lint/comentario en el CSS y en `Header.tsx` prohibiendo `transform`/`filter` en ancestros del header.
- [ ] Configurar el mecanismo de auditoría continua (Edge Function programada o GitHub Actions) que ejecute periódicamente: `tsc --noEmit` (errores de tipos), `npm run build` (errores de compilación), un chequeo de enlaces/imagenes rotas del sitio público, y un `SELECT` de verificación de que las políticas RLS de `supabase_schema.sql` coinciden con las políticas realmente aplicadas en el proyecto de Supabase (usando la API de administración de Supabase).
- [ ] Publicar los resultados de cada corrida en una nueva sección **"Auditoría del sistema"** dentro del panel de administrador (bloque 1), no solo en un log — el administrador debe poder ver el historial sin acceso a la terminal.
- [ ] Definir el intervalo real: 10 minutos es razonable para una auditoría liviana (chequeos de disponibilidad/salud); una auditoría profunda (build completo, análisis de dependencias) debe correr con menor frecuencia (por ejemplo cada 6 horas o una vez al día) para no consumir cuota de builds innecesariamente.

### Criterios de aceptación
- El header se ve pegado al borde superior del viewport (o al offset intencional de 5px) en las tres resoluciones de referencia (360px, 768px, 1440px), con y sin anuncio activo.
- Existe un job programado real (no `setInterval` de navegador) corriendo la auditoría liviana, visible en el panel de administrador con fecha/hora de la última corrida y estado (ok/advertencias/errores).
- Ningún hallazgo de la auditoría se aplica automáticamente a producción sin pasar por una sesión de revisión.

### Propuesta adicional
Convertir esta sección de auditoría en el embrión del panel de **"Plataforma de administración deportiva"**: agregarle desde ya widgets de salud operativa (afiliados activos vs. inactivos, pagos pendientes de validar, documentos sin adjuntar, solicitudes de afiliación sin contactar) para que el administrador tenga un solo lugar de control, no solo errores técnicos.

---

## 3. Bloque 1 — Panel de administrador: "MODO AI" multi-proveedor y editor de sitio ampliado (instrucción #2 y #2.1)

### Objetivo
Permitir que el administrador conecte distintos proveedores de LLM por API y active un "MODO AI" transversal que asista procesos internos (redacción, moderación, resúmenes, etc.), y ampliar el editor del sitio para cubrir mucho más contenido editable del que hoy permite `site_settings`.

### Diagnóstico actual
`site_settings` es una tabla de **una sola fila** (`id = 'general'`) con columnas fijas (teléfono, WhatsApp, sede, mensajes de WhatsApp predefinidos, anuncio). Sirve para lo que ya edita, pero no es extensible: agregar un nuevo campo editable hoy exige una migración de esquema por cada campo nuevo. Además, **no existe ningún proveedor de LLM conectado todavía** en el código (`package.json` no tiene SDKs de IA), así que este bloque se construye desde cero, con la lección de seguridad del bloque 7 ya incorporada.

### Seguridad (no negociable, léase antes de escribir código)
Las llaves de API de los proveedores de LLM **no se guardan en ninguna tabla legible por el cliente ni en ninguna variable `VITE_*`**. Ya existe en este mismo proyecto un ejemplo de lo que pasa si se hace mal (`VITE_RESEND_API_KEY`, expuesta hoy en el bundle — bloque 7). La arquitectura correcta es:

1. Las llaves viven **solo** como *secrets* de Supabase Edge Functions (`supabase secrets set`) o en el gestor de secretos del proveedor de hosting — nunca en una tabla de Postgres en texto plano, ni siquiera protegida por RLS (RLS protege lecturas indebidas desde el cliente, pero un administrador con acceso a la tabla vería la llave en texto plano, y cualquier backup de la base quedaría con las llaves adentro).
2. Todo el tráfico hacia Gemini, Anthropic, OpenAI, Qwen, Zhipu/Zai, DeepSeek, Grok (xAI), Kimi (Moonshot), Tencent Hunyuan, etc. pasa por **una única Edge Function proxy** (`ai-proxy`) que el frontend invoca con `{ feature: 'blog_writer', provider: 'anthropic', prompt: '...' }`. La Edge Function decide qué llave usar y hace la llamada externa; el navegador nunca ve la llave.
3. Lo único que sí puede vivir en una tabla (con RLS `admin`-only) es la **configuración no sensible**: qué proveedores están habilitados, qué modelo usar por función, límites de uso, y si el modo AI está activo — nunca el valor de la llave.

### Base de datos
Tabla nueva `ai_provider_settings`:

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `provider` | text | `'gemini' \| 'anthropic' \| 'openai' \| 'qwen' \| 'zai' \| 'deepseek' \| 'grok' \| 'xiaomi' \| 'kimi' \| 'tencent'` (CHECK) |
| `enabled` | boolean | |
| `default_model` | text | p. ej. `'gemini-2.5-flash'` |
| `secret_ref` | text | **nombre** del secreto en Supabase (`AI_KEY_ANTHROPIC`), nunca el valor |
| `usage_scope` | text[] | en qué features puede usarse (`blog`, `moderacion`, etc.) |
| `updated_by` | uuid → profiles | |
| `updated_at` | timestamptz | |

Tabla nueva `content_blocks` (para el editor de sitio ampliado, en vez de seguir agregando columnas a `site_settings`):

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `page` | text | `'home' \| 'club' \| 'programas' \| 'torneos' \| 'contacto' \| 'galeria'` |
| `section_key` | text | identificador único dentro de la página, p. ej. `hero.titulo`, `club.mision` |
| `value_type` | text | `'text' \| 'richtext' \| 'image' \| 'json'` |
| `value` | text | contenido; si `value_type = 'image'`, es la URL del bucket |
| `updated_at` | timestamptz | |

`UNIQUE(page, section_key)`. RLS: lectura pública (`USING (TRUE)`), escritura solo `is_admin()`. Esto permite que el editor del sitio agregue campos nuevos **sin migraciones**, simplemente insertando una fila con una `section_key` nueva.

### Tareas
- [ ] Crear la Edge Function `ai-proxy` con un adaptador por proveedor (interfaz común `generate(prompt, options) -> text`), de forma que agregar/quitar un proveedor sea configurar un adaptador nuevo, no reescribir cada punto de llamada del frontend.
- [ ] Crear `ai_provider_settings` y su panel de administración (activar/desactivar proveedor, elegir modelo por defecto, ver últimas 20 llamadas con estado ok/error — sin loguear el contenido completo de prompts sensibles de afiliados).
- [ ] Implementar el toggle global **"MODO AI"** y, dentro de cada sección donde aplique (redacción de blog — bloque 10 —, y cualquier otra que se agregue), un botón contextual que solo aparece si el modo está activo y hay al menos un proveedor habilitado.
- [ ] Migrar el editor de sitio actual (los campos hoy fijos en `site_settings`) a `content_blocks`, mapeando cada campo existente a una fila, sin romper lo que ya funciona.
- [ ] Construir el nuevo editor de sitio como un formulario dinámico que lee todas las filas de `content_blocks` agrupadas por `page`, generando el campo de edición según `value_type` (input de texto, editor enriquecido, selector de imagen con el mismo componente drag-and-drop de la galería).
- [ ] Definir explícitamente qué secciones de cada página HTML/vista pasan a ser editables (hoy: hero, misión/visión/valores del club, textos de programas, preguntas frecuentes de contacto) para no dejarlo "abierto" sin alcance.

### Criterios de aceptación
- Ninguna llave de proveedor de IA aparece en el bundle de JavaScript ni en ninguna tabla de la base de datos (verificar con `grep` sobre el build de producción).
- El administrador puede activar Anthropic (por ejemplo) sin tocar código, y desactivarlo sin romper el resto del sitio.
- Editar un texto del "editor del sitio" se refleja en la página pública sin necesidad de un nuevo despliegue.

### Propuestas adicionales
- Límite de uso mensual por proveedor (columna `monthly_token_budget`) para evitar sorpresas de facturación.
- Un modo "borrador con IA, publicación manual": el contenido generado por IA nunca se publica directo, siempre queda en estado revisable por un humano antes de salir a producción (coherente con el punto 8).

---

## 4. Bloque 2 — Punto #3 de la instrucción original (incompleto)

> **Nota de interpretación:** la instrucción original #3 dice textualmente *"Lo segundo que harás será: Revisar"* y queda ahí, sin objeto. No se inventa contenido que el usuario no pidió. Se interpreta como una instrucción transversal de **revisión cruzada**: antes de dar por cerrado cualquier bloque de este documento, se revisa que no contradiga ni rompa lo ya construido en la Parte I, y se registra esa revisión como parte de los criterios de aceptación de cada bloque (ya incorporado en el Bloque 0 como auditoría continua). Si la intención original era otra ("revisar" un módulo específico), debe completarse aquí antes de ejecutar, reemplazando este párrafo.

---

## 5. Bloque 3 — Tableros de ajedrez conectados a Lichess (instrucción #4)

### Objetivo
Que los afiliados tengan tableros de ajedrez reales y funcionales en su panel, conectados a Lichess.org, empezando por `iframe` y evolucionando después a la API oficial.

### Diagnóstico actual
Hoy no existe ningún tablero ni referencia a Lichess en `MembersDashboardView.tsx` ni en ningún otro componente (`ChessClockView.tsx` es un reloj de ajedrez propio, no un tablero de partidas). Este bloque se construye desde cero.

### Base de datos
Agregar a `profiles` la columna `lichess_username TEXT` (nullable), para que cada afiliado pueda vincular su cuenta de Lichess desde su perfil.

### Tareas — Fase 1 (iframe, alcance de esta parte del proyecto)
- [ ] Agregar en el perfil del afiliado un campo para vincular su usuario de Lichess (`lichess_username`).
- [ ] En el panel de afiliados, insertar el embed oficial de Lichess (`https://lichess.org/embed/...`) usando el usuario vinculado cuando exista, y un tablero de estudio/práctica genérico cuando no (para que la sección nunca quede vacía).
- [ ] Configurar la Content-Security-Policy del sitio para permitir `frame-src https://lichess.org` explícitamente (y solo ese dominio, no `*`).
- [ ] Aplicar `sandbox` y `referrerpolicy` conservadores al iframe, igual que se hará con el mapa de Google (bloque 13), y verificar que el iframe sea responsive dentro de la tarjeta del panel.

### Tareas — Fase 2 (siguiente iteración, no bloqueante para esta entrega)
- [ ] Registrar una aplicación OAuth en Lichess y mover la integración a la API oficial (`lichess.org/api`) para mostrar partidas reales, rating en vivo y estadísticas del afiliado sin depender de un iframe.
- [ ] Cachear las respuestas de la API (Edge Function + tabla o Redis) para no exceder los límites de tasa de Lichess.

### Criterios de aceptación
- El tablero carga correctamente en el panel de afiliados en desktop y móvil.
- Si el afiliado no ha vinculado su cuenta, ve una invitación clara a vincularla, no un iframe roto o en blanco.

---

## 6. Bloque 4 — Documentos descargables para afiliados y subida por el administrador (instrucción #4.1)

### Objetivo
Que guías, reglamentos, material de estudio, circulares y resoluciones se puedan subir como PDF real desde el panel de administrador y se sincronicen automáticamente con lo que ve el afiliado.

### Diagnóstico actual — esto ya está construido, se audita y se completa
La tabla `documents` y el bucket `documents` (público, hasta 15MB, tipos MIME de PDF/Word/Excel/imagen) **ya existen**, y `AdminDashboardView.tsx` ya sube archivos con `FileUploadField` (bucket `documents`) e inserta filas en la tabla; `MembersDashboardView.tsx` ya lee esa misma tabla y filtra por `min_role`. Es decir: la sincronización que pide este punto **ya está conectada de fábrica**. El trabajo real de este bloque es auditoría y remate de bordes.

### Tareas
- [ ] Confirmar extremo a extremo (subida real desde el panel de administrador → fila en `documents` → visible y descargable en el panel de afiliados) con un PDF de prueba, en al menos dos roles distintos de `min_role`.
- [ ] Añadir a la lista de categorías permitidas (`documents_category_check`) los valores que faltan según la instrucción original: confirmar si "Guía" y "Formulario de inscripción" deben ser categorías propias (hoy solo existen `General, Reglamento, Material de Estudio, Partidas PGN, Circulares, Resolución, Acta`) y ampliar el `CHECK` si es necesario.
- [ ] Para un documento aún no adjuntado por el administrador (el requisito explícito de "empezar con un PDF en blanco"), definir un estado explícito en la fila (por ejemplo `file_url IS NULL`) que el panel de afiliados muestre como *"Documento próximamente disponible"* en vez de un enlace roto a un archivo vacío — es mejor experiencia que subir un PDF literalmente en blanco.
- [ ] Verificar que `file_size` y `file_type` se calculen a partir del archivo real subido, no que queden con el valor por defecto del esquema (`'1.2 MB'`, que hoy es un placeholder fijo).
- [ ] Revisar que el conteo `downloads_count` se incremente en cada descarga real (hoy existe la columna; confirmar si el código ya la actualiza).

### Seguridad
El bucket `documents` es **público**: cualquier persona con la URL directa puede leer el archivo sin pasar por la columna `min_role` de la tabla (esa columna solo filtra qué se *muestra* en la interfaz, no protege el archivo en sí). Si en el futuro se sube algún documento que no deba ser público (por ejemplo un acta interna sensible), este diseño no lo protege. Documentado también en el Bloque 15 (seguridad general); decisión pendiente: o se acepta que todo lo de este bucket es "público si alguien tiene el link" (razonable para reglamentos/circulares), o se migra a un bucket privado con URLs firmadas igual que `payment-receipts`.

### Criterios de aceptación
- Un documento subido por el administrador aparece para el afiliado sin recargar manualmente caché ni republicar el sitio.
- Ningún documento "vacío" se presenta como si fuera descargable con contenido real.

---

## 7. Bloque 5 — Comprobantes de pago de afiliados (instrucción #4.2)

### Objetivo
Verificar y completar el ciclo de subida y validación de comprobantes de pago entre el afiliado y el administrador.

### Diagnóstico actual — también ya construido en su mayor parte
`membership_payments` y el bucket privado `payment-receipts` (con política por carpeta de usuario: `(storage.foldername(name))[1] = auth.uid()::text`) ya existen. El afiliado ya reporta un pago con comprobante adjunto desde `MembersDashboardView.tsx`, y el administrador ya tiene `handleViewReceipt` con URL firmada (`getSignedUrl`) en `AdminDashboardView.tsx`. Falta cerrar el ciclo de aprobación/rechazo y su trazabilidad.

### Base de datos
Agregar a `membership_payments`: `reviewed_by UUID REFERENCES profiles(id)`, `reviewed_at TIMESTAMPTZ`. Esto permite saber quién aprobó o rechazó cada pago y cuándo, algo que hoy no queda registrado (la tabla solo tiene `status`).

### Tareas
- [ ] Confirmar que cambiar `status` de `pending` a `approved`/`rejected` desde el panel de administrador efectivamente actualiza la fila y que el afiliado ve ese cambio de estado en su propio panel sin recargar la página manualmente (suscripción en tiempo real de Supabase, o al menos refetch al entrar a la sección).
- [ ] Registrar `reviewed_by`/`reviewed_at` en cada cambio de estado.
- [ ] Enviar una notificación (reutilizando `resendService`, una vez migrado a Edge Function según el Bloque 7) al afiliado cuando su pago sea aprobado o rechazado, con el motivo si fue rechazado (agregar campo `rejection_reason` si no existe ya en `notes`).
- [ ] Confirmar que la URL firmada de un comprobante caduca (Supabase Storage signed URLs tienen expiración) y que el flujo de "ver comprobante" del administrador la regenera cada vez, no reutiliza una URL vieja guardada.

### Criterios de aceptación
- Un pago reportado por un afiliado es visible para el administrador con su comprobante, se puede aprobar o rechazar, y el afiliado ve reflejado ese estado.
- Ningún comprobante de pago es accesible por un afiliado distinto al que lo subió (confirmar probando con dos cuentas de prueba).

### Propuestas adicionales
- Reporte exportable (CSV) de pagos por periodo para la tesorería del club.
- Recordatorio automático (vía Edge Function programada) a afiliados con cuota vencida.

---

## 8. Bloque 6 — Carnet digital de afiliado y validación de credenciales (instrucción #4.3 y #4.3.1)

### Objetivo
Que el afiliado pueda descargar su carnet digital en PDF o imagen, y que la validación pública de credenciales funcione de forma correcta y segura.

### Diagnóstico actual
`DigitalAthleteIdCardModal.tsx` ya existe (312 líneas) y ya se usa desde `MembersDashboardView.tsx`, pero **no hay ninguna librería de generación de PDF o de captura de canvas en `package.json`** — es decir, hoy el modal probablemente solo se ve en pantalla, sin una descarga real de archivo. Y como ya se documentó en la sección de contexto, `VerifyCertificateView.tsx` intenta leer `profiles` completo desde una ruta pública, lo cual choca con la política RLS actual y además sería un problema de privacidad si se "arreglara" simplemente abriendo la tabla.

### Base de datos
Crear una vista pública segura, en vez de abrir la tabla `profiles`:

```sql
CREATE OR REPLACE VIEW public.member_public_directory AS
SELECT
  p.id,
  p.nombre,
  p.apellido,
  p.categoria_ajedrez,
  p.fide_id,
  p.elo_rating,
  p.estado
FROM public.profiles p
WHERE p.estado = 'active';

GRANT SELECT ON public.member_public_directory TO anon, authenticated;
```

Esta vista **deliberadamente no incluye** correo, teléfono, fecha de nacimiento, dirección ni ningún otro dato personal — solo lo necesario para validar que una persona es afiliado vigente y su categoría/rating. `VerifyCertificateView.tsx` se reescribe para consultar esta vista en vez de `profiles`.

### Tareas
- [ ] Añadir `html2canvas` (o `html-to-image`) + `jspdf` (o generar directamente un PNG si se prefiere no traer una librería de PDF) para que el carnet se descargue como archivo real, no solo se visualice.
- [ ] Decidir el formato final entregado (PDF o imagen) según lo que sea más simple de mantener — para un carnet de una sola cara, una imagen PNG de alta resolución es más liviana y suficiente; un PDF solo aporta si se va a imprimir en tamaño carné físico.
- [ ] Incluir en el carnet un código QR que enlace a `/verificar?id={profile.id}` (propuesta), para que cualquiera pueda validar el carnet escaneándolo, sin depender de que el verificador teclee el nombre o el FIDE ID manualmente.
- [ ] Reescribir `VerifyCertificateView.tsx` para consultar `member_public_directory` en vez de `profiles`, y confirmar que funciona sin sesión iniciada.
- [ ] Ejecutar la migración de la vista y confirmar con una prueba real (usuario no autenticado, en una ventana de incógnito) que la validación pública funciona.

### Criterios de aceptación
- Un afiliado descarga su carnet como archivo real (PDF o imagen) desde su panel.
- Un visitante sin sesión iniciada puede validar un carnet/certificado desde `/verificar` y **no** recibe ningún dato personal del afiliado más allá de lo que la vista expone deliberadamente.

---

## 9. Bloque 7 — Corrección del inicio de sesión y del registro (instrucción #5)

### Objetivo
Corregir el error "Email not confirmed" que impide reingresar al panel tras cerrar sesión, y confirmar que el registro efectivamente crea el perfil en la base de datos.

### Diagnóstico actual (causa raíz más probable, a confirmar antes de tocar código)
En `AuthContext.tsx`, `register()` llama `supabase.auth.signUp(...)` y, si la llamada no falla, intenta `fetchProfile(authData.user.id, ...)` inmediatamente. Esto **solo deja al usuario realmente autenticado** si el proyecto de Supabase tiene desactivada la confirmación de correo ("Confirm email" en Authentication → Settings). Si esa opción está **activada** (que es lo más probable, dado el mensaje "Email not confirmed" que describe la instrucción), `signUp` crea el usuario pero no entrega una sesión válida hasta que el correo se confirme; cualquier acceso inicial que pareciera funcionar es probablemente session residual de `localStorage` o del modo mock, no una sesión real — y al cerrar sesión y volver a intentar `signInWithPassword`, Supabase responde exactamente con el error `Email not confirmed` que describe la instrucción.

Sobre "no se está creando el registro... en la base de datos": el trigger `handle_new_user()` es `SECURITY DEFINER` y debería ejecutarse igual haya o no confirmación de correo (se dispara por el `INSERT` en `auth.users`, no por la confirmación). Antes de asumir que el trigger falla, se debe **revisar los logs de Postgres/Supabase** en el momento de un registro de prueba — las causas más comunes de que el trigger no complete el `INSERT` en `profiles` son: colisión de `usuario` UNIQUE mal resuelta, o una excepción silenciosa que Supabase reporta en sus logs de Database, no en la consola del navegador.

### Tareas
- [ ] Confirmar en el dashboard de Supabase si "Confirm email" está activado.
- [ ] **Decisión de producto explícita** (no técnica): dado que la instrucción #6 (bloque siguiente) pide que el registro *no* dé acceso inmediato sino que quede como solicitud pendiente, la solución coherente con ambos puntos a la vez es: dejar la confirmación de correo activada (buena práctica de seguridad) y, además, **no otorgar acceso al panel hasta que la solicitud sea aprobada por un administrador** (ver bloque 8) — es decir, la confirmación de correo y la aprobación administrativa son dos filtros independientes y ambos deben pasar.
- [ ] Mientras el correo no esté confirmado, mostrar en el login un mensaje claro ("Confirma tu correo, revisa tu bandeja de entrada") con un botón para reenviar el correo de confirmación (`supabase.auth.resend`), en vez del mensaje de error genérico de Supabase.
- [ ] Revisar los logs de Postgres de un registro de prueba real para confirmar si `handle_new_user()` efectivamente inserta la fila en `profiles`; si falla, corregir la causa puntual encontrada (no reescribir el trigger a ciegas).
- [ ] Blindar el modo "mock" de `AuthContext.tsx` para que sea *imposible* que se active en el despliegue de producción (hoy depende de `isSupabaseConfigured()`; confirmar que las variables de entorno de producción siempre estén presentes y que no haya una ruta de acceso por puerto de desarrollo — `5181`/`5182` — accesible en producción).

### Criterios de aceptación
- Un usuario nuevo se registra, recibe el correo de confirmación, lo confirma, y puede iniciar sesión sin el error `Email not confirmed`.
- Cerrar sesión y volver a iniciar sesión funciona de forma consistente, sin depender de sesión mock ni de `localStorage` residual.
- Se confirma con una consulta directa a la tabla `profiles` que cada registro de prueba efectivamente crea su fila.

---

## 10. Bloque 8 — Flujo de solicitud de afiliación y política de datos (instrucción #6 y #6.1)

### Objetivo
Que registrarse no dé acceso inmediato al panel completo, sino que se presente como una solicitud de afiliación recibida, con aviso de tratamiento de datos personales.

### Diagnóstico actual
El proyecto ya tiene **dos flujos de registro distintos** que hoy no están unificados: `MembershipApplicationView.tsx` (ruta pública `/afiliarse`, sin crear cuenta, inserta en `membership_applications` con `status = 'pending'`) y `MemberRegisterView.tsx` (ruta `/registro-afiliado`, crea una cuenta real de Supabase Auth vía `AuthContext.register`, con acceso al panel apenas se autentique). La instrucción #6 describe el comportamiento que **ya tiene** `MembershipApplicationView`, pero aplicado al flujo de `MemberRegisterView`. La forma correcta de resolver esto sin duplicar lógica ni confundir al usuario es unificar ambos flujos.

### Tareas
- [ ] Unificar el registro: `MemberRegisterView` pasa a crear tanto la cuenta de autenticación (para que el correo quede confirmado y el usuario pueda entrar más adelante) como una fila en `membership_applications` con `status = 'pending'`, vinculada al `profile.id` recién creado (agregar columna `linked_profile_id UUID REFERENCES profiles(id)` a `membership_applications` si no existe esa relación).
- [ ] Al completar el registro, mostrar exactamente el mensaje solicitado: *"Su solicitud de registro de afiliación al Club De Ajedrez Capablanca en Sabaneta ha sido recibida exitosamente."*, seguido del aviso corto de tratamiento de datos.
- [ ] El acceso al panel de afiliados completo solo se habilita cuando `membership_applications.status = 'approved'` **y** el correo está confirmado. Con cualquiera de las dos condiciones pendientes, el usuario que inicia sesión ve una pantalla de "tu solicitud está en revisión", no el panel completo ni un error críptico.
- [ ] Crear la página nueva de política de tratamiento de datos personales y cookies (ruta pública, por ejemplo `/politica-de-datos`), enlazada desde el aviso corto del registro y desde el pie de página de todo el sitio.
- [ ] Redactar el contenido de esa política conforme a la Ley 1581 de 2012 y su reglamentación (Habeas Data) para Colombia: identificación del responsable del tratamiento, finalidad de los datos recolectados, derechos del titular (conocer, actualizar, rectificar, solicitar prueba de autorización, ser informado, revocar autorización, presentar quejas ante la SIC), canal de contacto para ejercer esos derechos, y política de cookies del sitio.

> **Nota legal:** este documento no sustituye asesoría jurídica. El texto de la política de tratamiento de datos debe ser revisado por un abogado o por la persona responsable de cumplimiento del club antes de publicarse, especialmente en lo referente a menores de edad (el club atiende población infantil, lo cual activa requisitos adicionales de autorización por parte de los padres/acudientes bajo la ley colombiana).

### Criterios de aceptación
- Registrarse nunca otorga acceso inmediato al panel completo.
- El mensaje de confirmación coincide textualmente con el solicitado.
- La política de datos es accesible desde el registro y desde cualquier página del sitio.

---

## 11. Bloque 9 — Pop-ups publicitarios administrables (instrucción #7)

### Objetivo
Permitir que el administrador cree ventanas emergentes con una imagen (subida por drag and drop, igual que en la galería) e hipervínculo configurable hacia una sección del sitio, un PDF (resolución/comunicado/circular) o un formulario de inscripción.

### Base de datos
Tabla nueva `promo_popups`:

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid PK | |
| `title` | text | solo referencia interna del admin |
| `image_url` | text | subida al bucket `gallery` o a un bucket nuevo `popups` |
| `link_type` | text | `'internal_page' \| 'external_url' \| 'document' \| 'form'` (CHECK) |
| `link_value` | text | ruta interna, URL externa, o `documents.id` según `link_type` |
| `active` | boolean | |
| `starts_at` / `ends_at` | timestamptz nullable | vigencia programada |
| `pages` | text[] | en qué páginas se muestra (`['home']`, `['*']` para todas) |
| `frequency` | text | `'once_per_session' \| 'once_per_day' \| 'always'` |
| `impressions_count` / `clicks_count` | integer default 0 | métricas básicas |
| `created_at` / `updated_at` | timestamptz | |

RLS: lectura pública solo de los activos y vigentes; escritura solo `is_admin()`.

### Tareas
- [ ] Reutilizar el componente de drag-and-drop ya existente de la galería (mismo patrón de `FileUploadField`) para la imagen del pop-up.
- [ ] Construir el selector de destino del hipervínculo como un combo dependiente de `link_type` (si es `document`, listar los documentos existentes de la tabla `documents`; si es `internal_page`, listar las rutas del sitio; si es `external_url`/`form`, un input de texto).
- [ ] Implementar el control de frecuencia en el cliente (una marca en `localStorage`/cookie por `popup.id`) para no repetir el mismo pop-up en cada carga de página dentro de la misma visita, salvo que `frequency = 'always'`.
- [ ] Incrementar `impressions_count` al mostrarse y `clicks_count` al hacer clic, para que el administrador vea si el pop-up está funcionando.
- [ ] Panel de administración para crear/editar/pausar pop-ups, con vista previa antes de publicar.

### Criterios de aceptación
- Un pop-up creado por el administrador aparece en las páginas configuradas dentro de su vigencia, con el destino correcto al hacer clic, y respeta la regla de frecuencia elegida.

---

## 12. Bloque 10 — Redacción de blogs con IA y carga de imágenes (instrucción #8 y #8.1)

### Objetivo
Añadir un modo "Redacción con IA" en el editor de blog conectado a los mismos proveedores del bloque 1, optimizado para SEO/GEO/AEO, y permitir adjuntar imágenes por drag and drop.

### Diagnóstico actual
`posts` ya existe con los campos necesarios (`title`, `slug`, `excerpt`, `content`, `cover_image`, `category`). El editor de blog en `AdminDashboardView.tsx` ya existe; lo que falta es el botón de asistencia por IA (depende de que el bloque 1 — `ai-proxy` — esté implementado primero) y el drag-and-drop de imágenes dentro del contenido (hoy solo hay `FileUploadField` para la imagen de portada, no para imágenes dentro del cuerpo del artículo, a confirmar en el editor real).

### Tareas
- [ ] Agregar el botón **"Redactar con IA"** en el editor de blog, que envía a `ai-proxy` un tema/palabras clave y devuelve: título, meta-descripción, cuerpo estructurado en H2/H3, y sugerencia de `alt text` para las imágenes.
- [ ] El contenido generado siempre entra como **borrador**, nunca se publica automáticamente (coherente con la propuesta del bloque 1); el administrador revisa y presiona "Publicar".
- [ ] Optimización SEO clásica: slug limpio, meta-descripción, encabezados jerárquicos, enlaces internos sugeridos.
- [ ] Optimización GEO/AEO (motores generativos y de respuesta — es decir, que la IA de terceros que resuma o cite el blog lo entienda bien): estructura de "respuesta directa" en el primer párrafo, datos concretos y verificables (evitando afirmaciones vacías), y marcado `schema.org/Article` con `datePublished`, `author`, `articleSection`.
- [ ] Habilitar drag-and-drop de imágenes dentro del cuerpo del artículo (no solo portada), subiéndolas al bucket correspondiente e insertando la URL en el editor de contenido.

### Criterios de aceptación
- El administrador puede generar un borrador con IA, editarlo y publicarlo, y el artículo publicado incluye metadatos SEO básicos y marcado `schema.org`.
- Se pueden arrastrar imágenes directamente dentro del cuerpo del blog sin salir del editor.

---

## 13. Bloque 11 — Previsualización y descarga de comprobantes por el administrador (instrucción #9)

### Objetivo
Que el administrador pueda previsualizar y descargar los comprobantes de pago de los afiliados.

### Diagnóstico actual
Ya existe `handleViewReceipt` en `AdminDashboardView.tsx`, que genera una URL firmada del bucket `payment-receipts` (política `receipts_owner_or_admin_select` ya permite lectura al administrador). Es decir, la previsualización ya está construida; falta confirmar la descarga explícita y la exportación masiva.

### Tareas
- [ ] Confirmar que "previsualizar" abre el archivo (imagen o PDF) sin forzar descarga, y agregar un botón explícito de "descargar" que sí fuerce la descarga (`download` attribute o `Content-Disposition` vía la Edge Function si se requiere nombre de archivo personalizado).
- [ ] Agregar exportación masiva (ZIP o CSV con enlaces firmados temporales) de comprobantes por rango de fechas, para la tesorería del club.

### Criterios de aceptación
- El administrador previsualiza y descarga cualquier comprobante de pago sin errores de permisos.

---

## 14. Bloque 12 — Corrección de carga de imágenes (instrucción #10)

### Objetivo
Corregir la carga/renderizado de imágenes del proyecto.

### Diagnóstico actual y pasos de investigación obligatorios
No hay una única causa evidente en el código auditado (ninguno de los `vite.config*.ts` define un `base` distinto entre sí, lo cual descarta la sospecha más común en apps con múltiples entradas de Vite — confirmarlo de nuevo si se modifica cualquier `vite.config`). Antes de "corregir a ciegas", se debe:

### Tareas
- [ ] Reproducir el problema en un navegador con la consola de red abierta e identificar exactamente qué imágenes fallan (404, CORS, o simplemente no cargan por ruta relativa incorrecta) — sitio público (`assets/img/*.webp` referenciadas con ruta absoluta `/assets/...`), imágenes subidas a Supabase Storage (bucket `gallery`, público) o ambas.
- [ ] Si son imágenes de `assets/img`, confirmar que el build de Vite las está copiando a la carpeta de salida y que las rutas siguen siendo absolutas (`/assets/img/...`) y no relativas al momento de renderizar dentro de las rutas de React Router (un error típico en SPA es que una ruta relativa funcione en `/` pero se rompa en `/blog/mi-articulo` porque el navegador la resuelve contra la URL actual).
- [ ] Si son imágenes de Supabase Storage, confirmar que se está usando la URL pública completa (`getPublicUrl`) y no solo el `path` interno del archivo.
- [ ] Añadir un manejador de error (`onError`) en las imágenes críticas que muestre un placeholder en vez de un ícono roto, mientras se corrige la causa real.

### Criterios de aceptación
- Ninguna imagen del sitio público, del panel de administrador ni del panel de afiliados devuelve 404 o se ve rota en una auditoría visual completa de todas las rutas.

---

## 15. Bloque 13 — Mapa de Google en contacto (instrucción #11)

### Objetivo
Insertar el iframe de Google Maps con la ubicación exacta del club en la sección de contacto.

### Tareas
- [ ] Insertar el iframe proporcionado dentro de `src/views/public/ContactView.tsx` (la vista real que renderiza la ruta `/contacto`; `contacto.html` es el archivo estático heredado de la Parte I y ya no es el que sirve la SPA — confirmar si `contacto.html` debe eliminarse o mantenerse como referencia/backup).
- [ ] Envolver el iframe en un contenedor responsive (relación de aspecto fija, `width`/`height` del iframe controlados por CSS, no por los atributos fijos `600x450` del embed original) para que se vea bien en móvil.
- [ ] Confirmar que la Content-Security-Policy del sitio permite `frame-src https://www.google.com` (puede coexistir con la regla agregada para Lichess en el bloque 3).
- [ ] Mantener `loading="lazy"` y `referrerpolicy="strict-origin-when-cross-origin"` tal como viene en el embed original.

### Criterios de aceptación
- El mapa se ve correctamente centrado en la ubicación exacta del club, en desktop y móvil, sin desbordar el contenedor.

---

## 16. Bloque 14 — Consolidado de base de datos (instrucción #12)

Resumen de **todo** lo que este documento pide crear o modificar en el esquema, para ejecutarse como una sola migración ordenada (o varias migraciones pequeñas en este orden, que es el orden de dependencias):

| # | Cambio | Bloque | Tipo |
|---|---|---|---|
| 1 | Columna `profiles.lichess_username TEXT` | 3 | Alter |
| 2 | Columna `membership_payments.reviewed_by`, `reviewed_at` | 5 | Alter |
| 3 | Vista `public.member_public_directory` | 6 | Nueva vista |
| 4 | Columna `membership_applications.linked_profile_id UUID` | 8 | Alter |
| 5 | Tabla `ai_provider_settings` | 1 | Nueva tabla |
| 6 | Tabla `content_blocks` (y migración de datos desde `site_settings`) | 1 | Nueva tabla + migración de datos |
| 7 | Tabla `promo_popups` | 9 | Nueva tabla |
| 8 | Ampliar `documents_category_check` si se confirman categorías nuevas | 4 | Alter constraint |
| 9 | Revisión de política RLS `"Perfiles lectura autenticados"` en `profiles` (ver bloque 15) | 15 | Alter policy |
| 10 | Bucket nuevo `popups` (o reutilizar `gallery`, a decidir) | 9 | Storage |

**Regla de ejecución:** cada migración se escribe en un archivo `.sql` versionado (no se edita `supabase_schema.sql` a mano y se pierde el historial); se ejecuta primero contra un proyecto de Supabase de *staging*, nunca directo contra producción, y solo después de una copia de seguridad reciente confirmada.

---

## 17. Bloque 15 — Auditoría general de seguridad e integración (instrucción #13)

Consolidado de todos los hallazgos de seguridad detectados a lo largo de este documento, para que quede como checklist único de cierre:

- [ ] **Crítico — llaves expuestas en el cliente.** `VITE_RESEND_API_KEY` y `VITE_WHATSAPP_API_TOKEN` están hoy en el bundle público de JavaScript. Migrar el envío de correos (`resendService.ts`) y de WhatsApp (`whatsappService.ts`) a Edge Functions server-side, exactamente con el mismo patrón que se exige para las llaves de LLM en el bloque 1. Esto se corrige **antes** de conectar ningún proveedor de IA, para no repetir el mismo error a mayor escala.
- [ ] **Crítico — exposición pública de `profiles`.** La ruta pública de verificación consulta la tabla completa de perfiles. Reemplazar por la vista `member_public_directory` (bloque 6) antes de que la validación de credenciales quede accesible al público.
- [ ] **Alto — alcance de la política de lectura de `profiles`.** Hoy *cualquier* usuario autenticado (cualquier afiliado) puede leer el perfil completo de *cualquier otro* afiliado, incluyendo teléfono, correo y fecha de nacimiento (`FOR SELECT USING (auth.uid() IS NOT NULL)`). Evaluar si eso es intencional (por ejemplo, para directorios internos) o si debe restringirse a que cada afiliado solo lea su propio perfil completo y un subconjunto público (nombre, categoría) del resto.
- [ ] **Alto — bucket `documents` público sin relación con `min_role`.** Documentado en el bloque 4: el control de acceso por rol es solo de interfaz, no de almacenamiento. Decidir si se acepta o se migra a URLs firmadas.
- [ ] **Medio — formularios públicos sin límite de tasa.** `contact_messages` y `membership_applications` permiten `INSERT` público sin restricción (`WITH CHECK (TRUE)`), lo cual es necesario para su función pero abre la puerta a spam/abuso automatizado. Agregar un mecanismo anti-bot (captcha invisible, o un `rate limit` por IP/Edge Function) antes de que se conviertan en un vector de spam.
- [ ] **Medio — modo mock de autenticación.** Confirmar que el modo "demo" de `AuthContext.tsx` (perfiles falsos de administrador/afiliado) es físicamente imposible de alcanzar en el dominio de producción.
- [ ] **Bajo — variables de entorno.** `.env` ya está correctamente excluido en `.gitignore`; confirmar que nunca se subió una copia anterior al historial de control de versiones (si el proyecto tiene repositorio Git, revisar el historial con `git log --all -- .env`; si no lo tiene, no aplica).
- [ ] **General.** Repetir, para cada tabla nueva creada en este documento (`ai_provider_settings`, `content_blocks`, `promo_popups`), el mismo patrón de RLS ya usado en el resto del esquema: lectura pública solo donde corresponda, escritura exclusiva de `is_admin()`.
- [ ] **General.** Verificar que la función `is_admin()` sigue siendo `SECURITY DEFINER STABLE` en todas las políticas nuevas, para evitar recursión infinita de RLS al consultarla desde dentro de otra política.

---

## 18. Orden de ejecución sugerido (fases)

No es obligatorio, pero minimiza retrabajo por dependencias técnicas:

1. **Fase de cimientos (seguridad primero):** Bloque 7 (login/registro), Bloque 15 en su parte de llaves expuestas (migrar Resend/WhatsApp a Edge Functions) y Bloque 6 en su parte de la vista pública segura. Nada de lo demás debe construirse sobre una base de autenticación rota o con llaves ya filtradas.
2. **Fase de plataforma:** Bloque 1 (Edge Function `ai-proxy`, `content_blocks`, `ai_provider_settings`) — es la base técnica que reutilizan los bloques 10 y parcialmente 0.
3. **Fase de corrección visible:** Bloque 0 (Navbar), Bloque 12 (imágenes), Bloque 13 (mapa) — arreglos de experiencia visibles de inmediato para el usuario final, de bajo riesgo.
4. **Fase de afiliados:** Bloques 4, 5, 6 (documentos, pagos, carnet — completar lo que ya existe) y Bloque 3 (Lichess, fase 1 iframe).
5. **Fase de administración y contenido:** Bloque 8 (solicitud de afiliación + política de datos), Bloque 9 (pop-ups), Bloque 10 (blog con IA), Bloque 11 (descarga de comprobantes).
6. **Fase de cierre:** Bloque 14 (consolidar y ejecutar todas las migraciones pendientes como una unidad revisada) y Bloque 15 completo como checklist final de aceptación antes de considerar cerrada esta Parte II.

---

## 19. Checklist de cierre de la Parte II

- [ ] Todos los bloques 0 a 13 tienen sus criterios de aceptación verificados con evidencia (captura, prueba manual documentada o prueba automatizada).
- [ ] El checklist de seguridad del Bloque 15 está en cero pendientes críticos y altos.
- [ ] `supabase_schema.sql` se actualizó para reflejar el estado final de la base de datos (no queda desincronizado de lo que realmente existe en Supabase).
- [ ] `readme.md` y/o `SUPABASE_SETUP_GUIDE.md` se actualizan con cualquier variable de entorno nueva (por ejemplo, los *secrets* de la Edge Function `ai-proxy`) y con la nueva estructura de páginas/tablas.
- [ ] Ninguna tarea marcada como completada depende de un dato de prueba o de un modo mock que no se comporte igual en producción.
