import React from 'react';
import { Clock, Users, BookOpen, Monitor } from 'lucide-react';

export const StatsSection: React.FC = () => {
  const stats = [
    {
      icon: <Clock size={28} />,
      num: '+12',
      label: 'Años de trayectoria',
      sub: 'Formando desde el primer movimiento',
    },
    {
      icon: <Users size={28} />,
      num: '+1000',
      label: 'Deportistas formados',
      sub: 'Niños, jóvenes y adultos',
    },
    {
      icon: <BookOpen size={28} />,
      num: '4',
      label: 'Programas de formación',
      sub: 'Infantil, juvenil, adultos y online',
    },
    {
      icon: <Monitor size={28} />,
      num: '2',
      label: 'Modalidades',
      sub: 'Presencial en Sabaneta y online',
    },
  ];

  return (
    <section className="section section--dark" style={{ paddingBlock: 'clamp(3rem, 2rem + 4vw, 5rem)' }}>
      <div className="wrap">
        <div className="sec-head sec-head--center" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span className="pill pill--gold">El club en cifras</span>
          <h2 className="display display--gold" style={{ marginTop: '1rem' }}>
            Doce años que se notan
          </h2>
        </div>

        <div className="stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem' }}>
          {stats.map((stat, idx) => (
            <div key={idx} className="stat" style={{ textAlign: 'center', padding: '1.5rem', background: '#111', borderRadius: '12px', border: '1px solid #222' }}>
              <span className="stat__icon" style={{ display: 'inline-flex', color: 'var(--gold)', marginBottom: '0.8rem' }}>
                {stat.icon}
              </span>
              <div className="stat__num" style={{ fontSize: 'var(--step-4)', fontFamily: 'var(--ff-display)', color: '#fff' }}>
                {stat.num}
              </div>
              <div className="stat__label" style={{ fontWeight: 600, color: 'var(--gold)', marginTop: '0.4rem' }}>
                {stat.label}
              </div>
              <div className="stat__sub" style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.2rem' }}>
                {stat.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
