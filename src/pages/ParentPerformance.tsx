import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Form, Badge, ProgressBar, Alert, Spinner, Tabs, Tab } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { parentService } from '../services/parentService';
import { useLang } from '../contexts/LangContext';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/parent/children', label: 'My Children', icon: 'bi-people' },
  { path: '/parent/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
  { path: '/parent/performance', label: 'Performance', icon: 'bi-star' },
  { path: '/parent/fees', label: 'Fee Payments', icon: 'bi-cash-coin' },
  { path: '/parent/notifications', label: 'Notifications', icon: 'bi-bell' },
];

export const ParentPerformance: React.FC = () => {
  const { t } = useLang();
  const [children, setChildren] = useState<Array<{ id: string; name: string; className?: string }>>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [subjectPerformance, setSubjectPerformance] = useState<Array<{ subject: string; percentage: number; obtained: number; totalMarks: number }>>([]);
  const [overallAverage, setOverallAverage] = useState<number>(0);
  const [assignments, setAssignments] = useState<Array<{ title: string; subject: string; status: string; marks?: string; type?: string; percentage?: number; passed?: boolean }>>([]);

  useEffect(() => {
    const loadChildren = async () => {
      try {
        setLoading(true); setError('');
        const list = await parentService.getMyChildren();
        const items = (list || []).map((c: any) => ({ id: c.id, name: `${c.firstName || ''} ${c.lastName || ''}`.trim(), className: c.className }));
        setChildren(items);
        if (!selectedChild && items.length) setSelectedChild(items[0].id);
      } catch (e: any) {
        setError(e?.response?.data?.message || t('error.failed_to_load_children'));
      } finally {
        setLoading(false);
      }
    };
    loadChildren();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadPerformance = async () => {
      if (!selectedChild) return;
      try {
        setLoading(true); setError('');
        const summary = await parentService.getChildPerformance(selectedChild);
        const subj = (summary.subjectGrades || []).map((sg: any) => ({
          subject: sg.subject,
          percentage: Math.round(sg.percentage || 0),
          obtained: sg.totalMarks,
          totalMarks: sg.maxMarks,
        }));
        setSubjectPerformance(subj);
        setOverallAverage(Math.round(summary.averageMarks || 0));

        const list = await parentService.getChildAssignments(selectedChild).catch(() => []);
        const mapped = (list || []).map((it: any) => {
          const a = it.assignment || it;
          const s = it.submission;
          const totalPoints = (a?.questions || []).reduce((acc: number, q: any) => acc + (q?.points ?? 1), 0);
          const max = (a?.type === 'QUIZ' || a?.type === 'EXAM') ? (totalPoints || a?.maxMarks || 0) : (a?.maxMarks || 0);
          const rawMarks = s?.marksObtained ?? s?.score;
          const marks = rawMarks != null && max > 0 ? `${rawMarks}/${max}` : undefined;
          const percentage = rawMarks != null && max > 0 ? Math.round((rawMarks * 10000) / max) / 100 : undefined;
          const status = s ? s.status : 'PENDING';
          const passed = s?.passed ?? (a?.quizConfig?.passingMarks != null && rawMarks != null ? rawMarks >= a.quizConfig.passingMarks : undefined);
          return { title: a?.title || 'Assignment', subject: a?.subject || '-', status, marks, type: a?.type, percentage, passed };
        });
        setAssignments(mapped);
      } catch (e: any) {
        setError(e?.response?.data?.message || t('error.failed_to_load_performance'));
      } finally {
        setLoading(false);
      }
    };
    loadPerformance();
  }, [selectedChild]);

  const overallPercentage = overallAverage;

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>{t('parent.performance.title')}</h2>
            <p className="text-muted">{t('parent.performance.subtitle')}</p>
          </div>

          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Form.Group>
                <Form.Label>{t('parent.performance.select_child')}</Form.Label>
                <Form.Select value={selectedChild} onChange={(e) => setSelectedChild(e.target.value)}>
                  {children.map(child => (
                    <option key={child.id} value={child.id}>{child.name}{child.className ? ` - ${child.className}` : ''}</option>
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
                  <p className="text-muted mb-0">{t('parent.performance.overall_average')}</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm text-center">
                <Card.Body>
                  <i className="bi bi-trophy-fill fs-1 text-success mb-2"></i>
                  <h3>—</h3>
                  <p className="text-muted mb-0">{t('parent.performance.class_rank')}</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm text-center">
                <Card.Body>
                  <i className="bi bi-graph-up fs-1 text-primary mb-2"></i>
                  <h3>{overallPercentage >= 85 ? t('parent.performance.rating.excellent') : overallPercentage >= 70 ? t('parent.performance.rating.good') : t('parent.performance.rating.needs_attention')}</h3>
                  <p className="text-muted mb-0">{t('parent.performance.progress')}</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Tabs defaultActiveKey="subjects" className="mb-3">
                <Tab eventKey="subjects" title={t('parent.performance.subject_wise')}>
                  {subjectPerformance.length === 0 ? (
                    <div className="text-center text-muted py-4">{t('parent.performance.no_data')}</div>
                  ) : (
                    <Row>
                      {subjectPerformance.map((subject, index) => (
                        <Col md={6} key={index} className="mb-3">
                          <Card className="border">
                            <Card.Body>
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <h6 className="mb-0">{subject.subject}</h6>
                                <Badge bg={subject.percentage >= 85 ? 'success' : subject.percentage >= 70 ? 'primary' : 'warning'}>
                                  {subject.percentage}%
                                </Badge>
                              </div>
                              <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">{t('table.marks')}: {subject.obtained}/{subject.totalMarks}</span>
                              </div>
                              <ProgressBar now={subject.percentage} variant={subject.percentage >= 85 ? 'success' : subject.percentage >= 70 ? 'primary' : 'warning'} />
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                </Tab>
                
                <Tab eventKey="exams" title={t('parent.performance.exams')}>
                  <div className="text-center text-muted py-4">{t('parent.performance.no_data')}</div>
                </Tab>

                <Tab eventKey="assignments" title={t('parent.performance.assignments')}>
                  {assignments.length === 0 ? (
                    <div className="text-center text-muted py-4">{t('parent.performance.no_assignments')}</div>
                  ) : (
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>{t('table.title')}</th>
                          <th>{t('table.subject')}</th>
                          <th>{t('table.status')}</th>
                          <th>{t('table.marks')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignments.map((assignment, index) => (
                          <tr key={index}>
                            <td>{assignment.title}</td>
                            <td><Badge bg="secondary">{assignment.subject}</Badge></td>
                            <td>
                              <Badge bg={assignment.status === 'GRADED' ? 'success' : assignment.status === 'SUBMITTED' ? 'info' : 'warning'}>
                                {assignment.status === 'GRADED' ? t('status.graded') : assignment.status === 'SUBMITTED' ? t('status.submitted') : t('status.pending')}
                              </Badge>
                            </td>
                            <td>{assignment.marks || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Tab>

                <Tab eventKey="quizzes" title={t('parent.performance.quizzes')}>
                  {assignments.filter(a => a.type === 'QUIZ' || a.type === 'EXAM').length === 0 ? (
                    <div className="text-center text-muted py-4">{t('parent.performance.no_quizzes')}</div>
                  ) : (
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>{t('table.title')}</th>
                          <th>{t('table.subject')}</th>
                          <th>{t('table.type')}</th>
                          <th>{t('table.status')}</th>
                          <th>{t('table.marks')}</th>
                          <th>{t('table.percent')}</th>
                          <th>{t('table.result')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignments.filter(a => a.type === 'QUIZ' || a.type === 'EXAM').map((q, idx) => (
                          <tr key={idx}>
                            <td>{q.title}</td>
                            <td><Badge bg="secondary">{q.subject}</Badge></td>
                            <td><Badge bg={q.type === 'EXAM' ? 'warning' : 'info'}>{q.type === 'EXAM' ? t('table.exam') : t('table.quiz')}</Badge></td>
                            <td>
                              <Badge bg={q.status === 'GRADED' ? 'success' : q.status === 'SUBMITTED' ? 'info' : 'warning'}>
                                {q.status === 'GRADED' ? t('status.graded') : q.status === 'SUBMITTED' ? t('status.submitted') : t('status.pending')}
                              </Badge>
                            </td>
                            <td>{q.marks || '-'}</td>
                            <td>{q.percentage != null ? `${q.percentage}%` : '-'}</td>
                            <td>
                              {q.passed === undefined ? '-' : q.passed ? (
                                <Badge bg="success"><i className="bi bi-trophy-fill me-1"></i>{t('result.passed')}</Badge>
                              ) : (
                                <Badge bg="danger">{t('result.failed')}</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Layout>
  );
};
