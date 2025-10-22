import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, ListGroup, Badge, Button, Spinner, Alert, Form } from 'react-bootstrap';
import { Layout } from '../components/Layout';
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
                              </div>
                              {!notification.isRead && (
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() => handleMarkAsRead(notification.id)}
                                >
                                  <FaCheck className="me-1" />
                                  Mark Read
                                </Button>
                              )}
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
    </Layout>
  );
};
