import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Alert, Spinner } from 'react-bootstrap';
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
      // Mock timetable data
      const mockTimetable = {
        MONDAY: [
          { period: '1', time: '09:00-10:00', subject: 'Mathematics', teacher: 'Mr. Smith', room: '101' },
          { period: '2', time: '10:00-11:00', subject: 'Physics', teacher: 'Dr. Johnson', room: 'Lab 1' },
          { period: 'BREAK', time: '11:00-11:30', subject: 'Break', teacher: '', room: '' },
          { period: '3', time: '11:30-12:30', subject: 'Chemistry', teacher: 'Ms. Davis', room: 'Lab 2' },
          { period: '4', time: '12:30-01:30', subject: 'English', teacher: 'Ms. Williams', room: '203' },
        ],
        TUESDAY: [
          { period: '1', time: '09:00-10:00', subject: 'English', teacher: 'Ms. Williams', room: '203' },
          { period: '2', time: '10:00-11:00', subject: 'Mathematics', teacher: 'Mr. Smith', room: '101' },
          { period: 'BREAK', time: '11:00-11:30', subject: 'Break', teacher: '', room: '' },
          { period: '3', time: '11:30-12:30', subject: 'Computer Science', teacher: 'Mr. Brown', room: 'Lab 3' },
          { period: '4', time: '12:30-01:30', subject: 'History', teacher: 'Dr. Wilson', room: '205' },
        ],
        WEDNESDAY: [
          { period: '1', time: '09:00-10:00', subject: 'Physics', teacher: 'Dr. Johnson', room: 'Lab 1' },
          { period: '2', time: '10:00-11:00', subject: 'Chemistry', teacher: 'Ms. Davis', room: 'Lab 2' },
          { period: 'BREAK', time: '11:00-11:30', subject: 'Break', teacher: '', room: '' },
          { period: '3', time: '11:30-12:30', subject: 'Mathematics', teacher: 'Mr. Smith', room: '101' },
          { period: '4', time: '12:30-01:30', subject: 'Physical Education', teacher: 'Coach Taylor', room: 'Ground' },
        ],
        THURSDAY: [
          { period: '1', time: '09:00-10:00', subject: 'History', teacher: 'Dr. Wilson', room: '205' },
          { period: '2', time: '10:00-11:00', subject: 'English', teacher: 'Ms. Williams', room: '203' },
          { period: 'BREAK', time: '11:00-11:30', subject: 'Break', teacher: '', room: '' },
          { period: '3', time: '11:30-12:30', subject: 'Computer Science', teacher: 'Mr. Brown', room: 'Lab 3' },
          { period: '4', time: '12:30-01:30', subject: 'Physics', teacher: 'Dr. Johnson', room: 'Lab 1' },
        ],
        FRIDAY: [
          { period: '1', time: '09:00-10:00', subject: 'Chemistry', teacher: 'Ms. Davis', room: 'Lab 2' },
          { period: '2', time: '10:00-11:00', subject: 'Mathematics', teacher: 'Mr. Smith', room: '101' },
          { period: 'BREAK', time: '11:00-11:30', subject: 'Break', teacher: '', room: '' },
          { period: '3', time: '11:30-12:30', subject: 'English', teacher: 'Ms. Williams', room: '203' },
          { period: '4', time: '12:30-01:30', subject: 'Library', teacher: 'Ms. Martin', room: 'Library' },
        ],
      };
      setTimetable(mockTimetable);
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
