import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Alert, Spinner } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { timetableService } from '../services/timetableService';
import { studentService } from '../services/studentService';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/student/assignments', label: 'Assignments', icon: 'bi-file-text' },
  { path: '/student/exams', label: 'Exams & Results', icon: 'bi-clipboard-check' },
  { path: '/student/attendance', label: 'My Attendance', icon: 'bi-calendar-check' },
  { path: '/student/timetable', label: 'Timetable', icon: 'bi-calendar3' },
  { path: '/student/fees', label: 'Fee Payment', icon: 'bi-cash-coin' },
  { path: '/student/notifications', label: 'Notifications', icon: 'bi-bell' },
];

export const StudentTimetable: React.FC = () => {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTimetable();
  }, [user?.email]);

  const loadTimetable = async () => {
    setLoading(true);
    try {
      const me = await studentService.getStudentByEmail(user?.email || '');
      const classId = (me as any).classId;
      const section = (me as any).section;
      const tt = await timetableService.getByClass(classId, section);
      // Transform to UI grid {DAY: [{period,time,subject,teacher,room}, ...]}
      const byDay: any = {};
      const order: Record<string, number> = {};
      (tt.entries || []).forEach((e: any, idx: number) => {
        const day = (e.day || '').toUpperCase();
        if (!byDay[day]) byDay[day] = [];
        const time = `${(e.startTime || '').slice(0,5)}-${(e.endTime || '').slice(0,5)}`;
        byDay[day].push({
          period: e.period || String(idx + 1),
          time,
          subject: e.subjectName,
          teacher: e.teacherName,
          room: e.room,
          periodType: e.periodType,
        });
        if (!(time in order)) order[time] = Object.keys(order).length;
      });
      // Sort each day's entries by start time
      Object.keys(byDay).forEach((d) => {
        byDay[d].sort((a: any, b: any) => a.time.localeCompare(b.time));
      });
      setTimetable(byDay);
    } catch (e: any) {
      setError('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>My Timetable</h2>
            <p className="text-muted">Your weekly class schedule for Academic Year 2024-2025</p>
          </div>

          <Alert variant="info" className="mb-4">
            <i className="bi bi-info-circle me-2"></i>
            This is your class section timetable for the current academic year.
          </Alert>

          {error && <Alert variant="danger">{error}</Alert>}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-0">
                <Table responsive bordered className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th style={{ width: '120px' }}>Time</th>
                      {days.map(day => (
                        <th key={day} className="text-center">{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timetable.MONDAY && timetable.MONDAY.map((_: any, periodIndex: number) => (
                      <tr key={periodIndex}>
                        <td className="fw-bold bg-light">{timetable.MONDAY[periodIndex].time}</td>
                        {days.map(day => {
                          const period = timetable[day]?.[periodIndex];
                          if (!period) return <td key={day}>—</td>;
                          if (period.period === 'BREAK') {
                            return (
                              <td key={day} className="text-center bg-warning bg-opacity-10">
                                <strong>BREAK</strong>
                              </td>
                            );
                          }
                          return (
                            <td key={day}>
                              <div className="p-2">
                                <Badge bg="primary" className="mb-1">{period.subject}</Badge>
                                <br />
                                <small className="text-muted">{period.teacher}</small>
                                <br />
                                <small className="text-muted"><i className="bi bi-geo-alt me-1"></i>{period.room}</small>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Layout>
  );
};
