import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Tabs, Tab, ProgressBar, Alert, Spinner } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
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

export const StudentExams: React.FC = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    loadExamsAndResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const loadExamsAndResults = async () => {
    if (!user?.email) return;
    setLoading(true);
    setError('');
    try {
      const student = await studentService.getStudentByEmail(user.email);
      const studentId = (student as any).id;
      // Upcoming exams (next 30 days)
      const upcoming = await apiService.get<any[]>(`/students/${studentId}/exams/upcoming`, { days: 30 });
      const normalizedExams = (upcoming || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        subject: e.subjectName,
        date: e.examDate,
        time: `${e.startTime || ''} - ${e.endTime || ''}`,
        duration: '',
        totalMarks: e.totalMarks,
        syllabus: e.instructions,
        room: e.venue,
        status: 'upcoming',
      }));

      // Results history
      const resultsData = await apiService.get<any[]>(`/exams/students/${studentId}/results`);
      const normalizedResults = (resultsData || []).map((r: any) => ({
        id: r.id,
        examName: r.examName || r.subjectName,
        subject: r.subjectName,
        date: r.createdAt || r.gradedAt,
        totalMarks: r.totalMarks,
        marksObtained: r.marksObtained,
        grade: r.grade,
        percentage: r.percentage,
        rank: r.rank,
        remarks: r.remarks,
      }));

      setExams(normalizedExams);
      setResults(normalizedResults);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load exams and results');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.includes('A')) return 'success';
    if (grade.includes('B')) return 'primary';
    if (grade.includes('C')) return 'warning';
    return 'danger';
  };

  const calculateOverallPerformance = () => {
    if (results.length === 0) return 0;
    const total = results.reduce((sum, r) => sum + r.percentage, 0);
    return Math.round(total / results.length);
  };

  const overallPercentage = calculateOverallPerformance();

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>My Exams & Results</h2>
            <p className="text-muted">View your upcoming exams and past results (Read-Only)</p>
          </div>

          <Alert variant="info" className="mb-4">
            <i className="bi bi-info-circle me-2"></i>
            This page displays only your exam schedule and results. Results will be published by teachers after evaluation.
          </Alert>

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <p className="mt-2">Loading...</p>
            </div>
          ) : (
            <>
              {/* Overall Performance Card */}
              <Row className="mb-4">
                <Col md={4}>
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <h6 className="text-muted">Overall Performance</h6>
                      <h2 className="mb-0">{overallPercentage}%</h2>
                      <ProgressBar 
                        now={overallPercentage} 
                        variant={overallPercentage >= 90 ? 'success' : overallPercentage >= 75 ? 'primary' : 'warning'}
                        className="mt-2"
                      />
                      <small className="text-muted mt-2 d-block">
                        Based on {results.length} exams
                      </small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <h6 className="text-muted">Upcoming Exams</h6>
                      <h2 className="mb-0">{exams.length}</h2>
                      <small className="text-muted">
                        Next exam in {exams.length > 0 ? Math.ceil((new Date(exams[0].date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0} days
                      </small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="border-0 shadow-sm">
                    <Card.Body>
                      <h6 className="text-muted">Best Performance</h6>
                      <h2 className="mb-0">
                        {results.length > 0 ? Math.max(...results.map(r => r.percentage)) : 0}%
                      </h2>
                      <small className="text-muted">
                        {results.find(r => r.percentage === Math.max(...results.map(x => x.percentage)))?.subject || '—'}
                      </small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'upcoming')} className="mb-3">
                    <Tab eventKey="upcoming" title={`Upcoming Exams (${exams.length})`}>
                      <Table responsive hover>
                        <thead>
                          <tr>
                            <th>Exam Name</th>
                            <th>Subject</th>
                            <th>Date & Time</th>
                            <th>Duration</th>
                            <th>Total Marks</th>
                            <th>Syllabus</th>
                            <th>Room</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exams.map((exam) => (
                            <tr key={exam.id}>
                              <td><strong>{exam.name}</strong></td>
                              <td><Badge bg="secondary">{exam.subject}</Badge></td>
                              <td>
                                {new Date(exam.date).toLocaleDateString()}
                                <br />
                                <small className="text-muted">{exam.time}</small>
                              </td>
                              <td>{exam.duration}</td>
                              <td>{exam.totalMarks}</td>
                              <td><small>{exam.syllabus}</small></td>
                              <td>{exam.room}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Tab>
                    <Tab eventKey="results" title={`Results (${results.length})`}>
                      <Table responsive hover>
                        <thead>
                          <tr>
                            <th>Exam Name</th>
                            <th>Subject</th>
                            <th>Date</th>
                            <th>Marks Obtained</th>
                            <th>Percentage</th>
                            <th>Grade</th>
                            <th>Rank</th>
                            <th>Remarks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.map((result) => (
                            <tr key={result.id}>
                              <td><strong>{result.examName}</strong></td>
                              <td><Badge bg="secondary">{result.subject}</Badge></td>
                              <td>{new Date(result.date).toLocaleDateString()}</td>
                              <td>
                                <strong>{result.marksObtained}</strong> / {result.totalMarks}
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <ProgressBar 
                                    now={result.percentage} 
                                    variant={getGradeColor(result.grade)}
                                    style={{ width: '60px', marginRight: '8px' }}
                                  />
                                  <span>{result.percentage}%</span>
                                </div>
                              </td>
                              <td>
                                <Badge bg={getGradeColor(result.grade)}>
                                  {result.grade}
                                </Badge>
                              </td>
                              <td>#{result.rank}</td>
                              <td><small>{result.remarks}</small></td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Tab>
                  </Tabs>
                </Card.Body>
              </Card>
            </>
          )}
        </Col>
      </Row>
    </Layout>
  );
};
