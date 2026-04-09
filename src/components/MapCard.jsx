import { useMemo } from 'react';
import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';
import { useApp } from '../context/AppContext';

const containerStyle = {
  width: '100%',
  height: '320px',
  borderRadius: '24px',
};

export default function MapCard({ pickup, destination, driverLocation }) {
  const { t } = useApp();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded } = useJsApiLoader({
    id: 'rayride-maps',
    googleMapsApiKey: apiKey || 'missing-key',
  });

  const center = useMemo(
    () => pickup || destination || driverLocation || { lat: -26.2041, lng: 28.0473 },
    [destination, driverLocation, pickup],
  );

  const path = [pickup, driverLocation, destination].filter(Boolean);

  if (!apiKey) {
    return (
      <div className="map-fallback">
        <p className="muted">{t('noMap')}</p>
        <div className="coord-grid">
          {pickup && <p>Pickup: {pickup.lat}, {pickup.lng}</p>}
          {driverLocation && <p>Driver: {driverLocation.lat}, {driverLocation.lng}</p>}
          {destination && <p>Destination: {destination.lat}, {destination.lng}</p>}
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="map-fallback">Loading map...</div>;
  }

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={13} options={{ disableDefaultUI: true }}>
      {pickup && <Marker position={pickup} label="P" />}
      {destination && <Marker position={destination} label="D" />}
      {driverLocation && <Marker position={driverLocation} label="R" />}
      {path.length > 1 && (
        <Polyline
          path={path}
          options={{
            strokeColor: '#0f766e',
            strokeOpacity: 0.85,
            strokeWeight: 4,
          }}
        />
      )}
    </GoogleMap>
  );
}
