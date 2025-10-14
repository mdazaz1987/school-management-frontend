import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Row, Col, Card, Table, Badge, Button, Alert, Spinner, ProgressBar, Form, Modal } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { studentService } from '../services/studentService';
import { studentQuizService } from '../services/studentQuizService';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/student/assignments', label: 'Assignments', icon: 'bi-file-text' },
  { path: '/student/quizzes', label: 'Quizzes & Tests', icon: 'bi-clipboard-check' },
  { path: '/student/exams', label: 'Exams & Results', icon: 'bi-clipboard2-data' },
  { path: '/student/attendance', label: 'My Attendance', icon: 'bi-calendar-check' },
  { path: '/student/timetable', label: 'Timetable', icon: 'bi-calendar3' },
  { path: '/student/fees', label: 'Fee Payment', icon: 'bi-cash-coin' },
  { path: '/student/notifications', label: 'Notifications', icon: 'bi-bell' },
];

export const StudentQuizzes: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [student, setStudent] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);

  // Attempt state
  const [current, setCurrent] = useState<{
    quizId: string;
    submissionId: string;
    attemptNo: number;
    expiresAt?: string;
    expiresAtMs?: number;
    quiz: any;
  } | null>(null);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const hadPositiveTimeRef = useRef<boolean>(false);

  const [resultsModal, setResultsModal] = useState<{ show: boolean; quiz?: any; rows: Array<{ attemptNo: number; score: number; totalPoints: number; passed?: boolean; submittedAt?: string }>}>({ show: false, rows: [] });

  const myStudentId = useMemo(() => (student?.id as string | undefined), [student]);

  useEffect(() => {
    const init = async () => {
      if (!user?.email) return;
      setLoading(true); setError('');
      try {
        const s = await studentService.getStudentByEmail(user.email);
        setStudent(s);
        const list = await studentQuizService.list(s.id, { classId: s.classId, section: s.section });
        setQuizzes(list || []);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load quizzes');
      } finally {
        setLoading(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const openResults = async (q: any) => {
    if (!myStudentId) return;
    try {
      setLoading(true); setError('');
      const rows = await studentQuizService.getResults(myStudentId, q.id);
      setResultsModal({ show: true, quiz: q, rows: rows || [] });
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  // Timer handling
  useEffect(() => {
    if (!current?.expiresAt && !current?.expiresAtMs) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      setRemainingSeconds(null);
      return;
    }
    const end = (current.expiresAtMs ?? (current.expiresAt ? new Date(current.expiresAt).getTime() : 0));
    const tick = () => {
      const now = Date.now();
      const sec = Math.max(0, Math.floor((end - now) / 1000));
      setRemainingSeconds(sec);
      if (sec > 0) {
        hadPositiveTimeRef.current = true;
      }
      if (sec <= 0) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        // If the timer was already expired at start, do NOT auto-submit empty answers
        if (!hadPositiveTimeRef.current) {
          setError('This attempt appears to have already expired. Please try starting the quiz again.');
          setCurrent(null);
          setAnswers({});
          return;
        }
        handleSubmit();
      }
    };
    tick();
    timerRef.current = window.setInterval(tick, 1000);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.expiresAt]);

  const startQuiz = async (q: any) => {
    if (!myStudentId) return;
    try {
      setLoading(true); setError('');
      const payload = await studentQuizService.start(myStudentId, q.id);
      setCurrent({
        quizId: q.id,
        submissionId: payload.submissionId,
        attemptNo: payload.attemptNo,
        expiresAt: payload.expiresAt,
        expiresAtMs: (payload as any).expiresAtEpochMs,
        quiz: payload.quiz,
      });
      // Initialize answers map with empty arrays
      const initAns: Record<string, number[]> = {};
      (payload.quiz?.questions || []).forEach((qq: any) => { if (qq?.id) initAns[qq.id] = []; });
      setAnswers(initAns);
      hadPositiveTimeRef.current = false;
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.response?.data?.message || 'Failed to start quiz');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (qid: string, idx: number, multiple: boolean) => {
    setAnswers(prev => {
      const cur = prev[qid] || [];
      if (multiple) {
        const set = new Set(cur);
        if (set.has(idx)) set.delete(idx); else set.add(idx);
        return { ...prev, [qid]: Array.from(set).sort((a,b)=>a-b) };
        } else {
        return { ...prev, [qid]: [idx] };
      }
    });
  };

  const handleSubmit = async () => {
    if (!current || !myStudentId) return;
    try {
      setLoading(true); setError('');
      const payload = {
        answers: Object.keys(answers).map(k => ({ questionId: k, selected: answers[k] || [] }))
      };
      const res = await studentQuizService.submit(myStudentId, current.quizId, current.submissionId, payload);
      const score = res?.score ?? 0;
      const total = res?.totalPoints ?? 0;
      const passed = res?.passed;
      setSuccess(`Submitted. Score: ${score}/${total}${passed !== undefined ? passed ? ' (Passed)' : ' (Failed)' : ''}`);
      setCurrent(null);
      setAnswers({});
      // Refresh list
      if (student) {
        const list = await studentQuizService.list(student.id, { classId: student.classId, section: student.section });
        setQuizzes(list || []);
      }
      setTimeout(() => setSuccess(''), 4000);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to submit quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>Quizzes & Tests</h2>
            <p className="text-muted">Start and submit your online quizzes and tests</p>
          </div>

          {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

          {loading && !current && (
            <div className="text-center py-5"><Spinner animation="border" /></div>
          )}

          {!current && (
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Subject</th>
                      <th>Type</th>
                      <th>Due</th>
                      <th>Attempts</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(quizzes || []).map((q) => {
                      const attempts = Number(q.attempts || 0);
                      const max = q.maxAttempts ?? null;
                      const attemptText = max ? `${attempts}/${max}` : `${attempts}`;
                      const reachedMax = max !== null && attempts >= max;
                      const actionLabel = attempts > 0 && !reachedMax ? 'Re-attempt' : 'Start';
                      return (
                        <tr key={q.id}>
                          <td><strong>{q.title}</strong></td>
                          <td><Badge bg="secondary">{q.subject}</Badge></td>
                          <td><Badge bg={q.type === 'EXAM' ? 'warning' : 'info'}>{q.type}</Badge></td>
                          <td>{q.dueDate ? new Date(q.dueDate).toLocaleDateString() : '-'}</td>
                          <td>{attemptText}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button size="sm" variant="primary" disabled={reachedMax} onClick={() => startQuiz(q)}>
                                <i className="bi bi-play-fill me-1"></i> {actionLabel}
                              </Button>
                              {attempts > 0 && (
                                <Button size="sm" variant="outline-secondary" onClick={() => openResults(q)}>
                                  <i className="bi bi-clipboard-data me-1"></i> View Results
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {current && (
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                <div>
                  <strong>{current.quiz?.title}</strong>
                  <div className="text-muted small">{current.quiz?.subject} • Attempt #{current.attemptNo}</div>
                </div>
                <div>
                  {remainingSeconds !== null && (
                    <div className="text-end">
                      <div className="small text-muted">Time Remaining</div>
                      <h5 className={remainingSeconds <= 30 ? 'text-danger mb-0' : 'mb-0'}>
                        {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, '0')}
                      </h5>
                      <ProgressBar now={current.quiz?.quizConfig?.timeLimitMinutes ? (100 * (current.quiz.quizConfig.timeLimitMinutes * 60 - remainingSeconds) / (current.quiz.quizConfig.timeLimitMinutes * 60)) : 0} className="mt-1" />
                    </div>
                  )}
                </div>
              </Card.Header>
              <Card.Body>
                {(current.quiz?.questions || []).map((q: any, idx: number) => {
                  const isMCQ = String(q.type || 'SCQ') === 'MCQ';
                  const selected = answers[q.id] || [];
                  return (
                    <Card key={q.id || idx} className="mb-3">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="mb-2"><strong>Q{idx + 1}.</strong> {q.text}</div>
                            {q.imageUrl && (
                              <div className="mb-2"><img src={q.imageUrl} alt="question" style={{ maxWidth: '100%', borderRadius: 6 }} /></div>
                            )}
                          </div>
                          <Badge bg={isMCQ ? 'warning' : 'info'}>{isMCQ ? 'MCQ' : 'SCQ'}</Badge>
                        </div>
                        <div className="mt-2">
                          <Row>
                            {(q.options || []).map((opt: string, oi: number) => (
                              <Col md={6} key={oi} className="mb-2">
                                <div className="d-flex align-items-center gap-2">
                                  {isMCQ ? (
                                    <Form.Check type="checkbox" checked={selected.includes(oi)} onChange={() => toggleSelect(q.id, oi, true)} />
                                  ) : (
                                    <Form.Check type="radio" name={`q-${q.id || idx}`} checked={(selected[0] ?? -1) === oi} onChange={() => toggleSelect(q.id, oi, false)} />
                                  )}
                                  <Form.Label className="mb-0">{opt || `Option ${oi + 1}`}</Form.Label>
                                </div>
                              </Col>
                            ))}
                          </Row>
                        </div>
                      </Card.Body>
                    </Card>
                  );
                })}
                <div className="d-flex justify-content-end gap-2">
                  <Button variant="secondary" onClick={() => setCurrent(null)}>Cancel</Button>
                  <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                    <i className="bi bi-check2-circle me-1"></i> Submit
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Results Modal */}
      <Modal show={resultsModal.show} onHide={() => setResultsModal({ show: false, rows: [] })}>
        <Modal.Header closeButton>
          <Modal.Title>Results{resultsModal.quiz ? ` • ${resultsModal.quiz.title}` : ''}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {resultsModal.rows.length === 0 ? (
            <div className="text-muted">No attempts found.</div>
          ) : (
            <Table responsive size="sm">
              <thead>
                <tr>
                  <th>Attempt</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {resultsModal.rows.map((r, i) => (
                  <tr key={i}>
                    <td>#{r.attemptNo}</td>
                    <td><strong>{r.score}</strong> / {r.totalPoints}</td>
                    <td>{r.passed === undefined ? '-' : r.passed ? <Badge bg="success">Passed</Badge> : <Badge bg="danger">Failed</Badge>}</td>
                    <td>{r.submittedAt ? new Date(r.submittedAt as any).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setResultsModal({ show: false, rows: [] })}>Close</Button>
          {resultsModal.rows.length > 0 && (
            <Button variant="outline-primary" onClick={() => window.print()}>
              <i className="bi bi-printer me-2"></i> Print Certificate
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Layout>
  );
};
