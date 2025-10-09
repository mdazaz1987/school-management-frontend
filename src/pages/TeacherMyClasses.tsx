import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Button, Form, Tabs, Tab, Spinner, Alert } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { teacherService } from '../services/teacherService';
import { timetableService } from '../services/timetableService';
import { classService } from '../services/classService';
import { useNavigate } from 'react-router-dom';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/teacher/my-classes', label: 'My Classes', icon: 'bi-door-open' },
  { path: '/teacher/assignments', label: 'Assignments', icon: 'bi-file-text' },
  { path: '/teacher/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
  { path: '/teacher/grading', label: 'Grading', icon: 'bi-star' },
  { path: '/teacher/timetable', label: 'My Timetable', icon: 'bi-calendar3' },
  { path: '/teacher/students', label: 'Students', icon: 'bi-people' },
];

export const TeacherMyClasses: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('current');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [classes, setClasses] = useState<any>({ current: [], past: [], upcoming: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const base = await teacherService.getMyClasses();
      const stored = localStorage.getItem('user');
      const me = stored ? JSON.parse(stored) : {};
      const schoolId = me?.schoolId;
      const myProfile = await teacherService.getMyProfile().catch(() => null as any);
      const teacherId = myProfile?.id;
      const userId = me?.id;
      const tts = await timetableService.list(schoolId ? { schoolId } : undefined).catch(() => [] as any[]);
      const classIdsFromTT = Array.from(new Set((tts || [])
        .flatMap((t: any) => (t.entries || []).some((e: any) => (teacherId && e.teacherId === teacherId) || (userId && e.teacherId === userId)) ? [t.classId] : [])
      ));
      const existingIds = new Set((base || []).map((c: any) => c.id));
      const missingIds = classIdsFromTT.filter((id) => !existingIds.has(id));
      const fetchedMissing = await Promise.all(missingIds.map(async (id) => {
        try { return await classService.getClassById(id); } catch { return null; }
      }));
      const data = [...(base || []), ...fetchedMissing.filter(Boolean) as any[]];
      
      // Separate classes by academic year
      const currentYear = new Date().getFullYear();
      const current = data.filter((c: any) => c.academicYear?.includes(currentYear.toString()) || !c.academicYear);
      const past = data.filter((c: any) => c.academicYear && parseInt(c.academicYear.split('-')[0]) < currentYear);
      
      // Build mapped classes first (without counts)
      const mapClass = (c: any) => ({
        id: c.id,
        name: `${c.className || c.grade || c.name || 'Class'}${c.section ? ' - ' + c.section : ''}`,
        subject: c.subject || 'Multiple Subjects',
        students: 0, // will populate below
        schedule: 'Check Timetable',
        room: c.room || c.roomNumber || 'TBA',
        academicYear: c.academicYear || `${currentYear}-${currentYear + 1}`,
        term: c.term || 'Current Term'
      });

      const cur = current.map(mapClass);
      const pst = past.map((c: any) => ({ ...mapClass(c), term: c.term || 'Past Term' }));

      // Populate student counts via enriched endpoint (per class)
      const fillCounts = async (arr: any[]) => {
        await Promise.all(arr.map(async (cl) => {
          try {
            const list = await teacherService.getEnrichedClassStudents(cl.id);
            cl.students = (list || []).length;
          } catch { cl.students = 0; }
        }));
      };
      await Promise.all([fillCounts(cur), fillCounts(pst)]);

      setClasses({ current: cur, past: pst, upcoming: [] });
    } catch (err: any) {
      console.error('Failed to load classes:', err);
      setError('Failed to load classes. Using demo data.');
      // Keep demo data on error
      setClasses({
        current: [
          { id: '1', name: 'Grade 10-A', subject: 'Mathematics', students: 35, schedule: 'Mon, Wed, Fri - 09:00 AM', room: 'Room 101', academicYear: '2024-2025', term: 'Second Term' }
        ],
        past: [],
        upcoming: []
      });
    } finally {
      setLoading(false);
    }
  };

  const getClassesForDate = (date: string) => {
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
    return classes.current.filter((c: any) => c.schedule.includes(dayOfWeek));
  };

  const selectedDateClasses = getClassesForDate(selectedDate);

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>My Classes</h2>
            <p className="text-muted">Manage your assigned classes</p>
          </div>

          {error && (
            <Alert variant="warning" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <p className="mt-2">Loading classes...</p>
            </div>
          ) : (
            <>
          {/* Date Selector */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Form.Group>
                <Form.Label><strong>Select Date to View Classes</strong></Form.Label>
                <Form.Control
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ maxWidth: '300px' }}
                />
              </Form.Group>
              {selectedDateClasses.length > 0 && (
                <div className="mt-3">
                  <Badge bg="info">{selectedDateClasses.length} classes on {new Date(selectedDate).toLocaleDateString()}</Badge>
                </div>
              )}
            </Card.Body>
          </Card>

          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'current')} className="mb-3">
            <Tab eventKey="current" title={`Current (${classes.current.length})`}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Class</th>
                        <th>Subject</th>
                        <th>Students</th>
                        <th>Schedule</th>
                        <th>Room</th>
                        <th>Term</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes.current.map((cls: any) => (
                        <tr key={cls.id}>
                          <td><strong>{cls.name}</strong></td>
                          <td><Badge bg="primary">{cls.subject}</Badge></td>
                          <td>{cls.students}</td>
                          <td><small>{cls.schedule}</small></td>
                          <td>{cls.room}</td>
                          <td><Badge bg="success">{cls.term}</Badge></td>
                          <td>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() => navigate(`/teacher/students?classId=${encodeURIComponent(cls.id)}`)}
                            >
                              <i className="bi bi-people"></i>
                            </Button>
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => navigate(`/teacher/attendance?classId=${encodeURIComponent(cls.id)}`)}
                            >
                              <i className="bi bi-calendar-check"></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="past" title={`Past (${classes.past.length})`}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Class</th>
                        <th>Subject</th>
                        <th>Students</th>
                        <th>Academic Year</th>
                        <th>Term</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes.past.map((cls: any) => (
                        <tr key={cls.id}>
                          <td><strong>{cls.name}</strong></td>
                          <td><Badge bg="secondary">{cls.subject}</Badge></td>
                          <td>{cls.students}</td>
                          <td>{cls.academicYear}</td>
                          <td><Badge bg="secondary">{cls.term}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="upcoming" title="Upcoming (0)">
              <Card className="border-0 shadow-sm">
                <Card.Body className="text-center py-5">
                  <i className="bi bi-calendar-x fs-1 text-muted mb-3"></i>
                  <p className="text-muted">No upcoming classes scheduled</p>
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
            </>
          )}
        </Col>
      </Row>
    </Layout>
  );
};
