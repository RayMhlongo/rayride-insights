import { useApp } from '../context/AppContext';

export default function StatusBadge({ status }) {
  const { t } = useApp();
  return <span className={`status-badge ${status}`}>{t(status)}</span>;
}
