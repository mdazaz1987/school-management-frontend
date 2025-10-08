import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { authService } from '../services/authService';
import { Link } from 'react-router-dom';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email) {
      setError('Please enter your email');
      return;
    }
    try {
      setLoading(true);
      await authService.forgotPassword(email);
      setSuccess('If the email exists, a reset link has been sent. Please check your inbox.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center" style={{ background: '#f7f7fb' }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6} xl={5}>
            <Card className="shadow-sm border-0">
              <Card.Body className="p-4 p-md-5">
                <div className="text-center mb-3">
                  <i className="bi bi-shield-lock text-primary" style={{ fontSize: '2.25rem' }}></i>
                  <h3 className="mt-2 mb-1">Forgot Password</h3>
                  <p className="text-muted">Enter your email to receive a password reset link</p>
                </div>

                {error && (
                  <Alert variant="danger" onClose={() => setError('')} dismissible>
                    {error}
                  </Alert>
                )}
                {success && (
                  <Alert variant="success" onClose={() => setSuccess('')} dismissible>
                    {success}
                  </Alert>
                )}

                <Form onSubmit={submit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      size="lg"
                    />
                  </Form.Group>

                  <Button type="submit" variant="primary" className="w-100" size="lg" disabled={loading}>
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-envelope-paper me-2"></i>
                        Send Reset Link
                      </>
                    )}
                  </Button>
                </Form>

                <div className="text-center mt-3">
                  <Link to="/login">Back to login</Link>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};
