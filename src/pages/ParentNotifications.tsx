import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, ListGroup, Badge, Button, Form, Spinner, Alert, Modal, ButtonGroup } from 'react-bootstrap';
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
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [children, setChildren] = useState<Array<{ id: string; name: string }>>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);

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
        const flat = lists.flat().sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((n: any) => ({ ...n, type: (n.type || 'GENERAL').toString().toUpperCase(), priority: (n.priority || 'MEDIUM').toString().toUpperCase() }));
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
    let list = notifications;
    if (filter !== 'all') list = list.filter(n => n.childName === filter);
    if (filterType !== 'ALL') list = list.filter(n => n.type === filterType);
    if (showUnreadOnly) list = list.filter(n => !(n.read || n.isRead));
    return list;
  }, [notifications, filter, filterType, showUnreadOnly]);

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

          <Card className="border-0 shadow-sm mb-4">
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
              <hr />
              <div className="mb-2">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <Form.Label className="mb-0">Categories</Form.Label>
                  <Button size="sm" variant="link" onClick={() => setFilterType('ALL')}>Reset</Button>
                </div>
                <ButtonGroup className="flex-wrap">
                  {['ALL','ANNOUNCEMENT','EVENT','ASSIGNMENT','EXAM','FEE','ATTENDANCE','HOLIDAY','RESULT','EMERGENCY','GENERAL'].map((t) => (
                    <Button key={t} size="sm" variant={filterType===t? 'primary':'outline-secondary'} className="me-2 mb-2" onClick={() => setFilterType(t)}>
                      {t}
                    </Button>
                  ))}
                </ButtonGroup>
                <Form.Check className="mt-2" type="checkbox" label="Show unread only" checked={showUnreadOnly} onChange={(e) => setShowUnreadOnly(e.target.checked)} />
              </div>
            </Card.Body>
          </Card>

          {unreadCount > 0 && (
            <div className="alert alert-info d-flex align-items-center mb-4">
              <i className="bi bi-bell-fill me-2"></i>
              You have <strong className="mx-1">{unreadCount}</strong> unread notifications
            </div>
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
                  onClick={() => {
                    setSelected(notification);
                    setShowModal(true);
                    if (!(notification.read || notification.isRead)) markAsRead(notification.id);
                  }}
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
    <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{selected?.title || 'Notification'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selected?.attachmentUrl && (
          <div className="mb-3 text-center">
            <img src={selected.attachmentUrl} alt="Attachment" style={{ maxWidth: '100%', borderRadius: 8 }} onError={(e) => ((e.target as HTMLImageElement).style.display='none')} />
          </div>
        )}
        <p>{selected?.message}</p>
        <div className="d-flex gap-2 align-items-center">
          <Badge bg="primary">{selected?.type}</Badge>
          <Badge bg={selected?.priority === 'URGENT' ? 'danger' : selected?.priority === 'HIGH' ? 'warning' : selected?.priority === 'MEDIUM' ? 'info' : 'secondary'}>
            {selected?.priority}
          </Badge>
          <small className="text-muted ms-auto">{selected?.createdAt ? new Date(selected.createdAt).toLocaleString() : (selected?.timestamp ? new Date(selected.timestamp).toLocaleString() : '')}</small>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
      </Modal.Footer>
    </Modal>
    </Layout>
  );
};
