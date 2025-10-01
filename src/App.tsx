import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { ParentDashboard } from './pages/ParentDashboard';
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
  const { hasRole } = useAuth();

  // Route to appropriate dashboard based on user role
  if (hasRole('ADMIN')) {
    return <AdminDashboard />;
  } else if (hasRole('TEACHER')) {
    return <TeacherDashboard />;
  } else if (hasRole('STUDENT')) {
    return <StudentDashboard />;
  } else if (hasRole('PARENT')) {
    return <ParentDashboard />;
  }

  return (
    <Container className="text-center mt-5">
      <h1>Unauthorized</h1>
      <p>You don't have permission to access this page.</p>
    </Container>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
