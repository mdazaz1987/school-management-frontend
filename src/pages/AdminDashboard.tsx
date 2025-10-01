import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Table, Badge } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';

const sidebarItems = [
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

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 450,
    totalTeachers: 45,
    totalClasses: 24,
    totalSubjects: 18,
    presentToday: 420,
    absentToday: 30,
    pendingFees: 15,
    upcomingExams: 5,
  });

  const recentActivities = [
    { id: 1, type: 'student', message: 'New student admission: John Doe', time: '2 mins ago', badge: 'success' },
    { id: 2, type: 'fee', message: '15 pending fee payments', time: '10 mins ago', badge: 'warning' },
    { id: 3, type: 'exam', message: 'Mid-term exam scheduled for Grade 10', time: '1 hour ago', badge: 'info' },
    { id: 4, type: 'attendance', message: '30 students absent today', time: '2 hours ago', badge: 'danger' },
    { id: 5, type: 'notification', message: 'System update completed', time: '3 hours ago', badge: 'secondary' },
  ];

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>Admin Dashboard</h2>
            <p className="text-muted">Welcome back, {user?.firstName}! Here's what's happening today.</p>
          </div>

          {/* Statistics Cards */}
          <Row className="mb-4">
            <Col md={3} className="mb-3">
              <Card className="stat-card border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <Card.Title className="h6 text-muted mb-2">Total Students</Card.Title>
                      <h3 className="mb-0">{stats.totalStudents}</h3>
                    </div>
                    <div className="bg-primary bg-opacity-10 p-3 rounded">
                      <i className="bi bi-people fs-2 text-primary"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="stat-card border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <Card.Title className="h6 text-muted mb-2">Total Teachers</Card.Title>
                      <h3 className="mb-0">{stats.totalTeachers}</h3>
                    </div>
                    <div className="bg-success bg-opacity-10 p-3 rounded">
                      <i className="bi bi-person-badge fs-2 text-success"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="stat-card border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <Card.Title className="h6 text-muted mb-2">Total Classes</Card.Title>
                      <h3 className="mb-0">{stats.totalClasses}</h3>
                    </div>
                    <div className="bg-info bg-opacity-10 p-3 rounded">
                      <i className="bi bi-door-open fs-2 text-info"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="stat-card border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <Card.Title className="h6 text-muted mb-2">Total Subjects</Card.Title>
                      <h3 className="mb-0">{stats.totalSubjects}</h3>
                    </div>
                    <div className="bg-warning bg-opacity-10 p-3 rounded">
                      <i className="bi bi-book fs-2 text-warning"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Attendance Overview */}
          <Row className="mb-4">
            <Col md={6} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">Today's Attendance</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex justify-content-around align-items-center">
                    <div className="text-center">
                      <i className="bi bi-check-circle-fill text-success fs-1"></i>
                      <h3 className="mt-2">{stats.presentToday}</h3>
                      <p className="text-muted mb-0">Present</p>
                    </div>
                    <div className="text-center">
                      <i className="bi bi-x-circle-fill text-danger fs-1"></i>
                      <h3 className="mt-2">{stats.absentToday}</h3>
                      <p className="text-muted mb-0">Absent</p>
                    </div>
                    <div className="text-center">
                      <i className="bi bi-percent text-primary fs-1"></i>
                      <h3 className="mt-2">93.3%</h3>
                      <p className="text-muted mb-0">Rate</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">Quick Actions</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-grid gap-2">
                    <Button variant="primary" size="lg">
                      <i className="bi bi-person-plus me-2"></i>
                      Add New Student
                    </Button>
                    <Button variant="success" size="lg">
                      <i className="bi bi-clipboard-plus me-2"></i>
                      Create Exam
                    </Button>
                    <Button variant="info" size="lg">
                      <i className="bi bi-megaphone me-2"></i>
                      Send Notification
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Recent Activities */}
          <Row>
            <Col md={12}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Recent Activities</h5>
                  <Button variant="link" size="sm">View All</Button>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table hover className="mb-0">
                    <tbody>
                      {recentActivities.map((activity) => (
                        <tr key={activity.id}>
                          <td style={{ width: '60px' }}>
                            <Badge bg={activity.badge} className="p-2">
                              <i className={`bi bi-${activity.type === 'student' ? 'person' : activity.type === 'fee' ? 'cash' : activity.type === 'exam' ? 'clipboard' : activity.type === 'attendance' ? 'calendar' : 'bell'}`}></i>
                            </Badge>
                          </td>
                          <td>
                            <div>{activity.message}</div>
                            <small className="text-muted">{activity.time}</small>
                          </td>
                          <td style={{ width: '100px' }} className="text-end">
                            <Button variant="outline-primary" size="sm">View</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Layout>
  );
};
