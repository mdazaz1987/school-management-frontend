import React, { useState } from 'react';
import { Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { notificationService } from '../services/notificationService';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/notifications', label: 'Notifications', icon: 'bi-bell' },
  { path: '/admin/tools/finance', label: 'Finance Tools', icon: 'bi-tools' },
  { path: '/admin/tools/notifications', label: 'Notification Tools', icon: 'bi-bell' },
];

export const AdminNotificationTools: React.FC = () => {
  const [form, setForm] = useState({
    userId: '',
    schoolId: '',
    role: '',
    count: 5,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: name === 'count' ? Number(value) : value });
  };

  const handleSeed = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const resp = await notificationService.seed({
        userId: form.userId || undefined,
        schoolId: form.schoolId,
        role: form.role || undefined,
        count: form.count,
      });
      setSuccess(`Seeded ${resp.created} notifications`);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to seed notifications');
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
            <h2>Admin Notification Tools</h2>
            <p className="text-muted">Seed sample notifications for a user or role</p>
          </div>

          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>School ID *</Form.Label>
                    <Form.Control name="schoolId" value={form.schoolId} onChange={onChange} placeholder="schoolId" />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>User ID (optional)</Form.Label>
                    <Form.Control name="userId" value={form.userId} onChange={onChange} placeholder="userId" />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Role (optional)</Form.Label>
                    <Form.Control name="role" value={form.role} onChange={onChange} placeholder="STUDENT/TEACHER/PARENT/ADMIN" />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Count</Form.Label>
                    <Form.Control type="number" min={1} max={50} name="count" value={form.count} onChange={onChange} />
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex gap-2">
                <Button onClick={handleSeed} disabled={loading || !form.schoolId}>
                  <i className="bi bi-seedling me-2"></i>
                  Seed Notifications
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Layout>
  );
};
