import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import HowItWorksPage from './pages/HowItWorksPage';
import FeaturesPage from './pages/FeaturesPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage';
import AdminDashboard from './components/dashboards/AdminDashboard';
import MentorDashboard from './components/dashboards/MentorDashboard';
import MenteeDashboard from './components/dashboards/MenteeDashboard';
import MyMentorPage from './pages/MyMentorPage';
import SessionPage from './pages/SessionPage';
import ApplyPage from './pages/ApplyPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import MenteeApplicationForm from './pages/MenteeApplicationForm';
import PendingApprovalPage from './pages/PendingApprovalPage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Wrapper components for better TypeScript support
const AdminRoute = () => <ProtectedRoute requiredRole="admin" children={<AdminDashboard />} />;
const MentorRoute = () => <ProtectedRoute requiredRole="mentor" children={<MentorDashboard />} />;
const MenteeRoute = () => <ProtectedRoute requiredRole="mentee" children={<MenteeDashboard />} />;
const MyMentorRoute = () => <ProtectedRoute requiredRole="mentee" children={<MyMentorPage />} />;
const SessionRoute = () => <ProtectedRoute requiredRole="mentee" children={<SessionPage />} />;
const ApplyRoute = () => <ProtectedRoute requiredRole="mentee" children={<ApplyPage />} />;
const AnnouncementsRoute = () => <ProtectedRoute requiredRole="mentee" children={<AnnouncementsPage />} />;
const ApplicationRoute = () => <ProtectedRoute requiredRole="mentee" children={<MenteeApplicationForm />} />;
const PendingRoute = () => <ProtectedRoute requiredRole="mentee" children={<PendingApprovalPage />} />;

const App = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/contact" element={<ContactPage />} />
      
          {/* Auth Pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/role-selection" element={<RoleSelectionPage />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
      
      {/* Dashboard Routes */}
      <Route path="/admin/dashboard" element={<AdminRoute />} />
      <Route path="/mentor/dashboard" element={<MentorRoute />} />
      <Route path="/mentee/dashboard" element={<MenteeRoute />} />
      <Route path="/mentee/my-mentor" element={<MyMentorRoute />} />
      <Route path="/mentee/session" element={<SessionRoute />} />
      <Route path="/mentee/apply" element={<ApplyRoute />} />
      <Route path="/mentee/announcements" element={<AnnouncementsRoute />} />
      
      {/* Application Routes */}
      <Route path="/mentee/application" element={<ApplicationRoute />} />
      <Route path="/mentee/pending" element={<PendingRoute />} />
    </Routes>
  );
};

export default App;


