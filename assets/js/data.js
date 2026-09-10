/* ============================================================
   CONTENIDO EDITABLE DEL SITIO
   ------------------------------------------------------------
   Este archivo concentra la información que el club actualiza
   con frecuencia. Editar aquí NO requiere tocar el HTML ni el
   CSS: las páginas se regeneran solas al recargar.
   ============================================================ */

window.CLUB = {

  /* ---- Datos de contacto (fuente única de verdad) ---- */
  contacto: {
    telefono: '+57 300 254 5835',
    whatsapp: '573002545835',                 // solo dígitos, con indicativo país
    sede: 'CC Aves María, tercer piso',
    ciudad: 'Sabaneta, Antioquia, Colombia',
    instagram: 'https://www.instagram.com/capablanca_sabaneta/',
    mapa: 'https://www.google.com/maps/search/?api=1&query=Centro+Comercial+Aves+Maria+Sabaneta+Antioquia'
  },

  /* ---- Mensajes predefinidos de WhatsApp ---- */
  mensajes: {
    general: 'Hola, vengo de la página web del Club Capablanca Sabaneta y quiero más información.',
    inscripcion: 'Hola, quiero inscribirme en el Club de Ajedrez Capablanca Sabaneta. ¿Me comparten horarios y valor de la mensualidad?',
    clasePrueba: 'Hola, me gustaría agendar una clase de prueba en el Club Capablanca Sabaneta.',
    torneos: 'Hola, quiero información sobre los próximos torneos del Club Capablanca Sabaneta.'
  },

  /* ------------------------------------------------------------
     MURO SOCIAL — INSTAGRAM
     ------------------------------------------------------------
     `feedUrl` en null = modo curado (lo que está activo hoy):
     se muestran las publicaciones del arreglo `posts`, con las
     imágenes reales del club alojadas en assets/img.

     PARA QUE EL MURO SE ACTUALICE SOLO con cada publicación
     nueva hay que apuntar `feedUrl` a un endpoint JSON. Instagram
     no permite leer un perfil público directamente desde el
     navegador (exige token de acceso y el CORS lo bloquea), así
     que ese endpoint tiene que ser una de estas dos cosas:

       1) Un servicio de terceros que ya resuelve la autenticación
          (Behold.so, LightWidget, SnapWidget...). Tienen plan
          gratuito y entregan un JSON listo para consumir.
          Ejemplo:  feedUrl: 'https://feeds.behold.so/TU_ID_AQUI'

       2) Una función serverless propia (Netlify / Vercel) que
          hable con la Instagram Graph API usando un token de
          larga duración. Requiere que la cuenta del club sea
          Business o Creator y esté enlazada a una página de
          Facebook.

     Formato esperado: arreglo (o {data:[...]}) de objetos con
     { permalink, media_url, caption, media_type, timestamp }.
     Si el endpoint falla, el muro vuelve solo a `posts`.
     ------------------------------------------------------------ */
  instagram: {
    feedUrl: null,
    limit: 8,
    featuredCount: 2,   // cuántas se marcan como "Destacada"

    // Publicaciones curadas. `permalink` apunta al perfil; si tienes
    // el enlace directo de una publicación, pégalo aquí y el enlace
    // llevará exactamente a ella.
    posts: [
      {
        image: 'assets/img/equipo-colombia-santo-domingo.webp',
        caption: 'Equipo de Colombia rumbo a los Juegos Centroamericanos y del Caribe, Santo Domingo. ¡Orgullo del ajedrez colombiano!',
        alt: 'Pieza gráfica del equipo de Colombia de ajedrez rumbo a los Juegos Centroamericanos y del Caribe en Santo Domingo',
        media_type: 'IMAGE'
      },
      {
        image: 'assets/img/campeon-sub8.webp',
        caption: '¡Campeón Sub-8! Otro de nuestros pequeños se sube a lo más alto del podio. El trabajo constante da frutos.',
        alt: 'Alumnos y entrenadores del club celebrando con el trofeo de Campeón Sub-8 y un reloj de ajedrez',
        media_type: 'IMAGE'
      },
      {
        image: 'assets/img/delegacion-escalinatas.webp',
        caption: 'Delegación completa lista para competir. Familias, alumnos y entrenadores: así se mueve Capablanca.',
        alt: 'Delegación completa del club, con familias y entrenadores, posando en unas escalinatas antes de un torneo',
        media_type: 'CAROUSEL_ALBUM'
      },
      {
        image: 'assets/img/equipo-infantil-trofeos.webp',
        caption: 'Premiación de la categoría infantil. Campeones, subcampeones y terceros puestos para el club.',
        alt: 'Niños del club sosteniendo sus trofeos durante una premiación',
        media_type: 'IMAGE'
      },
      {
        image: 'assets/img/delegacion-coliseo.webp',
        caption: 'Noche de torneo en el coliseo. Nuestros deportistas representando al club con el uniforme puesto.',
        alt: 'Alumnos y entrenador del club en el coliseo durante una jornada nocturna de torneo',
        media_type: 'IMAGE'
      },
      {
        image: 'assets/img/premiacion-aves-maria.webp',
        caption: 'Torneo en el Parque Comercial Aves María, nuestra casa. Gracias a todos los que jugaron.',
        alt: 'Grupo de jugadores del club en la premiación de un torneo en el Parque Comercial Aves María',
        media_type: 'CAROUSEL_ALBUM'
      },
      {
        image: 'assets/img/ninos-celebrando.webp',
        caption: 'La mejor parte del ajedrez: la familia que se arma alrededor del tablero.',
        alt: 'Niños del club celebrando con las manos en alto en la calle',
        media_type: 'IMAGE'
      },
      {
        image: 'assets/img/equipo-adultos-torneo.webp',
        caption: 'Los adultos también compiten. Nunca es tarde para volver al tablero.',
        alt: 'Equipo de adultos del club con el uniforme oficial durante un torneo',
        media_type: 'IMAGE'
      }
    ]
  },

  /* ------------------------------------------------------------
     NOTA SOBRE EL SLIDER DEL HERO
     Las 10 fotografías del slider NO se configuran aquí: viven
     directamente en el marcado de index.html, dentro de
     <div class="hero__slider">. Se hace así a propósito para que
     los buscadores las indexen y para que la primera imagen
     cargue de inmediato (es el elemento más grande de la página).
     Para cambiarlas, edita ese bloque en index.html.
     ------------------------------------------------------------ */

  /* ------------------------------------------------------------
     TESTIMONIOS
     ------------------------------------------------------------
     ⚠️ CONTENIDO DE EJEMPLO — NO SON TESTIMONIOS REALES.
     Están aquí para mostrar el diseño del componente. Antes de
     publicar el sitio, reemplázalos por frases reales de padres
     y alumnos (con su autorización) o elimina la sección
     completa de index.html. Publicar reseñas inventadas como si
     fueran auténticas es engañoso y además penalizable.
     ------------------------------------------------------------ */
  testimonios: [
    {
      texto: 'Mi hijo llegó sin saber mover una pieza y hoy pide que lo llevemos a los torneos. Lo que más valoro no es el ajedrez: es la concentración y la paciencia que se trajo para la casa.',
      nombre: 'Testimonio de ejemplo',
      rol: 'Madre de alumno · categoría infantil',
      estrellas: 5
    },
    {
      texto: 'Volví al ajedrez a los cuarenta después de veinte años sin jugar. Pensé que iba a ser el único adulto y me encontré un grupo entero en la misma situación. Ambiente sano y muy buen nivel.',
      nombre: 'Testimonio de ejemplo',
      rol: 'Alumno · grupo de adultos',
      estrellas: 5
    },
    {
      texto: 'Los entrenadores analizan las partidas una por una después de cada torneo. Esa retroalimentación es la que de verdad hace que los niños mejoren de un mes a otro.',
      nombre: 'Testimonio de ejemplo',
      rol: 'Padre de alumno · ruta competitiva',
      estrellas: 5
    }
  ],

  /* ------------------------------------------------------------
     CALENDARIO DE TORNEOS
     Para publicar un torneo, agrega un objeto a este arreglo:

     { fecha:'2026-10-18',            // AAAA-MM-DD (obligatorio)
       titulo:'Torneo Relámpago Interno',
       ritmo:'Blitz 5+3',             // control de tiempo
       categoria:'Abierto',           // Infantil / Juvenil / Abierto...
       lugar:'Sede CC Aves María',
       nota:'Inscripciones hasta el jueves anterior.' }

     Se ordenan automáticamente y los ya pasados se ocultan.
     ------------------------------------------------------------ */
  torneos: [],

  /* ---- Preguntas frecuentes ---- */
  faq: [
    {
      q: '¿Se necesita saber jugar para entrar al club?',
      a: 'No. Recibimos personas desde cero absoluto: enseñamos el movimiento de las piezas, las reglas y el pensamiento táctico desde la primera clase. También tenemos grupos avanzados para quienes ya compiten.'
    },
    {
      q: '¿Desde qué edad pueden empezar los niños?',
      a: 'Trabajamos con niños, jóvenes y adultos. La edad de inicio depende de la madurez de cada niño más que del número: lo evaluamos en una clase de prueba sin costo de compromiso. Escríbenos por WhatsApp y te orientamos.'
    },
    {
      q: '¿Cuáles son los horarios y el valor de la mensualidad?',
      a: 'Manejamos varios grupos y horarios según la edad y el nivel, y los cupos cambian cada periodo. Confirmamos horarios disponibles y tarifas vigentes directamente por WhatsApp al +57 300 254 5835.'
    },
    {
      q: '¿Las clases son presenciales u online?',
      a: 'Ambas. La sede presencial está en el CC Aves María, tercer piso, en Sabaneta, y también dictamos clases y asesorías en modalidad online para quienes viven lejos o viajan.'
    },
    {
      q: '¿Es obligatorio competir en torneos?',
      a: 'No es obligatorio. Hay alumnos que vienen por el gusto de jugar y por los beneficios cognitivos, y hay quienes buscan la ruta competitiva. Acompañamos las dos decisiones y preparamos a quien quiere competir.'
    },
    {
      q: '¿Necesito llevar tablero o equipo propio?',
      a: 'No para empezar. El club dispone del material para las clases. Más adelante, si el alumno entra en ruta competitiva, recomendamos su propio tablero y reloj para practicar en casa.'
    }
  ],

  /* ---- Galería (las rutas apuntan a assets/img/) ---- */
  galeria: [
    { src: 'assets/img/equipo-infantil-trofeos.webp', alt: 'Categoría infantil del Club Capablanca Sabaneta posando con sus trofeos tras una premiación', cap: 'Premiación categoría infantil' },
    { src: 'assets/img/delegacion-escalinatas.webp',  alt: 'Delegación completa del club con familias y entrenadores en las escalinatas antes de un torneo', cap: 'Delegación completa' },
    { src: 'assets/img/campeon-sub8.webp',            alt: 'Alumnos y entrenadores celebrando con el trofeo de Campeón Sub-8 y un reloj de ajedrez', cap: 'Campeón Sub-8' },
    { src: 'assets/img/equipo-adultos-torneo.webp',   alt: 'Equipo de adultos del club con el uniforme oficial durante un torneo abierto', cap: 'Equipo de adultos en competencia' },
    { src: 'assets/img/delegacion-coliseo.webp',      alt: 'Deportistas del club en el coliseo durante una jornada nocturna de torneo', cap: 'Noche de torneo' },
    { src: 'assets/img/ninos-celebrando.webp',        alt: 'Niños del club celebrando con las manos en alto en la calle', cap: 'La familia Capablanca' },
    { src: 'assets/img/premiacion-aves-maria.webp',   alt: 'Jugadores del club en la premiación de un torneo en el Parque Comercial Aves María', cap: 'Torneo en Aves María' },
    { src: 'assets/img/club-galeria-04.webp',         alt: 'Delegación del club, alumnos y entrenadores, frente al mural de ajedrez de la sede', cap: 'En nuestra sede' },
    { src: 'assets/img/entrenadores-alumno.webp',     alt: 'Dos entrenadores del club acompañando a un alumno que sostiene su trofeo', cap: 'Acompañamiento personalizado' },
    { src: 'assets/img/seleccion-colombia.webp',      alt: 'Selección Colombia de ajedrez ante las banderas de los países participantes', cap: 'Ajedrez colombiano' },
    { src: 'assets/img/flyer-inscripciones.webp',     alt: 'Pieza gráfica oficial del club anunciando inscripciones abiertas', cap: 'Inscripciones abiertas' },
    { src: 'assets/img/logo-capablanca.png',          alt: 'Escudo circular del Club Escuela de Ajedrez Capablanca', cap: 'Nuestro escudo' }
  ]
};
