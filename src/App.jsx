import { NavLink, Route, Routes, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  Bus,
  Car,
  CreditCard,
  Gauge,
  Home,
  LogOut,
  Map,
  Menu,
  ReceiptText,
  Route as RouteIcon,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import Students from './pages/Students.jsx';
import Trips from './pages/Trips.jsx';
import RoutesPage from './pages/Routes.jsx';
import Finance from './pages/Finance.jsx';
import Vehicles from './pages/Vehicles.jsx';
import Payments from './pages/Payments.jsx';
import Reports from './pages/Reports.jsx';
import { initGoogle, loadDriveData, readLocal, saveDriveData, signIn, signOut, writeLocal } from './lib/drive';
import { emptyData } from './lib/constants';
import { clearOfflineQueue, normalizeData, queueOfflineData, readOfflineQueue, visibleData } from './lib/data';

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/students', label: 'Students', icon: Users },
  { to: '/trips', label: 'Trips', icon: Bus },
  { to: '/routes', label: 'Routes', icon: RouteIcon },
  { to: '/finance', label: 'Money', icon: ReceiptText },
  { to: '/vehicles', label: 'Vehicles', icon: Car },
  { to: '/payments', label: 'Payments', icon: CreditCard },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

function useAppData() {
  const [data, setDataState] = useState(() => readLocal());
  const [ready, setReady] = useState(false);
  const [auth, setAuth] = useState({ configured: false, signedIn: false, localMode: false, syncing: false, offline: !navigator.onLine, error: '' });

  useEffect(() => {
    initGoogle()
      .then(async (result) => {
        setAuth((current) => ({ ...current, configured: result.configured, signedIn: Boolean(result.restored), error: '' }));
        if (result.restored) setDataState(await loadDriveData());
      })
      .catch((error) => setAuth((current) => ({ ...current, configured: false, error: error.message })))
      .finally(() => setReady(true));
    const online = () => setAuth((current) => ({ ...current, offline: false }));
    const offline = () => setAuth((current) => ({ ...current, offline: true }));
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  useEffect(() => {
    if (!auth.signedIn || auth.localMode || auth.offline || auth.syncing || !readOfflineQueue()) return;
    sync();
  }, [auth.signedIn, auth.localMode, auth.offline]);

  const login = async () => {
    setAuth((current) => ({ ...current, error: '' }));
    await signIn();
    setAuth((current) => ({ ...current, signedIn: true, syncing: true, error: '' }));
    try {
      setDataState(await loadDriveData());
    } catch (error) {
      setAuth((current) => ({ ...current, error: error.message }));
    } finally {
      setAuth((current) => ({ ...current, syncing: false }));
    }
  };

  const logout = () => {
    signOut();
    setAuth((current) => ({ ...current, signedIn: false, localMode: false }));
  };

  const updateData = async (updater) => {
    const next = normalizeData(typeof updater === 'function' ? updater(data) : updater);
    setDataState(next);
    writeLocal(next);
    if (auth.localMode) {
      clearOfflineQueue();
      return;
    }
    if (!auth.signedIn || auth.offline) {
      queueOfflineData(next);
      return;
    }
    setAuth((current) => ({ ...current, syncing: true }));
    try {
      setDataState(await saveDriveData(next));
      clearOfflineQueue();
      setAuth((current) => ({ ...current, error: '' }));
    } catch (error) {
      queueOfflineData(next);
      setAuth((current) => ({ ...current, error: error.message }));
    } finally {
      setAuth((current) => ({ ...current, syncing: false }));
    }
  };

  const sync = async () => {
    if (!auth.signedIn || auth.localMode) return;
    setAuth((current) => ({ ...current, syncing: true }));
    try {
      const queued = readOfflineQueue()?.data;
      const merged = await saveDriveData(queued || data);
      setDataState(merged);
      clearOfflineQueue();
      setAuth((current) => ({ ...current, error: '' }));
    } catch (error) {
      setAuth((current) => ({ ...current, error: error.message }));
    } finally {
      setAuth((current) => ({ ...current, syncing: false }));
    }
  };

  const startLocal = () => setAuth((current) => ({ ...current, localMode: true, signedIn: true }));

  return { data: visibleData(data || emptyData), setData: updateData, auth, ready, login, logout, sync, startLocal };
}

function AppShell({ app }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const queued = Boolean(readOfflineQueue()) && !app.auth.localMode;

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const context = useMemo(() => app, [app]);

  return (
    <div className="min-h-screen bg-mist pb-20 text-ink md:pb-0">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-line bg-white p-4 transition md:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-navy text-white"><Gauge size={22} /></div>
          <div>
            <p className="font-bold text-navy">Insight Rides</p>
            <p className="text-xs text-slate-500">School transport ops</p>
          </div>
        </div>
        <nav className="space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? 'bg-slate-100 text-navy' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="md:pl-64">
        <header className="sticky top-0 z-30 border-b border-line bg-white/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <button className="btn-secondary px-3 md:hidden" onClick={() => setMenuOpen(true)}><Menu size={18} /></button>
            <div>
              <h1 className="text-lg font-bold text-navy">Insight Rides</h1>
              <p className="text-xs text-slate-500">{app.auth.localMode ? 'Local setup mode' : app.auth.offline ? 'Offline mode' : app.auth.syncing ? 'Syncing with Drive' : queued ? 'Offline changes waiting' : 'Drive data ready'}</p>
            </div>
            <div className="flex items-center gap-2">
              {queued && <button className="btn-secondary hidden sm:inline-flex" onClick={app.sync}>Sync</button>}
              <button className="btn-secondary px-3" onClick={app.logout}><LogOut size={18} /></button>
            </div>
          </div>
        </header>

        {(app.auth.offline || queued) && (
          <div className="mx-4 mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <AlertTriangle size={16} /> Entries are saved locally and will sync when you are online and signed in.
          </div>
        )}
        {app.auth.error && (
          <div className="mx-4 mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
            <AlertTriangle size={16} /> {app.auth.error}
          </div>
        )}

        <div className="p-4 lg:p-6">
          <Routes>
            <Route path="/" element={<Dashboard app={context} />} />
            <Route path="/students" element={<Students app={context} />} />
            <Route path="/trips" element={<Trips app={context} />} />
            <Route path="/routes" element={<RoutesPage app={context} />} />
            <Route path="/finance" element={<Finance app={context} />} />
            <Route path="/vehicles" element={<Vehicles app={context} />} />
            <Route path="/payments" element={<Payments app={context} />} />
            <Route path="/reports" element={<Reports app={context} />} />
          </Routes>
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-white md:hidden">
        {navItems.slice(0, 5).map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `flex flex-col items-center gap-1 px-1 py-2 text-[11px] font-semibold ${isActive ? 'text-navy' : 'text-slate-500'}`}>
            <Icon size={19} /> {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default function App() {
  const app = useAppData();

  if (!app.ready) return <div className="grid min-h-screen place-items-center bg-mist text-navy">Loading Insight Rides...</div>;

  if (!app.auth.configured && !app.auth.localMode) {
    return (
      <div className="grid min-h-screen place-items-center bg-mist p-4">
        <div className="panel max-w-md p-6">
          <h1 className="text-2xl font-bold text-navy">Insight Rides</h1>
          <p className="mt-2 text-sm text-slate-600">Add your Google OAuth Client ID and API key to `.env` to enable Drive sync. You can still use the app locally during setup.</p>
          <button className="btn-primary mt-5 w-full" onClick={app.startLocal}>Continue locally</button>
        </div>
      </div>
    );
  }

  if (!app.auth.signedIn) {
    return (
      <div className="grid min-h-screen place-items-center bg-mist p-4">
        <div className="panel max-w-md p-6">
          <div className="mb-5 grid h-12 w-12 place-items-center rounded-lg bg-navy text-white"><Map size={24} /></div>
          <h1 className="text-2xl font-bold text-navy">Insight Rides</h1>
          <p className="mt-2 text-sm text-slate-600">Sign in with Google to load your business folder from Drive and keep every phone in sync.</p>
          <button className="btn-primary mt-5 w-full" onClick={app.login}>Sign in with Google</button>
        </div>
      </div>
    );
  }

  return <AppShell app={app} />;
}
