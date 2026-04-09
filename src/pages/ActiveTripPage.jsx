import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import InfoRow from '../components/InfoRow';
import MapCard from '../components/MapCard';
import StatusBadge from '../components/StatusBadge';
import { subscribeToDriverProfile, updateDriverLocation } from '../services/driverService';
import { completeRide, subscribeToRide, syncRideDriverLocation, updateRideStatus } from '../services/rideService';
import { currency, roundNumber } from '../utils/formatters';

export default function ActiveTripPage() {
  const { currentUser, setDriverProfile, t } = useApp();
  const { rideId } = useParams();
  const [ride, setRide] = useState(null);
  const [message, setMessage] = useState('');
  const watchIdRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/driver/auth');
      return;
    }

    const unsubscribeRide = subscribeToRide(rideId, setRide);
    const unsubscribeProfile = subscribeToDriverProfile(currentUser.uid, setDriverProfile);

    watchIdRef.current = navigator.geolocation?.watchPosition(async (position) => {
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      await Promise.all([
        updateDriverLocation(currentUser.uid, coords),
        syncRideDriverLocation(rideId, coords),
      ]);
    });

    return () => {
      unsubscribeRide();
      unsubscribeProfile();
      if (watchIdRef.current !== null && navigator.geolocation?.clearWatch) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [currentUser, navigate, rideId, setDriverProfile]);

  async function handleStartTrip() {
    await updateRideStatus(rideId, { status: 'in_progress' });
    setMessage(t('tripStarted'));
  }

  async function handleCompleteTrip() {
    if (!currentUser) return;
    await completeRide({ rideId, driverId: currentUser.uid });
    navigate(`/track/${rideId}`);
  }

  if (!ride) {
    return <section className="panel">{t('loadingTrip')}</section>;
  }

  return (
    <>
      <section className="panel hero-card">
        <div>
          <p className="eyebrow">{t('activeTrip')}</p>
          <h2>{ride.pickupText} to {ride.destinationText}</h2>
        </div>
        <StatusBadge status={ride.status} />
      </section>

      <section className="panel">
        <MapCard pickup={ride.pickup} destination={ride.destination} driverLocation={ride.driverLocation} />
      </section>

      <section className="panel">
        <InfoRow label={t('customerLabel')} value={ride.customerName} />
        <InfoRow label={t('phoneLabel')} value={ride.customerPhone || t('na')} />
        <InfoRow label={t('fareEstimate')} value={currency(ride.estimatedFare)} />
        <InfoRow label={t('distance')} value={`${roundNumber(ride.distanceKm)} km`} />
        <div className="button-row">
          <button className="primary-button" type="button" onClick={handleStartTrip}>
            {t('startTrip')}
          </button>
          <button className="secondary-button" type="button" onClick={handleCompleteTrip}>
            {t('completeTrip')}
          </button>
        </div>
        {message && <p className="banner success">{message}</p>}
      </section>
    </>
  );
}
