export function calculateDistanceKm(pickup, destination) {
  if (!pickup?.lat || !destination?.lat) return 0;
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(destination.lat - pickup.lat);
  const dLng = toRadians(destination.lng - pickup.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(pickup.lat)) *
      Math.cos(toRadians(destination.lat)) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export function estimateFare(distanceKm) {
  return Math.round(20 + distanceKm * 4.5);
}

export function estimateEtaMinutes(distanceKm) {
  return Math.max(4, Math.round(distanceKm * 2.1));
}
