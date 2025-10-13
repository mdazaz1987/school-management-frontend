import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Form, Badge, Button, Modal, Spinner, Alert } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { parentService } from '../services/parentService';
import { feeService } from '../services/feeService';
import { schoolService } from '../services/schoolService';
import { resolveUrl } from '../services/api';

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
  const [childDetail, setChildDetail] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);

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
        // load child details and school info for receipts
        try {
          const child = await parentService.getChildDetails(selectedChild);
          setChildDetail(child);
          if (child?.schoolId) {
            try { setSchool(await schoolService.getPublicBasic(child.schoolId)); } catch {}
          }
        } catch {}
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
          description: (f as any).feeDescription,
          academicYear: f.academicYear,
          paymentMethod: f.paymentMethod,
          transactionId: f.transactionId,
          netAmount: f.netAmount,
          discountAmount: f.discountAmount,
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
                <Form.Select aria-label="Select Child" value={selectedChild} onChange={(e) => setSelectedChild(e.target.value)}>
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
                          <Button size="sm" variant="outline-primary" onClick={() => handlePrintReceipt(fee)}>
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

// Receipt printing logic
function handlePrintReceipt(fee: any) {
  // Open a window immediately to avoid popup blockers, then populate after fetches complete
  try {
    const w = window.open('', '_blank');
    if (!w) return;
    try {
      w.document.open();
      w.document.write(`<!doctype html><html><head><meta charset="utf-8" /><title>Generating Receipt...</title></head><body style="font-family:Arial, sans-serif; padding:24px;"><p>Generating receipt...</p></body></html>`);
      w.document.close();
    } catch {}

    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : {};
    const childId = (document.querySelector('select[aria-label="Select Child"]') as HTMLSelectElement)?.value || '';
    const fetchAll = async () => {
      const child = childId ? await parentService.getChildDetails(childId) : null;
      const sch = (child as any)?.schoolId ? await schoolService.getPublicBasic((child as any).schoolId) : null;
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

      const principalSignatureUrlAbs = resolveUrl(String(principalSignatureUrl || ''));
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
          Student: <strong>${(child as any)?.firstName || (child as any)?.studentName || (child as any)?.name || ''} ${(child as any)?.lastName || (child as any)?.studentLastName || ''}</strong> | Admission No: ${(child as any)?.admissionNumber || (child as any)?.admissionNo || (child as any)?.studentAdmissionNo || '-'} | Class: ${(child as any)?.className || (child as any)?.class || (child as any)?.studentClass || '-'} | Section: ${(child as any)?.section || (child as any)?.studentSection || '-'}
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
              <td>${fee.type} ${fee.description ? `- ${fee.description}` : ''}</td>
              <td>${fee.term || '-'}</td>
              <td>${fee.academicYear || '-'}</td>
              <td class="right">${Number(fee.amount ?? net).toFixed(2)}</td>
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
            ${principalSignatureUrl ? `<img src="${principalSignatureUrlAbs}" alt="Principal Signature" style="max-height:60px;" />` : ''}
            <div style="border-top: 1px solid #ccc; margin-top: 8px; padding-top: 4px;">${principalName || 'Principal'}</div>
          </div>
        </div>
        <p class="center" style="margin-top: 12px;">This is a computer generated receipt.</p>
        <script>window.print(); setTimeout(() => window.close(), 300);</script>
      </body>
      </html>`;
      try {
        w.document.open();
        w.document.write(html);
        w.document.close();
      } catch {}
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchAll().catch(() => {
      try {
        w.document.open();
        w.document.write('<!doctype html><html><head><meta charset="utf-8" /><title>Receipt Error</title></head><body style="font-family:Arial, sans-serif; padding:24px;"><h3>Unable to generate receipt</h3><p>Please try again.</p></body></html>');
        w.document.close();
      } catch {}
    });
  } catch {}
}
