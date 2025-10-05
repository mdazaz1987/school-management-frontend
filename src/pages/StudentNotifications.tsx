import React, { useState, useEffect } from 'react';
import { Row, Col, Card, ListGroup, Badge, Button, Alert, Spinner } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/student/assignments', label: 'Assignments', icon: 'bi-file-text' },
  { path: '/student/exams', label: 'Exams & Results', icon: 'bi-clipboard-check' },
  { path: '/student/attendance', label: 'My Attendance', icon: 'bi-calendar-check' },
  { path: '/student/timetable', label: 'Timetable', icon: 'bi-calendar3' },
  { path: '/student/fees', label: 'Fee Payment', icon: 'bi-cash-coin' },
  { path: '/student/notifications', label: 'Notifications', icon: 'bi-bell' },
];

export const StudentNotifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadNotifications();
  }, [user?.email]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // Mock notifications
      const mockNotifications = [
        {
          id: '1',
          type: 'assignment',
          title: 'New Assignment Posted',
          message: 'Mathematics Chapter 5 Exercise has been posted. Due date: ' + new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          read: false,
          priority: 'high'
        },
        {
          id: '2',
          type: 'exam',
          title: 'Upcoming Exam Reminder',
          message: 'Mid-Term examination for Physics is scheduled on ' + new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString() + ' at 09:00 AM',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          read: false,
          priority: 'high'
        },
        {
          id: '3',
          type: 'grade',
          title: 'Grade Posted',
          message: 'Your grade for English Essay has been posted. Grade: A (45/50)',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          read: false,
          priority: 'medium'
        },
        {
          id: '4',
          type: 'fee',
          title: 'Fee Payment Reminder',
          message: 'Your tuition fee payment is due on ' + new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString() + '. Amount: ₹50,000',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          read: true,
          priority: 'high'
        },
        {
          id: '5',
          type: 'announcement',
          title: 'School Holiday Notice',
          message: 'School will remain closed on ' + new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString() + ' due to public holiday',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          read: true,
          priority: 'low'
        },
        {
          id: '6',
          type: 'attendance',
          title: 'Attendance Alert',
          message: 'Your attendance has dropped below 85%. Current attendance: 82%',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          read: true,
          priority: 'high'
        },
        {
          id: '7',
          type: 'timetable',
          title: 'Timetable Update',
          message: 'Chemistry lab session on Friday has been moved to Lab 3',
          timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          read: true,
          priority: 'medium'
        }
      ];
      setNotifications(mockNotifications);
    } catch (e: any) {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
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
                <p className="text-muted">Stay updated with important announcements</p>
              </div>
              {unreadCount > 0 && (
                <Button variant="outline-primary" size="sm" onClick={markAllAsRead}>
                  Mark all as read
                </Button>
              )}
            </div>
          </div>

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
              <ListGroup variant="flush">
                {notifications.map((notification) => (
                  <ListGroup.Item
                    key={notification.id}
                    className={`${!notification.read ? 'bg-light' : ''} border-start border-3 ${
                      notification.priority === 'high' ? 'border-danger' : 
                      notification.priority === 'medium' ? 'border-warning' : 'border-secondary'
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
            </Card>
          )}
        </Col>
      </Row>
    </Layout>
  );
};
