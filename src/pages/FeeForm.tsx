import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { Fee, Student } from '../types';
import { feeService } from '../services/feeService';
import { studentService } from '../services/studentService';

export const FeeForm: React.FC = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [students, setStudents] = useState<Student[]>([]);

  const [form, setForm] = useState<Partial<Fee>>({
    schoolId: user?.schoolId || '',
    studentId: '',
    feeType: '',
    amount: 0,
    discountAmount: 0,
    discountReason: '',
    netAmount: 0,
    status: 'PENDING',
    dueDate: '',
    term: '',
    academicYear: new Date().getFullYear().toString(),
  });

  const studentOptions = useMemo(() => {
    return students.map((s) => ({
      id: s.id,
      label: `${s.firstName} ${s.lastName}${s.admissionNumber ? ` (${s.admissionNumber})` : ''}`,
    }));
  }, [students]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const stuList = user?.schoolId ? await studentService.getStudentsBySchool(user.schoolId) : [];
        setStudents(stuList);
        if (isEdit && id) {
          const fee = await feeService.getById(id);
          setForm(fee);
        }
      } catch (e: any) {
        setError(e.response?.data?.message || 'Failed to load fee');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit, user?.schoolId]);

  const handleChange = (key: keyof Fee, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const payload: Partial<Fee> = {
        schoolId: form.schoolId || user?.schoolId || '',
        studentId: form.studentId || '',
        feeType: form.feeType || '',
        amount: Number(form.amount ?? 0),
        discountAmount: Number(form.discountAmount ?? 0),
        discountReason: form.discountReason || '',
        dueDate: form.dueDate || '',
        term: form.term || '',
        academicYear: form.academicYear || '',
        status: form.status,
      };
      if (isEdit && id) {
        await feeService.update(id, payload);
        setSuccess('Fee updated successfully');
      } else {
        await feeService.create(payload);
        setSuccess('Fee created successfully');
      }
      setTimeout(() => navigate('/fees'), 800);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save fee');
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
                <h2>{isEdit ? 'Edit Fee' : 'New Fee'}</h2>
                <p className="text-muted">{isEdit ? 'Update fee details' : 'Create a new fee'}</p>
              </div>
              <div>
                <Button variant="secondary" onClick={() => navigate('/fees')}>Back to List</Button>
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
                      <Form.Label>Student</Form.Label>
                      <Form.Select
                        value={form.studentId || ''}
                        onChange={(e) => handleChange('studentId', e.target.value)}
                        required
                      >
                        <option value="">Select Student</option>
                        {studentOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mb-3">
                    <Form.Group>
                      <Form.Label>Fee Type</Form.Label>
                      <Form.Control
                        type="text"
                        value={form.feeType || ''}
                        onChange={(e) => handleChange('feeType', e.target.value)}
                        placeholder="e.g., Tuition, Transport"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label>Amount</Form.Label>
                      <Form.Control
                        type="number"
                        value={form.amount ?? 0}
                        onChange={(e) => handleChange('amount', parseFloat(e.target.value || '0'))}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label>Discount</Form.Label>
                      <Form.Control
                        type="number"
                        value={form.discountAmount ?? 0}
                        onChange={(e) => handleChange('discountAmount', parseFloat(e.target.value || '0'))}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label>Due Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={form.dueDate || ''}
                        onChange={(e) => handleChange('dueDate', e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label>Term</Form.Label>
                      <Form.Control
                        type="text"
                        value={form.term || ''}
                        onChange={(e) => handleChange('term', e.target.value)}
                        placeholder="e.g., Term 1"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4} className="mb-3">
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
                  <Col md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label>Status</Form.Label>
                      <Form.Select
                        value={form.status as any}
                        onChange={(e) => handleChange('status', e.target.value as any)}
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="PAID">PAID</option>
                        <option value="OVERDUE">OVERDUE</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={12} className="mb-3">
                    <Form.Group>
                      <Form.Label>Discount Reason</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={form.discountReason || ''}
                        onChange={(e) => handleChange('discountReason', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {isEdit && (
                  <div className="mb-3">
                    <Badge bg={form.status === 'PAID' ? 'success' : form.status === 'OVERDUE' ? 'danger' : 'warning'}>
                      {form.status}
                    </Badge>
                  </div>
                )}

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
                  <Button variant="outline-secondary" type="button" onClick={() => navigate('/fees')} disabled={saving}>
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
