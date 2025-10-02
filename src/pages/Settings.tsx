import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, ListGroup } from 'react-bootstrap';
import { Layout } from '../components/Layout';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'password' | 'notifications' | 'preferences'>('password');
  const [saveMessage, setSaveMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    assignmentReminders: true,
    gradeUpdates: true,
    attendanceAlerts: true,
    feeReminders: true,
    systemAnnouncements: true,
  });

  // General preferences
  const [preferences, setPreferences] = useState({
    language: 'en',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    theme: 'light',
  });

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSaveMessage('');

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('New passwords do not match!');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long!');
      return;
    }

    // TODO: Implement API call to change password
    console.log('Changing password...');
    setSaveMessage('Password changed successfully!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleNotificationToggle = (key: keyof typeof notifications) => {
    setNotifications({ ...notifications, [key]: !notifications[key] });
    setSaveMessage('Notification preferences updated!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handlePreferenceChange = (key: keyof typeof preferences, value: string) => {
    setPreferences({ ...preferences, [key]: value });
    setSaveMessage('Preferences updated!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <Layout>
      <Container className="py-4">
        <Row className="mb-4">
          <Col>
            <h2>Settings</h2>
            <p className="text-muted">Manage your account settings and preferences</p>
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
          <Col lg={3} className="mb-4">
            <Card className="border-0 shadow-sm">
              <ListGroup variant="flush">
                <ListGroup.Item
                  action
                  active={activeTab === 'password'}
                  onClick={() => setActiveTab('password')}
                  className="d-flex align-items-center"
                >
                  <i className="bi bi-shield-lock me-2"></i>
                  Security
                </ListGroup.Item>
                <ListGroup.Item
                  action
                  active={activeTab === 'notifications'}
                  onClick={() => setActiveTab('notifications')}
                  className="d-flex align-items-center"
                >
                  <i className="bi bi-bell me-2"></i>
                  Notifications
                </ListGroup.Item>
                <ListGroup.Item
                  action
                  active={activeTab === 'preferences'}
                  onClick={() => setActiveTab('preferences')}
                  className="d-flex align-items-center"
                >
                  <i className="bi bi-gear me-2"></i>
                  Preferences
                </ListGroup.Item>
              </ListGroup>
            </Card>

            <Card className="border-0 shadow-sm mt-3">
              <Card.Body className="text-center">
                <i className="bi bi-info-circle text-primary mb-2" style={{ fontSize: '2rem' }}></i>
                <h6>Need Help?</h6>
                <p className="small text-muted mb-3">
                  Contact support for assistance with your account
                </p>
                <Button variant="outline-primary" size="sm">
                  <i className="bi bi-envelope me-2"></i>
                  Contact Support
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={9}>
            {/* Security Tab */}
            {activeTab === 'password' && (
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">
                    <i className="bi bi-shield-lock me-2"></i>
                    Change Password
                  </h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <p className="text-muted mb-4">
                    Ensure your account is using a long, random password to stay secure.
                  </p>
                  <Form onSubmit={handlePasswordChange}>
                    <Form.Group className="mb-3">
                      <Form.Label>Current Password</Form.Label>
                      <Form.Control
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        placeholder="Enter current password"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>New Password</Form.Label>
                      <Form.Control
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="Enter new password"
                        required
                      />
                      <Form.Text className="text-muted">
                        Password must be at least 8 characters long
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label>Confirm New Password</Form.Label>
                      <Form.Control
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="Confirm new password"
                        required
                      />
                    </Form.Group>

                    <Button variant="primary" type="submit">
                      <i className="bi bi-check-lg me-2"></i>
                      Update Password
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">
                    <i className="bi bi-bell me-2"></i>
                    Notification Preferences
                  </h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <p className="text-muted mb-4">
                    Choose what notifications you want to receive
                  </p>

                  <ListGroup variant="flush">
                    <ListGroup.Item className="px-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">Email Notifications</h6>
                          <small className="text-muted">Receive email updates about your account</small>
                        </div>
                        <Form.Check
                          type="switch"
                          checked={notifications.emailNotifications}
                          onChange={() => handleNotificationToggle('emailNotifications')}
                        />
                      </div>
                    </ListGroup.Item>

                    <ListGroup.Item className="px-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">Assignment Reminders</h6>
                          <small className="text-muted">Get notified about pending assignments</small>
                        </div>
                        <Form.Check
                          type="switch"
                          checked={notifications.assignmentReminders}
                          onChange={() => handleNotificationToggle('assignmentReminders')}
                        />
                      </div>
                    </ListGroup.Item>

                    <ListGroup.Item className="px-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">Grade Updates</h6>
                          <small className="text-muted">Receive alerts when grades are posted</small>
                        </div>
                        <Form.Check
                          type="switch"
                          checked={notifications.gradeUpdates}
                          onChange={() => handleNotificationToggle('gradeUpdates')}
                        />
                      </div>
                    </ListGroup.Item>

                    <ListGroup.Item className="px-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">Attendance Alerts</h6>
                          <small className="text-muted">Get notified about attendance records</small>
                        </div>
                        <Form.Check
                          type="switch"
                          checked={notifications.attendanceAlerts}
                          onChange={() => handleNotificationToggle('attendanceAlerts')}
                        />
                      </div>
                    </ListGroup.Item>

                    <ListGroup.Item className="px-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">Fee Reminders</h6>
                          <small className="text-muted">Receive reminders for pending fee payments</small>
                        </div>
                        <Form.Check
                          type="switch"
                          checked={notifications.feeReminders}
                          onChange={() => handleNotificationToggle('feeReminders')}
                        />
                      </div>
                    </ListGroup.Item>

                    <ListGroup.Item className="px-0 border-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1">System Announcements</h6>
                          <small className="text-muted">Important updates from the school</small>
                        </div>
                        <Form.Check
                          type="switch"
                          checked={notifications.systemAnnouncements}
                          onChange={() => handleNotificationToggle('systemAnnouncements')}
                        />
                      </div>
                    </ListGroup.Item>
                  </ListGroup>
                </Card.Body>
              </Card>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">
                    <i className="bi bi-gear me-2"></i>
                    General Preferences
                  </h5>
                </Card.Header>
                <Card.Body className="p-4">
                  <p className="text-muted mb-4">
                    Customize your application experience
                  </p>

                  <Form>
                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>Language</Form.Label>
                          <Form.Select
                            value={preferences.language}
                            onChange={(e) => handlePreferenceChange('language', e.target.value)}
                          >
                            <option value="en">English</option>
                            <option value="hi">हिन्दी (Hindi)</option>
                            <option value="mr">मराठी (Marathi)</option>
                            <option value="ta">தமிழ் (Tamil)</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>Timezone</Form.Label>
                          <Form.Select
                            value={preferences.timezone}
                            onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                          >
                            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                            <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                            <option value="America/New_York">America/New York (EST)</option>
                            <option value="Europe/London">Europe/London (GMT)</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>Date Format</Form.Label>
                          <Form.Select
                            value={preferences.dateFormat}
                            onChange={(e) => handlePreferenceChange('dateFormat', e.target.value)}
                          >
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>

                      <Col md={6} className="mb-3">
                        <Form.Group>
                          <Form.Label>Theme</Form.Label>
                          <Form.Select
                            value={preferences.theme}
                            onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                          >
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                            <option value="auto">Auto (System)</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  </Form>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </Layout>
  );
};
