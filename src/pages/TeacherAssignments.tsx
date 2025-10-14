import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Table, Badge, Button, Modal, Form, Alert } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { teacherService } from '../services/teacherService';
import { subjectService } from '../services/subjectService';
import { classService } from '../services/classService';

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

export const TeacherAssignments: React.FC = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
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
    type: 'HOMEWORK'
  });

  const [assignments, setAssignments] = useState<any[]>([]);

  // Subjects filtered by selected class
  const filteredSubjects = useMemo(() => {
    if (!formData.classId) return subjects || [];
    try {
      // If class has an explicit subjects list, prefer that
      const classObj = (classes || []).find((c: any) => c.id === formData.classId);
      const classSubjectIds: string[] = (classObj?.subjects || []) as any;
      return (subjects || []).filter((s: any) => {
        if (classSubjectIds && classSubjectIds.length > 0) return classSubjectIds.includes(s.id);
        const list = s.classIds || s.classIDs || s.classes || [];
        if (Array.isArray(list) && list.length > 0) return list.includes(formData.classId);
        return true; // global
      });
    } catch {
      return subjects || [];
    }
  }, [subjects, classes, formData.classId]);

  useEffect(() => {
    loadClassesAndAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadClassesAndAssignments = async () => {
    setLoading(true); setError('');
    try {
      // Load teacher's assigned classes and subjects
      let cls: any[] = [];
      try {
        cls = await teacherService.getMyClasses();
      } catch {
        cls = [];
      }
      if ((!cls || cls.length === 0) && user?.schoolId) {
        try {
          const all = await classService.getAllClasses({ schoolId: user.schoolId });
          cls = (all || []).filter((c: any) => c && (c as any).isActive !== false);
        } catch {}
      }
      const subs = user?.schoolId ? await subjectService.getAllSubjects({ schoolId: user.schoolId }) : [];

      setClasses(cls || []);
      setSubjects(subs || []);
      
      // Load assignments via session-based endpoint (filter to HOMEWORK and PROJECT only)
      const list = await teacherService.getMyAssignments();
      const filtered = (list || []).filter((a: any) => a.type === 'HOMEWORK' || a.type === 'PROJECT' || !a.type);
      const nameMap = new Map<string, string>((cls || []).map((c: any) => [c.id, (c.name || c.className || `${c.grade || 'Class'}${c.section ? ' - ' + c.section : ''}`)]));
      const normalized = (filtered || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        classId: a.classId,
        class: nameMap.get(a.classId) || a.className || a.classId,
        subject: a.subject || a.subjectName,
        dueDate: a.dueDate,
        totalMarks: a.maxMarks || a.totalMarks,
        type: a.type || 'HOMEWORK',
        submissions: a.submissionsCount || 0,
        totalStudents: a.totalStudents || 0,
        status: a.isActive === false ? 'inactive' : 'active'
      }));
      setAssignments(normalized);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load data');
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Reset subject selection when class changes and current subject isn't valid for the class
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
        type: formData.type || 'HOMEWORK',
        schoolId: user.schoolId,
        assignedDate: new Date().toISOString().split('T')[0],
      };
      const created = await teacherService.createAssignment(payload);
      // Optional attachment upload
      if (attachmentFile && created?.id) {
        await teacherService.uploadAssignmentAttachment(created.id, attachmentFile);
      }
      setSuccess('Assignment created successfully.');
      setShowModal(false);
      resetForm();
      await loadClassesAndAssignments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (assignment: any) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: '',
      classId: assignment.classId || '',
      subject: assignment.subject,
      dueDate: assignment.dueDate,
      totalMarks: assignment.totalMarks,
      type: assignment.type || 'HOMEWORK'
    });
    setShowModal(true);
  };

  const handleUpdate = async () => {
    if (!user?.id || !editingAssignment || !user?.schoolId) return;
    try {
      setLoading(true); setError('');
      const payload: any = {
        title: formData.title,
        description: formData.description,
        classId: formData.classId,
        subject: formData.subject,
        dueDate: formData.dueDate,
        maxMarks: formData.totalMarks,
        type: formData.type || 'HOMEWORK',
        schoolId: user.schoolId,
      };
      const updated = await teacherService.updateAssignment(editingAssignment.id, payload);
      if (attachmentFile && (editingAssignment?.id || updated?.id)) {
        const id = editingAssignment?.id || updated?.id;
        await teacherService.uploadAssignmentAttachment(id, attachmentFile);
      }
      setSuccess('Assignment updated successfully!');
      setShowModal(false);
      setEditingAssignment(null);
      resetForm();
      await loadClassesAndAssignments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to update assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      setLoading(true); setError('');
      await teacherService.deleteAssignment(id);
      setSuccess('Assignment deleted successfully!');
      await loadClassesAndAssignments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to delete assignment');
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
      type: 'HOMEWORK'
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
                <h2>Assignments</h2>
                <p className="text-muted">Create and manage homework and projects</p>
              </div>
              <Button 
                variant="primary" 
                onClick={() => { setEditingAssignment(null); resetForm(); setShowModal(true); }}
              >
                <i className="bi bi-plus-lg me-2"></i>
                Create Assignment
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
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Due Date</th>
                    <th>Submissions</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td><strong>{assignment.title}</strong></td>
                      <td>{assignment.class}</td>
                      <td><Badge bg="secondary">{assignment.subject}</Badge></td>
                      <td>{new Date(assignment.dueDate).toLocaleDateString()}</td>
                      <td>
                        <span className="text-success">{assignment.submissions}</span> / {assignment.totalStudents}
                      </td>
                      <td><Badge bg="success">{assignment.status}</Badge></td>
                      <td>
                        <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEdit(assignment)}>
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(assignment.id)}>
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
              <Modal.Title>{editingAssignment ? 'Edit' : 'Create'} Assignment</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                          const key = s.id || s.name;
                          const value = s.name || '';
                          const label = s.name || value || 'Subject';
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

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Type *</Form.Label>
                      <Form.Select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      >
                        <option value="HOMEWORK">Homework / Assignment</option>
                        <option value="PROJECT">Project</option>
                        <option value="PRACTICAL">Practical</option>
                        <option value="RESEARCH">Research</option>
                      </Form.Select>
                      <Form.Text className="text-muted">For quizzes/tests, use Quiz & Tests page. For study materials, use Study Materials page.</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Attachment (optional)</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const file = e.target.files && e.target.files[0];
                      setAttachmentFile(file || null);
                    }}
                  />
                  <Form.Text className="text-muted">Upload question sheet or related material. Max 5-10MB recommended.</Form.Text>
                </Form.Group>

                <Alert variant="info">
                  <i className="bi bi-info-circle me-2"></i>
                  All students in the selected class will receive a notification about this assignment.
                </Alert>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button 
                  variant="primary" 
                  onClick={editingAssignment ? handleUpdate : handleCreate}
                  disabled={!formData.title || !formData.classId || !formData.subject || !formData.dueDate}
                >
                  {editingAssignment ? 'Update' : 'Create'} Assignment
                </Button>
            </Modal.Footer>
          </Modal>
        </Col>
      </Row>
    </Layout>
  );
};
