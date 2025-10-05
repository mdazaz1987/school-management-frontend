import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Button, Form, Tabs, Tab } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/teacher/my-classes', label: 'My Classes', icon: 'bi-door-open' },
  { path: '/teacher/assignments', label: 'Assignments', icon: 'bi-file-text' },
  { path: '/teacher/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
  { path: '/teacher/grading', label: 'Grading', icon: 'bi-star' },
  { path: '/teacher/timetable', label: 'My Timetable', icon: 'bi-calendar3' },
  { path: '/teacher/students', label: 'Students', icon: 'bi-people' },
];

export const TeacherMyClasses: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('current');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const mockClasses = {
    current: [
      {
        id: '1',
        name: 'Grade 10-A',
        subject: 'Mathematics',
        students: 35,
        schedule: 'Mon, Wed, Fri - 09:00 AM',
        room: 'Room 101',
        academicYear: '2024-2025',
        term: 'Second Term'
      },
      {
        id: '2',
        name: 'Grade 10-B',
        subject: 'Mathematics',
        students: 32,
        schedule: 'Mon, Wed, Fri - 10:30 AM',
        room: 'Room 102',
        academicYear: '2024-2025',
        term: 'Second Term'
      },
      {
        id: '3',
        name: 'Grade 11-A',
        subject: 'Physics',
        students: 28,
        schedule: 'Tue, Thu - 02:00 PM',
        room: 'Lab 1',
        academicYear: '2024-2025',
        term: 'Second Term'
      }
    ],
    past: [
      {
        id: '4',
        name: 'Grade 9-A',
        subject: 'Mathematics',
        students: 30,
        schedule: 'Mon, Wed, Fri - 09:00 AM',
        room: 'Room 101',
        academicYear: '2023-2024',
        term: 'Second Term'
      }
    ],
    upcoming: []
  };

  const [classes, setClasses] = useState(mockClasses);

  const getClassesForDate = (date: string) => {
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
    return classes.current.filter(c => c.schedule.includes(dayOfWeek));
  };

  const selectedDateClasses = getClassesForDate(selectedDate);

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>My Classes</h2>
            <p className="text-muted">Manage your assigned classes</p>
          </div>

          {/* Date Selector */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Form.Group>
                <Form.Label><strong>Select Date to View Classes</strong></Form.Label>
                <Form.Control
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ maxWidth: '300px' }}
                />
              </Form.Group>
              {selectedDateClasses.length > 0 && (
                <div className="mt-3">
                  <Badge bg="info">{selectedDateClasses.length} classes on {new Date(selectedDate).toLocaleDateString()}</Badge>
                </div>
              )}
            </Card.Body>
          </Card>

          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'current')} className="mb-3">
            <Tab eventKey="current" title={`Current (${classes.current.length})`}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Class</th>
                        <th>Subject</th>
                        <th>Students</th>
                        <th>Schedule</th>
                        <th>Room</th>
                        <th>Term</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes.current.map((cls) => (
                        <tr key={cls.id}>
                          <td><strong>{cls.name}</strong></td>
                          <td><Badge bg="primary">{cls.subject}</Badge></td>
                          <td>{cls.students}</td>
                          <td><small>{cls.schedule}</small></td>
                          <td>{cls.room}</td>
                          <td><Badge bg="success">{cls.term}</Badge></td>
                          <td>
                            <Button variant="outline-primary" size="sm" className="me-2">
                              <i className="bi bi-eye"></i>
                            </Button>
                            <Button variant="outline-success" size="sm">
                              <i className="bi bi-calendar-check"></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="past" title={`Past (${classes.past.length})`}>
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Class</th>
                        <th>Subject</th>
                        <th>Students</th>
                        <th>Academic Year</th>
                        <th>Term</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes.past.map((cls) => (
                        <tr key={cls.id}>
                          <td><strong>{cls.name}</strong></td>
                          <td><Badge bg="secondary">{cls.subject}</Badge></td>
                          <td>{cls.students}</td>
                          <td>{cls.academicYear}</td>
                          <td><Badge bg="secondary">{cls.term}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="upcoming" title="Upcoming (0)">
              <Card className="border-0 shadow-sm">
                <Card.Body className="text-center py-5">
                  <i className="bi bi-calendar-x fs-1 text-muted mb-3"></i>
                  <p className="text-muted">No upcoming classes scheduled</p>
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Col>
      </Row>
    </Layout>
  );
};
