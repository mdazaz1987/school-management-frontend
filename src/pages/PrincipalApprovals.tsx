import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { teacherService } from '../services/teacherService';

export const PrincipalApprovals: React.FC = () => {
  const { user } = useAuth();
  const [isPrincipal, setIsPrincipal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [pending, setPending] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true); setError('');
        const me = await teacherService.getMyProfile().catch(() => null as any);
        const principal = !!me?.isPrincipal;
        setIsPrincipal(principal);
        if (principal) {
          const list = await teacherService.principalPending().catch(() => []);
          setPending(Array.isArray(list) ? list : []);
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load approvals');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const sidebarItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { path: '/teacher/my-classes', label: 'My Classes', icon: 'bi-door-open' },
    { path: '/teacher/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
    { path: '/teacher/assignments', label: 'Assignments', icon: 'bi-file-text' },
    { path: '/notifications', label: 'Notifications', icon: 'bi-bell' },
    { path: '/principal/approvals', label: 'Principal Approvals', icon: 'bi-check2-square' },
  ];

  const approve = async (id: string) => {
    try {
      await teacherService.principalApprove(id, 'Approved by Principal');
      setPending((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to approve');
    }
  };

  const reject = async (id: string) => {
    const reason = window.prompt('Reason for rejection?') || 'Rejected by Principal';
    try {
      await teacherService.principalReject(id, reason);
      setPending((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to reject');
    }
  };

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>Principal Approvals</h2>
            <p className="text-muted">Approve or reject teacher leave applications</p>
          </div>

          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {loading && (
            <div className="text-center py-3"><Spinner animation="border" /></div>
          )}

          {!loading && !isPrincipal && (
            <Alert variant="warning">You are not authorized to view this page.</Alert>
          )}

          {isPrincipal && (
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Pending Leave Applications</h5>
                <Badge bg="secondary">{pending.length}</Badge>
              </Card.Header>
              <Card.Body className="p-0">
                {pending.length === 0 ? (
                  <div className="text-center text-muted py-4">No pending requests</div>
                ) : (
                  <Table responsive hover className="mb-0">
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
                      {pending.map((l) => (
                        <tr key={l.id}>
                          <td>{l.teacherName || l.teacherId}</td>
                          <td>{new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}</td>
                          <td>{l.leaveType}</td>
                          <td><small className="text-muted">{l.reason}</small></td>
                          <td><Badge bg="warning">{String(l.status)}</Badge></td>
                          <td className="text-end">
                            <div className="d-inline-flex gap-2">
                              <Button size="sm" variant="outline-success" onClick={() => approve(l.id)}>Approve</Button>
                              <Button size="sm" variant="outline-danger" onClick={() => reject(l.id)}>Reject</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Layout>
  );
};
