import React, { useState } from 'react';
import { Row, Col, Card, Table, Form, Badge, Button, Modal } from 'react-bootstrap';
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

export const ParentFees: React.FC = () => {
  const [selectedChild, setSelectedChild] = useState('1');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('');

  const children = [
    { id: '1', name: 'John Doe', class: 'Class 10 - A' },
    { id: '2', name: 'Jane Doe', class: 'Class 8 - B' }
  ];

  const fees = [
    {
      id: '1',
      type: 'Tuition Fee',
      term: 'Second Term 2024-2025',
      amount: 50000,
      dueDate: '2025-03-31',
      status: 'pending'
    },
    {
      id: '2',
      type: 'Examination Fee',
      term: 'Mid-Term 2024',
      amount: 3000,
      dueDate: '2025-02-15',
      status: 'pending'
    },
    {
      id: '3',
      type: 'Tuition Fee',
      term: 'First Term 2024-2025',
      amount: 50000,
      dueDate: '2024-12-31',
      status: 'paid',
      paidDate: '2024-12-15',
      transactionId: 'TXN123456'
    },
    {
      id: '4',
      type: 'Library Fee',
      term: 'Annual 2024-2025',
      amount: 2000,
      dueDate: '2024-11-30',
      status: 'paid',
      paidDate: '2024-11-20',
      transactionId: 'TXN789012'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge bg="warning">Pending</Badge>;
      case 'paid': return <Badge bg="success">Paid</Badge>;
      case 'overdue': return <Badge bg="danger">Overdue</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const handlePayment = () => {
    alert(`Payment processed successfully!\nAmount: ₹${selectedFee.amount}\nMethod: ${paymentMethod}`);
    setShowPaymentModal(false);
  };

  const totalPending = fees.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0);
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
                    <option key={child.id} value={child.id}>{child.name} - {child.class}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Card.Body>
          </Card>

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
                  <h3 className="mb-0 text-danger">{fees.filter(f => f.status === 'pending').length}</h3>
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
