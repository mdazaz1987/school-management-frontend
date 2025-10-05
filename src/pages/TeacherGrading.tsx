import React, { useState } from 'react';
import { Row, Col, Card, Table, Button, Form, Modal, Badge, Alert } from 'react-bootstrap';
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

export const TeacherGrading: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [gradingStudent, setGradingStudent] = useState<any>(null);
  const [success, setSuccess] = useState('');

  const [gradeData, setGradeData] = useState({
    marksObtained: '',
    grade: '',
    feedback: ''
  });

  const [submissions, setSubmissions] = useState([
    { id: '1', studentName: 'John Doe', rollNo: '101', status: 'pending', marks: null, grade: null },
    { id: '2', studentName: 'Jane Smith', rollNo: '102', status: 'pending', marks: null, grade: null },
    { id: '3', studentName: 'Mike Johnson', rollNo: '103', status: 'graded', marks: 85, grade: 'A' },
  ]);

  const handleGrade = (student: any) => {
    setGradingStudent(student);
    setGradeData({
      marksObtained: student.marks?.toString() || '',
      grade: student.grade || '',
      feedback: ''
    });
    setShowModal(true);
  };

  const handleSubmitGrade = () => {
    setSubmissions(submissions.map(s =>
      s.id === gradingStudent.id
        ? { ...s, status: 'graded', marks: Number(gradeData.marksObtained), grade: gradeData.grade }
        : s
    ));
    setSuccess(`Grade submitted for ${gradingStudent.studentName}. Student and parents notified.`);
    setShowModal(false);
    setTimeout(() => setSuccess(''), 3000);
  };

  const calculateGrade = (marks: number) => {
    if (marks >= 90) return 'A+';
    if (marks >= 80) return 'A';
    if (marks >= 70) return 'B+';
    if (marks >= 60) return 'B';
    if (marks >= 50) return 'C';
    return 'F';
  };

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>Grading</h2>
            <p className="text-muted">Grade student submissions</p>
          </div>

          {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Class/Section</strong></Form.Label>
                    <Form.Select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                      <option value="">All Classes</option>
                      <option value="Grade 10-A">Grade 10-A</option>
                      <option value="Grade 10-B">Grade 10-B</option>
                      <option value="Grade 11-A">Grade 11-A</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Type</strong></Form.Label>
                    <Form.Select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                      <option value="">All Types</option>
                      <option value="exam">Exam</option>
                      <option value="assignment">Assignment</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Exam/Assignment</strong></Form.Label>
                    <Form.Select value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)}>
                      <option value="">Select item...</option>
                      <option value="1">Math Assignment 5</option>
                      <option value="2">Mid-Term Exam - Mathematics</option>
                      <option value="3">Physics Lab Report</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {selectedItem && (
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Submissions - Math Assignment 5</h5>
                <small className="text-muted">Total Marks: 100</small>
              </Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Roll No</th>
                      <th>Student Name</th>
                      <th>Marks Obtained</th>
                      <th>Grade</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((submission) => (
                      <tr key={submission.id}>
                        <td><strong>{submission.rollNo}</strong></td>
                        <td>{submission.studentName}</td>
                        <td>{submission.marks ? `${submission.marks}/100` : '-'}</td>
                        <td>
                          {submission.grade ? (
                            <Badge bg="success">{submission.grade}</Badge>
                          ) : '-'}
                        </td>
                        <td>
                          <Badge bg={submission.status === 'graded' ? 'success' : 'warning'}>
                            {submission.status}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant={submission.status === 'graded' ? 'outline-primary' : 'primary'}
                            size="sm"
                            onClick={() => handleGrade(submission)}
                          >
                            <i className="bi bi-pencil me-1"></i>
                            {submission.status === 'graded' ? 'Edit' : 'Grade'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          <Modal show={showModal} onHide={() => setShowModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Grade Submission</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {gradingStudent && (
                <>
                  <Alert variant="info">
                    <strong>Student:</strong> {gradingStudent.studentName} ({gradingStudent.rollNo})
                  </Alert>

                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label>Marks Obtained (out of 100) *</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        max="100"
                        value={gradeData.marksObtained}
                        onChange={(e) => {
                          const marks = Number(e.target.value);
                          setGradeData({
                            ...gradeData,
                            marksObtained: e.target.value,
                            grade: calculateGrade(marks)
                          });
                        }}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Grade *</Form.Label>
                      <Form.Control
                        type="text"
                        value={gradeData.grade}
                        onChange={(e) => setGradeData({ ...gradeData, grade: e.target.value })}
                        readOnly
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Feedback</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={gradeData.feedback}
                        onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                        placeholder="Optional feedback for the student..."
                      />
                    </Form.Group>

                    <Alert variant="warning">
                      <i className="bi bi-bell me-2"></i>
                      Student and parents will be notified about the grade
                    </Alert>
                  </Form>
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={handleSubmitGrade}
                disabled={!gradeData.marksObtained || !gradeData.grade}
              >
                Submit Grade
              </Button>
            </Modal.Footer>
          </Modal>
        </Col>
      </Row>
    </Layout>
  );
};
