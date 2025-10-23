import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Pagination, Spinner, Alert, Modal } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { Avatar } from '../components/Avatar';
import { teacherService } from '../services/teacherService';
import { Teacher, PageResponse } from '../types';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaSearch, FaEdit, FaEye, FaTrash, FaUserCheck, FaChalkboardTeacher } from 'react-icons/fa';

export const TeacherList: React.FC = () => {
  const navigate = useNavigate();
  
  const [teachers, setTeachers] = useState<Teacher[]>([]);
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
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filterStatus]);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response: PageResponse<Teacher> = await teacherService.getAllTeachers({
        page: currentPage,
        size: pageSize,
        sort: 'firstName,asc'
      });
      
      // Filter by status if needed
      let filteredTeachers = response.content;
      if (filterStatus === 'active') {
        filteredTeachers = filteredTeachers.filter(t => t.isActive);
      } else if (filterStatus === 'inactive') {
        filteredTeachers = filteredTeachers.filter(t => !t.isActive);
      }
      
      setTeachers(filteredTeachers);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err: any) {
      console.error('Error loading teachers:', err);
      setError(err.response?.data?.message || 'Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadTeachers();
      return;
    }

    try {
      setLoading(true);
      setError('');
      const results = await teacherService.searchTeachers(searchTerm);
      setTeachers(results);
      setTotalPages(1);
      setTotalElements(results.length);
    } catch (err: any) {
      console.error('Error searching teachers:', err);
      setError('Failed to search teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!teacherToDelete) return;

    try {
      setDeleting(true);
      await teacherService.deleteTeacher(teacherToDelete.id);
      setShowDeleteModal(false);
      setTeacherToDelete(null);
      loadTeachers();
    } catch (err: any) {
      console.error('Error deleting teacher:', err);
      setError('Failed to delete teacher');
    } finally {
      setDeleting(false);
    }
  };

  const handleActivate = async (teacher: Teacher) => {
    try {
      await teacherService.activateTeacher(teacher.id);
      loadTeachers();
    } catch (err: any) {
      console.error('Error activating teacher:', err);
      setError('Failed to activate teacher');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(0, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => handlePageChange(i)}
        >
          {i + 1}
        </Pagination.Item>
      );
    }

    return (
      <Pagination className="justify-content-center mt-3">
        <Pagination.First onClick={() => handlePageChange(0)} disabled={currentPage === 0} />
        <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 0} />
        {pages}
        <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages - 1} />
        <Pagination.Last onClick={() => handlePageChange(totalPages - 1)} disabled={currentPage === totalPages - 1} />
      </Pagination>
    );
  };

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar />
        </Col>
        <Col md={10}>
      <Container fluid className="py-4">
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2 className="mb-1">
                  <FaChalkboardTeacher className="me-2" />
                  Teachers
                </h2>
                <p className="text-muted mb-0">Manage teacher records</p>
              </div>
              <Button 
                variant="primary" 
                onClick={() => navigate('/teachers/new')}
              >
                <FaPlus className="me-2" />
                Add Teacher
              </Button>
            </div>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Card>
          <Card.Header>
            <Row>
              <Col md={6}>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button variant="outline-secondary" onClick={handleSearch}>
                    <FaSearch />
                  </Button>
                </InputGroup>
              </Col>
              <Col md={3}>
                <Form.Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                >
                  <option value="all">All Teachers</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </Form.Select>
              </Col>
              <Col md={3} className="text-end">
                <span className="text-muted">
                  Total: {totalElements} teacher{totalElements !== 1 ? 's' : ''}
                </span>
              </Col>
            </Row>
          </Card.Header>

          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Loading teachers...</p>
              </div>
            ) : teachers.length === 0 ? (
              <div className="text-center py-5">
                <FaChalkboardTeacher size={48} className="text-muted mb-3" />
                <p className="text-muted">No teachers found</p>
                <Button variant="primary" onClick={() => navigate('/teachers/new')}>
                  <FaPlus className="me-2" />
                  Add First Teacher
                </Button>
              </div>
            ) : (
              <Table responsive hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Designation</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher) => (
                    <tr key={teacher.id}>
                      <td>
                        <code>{teacher.employeeId}</code>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Avatar src={teacher.profilePicture} size={32} className="me-2" />
                          <span className="fw-semibold">
                            {teacher.firstName} {teacher.lastName}
                          </span>
                        </div>
                      </td>
                      <td>{teacher.email}</td>
                      <td>{teacher.phone || '-'}</td>
                      <td>{teacher.employmentInfo?.designation || '-'}</td>
                      <td>{teacher.employmentInfo?.department || '-'}</td>
                      <td>
                        {teacher.isActive ? (
                          <Badge bg="success">Active</Badge>
                        ) : (
                          <Badge bg="secondary">Inactive</Badge>
                        )}
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => navigate(`/teachers/${teacher.id}`)}
                            title="View Details"
                          >
                            <FaEye />
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => navigate(`/teachers/${teacher.id}/edit`)}
                            title="Edit"
                          >
                            <FaEdit />
                          </Button>
                          {!teacher.isActive ? (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleActivate(teacher)}
                              title="Activate"
                            >
                              <FaUserCheck />
                            </Button>
                          ) : (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => {
                                setTeacherToDelete(teacher);
                                setShowDeleteModal(true);
                              }}
                              title="Deactivate"
                            >
                              <FaTrash />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>

          {!loading && teachers.length > 0 && (
            <Card.Footer>
              {renderPagination()}
            </Card.Footer>
          )}
        </Card>

        {/* Delete Confirmation Modal */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Deactivation</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Are you sure you want to deactivate <strong>{teacherToDelete?.firstName} {teacherToDelete?.lastName}</strong>?
            <br />
            <small className="text-muted">You can reactivate this teacher later.</small>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Deactivating...
                </>
              ) : (
                'Deactivate'
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
        </Col>
      </Row>
    </Layout>
  );
};
