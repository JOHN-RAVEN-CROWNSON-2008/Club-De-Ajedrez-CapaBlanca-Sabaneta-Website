import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Lock, FileText, UserCheck, AlertCircle, Mail, Phone, MapPin } from 'lucide-react';

export const DataPrivacyPolicyView: React.FC = () => {
  useEffect(() => {
    document.title = 'Política de Tratamiento de Datos Personales | Club Capablanca Sabaneta';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ paddingTop: 'var(--content-offset)', background: '#0a0a0a', color: '#fff', minHeight: '100vh', paddingBottom: '5rem' }}>
      <div className="wrap-narrow" style={{ paddingTop: '2.5rem' }}>
        
        {/* Enlace de retorno */}
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--gold)',
            fontSize: '0.9rem',
            fontWeight: 600,
            marginBottom: '2rem',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} />
          <span>Volver al inicio</span>
        </Link>

        {/* Encabezado Principal */}
        <div style={{ borderBottom: '1px solid #222', paddingBottom: '2rem', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245, 197, 24, 0.1)', color: 'var(--gold)', padding: '0.35rem 0.8rem', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1rem', border: '1px solid rgba(245, 197, 24, 0.25)' }}>
            <ShieldCheck size={16} />
            <span>Ley Estatutaria 1581 de 2012 · Habeas Data Colombia</span>
          </div>
          <h1 className="display display--gold" style={{ fontSize: 'var(--step-4)', lineHeight: 1.15, margin: '0 0 0.8rem' }}>
            Política de Tratamiento de Datos Personales & Privacidad
          </h1>
          <p style={{ color: '#aaa', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
            Club Deportivo de Ajedrez Capablanca Sabaneta · Versión Oficial Vigente 2026
          </p>
        </div>

        {/* Contenido Legal Estructurado */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', fontSize: '0.98rem', lineHeight: 1.8, color: '#ccc' }}>
          
          {/* 1. Marco Legal */}
          <section style={{ background: '#121212', border: '1px solid #222', borderRadius: '14px', padding: '1.8rem' }}>
            <h2 style={{ color: '#fff', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: 0, marginBottom: '1rem' }}>
              <FileText size={20} color="var(--gold)" />
              1. Marco Legal y Ámbito de Aplicación
            </h2>
            <p>
              El <strong>Club Deportivo de Ajedrez Capablanca Sabaneta</strong>, en cumplimiento de lo consagrado en la Constitución Política de Colombia (artículo 15), la <strong>Ley Estatutaria 1581 de 2012</strong>, su Decreto Reglamentario 1377 de 2013 (incorporado en el Decreto Único 1074 de 2015) y demás normas concordantes, adopta la presente <em>Política de Tratamiento y Protección de Datos Personales</em>.
            </p>
            <p style={{ margin: 0 }}>
              Esta política aplica a todos los datos personales de deportistas afiliados, alumnos, acudientes, entrenadores, árbitros, visitantes web y usuarios registrados en nuestras plataformas digitales, sede presencial y eventos deportivos oficiales.
            </p>
          </section>

          {/* 2. Responsable */}
          <section style={{ background: '#121212', border: '1px solid #222', borderRadius: '14px', padding: '1.8rem' }}>
            <h2 style={{ color: '#fff', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: 0, marginBottom: '1rem' }}>
              <UserCheck size={20} color="var(--gold)" />
              2. Identificación del Responsable del Tratamiento
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
              <li><strong>Razón Social:</strong> Club Deportivo Escuela de Ajedrez Capablanca Sabaneta</li>
              <li><strong>Reconocimiento Deportivo Oficial:</strong> Resolución Inder Sabaneta N° 042</li>
              <li><strong>NIT:</strong> 901.445.892-1</li>
              <li><strong>Domicilio & Sede:</strong> Centro Comercial Aves María, Piso 3, Sabaneta, Antioquia, Colombia</li>
              <li><strong>Teléfono / WhatsApp:</strong> +57 300 254 5835</li>
              <li><strong>Correo Electrónico de Notificaciones:</strong> notificaciones@ajedrezcapablanca.com</li>
            </ul>
          </section>

          {/* 3. Finalidades del Tratamiento */}
          <section style={{ background: '#121212', border: '1px solid #222', borderRadius: '14px', padding: '1.8rem' }}>
            <h2 style={{ color: '#fff', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: 0, marginBottom: '1rem' }}>
              <Lock size={20} color="var(--gold)" />
              3. Finalidades de la Recolección de Datos
            </h2>
            <p>
              Los datos personales recolectados a través de formularios físicos o de la plataforma web serán tratados con las siguientes finalidades legítimas y específicas:
            </p>
            <ol style={{ paddingLeft: '1.2rem', margin: '0 0 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><strong>Gestión de Afiliación & Ficha Deportiva:</strong> Creación y administración de la membresía de deportistas, control de categorías (iniciación, juvenil, alta competencia, adultos) y escalafón interno.</li>
              <li><strong>Carnetización & Certificación Oficial:</strong> Emisión de carnets digitales con código QR de verificación y diplomas de participación o mérito deportivo consultables en la URL pública <code>/verificar</code>.</li>
              <li><strong>Inscripción en Competencias Oficiales:</strong> Reporte y preinscripción ante la Liga de Ajedrez de Antioquia, Federación Colombiana de Ajedrez (FECODAZ) y la Federación Internacional de Ajedrez (FIDE) para la asignación o cálculo de Rating Elo.</li>
              <li><strong>Control de Asistencia & Cumplimiento Técnico:</strong> Planilla de asistencia a entrenamientos para el seguimiento pedagógico y reporte legal ante el Instituto de Deportes y Recreación de Sabaneta (Inder Sabaneta).</li>
              <li><strong>Gestión Financiera & Tesorería:</strong> Recepción y auditoría de comprobantes de pago de cuotas mensuales de sostenimiento e inscripciones a torneos.</li>
              <li><strong>Comunicaciones Deportivas:</strong> Envío de circulares, recordatorios de rondas de torneos, horarios de clases y novedades institucionales vía correo electrónico o WhatsApp.</li>
            </ol>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#999' }}>
              El Club <strong>no comercializa, cede ni transfiere</strong> bases de datos personales a terceros con propósitos publicitarios ajenos a la actividad deportiva.
            </p>
          </section>

          {/* 4. Protección Especial de Menores de Edad */}
          <section style={{ background: '#1f1610', border: '1px solid #b45309', borderRadius: '14px', padding: '1.8rem' }}>
            <h2 style={{ color: '#f59e0b', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: 0, marginBottom: '1rem' }}>
              <AlertCircle size={20} />
              4. Tratamiento Especial de Niños, Niñas y Adolescentes (Menores de Edad)
            </h2>
            <p>
              El Club Deportivo Capablanca cuenta con semilleros de iniciación infantil desde los 4 años. En concordancia con el <strong>artículo 7 de la Ley 1581 de 2012</strong> y el artículo 12 del Decreto 1377 de 2013:
            </p>
            <ul style={{ paddingLeft: '1.2rem', margin: '0 0 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>El tratamiento de datos de menores responde y respeta en todo momento el <strong>interés superior de los niños, niñas y adolescentes</strong> y asegura la prevalencia de sus derechos fundamentales.</li>
              <li>Todo registro, afiliación, participación en torneos o captura de fotografías institucionales de deportistas menores de edad <strong>debe contar con la autorización previa, expresa e informada de sus padres, acudientes o representantes legales</strong>.</li>
              <li>Los datos médicos reportados (EPS/ARS, alergias o condiciones físicas) tienen carácter de datos sensibles y son tratados bajo estrictas medidas de confidencialidad para garantizar la integridad y seguridad en sala de juego y viajes de delegación.</li>
            </ul>
          </section>

          {/* 5. Derechos de los Titulares (Habeas Data) */}
          <section style={{ background: '#121212', border: '1px solid #222', borderRadius: '14px', padding: '1.8rem' }}>
            <h2 style={{ color: '#fff', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: 0, marginBottom: '1rem' }}>
              <ShieldCheck size={20} color="var(--gold)" />
              5. Derechos de los Titulares de la Información
            </h2>
            <p>
              Conforme al artículo 8 de la Ley 1581 de 2012, usted o su representante legal tienen derecho a:
            </p>
            <ul style={{ paddingLeft: '1.2rem', margin: '0 0 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><strong>Conocer, actualizar y rectificar</strong> sus datos personales frente al Club Capablanca frente a datos parciales, inexactos, incompletos o fraccionados.</li>
              <li><strong>Solicitar prueba</strong> de la autorización otorgada para el tratamiento de sus datos.</li>
              <li><strong>Ser informado</strong> previa solicitud respecto del uso que se le ha dado a sus datos personales.</li>
              <li><strong>Presentar quejas</strong> ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la ley.</li>
              <li><strong>Revocar la autorización</strong> y/o solicitar la supresión del dato cuando en el tratamiento no se respeten los principios constitucionales y legales.</li>
              <li><strong>Acceder en forma gratuita</strong> a sus datos personales que hayan sido objeto de tratamiento.</li>
            </ul>
          </section>

          {/* 6. Canales de Atención y Procedimiento */}
          <section style={{ background: '#121212', border: '1px solid #222', borderRadius: '14px', padding: '1.8rem' }}>
            <h2 style={{ color: '#fff', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: 0, marginBottom: '1rem' }}>
              <Mail size={20} color="var(--gold)" />
              6. Procedimiento para Consultas, Reclamos y Habeas Data
            </h2>
            <p>
              Para ejercer cualquiera de sus derechos, formular consultas o solicitar la actualización/supresión de sus datos, puede presentar una comunicación escrita indicando su nombre completo, documento de identidad y petición concreta a través de:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1rem', marginBottom: '1rem' }}>
              <div style={{ background: '#181818', padding: '1rem', borderRadius: '8px', border: '1px solid #282828' }}>
                <strong style={{ color: 'var(--gold)', display: 'block', marginBottom: '0.3rem' }}>Correo Electrónico Oficial:</strong>
                <a href="mailto:notificaciones@ajedrezcapablanca.com" style={{ color: '#fff', wordBreak: 'break-all' }}>
                  notificaciones@ajedrezcapablanca.com
                </a>
              </div>
              <div style={{ background: '#181818', padding: '1rem', borderRadius: '8px', border: '1px solid #282828' }}>
                <strong style={{ color: 'var(--gold)', display: 'block', marginBottom: '0.3rem' }}>Atención Presencial / Escrita:</strong>
                <span style={{ color: '#ddd' }}>CC Aves María, Piso 3 · Sabaneta, Antioquia</span>
              </div>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#999', margin: 0 }}>
              <strong>Tiempos de respuesta legales:</strong> Las consultas serán atendidas en un término máximo de diez (10) días hábiles. Los reclamos o solicitudes de supresión serán resueltos en un término máximo de quince (15) días hábiles, contados a partir del día siguiente a la fecha de su recibo.
            </p>
          </section>

          {/* 7. Política de Cookies y Almacenamiento Local */}
          <section style={{ background: '#121212', border: '1px solid #222', borderRadius: '14px', padding: '1.8rem' }}>
            <h2 style={{ color: '#fff', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: 0, marginBottom: '1rem' }}>
              <Lock size={20} color="var(--gold)" />
              7. Política de Cookies & Almacenamiento Local (Local Storage)
            </h2>
            <p>
              Nuestra plataforma web utiliza almacenamiento local del navegador (<code>localStorage</code>) exclusivamente con propósitos técnicos indispensables:
            </p>
            <ul style={{ paddingLeft: '1.2rem', margin: '0 0 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><strong>Persistencia de Sesión Segura:</strong> Mantener la autenticación del usuario en el portal de afiliados o panel de administración de manera cifrada.</li>
              <li><strong>Frecuencia de Pop-ups y Avisos:</strong> Registrar cuándo fue visualizado un anuncio promocional para no saturar al usuario en cada visita (control <code>once_per_session</code> o <code>once_per_day</code>).</li>
              <li><strong>Preferencias del Tablero:</strong> Recordar preferencias de interfaz del visor de partidas PGN y reloj digital.</li>
            </ul>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#999' }}>
              No utilizamos cookies de rastreo entre sitios (cross-site tracking) de redes publicitarias externas.
            </p>
          </section>

          {/* 8. Vigencia */}
          <section style={{ background: '#121212', border: '1px solid #222', borderRadius: '14px', padding: '1.8rem' }}>
            <h2 style={{ color: '#fff', fontSize: '1.25rem', marginTop: 0, marginBottom: '0.8rem' }}>
              8. Vigencia y Actualización de la Política
            </h2>
            <p style={{ margin: 0 }}>
              La presente política rige a partir del <strong>1 de enero de 2026</strong> y se mantendrá vigente mientras el Club Deportivo Escuela de Ajedrez Capablanca Sabaneta ejerza sus actividades deportivas y pedagógicas. Cualquier modificación sustancial será informada a través del sitio web oficial o mediante comunicación a los correos electrónicos registrados de los afiliados.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
};
