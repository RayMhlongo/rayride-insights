import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import InfoRow from '../components/InfoRow';
import { setDriverVerification, subscribeToAllDrivers } from '../services/driverService';
import { formatDate } from '../utils/formatters';

const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((entry) => entry.trim())
  .filter(Boolean);

export default function AdminDriversPage() {
  const { currentUser, t } = useApp();
  const [drivers, setDrivers] = useState([]);
  const isAdmin = useMemo(() => currentUser?.email && adminEmails.includes(currentUser.email), [currentUser]);

  useEffect(() => subscribeToAllDrivers(setDrivers), []);

  async function handleVerification(driverId, verified) {
    await setDriverVerification(driverId, verified);
  }

  if (!isAdmin) {
    return (
      <section className="panel">
        <p className="eyebrow">{t('adminDrivers')}</p>
        <h2>{t('restrictedRoute')}</h2>
        <p className="muted">{t('adminHelp')}</p>
      </section>
    );
  }

  return (
    <>
      <section className="panel hero-card">
        <div>
          <p className="eyebrow">{t('adminDrivers')}</p>
          <h2>{drivers.length} driver profiles</h2>
        </div>
      </section>

      {drivers.map((driver) => (
        <section className="panel" key={driver.id}>
          <InfoRow label={t('nameLabel')} value={driver.name || t('unknown')} />
          <InfoRow label={t('customerPhone')} value={driver.phone || t('missing')} />
          <InfoRow label={t('vehicleLabel')} value={`${driver.vehicle?.model || t('na')} | ${driver.vehicle?.plate || t('na')}`} />
          <InfoRow label={t('docsStatus')} value={driver.verified ? t('driverVerified') : t('pendingReview')} />
          <InfoRow label={t('subscriptionActive')} value={driver.subscriptionActive ? t('yes') : t('no')} />
          <InfoRow label={t('updated')} value={formatDate(driver.updatedAt)} />
          <div className="button-row">
            <button className="primary-button" type="button" onClick={() => handleVerification(driver.id, true)}>
              {t('approveDriver')}
            </button>
            <button className="secondary-button" type="button" onClick={() => handleVerification(driver.id, false)}>
              {t('revokeDriver')}
            </button>
          </div>
          <div className="image-row">
            {driver.documents?.profileImageURL && <img alt={`${driver.name} profile`} src={driver.documents.profileImageURL} />}
            {driver.documents?.idImageURL && <img alt={`${driver.name} ID`} src={driver.documents.idImageURL} />}
          </div>
        </section>
      ))}
    </>
  );
}
