import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Badge, Spinner, Form } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { galleryService, GalleryImage } from '../services/galleryService';
import { useNavigate } from 'react-router-dom';

// Use default role-based sidebar

export const Gallery: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const events = useMemo(() => Array.from(new Set(images.map(i => i.event || 'General'))), [images]);
  const byEvent = useMemo(() => {
    const map = new Map<string, GalleryImage[]>();
    (images || []).forEach(img => {
      const key = img.event || 'General';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(img);
    });
    return map;
  }, [images]);
  const eventKeys = useMemo(() => Array.from(byEvent.keys()).sort((a,b) => a.localeCompare(b)), [byEvent]);
  const filteredKeys = useMemo(() => eventFilter === 'all' ? eventKeys : eventKeys.filter(k => k === eventFilter), [eventKeys, eventFilter]);
  const toSlug = (s: string) => String(s || 'General').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar />
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
          ) : filteredKeys.length === 0 ? (
            <div className="text-center text-muted py-5">No images to show</div>
          ) : (
            <Row className="g-3">
              {filteredKeys.map(eventName => {
                const list = byEvent.get(eventName) || [];
                const cover = list[0];
                return (
                  <Col sm={6} md={4} lg={3} key={eventName}>
                    <Card className="border-0 shadow-sm h-100" role="button" onClick={() => navigate(`/gallery/event/${toSlug(eventName)}`)}>
                      {cover ? (
                        <Card.Img variant="top" src={cover.url} alt={eventName} style={{ height: 180, objectFit: 'cover' }} />
                      ) : null}
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="fw-semibold">{eventName}</div>
                            <small className="text-muted">{list.length} {list.length === 1 ? 'photo' : 'photos'}</small>
                          </div>
                          <Badge bg="info">Stack</Badge>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </Col>
      </Row>
    </Layout>
  );
};
