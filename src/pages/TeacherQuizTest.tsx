import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Table, Badge, Button, Modal, Form, Alert } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { teacherService } from '../services/teacherService';
import { apiService } from '../services/api';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/teacher/my-classes', label: 'My Classes', icon: 'bi-door-open' },
  { path: '/teacher/assignments', label: 'Assignments', icon: 'bi-file-text' },
  { path: '/teacher/study-materials', label: 'Study Materials', icon: 'bi-book' },
  { path: '/teacher/quiz-test', label: 'Quiz & Tests', icon: 'bi-clipboard-check' },
  { path: '/teacher/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
  { path: '/teacher/grading', label: 'Grading', icon: 'bi-star' },
  { path: '/teacher/timetable', label: 'My Timetable', icon: 'bi-calendar3' },
  { path: '/teacher/students', label: 'Students', icon: 'bi-people' },
];

export const TeacherQuizTest: React.FC = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    subject: '',
    dueDate: '',
    totalMarks: 100,
    type: 'QUIZ'
  });

  const [items, setItems] = useState<any[]>([]);

  const filteredSubjects = useMemo(() => {
    if (!formData.classId) return subjects;
    try {
      const classObj = (classes || []).find((c: any) => c.id === formData.classId);
      const classLabel = classObj ? (classObj.name || `${classObj.className || classObj.grade || 'Class'}${classObj.section ? ' - ' + classObj.section : ''}`) : '';
      const tokens = [
        (classObj?.className || '').toString(),
        (classObj?.grade || '').toString(),
        (classObj?.section || '').toString(),
        classLabel.toString(),
      ]
      .filter(Boolean)
      .map((t) => String(t).toLowerCase());

      return (subjects || []).filter((s: any) => {
        const list = s.classIds || s.classIDs || s.classes || [];
        if (Array.isArray(list) && list.includes(formData.classId)) return true;
        const name = String(s.name || '').toLowerCase();
        const code = String(s.code || '').toLowerCase();
        return tokens.some((t) => t && (name.includes(t) || code.includes(t)));
      });
    } catch {
      return subjects;
    }
  }, [subjects, classes, formData.classId]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true); setError('');
    try {
      const [cls, subs] = await Promise.all([
        teacherService.getMyClasses(),
        teacherService.getMySubjects()
      ]);
      
      setClasses(cls);
      let finalSubjects = subs || [];
      if ((!finalSubjects || finalSubjects.length === 0) && user?.schoolId) {
        try {
          finalSubjects = await apiService.get<any[]>(`/subjects`, { schoolId: user.schoolId });
        } catch (e) {}
      }
      setSubjects(finalSubjects);
      
      const list = await teacherService.getMyAssignments();
      const nameMap = new Map<string, string>((cls || []).map((c: any) => [c.id, (c.name || c.className || `${c.grade || 'Class'}${c.section ? ' - ' + c.section : ''}`)]));
      // Filter to QUIZ and EXAM types only
      const filtered = (list || []).filter((a: any) => a.type === 'QUIZ' || a.type === 'EXAM');
      const normalized = filtered.map((a: any) => ({
        id: a.id,
        title: a.title,
        classId: a.classId,
        class: nameMap.get(a.classId) || a.className || a.classId,
        subject: a.subject || a.subjectName,
        dueDate: a.dueDate,
        totalMarks: a.maxMarks || a.totalMarks,
        type: a.type || 'QUIZ',
        submissions: a.submissionsCount || 0,
        totalStudents: a.totalStudents || 0,
        status: a.isActive === false ? 'inactive' : 'active'
      }));
      setItems(normalized);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load data');
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!formData.classId || filteredSubjects.length === 0) return;
    const valid = filteredSubjects.some((s: any) => (s.name || s.code) === formData.subject);
    if (!valid && formData.subject) {
      setFormData((prev) => ({ ...prev, subject: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.classId, filteredSubjects.length]);

  const handleCreate = async () => {
    if (!user?.id || !user?.schoolId) return;
    try {
      setLoading(true); setError('');
      const payload: any = {
        title: formData.title,
        description: formData.description,
        classId: formData.classId,
        subject: formData.subject,
        dueDate: formData.dueDate,
        maxMarks: formData.totalMarks,
        type: formData.type,
        schoolId: user.schoolId,
        assignedDate: new Date().toISOString().split('T')[0],
      };
      const created = await teacherService.createAssignment(payload);
      if (attachmentFile && created?.id) {
        await teacherService.uploadAssignmentAttachment(created.id, attachmentFile);
      }
      setSuccess(`${formData.type === 'QUIZ' ? 'Quiz' : 'Test'} created successfully.`);
      setShowModal(false);
      resetForm();
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message || `Failed to create ${formData.type === 'QUIZ' ? 'quiz' : 'test'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: '',
      classId: item.classId || '',
      subject: item.subject,
      dueDate: item.dueDate,
      totalMarks: item.totalMarks,
      type: item.type || 'QUIZ'
    });
    setShowModal(true);
  };

  const handleUpdate = async () => {
    if (!user?.id || !editingItem || !user?.schoolId) return;
    try {
      setLoading(true); setError('');
      const payload: any = {
        title: formData.title,
        description: formData.description,
        classId: formData.classId,
        subject: formData.subject,
        dueDate: formData.dueDate,
        maxMarks: formData.totalMarks,
        type: formData.type,
        schoolId: user.schoolId,
      };
      const updated = await teacherService.updateAssignment(editingItem.id, payload);
      if (attachmentFile && (editingItem?.id || updated?.id)) {
        const id = editingItem?.id || updated?.id;
        await teacherService.uploadAssignmentAttachment(id, attachmentFile);
      }
      setSuccess(`${formData.type === 'QUIZ' ? 'Quiz' : 'Test'} updated successfully!`);
      setShowModal(false);
      setEditingItem(null);
      resetForm();
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      setLoading(true); setError('');
      await teacherService.deleteAssignment(id);
      setSuccess('Item deleted successfully!');
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      classId: '',
      subject: '',
      dueDate: '',
      totalMarks: 100,
      type: 'QUIZ'
    });
    setAttachmentFile(null);
  };

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2>Quiz & Tests</h2>
                <p className="text-muted">Create and manage quizzes and tests for your classes</p>
              </div>
              <Button 
                variant="primary" 
                onClick={() => { setEditingItem(null); resetForm(); setShowModal(true); }}
              >
                <i className="bi bi-plus-lg me-2"></i>
                Create Quiz/Test
              </Button>
            </div>
          </div>

          {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}
          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Due Date</th>
                    <th>Marks</th>
                    <th>Submissions</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.title}</strong></td>
                      <td><Badge bg={item.type === 'QUIZ' ? 'info' : 'warning'}>{item.type === 'QUIZ' ? 'Quiz' : 'Test'}</Badge></td>
                      <td>{item.class}</td>
                      <td><Badge bg="secondary">{item.subject}</Badge></td>
                      <td>{new Date(item.dueDate).toLocaleDateString()}</td>
                      <td>{item.totalMarks}</td>
                      <td>
                        <span className="text-success">{item.submissions}</span> / {item.totalStudents}
                      </td>
                      <td><Badge bg="success">{item.status}</Badge></td>
                      <td>
                        <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEdit(item)}>
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(item.id)}>
                          <i className="bi bi-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>{editingItem ? 'Edit' : 'Create'} Quiz/Test</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Type *</Form.Label>
                  <Form.Select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="QUIZ">Short Quiz</option>
                    <option value="EXAM">Test / Exam</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Chapter 5 Quiz, Mid-term Test"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Instructions, topics covered, etc."
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Class/Section *</Form.Label>
                      <Form.Select
                        value={formData.classId}
                        onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                      >
                        <option value="">Select class...</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.className || `${c.grade || 'Class'}${c.section ? ' - ' + c.section : ''}`}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Subject *</Form.Label>
                      <Form.Select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        disabled={!formData.classId}
                      >
                        <option value="">{formData.classId ? 'Select subject...' : 'Select class first'}</option>
                        {(formData.classId ? filteredSubjects : []).map((s: any) => {
                          const key = s.id || s.code || s.name;
                          const value = s.name || s.code;
                          const label = [s.name, s.code].filter(Boolean).join(' ');
                          return (
                            <option key={key} value={value}>
                              {label}
                            </option>
                          );
                        })}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Due Date *</Form.Label>
                      <Form.Control
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Total Marks *</Form.Label>
                      <Form.Control
                        type="number"
                        value={formData.totalMarks}
                        onChange={(e) => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Question Paper (optional)</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const file = e.target.files && e.target.files[0];
                      setAttachmentFile(file || null);
                    }}
                  />
                  <Form.Text className="text-muted">Upload question paper or instructions. Max 10MB.</Form.Text>
                </Form.Group>

                <Alert variant="info">
                  <i className="bi bi-info-circle me-2"></i>
                  Students will be able to submit their answers and you can grade them.
                </Alert>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button 
                  variant="primary" 
                  onClick={editingItem ? handleUpdate : handleCreate}
                  disabled={!formData.title || !formData.classId || !formData.subject || !formData.dueDate}
                >
                  {editingItem ? 'Update' : 'Create'}
                </Button>
            </Modal.Footer>
          </Modal>
        </Col>
      </Row>
    </Layout>
  );
};
