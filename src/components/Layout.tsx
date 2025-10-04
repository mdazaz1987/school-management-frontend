import React, { ReactNode } from 'react';
import { Container, Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme, effectiveTheme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <Navbar bg="primary" variant="dark" expand="lg" className="mb-4">
        <Container fluid>
          <Navbar.Brand href="/dashboard">
            <i className="bi bi-mortarboard-fill me-2"></i>
            School Management System
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center">
              <NotificationBell />
              <NavDropdown
                title={
                  <span title={`Theme: ${theme} (${effectiveTheme})`}>
                    <i className={`bi ${effectiveTheme === 'dark' ? 'bi-moon-stars' : 'bi-brightness-high'} me-2`}></i>
                    Theme
                  </span>
                }
                id="theme-dropdown"
                align="end"
              >
                <NavDropdown.Item active={theme === 'light'} onClick={() => setTheme('light')}>
                  <i className="bi bi-brightness-high me-2"></i>
                  Light
                </NavDropdown.Item>
                <NavDropdown.Item active={theme === 'dark'} onClick={() => setTheme('dark')}>
                  <i className="bi bi-moon-stars me-2"></i>
                  Dark
                </NavDropdown.Item>
                <NavDropdown.Item active={theme === 'system'} onClick={() => setTheme('system')}>
                  <i className="bi bi-circle-half me-2"></i>
                  System
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={toggleTheme}>
                  <i className="bi bi-arrow-repeat me-2"></i>
                  Toggle Light/Dark
                </NavDropdown.Item>
              </NavDropdown>
              <NavDropdown
                title={
                  <span>
                    <i className="bi bi-person-circle me-2"></i>
                    {user?.firstName} {user?.lastName}
                  </span>
                }
                id="user-dropdown"
                align="end"
              >
                <NavDropdown.Item href="/profile">
                  <i className="bi bi-person me-2"></i>
                  Profile
                </NavDropdown.Item>
                <NavDropdown.Item href="/settings">
                  <i className="bi bi-gear me-2"></i>
                  Settings
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container fluid>{children}</Container>
    </div>
  );
};
