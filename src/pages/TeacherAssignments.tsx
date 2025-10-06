import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Badge, Button, Modal, Form, Alert } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { teacherService } from '../services/teacherService';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/teacher/my-classes', label: 'My Classes', icon: 'bi-door-open' },
  { path: '/teacher/assignments', label: 'Assignments', icon: 'bi-file-text' },
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
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    subject: '',
    dueDate: '',
    totalMarks: 100
  });

  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    loadClassesAndAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadClassesAndAssignments = async () => {
    setLoading(true); setError('');
    try {
      // Load teacher's assigned classes and subjects
      const [cls, subs] = await Promise.all([
        teacherService.getMyClasses(),
        teacherService.getMySubjects()
      ]);
      
      setClasses(cls);
      setSubjects(subs);
      
      // Load assignments via session-based endpoint
      const list = await teacherService.getMyAssignments();
      const normalized = (list || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        classId: a.classId,
        class: a.className || a.classId,
        subject: a.subject || a.subjectName,
        dueDate: a.dueDate,
        totalMarks: a.maxMarks || a.totalMarks,
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
        schoolId: user.schoolId,
        assignedDate: new Date().toISOString().split('T')[0],
      };
      const created = await teacherService.createAssignment(payload);
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
      totalMarks: assignment.totalMarks
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
        schoolId: user.schoolId,
      };
      await teacherService.updateAssignment(editingAssignment.id, payload);
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
      totalMarks: 100
    });
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
                <p className="text-muted">Create and manage assignments</p>
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
                      >
                        <option value="">Select subject...</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.name}>
                            {s.name} ({s.code})
                          </option>
                        ))}
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
