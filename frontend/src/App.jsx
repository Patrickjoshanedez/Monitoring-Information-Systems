import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import HowItWorksPage from './pages/HowItWorksPage.jsx';
import FeaturesPage from './pages/FeaturesPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import LoginPage from './features/auth/pages/LoginPage.jsx';
import RegisterPage from './features/auth/pages/RegisterPage.jsx';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage.jsx';
import OAuthCallbackPage from './features/auth/pages/OAuthCallbackPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}


