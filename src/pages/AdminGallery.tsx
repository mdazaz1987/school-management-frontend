import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Form, Button, Table, Badge, Alert, Spinner, Image } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { galleryService, GalleryImage } from '../services/galleryService';

export const AdminGallery: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [form, setForm] = useState<{ title?: string; event?: string }>({ title: '', event: '' });

  const sidebarItems = useMemo(() => [
    { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { path: '/students', label: 'Students', icon: 'bi-people' },
    { path: '/teachers', label: 'Teachers', icon: 'bi-person-badge' },
    { path: '/classes', label: 'Classes', icon: 'bi-door-open' },
    { path: '/subjects', label: 'Subjects', icon: 'bi-book' },
    { path: '/exams', label: 'Exams', icon: 'bi-clipboard-check' },
    { path: '/fees', label: 'Fees', icon: 'bi-cash-coin' },
    { path: '/timetable', label: 'Timetable', icon: 'bi-calendar3' },
    { path: '/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
    { path: '/notifications', label: 'Notifications', icon: 'bi-bell' },
    { path: '/admin/calendar', label: 'Admin Calendar', icon: 'bi-calendar-event' },
    { path: '/admin/approvals', label: 'Approvals', icon: 'bi-check2-square' },
    { path: '/admin/gallery', label: 'Manage Gallery', icon: 'bi-images' },
  ], []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true); setError('');
        const list = await galleryService.list(user?.schoolId);
        setImages(list);
      } catch (e: any) {
        setError('Failed to load gallery');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.schoolId]);

  const onFileChange = (f: File | null) => {
    setFile(f);
    setSuccess(''); setError('');
    if (!f) { setPreview(''); return; }
    if (!f.type.startsWith('image/')) { setError('Please select an image file'); setFile(null); return; }
    if (f.size > 5 * 1024 * 1024) { setError('Max 5MB image'); setFile(null); return; }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true); setError(''); setSuccess('');
      if (!file && !preview) { setError('Please select an image'); return; }
      const created = await galleryService.create({ schoolId: user?.schoolId || '', title: form.title, event: form.event, file: file || undefined, dataUrl: preview || undefined });
      setImages((prev) => [created, ...prev]);
      setSuccess('Uploaded');
      setFile(null); setPreview(''); setForm({ title: '', event: '' });
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to upload');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setLoading(true); setError(''); setSuccess('');
      await galleryService.remove(id, user?.schoolId);
      setImages((prev) => prev.filter((i) => i.id !== id));
      setSuccess('Removed');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to remove');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>Manage Photo Gallery</h2>
            <p className="text-muted">Upload and manage event photos</p>
          </div>

          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

          <Row className="mb-4">
            <Col md={5} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white">
                  <h5 className="mb-0">Upload Image</h5>
                </Card.Header>
                <Card.Body>
                  <Form onSubmit={handleUpload}>
                    <Form.Group className="mb-3">
                      <Form.Label>Title</Form.Label>
                      <Form.Control value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Event / Category</Form.Label>
                      <Form.Control value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })} placeholder="e.g., Annual Day 2025" />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Image</Form.Label>
                      <Form.Control type="file" accept="image/*" onChange={(e: any) => onFileChange(e.target.files?.[0] || null)} />
                      {preview && (
                        <div className="mt-2">
                          <Image src={preview} thumbnail alt="Preview" />
                        </div>
                      )}
                    </Form.Group>
                    <div className="d-grid">
                      <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                        Upload
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
            <Col md={7} className="mb-3">
              <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Gallery</h5>
                  <Badge bg="secondary">{images.length}</Badge>
                </Card.Header>
                <Card.Body className="p-0">
                  {loading ? (
                    <div className="text-center py-4"><Spinner animation="border" /></div>
                  ) : images.length === 0 ? (
                    <div className="text-center text-muted py-4">No images uploaded yet</div>
                  ) : (
                    <Table responsive hover className="mb-0">
                      <thead>
                        <tr>
                          <th>Image</th>
                          <th>Title</th>
                          <th>Event</th>
                          <th>Uploaded</th>
                          <th className="text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {images.map((img) => (
                          <tr key={img.id}>
                            <td><img src={img.url} alt={img.title || ''} style={{ height: 48 }} /></td>
                            <td>{img.title || '-'}</td>
                            <td><Badge bg="info">{img.event || '-'}</Badge></td>
                            <td>{img.createdAt ? new Date(img.createdAt).toLocaleString() : '-'}</td>
                            <td className="text-end">
                              <Button size="sm" variant="outline-danger" onClick={() => handleDelete(img.id)}>Delete</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Layout>
  );
};
