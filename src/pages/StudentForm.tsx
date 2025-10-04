import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Tabs, Tab } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { studentService } from '../services/studentService';
import { classService } from '../services/classService';
import { StudentCreateRequest, StudentUpdateRequest, SchoolClass } from '../types';
import { CredentialsModal } from '../components/CredentialsModal';

export const StudentForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  
  // Password creation options
  const [passwordMode, setPasswordMode] = useState<'CUSTOM' | 'GENERATE' | 'NONE'>('GENERATE');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentPasswordConfirm, setStudentPasswordConfirm] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [parentPasswordConfirm, setParentPasswordConfirm] = useState('');
  const [sendEmailToStudent, setSendEmailToStudent] = useState(true);
  const [sendEmailToParents, setSendEmailToParents] = useState(true);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<any[]>([]);

  // Form data
  const [formData, setFormData] = useState<StudentCreateRequest>({
    admissionNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'MALE',
    bloodGroup: '',
    religion: '',
    nationality: 'Indian',
    // TEMP FIX: use fallback until JWT includes schoolId reliably
    schoolId: user?.schoolId || 'school123',
    classId: '',
    section: '',
    rollNumber: '',
    parentId: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zipCode: '',
    fatherName: '',
    fatherPhone: '',
    fatherEmail: '',
    fatherOccupation: '',
    motherName: '',
    motherPhone: '',
    motherEmail: '',
    motherOccupation: '',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    guardianRelation: '',
    previousSchool: '',
    previousClass: '',
    previousPercentage: undefined,
    academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    stream: '',
    admissionDate: new Date().toISOString().split('T')[0],
    isActive: true,
    aadhaarNumber: '',
    apaarId: '',
  });

  const loadClasses = useCallback(async () => {
    try {
      setLoadingClasses(true);
      const classList = await classService.getAllClasses({ schoolId: user?.schoolId });
      setClasses(classList.filter(c => c.isActive));
    } catch (err) {
      console.error('Error loading classes:', err);
    } finally {
      setLoadingClasses(false);
    }
  }, [user?.schoolId]);

  useEffect(() => {
    loadClasses();
    if (isEditMode && id) {
      loadStudent(id);
    }
  }, [id, isEditMode, loadClasses]);

  const loadStudent = async (studentId: string) => {
    try {
      setLoading(true);
      const student = await studentService.getStudentById(studentId);
      
      // Map student data to form
      setFormData({
        admissionNumber: student.admissionNumber,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        phone: student.phone || '',
        dateOfBirth: student.dateOfBirth || '',
        gender: student.gender || 'MALE',
        bloodGroup: student.bloodGroup || '',
        religion: student.religion || '',
        nationality: student.nationality || 'Indian',
        schoolId: student.schoolId,
        classId: student.classId,
        section: student.section || '',
        rollNumber: student.rollNumber || '',
        parentId: student.parentId || '',
        addressLine1: student.address?.addressLine1 || '',
        addressLine2: student.address?.addressLine2 || '',
        city: student.address?.city || '',
        state: student.address?.state || '',
        zipCode: student.address?.zipCode || '',
        fatherName: student.parentInfo?.fatherName || '',
        fatherPhone: student.parentInfo?.fatherPhone || '',
        fatherEmail: student.parentInfo?.fatherEmail || '',
        fatherOccupation: student.parentInfo?.fatherOccupation || '',
        motherName: student.parentInfo?.motherName || '',
        motherPhone: student.parentInfo?.motherPhone || '',
        motherEmail: student.parentInfo?.motherEmail || '',
        motherOccupation: student.parentInfo?.motherOccupation || '',
        guardianName: student.parentInfo?.guardianName || '',
        guardianPhone: student.parentInfo?.guardianPhone || '',
        guardianEmail: student.parentInfo?.guardianEmail || '',
        guardianRelation: student.parentInfo?.guardianRelation || '',
        previousSchool: student.academicInfo?.previousSchool || '',
        previousClass: student.academicInfo?.previousClass || '',
        previousPercentage: student.academicInfo?.previousPercentage,
        academicYear: student.academicInfo?.academicYear || '',
        stream: student.academicInfo?.stream || '',
        admissionDate: student.admissionDate || '',
        isActive: student.isActive,
        aadhaarNumber: student.aadhaarNumber || '',
        apaarId: student.apaarId || '',
      });
    } catch (err: any) {
      console.error('Error loading student:', err);
      setError(err.response?.data?.message || 'Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? undefined : parseFloat(value)) : value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate passwords if in CUSTOM mode
    if (!isEditMode && passwordMode === 'CUSTOM') {
      if (studentPassword && studentPassword !== studentPasswordConfirm) {
        setError('Student passwords do not match');
        return;
      }
      if (parentPassword && parentPassword !== parentPasswordConfirm) {
        setError('Parent passwords do not match');
        return;
      }
      if (!studentPassword || studentPassword.length < 8) {
        setError('Student password must be at least 8 characters');
        return;
      }
    }

    setSaving(true);

    try {
      if (isEditMode && id) {
        // Update existing student (no password changes in edit mode)
        const updateData: StudentUpdateRequest = { ...formData };
        await studentService.partialUpdateStudent(id, updateData);
        // Ensure active flag is persisted via dedicated endpoint
        if (typeof formData.isActive === 'boolean') {
          await studentService.updateStatus(id, !!formData.isActive);
        }
        setSuccess('Student updated successfully!');
        
        setTimeout(() => {
          navigate('/students');
        }, 1500);
      } else {
        // Create new student with password options
        const response = await studentService.createStudentWithCredentials({
          student: formData,
          passwordMode,
          studentPassword: passwordMode === 'CUSTOM' ? studentPassword : undefined,
          parentPassword: passwordMode === 'CUSTOM' ? (parentPassword || studentPassword) : undefined,
          sendEmailToStudent,
          sendEmailToParents
        });

        setSuccess('Student created successfully!');

        // Show credentials modal if there are credentials to display
        if (response.credentialsCreated && response.credentialsCreated.length > 0) {
          const credsWithPasswords = response.credentialsCreated.filter((c: any) => c.password);
          if (credsWithPasswords.length > 0) {
            setCreatedCredentials(response.credentialsCreated);
            setShowCredentialsModal(true);
          } else {
            // No passwords to display, navigate immediately
            setTimeout(() => {
              navigate('/students');
            }, 1500);
          }
        } else {
          setTimeout(() => {
            navigate('/students');
          }, 1500);
        }
      }
    } catch (err: any) {
      console.error('Error saving student:', err);
      setError(err.response?.data?.message || 'Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <Container className="py-5">
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading student details...</p>
          </div>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container fluid className="py-4">
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2>{isEditMode ? 'Edit Student' : 'Add New Student'}</h2>
                <p className="text-muted">Fill in the student information below</p>
              </div>
              <Button variant="outline-secondary" onClick={() => navigate('/students')}>
                <i className="bi bi-arrow-left me-2"></i>
                Back to List
              </Button>
            </div>
          </Col>
        </Row>

        {/* Alerts */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success">
            <i className="bi bi-check-circle me-2"></i>
            {success}
          </Alert>
        )}

        {/* Form */}
        <Form onSubmit={handleSubmit}>
          <Tabs defaultActiveKey="basic" className="mb-4">
            {/* Basic Information Tab */}
            <Tab eventKey="basic" title="Basic Information">
              <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Admission Number <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          type="text"
                          name="admissionNumber"
                          value={formData.admissionNumber}
                          onChange={handleChange}
                          required
                          disabled={isEditMode}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Admission Date</Form.Label>
                        <Form.Control
                          type="date"
                          name="admissionDate"
                          value={formData.admissionDate}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
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
                    <Col md={6}>
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
                  </Row>

                  <Row>
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
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Phone</Form.Label>
                        <Form.Control
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="10 digit mobile number"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={4}>
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
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Gender <span className="text-danger">*</span></Form.Label>
                        <Form.Select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          required
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Blood Group</Form.Label>
                        <Form.Select
                          name="bloodGroup"
                          value={formData.bloodGroup}
                          onChange={handleChange}
                        >
                          <option value="">Select</option>
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
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Religion</Form.Label>
                        <Form.Control
                          type="text"
                          name="religion"
                          value={formData.religion}
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

                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-2">
                        <Form.Check
                          type="checkbox"
                          name="isActive"
                          label="Active Student"
                          checked={!!formData.isActive}
                          onChange={handleCheckboxChange}
                        />
                        <Form.Text className="text-muted">Uncheck to create the student as Inactive.</Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  <hr className="my-4" />
                  <h6 className="mb-3">Class Information</h6>

                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Class <span className="text-danger">*</span></Form.Label>
                        <Form.Select
                          name="classId"
                          value={formData.classId}
                          onChange={handleChange}
                          required
                          disabled={loadingClasses}
                        >
                          <option value="">Select Class</option>
                          {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.name || cls.className} - {cls.section} ({cls.academicYear})
                            </option>
                          ))}
                        </Form.Select>
                        {loadingClasses && (
                          <Form.Text className="text-muted">
                            <Spinner animation="border" size="sm" className="me-1" />
                            Loading classes...
                          </Form.Text>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Section</Form.Label>
                        <Form.Control
                          type="text"
                          name="section"
                          value={formData.section}
                          onChange={handleChange}
                          placeholder="e.g., A"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Roll Number</Form.Label>
                        <Form.Control
                          type="text"
                          name="rollNumber"
                          value={formData.rollNumber}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <hr className="my-4" />
                  <h6 className="mb-3">Government IDs</h6>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Aadhaar Number</Form.Label>
                        <Form.Control
                          type="text"
                          name="aadhaarNumber"
                          value={formData.aadhaarNumber}
                          onChange={handleChange}
                          placeholder="12 digit Aadhaar number"
                          maxLength={12}
                          pattern="\d{12}"
                        />
                        <Form.Text className="text-muted">
                          Enter 12 digit Aadhaar number (stored securely)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>APAAR ID</Form.Label>
                        <Form.Control
                          type="text"
                          name="apaarId"
                          value={formData.apaarId}
                          onChange={handleChange}
                          placeholder="12 character APAAR ID"
                          maxLength={12}
                          pattern="[A-Z0-9]{12}"
                          style={{ textTransform: 'uppercase' }}
                        />
                        <Form.Text className="text-muted">
                          12 alphanumeric characters (Automated Permanent Academic Account Registry)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Tab>

            {/* Academic Information Tab */}
            <Tab eventKey="academic" title="Academic Information">
              <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Academic Year</Form.Label>
                        <Form.Control
                          type="text"
                          name="academicYear"
                          value={formData.academicYear}
                          onChange={handleChange}
                          placeholder="2024-2025"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Stream</Form.Label>
                        <Form.Select
                          name="stream"
                          value={formData.stream}
                          onChange={handleChange}
                        >
                          <option value="">Select Stream</option>
                          <option value="Science">Science</option>
                          <option value="Commerce">Commerce</option>
                          <option value="Arts">Arts</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <hr />
                  <h6 className="mb-3">Previous School Details</h6>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Previous School</Form.Label>
                        <Form.Control
                          type="text"
                          name="previousSchool"
                          value={formData.previousSchool}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Previous Class</Form.Label>
                        <Form.Control
                          type="text"
                          name="previousClass"
                          value={formData.previousClass}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Percentage</Form.Label>
                        <Form.Control
                          type="number"
                          name="previousPercentage"
                          value={formData.previousPercentage || ''}
                          onChange={handleChange}
                          step="0.01"
                          min="0"
                          max="100"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Tab>

            {/* Parent Information Tab */}
            <Tab eventKey="parent" title="Parent Information">
              <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                  <h6 className="mb-3">Father's Information</h6>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Father's Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="fatherName"
                          value={formData.fatherName}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Father's Phone</Form.Label>
                        <Form.Control
                          type="tel"
                          name="fatherPhone"
                          value={formData.fatherPhone}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Father's Email</Form.Label>
                        <Form.Control
                          type="email"
                          name="fatherEmail"
                          value={formData.fatherEmail}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Father's Occupation</Form.Label>
                        <Form.Control
                          type="text"
                          name="fatherOccupation"
                          value={formData.fatherOccupation}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <hr />
                  <h6 className="mb-3">Mother's Information</h6>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Mother's Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="motherName"
                          value={formData.motherName}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Mother's Phone</Form.Label>
                        <Form.Control
                          type="tel"
                          name="motherPhone"
                          value={formData.motherPhone}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Mother's Email</Form.Label>
                        <Form.Control
                          type="email"
                          name="motherEmail"
                          value={formData.motherEmail}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Mother's Occupation</Form.Label>
                        <Form.Control
                          type="text"
                          name="motherOccupation"
                          value={formData.motherOccupation}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <hr />
                  <h6 className="mb-3">Guardian Information (if different)</h6>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Guardian's Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="guardianName"
                          value={formData.guardianName}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Guardian's Phone</Form.Label>
                        <Form.Control
                          type="tel"
                          name="guardianPhone"
                          value={formData.guardianPhone}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Guardian's Email</Form.Label>
                        <Form.Control
                          type="email"
                          name="guardianEmail"
                          value={formData.guardianEmail}
                          onChange={handleChange}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Relation with Student</Form.Label>
                        <Form.Control
                          type="text"
                          name="guardianRelation"
                          value={formData.guardianRelation}
                          onChange={handleChange}
                          placeholder="e.g., Uncle, Grandfather"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Tab>

            {/* Address Tab */}
            <Tab eventKey="address" title="Address">
              <Card className="border-0 shadow-sm mb-4">
                <Card.Body>
                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Address Line 1</Form.Label>
                        <Form.Control
                          type="text"
                          name="addressLine1"
                          value={formData.addressLine1}
                          onChange={handleChange}
                          placeholder="House/Flat No., Street Name"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={12}>
                      <Form.Group className="mb-3">
                        <Form.Label>Address Line 2</Form.Label>
                        <Form.Control
                          type="text"
                          name="addressLine2"
                          value={formData.addressLine2}
                          onChange={handleChange}
                          placeholder="Area, Landmark"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={4}>
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
                    <Col md={4}>
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
                    <Col md={4}>
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
                  </Row>
                </Card.Body>
              </Card>
            </Tab>

            {/* User Account Creation Tab - Only for new students */}
            {!isEditMode && (
              <Tab eventKey="userAccount" title="User Account">
                <Card className="border-0 shadow-sm mb-4">
                  <Card.Body>
                    <Alert variant="info">
                      <i className="bi bi-info-circle me-2"></i>
                      User accounts will be automatically created for the student and their parents/guardians.
                      Choose how to configure the login passwords below.
                    </Alert>

                    <h6 className="mb-3">Password Configuration</h6>
                    
                    <Form.Group className="mb-4">
                      <Form.Label>Password Mode</Form.Label>
                      <div>
                        <Form.Check
                          type="radio"
                          id="password-mode-generate"
                          label="Generate Random Passwords"
                          checked={passwordMode === 'GENERATE'}
                          onChange={() => setPasswordMode('GENERATE')}
                          className="mb-2"
                        />
                        <Form.Text className="d-block text-muted mb-3 ms-4">
                          System will generate secure random passwords. You can view and copy them after student creation.
                        </Form.Text>

                        <Form.Check
                          type="radio"
                          id="password-mode-custom"
                          label="Set Custom Passwords"
                          checked={passwordMode === 'CUSTOM'}
                          onChange={() => setPasswordMode('CUSTOM')}
                          className="mb-2"
                        />
                        <Form.Text className="d-block text-muted mb-3 ms-4">
                          Manually set passwords for the student and parents. Users can login immediately with these passwords.
                        </Form.Text>

                        <Form.Check
                          type="radio"
                          id="password-mode-none"
                          label="Don't Create User Accounts"
                          checked={passwordMode === 'NONE'}
                          onChange={() => setPasswordMode('NONE')}
                          className="mb-2"
                        />
                        <Form.Text className="d-block text-muted ms-4">
                          Skip user account creation. You can create accounts manually later.
                        </Form.Text>
                      </div>
                    </Form.Group>

                    {passwordMode === 'CUSTOM' && (
                      <>
                        <hr className="my-4" />
                        <h6 className="mb-3">Student Password</h6>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Password <span className="text-danger">*</span></Form.Label>
                              <Form.Control
                                type="password"
                                value={studentPassword}
                                onChange={(e) => setStudentPassword(e.target.value)}
                                placeholder="Enter password (min 8 characters)"
                                minLength={8}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Confirm Password <span className="text-danger">*</span></Form.Label>
                              <Form.Control
                                type="password"
                                value={studentPasswordConfirm}
                                onChange={(e) => setStudentPasswordConfirm(e.target.value)}
                                placeholder="Re-enter password"
                                minLength={8}
                                isInvalid={studentPasswordConfirm !== '' && studentPassword !== studentPasswordConfirm}
                              />
                              <Form.Control.Feedback type="invalid">
                                Passwords do not match
                              </Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                        </Row>

                        <hr className="my-4" />
                        <h6 className="mb-3">Parent/Guardian Password</h6>
                        <Alert variant="secondary" className="mb-3">
                          <small>
                            <i className="bi bi-info-circle me-1"></i>
                            Same password will be used for all parent/guardian accounts (Father, Mother, Guardian).
                          </small>
                        </Alert>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Password</Form.Label>
                              <Form.Control
                                type="password"
                                value={parentPassword}
                                onChange={(e) => setParentPassword(e.target.value)}
                                placeholder="Enter password (min 8 characters)"
                                minLength={8}
                              />
                              <Form.Text className="text-muted">
                                Leave blank to use same password as student
                              </Form.Text>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Confirm Password</Form.Label>
                              <Form.Control
                                type="password"
                                value={parentPasswordConfirm}
                                onChange={(e) => setParentPasswordConfirm(e.target.value)}
                                placeholder="Re-enter password"
                                minLength={8}
                                isInvalid={parentPasswordConfirm !== '' && parentPassword !== parentPasswordConfirm}
                              />
                              <Form.Control.Feedback type="invalid">
                                Passwords do not match
                              </Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                        </Row>
                      </>
                    )}

                    {passwordMode !== 'NONE' && (
                      <>
                        <hr className="my-4" />
                        <h6 className="mb-3">Email Notifications</h6>
                        <Form.Group className="mb-3">
                          <Form.Check
                            type="checkbox"
                            id="send-email-student"
                            label="Send credentials to student via email"
                            checked={sendEmailToStudent}
                            onChange={(e) => setSendEmailToStudent(e.target.checked)}
                          />
                          <Form.Text className="text-muted d-block ms-4">
                            Email will be sent to: {formData.email || '(not provided)'}
                          </Form.Text>
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Check
                            type="checkbox"
                            id="send-email-parents"
                            label="Send credentials to parents/guardians via email"
                            checked={sendEmailToParents}
                            onChange={(e) => setSendEmailToParents(e.target.checked)}
                          />
                          <Form.Text className="text-muted d-block ms-4">
                            Emails will be sent to: 
                            {formData.fatherEmail && ` ${formData.fatherEmail}`}
                            {formData.motherEmail && `, ${formData.motherEmail}`}
                            {formData.guardianEmail && `, ${formData.guardianEmail}`}
                            {!formData.fatherEmail && !formData.motherEmail && !formData.guardianEmail && ' (none provided)'}
                          </Form.Text>
                        </Form.Group>

                        {passwordMode === 'GENERATE' && (
                          <Alert variant="warning" className="mt-3">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            <strong>Important:</strong> Generated passwords will be displayed after student creation. 
                            Make sure to save them securely!
                          </Alert>
                        )}
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Tab>
            )}
          </Tabs>

          {/* Action Buttons */}
          <div className="d-flex justify-content-end gap-2">
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate('/students')}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <i className="bi bi-check-circle me-2"></i>
                  {isEditMode ? 'Update Student' : 'Create Student'}
                </>
              )}
            </Button>
          </div>
        </Form>

        {/* Credentials Display Modal */}
        <CredentialsModal
          show={showCredentialsModal}
          onHide={() => {
            setShowCredentialsModal(false);
            navigate('/students');
          }}
          credentials={createdCredentials}
          studentName={`${formData.firstName} ${formData.lastName}`}
        />
      </Container>
    </Layout>
  );
};
