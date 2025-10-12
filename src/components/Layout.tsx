import React, { ReactNode, useEffect, useState } from 'react';
import { Container, Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import { schoolService } from '../services/schoolService';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme, effectiveTheme, toggleTheme, colorTheme, setColorTheme } = useTheme();
  
  // Branding state
  const [brandName, setBrandName] = useState<string>('School Management System');
  const [brandLogo, setBrandLogo] = useState<string | undefined>(undefined);

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const sid = (user as any)?.schoolId;
        if (!sid) return;
        const info = await schoolService.getPublicBasic(sid);
        if (info?.name) setBrandName(info.name);
        if (info?.logo) setBrandLogo(info.logo);
      } catch {
        // keep defaults
      }
    };
    loadBranding();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <Navbar className="navbar-primary mb-4" variant="dark" expand="lg">
        <Container fluid>
          <Navbar.Brand href="/dashboard" className="d-flex align-items-center gap-2">
            {brandLogo ? (
              <img src={brandLogo} alt="logo" style={{ height: 24 }} />
            ) : (
              <i className="bi bi-mortarboard-fill"></i>
            )}
            <span>{brandName}</span>
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
                <NavDropdown.Header>Mode</NavDropdown.Header>
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
                <NavDropdown.Header>Color</NavDropdown.Header>
                <NavDropdown.Item active={colorTheme === 'blue'} onClick={() => setColorTheme('blue')}>
                  <i className="bi bi-circle-fill me-2" style={{color: '#0d6efd'}}></i>
                  Blue
                </NavDropdown.Item>
                <NavDropdown.Item active={colorTheme === 'purple'} onClick={() => setColorTheme('purple')}>
                  <i className="bi bi-circle-fill me-2" style={{color: '#6f42c1'}}></i>
                  Purple
                </NavDropdown.Item>
                <NavDropdown.Item active={colorTheme === 'maroon'} onClick={() => setColorTheme('maroon')}>
                  <i className="bi bi-circle-fill me-2" style={{color: '#800020'}}></i>
                  Maroon
                </NavDropdown.Item>
                <NavDropdown.Item active={colorTheme === 'green'} onClick={() => setColorTheme('green')}>
                  <i className="bi bi-circle-fill me-2" style={{color: '#198754'}}></i>
                  Green
                </NavDropdown.Item>
                <NavDropdown.Item active={colorTheme === 'orange'} onClick={() => setColorTheme('orange')}>
                  <i className="bi bi-circle-fill me-2" style={{color: '#fd7e14'}}></i>
                  Orange
                </NavDropdown.Item>
              </NavDropdown>
              <NavDropdown
                title={
                  <span className="d-flex align-items-center gap-2">
                    {user?.profilePhoto ? (
                      <img
                        src={user.profilePhoto}
                        alt="Profile"
                        className="rounded-circle"
                        style={{ width: 32, height: 32, objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('d-none');
                        }}
                      />
                    ) : null}
                    <i className={`bi bi-person-circle ${user?.profilePhoto ? 'd-none' : ''}`}></i>
                    <span>{user?.firstName} {user?.lastName}</span>
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
