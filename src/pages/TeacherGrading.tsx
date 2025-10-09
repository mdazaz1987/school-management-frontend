import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Button, Form, Modal, Badge, Alert } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { teacherService } from '../services/teacherService';
import { timetableService } from '../services/timetableService';
import { classService } from '../services/classService';
import { studentService } from '../services/studentService';

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
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [gradingStudent, setGradingStudent] = useState<any>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [gradeData, setGradeData] = useState({
    marksObtained: '',
    grade: '',
    feedback: ''
  });

  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [teacherAttachments, setTeacherAttachments] = useState<string[]>([]);
  const [submissionPreview, setSubmissionPreview] = useState<{ attachments: string[]; content?: string }>({ attachments: [], content: '' });

  useEffect(() => {
    const init = async () => {
      try {
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
        setClasses([...(base || []), ...fetchedMissing.filter(Boolean) as any[]]);
      } catch {}
      await loadAssignments();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadAssignments = async () => {
    setError('');
    try {
      const list = await teacherService.getMyAssignments();
      setAssignments(list || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load assignments');
    }
  };

  const loadSubmissions = async (assignmentId: string) => {
    if (!assignmentId) return;
    setError('');
    try {
      const list = await teacherService.getAssignmentSubmissions(assignmentId);
      const normalized = (list || []).map((s: any) => ({
        id: s.id,
        studentName: s.studentName || s.student?.name || s.studentId,
        rollNo: s.rollNo || s.student?.rollNumber || '-',
        status: (s.status || '').toLowerCase() === 'graded' ? 'graded' : (s.status || 'submitted'),
        marks: s.marksObtained ?? s.marks ?? null,
        grade: s.grade || null,
        attachments: s.attachments || [],
        content: s.content,
      }));
      setSubmissions(normalized);
      try { setTeacherAttachments(await studentService.listAssignmentAttachments(assignmentId)); } catch { setTeacherAttachments([]); }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load submissions');
    }
  };

  const handleGrade = (student: any) => {
    setGradingStudent(student);
    setGradeData({
      marksObtained: student.marks?.toString() || '',
      grade: student.grade || '',
      feedback: ''
    });
    setSubmissionPreview({ attachments: student.attachments || [], content: student.content });
    setShowModal(true);
  };

  const handleSubmitGrade = async () => {
    if (!selectedItem || !gradingStudent) return;
    try {
      await teacherService.gradeSubmission(gradingStudent.id, Number(gradeData.marksObtained), gradeData.feedback);
      await loadSubmissions(selectedItem);
      setSuccess(`Grade submitted for ${gradingStudent.studentName}.`);
      setShowModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to submit grade');
    }
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
                      {classes.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {(c.className || c.grade || c.name || 'Class') + (c.section ? ' - ' + c.section : '')}
                        </option>
                      ))}
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
                    <Form.Select value={selectedItem} onChange={async (e) => {
                      const id = e.target.value; setSelectedItem(id); if (id) await loadSubmissions(id);
                    }}>
                      <option value="">Select item...</option>
                      {(assignments || [])
                        .filter((a: any) => !selectedClass || a.classId === selectedClass)
                        .map((a: any) => (
                          <option key={a.id} value={a.id}>{a.title || a.name}</option>
                        ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {selectedItem && (
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Submissions</h5>
                <small className="text-muted">Grading</small>
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

                  {/* Submission preview */}
                  {(submissionPreview.content || (submissionPreview.attachments || []).length > 0) && (
                    <Card className="border-0 shadow-sm mb-3">
                      <Card.Header className="bg-white"><strong>Submission</strong></Card.Header>
                      <Card.Body>
                        {submissionPreview.content && (
                          <div className="mb-3">
                            <div className="text-muted mb-1">Text</div>
                            <div className="p-2 bg-light rounded" style={{ whiteSpace: 'pre-wrap' }}>{submissionPreview.content}</div>
                          </div>
                        )}
                        {(submissionPreview.attachments || []).length > 0 && (
                          <div>
                            <div className="text-muted mb-1">Attachments</div>
                            <ul className="mb-0">
                              {submissionPreview.attachments.map((f, idx) => (
                                <li key={idx}>
                                  {/^https?:\/\//i.test(String(f)) ? (
                                    <a href={String(f)} target="_blank" rel="noreferrer">
                                      <i className="bi bi-paperclip me-1"></i>{String(f)}
                                    </a>
                                  ) : (
                                    <Button variant="link" className="p-0" onClick={async () => {
                                      try {
                                        const blob = await teacherService.getSubmissionAttachmentBlob(selectedItem, gradingStudent.id, f);
                                        const url = window.URL.createObjectURL(blob);
                                        window.open(url, '_blank');
                                        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
                                      } catch {}
                                    }}>
                                      <i className="bi bi-paperclip me-1"></i>{String(f)}
                                    </Button>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </Card.Body>
                    </Card>
                  )}

                  {/* Teacher attachments */}
                  {(teacherAttachments || []).length > 0 && (
                    <Card className="border-0 shadow-sm mb-3">
                      <Card.Header className="bg-white"><strong>Assignment Attachments</strong></Card.Header>
                      <Card.Body>
                        <ul className="mb-0">
                          {teacherAttachments.map((f) => (
                            <li key={f}>
                              <Button variant="link" className="p-0" onClick={async () => {
                                try {
                                  const blob = await studentService.getAssignmentAttachmentBlob(selectedItem, f);
                                  const url = window.URL.createObjectURL(blob);
                                  window.open(url, '_blank');
                                  setTimeout(() => window.URL.revokeObjectURL(url), 10000);
                                } catch {}
                              }}>
                                <i className="bi bi-paperclip me-1"></i>{f}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      </Card.Body>
                    </Card>
                  )}

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
