import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, ListGroup, Badge, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { parentService } from '../services/parentService';
import { notificationService } from '../services/notificationService';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/parent/children', label: 'My Children', icon: 'bi-people' },
  { path: '/parent/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
  { path: '/parent/performance', label: 'Performance', icon: 'bi-star' },
  { path: '/parent/fees', label: 'Fee Payments', icon: 'bi-cash-coin' },
  { path: '/parent/notifications', label: 'Notifications', icon: 'bi-bell' },
];

export const ParentNotifications: React.FC = () => {
  const [filter, setFilter] = useState<'all' | string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [children, setChildren] = useState<Array<{ id: string; name: string }>>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true); setError('');
        const kids = await parentService.getMyChildren();
        const mappedKids = (kids || []).map((c: any) => ({ id: c.id, name: `${c.firstName || ''} ${c.lastName || ''}`.trim() }));
        setChildren(mappedKids);

        // Merge notifications across children
        const lists = await Promise.all(mappedKids.map(async (k) => {
          const list = await parentService.getChildNotifications(k.id).catch(() => []);
          return (list || []).map((n: any) => ({ ...n, childName: k.name }));
        }));
        const flat = lists.flat().sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(flat);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true, isRead: true } : n));
    } catch {}
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'ATTENDANCE': return 'bi-calendar-check text-warning';
      case 'RESULT': return 'bi-star text-success';
      case 'FEE': return 'bi-cash-coin text-danger';
      case 'ASSIGNMENT': return 'bi-file-text text-primary';
      case 'ANNOUNCEMENT': return 'bi-megaphone text-info';
      case 'EXAM': return 'bi-clipboard-check text-danger';
      default: return 'bi-bell text-secondary';
    }
  };

  const getTimeDiff = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  };

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter(n => n.childName === filter);
  }, [notifications, filter]);

  const unreadCount = notifications.filter(n => !(n.read || n.isRead)).length;

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
                <h2>Notifications</h2>
                <p className="text-muted">Stay updated with your children's activities</p>
              </div>
              {unreadCount > 0 && (
                <Button variant="outline-primary" size="sm" onClick={markAllAsRead}>
                  Mark all as read
                </Button>
              )}
            </div>
          </div>

            <Card.Body>
              <Form.Group>
                <Form.Label>Filter by Child</Form.Label>
                <Form.Select value={filter} onChange={(e) => setFilter(e.target.value)}>
                  <option value="all">All Children</option>
                  {children.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Card.Body>
          </Card>

          {unreadCount > 0 && (
            <div className="alert alert-info d-flex align-items-center mb-4">
              <i className="bi bi-bell-fill me-2"></i>
              You have <strong className="mx-1">{unreadCount}</strong> unread notifications
          )}

          {error && <Alert variant="danger">{error}</Alert>}
          {loading && <div className="text-center py-2"><Spinner animation="border" /></div>}

          <Card className="border-0 shadow-sm">
            <ListGroup variant="flush">
              {filteredNotifications.map((notification) => (
                <ListGroup.Item
                  key={notification.id}
                  className={`${!(notification.read || notification.isRead) ? 'bg-light' : ''} border-start border-3 ${
                    notification.priority === 'URGENT' ? 'border-danger' : 
                    notification.priority === 'HIGH' ? 'border-warning' : 'border-secondary'
                  }`}
                  action
                  onClick={() => markAsRead(notification.id)}
                >
                  <Row className="align-items-center">
                    <Col xs="auto">
                      <div className="bg-white rounded-circle p-3 shadow-sm">
                        <i className={`bi ${getIcon(notification.type)} fs-4`}></i>
                      </div>
                    </Col>
                    <Col>
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-1">
                            <h6 className="mb-0 me-2">{notification.title}</h6>
                            {!(notification.read || notification.isRead) && <Badge bg="primary">New</Badge>}
                          </div>
                          <p className="mb-1 text-muted">{notification.message}</p>
                          <div className="d-flex align-items-center">
                            <Badge bg="secondary" className="me-2">{notification.childName || 'All'}</Badge>
                            <small className="text-muted">
                              <i className="bi bi-clock me-1"></i>
                              {getTimeDiff(notification.createdAt || notification.timestamp)}
                            </small>
                          </div>
                        </div>
                        {!(notification.read || notification.isRead) && (
                          <Button
                            variant="link"
                            size="sm"
                            className="text-decoration-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                          >
                            <i className="bi bi-check-lg"></i>
                          </Button>
                        )}
                      </div>
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </Layout>
  );
};
