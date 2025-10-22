import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('Already authenticated, redirecting to dashboard...');
      window.location.href = '/dashboard';
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Attempting login with:', email);
      await login(email, password);
      console.log('Login successful!');
      console.log('User stored in localStorage:', localStorage.getItem('user'));
      console.log('Token stored in localStorage:', localStorage.getItem('token'));
      
      // Small delay to ensure state is updated, then force reload
      setTimeout(() => {
        console.log('Redirecting to dashboard...');
        window.location.href = '/dashboard';
      }, 100);
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message 
        || err.response?.data?.error 
        || err.message 
        || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'Admin', email: 'admin@school.com', password: 'Admin@123', variant: 'primary' },
    { role: 'Teacher', email: 'teacher@school.com', password: 'Teacher@123', variant: 'success' },
    { role: 'Student', email: 'student@school.com', password: 'Student@123', variant: 'info' },
    { role: 'Parent', email: 'parent@school.com', password: 'Parent@123', variant: 'warning' },
  ];

  const fillDemoCredentials = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
  };

  return (
    <div className="min-vh-100 d-flex align-items-center bg-gradient" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={10} lg={8} xl={6}>
            <Card className="shadow-lg border-0">
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <i className="bi bi-mortarboard-fill text-primary" style={{ fontSize: '3rem' }}></i>
                  <h2 className="mt-3 mb-2">School Management System</h2>
                  <p className="text-muted">Sign in to your account</p>
                </div>

                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      size="lg"
                    />
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      size="lg"
                    />
                  </Form.Group>

                  <div className="d-flex justify-content-end mb-4">
                    <Link to="/forgot-password">Forgot password?</Link>
                  </div>

                  <Button
                    variant="primary"
                    type="submit"
                    size="lg"
                    className="w-100"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right me-2"></i>
                        Sign In
                      </>
                    )}
                  </Button>
                </Form>

                <hr className="my-4" />

                <div>
                  <p className="text-center text-muted mb-3">
                    <small>Quick Login - Demo Accounts</small>
                  </p>
                  <Row className="g-2">
                    {demoAccounts.map((account) => (
                      <Col xs={6} key={account.role}>
                        <Button
                          variant={`outline-${account.variant}`}
                          size="sm"
                          className="w-100"
                          onClick={() => fillDemoCredentials(account.email, account.password)}
                        >
                          <i className="bi bi-person-circle me-1"></i>
                          {account.role}
                        </Button>
                      </Col>
                    ))}
                  </Row>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};
