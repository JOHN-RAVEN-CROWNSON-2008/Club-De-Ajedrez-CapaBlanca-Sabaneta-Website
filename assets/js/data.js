/* ============================================================
   CONTENIDO EDITABLE DEL SITIO
   ------------------------------------------------------------
   Este archivo concentra la información que el club actualiza
   con frecuencia. Editar aquí NO requiere tocar el HTML ni el
   CSS: las páginas se regeneran solas al recargar.

   IMPORTANTE: no publiques datos que no estén confirmados.
   Un calendario vacío muestra un mensaje honesto invitando a
   escribir por WhatsApp; es preferible a inventar fechas.
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
    { src: 'assets/img/equipo-adultos-torneo.webp',   alt: 'Equipo de adultos del club con el uniforme oficial durante un torneo abierto', cap: 'Equipo de adultos en competencia' },
    { src: 'assets/img/club-galeria-04.webp',         alt: 'Delegación completa del club, alumnos y entrenadores, frente al mural de ajedrez de la sede', cap: 'Delegación del club' },
    { src: 'assets/img/entrenadores-alumno.webp',     alt: 'Dos entrenadores del club acompañando a un alumno que sostiene su trofeo', cap: 'Acompañamiento personalizado' },
    { src: 'assets/img/flyer-inscripciones.webp',     alt: 'Pieza gráfica oficial del club anunciando inscripciones abiertas', cap: 'Inscripciones abiertas' },
    { src: 'assets/img/logo-capablanca.png',          alt: 'Escudo circular del Club Escuela de Ajedrez Capablanca', cap: 'Nuestro escudo' }
  ]
};
