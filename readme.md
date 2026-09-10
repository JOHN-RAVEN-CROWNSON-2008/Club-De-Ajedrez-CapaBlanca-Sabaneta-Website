# Club Deportivo de Ajedrez Capablanca Sabaneta — Sitio web

Sitio web estático, responsive y sin dependencias de build. Se abre directamente en el
navegador o se sube a cualquier hosting (Netlify, Vercel, GitHub Pages, cPanel) copiando
la carpeta tal cual.

---

## 1. Cómo verlo

**Opción rápida:** doble clic en `index.html`.

**Opción recomendada** (para que las rutas relativas se comporten igual que en
producción), desde esta carpeta:

```bash
python -m http.server 8123
```

Y abrir <http://127.0.0.1:8123>.

---

## 2. Estructura

```
CapablancaClubDeAjedrezWebsite/
├── index.html          Portada
├── club.html           El club: historia, misión, valores, identidad, cuerpo técnico
├── programas.html      Programas, ruta de 6 niveles, metodología y modalidades
├── torneos.html        Calendario, ritmos de juego y cómo participar
├── galeria.html        Galería con visor ampliado
├── contacto.html       Formulario, mapa de Google y preguntas frecuentes
└── assets/
    ├── css/
    │   ├── styles.css      Sistema de diseño base (tokens + componentes)
    │   └── components.css  Slider, muro social, pestañas, contadores, flip cards…
    ├── js/
    │   ├── data.js         >>> CONTENIDO EDITABLE
    │   ├── main.js         Base: progreso, menú, visor, formulario, FAQ
    │   └── components.js   Slider, máquina de escribir, pestañas, muro social…
    └── img/                13 imágenes oficiales del club
```

---

## 3. Dónde se edita el contenido

### 3.1 El slider del hero

Las 10 fotografías del hero están en **`index.html`**, dentro de
`<div class="hero__slider">`. No se configuran en `data.js`: se dejaron en el HTML a
propósito para que Google las indexe y para que la primera imagen cargue de inmediato.

Rota cada 3 segundos. Se pausa al pasar el cursor, al navegar con teclado y cuando la
pestaña deja de estar visible. Acepta flechas del teclado y gestos táctiles.

Para cambiar una imagen, reemplaza el `src` y **actualiza también el `alt`**: es lo que
lee un invidente y lo que indexa el buscador.

### 3.2 Todo lo demás: `assets/js/data.js`

| Clave        | Qué controla                                                |
|--------------|-------------------------------------------------------------|
| `contacto`   | Teléfono, WhatsApp, sede, Instagram, enlace del mapa        |
| `mensajes`   | Textos prellenados al abrir WhatsApp                        |
| `instagram`  | Muro social: modo de feed y publicaciones curadas           |
| `testimonios`| Testimonios de la portada (**hoy son de ejemplo**)          |
| `torneos`    | Calendario de la página de torneos                          |
| `faq`        | Preguntas frecuentes                                        |
| `galeria`    | Fotos de `galeria.html`                                     |

### 3.3 Publicar un torneo

El calendario arranca **vacío a propósito**: mientras no haya fechas confirmadas, la
página muestra un mensaje honesto invitando a escribir por WhatsApp en vez de inventar
convocatorias. Para publicar uno:

```js
torneos: [
  { fecha:'2026-10-18',                 // AAAA-MM-DD
    titulo:'Torneo Relámpago Interno',
    ritmo:'Blitz 5+3',
    categoria:'Abierto',
    lugar:'Sede CC Aves María',
    nota:'Inscripciones hasta el jueves anterior.' }
]
```

Se ordenan solos por fecha y los ya pasados desaparecen automáticamente.

---

## 4. El muro social de Instagram

La sección *"Conecta con nuestra familia Capablanca"* funciona en tres modos. Se
configura en `instagram` dentro de `data.js`.

### Cómo está hoy: modo curado

`feedUrl: null` → el muro muestra las 8 publicaciones del arreglo `posts`, con las
imágenes reales del club servidas desde `assets/img`. Funciona siempre, no depende de
terceros y carga rápido. **Se actualiza a mano.**

### Para que se actualice solo

Aquí hay una limitación técnica que conviene tener clara: **Instagram no permite leer un
perfil público directamente desde el navegador**. Exige un token de acceso y su CORS
bloquea las peticiones desde otro dominio. No existe forma de lograrlo solo con HTML y
JavaScript estático. Hay dos caminos reales:

**Opción A — Servicio de terceros (la más rápida).**
Servicios como Behold.so, LightWidget o SnapWidget resuelven la autenticación y entregan
un JSON listo. Tienen plan gratuito. Una vez tengas la URL:

```js
instagram: {
  feedUrl: 'https://feeds.behold.so/TU_ID_AQUI',
  limit: 8,
  featuredCount: 2,
  posts: [ /* se conservan como respaldo */ ]
}
```

**Opción B — Función serverless propia (la más robusta).**
Una función en Netlify o Vercel que consulte la Instagram Graph API con un token de
larga duración. Requiere que la cuenta del club sea **Business o Creator** y esté
enlazada a una página de Facebook. Da control total y no depende de un tercero.

En ambos casos el formato esperado es un arreglo (o `{data:[...]}`) de objetos con
`{ permalink, media_url, caption, media_type, timestamp }`.

**Si el endpoint falla, el muro vuelve solo a las publicaciones curadas.** La sección
nunca se ve rota.

---

## 5. Sistema de diseño aplicado

El CSS traduce el ADN de marca del club (escudo, uniforme y flyer) a componentes web:

| Elemento de marca                | Cómo se aplica en el sitio                                        |
|----------------------------------|-------------------------------------------------------------------|
| Amarillo/oro + negro             | Paleta base completa en fondos, botones y tarjetas                |
| Blanco                           | Separador y contorno, nunca color protagonista                    |
| **Rojo**                         | **Solo** en la cinta `¡Inscripciones abiertas!` y la etiqueta "Más elegido" |
| Titular del flyer                | `.display--poster`: negra mayúscula, relleno blanco, contorno negro |
| Píldora negra con texto dorado   | `.pill`                                                           |
| Cinta roja de extremos plegados  | `.ribbon` (recorte por `clip-path`, sin imágenes)                 |
| Casilla negra con visto dorado   | `.check`                                                          |
| Bloque diagonal del uniforme     | `.jcard` — cabecera con degradado oro → banda blanca → negro      |
| Damero del escudo                | Textura del hero, menú móvil, ticker y CTA                        |
| Escudo circular                  | Encabezado, ancla del hero, preloader y favicon                   |

Tipografías: **Archivo Black** (titulares), **Barlow Condensed** (botones, etiquetas y
cintas), **Inter** (texto corrido) y **Caveat** (guiño manuscrito al texto curvo del escudo).

---

## 6. Componentes y efectos incluidos

Barra de progreso de lectura · preloader · slider del hero con Ken Burns, puntos, flechas,
gestos táctiles y autoplay · ticker/marquesina · contadores animados · máquina de escribir ·
barras de habilidad · pestañas accesibles · flip cards · acordeón · modales · testimonios con
estrellas · línea de tiempo · cajas de precio · cajas de icono · muro social · visor de
imágenes con teclado · mapa de Google · botón flotante de WhatsApp · volver arriba ·
aparición progresiva con cuatro direcciones · parallax suave · efectos de realce al pasar
el cursor.

**Accesibilidad y rendimiento:** todo respeta `prefers-reduced-motion`, el slider y el
parallax se detienen si el usuario lo pide, las imágenes usan `loading="lazy"` salvo la
primera del hero, el texto de la máquina de escribir se expone estático a los lectores de
pantalla, y hay hoja de estilos de impresión.

---

## 7. ⚠️ Contenido que hay que revisar antes de publicar

Estos puntos son **provisionales** y están marcados en el código:

1. **Testimonios de la portada** (`data.js` → `testimonios`). Son de ejemplo, no son
   reales. Reemplázalos por frases auténticas con autorización de sus autores, o elimina
   la sección de `index.html`. Publicar reseñas inventadas como auténticas es engañoso.
2. **Sección "Modalidades"** de `programas.html`. Las intensidades y lo que incluye cada
   plan son una propuesta para trabajar con el equipo de marketing, no la oferta oficial.
   Lleva una nota visible que lo aclara.
3. **La cifra "+1000 deportistas formados"** aparece en portada, club y programas.
   Confírmala antes de publicar; si no hay respaldo, cámbiala o quítala.
4. **La ruta de 6 niveles** (Peón → Rey) de `programas.html` es una propuesta pedagógica,
   no el plan de estudios real del club.
5. **Imágenes de la Selección Colombia.** Están en el slider y el muro social porque
   provienen del Instagram del club, pero el sitio no afirma que el club represente a
   Colombia. Si la relación es otra, ajusta los textos alternativos.
6. **Horarios y tarifas.** El sitio remite a WhatsApp en lugar de mostrar una tabla.
7. **Nombres y perfiles de los entrenadores.** La sección de cuerpo técnico describe
   funciones, no personas.
8. **Dominio propio** para completar `og:image` y el `canonical`.

### Datos confirmados (del flyer oficial)

Nombre del club · más de 12 años de trayectoria · clases para todas las edades · torneos y
competiciones · entrenamiento y asesoría · modalidad presencial y online ·
WhatsApp +57 300 254 5835 · CC Aves María, tercer piso, Sabaneta, Antioquia.

---

## 8. Publicación

No requiere compilación. Subir el contenido de esta carpeta a la raíz del hosting.

- **Netlify / Vercel:** arrastrar la carpeta; sin comando de build ni carpeta de salida.
- **GitHub Pages:** subir a la rama configurada y activar Pages en la raíz.
- **Hosting tradicional:** copiar todo por FTP a `public_html/`.
