import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ActiveTripPage from './pages/ActiveTripPage';
import AdminDriversPage from './pages/AdminDriversPage';
import DriverAuthPage from './pages/DriverAuthPage';
import DriverDashboardPage from './pages/DriverDashboardPage';
import DriverOnboardingPage from './pages/DriverOnboardingPage';
import DriverRequestsPage from './pages/DriverRequestsPage';
import HomePage from './pages/HomePage';
import RateRidePage from './pages/RateRidePage';
import TrackRidePage from './pages/TrackRidePage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/track/:rideId" element={<TrackRidePage />} />
        <Route path="/rate/:rideId" element={<RateRidePage />} />
        <Route path="/driver/auth" element={<DriverAuthPage />} />
        <Route path="/driver/onboarding" element={<DriverOnboardingPage />} />
        <Route path="/driver/dashboard" element={<DriverDashboardPage />} />
        <Route path="/driver/requests" element={<DriverRequestsPage />} />
        <Route path="/driver/trip/:rideId" element={<ActiveTripPage />} />
        <Route path="/admin/drivers" element={<AdminDriversPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
