import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { Subject } from '../types';
import { subjectService } from '../services/subjectService';

export const SubjectForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState<Partial<Subject>>({
    name: '',
    code: '',
    description: '',
    schoolId: user?.schoolId || '',
    type: 'CORE',
    category: '',
    credits: 0,
    totalHours: 0,
    isActive: true,
  });

  const isEdit = Boolean(id);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError('');
        const subj = await subjectService.getById(id);
        setForm(subj);
      } catch (e: any) {
        setError(e.response?.data?.message || 'Failed to load subject');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (key: keyof Subject, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const payload: Partial<Subject> = {
        name: form.name?.trim() || '',
        code: form.code?.trim() || '',
        description: form.description || '',
        schoolId: form.schoolId || user?.schoolId || '',
        type: form.type || 'CORE',
        category: form.category || undefined,
        credits: form.credits ?? 0,
        totalHours: form.totalHours ?? undefined,
        isActive: form.isActive ?? true,
      };
      if (isEdit && id) {
        await subjectService.update(id, payload);
        setSuccess('Subject updated successfully');
      } else {
        await subjectService.create(payload);
        setSuccess('Subject created successfully');
      }
      setTimeout(() => navigate('/subjects'), 800);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save subject');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <Container className="py-4">
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2>{isEdit ? 'Edit Subject' : 'New Subject'}</h2>
                <p className="text-muted">{isEdit ? 'Update subject details' : 'Create a new subject'}</p>
              </div>
              <div>
                <Button variant="secondary" onClick={() => navigate('/subjects')}>
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
                <p className="mt-3">Loading subject...</p>
              </div>
            ) : (
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>Name</Form.Label>
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
                      <Form.Label>Code</Form.Label>
                      <Form.Control
                        type="text"
                        value={form.code || ''}
                        onChange={(e) => handleChange('code', e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>Type</Form.Label>
                      <Form.Select
                        value={form.type as any}
                        onChange={(e) => handleChange('type', e.target.value as any)}
                        required
                      >
                        <option value="CORE">CORE</option>
                        <option value="ELECTIVE">ELECTIVE</option>
                        <option value="OPTIONAL">OPTIONAL</option>
                        <option value="CO_CURRICULAR">CO_CURRICULAR</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>Credits</Form.Label>
                      <Form.Control
                        type="number"
                        value={form.credits ?? 0}
                        onChange={(e) => handleChange('credits', parseInt(e.target.value || '0', 10))}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>Category (optional)</Form.Label>
                      <Form.Control
                        type="text"
                        value={form.category || ''}
                        onChange={(e) => handleChange('category', e.target.value)}
                        placeholder="e.g., Science, Language"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>Total Hours (optional)</Form.Label>
                      <Form.Control
                        type="number"
                        value={form.totalHours ?? 0}
                        onChange={(e) => handleChange('totalHours', parseInt(e.target.value || '0', 10))}
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

                <Row>
                  <Col md={6} className="mb-3">
                    <Form.Check
                      type="switch"
                      id="subject-active"
                      label="Active"
                      checked={!!form.isActive}
                      onChange={(e) => handleChange('isActive', e.target.checked)}
                    />
                  </Col>
                </Row>

                <div className="d-flex gap-2">
                  <Button type="submit" variant="primary" disabled={saving}>
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
                  <Button variant="outline-secondary" type="button" onClick={() => navigate('/subjects')} disabled={saving}>
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
