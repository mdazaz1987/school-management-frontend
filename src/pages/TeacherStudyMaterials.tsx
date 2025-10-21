import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Table, Badge, Button, Modal, Form, Alert } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { teacherService } from '../services/teacherService';
import { subjectService } from '../services/subjectService';

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

export const TeacherStudyMaterials: React.FC = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
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
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const [materials, setMaterials] = useState<any[]>([]);

  const filteredSubjects = useMemo(() => {
    if (!formData.classId) return subjects || [];
    try {
      const classObj = (classes || []).find((c: any) => c.id === formData.classId);
      const classSubjectIds: string[] = (classObj?.subjects || []) as any;
      return (subjects || []).filter((s: any) => {
        if (classSubjectIds && classSubjectIds.length > 0) return classSubjectIds.includes(s.id);
        const list = s.classIds || s.classIDs || s.classes || [];
        if (Array.isArray(list) && list.length > 0) return list.includes(formData.classId);
        return true; // no mapping -> global
      });
    } catch {
      return subjects || [];
    }
  }, [subjects, classes, formData.classId]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true); setError('');
    try {
      let cls: any[] = [];
      try {
        cls = await teacherService.getMyClasses();
      } catch { cls = []; }
      if ((!cls || cls.length === 0) && user?.schoolId) {
        try {
          const all = await (await import('../services/classService')).classService.getAllClasses({ schoolId: user.schoolId });
          cls = (all || []).filter((c: any) => c && (c as any).isActive !== false);
        } catch {}
      }
      const subs = user?.schoolId ? await subjectService.getAllSubjects({ schoolId: user.schoolId }) : [];
      setClasses(cls || []);
      setSubjects(subs || []);
      
      const list = await teacherService.getMyAssignments();
      const nameMap = new Map<string, string>((cls || []).map((c: any) => [c.id, (c.name || c.className || `${c.grade || 'Class'}${c.section ? ' - ' + c.section : ''}`)]));
      // Filter to PRESENTATION type only
      const filtered = (list || []).filter((a: any) => a.type === 'PRESENTATION');
      const normalized = filtered.map((a: any) => ({
        id: a.id,
        title: a.title,
        classId: a.classId,
        class: nameMap.get(a.classId) || a.className || a.classId,
        subject: a.subject || a.subjectName,
        dueDate: a.dueDate,
        status: a.isActive === false ? 'inactive' : 'active'
      }));
      setMaterials(normalized);
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
        maxMarks: 0,
        type: 'PRESENTATION',
        schoolId: user.schoolId,
        assignedDate: new Date().toISOString().split('T')[0],
      };
      const created = await teacherService.createAssignment(payload);
      if (attachmentFile && created?.id) {
        try {
          await teacherService.uploadAssignmentAttachment(created.id, attachmentFile);
        } catch (e: any) {
          const status = e?.response?.status;
          const msg = e?.response?.data?.message || e?.message || '';
          // If upload fails (e.g., 413), still keep the created material
          setSuccess('Study material shared successfully (attachment upload failed).');
          setError(status === 413 ? 'Attachment too large. Maximum allowed size is 10MB.' : (msg || 'Attachment upload failed'));
        }
      } else {
        setSuccess('Study material shared successfully.');
      }
      setShowModal(false);
      resetForm();
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to share study material');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (material: any) => {
    setEditingMaterial(material);
    setFormData({
      title: material.title,
      description: '',
      classId: material.classId || '',
      subject: material.subject,
      dueDate: material.dueDate,
    });
    setShowModal(true);
  };

  const handleUpdate = async () => {
    if (!user?.id || !editingMaterial || !user?.schoolId) return;
    try {
      setLoading(true); setError('');
      const payload: any = {
        title: formData.title,
        description: formData.description,
        classId: formData.classId,
        subject: formData.subject,
        dueDate: formData.dueDate,
        maxMarks: 0,
        type: 'PRESENTATION',
        schoolId: user.schoolId,
        assignedDate: new Date().toISOString().split('T')[0],
      };
      const updated = await teacherService.updateAssignment(editingMaterial.id, payload);
      if (attachmentFile && (editingMaterial?.id || updated?.id)) {
        const id = editingMaterial?.id || updated?.id;
        try {
          await teacherService.uploadAssignmentAttachment(id, attachmentFile);
        } catch (e: any) {
          const status = e?.response?.status;
          const msg = e?.response?.data?.message || e?.message || '';
          setSuccess('Study material updated (attachment upload failed).');
          setError(status === 413 ? 'Attachment too large. Maximum allowed size is 10MB.' : (msg || 'Attachment upload failed'));
        }
      } else {
        setSuccess('Study material updated successfully!');
      }
      setShowModal(false);
      setEditingMaterial(null);
      resetForm();
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to update study material');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this study material?')) return;
    try {
      setLoading(true); setError('');
      await teacherService.deleteAssignment(id);
      setSuccess('Study material deleted successfully!');
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to delete study material');
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
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
                <h2>Study Materials</h2>
                <p className="text-muted">Share notes, reference materials, and resources with your students</p>
              </div>
              <Button 
                variant="primary" 
                onClick={() => { setEditingMaterial(null); resetForm(); setShowModal(true); }}
              >
                <i className="bi bi-plus-lg me-2"></i>
                Share Material
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
                    <th>Shared On</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((material) => (
                    <tr key={material.id}>
                      <td><strong>{material.title}</strong></td>
                      <td>{material.class}</td>
                      <td><Badge bg="secondary">{material.subject}</Badge></td>
                      <td>{new Date(material.dueDate).toLocaleDateString()}</td>
                      <td><Badge bg="success">{material.status}</Badge></td>
                      <td>
                        <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEdit(material)}>
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(material.id)}>
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
              <Modal.Title>{editingMaterial ? 'Edit' : 'Share'} Study Material</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Chapter 5 Notes, Reference Material"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the material"
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

                <Form.Group className="mb-3">
                  <Form.Label>Available Until</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                  <Form.Text className="text-muted">Optional: Set when this material expires</Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Upload File *</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.txt,.zip"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const file = e.target.files && e.target.files[0];
                      if (file) {
                        const max = 10 * 1024 * 1024; // 10MB
                        if (file.size > max) {
                          setError('File is too large. Maximum allowed size is 10MB.');
                          e.currentTarget.value = '';
                          setAttachmentFile(null);
                          return;
                        }
                      }
                      setAttachmentFile(file || null);
                    }}
                  />
                  <Form.Text className="text-muted">Upload study material (PDF, DOC, PPT, images, etc.). Max 10MB.</Form.Text>
                </Form.Group>

                <Alert variant="info">
                  <i className="bi bi-info-circle me-2"></i>
                  Study materials are view-only for students. They cannot submit anything.
                </Alert>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button 
                  variant="primary" 
                  onClick={editingMaterial ? handleUpdate : handleCreate}
                  disabled={!formData.title || !formData.classId || !formData.subject}
                >
                  {editingMaterial ? 'Update' : 'Share'} Material
                </Button>
            </Modal.Footer>
          </Modal>
        </Col>
      </Row>
    </Layout>
  );
};
