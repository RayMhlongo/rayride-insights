import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import InfoRow from '../components/InfoRow';
import MapCard from '../components/MapCard';
import { createRideRequest } from '../services/rideService';
import { calculateDistanceKm, estimateEtaMinutes, estimateFare } from '../utils/fare';
import { currency, roundNumber } from '../utils/formatters';

const initialForm = {
  customerName: '',
  customerPhone: '',
  pickupText: '',
  pickupLat: '-26.2041',
  pickupLng: '28.0473',
  destinationText: '',
  destinationLat: '-26.1952',
  destinationLng: '28.0341',
};

export default function HomePage() {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const { t } = useApp();
  const navigate = useNavigate();

  const pickup = { lat: Number(form.pickupLat), lng: Number(form.pickupLng) };
  const destination = { lat: Number(form.destinationLat), lng: Number(form.destinationLng) };
  const distanceKm = calculateDistanceKm(pickup, destination);
  const estimatedFare = estimateFare(distanceKm);
  const etaMinutes = estimateEtaMinutes(distanceKm);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const rideId = await createRideRequest({
        customerName: form.customerName || t('guestCustomer'),
        customerPhone: form.customerPhone,
        pickupText: form.pickupText,
        pickup,
        destinationText: form.destinationText,
        destination,
        distanceKm,
        estimatedFare,
        etaMinutes,
      });
      setMessage(t('rideCreated'));
      navigate(`/track/${rideId}`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <section className="panel hero-card">
        <div>
          <p className="eyebrow">{t('customerOverview')}</p>
          <h2>{t('requestRide')}</h2>
          <p className="muted">{t('requestHelp')}</p>
        </div>
        <div className="metrics-grid">
          <div className="metric-card">
            <span>{t('fareEstimate')}</span>
            <strong>{currency(estimatedFare)}</strong>
          </div>
          <div className="metric-card">
            <span>{t('distance')}</span>
            <strong>{roundNumber(distanceKm)} km</strong>
          </div>
          <div className="metric-card">
            <span>{t('eta')}</span>
            <strong>{etaMinutes} min</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            {t('customerName')}
            <input
              value={form.customerName}
              onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))}
              placeholder="Nomsa Dube"
            />
          </label>
          <label>
            {t('customerPhone')}
            <input
              value={form.customerPhone}
              onChange={(event) => setForm((current) => ({ ...current, customerPhone: event.target.value }))}
              placeholder="+27 71 000 0000"
            />
          </label>
          <label>
            {t('pickupLabel')}
            <input
              value={form.pickupText}
              onChange={(event) => setForm((current) => ({ ...current, pickupText: event.target.value }))}
              placeholder="Town Hall"
              required
            />
          </label>
          <label>
            {t('destinationLabel')}
            <input
              value={form.destinationText}
              onChange={(event) => setForm((current) => ({ ...current, destinationText: event.target.value }))}
              placeholder="Central Clinic"
              required
            />
          </label>
          <label>
            {t('pickupLat')}
            <input
              value={form.pickupLat}
              onChange={(event) => setForm((current) => ({ ...current, pickupLat: event.target.value }))}
              required
            />
          </label>
          <label>
            {t('pickupLng')}
            <input
              value={form.pickupLng}
              onChange={(event) => setForm((current) => ({ ...current, pickupLng: event.target.value }))}
              required
            />
          </label>
          <label>
            {t('destinationLat')}
            <input
              value={form.destinationLat}
              onChange={(event) => setForm((current) => ({ ...current, destinationLat: event.target.value }))}
              required
            />
          </label>
          <label>
            {t('destinationLng')}
            <input
              value={form.destinationLng}
              onChange={(event) => setForm((current) => ({ ...current, destinationLng: event.target.value }))}
              required
            />
          </label>
          <button className="primary-button" disabled={isSubmitting} type="submit">
            {isSubmitting ? '...' : t('requestRide')}
          </button>
        </form>
        {message && <p className="banner success">{message}</p>}
      </section>

      <section className="panel">
        <MapCard pickup={pickup} destination={destination} />
      </section>

      <section className="panel">
        <p className="eyebrow">{t('traceability')}</p>
        <InfoRow label={t('fareEstimate')} value={currency(estimatedFare)} />
        <InfoRow label={t('distance')} value={`${roundNumber(distanceKm)} km`} />
        <InfoRow label={t('eta')} value={`${etaMinutes} min`} />
      </section>
    </>
  );
}
