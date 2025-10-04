import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert, ListGroup, Tab, Nav } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { useNavigate, useParams } from 'react-router-dom';
import { teacherService } from '../services/teacherService';
import { subjectService } from '../services/subjectService';
import { classService } from '../services/classService';
import { Teacher, Subject, SchoolClass } from '../types';
import { FaEdit, FaArrowLeft, FaEnvelope, FaPhone, FaBriefcase, FaGraduationCap, FaChalkboardTeacher, FaBook, FaUserCheck } from 'react-icons/fa';

export const TeacherDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTeacherDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadTeacherDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError('');

      const teacherData = await teacherService.getTeacherById(id);
      setTeacher(teacherData);

      // Load subjects
      if (teacherData.subjectIds && teacherData.subjectIds.length > 0) {
        const subjectPromises = teacherData.subjectIds.map(subjectId =>
          subjectService.getById(subjectId).catch(() => null)
        );
        const subjectsData = await Promise.all(subjectPromises);
        setSubjects(subjectsData.filter((s): s is Subject => s !== null));
      }

      // Load classes
      if (teacherData.classIds && teacherData.classIds.length > 0) {
        const classPromises = teacherData.classIds.map(classId =>
          classService.getClassById(classId).catch(() => null)
        );
        const classesData = await Promise.all(classPromises);
        setClasses(classesData.filter(c => c !== null) as SchoolClass[]);
      }
    } catch (err: any) {
      console.error('Error loading teacher details:', err);
      setError(err.response?.data?.message || 'Failed to load teacher details');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!teacher) return;
    try {
      setSaving(true);
      await teacherService.activateTeacher(teacher.id);
      setTeacher({ ...teacher, isActive: true } as any);
    } catch (e) {
      setError('Failed to activate teacher');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Container className="py-5 text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Loading teacher details...</p>
        </Container>
      </Layout>
    );
  }

  if (error || !teacher) {
    return (
      <Layout>
        <Container className="py-5">
          <Alert variant="danger">
            {error || 'Teacher not found'}
          </Alert>
          <Button variant="primary" onClick={() => navigate('/teachers')}>
            <FaArrowLeft className="me-2" />
            Back to Teachers
          </Button>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container fluid className="py-4">
        <Row className="mb-4">
          <Col>
            <Button
              variant="outline-secondary"
              onClick={() => navigate('/teachers')}
              className="mb-3"
            >
              <FaArrowLeft className="me-2" />
              Back to Teachers
            </Button>
          </Col>
        </Row>

        <Row>
          <Col lg={4}>
            {/* Teacher Profile Card */}
            <Card className="mb-4">
              <Card.Body className="text-center">
                {teacher.profilePicture ? (
                  <img
                    src={teacher.profilePicture}
                    alt={`${teacher.firstName} ${teacher.lastName}`}
                    className="rounded-circle mb-3"
                    style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-3"
                    style={{ width: '150px', height: '150px', fontSize: '48px' }}
                  >
                    {teacher.firstName[0]}{teacher.lastName[0]}
                  </div>
                )}

                <h4 className="mb-2">{teacher.firstName} {teacher.lastName}</h4>
                <p className="text-muted mb-2">{teacher.employmentInfo?.designation || 'Teacher'}</p>
                <Badge bg={teacher.isActive ? 'success' : 'secondary'}>
                  {teacher.isActive ? 'Active' : 'Inactive'}
                </Badge>

                <hr />

                <div className="text-start">
                  <p className="mb-2">
                    <strong>Employee ID:</strong> <code>{teacher.employeeId}</code>
                  </p>
                  <p className="mb-2">
                    <FaEnvelope className="me-2" />
                    {teacher.email}
                  </p>
                  {teacher.phone && (
                    <p className="mb-2">
                      <FaPhone className="me-2" />
                      {teacher.phone}
                    </p>
                  )}
                </div>

                <hr />

                {teacher.isActive ? (
                  <Button
                    variant="primary"
                    className="w-100"
                    onClick={() => navigate(`/teachers/${teacher.id}/edit`)}
                  >
                    <FaEdit className="me-2" />
                    Edit Teacher
                  </Button>
                ) : (
                  <Button
                    variant="success"
                    className="w-100"
                    onClick={handleActivate}
                    disabled={saving}
                  >
                    <FaUserCheck className="me-2" />
                    {saving ? 'Activating...' : 'Activate Teacher'}
                  </Button>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8}>
            <Tab.Container defaultActiveKey="personal">
              <Card>
                <Card.Header>
                  <Nav variant="tabs">
                    <Nav.Item>
                      <Nav.Link eventKey="personal">Personal Info</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="qualification">
                        <FaGraduationCap className="me-2" />
                        Qualification
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="employment">
                        <FaBriefcase className="me-2" />
                        Employment
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="assignment">
                        <FaChalkboardTeacher className="me-2" />
                        Assignment
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                </Card.Header>

                <Card.Body>
                  <Tab.Content>
                    {/* Personal Information */}
                    <Tab.Pane eventKey="personal">
                      <Row>
                        <Col md={6}>
                          <ListGroup variant="flush">
                            <ListGroup.Item>
                              <strong>Date of Birth:</strong> {teacher.dateOfBirth || 'N/A'}
                            </ListGroup.Item>
                            <ListGroup.Item>
                              <strong>School ID:</strong> {teacher.schoolId || 'N/A'}
                            </ListGroup.Item>
                            <ListGroup.Item>
                              <strong>Gender:</strong> {teacher.gender || 'N/A'}
                            </ListGroup.Item>
                            <ListGroup.Item>
                              <strong>Blood Group:</strong> {teacher.bloodGroup || 'N/A'}
                            </ListGroup.Item>
                            <ListGroup.Item>
                              <strong>Marital Status:</strong> {teacher.maritalStatus || 'N/A'}
                            </ListGroup.Item>
                          </ListGroup>
                        </Col>
                        <Col md={6}>
                          <ListGroup variant="flush">
                            <ListGroup.Item>
                              <strong>Nationality:</strong> {teacher.nationality || 'N/A'}
                            </ListGroup.Item>
                            <ListGroup.Item>
                              <strong>Joining Date:</strong> {teacher.joiningDate || 'N/A'}
                            </ListGroup.Item>
                            <ListGroup.Item>
                              <strong>Created At:</strong>{' '}
                              {new Date(teacher.createdAt).toLocaleDateString()}
                            </ListGroup.Item>
                          </ListGroup>
                        </Col>
                      </Row>

                      {teacher.address && (
                        <>
                          <h5 className="mt-4 mb-3">Address</h5>
                          <p>
                            {(teacher.address as any).addressLine1 || (teacher.address as any).street || ''}
                            {(teacher.address as any).addressLine2 && <><br />{(teacher.address as any).addressLine2}</>}
                            <br />
                            {teacher.address.city && `${teacher.address.city}, `}
                            {teacher.address.state && `${teacher.address.state} `}
                            {teacher.address.zipCode}
                          </p>
                        </>
                      )}
                    </Tab.Pane>

                    {/* Qualification */}
                    <Tab.Pane eventKey="qualification">
                      {teacher.qualificationInfo ? (
                        <ListGroup variant="flush">
                          <ListGroup.Item>
                            <strong>Highest Degree:</strong>{' '}
                            {teacher.qualificationInfo.highestDegree || 'N/A'}
                          </ListGroup.Item>
                          <ListGroup.Item>
                            <strong>University:</strong>{' '}
                            {teacher.qualificationInfo.university || 'N/A'}
                          </ListGroup.Item>
                          <ListGroup.Item>
                            <strong>Year of Passing:</strong>{' '}
                            {teacher.qualificationInfo.yearOfPassing || 'N/A'}
                          </ListGroup.Item>
                          <ListGroup.Item>
                            <strong>Percentage/CGPA:</strong>{' '}
                            {teacher.qualificationInfo.percentage || 'N/A'}
                          </ListGroup.Item>
                          {teacher.qualificationInfo.certifications && teacher.qualificationInfo.certifications.length > 0 && (
                            <ListGroup.Item>
                              <strong>Certifications:</strong>
                              <ul className="mt-2 mb-0">
                                {teacher.qualificationInfo.certifications.map((cert, idx) => (
                                  <li key={idx}>{cert}</li>
                                ))}
                              </ul>
                            </ListGroup.Item>
                          )}
                          {teacher.qualificationInfo.specializations && teacher.qualificationInfo.specializations.length > 0 && (
                            <ListGroup.Item>
                              <strong>Specializations:</strong>
                              <ul className="mt-2 mb-0">
                                {teacher.qualificationInfo.specializations.map((spec, idx) => (
                                  <li key={idx}>{spec}</li>
                                ))}
                              </ul>
                            </ListGroup.Item>
                          )}
                        </ListGroup>
                      ) : (
                        <p className="text-muted">No qualification information available</p>
                      )}
                    </Tab.Pane>

                    {/* Employment */}
                    <Tab.Pane eventKey="employment">
                      {teacher.employmentInfo ? (
                        <>
                          <ListGroup variant="flush">
                            <ListGroup.Item>
                              <strong>Designation:</strong>{' '}
                              {teacher.employmentInfo.designation || 'N/A'}
                            </ListGroup.Item>
                            <ListGroup.Item>
                              <strong>Department:</strong>{' '}
                              {teacher.employmentInfo.department || 'N/A'}
                            </ListGroup.Item>
                            <ListGroup.Item>
                              <strong>Employment Type:</strong>{' '}
                              {teacher.employmentInfo.employmentType || 'N/A'}
                            </ListGroup.Item>
                            <ListGroup.Item>
                              <strong>Total Experience:</strong>{' '}
                              {teacher.employmentInfo.totalExperience ? `${teacher.employmentInfo.totalExperience} years` : 'N/A'}
                            </ListGroup.Item>
                            {teacher.employmentInfo.previousSchool && (
                              <ListGroup.Item>
                                <strong>Previous School:</strong>{' '}
                                {teacher.employmentInfo.previousSchool}
                              </ListGroup.Item>
                            )}
                          </ListGroup>

                          {teacher.employmentInfo.achievements && teacher.employmentInfo.achievements.length > 0 && (
                            <>
                              <h5 className="mt-4 mb-3">Achievements</h5>
                              <ul>
                                {teacher.employmentInfo.achievements.map((achievement, idx) => (
                                  <li key={idx}>{achievement}</li>
                                ))}
                              </ul>
                            </>
                          )}

                          <h5 className="mt-4 mb-3">Bank Details</h5>
                          <ListGroup variant="flush">
                            <ListGroup.Item>
                              <strong>Bank Name:</strong>{' '}
                              {teacher.employmentInfo.bankName || 'N/A'}
                            </ListGroup.Item>
                            <ListGroup.Item>
                              <strong>Account Number:</strong>{' '}
                              {teacher.employmentInfo.bankAccountNumber || 'N/A'}
                            </ListGroup.Item>
                            <ListGroup.Item>
                              <strong>IFSC Code:</strong>{' '}
                              {teacher.employmentInfo.ifscCode || 'N/A'}
                            </ListGroup.Item>
                            <ListGroup.Item>
                              <strong>PAN Number:</strong>{' '}
                              {teacher.employmentInfo.panNumber || 'N/A'}
                            </ListGroup.Item>
                          </ListGroup>
                        </>
                      ) : (
                        <p className="text-muted">No employment information available</p>
                      )}
                    </Tab.Pane>

                    {/* Assignment */}
                    <Tab.Pane eventKey="assignment">
                      <Row>
                        <Col md={6}>
                          <h5 className="mb-3">
                            <FaBook className="me-2" />
                            Assigned Subjects ({subjects.length})
                          </h5>
                          {subjects.length > 0 ? (
                            <ListGroup>
                              {subjects.map(subject => (
                                <ListGroup.Item key={subject.id}>
                                  <strong>{subject.name}</strong>
                                  <br />
                                  <small className="text-muted">Code: {subject.code}</small>
                                </ListGroup.Item>
                              ))}
                            </ListGroup>
                          ) : (
                            <p className="text-muted">No subjects assigned</p>
                          )}
                        </Col>

                        <Col md={6}>
                          <h5 className="mb-3">
                            <FaChalkboardTeacher className="me-2" />
                            Assigned Classes ({classes.length})
                          </h5>
                          {classes.length > 0 ? (
                            <ListGroup>
                              {classes.map(cls => (
                                <ListGroup.Item key={cls.id}>
                                  <strong>{cls.className || cls.name}</strong> - {cls.section}
                                  <br />
                                  <small className="text-muted">
                                    Students: {cls.studentIds?.length || 0}
                                  </small>
                                </ListGroup.Item>
                              ))}
                            </ListGroup>
                          ) : (
                            <p className="text-muted">No classes assigned</p>
                          )}
                        </Col>
                      </Row>
                    </Tab.Pane>
                  </Tab.Content>
                </Card.Body>
              </Card>
            </Tab.Container>
          </Col>
        </Row>
      </Container>
    </Layout>
  );
};
