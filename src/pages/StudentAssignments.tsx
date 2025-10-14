import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Button, Modal, Form, Alert, Spinner, Tabs, Tab } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { studentService } from '../services/studentService';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/student/assignments', label: 'Assignments', icon: 'bi-file-text' },
  { path: '/student/quizzes', label: 'Quizzes & Tests', icon: 'bi-clipboard-check' },
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
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [viewOnly, setViewOnly] = useState(false);

  useEffect(() => {
    loadAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const loadAssignments = async () => {
    if (!user?.email) return;
    setLoading(true);
    setError('');
    try {
      // Resolve student by email to get studentId/class/section
      const student = await studentService.getStudentByEmail(user.email);
      const studentId = (student as any).id;
      const classId = (student as any).classId;
      const section = (student as any).section;

      // Fetch assignments and submissions
      const [assignmentsData, submissionsData] = await Promise.all([
        apiService.get<any[]>(`/students/${studentId}/assignments`, { classId, section }),
        apiService.get<any[]>(`/students/${studentId}/assignments/submissions`),
      ]);

      // Index submissions by assignmentId
      const subMap: Record<string, any> = {};
      (submissionsData || []).forEach((s: any) => {
        subMap[s.assignmentId] = s;
      });

      const normalized = (assignmentsData || []).map((a: any) => {
        const sub = subMap[a.id];
        let status = 'pending';
        if (sub) {
          if (sub.status === 'GRADED') status = 'graded';
          else status = 'submitted';
        }
        return {
          id: a.id,
          title: a.title,
          subject: a.subjectName || a.subject || 'Subject',
          description: a.description,
          dueDate: a.dueDate,
          assignedDate: a.assignedDate,
          totalMarks: a.maxMarks || a.totalMarks,
          submittedDate: sub?.submittedAt,
          grade: sub?.grade,
          marksObtained: sub?.marksObtained,
          feedback: sub?.feedback,
          status, // include computed status so tabs filter works
          type: a.type || 'HOMEWORK',
        };
      });

      setAssignments(normalized);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const openSubmitModal = async (assignment: any) => {
    setSelectedAssignment(assignment);
    setShowSubmitModal(true);
    setViewOnly((assignment?.type || '') === 'PRESENTATION');
    try {
      const list = await studentService.listAssignmentAttachments(assignment.id);
      setAttachments(list || []);
    } catch {
      setAttachments([]);
    }
  };

  const downloadAttachment = async (assignmentId: string, filename: string) => {
    try {
      const blob = await studentService.getAssignmentAttachmentBlob(assignmentId, filename);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download attachment', e);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAssignment || !user?.email) return;
    try {
      const student = await studentService.getStudentByEmail(user.email);
      const studentId = (student as any).id;
      const created = await apiService.post<any>(`/students/${studentId}/assignments/${selectedAssignment.id}/submit`, {
        content: submissionText,
        attachments: [] as string[],
      });
      // If a file is selected, upload it to the new submission attachments endpoint
      const submissionId: string | undefined = (created as any)?.id;
      if (submissionFile && submissionId) {
        const form = new FormData();
        form.append('file', submissionFile);
        const axios = apiService.getAxiosInstance();
        await axios.post(`/assignments/${selectedAssignment.id}/submissions/${submissionId}/attachments` as any, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setShowSubmitModal(false);
      setSubmissionText('');
      setSubmissionFile(null);
      loadAssignments();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to submit assignment');
    }
  };

  // Tabs filtering
  const filteredAssignments = assignments.filter(a => {
    const isQuiz = a.type === 'QUIZ' || a.type === 'EXAM';
    if (activeTab === 'pending') {
      // Do not show pending quizzes/tests here; they are handled in StudentQuizzes page
      if (isQuiz) return false;
      return a.status === 'pending';
    }
    if (activeTab === 'submitted') {
      // Show both assignment submissions and quiz/test submissions
      return a.status === 'submitted';
    }
    if (activeTab === 'graded') {
      return a.status === 'graded';
    }
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
                            <td className="d-flex gap-2">
                              <Button
                                size="sm"
                                variant="outline-secondary"
                                onClick={() => openSubmitModal(assignment)}
                                title={(assignment?.type || '') === 'PRESENTATION' ? 'View study materials' : 'View attachments'}
                              >
                                <i className="bi bi-paperclip me-1"></i>
                                {(assignment?.type || '') === 'PRESENTATION' ? 'View materials' : 'View attachments'}
                              </Button>
                              {(assignment?.type || '') !== 'PRESENTATION' && (
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => openSubmitModal(assignment)}
                                >
                                  <i className="bi bi-upload me-1"></i>
                                  Submit
                                </Button>
                              )}
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
                            <td>{assignment.submittedDate ? new Date(assignment.submittedDate).toLocaleDateString() : '-'}</td>
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
                            <td>{assignment.submittedDate ? new Date(assignment.submittedDate).toLocaleDateString() : '-'}</td>
                            <td>
                              <strong>{assignment.marksObtained ?? '-'}</strong> / {assignment.totalMarks}
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
                            <td>{assignment.feedback || '-'}</td>
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
              {attachments.length > 0 && (
                <div className="mb-3">
                  <strong>{(selectedAssignment?.type || '') === 'PRESENTATION' ? 'Study materials:' : 'Attachments from teacher:'}</strong>
                  <ul className="mt-2">
                    {attachments.map((f) => (
                      <li key={f}>
                        <Button variant="link" className="p-0" onClick={() => downloadAttachment(selectedAssignment.id, f)}>
                          <i className="bi bi-paperclip me-1"></i>{f}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <hr />
              {viewOnly ? (
                <Alert variant="info" className="mb-0">
                  This is study material shared by your teacher. No submission is required.
                </Alert>
              ) : (
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
                      onChange={(e: any) => setSubmissionFile(e.target.files?.[0] || null)}
                    />
                    {submissionFile && (
                      <div className="small text-muted mt-1">Selected: {submissionFile.name}</div>
                    )}
                    <Form.Text className="text-muted">
                      Accepted formats: PDF, DOC, DOCX, ZIP (Max 10MB)
                    </Form.Text>
                  </Form.Group>
                </Form>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSubmitModal(false)}>
            Cancel
          </Button>
          {!viewOnly && (
            <Button variant="primary" onClick={handleSubmit}>
              <i className="bi bi-check-lg me-2"></i>
              Submit Assignment
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Layout>
  );
};
