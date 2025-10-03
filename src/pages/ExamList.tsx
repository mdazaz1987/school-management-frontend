import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { Button, Card, Container, Row, Col, Table, Badge, Alert, Spinner, Form } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { examService } from '../services/examService';
import { classService } from '../services/classService';
import { subjectService } from '../services/subjectService';
import { Exam, SchoolClass, Subject } from '../types';

export const ExamList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [q, setQ] = useState('');

  const classById = useMemo(() => {
    const m: Record<string, SchoolClass> = {};
    classes.forEach((c) => (m[c.id] = c));
    return m;
  }, [classes]);

  const subjectById = useMemo(() => {
    const m: Record<string, Subject> = {};
    subjects.forEach((s) => (m[s.id] = s));
    return m;
  }, [subjects]);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const [exList, classList, subjList] = await Promise.all([
        examService.list({ schoolId: user?.schoolId }),
        classService.getAllClasses({ schoolId: user?.schoolId || '' }),
        subjectService.getAllSubjects({ schoolId: user?.schoolId || '' }),
      ]);
      setExams(exList);
      setClasses(classList);
      setSubjects(subjList);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.schoolId]);

  const onDelete = async (exam: Exam) => {
    if (!window.confirm(`Delete exam "${exam.name}"? This cannot be undone.`)) return;
    try {
      await examService.remove(exam.id);
      setSuccess('Exam deleted');
      load();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to delete exam');
    }
  };

  const onPublish = async (exam: Exam) => {
    try {
      await examService.publishResults(exam.id);
      setSuccess('Results published');
      load();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to publish results');
    }
  };

  const filtered = exams.filter((e) =>
    [e.name, e.term, e.academicYear, e.classId, e.subjectId]
      .map((x) => (x ? String(x).toLowerCase() : ''))
      .some((v) => v.includes(q.toLowerCase()))
  );

  return (
    <Layout>
      <Container className="py-4">
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2>Exams</h2>
                <p className="text-muted">Plan and manage exams</p>
              </div>
              <div className="d-flex gap-2">
                <Form.Control
                  size="sm"
                  style={{ width: 260 }}
                  placeholder="Search by name/term/year"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                <Button variant="primary" onClick={() => navigate('/exams/new')}>
                  <i className="bi bi-plus-lg me-2"></i>
                  New Exam
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Card className="border-0 shadow-sm">
          <Card.Body>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading exams...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox display-1 text-muted"></i>
                <p className="mt-3 text-muted">No exams found</p>
                <Button variant="primary" onClick={() => navigate('/exams/new')}>
                  Add Exam
                </Button>
              </div>
            ) : (
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Date</th>
                    <th>Marks</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => {
                    const cls = classById[e.classId];
                    const subj = subjectById[e.subjectId];
                    return (
                      <tr key={e.id}>
                        <td>{e.name}</td>
                        <td>{cls ? (cls.name || cls.className) : e.classId}</td>
                        <td>{subj ? subj.name : e.subjectId}</td>
                        <td>{e.examDate ? new Date(e.examDate).toLocaleDateString() : '-'}</td>
                        <td>{e.totalMarks}/{e.passingMarks}</td>
                        <td>
                          <Badge bg={e.isPublished ? 'success' : 'secondary'}>
                            {e.isPublished ? 'Published' : 'Draft'}
                          </Badge>
                        </td>
                        <td className="text-end">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => navigate(`/exams/${e.id}/edit`)}
                            title="Edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          <Button
                            variant="outline-success"
                            size="sm"
                            className="me-2"
                            onClick={() => onPublish(e)}
                            disabled={e.isPublished}
                            title="Publish Results"
                          >
                            <i className="bi bi-megaphone"></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => onDelete(e)}
                            title="Delete"
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </Container>
    </Layout>
  );
};
