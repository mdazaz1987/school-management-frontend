import React from 'react';
import { Card, ListGroup, Badge, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { calendarService, CalendarEvent } from '../services/calendarService';

interface Props {
  title?: string;
  days?: number;
  schoolId?: string;
}

export const CalendarWidget: React.FC<Props> = ({ title = 'School Calendar', days = 60, schoolId }) => {
  const { user } = useAuth();
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const sid = schoolId || (user as any)?.schoolId;
        const list = await calendarService.upcoming(sid, days);
        setEvents(list);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.schoolId, schoolId, days]);

  const fmtRange = (e: CalendarEvent) => {
    const sd = new Date(e.startDate);
    const ed = e.endDate ? new Date(e.endDate) : sd;
    const same = sd.toDateString() === ed.toDateString();
    const toShort = (d: Date) => d.toLocaleDateString();
    return same ? toShort(sd) : `${toShort(sd)} → ${toShort(ed)}`;
  };

  return (
    <Card className="border-0 shadow-sm h-100">
      <Card.Header className="bg-white d-flex justify-content-between align-items-center">
        <h5 className="mb-0">{title}</h5>
        <Badge bg="secondary">{events.length}</Badge>
      </Card.Header>
      <Card.Body className="p-0">
        {loading ? (
          <div className="text-center py-4"><Spinner animation="border" /></div>
        ) : events.length === 0 ? (
          <div className="text-center text-muted py-4">No upcoming holidays or events</div>
        ) : (
          <ListGroup variant="flush">
            {events.map((e) => (
              <ListGroup.Item key={e.id}>
                <div className="d-flex align-items-start">
                  <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
                    <i className={`bi ${e.type === 'HOLIDAY' ? 'bi-umbrella' : 'bi-calendar-event'} text-primary`}></i>
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between">
                      <strong>{e.title}</strong>
                      <Badge bg={e.type === 'HOLIDAY' ? 'success' : 'info'}>{e.type}</Badge>
                    </div>
                    <small className="text-muted">{fmtRange(e)}</small>
                    {e.description && <div className="text-muted small mt-1">{e.description}</div>}
                  </div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card.Body>
    </Card>
  );
};
