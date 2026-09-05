import '../../App.css';
import { Outlet } from 'react-router-dom';
import logo from '../../assets/images/gopass_logo.webp';

export function AppLayout() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <img className="app-brand" src={logo} alt="Gopass" />
      </header>
      <section className="app-content" aria-label="Application content">
        <Outlet />
      </section>
    </main>
  );
}
