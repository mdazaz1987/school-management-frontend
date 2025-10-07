import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Badge, Form } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { timetableService } from '../services/timetableService';
import { teacherService } from '../services/teacherService';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/teacher/my-classes', label: 'My Classes', icon: 'bi-door-open' },
  { path: '/teacher/assignments', label: 'Assignments', icon: 'bi-file-text' },
  { path: '/teacher/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
  { path: '/teacher/grading', label: 'Grading', icon: 'bi-star' },
  { path: '/teacher/timetable', label: 'My Timetable', icon: 'bi-calendar3' },
  { path: '/teacher/students', label: 'Students', icon: 'bi-people' },
];

export const TeacherTimetable: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedule, setSchedule] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = localStorage.getItem('user');
        const me = stored ? JSON.parse(stored) : {};
        const schoolId = me?.schoolId;

        // Resolve current Teacher entity ID (not the User ID)
        const myProfile = await teacherService.getMyProfile().catch(() => null as any);
        const teacherId = myProfile?.id; // Teacher entity id
        const userId = me?.id; // User id (legacy may be stored in timetable)

        const all = await timetableService.list(schoolId ? { schoolId } : undefined);
        const day = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
        
        // Flatten all timetable entries
        let entries = (all || [])
          .flatMap((t: any) => (t.entries || []).map((e: any) => ({ ...e, classId: t.classId, className: t.className })))
          .filter((e: any) => String(e.day).toUpperCase() === day)
          .filter((e: any) => {
            if (teacherId && e.teacherId === teacherId) return true;
            if (userId && e.teacherId === userId) return true;
            return false;
          });
        
        // Build friendly class name map
        const myClasses = await teacherService.getMyClasses().catch(() => [] as any[]);
        const nameMap = new Map<string, string>((myClasses || []).map((c: any) => [c.id, (c.name || c.className || `${c.grade || 'Class'}${c.section ? ' - ' + c.section : ''}`)]));

        const toHHMM = (s: string) => String(s || '').slice(0,5);
        const diffMinutes = (start?: string, end?: string) => {
          if (!start || !end) return '';
          const [sh, sm] = toHHMM(start).split(':').map(Number);
          const [eh, em] = toHHMM(end).split(':').map(Number);
          const mins = (eh*60+em) - (sh*60+sm);
          if (mins <= 0) return '';
          const h = Math.floor(mins/60); const m = mins%60;
          return h > 0 ? `${h}h${m?` ${m}m`:''}` : `${m}m`;
        };

        const mapped = entries
          .map((e: any) => ({
            time: toHHMM(e.startTime),
            duration: diffMinutes(e.startTime, e.endTime),
            class: nameMap.get(e.classId) || e.className || e.classId,
            subject: e.subjectName || '—',
            room: e.room || '—',
          }))
          .sort((a: any, b: any) => a.time.localeCompare(b.time));
        setSchedule(mapped);
      } catch {
        setSchedule([]);
      }
    };
    load();
  }, [selectedDate]);

  const getPeriodStatus = (time: string, date: string) => {
    const now = new Date();
    const selectedDateTime = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    const periodTime = new Date(selectedDateTime);
    periodTime.setHours(hours, minutes);

    if (selectedDateTime.toDateString() < now.toDateString()) {
      return 'completed';
    }
    if (selectedDateTime.toDateString() > now.toDateString()) {
      return 'upcoming';
    }
    if (periodTime < now) {
      return 'missed';
    }
    if (periodTime.getTime() - now.getTime() < 3600000) {
      return 'current';
    }
    return 'upcoming';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge bg="success">Completed</Badge>;
      case 'missed': return <Badge bg="danger">Missed</Badge>;
      case 'current': return <Badge bg="primary">In Progress</Badge>;
      case 'upcoming': return <Badge bg="info">Upcoming</Badge>;
      default: return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const selectedDayOfWeek = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
  const todaySchedule = schedule;

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>My Timetable</h2>
            <p className="text-muted">View your teaching schedule</p>
          </div>

          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Form.Group>
                <Form.Label><strong>Select Date</strong></Form.Label>
                <Form.Control
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ maxWidth: '300px' }}
                />
              </Form.Group>
              <div className="mt-2">
                <Badge bg="primary">{selectedDayOfWeek}</Badge>
                {todaySchedule.length > 0 && (
                  <Badge bg="info" className="ms-2">{todaySchedule.length} classes</Badge>
                )}
              </div>
            </Card.Body>
          </Card>

          {todaySchedule.length > 0 ? (
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Schedule for {selectedDayOfWeek}, {new Date(selectedDate).toLocaleDateString()}</h5>
              </Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Duration</th>
                      <th>Class</th>
                      <th>Subject</th>
                      <th>Room</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todaySchedule.map((period, index) => {
                      const status = getPeriodStatus(period.time, selectedDate);
                      return (
                        <tr key={index}>
                          <td><strong>{period.time}</strong></td>
                          <td>{period.duration}</td>
                          <td>{period.class}</td>
                          <td><Badge bg="secondary">{period.subject}</Badge></td>
                          <td><i className="bi bi-geo-alt me-1"></i>{period.room}</td>
                          <td>{getStatusBadge(status)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center py-5">
                <i className="bi bi-calendar-x fs-1 text-muted mb-3"></i>
                <p className="text-muted">No classes scheduled for this day</p>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Layout>
  );
};
