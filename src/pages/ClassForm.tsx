import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { classService } from '../services/classService';
import { SchoolClass } from '../types';

export const ClassForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<Partial<SchoolClass>>({
    className: '',
    name: '',
    grade: '',
    section: '',
    schoolId: user?.schoolId || '',
    academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    capacity: undefined,
    room: '',
    description: '',
    isActive: true,
    fees: undefined,
    feesType: 'ANNUAL',
    durationMonths: undefined,
  });

  useEffect(() => {
    if (isEditMode && id) {
      loadClass(id);
    }
  }, [id, isEditMode]);

  const loadClass = async (classId: string) => {
    try {
      setLoading(true);
      const cls = await classService.getClassById(classId);
      setFormData(cls);
    } catch (err: any) {
      console.error('Error loading class:', err);
      setError(err.response?.data?.message || 'Failed to load class details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? undefined : parseFloat(value)) : value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      // Debug: Check authentication
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      console.log('=== Class Creation Debug ===');
      console.log('Has token:', !!token);
      console.log('User:', userStr ? JSON.parse(userStr) : null);
      console.log('Form data:', formData);
      console.log('========================');

      // Clean up formData - ensure numeric fields have proper values
      const cleanedData = {
        ...formData,
        fees: formData.fees ? Number(formData.fees) : undefined,
        capacity: formData.capacity ? Number(formData.capacity) : undefined,
        durationMonths: formData.durationMonths ? Number(formData.durationMonths) : undefined,
      };

      if (isEditMode && id) {
        await classService.updateClass(id, cleanedData);
        setSuccess('Class updated successfully!');
      } else {
        await classService.createClass(cleanedData);
        setSuccess('Class created successfully!');
      }

      setTimeout(() => {
        navigate('/classes');
      }, 1500);
    } catch (err: any) {
      console.error('Error saving class:', err);
      console.error('Error response:', err.response);
      
      let errorMessage = 'Failed to save class';
      
      if (err.response?.status === 403) {
        errorMessage = 'Access Denied: You need ADMIN privileges to create classes. Please check your user role.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Container className="py-5">
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading class details...</p>
          </div>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container fluid className="py-4">
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2>{isEditMode ? 'Edit Class' : 'Add New Class'}</h2>
                <p className="text-muted">Fill in the class information below</p>
              </div>
              <Button variant="outline-secondary" onClick={() => navigate('/classes')}>
                <i className="bi bi-arrow-left me-2"></i>
                Back to List
              </Button>
            </div>
          </Col>
        </Row>

        {/* Alerts */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success">
            <i className="bi bi-check-circle me-2"></i>
            {success}
          </Alert>
        )}

        {/* Form */}
        <Form onSubmit={handleSubmit}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <h5 className="mb-4">Basic Information</h5>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Class Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="className"
                      value={formData.className}
                      onChange={handleChange}
                      placeholder="e.g., 10"
                      required
                    />
                    <Form.Text className="text-muted">
                      Short identifier (e.g., 10, 11, 12)
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Display Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., Class 10 - Science"
                    />
                    <Form.Text className="text-muted">
                      Full display name (optional)
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Grade</Form.Label>
                    <Form.Control
                      type="text"
                      name="grade"
                      value={formData.grade}
                      onChange={handleChange}
                      placeholder="e.g., 10"
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Section <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="section"
                      value={formData.section}
                      onChange={handleChange}
                      placeholder="e.g., A"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Room Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="room"
                      value={formData.room}
                      onChange={handleChange}
                      placeholder="e.g., 101"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Academic Year <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="academicYear"
                      value={formData.academicYear}
                      onChange={handleChange}
                      placeholder="2024-2025"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Capacity</Form.Label>
                    <Form.Control
                      type="number"
                      name="capacity"
                      value={formData.capacity || ''}
                      onChange={handleChange}
                      placeholder="Maximum students"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Brief description of the class"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <h5 className="mb-4">Fee Information</h5>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Fees Amount</Form.Label>
                    <Form.Control
                      type="number"
                      name="fees"
                      value={formData.fees || ''}
                      onChange={handleChange}
                      placeholder="Enter fees amount"
                      step="0.01"
                    />
                    <Form.Text className="text-muted">
                      Total fees for this class
                    </Form.Text>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Fees Type</Form.Label>
                    <Form.Select
                      name="feesType"
                      value={formData.feesType}
                      onChange={handleChange}
                    >
                      <option value="ANNUAL">Annual</option>
                      <option value="TERM">Term</option>
                      <option value="MONTHLY">Monthly</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <h5 className="mb-4">Duration Information</h5>
              
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Course Duration (Months)</Form.Label>
                    <Form.Control
                      type="number"
                      name="durationMonths"
                      value={formData.durationMonths || ''}
                      onChange={handleChange}
                      placeholder="Enter duration in months"
                    />
                    <Form.Text className="text-muted">
                      Total duration of the course (e.g., 12 for 1 year, 24 for 2 years)
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Form.Group className="mb-0">
                <Form.Check
                  type="checkbox"
                  name="isActive"
                  label="Active Class"
                  checked={formData.isActive}
                  onChange={handleCheckboxChange}
                />
                <Form.Text className="text-muted">
                  Only active classes will appear in student enrollment
                </Form.Text>
              </Form.Group>
            </Card.Body>
          </Card>

          {/* Action Buttons */}
          <div className="d-flex gap-2">
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Saving...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2"></i>
                  {isEditMode ? 'Update Class' : 'Create Class'}
                </>
              )}
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate('/classes')} disabled={saving}>
              Cancel
            </Button>
          </div>
        </Form>
      </Container>
    </Layout>
  );
};
