import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import InfoRow from '../components/InfoRow';
import { subscribeToDriverProfile } from '../services/driverService';
import { acceptRide, subscribeToPendingRides } from '../services/rideService';
import { canDriverGoOnline } from '../utils/driver';
import { currency, roundNumber } from '../utils/formatters';

export default function DriverRequestsPage() {
  const { currentUser, driverProfile, setDriverProfile, t } = useApp();
  const [rides, setRides] = useState([]);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/driver/auth');
      return;
    }

    const unsubscribeProfile = subscribeToDriverProfile(currentUser.uid, setDriverProfile);
    const unsubscribeRides = subscribeToPendingRides(setRides);

    return () => {
      unsubscribeProfile();
      unsubscribeRides();
    };
  }, [currentUser, navigate, setDriverProfile]);

  async function handleAccept(rideId) {
    if (!driverProfile || !canDriverGoOnline(driverProfile)) {
      setMessage(t('verifiedOnly'));
      return;
    }

    try {
      await acceptRide({
        rideId,
        driver: {
          id: currentUser.uid,
          name: driverProfile.name,
          phone: driverProfile.phone,
          location: driverProfile.location,
        },
      });
      navigate(`/driver/trip/${rideId}`);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <>
      <section className="panel hero-card">
        <div>
          <p className="eyebrow">{t('driverInbox')}</p>
          <h2>{rides.length} open ride requests</h2>
          <p className="muted">{t('verifiedOnly')}</p>
        </div>
      </section>
      {message && <section className="panel banner warning">{message}</section>}
      {rides.map((ride) => (
        <section className="panel" key={ride.id}>
          <InfoRow label={t('pickupLabel')} value={ride.pickupText} />
          <InfoRow label={t('destinationLabel')} value={ride.destinationText} />
          <InfoRow label={t('fareEstimate')} value={currency(ride.estimatedFare)} />
          <InfoRow label={t('distance')} value={`${roundNumber(ride.distanceKm)} km`} />
          <div className="button-row">
            <button className="primary-button" type="button" onClick={() => handleAccept(ride.id)}>
              {t('acceptRide')}
            </button>
            <Link className="secondary-button" to={`/track/${ride.id}`}>
              {t('trackRide')}
            </Link>
          </div>
        </section>
      ))}
    </>
  );
}
