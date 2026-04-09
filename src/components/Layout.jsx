import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import LanguageToggle from './LanguageToggle';

const navItems = [
  { to: '/', labelKey: 'requestRide' },
  { to: '/driver/dashboard', labelKey: 'findDriver' },
  { to: '/admin/drivers', labelKey: 'adminView' },
];

export default function Layout({ children }) {
  const location = useLocation();
  const { t } = useApp();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">RayRide Insights</p>
          <h1>RayRide</h1>
          <p className="muted">{t('brandTag')}</p>
        </div>
        <div className="topbar-actions">
          <LanguageToggle />
        </div>
      </header>

      <nav className="nav-pills">
        {navItems.map((item) => (
          <Link
            key={item.to}
            className={location.pathname === item.to ? 'nav-pill active' : 'nav-pill'}
            to={item.to}
          >
            {t(item.labelKey)}
          </Link>
        ))}
      </nav>

      <main className="page-grid">{children}</main>
    </div>
  );
}
