import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import InfoRow from '../components/InfoRow';
import MapCard from '../components/MapCard';
import StatusBadge from '../components/StatusBadge';
import { subscribeToRide } from '../services/rideService';
import { currency, roundNumber } from '../utils/formatters';

export default function TrackRidePage() {
  const { rideId } = useParams();
  const [ride, setRide] = useState(null);
  const { t } = useApp();

  useEffect(() => subscribeToRide(rideId, setRide), [rideId]);

  if (!ride) {
    return <section className="panel">{t('loadingRide')}</section>;
  }

  return (
    <>
      <section className="panel hero-card">
        <div>
          <p className="eyebrow">{t('liveTracking')}</p>
          <h2>{ride.driverName ? t('rideAssigned') : t('rideWaiting')}</h2>
          <p className="muted">{ride.driverName ? t('rideAccepted') : t('requestHelp')}</p>
        </div>
        <StatusBadge status={ride.status} />
      </section>

      <section className="panel">
        <MapCard
          pickup={ride.pickup}
          destination={ride.destination}
          driverLocation={ride.driverLocation}
        />
      </section>

      <section className="panel">
        <InfoRow label={t('statusTitle')} value={<StatusBadge status={ride.status} />} />
        <InfoRow label={t('fareEstimate')} value={currency(ride.estimatedFare)} />
        <InfoRow label={t('distance')} value={`${roundNumber(ride.distanceKm)} km`} />
        <InfoRow label={t('eta')} value={`${ride.etaMinutes} min`} />
        <InfoRow label={t('driverLabel')} value={ride.driverName || t('awaitingAssignment')} />
        <InfoRow label={t('phoneLabel')} value={ride.driverPhone || t('pending')} />
        {ride.status === 'completed' && (
          <Link className="secondary-button" to={`/rate/${ride.id}`}>
            {t('rateDriver')}
          </Link>
        )}
      </section>
    </>
  );
}
