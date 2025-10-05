import React, { useState } from 'react';
import { Row, Col, Card, Table, Form, Badge, Button } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';

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
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [searchName, setSearchName] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [students, setStudents] = useState([
    { id: '1', name: 'John Doe', rollNo: '101', class: 'Grade 10', section: 'A', email: 'john@student.com', attendance: 92, avgGrade: 85 },
    { id: '2', name: 'Jane Smith', rollNo: '102', class: 'Grade 10', section: 'A', email: 'jane@student.com', attendance: 95, avgGrade: 90 },
    { id: '3', name: 'Mike Johnson', rollNo: '103', class: 'Grade 10', section: 'B', email: 'mike@student.com', attendance: 88, avgGrade: 78 },
    { id: '4', name: 'Sarah Williams', rollNo: '201', class: 'Grade 11', section: 'A', email: 'sarah@student.com', attendance: 94, avgGrade: 88 },
    { id: '5', name: 'Tom Brown', rollNo: '104', class: 'Grade 10', section: 'A', email: 'tom@student.com', attendance: 85, avgGrade: 82 },
  ]);

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

  let filteredStudents = students.filter(s => {
    const matchesClass = !selectedClass || s.class === selectedClass;
    const matchesSection = !selectedSection || s.section === selectedSection;
    const matchesName = !searchName || s.name.toLowerCase().includes(searchName.toLowerCase()) ||
                        s.rollNo.includes(searchName);
    return matchesClass && matchesSection && matchesName;
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
                    <Form.Select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                      <option value="">All Classes</option>
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11">Grade 11</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Section</strong></Form.Label>
                    <Form.Select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
                      <option value="">All Sections</option>
                      <option value="A">Section A</option>
                      <option value="B">Section B</option>
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
