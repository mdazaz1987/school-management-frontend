import React, { useState } from 'react';
import { Row, Col, Card, Table, Button, Form, Badge, Alert } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';

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
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchStudent, setSearchStudent] = useState('');
  const [success, setSuccess] = useState('');

  const [students, setStudents] = useState([
    { id: '1', name: 'John Doe', rollNo: '101', status: 'PRESENT' },
    { id: '2', name: 'Jane Smith', rollNo: '102', status: 'PRESENT' },
    { id: '3', name: 'Mike Johnson', rollNo: '103', status: 'ABSENT' },
    { id: '4', name: 'Sarah Williams', rollNo: '104', status: 'PRESENT' },
    { id: '5', name: 'Tom Brown', rollNo: '105', status: 'LATE' },
  ]);

  const handleMarkAttendance = (studentId: string, status: string) => {
    setStudents(students.map(s => 
      s.id === studentId ? { ...s, status } : s
    ));
    
    const student = students.find(s => s.id === studentId);
    if (status === 'ABSENT' && student) {
      console.log(`Notification sent to student ${student.name} and parents`);
    }
  };

  const handleSaveAttendance = () => {
    setSuccess(`Attendance saved for ${selectedClass} on ${new Date(selectedDate).toLocaleDateString()}. Notifications sent to absent students and parents.`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleMarkAll = (status: string) => {
    setStudents(students.map(s => ({ ...s, status })));
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
    s.rollNo.includes(searchStudent)
  );

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
                      <option value="Grade 10-A">Grade 10-A - Mathematics</option>
                      <option value="Grade 10-B">Grade 10-B - Mathematics</option>
                      <option value="Grade 11-A">Grade 11-A - Physics</option>
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
                  <h5 className="mb-0">Students - {selectedClass}</h5>
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
