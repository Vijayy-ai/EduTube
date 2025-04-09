import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';

// Common Components
import LoadingSpinner from './components/common/LoadingSpinner';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

// Auth Components
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';

// Eager loaded pages
import VideoPage from './pages/VideoPage';
import PlaylistPage from './pages/PlaylistPage';
import QuizGeneratePage from './pages/QuizGeneratePage';

// Lazy loaded components
const HomePage = lazy(() => import('./pages/HomePage'));
const Login = lazy(() => import('./pages/LoginPage'));
const Register = lazy(() => import('./pages/RegisterPage'));
const Dashboard = lazy(() => import('./pages/DashboardPage'));
const CoursesPage = lazy(() => import('./pages/CoursesPage'));
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage'));
const LessonPage = lazy(() => import('./pages/LessonPage'));
const CertificatesPage = lazy(() => import('./pages/CertificatesPage'));
const CertificateDetailPage = lazy(() => import('./pages/CertificateDetailPage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Loading Fallback Component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="lg" text="Loading..." />
  </div>
);

// Layout Component
const AppLayout = ({ children }) => {
  const location = useLocation();
  const isDashboardRoute = 
    location.pathname === '/dashboard' || 
    location.pathname === '/profile' || 
    location.pathname.startsWith('/dashboard/');
  
  // Render without navbar/footer for dashboard routes
  if (isDashboardRoute) {
    return <>{children}</>;
  }
  
  // Regular layout for other routes
  return (
    <>
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>
      <Footer />
    </>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-white">
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<AppLayout><HomePage /></AppLayout>} />
              <Route path="/courses" element={<AppLayout><CoursesPage /></AppLayout>} />
              <Route path="/login" element={<AppLayout><Login /></AppLayout>} />
              <Route path="/register" element={<AppLayout><Register /></AppLayout>} />
              
              {/* Protected Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/courses/:courseId" 
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <CourseDetailPage />
                    </AppLayout>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/courses/:courseId/lessons/:lessonId" 
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <LessonPage />
                    </AppLayout>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/courses/video/:videoId" 
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <VideoPage />
                    </AppLayout>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/courses/playlist/:playlistId/:videoIndex?" 
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <PlaylistPage />
                    </AppLayout>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/certificates" 
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <CertificatesPage />
                    </AppLayout>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/certificates/:certificateId" 
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <CertificateDetailPage />
                    </AppLayout>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <PrivateRoute>
                    <ProfilePage />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/quiz/:quizId" 
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <QuizPage />
                    </AppLayout>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/quiz/generate/:courseId" 
                element={
                  <PrivateRoute>
                    <AppLayout>
                      <QuizGeneratePage />
                    </AppLayout>
                  </PrivateRoute>
                } 
              />
              
              {/* 404 Route */}
              <Route path="/404" element={<AppLayout><NotFoundPage /></AppLayout>} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </Suspense>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
