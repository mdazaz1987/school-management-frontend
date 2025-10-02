import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Button, Badge, Alert, Spinner, Form } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { classService } from '../services/classService';
import { SchoolClass } from '../types';

export const ClassList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | undefined>(true);

  const loadClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await classService.getAllClasses({ schoolId: user?.schoolId });
      
      // Filter by active status if set
      const filteredData = filterActive !== undefined 
        ? data.filter(c => c.isActive === filterActive)
        : data;
      
      setClasses(filteredData);
    } catch (err: any) {
      console.error('Error loading classes:', err);
      setError(err.response?.data?.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, [user?.schoolId, filterActive]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const handleDelete = async (id: string, className: string) => {
    if (!window.confirm(`Are you sure you want to delete class "${className}"?`)) {
      return;
    }

    try {
      await classService.deleteClass(id);
      setSuccess('Class deleted successfully');
      loadClasses();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete class');
    }
  };

  const formatFees = (fees?: number, feesType?: string) => {
    if (!fees) return 'Not Set';
    return `₹${fees.toLocaleString('en-IN')}/${feesType || 'Year'}`;
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

  return (
    <Layout>
      <Container fluid className="py-4">
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2>Class Management</h2>
                <p className="text-muted">Manage classes, sections, and academic information</p>
              </div>
              <Button variant="primary" onClick={() => navigate('/classes/new')}>
                <i className="bi bi-plus-lg me-2"></i>
                Add New Class
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
          <Alert variant="success" dismissible onClose={() => setSuccess('')}>
            <i className="bi bi-check-circle me-2"></i>
            {success}
          </Alert>
        )}

        {/* Filters */}
        <Card className="border-0 shadow-sm mb-4">
          <Card.Body>
            <Row className="align-items-center">
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Status Filter</Form.Label>
                  <Form.Select
                    value={filterActive === undefined ? 'all' : filterActive ? 'active' : 'inactive'}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilterActive(value === 'all' ? undefined : value === 'active');
                    }}
                  >
                    <option value="all">All Classes</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={9} className="text-end">
                <Button variant="outline-primary" onClick={loadClasses}>
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Refresh
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Classes Table */}
        <Card className="border-0 shadow-sm">
          <Card.Body>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading classes...</p>
              </div>
            ) : classes.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox display-1 text-muted"></i>
                <p className="mt-3 text-muted">No classes found</p>
                <Button variant="primary" onClick={() => navigate('/classes/new')}>
                  <i className="bi bi-plus-lg me-2"></i>
                  Add First Class
                </Button>
              </div>
            ) : (
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Class Name</th>
                    <th>Grade</th>
                    <th>Section</th>
                    <th>Academic Year</th>
                    <th>Capacity</th>
                    <th>Students</th>
                    <th>Fees</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((cls) => (
                    <tr key={cls.id}>
                      <td>
                        <strong>{cls.name || cls.className}</strong>
                        {cls.room && <div className="text-muted small">Room: {cls.room}</div>}
                      </td>
                      <td>{cls.grade || '-'}</td>
                      <td>
                        <Badge bg="secondary">{cls.section}</Badge>
                      </td>
                      <td>{cls.academicYear}</td>
                      <td>{cls.capacity || '-'}</td>
                      <td>
                        <Badge bg="info">
                          {cls.studentIds?.length || 0}
                        </Badge>
                      </td>
                      <td>{formatFees(cls.fees, cls.feesType)}</td>
                      <td>{formatDuration(cls.durationMonths)}</td>
                      <td>
                        <Badge bg={cls.isActive ? 'success' : 'danger'}>
                          {cls.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => navigate(`/classes/edit/${cls.id}`)}
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="me-2"
                          onClick={() => navigate(`/classes/${cls.id}`)}
                        >
                          <i className="bi bi-eye"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(cls.id, cls.name || cls.className)}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>

        {/* Summary */}
        {classes.length > 0 && (
          <Row className="mt-4">
            <Col md={12}>
              <Card className="border-0 shadow-sm bg-light">
                <Card.Body>
                  <Row className="text-center">
                    <Col md={3}>
                      <h4 className="mb-0">{classes.length}</h4>
                      <small className="text-muted">Total Classes</small>
                    </Col>
                    <Col md={3}>
                      <h4 className="mb-0">
                        {classes.reduce((sum, cls) => sum + (cls.studentIds?.length || 0), 0)}
                      </h4>
                      <small className="text-muted">Total Students</small>
                    </Col>
                    <Col md={3}>
                      <h4 className="mb-0">
                        {classes.reduce((sum, cls) => sum + (cls.capacity || 0), 0)}
                      </h4>
                      <small className="text-muted">Total Capacity</small>
                    </Col>
                    <Col md={3}>
                      <h4 className="mb-0">{classes.filter(c => c.isActive).length}</h4>
                      <small className="text-muted">Active Classes</small>
                    </Col>
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
