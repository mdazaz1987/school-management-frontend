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
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
