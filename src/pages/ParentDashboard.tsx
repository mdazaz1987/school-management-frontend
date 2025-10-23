import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Badge, ProgressBar, ListGroup, Alert, Spinner } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { parentService } from '../services/parentService';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../contexts/LangContext';
import { CalendarWidget } from '../components/CalendarWidget';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/parent/children', label: 'My Children', icon: 'bi-people' },
  { path: '/parent/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
  { path: '/parent/performance', label: 'Performance', icon: 'bi-star' },
  { path: '/parent/fees', label: 'Fee Payments', icon: 'bi-cash-coin' },
  { path: '/parent/notifications', label: 'Notifications', icon: 'bi-bell' },
  { path: '/gallery', label: 'Photo Gallery', icon: 'bi-images' },
];

export const ParentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLang();
  const [children, setChildren] = useState<Array<{
    id: string;
    name: string;
    class: string;
    attendance: number;
    averageGrade: number;
    pendingFees: number;
    upcomingExams: number;
  }>>([]);
  const [recentActivities, setRecentActivities] = useState<Array<{ child: string; activity: string; type: string; time: string; color: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const [leaveActionBusy, setLeaveActionBusy] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true); setError('');
        const resp = await parentService.getDashboard();
        const baseChildren = (resp.children || []).map((c) => ({
          id: c.studentId,
          name: c.studentName,
          class: c.className,
          attendance: Math.round(c.attendancePercentage || 0),
          averageGrade: 0,
          pendingFees: 0,
          upcomingExams: 0,
        }));

        // Fetch per-child performance and fee summary, and notifications
        const withDetails = await Promise.all(baseChildren.map(async (child) => {
          try {
            const [grades, feeSummary] = await Promise.all([
              parentService.getChildPerformance(child.id).catch(() => null),
              parentService.getChildFeeSummary(child.id).catch(() => null),
            ]);
            return {
              ...child,
              averageGrade: grades?.averageMarks ? Math.round(grades.averageMarks) : 0,
              pendingFees: feeSummary?.totalDue ? Math.round(feeSummary.totalDue) : 0,
            };
          } catch {
            return child;
          }
        }));
        setChildren(withDetails);

        // Load notifications for recent activities (combine across children)
        const notificationsPerChild = await Promise.all(baseChildren.map(async (child) => {
          const list = await parentService.getChildNotifications(child.id).catch(() => []);
          return list.map((n: any) => ({
            child: child.name,
            type: n.type || 'GENERAL',
            title: n.title,
            message: n.message,
            createdAt: n.createdAt,
          }));
        }));

        const flat = notificationsPerChild.flat().sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
        const colorByType: Record<string, string> = {
          ASSIGNMENT: 'primary',
          EXAM: 'info',
          FEE: 'warning',
          ATTENDANCE: 'danger',
          RESULT: 'success',
          ANNOUNCEMENT: 'secondary',
          EVENT: 'secondary',
          HOLIDAY: 'secondary',
          EMERGENCY: 'danger',
          GENERAL: 'secondary',
        };
        const toAgo = (iso: string) => {
          const d = new Date(iso); const now = new Date(); const diffMs = now.getTime() - d.getTime();
          const mins = Math.floor(diffMs / 60000); const hours = Math.floor(diffMs / 3600000); const days = Math.floor(diffMs / 86400000);
          if (mins < 1) return t('time.just_now');
          if (mins < 60) return t('time.mins_ago').replace('{mins}', String(mins));
          if (hours < 24) return t('time.hours_ago').replace('{hours}', String(hours));
          if (days < 7) return t('time.days_ago').replace('{days}', String(days));
          return d.toLocaleDateString();
        };
        setRecentActivities(flat.map((n: any) => ({
          child: n.child,
          activity: n.title ? `${n.title}: ${n.message}` : n.message,
          type: n.type,
          time: toAgo(n.createdAt),
          color: colorByType[n.type] || 'secondary',
        })));

        // Load pending leave approvals
        try {
          const leaves = await parentService.getPendingLeaveApplications();
          setPendingLeaves(Array.isArray(leaves) ? leaves : []);
        } catch {}
      } catch (e: any) {
        setError(e?.response?.data?.message || t('error.failed_to_load_dashboard'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleApproveLeave = async (id: string) => {
    try {
      setLeaveActionBusy(id);
      await parentService.approveLeaveApplication(id);
      setPendingLeaves(pendingLeaves.filter(l => l.id !== id));
    } catch (e: any) {
      setError(e?.response?.data?.message || t('error.failed_to_approve_leave'));
    } finally {
      setLeaveActionBusy('');
    }
  };

  const handleRejectLeave = async (id: string) => {
    const reason = window.prompt(t('parent.dashboard.reason_rejection_prompt')) || t('parent.dashboard.rejected_by_parent');
    try {
      setLeaveActionBusy(id);
      await parentService.rejectLeaveApplication(id, reason);
      setPendingLeaves(pendingLeaves.filter(l => l.id !== id));
    } catch (e: any) {
      setError(e?.response?.data?.message || t('error.failed_to_reject_leave'));
    } finally {
      setLeaveActionBusy('');
    }
  };

  const upcomingEvents: Array<{ title: string; date: string; time: string }> = [];

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>{t('parent.dashboard.title')}</h2>
            <p className="text-muted">{t('parent.dashboard.welcome').replace('{name}', user?.firstName || '')}</p>
          </div>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>
          )}

          {loading && (
            <div className="text-center py-3"><Spinner animation="border" /></div>
          )}

          {/* Children Overview Cards */}
          <Row className="mb-4">
            {children.map((child) => (
              <Col md={6} key={child.id} className="mb-3">
                <Card className="border-0 shadow-sm h-100">
                  <Card.Header className="bg-primary text-white">
                    <h5 className="mb-0">
                      <i className="bi bi-person-circle me-2"></i>
                      {child.name}
                    </h5>
                    <small>{child.class}</small>
                  </Card.Header>
                  <Card.Body>
                    <Row className="mb-3">
                      <Col xs={6}>
                        <div className="text-center p-3 bg-light rounded">
                          <i className="bi bi-calendar-check fs-3 text-success mb-2"></i>
                          <h4 className="mb-0">{child.attendance}%</h4>
                          <small className="text-muted">{t('parent.dashboard.attendance')}</small>
                        </div>
                      </Col>
                      <Col xs={6}>
                        <div className="text-center p-3 bg-light rounded">
                          <i className="bi bi-star fs-3 text-primary mb-2"></i>
                          <h4 className="mb-0">{child.averageGrade}%</h4>
                          <small className="text-muted">{t('parent.dashboard.average_grade')}</small>
                        </div>
                      </Col>
                    </Row>
                    <Row>
                      <Col xs={6}>
                        <div className="d-flex align-items-center">
                          <i className="bi bi-clipboard-check text-info me-2"></i>
                          <div>
                            <strong>{child.upcomingExams}</strong>
                            <small className="d-block text-muted">{t('parent.dashboard.upcoming_exams')}</small>
                          </div>
                        </div>
                      </Col>
                      <Col xs={6}>
                        <div className="d-flex align-items-center">
                          <i className={`bi bi-cash text-${child.pendingFees > 0 ? 'danger' : 'success'} me-2`}></i>
                          <div>
                            <strong>₹{child.pendingFees}</strong>
                            <small className="d-block text-muted">{t('parent.dashboard.pending_fees')}</small>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                  <Card.Footer className="bg-white">
                    <Button variant="outline-primary" size="sm" className="w-100" onClick={() => navigate(`/parent/attendance?child=${child.id}`)}>
                      {t('parent.dashboard.view_details')}
                    </Button>
                  </Card.Footer>
                </Card>
              </Col>
            ))}
          </Row>

          <Row className="mb-4">
            {/* Recent Activities */}
            <Col md={8} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{t('parent.dashboard.recent_activities')}</h5>
                  <Button variant="link" size="sm">{t('common.view_all')}</Button>
                </Card.Header>
                <Card.Body className="p-0">
                  {recentActivities.length === 0 ? (
                    <div className="text-center text-muted py-4">{t('parent.dashboard.no_recent_activities')}</div>
                  ) : (
                    <ListGroup variant="flush">
                      {recentActivities.map((activity, index) => (
                        <ListGroup.Item key={index}>
                          <div className="d-flex align-items-start">
                            <Badge bg={activity.color} className="p-2 me-3">
                              <i className="bi bi-bell"></i>
                            </Badge>
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between">
                                <strong>{activity.child}</strong>
                                <small className="text-muted">{activity.time}</small>
                              </div>
                              <p className="mb-0 text-muted">{activity.activity}</p>
                            </div>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Pending Leave Approvals */}
            <Col md={4} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">{t('parent.dashboard.pending_leave_approvals')}</h5>
                </Card.Header>
                <Card.Body className="p-0">
                  {pendingLeaves.length === 0 ? (
                    <div className="text-center text-muted py-4">{t('parent.dashboard.no_pending_requests')}</div>
                  ) : (
                    <ListGroup variant="flush">
                      {pendingLeaves.map((l: any) => (
                        <ListGroup.Item key={l.id}>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <div><strong>{l.studentName || l.studentId}</strong></div>
                              <small className="text-muted">{new Date(l.startDate).toLocaleDateString()} → {new Date(l.endDate).toLocaleDateString()}</small>
                              {l.reason && <div className="text-muted small mt-1">{l.reason}</div>}
                            </div>
                            <div className="d-flex gap-2">
                              <Button size="sm" variant="success" disabled={leaveActionBusy===l.id} onClick={() => handleApproveLeave(l.id)}>
                                <i className="bi bi-check"></i>
                              </Button>
                              <Button size="sm" variant="outline-danger" disabled={leaveActionBusy===l.id} onClick={() => handleRejectLeave(l.id)}>
                                <i className="bi bi-x"></i>
                              </Button>
                            </div>
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </Card.Body>
              </Card>
            </Col>

            {/* Upcoming Events */}
            <Col md={4} className="mb-3">
              <CalendarWidget title={t('parent.dashboard.upcoming_events')} />
            </Col>
          </Row>

          {/* Performance Comparison */}
          <Row>
            <Col md={12}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">{t('parent.dashboard.children_performance_comparison')}</h5>
                </Card.Header>
                <Card.Body>
                  {children.map((child) => (
                    <div key={child.id} className="mb-4">
                      <div className="d-flex justify-content-between mb-2">
                        <strong>{child.name} - {child.class}</strong>
                        <span>{child.averageGrade}%</span>
                      </div>
                      <ProgressBar>
                        <ProgressBar variant="success" now={child.averageGrade} key={1} />
                      </ProgressBar>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Layout>
  );
};
