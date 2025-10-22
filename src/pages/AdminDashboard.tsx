import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Button, Table, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useLang } from '../contexts/LangContext';
import { adminService } from '../services/adminService';
import { subjectService } from '../services/subjectService';
import { notificationService } from '../services/notificationService';
import { Notification } from '../types';
import { CalendarWidget } from '../components/CalendarWidget';

const rawSidebarItems = [
  { path: '/dashboard', labelKey: 'nav.dashboard', icon: 'bi-speedometer2' },
  { path: '/students', labelKey: 'nav.students', icon: 'bi-people' },
  { path: '/teachers', labelKey: 'nav.teachers', icon: 'bi-person-badge' },
  { path: '/classes', labelKey: 'nav.classes', icon: 'bi-door-open' },
  { path: '/subjects', labelKey: 'nav.subjects', icon: 'bi-book' },
  { path: '/exams', labelKey: 'nav.exams', icon: 'bi-clipboard-check' },
  { path: '/fees', labelKey: 'nav.fees', icon: 'bi-cash-coin' },
  { path: '/timetable', labelKey: 'nav.timetable', icon: 'bi-calendar3' },
  { path: '/attendance', labelKey: 'nav.attendance', icon: 'bi-calendar-check' },
  { path: '/notifications', labelKey: 'nav.notifications', icon: 'bi-bell' },
  { path: '/settings', labelKey: 'nav.settings', icon: 'bi-gear' },
  { path: '/admin/reports', labelKey: 'nav.admin_reports', icon: 'bi-file-earmark-bar-graph' },
];

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLang();
  const items = useMemo(() => rawSidebarItems.map(({ labelKey, ...rest }) => ({ ...rest, label: t(labelKey) })), [t]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    presentToday: 0,
    absentToday: 0,
    pendingFees: 0,
    upcomingExams: 0,
  });
  const [recentActivities, setRecentActivities] = useState<Notification[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [leavesLoading, setLeavesLoading] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const systemStats: any = await adminService.getSystemStats();
        let totalSubjects = 0;
        try {
          const subs = await subjectService.getAllSubjects({ schoolId: user?.schoolId });
          totalSubjects = subs?.length || 0;
        } catch (e) {
          // Non-fatal; leave subjects as 0 if request fails
          // console.error('Failed to load subjects count', e);
        }
        setStats((prev) => ({
          ...prev,
          totalStudents: systemStats?.totalStudents || 0,
          totalTeachers: systemStats?.totalTeachers || 0,
          totalClasses: systemStats?.totalClasses || 0,
          totalSubjects,
        }));
      } catch (err) {
        // Keep defaults if backend not available
        // console.error('Failed to load admin stats', err);
      }
    };
    const loadPendingLeaves = async () => {
      try {
        setLeavesLoading(true);
        const list = await adminService.getPendingLeaves();
        setPendingLeaves(Array.isArray(list) ? list : []);
      } catch (e) {
        setPendingLeaves([]);
      } finally {
        setLeavesLoading(false);
      }
    };
    const loadAttendance = async () => {
      try {
        if (user?.schoolId) {
          const res = await adminService.getTodayAttendance(user.schoolId);
          setStats(prev => ({ ...prev, presentToday: res.present || 0, absentToday: res.absent || 0 }));
        }
      } catch (e) {
        // non-fatal
      }
    };
    
    const loadNotifications = async () => {
      try {
        const notifications = await notificationService.getMyNotifications();
        // Get latest 5 notifications
        setRecentActivities(notifications.slice(0, 5));
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    };
    
    loadStats();
    loadAttendance();
    loadNotifications();
    loadPendingLeaves();
  }, [user?.schoolId]);

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={items} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>{t('admin.dashboard.title')}</h2>
            <p className="text-muted">{t('admin.dashboard.welcome').replace('{name}', user?.firstName || '')}</p>
          </div>

          {/* Statistics Cards */}
          <Row className="mb-4">
            <Col md={3} className="mb-3">
              <Card className="stat-card border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <Card.Title className="h6 text-muted mb-2">{t('admin.dashboard.total_students')}</Card.Title>
                      <h3 className="mb-0">{stats.totalStudents}</h3>
                    </div>
                    <div className="bg-primary bg-opacity-10 p-3 rounded">
                      <i className="bi bi-people fs-2 text-primary"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="stat-card border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <Card.Title className="h6 text-muted mb-2">{t('admin.dashboard.total_teachers')}</Card.Title>
                      <h3 className="mb-0">{stats.totalTeachers}</h3>
                    </div>
                    <div className="bg-success bg-opacity-10 p-3 rounded">
                      <i className="bi bi-person-badge fs-2 text-success"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="stat-card border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <Card.Title className="h6 text-muted mb-2">{t('admin.dashboard.total_classes')}</Card.Title>
                      <h3 className="mb-0">{stats.totalClasses}</h3>
                    </div>
                    <div className="bg-info bg-opacity-10 p-3 rounded">
                      <i className="bi bi-door-open fs-2 text-info"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-3">
              <Card className="stat-card border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <Card.Title className="h6 text-muted mb-2">{t('admin.dashboard.total_subjects')}</Card.Title>
                      <h3 className="mb-0">{stats.totalSubjects}</h3>
                    </div>
                    <div className="bg-warning bg-opacity-10 p-3 rounded">
                      <i className="bi bi-book fs-2 text-warning"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="mt-4">
            <Col md={6} className="mb-3">
              <CalendarWidget title="Upcoming Holidays & Events" />
            </Col>
          </Row>

          {/* Pending Leave Approvals */}
          <Row className="mt-4">
            <Col md={12}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{t('admin.dashboard.pending_leave_approvals')}</h5>
                  {leavesLoading && <span className="text-muted small">{t('common.loading')}</span>}
                </Card.Header>
                <Card.Body className="p-0">
                  {pendingLeaves.length === 0 ? (
                    <div className="text-center text-muted py-4">{t('admin.dashboard.no_pending_leaves')}</div>
                  ) : (
                    <Table responsive hover className="mb-0">
                      <thead>
                        <tr>
                          <th>{t('table.student')}</th>
                          <th>{t('table.class')}</th>
                          <th>{t('table.date_range')}</th>
                          <th>{t('table.type')}</th>
                          <th>{t('table.reason')}</th>
                          <th>{t('table.status')}</th>
                          <th className="text-end">{t('table.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingLeaves.map((l: any) => (
                          <tr key={l.id}>
                            <td>{l.studentName || l.studentId}</td>
                            <td>{l.className || l.classId}</td>
                            <td>{new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}</td>
                            <td>{l.leaveType}</td>
                            <td><small className="text-muted">{l.reason}</small></td>
                            <td><Badge bg="warning">{(l.status || '').toString()}</Badge></td>
                            <td className="text-end">
                              <div className="d-inline-flex gap-2">
                                <Button size="sm" variant="outline-success" onClick={async () => {
                                  await adminService.approveLeave(l.id, 'Approved by Admin');
                                  setPendingLeaves((prev) => prev.filter((x: any) => x.id !== l.id));
                                }}>
                                  {t('common.approve')}
                                </Button>
                                <Button size="sm" variant="outline-danger" onClick={async () => {
                                  await adminService.rejectLeave(l.id, 'Rejected by Admin');
                                  setPendingLeaves((prev) => prev.filter((x: any) => x.id !== l.id));
                                }}>
                                  {t('common.reject')}
                                </Button>
                              </div>
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

          {/* Attendance Overview */}
          <Row className="mb-4">
            <Col md={6} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">{t('admin.dashboard.todays_attendance')}</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex justify-content-around align-items-center">
                    <div className="text-center">
                      <i className="bi bi-check-circle-fill text-success fs-1"></i>
                      <h3 className="mt-2">{stats.presentToday}</h3>
                      <p className="text-muted mb-0">{t('status.present')}</p>
                    </div>
                    <div className="text-center">
                      <i className="bi bi-x-circle-fill text-danger fs-1"></i>
                      <h3 className="mt-2">{stats.absentToday}</h3>
                      <p className="text-muted mb-0">{t('status.absent')}</p>
                    </div>
                    <div className="text-center">
                      <i className="bi bi-percent text-primary fs-1"></i>
                      <h3 className="mt-2">
                        {stats.totalStudents > 0 
                          ? ((stats.presentToday / stats.totalStudents) * 100).toFixed(1) 
                          : '0.0'}%
                      </h3>
                      <p className="text-muted mb-0">{t('admin.dashboard.attendance_rate')}</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">{t('admin.dashboard.quick_actions')}</h5>
                </Card.Header>
                <Card.Body>
                  <div className="d-grid gap-2">
                    <Button variant="primary" size="lg" onClick={() => navigate('/students/new')}>
                      <i className="bi bi-person-plus me-2"></i>
                      {t('admin.dashboard.add_new_student')}
                    </Button>
                    <Button variant="success" size="lg" onClick={() => navigate('/exams')}>
                      <i className="bi bi-clipboard-plus me-2"></i>
                      {t('admin.dashboard.create_exam')}
                    </Button>
                    <Button variant="info" size="lg" onClick={() => navigate('/notifications')}>
                      <i className="bi bi-megaphone me-2"></i>
                      {t('admin.dashboard.send_notification')}
                    </Button>
                    <Button variant="secondary" size="lg" onClick={() => navigate('/admin/calendar')}>
                      <i className="bi bi-calendar-event me-2"></i>
                      Manage School Calendar
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Recent Activities */}
          <Row>
            <Col md={12}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{t('admin.dashboard.recent_activities')}</h5>
                  <Button variant="link" size="sm" onClick={() => navigate('/notifications')}>{t('common.view_all')}</Button>
                </Card.Header>
                <Card.Body className="p-0">
                  {recentActivities.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <i className="bi bi-bell fs-1 opacity-50"></i>
                      <p className="mt-2">{t('admin.dashboard.no_recent_activities')}</p>
                    </div>
                  ) : (
                    <Table hover className="mb-0">
                      <tbody>
                        {recentActivities.map((activity) => {
                          const getBadgeColor = (type: string) => {
                            switch (type) {
                              case 'ASSIGNMENT': return 'primary';
                              case 'EXAM': return 'info';
                              case 'FEE': return 'warning';
                              case 'ATTENDANCE': return 'danger';
                              case 'ANNOUNCEMENT': return 'success';
                              case 'EMERGENCY': return 'danger';
                              default: return 'secondary';
                            }
                          };
                          
                          const getIcon = (type: string) => {
                            switch (type) {
                              case 'ASSIGNMENT': return 'clipboard';
                              case 'EXAM': return 'clipboard-check';
                              case 'FEE': return 'cash';
                              case 'ATTENDANCE': return 'calendar-check';
                              case 'ANNOUNCEMENT': return 'megaphone';
                              case 'EMERGENCY': return 'exclamation-triangle';
                              default: return 'bell';
                            }
                          };
                          
                          const formatTime = (dateString: string) => {
                            const date = new Date(dateString);
                            const now = new Date();
                            const diffMs = now.getTime() - date.getTime();
                            const diffMins = Math.floor(diffMs / 60000);
                            const diffHours = Math.floor(diffMs / 3600000);
                            const diffDays = Math.floor(diffMs / 86400000);

                            if (diffMins < 1) return t('time.just_now');
                            if (diffMins < 60) return t('time.mins_ago').replace('{mins}', String(diffMins));
                            if (diffHours < 24) return t('time.hours_ago').replace('{hours}', String(diffHours));
                            if (diffDays < 7) return t('time.days_ago').replace('{days}', String(diffDays));
                            return date.toLocaleDateString();
                          };
                          
                          return (
                            <tr key={activity.id}>
                              <td style={{ width: '60px' }}>
                                <Badge bg={getBadgeColor(activity.type)} className="p-2">
                                  <i className={`bi bi-${getIcon(activity.type)}`}></i>
                                </Badge>
                              </td>
                              <td>
                                <div><strong>{activity.title}</strong></div>
                                <div className="text-muted small">{activity.message}</div>
                                <small className="text-muted">{formatTime(activity.createdAt)}</small>
                              </td>
                              <td style={{ width: '100px' }} className="text-end">
                                <Button 
                                  variant="outline-primary" 
                                  size="sm"
                                  onClick={() => navigate('/notifications')}
                                >
                                  {t('common.view')}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
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
