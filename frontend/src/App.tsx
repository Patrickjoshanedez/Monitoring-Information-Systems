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
      
      {/* Dashboard Routes */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/mentor/dashboard" element={<MentorDashboard />} />
      <Route path="/mentee/dashboard" element={<MenteeDashboard />} />
      <Route path="/mentee/my-mentor" element={<MyMentorPage />} />
      <Route path="/mentee/session" element={<SessionPage />} />
      <Route path="/mentee/apply" element={<ApplyPage />} />
      <Route path="/mentee/announcements" element={<AnnouncementsPage />} />
    </Routes>
  );
};

export default App;


