import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { logoutDriver } from '../firebase/auth';
import InfoRow from '../components/InfoRow';
import StatusBadge from '../components/StatusBadge';
import {
  activateSubscription,
  subscribeToDriverProfile,
  updateDriverLocation,
  updateDriverStatus,
} from '../services/driverService';
import { canDriverGoOnline, isSubscriptionCurrent } from '../utils/driver';
import { formatDate } from '../utils/formatters';

export default function DriverDashboardPage() {
  const { currentUser, driverProfile, setDriverProfile, t } = useApp();
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/driver/auth');
      return;
    }

    return subscribeToDriverProfile(currentUser.uid, setDriverProfile);
  }, [currentUser, navigate, setDriverProfile]);

  async function handleSubscription() {
    if (!currentUser) return;
    await activateSubscription(currentUser.uid);
    setMessage(t('subscriptionReady'));
  }

  async function toggleOnline() {
    if (!currentUser || !driverProfile) return;
    if (!canDriverGoOnline(driverProfile)) {
      setMessage(t('verifiedOnly'));
      return;
    }

    const nextState = !driverProfile.isOnline;
    await updateDriverStatus(currentUser.uid, { isOnline: nextState });

    navigator.geolocation?.getCurrentPosition(async (position) => {
      await updateDriverLocation(currentUser.uid, {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    });
  }

  async function handleLogout() {
    await logoutDriver();
    navigate('/driver/auth');
  }

  if (!currentUser) {
    return <section className="panel">{t('loadingAccount')}</section>;
  }

  return (
    <>
      <section className="panel hero-card">
        <div>
          <p className="eyebrow">{t('driverOverview')}</p>
          <h2>{driverProfile?.name || t('completeProfile')}</h2>
          <p className="muted">{t('verifiedOnly')}</p>
        </div>
        <div className="stack-end">
          {driverProfile?.isOnline ? <StatusBadge status="accepted" /> : <StatusBadge status="pending" />}
          <button className="secondary-button" type="button" onClick={handleLogout}>
            {t('logout')}
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="button-row">
          <button className="primary-button" type="button" onClick={toggleOnline}>
            {driverProfile?.isOnline ? t('goOffline') : t('goOnline')}
          </button>
          <button className="secondary-button" type="button" onClick={handleSubscription}>
            {t('activateSubscription')}
          </button>
          <Link className="secondary-button" to="/driver/requests">
            {t('viewRequests')}
          </Link>
        </div>
        {message && <p className="banner success">{message}</p>}
      </section>

      <section className="panel">
        <InfoRow label={t('docsStatus')} value={driverProfile?.verified ? t('driverVerified') : t('pendingReview')} />
        <InfoRow label={t('subscriptionActive')} value={isSubscriptionCurrent(driverProfile) ? t('yes') : t('no')} />
        <InfoRow label={t('subscriptionExpiry')} value={formatDate(driverProfile?.subscriptionExpiresAt)} />
        <InfoRow label={t('currentRating')} value={driverProfile?.rating || 0} />
        <InfoRow label={t('activeTrip')} value={driverProfile?.currentRideId || t('none')} />
      </section>
    </>
  );
}
