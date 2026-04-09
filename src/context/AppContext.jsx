import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthChange } from '../services/authService';
import { t as translate } from '../i18n/translations';
import { getDriverProfile } from '../services/driverService';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('rayride-language') || 'en');
  const [currentUser, setCurrentUser] = useState(null);
  const [driverProfile, setDriverProfile] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    localStorage.setItem('rayride-language', language);
  }, [language]);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setCurrentUser(user);
      if (user) {
        const profile = await getDriverProfile(user.uid);
        setDriverProfile(profile);
      } else {
        setDriverProfile(null);
      }
      setAuthReady(true);
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      currentUser,
      driverProfile,
      setDriverProfile,
      authReady,
      t: (key, replacements) => translate(language, key, replacements),
    }),
    [authReady, currentUser, driverProfile, language],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return context;
}
