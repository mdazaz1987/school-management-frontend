import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/parent/children', label: 'My Children', icon: 'bi-people' },
  { path: '/parent/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
  { path: '/parent/performance', label: 'Performance', icon: 'bi-star' },
  { path: '/parent/fees', label: 'Fee Payments', icon: 'bi-cash-coin' },
  { path: '/parent/notifications', label: 'Notifications', icon: 'bi-bell' },
];

export const ParentChildren: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/parent/children', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load children');
      }
      
      const data = await response.json();
      
      // Transform StudentDTO to match UI expectations
      const transformed = data.map((child: any) => ({
        id: child.id,
        firstName: child.firstName || '',
        lastName: child.lastName || '',
        className: child.className || 'Not assigned',
        rollNumber: child.rollNumber || 'N/A',
        email: child.email || '',
        phone: child.phone || '',
        attendance: 0, // Will need separate API call for attendance
        averageGrade: 0, // Will need separate API call for grades
        pendingFees: 0, // Will need separate API call for fees
        profilePicture: child.profilePicture
      }));
      
      setChildren(transformed);
    } catch (e: any) {
      setError('Failed to load children: ' + (e.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>My Children</h2>
            <p className="text-muted">View details of all your children</p>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <p className="mt-2">Loading...</p>
            </div>
          ) : (
            <Row>
              {children.map((child) => (
                <Col md={6} key={child.id} className="mb-4">
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body>
                      <div className="d-flex align-items-start mb-3">
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                             style={{ width: '80px', height: '80px', fontSize: '24px', fontWeight: 'bold' }}>
                          {getInitials(child.firstName, child.lastName)}
                        </div>
                        <div className="flex-grow-1">
                          <h4 className="mb-1">{child.firstName} {child.lastName}</h4>
                          <p className="text-muted mb-2">{child.className}</p>
                          <Badge bg="secondary">Roll No: {child.rollNumber}</Badge>
                        </div>
                      </div>

                      <hr />

                      <Row className="mb-3">
                        <Col xs={6}>
                          <div className="text-center p-3 bg-light rounded">
                            <i className="bi bi-calendar-check fs-3 text-success mb-2"></i>
                            <h5 className="mb-0">{child.attendance}%</h5>
                            <small className="text-muted">Attendance</small>
                          </div>
                        </Col>
                        <Col xs={6}>
                          <div className="text-center p-3 bg-light rounded">
                            <i className="bi bi-star fs-3 text-warning mb-2"></i>
                            <h5 className="mb-0">{child.averageGrade}%</h5>
                            <small className="text-muted">Average</small>
                          </div>
                        </Col>
                      </Row>

                      <div className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span><i className="bi bi-envelope me-2"></i>Email:</span>
                          <span className="text-muted">{child.email}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span><i className="bi bi-telephone me-2"></i>Phone:</span>
                          <span className="text-muted">{child.phone}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <span><i className="bi bi-cash me-2"></i>Pending Fees:</span>
                          <span className={child.pendingFees > 0 ? 'text-danger fw-bold' : 'text-success'}>
                            ₹{child.pendingFees.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <Row>
                        <Col xs={6}>
                          <Button variant="outline-primary" size="sm" className="w-100">
                            <i className="bi bi-eye me-1"></i>
                            View Details
                          </Button>
                        </Col>
                        <Col xs={6}>
                          <Button 
                            variant="primary" 
                            size="sm" 
                            className="w-100"
                            onClick={() => navigate(`/parent/performance?child=${child.id}`)}
                          >
                            <i className="bi bi-graph-up me-1"></i>
                            Performance
                          </Button>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Col>
      </Row>
    </Layout>
  );
};
