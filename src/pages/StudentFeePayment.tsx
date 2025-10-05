import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
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

export const StudentFeePayment: React.FC = () => {
  const { user } = useAuth();
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('');

  useEffect(() => {
    loadFees();
  }, [user?.email]);

  const loadFees = async () => {
    setLoading(true);
    try {
      // Mock fee data
      const mockFees = [
        {
          id: '1',
          feeType: 'Tuition Fee',
          term: 'First Term 2024-2025',
          amount: 50000,
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          description: 'Tuition fee for first term'
        },
        {
          id: '2',
          feeType: 'Library Fee',
          term: 'Annual 2024-2025',
          amount: 2000,
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          description: 'Annual library membership'
        },
        {
          id: '3',
          feeType: 'Examination Fee',
          term: 'Mid-Term 2024',
          amount: 3000,
          dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'paid',
          paidDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          transactionId: 'TXN123456789',
          description: 'Mid-term examination fee'
        },
        {
          id: '4',
          feeType: 'Sports Fee',
          term: 'Annual 2024-2025',
          amount: 5000,
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'overdue',
          description: 'Annual sports activity fee'
        }
      ];
      setFees(mockFees);
    } catch (e: any) {
      setError('Failed to load fee information');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    // Mock payment processing
    alert(`Payment processed successfully!\nAmount: ₹${selectedFee.amount}\nMethod: ${paymentMethod}`);
    setShowPaymentModal(false);
    loadFees();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge bg="warning">Pending</Badge>;
      case 'paid': return <Badge bg="success">Paid</Badge>;
      case 'overdue': return <Badge bg="danger">Overdue</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
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
            <h2>Fee Payment</h2>
            <p className="text-muted">Manage your fee payments</p>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          {/* Summary Cards */}
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
                  <h6 className="text-muted mb-2">Overdue</h6>
                  <h3 className="mb-0 text-danger">{fees.filter(f => f.status === 'overdue').length}</h3>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : (
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
                      <tr key={fee.id} className={fee.status === 'overdue' ? 'table-danger' : ''}>
                        <td>
                          <strong>{fee.feeType}</strong>
                          <br />
                          <small className="text-muted">{fee.description}</small>
                        </td>
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
                              variant={fee.status === 'overdue' ? 'danger' : 'primary'}
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
          )}
        </Col>
      </Row>

      {/* Payment Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Make Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedFee && (
            <>
              <div className="mb-3">
                <h5>{selectedFee.feeType}</h5>
                <p className="text-muted mb-1">{selectedFee.description}</p>
                <p className="mb-0">Term: {selectedFee.term}</p>
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
