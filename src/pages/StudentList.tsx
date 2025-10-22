import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Pagination, Spinner, Alert, Modal } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { studentService } from '../services/studentService';
import { Student, PageResponse } from '../types';
import { useNavigate } from 'react-router-dom';

export const StudentList: React.FC = () => {
  const navigate = useNavigate();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('active');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(10);
  
  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filterStatus]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response: PageResponse<Student> = await studentService.getAllStudents({
        page: currentPage,
        size: pageSize,
        sort: 'firstName,asc'
      });
      
      // Filter by status if needed
      let filteredStudents = response.content;
      if (filterStatus === 'active') {
        filteredStudents = filteredStudents.filter(s => s.isActive);
      } else if (filterStatus === 'inactive') {
        filteredStudents = filteredStudents.filter(s => !s.isActive);
      }
      
      setStudents(filteredStudents);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err: any) {
      console.error('Error loading students:', err);
      setError(err.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadStudents();
      return;
    }

    try {
      setLoading(true);
      setError('');
      const results = await studentService.searchStudents(searchTerm);
      setStudents(results);
      setTotalPages(1);
      setTotalElements(results.length);
    } catch (err: any) {
      console.error('Error searching students:', err);
      setError('Failed to search students');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;

    try {
      setDeleting(true);
      await studentService.deactivateStudent(studentToDelete.id);
      setShowDeleteModal(false);
      setStudentToDelete(null);
      loadStudents(); // Reload the list
    } catch (err: any) {
      console.error('Error deleting student:', err);
      setError(err.response?.data?.message || 'Failed to delete student');
    } finally {
      setDeleting(false);
    }
  };

  const handleActivate = async (student: Student) => {
    try {
      await studentService.updateStatus(student.id, !student.isActive);
      loadStudents(); // Reload the list
    } catch (err: any) {
      console.error('Error updating student status:', err);
      setError(err.response?.data?.message || 'Failed to update student status');
    }
  };

  const confirmDelete = (student: Student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getFullName = (student: Student) => {
    return `${student.firstName} ${student.lastName}`;
  };

  const getClassName = (student: Student) => {
    // Use className field populated by backend, fallback to classId if not available
    return student.className || student.classId || 'N/A';
  };

  return (
    <Layout>
      <Container fluid className="py-4">
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2>Student Management</h2>
                <p className="text-muted">Manage all students in the system</p>
              </div>
              <Button 
                variant="primary" 
                size="lg"
                onClick={() => navigate('/students/new')}
              >
                <i className="bi bi-person-plus me-2"></i>
                Add New Student
              </Button>
            </div>
          </Col>
        </Row>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        {/* Filters and Search */}
        <Row className="mb-4">
          <Col md={6}>
            <InputGroup>
              <Form.Control
                placeholder="Search by name or admission number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button variant="primary" onClick={handleSearch}>
                <i className="bi bi-search"></i> Search
              </Button>
              {searchTerm && (
                <Button 
                  variant="outline-secondary" 
                  onClick={() => {
                    setSearchTerm('');
                    loadStudents();
                  }}
                >
                  Clear
                </Button>
              )}
            </InputGroup>
          </Col>
          <Col md={3}>
            <Form.Select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">All Students</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </Form.Select>
          </Col>
          <Col md={3} className="text-end">
            <Button variant="outline-primary" onClick={loadStudents}>
              <i className="bi bi-arrow-clockwise me-2"></i>
              Refresh
            </Button>
          </Col>
        </Row>

        {/* Students Table */}
        <Card className="border-0 shadow-sm">
          <Card.Header className="bg-white">
            <h5 className="mb-0">
              Students List 
              <Badge bg="primary" className="ms-2">{totalElements} Total</Badge>
            </h5>
          </Card.Header>
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Loading students...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox display-1 text-muted"></i>
                <p className="mt-3 text-muted">No students found</p>
                <Button variant="primary" onClick={() => navigate('/students/new')}>
                  Add First Student
                </Button>
              </div>
            ) : (
              <>
                <Table hover responsive className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Admission No.</th>
                      <th>Name</th>
                      <th>Class</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id}>
                        <td>
                          <strong>{student.admissionNumber}</strong>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            {student.profilePicture ? (
                              <img 
                                src={`${process.env.REACT_APP_API_URL}/profile/photo/${student.profilePicture}`}
                                alt={getFullName(student)}
                                className="rounded-circle me-2"
                                style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div 
                                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2"
                                style={{ width: '32px', height: '32px', fontWeight: 600 }}
                                title={getFullName(student)}
                              >
                                {(() => {
                                  const name = getFullName(student).trim();
                                  const parts = name ? name.split(/\s+/) : [];
                                  const initials = (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
                                  return initials.toUpperCase() || 'S';
                                })()}
                              </div>
                            )}
                            <div>
                              <strong>{getFullName(student)}</strong>
                              {student.rollNumber && (
                                <div className="small text-muted">Roll: {student.rollNumber}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{getClassName(student)}</td>
                        <td>{student.email}</td>
                        <td>{student.phone || '-'}</td>
                        <td>
                          {student.isActive ? (
                            <Badge bg="success">Active</Badge>
                          ) : (
                            <Badge bg="secondary">Inactive</Badge>
                          )}
                        </td>
                        <td className="text-center">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-1"
                            onClick={() => navigate(`/students/${student.id}`)}
                            title="View Details"
                          >
                            <i className="bi bi-eye"></i>
                          </Button>
                          <Button
                            variant="outline-warning"
                            size="sm"
                            className="me-1"
                            onClick={() => navigate(`/students/${student.id}/edit`)}
                            title="Edit"
                          >
                            <i className="bi bi-pencil"></i>
                          </Button>
                          {student.isActive ? (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => confirmDelete(student)}
                              title="Deactivate"
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          ) : (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleActivate(student)}
                              title="Activate"
                            >
                              <i className="bi bi-check-circle"></i>
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-between align-items-center p-3">
                    <div className="text-muted">
                      Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} students
                    </div>
                    <Pagination className="mb-0">
                      <Pagination.First 
                        onClick={() => handlePageChange(0)} 
                        disabled={currentPage === 0}
                      />
                      <Pagination.Prev 
                        onClick={() => handlePageChange(currentPage - 1)} 
                        disabled={currentPage === 0}
                      />
                      
                      {[...Array(totalPages)].map((_, index) => (
                        <Pagination.Item
                          key={index}
                          active={index === currentPage}
                          onClick={() => handlePageChange(index)}
                        >
                          {index + 1}
                        </Pagination.Item>
                      ))}
                      
                      <Pagination.Next 
                        onClick={() => handlePageChange(currentPage + 1)} 
                        disabled={currentPage === totalPages - 1}
                      />
                      <Pagination.Last 
                        onClick={() => handlePageChange(totalPages - 1)} 
                        disabled={currentPage === totalPages - 1}
                      />
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </Card.Body>
        </Card>

        {/* Delete Confirmation Modal */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Deactivation</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {studentToDelete && (
              <>
                <p>Are you sure you want to deactivate this student?</p>
                <div className="alert alert-warning">
                  <strong>{getFullName(studentToDelete)}</strong>
                  <br />
                  Admission No: {studentToDelete.admissionNumber}
                </div>
                <p className="text-muted small">
                  Note: The student will be marked as inactive but not permanently deleted. You can reactivate them later.
                </p>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => setShowDeleteModal(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Deactivating...
                </>
              ) : (
                <>
                  <i className="bi bi-trash me-2"></i>
                  Deactivate
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </Layout>
  );
};
