import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Layout } from '../components/Layout';

export const ContactSupport: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would send to backend
    console.log('Support request:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Layout>
      <Container className="py-4">
        <h2 className="mb-4">Contact Support</h2>

        {submitted && (
          <Alert variant="success" className="mb-4">
            <i className="bi bi-check-circle me-2"></i>
            Thank you! Your message has been sent. We'll get back to you shortly.
          </Alert>
        )}

        <Row>
          <Col lg={8}>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <h5 className="mb-3">Send us a message</h5>
                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Your name"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="your.email@example.com"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Subject</Form.Label>
                    <Form.Control
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What is this regarding?"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Message</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Describe your issue or question..."
                      required
                    />
                  </Form.Group>

                  <Button type="submit" variant="primary" size="lg">
                    <i className="bi bi-send me-2"></i>
                    Send Message
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <h5 className="mb-3">
                  <i className="bi bi-person-circle me-2"></i>
                  Developer Contact
                </h5>
                <div className="mb-3">
                  <strong>Name:</strong>
                  <p className="mb-0">Mohammad Azaz</p>
                </div>
                <div className="mb-3">
                  <strong>Email:</strong>
                  <p className="mb-0">
                    <a href="mailto:support@azaz.online">support@azaz.online</a>
                  </p>
                </div>
                <div className="mb-3">
                  <strong>Phone:</strong>
                  <p className="mb-0">
                    <a href="tel:+917208642878">+91 7208642878</a>
                  </p>
                </div>
                <hr />
                <div className="d-grid gap-2">
                  <Button variant="outline-primary" href="mailto:support@azaz.online">
                    <i className="bi bi-envelope me-2"></i>
                    Email Us
                  </Button>
                  <Button variant="outline-success" href="tel:+917208642878">
                    <i className="bi bi-telephone me-2"></i>
                    Call Us
                  </Button>
                </div>
              </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm mb-4">
              <Card.Body className="p-4">
                <h5 className="mb-3">
                  <i className="bi bi-clock me-2"></i>
                  Support Hours
                </h5>
                <p className="mb-2"><strong>Monday - Friday:</strong><br />9:00 AM - 6:00 PM IST</p>
                <p className="mb-2"><strong>Saturday:</strong><br />10:00 AM - 4:00 PM IST</p>
                <p className="mb-0"><strong>Sunday:</strong><br />Closed</p>
              </Card.Body>
            </Card>

            <Card className="border-0 shadow-sm">
              <Card.Body className="p-4">
                <h5 className="mb-3">
                  <i className="bi bi-question-circle me-2"></i>
                  FAQs
                </h5>
                <div className="mb-3">
                  <strong>How do I reset my password?</strong>
                  <p className="mb-0 text-muted small">Go to Settings → Security and click "Change Password".</p>
                </div>
                <div className="mb-3">
                  <strong>How do I update my profile?</strong>
                  <p className="mb-0 text-muted small">Navigate to Dashboard and click on your profile picture.</p>
                </div>
                <div className="mb-3">
                  <strong>How do I contact my teacher?</strong>
                  <p className="mb-0 text-muted small">Go to the Classes section and view teacher contact information.</p>
                </div>
                <div>
                  <strong>How do I apply for leave?</strong>
                  <p className="mb-0 text-muted small">Students can apply for leave from their dashboard. Parents will be notified for approval.</p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Layout>
  );
};
