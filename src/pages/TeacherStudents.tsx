import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Table, Form, Badge, Button } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { teacherService } from '../services/teacherService';
import { useLocation } from 'react-router-dom';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/teacher/my-classes', label: 'My Classes', icon: 'bi-door-open' },
  { path: '/teacher/assignments', label: 'Assignments', icon: 'bi-file-text' },
  { path: '/teacher/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
  { path: '/teacher/grading', label: 'Grading', icon: 'bi-star' },
  { path: '/teacher/timetable', label: 'My Timetable', icon: 'bi-calendar3' },
  { path: '/teacher/students', label: 'Students', icon: 'bi-people' },
];

export const TeacherStudents: React.FC = () => {
  const location = useLocation();
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [searchName, setSearchName] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [myClasses, setMyClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // Load teacher's classes on mount
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const classes = await teacherService.getMyClasses();
        setMyClasses(classes || []);
        const params = new URLSearchParams(location.search);
        const preSel = params.get('classId');
        if (preSel && (classes || []).some((c: any) => c.id === preSel)) setSelectedClassId(preSel);
        else if ((classes || []).length > 0) setSelectedClassId(classes[0].id);
      } catch (e) {
        setMyClasses([]);
      }
    };
    loadClasses();
  }, [location.search]);

  // Load students when class changes
  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClassId) { setStudents([]); return; }
      try {
        const enriched = await teacherService.getEnrichedClassStudents(selectedClassId);
        const mapped = (enriched || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          rollNo: s.rollNo,
          class: s.studentClass,
          section: s.section,
          email: s.email,
          attendance: s.attendance,
          avgGrade: s.avgGrade,
        }));
        setStudents(mapped);
      } catch (e) {
        setStudents([]);
      }
    };
    loadStudents();
  }, [selectedClassId]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <i className="bi bi-chevron-expand ms-1"></i>;
    return sortOrder === 'asc' ? <i className="bi bi-chevron-up ms-1"></i> : <i className="bi bi-chevron-down ms-1"></i>;
  };

  const sections = useMemo(() => {
    const set = new Set<string>();
    (students || []).forEach((s: any) => { if (s.section) set.add(s.section); });
    return Array.from(set);
  }, [students]);

  // Ensure selectedSection is valid for current students list
  useEffect(() => {
    if (selectedSection && !sections.includes(selectedSection)) {
      setSelectedSection('');
    }
  }, [sections, selectedSection]);

  let filteredStudents = students.filter((s: any) => {
    const matchesSection = !selectedSection || s.section === selectedSection;
    const matchesName = !searchName || (s.name || '').toLowerCase().includes(searchName.toLowerCase()) ||
                        String(s.rollNo || '').includes(searchName);
    return matchesSection && matchesName;
  });

  filteredStudents = filteredStudents.sort((a, b) => {
    let aVal: any, bVal: any;
    
    switch (sortBy) {
      case 'name':
        aVal = a.name;
        bVal = b.name;
        break;
      case 'rollNo':
        aVal = a.rollNo;
        bVal = b.rollNo;
        break;
      case 'attendance':
        aVal = a.attendance;
        bVal = b.attendance;
        break;
      case 'avgGrade':
        aVal = a.avgGrade;
        bVal = b.avgGrade;
        break;
      default:
        return 0;
    }

    if (typeof aVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    } else {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }
  });

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>Students</h2>
            <p className="text-muted">View and manage your students</p>
          </div>

          <Card className="border-0 shadow-sm mb-4">
            <Card.Body>
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Class</strong></Form.Label>
                    <Form.Select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
                      <option value="">Select Class</option>
                      {myClasses.map((c) => (
                        <option key={c.id} value={c.id}>{c.name || `${c.className} ${c.section || ''}`}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Section</strong></Form.Label>
                    <Form.Select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
                      <option value="">All Sections</option>
                      {sections.map((sec) => (
                        <option key={sec} value={sec}>{`Section ${sec}`}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Search</strong></Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Search by name or roll number..."
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">All Students</h5>
              <Badge bg="primary">{filteredStudents.length} students</Badge>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('rollNo')}>
                      Roll No {getSortIcon('rollNo')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                      Name {getSortIcon('name')}
                    </th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Email</th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('attendance')}>
                      Attendance {getSortIcon('attendance')}
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('avgGrade')}>
                      Avg Grade {getSortIcon('avgGrade')}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td><strong>{student.rollNo}</strong></td>
                      <td>{student.name}</td>
                      <td>{student.class}</td>
                      <td><Badge bg="secondary">{student.section}</Badge></td>
                      <td><small>{student.email}</small></td>
                      <td>
                        <Badge bg={student.attendance >= 90 ? 'success' : student.attendance >= 75 ? 'primary' : 'danger'}>
                          {student.attendance}%
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={student.avgGrade >= 90 ? 'success' : student.avgGrade >= 75 ? 'primary' : 'warning'}>
                          {student.avgGrade}%
                        </Badge>
                      </td>
                      <td>
                        <Button variant="outline-primary" size="sm">
                          <i className="bi bi-eye"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Layout>
  );
};
