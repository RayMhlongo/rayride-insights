import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { saveDriverProfile, subscribeToDriverProfile } from '../services/driverService';
import { uploadDriverDocument } from '../services/storageService';

const initialState = {
  name: '',
  phone: '',
  email: '',
  vehicleModel: '',
  plate: '',
  color: '',
};

export default function DriverOnboardingPage() {
  const { currentUser, driverProfile, setDriverProfile, t } = useApp();
  const [form, setForm] = useState(initialState);
  const [idDocument, setIdDocument] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/driver/auth');
      return;
    }

    const unsubscribe = subscribeToDriverProfile(currentUser.uid, (profile) => {
      setDriverProfile(profile);
      if (profile) {
        setForm({
          name: profile.name || '',
          phone: profile.phone || '',
          email: profile.email || currentUser.email || '',
          vehicleModel: profile.vehicle?.model || '',
          plate: profile.vehicle?.plate || '',
          color: profile.vehicle?.color || '',
        });
      } else {
        setForm((current) => ({ ...current, email: currentUser.email || '' }));
      }
    });

    return unsubscribe;
  }, [currentUser, navigate, setDriverProfile]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!currentUser) return;

    setIsSaving(true);
    setMessage('');

    try {
      const [idImageURL, profileImageURL] = await Promise.all([
        idDocument
          ? uploadDriverDocument(currentUser.uid, idDocument, 'id')
          : Promise.resolve(driverProfile?.documents?.idImageURL || ''),
        profilePhoto
          ? uploadDriverDocument(currentUser.uid, profilePhoto, 'profile')
          : Promise.resolve(driverProfile?.documents?.profileImageURL || ''),
      ]);

      await saveDriverProfile(currentUser.uid, {
        name: form.name,
        phone: form.phone,
        email: form.email || currentUser.email,
        documents: {
          idImageURL,
          profileImageURL,
        },
        vehicle: {
          model: form.vehicleModel,
          plate: form.plate,
          color: form.color,
        },
      });

      setMessage(t('onboardingSaved'));
      navigate('/driver/dashboard');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="panel">
      <p className="eyebrow">{t('driverOverview')}</p>
      <h2>{t('uploadDocs')}</h2>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          {t('nameLabel')}
          <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
        </label>
        <label>
          {t('customerPhone')}
          <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} required />
        </label>
        <label>
          {t('email')}
          <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
        </label>
        <label>
          {t('vehicleModel')}
          <input value={form.vehicleModel} onChange={(event) => setForm((current) => ({ ...current, vehicleModel: event.target.value }))} required />
        </label>
        <label>
          {t('plateNumber')}
          <input value={form.plate} onChange={(event) => setForm((current) => ({ ...current, plate: event.target.value }))} required />
        </label>
        <label>
          {t('color')}
          <input value={form.color} onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))} required />
        </label>
        <label>
          {t('idDocument')}
          <input type="file" accept="image/*,.pdf" onChange={(event) => setIdDocument(event.target.files?.[0] || null)} />
        </label>
        <label>
          {t('profilePhoto')}
          <input type="file" accept="image/*" onChange={(event) => setProfilePhoto(event.target.files?.[0] || null)} />
        </label>
        <button className="primary-button" disabled={isSaving} type="submit">
          {isSaving ? '...' : t('saveProfile')}
        </button>
      </form>
      <p className="muted">{t('verifiedOnly')}</p>
      {message && <p className="banner success">{message}</p>}
    </section>
  );
}
