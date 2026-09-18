import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { UserProfile, UserRole } from '../types/database';
import { MOCK_ADMIN_PROFILE, MOCK_MEMBER_PROFILE } from '../lib/initialData';
import { resendService } from '../services/resendService';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  isConfigured: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; isEmailNotConfirmed?: boolean }>;
  register: (data: { email: string; password: string; nombre: string; apellido: string; telefono?: string; usuario?: string; categoria?: string }) => Promise<{ success: boolean; error?: string; emailConfirmationRequired?: boolean }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resendConfirmationEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: (role: 'admin' | 'member') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const isConfigured = isSupabaseConfigured();

  // Cargar sesión inicial
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!isConfigured) {
        if (import.meta.env.PROD) {
          console.warn('Supabase no está configurado en producción.');
          setLoading(false);
          return;
        }

        // Modo sin conexión o credenciales de ejemplo: restaurar sesión mock si existe en localStorage
        const storedMock = localStorage.getItem('capablanca_mock_session');
        if (storedMock && mounted) {
          try {
            setUser(JSON.parse(storedMock));
            setLoading(false);
            return;
          } catch {
            setUser(null);
          }
        }

        // Modo de desarrollo local: auto-iniciar solo si el host es localhost / 127.0.0.1
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost && mounted) {
          // Si se accede directamente por el puerto 5181 (Admin) o ruta /admin en modo local, auto-iniciar con MOCK_ADMIN_PROFILE
          const isPort5181 = window.location.port === '5181';
          const isAdminPath = window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login';
          if (isPort5181 || isAdminPath) {
            setUser(MOCK_ADMIN_PROFILE);
            localStorage.setItem('capablanca_mock_session', JSON.stringify(MOCK_ADMIN_PROFILE));
            setLoading(false);
            return;
          }

          // Si se accede directamente por el puerto 5182 (Afiliados) o ruta /afiliados en modo local, auto-iniciar con MOCK_MEMBER_PROFILE
          const isPort5182 = window.location.port === '5182';
          const isMembersPath = window.location.pathname.startsWith('/afiliados');
          if (isPort5182 || isMembersPath) {
            setUser(MOCK_MEMBER_PROFILE);
            localStorage.setItem('capablanca_mock_session', JSON.stringify(MOCK_MEMBER_PROFILE));
            setLoading(false);
            return;
          }
        }

        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          await fetchProfile(session.user.id, session.user.email || '');
        }
      } catch (err) {
        console.error('Error al inicializar sesión:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    // Escuchar cambios de autenticación en Supabase
    if (isConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          await fetchProfile(session.user.id, session.user.email || '');
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, [isConfigured]);

  // Obtener perfil desde la tabla `profiles`
  async function fetchProfile(userId: string, email: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.warn('Perfil aún no sincronizado en base de datos, usando fallback');
        setUser({
          id: userId,
          nombre: email.split('@')[0],
          apellido: '',
          usuario: email.split('@')[0],
          correo: email,
          role: 'student',
          estado: 'active',
          created_at: new Date().toISOString(),
        });
      } else {
        setUser(data as UserProfile);
      }
    } catch (err) {
      console.error('Error al consultar perfil:', err);
    }
  }

  // Iniciar sesión
  // Iniciar sesión
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; isEmailNotConfirmed?: boolean }> => {
    if (!isConfigured) {
      // Autenticación mock para modo demostración (solo local)
      if (email.includes('admin')) {
        setUser(MOCK_ADMIN_PROFILE);
        localStorage.setItem('capablanca_mock_session', JSON.stringify(MOCK_ADMIN_PROFILE));
        return { success: true };
      }
      setUser(MOCK_MEMBER_PROFILE);
      localStorage.setItem('capablanca_mock_session', JSON.stringify(MOCK_MEMBER_PROFILE));
      return { success: true };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const msg = error.message?.toLowerCase() || '';
        const isEmailNotConfirmed = msg.includes('email not confirmed') || (error as { code?: string }).code === 'email_not_confirmed';

        if (isEmailNotConfirmed) {
          return {
            success: false,
            error: 'Tu correo electrónico aún no ha sido confirmado. Por favor revisa tu bandeja de entrada o carpeta de spam.',
            isEmailNotConfirmed: true,
          };
        }
        throw error;
      }

      if (data.user) {
        await fetchProfile(data.user.id, data.user.email || '');
      }
      return { success: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Credenciales inválidas';
      const isEmailNotConfirmed = errorMsg.toLowerCase().includes('email not confirmed');
      return {
        success: false,
        error: isEmailNotConfirmed
          ? 'Tu correo electrónico aún no ha sido confirmado. Por favor revisa tu bandeja de entrada o carpeta de spam.'
          : errorMsg,
        isEmailNotConfirmed,
      };
    }
  };

  // Registro de nuevo usuario
  const register = async (data: {
    email: string;
    password: string;
    nombre: string;
    apellido: string;
    telefono?: string;
    usuario?: string;
    categoria?: string;
  }): Promise<{ success: boolean; error?: string; emailConfirmationRequired?: boolean }> => {
    if (!isConfigured) {
      const newMember: UserProfile = {
        id: 'usr-new-' + Date.now(),
        nombre: data.nombre,
        apellido: data.apellido,
        usuario: data.usuario || data.email.split('@')[0],
        correo: data.email,
        telefono: data.telefono || '',
        categoria_ajedrez: data.categoria || 'Iniciación',
        role: 'student',
        estado: 'pending',
        created_at: new Date().toISOString(),
      };
      setUser(newMember);
      localStorage.setItem('capablanca_mock_session', JSON.stringify(newMember));
      // Enviar correo de bienvenida con Resend
      await resendService.sendWelcomeEmail(data.email, `${data.nombre} ${data.apellido}`);
      return { success: true, emailConfirmationRequired: true };
    }

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            nombre: data.nombre,
            apellido: data.apellido,
            telefono: data.telefono,
            usuario: data.usuario,
            categoria: data.categoria,
            role: 'student',
          },
        },
      });

      if (error) throw error;

      // Si Supabase requiere confirmación de correo electrónico, session será null
      const emailConfirmationRequired = !authData.session;

      // Vincular con solicitud formal de afiliación en membership_applications y marcar estado 'pending'
      if (authData.user) {
        try {
          await supabase.from('profiles').update({ estado: 'pending' }).eq('id', authData.user.id);
          await supabase.from('membership_applications').insert({
            applicant_name: data.nombre,
            applicant_lastname: data.apellido,
            doc_type: 'TI',
            doc_number: 'Pendiente de verificación',
            email: data.email,
            phone: data.telefono || 'Sin teléfono',
            desired_category: data.categoria || 'Iniciación',
            status: 'pending',
            notes: 'Solicitud de afiliación registrada desde el portal web',
            linked_profile_id: authData.user.id,
          });
        } catch (linkErr) {
          console.warn('Aviso al vincular solicitud de afiliación:', linkErr);
        }
      }

      // Enviar correo de bienvenida/notificación sin bloquear la respuesta
      resendService.sendWelcomeEmail(data.email, `${data.nombre} ${data.apellido}`).catch((e) => {
        console.warn('Disparo de correo de bienvenida:', e);
      });

      if (authData.session && authData.user) {
        await fetchProfile(authData.user.id, authData.user.email || '');
      }

      return { success: true, emailConfirmationRequired };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al registrar usuario';
      return { success: false, error: errorMsg };
    }
  };

  // Reenviar correo de confirmación de registro
  const resendConfirmationEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!isConfigured) {
      console.info('[Reenvío Simulado] Correo de confirmación simulado para:', email);
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) throw error;
      return { success: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al reenviar correo de confirmación';
      return { success: false, error: errorMsg };
    }
  };

  // Cierre de sesión
  const logout = async () => {
    if (isConfigured) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('capablanca_mock_session');
    setUser(null);
  };

  // Recuperar contraseña
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!isConfigured) {
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return { success: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al solicitar restablecimiento';
      return { success: false, error: errorMsg };
    }
  };

  // Actualizar perfil
  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No hay usuario autenticado' };

    if (!isConfigured) {
      const updated = { ...user, ...updates, updated_at: new Date().toISOString() };
      setUser(updated);
      localStorage.setItem('capablanca_mock_session', JSON.stringify(updated));
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      setUser(prev => prev ? ({ ...prev, ...updates }) : null);
      return { success: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al actualizar perfil';
      return { success: false, error: errorMsg };
    }
  };

  // Atajo de acceso demo (blindado exclusivamente para entorno local)
  const loginAsDemo = (demoRole: 'admin' | 'member') => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (import.meta.env.PROD || (!isLocalhost && isConfigured)) {
      console.warn('Acceso demo bloqueado: no disponible en entorno de producción');
      return;
    }
    const profile = demoRole === 'admin' ? MOCK_ADMIN_PROFILE : MOCK_MEMBER_PROFILE;
    setUser(profile);
    localStorage.setItem('capablanca_mock_session', JSON.stringify(profile));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        loading,
        isConfigured,
        login,
        register,
        logout,
        resetPassword,
        resendConfirmationEmail,
        updateProfile,
        loginAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
