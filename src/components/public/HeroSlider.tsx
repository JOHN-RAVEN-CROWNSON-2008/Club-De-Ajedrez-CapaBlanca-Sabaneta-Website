import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

const SLIDES = [
  { src: '/assets/img/club-galeria-04.webp', alt: 'Alumnos y entrenadores del club reunidos frente al mural de ajedrez' },
  { src: '/assets/img/delegacion-escalinatas.webp', alt: 'Delegación completa del club con familias y entrenadores antes de un torneo' },
  { src: '/assets/img/equipo-infantil-trofeos.webp', alt: 'Categoría infantil del club posando con sus trofeos tras una premiación' },
  { src: '/assets/img/campeon-sub8.webp', alt: 'Alumnos y entrenadores celebrando con el trofeo de Campeón Sub-8' },
  { src: '/assets/img/equipo-adultos-torneo.webp', alt: 'Equipo de adultos del club con el uniforme oficial durante un torneo' },
  { src: '/assets/img/delegacion-coliseo.webp', alt: 'Deportistas del club en el coliseo durante una jornada de torneo' },
  { src: '/assets/img/ninos-celebrando.webp', alt: 'Niños del club celebrando con las manos en alto' },
  { src: '/assets/img/premiacion-aves-maria.webp', alt: 'Jugadores del club en la premiación de un torneo en CC Aves María' },
  { src: '/assets/img/entrenadores-alumno.webp', alt: 'Dos entrenadores del club acompañando a un alumno con su trofeo' },
  { src: '/assets/img/seleccion-colombia.webp', alt: 'Selección Colombia de ajedrez ante las banderas de los países participantes' },
];

const TYPEWRITER_PHRASES = [
  'formando deportistas',
  'formando seres humanos íntegros',
  'llevando delegaciones a competir',
  'enseñando a pensar antes de mover',
];

export const HeroSlider: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Auto avance del carrusel de fotos cada 4 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Efecto máquina de escribir
  useEffect(() => {
    const targetPhrase = TYPEWRITER_PHRASES[phraseIndex];
    const typingSpeed = isDeleting ? 40 : 80;

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setText(targetPhrase.substring(0, text.length + 1));
        if (text.length + 1 === targetPhrase.length) {
          setTimeout(() => setIsDeleting(true), 1500);
        }
      } else {
        setText(targetPhrase.substring(0, text.length - 1));
        if (text.length === 0) {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % TYPEWRITER_PHRASES.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, phraseIndex]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  };

  return (
    <section className="hero">
      {/* Slider de imágenes de fondo */}
      <div className="hero__slider" aria-label="Fotografías del Club Capablanca Sabaneta" role="region">
        {SLIDES.map((slide, index) => (
          <div
            key={slide.src}
            className={`hero__slide ${index === currentSlide ? 'is-active' : ''}`}
            style={{
              opacity: index === currentSlide ? 1 : 0,
              transition: 'opacity 0.8s ease-in-out',
              position: 'absolute',
              inset: 0,
            }}
          >
            <img src={slide.src} alt={slide.alt} width="1440" height="1440" />
          </div>
        ))}
      </div>

      <div className="hero__scrim"></div>
      <div className="hero__checker"></div>

      <button className="hero__arrow hero__arrow--prev" type="button" onClick={prevSlide} aria-label="Imagen anterior">
        <ChevronLeft size={24} />
      </button>
      <button className="hero__arrow hero__arrow--next" type="button" onClick={nextSlide} aria-label="Imagen siguiente">
        <ChevronRight size={24} />
      </button>

      <div className="wrap hero__inner">
        <img
          className="hero__badge"
          src="/assets/img/logo-capablanca.png"
          alt="Escudo del Club Escuela de Ajedrez Capablanca"
          width="186"
          height="192"
        />

        <span className="pill">Club Deportivo de Ajedrez</span>

        <h1 className="display display--poster hero__title">
          Formamos campeones dentro y fuera del <em>tablero</em>
        </h1>

        <p
          className="hero__text"
          style={{
            fontSize: 'var(--step-2)',
            fontFamily: 'var(--ff-banner)',
            textTransform: 'uppercase',
            letterSpacing: '.04em',
            marginBottom: '-.4rem',
            minHeight: '2.4rem',
          }}
        >
          Más de 12 años <span style={{ color: 'var(--gold)', borderBottom: '2px solid var(--gold)' }}>{text}</span>
        </p>

        <p className="ribbon">¡Inscripciones abiertas!</p>

        <p className="hero__text">
          Del primer movimiento al podio, con acompañamiento real en cada partida.
          Clases presenciales en Sabaneta y online desde donde estés.
        </p>

        <ul className="hero__checks">
          <li className="check">
            <span className="check__box"><Check size={16} color="#000" /></span>
            <span><b>Clases</b> para todas las edades</span>
          </li>
          <li className="check">
            <span className="check__box"><Check size={16} color="#000" /></span>
            <span><b>Torneos</b> y competiciones</span>
          </li>
          <li className="check">
            <span className="check__box"><Check size={16} color="#000" /></span>
            <span><b>Entrenamiento</b> y asesoría</span>
          </li>
          <li className="check">
            <span className="check__box"><Check size={16} color="#000" /></span>
            <span><b>Modalidad</b> presencial y online</span>
          </li>
        </ul>

        <div className="btn-row btn-row--center">
          <Link className="btn btn--primary" to="/contacto">
            Quiero inscribirme
          </Link>
          <Link className="btn btn--ghost" to="/programas">
            Ver programas
          </Link>
        </div>
      </div>

      <div className="hero__dots">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            type="button"
            className={`hero__dot ${index === currentSlide ? 'is-active' : ''}`}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Ir a la foto ${index + 1}`}
          />
        ))}
      </div>

      <p className="hero__counter" aria-hidden="true">
        <b>{String(currentSlide + 1).padStart(2, '0')}</b> / <i>{String(SLIDES.length).padStart(2, '0')}</i>
      </p>
    </section>
  );
};
