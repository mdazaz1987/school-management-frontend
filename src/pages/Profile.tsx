import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/profileService';

export const Profile: React.FC = () => {
  const { user, setUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || '',
  });

  // Load profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        console.log('Loading profile from backend...');
        const profileData = await profileService.getProfile();
        console.log('Profile loaded:', profileData);
        
        // Update context and localStorage
        setUser(profileData);
        localStorage.setItem('user', JSON.stringify(profileData));
        
        // Update form data
        setFormData({
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          phoneNumber: profileData.phoneNumber || '',
          address: profileData.address || '',
        });
      } catch (err: any) {
        console.error('Error loading profile:', err);
        console.error('Error response:', err.response);
        
        // Show warning message about backend connectivity
        if (err.message?.includes('CORS') || err.message?.includes('Network Error')) {
          setErrorMessage('Backend connection issue. Using cached data. Please ensure backend is running.');
        }
        
        // If profile load fails, use data from localStorage or context
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            setUser(parsedUser);
            setFormData({
              firstName: parsedUser.firstName || '',
              lastName: parsedUser.lastName || '',
              phoneNumber: parsedUser.phoneNumber || '',
              address: parsedUser.address || '',
            });
            console.log('Using cached profile data');
          } catch (e) {
            console.error('Error parsing cached user:', e);
          }
        } else if (user) {
          setFormData({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            phoneNumber: user.phoneNumber || '',
            address: user.address || '',
          });
          console.log('Using context user data');
        }
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Load once on mount

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSaveMessage('');
    setIsLoading(true);

    try {
      const updatedUser = await profileService.updateProfile(formData);
      
      // Update user in context and localStorage
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setSaveMessage('Profile updated successfully!');
      setIsEditing(false);
      
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err: any) {
      console.error('Profile update error:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phoneNumber: user?.phoneNumber || '',
      address: user?.address || '',
    });
    setIsEditing(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size must not exceed 5MB');
      return;
    }

    setUploadingPhoto(true);
    setErrorMessage('');

    try {
      const response = await profileService.uploadPhoto(file);
      
      // Update user with new photo
      if (user) {
        const updatedUser = { ...user, profilePhoto: response.photoUrl.split('/').pop() };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      setSaveMessage('Profile photo uploaded successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err: any) {
      console.error('Photo upload error:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const getProfilePhotoUrl = () => {
    if (user?.profilePhoto) {
      return profileService.getPhotoUrl(user.profilePhoto);
    }
    return null;
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
            <i className="bi bi-check-circle me-2"></i>
            {saveMessage}
          </Alert>
        )}

        {errorMessage && (
          <Alert variant="danger" dismissible onClose={() => setErrorMessage('')}>
            <i className="bi bi-exclamation-triangle me-2"></i>
            {errorMessage}
          </Alert>
        )}

        <Row>
          <Col lg={4} className="mb-4">
            <Card className="border-0 shadow-sm text-center">
              <Card.Body className="p-4">
                <div className="mb-3 position-relative d-inline-block">
                  {uploadingPhoto ? (
                    <div 
                      className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center"
                      style={{ width: '120px', height: '120px' }}
                    >
                      <Spinner animation="border" variant="primary" />
                    </div>
                  ) : (
                    <>
                      {getProfilePhotoUrl() ? (
                        <img
                          src={getProfilePhotoUrl()!}
                          alt="Profile"
                          className="rounded-circle"
                          style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div 
                          className="rounded-circle bg-primary bg-opacity-10 d-inline-flex align-items-center justify-content-center"
                          style={{ width: '120px', height: '120px' }}
                        >
                          <i className="bi bi-person-circle text-primary" style={{ fontSize: '80px' }}></i>
                        </div>
                      )}
                      <Button
                        variant="primary"
                        size="sm"
                        className="rounded-circle position-absolute"
                        style={{ bottom: '0', right: '0' }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <i className="bi bi-camera"></i>
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handlePhotoUpload}
                      />
                    </>
                  )}
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
                          required
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
                          required
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
                          value={user?.email || ''}
                          disabled
                          placeholder="Email cannot be changed"
                        />
                        <Form.Text className="text-muted">
                          Email cannot be changed
                        </Form.Text>
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
                      <Button variant="primary" type="submit" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-lg me-2"></i>
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button variant="outline-secondary" type="button" onClick={handleCancel} disabled={isLoading}>
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
