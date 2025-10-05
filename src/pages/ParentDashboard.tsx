import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, ProgressBar, ListGroup } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { parentService } from '../services/parentService';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/parent/children', label: 'My Children', icon: 'bi-people' },
  { path: '/parent/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
  { path: '/parent/performance', label: 'Performance', icon: 'bi-star' },
  { path: '/parent/fees', label: 'Fee Payments', icon: 'bi-cash-coin' },
  { path: '/parent/notifications', label: 'Notifications', icon: 'bi-bell' },
];

export const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<Array<{
    id: string;
    name: string;
    class: string;
    attendance: number;
    averageGrade: number;
    pendingFees: number;
    upcomingExams: number;
  }>>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await parentService.getDashboard();
        const mapped = (resp.children || []).map((c) => ({
          id: c.studentId,
          name: c.studentName,
          class: c.className,
          attendance: Math.round(c.attendancePercentage || 0),
          averageGrade: 0,
          pendingFees: 0,
          upcomingExams: 0,
        }));
        setChildren(mapped);
      } catch (e) {
        // keep defaults if backend not available
      }
    };
    load();
  }, []);

  const recentActivities = [
    { child: 'John Doe', activity: 'Submitted Math Assignment', type: 'assignment', time: '2 hours ago', color: 'success' },
    { child: 'Jane Doe', activity: 'Present in school', type: 'attendance', time: '3 hours ago', color: 'success' },
    { child: 'John Doe', activity: 'Received grade: A in Physics', type: 'grade', time: '1 day ago', color: 'primary' },
    { child: 'Jane Doe', activity: 'Fee payment reminder', type: 'fee', time: '2 days ago', color: 'warning' },
  ];

  const upcomingEvents = [
    { title: 'Parent-Teacher Meeting', date: 'Tomorrow', time: '10:00 AM' },
    { title: 'Mid-term Exams Start', date: 'Next Week', time: 'All Day' },
    { title: 'Sports Day', date: 'Mar 15, 2025', time: '9:00 AM' },
  ];

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>Parent Dashboard</h2>
            <p className="text-muted">Welcome, {user?.firstName}! Track your children's progress.</p>
          </div>

          {/* Children Overview Cards */}
          <Row className="mb-4">
            {children.map((child) => (
              <Col md={6} key={child.id} className="mb-3">
                <Card className="border-0 shadow-sm h-100">
                  <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">
                      <i className="bi bi-person-circle me-2"></i>
                      {child.name}
                    </h5>
                    <small>{child.class}</small>
                  </Card.Header>
                  <Card.Body>
                    <Row className="mb-3">
                      <Col xs={6}>
                        <div className="text-center p-3 bg-light rounded">
                          <i className="bi bi-calendar-check fs-3 text-success mb-2"></i>
                          <h4 className="mb-0">{child.attendance}%</h4>
                          <small className="text-muted">Attendance</small>
                        </div>
                      </Col>
                      <Col xs={6}>
                        <div className="text-center p-3 bg-light rounded">
                          <i className="bi bi-star fs-3 text-primary mb-2"></i>
                          <h4 className="mb-0">{child.averageGrade}%</h4>
                          <small className="text-muted">Average Grade</small>
                        </div>
                      </Col>
                    </Row>
                    <Row>
                      <Col xs={6}>
                        <div className="d-flex align-items-center">
                          <i className="bi bi-clipboard-check text-info me-2"></i>
                          <div>
                            <strong>{child.upcomingExams}</strong>
                            <small className="d-block text-muted">Upcoming Exams</small>
                          </div>
                        </div>
                      </Col>
                      <Col xs={6}>
                        <div className="d-flex align-items-center">
                          <i className={`bi bi-cash text-${child.pendingFees > 0 ? 'danger' : 'success'} me-2`}></i>
                          <div>
                            <strong>₹{child.pendingFees}</strong>
                            <small className="d-block text-muted">Pending Fees</small>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                  <Card.Footer className="bg-white">
                    <Button variant="outline-primary" size="sm" className="w-100">
                      View Details
                    </Button>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>

          <Row className="mb-4">
            {/* Recent Activities */}
            <Col md={8} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Recent Activities</h5>
                  <Button variant="link" size="sm">View All</Button>
                </Card.Header>
                <Card.Body className="p-0">
                  <ListGroup variant="flush">
                    {recentActivities.map((activity, index) => (
                      <ListGroup.Item key={index}>
                        <div className="d-flex align-items-start">
                          <Badge bg={activity.color} className="p-2 me-3">
                            <i className="bi bi-bell"></i>
                          </Badge>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between">
                              <strong>{activity.child}</strong>
                              <small className="text-muted">{activity.time}</small>
                            </div>
                            <p className="mb-0 text-muted">{activity.activity}</p>
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Card.Body>
              </Card>
            </Col>

            {/* Upcoming Events */}
            <Col md={4} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">Upcoming Events</h5>
                </Card.Header>
                <Card.Body className="p-0">
                  <ListGroup variant="flush">
                    {upcomingEvents.map((event, index) => (
                      <ListGroup.Item key={index}>
                        <div className="d-flex align-items-start">
                          <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                            <i className="bi bi-calendar-event text-primary"></i>
                          </div>
                          <div>
                            <h6 className="mb-1">{event.title}</h6>
                            <small className="text-muted">
                              <i className="bi bi-clock me-1"></i>
                              {event.date} • {event.time}
                            </small>
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Performance Comparison */}
          <Row>
            <Col md={12}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">Children Performance Comparison</h5>
                </Card.Header>
                <Card.Body>
                  {children.map((child) => (
                    <div key={child.id} className="mb-4">
                      <div className="d-flex justify-content-between mb-2">
                        <strong>{child.name} - {child.class}</strong>
                        <span>{child.averageGrade}%</span>
                      </div>
                      <ProgressBar>
                        <ProgressBar variant="success" now={child.averageGrade} key={1} />
                      </ProgressBar>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Layout>
  );
};
