import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Table, Badge, Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { studentService } from '../services/studentService';
import { feeService } from '../services/feeService';
import { schoolService } from '../services/schoolService';

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
  const [student, setStudent] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [summary, setSummary] = useState<{ totalPaid: number; totalDue: number; pendingCount: number; totalFees: number }>({ totalPaid: 0, totalDue: 0, pendingCount: 0, totalFees: 0 });
  const [yearFilter, setYearFilter] = useState<string>('');

  useEffect(() => {
    loadFees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, yearFilter]);

  const loadFees = async () => {
    setLoading(true);
    try {
      const me = await studentService.getStudentByEmail(user?.email || '');
      setStudent(me);
      const studentId = (me as any).id;
      // Load school once
      if (user?.schoolId && !school) {
        try { setSchool(await schoolService.getPublicBasic(user.schoolId)); } catch {}
      }
      const items = await feeService.listByStudent(studentId, yearFilter ? { academicYear: yearFilter } as any : undefined);
      const normalized = (items || []).map((f: any) => ({
        id: f.id,
        feeType: f.feeType,
        term: f.term || f.academicYear,
        amount: f.amount,
        dueDate: f.dueDate,
        status: (f.status || 'PENDING').toString().toLowerCase(),
        description: f.feeDescription || '',
        paidDate: f.paidDate,
        transactionId: f.transactionId,
        receiptNumber: f.receiptNumber,
        academicYear: f.academicYear,
        discountAmount: f.discountAmount || f.discount,
        netAmount: f.netAmount || f.finalAmount,
      }));
      setFees(normalized);
      // Load summary (paid vs due)
      try {
        const s = await feeService.studentSummary(studentId, yearFilter ? { academicYear: yearFilter } : undefined) as any;
        // feeService.studentSummary returns any; adjust usage
        setSummary({
          totalPaid: s?.totalPaid || 0,
          totalDue: s?.totalDue || 0,
          pendingCount: s?.pendingCount || 0,
          totalFees: s?.totalFees || 0,
        });
      } catch {}
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

  const academicYears = useMemo(() => Array.from(new Set((fees || []).map(f => f.academicYear).filter(Boolean))), [fees]);
  const totalPending = summary.totalDue;
  const totalPaid = summary.totalPaid;

  const handlePrintReceipt = async (fee: any) => {
    try {
      const me = student || (await studentService.getStudentByEmail(user?.email || ''));
      const sch = school || (user?.schoolId ? await schoolService.getPublicBasic(user.schoolId) : null);
      const original = Number(fee.amount ?? 0);
      const discount = Number(fee.discountAmount ?? 0);
      const net = Number(fee.netAmount ?? (original - discount));
      const configuredRate = Number((sch as any)?.configuration?.gstRate);
      const gstRate = isFinite(configuredRate) && configuredRate > 0 ? configuredRate : 0.18; // default 18%
      const base = net / (1 + gstRate);
      const halfRate = gstRate / 2;
      const cgst = base * halfRate;
      const sgst = base * halfRate;
      const gstin = (sch as any)?.configuration?.gstin;
      const principalName = (sch as any)?.configuration?.principalName;
      const principalSignatureUrl = (sch as any)?.configuration?.principalSignatureUrl;
      const html = `<!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Fee Receipt ${fee.receiptNumber || ''}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          .header { display:flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
          .school { font-size: 18px; font-weight: bold; }
          .meta { color:#555; font-size: 12px; }
          table { width:100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border:1px solid #ddd; padding:8px; font-size: 13px; }
          th { background:#f8f9fa; text-align:left; }
          .totals td { font-weight:bold; }
          .right { text-align:right; }
          .center { text-align:center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="school">${sch?.name || 'School'}</div>
            <div class="meta">ID: ${sch?.id || '-'}</div>
            <div class="meta">${sch?.address?.street || ''} ${sch?.address?.city || ''} ${sch?.address?.state || ''} ${sch?.address?.zipCode || ''}</div>
            <div class="meta">${sch?.contactInfo?.email || ''} ${sch?.contactInfo?.phone || ''}</div>
            ${gstin ? `<div class="meta">GSTIN: ${gstin}</div>` : ''}
          </div>
          <div class="meta right">
            <div>Receipt No: <strong>${fee.receiptNumber || '-'}</strong></div>
            <div>Date: <strong>${fee.paidDate ? new Date(fee.paidDate).toLocaleDateString() : new Date().toLocaleDateString()}</strong></div>
          </div>
        </div>
        <hr />
        <div class="meta">
          Student: <strong>${(me as any)?.firstName || ''} ${(me as any)?.lastName || ''}</strong> | Admission No: ${(me as any)?.admissionNumber || '-'} | Class: ${(me as any)?.className || (me as any)?.classId || '-'} | Section: ${(me as any)?.section || '-'}
        </div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Term</th>
              <th>Academic Year</th>
              <th class="right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${fee.feeType} ${fee.description ? `- ${fee.description}` : ''}</td>
              <td>${fee.term || '-'}</td>
              <td>${fee.academicYear || '-'}</td>
              <td class="right">${original.toFixed(2)}</td>
            </tr>
            ${discount ? `<tr><td colspan="3">Discount</td><td class="right">- ${discount.toFixed(2)}</td></tr>` : ''}
            <tr class="totals"><td colspan="3">Taxable Amount</td><td class="right">${base.toFixed(2)}</td></tr>
            <tr><td colspan="2">CGST (${(halfRate*100).toFixed(2)}%)</td><td class="right" colspan="2">₹ ${cgst.toFixed(2)}</td></tr>
            <tr><td colspan="2">SGST (${(halfRate*100).toFixed(2)}%)</td><td class="right" colspan="2">₹ ${sgst.toFixed(2)}</td></tr>
            <tr class="totals"><td colspan="3">Grand Total</td><td class="right">₹ ${net.toFixed(2)}</td></tr>
          </tbody>
        </table>
        <p class="meta">Payment Method: ${fee.paymentMethod || '-'} | Transaction: ${fee.transactionId || '-'}</p>
        <div style="display:flex; justify-content: space-between; align-items: flex-end; margin-top: 24px;">
          <div></div>
          <div class="meta center" style="min-width: 220px;">
            ${principalSignatureUrl ? `<img src="${principalSignatureUrl}" alt="Principal Signature" style="max-height:60px;" />` : ''}
            <div style="border-top: 1px solid #ccc; margin-top: 8px; padding-top: 4px;">${principalName || 'Principal'}</div>
          </div>
        </div>
        <p class="center" style="margin-top: 12px;">This is a computer generated receipt.</p>
        <script>window.print(); setTimeout(() => window.close(), 300);</script>
      </body>
      </html>`;
      const w = window.open('', '_blank');
      if (!w) return;
      w.document.open();
      w.document.write(html);
      w.document.close();
    } catch (e) {
      // ignore
    }
  };

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4 d-flex justify-content-between align-items-end">
            <div>
              <h2>My Fee Payment</h2>
              <p className="text-muted">View and manage your fee payments</p>
            </div>
            <div style={{ minWidth: 240 }}>
              <Form.Label><strong>Academic Year</strong></Form.Label>
              <Form.Select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                <option value="">All</option>
                {academicYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Form.Select>
            </div>
          </div>

          <Alert variant="info" className="mb-4">
            <i className="bi bi-info-circle me-2"></i>
            This page shows only your fee information. Contact the admin office for any fee-related queries.
          </Alert>

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
                  <h6 className="text-muted mb-2">Pending Count</h6>
                  <h3 className="mb-0 text-danger">{summary.pendingCount}</h3>
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
                            <Button size="sm" variant="outline-primary" onClick={() => handlePrintReceipt(fee)}>
                              <i className="bi bi-printer me-1"></i>
                              Print Receipt
                            </Button>
                          ) : (
                            <Badge bg={fee.status === 'overdue' ? 'danger' : 'secondary'}>
                              {fee.status === 'overdue' ? 'Overdue' : 'Pending'}
                            </Badge>
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
