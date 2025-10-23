import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert, Spinner, Tabs, Tab } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { adminService } from '../services/adminService';
import { teacherService } from '../services/teacherService';
import { attendanceService } from '../services/attendanceService';

export const AdminLeaveApprovals: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [studentLeaves, setStudentLeaves] = useState<any[]>([]);
  const [teacherLeaves, setTeacherLeaves] = useState<any[]>([]);

  const sidebarItems = useMemo(() => undefined, []);

  const load = async () => {
    try {
      setLoading(true); setError('');
      const schoolId = user?.schoolId;
      const [sLeaves, pend, allList] = await Promise.all([
        adminService.getPendingLeaves().catch(() => [] as any[]),
        teacherService.adminPending(schoolId).catch(() => [] as any[]),
        teacherService.adminListLeaves({ schoolId, status: 'PENDING' }).catch(() => [] as any[]),
      ]);
      const mergedTeachers = [...(pend || []), ...(allList || [])];
      const seen = new Set<string>();
      const unique = mergedTeachers.filter((x: any) => {
        const id = String(x.id || `${x.teacherId}-${x.startDate}-${x.endDate}`);
        if (seen.has(id)) return false; seen.add(id); return true;
      }).filter((x: any) => String(x?.status || '').toUpperCase().includes('PEND'));
      setStudentLeaves(Array.isArray(sLeaves) ? sLeaves : []);
      setTeacherLeaves(unique);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load pending leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.schoolId]);

  const approveStudent = async (leave: any) => {
    await adminService.approveLeave(leave.id, 'Approved by Admin');
    setStudentLeaves((prev) => prev.filter((x) => x.id !== leave.id));
    // Attempt to update attendance to EXCUSED for approved leave dates
    try {
      if (leave?.studentId && leave?.startDate) {
        const s = String(leave.startDate).slice(0,10);
        const e = String(leave.endDate || leave.startDate).slice(0,10);
        const recs = await attendanceService.getByStudent(leave.studentId, { startDate: s, endDate: e }).catch(() => [] as any[]);
        for (const r of (recs || [])) {
          if (r?.id) {
            try { await attendanceService.updateByAdmin(r.id, { status: 'EXCUSED' as any, remarks: 'Approved Leave' }); } catch {}
          }
        }
      }
    } catch {}
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
          <Sidebar items={sidebarItems as any} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2>Leave Approvals</h2>
                <p className="text-muted">Approve or reject student and teacher leave applications</p>
              </div>
              <div>
                <Button variant="outline-primary" size="sm" onClick={load} disabled={loading}>
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Refresh
                </Button>
              </div>
            </div>
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
                                <Button size="sm" variant="outline-success" onClick={() => approveStudent(l)}>Approve</Button>
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
