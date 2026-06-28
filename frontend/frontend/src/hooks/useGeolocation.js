import { useState, useEffect } from 'react';

export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    const id = navigator.geolocation.watchPosition(setPosition, setError);
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return { position, error };
}
