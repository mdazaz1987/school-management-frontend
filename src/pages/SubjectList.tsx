import React, { useEffect, useState } from 'react';
import { Button, Card, Container, Row, Col, Table, Badge, Alert, Spinner, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { Subject } from '../types';
import { subjectService } from '../services/subjectService';

export const SubjectList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [query, setQuery] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await subjectService.getAllSubjects({ schoolId: user?.schoolId });
      setSubjects(data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.schoolId]);

  const handleToggleActive = async (s: Subject) => {
    try {
      setError('');
      setSuccess('');
      if (s.isActive) {
        await subjectService.deactivate(s.id);
        setSuccess('Subject deactivated');
      } else {
        await subjectService.activate(s.id);
        setSuccess('Subject activated');
      }
      load();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to toggle subject');
    }
  };

  const filtered = subjects.filter((s) =>
    [s.name, s.code, s.category, s.description]
      .map((x) => (x ? String(x).toLowerCase() : ''))
      .some((v) => v.includes(query.toLowerCase()))
  );

  return (
    <Layout>
      <Container className="py-4">
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2>Subjects</h2>
                <p className="text-muted">Manage subjects for your school</p>
              </div>
              <div className="d-flex gap-2">
                <Form.Control
                  size="sm"
                  style={{ width: 260 }}
                  placeholder="Search by name/code/category"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <Button variant="primary" onClick={() => navigate('/subjects/new')}>
                  <i className="bi bi-plus-lg me-2"></i>
                  New Subject
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
                <p className="mt-3">Loading subjects...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox display-1 text-muted"></i>
                <p className="mt-3 text-muted">No subjects found</p>
                <Button variant="primary" onClick={() => navigate('/subjects/new')}>
                  Add Subject
                </Button>
              </div>
            ) : (
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Category</th>
                    <th>Credits</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td><code>{s.code}</code></td>
                      <td><Badge bg="secondary">{s.category}</Badge></td>
                      <td>{s.credits ?? '-'}</td>
                      <td>
                        <Badge bg={s.isActive ? 'success' : 'danger'}>
                          {s.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="text-end">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => navigate(`/subjects/${s.id}/edit`)}
                          title="Edit"
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          variant={s.isActive ? 'outline-danger' : 'outline-success'}
                          size="sm"
                          className="me-2"
                          onClick={() => handleToggleActive(s)}
                          title={s.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <i className={`bi ${s.isActive ? 'bi-x-circle' : 'bi-check-circle'}`}></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </Container>
    </Layout>
  );
};
