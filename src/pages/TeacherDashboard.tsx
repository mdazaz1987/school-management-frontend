import React, { useState } from 'react';
import { Row, Col, Card, Button, Table, Badge, ListGroup } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/my-classes', label: 'My Classes', icon: 'bi-door-open' },
  { path: '/assignments', label: 'Assignments', icon: 'bi-file-text' },
  { path: '/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
  { path: '/grading', label: 'Grading', icon: 'bi-star' },
  { path: '/timetable', label: 'My Timetable', icon: 'bi-calendar3' },
  { path: '/students', label: 'Students', icon: 'bi-people' },
];

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats] = useState({
    myClasses: 4,
    totalStudents: 120,
    pendingAssignments: 8,
    pendingGrading: 15,
    todayClasses: 3,
    attendance: 95,
  });

  const todaySchedule = [
    { time: '09:00 AM', class: 'Grade 10-A', subject: 'Mathematics', room: 'Room 101', status: 'upcoming' },
    { time: '10:30 AM', class: 'Grade 10-B', subject: 'Mathematics', room: 'Room 102', status: 'upcoming' },
    { time: '02:00 PM', class: 'Grade 11-A', subject: 'Physics', room: 'Lab 1', status: 'upcoming' },
  ];

  const recentSubmissions = [
    { student: 'John Doe', assignment: 'Math Assignment 5', class: 'Grade 10-A', submittedAt: '2 hours ago', status: 'pending' },
    { student: 'Jane Smith', assignment: 'Physics Lab Report', class: 'Grade 11-A', submittedAt: '4 hours ago', status: 'pending' },
    { student: 'Mike Johnson', assignment: 'Math Assignment 4', class: 'Grade 10-B', submittedAt: '1 day ago', status: 'graded' },
  ];

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>Teacher Dashboard</h2>
            <p className="text-muted">Welcome, {user?.firstName}! Ready for today's classes?</p>
          </div>

          {/* Statistics Cards */}
          <Row className="mb-4">
            <Col md={2} className="mb-3">
              <Card className="stat-card border-0 shadow-sm text-center">
                <Card.Body>
                  <i className="bi bi-door-open fs-1 text-primary mb-2"></i>
                  <h3 className="mb-1">{stats.myClasses}</h3>
                  <small className="text-muted">My Classes</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={2} className="mb-3">
              <Card className="stat-card border-0 shadow-sm text-center">
                <Card.Body>
                  <i className="bi bi-people fs-1 text-success mb-2"></i>
                  <h3 className="mb-1">{stats.totalStudents}</h3>
                  <small className="text-muted">Students</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={2} className="mb-3">
              <Card className="stat-card border-0 shadow-sm text-center">
                <Card.Body>
                  <i className="bi bi-file-text fs-1 text-warning mb-2"></i>
                  <h3 className="mb-1">{stats.pendingAssignments}</h3>
                  <small className="text-muted">Assignments</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={2} className="mb-3">
              <Card className="stat-card border-0 shadow-sm text-center">
                <Card.Body>
                  <i className="bi bi-star fs-1 text-danger mb-2"></i>
                  <h3 className="mb-1">{stats.pendingGrading}</h3>
                  <small className="text-muted">To Grade</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={2} className="mb-3">
              <Card className="stat-card border-0 shadow-sm text-center">
                <Card.Body>
                  <i className="bi bi-calendar3 fs-1 text-info mb-2"></i>
                  <h3 className="mb-1">{stats.todayClasses}</h3>
                  <small className="text-muted">Today</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={2} className="mb-3">
              <Card className="stat-card border-0 shadow-sm text-center">
                <Card.Body>
                  <i className="bi bi-percent fs-1 text-success mb-2"></i>
                  <h3 className="mb-1">{stats.attendance}%</h3>
                  <small className="text-muted">Attendance</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mb-4">
            {/* Today's Schedule */}
            <Col md={6} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Today's Schedule</h5>
                  <Badge bg="primary">{todaySchedule.length} Classes</Badge>
                </Card.Header>
                <Card.Body className="p-0">
                  <ListGroup variant="flush">
                    {todaySchedule.map((schedule, index) => (
                      <ListGroup.Item key={index}>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-1">{schedule.subject}</h6>
                            <p className="mb-1 text-muted">{schedule.class} • {schedule.room}</p>
                            <small className="text-muted">
                              <i className="bi bi-clock me-1"></i>
                              {schedule.time}
                            </small>
                          </div>
                          <Button variant="outline-primary" size="sm">
                            Start Class
                          </Button>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Card.Body>
              </Card>
            </Col>

            {/* Quick Actions */}
            <Col md={6} className="mb-3">
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">Quick Actions</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-grid gap-2">
                    <Button variant="primary" size="lg">
                      <i className="bi bi-calendar-check me-2"></i>
                      Mark Attendance
                    </Button>
                    <Button variant="success" size="lg">
                      <i className="bi bi-file-plus me-2"></i>
                      Create Assignment
                    </Button>
                    <Button variant="info" size="lg">
                      <i className="bi bi-star me-2"></i>
                      Grade Submissions
                    </Button>
                    <Button variant="warning" size="lg">
                      <i className="bi bi-megaphone me-2"></i>
                      Send Announcement
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Recent Submissions */}
          <Row>
            <Col md={12}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Recent Submissions</h5>
                  <Button variant="link" size="sm">View All</Button>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table hover className="mb-0">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Assignment</th>
                        <th>Class</th>
                        <th>Submitted</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentSubmissions.map((submission, index) => (
                        <tr key={index}>
                          <td>{submission.student}</td>
                          <td>{submission.assignment}</td>
                          <td>{submission.class}</td>
                          <td>{submission.submittedAt}</td>
                          <td>
                            <Badge bg={submission.status === 'pending' ? 'warning' : 'success'}>
                              {submission.status}
                            </Badge>
                          </td>
                          <td>
                            {submission.status === 'pending' ? (
                              <Button variant="primary" size="sm">Grade</Button>
                            ) : (
                              <Button variant="outline-secondary" size="sm">View</Button>
                            )}
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
