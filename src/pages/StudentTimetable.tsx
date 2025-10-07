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
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    loadTimetable();
  }, [user?.email]);

  // Tick clock every minute for live highlighting
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const loadTimetable = async () => {
    setLoading(true);
    try {
      const me = await studentService.getStudentByEmail(user?.email || '');
      const classId = (me as any).classId;
      const section = (me as any).section;
      const tt = await timetableService.getByClass(classId, section);
      // Transform to UI grid {DAY: [{period,time,start,end,subject,teacher,room,periodType}, ...]}
      const byDay: any = {};
      const times = new Set<string>();
      (tt.entries || []).forEach((e: any, idx: number) => {
        const day = (e.day || '').toUpperCase();
        if (!byDay[day]) byDay[day] = [];
        const startStr = (e.startTime || '').slice(0,5);
        const endStr = (e.endTime || '').slice(0,5);
        const time = `${startStr}-${endStr}`;
        byDay[day].push({
          period: e.period || String(idx + 1),
          time,
          start: startStr,
          end: endStr,
          subject: e.subjectName,
          teacher: e.teacherName,
          room: e.room,
          periodType: e.periodType,
        });
        if (startStr && endStr) times.add(time);
      });
      // Sort each day's entries by time and compute global times list
      Object.keys(byDay).forEach((d) => {
        byDay[d].sort((a: any, b: any) => a.time.localeCompare(b.time));
      });
      const slots = Array.from(times).sort((a, b) => a.localeCompare(b));
      setTimetable(byDay);
      setTimeSlots(slots);
    } catch (e: any) {
      setError('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const toMinutes = (hhmm: string) => {
    if (!hhmm || hhmm.length < 4) return -1;
    const [h, m] = hhmm.split(':').map(Number);
    return (h * 60) + m;
  };

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
                        <th
                          key={day}
                          className={`text-center ${day === currentDay ? 'bg-primary text-white' : ''}`}
                        >
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map((slot, rowIdx) => (
                      <tr key={slot}>
                        <td className="fw-bold bg-light">{slot}</td>
                        {days.map(day => {
                          const period = (timetable[day] || []).find((p: any) => p.time === slot);
                          if (!period) return <td key={day}>—</td>;
                          const isBreak = period.periodType === 'BREAK' || period.periodType === 'LUNCH';
                          if (isBreak) {
                            return (
                              <td key={day} className="text-center bg-warning bg-opacity-10">
                                <strong>{period.periodType}</strong>
                              </td>
                            );
                          }
                          const nowMin = toMinutes(now.toTimeString().slice(0,5));
                          const startMin = toMinutes(period.start);
                          const endMin = toMinutes(period.end);
                          const inProgress = (day === currentDay) && startMin !== -1 && endMin !== -1 && nowMin >= startMin && nowMin < endMin;
                          return (
                            <td key={day} className={inProgress ? 'bg-success bg-opacity-25' : ''}>
                              <div className="p-2">
                                <Badge bg="primary" className="mb-1">{period.subject || '—'}</Badge>
                                <br />
                                <small className="text-muted">{period.teacher || ''}</small>
                                <br />
                                <small className="text-muted"><i className="bi bi-geo-alt me-1"></i>{period.room || ''}</small>
                                {inProgress && (
                                  <div className="mt-1">
                                    <Badge bg="success">In progress</Badge>
                                  </div>
                                )}
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
