export type SidebarItem = { path: string; label: string; icon: string };

function uniqueByPath(items: SidebarItem[]): SidebarItem[] {
  const seen = new Set<string>();
  const result: SidebarItem[] = [];
  for (const it of items) {
    if (seen.has(it.path)) continue;
    seen.add(it.path);
    result.push(it);
  }
  return result;
}

export function getDefaultSidebar(role: string): SidebarItem[] {
  const baseAdmin: SidebarItem[] = [
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
    { path: '/settings', label: 'Settings', icon: 'bi-gear' },
    { path: '/admin/reports', label: 'Admin Reports', icon: 'bi-file-earmark-bar-graph' },
    { path: '/admin/calendar', label: 'Admin Calendar', icon: 'bi-calendar-event' },
    { path: '/admin/approvals', label: 'Approvals', icon: 'bi-check2-square' },
    { path: '/admin/gallery', label: 'Manage Gallery', icon: 'bi-images' },
  ];

  const baseTeacher: SidebarItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { path: '/teacher/my-classes', label: 'My Classes', icon: 'bi-door-open' },
    { path: '/teacher/assignments', label: 'Assignments', icon: 'bi-file-text' },
    { path: '/teacher/study-materials', label: 'Study Materials', icon: 'bi-book' },
    { path: '/teacher/quiz-test', label: 'Quiz & Tests', icon: 'bi-clipboard-check' },
    { path: '/teacher/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
    { path: '/teacher/grading', label: 'Grading', icon: 'bi-star' },
    { path: '/teacher/timetable', label: 'My Timetable', icon: 'bi-calendar3' },
    { path: '/teacher/students', label: 'Students', icon: 'bi-people' },
    { path: '/gallery', label: 'Photo Gallery', icon: 'bi-images' },
  ];

  const baseStudent: SidebarItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { path: '/student/assignments', label: 'Assignments', icon: 'bi-file-text' },
    { path: '/student/study-materials', label: 'Study Materials', icon: 'bi-book' },
    { path: '/student/quizzes', label: 'Quizzes & Tests', icon: 'bi-clipboard-check' },
    { path: '/student/exams', label: 'Exams & Results', icon: 'bi-clipboard-check' },
    { path: '/student/attendance', label: 'My Attendance', icon: 'bi-calendar-check' },
    { path: '/student/timetable', label: 'Timetable', icon: 'bi-calendar3' },
    { path: '/student/fees', label: 'Fee Payment', icon: 'bi-cash-coin' },
    { path: '/holidays', label: 'Holidays', icon: 'bi-tree' },
    { path: '/student/notifications', label: 'Notifications', icon: 'bi-bell' },
    { path: '/gallery', label: 'Photo Gallery', icon: 'bi-images' },
  ];

  const baseParent: SidebarItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
    { path: '/parent/children', label: 'My Children', icon: 'bi-people' },
    { path: '/parent/attendance', label: 'Attendance', icon: 'bi-calendar-check' },
    { path: '/parent/performance', label: 'Performance', icon: 'bi-star' },
    { path: '/parent/fees', label: 'Fee Payments', icon: 'bi-cash-coin' },
    { path: '/parent/notifications', label: 'Notifications', icon: 'bi-bell' },
    { path: '/holidays', label: 'Holidays', icon: 'bi-tree' },
    { path: '/gallery', label: 'Photo Gallery', icon: 'bi-images' },
  ];

  const key = role.toUpperCase();
  if (key.includes('ADMIN')) return uniqueByPath(baseAdmin);
  if (key.includes('TEACHER')) return uniqueByPath(baseTeacher);
  if (key.includes('STUDENT')) return uniqueByPath(baseStudent);
  if (key.includes('PARENT')) return uniqueByPath(baseParent);
  return uniqueByPath(baseStudent);
}

export function mergeSidebar(defaults: SidebarItem[], provided?: SidebarItem[]): SidebarItem[] {
  if (!provided || provided.length === 0) return defaults;
  return uniqueByPath([ ...defaults, ...provided ]);
}
