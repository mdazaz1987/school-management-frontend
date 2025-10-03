import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { Container, Row, Col, Card, Table, Button, Badge, Alert, Spinner, Form } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { feeService } from '../services/feeService';
import { studentService } from '../services/studentService';
import { Fee, Student } from '../types';

export const FeeList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fees, setFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [status, setStatus] = useState<string>('');
  const [q, setQ] = useState('');

  const studentById = useMemo(() => {
    const map: Record<string, Student> = {};
    students.forEach((s) => (map[s.id] = s));
    return map;
  }, [students]);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const [feeList, stuList] = await Promise.all([
        feeService.list({ schoolId: user?.schoolId || '', status: status || undefined }),
        user?.schoolId ? studentService.getStudentsBySchool(user.schoolId) : Promise.resolve([] as Student[]),
      ]);
      setFees(feeList);
      setStudents(stuList);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load fees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.schoolId, status]);

  const handleDelete = async (fee: Fee) => {
    if (!window.confirm('Delete this fee? This cannot be undone.')) return;
    try {
      await feeService.remove(fee.id);
      setSuccess('Fee deleted');
      load();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to delete fee');
    }
  };

  const handlePay = async (fee: Fee) => {
    if (!window.confirm('Mark as paid (Cash)?')) return;
    try {
      await feeService.pay(fee.id, { paymentMethod: 'CASH' });
      setSuccess('Payment recorded');
      load();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to record payment');
    }
  };

  const handleDiscount = async (fee: Fee) => {
    const val = window.prompt('Enter discount amount (number):', '0');
    if (val == null) return;
    const discount = parseFloat(val);
    if (isNaN(discount) || discount < 0) return alert('Invalid amount');
    const reason = window.prompt('Enter reason (optional):', '') || undefined;
    try {
      await feeService.applyDiscount(fee.id, { discount, reason });
      setSuccess('Discount applied');
      load();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to apply discount');
    }
  };

  const filtered = fees.filter((f) => {
    const s = studentById[f.studentId];
    const hay = [
      f.feeType,
      f.status,
      f.term,
      f.academicYear,
      s ? s.firstName + ' ' + s.lastName : '',
      s?.admissionNumber || '',
    ]
      .map((x) => (x ? String(x).toLowerCase() : ''))
      .join(' ');
    return hay.includes(q.toLowerCase());
  });

  return (
    <Layout>
      <Container className="py-4">
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2>Fees</h2>
                <p className="text-muted">Manage student fees</p>
              </div>
              <div className="d-flex gap-2">
                <Form.Select size="sm" value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 160 }}>
                  <option value="">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="PAID">Paid</option>
                  <option value="OVERDUE">Overdue</option>
                </Form.Select>
                <Form.Control
                  size="sm"
                  style={{ width: 240 }}
                  placeholder="Search by student/fee/term"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <Button variant="primary" onClick={() => navigate('/fees/new')}>
                  <i className="bi bi-plus-lg me-2"></i>
                  New Fee
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Card className="border-0 shadow-sm">
          <Card.Body>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading fees...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox display-1 text-muted"></i>
                <p className="mt-3 text-muted">No fees found</p>
                <Button variant="primary" onClick={() => navigate('/fees/new')}>Create Fee</Button>
              </div>
            ) : (
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Fee Type</th>
                    <th>Amount</th>
                    <th>Discount</th>
                    <th>Net</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f) => {
                    const s = studentById[f.studentId];
                    return (
                      <tr key={f.id}>
                        <td>
                          {s ? (
                            <>
                              {s.firstName} {s.lastName}
                              <div className="text-muted small">{s.admissionNumber}</div>
                            </>
                          ) : (
                            f.studentId
                          )}
                        </td>
                        <td>{f.feeType}</td>
                        <td>₹{Number(f.amount).toFixed(2)}</td>
                        <td>₹{Number(f.discountAmount || 0).toFixed(2)}</td>
                        <td className="fw-bold">₹{Number(f.netAmount).toFixed(2)}</td>
                        <td>{f.dueDate ? new Date(f.dueDate).toLocaleDateString() : '-'}</td>
                        <td>
                          <Badge bg={f.status === 'PAID' ? 'success' : f.status === 'OVERDUE' ? 'danger' : 'warning'}>
                            {f.status}
                          </Badge>
                        </td>
                        <td className="text-end">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => navigate(`/fees/${f.id}/edit`)}
                            title="Edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          {(f.status === 'PENDING' || f.status === 'OVERDUE') && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              className="me-2"
                              onClick={() => handlePay(f)}
                              title="Mark Paid"
                            >
                              <i className="bi bi-cash-coin"></i>
                            </Button>
                          )}
                          {f.status !== 'PAID' && (
                            <Button
                              variant="outline-warning"
                              size="sm"
                              className="me-2"
                              onClick={() => handleDiscount(f)}
                              title="Apply Discount"
                            >
                              <i className="bi bi-percent"></i>
                            </Button>
                          )}
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(f)}
                            title="Delete"
                          >
                            <i className="bi bi-trash"></i>
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
      </Container>
    </Layout>
  );
};
