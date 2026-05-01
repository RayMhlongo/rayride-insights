import { Cloud, Database, Moon, RotateCw, Save, Sun, Trash2, Wifi } from 'lucide-react';
import { useMemo, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import { getDriveConfig, readDriveOverrides, saveDriveOverrides } from '../lib/drive';
import { useTheme } from '../context/ThemeContext.jsx';

export default function Settings({ app }) {
  const { theme, toggleTheme } = useTheme();
  const [overrides, setOverrides] = useState(() => readDriveOverrides());
  const [status, setStatus] = useState('');
  const driveConfig = useMemo(() => getDriveConfig(), [overrides, app.auth.configured]);
  const isCloud = app.auth.signedIn && !app.auth.localMode;

  const set = (key, value) => setOverrides((current) => ({ ...current, [key]: value }));

  const saveConfig = async () => {
    saveDriveOverrides(overrides);
    setStatus('Drive settings saved on this device.');
    await app.reconnectDrive();
  };

  const test = async () => {
    setStatus('Testing Google Drive connection...');
    try {
      await app.testDrive();
      setStatus('Google Drive connection test passed.');
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4 lg:max-w-4xl">
      <PageHeader title="Settings" description="Drive connection, sync controls, and display preferences." />

      <section className="panel p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-navy dark:text-slate-50">Display</h3>
            <p className="muted text-sm">Theme preference is saved on this device.</p>
          </div>
          <button className="btn-secondary" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
      </section>

      <section className="panel p-4">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-navy dark:text-slate-50">Google Drive</h3>
            <p className="muted text-sm">Storage source: {driveConfig.source}</p>
          </div>
          <Badge active={isCloud} label={isCloud ? 'Connected' : 'Not connected'} />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatusTile label="Client ID" active={driveConfig.hasClientId} />
          <StatusTile label="API key" active={driveConfig.hasApiKey} />
          <StatusTile label="Folder ID" active={driveConfig.hasFolderId} optional />
        </div>

        <div className="mt-4 grid gap-3">
          <label className="grid gap-1">
            <span className="label">Client ID override</span>
            <input className="field" value={overrides.clientId || ''} onChange={(event) => set('clientId', event.target.value)} placeholder="Optional Google OAuth client ID" />
          </label>
          <label className="grid gap-1">
            <span className="label">API key override</span>
            <input className="field" value={overrides.apiKey || ''} onChange={(event) => set('apiKey', event.target.value)} placeholder="Optional Google API key" />
          </label>
          <label className="grid gap-1">
            <span className="label">Drive folder ID override</span>
            <input className="field" value={overrides.folderId || ''} onChange={(event) => set('folderId', event.target.value)} placeholder="Optional fixed Drive folder ID" />
          </label>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <button className="btn-primary" onClick={saveConfig}><Save size={18} /> Save settings</button>
          <button className="btn-secondary" onClick={app.reconnectDrive}><RotateCw size={18} /> Reconnect Google Drive</button>
          <button className="btn-secondary" onClick={test}><Wifi size={18} /> Test connection</button>
        </div>
        {status && <p className="mt-3 rounded-lg bg-slate-100 p-3 text-sm text-slate-700 dark:bg-slate-950 dark:text-slate-200">{status}</p>}
      </section>

      <section className="panel p-4">
        <h3 className="font-bold text-navy dark:text-slate-50">Sync & Storage</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <StatusTile label="Storage mode" value={app.auth.localMode ? 'Local mode' : isCloud ? 'Cloud mode' : 'Setup mode'} active={isCloud} />
          <StatusTile label="Sync status" value={app.auth.syncing ? 'Syncing' : app.auth.offline ? 'Offline' : 'Ready'} active={!app.auth.offline} />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <button className="btn-primary" onClick={app.sync}><Cloud size={18} /> Sync now</button>
          <button className="btn-secondary" onClick={app.clearCache}><Database size={18} /> Clear local cache</button>
          <button className="btn-danger" onClick={app.resetLocalData}><Trash2 size={18} /> Reset local data</button>
        </div>
      </section>
    </div>
  );
}

function Badge({ active, label }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${active ? 'bg-cyan/10 text-cyan dark:bg-cyan/15' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>{label}</span>;
}

function StatusTile({ label, active, optional, value }) {
  return (
    <div className="rounded-lg border border-line bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
      <p className="label">{label}</p>
      <p className={`mt-1 font-bold ${active ? 'text-success dark:text-cyan' : 'text-slate-700 dark:text-slate-200'}`}>
        {value || (active ? 'Available' : optional ? 'Optional' : 'Missing')}
      </p>
    </div>
  );
}
