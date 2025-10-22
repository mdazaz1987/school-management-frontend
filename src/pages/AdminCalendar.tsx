import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Form, Button, Table, Badge, Alert, Spinner } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { calendarService, CalendarEvent } from '../services/calendarService';

export const AdminCalendar: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [form, setForm] = useState<{ title: string; type: 'HOLIDAY' | 'EVENT'; startDate: string; endDate?: string; description?: string }>({
    title: '',
    type: 'HOLIDAY',
    startDate: new Date().toISOString().slice(0,10),
    endDate: '',
    description: '',
  });

  const sidebarItems = useMemo(() => [
    { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { path: '/students', label: 'Students', icon: 'bi-people' },
    { path: '/teachers', label: 'Teachers', icon: 'bi-person-badge' },
    { path: '/classes', label: 'Classes', icon: 'bi-door-open' },
    { path: '/subjects', label: 'Subjects', icon: 'bi-book' },
    { path: '/exams', label: 'Exams', icon: 'bi-clipboard-check' },
    { path: '/fees', label: 'Fees', icon: 'bi-cash-coin' },
    { path: '/timetable', label: 'Timetable', icon: 'bi-calendar3' },
    { path: '/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
    { path: '/notifications', label: 'Notifications', icon: 'bi-bell' },
    { path: '/admin/calendar', label: 'Admin Calendar', icon: 'bi-calendar-event' },
  ], []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true); setError('');
        const list = await calendarService.list(user?.schoolId);
        setEvents(list);
      } catch (e: any) {
        setError('Failed to load calendar');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.schoolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true); setError(''); setSuccess('');
      const payload = {
        schoolId: user?.schoolId || '',
        title: form.title.trim(),
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        description: form.description?.trim() || undefined,
      };
      const created = await calendarService.create(payload);
      setEvents((prev) => [created, ...prev]);
      setSuccess('Calendar entry added');
      setForm({ title: '', type: form.type, startDate: form.startDate, endDate: '', description: '' });
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to add calendar entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true); setError(''); setSuccess('');
      await calendarService.remove(id, user?.schoolId);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setSuccess('Removed');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to remove');
    } finally {
      setLoading(false);
    }
  };

  const fmtRange = (e: CalendarEvent) => {
    const sd = new Date(e.startDate);
    const ed = e.endDate ? new Date(e.endDate) : sd;
    const same = sd.toDateString() === ed.toDateString();
    const toShort = (d: Date) => d.toLocaleDateString();
    return same ? toShort(sd) : `${toShort(sd)} → ${toShort(ed)}`;
  };

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>School Calendar</h2>
            <p className="text-muted">Manage holidays and events for the entire school</p>
          </div>

          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

          <Row className="mb-4">
            <Col md={6} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">Add Entry</h5>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Title</Form.Label>
                      <Form.Control value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                    </Form.Group>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Type</Form.Label>
                          <Form.Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}>
                            <option value="HOLIDAY">Holiday</option>
                            <option value="EVENT">Event</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Start Date</Form.Label>
                          <Form.Control type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>End Date</Form.Label>
                          <Form.Control type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Description</Form.Label>
                          <Form.Control as="textarea" rows={1} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="d-grid">
                      <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                        Add to Calendar
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Entries</h5>
                  <Badge bg="secondary">{events.length}</Badge>
                </Card.Header>
                <Card.Body className="p-0">
                  {loading ? (
                    <div className="text-center py-4"><Spinner animation="border" /></div>
                  ) : events.length === 0 ? (
                    <div className="text-center text-muted py-4">No entries yet</div>
                  ) : (
                    <Table hover responsive className="mb-0">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Type</th>
                          <th>Date</th>
                          <th className="text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.sort((a, b) => (a.startDate > b.startDate ? -1 : a.startDate < b.startDate ? 1 : 0)).map((e) => (
                          <tr key={e.id}>
                            <td>{e.title}</td>
                            <td><Badge bg={e.type === 'HOLIDAY' ? 'success' : 'info'}>{e.type}</Badge></td>
                            <td>{fmtRange(e)}</td>
                            <td className="text-end">
                              <Button size="sm" variant="outline-danger" onClick={() => handleDelete(e.id)}>Delete</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Layout>
  );
};
