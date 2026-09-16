import React from 'react';
import { Star, Trophy, MapPin, Phone, CheckCircle2 } from 'lucide-react';

export const Ticker: React.FC = () => {
  const items = [
    { icon: <Star size={16} />, text: 'Inscripciones abiertas' },
    { icon: <CheckCircle2 size={16} />, text: 'Clases para todas las edades' },
    { icon: <Trophy size={16} />, text: 'Torneos y competiciones' },
    { icon: <CheckCircle2 size={16} />, text: 'Presencial y online' },
    { icon: <MapPin size={16} />, text: 'CC Aves María, Sabaneta' },
    { icon: <Phone size={16} />, text: '+57 300 254 5835' },
  ];

  return (
    <div className="ticker" aria-label="Mensajes destacados del club">
      <div className="ticker__track">
        <div className="ticker__group">
          {items.map((item, idx) => (
            <React.Fragment key={`ticker-1-${idx}`}>
              <span className="ticker__item">
                {item.icon}
                <span>{item.text}</span>
              </span>
              <span className="ticker__sep" aria-hidden="true"></span>
            </React.Fragment>
          ))}
        </div>
        <div className="ticker__group" aria-hidden="true">
          {items.map((item, idx) => (
            <React.Fragment key={`ticker-2-${idx}`}>
              <span className="ticker__item">
                {item.icon}
                <span>{item.text}</span>
              </span>
              <span className="ticker__sep" aria-hidden="true"></span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
