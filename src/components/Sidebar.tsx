import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

interface SidebarItem {
  path: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  items: SidebarItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ items }) => {
  const location = useLocation();

  return (
    <div className="sidebar p-3 border-end bg-body-tertiary">
      <Nav className="flex-column">
        {items.map((item) => (
          <Nav.Link
            key={item.path}
            as={Link}
            to={item.path}
            className={
              location.pathname === item.path
                ? 'bg-primary text-white rounded mb-2'
                : 'mb-2 text-reset'
            }
          >
            <i className={`bi ${item.icon} me-2`}></i>
            {item.label}
          </Nav.Link>
        ))}
      </Nav>
    </div>
  );
};
