import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { loginDriver, registerDriver } from '../services/authService';

export default function DriverAuthPage() {
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { t } = useApp();

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    try {
      if (mode === 'signin') {
        await loginDriver(form.email, form.password);
      } else {
        await registerDriver(form.email, form.password);
      }
      navigate('/driver/onboarding');
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="panel auth-panel">
      <p className="eyebrow">{t('driverAccess')}</p>
      <h2>{mode === 'signin' ? t('signin') : t('signup')}</h2>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          {t('email')}
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            required
          />
        </label>
        <label>
          {t('password')}
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            required
          />
        </label>
        <button className="primary-button" type="submit">
          {mode === 'signin' ? t('signin') : t('signup')}
        </button>
      </form>
      <button className="link-button" type="button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        {mode === 'signin' ? t('needAccount') : t('alreadyRegistered')}
      </button>
      {message && <p className="banner warning">{message}</p>}
    </section>
  );
}
