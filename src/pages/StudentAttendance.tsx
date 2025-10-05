import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Form, ProgressBar, Alert, Spinner, Button, Modal } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/student/assignments', label: 'Assignments', icon: 'bi-file-text' },
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

  useEffect(() => {
    loadAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, selectedMonth, selectedYear]);

  const loadAttendance = async () => {
    if (!user?.email) return;
    setLoading(true);
    setError('');
    try {
      // Mock data (replace with actual API call)
      const mockRecords = generateMockAttendance(selectedMonth, selectedYear);
      
      const present = mockRecords.filter(r => r.status === 'PRESENT').length;
      const absent = mockRecords.filter(r => r.status === 'ABSENT').length;
      const late = mockRecords.filter(r => r.status === 'LATE').length;
      const excused = mockRecords.filter(r => r.status === 'EXCUSED').length;
      const total = mockRecords.length;
      const percentage = total > 0 ? Math.round(((present + late + excused) / total) * 100) : 0;

      setAttendanceRecords(mockRecords);
      setStats({
        totalDays: total,
        present,
        absent,
        late,
        excused,
        percentage
      });
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const generateMockAttendance = (month: number, year: number) => {
    const records = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'LATE', 'ABSENT'];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      // Skip weekends
      if (date.getDay() !== 0 && date.getDay() !== 6 && date <= new Date()) {
        records.push({
          date: date.toISOString(),
          status: statuses[Math.floor(Math.random() * statuses.length)],
          remarks: ''
        });
      }
    }
    return records;
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
      // Mock API call - replace with actual endpoint
      console.log('Correction request:', {
        date: selectedRecord.date,
        period: correctionPeriod,
        reason: correctionReason
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
