import { useCallback, useEffect, useRef, useState } from 'react';
import '../../App.css';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import logo from '../../assets/images/gopass_logo.webp';
import { useAuth } from '../../features/auth/context/useAuth';

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

export function AppLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const projectTasksMatch = pathname.match(/^\/projects\/([^/]+)\/tasks(?:\/|$)/);
  const projectTasksPath = projectTasksMatch ? `/projects/${projectTasksMatch[1]}/tasks` : null;

  const handleLogout = useCallback(() => {
    setIsUserMenuOpen(false);
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    let timeoutId = window.setTimeout(handleLogout, INACTIVITY_TIMEOUT_MS);

    const resetInactivityTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(handleLogout, INACTIVITY_TIMEOUT_MS);
    };

    window.addEventListener('pointerdown', resetInactivityTimer);
    window.addEventListener('keydown', resetInactivityTimer);
    window.addEventListener('scroll', resetInactivityTimer, { passive: true });

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('pointerdown', resetInactivityTimer);
      window.removeEventListener('keydown', resetInactivityTimer);
      window.removeEventListener('scroll', resetInactivityTimer);
    };
  }, [handleLogout, isAuthenticated]);

  useEffect(() => {
    if (!isUserMenuOpen) {
      return undefined;
    }

    const handleOutsideClick = (event: PointerEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isUserMenuOpen]);

  return (
    <main className="app-shell">
      <header className="app-header">
        <img className="app-brand" src={logo} alt="Gopass" />
        {isAuthenticated && (
          <nav className="app-nav" aria-label="Navegación principal">
            <NavLink to="/projects" end className={({ isActive }) => isActive ? 'app-nav-link app-nav-link-active' : 'app-nav-link'}>
              Proyectos
            </NavLink>
            <NavLink
              to={projectTasksPath ?? '/tasks'}
              className={({ isActive }) => isActive || pathname === '/tasks' ? 'app-nav-link app-nav-link-active' : 'app-nav-link'}
            >
              Tareas
            </NavLink>
          </nav>
        )}
        {isAuthenticated && user && (
          <div className="user-menu" ref={userMenuRef}>
            <button
              type="button"
              className="user-menu-trigger"
              aria-expanded={isUserMenuOpen}
              aria-controls="user-menu-dropdown"
              aria-haspopup="menu"
              onClick={() => setIsUserMenuOpen((isOpen) => !isOpen)}
            >
              <span className="user-avatar" aria-hidden="true">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span className="user-name">{user.name}</span>
            </button>

            {isUserMenuOpen && (
              <div className="user-menu-dropdown" id="user-menu-dropdown" role="menu">
                <div className="user-menu-details">
                  <strong className="user-menu-name">{user.name}</strong>
                  <span className="user-menu-email">{user.email}</span>
                  <span className="user-menu-role">{user.role}</span>
                </div>
                <button type="button" className="user-menu-logout" role="menuitem" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        )}
      </header>
      <section className="app-content" aria-label="Application content">
        <Outlet />
      </section>
    </main>
  );
}
