import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Row, Col, Card, Table, Badge, Button, Alert, Spinner, ProgressBar, Form, Modal } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { studentService } from '../services/studentService';
import { studentQuizService } from '../services/studentQuizService';
import { schoolService } from '../services/schoolService';
import { useLang } from '../contexts/LangContext';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/student/assignments', label: 'Assignments', icon: 'bi-file-text' },
  { path: '/student/study-materials', label: 'Study Materials', icon: 'bi-book' },
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

  const [resultsModal, setResultsModal] = useState<{ show: boolean; quiz?: any; rows: Array<{ attemptNo: number; score: number; totalPoints: number; passed?: boolean; submittedAt?: string }>; stats?: any; school?: any }>({ show: false, rows: [] });
  const { t } = useLang();

  const myStudentId = useMemo(() => (student?.id as string | undefined), [student]);

  const printCertificate = async () => {
    try {
      const me = student || (user?.email ? await studentService.getStudentByEmail(user.email) : null);
      const sch = resultsModal.school || (me?.schoolId ? await schoolService.getPublicBasic(me.schoolId) : null);
      const rows = resultsModal.rows || [];
      if (rows.length === 0) return;
      // Pick best score attempt
      const best = rows.reduce((b: any, r: any) => !b || (r.score ?? 0) > (b.score ?? 0) ? r : b, null as any);
      const quiz = resultsModal.quiz || {};
      const dateStr = best?.submittedAt ? new Date(best.submittedAt as any).toLocaleString() : new Date().toLocaleString();
      const total = best?.totalPoints ?? resultsModal.stats?.totalPoints ?? 0;
      const percentage = total ? Math.round(((best?.score ?? 0) * 100) / total) : 0;
      const passed = best?.passed ?? (resultsModal.stats ? (resultsModal.stats.myPercentage ?? 0) >= (quiz?.quizConfig?.passingMarks ? (100 * quiz.quizConfig.passingMarks) / (resultsModal.stats.totalPoints || 1) : 0) : undefined);

      const w = window.open('', '_blank');
      if (!w) return;
      const logo = sch?.logo || '';
      const schoolName = sch?.name || 'Your School';
      const studentName = `${me?.firstName || ''} ${me?.lastName || ''}`.trim();
      const cls = (me as any)?.className || (me as any)?.classId || '';
      const section = (me as any)?.section || '';
      const title = quiz?.title || 'Quiz';
      const subject = quiz?.subject || quiz?.subjectName || '';
      const gradeText = passed === undefined ? '' : (passed ? 'PASSED' : 'FAILED');
      const html = `<!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Certificate - ${title}</title>
        <style>
          body { font-family: 'Times New Roman', serif; background:#f7f7f7; }
          .certificate { width: 900px; margin: 24px auto; background: #fff; padding: 32px 48px; border: 12px solid #5c6ac4; position: relative; }
          .certificate:before { content: ''; position: absolute; inset: 12px; border: 2px dashed #5c6ac4; }
          .header { text-align:center; margin-bottom: 16px; }
          .header .logo { height: 64px; margin-bottom: 8px; }
          .school { font-size: 22px; font-weight: bold; letter-spacing: 1px; }
          .title { text-align:center; font-size: 32px; margin: 24px 0 8px; letter-spacing: 1px; }
          .subtitle { text-align:center; color:#555; margin-bottom: 24px; }
          .content { font-size: 18px; line-height: 1.6; color:#222; }
          .highlight { font-weight: bold; color:#222; }
          .score { font-size: 20px; margin: 12px 0; }
          .footer { display:flex; justify-content: space-between; margin-top: 36px; }
          .sig { text-align:center; min-width: 220px; }
          .sig .line { border-top: 1px solid #666; margin-top: 48px; padding-top: 4px; }
          .meta { color:#666; font-size: 12px; text-align:center; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="header">
            ${logo ? `<img class="logo" src="${logo}" alt="School Logo" />` : ''}
            <div class="school">${schoolName}</div>
          </div>
          <div class="title">Certificate of Achievement</div>
          <div class="subtitle">This certificate is proudly presented to</div>
          <div class="content" style="text-align:center;">
            <div style="font-size:26px; font-weight:bold; margin-bottom: 6px;">${studentName || 'Student'}</div>
            <div class="meta">Class: ${cls}${section ? ' • Section: ' + section : ''}</div>
          </div>
          <div class="content" style="margin-top:16px;">
            For outstanding performance in <span class="highlight">${subject || 'Quiz'}</span><br/>
            <span class="highlight">${title}</span> held on <span class="highlight">${dateStr}</span>.
          </div>
          <div class="score">
            Score: <span class="highlight">${best?.score ?? 0}</span> / ${total} • Percentage: <span class="highlight">${percentage}%</span> ${gradeText ? `• Result: <span class="highlight">${gradeText}</span>` : ''}
          </div>
          <div class="footer">
            <div class="sig">
              <div class="line">Teacher</div>
            </div>
            <div class="sig">
              <div class="line">Principal</div>
            </div>
          </div>
          <div class="meta">This is a system-generated certificate.</div>
        </div>
        <script>window.print(); setTimeout(() => window.close(), 300);</script>
      </body>
      </html>`;
      w.document.open();
      w.document.write(html);
      w.document.close();
    } catch (e) {
      console.error('Certificate printing failed', e);
    }
  };
  
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
        setError(e?.response?.data?.message || t('error.failed_to_load_quizzes'));
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
      const [rows, stats, school] = await Promise.all([
        studentQuizService.getResults(myStudentId, q.id),
        studentQuizService.getStats(myStudentId, q.id).catch(() => null),
        (async () => {
          try {
            const me = await studentService.getStudentByEmail(user?.email || '');
            return me?.schoolId ? await schoolService.getPublicBasic(me.schoolId) : null;
          } catch { return null; }
        })()
      ]);
      setResultsModal({ show: true, quiz: q, rows: rows || [], stats: stats || null, school: school || null });
    } catch (e: any) {
      setError(e?.response?.data?.message || t('error.failed_to_load_results'));
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
          setError(t('student.quizzes.expired'));
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
      setError(e?.response?.data?.error || e?.response?.data?.message || t('error.failed_to_start_quiz'));
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
      setSuccess(`${t('student.quizzes.submitted_label')} ${t('student.quizzes.score')}: ${score}/${total}${passed !== undefined ? (passed ? ` (${t('result.passed')})` : ` (${t('result.failed')})`) : ''}`);
      setCurrent(null);
      setAnswers({});
      // Refresh list
      if (student) {
        const list = await studentQuizService.list(student.id, { classId: student.classId, section: student.section });
        setQuizzes(list || []);
      }
      setTimeout(() => setSuccess(''), 4000);
    } catch (e: any) {
      setError(e?.response?.data?.message || t('error.failed_to_submit_quiz'));
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
            <h2>{t('student.quizzes.title')}</h2>
            <p className="text-muted">{t('student.quizzes.subtitle')}</p>
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
                      <th>{t('table.title')}</th>
                      <th>{t('table.subject')}</th>
                      <th>{t('student.quizzes.type')}</th>
                      <th>{t('student.quizzes.due')}</th>
                      <th>{t('student.quizzes.attempts')}</th>
                      <th>{t('table.action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(quizzes || []).map((q) => {
                      const attempts = Number(q.attempts || 0);
                      const max = q.maxAttempts ?? null;
                      const attemptText = max ? `${attempts}/${max}` : `${attempts}`;
                      const reachedMax = max !== null && attempts >= max;
                      const actionLabel = attempts > 0 && !reachedMax ? t('student.quizzes.reattempt') : t('student.quizzes.start');
                      return (
                        <tr key={q.id}>
                          <td><strong>{q.title}</strong></td>
                          <td><Badge bg="secondary">{q.subject}</Badge></td>
                          <td><Badge bg={q.type === 'EXAM' ? 'warning' : 'info'}>{q.type === 'EXAM' ? t('table.exam') : t('table.quiz')}</Badge></td>
                          <td>{q.dueDate ? new Date(q.dueDate).toLocaleDateString() : '-'}</td>
                          <td>{attemptText}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button size="sm" variant="primary" disabled={reachedMax} onClick={() => startQuiz(q)}>
                                <i className="bi bi-play-fill me-1"></i> {actionLabel}
                              </Button>
                              {attempts > 0 && (
                                <Button size="sm" variant="outline-secondary" onClick={() => openResults(q)}>
                                  <i className="bi bi-clipboard-data me-1"></i> {t('student.quizzes.view_results')}
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
                  <div className="text-muted small">{current.quiz?.subject} • {t('student.quizzes.attempt')} #{current.attemptNo}</div>
                </div>
                <div>
                  {remainingSeconds !== null && (
                    <div className="text-end">
                      <div className="small text-muted">{t('student.quizzes.time_remaining')}</div>
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
                            <div className="mb-2"><strong>{t('student.quizzes.q_prefix')}{idx + 1}.</strong> {q.text}</div>
                            {q.imageUrl && (
                              <div className="mb-2"><img src={q.imageUrl} alt={t('student.quizzes.question_image')} style={{ maxWidth: '100%', borderRadius: 6 }} /></div>
                            )}
                          </div>
                          <Badge bg={isMCQ ? 'warning' : 'info'}>{isMCQ ? t('student.quizzes.mcq') : t('student.quizzes.scq')}</Badge>
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
                                  <Form.Label className="mb-0">{opt || t('student.quizzes.option').replace('{n}', String(oi + 1))}</Form.Label>
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
                  <Button variant="secondary" onClick={() => setCurrent(null)}>{t('student.quizzes.cancel')}</Button>
                  <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                    <i className="bi bi-check2-circle me-1"></i> {t('student.quizzes.submit')}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Results Modal */}
      <Modal show={resultsModal.show} onHide={() => setResultsModal({ show: false, rows: [] })} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{t('student.quizzes.results')}{resultsModal.quiz ? ` • ${resultsModal.quiz.title}` : ''}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Summary */}
          {resultsModal.stats && (
            <Card className="border-0 shadow-sm mb-3">
              <Card.Body>
                <Row className="align-items-center">
                  <Col md={8}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="display-6 mb-0">
                        {resultsModal.stats.rank === 1 ? <i className="bi bi-trophy-fill text-warning"></i> : <i className="bi bi-award text-primary"></i>}
                      </div>
                      <div>
                        <div className="fw-bold">{t('student.quizzes.your_best')}: {Math.round(resultsModal.stats.myBest)}/{resultsModal.stats.totalPoints} ({resultsModal.stats.myPercentage ? Math.round(resultsModal.stats.myPercentage) : 0}%)</div>
                        <div className="text-muted small">
                          {t('student.quizzes.rank_of').replace('{rank}', String(resultsModal.stats.rank)).replace('{participants}', String(resultsModal.stats.participants))}
                          {' • '}
                          {t('student.quizzes.avg').replace('{avg}', String(resultsModal.stats.avgPercentage ? Math.round(resultsModal.stats.avgPercentage) : 0))}
                          {' • '}
                          {t('student.quizzes.top').replace('{top}', String(resultsModal.stats.topPercentage ? Math.round(resultsModal.stats.topPercentage) : 0))}
                        </div>
                      </div>
                    </div>
                  </Col>
                  <Col md={4} className="text-end">
                    <Badge bg={resultsModal.stats.myPercentage >= (resultsModal.quiz?.quizConfig?.passingMarks ? (100 * resultsModal.quiz.quizConfig.passingMarks) / (resultsModal.stats.totalPoints || 1) : 0) ? 'success' : 'danger'}>
                      {resultsModal.stats.myPercentage >= (resultsModal.quiz?.quizConfig?.passingMarks ? (100 * resultsModal.quiz.quizConfig.passingMarks) / (resultsModal.stats.totalPoints || 1) : 0) ? t('result.passed') : t('result.failed')}
                    </Badge>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          {resultsModal.rows.length === 0 ? (
            <div className="text-muted">{t('student.quizzes.no_attempts')}</div>
          ) : (
            <Table responsive size="sm">
              <thead>
                <tr>
                  <th>{t('student.quizzes.attempt')}</th>
                  <th>{t('student.quizzes.score')}</th>
                  <th>{t('student.quizzes.status')}</th>
                  <th>{t('student.quizzes.submitted')}</th>
                </tr>
              </thead>
              <tbody>
                {resultsModal.rows.map((r, i) => (
                  <tr key={i}>
                    <td>#{r.attemptNo}</td>
                    <td><strong>{r.score}</strong> / {r.totalPoints}</td>
                    <td>{r.passed === undefined ? '-' : r.passed ? <Badge bg="success">{t('result.passed')}</Badge> : <Badge bg="danger">{t('result.failed')}</Badge>}</td>
                    <td>{r.submittedAt ? new Date(r.submittedAt as any).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setResultsModal({ show: false, rows: [] })}>{t('common.close')}</Button>
          {resultsModal.rows.length > 0 && (
            <Button variant="outline-primary" onClick={printCertificate}>
              <i className="bi bi-printer me-2"></i> {t('common.print_certificate')}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Layout>
  );
};
