import React, { useState, useEffect } from 'react';
import { Row, Col, Card, ListGroup, Badge, Button, Alert, Spinner, Form, Modal, ButtonGroup } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/notificationService';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/student/assignments', label: 'Assignments', icon: 'bi-file-text' },
  { path: '/student/quizzes', label: 'Quizzes & Tests', icon: 'bi-clipboard-check' },
  { path: '/student/exams', label: 'Exams & Results', icon: 'bi-clipboard-check' },
  { path: '/student/attendance', label: 'My Attendance', icon: 'bi-calendar-check' },
  { path: '/student/timetable', label: 'Timetable', icon: 'bi-calendar3' },
  { path: '/student/fees', label: 'Fee Payment', icon: 'bi-cash-coin' },
  { path: '/student/notifications', label: 'Notifications', icon: 'bi-bell' },
];

export const StudentNotifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    loadNotifications();
  }, [user?.id]);

  const loadNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const idFromAuth = (user as any)?.id;
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = idFromAuth || storedUser?.id;
      if (!userId) {
        setNotifications([]);
        setError('User not identified. Please login again.');
        return;
      }
      const list = await notificationService.getByUser(userId);
      // Normalize for UI
      const normalized = (list || []).map((n: any) => ({
        id: n.id,
        type: (n.type || 'GENERAL').toString().toUpperCase(),
        title: n.title,
        message: n.message,
        timestamp: n.createdAt,
        read: !!n.read,
        priority: (n.priority || 'MEDIUM').toString().toUpperCase(),
        attachmentUrl: n.attachmentUrl,
      }));
      setNotifications(normalized);
    } catch (e: any) {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Apply filters
    let items = [...notifications];
    if (filterType !== 'ALL') items = items.filter(n => n.type === filterType);
    if (showUnreadOnly) items = items.filter(n => !n.read);
    setFiltered(items);
  }, [notifications, filterType, showUnreadOnly]);

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      // Fallback to local state update
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    }
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'assignment': return 'bi-file-text text-primary';
      case 'exam': return 'bi-clipboard-check text-danger';
      case 'grade': return 'bi-star text-success';
      case 'fee': return 'bi-cash-coin text-warning';
      case 'announcement': return 'bi-megaphone text-info';
      case 'attendance': return 'bi-calendar-check text-warning';
      case 'timetable': return 'bi-calendar3 text-primary';
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

  const unreadCount = notifications.filter(n => !n.read).length;

  const openModal = async (n: any) => {
    setSelected(n);
    setShowModal(true);
    if (!n.read) await markAsRead(n.id);
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
                <h2>My Notifications</h2>
                <p className="text-muted">Stay updated with important announcements</p>
              </div>
              {unreadCount > 0 && (
                <Button variant="outline-primary" size="sm" onClick={markAllAsRead}>
                  Mark all as read
                </Button>
              )}
            </div>
          </div>

          <Alert variant="info" className="mb-4">
            <i className="bi bi-info-circle me-2"></i>
            <strong>You will receive notifications about:</strong> New assignments, Exam results, Fee reminders, 
            Attendance updates, Timetable changes, School announcements, and Upcoming events.
          </Alert>

          {error && <Alert variant="danger">{error}</Alert>}

          {/* Unread count */}
          {unreadCount > 0 && (
            <Alert variant="info" className="d-flex align-items-center">
              <i className="bi bi-bell-fill me-2"></i>
              You have <strong className="mx-1">{unreadCount}</strong> unread notifications
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="mb-3">
                  <Form.Label>Categories</Form.Label>
                  <div>
                    <ButtonGroup className="flex-wrap">
                      {['ALL','ANNOUNCEMENT','EVENT','ASSIGNMENT','EXAM','FEE','ATTENDANCE','HOLIDAY','RESULT','EMERGENCY','GENERAL'].map((t) => (
                        <Button key={t} size="sm" variant={filterType===t? 'primary':'outline-secondary'} className="me-2 mb-2" onClick={() => setFilterType(t)}>
                          {t}
                        </Button>
                      ))}
                    </ButtonGroup>
                  </div>
                  <Form.Check type="checkbox" className="mt-2" label="Show unread only" checked={showUnreadOnly} onChange={(e) => setShowUnreadOnly(e.target.checked)} />
                </div>
                <ListGroup variant="flush">
                {filtered.map((notification) => (
                  <ListGroup.Item
                    key={notification.id}
                    className={`${!notification.read ? 'bg-light' : ''} border-start border-3 ${
                      notification.priority === 'high' ? 'border-danger' : 
                      notification.priority === 'medium' ? 'border-warning' : 'border-secondary'
                    }`}
                    action
                    onClick={() => openModal(notification)}
                  >
                    <Row className="align-items-center">
                      <Col xs="auto">
                        <div className="bg-white rounded-circle p-3 shadow-sm">
                          <i className={`bi ${getIcon(notification.type.toLowerCase())} fs-4`}></i>
                        </div>
                      </Col>
                      <Col>
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h6 className="mb-1">
                              {notification.title}
                              {!notification.read && (
                                <Badge bg="primary" className="ms-2">New</Badge>
                              )}
                            </h6>
                            <p className="mb-1 text-muted">{notification.message}</p>
                            <small className="text-muted">
                              <i className="bi bi-clock me-1"></i>
                              {getTimeDiff(notification.timestamp)}
                            </small>
                          </div>
                          {!notification.read && (
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
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
      <Modal show={showModal} onHide={() => setShowModal(false)}>
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
            <small className="text-muted ms-auto">{selected?.timestamp ? new Date(selected.timestamp).toLocaleString() : ''}</small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </Layout>
  );
}
;
