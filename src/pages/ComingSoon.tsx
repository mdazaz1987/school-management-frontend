import React from 'react';
import { Container, Card } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import { Layout } from '../components/Layout';

export const ComingSoon: React.FC = () => {
  const location = useLocation();
  const pageName = location.pathname.split('/')[1]?.replace('-', ' ') || 'Page';
  const pageTitle = pageName.charAt(0).toUpperCase() + pageName.slice(1);

  return (
    <Layout>
      <Container className="py-5">
        <Card className="text-center border-0 shadow-sm">
          <Card.Body className="p-5">
            <div className="mb-4">
              <i className="bi bi-hourglass-split display-1 text-primary"></i>
            </div>
            <h1 className="mb-3">{pageTitle}</h1>
            <h4 className="text-muted mb-4">Coming Soon!</h4>
            <p className="lead text-muted">
              This page is under development and will be available soon.
            </p>
            <p className="text-muted">
              <small>Current path: {location.pathname}</small>
            </p>
          </Card.Body>
        </Card>
      </Container>
    </Layout>
  );
};
