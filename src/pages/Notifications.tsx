import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, ListGroup, Badge, Button, Spinner, Alert, Form, Modal, ButtonGroup } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { notificationService } from '../services/notificationService';
import { Notification } from '../types';
import { FaBell, FaCheck, FaExclamationCircle, FaInfoCircle, FaFilter, FaPlus } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Notifications: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Notification | null>(null);

  const sidebarItems = useMemo(() => {
    const roles = user?.roles || [];
    if (roles.includes('ADMIN')) {
      return [
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
      ];
    }
    if (roles.includes('TEACHER')) {
      return [
        { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
        { path: '/teacher/my-classes', label: 'My Classes', icon: 'bi-door-open' },
        { path: '/teacher/assignments', label: 'Assignments', icon: 'bi-file-text' },
        { path: '/teacher/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
        { path: '/teacher/grading', label: 'Grading', icon: 'bi-star' },
        { path: '/teacher/timetable', label: 'My Timetable', icon: 'bi-calendar3' },
        { path: '/teacher/students', label: 'Students', icon: 'bi-people' },
        { path: '/notifications', label: 'Notifications', icon: 'bi-bell' },
      ];
    }
    if (roles.includes('STUDENT')) {
      return [
        { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
        { path: '/student/assignments', label: 'Assignments', icon: 'bi-file-text' },
        { path: '/student/study-materials', label: 'Study Materials', icon: 'bi-book' },
        { path: '/student/quizzes', label: 'Quizzes & Tests', icon: 'bi-clipboard-check' },
        { path: '/student/exams', label: 'Exams & Results', icon: 'bi-clipboard2-data' },
        { path: '/student/attendance', label: 'My Attendance', icon: 'bi-calendar-check' },
        { path: '/student/timetable', label: 'Timetable', icon: 'bi-calendar3' },
        { path: '/student/fees', label: 'Fee Payment', icon: 'bi-cash-coin' },
        { path: '/notifications', label: 'Notifications', icon: 'bi-bell' },
      ];
    }
    if (roles.includes('PARENT')) {
      return [
        { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
        { path: '/parent/children', label: 'My Children', icon: 'bi-people' },
        { path: '/parent/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
        { path: '/parent/performance', label: 'Performance', icon: 'bi-star' },
        { path: '/parent/fees', label: 'Fee Payments', icon: 'bi-cash-coin' },
        { path: '/parent/notifications', label: 'Notifications', icon: 'bi-bell' },
      ];
    }
    return [{ path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' }];
  }, [user?.roles]);

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications, filterType, filterPriority, showUnreadOnly]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await notificationService.getMyNotifications();
      setNotifications(data);
    } catch (err: any) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...notifications];

    if (filterType !== 'ALL') {
      filtered = filtered.filter(n => n.type === filterType);
    }

    if (filterPriority !== 'ALL') {
      filtered = filtered.filter(n => n.priority === filterPriority);
    }

    if (showUnreadOnly) {
      filtered = filtered.filter(n => !n.isRead);
    }

    setFilteredNotifications(filtered);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
    }
  };

  const openModal = async (n: Notification) => {
    setSelected(n);
    setShowModal(true);
    if (!n.isRead) {
      await handleMarkAsRead(n.id);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err: any) {
      console.error('Error marking all as read:', err);
      setError('Failed to mark all as read');
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'ASSIGNMENT':
      case 'EXAM':
        return <FaInfoCircle className="text-primary" size={20} />;
      case 'FEE':
      case 'ATTENDANCE':
        return <FaExclamationCircle className="text-warning" size={20} />;
      case 'EMERGENCY':
        return <FaExclamationCircle className="text-danger" size={20} />;
      default:
        return <FaInfoCircle className="text-info" size={20} />;
    }
  };

  const getPriorityBadge = (priority: Notification['priority']) => {
    const variants: Record<Notification['priority'], string> = {
      'URGENT': 'danger',
      'HIGH': 'warning',
      'MEDIUM': 'info',
      'LOW': 'secondary'
    };
    return <Badge bg={variants[priority]} className="text-uppercase">{priority}</Badge>;
  };

  const getTypeBadge = (type: Notification['type']) => {
    return <Badge bg="primary" className="text-uppercase">{type}</Badge>;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <Container fluid className="py-4">
            <Row className="mb-4">
              <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="mb-1">
                  <FaBell className="me-2" />
                  Notifications
                </h2>
                <p className="text-muted mb-0">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
              <div className="d-flex gap-2">
                {(user?.roles?.includes('ADMIN') || user?.roles?.includes('TEACHER')) && (
                  <Button variant="primary" onClick={() => navigate('/notifications/create')}>
                    <FaPlus className="me-2" />
                    Create Notification
                  </Button>
                )}
                {unreadCount > 0 && (
                  <Button variant="outline-primary" onClick={handleMarkAllAsRead}>
                    <FaCheck className="me-2" />
                    Mark All as Read
                  </Button>
                )}
              </div>
            </div>
              </Col>
            </Row>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

            <Row>
              <Col lg={3}>
            <Card className="mb-4">
              <Card.Header>
                <FaFilter className="me-2" />
                Filters
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
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
                </div>
                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="ALL">All Types</option>
                    <option value="ASSIGNMENT">Assignment</option>
                    <option value="EXAM">Exam</option>
                    <option value="FEE">Fee</option>
                    <option value="ATTENDANCE">Attendance</option>
                    <option value="EVENT">Event</option>
                    <option value="ANNOUNCEMENT">Announcement</option>
                    <option value="EMERGENCY">Emergency</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Priority</Form.Label>
                  <Form.Select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </Form.Select>
                </Form.Group>

                <Form.Check
                  type="checkbox"
                  label="Show unread only"
                  checked={showUnreadOnly}
                  onChange={(e) => setShowUnreadOnly(e.target.checked)}
                />
              </Card.Body>
            </Card>
              </Col>

              <Col lg={9}>
            <Card>
              <Card.Header>
                All Notifications ({filteredNotifications.length})
              </Card.Header>
              <Card.Body className="p-0">
                {loading ? (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2 text-muted">Loading notifications...</p>
                  </div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="text-center py-5">
                    <FaBell size={48} className="text-muted mb-3 opacity-50" />
                    <p className="text-muted">No notifications found</p>
                  </div>
                ) : (
                  <ListGroup variant="flush">
                    {filteredNotifications.map((notification) => (
                      <ListGroup.Item
                        key={notification.id}
                        className={`${!notification.isRead ? 'bg-light border-start border-primary border-3' : ''}`}
                        action
                        onClick={() => openModal(notification)}
                      >
                        <Row className="align-items-start">
                          <Col xs="auto">
                            {getNotificationIcon(notification.type)}
                          </Col>
                          <Col>
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div>
                                <h6 className="mb-1">{notification.title}</h6>
                                <div className="d-flex gap-2 mb-2">
                                  {getTypeBadge(notification.type)}
                                  {getPriorityBadge(notification.priority)}
                                </div>
                                {!notification.isRead && (
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id); }}
                                  >
                                    <FaCheck className="me-1" />
                                    Mark Read
                                  </Button>
                                )}
                              </div>
                            </div>
                            <p className="mb-2">{notification.message}</p>
                            <small className="text-muted">
                              {notification.senderName && (
                                <>From: {notification.senderName} • </>
                              )}
                              {formatDateTime(notification.createdAt)}
                            </small>
                          </Col>
                        </Row>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
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
          <small className="text-muted ms-auto">{selected?.createdAt ? new Date(selected.createdAt).toLocaleString() : ''}</small>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
        {selected?.link && (
          <Button variant="primary" onClick={() => { window.location.href = selected.link as any; }}>Open Link</Button>
        )}
      </Modal.Footer>
    </Modal>
  </Layout>
);
}
