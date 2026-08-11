import { useEffect, useState } from 'react';

// Partagé entre la top bar (persistante) et l'écran Accueil (salutation).
export function useHorlogeEnDirect() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  return now;
}
