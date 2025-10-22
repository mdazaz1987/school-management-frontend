import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { classService } from '../services/classService';
import { notificationService } from '../services/notificationService';
import { FaBell, FaPaperPlane, FaUsers, FaUserTag, FaSchool } from 'react-icons/fa';

interface NotificationForm {
  title: string;
  message: string;
  type: string;
  priority: string;
  recipientType: 'ALL' | 'ROLES' | 'CLASSES' | 'SPECIFIC';
  selectedRoles: string[];
  selectedClasses: string[];
  link?: string;
  attachmentUrl?: string;
}

export const CreateNotification: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState<NotificationForm>({
    title: '',
    message: '',
    type: 'GENERAL',
    priority: 'MEDIUM',
    recipientType: 'ALL',
    selectedRoles: [],
    selectedClasses: [],
    link: '',
    attachmentUrl: '',
  });
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    if (user?.schoolId) {
      loadClasses();
    }
  }, [user?.schoolId]);

  const loadClasses = async () => {
    try {
      setLoadingClasses(true);
      const data = await classService.getAllClasses({ schoolId: user?.schoolId });
      setClasses(data);
    } catch (err) {
      console.error('Failed to load classes:', err);
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleChange = (field: keyof NotificationForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleRoleToggle = (role: string) => {
    setForm(prev => ({
      ...prev,
      selectedRoles: prev.selectedRoles.includes(role)
        ? prev.selectedRoles.filter(r => r !== role)
        : [...prev.selectedRoles, role]
    }));
  };

  const handleClassToggle = (classId: string) => {
    setForm(prev => ({
      ...prev,
      selectedClasses: prev.selectedClasses.includes(classId)
        ? prev.selectedClasses.filter(c => c !== classId)
        : [...prev.selectedClasses, classId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title.trim() || !form.message.trim()) {
      setError('Title and message are required');
      return;
    }

    if (form.recipientType === 'ROLES' && form.selectedRoles.length === 0) {
      setError('Please select at least one role');
      return;
    }

    if (form.recipientType === 'CLASSES' && form.selectedClasses.length === 0) {
      setError('Please select at least one class');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload: any = {
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        priority: form.priority,
        schoolId: user?.schoolId,
        senderId: user?.id,
        senderName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        link: form.link?.trim() || undefined,
        attachmentUrl: form.attachmentUrl || undefined,
      };

      if (form.recipientType === 'ALL') {
        payload.sendToAll = true;
      } else if (form.recipientType === 'ROLES') {
        payload.recipientRoles = form.selectedRoles;
      } else if (form.recipientType === 'CLASSES') {
        payload.recipientClasses = form.selectedClasses;
      }

      await notificationService.create(payload);
      setSuccess('Notification sent successfully!');
      
      // Reset form
      setTimeout(() => {
        navigate('/notifications');
      }, 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const sidebarItems = React.useMemo(() => {
    const roles = user?.roles || [];
    if (roles.includes('ADMIN')) {
      return [
        { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
        { path: '/students', label: 'Students', icon: 'bi-people' },
        { path: '/teachers', label: 'Teachers', icon: 'bi-person-badge' },
        { path: '/classes', label: 'Classes', icon: 'bi-door-open' },
        { path: '/subjects', label: 'Subjects', icon: 'bi-book' },
        { path: '/exams', label: 'Exams', icon: 'bi-clipboard-check' },
        { path: '/fees', label: 'Fees', icon: 'bi-cash-coin' },
        { path: '/timetable', label: 'Timetable', icon: 'bi-calendar3' },
        { path: '/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
        { path: '/notifications', label: 'Notifications', icon: 'bi-bell' },
      ];
    }
    if (roles.includes('TEACHER')) {
      return [
        { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
        { path: '/teacher/my-classes', label: 'My Classes', icon: 'bi-door-open' },
        { path: '/teacher/assignments', label: 'Assignments', icon: 'bi-file-text' },
        { path: '/teacher/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
        { path: '/teacher/grading', label: 'Grading', icon: 'bi-star' },
        { path: '/teacher/timetable', label: 'My Timetable', icon: 'bi-calendar3' },
        { path: '/teacher/students', label: 'Students', icon: 'bi-people' },
        { path: '/notifications', label: 'Notifications', icon: 'bi-bell' },
      ];
    }
    return [{ path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' }];
  }, [user?.roles]);

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
      <Container fluid className="py-4">
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="mb-1">
                  <FaBell className="me-2" />
                  Create Notification
                </h2>
                <p className="text-muted mb-0">Send notifications to students, teachers, or parents</p>
              </div>
              <Button variant="secondary" onClick={() => navigate('/notifications')}>
                Back to Notifications
              </Button>
            </div>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col lg={8}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Notification Details</h5>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Title *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter notification title"
                      value={form.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Message *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={5}
                      placeholder="Enter notification message"
                      value={form.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      required
                    />
                    <Form.Text className="text-muted">
                      {form.message.length} characters
                    </Form.Text>
                  </Form.Group>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Type</Form.Label>
                        <Form.Select
                          value={form.type}
                          onChange={(e) => handleChange('type', e.target.value)}
                        >
                          <option value="GENERAL">General</option>
                          <option value="ANNOUNCEMENT">Announcement</option>
                          <option value="ASSIGNMENT">Assignment</option>
                          <option value="EXAM">Exam</option>
                          <option value="FEE">Fee</option>
                          <option value="ATTENDANCE">Attendance</option>
                          <option value="EVENT">Event</option>
                          <option value="HOLIDAY">Holiday</option>
                          <option value="RESULT">Result</option>
                          <option value="EMERGENCY">Emergency</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Priority</Form.Label>
                        <Form.Select
                          value={form.priority}
                          onChange={(e) => handleChange('priority', e.target.value)}
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Link (Optional)</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., /assignments/123 or https://example.com"
                      value={form.link}
                      onChange={(e) => handleChange('link', e.target.value)}
                    />
                    <Form.Text className="text-muted">
                      Add a link for users to view more details
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Attachment Image (Optional)</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files?.[0];
                        if (!file) { setImagePreview(''); handleChange('attachmentUrl', ''); return; }
                        if (file.size > 2 * 1024 * 1024) { // 2MB
                          setError('Image is too large. Max 2MB.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          const dataUrl = reader.result as string;
                          setImagePreview(dataUrl);
                          handleChange('attachmentUrl', dataUrl);
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', borderRadius: 8 }} />
                      </div>
                    )}
                    <Form.Text className="text-muted">Optional festive or event image.
                    </Form.Text>
                  </Form.Group>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Recipients</h5>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Send To</Form.Label>
                    <Form.Check
                      type="radio"
                      id="recipient-all"
                      label={
                        <span>
                          <FaSchool className="me-2" />
                          All Users (School-wide)
                        </span>
                      }
                      checked={form.recipientType === 'ALL'}
                      onChange={() => handleChange('recipientType', 'ALL')}
                    />
                    <Form.Check
                      type="radio"
                      id="recipient-roles"
                      label={
                        <span>
                          <FaUserTag className="me-2" />
                          Specific Roles
                        </span>
                      }
                      checked={form.recipientType === 'ROLES'}
                      onChange={() => handleChange('recipientType', 'ROLES')}
                    />
                    <Form.Check
                      type="radio"
                      id="recipient-classes"
                      label={
                        <span>
                          <FaUsers className="me-2" />
                          Specific Classes
                        </span>
                      }
                      checked={form.recipientType === 'CLASSES'}
                      onChange={() => handleChange('recipientType', 'CLASSES')}
                    />
                  </Form.Group>

                  {form.recipientType === 'ROLES' && (
                    <div className="mb-3">
                      <Form.Label>Select Roles</Form.Label>
                      <div className="d-flex flex-column gap-2">
                        {['TEACHER', 'STUDENT', 'PARENT'].map(role => (
                          <Form.Check
                            key={role}
                            type="checkbox"
                            id={`role-${role}`}
                            label={role}
                            checked={form.selectedRoles.includes(role)}
                            onChange={() => handleRoleToggle(role)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {form.recipientType === 'CLASSES' && (
                    <div className="mb-3">
                      <Form.Label>Select Classes</Form.Label>
                      {loadingClasses ? (
                        <Spinner animation="border" size="sm" />
                      ) : (
                        <div className="d-flex flex-column gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {classes.map(cls => (
                            <Form.Check
                              key={cls.id}
                              type="checkbox"
                              id={`class-${cls.id}`}
                              label={cls.className || cls.name}
                              checked={form.selectedClasses.includes(cls.id)}
                              onChange={() => handleClassToggle(cls.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4 p-3 bg-light rounded">
                    <h6 className="mb-2">Preview</h6>
                    <div className="d-flex gap-2 mb-2">
                      <Badge bg="primary">{form.type}</Badge>
                      <Badge bg={
                        form.priority === 'URGENT' ? 'danger' :
                        form.priority === 'HIGH' ? 'warning' :
                        form.priority === 'MEDIUM' ? 'info' : 'secondary'
                      }>{form.priority}</Badge>
                    </div>
                    <p className="mb-1"><strong>{form.title || 'Notification Title'}</strong></p>
                    <p className="mb-0 text-muted small">
                      {form.message || 'Notification message will appear here...'}
                    </p>
                  </div>
                </Card.Body>
              </Card>

              <div className="d-grid">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="me-2" />
                      Send Notification
                    </>
                  )}
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Container>
        </Col>
      </Row>
    </Layout>
  );
};
