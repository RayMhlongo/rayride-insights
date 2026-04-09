import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import StarRating from '../components/StarRating';
import { rateRide, subscribeToRide } from '../services/rideService';

export default function RateRidePage() {
  const { rideId } = useParams();
  const navigate = useNavigate();
  const { t } = useApp();
  const [ride, setRide] = useState(null);
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');

  useEffect(() => subscribeToRide(rideId, setRide), [rideId]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!ride?.driverId) return;

    await rateRide({
      rideId,
      driverId: ride.driverId,
      rating,
    });

    setMessage(t('thanksFeedback'));
    setTimeout(() => navigate('/'), 1200);
  }

  if (!ride) {
    return <section className="panel">{t('loadingRide')}</section>;
  }

  return (
    <section className="panel">
      <p className="eyebrow">{t('rateDriver')}</p>
      <h2>{t('ratingPrompt')}</h2>
      <form className="stack" onSubmit={handleSubmit}>
        <StarRating value={rating} onChange={setRating} />
        <button className="primary-button" type="submit">
          {t('submitRating')}
        </button>
      </form>
      {message && <p className="banner success">{message}</p>}
    </section>
  );
}
