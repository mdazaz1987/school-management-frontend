import React, { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { Container, Row, Col, Card, Table, Button, Badge, Alert, Spinner, Form, Modal } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { timetableService } from '../services/timetableService';
import { classService } from '../services/classService';
import { SchoolClass, Timetable, School } from '../types';
import { studentService } from '../services/studentService';
import { schoolService } from '../services/schoolService';

export const TimetableList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [classId, setClassId] = useState<string>('');
  const [year, setYear] = useState<string>('');
  const [q, setQ] = useState('');
  const [school, setSchool] = useState<School | null>(null);
  const [showWeekendModal, setShowWeekendModal] = useState(false);
  const [weekendSelection, setWeekendSelection] = useState<string[]>([]);

  const isAdmin = useMemo(() => (user?.roles || []).some(r => r === 'ADMIN' || r === 'ROLE_ADMIN'), [user?.roles]);
  const isStudent = useMemo(() => (user?.roles || []).some(r => r === 'STUDENT' || r === 'ROLE_STUDENT'), [user?.roles]);

  const classById = useMemo(() => {
    const map: Record<string, SchoolClass> = {};
    classes.forEach((c) => (map[c.id] = c));
    return map;
  }, [classes]);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      if (isStudent) {
        // Student can only view their class timetable
        if (user?.email) {
          try {
            const stu = await studentService.getStudentByEmail(user.email);
            if (stu.classId) {
              try {
                const tt = await timetableService.getByClass(stu.classId, stu.section);
                setTimetables(tt ? [tt] : []);
              } catch {
                setTimetables([]);
              }
            } else {
              setTimetables([]);
            }
          } catch {
            setTimetables([]);
          }
        }
        setClasses([]);
      } else {
        const [tt, cls] = await Promise.all([
          timetableService.list({ schoolId: user?.schoolId || '', academicYear: year || undefined }),
          user?.schoolId ? classService.getAllClasses({ schoolId: user.schoolId }) : Promise.resolve([] as SchoolClass[]),
        ]);
        setTimetables(tt);
        setClasses(cls);
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load timetables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.schoolId, year, isStudent, user?.email]);

  useEffect(() => {
    const loadSchool = async () => {
      if (!isAdmin || !user?.schoolId) return;
      try {
        const s = await schoolService.getById(user.schoolId);
        setSchool(s);
        setWeekendSelection((s?.configuration?.weekendDays || []).map((d: any) => String(d).toUpperCase()));
      } catch {}
    };
    loadSchool();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, user?.schoolId]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this timetable?')) return;
    try {
      await timetableService.remove(id);
      setSuccess('Timetable deleted');
      load();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to delete timetable');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await timetableService.toggleActive(id);
      load();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to toggle');
    }
  };

  const filtered = timetables.filter((t) => {
    if (classId && t.classId !== classId) return false;
    const cls = classById[t.classId];
    const hay = [
      cls?.className || cls?.name || '',
      t.section || '',
      t.academicYear || '',
      t.term || '',
    ]
      .map((x) => (x ? String(x).toLowerCase() : ''))
      .join(' ');
    return hay.includes(q.toLowerCase());
  });

  return (
    <Layout>
      <Container className="py-4">
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2>Timetables</h2>
                <p className="text-muted">Manage class timetables</p>
              </div>
              <div className="d-flex gap-2">
                <Form.Select size="sm" value={classId} onChange={(e) => setClassId(e.target.value)} style={{ width: 200 }}>
                  <option value="">All Classes</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.className || c.name || c.id}</option>
                  ))}
                </Form.Select>
                <Form.Control
                  size="sm"
                  style={{ width: 160 }}
                  placeholder="Academic Year"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
                <Form.Control
                  size="sm"
                  style={{ width: 240 }}
                  placeholder="Search by class/year/term"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                {isAdmin && (
                  <Button variant="primary" onClick={() => navigate('/timetable/new')}>
                    <i className="bi bi-plus-lg me-2"></i>
                    New Timetable
                  </Button>
                )}
                {isAdmin && (
                  <Button variant="outline-secondary" onClick={() => setShowWeekendModal(true)}>
                    <i className="bi bi-calendar-x me-2"></i>
                    Weekend Days
                  </Button>
                )}
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
                <p className="mt-3">Loading timetables...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox display-1 text-muted"></i>
                <p className="mt-3 text-muted">No timetables found</p>
                {isAdmin && <Button variant="primary" onClick={() => navigate('/timetable/new')}>Create Timetable</Button>}
              </div>
            ) : (
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Academic Year</th>
                    <th>Term</th>
                    <th>Entries</th>
                    <th>Status</th>
                    {isAdmin && <th className="text-end">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => {
                    const c = classById[t.classId];
                    return (
                      <tr key={t.id}>
                        <td>{c ? (c.className || c.name) : t.classId}</td>
                        <td>{t.section || '-'}</td>
                        <td>{t.academicYear || '-'}</td>
                        <td>{t.term || '-'}</td>
                        <td>{t.entries?.length || 0}</td>
                        <td>
                          <Badge bg={t.isActive ? 'success' : 'secondary'}>
                            {t.isActive ? 'ACTIVE' : 'INACTIVE'}
                          </Badge>
                        </td>
                        {isAdmin && (
                          <td className="text-end">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              onClick={() => navigate(`/timetable/${t.id}/edit`)}
                              title="Edit"
                            >
                              <i className="bi bi-pencil"></i>
                            </Button>
                            <Button
                              variant="outline-warning"
                              size="sm"
                              className="me-2"
                              onClick={() => handleToggle(t.id)}
                              title="Toggle Active"
                            >
                              <i className="bi bi-toggle2-on"></i>
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(t.id)}
                              title="Delete"
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </Container>
      {isAdmin && (
        <Modal show={showWeekendModal} onHide={() => setShowWeekendModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Configure Weekend Days</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="d-flex flex-column gap-2">
              {['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'].map(d => (
                <Form.Check
                  key={d}
                  type="checkbox"
                  id={`wk-${d}`}
                  label={d.charAt(0) + d.slice(1).toLowerCase()}
                  checked={weekendSelection.includes(d)}
                  onChange={(e) => {
                    setWeekendSelection(prev => {
                      const set = new Set(prev);
                      if (e.target.checked) set.add(d); else set.delete(d);
                      return Array.from(set);
                    });
                  }}
                />
              ))}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowWeekendModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={async () => {
              if (!user?.schoolId) return;
              try {
                const updated = await schoolService.update(user.schoolId, {
                  ...school,
                  configuration: { ...(school?.configuration || {}), weekendDays: weekendSelection }
                } as any);
                setSchool(updated);
                setShowWeekendModal(false);
                setSuccess('Weekend days updated');
                setTimeout(() => setSuccess(''), 2000);
              } catch (e: any) {
                setError(e?.response?.data?.message || 'Failed to update weekend days');
              }
            }}>Save</Button>
          </Modal.Footer>
        </Modal>
      )}
    </Layout>
  );
};
