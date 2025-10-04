import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Alert, Spinner, ListGroup, Form, InputGroup } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { useNavigate, useParams } from 'react-router-dom';
import { classService } from '../services/classService';
import { studentService } from '../services/studentService';
import { SchoolClass, Student } from '../types';

export const ClassDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [classData, setClassData] = useState<SchoolClass | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [adding, setAdding] = useState(false);
  const [admissionInput, setAdmissionInput] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [teacherInput, setTeacherInput] = useState('');
  const [assigningTeacher, setAssigningTeacher] = useState(false);

  useEffect(() => {
    if (id) {
      loadClass(id);
    }
  }, [id]);

  const loadClass = async (classId: string) => {
    try {
      setLoading(true);
      const data = await classService.getClassById(classId);
      setClassData(data);
      // Load students for the class for accurate display
      try {
        const st = await studentService.getStudentsByClass(classId);
        setStudents(st);
      } catch (e) {
        console.warn('Failed to load students for class', e);
        setStudents([]);
      }
    } catch (err: any) {
      console.error('Error loading class:', err);
      setError(err.response?.data?.message || 'Failed to load class details');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!id) return;
    if (!window.confirm('Remove this student from the class?')) return;
    try {
      setError('');
      setSuccess('');
      await classService.removeStudent(id, studentId);
      setSuccess('Student removed from class');
      await loadClass(id);
    } catch (err: any) {
      console.error('Error removing student:', err);
      setError(err.response?.data?.message || 'Failed to remove student from class');
    }
  };

  const handleAssignTeacher = async () => {
    if (!id || !teacherInput.trim()) return;
    try {
      setAssigningTeacher(true);
      setError('');
      setSuccess('');
      await classService.assignTeacher(id, teacherInput.trim());
      setSuccess('Teacher assigned to class');
      setTeacherInput('');
      await loadClass(id);
    } catch (err: any) {
      console.error('Error assigning teacher:', err);
      setError(err.response?.data?.message || 'Failed to assign teacher');
    } finally {
      setAssigningTeacher(false);
    }
  };

  const handleToggleActive = async () => {
    if (!id || !classData) return;
    try {
      setError('');
      setSuccess('');
      const updated = await classService.updateClassStatus(id, !classData.isActive);
      setClassData(updated);
      setSuccess(`Class marked as ${updated.isActive ? 'Active' : 'Inactive'}`);
    } catch (err: any) {
      console.error('Error toggling class active:', err);
      setError(err.response?.data?.message || 'Failed to update class status');
    }
  };

  const handleAddStudentByAdmission = async () => {
    if (!id || !admissionInput.trim()) return;
    try {
      setAdding(true);
      setError('');
      setSuccess('');
      // 1) Find student by admission number
      const student = await studentService.getStudentByAdmissionNumber(admissionInput.trim());
      // 2) Add to class
      await classService.addStudent(id, (student as any).id);
      setSuccess(`Student ${student.firstName} ${student.lastName} added to class`);
      setAdmissionInput('');
      // Refresh class details and student list
      await loadClass(id);
    } catch (err: any) {
      console.error('Error adding student:', err);
      setError(err.response?.data?.message || 'Failed to add student to class');
    } finally {
      setAdding(false);
    }
  };

  const formatFees = (fees?: number, feesType?: string) => {
    if (!fees) return 'Not Set';
    return `₹${fees.toLocaleString('en-IN')} ${feesType ? `per ${feesType.toLowerCase()}` : ''}`;
  };

  const formatDuration = (months?: number) => {
    if (!months) return 'Not Set';
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years > 0 && remainingMonths > 0) {
      return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
    } else if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}`;
    } else {
      return `${months} month${months > 1 ? 's' : ''}`;
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

  if (error && !classData) {
    return (
      <Layout>
        <Container className="py-4">
          <Alert variant="danger">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error || 'Class not found'}
          </Alert>
          <Button variant="outline-secondary" onClick={() => navigate('/classes')}>
            <i className="bi bi-arrow-left me-2"></i>
            Back to Classes
          </Button>
        </Container>
      </Layout>
    );
  }

  // Strong guard for TypeScript: if classData still null (e.g., no error but not loaded), show skeleton
  if (!classData) {
    return (
      <Layout>
        <Container className="py-5">
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Preparing class details...</p>
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
                <h2>{classData.name || classData.className} - Section {classData.section}</h2>
                <p className="text-muted">
                  Academic Year: {classData.academicYear}
                  {classData.room && <span> • Room: {classData.room}</span>}
                </p>
              </div>
              <div className="d-flex gap-2">
                <Button 
                  variant={classData.isActive ? 'outline-danger' : 'outline-success'}
                  onClick={handleToggleActive}
                >
                  <i className={`bi ${classData.isActive ? 'bi-x-circle' : 'bi-check-circle'} me-2`}></i>
                  {classData.isActive ? 'Mark Inactive' : 'Mark Active'}
                </Button>
                <Button variant="primary" onClick={() => navigate(`/classes/edit/${id}`)}>
                  <i className="bi bi-pencil me-2"></i>
                  Edit Class
                </Button>
                <Button variant="outline-secondary" onClick={() => navigate('/classes')}>
                  <i className="bi bi-arrow-left me-2"></i>
                  Back to List
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {/* Teacher Management */}
        <Row className="mb-4">
          <Col md={12}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-person-badge me-2"></i>
                  Teacher
                </h5>
              </Card.Header>
              <Card.Body>
                <Row className="align-items-end">
                  <Col md={6}>
                    <InputGroup>
                      <Form.Control
                        placeholder="Teacher ID"
                        value={teacherInput}
                        onChange={(e) => setTeacherInput(e.target.value)}
                      />
                      <Button variant="primary" disabled={assigningTeacher} onClick={handleAssignTeacher}>
                        {assigningTeacher ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-1" /> Assigning...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-person-check me-1"></i> Assign Teacher
                          </>
                        )}
                      </Button>
                    </InputGroup>
                    <Form.Text className="text-muted">Enter an existing Teacher's user ID</Form.Text>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Alerts */}
        {error && (
          <Row className="mb-3"><Col><Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert></Col></Row>
        )}
        {success && (
          <Row className="mb-3"><Col><Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert></Col></Row>
        )}

        <Row>
          {/* Basic Information */}
          <Col md={6} className="mb-4">
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-primary text-white">
                <i className="bi bi-info-circle me-2"></i>
                Basic Information
              </Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between">
                    <strong>Class Name:</strong>
                    <span>{classData.className}</span>
                  </ListGroup.Item>
                  {classData.name && (
                    <ListGroup.Item className="d-flex justify-content-between">
                      <strong>Display Name:</strong>
                      <span>{classData.name}</span>
                    </ListGroup.Item>
                  )}
                  {classData.grade && (
                    <ListGroup.Item className="d-flex justify-content-between">
                      <strong>Grade:</strong>
                      <span>{classData.grade}</span>
                    </ListGroup.Item>
                  )}
                  <ListGroup.Item className="d-flex justify-content-between">
                    <strong>Section:</strong>
                    <Badge bg="secondary">{classData.section}</Badge>
                  </ListGroup.Item>
                  {classData.room && (
                    <ListGroup.Item className="d-flex justify-content-between">
                      <strong>Room Number:</strong>
                      <span>{classData.room}</span>
                    </ListGroup.Item>
                  )}
                  <ListGroup.Item className="d-flex justify-content-between">
                    <strong>Status:</strong>
                    <Badge bg={classData.isActive ? 'success' : 'danger'}>
                      {classData.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>

          {/* Fee and Duration Information */}
          <Col md={6} className="mb-4">
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-success text-white">
                <i className="bi bi-cash-coin me-2"></i>
                Fee & Duration Information
              </Card.Header>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item className="d-flex justify-content-between">
                    <strong>Fees:</strong>
                    <span>{formatFees(classData.fees, classData.feesType)}</span>
                  </ListGroup.Item>
                  {classData.feesType && (
                    <ListGroup.Item className="d-flex justify-content-between">
                      <strong>Fee Type:</strong>
                      <Badge bg="info">{classData.feesType}</Badge>
                    </ListGroup.Item>
                  )}
                  <ListGroup.Item className="d-flex justify-content-between">
                    <strong>Duration:</strong>
                    <span>{formatDuration(classData.durationMonths)}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <strong>Capacity:</strong>
                    <span>{classData.capacity || 'Not Set'}</span>
                  </ListGroup.Item>
                  <ListGroup.Item className="d-flex justify-content-between">
                    <strong>Current Students:</strong>
                    <Badge bg="primary">{classData.studentIds?.length || 0}</Badge>
                  </ListGroup.Item>
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Description */}
        {classData.description && (
          <Row className="mb-4">
            <Col md={12}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-info text-white">
                  <i className="bi bi-file-text me-2"></i>
                  Description
                </Card.Header>
                <Card.Body>
                  <p className="mb-0">{classData.description}</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Students in Class */}
        <Row>
          <Col md={12}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <i className="bi bi-people me-2"></i>
                  Students ({classData.studentIds?.length || 0})
                </h5>
                <div className="d-flex gap-2 align-items-center">
                  <InputGroup size="sm" style={{ maxWidth: 360 }}>
                    <Form.Control 
                      placeholder="Admission Number"
                      value={admissionInput}
                      onChange={(e) => setAdmissionInput(e.target.value)}
                    />
                    <Button variant="outline-primary" disabled={adding} onClick={handleAddStudentByAdmission}>
                      {adding ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-1" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-person-plus me-1"></i>
                          Add by Admission #
                        </>
                      )}
                    </Button>
                  </InputGroup>
                  <Button variant="outline-secondary" size="sm" onClick={() => navigate('/students/new')}>
                    <i className="bi bi-plus-lg me-2"></i>
                    Create New Student
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                {students.length > 0 ? (
                  <>
                    <p className="text-muted">This class has {students.length} student{students.length > 1 ? 's' : ''} enrolled.</p>
                    <ListGroup>
                      {students.map((s) => (
                        <ListGroup.Item key={s.id} className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{s.firstName} {s.lastName}</strong>
                            <div className="small text-muted">Adm: {s.admissionNumber} • Roll: {s.rollNumber || '-'} • Section: {s.section || '-'}</div>
                          </div>
                          <div className="d-flex gap-2">
                            <Button size="sm" variant="outline-primary" onClick={() => navigate(`/students/${s.id}`)}>
                              <i className="bi bi-eye"></i>
                            </Button>
                            <Button size="sm" variant="outline-danger" onClick={() => handleRemoveStudent(s.id)}>
                              <i className="bi bi-person-dash"></i>
                            </Button>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </>
                ) : (
                  <p className="text-muted">No students enrolled in this class yet.</p>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </Layout>
  );
};
