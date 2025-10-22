import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Form, Badge, ProgressBar, Alert, Spinner } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { parentService, AttendanceSummary } from '../services/parentService';
import { studentService } from '../services/studentService';
import { timetableService } from '../services/timetableService';
import { useSearchParams } from 'react-router-dom';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/parent/children', label: 'My Children', icon: 'bi-people' },
  { path: '/parent/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
  { path: '/parent/performance', label: 'Performance', icon: 'bi-star' },
  { path: '/parent/fees', label: 'Fee Payments', icon: 'bi-cash-coin' },
  { path: '/parent/notifications', label: 'Notifications', icon: 'bi-bell' },
];

export const ParentAttendance: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [children, setChildren] = useState<Array<{ id: string; name: string; className?: string }>>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [attendanceRecords, setAttendanceRecords] = useState<{ date: string; status: string }[]>([]);
  const [timeSlotsByDay, setTimeSlotsByDay] = useState<Record<string, Record<string, { start: string; end: string }>>>({});
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0, percentage: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadChildren = async () => {
      try {
        setLoading(true); setError('');
        const list = await parentService.getMyChildren();
        const items = (list || []).map((c: any) => ({ id: c.id, name: `${c.firstName || ''} ${c.lastName || ''}`.trim(), className: c.className }));
        setChildren(items);
        if (!selectedChild && items.length) {
          const qChild = searchParams.get('child');
          setSelectedChild(qChild && items.some(i => i.id === qChild) ? qChild : items[0].id);
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load children');
      } finally {
        setLoading(false);
      }
    };
    loadChildren();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const loadAttendance = async () => {
      if (!selectedChild) return;
      try {
        setLoading(true); setError('');
        // Build timetable slot map for child's class for time lookup per period
        try {
          const stud = await studentService.getStudentById(selectedChild);
          const classId = (stud as any).classId;
          const section = (stud as any).section;
          const tt = await timetableService.getByClass(classId, section);
          const map: Record<string, Record<string, { start: string; end: string }>> = {};
          (tt.entries || []).forEach((e: any) => {
            const day = String(e.day || '').toUpperCase();
            if (!map[day]) map[day] = {};
            map[day][e.period] = { start: String(e.startTime||'').slice(0,5), end: String(e.endTime||'').slice(0,5) };
          });
          setTimeSlotsByDay(map);
        } catch {}
        const start = new Date(selectedYear, selectedMonth, 1);
        const end = new Date(selectedYear, selectedMonth + 1, 0);
        const toISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const summary: AttendanceSummary = await parentService.getChildAttendance(selectedChild, toISO(start), toISO(end));
        const recs = (summary.records || []).map((r: any) => ({ date: r.date, status: r.status, subject: r.subject, period: r.period }))
          .filter((r) => {
            const dt = new Date(r.date);
            return dt.getMonth() === selectedMonth && dt.getFullYear() === selectedYear;
          })
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const present = recs.filter(r => r.status === 'PRESENT').length;
        const absent = recs.filter(r => r.status === 'ABSENT').length;
        const late = recs.filter(r => r.status === 'LATE').length;
        const total = recs.length;

        setAttendanceRecords(recs);
        setStats({
          total,
          present,
          absent,
          late,
          percentage: total > 0 ? Math.round(((present + late) / total) * 100) : 0
        });
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load attendance');
      } finally {
        setLoading(false);
      }
    };
    loadAttendance();
  }, [selectedChild, selectedMonth, selectedYear]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PRESENT': return <Badge bg="success">Present</Badge>;
      case 'ABSENT': return <Badge bg="danger">Absent</Badge>;
      case 'LATE': return <Badge bg="warning">Late</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>Attendance</h2>
            <p className="text-muted">Track your children's attendance</p>
          </div>

          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Select Child</Form.Label>
                    <Form.Select value={selectedChild} onChange={(e) => setSelectedChild(e.target.value)}>
                      {children.map(child => (
                        <option key={child.id} value={child.id}>{child.name}{child.className ? ` - ${child.className}` : ''}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Month</Form.Label>
                    <Form.Select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                      {months.map((month, index) => (
                        <option key={index} value={index}>{month}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Year</Form.Label>
                    <Form.Select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : (
            <>
              {error && <Alert variant="danger">{error}</Alert>}
              <Row className="mb-4">
                <Col md={3}>
                  <Card className="border-0 shadow-sm text-center">
                    <Card.Body>
                      <h6 className="text-muted">Total Days</h6>
                      <h3>{stats.total}</h3>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="border-0 shadow-sm text-center">
                    <Card.Body>
                      <h6 className="text-muted">Present</h6>
                      <h3 className="text-success">{stats.present}</h3>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="border-0 shadow-sm text-center">
                    <Card.Body>
                      <h6 className="text-muted">Absent</h6>
                      <h3 className="text-danger">{stats.absent}</h3>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <h6 className="text-muted mb-2">Attendance Rate</h6>
                      <h3 className="mb-2">{stats.percentage}%</h3>
                      <ProgressBar 
                        now={stats.percentage} 
                        variant={stats.percentage >= 90 ? 'success' : stats.percentage >= 75 ? 'primary' : 'danger'}
                      />
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">Attendance Records - {months[selectedMonth]} {selectedYear}</h5>
                </Card.Header>
                <Card.Body>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Day</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.map((record, index) => {
                        const date = new Date(record.date);
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        const dayKey = dayNames[date.getDay()].toUpperCase();
                        return (
                          <tr key={index}>
                            <td>{date.toLocaleDateString()}</td>
                            <td>{dayNames[date.getDay()]}</td>
                            <td>{getStatusBadge(record.status)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </>
          )}
        </Col>
      </Row>
    </Layout>
  );
};
