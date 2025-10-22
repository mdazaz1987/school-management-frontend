import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Form, ProgressBar, Alert, Spinner, Button, Modal } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { attendanceService } from '../services/attendanceService';
import { studentService } from '../services/studentService';
import apiService from '../services/api';
import { timetableService } from '../services/timetableService';
import { classService } from '../services/classService';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/student/assignments', label: 'Assignments', icon: 'bi-file-text' },
  { path: '/student/study-materials', label: 'Study Materials', icon: 'bi-book' },
  { path: '/student/quizzes', label: 'Quizzes & Tests', icon: 'bi-clipboard-check' },
  { path: '/student/exams', label: 'Exams & Results', icon: 'bi-clipboard-check' },
  { path: '/student/attendance', label: 'My Attendance', icon: 'bi-calendar-check' },
  { path: '/student/timetable', label: 'Timetable', icon: 'bi-calendar3' },
  { path: '/student/fees', label: 'Fee Payment', icon: 'bi-cash-coin' },
  { path: '/student/notifications', label: 'Notifications', icon: 'bi-bell' },
];

export const StudentAttendance: React.FC = () => {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalDays: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    percentage: 0
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [correctionPeriod, setCorrectionPeriod] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [success, setSuccess] = useState('');
  const [timeSlotsByDay, setTimeSlotsByDay] = useState<Record<string, Record<string, { start: string; end: string }>>>({});
  const [classLabel, setClassLabel] = useState<string>('');

  useEffect(() => {
    loadAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, selectedMonth, selectedYear]);

  const loadAttendance = async () => {
    if (!user?.email) return;
    setLoading(true);
    setError('');
    try {
      const student = await studentService.getStudentByEmail(user.email);
      const studentId = (student as any).id;
      const schoolId = (student as any).schoolId;
      const classId = (student as any).classId;
      const section = (student as any).section;

      // Backend month is 1-indexed
      const records = await attendanceService.getMonthly(studentId, selectedYear, selectedMonth + 1);

      // Build day->period->time map from timetable for this student's class
      try {
        const tt = await timetableService.getByClass(classId, section);
        const map: Record<string, Record<string, { start: string; end: string }>> = {};
        (tt.entries || []).forEach((e: any) => {
          const day = String(e.day || '').toUpperCase();
          if (!map[day]) map[day] = {};
          map[day][e.period] = {
            start: String(e.startTime || '').slice(0,5),
            end: String(e.endTime || '').slice(0,5),
          };
        });
        setTimeSlotsByDay(map);
      } catch {}

      // Resolve class label (e.g., "UKG - A")
      try {
        if ((student as any).className) {
          setClassLabel((student as any).className);
        } else if (classId) {
          const cls = await classService.getClassById(classId);
          const label = `${(cls as any).className || (cls as any).name || ''}${(cls as any).section ? ' - ' + (cls as any).section : ''}`.trim();
          setClassLabel(label);
        }
      } catch {}

      const present = records.filter((r: any) => r.status === 'PRESENT').length;
      const absent = records.filter((r: any) => r.status === 'ABSENT').length;
      const late = records.filter((r: any) => r.status === 'LATE').length;
      const excused = records.filter((r: any) => r.status === 'EXCUSED').length;
      const total = records.length;
      const percentage = total > 0 ? Math.round(((present + late + excused) / total) * 100) : 0;

      setAttendanceRecords(records);
      setStats({ totalDays: total, present, absent, late, excused, percentage });
      // Cache school/class for corrections
      (window as any).__studentMeta = { studentId, schoolId, classId };
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT': return <Badge bg="success">Present</Badge>;
      case 'ABSENT': return <Badge bg="danger">Absent</Badge>;
      case 'LATE': return <Badge bg="warning">Late</Badge>;
      case 'EXCUSED': return <Badge bg="info">Excused</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const handleRequestCorrection = (record: any) => {
    setSelectedRecord(record);
    setCorrectionPeriod('');
    setCorrectionReason('');
    setShowCorrectionModal(true);
  };

  const submitCorrectionRequest = async () => {
    if (!correctionPeriod || !correctionReason.trim()) {
      setError('Please select period and provide a valid reason');
      return;
    }

    try {
      const meta = (window as any).__studentMeta || {};
      await apiService.post('/attendance/corrections', {
        studentId: meta.studentId,
        classId: meta.classId,
        schoolId: meta.schoolId,
        date: new Date(selectedRecord.date).toISOString().slice(0, 10),
        period: correctionPeriod === 'Full Day' ? null : correctionPeriod,
        reason: correctionReason,
        requestedBy: (JSON.parse(localStorage.getItem('user') || '{}') as any).id,
        requestedByRole: 'STUDENT',
        desiredStatus: 'PRESENT',
      });

      setSuccess('Attendance correction request submitted successfully!');
      setShowCorrectionModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError('Failed to submit correction request');
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>My Attendance</h2>
            <p className="text-muted">Track your attendance record</p>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          {/* Filter */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row className="align-items-end">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Month</Form.Label>
                    <Form.Select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    >
                      {months.map((month, index) => (
                        <option key={index} value={index}>{month}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Year</Form.Label>
                    <Form.Select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                    >
                      {years.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <p className="mt-2">Loading attendance...</p>
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              <Row className="mb-4">
                <Col md={2}>
                  <Card className="border-0 shadow-sm text-center">
                    <Card.Body>
                      <h6 className="text-muted mb-2">Total Days</h6>
                      <h3 className="mb-0">{stats.totalDays}</h3>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={2}>
                  <Card className="border-0 shadow-sm text-center">
                    <Card.Body>
                      <h6 className="text-muted mb-2">Present</h6>
                      <h3 className="mb-0 text-success">{stats.present}</h3>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={2}>
                  <Card className="border-0 shadow-sm text-center">
                    <Card.Body>
                      <h6 className="text-muted mb-2">Absent</h6>
                      <h3 className="mb-0 text-danger">{stats.absent}</h3>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={2}>
                  <Card className="border-0 shadow-sm text-center">
                    <Card.Body>
                      <h6 className="text-muted mb-2">Late</h6>
                      <h3 className="mb-0 text-warning">{stats.late}</h3>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <h6 className="text-muted mb-2">Attendance Rate</h6>
                      <h3 className="mb-2">{stats.percentage}%</h3>
                      <ProgressBar 
                        now={stats.percentage} 
                        variant={stats.percentage >= 90 ? 'success' : stats.percentage >= 75 ? 'primary' : 'danger'}
                      />
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Attendance Records */}
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">Attendance Records - {months[selectedMonth]} {selectedYear}</h5>
                </Card.Header>
                <Card.Body>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Day</th>
                        <th>Status</th>
                        <th>Class</th>
                        <th>Remarks</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.map((record, index) => {
                        const date = new Date(record.date);
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        return (
                          <tr key={index}>
                            <td>{date.toLocaleDateString()}</td>
                            <td>{dayNames[date.getDay()]}</td>
                            <td>{getStatusBadge(record.status)}</td>
                            <td>{classLabel || '—'}</td>
                            <td><small className="text-muted">{record.remarks || '—'}</small></td>
                            <td>
                              {(record.status === 'ABSENT' || record.status === 'LATE') && (
                                <Button
                                  size="sm"
                                  variant="outline-warning"
                                  onClick={() => handleRequestCorrection(record)}
                                >
                                  <i className="bi bi-exclamation-circle me-1"></i>
                                  Request Correction
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </>
          )}
        </Col>
      </Row>

      {/* Attendance Correction Request Modal */}
      <Modal show={showCorrectionModal} onHide={() => setShowCorrectionModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Request Attendance Correction</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRecord && (
            <>
              <Alert variant="info">
                <i className="bi bi-info-circle me-2"></i>
                <strong>Date:</strong> {new Date(selectedRecord.date).toLocaleDateString()} | 
                <strong className="ms-2">Current Status:</strong> {selectedRecord.status}
              </Alert>

              <Form.Group className="mb-3">
                <Form.Label>Select Period *</Form.Label>
                <Form.Select
                  value={correctionPeriod}
                  onChange={(e) => setCorrectionPeriod(e.target.value)}
                  required
                >
                  <option value="">Choose period...</option>
                  <option value="Period 1">Period 1 (9:00 AM - 10:00 AM)</option>
                  <option value="Period 2">Period 2 (10:00 AM - 11:00 AM)</option>
                  <option value="Period 3">Period 3 (11:00 AM - 12:00 PM)</option>
                  <option value="Period 4">Period 4 (12:00 PM - 1:00 PM)</option>
                  <option value="Period 5">Period 5 (2:00 PM - 3:00 PM)</option>
                  <option value="Period 6">Period 6 (3:00 PM - 4:00 PM)</option>
                  <option value="Full Day">Full Day</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Reason for Correction *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  placeholder="Please provide a detailed reason for the attendance correction request..."
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  required
                />
                <Form.Text className="text-muted">
                  Be specific and provide valid documentation if required.
                </Form.Text>
              </Form.Group>

              <Alert variant="warning" className="mb-0">
                <small>
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>Note:</strong> Your request will be reviewed by your teacher or admin. 
                  You may be required to provide supporting documents.
                </small>
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCorrectionModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={submitCorrectionRequest}
            disabled={!correctionPeriod || !correctionReason.trim()}
          >
            <i className="bi bi-send me-2"></i>
            Submit Request
          </Button>
        </Modal.Footer>
      </Modal>
    </Layout>
  );
};
