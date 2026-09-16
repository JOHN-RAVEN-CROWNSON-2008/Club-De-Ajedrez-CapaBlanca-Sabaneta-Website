import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';

// Public views
import { HomeView } from './views/public/HomeView';
import { ClubView } from './views/public/ClubView';
import { ProgramsView } from './views/public/ProgramsView';
import { TournamentsView } from './views/public/TournamentsView';
import { BlogView } from './views/public/BlogView';
import { BlogPostView } from './views/public/BlogPostView';
import { GalleryView } from './views/public/GalleryView';
import { ContactView } from './views/public/ContactView';

// Auth views
import { MemberLoginView } from './views/auth/MemberLoginView';
import { MemberRegisterView } from './views/auth/MemberRegisterView';
import { AdminLoginView } from './views/auth/AdminLoginView';
import { ForgotPasswordView } from './views/auth/ForgotPasswordView';

// Protected modules
import { MembersDashboardView } from './views/members/MembersDashboardView';
import { AdminDashboardView } from './views/admin/AdminDashboardView';

// Auto-scroll al cambiar de página
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// Layout para páginas públicas con cabecera y pie
const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <Header />
      <main id="contenido">{children}</main>
      <Footer />
    </>
  );
};

// Detección del puerto de acceso para enrutamiento inicial inteligente
const PortAwareInitialRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentPort = window.location.port;

  // Si se ingresa por el puerto 5181 (Admin), ir directo al panel
  if (currentPort === '5181' && window.location.pathname === '/') {
    return <Navigate to="/admin" replace />;
  }

  // Si se ingresa por el puerto 5182 (Afiliados), ir directo al portal
  if (currentPort === '5182' && window.location.pathname === '/') {
    return <Navigate to="/afiliados" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <PortAwareInitialRoute>
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/" element={<PublicLayout><HomeView /></PublicLayout>} />
            <Route path="/club" element={<PublicLayout><ClubView /></PublicLayout>} />
            <Route path="/programas" element={<PublicLayout><ProgramsView /></PublicLayout>} />
            <Route path="/torneos" element={<PublicLayout><TournamentsView /></PublicLayout>} />
            <Route path="/blog" element={<PublicLayout><BlogView /></PublicLayout>} />
            <Route path="/blog/:slug" element={<PublicLayout><BlogPostView /></PublicLayout>} />
            <Route path="/galeria" element={<PublicLayout><GalleryView /></PublicLayout>} />
            <Route path="/contacto" element={<PublicLayout><ContactView /></PublicLayout>} />

            {/* Rutas de Autenticación */}
            <Route path="/login-afiliado" element={<PublicLayout><MemberLoginView /></PublicLayout>} />
            <Route path="/registro-afiliado" element={<PublicLayout><MemberRegisterView /></PublicLayout>} />
            <Route path="/recuperar-clave" element={<PublicLayout><ForgotPasswordView /></PublicLayout>} />
            
            {/* Login de Administrador (Ruta discreta, no visible en el home) */}
            <Route path="/admin/login" element={<AdminLoginView />} />

            {/* Portal de Afiliados */}
            <Route path="/afiliados" element={<PublicLayout><MembersDashboardView /></PublicLayout>} />

            {/* Panel de Administrador (CMS) */}
            <Route path="/admin" element={<AdminDashboardView />} />

            {/* Redirección por defecto */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PortAwareInitialRoute>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
