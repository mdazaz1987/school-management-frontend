import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Badge, Spinner, Form } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { galleryService, GalleryImage } from '../services/galleryService';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/notifications', label: 'Notifications', icon: 'bi-bell' },
  { path: '/gallery', label: 'Photo Gallery', icon: 'bi-images' },
];

export const Gallery: React.FC = () => {
  const { user } = useAuth();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventFilter, setEventFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const list = await galleryService.list(user?.schoolId);
        setImages(list);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.schoolId]);

  const events = Array.from(new Set(images.map(i => i.event).filter(Boolean) as string[]));
  const filtered = images.filter(i => eventFilter === 'all' || i.event === eventFilter);

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4 d-flex justify-content-between align-items-center">
            <div>
              <h2>Photo Gallery</h2>
              <p className="text-muted">Discover school events and moments</p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Form.Select size="sm" style={{ width: 220 }} value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
                <option value="all">All Events</option>
                {events.map(ev => <option key={ev} value={ev}>{ev}</option>)}
              </Form.Select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-4"><Spinner animation="border" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-muted py-5">No images to show</div>
          ) : (
            <Row className="g-3">
              {filtered.map(img => (
                <Col sm={6} md={4} lg={3} key={img.id}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Img variant="top" src={img.url} alt={img.title || ''} style={{ height: 180, objectFit: 'cover' }} />
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-semibold">{img.title || 'Untitled'}</div>
                          <small className="text-muted">{img.createdAt ? new Date(img.createdAt).toLocaleDateString() : ''}</small>
                        </div>
                        <Badge bg="info">{img.event || 'General'}</Badge>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Col>
      </Row>
    </Layout>
  );
};
