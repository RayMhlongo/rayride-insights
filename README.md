# RayRide Insights

RayRide Insights is a browser-based ride-request platform for small towns. Customers can request rides without creating an account, while drivers register, upload verification documents, activate a mock subscription, and receive real-time requests.

## Features

- Customer ride request form with pickup, destination, and fare estimate
- Real-time ride status tracking and driver location updates
- Driver onboarding with Firebase Storage uploads for ID and profile photo
- Driver subscription gate with a 30-day mock activation flow
- Admin review screen to verify drivers
- English and Afrikaans translations across the UI
- Firebase-backed data model for traceable ride history

## Setup

1. Run `npm install`
2. Copy `.env.example` to `.env`
3. Fill in Firebase and Google Maps keys
4. Run `npm run dev`

## Structure

```text
src/
  components/      shared UI like layout, map, badges, and ratings
  context/         language + auth state
  firebase/        Firebase initialization and auth helpers
  i18n/            English and Afrikaans dictionary
  pages/           customer, driver, and admin screens
  services/        Firestore and Storage operations
  utils/           fare math, formatting, and driver eligibility helpers
```

## Deploy

- `npm run build`
- `firebase deploy --only hosting`

## Notes

- Customer login is optional and controlled by `VITE_ENABLE_CUSTOMER_LOGIN`.
- The map component falls back to coordinate cards when a Google Maps API key is missing.
- For production, move ride acceptance into a Cloud Function or hardened callable endpoint for stronger concurrency control.
