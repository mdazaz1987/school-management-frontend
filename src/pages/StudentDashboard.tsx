import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Badge, ProgressBar, ListGroup, Alert, Spinner } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { studentService } from '../services/studentService';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/assignments', label: 'Assignments', icon: 'bi-file-text' },
  { path: '/exams', label: 'Exams & Results', icon: 'bi-clipboard-check' },
  { path: '/attendance', label: 'My Attendance', icon: 'bi-calendar-check' },
  { path: '/timetable', label: 'Timetable', icon: 'bi-calendar3' },
  { path: '/fees', label: 'Fee Payment', icon: 'bi-cash-coin' },
  { path: '/notifications', label: 'Notifications', icon: 'bi-bell' },
];

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    attendanceRate: 0,
    pendingAssignments: 0,
    upcomingExams: 0,
    completedAssignments: 0,
    averageGrade: 0,
    totalSubjects: 0,
  });
  const [upcomingAssignments, setUpcomingAssignments] = useState<any[]>([]);
  const [recentGrades, setRecentGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      if (!user?.email) return;
      setLoading(true);
      setError('');
      try {
        // Map logged-in user -> student record
        const student = await studentService.getStudentByEmail(user.email);
        // Load dashboard
        const dashboard = await studentService.getStudentDashboard(student.id);

        // Stats
        const attendanceRate = Math.round(dashboard.attendancePercentage || 0);
        const pendingAssignmentsCount = (dashboard.pendingAssignments || []).length;
        const completedAssignments = (dashboard.recentSubmissions || []).filter((s: any) => s.status === 'GRADED').length;
        const totalSubjects = (dashboard.student?.subjects?.length || dashboard.classInfo?.subjects?.length || 0);

        setStats((prev) => ({
          ...prev,
          attendanceRate,
          pendingAssignments: pendingAssignmentsCount,
          completedAssignments,
          totalSubjects,
        }));

        // Lists
        setUpcomingAssignments((dashboard.pendingAssignments || []).map((a: any) => ({
          title: a.title || a.name || 'Assignment',
          subject: a.subject || a.subjectName || '—',
          dueDate: a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '—',
          status: 'pending',
        })));

        setRecentGrades((dashboard.recentSubmissions || []).map((s: any) => ({
          subject: '—',
          assignment: s.assignmentId,
          grade: s.grade || '—',
          marks: s.marksObtained != null ? String(s.marksObtained) : '—',
          date: s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '—',
          status: s.status,
        })));
      } catch (e: any) {
        setError(e.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.email]);

  const upcomingClasses = [
    { time: '09:00 AM', subject: 'Mathematics', teacher: 'Mr. Smith', room: 'Room 101' },
    { time: '11:00 AM', subject: 'Physics', teacher: 'Dr. Johnson', room: 'Lab 1' },
    { time: '02:00 PM', subject: 'English', teacher: 'Ms. Williams', room: 'Room 203' },
  ];

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>Student Dashboard</h2>
            <p className="text-muted">Welcome back, {user?.firstName}! Stay on top of your studies.</p>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {loading && (
            <div className="mb-3 d-flex align-items-center">
              <Spinner animation="border" size="sm" className="me-2" />
              <span>Loading...</span>
            </div>
          )}

          {/* Statistics Cards */}
          <Row className="mb-4">
            <Col md={4} className="mb-3">
              <Card className="stat-card border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <Card.Title className="h6 text-muted">Attendance Rate</Card.Title>
                      <h3 className="mb-0">{stats.attendanceRate}%</h3>
                    </div>
                    <div className="bg-success bg-opacity-10 p-3 rounded">
                      <i className="bi bi-calendar-check fs-2 text-success"></i>
                    </div>
                  </div>
                  <ProgressBar now={stats.attendanceRate} variant="success" />
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-3">
              <Card className="stat-card border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <Card.Title className="h6 text-muted">Average Grade</Card.Title>
                      <h3 className="mb-0">{stats.averageGrade}%</h3>
                    </div>
                    <div className="bg-primary bg-opacity-10 p-3 rounded">
                      <i className="bi bi-star fs-2 text-primary"></i>
                    </div>
                  </div>
                  <ProgressBar now={stats.averageGrade} variant="primary" />
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-3">
              <Card className="stat-card border-0 shadow-sm">
                <Card.Body>
                  <Row className="text-center">
                    <Col xs={4}>
                      <div className="bg-warning bg-opacity-10 p-2 rounded mb-2">
                        <i className="bi bi-file-text fs-4 text-warning"></i>
                      </div>
                      <h5 className="mb-0">{stats.pendingAssignments}</h5>
                      <small className="text-muted">Pending</small>
                    </Col>
                    <Col xs={4}>
                      <div className="bg-info bg-opacity-10 p-2 rounded mb-2">
                        <i className="bi bi-clipboard-check fs-4 text-info"></i>
                      </div>
                      <h5 className="mb-0">{stats.upcomingExams}</h5>
                      <small className="text-muted">Exams</small>
                    </Col>
                    <Col xs={4}>
                      <div className="bg-success bg-opacity-10 p-2 rounded mb-2">
                        <i className="bi bi-check-circle fs-4 text-success"></i>
                      </div>
                      <h5 className="mb-0">{stats.completedAssignments}</h5>
                      <small className="text-muted">Done</small>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mb-4">
            {/* Today's Classes */}
            <Col md={4} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">Today's Classes</h5>
                </Card.Header>
                <Card.Body className="p-0">
                  <ListGroup variant="flush">
                    {upcomingClasses.map((classItem, index) => (
                      <ListGroup.Item key={index}>
                        <div className="d-flex align-items-center">
                          <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                            <i className="bi bi-book text-primary"></i>
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-0">{classItem.subject}</h6>
                            <small className="text-muted">{classItem.time} • {classItem.room}</small>
                          </div>
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Card.Body>
              </Card>
            </Col>

            {/* Pending Assignments */}
            <Col md={8} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Pending Assignments</h5>
                  <Badge bg="warning">{upcomingAssignments.length} Pending</Badge>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table hover className="mb-0">
                    <thead>
                      <tr>
                        <th>Assignment</th>
                        <th>Subject</th>
                        <th>Due Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingAssignments.map((assignment, index) => (
                        <tr key={index}>
                          <td>{assignment.title}</td>
                          <td>
                            <Badge bg="secondary">{assignment.subject}</Badge>
                          </td>
                          <td>
                            <span className={assignment.dueDate === 'Tomorrow' ? 'text-danger fw-bold' : ''}>
                              <i className="bi bi-clock me-1"></i>
                              {assignment.dueDate}
                            </span>
                          </td>
                          <td>
                            <Button variant="primary" size="sm">Submit</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Recent Grades */}
          <Row>
            <Col md={12}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Recent Grades</h5>
                  <Button variant="link" size="sm">View All</Button>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table hover className="mb-0">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Assignment</th>
                        <th>Marks</th>
                        <th>Grade</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentGrades.map((grade, index) => (
                        <tr key={index}>
                          <td>
                            <Badge bg="info">{grade.subject}</Badge>
                          </td>
                          <td>{grade.assignment}</td>
                          <td>{grade.marks}</td>
                          <td>
                            <Badge 
                              bg={grade.grade.startsWith('A') ? 'success' : grade.grade.startsWith('B') ? 'primary' : 'warning'}
                              className="fs-6"
                            >
                              {grade.grade}
                            </Badge>
                          </td>
                          <td>{grade.date}</td>
                          <td>
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
