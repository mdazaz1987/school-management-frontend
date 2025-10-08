import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Table, Badge, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { teacherService } from '../services/teacherService';
import { timetableService } from '../services/timetableService';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/teacher/my-classes', label: 'My Classes', icon: 'bi-door-open' },
  { path: '/teacher/assignments', label: 'Assignments', icon: 'bi-file-text' },
  { path: '/teacher/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
  { path: '/teacher/grading', label: 'Grading', icon: 'bi-star' },
  { path: '/teacher/timetable', label: 'My Timetable', icon: 'bi-calendar3' },
  { path: '/teacher/students', label: 'Students', icon: 'bi-people' },
];

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    myClasses: 0,
    totalStudents: 0,
    pendingAssignments: 0,
    pendingGrading: 0,
    todayClasses: 3,
    attendance: 95,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const s = await teacherService.getDashboardStats();
        setStats((prev) => ({
          ...prev,
          myClasses: s?.totalClasses || 0,
          totalStudents: s?.totalStudents || 0,
          pendingAssignments: s?.totalAssignments || 0,
          pendingGrading: s?.pendingGrading || 0,
        }));
        // Load today's schedule from timetables
        try {
          const stored = localStorage.getItem('user');
          const me = stored ? JSON.parse(stored) : {};
          const schoolId = me?.schoolId;
          const userId = me?.id;
          // Resolve Teacher entity id for accurate filtering
          const myProfile = await teacherService.getMyProfile().catch(() => null as any);
          const teacherId = myProfile?.id;
          const all = await timetableService.list(schoolId ? { schoolId } : undefined);
          const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
          const todays = (all || [])
            .flatMap((t: any) => (t.entries || []).map((e: any) => ({ ...e, classId: t.classId })))
            .filter((e: any) => String(e.day).toUpperCase() === dayName)
            .filter((e: any) => {
              if (teacherId && e.teacherId === teacherId) return true;
              if (userId && e.teacherId === userId) return true; // legacy
              return false;
            });
          setStats((prev) => ({ ...prev, todayClasses: todays.length }));
        } catch {}
      } catch (err) {
        // Keep defaults if backend is unavailable
        // console.error('Failed to load teacher stats', err);
      }
    };
    loadStats();
  }, []);

  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const stored = localStorage.getItem('user');
        const me = stored ? JSON.parse(stored) : {};
        const schoolId = me?.schoolId;
        const userId = me?.id;
        const myProfile = await teacherService.getMyProfile().catch(() => null as any);
        const teacherId = myProfile?.id;
        const all = await timetableService.list(schoolId ? { schoolId } : undefined);
        const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
        const flattened = (all || [])
          .flatMap((t: any) => (t.entries || []).map((e: any) => ({ ...e, classId: t.classId, className: t.className })));
        // Strict filter by current teacher (entity id or legacy user id)
        const todays = flattened.filter((e: any) => {
          if (String(e.day).toUpperCase() !== dayName) return false;
          if (teacherId && e.teacherId === teacherId) return true;
          if (userId && e.teacherId === userId) return true;
          return false;
        });
        // Build a class name map for user-friendly display
        const myClasses = await teacherService.getMyClasses().catch(() => [] as any[]);
        const nameMap = new Map<string, string>((myClasses || []).map((c: any) => [c.id, (c.name || c.className || `${c.grade || 'Class'}${c.section ? ' - ' + c.section : ''}`)]));

        const parseTimeToDate = (timeStr?: string) => {
          if (!timeStr) return null;
          const now = new Date();
          // normalize HH:mm or HH:mm:ss
          const [hh, mm, ss] = String(timeStr).split(':').map((x: string) => parseInt(x, 10));
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh || 0, mm || 0, ss || 0, 0);
          return d;
        };
        const toHHMM = (s: string) => String(s || '').slice(0,5);
        const now = new Date();
        const entries = todays.map((e: any) => {
          const start = parseTimeToDate(e.startTime);
          const end = parseTimeToDate(e.endTime);
          const isCurrent = !!(start && end && now >= start && now <= end);
          return {
            time: toHHMM(e.startTime),
            startTime: e.startTime,
            endTime: e.endTime,
            class: nameMap.get(e.classId) || e.className || e.classId,
            classId: e.classId,
            subject: e.subjectName || '—',
            room: e.room || '—',
            isCurrent,
          };
        })
        .sort((a: any, b: any) => (a.time > b.time ? 1 : a.time < b.time ? -1 : 0));
        setTodaySchedule(entries);
      } catch {}
    };
    loadSchedule();
  }, []);

  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  useEffect(() => {
    const loadRecent = async () => {
      try {
        const data = await teacherService.getRecentSubmissions(5);
        const rows = (data || []).map((d: any) => ({
          student: d.studentName || d.studentId,
          assignment: d.assignmentTitle || d.assignmentId,
          class: d.className || d.classId,
          submittedAt: d.submittedAt ? new Date(d.submittedAt).toLocaleString() : '',
          status: (d.status || 'SUBMITTED').toLowerCase().replace('_', ' '),
        }));
        setRecentSubmissions(rows);
      } catch (e) {
        // Keep empty if backend not available
      }
    };
    loadRecent();
  }, []);

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
                  {/* Blink style for current class */}
                  <style>{`
                    @keyframes blink {
                      0% { opacity: 1; }
                      50% { opacity: 0.5; }
                      100% { opacity: 1; }
                    }
                    .blink {
                      animation: blink 1s linear infinite;
                    }
                  `}</style>
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
                          <Button 
                            variant={schedule.isCurrent ? 'primary' : 'outline-secondary'}
                            size="sm"
                            className={schedule.isCurrent ? 'blink' : ''}
                            disabled={!schedule.isCurrent}
                            onClick={() => navigate(`/teacher/attendance?classId=${encodeURIComponent(schedule.classId)}`)}
                          >
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
                    <Button 
                      variant="primary" 
                      size="lg"
                      onClick={() => navigate('/teacher/attendance')}
                    >
                      <i className="bi bi-calendar-check me-2"></i>
                      Mark Attendance
                    </Button>
                    <Button 
                      variant="success" 
                      size="lg"
                      onClick={() => navigate('/teacher/assignments')}
                    >
                      <i className="bi bi-file-plus me-2"></i>
                      Create Assignment
                    </Button>
                    <Button 
                      variant="info" 
                      size="lg"
                      onClick={() => navigate('/teacher/grading')}
                    >
                      <i className="bi bi-star me-2"></i>
                      Grade Submissions
                    </Button>
                    <Button 
                      variant="warning" 
                      size="lg"
                      onClick={() => navigate('/notifications')}
                    >
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
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={() => navigate('/teacher/grading')}
                  >
                    View All
                  </Button>
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
                      {recentSubmissions.map((submission, index) => {
                        const status = String(submission.status || '').toLowerCase();
                        const isGraded = status.includes('graded');
                        const isPendingLike = !isGraded; // submitted, resubmitted, late submission treated as pending
                        const variant = isGraded ? 'success' : 'warning';
                        return (
                        <tr key={index}>
                          <td>{submission.student}</td>
                          <td>{submission.assignment}</td>
                          <td>{submission.class}</td>
                          <td>{submission.submittedAt}</td>
                          <td>
                            <Badge bg={variant}>
                              {submission.status}
                            </Badge>
                          </td>
                          <td>
                            {isPendingLike ? (
                              <Button 
                                variant="primary" 
                                size="sm"
                                onClick={() => navigate('/teacher/grading')}
                              >
                                Grade
                              </Button>
                            ) : (
                              <Button 
                                variant="outline-secondary" 
                                size="sm"
                                onClick={() => navigate('/teacher/grading')}
                              >
                                View
                              </Button>
                            )}
                          </td>
                        </tr>
                      );})}
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
