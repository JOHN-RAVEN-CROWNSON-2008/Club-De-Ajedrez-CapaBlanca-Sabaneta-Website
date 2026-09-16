import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { INITIAL_DOCUMENTS, INITIAL_EVENTS } from '../../lib/initialData';
import { ClubDocument, ClubEvent, TournamentRegistration } from '../../types/database';
import { resendService } from '../../services/resendService';
import {
  User, Shield, FileText, Trophy, Download, LogOut, CheckCircle2,
  Calendar, MapPin, Clock, Edit2, Save, X, ExternalLink, Sparkles
} from 'lucide-react';

export const MembersDashboardView: React.FC = () => {
  const { user, logout, updateProfile, isConfigured } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'perfil' | 'documentos' | 'torneos'>('documentos');
  const [documents, setDocuments] = useState<ClubDocument[]>(INITIAL_DOCUMENTS);
  const [events, setEvents] = useState<ClubEvent[]>(INITIAL_EVENTS);
  const [myRegistrations, setMyRegistrations] = useState<string[]>([]);
  const [selectedDocCategory, setSelectedDocCategory] = useState<string>('all');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    ciudad: '',
    categoria_ajedrez: '',
    elo_rating: 0,
    fide_id: '',
  });
  const [notice, setNotice] = useState('');

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!user) {
      navigate('/login-afiliado');
    } else {
      setProfileForm({
        nombre: user.nombre || '',
        apellido: user.apellido || '',
        telefono: user.telefono || '',
        ciudad: user.ciudad || 'Sabaneta',
        categoria_ajedrez: user.categoria_ajedrez || 'Iniciación',
        elo_rating: user.elo_rating || 0,
        fide_id: user.fide_id || '',
      });
    }
  }, [user, navigate]);

  // Cargar documentos y torneos
  useEffect(() => {
    async function loadMemberData() {
      if (!isSupabaseConfigured()) {
        setDocuments(INITIAL_DOCUMENTS);
        setEvents(INITIAL_EVENTS);
        return;
      }

      try {
        const { data: docData } = await supabase.from('documents').select('*');
        if (docData && docData.length > 0) setDocuments(docData as ClubDocument[]);

        const { data: evData } = await supabase.from('events').select('*');
        if (evData && evData.length > 0) setEvents(evData as ClubEvent[]);

        if (user) {
          const { data: regData } = await supabase
            .from('tournament_registrations')
            .select('event_id')
            .eq('user_id', user.id);
          if (regData) {
            setMyRegistrations(regData.map((r) => r.event_id));
          }
        }
      } catch (err) {
        console.error('Error al cargar datos de afiliados:', err);
      }
    }

    loadMemberData();
  }, [user, isConfigured]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await updateProfile(profileForm);
    if (res.success) {
      setEditingProfile(false);
      setNotice('Perfil actualizado exitosamente');
      setTimeout(() => setNotice(''), 3000);
    }
  };

  const handleRegisterTournament = async (event: ClubEvent) => {
    if (!user) return;

    if (myRegistrations.includes(event.id)) {
      setNotice('Ya te encuentras inscrito en este torneo');
      setTimeout(() => setNotice(''), 3000);
      return;
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('tournament_registrations').insert({
          event_id: event.id,
          user_id: user.id,
          status: 'confirmed',
        });
      } catch (err) {
        console.error('Error al registrar inscripción:', err);
      }
    }

    setMyRegistrations((prev) => [...prev, event.id]);

    // Enviar confirmación por correo con Resend
    await resendService.sendTournamentConfirmation(
      user.correo,
      `${user.nombre} ${user.apellido}`,
      event.title,
      event.event_date
    );

    setNotice(`¡Inscripción confirmada para "${event.title}"! Se envió comprobante a tu correo.`);
    setTimeout(() => setNotice(''), 4000);
  };

  if (!user) return null;

  const filteredDocs = documents.filter((doc) => {
    if (selectedDocCategory === 'all') return true;
    return doc.category === selectedDocCategory;
  });

  return (
    <div style={{ paddingTop: 'calc(var(--header-h) + 1.5rem)', background: '#0a0a0a', color: '#fff', minHeight: '100vh' }}>
      
      {/* Barra superior de Afiliado */}
      <div style={{ background: '#141414', borderBottom: '1px solid #252525', padding: '1.2rem 0' }}>
        <div className="wrap" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--gold)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem' }}>
              {user.nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                  {user.nombre} {user.apellido}
                </h1>
                <span style={{ background: '#252525', border: '1px solid var(--gold)', color: 'var(--gold)', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                  Afiliado Activo
                </span>
              </div>
              <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>
                @{user.usuario || 'afiliado'} · {user.correo}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <Link to="/" className="btn btn--ghost btn--sm">
              Ver Web Principal
            </Link>
            <button
              onClick={() => logout().then(() => navigate('/'))}
              className="btn btn--sm"
              style={{ background: '#2e1212', color: '#ff8a80', border: '1px solid #b71c1c', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <LogOut size={14} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notificación temporal */}
      {notice && (
        <div className="wrap" style={{ marginTop: '1rem' }}>
          <div style={{ background: '#1b3a24', border: '1px solid #4caf50', color: '#a5d6a7', padding: '0.8rem 1.2rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckCircle2 size={18} />
            <span>{notice}</span>
          </div>
        </div>
      )}

      {/* Contenedor Principal */}
      <div className="wrap" style={{ paddingBlock: '2.5rem' }}>
        
        {/* Pestañas */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #222', paddingBottom: '0.5rem', marginBottom: '2.5rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('documentos')}
            className={`btn btn--sm ${activeTab === 'documentos' ? 'btn--primary' : 'btn--ghost'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <FileText size={16} />
            <span>Documentos & Recursos ({documents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('torneos')}
            className={`btn btn--sm ${activeTab === 'torneos' ? 'btn--primary' : 'btn--ghost'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Trophy size={16} />
            <span>Inscripción a Torneos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('perfil')}
            className={`btn btn--sm ${activeTab === 'perfil' ? 'btn--primary' : 'btn--ghost'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <User size={16} />
            <span>Ficha Deportiva & Perfil</span>
          </button>
        </div>

        {/* PESTAÑA 1: DOCUMENTOS Y ARCHIVOS COMPARTIDOS */}
        {activeTab === 'documentos' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--gold)' }}>
                  Repositorio Oficial de Documentos y Partidas
                </h2>
                <p style={{ color: '#888', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                  Material descargable exclusivo para miembros del Club Capablanca
                </p>
              </div>

              {/* Categorías de documentos */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['all', 'Reglamento', 'Material de Estudio', 'Partidas PGN', 'Circulares'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedDocCategory(cat)}
                    style={{
                      padding: '0.4rem 0.8rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: selectedDocCategory === cat ? 'var(--gold)' : '#1c1c1c',
                      color: selectedDocCategory === cat ? '#000' : '#ccc',
                      border: '1px solid #333',
                      cursor: 'pointer',
                    }}
                  >
                    {cat === 'all' ? 'Todos' : cat}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    background: '#151515',
                    border: '1px solid #282828',
                    borderRadius: '14px',
                    padding: '1.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase' }}>
                        {doc.category}
                      </span>
                      <span style={{ fontSize: '0.75rem', background: '#222', padding: '0.2rem 0.5rem', borderRadius: '4px', color: '#aaa', textTransform: 'uppercase' }}>
                        {doc.file_type} · {doc.file_size}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.6rem', color: '#fff' }}>
                      {doc.title}
                    </h3>
                    <p style={{ color: '#aaa', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                      {doc.description}
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid #252525', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#666' }}>
                      Descargas: {doc.downloads_count}
                    </span>
                    <button
                      onClick={() => alert(`Descargando documento: ${doc.title}`)}
                      className="btn btn--primary btn--sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Download size={14} />
                      <span>Descargar</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA 2: TORNEOS PARA AFILIADOS */}
        {activeTab === 'torneos' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--gold)' }}>
                Inscripción Directa a Torneos
              </h2>
              <p style={{ color: '#888', fontSize: '0.9rem' }}>
                Como afiliado activo, tus inscripciones se confirman automáticamente y gozan de tarifas preferenciales.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2rem' }}>
              {events.map((evt) => {
                const isInscribed = myRegistrations.includes(evt.id);
                return (
                  <div
                    key={evt.id}
                    style={{
                      background: '#151515',
                      border: isInscribed ? '1px solid #4caf50' : '1px solid #282828',
                      borderRadius: '16px',
                      padding: '2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ background: 'var(--gold)', color: '#000', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>
                          {evt.rhythm}
                        </span>
                        {isInscribed && (
                          <span style={{ color: '#81c784', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                            <CheckCircle2 size={16} /> Preinscrito
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', marginBottom: '0.6rem' }}>
                        {evt.title}
                      </h3>
                      <p style={{ color: '#aaa', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.2rem' }}>
                        {evt.description}
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: '#ccc', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Calendar size={15} color="var(--gold)" />
                          <span>{evt.event_date} · {evt.event_time}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <MapPin size={15} color="var(--gold)" />
                          <span>{evt.location}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #252525', paddingTop: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--gold)' }}>{evt.entry_fee}</span>
                      <button
                        onClick={() => handleRegisterTournament(evt)}
                        disabled={isInscribed}
                        className={`btn btn--sm ${isInscribed ? 'btn--ghost' : 'btn--primary'}`}
                      >
                        {isInscribed ? 'Inscrito ✓' : 'Confirmar Preinscripción'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PESTAÑA 3: FICHA DEPORTIVA Y PERFIL */}
        {activeTab === 'perfil' && (
          <div style={{ maxWidth: '700px' }}>
            <div style={{ background: '#151515', border: '1px solid #282828', borderRadius: '16px', padding: '2.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--gold)', margin: 0 }}>
                  Ficha Deportiva del Afiliado
                </h2>
                {!editingProfile && (
                  <button
                    onClick={() => setEditingProfile(true)}
                    className="btn btn--ghost btn--sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <Edit2 size={14} />
                    <span>Editar mis datos</span>
                  </button>
                )}
              </div>

              {editingProfile ? (
                <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#bbb', marginBottom: '0.4rem' }}>Nombre</label>
                      <input
                        type="text"
                        value={profileForm.nombre}
                        onChange={(e) => setProfileForm({ ...profileForm, nombre: e.target.value })}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#bbb', marginBottom: '0.4rem' }}>Apellido</label>
                      <input
                        type="text"
                        value={profileForm.apellido}
                        onChange={(e) => setProfileForm({ ...profileForm, apellido: e.target.value })}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#bbb', marginBottom: '0.4rem' }}>Teléfono / WhatsApp</label>
                      <input
                        type="tel"
                        value={profileForm.telefono}
                        onChange={(e) => setProfileForm({ ...profileForm, telefono: e.target.value })}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#bbb', marginBottom: '0.4rem' }}>Ciudad</label>
                      <input
                        type="text"
                        value={profileForm.ciudad}
                        onChange={(e) => setProfileForm({ ...profileForm, ciudad: e.target.value })}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#bbb', marginBottom: '0.4rem' }}>Categoría Ajedrez</label>
                      <input
                        type="text"
                        value={profileForm.categoria_ajedrez}
                        onChange={(e) => setProfileForm({ ...profileForm, categoria_ajedrez: e.target.value })}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#bbb', marginBottom: '0.4rem' }}>Elo Rating (Estimado / FIDE)</label>
                      <input
                        type="number"
                        value={profileForm.elo_rating}
                        onChange={(e) => setProfileForm({ ...profileForm, elo_rating: Number(e.target.value) })}
                        style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="submit" className="btn btn--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Save size={16} />
                      <span>Guardar Cambios</span>
                    </button>
                    <button type="button" onClick={() => setEditingProfile(false)} className="btn btn--ghost">
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>Nombre Completo</span>
                    <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', margin: '0.2rem 0 1rem' }}>
                      {user.nombre} {user.apellido}
                    </p>

                    <span style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>Correo Electrónico</span>
                    <p style={{ fontSize: '1rem', color: '#ccc', margin: '0.2rem 0 1rem' }}>
                      {user.correo}
                    </p>

                    <span style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>Teléfono</span>
                    <p style={{ fontSize: '1rem', color: '#ccc', margin: '0.2rem 0' }}>
                      {user.telefono || 'Sin registrar'}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>Categoría en el Club</span>
                    <p style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--gold)', margin: '0.2rem 0 1rem' }}>
                      {user.categoria_ajedrez || 'Iniciación'}
                    </p>

                    <span style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>Elo Rating</span>
                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: '0.2rem 0 1rem' }}>
                      {user.elo_rating || 'En proceso de evaluación'}
                    </p>

                    <span style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase' }}>Ciudad de Residencia</span>
                    <p style={{ fontSize: '1rem', color: '#ccc', margin: '0.2rem 0' }}>
                      {user.ciudad || 'Sabaneta'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
