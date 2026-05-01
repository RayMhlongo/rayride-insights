# Insight Rides

Insight Rides is a lightweight school taxi and shuttle management app for small local operators. It replaces Excel tracking for students, payments, routes, trips, vehicles, income, expenses, and reports.

## Stack

- React + Vite
- Tailwind CSS
- React Router
- Chart.js
- Google OAuth + Google Drive API
- JSON files in Google Drive as the only storage layer
- GitHub Pages-ready frontend

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment file:

   ```bash
   cp .env.example .env
   ```

3. Add Google credentials to `.env`:

   ```bash
   VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
   VITE_GOOGLE_API_KEY=your-google-api-key
   VITE_DRIVE_FOLDER_ID=
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

If the Google values are not configured yet, the app can run in local mode using `localStorage`.

## Google Drive API Setup

1. Create or open a project in Google Cloud Console.
2. Enable the Google Drive API.
3. Create an OAuth Client ID for a web application.
4. Add authorized JavaScript origins:
   - `http://localhost:5173`
   - your GitHub Pages origin, for example `https://your-user.github.io`
5. Create an API key and restrict it to the Drive API and your allowed web origins.
6. Put the Client ID and API key in `.env`.
7. Leave `VITE_DRIVE_FOLDER_ID` blank to let the app create an `InsightRides` folder, or set it to an existing Drive folder ID.

## Drive Data Layout

The app stores structured JSON files only:

```text
InsightRides/
  students.json
  routes.json
  vehicles.json
  payments.json
  trips/YYYY-MM.json
  expenses/YYYY-MM.json
  income/YYYY-MM.json
```

Each record uses generated IDs and update timestamps. The app syncs Drive data on login, caches the latest session in `localStorage`, and queues offline edits until the user syncs again.

## Deploy to GitHub Pages

1. Commit the app to GitHub.
2. In GitHub repository settings, enable Pages from GitHub Actions.
3. Add repository secrets:
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_GOOGLE_API_KEY`
   - `VITE_DRIVE_FOLDER_ID` if using a fixed folder
4. Create `.github/workflows/deploy.yml`:

   ```yaml
   name: Deploy Insight Rides

   on:
     push:
       branches: [main]

   permissions:
     contents: read
     pages: write
     id-token: write

   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 20
         - run: npm install
         - run: npm run build
           env:
             GITHUB_PAGES: true
             VITE_GOOGLE_CLIENT_ID: ${{ secrets.VITE_GOOGLE_CLIENT_ID }}
             VITE_GOOGLE_API_KEY: ${{ secrets.VITE_GOOGLE_API_KEY }}
             VITE_DRIVE_FOLDER_ID: ${{ secrets.VITE_DRIVE_FOLDER_ID }}
         - uses: actions/upload-pages-artifact@v3
           with:
             path: dist
     deploy:
       needs: build
       runs-on: ubuntu-latest
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       steps:
         - id: deployment
           uses: actions/deploy-pages@v4
   ```

## Production Notes

- Google login is required for Drive sync.
- Only files created or opened through the app are available with the `drive.file` scope.
- For a multi-business setup, use a different Drive folder ID per business account.
- No paid services, Firebase, or external databases are required.
