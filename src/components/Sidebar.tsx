import React, { useMemo } from 'react';
import { Nav } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useLang } from '../contexts/LangContext';
import { useAuth } from '../contexts/AuthContext';
import { getDefaultSidebar, mergeSidebar } from '../navigation/sidebarConfig';

interface SidebarItem {
  path: string;
  label: string;
  icon: string;
}

interface SidebarProps { items?: SidebarItem[] }

export const Sidebar: React.FC<SidebarProps> = ({ items }) => {
  const location = useLocation();
  const { t } = useLang();
  const { user } = useAuth();
  const role = useMemo(() => {
    const roles = (user?.roles || []).map(r => r.toUpperCase());
    if (roles.includes('ADMIN') || roles.includes('ROLE_ADMIN')) return 'ADMIN';
    if (roles.includes('TEACHER') || roles.includes('ROLE_TEACHER')) return 'TEACHER';
    if (roles.includes('STUDENT') || roles.includes('ROLE_STUDENT')) return 'STUDENT';
    if (roles.includes('PARENT') || roles.includes('ROLE_PARENT')) return 'PARENT';
    return 'STUDENT';
  }, [user?.roles]);
  const defaultItems = useMemo(() => getDefaultSidebar(role), [role]);
  const effectiveItems = useMemo(() => mergeSidebar(defaultItems, items), [defaultItems, items]);
  const labelKeyMap: Record<string, string> = {
    'Dashboard': 'nav.dashboard',
    'Students': 'nav.students',
    'Teachers': 'nav.teachers',
    'Classes': 'nav.classes',
    'Subjects': 'nav.subjects',
    'Exams': 'nav.exams',
    'Fees': 'nav.fees',
    'Timetable': 'nav.timetable',
    'Attendance': 'nav.attendance',
    'Notifications': 'nav.notifications',
    'Settings': 'nav.settings',
    'My Children': 'nav.my_children',
    'Performance': 'nav.performance',
    'Fee Payments': 'nav.fee_payments',
    'Assignments': 'nav.assignments',
    'Quizzes & Tests': 'nav.quizzes_tests',
    'Exams & Results': 'nav.exams_results',
    'My Attendance': 'nav.my_attendance',
    'Fee Payment': 'nav.fee_payment',
    'My Classes': 'nav.my_classes',
    'Study Materials': 'nav.study_materials',
    'Quiz & Test': 'nav.quiz_test',
    'Grading': 'nav.grading',
    'Students (Teacher)': 'nav.teacher_students',
    'Finance Tools': 'nav.finance_tools',
    'Notification Tools': 'nav.notification_tools',
    'Admin Reports': 'nav.admin_reports',
    'Admin Calendar': 'nav.admin_calendar',
    'Approvals': 'nav.approvals',
    'Manage Gallery': 'nav.manage_gallery',
    'Photo Gallery': 'nav.photo_gallery',
    'Holidays': 'nav.holidays',
  };

  return (
    <div className="sidebar p-3 border-end bg-body-tertiary">
      <Nav className="flex-column">
        {effectiveItems.map((item) => (
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
            {t(labelKeyMap[item.label] || item.label)}
          </Nav.Link>
        ))}
      </Nav>
    </div>
  );
};
