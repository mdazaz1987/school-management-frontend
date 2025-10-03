import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner, ListGroup, Table } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { useNavigate, useParams } from 'react-router-dom';
import { studentService } from '../services/studentService';
import { classService } from '../services/classService';
import { Student } from '../types';
import { maskAadhaar } from '../utils/maskAadhaar';

export const StudentDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [className, setClassName] = useState<string>('');

  useEffect(() => {
    if (id) {
      loadStudent(id);
    }
  }, [id]);

  const loadStudent = async (studentId: string) => {
    try {
      setLoading(true);
      const data = await studentService.getStudentById(studentId);
      setStudent(data);
      // Fetch friendly class name
      if (data.classId) {
        try {
          const cls = await classService.getClassById(data.classId);
          setClassName(cls.name || cls.className);
        } catch (e) {
          setClassName('');
        }
      }
    } catch (err: any) {
      console.error('Error loading student:', err);
      setError(err.response?.data?.message || 'Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!id || !student) return;
    try {
      setSaving(true);
      setError('');
      const updated = await studentService.updateStatus(id, !student.isActive);
      setStudent(updated);
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not Set';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout>
        <Container className="py-5">
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading student details...</p>
          </div>
        </Container>
      </Layout>
    );
  }

  if (error || !student) {
    return (
      <Layout>
        <Container className="py-4">
          <Alert variant="danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error || 'Student not found'}
          </Alert>
          <Button variant="outline-secondary" onClick={() => navigate('/students')}>
            <i className="bi bi-arrow-left me-2"></i>
            Back to Students
          </Button>
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
              <div className="d-flex align-items-center">
                {student.profilePicture && (
                  <img
                    src={student.profilePicture}
                    alt={`${student.firstName} ${student.lastName}`}
                    className="rounded-circle me-3"
                    style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                  />
                )}
                <div>
                  <h2 className="mb-1">{student.firstName} {student.lastName}</h2>
                  <p className="text-muted mb-0">
                    {student.admissionNumber} • {student.gender}
                    {student.bloodGroup && <span> • {student.bloodGroup}</span>}
                  </p>
                </div>
              </div>
              <div className="d-flex gap-2">
                <Button 
                  variant={student.isActive ? 'outline-danger' : 'outline-success'}
                  onClick={handleToggleActive}
                  disabled={saving}
                >
                  {student.isActive ? 'Mark Inactive' : 'Mark Active'}
                </Button>
                <Button variant="primary" onClick={() => navigate(`/students/${id}/edit`)}>
                  <i className="bi bi-pencil me-2"></i>
                  Edit
                </Button>
                <Button variant="outline-secondary" onClick={() => navigate('/students')}>
                  <i className="bi bi-arrow-left me-2"></i>
                  Back
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        <Row>
          {/* Personal Information */}
          <Col md={6} className="mb-4">
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-primary text-white">
                <i className="bi bi-person me-2"></i>
                Personal Information
              </Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between">
                    <strong>Full Name:</strong>
                    <span>{student.firstName} {student.lastName}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <strong>Email:</strong>
                    <span>{student.email}</span>
                  </ListGroup.Item>
                  {student.phone && (
                    <ListGroup.Item className="d-flex justify-content-between">
                      <strong>Phone:</strong>
                      <span>{student.phone}</span>
                    </ListGroup.Item>
                  )}
                  {student.dateOfBirth && (
                    <ListGroup.Item className="d-flex justify-content-between">
                      <strong>Date of Birth:</strong>
                      <span>{formatDate(student.dateOfBirth)}</span>
                    </ListGroup.Item>
                  )}
                  <ListGroup.Item className="d-flex justify-content-between">
                    <strong>Gender:</strong>
                    <span>{student.gender}</span>
                  </ListGroup.Item>
                  {student.bloodGroup && (
                    <ListGroup.Item className="d-flex justify-content-between">
                      <strong>Blood Group:</strong>
                      <Badge bg="danger">{student.bloodGroup}</Badge>
                    </ListGroup.Item>
                  )}
                  {student.religion && (
                    <ListGroup.Item className="d-flex justify-content-between">
                      <strong>Religion:</strong>
                      <span>{student.religion}</span>
                    </ListGroup.Item>
                  )}
                  {student.nationality && (
                    <ListGroup.Item className="d-flex justify-content-between">
                      <strong>Nationality:</strong>
                      <span>{student.nationality}</span>
                    </ListGroup.Item>
                  )}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>

          {/* Academic Information */}
          <Col md={6} className="mb-4">
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-success text-white">
                <i className="bi bi-book me-2"></i>
                Academic Information
              </Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between">
                    <strong>Admission Number:</strong>
                    <Badge bg="primary">{student.admissionNumber}</Badge>
                  </ListGroup.Item>
                  {student.classId && (
                    <ListGroup.Item className="d-flex justify-content-between">
                      <strong>Class:</strong>
                      <span>{className || student.classId}</span>
                    </ListGroup.Item>
                  )}
                  {student.section && (
                    <ListGroup.Item className="d-flex justify-content-between">
                      <strong>Section:</strong>
                      <Badge bg="secondary">{student.section}</Badge>
                    </ListGroup.Item>
                  )}
                  {student.rollNumber && (
                    <ListGroup.Item className="d-flex justify-content-between">
                      <strong>Roll Number:</strong>
                      <span>{student.rollNumber}</span>
                    </ListGroup.Item>
                  )}
                  {student.admissionDate && (
                    <ListGroup.Item className="d-flex justify-content-between">
                      <strong>Admission Date:</strong>
                      <span>{formatDate(student.admissionDate)}</span>
                    </ListGroup.Item>
                  )}
                  <ListGroup.Item className="d-flex justify-content-between">
                    <strong>Status:</strong>
                    <Badge bg={student.isActive ? 'success' : 'danger'}>
                      {student.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Government IDs */}
        {(student.aadhaarNumber || student.apaarId) && (
          <Row className="mb-4">
            <Col md={12}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-info text-white">
                  <i className="bi bi-card-text me-2"></i>
                  Government IDs
                </Card.Header>
                <Card.Body>
                  <Row>
                    {student.aadhaarNumber && (
                      <Col md={6}>
                        <strong>Aadhaar Number:</strong>
                        <p className="mb-0">{maskAadhaar(student.aadhaarNumber)}</p>
                      </Col>
                    )}
                    {student.apaarId && (
                      <Col md={6}>
                        <strong>APAAR ID:</strong>
                        <p className="mb-0">{student.apaarId}</p>
                      </Col>
                    )}
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Address */}
        {student.address && (
          <Row className="mb-4">
            <Col md={12}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-warning text-dark">
                  <i className="bi bi-geo-alt me-2"></i>
                  Address
                </Card.Header>
                <Card.Body>
                  <p className="mb-1">{student.address.addressLine1}</p>
                  {student.address.addressLine2 && <p className="mb-1">{student.address.addressLine2}</p>}
                  <p className="mb-0">
                    {student.address.city && `${student.address.city}, `}
                    {student.address.state && `${student.address.state} `}
                    {student.address.zipCode && `- ${student.address.zipCode}`}
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Parent Information */}
        {student.parentInfo && (
          <Row className="mb-4">
            <Col md={12}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-secondary text-white">
                  <i className="bi bi-people me-2"></i>
                  Parent/Guardian Information
                </Card.Header>
                <Card.Body>
                  <Row>
                    {/* Father Information */}
                    {student.parentInfo.fatherName && (
                      <Col md={6} className="mb-3">
                        <h6 className="text-primary">Father's Information</h6>
                        <Table size="sm" borderless>
                          <tbody>
                            <tr>
                              <td><strong>Name:</strong></td>
                              <td>{student.parentInfo.fatherName}</td>
                            </tr>
                            {student.parentInfo.fatherPhone && (
                              <tr>
                                <td><strong>Phone:</strong></td>
                                <td>{student.parentInfo.fatherPhone}</td>
                              </tr>
                            )}
                            {student.parentInfo.fatherEmail && (
                              <tr>
                                <td><strong>Email:</strong></td>
                                <td>{student.parentInfo.fatherEmail}</td>
                              </tr>
                            )}
                            {student.parentInfo.fatherOccupation && (
                              <tr>
                                <td><strong>Occupation:</strong></td>
                                <td>{student.parentInfo.fatherOccupation}</td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </Col>
                    )}

                    {/* Mother Information */}
                    {student.parentInfo.motherName && (
                      <Col md={6} className="mb-3">
                        <h6 className="text-primary">Mother's Information</h6>
                        <Table size="sm" borderless>
                          <tbody>
                            <tr>
                              <td><strong>Name:</strong></td>
                              <td>{student.parentInfo.motherName}</td>
                            </tr>
                            {student.parentInfo.motherPhone && (
                              <tr>
                                <td><strong>Phone:</strong></td>
                                <td>{student.parentInfo.motherPhone}</td>
                              </tr>
                            )}
                            {student.parentInfo.motherEmail && (
                              <tr>
                                <td><strong>Email:</strong></td>
                                <td>{student.parentInfo.motherEmail}</td>
                              </tr>
                            )}
                            {student.parentInfo.motherOccupation && (
                              <tr>
                                <td><strong>Occupation:</strong></td>
                                <td>{student.parentInfo.motherOccupation}</td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </Col>
                    )}
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </Layout>
  );
};
