export function isSubscriptionCurrent(driverProfile) {
  if (!driverProfile?.subscriptionActive || !driverProfile?.subscriptionExpiresAt) {
    return false;
  }

  const expiry = driverProfile.subscriptionExpiresAt?.toDate
    ? driverProfile.subscriptionExpiresAt.toDate()
    : new Date(driverProfile.subscriptionExpiresAt);

  return expiry.getTime() > Date.now();
}

export function canDriverGoOnline(driverProfile) {
  return Boolean(driverProfile?.verified && isSubscriptionCurrent(driverProfile));
}
