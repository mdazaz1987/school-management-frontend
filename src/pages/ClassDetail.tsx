import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Alert, Spinner, ListGroup } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { useNavigate, useParams } from 'react-router-dom';
import { classService } from '../services/classService';
import { SchoolClass } from '../types';

export const ClassDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [classData, setClassData] = useState<SchoolClass | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    } catch (err: any) {
      console.error('Error loading class:', err);
      setError(err.response?.data?.message || 'Failed to load class details');
    } finally {
      setLoading(false);
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

  if (error || !classData) {
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
                <Button variant="primary" size="sm" onClick={() => navigate('/students/new')}>
                  <i className="bi bi-plus-lg me-2"></i>
                  Add Student
                </Button>
              </Card.Header>
              <Card.Body>
                {classData.studentIds && classData.studentIds.length > 0 ? (
                  <p className="text-muted">
                    This class has {classData.studentIds.length} student{classData.studentIds.length > 1 ? 's' : ''} enrolled.
                  </p>
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
