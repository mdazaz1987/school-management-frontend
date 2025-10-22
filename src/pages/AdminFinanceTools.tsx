import React, { useState } from 'react';
import { Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { feeService } from '../services/feeService';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/fees', label: 'Fees', icon: 'bi-cash-coin' },
  { path: '/admin/tools/finance', label: 'Finance Tools', icon: 'bi-tools' },
  { path: '/admin/tools/notifications', label: 'Notification Tools', icon: 'bi-bell' },
];

export const AdminFinanceTools: React.FC = () => {
  const [form, setForm] = useState({
    studentId: '',
    schoolId: '',
    classId: '',
    academicYear: '',
    term: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreateAdmission = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      await feeService.createAdmissionFee(form);
      setSuccess('Admission fee created successfully.');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to create admission fee');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const resp = await feeService.seedForStudent(form);
      setSuccess(`Seeded ${resp.created} sample fee records.`);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to seed fees');
    } finally {
      setLoading(false);
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
            <h2>Admin Finance Tools</h2>
            <p className="text-muted">Create admission fees and seed sample fee records for testing</p>
          </div>

          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Student ID</Form.Label>
                    <Form.Control name="studentId" value={form.studentId} onChange={onChange} placeholder="studentId" />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>School ID</Form.Label>
                    <Form.Control name="schoolId" value={form.schoolId} onChange={onChange} placeholder="schoolId" />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Class ID</Form.Label>
                    <Form.Control name="classId" value={form.classId} onChange={onChange} placeholder="classId" />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Academic Year</Form.Label>
                    <Form.Control name="academicYear" value={form.academicYear} onChange={onChange} placeholder="2025-2026" />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Term</Form.Label>
                    <Form.Control name="term" value={form.term} onChange={onChange} placeholder="Term 1" />
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex gap-2">
                <Button onClick={handleCreateAdmission} disabled={loading || !form.studentId || !form.schoolId || !form.classId || !form.academicYear || !form.term}>
                  <i className="bi bi-plus-circle me-2"></i>
                  Create Admission Fee
                </Button>
                <Button variant="secondary" onClick={handleSeed} disabled={loading || !form.studentId || !form.schoolId || !form.classId || !form.academicYear || !form.term}>
                  <i className="bi bi-seedling me-2"></i>
                  Seed Sample Fees
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Layout>
  );
};
