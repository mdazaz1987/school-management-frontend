import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert, Spinner, Tabs, Tab } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { adminService } from '../services/adminService';
import { teacherService } from '../services/teacherService';

export const AdminLeaveApprovals: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [studentLeaves, setStudentLeaves] = useState<any[]>([]);
  const [teacherLeaves, setTeacherLeaves] = useState<any[]>([]);

  const sidebarItems = useMemo(() => [
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
    { path: '/admin/calendar', label: 'Admin Calendar', icon: 'bi-calendar-event' },
    { path: '/admin/approvals', label: 'Approvals', icon: 'bi-check2-square' },
  ], []);

  const load = async () => {
    try {
      setLoading(true); setError('');
      const [sLeaves, tLeaves] = await Promise.all([
        adminService.getPendingLeaves().catch(() => [] as any[]),
        teacherService.adminPending(user?.schoolId || '').catch(() => [] as any[]),
      ]);
      setStudentLeaves(Array.isArray(sLeaves) ? sLeaves : []);
      setTeacherLeaves(Array.isArray(tLeaves) ? tLeaves : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load pending leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.schoolId]);

  const approveStudent = async (id: string) => {
    await adminService.approveLeave(id, 'Approved by Admin');
    setStudentLeaves((prev) => prev.filter((x) => x.id !== id));
  };
  const rejectStudent = async (id: string) => {
    const reason = window.prompt('Reason for rejection?') || 'Rejected by Admin';
    await adminService.rejectLeave(id, reason);
    setStudentLeaves((prev) => prev.filter((x) => x.id !== id));
  };

  const approveTeacher = async (id: string) => {
    await teacherService.adminApprove(id, 'Approved by Admin');
    setTeacherLeaves((prev) => prev.filter((x) => x.id !== id));
  };
  const rejectTeacher = async (id: string) => {
    const reason = window.prompt('Reason for rejection?') || 'Rejected by Admin';
    await teacherService.adminReject(id, reason);
    setTeacherLeaves((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>Leave Approvals</h2>
            <p className="text-muted">Approve or reject student and teacher leave applications</p>
          </div>

          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {loading && (
            <div className="text-center py-3"><Spinner animation="border" /></div>
          )}

          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Tabs defaultActiveKey="teacher" className="mb-3">
                <Tab eventKey="teacher" title="Teacher Leave Applications">
                  {teacherLeaves.length === 0 ? (
                    <div className="text-center text-muted py-4">No pending teacher leave applications</div>
                  ) : (
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Teacher</th>
                          <th>Date Range</th>
                          <th>Type</th>
                          <th>Reason</th>
                          <th>Status</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teacherLeaves.map((l: any) => (
                          <tr key={l.id}>
                            <td>{l.teacherName || l.teacherId}</td>
                            <td>{new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}</td>
                            <td>{l.leaveType}</td>
                            <td><small className="text-muted">{l.reason}</small></td>
                            <td><Badge bg="warning">{String(l.status)}</Badge></td>
                            <td className="text-end">
                              <div className="d-inline-flex gap-2">
                                <Button size="sm" variant="outline-success" onClick={() => approveTeacher(l.id)}>Approve</Button>
                                <Button size="sm" variant="outline-danger" onClick={() => rejectTeacher(l.id)}>Reject</Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Tab>
                <Tab eventKey="student" title="Student Leave Applications">
                  {studentLeaves.length === 0 ? (
                    <div className="text-center text-muted py-4">No pending student leave applications</div>
                  ) : (
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Class</th>
                          <th>Date Range</th>
                          <th>Type</th>
                          <th>Reason</th>
                          <th>Status</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentLeaves.map((l: any) => (
                          <tr key={l.id}>
                            <td>{l.studentName || l.studentId}</td>
                            <td>{l.className || l.classId}</td>
                            <td>{new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}</td>
                            <td>{l.leaveType || '-'}</td>
                            <td><small className="text-muted">{l.reason}</small></td>
                            <td><Badge bg="warning">{String(l.status)}</Badge></td>
                            <td className="text-end">
                              <div className="d-inline-flex gap-2">
                                <Button size="sm" variant="outline-success" onClick={() => approveStudent(l.id)}>Approve</Button>
                                <Button size="sm" variant="outline-danger" onClick={() => rejectStudent(l.id)}>Reject</Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Layout>
  );
};
