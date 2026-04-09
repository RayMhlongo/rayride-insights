import { useApp } from '../context/AppContext';

export default function LanguageToggle() {
  const { language, setLanguage, t } = useApp();

  return (
    <div className="language-toggle" aria-label={t('language')}>
      <button
        className={language === 'en' ? 'chip active' : 'chip'}
        type="button"
        onClick={() => setLanguage('en')}
      >
        {t('english')}
      </button>
      <button
        className={language === 'af' ? 'chip active' : 'chip'}
        type="button"
        onClick={() => setLanguage('af')}
      >
        {t('afrikaans')}
      </button>
    </div>
  );
}
