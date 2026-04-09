# RayRide Insights

RayRide Insights is a browser-based ride-request platform for small towns. This version runs as a self-contained frontend demo using browser local storage, so you can test customer, driver, and admin flows without any Firebase setup.

## Features

- Customer ride request form with pickup, destination, and fare estimate
- Live ride status updates inside the running app
- Driver onboarding with in-browser document uploads for ID and profile photo
- Driver subscription gate with a 30-day mock activation flow
- Admin review screen to verify drivers
- English and Afrikaans translations across the UI
- Demo ride history stored locally in the browser

## Setup

1. Run `npm install`
2. Copy `.env.example` to `.env`
3. Add a Google Maps API key if you want live maps
4. Run `npm run dev`

## Structure

```text
src/
  components/      shared UI like layout, map, badges, and ratings
  context/         language + auth state
  i18n/            English and Afrikaans dictionary
  pages/           customer, driver, and admin screens
  services/        local auth, ride, driver, and upload operations
  utils/           fare math, formatting, and driver eligibility helpers
```

## Deploy

- `npm run build`
- Deploy the `dist` folder to any static host such as Vercel, Netlify, GitHub Pages, or Firebase Hosting

## Notes

- Customer login is optional and controlled by `VITE_ENABLE_CUSTOMER_LOGIN`.
- The map component falls back to coordinate cards when a Google Maps API key is missing.
- Driver accounts, rides, subscriptions, and uploaded images are stored in browser local storage.
- For production, replace the local services with a real backend before handling real users or payments.
