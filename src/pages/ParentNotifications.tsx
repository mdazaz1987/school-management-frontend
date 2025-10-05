import React, { useState } from 'react';
import { Row, Col, Card, ListGroup, Badge, Button, Form } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/parent/children', label: 'My Children', icon: 'bi-people' },
  { path: '/parent/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
  { path: '/parent/performance', label: 'Performance', icon: 'bi-star' },
  { path: '/parent/fees', label: 'Fee Payments', icon: 'bi-cash-coin' },
  { path: '/parent/notifications', label: 'Notifications', icon: 'bi-bell' },
];

export const ParentNotifications: React.FC = () => {
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      child: 'John Doe',
      type: 'attendance',
      title: 'Attendance Alert',
      message: 'John Doe was absent today (Feb 5, 2025)',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: false,
      priority: 'high'
    },
    {
      id: '2',
      child: 'Jane Doe',
      type: 'grade',
      title: 'New Grade Posted',
      message: 'Jane Doe received grade A in Mathematics Mid-Term Exam',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      read: false,
      priority: 'medium'
    },
    {
      id: '3',
      child: 'John Doe',
      type: 'fee',
      title: 'Fee Payment Reminder',
      message: 'Tuition fee payment of ₹50,000 is due on March 31, 2025',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
      priority: 'high'
    },
    {
      id: '4',
      child: 'Jane Doe',
      type: 'assignment',
      title: 'Assignment Submitted',
      message: 'Jane Doe submitted English Essay assignment',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
      priority: 'low'
    },
    {
      id: '5',
      child: 'All',
      type: 'announcement',
      title: 'Parent-Teacher Meeting',
      message: 'Parent-Teacher meeting scheduled for March 15, 2025 at 10:00 AM',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
      priority: 'medium'
    },
    {
      id: '6',
      child: 'John Doe',
      type: 'exam',
      title: 'Upcoming Exam',
      message: 'Mid-term exam for Physics on March 10, 2025',
      timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
      priority: 'high'
    }
  ]);

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
      case 'attendance': return 'bi-calendar-check text-warning';
      case 'grade': return 'bi-star text-success';
      case 'fee': return 'bi-cash-coin text-danger';
      case 'assignment': return 'bi-file-text text-primary';
      case 'announcement': return 'bi-megaphone text-info';
      case 'exam': return 'bi-clipboard-check text-danger';
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

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => n.child === filter || n.child === 'All');

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
                  <option value="John Doe">John Doe</option>
                  <option value="Jane Doe">Jane Doe</option>
                </Form.Select>
              </Form.Group>
            </Card.Body>
          </Card>

          {unreadCount > 0 && (
            <div className="alert alert-info d-flex align-items-center mb-4">
              <i className="bi bi-bell-fill me-2"></i>
              You have <strong className="mx-1">{unreadCount}</strong> unread notifications
            </div>
          )}

          <Card className="border-0 shadow-sm">
            <ListGroup variant="flush">
              {filteredNotifications.map((notification) => (
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
                          <div className="d-flex align-items-center mb-1">
                            <h6 className="mb-0 me-2">{notification.title}</h6>
                            {!notification.read && <Badge bg="primary">New</Badge>}
                          </div>
                          <p className="mb-1 text-muted">{notification.message}</p>
                          <div className="d-flex align-items-center">
                            <Badge bg="secondary" className="me-2">{notification.child}</Badge>
                            <small className="text-muted">
                              <i className="bi bi-clock me-1"></i>
                              {getTimeDiff(notification.timestamp)}
                            </small>
                          </div>
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
        </Col>
      </Row>
    </Layout>
  );
};
