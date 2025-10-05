import React, { useState } from 'react';
import { Row, Col, Card, Table, Badge, Button, Modal, Form, Alert } from 'react-bootstrap';
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

export const TeacherAssignments: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classSection: '',
    subject: '',
    dueDate: '',
    totalMarks: 100
  });

  const [assignments, setAssignments] = useState([
    {
      id: '1',
      title: 'Mathematics - Chapter 5 Exercise',
      class: 'Grade 10-A',
      subject: 'Mathematics',
      dueDate: '2025-10-15',
      totalMarks: 100,
      submissions: 28,
      totalStudents: 35,
      status: 'active'
    },
    {
      id: '2',
      title: 'Physics Lab Report',
      class: 'Grade 11-A',
      subject: 'Physics',
      dueDate: '2025-10-20',
      totalMarks: 50,
      submissions: 15,
      totalStudents: 28,
      status: 'active'
    }
  ]);

  const handleCreate = () => {
    const newAssignment = {
      id: Date.now().toString(),
      title: formData.title,
      class: formData.classSection,
      subject: formData.subject,
      dueDate: formData.dueDate,
      totalMarks: formData.totalMarks,
      submissions: 0,
      totalStudents: 35,
      status: 'active'
    };
    setAssignments([...assignments, newAssignment]);
    setSuccess('Assignment created and notifications sent to all students!');
    setShowModal(false);
    resetForm();
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleEdit = (assignment: any) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: '',
      classSection: assignment.class,
      subject: assignment.subject,
      dueDate: assignment.dueDate,
      totalMarks: assignment.totalMarks
    });
    setShowModal(true);
  };

  const handleUpdate = () => {
    setAssignments(assignments.map(a => 
      a.id === editingAssignment.id ? { ...a, ...formData } : a
    ));
    setSuccess('Assignment updated successfully!');
    setShowModal(false);
    setEditingAssignment(null);
    resetForm();
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      setAssignments(assignments.filter(a => a.id !== id));
      setSuccess('Assignment deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      classSection: '',
      subject: '',
      dueDate: '',
      totalMarks: 100
    });
  };

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2>Assignments</h2>
                <p className="text-muted">Create and manage assignments</p>
              </div>
              <Button 
                variant="primary" 
                onClick={() => { setEditingAssignment(null); resetForm(); setShowModal(true); }}
              >
                <i className="bi bi-plus-lg me-2"></i>
                Create Assignment
              </Button>
            </div>
          </div>

          {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Due Date</th>
                    <th>Submissions</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td><strong>{assignment.title}</strong></td>
                      <td>{assignment.class}</td>
                      <td><Badge bg="secondary">{assignment.subject}</Badge></td>
                      <td>{new Date(assignment.dueDate).toLocaleDateString()}</td>
                      <td>
                        <span className="text-success">{assignment.submissions}</span> / {assignment.totalStudents}
                      </td>
                      <td><Badge bg="success">{assignment.status}</Badge></td>
                      <td>
                        <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEdit(assignment)}>
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(assignment.id)}>
                          <i className="bi bi-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>{editingAssignment ? 'Edit' : 'Create'} Assignment</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Class/Section *</Form.Label>
                      <Form.Select
                        value={formData.classSection}
                        onChange={(e) => setFormData({ ...formData, classSection: e.target.value })}
                      >
                        <option value="">Select class...</option>
                        <option value="Grade 10-A">Grade 10-A</option>
                        <option value="Grade 10-B">Grade 10-B</option>
                        <option value="Grade 11-A">Grade 11-A</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Subject *</Form.Label>
                      <Form.Select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      >
                        <option value="">Select subject...</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Due Date *</Form.Label>
                      <Form.Control
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Total Marks *</Form.Label>
                      <Form.Control
                        type="number"
                        value={formData.totalMarks}
                        onChange={(e) => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Alert variant="info">
                  <i className="bi bi-info-circle me-2"></i>
                  All students in the selected class will receive a notification about this assignment.
                </Alert>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button 
                variant="primary" 
                onClick={editingAssignment ? handleUpdate : handleCreate}
                disabled={!formData.title || !formData.classSection || !formData.subject || !formData.dueDate}
              >
                {editingAssignment ? 'Update' : 'Create'} Assignment
              </Button>
            </Modal.Footer>
          </Modal>
        </Col>
      </Row>
    </Layout>
  );
};
