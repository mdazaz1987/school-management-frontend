import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Table, Badge } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { timetableService } from '../services/timetableService';
import { classService } from '../services/classService';
import { subjectService } from '../services/subjectService';
import { teacherService } from '../services/teacherService';
import { TimetableEntry, DayOfWeek, SchoolClass, Subject, Teacher, Classroom } from '../types';
import { classroomService } from '../services/classroomService';
import { FaSave, FaTimes, FaClock, FaCalendarAlt } from 'react-icons/fa';

const WORKING_DAYS: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

interface TimeSlot {
  period: string;
  startTime: string;
  endTime: string;
  type: 'LECTURE' | 'BREAK' | 'LUNCH';
}

export const TimetableFormImproved: React.FC = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [existingTimetables, setExistingTimetables] = useState<any[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Record<string, Classroom[]>>({}); // key: `${day}-${slotIndex}`

  // Form state
  const [selectedClass, setSelectedClass] = useState('');
  const [section, setSection] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [term, setTerm] = useState('');

  // Time slots configuration
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([
    { period: 'Period 1', startTime: '08:00', endTime: '09:00', type: 'LECTURE' },
    { period: 'Period 2', startTime: '09:00', endTime: '10:00', type: 'LECTURE' },
    { period: 'Break', startTime: '10:00', endTime: '10:15', type: 'BREAK' },
    { period: 'Period 3', startTime: '10:15', endTime: '11:15', type: 'LECTURE' },
    { period: 'Period 4', startTime: '11:15', endTime: '12:15', type: 'LECTURE' },
    { period: 'Lunch', startTime: '12:15', endTime: '13:00', type: 'LUNCH' },
    { period: 'Period 5', startTime: '13:00', endTime: '14:00', type: 'LECTURE' },
    { period: 'Period 6', startTime: '14:00', endTime: '15:00', type: 'LECTURE' },
  ]);

  // Timetable grid: [day][slotIndex] = { subjectId, teacherId }
  const [timetableGrid, setTimetableGrid] = useState<Record<string, Record<number, { subjectId: string; teacherId: string; room: string }>>>({});

  // ---- Availability helpers (component scope) ----
  const toMinutes = (t?: string): number => {
    if (!t) return -1;
    const hhmm = t.slice(0,5);
    const [h, m] = hhmm.split(':').map(Number);
    return (h * 60) + m;
  };

  // Fetch available rooms for a given cell (day, slot)
  const fetchAvailableRooms = async (day: DayOfWeek, slotIndex: number) => {
    try {
      const slotStart = timeSlots[slotIndex]?.startTime;
      const slotEnd = timeSlots[slotIndex]?.endTime;
      if (!user?.schoolId || !slotStart || !slotEnd) return;
      let rooms = await classroomService.getAvailability({
        schoolId: user.schoolId,
        day,
        startTime: slotStart.slice(0,5),
        endTime: slotEnd.slice(0,5),
        excludeTimetableId: isEdit && id ? id : undefined,
      });
      const key = `${day}-${slotIndex}`;
      if (!rooms || rooms.length === 0) {
        // Fallback: show all active rooms for selection
        try {
          const all = await classroomService.list({ schoolId: user.schoolId });
          rooms = (all || []).filter(r => r && (r as any).isActive !== false);
        } catch {}
      }
      setAvailableRooms(prev => ({ ...prev, [key]: rooms || [] }));
    } catch {
      // As a last resort, try listing all rooms
      try {
        if (!user?.schoolId) return;
        const key = `${day}-${slotIndex}`;
        const all = await classroomService.list({ schoolId: user.schoolId });
        setAvailableRooms(prev => ({ ...prev, [key]: (all || []).filter(r => r && (r as any).isActive !== false) }));
      } catch {}
    }
  };

  const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string): boolean => {
    const as = toMinutes(aStart), ae = toMinutes(aEnd), bs = toMinutes(bStart), be = toMinutes(bEnd);
    if (as < 0 || ae < 0 || bs < 0 || be < 0) return false;
    return as < be && ae > bs;
  };

  const isTeacherFree = (teacherId: string, day: DayOfWeek, slotIndex: number): boolean => {
    const slot = timeSlots[slotIndex];
    if (!slot || slot.type !== 'LECTURE') return true; // only lectures restrict

    // Check against existing school timetables
    for (const tt of existingTimetables) {
      const entries = (tt.entries || []);
      for (const e of entries) {
        if (e.teacherId !== teacherId) continue;
        if ((e.day || '').toUpperCase() !== day) continue;
        if (overlaps(e.startTime, e.endTime, slot.startTime, slot.endTime)) return false;
      }
    }

    // Check against current grid selections for this timetable in progress
    const gridDay = timetableGrid[day] || {};
    for (const [idxStr, cell] of Object.entries(gridDay)) {
      const idx = Number(idxStr);
      if (idx === slotIndex) continue; // same cell
      if (!cell?.teacherId) continue;
      if (cell.teacherId !== teacherId) continue;
      const other = timeSlots[idx];
      if (other && overlaps(other.startTime, other.endTime, slot.startTime, slot.endTime)) return false;
    }

    return true;
  };

  useEffect(() => {
    loadData();
  }, [user?.schoolId]);

  const loadData = async () => {
    if (!user?.schoolId) return;
    
    try {
      setLoading(true);
      const [classesData, subjectsData, teachersData] = await Promise.all([
        classService.getAllClasses({ schoolId: user.schoolId }),
        subjectService.getAllSubjects({ schoolId: user.schoolId }),
        teacherService.getTeachersBySchool(user.schoolId),
      ]);
      
      setClasses(classesData);
      setSubjects(subjectsData.filter(s => s.isActive));
      // Include inactive teachers to ensure previously assigned teacher still appears when editing
      setTeachers(teachersData);

      // Load all timetables in this school for teacher availability validation
      try {
        const allTt = await timetableService.list({ schoolId: user.schoolId });
        // In edit mode, exclude the timetable being edited from availability checks
        setExistingTimetables(id ? (allTt || []).filter((tt: any) => tt.id !== id) : (allTt || []));
      } catch {}

      // Set default academic year
      const year = new Date().getFullYear();
      setAcademicYear(`${year}-${year + 1}`);

      // Load existing timetable if editing
      if (id) {
        const existing = await timetableService.getById(id);
        setSelectedClass(existing.classId || '');
        setSection(existing.section || '');
        setAcademicYear(existing.academicYear || '');
        setTerm(existing.term || '');
        
        // Parse existing entries into grid
        const grid: Record<string, Record<number, { subjectId: string; teacherId: string; room: string }>> = {};
        existing.entries?.forEach(entry => {
          if (!grid[entry.day]) grid[entry.day] = {};
          const slotIndex = timeSlots.findIndex(slot => slot.period === entry.period);
          if (slotIndex >= 0) {
            grid[entry.day][slotIndex] = {
              subjectId: entry.subjectId || '',
              teacherId: entry.teacherId || '',
              room: entry.room || '',
            };
          }
        });
        setTimetableGrid(grid);
      }
    } catch (err: any) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const updateCell = (day: DayOfWeek, slotIndex: number, field: 'subjectId' | 'teacherId' | 'room', value: string) => {
    setTimetableGrid(prev => {
      const newGrid = { ...prev };
      if (!newGrid[day]) newGrid[day] = {};
      if (!newGrid[day][slotIndex]) newGrid[day][slotIndex] = { subjectId: '', teacherId: '', room: '' };
      newGrid[day][slotIndex] = { ...newGrid[day][slotIndex], [field]: value };
      return newGrid;
    });
    // When time params present and room is requested, refresh availability for that cell
    if (field === 'room') {
      // no-op; user selected a room from list
    }
  };

  const clearCell = (day: DayOfWeek, slotIndex: number) => {
    setTimetableGrid(prev => {
      const newGrid = { ...prev };
      if (newGrid[day]) {
        delete newGrid[day][slotIndex];
      }
      return newGrid;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClass) {
      setError('Please select a class');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Convert grid to entries
      const entries: TimetableEntry[] = [];
      
      WORKING_DAYS.forEach(day => {
        timeSlots.forEach((slot, index) => {
          const cell = timetableGrid[day]?.[index];
          const subject = cell?.subjectId ? subjects.find(s => s.id === cell.subjectId) : null;
          const teacher = cell?.teacherId ? teachers.find(t => t.id === cell.teacherId) : null;
          
          entries.push({
            day,
            period: slot.period,
            startTime: slot.startTime,
            endTime: slot.endTime,
            periodType: slot.type,
            subjectId: cell?.subjectId || '',
            subjectName: subject?.name || '',
            teacherId: cell?.teacherId || '',
            teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}`.trim() : '',
            room: cell?.room || '',
          });
        });
      });

      const payload = {
        schoolId: user?.schoolId,
        classId: selectedClass,
        section: section || undefined,
        academicYear,
        term: term || undefined,
        entries,
      };

      if (isEdit && id) {
        await timetableService.update(id, payload);
        setSuccess('Timetable updated successfully!');
      } else {
        await timetableService.create(payload);
        setSuccess('Timetable created successfully!');
      }

      setTimeout(() => navigate('/timetable'), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save timetable');
    } finally {
      setSaving(false);
    }
  };

  const addTimeSlot = () => {
    const lastSlot = timeSlots[timeSlots.length - 1];
    const [hours, minutes] = lastSlot.endTime.split(':').map(Number);
    const newStart = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    const newEnd = `${String(hours + 1).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    
    setTimeSlots(prev => [...prev, {
      period: `Period ${prev.filter(s => s.type === 'LECTURE').length + 1}`,
      startTime: newStart,
      endTime: newEnd,
      type: 'LECTURE',
    }]);
  };

  const removeTimeSlot = (index: number) => {
    if (timeSlots.length <= 1) return;
    setTimeSlots(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <Layout>
        <Container className="py-5 text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading...</p>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container fluid className="py-4">
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="mb-1">
                  <FaCalendarAlt className="me-2" />
                  {isEdit ? 'Edit Timetable' : 'Create Timetable'}
                </h2>
                <p className="text-muted mb-0">Create a complete weekly timetable for a class</p>
              </div>
              <Button variant="secondary" onClick={() => navigate('/timetable')}>
                <FaTimes className="me-2" />
                Cancel
              </Button>
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

        <Form onSubmit={handleSubmit}>
          {/* Class Selection */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Class Information</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Class *</Form.Label>
                    <Form.Select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      required
                      disabled={isEdit}
                    >
                      <option value="">Select Class</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name|| c.className}{c.section}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Section</Form.Label>
                    <Form.Control
                      type="text"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      placeholder="A, B, C..."
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Academic Year *</Form.Label>
                    <Form.Control
                      type="text"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      placeholder="2025-2026"
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="mb-3">
                    <Form.Label>Term</Form.Label>
                    <Form.Control
                      type="text"
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                      placeholder="Term 1"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Time Slots Configuration */}
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <FaClock className="me-2" />
                Time Slots
              </h5>
              <Button variant="outline-primary" size="sm" onClick={addTimeSlot}>
                + Add Slot
              </Button>
            </Card.Header>
            <Card.Body>
              <Row>
                {timeSlots.map((slot, index) => (
                  <Col md={3} key={index} className="mb-3">
                    <Card className={slot.type !== 'LECTURE' ? 'bg-light' : ''}>
                      <Card.Body className="p-2">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <Form.Control
                            size="sm"
                            value={slot.period}
                            onChange={(e) => {
                              const newSlots = [...timeSlots];
                              newSlots[index].period = e.target.value;
                              setTimeSlots(newSlots);
                            }}
                          />
                          {timeSlots.length > 1 && (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 ms-2 text-danger"
                              onClick={() => removeTimeSlot(index)}
                            >
                              ×
                            </Button>
                          )}
                        </div>
                        <div className="d-flex gap-2 mb-2">
                          <Form.Control
                            type="time"
                            size="sm"
                            value={slot.startTime}
                            onChange={(e) => {
                              const newSlots = [...timeSlots];
                              newSlots[index].startTime = e.target.value;
                              setTimeSlots(newSlots);
                            }}
                          />
                          <span className="align-self-center">-</span>
                          <Form.Control
                            type="time"
                            size="sm"
                            value={slot.endTime}
                            onChange={(e) => {
                              const newSlots = [...timeSlots];
                              newSlots[index].endTime = e.target.value;
                              setTimeSlots(newSlots);
                            }}
                          />
                        </div>
                        <Form.Select
                          size="sm"
                          value={slot.type}
                          onChange={(e) => {
                            const newSlots = [...timeSlots];
                            newSlots[index].type = e.target.value as any;
                            setTimeSlots(newSlots);
                          }}
                        >
                          <option value="LECTURE">Lecture</option>
                          <option value="BREAK">Break</option>
                          <option value="LUNCH">Lunch</option>
                        </Form.Select>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>

          {/* Timetable Grid */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Weekly Timetable</h5>
            </Card.Header>
            <Card.Body className="p-0" style={{ overflowX: 'auto' }}>
              <Table bordered hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ minWidth: '100px' }}>Day / Period</th>
                    {timeSlots.map((slot, index) => (
                      <th key={index} style={{ minWidth: '200px' }} className={slot.type !== 'LECTURE' ? 'bg-secondary text-white' : ''}>
                        <div>{slot.period}</div>
                        <small className="text-muted">{slot.startTime} - {slot.endTime}</small>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {WORKING_DAYS.map(day => (
                    <tr key={day}>
                      <td className="fw-bold">{day}</td>
                      {timeSlots.map((slot, slotIndex) => {
                        if (slot.type !== 'LECTURE') {
                          return (
                            <td key={slotIndex} className="bg-light text-center align-middle">
                              <Badge bg="secondary">{slot.type}</Badge>
                            </td>
                          );
                        }

                        const cell = timetableGrid[day]?.[slotIndex] || { subjectId: '', teacherId: '', room: '' };
                        
                        const classObj = classes.find(c => c.id === selectedClass);
                        const classSubjectIds = (classObj?.subjects || []) as string[];
                        const subjectsForClass = subjects.filter(s => {
                          if (classSubjectIds && classSubjectIds.length > 0) return classSubjectIds.includes(s.id);
                          if (Array.isArray(s.classIds) && s.classIds.length > 0) return s.classIds.includes(selectedClass);
                          return true; // no mapping -> available to all
                        });
                        const key = `${day}-${slotIndex}`;

                        return (
                          <td key={slotIndex} className="p-2">
                            {timeSlots[slotIndex].type !== 'LECTURE' ? (
                              <div className="text-center text-muted" style={{fontSize: 12}}>
                                {timeSlots[slotIndex].type}
                              </div>
                            ) : (
                              <>
                                <Form.Select
                                  size="sm"
                                  className="mb-1"
                                  value={cell.subjectId}
                                  onChange={(e) => updateCell(day, slotIndex, 'subjectId', e.target.value)}
                                >
                                  <option value="">Select Subject</option>
                                  {subjectsForClass.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                                </Form.Select>
                                <Form.Select
                                  size="sm"
                                  className="mb-1"
                                  value={cell.teacherId}
                                  onChange={(e) => updateCell(day, slotIndex, 'teacherId', e.target.value)}
                                >
                                  <option value="">Select Teacher</option>
                                  {(() => {
                                    const assigned = cell.teacherId;
                                    const assignedTeacher = assigned ? teachers.find(t => t.id === assigned) : undefined;
                                    const filtered = teachers
                                      .filter(t => isTeacherFree(t.id, day, slotIndex))
                                      .filter(t => {
                                        // Subject-teacher constraint on UI as well
                                        const subj = subjects.find(s => s.id === cell.subjectId);
                                        if (!subj) return true; // if no subject selected, show all
                                        const ids = (subj as any).teacherIds as string[] | undefined;
                                        if (!ids || ids.length === 0) return true; // unrestricted subject
                                        return ids.includes(t.id) || ids.includes((t as any).userId);
                                      });
                                    const finalList = assignedTeacher && !filtered.some(t => t.id === assignedTeacher.id)
                                      ? [assignedTeacher, ...filtered]
                                      : filtered;
                                    return finalList.map(t => (
                                      <option key={t.id} value={t.id}>
                                        {t.firstName} {t.lastName}{t.isActive === false ? ' (inactive)' : ''}
                                      </option>
                                    ));
                                  })()}
                                </Form.Select>
                                <div className="d-flex gap-1">
                                  <Form.Select
                                    size="sm"
                                    value={cell.room}
                                    onFocus={() => fetchAvailableRooms(day, slotIndex)}
                                    onClick={() => fetchAvailableRooms(day, slotIndex)}
                                    onMouseDown={() => fetchAvailableRooms(day, slotIndex)}
                                    onChange={(e) => updateCell(day, slotIndex, 'room', e.target.value)}
                                  >
                                    <option value="">Select Room</option>
                                    {(availableRooms[key] || []).length === 0 ? (
                                      <option value="">No rooms available</option>
                                    ) : (
                                      (availableRooms[key] || []).map(r => (
                                        <option key={r.id} value={r.name}>
                                          {r.name}{r.capacity ? ` (${r.capacity})` : ''}
                                        </option>
                                      ))
                                    )}
                                  </Form.Select>
                                  {(cell.subjectId || cell.teacherId) && (
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => clearCell(day, slotIndex)}
                                      title="Clear"
                                    >
                                      ×
                                    </Button>
                                  )}
                                </div>
                              </>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Action Buttons */}
          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={() => navigate('/timetable')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="me-2" />
                  {isEdit ? 'Update' : 'Create'} Timetable
                </>
              )}
            </Button>
          </div>
        </Form>
      </Container>
    </Layout>
  );
};
