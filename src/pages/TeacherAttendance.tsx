import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Button, Form, Badge, Alert, Spinner } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { teacherService } from '../services/teacherService';
import apiService from '../services/api';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/teacher/my-classes', label: 'My Classes', icon: 'bi-door-open' },
  { path: '/teacher/assignments', label: 'Assignments', icon: 'bi-file-text' },
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
  const [searchStudent, setSearchStudent] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [students, setStudents] = useState<any[]>([]);
  const schoolId: string = (user as any)?.schoolId || JSON.parse(localStorage.getItem('userInfo') || '{}').schoolId || JSON.parse(localStorage.getItem('user') || '{}').schoolId || '';

  useEffect(() => {
    const loadClasses = async () => {
      try {
        setLoading(true); setError('');
        const cls = await teacherService.getMyClasses();
        setClasses(cls);
        const params = new URLSearchParams(location.search);
        const preSel = params.get('classId');
        if (preSel && (cls || []).some((c: any) => c.id === preSel)) setSelectedClass(preSel);
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

  const handleMarkAttendance = (studentId: string, status: string) => {
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
        status: s.status,
        remarks: undefined,
      }));
      // Save sequentially to avoid overloading backend
      for (const p of payloads) {
        await apiService.post(`/teacher/classes/${selectedClass}/attendance`, p);
      }
      setSuccess(`Attendance saved for selected class on ${new Date(selectedDate).toLocaleDateString()}.`);
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
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.className || c.name || `${c.grade || 'Class'}${c.section ? ' - ' + c.section : ''}`}
                        </option>
                      ))}
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
                <Col md={5}>
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
                  <Button variant="success" size="sm" onClick={() => handleMarkAll('PRESENT')}>
                    <i className="bi bi-check-all me-1"></i>
                    Mark All Present
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleMarkAll('ABSENT')}>
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
                    return c ? (c.name || c.className || `${c.grade || 'Class'}${c.section ? ' - ' + c.section : ''}`) : selectedClass;
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
                              >
                                Present
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleMarkAttendance(student.id, 'ABSENT')}
                              >
                                Absent
                              </Button>
                              <Button
                                variant="warning"
                                size="sm"
                                onClick={() => handleMarkAttendance(student.id, 'LATE')}
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
                    <Alert variant="info" className="mb-0">
                      <i className="bi bi-info-circle me-2"></i>
                      Absent students and their parents will be notified automatically
                    </Alert>
                    <Button variant="primary" size="lg" onClick={handleSaveAttendance}>
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
