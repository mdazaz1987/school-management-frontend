import React, { useState, useEffect } from 'react';
import { Dropdown, Badge, ListGroup, Spinner } from 'react-bootstrap';
import { notificationService } from '../services/notificationService';
import { Notification } from '../types';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaCheck, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getMyNotifications();
      // Show only recent 10 notifications
      setNotifications(data.slice(0, 10));
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id, {} as React.MouseEvent);
    }
    setShow(false);
    
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'ASSIGNMENT':
      case 'EXAM':
        return <FaInfoCircle className="text-primary" />;
      case 'FEE':
      case 'ATTENDANCE':
        return <FaExclamationCircle className="text-warning" />;
      case 'EMERGENCY':
        return <FaExclamationCircle className="text-danger" />;
      default:
        return <FaInfoCircle className="text-info" />;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'URGENT':
        return 'danger';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Dropdown show={show} onToggle={(isOpen) => setShow(isOpen)} align="end">
      <Dropdown.Toggle 
        variant="link" 
        className="position-relative p-2 text-decoration-none"
        style={{ color: 'inherit' }}
      >
        <FaBell size={20} />
        {unreadCount > 0 && (
          <Badge 
            bg="danger" 
            pill 
            className="position-absolute top-0 start-100 translate-middle"
            style={{ fontSize: '0.7rem' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu style={{ width: '350px', maxHeight: '500px', overflowY: 'auto' }}>
        <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
          <h6 className="mb-0">Notifications</h6>
          {unreadCount > 0 && (
            <button 
              className="btn btn-link btn-sm p-0"
              onClick={handleMarkAllAsRead}
            >
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center text-muted py-4">
            <FaBell size={32} className="mb-2 opacity-50" />
            <p className="mb-0">No notifications</p>
          </div>
        ) : (
          <ListGroup variant="flush">
            {notifications.map((notification) => (
              <ListGroup.Item
                key={notification.id}
                action
                onClick={() => handleNotificationClick(notification)}
                className={`border-0 ${!notification.isRead ? 'bg-light' : ''}`}
                style={{ cursor: 'pointer' }}
              >
                <div className="d-flex align-items-start">
                  <div className="me-2 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <strong className="d-block">{notification.title}</strong>
                        <small className="text-muted d-block mb-1">
                          {notification.message.length > 80
                            ? notification.message.substring(0, 80) + '...'
                            : notification.message}
                        </small>
                        <div className="d-flex align-items-center gap-2">
                          <Badge bg={getPriorityColor(notification.priority)} className="text-uppercase" style={{ fontSize: '0.65rem' }}>
                            {notification.priority}
                          </Badge>
                          <small className="text-muted">{formatTime(notification.createdAt)}</small>
                        </div>
                      </div>
                      {!notification.isRead && (
                        <button
                          className="btn btn-sm btn-link p-0 ms-2"
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          title="Mark as read"
                        >
                          <FaCheck className="text-success" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}

        <Dropdown.Divider />
        <Dropdown.Item 
          className="text-center text-primary"
          onClick={() => {
            setShow(false);
            navigate('/notifications');
          }}
        >
          View All Notifications
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};
