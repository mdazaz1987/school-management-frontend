import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { Timetable, TimetableEntry, DayOfWeek, PeriodType, SchoolClass } from '../types';
import { timetableService } from '../services/timetableService';
import { classService } from '../services/classService';

const dayOptions: DayOfWeek[] = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
const periodTypeOptions: PeriodType[] = ['LECTURE','PRACTICAL','BREAK','LUNCH','ASSEMBLY','SPORTS','LIBRARY'];

export const TimetableForm: React.FC = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [classes, setClasses] = useState<SchoolClass[]>([]);

  const currentYear = useMemo(() => {
    const y = new Date().getFullYear();
    return `${y}-${y + 1}`;
  }, []);

  const [form, setForm] = useState<Partial<Timetable>>({
    schoolId: user?.schoolId || '',
    classId: '',
    section: '',
    academicYear: currentYear,
    term: '',
    entries: [
      {
        day: 'MONDAY',
        period: 'Period 1',
        startTime: '',
        endTime: '',
        periodType: 'LECTURE',
        subjectName: '',
        teacherName: '',
        room: '',
      } as TimetableEntry,
    ],
    isActive: true,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const cls = user?.schoolId ? await classService.getAllClasses({ schoolId: user.schoolId }) : [];
        setClasses(cls);
        if (isEdit && id) {
          const tt = await timetableService.getById(id);
          setForm(tt);
        }
      } catch (e: any) {
        setError(e.response?.data?.message || 'Failed to load timetable');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit, user?.schoolId]);

  const handleChange = (key: keyof Timetable, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleEntryChange = (index: number, key: keyof TimetableEntry, value: any) => {
    setForm((prev) => {
      const entries = [...(prev.entries || [])];
      const item = { ...(entries[index] || {}) } as TimetableEntry;
      (item as any)[key] = value;
      entries[index] = item;
      return { ...prev, entries };
    });
  };

  const addEntry = () => {
    setForm((prev) => ({
      ...prev,
      entries: [
        ...(prev.entries || []),
        {
          day: 'MONDAY',
          period: `Period ${(prev.entries?.length || 0) + 1}`,
          startTime: '',
          endTime: '',
          periodType: 'LECTURE',
          subjectName: '',
          teacherName: '',
          room: '',
        } as TimetableEntry,
      ],
    }));
  };

  const removeEntry = (index: number) => {
    setForm((prev) => ({
      ...prev,
      entries: (prev.entries || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const payload: Partial<Timetable> = {
        schoolId: form.schoolId || user?.schoolId || '',
        classId: form.classId || '',
        section: form.section || undefined,
        academicYear: form.academicYear || currentYear,
        term: form.term || undefined,
        entries: (form.entries || []).map((e) => ({
          ...e,
          startTime: e.startTime,
          endTime: e.endTime,
        })),
      };
      if (isEdit && id) {
        await timetableService.update(id, payload);
        setSuccess('Timetable updated successfully');
      } else {
        await timetableService.create(payload);
        setSuccess('Timetable created successfully');
      }
      setTimeout(() => navigate('/timetable'), 800);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save timetable');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <Container className="py-4">
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2>{isEdit ? 'Edit Timetable' : 'New Timetable'}</h2>
                <p className="text-muted">{isEdit ? 'Update timetable details' : 'Create a new class timetable'}</p>
              </div>
              <div>
                <Button variant="secondary" onClick={() => navigate('/timetable')}>Back to List</Button>
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
                <p className="mt-3">Loading...</p>
              </div>
            ) : (
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label>Class</Form.Label>
                      <Form.Select
                        value={form.classId || ''}
                        onChange={(e) => handleChange('classId', e.target.value)}
                        required
                      >
                        <option value="">Select Class</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>{c.className || c.name || c.id}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label>Section</Form.Label>
                      <Form.Control
                        type="text"
                        value={form.section || ''}
                        onChange={(e) => handleChange('section', e.target.value)}
                        placeholder="e.g., A"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label>Academic Year</Form.Label>
                      <Form.Control
                        type="text"
                        value={form.academicYear || ''}
                        onChange={(e) => handleChange('academicYear', e.target.value)}
                        placeholder="e.g., 2025-2026"
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={4} className="mb-3">
                    <Form.Group>
                      <Form.Label>Term</Form.Label>
                      <Form.Control
                        type="text"
                        value={form.term || ''}
                        onChange={(e) => handleChange('term', e.target.value)}
                        placeholder="e.g., Term 1"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="mb-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Entries</h5>
                  <Button variant="outline-primary" size="sm" onClick={addEntry}>
                    <i className="bi bi-plus-lg me-2"></i>
                    Add Entry
                  </Button>
                </div>

                {(form.entries || []).map((entry, idx) => (
                  <Card key={idx} className="border-0 shadow-sm mb-3">
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="mb-0">Entry #{idx + 1}</h6>
                        <div className="d-flex align-items-center gap-2">
                          <Badge bg="secondary">{entry.periodType}</Badge>
                          <Button variant="outline-danger" size="sm" onClick={() => removeEntry(idx)}>
                            <i className="bi bi-trash"></i>
                          </Button>
                        </div>
                      </div>
                      <Row>
                        <Col md={3} className="mb-3">
                          <Form.Group>
                            <Form.Label>Day</Form.Label>
                            <Form.Select
                              value={entry.day}
                              onChange={(e) => handleEntryChange(idx, 'day', e.target.value as DayOfWeek)}
                              required
                            >
                              {dayOptions.map((d) => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={3} className="mb-3">
                          <Form.Group>
                            <Form.Label>Period</Form.Label>
                            <Form.Control
                              type="text"
                              value={entry.period}
                              onChange={(e) => handleEntryChange(idx, 'period', e.target.value)}
                              placeholder="e.g., Period 1"
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={3} className="mb-3">
                          <Form.Group>
                            <Form.Label>Start Time</Form.Label>
                            <Form.Control
                              type="time"
                              value={entry.startTime || ''}
                              onChange={(e) => handleEntryChange(idx, 'startTime', e.target.value)}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={3} className="mb-3">
                          <Form.Group>
                            <Form.Label>End Time</Form.Label>
                            <Form.Control
                              type="time"
                              value={entry.endTime || ''}
                              onChange={(e) => handleEntryChange(idx, 'endTime', e.target.value)}
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Row>
                        <Col md={4} className="mb-3">
                          <Form.Group>
                            <Form.Label>Subject</Form.Label>
                            <Form.Control
                              type="text"
                              value={entry.subjectName || ''}
                              onChange={(e) => handleEntryChange(idx, 'subjectName', e.target.value)}
                              placeholder="e.g., Mathematics"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4} className="mb-3">
                          <Form.Group>
                            <Form.Label>Teacher</Form.Label>
                            <Form.Control
                              type="text"
                              value={entry.teacherName || ''}
                              onChange={(e) => handleEntryChange(idx, 'teacherName', e.target.value)}
                              placeholder="e.g., Mr. Smith"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={2} className="mb-3">
                          <Form.Group>
                            <Form.Label>Room</Form.Label>
                            <Form.Control
                              type="text"
                              value={entry.room || ''}
                              onChange={(e) => handleEntryChange(idx, 'room', e.target.value)}
                              placeholder="e.g., 101"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={2} className="mb-3">
                          <Form.Group>
                            <Form.Label>Type</Form.Label>
                            <Form.Select
                              value={entry.periodType}
                              onChange={(e) => handleEntryChange(idx, 'periodType', e.target.value as PeriodType)}
                              required
                            >
                              {periodTypeOptions.map((pt) => (
                                <option key={pt} value={pt}>{pt}</option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                ))}

                <div className="d-flex gap-2">
                  <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? (
                      <>
                        <Spinner size="sm" animation="border" className="me-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-2"></i>
                        Save
                      </>
                    )}
                  </Button>
                  <Button variant="outline-secondary" type="button" onClick={() => navigate('/timetable')} disabled={saving}>
                    Cancel
                  </Button>
                </div>
              </Form>
            )}
          </Card.Body>
        </Card>
      </Container>
    </Layout>
  );
};
