import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Spinner, Alert, Badge, InputGroup, Nav } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { attendanceService } from '../services/attendanceService';
import { studentService } from '../services/studentService';
import { Attendance, Student, SchoolClass } from '../types';
import { classService } from '../services/classService';
import { useAuth } from '../contexts/AuthContext';

function getMonthRangeISO(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const toISO = (x: Date) => x.toISOString().slice(0, 10);
  return { start: toISO(start), end: toISO(end) };
}

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const schoolId = user?.schoolId || userInfo.schoolId || '';

  const [studentQuery, setStudentQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [{ start, end }, setRange] = useState(() => getMonthRangeISO());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [records, setRecords] = useState<Attendance[]>([]);
  const [summary, setSummary] = useState<{
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    attendancePercentage: number;
  } | null>(null);

  // Admin: class view
  const [viewMode, setViewMode] = useState<'student' | 'class'>('student');
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [classRecords, setClassRecords] = useState<Attendance[]>([]);

  useEffect(() => {
    // if a student is selected, load attendance for range
    if (viewMode === 'student' && selectedStudent) {
      loadAttendance(selectedStudent.id, start, end);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudent, start, end, viewMode]);

  useEffect(() => {
    if (viewMode === 'class') {
      loadClasses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  const searchStudents = async () => {
    setError('');
    try {
      setLoading(true);
      const res = studentService.searchStudents(studentQuery.trim());
      const page = studentService.getAllStudents({ page: 0, size: 10, sort: 'firstName,asc' });
      // If query provided use search, else default to first page
      const list = studentQuery.trim() ? await res : (await page).content;
      setStudents(list);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to search students');
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const cls = await classService.getAllClasses({ schoolId });
      setClasses(cls);
      if (!selectedClassId && cls.length > 0) setSelectedClassId(cls[0].id);
    } catch (e) {
      // ignore
    }
  };

  const loadClassAttendance = async (classId: string, s?: string, e?: string) => {
    setError('');
    try {
      setLoading(true);
      const recs = await attendanceService.getByClassAdmin(classId, { startDate: s, endDate: e });
      setClassRecords(recs as any);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load class attendance');
      setClassRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async (studentId: string, s?: string, e?: string) => {
    setError('');
    try {
      setLoading(true);
      const [recs, sum] = await Promise.all([
        attendanceService.getByStudent(studentId, { startDate: s, endDate: e }),
        attendanceService.getSummary(studentId, { startDate: s, endDate: e }),
      ]);
      setRecords(recs);
      setSummary(sum);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load attendance');
      setRecords([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedStudent(null);
    setRecords([]);
    setSummary(null);
  };

  return (
    <Layout>
      <Container fluid className="py-4">
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="mb-1">Attendance</h2>
                <p className="text-muted mb-0">View attendance by student or by class and date range</p>
              </div>
            </div>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Nav variant="tabs" activeKey={viewMode} onSelect={(k) => setViewMode((k as any) || 'student')} className="mb-3">
          <Nav.Item>
            <Nav.Link eventKey="student">By Student</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="class">By Class</Nav.Link>
          </Nav.Item>
        </Nav>

        {viewMode === 'student' && (
        <Row className="mb-3">
          <Col md={6} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-white">
                <strong>Select Student</strong>
              </Card.Header>
              <Card.Body>
                <InputGroup className="mb-3">
                  <Form.Control
                    placeholder="Search by name or admission number"
                    value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchStudents()}
                  />
                  <Button variant="primary" onClick={searchStudents} disabled={loading}>
                    Search
                  </Button>
                  {selectedStudent && (
                    <Button variant="outline-secondary" onClick={clearSelection} className="ms-2">
                      Clear
                    </Button>
                  )}
                </InputGroup>

                {loading && (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" />
                  </div>
                )}

                {!selectedStudent && students.length > 0 && (
                  <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                    <Table hover size="sm">
                      <thead>
                        <tr>
                          <th>Admission No.</th>
                          <th>Name</th>
                          <th>Class</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s) => (
                          <tr key={s.id}>
                            <td><code>{s.admissionNumber}</code></td>
                            <td>{s.firstName} {s.lastName}</td>
                            <td>{s.className || s.classId}</td>
                            <td className="text-end">
                              <Button size="sm" variant="outline-primary" onClick={() => setSelectedStudent(s)}>
                                Select
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}

                {selectedStudent && (
                  <Alert variant="info" className="mb-0">
                    Selected: <strong>{selectedStudent.firstName} {selectedStudent.lastName}</strong>
                    <span className="ms-2 text-muted">({selectedStudent.admissionNumber})</span>
                  </Alert>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-white">
                <strong>Date Range</strong>
              </Card.Header>
              <Card.Body>
                <Row className="g-3 align-items-end">
                  <Col md={5}>
                    <Form.Group>
                      <Form.Label>Start Date</Form.Label>
                      <Form.Control type="date" value={start} onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))} />
                    </Form.Group>
                  </Col>
                  <Col md={5}>
                    <Form.Group>
                      <Form.Label>End Date</Form.Label>
                      <Form.Control type="date" value={end} onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))} />
                    </Form.Group>
                  </Col>
                  <Col md={2} className="d-grid">
                    <Button variant="outline-secondary" onClick={() => setRange(getMonthRangeISO())}>This Month</Button>
                  </Col>
                </Row>

                {summary && (
                  <Row className="mt-3 text-center">
                    <Col>
                      <div className="p-2 border rounded">
                        <div className="text-muted small">Total Days</div>
                        <div className="fw-bold">{summary.totalDays}</div>
                      </div>
                    </Col>
                    <Col>
                      <div className="p-2 border rounded">
                        <div className="text-muted small">Present</div>
                        <div><Badge bg="success">{summary.presentDays}</Badge></div>
                      </div>
                    </Col>
                    <Col>
                      <div className="p-2 border rounded">
                        <div className="text-muted small">Absent</div>
                        <div><Badge bg="danger">{summary.absentDays}</Badge></div>
                      </div>
                    </Col>
                    <Col>
                      <div className="p-2 border rounded">
                        <div className="text-muted small">Late</div>
                        <div><Badge bg="warning" text="dark">{summary.lateDays}</Badge></div>
                      </div>
                    </Col>
                    <Col>
                      <div className="p-2 border rounded">
                        <div className="text-muted small">Attendance %</div>
                        <div className="fw-bold">{summary.attendancePercentage.toFixed(1)}%</div>
                      </div>
                    </Col>
                  </Row>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
        )}

        {viewMode === 'class' && (
        <Row className="mb-3">
          <Col md={6} className="mb-3">
            <Card className="border-0 shadow-sm h-100">
              <Card.Header className="bg-white">
                <strong>Select Class & Range</strong>
              </Card.Header>
              <Card.Body>
                <Row className="g-3 align-items-end">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Class</Form.Label>
                      <Form.Select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>{(c.className || c.name)} - {c.section}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={5}>
                    <Form.Group>
                      <Form.Label>Start Date</Form.Label>
                      <Form.Control type="date" value={start} onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))} />
                    </Form.Group>
                  </Col>
                  <Col md={5}>
                    <Form.Group>
                      <Form.Label>End Date</Form.Label>
                      <Form.Control type="date" value={end} onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))} />
                    </Form.Group>
                  </Col>
                  <Col md={2} className="d-grid">
                    <Button variant="primary" onClick={() => selectedClassId && loadClassAttendance(selectedClassId, start, end)} disabled={!selectedClassId || loading}>Load</Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        )}

        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Records {viewMode === 'class' && selectedClassId ? `for Class` : ''}</h5>
            {loading && <Spinner size="sm" animation="border" />}
          </Card.Header>
          <Card.Body className="p-0">
            {viewMode === 'student' ? (
              records.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-hourglass display-5 text-primary"></i>
                <p className="mt-2 text-muted">{selectedStudent ? 'No attendance records in this range' : 'Select a student to view attendance'}</p>
              </div>
              ) : (
              <Table responsive hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Subject</th>
                    <th>Period</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td>{new Date(r.date).toLocaleDateString('en-IN')}</td>
                      <td>
                        {r.status === 'PRESENT' && <Badge bg="success">Present</Badge>}
                        {r.status === 'ABSENT' && <Badge bg="danger">Absent</Badge>}
                        {r.status === 'LATE' && <Badge bg="warning" text="dark">Late</Badge>}
                        {r.status === 'EXCUSED' && <Badge bg="info">Excused</Badge>}
                        {r.status === 'HALF_DAY' && <Badge bg="secondary">Half Day</Badge>}
                      </td>
                      <td>{r.subject || '-'}</td>
                      <td>{r.period || '-'}</td>
                      <td>{r.remarks || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              )
            ) : (
              classRecords.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-hourglass display-5 text-primary"></i>
                  <p className="mt-2 text-muted">Select a class and load to view attendance</p>
                </div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Student</th>
                      <th>Status</th>
                      <th>Subject</th>
                      <th>Period</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classRecords.map((r, idx) => (
                      <tr key={r.id || idx}>
                        <td>{new Date(r.date).toLocaleDateString('en-IN')}</td>
                        <td><code>{r.studentId}</code></td>
                        <td>
                          {r.status === 'PRESENT' && <Badge bg="success">Present</Badge>}
                          {r.status === 'ABSENT' && <Badge bg="danger">Absent</Badge>}
                          {r.status === 'LATE' && <Badge bg="warning" text="dark">Late</Badge>}
                          {r.status === 'EXCUSED' && <Badge bg="info">Excused</Badge>}
                          {r.status === 'HALF_DAY' && <Badge bg="secondary">Half Day</Badge>}
                        </td>
                        <td>{r.subject || '-'}</td>
                        <td>{r.period || '-'}</td>
                        <td>{r.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )
            )}
          </Card.Body>
        </Card>
      </Container>
    </Layout>
  );
};

export default AttendancePage;
