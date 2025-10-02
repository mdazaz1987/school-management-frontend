import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { ParentDashboard } from './pages/ParentDashboard';
import { ComingSoon } from './pages/ComingSoon';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import './App.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Dashboard Router Component
const DashboardRouter: React.FC = () => {
  const { hasRole, user } = useAuth();

  console.log('DashboardRouter - Current user:', user);
  console.log('DashboardRouter - User roles:', user?.roles);

  // Route to appropriate dashboard based on user role
  if (hasRole('ADMIN')) {
    console.log('Rendering Admin Dashboard');
    return <AdminDashboard />;
  } else if (hasRole('TEACHER')) {
    console.log('Rendering Teacher Dashboard');
    return <TeacherDashboard />;
  } else if (hasRole('STUDENT')) {
    console.log('Rendering Student Dashboard');
    return <StudentDashboard />;
  } else if (hasRole('PARENT')) {
    console.log('Rendering Parent Dashboard');
    return <ParentDashboard />;
  }

  console.error('No matching role found for user:', user);
  return (
    <Container className="text-center mt-5">
      <h1>Unauthorized</h1>
      <p>You don't have permission to access this page.</p>
      <p className="text-muted">User roles: {JSON.stringify(user?.roles)}</p>
    </Container>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Dashboard routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />
          
          {/* Profile and Settings - Available for all users */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          
          {/* Common protected routes that show "Coming Soon" */}
          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <ComingSoon />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teachers"
            element={
              <ProtectedRoute>
                <ComingSoon />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classes"
            element={
              <ProtectedRoute>
                <ComingSoon />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjects"
            element={
              <ProtectedRoute>
                <ComingSoon />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parents"
            element={
              <ProtectedRoute>
                <ComingSoon />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exams"
            element={
              <ProtectedRoute>
                <ComingSoon />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fees"
            element={
              <ProtectedRoute>
                <ComingSoon />
              </ProtectedRoute>
            }
          />
          <Route
            path="/timetable"
            element={
              <ProtectedRoute>
                <ComingSoon />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <ComingSoon />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assignments"
            element={
              <ProtectedRoute>
                <ComingSoon />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <ComingSoon />
              </ProtectedRoute>
            }
          />
          <Route
            path="/grades"
            element={
              <ProtectedRoute>
                <ComingSoon />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-classes"
            element={
              <ProtectedRoute>
                <ComingSoon />
              </ProtectedRoute>
            }
          />
          <Route
            path="/grading"
            element={
              <ProtectedRoute>
                <ComingSoon />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-children"
            element={
              <ProtectedRoute>
                <ComingSoon />
              </ProtectedRoute>
            }
          />
          <Route
            path="/children"
            element={
              <ProtectedRoute>
                <ComingSoon />
              </ProtectedRoute>
            }
          />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          
          {/* Catch-all for any other routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <ComingSoon />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
