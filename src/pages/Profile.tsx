import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement API call to update profile
    console.log('Saving profile:', formData);
    setSaveMessage('Profile updated successfully!');
    setIsEditing(false);
    
    // Clear message after 3 seconds
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      address: user?.address || '',
    });
    setIsEditing(false);
  };

  return (
    <Layout>
      <Container className="py-4">
        <Row className="mb-4">
          <Col>
            <h2>My Profile</h2>
            <p className="text-muted">Manage your personal information</p>
          </Col>
        </Row>

        {saveMessage && (
          <Alert variant="success" dismissible onClose={() => setSaveMessage('')}>
            {saveMessage}
          </Alert>
        )}

        <Row>
          <Col lg={4} className="mb-4">
            <Card className="border-0 shadow-sm text-center">
              <Card.Body className="p-4">
                <div className="mb-3">
                  <div 
                    className="rounded-circle bg-primary bg-opacity-10 d-inline-flex align-items-center justify-content-center"
                    style={{ width: '120px', height: '120px' }}
                  >
                    <i className="bi bi-person-circle text-primary" style={{ fontSize: '80px' }}></i>
                  </div>
                </div>
                <h4>{user?.firstName} {user?.lastName}</h4>
                <p className="text-muted mb-3">{user?.email}</p>
                <div className="d-flex flex-wrap gap-1 justify-content-center mb-3">
                  {user?.roles && Array.isArray(user.roles) && user.roles.map((role) => (
                    <span key={role} className="badge bg-primary">
                      {role}
                    </span>
                  ))}
                  {(!user?.roles || !Array.isArray(user.roles)) && user?.roles && (
                    <span className="badge bg-primary">
                      {user.roles}
                    </span>
                  )}
                </div>
                <hr />
                <div className="text-start">
                  <p className="mb-2">
                    <i className="bi bi-building me-2 text-muted"></i>
                    <small className="text-muted">School ID:</small><br />
                    <small className="ms-4">{user?.schoolId || 'N/A'}</small>
                  </p>
                  <p className="mb-2">
                    <i className="bi bi-calendar-check me-2 text-muted"></i>
                    <small className="text-muted">Member since:</small><br />
                    <small className="ms-4">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </small>
                  </p>
                  <p className="mb-0">
                    <i className="bi bi-circle-fill me-2 text-success" style={{ fontSize: '8px' }}></i>
                    <small className="text-success">Active</small>
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Personal Information</h5>
                {!isEditing && (
                  <Button variant="outline-primary" size="sm" onClick={() => setIsEditing(true)}>
                    <i className="bi bi-pencil me-2"></i>
                    Edit Profile
                  </Button>
                )}
              </Card.Header>
              <Card.Body className="p-4">
                <Form onSubmit={handleSave}>
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>First Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Enter first name"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Last Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Enter last name"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Email Address</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Enter email"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Phone Number</Form.Label>
                        <Form.Control
                          type="tel"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Enter phone number"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12} className="mb-3">
                      <Form.Group>
                        <Form.Label>Address</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Enter address"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {isEditing && (
                    <div className="d-flex gap-2 mt-4">
                      <Button variant="primary" type="submit">
                        <i className="bi bi-check-lg me-2"></i>
                        Save Changes
                      </Button>
                      <Button variant="outline-secondary" type="button" onClick={handleCancel}>
                        <i className="bi bi-x-lg me-2"></i>
                        Cancel
                      </Button>
                    </div>
                  )}
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Layout>
  );
};
