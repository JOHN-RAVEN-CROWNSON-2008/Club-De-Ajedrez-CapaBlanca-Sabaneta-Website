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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: { email: string; password: string; nombre: string; apellido: string; telefono?: string; usuario?: string; categoria?: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
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
        // Modo sin conexión o credenciales de ejemplo: restaurar sesión mock si existe en localStorage
        const storedMock = localStorage.getItem('capablanca_mock_session');
        if (storedMock && mounted) {
          try {
            setUser(JSON.parse(storedMock));
          } catch {
            setUser(null);
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
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!isConfigured) {
      // Autenticación mock para modo demostración
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

      if (error) throw error;
      if (data.user) {
        await fetchProfile(data.user.id, data.user.email || '');
      }
      return { success: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Credenciales inválidas';
      return { success: false, error: errorMsg };
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
  }): Promise<{ success: boolean; error?: string }> => {
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
        estado: 'active',
        created_at: new Date().toISOString(),
      };
      setUser(newMember);
      localStorage.setItem('capablanca_mock_session', JSON.stringify(newMember));
      // Enviar correo de bienvenida con Resend
      await resendService.sendWelcomeEmail(data.email, `${data.nombre} ${data.apellido}`);
      return { success: true };
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
            role: 'student',
          },
        },
      });

      if (error) throw error;

      // Disparar correo de bienvenida mediante Resend
      await resendService.sendWelcomeEmail(data.email, `${data.nombre} ${data.apellido}`);

      if (authData.user) {
        await fetchProfile(authData.user.id, authData.user.email || '');
      }
      return { success: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al registrar usuario';
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

  // Atajo de acceso demo (para pruebas rápidas de desarrollo)
  const loginAsDemo = (demoRole: 'admin' | 'member') => {
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
