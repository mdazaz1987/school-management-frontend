import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Modal, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { customFieldService } from '../services/customFieldService';
import { CustomFieldConfig } from '../types';

export const CustomFieldsManagement: React.FC = () => {
  const { user } = useAuth();
  const [fields, setFields] = useState<CustomFieldConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState<CustomFieldConfig | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<Partial<CustomFieldConfig>>({
    fieldName: '',
    fieldLabel: '',
    fieldType: 'TEXT',
    entityType: 'STUDENT',
    schoolId: user?.schoolId,
    isRequired: false,
    isActive: true,
    displayOrder: 0,
    options: [],
  });

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      setLoading(true);
      const data = await customFieldService.getAllCustomFields({
        schoolId: user?.schoolId,
      });
      setFields(data.sort((a, b) => a.displayOrder - b.displayOrder));
    } catch (err) {
      console.error('Error loading fields:', err);
      setError('Failed to load custom fields');
    } finally {
      setLoading(false);
    }
  };

  const handleShowModal = (field?: CustomFieldConfig) => {
    if (field) {
      setEditingField(field);
      setFormData(field);
    } else {
      setEditingField(null);
      setFormData({
        fieldName: '',
        fieldLabel: '',
        fieldType: 'TEXT',
        entityType: 'STUDENT',
        schoolId: user?.schoolId,
        isRequired: false,
        isActive: true,
        displayOrder: fields.length,
        options: [],
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingField(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingField) {
        await customFieldService.updateCustomField(editingField.id, formData);
        setSuccess('Field updated successfully');
      } else {
        await customFieldService.createCustomField(formData);
        setSuccess('Field created successfully');
      }
      handleCloseModal();
      loadFields();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save field');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this custom field?')) {
      return;
    }

    try {
      await customFieldService.deleteCustomField(id);
      setSuccess('Field deleted successfully');
      loadFields();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete field');
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await customFieldService.toggleActiveStatus(id);
      loadFields();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to toggle field status');
    }
  };

  // Reorder helpers
  const saveNewOrder = async (updated: CustomFieldConfig[]) => {
    try {
      setError('');
      await customFieldService.reorderFields(
        updated.map((f, index) => ({ id: f.id, displayOrder: index }))
      );
      // Normalize local state order after save
      setFields(updated.map((f, index) => ({ ...f, displayOrder: index })));
      setSuccess('Field order updated');
    } catch (err: any) {
      console.error('Failed to reorder fields', err);
      setError(err.response?.data?.message || 'Failed to update field order');
    }
  };

  const moveUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...fields];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    saveNewOrder(updated);
  };

  const moveDown = (index: number) => {
    if (index >= fields.length - 1) return;
    const updated = [...fields];
    [updated[index + 1], updated[index]] = [updated[index], updated[index + 1]];
    saveNewOrder(updated);
  };

  return (
    <Layout>
      <Container fluid className="py-4">
        <Row className="mb-4">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h2>Custom Fields Management</h2>
                <p className="text-muted">Configure additional fields for students, teachers, and other entities</p>
              </div>
              <Button variant="primary" onClick={() => handleShowModal()}>
                <i className="bi bi-plus-lg me-2"></i>
                Add Custom Field
              </Button>
            </div>
          </Col>
        </Row>

        {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

        <Card className="border-0 shadow-sm">
          <Card.Body>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading custom fields...</p>
              </div>
            ) : fields.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox display-1 text-muted"></i>
                <p className="mt-3 text-muted">No custom fields configured yet</p>
                <Button variant="primary" onClick={() => handleShowModal()}>
                  Add First Custom Field
                </Button>
              </div>
            ) : (
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Field Label</th>
                    <th>Field Name</th>
                    <th>Type</th>
                    <th>Entity</th>
                    <th>Required</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, idx) => (
                    <tr key={field.id}>
                      <td>{field.displayOrder}</td>
                      <td>{field.fieldLabel}</td>
                      <td><code>{field.fieldName}</code></td>
                      <td><Badge bg="info">{field.fieldType}</Badge></td>
                      <td><Badge bg="secondary">{field.entityType}</Badge></td>
                      <td>
                        {field.isRequired ? (
                          <Badge bg="warning">Required</Badge>
                        ) : (
                          <Badge bg="light" text="dark">Optional</Badge>
                        )}
                      </td>
                      <td>
                        <Badge bg={field.isActive ? 'success' : 'danger'}>
                          {field.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="outline-dark"
                          size="sm"
                          className="me-2"
                          onClick={() => moveUp(idx)}
                          disabled={idx === 0}
                          title="Move Up"
                        >
                          <i className="bi bi-arrow-up"></i>
                        </Button>
                        <Button
                          variant="outline-dark"
                          size="sm"
                          className="me-2"
                          onClick={() => moveDown(idx)}
                          disabled={idx === fields.length - 1}
                          title="Move Down"
                        >
                          <i className="bi bi-arrow-down"></i>
                        </Button>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleShowModal(field)}
                          title="Edit"
                        >
                          <i className="bi bi-pencil"></i>
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleToggleActive(field.id)}
                          title={field.isActive ? 'Mark Inactive' : 'Mark Active'}
                        >
                          <i className={`bi bi-${field.isActive ? 'pause' : 'play'}`}></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(field.id)}
                          title="Delete"
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>

        {/* Add/Edit Modal */}
        <Modal show={showModal} onHide={handleCloseModal} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{editingField ? 'Edit Custom Field' : 'Add Custom Field'}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Field Label <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.fieldLabel}
                      onChange={(e) => setFormData({ ...formData, fieldLabel: e.target.value })}
                      required
                      placeholder="e.g., Emergency Contact"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Field Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.fieldName}
                      onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
                      required
                      placeholder="e.g., emergencyContact"
                    />
                    <Form.Text className="text-muted">
                      Use camelCase, no spaces
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Field Type <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      value={formData.fieldType}
                      onChange={(e) => setFormData({ ...formData, fieldType: e.target.value as any })}
                      required
                    >
                      <option value="TEXT">Text</option>
                      <option value="NUMBER">Number</option>
                      <option value="DATE">Date</option>
                      <option value="EMAIL">Email</option>
                      <option value="PHONE">Phone</option>
                      <option value="TEXTAREA">Text Area</option>
                      <option value="DROPDOWN">Dropdown</option>
                      <option value="CHECKBOX">Checkbox</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Entity Type <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                      value={formData.entityType}
                      onChange={(e) => setFormData({ ...formData, entityType: e.target.value as any })}
                      required
                    >
                      <option value="STUDENT">Student</option>
                      <option value="TEACHER">Teacher</option>
                      <option value="PARENT">Parent</option>
                      <option value="CLASS">Class</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Display Order</Form.Label>
                    <Form.Control
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Placeholder</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.placeholder || ''}
                      onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Help Text</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.helpText || ''}
                      onChange={(e) => setFormData({ ...formData, helpText: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Check
                    type="checkbox"
                    label="Required Field"
                    checked={formData.isRequired}
                    onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                    className="mb-3"
                  />
                </Col>
                <Col md={6}>
                  <Form.Check
                    type="checkbox"
                    label="Active"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mb-3"
                  />
                </Col>
              </Row>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingField ? 'Update' : 'Create'} Field
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>
    </Layout>
  );
};
