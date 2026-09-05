import '../../App.css';

export function AppLayout() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <span className="app-brand">Gopass</span>
      </header>
      <section className="app-content" aria-label="Application content">
        <p>Application workspace</p>
      </section>
    </main>
  );
}
