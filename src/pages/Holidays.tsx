import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Table, Badge, Spinner, Alert } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { calendarService, CalendarEvent } from '../services/calendarService';

export const Holidays: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const sidebarItems = useMemo(() => undefined, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true); setError('');
        const list = await calendarService.list(user?.schoolId);
        setEvents((list || []).filter((e) => e.type === 'HOLIDAY'));
      } catch (e: any) {
        setError('Failed to load holidays');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.schoolId]);

  const fmtRange = (e: CalendarEvent) => {
    const sd = new Date(e.startDate);
    const ed = e.endDate ? new Date(e.endDate) : sd;
    const same = sd.toDateString() === ed.toDateString();
    const toShort = (d: Date) => d.toLocaleDateString();
    return same ? toShort(sd) : `${toShort(sd)} → ${toShort(ed)}`;
  };

  const upcoming = events
    .filter((e) => {
      const today = new Date();
      const ed = e.endDate ? new Date(e.endDate) : new Date(e.startDate);
      return ed >= new Date(today.toDateString());
    })
    .sort((a, b) => (a.startDate > b.startDate ? 1 : a.startDate < b.startDate ? -1 : 0));
  const past = events
    .filter((e) => {
      const today = new Date();
      const ed = e.endDate ? new Date(e.endDate) : new Date(e.startDate);
      return ed < new Date(today.toDateString());
    })
    .sort((a, b) => (a.startDate > b.startDate ? -1 : a.startDate < b.startDate ? 1 : 0));

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems as any} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>Holidays</h2>
            <p className="text-muted">School-wide holidays set by Admin</p>
          </div>

          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

          <Row>
            <Col md={12} className="mb-3">
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Upcoming</h5>
                  <Badge bg="success">{upcoming.length}</Badge>
                </Card.Header>
                <Card.Body className="p-0">
                  {loading ? (
                    <div className="text-center py-4"><Spinner animation="border" /></div>
                  ) : upcoming.length === 0 ? (
                    <div className="text-center text-muted py-4">No upcoming holidays</div>
                  ) : (
                    <Table hover responsive className="mb-0">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Date</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {upcoming.map((e) => (
                          <tr key={e.id}>
                            <td>{e.title}</td>
                            <td>{fmtRange(e)}</td>
                            <td className="text-muted small">{e.description || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={12} className="mb-3">
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Past</h5>
                  <Badge bg="secondary">{past.length}</Badge>
                </Card.Header>
                <Card.Body className="p-0">
                  {loading ? (
                    <div className="text-center py-4"><Spinner animation="border" /></div>
                  ) : past.length === 0 ? (
                    <div className="text-center text-muted py-4">No past entries</div>
                  ) : (
                    <Table hover responsive className="mb-0">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Date</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {past.map((e) => (
                          <tr key={e.id}>
                            <td>{e.title}</td>
                            <td>{fmtRange(e)}</td>
                            <td className="text-muted small">{e.description || '-'}</td>
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
