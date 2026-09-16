import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Target, Award, Heart, CheckCircle2 } from 'lucide-react';

export const ClubView: React.FC = () => {
  return (
    <div style={{ paddingTop: 'calc(var(--header-h) + 2rem)' }}>
      {/* Cabecera de Sección */}
      <section className="section section--dark" style={{ textAlign: 'center', paddingBlock: '3rem' }}>
        <div className="wrap-narrow">
          <span className="pill pill--gold">Historia e Identidad</span>
          <h1 className="display display--gold" style={{ fontSize: 'var(--step-4)', marginTop: '1rem' }}>
            Club Deportivo de Ajedrez Capablanca Sabaneta
          </h1>
          <p style={{ color: '#ccc', fontSize: '1.2rem', marginTop: '1rem', lineHeight: 1.6 }}>
            Más de 12 años formando deportistas y seres humanos íntegros en el sur del Valle de Aburrá.
          </p>
        </div>
      </section>

      {/* Misión y Visión */}
      <section className="section" style={{ background: '#fff', color: '#111' }}>
        <div className="wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
          <div>
            <span className="kicker" style={{ color: 'var(--gold-deep)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.85rem' }}>
              Nuestra Misión
            </span>
            <h2 className="display display--ink" style={{ fontSize: 'var(--step-3)', margin: '0.5rem 0 1.2rem' }}>
              Enseñar a pensar antes de mover
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#444', lineHeight: 1.7, marginBottom: '1rem' }}>
              El Club Deportivo de Ajedrez Capablanca Sabaneta es una entidad dedicada a la enseñanza, fomento y práctica del ajedrez en todos los niveles. Desde niños de 4 años hasta adultos mayores, consideramos el ajedrez como un puente hacia la concentración, el cálculo metódico y la resiliencia emocional.
            </p>
            <p style={{ fontSize: '1.05rem', color: '#444', lineHeight: 1.7, marginBottom: '1.5rem' }}>
              Nuestra sede en el CC Aves María en Sabaneta, Antioquia, es un punto de encuentro cálido donde convergen la camaradería de barrio y el rigor competitivo de los torneos federados.
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {[
                'Afiliación formal a la Liga de Ajedrez de Antioquia',
                'Entrenadores titulados y con trayectoria pedagógica',
                'Participación regular en campeonatos departamentales y nacionales',
                'Metodología adaptada a cada etapa evolutiva del deportista',
              ].map((item, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#222' }}>
                  <CheckCircle2 size={18} color="#D32F2F" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
            <img
              src="/assets/img/delegacion-escalinatas.webp"
              alt="Delegación completa del club con familias y entrenadores"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        </div>
      </section>

      {/* Valores del Club */}
      <section className="section section--soft" style={{ background: '#f5f5f5', color: '#111' }}>
        <div className="wrap">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="pill" style={{ background: '#000', color: 'var(--gold)' }}>Pilares Fundamentales</span>
            <h2 className="display display--ink" style={{ marginTop: '0.8rem' }}>Nuestros Valores</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
            {[
              { icon: <Shield size={32} color="#F5C518" />, title: 'Caballerosidad & Respeto', desc: 'Aceptamos la victoria con humildad y la derrota como una oportunidad invaluable de aprendizaje.' },
              { icon: <Target size={32} color="#F5C518" />, title: 'Disciplina & Rigor', desc: 'El talento sin constancia no basta. Fomentamos el estudio diario y la paciencia en el cálculo.' },
              { icon: <Heart size={32} color="#D32F2F" />, title: 'Espíritu de Familia', desc: 'El acompañamiento familiar es la pieza clave para que los niños amen y disfruten del deporte.' },
              { icon: <Award size={32} color="#F5C518" />, title: 'Excelencia Integral', desc: 'Buscamos formar tanto a deportistas de alto nivel como a ciudadanos éticos y reflexivos.' },
            ].map((val, idx) => (
              <div key={idx} style={{ background: '#fff', padding: '2rem', borderRadius: '14px', border: '1px solid #e2e2e2' }}>
                <div style={{ marginBottom: '1rem' }}>{val.icon}</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.6rem' }}>{val.title}</h3>
                <p style={{ color: '#666', fontSize: '0.95rem', lineHeight: 1.6 }}>{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section section--dark" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
        <div className="wrap-narrow">
          <h2 className="display display--gold" style={{ marginBottom: '1rem' }}>
            Únete a la Familia Capablanca
          </h2>
          <p style={{ color: '#ccc', marginBottom: '2rem', fontSize: '1.1rem' }}>
            Visítanos en nuestra sede en el tercer piso del CC Aves María en Sabaneta o comunícate directamente con nuestro equipo directivo.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/contacto" className="btn btn--primary">
              Contactar al Club
            </Link>
            <Link to="/afiliados" className="btn btn--ghost">
              Portal de Afiliados
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
