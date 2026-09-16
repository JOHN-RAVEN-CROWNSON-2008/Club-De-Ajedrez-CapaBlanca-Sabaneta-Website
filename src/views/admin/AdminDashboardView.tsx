import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  INITIAL_SETTINGS, INITIAL_EVENTS, INITIAL_POSTS, INITIAL_DOCUMENTS,
  MOCK_MEMBER_PROFILE, MOCK_ADMIN_PROFILE
} from '../../lib/initialData';
import { SiteSettings, ClubEvent, Post, ClubDocument, UserProfile, ContactMessage } from '../../types/database';
import {
  ShieldCheck, LayoutDashboard, Globe, Trophy, BookOpen, FileText,
  Users, Mail, LogOut, Plus, Trash2, Edit, Save, CheckCircle2, AlertCircle
} from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState<'overview' | 'content' | 'events' | 'blog' | 'documents' | 'members' | 'messages'>('overview');
  const [settings, setSettings] = useState<SiteSettings>(INITIAL_SETTINGS);
  const [events, setEvents] = useState<ClubEvent[]>(INITIAL_EVENTS);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [documents, setDocuments] = useState<ClubDocument[]>(INITIAL_DOCUMENTS);
  const [members, setMembers] = useState<UserProfile[]>([MOCK_ADMIN_PROFILE, MOCK_MEMBER_PROFILE]);
  const [messages, setMessages] = useState<ContactMessage[]>([
    {
      id: 'msg-1',
      name: 'Carlos Montoya',
      email: 'carlos.montoya@gmail.com',
      phone: '315 889 0012',
      subject: 'Inscripción a Clases',
      message: 'Buenas tardes, quisiera información para matricular a mi hijo de 7 años en las clases de los sábados.',
      status: 'unread',
      created_at: new Date().toISOString(),
    }
  ]);
  const [notice, setNotice] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Formularios modales o de creación
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '03:00 PM',
    location: 'Sede CC Aves María, Sabaneta',
    rhythm: 'Blitz 3+2',
    category: 'Abierto',
    entry_fee: 'Gratis afiliados / $20.000 externos',
  });

  const [showPostModal, setShowPostModal] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'Formativo',
    cover_image: 'assets/img/club-galeria-04.webp',
  });

  const [showDocModal, setShowDocModal] = useState(false);
  const [newDoc, setNewDoc] = useState({
    title: '',
    description: '',
    category: 'Material de Estudio' as const,
    file_type: 'pdf',
    file_size: '2.1 MB',
    file_url: '#',
  });

  // Validar permisos de administrador
  useEffect(() => {
    if (!user) {
      navigate('/admin/login');
    } else if (role !== 'admin' && user.role !== 'admin') {
      navigate('/afiliados');
    }
  }, [user, role, navigate]);

  // Cargar datos reales si Supabase está conectado
  useEffect(() => {
    async function fetchAdminData() {
      if (!isSupabaseConfigured()) return;

      try {
        const { data: setts } = await supabase.from('site_settings').select('*').single();
        if (setts) setSettings(setts as SiteSettings);

        const { data: evts } = await supabase.from('events').select('*').order('created_at', { ascending: false });
        if (evts) setEvents(evts as ClubEvent[]);

        const { data: pst } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
        if (pst) setPosts(pst as Post[]);

        const { data: docs } = await supabase.from('documents').select('*');
        if (docs) setDocuments(docs as ClubDocument[]);

        const { data: profs } = await supabase.from('profiles').select('*');
        if (profs && profs.length > 0) setMembers(profs as UserProfile[]);

        const { data: msgs } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
        if (msgs && msgs.length > 0) setMessages(msgs as ContactMessage[]);
      } catch (err) {
        console.error('Error al sincronizar datos de Supabase en Admin:', err);
      }
    }

    fetchAdminData();
  }, []);

  const triggerNotice = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotice({ msg, type });
    setTimeout(() => setNotice(null), 3500);
  };

  // Guardar configuración del CMS
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('site_settings').upsert({ ...settings, id: 'general' });
      } catch (err) {
        console.error('Error al guardar configuración en Supabase:', err);
      }
    }
    triggerNotice('Configuración del sitio web actualizada con éxito');
  };

  // Crear Torneo
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const eventItem: ClubEvent = {
      id: 'ev-' + Date.now(),
      title: newEvent.title,
      slug: newEvent.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: newEvent.description,
      event_date: newEvent.event_date,
      event_time: newEvent.event_time,
      location: newEvent.location,
      rhythm: newEvent.rhythm,
      category: newEvent.category,
      entry_fee: newEvent.entry_fee,
      capacity: 32,
      is_open: true,
      status: 'upcoming',
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('events').insert({
          title: eventItem.title,
          slug: eventItem.slug,
          description: eventItem.description,
          event_date: eventItem.event_date,
          event_time: eventItem.event_time,
          location: eventItem.location,
          rhythm: eventItem.rhythm,
          category: eventItem.category,
          entry_fee: eventItem.entry_fee,
          is_open: true,
        });
      } catch (err) {
        console.error('Error al insertar evento:', err);
      }
    }

    setEvents([eventItem, ...events]);
    setShowEventModal(false);
    setNewEvent({
      title: '',
      description: '',
      event_date: '',
      event_time: '03:00 PM',
      location: 'Sede CC Aves María, Sabaneta',
      rhythm: 'Blitz 3+2',
      category: 'Abierto',
      entry_fee: 'Gratis afiliados / $20.000 externos',
    });
    triggerNotice('Torneo creado exitosamente');
  };

  // Eliminar Torneo
  const handleDeleteEvent = async (id: string) => {
    if (isSupabaseConfigured()) {
      await supabase.from('events').delete().eq('id', id);
    }
    setEvents(events.filter((e) => e.id !== id));
    triggerNotice('Torneo eliminado');
  };

  // Crear Post de Blog
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const postItem: Post = {
      id: 'post-' + Date.now(),
      title: newPost.title,
      slug: newPost.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      excerpt: newPost.excerpt,
      content: newPost.content,
      cover_image: newPost.cover_image,
      category: newPost.category,
      published: true,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('posts').insert(postItem);
      } catch (err) {
        console.error('Error al insertar post:', err);
      }
    }

    setPosts([postItem, ...posts]);
    setShowPostModal(false);
    setNewPost({ title: '', excerpt: '', content: '', category: 'Formativo', cover_image: 'assets/img/club-galeria-04.webp' });
    triggerNotice('Artículo publicado exitosamente');
  };

  // Eliminar Post
  const handleDeletePost = async (id: string) => {
    if (isSupabaseConfigured()) {
      await supabase.from('posts').delete().eq('id', id);
    }
    setPosts(posts.filter((p) => p.id !== id));
    triggerNotice('Artículo eliminado');
  };

  // Crear Documento
  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    const docItem: ClubDocument = {
      id: 'doc-' + Date.now(),
      title: newDoc.title,
      description: newDoc.description,
      category: newDoc.category,
      file_type: newDoc.file_type,
      file_size: newDoc.file_size,
      file_url: newDoc.file_url,
      min_role: 'student',
      downloads_count: 0,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('documents').insert(docItem);
      } catch (err) {
        console.error('Error al insertar documento:', err);
      }
    }

    setDocuments([docItem, ...documents]);
    setShowDocModal(false);
    setNewDoc({ title: '', description: '', category: 'Material de Estudio', file_type: 'pdf', file_size: '2.1 MB', file_url: '#' });
    triggerNotice('Documento añadido al repositorio de afiliados');
  };

  // Eliminar Documento
  const handleDeleteDoc = async (id: string) => {
    if (isSupabaseConfigured()) {
      await supabase.from('documents').delete().eq('id', id);
    }
    setDocuments(documents.filter((d) => d.id !== id));
    triggerNotice('Documento eliminado');
  };

  // Cambiar rol de afiliado
  const handleToggleMemberRole = async (memberId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    if (isSupabaseConfigured()) {
      await supabase.from('profiles').update({ role: newRole }).eq('id', memberId);
    }
    setMembers(members.map((m) => m.id === memberId ? { ...m, role: newRole as any } : m));
    triggerNotice(`Rol actualizado a: ${newRole}`);
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      
      {/* Barra superior de Admin */}
      <header style={{ background: '#111', borderBottom: '1px solid #222', padding: '0.8rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', background: 'var(--gold)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={24} color="#000" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: '#fff' }}>
              Capablanca CMS
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>
              Panel de Control Administrativo
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" target="_blank" className="btn btn--ghost btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>Ver Web en vivo</span>
          </Link>
          <button
            onClick={() => logout().then(() => navigate('/admin/login'))}
            className="btn btn--sm"
            style={{ background: '#2e1212', color: '#ff8a80', border: '1px solid #b71c1c', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <LogOut size={14} />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* Contenedor principal con Sidebar y Contenido */}
      <div style={{ display: 'flex', flex: 1 }}>
        
        {/* Sidebar */}
        <aside style={{ width: '260px', background: '#0e0e0e', borderRight: '1px solid #222', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {[
            { id: 'overview', label: 'Resumen & Métricas', icon: <LayoutDashboard size={18} /> },
            { id: 'content', label: 'Editor del Sitio Web', icon: <Globe size={18} /> },
            { id: 'events', label: 'Torneos & Eventos', icon: <Trophy size={18} /> },
            { id: 'blog', label: 'Blog & Noticias', icon: <BookOpen size={18} /> },
            { id: 'documents', label: 'Documentos Afiliados', icon: <FileText size={18} /> },
            { id: 'members', label: 'Afiliados & Roles', icon: <Users size={18} /> },
            { id: 'messages', label: 'Bandeja de Contacto', icon: <Mail size={18} /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: activeSection === item.id ? 'var(--gold)' : 'transparent',
                color: activeSection === item.id ? '#000' : '#aaa',
                fontWeight: activeSection === item.id ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              {item.icon}
              <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Panel Central */}
        <main style={{ flex: 1, padding: '2.5rem 3rem', background: '#070707', overflowY: 'auto' }}>
          
          {notice && (
            <div
              style={{
                background: notice.type === 'success' ? '#14381e' : '#3a1616',
                border: `1px solid ${notice.type === 'success' ? '#4caf50' : '#b71c1c'}`,
                color: notice.type === 'success' ? '#a5d6a7' : '#ff8a80',
                padding: '0.8rem 1.2rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                marginBottom: '1.5rem',
              }}
            >
              {notice.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{notice.msg}</span>
            </div>
          )}

          {/* 1. SECCIÓN: OVERVIEW / RESUMEN */}
          {activeSection === 'overview' && (
            <div>
              <h1 className="display display--gold" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
                Panel de Control General
              </h1>
              <p style={{ color: '#888', marginBottom: '2rem' }}>
                Resumen del estado operativo de la plataforma Capablanca Sabaneta
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem' }}>
                  <div style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase' }}>Afiliados Registrados</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gold)', marginTop: '0.3rem' }}>{members.length}</div>
                </div>
                <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem' }}>
                  <div style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase' }}>Torneos en Calendario</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginTop: '0.3rem' }}>{events.length}</div>
                </div>
                <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem' }}>
                  <div style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase' }}>Artículos de Blog</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginTop: '0.3rem' }}>{posts.length}</div>
                </div>
                <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem' }}>
                  <div style={{ color: '#888', fontSize: '0.85rem', textTransform: 'uppercase' }}>Mensajes Recibidos</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#81c784', marginTop: '0.3rem' }}>{messages.length}</div>
                </div>
              </div>

              {/* Acceso Rápido */}
              <div style={{ background: '#121212', border: '1px solid #222', borderRadius: '14px', padding: '2rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', color: '#fff' }}>
                  Acciones Rápidas del Administrador
                </h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button onClick={() => { setActiveSection('events'); setShowEventModal(true); }} className="btn btn--primary btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Plus size={16} /> Crear Torneo
                  </button>
                  <button onClick={() => { setActiveSection('blog'); setShowPostModal(true); }} className="btn btn--primary btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Plus size={16} /> Redactar Noticia
                  </button>
                  <button onClick={() => { setActiveSection('documents'); setShowDocModal(true); }} className="btn btn--primary btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Plus size={16} /> Añadir Documento
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. SECCIÓN: EDITOR DE CONTENIDO WEB */}
          {activeSection === 'content' && (
            <div style={{ maxWidth: '800px' }}>
              <h1 className="display display--gold" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
                Configuración del Sitio Web
              </h1>
              <p style={{ color: '#888', marginBottom: '2rem' }}>
                Edita los datos de contacto, enlaces y mensajes predeterminados de la web pública
              </p>

              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: '#121212', border: '1px solid #222', borderRadius: '12px', padding: '1.8rem' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--gold)', marginBottom: '1rem' }}>Datos de Contacto y Sede</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.3rem' }}>Teléfono visible</label>
                      <input
                        type="text"
                        value={settings.telefono}
                        onChange={(e) => setSettings({ ...settings, telefono: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.3rem' }}>WhatsApp (Dígitos internacionales)</label>
                      <input
                        type="text"
                        value={settings.whatsapp}
                        onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.3rem' }}>Dirección de la Sede</label>
                    <input
                      type="text"
                      value={settings.sede}
                      onChange={(e) => setSettings({ ...settings, sede: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                    />
                  </div>
                </div>

                <div style={{ background: '#121212', border: '1px solid #222', borderRadius: '12px', padding: '1.8rem' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--gold)', marginBottom: '1rem' }}>Mensajes Preconfigurados de WhatsApp</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.3rem' }}>Mensaje para Inscripciones</label>
                      <input
                        type="text"
                        value={settings.mensaje_inscripcion}
                        onChange={(e) => setSettings({ ...settings, mensaje_inscripcion: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: '#aaa', marginBottom: '0.3rem' }}>Mensaje para Clase de Prueba</label>
                      <input
                        type="text"
                        value={settings.mensaje_clase_prueba}
                        onChange={(e) => setSettings({ ...settings, mensaje_clase_prueba: e.target.value })}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#1c1c1c', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn btn--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content' }}>
                  <Save size={18} />
                  <span>Guardar Modificaciones</span>
                </button>
              </form>
            </div>
          )}

          {/* 3. SECCIÓN: TORNEOS & EVENTOS */}
          {activeSection === 'events' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h1 className="display display--gold" style={{ fontSize: '1.8rem' }}>Gestión de Torneos</h1>
                  <p style={{ color: '#888' }}>Crea, edita o retira torneos del calendario público</p>
                </div>
                <button onClick={() => setShowEventModal(true)} className="btn btn--primary btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Plus size={16} /> Nuevo Torneo
                </button>
              </div>

              {/* Modal de nuevo torneo */}
              {showEventModal && (
                <div style={{ background: '#141414', border: '1px solid #333', borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
                  <h3 style={{ color: 'var(--gold)', marginBottom: '1.2rem' }}>Publicar Nuevo Torneo</h3>
                  <form onSubmit={handleCreateEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <input
                        type="text"
                        required
                        placeholder="Título del torneo"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      />
                      <input
                        type="date"
                        required
                        value={newEvent.event_date}
                        onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      <input
                        type="text"
                        placeholder="Ritmo (ej. Blitz 3+2)"
                        value={newEvent.rhythm}
                        onChange={(e) => setNewEvent({ ...newEvent, rhythm: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      />
                      <input
                        type="text"
                        placeholder="Categoría (ej. Abierto)"
                        value={newEvent.category}
                        onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      />
                      <input
                        type="text"
                        placeholder="Valor inscripción"
                        value={newEvent.entry_fee}
                        onChange={(e) => setNewEvent({ ...newEvent, entry_fee: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                    <textarea
                      placeholder="Descripción y bases del torneo..."
                      rows={3}
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                    />
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button type="submit" className="btn btn--primary btn--sm">Guardar y Publicar</button>
                      <button type="button" onClick={() => setShowEventModal(false)} className="btn btn--ghost btn--sm">Cancelar</button>
                    </div>
                  </form>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {events.map((evt) => (
                  <div key={evt.id} style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem' }}>
                        <span style={{ background: 'var(--gold)', color: '#000', fontSize: '0.75rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                          {evt.rhythm}
                        </span>
                        <h3 style={{ fontSize: '1.15rem', margin: 0 }}>{evt.title}</h3>
                      </div>
                      <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>
                        Fecha: {evt.event_date} · {evt.location} · {evt.entry_fee}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteEvent(evt.id)} className="btn btn--sm" style={{ background: '#2b1212', color: '#ff8a80', border: '1px solid #b71c1c' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. SECCIÓN: BLOG & NOTICIAS */}
          {activeSection === 'blog' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h1 className="display display--gold" style={{ fontSize: '1.8rem' }}>Gestión del Blog</h1>
                  <p style={{ color: '#888' }}>Redacta crónicas y artículos formativos</p>
                </div>
                <button onClick={() => setShowPostModal(true)} className="btn btn--primary btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Plus size={16} /> Redactar Noticia
                </button>
              </div>

              {/* Modal nuevo post */}
              {showPostModal && (
                <div style={{ background: '#141414', border: '1px solid #333', borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
                  <h3 style={{ color: 'var(--gold)', marginBottom: '1.2rem' }}>Nueva Publicación</h3>
                  <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                      type="text"
                      required
                      placeholder="Título de la publicación"
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <input
                        type="text"
                        placeholder="Categoría (ej. Formativo, Torneos)"
                        value={newPost.category}
                        onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      />
                      <input
                        type="text"
                        placeholder="Ruta de imagen de portada"
                        value={newPost.cover_image}
                        onChange={(e) => setNewPost({ ...newPost, cover_image: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                    <textarea
                      placeholder="Resumen o extracto breve..."
                      rows={2}
                      value={newPost.excerpt}
                      onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                      style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                    />
                    <textarea
                      placeholder="Contenido completo del artículo..."
                      rows={6}
                      required
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                    />
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button type="submit" className="btn btn--primary btn--sm">Publicar Artículo</button>
                      <button type="button" onClick={() => setShowPostModal(false)} className="btn btn--ghost btn--sm">Cancelar</button>
                    </div>
                  </form>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {posts.map((post) => (
                  <div key={post.id} style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase' }}>
                        {post.category}
                      </span>
                      <h3 style={{ fontSize: '1.15rem', margin: '0.2rem 0' }}>{post.title}</h3>
                      <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>
                        {post.excerpt}
                      </p>
                    </div>
                    <button onClick={() => handleDeletePost(post.id)} className="btn btn--sm" style={{ background: '#2b1212', color: '#ff8a80', border: '1px solid #b71c1c' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. SECCIÓN: DOCUMENTOS DE AFILIADOS */}
          {activeSection === 'documents' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h1 className="display display--gold" style={{ fontSize: '1.8rem' }}>Repositorio de Afiliados</h1>
                  <p style={{ color: '#888' }}>Comparte archivos, PGNs y material de estudio exclusivo</p>
                </div>
                <button onClick={() => setShowDocModal(true)} className="btn btn--primary btn--sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Plus size={16} /> Añadir Documento
                </button>
              </div>

              {showDocModal && (
                <div style={{ background: '#141414', border: '1px solid #333', borderRadius: '12px', padding: '2rem', marginBottom: '2rem' }}>
                  <h3 style={{ color: 'var(--gold)', marginBottom: '1.2rem' }}>Añadir Nuevo Recurso</h3>
                  <form onSubmit={handleCreateDoc} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <input
                      type="text"
                      required
                      placeholder="Título del documento o material"
                      value={newDoc.title}
                      onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                      style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      <select
                        value={newDoc.category}
                        onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value as any })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      >
                        <option value="Material de Estudio">Material de Estudio</option>
                        <option value="Reglamento">Reglamento</option>
                        <option value="Partidas PGN">Partidas PGN</option>
                        <option value="Circulares">Circulares</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Tipo de archivo (pdf, pgn)"
                        value={newDoc.file_type}
                        onChange={(e) => setNewDoc({ ...newDoc, file_type: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      />
                      <input
                        type="text"
                        placeholder="Peso aproximado (ej. 2.4 MB)"
                        value={newDoc.file_size}
                        onChange={(e) => setNewDoc({ ...newDoc, file_size: e.target.value })}
                        style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                      />
                    </div>
                    <textarea
                      placeholder="Descripción del material..."
                      rows={2}
                      value={newDoc.description}
                      onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })}
                      style={{ padding: '0.75rem', borderRadius: '8px', background: '#1e1e1e', border: '1px solid #333', color: '#fff' }}
                    />
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button type="submit" className="btn btn--primary btn--sm">Publicar Recurso</button>
                      <button type="button" onClick={() => setShowDocModal(false)} className="btn btn--ghost btn--sm">Cancelar</button>
                    </div>
                  </form>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {documents.map((doc) => (
                  <div key={doc.id} style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase' }}>
                          {doc.category}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#777' }}>
                          {doc.file_type.toUpperCase()} · {doc.file_size}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.15rem', margin: '0.2rem 0' }}>{doc.title}</h3>
                      <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>{doc.description}</p>
                    </div>
                    <button onClick={() => handleDeleteDoc(doc.id)} className="btn btn--sm" style={{ background: '#2b1212', color: '#ff8a80', border: '1px solid #b71c1c' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. SECCIÓN: AFILIADOS & ROLES */}
          {activeSection === 'members' && (
            <div>
              <h1 className="display display--gold" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
                Control de Afiliados y Roles
              </h1>
              <p style={{ color: '#888', marginBottom: '2rem' }}>
                Administra los permisos y categorías deportivas de los miembros del club
              </p>

              <div style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#1e1e1e', borderBottom: '1px solid #333', color: '#aaa', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                      <th style={{ padding: '1rem' }}>Afiliado</th>
                      <th style={{ padding: '1rem' }}>Correo</th>
                      <th style={{ padding: '1rem' }}>Categoría</th>
                      <th style={{ padding: '1rem' }}>Elo</th>
                      <th style={{ padding: '1rem' }}>Rol</th>
                      <th style={{ padding: '1rem', textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid #222' }}>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>
                          {m.nombre} {m.apellido}
                          <div style={{ fontSize: '0.75rem', color: '#888' }}>@{m.usuario}</div>
                        </td>
                        <td style={{ padding: '1rem', color: '#ccc' }}>{m.correo}</td>
                        <td style={{ padding: '1rem', color: 'var(--gold)' }}>{m.categoria_ajedrez || 'Iniciación'}</td>
                        <td style={{ padding: '1rem' }}>{m.elo_rating || '—'}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: m.role === 'admin' ? '#ffd54f' : '#2e2e2e',
                            color: m.role === 'admin' ? '#000' : '#ccc',
                          }}>
                            {m.role}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <button
                            onClick={() => handleToggleMemberRole(m.id, m.role)}
                            className="btn btn--ghost btn--sm"
                            style={{ fontSize: '0.75rem' }}
                          >
                            Hacer {m.role === 'admin' ? 'Afiliado' : 'Admin'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 7. SECCIÓN: BANDEJA DE MENSAJES */}
          {activeSection === 'messages' && (
            <div>
              <h1 className="display display--gold" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
                Mensajes de Contacto
              </h1>
              <p style={{ color: '#888', marginBottom: '2rem' }}>
                Consultas recibidas desde el formulario web
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {messages.map((msg) => (
                  <div key={msg.id} style={{ background: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '1.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--gold)' }}>{msg.subject || 'Sin asunto'}</h3>
                        <p style={{ color: '#aaa', fontSize: '0.85rem', margin: '0.2rem 0' }}>
                          De: <strong>{msg.name}</strong> ({msg.email}) · Tel: {msg.phone || 'N/A'}
                        </p>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#666' }}>
                        {new Date(msg.created_at).toLocaleDateString('es-CO')}
                      </span>
                    </div>
                    <p style={{ color: '#ddd', fontSize: '0.95rem', lineHeight: 1.6, background: '#1c1c1c', padding: '1rem', borderRadius: '8px' }}>
                      {msg.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
