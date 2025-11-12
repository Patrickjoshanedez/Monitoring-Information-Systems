import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import LandingPage from './pages/landingPages/LandingPage';
import AboutPage from './pages/landingPages/AboutPage';
import HowItWorksPage from './pages/landingPages/HowItWorksPage';
import FeaturesPage from './pages/landingPages/FeaturesPage';
import ContactPage from './pages/landingPages/ContactPage';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage';
import AdminDashboard from './components/dashboards/AdminDashboard';
import MentorDashboard from './components/dashboards/MentorDashboard';
import MenteeDashboard from './components/dashboards/MenteeDashboard';
import MyMentorPage from './pages/menteeDashboards/MyMentorPage';
import SessionPage from './pages/menteeDashboards/SessionPage';
import ApplyPage from './pages/menteeDashboards/ApplyPage';
import AnnouncementsPage from './pages/menteeDashboards/AnnouncementsPage';
import MenteeApplicationForm from './pages/applicationPages/MenteeApplicationForm';
import PendingApprovalPage from './pages/PendingApprovalPage';
import MentorApplicationForm from './pages/applicationPages/MentorApplicationForm';
import MentorPendingPage from './pages/MentorPendingPage';
import AdminPendingPage from './pages/AdminPendingPage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import OAuthCallbackPage from './pages/OAuthCallbackPage';
import ProfilePage from './pages/menteeDashboards/ProfilePage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SetPasswordPage from './features/auth/pages/SetPasswordPage.jsx';
import ProfileSettings from './features/profile/pages/ProfileSettings.jsx';
import ChatPage from './pages/ChatPage';
import MentorProfileEditor from './components/mentor/MentorProfileEditor';

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
const MentorApplicationRoute = () => <ProtectedRoute requiredRole="mentor" children={<MentorApplicationForm />} />;
const MentorPendingRoute = () => <ProtectedRoute requiredRole="mentor" children={<MentorPendingPage />} />;
const AdminPendingRoute = () => <ProtectedRoute requiredRole="admin" children={<AdminPendingPage />} />;
const ProfileRoute = () => <ProtectedRoute requiredRole={undefined} children={<ProfilePage />} />;
const ProfileSettingsRoute = () => <ProtectedRoute requiredRole="mentee" children={<ProfileSettings />} />;
const SetPasswordRoute = () => <ProtectedRoute requiredRole={undefined} children={<SetPasswordPage />} />;
const MentorChatRoute = () => <ProtectedRoute requiredRole="mentor" children={<ChatPage />} />;
const MenteeChatRoute = () => <ProtectedRoute requiredRole="mentee" children={<ChatPage />} />;
const MentorProfileEditRoute = () => <ProtectedRoute requiredRole="mentor" children={<MentorProfileEditor />} />;

const App = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
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
        <Route path="/set-password" element={<SetPasswordRoute />} />

        {/* Dashboard Routes */}
        <Route path="/admin/dashboard" element={<AdminRoute />} />
        <Route path="/mentor/dashboard" element={<MentorRoute />} />
        <Route path="/mentor/chat" element={<MentorChatRoute />} />
  <Route path="/mentor/profile/edit" element={<MentorProfileEditRoute />} />
        <Route path="/mentee/dashboard" element={<MenteeRoute />} />
        <Route path="/mentee/chat" element={<MenteeChatRoute />} />
        <Route path="/mentee/my-mentor" element={<MyMentorRoute />} />
        <Route path="/mentee/session" element={<SessionRoute />} />
        <Route path="/mentee/apply" element={<ApplyRoute />} />
        <Route path="/mentee/announcements" element={<AnnouncementsRoute />} />

        {/* Application Routes */}
        <Route path="/mentee/application" element={<ApplicationRoute />} />
        <Route path="/mentee/pending" element={<PendingRoute />} />
        <Route path="/mentor/application" element={<MentorApplicationRoute />} />
        <Route path="/mentor/pending" element={<MentorPendingRoute />} />
        <Route path="/admin/pending" element={<AdminPendingRoute />} />
        <Route path="/profile" element={<ProfileRoute />} />
        <Route path="/profile/settings" element={<ProfileSettingsRoute />} />
      </Routes>
    </AnimatePresence>
  );
};

export default App;


