import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Badge, Button, Alert, Spinner, Modal } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { studentService } from '../services/studentService';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/student/assignments', label: 'Assignments', icon: 'bi-file-text' },
  { path: '/student/study-materials', label: 'Study Materials', icon: 'bi-book' },
  { path: '/student/quizzes', label: 'Quizzes & Tests', icon: 'bi-clipboard-check' },
  { path: '/student/exams', label: 'Exams & Results', icon: 'bi-clipboard2-data' },
  { path: '/student/attendance', label: 'My Attendance', icon: 'bi-calendar-check' },
  { path: '/student/timetable', label: 'Timetable', icon: 'bi-calendar3' },
  { path: '/student/fees', label: 'Fee Payment', icon: 'bi-cash-coin' },
  { path: '/student/notifications', label: 'Notifications', icon: 'bi-bell' },
];

export const StudentStudyMaterials: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [materials, setMaterials] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadMaterials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const loadMaterials = async () => {
    if (!user?.email) return;
    setLoading(true); setError('');
    try {
      const student = await studentService.getStudentByEmail(user.email);
      const studentId = (student as any).id;
      const classId = (student as any).classId;
      const section = (student as any).section;
      const list = await studentService.getMyAssignments().catch(async () => {
        // Fallback to class assignments endpoint used elsewhere
        return await (await import('../services/api')).default.get<any[]>(`/students/${studentId}/assignments`, { classId, section });
      });
      const materialsOnly = (list || []).filter((a: any) => String(a.type || '').toUpperCase() === 'PRESENTATION');
      const normalized = materialsOnly.map((a: any) => ({
        id: a.id,
        title: a.title || a.name || 'Study Material',
        subject: a.subjectName || a.subject || 'Subject',
        assignedDate: a.assignedDate || a.createdAt,
        dueDate: a.dueDate,
      }));
      setMaterials(normalized);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load study materials');
    } finally {
      setLoading(false);
    }
  };

  const openAttachments = async (m: any) => {
    setSelected(m);
    setShowModal(true);
    try {
      const list = await studentService.listAssignmentAttachments(m.id);
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
      console.error('Download failed', e);
    }
  };

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>Study Materials</h2>
            <p className="text-muted">View and download study materials shared by your teachers</p>
          </div>

          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" /></div>
          ) : (
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Subject</th>
                      <th>Shared On</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((m) => (
                      <tr key={m.id}>
                        <td><strong>{m.title}</strong></td>
                        <td><Badge bg="secondary">{m.subject}</Badge></td>
                        <td>{m.assignedDate ? new Date(m.assignedDate).toLocaleDateString() : '-'}</td>
                        <td>
                          <Button size="sm" variant="outline-secondary" onClick={() => openAttachments(m)}>
                            <i className="bi bi-paperclip me-1"></i>
                            View attachments
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
              <Modal.Title>Attachments {selected ? `• ${selected.title}` : ''}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {attachments.length === 0 ? (
                <div className="text-muted">No attachments available.</div>
              ) : (
                <ul>
                  {attachments.map((f) => (
                    <li key={f}>
                      <Button variant="link" className="p-0" onClick={() => downloadAttachment(selected.id, f)}>
                        <i className="bi bi-paperclip me-1"></i>{f}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
            </Modal.Footer>
          </Modal>
        </Col>
      </Row>
    </Layout>
  );
};
