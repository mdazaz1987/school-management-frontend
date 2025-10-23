import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Badge, Spinner, Button, Modal } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { galleryService, GalleryImage } from '../services/galleryService';
import { useNavigate, useParams } from 'react-router-dom';

function toSlug(s?: string) {
  return String(s || 'General').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export const GalleryEvent: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const list = await galleryService.list(user?.schoolId);
        setImages(list || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.schoolId]);

  const eventName = useMemo(() => {
    // Find event name that matches slug
    const names = Array.from(new Set((images || []).map(i => i.event || 'General')));
    return names.find(n => toSlug(n) === slug) || 'General';
  }, [images, slug]);

  const eventImages = useMemo(() => (images || []).filter(i => toSlug(i.event) === slug), [images, slug]);

  const showPrev = () => {
    if (activeIndex === null) return;
    setActiveIndex((prev) => {
      const i = (prev as number) - 1;
      return i < 0 ? eventImages.length - 1 : i;
    });
  };
  const showNext = () => {
    if (activeIndex === null) return;
    setActiveIndex((prev) => (((prev as number) + 1) % eventImages.length));
  };

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar />
        </Col>
        <Col md={10}>
          <div className="mb-4 d-flex justify-content-between align-items-center">
            <div>
              <h2>{eventName}</h2>
              <p className="text-muted">{eventImages.length} {eventImages.length === 1 ? 'photo' : 'photos'}</p>
            </div>
            <div>
              <Button variant="outline-secondary" size="sm" onClick={() => navigate('/gallery')}>
                <i className="bi bi-arrow-left me-1"></i> Back to Gallery
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-4"><Spinner animation="border" /></div>
          ) : eventImages.length === 0 ? (
            <div className="text-center text-muted py-5">No photos for this event</div>
          ) : (
            <Row className="g-3">
              {eventImages.map((img, idx) => (
                <Col sm={6} md={4} lg={3} key={img.id}>
                  <Card className="border-0 shadow-sm h-100" role="button" onClick={() => setActiveIndex(idx)}>
                    <Card.Img variant="top" src={img.url} alt={img.title || ''} style={{ height: 200, objectFit: 'cover' }} />
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div className="fw-semibold">{img.title || 'Untitled'}</div>
                          <small className="text-muted">{img.createdAt ? new Date(img.createdAt).toLocaleDateString() : ''}</small>
                        </div>
                        <Badge bg="info">View</Badge>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Col>
      </Row>

      <Modal show={activeIndex !== null} onHide={() => setActiveIndex(null)} centered fullscreen>
        <Modal.Header closeButton>
          <Modal.Title>{eventName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {activeIndex !== null && (
            <div className="text-center">
              <img
                src={eventImages[activeIndex].url}
                alt={eventImages[activeIndex].title || ''}
                style={{ maxHeight: '90vh', width: '100%', objectFit: 'contain' }}
              />
              <div className="d-flex justify-content-between align-items-center mt-3">
                <Button variant="outline-secondary" onClick={showPrev}>
                  <i className="bi bi-chevron-left me-1"></i> Prev
                </Button>
                <div className="text-muted small">
                  {activeIndex + 1} / {eventImages.length}
                </div>
                <Button variant="outline-secondary" onClick={showNext}>
                  Next <i className="bi bi-chevron-right ms-1"></i>
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Layout>
  );
};
