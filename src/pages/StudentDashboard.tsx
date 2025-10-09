import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Badge, ProgressBar, ListGroup, Alert, Spinner, Modal, Form } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { studentService } from '../services/studentService';
import { timetableService } from '../services/timetableService';
import { attendanceService } from '../services/attendanceService';
import apiService from '../services/api';
import { useNavigate } from 'react-router-dom';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/student/assignments', label: 'Assignments', icon: 'bi-file-text' },
  { path: '/student/exams', label: 'Exams & Results', icon: 'bi-clipboard-check' },
  { path: '/student/attendance', label: 'My Attendance', icon: 'bi-calendar-check' },
  { path: '/student/timetable', label: 'Timetable', icon: 'bi-calendar3' },
  { path: '/student/fees', label: 'Fee Payment', icon: 'bi-cash-coin' },
  { path: '/student/notifications', label: 'Notifications', icon: 'bi-bell' },
];

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
    leaveType: 'SICK'
  });

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
        // Load timetable for today's classes
        try {
          const classId = (student as any).classId;
          const section = (student as any).section;
          const tt = await timetableService.getByClass(classId, section);
          const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
          const entries = (tt.entries || []).filter((e: any) => String(e.day).toUpperCase() === dayName);

          // Fetch today's attendance per period to show status next to each class slot
          const todayISO = new Date().toISOString().slice(0, 10);
          let todayAttendance: any[] = [];
          try {
            todayAttendance = await attendanceService.getByStudent((student as any).id, { startDate: todayISO, endDate: todayISO });
          } catch {}
          const attMap: Record<string, string> = {};
          (todayAttendance || []).forEach((r: any) => { if (r?.period) attMap[r.period] = r.status; });

          const classesForToday = entries.map((e: any) => {
            const start = (String(e.startTime || '')).slice(0,5);
            const end = (String(e.endTime || '')).slice(0,5);
            const isBreak = String(e.periodType || '').toUpperCase() === 'BREAK' || String(e.periodType || '').toUpperCase() === 'LUNCH';
            return {
              period: e.period,
              time: start && end ? `${start} - ${end}` : start || '—',
              subject: isBreak ? (String(e.periodType || 'BREAK').toUpperCase() === 'LUNCH' ? 'Lunch Break' : 'Break') : (e.subjectName || '—'),
              teacher: e.teacherName || '—',
              room: e.room || '—',
              type: e.periodType,
              attendance: attMap[e.period] || null,
            };
          });
          setTodayClasses(classesForToday);
        } catch {}
        // Upcoming exams count
        try {
          const exams = await studentService.getUpcomingExams((student as any).id, 30);
          setStats((prev) => ({ ...prev, upcomingExams: exams.length }));
        } catch {}

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

        // Map assignmentId -> title using student's assignments for readable names
        let assignTitleById: Record<string, string> = {};
        try {
          const myAssignments = await studentService.getMyAssignments();
          assignTitleById = (myAssignments || []).reduce((acc: any, a: any) => { if (a?.id) acc[a.id] = a.title || a.name || 'Assignment'; return acc; }, {});
        } catch {}

        setRecentGrades((dashboard.recentSubmissions || []).map((s: any) => ({
          subject: s.subjectName || '—',
          assignment: assignTitleById[s.assignmentId] || s.assignmentTitle || s.assignmentId,
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

  const upcomingClasses = todayClasses;

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2>Student Dashboard</h2>
                <p className="text-muted mb-0">Welcome back, {user?.firstName}! Stay on top of your studies.</p>
              </div>
              <Button variant="outline-primary" onClick={() => setShowLeaveModal(true)}>
                <i className="bi bi-calendar-x me-2"></i>
                Apply for Leave
              </Button>
            </div>
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
                            <i className={`bi ${String(classItem.type).toUpperCase()==='BREAK' || String(classItem.type).toUpperCase()==='LUNCH' ? 'bi-cup-hot text-warning' : 'bi-book text-primary'}`}></i>
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-0">{classItem.subject}</h6>
                            <small className="text-muted">{classItem.time} • {classItem.room}</small>
                          </div>
                          {classItem.attendance && (
                            <div className="ms-2">
                              {classItem.attendance === 'PRESENT' && <Badge bg="success">Present</Badge>}
                              {classItem.attendance === 'ABSENT' && <Badge bg="danger">Absent</Badge>}
                              {classItem.attendance === 'LATE' && <Badge bg="warning" text="dark">Late</Badge>}
                              {classItem.attendance === 'EXCUSED' && <Badge bg="info">Excused</Badge>}
                              {classItem.attendance === 'HALF_DAY' && <Badge bg="secondary">Half Day</Badge>}
                            </div>
                          )}
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
                  <Button variant="link" size="sm" onClick={() => navigate('/student/assignments')}>View All</Button>
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
                            <Button variant="outline-primary" size="sm" onClick={() => navigate('/student/assignments')}>View</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Leave Application Modal */}
          <Modal show={showLeaveModal} onHide={() => setShowLeaveModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Apply for Leave</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Leave Type *</Form.Label>
                  <Form.Select
                    value={leaveForm.leaveType}
                    onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                  >
                    <option value="SICK">Sick Leave</option>
                    <option value="PERSONAL">Personal</option>
                    <option value="FAMILY">Family Emergency</option>
                    <option value="OTHER">Other</option>
                  </Form.Select>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Start Date *</Form.Label>
                      <Form.Control
                        type="date"
                        value={leaveForm.startDate}
                        onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>End Date *</Form.Label>
                      <Form.Control
                        type="date"
                        value={leaveForm.endDate}
                        onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                        min={leaveForm.startDate}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Reason *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    placeholder="Explain the reason for your leave..."
                  />
                </Form.Group>

                <Alert variant="info" className="mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  Your leave application will be sent to your parent for approval, then forwarded to admin.
                </Alert>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowLeaveModal(false)}>Cancel</Button>
              <Button 
                variant="primary" 
                onClick={async () => {
                  if (!leaveForm.reason || !leaveForm.startDate || !leaveForm.endDate) {
                    setError('Please fill all required fields');
                    return;
                  }
                  try {
                    await apiService.post('/student/leave/apply', leaveForm);
                    setShowLeaveModal(false);
                    setLeaveForm({
                      startDate: new Date().toISOString().split('T')[0],
                      endDate: new Date().toISOString().split('T')[0],
                      reason: '',
                      leaveType: 'SICK'
                    });
                    alert('Leave application submitted successfully!');
                  } catch (e: any) {
                    setError(e?.response?.data?.message || 'Failed to submit leave application');
                  }
                }}
                disabled={!leaveForm.reason || !leaveForm.startDate || !leaveForm.endDate}
              >
                Submit Application
              </Button>
            </Modal.Footer>
          </Modal>
        </Col>
      </Row>
    </Layout>
  );
};
