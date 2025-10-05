import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Button, Modal, Form, Alert, Spinner, Tabs, Tab } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { studentService } from '../services/studentService';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/student/assignments', label: 'Assignments', icon: 'bi-file-text' },
  { path: '/student/exams', label: 'Exams & Results', icon: 'bi-clipboard-check' },
  { path: '/student/attendance', label: 'My Attendance', icon: 'bi-calendar-check' },
  { path: '/student/timetable', label: 'Timetable', icon: 'bi-calendar3' },
  { path: '/student/fees', label: 'Fee Payment', icon: 'bi-cash-coin' },
  { path: '/student/notifications', label: 'Notifications', icon: 'bi-bell' },
];

export const StudentAssignments: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [, setSubmissionFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    loadAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const loadAssignments = async () => {
    if (!user?.email) return;
    setLoading(true);
    setError('');
    try {
      // Fetch student data for future enhancements
      // const student = await studentService.getStudentByEmail(user.email);
      // const dashboard = await studentService.getStudentDashboard(student.id);
      
      // Mock assignments data (replace with actual API call)
      const mockAssignments = [
        {
          id: '1',
          title: 'Mathematics - Chapter 5 Exercise',
          subject: 'Mathematics',
          description: 'Complete all problems from Chapter 5',
          dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          assignedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          totalMarks: 100,
          status: 'pending',
          attachments: []
        },
        {
          id: '2',
          title: 'Physics - Lab Report',
          subject: 'Physics',
          description: 'Submit lab report for the recent experiment',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          assignedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          totalMarks: 50,
          status: 'pending',
          attachments: []
        },
        {
          id: '3',
          title: 'English - Essay Writing',
          subject: 'English',
          description: 'Write an essay on "My Future Goals"',
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          assignedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          totalMarks: 50,
          status: 'submitted',
          submittedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          grade: 'A',
          marksObtained: 45,
          feedback: 'Excellent work! Well structured essay.'
        },
        {
          id: '4',
          title: 'Chemistry - Periodic Table Quiz',
          subject: 'Chemistry',
          description: 'Online quiz on periodic table elements',
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          assignedDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
          totalMarks: 25,
          status: 'graded',
          submittedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          grade: 'B+',
          marksObtained: 21,
          feedback: 'Good attempt. Review noble gases.'
        }
      ];
      
      setAssignments(mockAssignments);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAssignment) return;
    
    // Mock submission (replace with actual API call)
    setShowSubmitModal(false);
    alert('Assignment submitted successfully!');
    loadAssignments();
  };

  const filteredAssignments = assignments.filter(a => {
    if (activeTab === 'pending') return a.status === 'pending';
    if (activeTab === 'submitted') return a.status === 'submitted';
    if (activeTab === 'graded') return a.status === 'graded';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge bg="warning">Pending</Badge>;
      case 'submitted': return <Badge bg="info">Submitted</Badge>;
      case 'graded': return <Badge bg="success">Graded</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    return status === 'pending' && new Date(dueDate) < new Date();
  };

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>My Assignments</h2>
            <p className="text-muted">View and submit your assignments</p>
          </div>

          <Alert variant="info" className="mb-4">
            <i className="bi bi-info-circle me-2"></i>
            This page shows all assignments assigned to you. Submit before the due date to avoid penalties.
          </Alert>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <p className="mt-2">Loading assignments...</p>
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'pending')} className="mb-3">
                  <Tab eventKey="pending" title={`Pending (${assignments.filter(a => a.status === 'pending').length})`}>
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Assignment</th>
                          <th>Subject</th>
                          <th>Assigned Date</th>
                          <th>Due Date</th>
                          <th>Marks</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAssignments.map((assignment) => (
                          <tr key={assignment.id} className={isOverdue(assignment.dueDate, assignment.status) ? 'table-danger' : ''}>
                            <td>
                              <strong>{assignment.title}</strong>
                              <br />
                              <small className="text-muted">{assignment.description}</small>
                            </td>
                            <td><Badge bg="secondary">{assignment.subject}</Badge></td>
                            <td>{new Date(assignment.assignedDate).toLocaleDateString()}</td>
                            <td>
                              <span className={isOverdue(assignment.dueDate, assignment.status) ? 'text-danger fw-bold' : ''}>
                                {new Date(assignment.dueDate).toLocaleDateString()}
                                {isOverdue(assignment.dueDate, assignment.status) && (
                                  <><br /><small className="text-danger">Overdue!</small></>
                                )}
                              </span>
                            </td>
                            <td>{assignment.totalMarks}</td>
                            <td>{getStatusBadge(assignment.status)}</td>
                            <td>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => {
                                  setSelectedAssignment(assignment);
                                  setShowSubmitModal(true);
                                }}
                              >
                                <i className="bi bi-upload me-1"></i>
                                Submit
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Tab>
                  <Tab eventKey="submitted" title={`Submitted (${assignments.filter(a => a.status === 'submitted').length})`}>
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Assignment</th>
                          <th>Subject</th>
                          <th>Submitted On</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAssignments.map((assignment) => (
                          <tr key={assignment.id}>
                            <td><strong>{assignment.title}</strong></td>
                            <td><Badge bg="secondary">{assignment.subject}</Badge></td>
                            <td>{new Date(assignment.submittedDate).toLocaleDateString()}</td>
                            <td>{getStatusBadge(assignment.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Tab>
                  <Tab eventKey="graded" title={`Graded (${assignments.filter(a => a.status === 'graded').length})`}>
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Assignment</th>
                          <th>Subject</th>
                          <th>Submitted On</th>
                          <th>Marks Obtained</th>
                          <th>Grade</th>
                          <th>Feedback</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAssignments.map((assignment) => (
                          <tr key={assignment.id}>
                            <td><strong>{assignment.title}</strong></td>
                            <td><Badge bg="secondary">{assignment.subject}</Badge></td>
                            <td>{new Date(assignment.submittedDate).toLocaleDateString()}</td>
                            <td>
                              <strong>{assignment.marksObtained}</strong> / {assignment.totalMarks}
                            </td>
                            <td>
                              {assignment.grade ? (
                                <Badge bg={assignment.grade.startsWith('A') ? 'success' : assignment.grade.startsWith('B') ? 'primary' : 'warning'}>
                                  {assignment.grade}
                                </Badge>
                              ) : (
                                <Badge bg="secondary">Not Graded</Badge>
                              )}
                            </td>
                            <td>{assignment.feedback}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Tab>
                </Tabs>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Submit Assignment Modal */}
      <Modal show={showSubmitModal} onHide={() => setShowSubmitModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Submit Assignment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAssignment && (
            <>
              <h5>{selectedAssignment.title}</h5>
              <p className="text-muted">{selectedAssignment.description}</p>
              <hr />
              
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Submission Text</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Type your submission here..."
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Upload File (Optional)</Form.Label>
                  <Form.Control
                    type="file"
                    onChange={(e: any) => setSubmissionFile(e.target.files[0])}
                  />
                  <Form.Text className="text-muted">
                    Accepted formats: PDF, DOC, DOCX, ZIP (Max 10MB)
                  </Form.Text>
                </Form.Group>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSubmitModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            <i className="bi bi-check-lg me-2"></i>
            Submit Assignment
          </Button>
        </Modal.Footer>
      </Modal>
    </Layout>
  );
};
