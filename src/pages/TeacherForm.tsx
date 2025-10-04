import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Nav, Tab } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { teacherService } from '../services/teacherService';
import { subjectService } from '../services/subjectService';
import { classService } from '../services/classService';
import { TeacherCreateRequest, Subject, SchoolClass } from '../types';
import { FaSave, FaTimes, FaUser, FaBriefcase, FaGraduationCap, FaUniversity } from 'react-icons/fa';

export const TeacherForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('personal');

  // Prefer schoolId from auth context, fallback to localStorage if needed
  const { user } = useAuth();
  const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
  const schoolId = user?.schoolId || userInfo.schoolId || '';

  // Form data
  const [formData, setFormData] = useState<TeacherCreateRequest>({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'MALE',
    bloodGroup: '',
    nationality: 'Indian',
    maritalStatus: 'Single',
    schoolId: schoolId,
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    highestDegree: '',
    university: '',
    yearOfPassing: undefined,
    certifications: [],
    specializations: [],
    percentage: undefined,
    designation: '',
    department: '',
    salary: undefined,
    employmentType: 'Full-time',
    totalExperience: undefined,
    previousSchoolEmployment: '',
    achievements: [],
    bankAccountNumber: '',
    bankName: '',
    ifscCode: '',
    panNumber: '',
    subjectIds: [],
    classIds: [],
    joiningDate: new Date().toISOString().split('T')[0],
    passwordMode: 'GENERATE',
    teacherPassword: '',
    sendEmailToTeacher: true,
  });

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load subjects and classes
      const [subjectsData, classesData] = await Promise.all([
        subjectService.getAllSubjects({ schoolId }),
        classService.getAllClasses({ schoolId })
      ]);
      
      setSubjects(subjectsData);
      setClasses(classesData);

      // If edit mode, load teacher data
      if (id) {
        const teacher = await teacherService.getTeacherById(id);
        setFormData({
          employeeId: teacher.employeeId,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          email: teacher.email,
          phone: teacher.phone || '',
          dateOfBirth: teacher.dateOfBirth || '',
          gender: teacher.gender || 'MALE',
          bloodGroup: teacher.bloodGroup || '',
          nationality: teacher.nationality || 'Indian',
          maritalStatus: teacher.maritalStatus || 'Single',
          schoolId: teacher.schoolId,
          addressLine1: (teacher.address as any)?.addressLine1 || (teacher.address as any)?.street || '',
          addressLine2: (teacher.address as any)?.addressLine2 || '',
          city: teacher.address?.city || '',
          state: teacher.address?.state || '',
          zipCode: teacher.address?.zipCode || '',
          highestDegree: teacher.qualificationInfo?.highestDegree || '',
          university: teacher.qualificationInfo?.university || '',
          yearOfPassing: teacher.qualificationInfo?.yearOfPassing,
          certifications: teacher.qualificationInfo?.certifications || [],
          specializations: teacher.qualificationInfo?.specializations || [],
          percentage: teacher.qualificationInfo?.percentage,
          designation: teacher.employmentInfo?.designation || '',
          department: teacher.employmentInfo?.department || '',
          salary: teacher.employmentInfo?.salary,
          employmentType: teacher.employmentInfo?.employmentType || 'Full-time',
          totalExperience: teacher.employmentInfo?.totalExperience,
          previousSchoolEmployment: teacher.employmentInfo?.previousSchool || '',
          achievements: teacher.employmentInfo?.achievements || [],
          bankAccountNumber: teacher.employmentInfo?.bankAccountNumber || '',
          bankName: teacher.employmentInfo?.bankName || '',
          ifscCode: teacher.employmentInfo?.ifscCode || '',
          panNumber: teacher.employmentInfo?.panNumber || '',
          subjectIds: teacher.subjectIds || [],
          classIds: teacher.classIds || [],
          joiningDate: teacher.joiningDate || '',
          passwordMode: 'NONE',
          sendEmailToTeacher: false,
        });
      }
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value ? Number(value) : undefined) : value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleMultiSelect = (name: string, selectedIds: string[]) => {
    setFormData(prev => ({
      ...prev,
      [name]: selectedIds
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.employeeId.trim()) {
      setError('Employee ID is required');
      setActiveTab('personal');
      return;
    }
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required');
      setActiveTab('personal');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      setActiveTab('personal');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      if (isEditMode && id) {
        // Update existing teacher
        const payload = { ...formData, schoolId: formData.schoolId || schoolId } as any;
        await teacherService.updateTeacher(id, payload);
        setSuccess('Teacher updated successfully!');
      } else {
        // Create new teacher
        const response = await teacherService.createTeacher({ ...formData, schoolId: formData.schoolId || schoolId });
        setSuccess('Teacher created successfully!');
        
        // Show credentials if generated
        if (response.credentialsCreated && response.credentialsCreated.length > 0) {
          const cred = response.credentialsCreated[0];
          if (cred.password) {
            alert(`Teacher login credentials:\nEmail: ${cred.email}\nPassword: ${cred.password}\n\nPlease save these credentials.`);
          }
        }
      }
      
      // Navigate back to list after a short delay
      setTimeout(() => {
        navigate('/teachers');
      }, 1500);
    } catch (err: any) {
      console.error('Error saving teacher:', err);
      setError(err.response?.data?.message || 'Failed to save teacher');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Container className="py-5 text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Loading...</p>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container fluid className="py-4">
        <Row className="mb-4">
          <Col>
            <h2>{isEditMode ? 'Edit Teacher' : 'Add New Teacher'}</h2>
            <p className="text-muted">Fill in the teacher information below</p>
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
          <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'personal')}>
            <Card>
              <Card.Header>
                <Nav variant="tabs">
                  <Nav.Item>
                    <Nav.Link eventKey="personal">
                      <FaUser className="me-2" />
                      Personal Info
                    </Nav.Link>
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
                      <FaUniversity className="me-2" />
                      Assignment
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Header>

              <Card.Body>
                <Tab.Content>
                  {/* Personal Information Tab */}
                  <Tab.Pane eventKey="personal">
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Employee ID <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="employeeId"
                            value={formData.employeeId}
                            onChange={handleChange}
                            required
                            disabled={isEditMode}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Last Name <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Phone</Form.Label>
                          <Form.Control
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Date of Birth</Form.Label>
                          <Form.Control
                            type="date"
                            name="dateOfBirth"
                            value={formData.dateOfBirth}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Gender</Form.Label>
                          <Form.Select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                          >
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Blood Group</Form.Label>
                          <Form.Select
                            name="bloodGroup"
                            value={formData.bloodGroup}
                            onChange={handleChange}
                          >
                            <option value="">Select...</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>Marital Status</Form.Label>
                          <Form.Select
                            name="maritalStatus"
                            value={formData.maritalStatus}
                            onChange={handleChange}
                          >
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Divorced">Divorced</option>
                            <option value="Widowed">Widowed</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Address Line 1</Form.Label>
                          <Form.Control
                            type="text"
                            name="addressLine1"
                            value={formData.addressLine1}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Address Line 2</Form.Label>
                          <Form.Control
                            type="text"
                            name="addressLine2"
                            value={formData.addressLine2}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>City</Form.Label>
                          <Form.Control
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group className="mb-3">
                          <Form.Label>State</Form.Label>
                          <Form.Control
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>ZIP Code</Form.Label>
                          <Form.Control
                            type="text"
                            name="zipCode"
                            value={formData.zipCode}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Nationality</Form.Label>
                          <Form.Control
                            type="text"
                            name="nationality"
                            value={formData.nationality}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Tab.Pane>

                  {/* Qualification Tab */}
                  <Tab.Pane eventKey="qualification">
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Highest Degree</Form.Label>
                          <Form.Control
                            type="text"
                            name="highestDegree"
                            value={formData.highestDegree}
                            onChange={handleChange}
                            placeholder="e.g., M.Ed, B.Ed, PhD"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>University</Form.Label>
                          <Form.Control
                            type="text"
                            name="university"
                            value={formData.university}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Year of Passing</Form.Label>
                          <Form.Control
                            type="number"
                            name="yearOfPassing"
                            value={formData.yearOfPassing || ''}
                            onChange={handleChange}
                            min="1950"
                            max={new Date().getFullYear()}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Percentage/CGPA</Form.Label>
                          <Form.Control
                            type="number"
                            name="percentage"
                            value={formData.percentage || ''}
                            onChange={handleChange}
                            step="0.01"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Tab.Pane>

                  {/* Employment Tab */}
                  <Tab.Pane eventKey="employment">
                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Designation</Form.Label>
                          <Form.Control
                            type="text"
                            name="designation"
                            value={formData.designation}
                            onChange={handleChange}
                            placeholder="e.g., Senior Teacher, HOD"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Department</Form.Label>
                          <Form.Control
                            type="text"
                            name="department"
                            value={formData.department}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Employment Type</Form.Label>
                          <Form.Select
                            name="employmentType"
                            value={formData.employmentType}
                            onChange={handleChange}
                          >
                            <option value="Full-time">Full-time</option>
                            <option value="Part-time">Part-time</option>
                            <option value="Contract">Contract</option>
                            <option value="Guest">Guest</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Total Experience (Years)</Form.Label>
                          <Form.Control
                            type="number"
                            name="totalExperience"
                            value={formData.totalExperience || ''}
                            onChange={handleChange}
                            min="0"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Joining Date</Form.Label>
                          <Form.Control
                            type="date"
                            name="joiningDate"
                            value={formData.joiningDate}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group className="mb-3">
                          <Form.Label>Salary</Form.Label>
                          <Form.Control
                            type="number"
                            name="salary"
                            value={formData.salary || ''}
                            onChange={handleChange}
                            min="0"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Previous School</Form.Label>
                          <Form.Control
                            type="text"
                            name="previousSchoolEmployment"
                            value={formData.previousSchoolEmployment}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <h5 className="mt-4 mb-3">Bank Details</h5>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Bank Account Number</Form.Label>
                          <Form.Control
                            type="text"
                            name="bankAccountNumber"
                            value={formData.bankAccountNumber}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Bank Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="bankName"
                            value={formData.bankName}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>IFSC Code</Form.Label>
                          <Form.Control
                            type="text"
                            name="ifscCode"
                            value={formData.ifscCode}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>PAN Number</Form.Label>
                          <Form.Control
                            type="text"
                            name="panNumber"
                            value={formData.panNumber}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Tab.Pane>

                  {/* Assignment Tab */}
                  <Tab.Pane eventKey="assignment">
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Assigned Subjects</Form.Label>
                          <Form.Select
                            multiple
                            value={formData.subjectIds}
                            onChange={(e) => {
                              const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                              handleMultiSelect('subjectIds', selected);
                            }}
                            style={{ minHeight: '150px' }}
                          >
                            {subjects.map(subject => (
                              <option key={subject.id} value={subject.id}>
                                {subject.name} ({subject.code})
                              </option>
                            ))}
                          </Form.Select>
                          <Form.Text className="text-muted">
                            Hold Ctrl/Cmd to select multiple subjects
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Assigned Classes</Form.Label>
                          <Form.Select
                            multiple
                            value={formData.classIds}
                            onChange={(e) => {
                              const selected = Array.from(e.target.selectedOptions).map(o => o.value);
                              handleMultiSelect('classIds', selected);
                            }}
                            style={{ minHeight: '150px' }}
                          >
                            {classes.map(cls => (
                              <option key={cls.id} value={cls.id}>
                                {cls.className || cls.name} - {cls.section}
                              </option>
                            ))}
                          </Form.Select>
                          <Form.Text className="text-muted">
                            Hold Ctrl/Cmd to select multiple classes
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>

                    {!isEditMode && (
                      <>
                        <h5 className="mt-4 mb-3">Login Credentials</h5>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Password Mode</Form.Label>
                              <Form.Select
                                name="passwordMode"
                                value={formData.passwordMode}
                                onChange={handleChange}
                              >
                                <option value="GENERATE">Auto-generate Password</option>
                                <option value="CUSTOM">Set Custom Password</option>
                                <option value="NONE">Skip Login Creation</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          {formData.passwordMode === 'CUSTOM' && (
                            <Col md={6}>
                              <Form.Group className="mb-3">
                                <Form.Label>Password</Form.Label>
                                <Form.Control
                                  type="password"
                                  name="teacherPassword"
                                  value={formData.teacherPassword}
                                  onChange={handleChange}
                                  placeholder="Enter password"
                                />
                              </Form.Group>
                            </Col>
                          )}
                        </Row>

                        {formData.passwordMode !== 'NONE' && (
                          <Form.Group className="mb-3">
                            <Form.Check
                              type="checkbox"
                              name="sendEmailToTeacher"
                              label="Send credentials via email"
                              checked={formData.sendEmailToTeacher}
                              onChange={handleCheckboxChange}
                            />
                          </Form.Group>
                        )}
                      </>
                    )}
                  </Tab.Pane>
                </Tab.Content>
              </Card.Body>

              <Card.Footer className="text-end">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/teachers')}
                  disabled={saving}
                  className="me-2"
                >
                  <FaTimes className="me-2" />
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" className="me-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaSave className="me-2" />
                      {isEditMode ? 'Update Teacher' : 'Create Teacher'}
                    </>
                  )}
                </Button>
              </Card.Footer>
            </Card>
          </Tab.Container>
        </Form>
      </Container>
    </Layout>
  );
};
