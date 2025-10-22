import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Table, Button, Form, Badge, Alert, Spinner } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { teacherService } from '../services/teacherService';
import apiService from '../services/api';
import { timetableService } from '../services/timetableService';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/teacher/my-classes', label: 'My Classes', icon: 'bi-door-open' },
  { path: '/teacher/assignments', label: 'Assignments', icon: 'bi-file-text' },
  { path: '/teacher/study-materials', label: 'Study Materials', icon: 'bi-book' },
  { path: '/teacher/quiz-test', label: 'Quiz & Tests', icon: 'bi-clipboard-check' },
  { path: '/teacher/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
  { path: '/teacher/grading', label: 'Grading', icon: 'bi-star' },
  { path: '/teacher/timetable', label: 'My Timetable', icon: 'bi-calendar3' },
  { path: '/teacher/students', label: 'Students', icon: 'bi-people' },
];

export const TeacherAttendance: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [searchStudent, setSearchStudent] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [students, setStudents] = useState<any[]>([]);
  const schoolId: string = (user as any)?.schoolId || JSON.parse(localStorage.getItem('userInfo') || '{}').schoolId || JSON.parse(localStorage.getItem('user') || '{}').schoolId || '';
  const [canMark, setCanMark] = useState<boolean>(false);
  const [authInfo, setAuthInfo] = useState<any>(null);

  // Period options derived from timetable for selected class/date
  const [periodOptions, setPeriodOptions] = useState<Array<{ period: string; startTime?: string; endTime?: string; subjectName?: string; room?: string }>>([]);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        setLoading(true); setError('');
        const cls = await teacherService.getMyClasses();
        const initial = Array.isArray(cls) ? cls : [];
        const stored = localStorage.getItem('user');
        const me = stored ? JSON.parse(stored) : {};
        const schoolId = me?.schoolId;
        const myProfile = await teacherService.getMyProfile().catch(() => null as any);
        const teacherId = myProfile?.id;
        const userId = me?.id;
        // Derive classes from timetables where this teacher has entries
        const tts = await timetableService.list(schoolId ? { schoolId } : undefined).catch(() => [] as any[]);
        const classIdsFromTT = Array.from(new Set((tts || [])
          .flatMap((t: any) => (t.entries || []).some((e: any) => (teacherId && e.teacherId === teacherId) || (userId && e.teacherId === userId)) ? [t.classId] : [])
        ));
        // Fetch missing class objects
        const existingIds = new Set((initial || []).map((c: any) => c.id));
        const missingIds = classIdsFromTT.filter((id) => !existingIds.has(id));
        const fetchedMissing = await Promise.all(missingIds.map(async (id) => {
          try { const c = await (await import('../services/classService')).classService.getClassById(id); return c; } catch { return null; }
        }));
        const merged = [...initial, ...fetchedMissing.filter(Boolean) as any[]];
        setClasses(merged);
        const params = new URLSearchParams(location.search);
        const preSel = params.get('classId');
        const preDate = params.get('date');
        const prePeriod = params.get('period');
        const preSubject = params.get('subject');
        if (preSel && (cls || []).some((c: any) => c.id === preSel)) setSelectedClass(preSel);
        if (preDate) setSelectedDate(preDate);
        if (prePeriod) setSelectedPeriod(prePeriod);
        if (preSubject) setSelectedSubject(preSubject);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load classes');
      } finally {
        setLoading(false);
      }
    };
    loadClasses();
  }, [location.search]);

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClass) { setStudents([]); return; }
      try {
        setLoading(true); setError('');
        const list = await teacherService.getEnrichedClassStudents(selectedClass);
        const mapped = (list || []).map((s: any, idx: number) => ({
          id: s.id, // Student ID
          name: s.name || `Student ${idx + 1}`,
          rollNo: String(s.rollNo ?? idx + 1),
          schoolId: undefined,
          status: 'PRESENT',
        }));
        setStudents(mapped);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load students');
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, [selectedClass]);

  // Authorization for daily attendance marking
  useEffect(() => {
    const check = async () => {
      if (!selectedClass || !selectedDate) { setCanMark(false); setAuthInfo(null); return; }
      try {
        const resp = await teacherService.checkAttendanceAuthorization(selectedClass, selectedDate);
        setCanMark(!!resp?.allowed);
        setAuthInfo(resp?.firstPeriod || null);
      } catch {
        setCanMark(false);
        setAuthInfo(null);
      }
    };
    check();
  }, [selectedClass, selectedDate]);

  // Load period options from timetable for the selected class + date (day-of-week)
  useEffect(() => {
    const loadPeriods = async () => {
      if (!selectedClass || !selectedDate) { setPeriodOptions([]); return; }
      try {
        const tt = await timetableService.getByClass(selectedClass).catch(async () => {
          // fallback to list
          const schoolId = (user as any)?.schoolId;
          const list = await timetableService.list(schoolId ? { schoolId } : undefined);
          return (list || []).find((t: any) => t.classId === selectedClass);
        });
        if (!tt) { setPeriodOptions([]); return; }
        const dayName = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
        const stored = localStorage.getItem('user');
        const me = stored ? JSON.parse(stored) : {};
        const myProfile = await teacherService.getMyProfile().catch(() => null as any);
        const teacherId = myProfile?.id;
        const userId = me?.id;
        const entries = (tt.entries || [])
          .filter((e: any) => String(e.day).toUpperCase() === dayName)
          .filter((e: any) => (teacherId && e.teacherId === teacherId) || (userId && e.teacherId === userId));
        // Deduplicate by period label if present, else by startTime
        const seen = new Set<string>();
        const options: Array<{ period: string; startTime?: string; endTime?: string; subjectName?: string; room?: string }> = [];
        for (const e of entries) {
          const key = (e.period || e.startTime || '').toString();
          if (key && !seen.has(key)) {
            seen.add(key);
            options.push({ period: e.period || key, startTime: e.startTime, endTime: e.endTime, subjectName: e.subjectName, room: e.room });
          }
        }
        setPeriodOptions(options);
        // Prefill subject based on selected period or default first option
        const match = options.find(o => o.period === selectedPeriod) || options[0];
        if (match) {
          if (!selectedPeriod) setSelectedPeriod(match.period || '');
          if (!selectedSubject) setSelectedSubject(match.subjectName || '');
        }
      } catch {
        setPeriodOptions([]);
      }
    };
    loadPeriods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass, selectedDate]);

  const handleMarkAttendance = (studentId: string, status: string) => {
    if (!canMark) return; // read-only when not authorized
    setStudents(students.map(s => 
      s.id === studentId ? { ...s, status } : s
    ));
  };

  const handleSaveAttendance = async () => {
    if (!selectedClass || students.length === 0) return;
    try {
      setLoading(true); setError('');
      const date = selectedDate; // YYYY-MM-DD
      const payloads = students.map((s) => ({
        studentId: s.id,
        schoolId,
        date,
        // period omitted - daily attendance
        subject: selectedSubject || undefined,
        status: s.status,
        remarks: undefined,
      }));
      // Save sequentially to avoid overloading backend
      for (const p of payloads) {
        await apiService.post(`/teacher/classes/${selectedClass}/attendance`, p);
      }
      setSuccess(`Attendance saved for ${new Date(selectedDate).toLocaleDateString()}.`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to save attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAll = (status: string) => {
    setStudents(students.map(s => ({ ...s, status })));
  };

  const filteredStudents = students.filter(s => {
    const name = String(s.name || '').toLowerCase();
    const roll = String(s.rollNo || '').toLowerCase();
    const q = String(searchStudent || '').toLowerCase();
    return name.includes(q) || roll.includes(q);
  });

  const stats = {
    present: students.filter(s => s.status === 'PRESENT').length,
    absent: students.filter(s => s.status === 'ABSENT').length,
    late: students.filter(s => s.status === 'LATE').length,
  };

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>Mark Attendance</h2>
            <p className="text-muted">Take attendance for your classes</p>
          </div>

          {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}
          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Class/Section *</strong></Form.Label>
                    <Form.Select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                    >
                      <option value="">Select class...</option>
                      {classes.map((c) => {
                        const label = `${c.className || c.grade || c.name || 'Class'}${c.section ? ' - ' + c.section : ''}`;
                        return (
                          <option key={c.id} value={c.id}>
                            {label}
                          </option>
                        );
                      })}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Date *</strong></Form.Label>
                    <Form.Control
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Period *</strong></Form.Label>
                    <Form.Select
                      value={selectedPeriod}
                      onChange={(e) => {
                        const p = e.target.value; setSelectedPeriod(p);
                        const match = periodOptions.find(o => o.period === p);
                        if (match) setSelectedSubject(match.subjectName || '');
                      }}
                    >
                      <option value="">Select period...</option>
                      {periodOptions.map((p) => (
                        <option key={p.period} value={p.period}>{p.period}{p.startTime ? ` (${String(p.startTime).slice(0,5)})` : ''}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Subject</strong></Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Subject for this period"
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Search Student</strong></Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Search by name or roll number..."
                      value={searchStudent}
                      onChange={(e) => setSearchStudent(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>

              {selectedClass && (
                <div className="d-flex gap-2">
                  <Button variant="success" size="sm" onClick={() => handleMarkAll('PRESENT')} disabled={!canMark}>
                    <i className="bi bi-check-all me-1"></i>
                    Mark All Present
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleMarkAll('ABSENT')} disabled={!canMark}>
                    <i className="bi bi-x-circle me-1"></i>
                    Mark All Absent
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>

          {selectedClass && (
            <>
              {loading && (
                <div className="text-center py-3"><Spinner animation="border" size="sm" /></div>
              )}
              <Row className="mb-4">
                <Col md={4}>
                  <Card className="border-0 shadow-sm text-center">
                    <Card.Body>
                      <h6 className="text-muted">Present</h6>
                      <h2 className="text-success">{stats.present}</h2>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-0 shadow-sm text-center">
                    <Card.Body>
                      <h6 className="text-muted">Absent</h6>
                      <h2 className="text-danger">{stats.absent}</h2>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-0 shadow-sm text-center">
                    <Card.Body>
                      <h6 className="text-muted">Late</h6>
                      <h2 className="text-warning">{stats.late}</h2>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Students - {(() => {
                    const c = classes.find(cc => cc.id === selectedClass);
                    return c ? (c.name || `${c.className || c.grade || 'Class'}${c.section ? ' - ' + c.section : ''}`) : selectedClass;
                  })()}</h5>
                  <Badge bg="primary">{filteredStudents.length} students</Badge>
                </Card.Header>
                <Card.Body>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Roll No</th>
                        <th>Student Name</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => (
                        <tr key={student.id}>
                          <td><strong>{student.rollNo}</strong></td>
                          <td>{student.name}</td>
                          <td>
                            <Badge bg={
                              student.status === 'PRESENT' ? 'success' :
                              student.status === 'ABSENT' ? 'danger' :
                              student.status === 'LATE' ? 'warning' : 'secondary'
                            }>
                              {student.status}
                            </Badge>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleMarkAttendance(student.id, 'PRESENT')}
                                disabled={!canMark}
                              >
                                Present
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleMarkAttendance(student.id, 'ABSENT')}
                                disabled={!canMark}
                              >
                                Absent
                              </Button>
                              <Button
                                variant="warning"
                                size="sm"
                                onClick={() => handleMarkAttendance(student.id, 'LATE')}
                                disabled={!canMark}
                              >
                                Late
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
                <Card.Footer className="bg-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex flex-column">
                      <Alert variant="info" className="mb-2">
                        <i className="bi bi-info-circle me-2"></i>
                        Absent students and their parents will be notified automatically
                      </Alert>
                      {!canMark && (
                        <Alert variant="warning" className="mb-0">
                          <i className="bi bi-lock me-2"></i>
                          Read-only: Only the teacher assigned to the first period can mark attendance for {new Date(selectedDate).toLocaleDateString()}.
                        </Alert>
                      )}
                    </div>
                    <Button variant="primary" size="lg" onClick={handleSaveAttendance} disabled={!canMark}>
                      <i className="bi bi-save me-2"></i>
                      Save Attendance
                    </Button>
                  </div>
                </Card.Footer>
              </Card>
            </>
          )}
        </Col>
      </Row>
    </Layout>
  );
};
