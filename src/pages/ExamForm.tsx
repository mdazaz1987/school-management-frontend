import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { Exam, SchoolClass, Subject } from '../types';
import { examService } from '../services/examService';
import { classService } from '../services/classService';
import { subjectService } from '../services/subjectService';

export const ExamForm: React.FC = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [form, setForm] = useState<Partial<Exam>>({
    name: '',
    description: '',
    schoolId: user?.schoolId || '',
    classId: '',
    subjectId: '',
    examDate: '',
    startTime: '',
    endTime: '',
    totalMarks: 100,
    passingMarks: 35,
    academicYear: new Date().getFullYear().toString(),
    term: 'Term 1',
    isPublished: false,
  });

  const subjectsForClass = useMemo(() => {
    if (!form.classId) return subjects;
    // If subject has classIds, filter by selected class; otherwise keep
    return subjects.filter((s: any) => !s.classIds || (Array.isArray(s.classIds) && s.classIds.includes(form.classId!)));
  }, [subjects, form.classId]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [cls, subs] = await Promise.all([
          classService.getAllClasses({ schoolId: user?.schoolId || '' }),
          subjectService.getAllSubjects({ schoolId: user?.schoolId || '' }),
        ]);
        setClasses(cls);
        setSubjects(subs);
        if (isEdit && id) {
          const ex = await examService.getById(id);
          setForm({
            ...ex,
            examDate: ex.examDate ? String(ex.examDate).substring(0, 10) : '',
          });
        }
      } catch (e: any) {
        setError(e.response?.data?.message || 'Failed to load exam data');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit, user?.schoolId]);

  const handleChange = (key: keyof Exam, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const payload: Partial<Exam> = {
        name: form.name?.trim() || '',
        description: form.description || '',
        schoolId: form.schoolId || user?.schoolId || '',
        classId: form.classId || '',
        subjectId: form.subjectId || '',
        examDate: form.examDate || '',
        startTime: form.startTime || '',
        endTime: form.endTime || '',
        totalMarks: Number(form.totalMarks ?? 0),
        passingMarks: Number(form.passingMarks ?? 0),
        academicYear: form.academicYear || '',
        term: form.term || '',
      };
      if (isEdit && id) {
        await examService.update(id, payload);
        setSuccess('Exam updated successfully');
      } else {
        await examService.create(payload);
        setSuccess('Exam created successfully');
      }
      setTimeout(() => navigate('/exams'), 700);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save exam');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!isEdit || !id) return;
    try {
      await examService.publishResults(id);
      setSuccess('Results published');
      setForm((prev) => ({ ...prev, isPublished: true }));
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to publish results');
    }
  };

  return (
    <Layout>
      <Container className="py-4">
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2>{isEdit ? 'Edit Exam' : 'New Exam'}</h2>
                <p className="text-muted">{isEdit ? 'Update exam details' : 'Create a new exam'}</p>
              </div>
              <div className="d-flex gap-2">
                {isEdit && (
                  <Button variant="outline-success" onClick={handlePublish} disabled={!!form.isPublished}>
                    <i className="bi bi-megaphone me-2"></i>
                    {form.isPublished ? 'Published' : 'Publish Results'}
                  </Button>
                )}
                <Button variant="secondary" onClick={() => navigate('/exams')}>
                  Back to List
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Card className="border-0 shadow-sm">
          <Card.Body>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading...</p>
              </div>
            ) : (
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>Exam Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={form.name || ''}
                        onChange={(e) => handleChange('name', e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>Academic Year</Form.Label>
                      <Form.Control
                        type="text"
                        value={form.academicYear || ''}
                        onChange={(e) => handleChange('academicYear', e.target.value)}
                        placeholder="e.g., 2025-2026"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>Class</Form.Label>
                      <Form.Select
                        value={form.classId || ''}
                        onChange={(e) => handleChange('classId', e.target.value)}
                        required
                      >
                        <option value="">Select Class</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name || c.className} {c.section ? `(${c.section})` : ''}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>Subject</Form.Label>
                      <Form.Select
                        value={form.subjectId || ''}
                        onChange={(e) => handleChange('subjectId', e.target.value)}
                        required
                      >
                        <option value="">Select Subject</option>
                        {subjectsForClass.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label>Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={form.examDate || ''}
                        onChange={(e) => handleChange('examDate', e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label>Start Time</Form.Label>
                      <Form.Control
                        type="time"
                        value={form.startTime || ''}
                        onChange={(e) => handleChange('startTime', e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label>End Time</Form.Label>
                      <Form.Control
                        type="time"
                        value={form.endTime || ''}
                        onChange={(e) => handleChange('endTime', e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>Total Marks</Form.Label>
                      <Form.Control
                        type="number"
                        value={form.totalMarks ?? 0}
                        onChange={(e) => handleChange('totalMarks', parseInt(e.target.value || '0', 10))}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>Passing Marks</Form.Label>
                      <Form.Control
                        type="number"
                        value={form.passingMarks ?? 0}
                        onChange={(e) => handleChange('passingMarks', parseInt(e.target.value || '0', 10))}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={12} className="mb-3">
                    <Form.Group>
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        value={form.description || ''}
                        onChange={(e) => handleChange('description', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {isEdit && (
                  <div className="mb-3">
                    <Badge bg={form.isPublished ? 'success' : 'secondary'}>
                      {form.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                )}

                <div className="d-flex gap-2">
                  <Button variant="primary" type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Spinner size="sm" animation="border" className="me-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-2"></i>
                        Save
                      </>
                    )}
                  </Button>
                  <Button variant="outline-secondary" type="button" onClick={() => navigate('/exams')} disabled={saving}>
                    Cancel
                  </Button>
                </div>
              </Form>
            )}
          </Card.Body>
        </Card>
      </Container>
    </Layout>
  );
};
