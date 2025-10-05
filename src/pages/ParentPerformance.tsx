import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Form, Badge, ProgressBar, Alert, Spinner, Tabs, Tab } from 'react-bootstrap';
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

export const ParentPerformance: React.FC = () => {
  const [selectedChild, setSelectedChild] = useState('1');
  const [loading, setLoading] = useState(false);

  const children = [
    { id: '1', name: 'John Doe', class: 'Class 10 - A' },
    { id: '2', name: 'Jane Doe', class: 'Class 8 - B' }
  ];

  const subjectPerformance = [
    { subject: 'Mathematics', grade: 'A', percentage: 92, totalMarks: 100, obtained: 92, color: 'success' },
    { subject: 'Physics', grade: 'A', percentage: 88, totalMarks: 100, obtained: 88, color: 'success' },
    { subject: 'Chemistry', grade: 'B+', percentage: 78, totalMarks: 100, obtained: 78, color: 'primary' },
    { subject: 'English', grade: 'A', percentage: 85, totalMarks: 100, obtained: 85, color: 'success' },
    { subject: 'Computer Science', grade: 'A+', percentage: 95, totalMarks: 100, obtained: 95, color: 'success' },
  ];

  const examResults = [
    {
      exam: 'First Term Exam',
      subject: 'Mathematics',
      date: '2025-01-15',
      totalMarks: 100,
      obtained: 92,
      grade: 'A',
      rank: 3
    },
    {
      exam: 'First Term Exam',
      subject: 'Physics',
      date: '2025-01-17',
      totalMarks: 100,
      obtained: 88,
      grade: 'A',
      rank: 5
    },
    {
      exam: 'Unit Test',
      subject: 'Chemistry',
      date: '2025-02-10',
      totalMarks: 50,
      obtained: 39,
      grade: 'B+',
      rank: 8
    }
  ];

  const assignments = [
    { title: 'Math Assignment 1', subject: 'Mathematics', status: 'Submitted', grade: 'A', marks: '48/50' },
    { title: 'Physics Lab Report', subject: 'Physics', status: 'Graded', grade: 'A', marks: '45/50' },
    { title: 'English Essay', subject: 'English', status: 'Pending', grade: '-', marks: '-' },
  ];

  const overallPercentage = Math.round(subjectPerformance.reduce((sum, s) => sum + s.percentage, 0) / subjectPerformance.length);

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>Academic Performance</h2>
            <p className="text-muted">Track your children's academic progress</p>
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
              <Card className="border-0 shadow-sm text-center">
                <Card.Body>
                  <i className="bi bi-star-fill fs-1 text-warning mb-2"></i>
                  <h3>{overallPercentage}%</h3>
                  <p className="text-muted mb-0">Overall Average</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm text-center">
                <Card.Body>
                  <i className="bi bi-trophy-fill fs-1 text-success mb-2"></i>
                  <h3>3</h3>
                  <p className="text-muted mb-0">Class Rank</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm text-center">
                <Card.Body>
                  <i className="bi bi-graph-up fs-1 text-primary mb-2"></i>
                  <h3>Excellent</h3>
                  <p className="text-muted mb-0">Progress</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Tabs defaultActiveKey="subjects" className="mb-3">
                <Tab eventKey="subjects" title="Subject-wise Performance">
                  <Row>
                    {subjectPerformance.map((subject, index) => (
                      <Col md={6} key={index} className="mb-3">
                        <Card className="border">
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <h6 className="mb-0">{subject.subject}</h6>
                              <Badge bg={subject.color}>{subject.grade}</Badge>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                              <span className="text-muted">Marks: {subject.obtained}/{subject.totalMarks}</span>
                              <span className="fw-bold">{subject.percentage}%</span>
                            </div>
                            <ProgressBar now={subject.percentage} variant={subject.color} />
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Tab>
                
                <Tab eventKey="exams" title="Exam Results">
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Exam</th>
                        <th>Subject</th>
                        <th>Date</th>
                        <th>Marks</th>
                        <th>Grade</th>
                        <th>Rank</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examResults.map((exam, index) => (
                        <tr key={index}>
                          <td>{exam.exam}</td>
                          <td>{exam.subject}</td>
                          <td>{new Date(exam.date).toLocaleDateString()}</td>
                          <td><strong>{exam.obtained}</strong>/{exam.totalMarks}</td>
                          <td><Badge bg="success">{exam.grade}</Badge></td>
                          <td>#{exam.rank}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Tab>

                <Tab eventKey="assignments" title="Assignments">
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Subject</th>
                        <th>Status</th>
                        <th>Grade</th>
                        <th>Marks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((assignment, index) => (
                        <tr key={index}>
                          <td>{assignment.title}</td>
                          <td><Badge bg="secondary">{assignment.subject}</Badge></td>
                          <td>
                            <Badge bg={assignment.status === 'Graded' ? 'success' : assignment.status === 'Submitted' ? 'info' : 'warning'}>
                              {assignment.status}
                            </Badge>
                          </td>
                          <td>{assignment.grade !== '-' ? <Badge bg="success">{assignment.grade}</Badge> : '-'}</td>
                          <td>{assignment.marks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Layout>
  );
};
