// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: UserRole[];
  schoolId: string;
  phoneNumber?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
}

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  schoolId: string;
  phoneNumber?: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
}

// Student types
export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  address: string;
  schoolId: string;
  classId: string;
  admissionNumber: string;
  admissionDate: string;
  parentId?: string;
  guardianName?: string;
  guardianPhone?: string;
  bloodGroup?: string;
  medicalConditions?: string;
  isActive: boolean;
  createdAt: string;
}

// Class types
export interface SchoolClass {
  id: string;
  className: string;
  name?: string;
  grade?: string;
  section: string;
  room?: string;
  teacherId?: string;
  studentIds?: string[];
  subjects?: string[];
  schoolId: string;
  academicYear: string;
  capacity?: number;
  description?: string;
  isActive: boolean;
}

// Subject types
export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  schoolId: string;
  category: 'CORE' | 'ELECTIVE' | 'OPTIONAL';
  credits?: number;
  teacherIds?: string[];
  classIds?: string[];
  syllabus?: string;
  isActive: boolean;
}

// Exam types
export interface Exam {
  id: string;
  name: string;
  description?: string;
  schoolId: string;
  classId: string;
  subjectId: string;
  examDate: string;
  startTime: string;
  endTime: string;
  totalMarks: number;
  passingMarks: number;
  academicYear: string;
  term: string;
  isPublished: boolean;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  marksObtained: number;
  grade?: string;
  status: 'PASS' | 'FAIL' | 'ABSENT';
  remarks?: string;
  isPublished: boolean;
}

// Fee types
export interface Fee {
  id: string;
  studentId: string;
  schoolId: string;
  feeType: string;
  amount: number;
  discountAmount?: number;
  discountReason?: string;
  netAmount: number;
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE';
  dueDate: string;
  paidAmount?: number;
  paidDate?: string;
  paymentMethod?: string;
  receiptNumber?: string;
  academicYear: string;
  term?: string;
}

// Notification types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'ASSIGNMENT' | 'EXAM' | 'FEE' | 'ATTENDANCE' | 'EVENT' | 'ANNOUNCEMENT' | 'EMERGENCY';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  schoolId: string;
  recipientIds?: string[];
  recipientRoles?: UserRole[];
  recipientClassIds?: string[];
  isRead: boolean;
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
}

// Attendance types
export interface Attendance {
  id: string;
  studentId: string;
  classId: string;
  schoolId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'HALF_DAY';
  subject?: string;
  period?: string;
  markedBy?: string;
  remarks?: string;
  markedAt: string;
}

// Assignment types
export interface Assignment {
  id: string;
  title: string;
  description: string;
  classId: string;
  subjectId?: string;
  teacherId: string;
  schoolId: string;
  dueDate: string;
  totalPoints: number;
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED';
  createdAt: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  content: string;
  submittedAt: string;
  grade?: number;
  feedback?: string;
  status: 'SUBMITTED' | 'GRADED' | 'LATE';
}

// Timetable types
export interface Timetable {
  id: string;
  classId: string;
  schoolId: string;
  academicYear: string;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  periods: TimetablePeriod[];
}

export interface TimetablePeriod {
  periodNumber: number;
  subjectId: string;
  teacherId: string;
  startTime: string;
  endTime: string;
  room?: string;
  type: 'REGULAR' | 'BREAK' | 'LUNCH' | 'SPORTS' | 'ACTIVITY';
}

// Dashboard stats
export interface DashboardStats {
  totalStudents?: number;
  totalTeachers?: number;
  totalClasses?: number;
  totalSubjects?: number;
  presentToday?: number;
  absentToday?: number;
  pendingAssignments?: number;
  upcomingExams?: number;
  overduePayments?: number;
  unreadNotifications?: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}
