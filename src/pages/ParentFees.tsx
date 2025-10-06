import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Form, Badge, Button, Modal, Spinner, Alert } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { parentService } from '../services/parentService';
import { feeService } from '../services/feeService';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/parent/children', label: 'My Children', icon: 'bi-people' },
  { path: '/parent/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
  { path: '/parent/performance', label: 'Performance', icon: 'bi-star' },
  { path: '/parent/fees', label: 'Fee Payments', icon: 'bi-cash-coin' },
  { path: '/parent/notifications', label: 'Notifications', icon: 'bi-bell' },
];

export const ParentFees: React.FC = () => {
  const [children, setChildren] = useState<Array<{ id: string; name: string; className?: string }>>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('');

  useEffect(() => {
    const loadChildren = async () => {
      try {
        setLoading(true); setError('');
        const list = await parentService.getMyChildren();
        const items = (list || []).map((c: any) => ({ id: c.id, name: `${c.firstName || ''} ${c.lastName || ''}`.trim(), className: c.className }));
        setChildren(items);
        if (!selectedChild && items.length) setSelectedChild(items[0].id);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load children');
      } finally {
        setLoading(false);
      }
    };
    loadChildren();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadFees = async () => {
      if (!selectedChild) return;
      try {
        setLoading(true); setError('');
        const list = await feeService.listByStudent(selectedChild);
        // Normalize to UI structure
        const mapped = (list || []).map((f: any) => ({
          id: f.id,
          type: f.feeType,
          term: f.term || f.academicYear,
          amount: Number(f.netAmount ?? f.amount ?? 0),
          dueDate: f.dueDate,
          status: (f.status || '').toString().toLowerCase(),
          paidDate: f.paidDate,
          receiptNumber: f.receiptNumber,
        }));
        setFees(mapped);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load fees');
      } finally {
        setLoading(false);
      }
    };
    loadFees();
  }, [selectedChild]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge bg="warning">Pending</Badge>;
      case 'paid': return <Badge bg="success">Paid</Badge>;
      case 'overdue': return <Badge bg="danger">Overdue</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const handlePayment = async () => {
    if (!selectedFee || !paymentMethod) return;
    try {
      setLoading(true);
      await feeService.pay(selectedFee.id, { paymentMethod, transactionId: undefined });
      // Refresh fees
      const list = await feeService.listByStudent(selectedChild);
      const mapped = (list || []).map((f: any) => ({
        id: f.id,
        type: f.feeType,
        term: f.term || f.academicYear,
        amount: Number(f.netAmount ?? f.amount ?? 0),
        dueDate: f.dueDate,
        status: (f.status || '').toString().toLowerCase(),
        paidDate: f.paidDate,
        receiptNumber: f.receiptNumber,
      }));
      setFees(mapped);
      setShowPaymentModal(false);
      setPaymentMethod('');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const totalPending = fees.filter(f => f.status === 'pending' || f.status === 'overdue').reduce((sum, f) => sum + f.amount, 0);
  const totalPaid = fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>Fee Payments</h2>
            <p className="text-muted">Manage fee payments for your children</p>
          </div>

          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Form.Group>
                <Form.Label>Select Child</Form.Label>
                <Form.Select value={selectedChild} onChange={(e) => setSelectedChild(e.target.value)}>
                  {children.map(child => (
                    <option key={child.id} value={child.id}>{child.name}{child.className ? ` - ${child.className}` : ''}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Card.Body>
          </Card>

          {error && (
            <Alert variant="danger">{error}</Alert>
          )}

          {loading && (
            <div className="text-center py-2"><Spinner animation="border" /></div>
          )}

          <Row className="mb-4">
            <Col md={4}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <h6 className="text-muted mb-2">Total Pending</h6>
                  <h3 className="mb-0 text-warning">₹{totalPending.toLocaleString()}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <h6 className="text-muted mb-2">Total Paid</h6>
                  <h3 className="mb-0 text-success">₹{totalPaid.toLocaleString()}</h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <h6 className="text-muted mb-2">Pending Items</h6>
                  <h3 className="mb-0 text-danger">{fees.filter(f => f.status === 'pending' || f.status === 'overdue').length}</h3>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Fee Details</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Fee Type</th>
                    <th>Term/Period</th>
                    <th>Amount</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((fee) => (
                    <tr key={fee.id}>
                      <td><strong>{fee.type}</strong></td>
                      <td>{fee.term}</td>
                      <td className="fw-bold">₹{fee.amount.toLocaleString()}</td>
                      <td>
                        {new Date(fee.dueDate).toLocaleDateString()}
                        {fee.paidDate && (
                          <>
                            <br />
                            <small className="text-success">Paid: {new Date(fee.paidDate).toLocaleDateString()}</small>
                          </>
                        )}
                      </td>
                      <td>{getStatusBadge(fee.status)}</td>
                      <td>
                        {fee.status === 'paid' ? (
                          <Button size="sm" variant="outline-primary">
                            <i className="bi bi-download me-1"></i>
                            Receipt
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setSelectedFee(fee);
                              setShowPaymentModal(true);
                            }}
                          >
                            <i className="bi bi-credit-card me-1"></i>
                            Pay Now
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Make Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedFee && (
            <>
              <div className="mb-3">
                <h5>{selectedFee.type}</h5>
                <p className="text-muted mb-0">Term: {selectedFee.term}</p>
              </div>
              <hr />
              <div className="mb-3">
                <h4>Amount to Pay: <span className="text-primary">₹{selectedFee.amount.toLocaleString()}</span></h4>
              </div>
              <Form.Group className="mb-3">
                <Form.Label>Payment Method</Form.Label>
                <Form.Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="">Select payment method...</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="upi">UPI</option>
                  <option value="net_banking">Net Banking</option>
                </Form.Select>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handlePayment} disabled={!paymentMethod}>
            <i className="bi bi-check-lg me-2"></i>
            Proceed to Payment
          </Button>
        </Modal.Footer>
      </Modal>
    </Layout>
  );
};
