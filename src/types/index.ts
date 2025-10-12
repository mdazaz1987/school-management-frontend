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
  profilePhoto?: string;
  isActive: boolean;
  createdAt: string;
}

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'ROLE_ADMIN' | 'ROLE_TEACHER' | 'ROLE_STUDENT' | 'ROLE_PARENT';

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
  passwordChangeRequired?: boolean;
}

// School types
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface SchoolContactInfo {
  phone?: string;
  email?: string;
  website?: string;
  fax?: string;
}

export interface SchoolBranding {
  primaryColor?: string;
  secondaryColor?: string;
  theme?: string;
}

export interface SchoolConfiguration {
  academicYear?: string;
  gradeSystem?: string;
  currency?: string;
  timezone?: string;
  weekendDays?: string[]; // e.g., ["SUNDAY"]
  workingStartTime?: string; // HH:mm
  workingEndTime?: string;   // HH:mm
  defaultBreakStartTime?: string; // HH:mm
  defaultBreakEndTime?: string;   // HH:mm
  // GST configuration
  gstin?: string;
  gstRate?: number;
  // Principal details for receipts
  principalName?: string;
  principalSignatureUrl?: string;
}

export interface School {
  id: string;
  name: string;
  logo?: string;
  contactInfo?: SchoolContactInfo;
  address?: Address;
  configuration?: SchoolConfiguration;
  cmsPages?: Record<string, any>;
  branding?: SchoolBranding;
  createdAt?: string;
}

// Student types
export interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  religion?: string;
  nationality?: string;
  schoolId: string;
  classId: string;
  className?: string; // User-friendly class name for display
  section?: string;
  rollNumber?: string;
  parentId?: string;
  address?: StudentAddress;
  parentInfo?: ParentInfo;
  academicInfo?: AcademicInfo;
  subjects?: string[];
  profilePicture?: string;
  isActive: boolean;
  admissionDate?: string;
  createdAt: string;
  updatedAt: string;
  performanceRecords?: PerformanceRecord[];
  aadhaarNumber?: string;
  apaarId?: string;
  birthCertificateNumber?: string;
  // Attachment IDs stored on server; downloadable via dedicated endpoints
  aadhaarAttachmentId?: string;
  apaarAttachmentId?: string;
  birthCertificateAttachmentId?: string;
}

export interface StudentAddress {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface ParentInfo {
  fatherName?: string;
  fatherPhone?: string;
  fatherEmail?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherPhone?: string;
  motherEmail?: string;
  motherOccupation?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianRelation?: string;
}

export interface AcademicInfo {
  previousSchool?: string;
  previousClass?: string;
  previousPercentage?: number;
  academicYear?: string;
  stream?: string;
  achievements?: string[];
}

export interface PerformanceRecord {
  examName: string;
  academicYear: string;
  term: string;
  subjectScores: { [subject: string]: number };
  totalMarks: number;
  percentage: number;
  grade: string;
  remarks?: string;
  examDate: string;
}

export interface StudentCreateRequest {
  admissionNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender: string;
  bloodGroup?: string;
  religion?: string;
  nationality?: string;
  schoolId: string;
  classId: string;
  section?: string;
  rollNumber?: string;
  parentId?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  fatherName?: string;
  fatherPhone?: string;
  fatherEmail?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherPhone?: string;
  motherEmail?: string;
  motherOccupation?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianRelation?: string;
  previousSchool?: string;
  previousClass?: string;
  previousPercentage?: number;
  academicYear?: string;
  stream?: string;
  admissionDate?: string;
  isActive?: boolean;
  aadhaarNumber?: string;
  apaarId?: string;
  birthCertificateNumber?: string;
}

export interface StudentUpdateRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  religion?: string;
  nationality?: string;
  classId?: string;
  section?: string;
  rollNumber?: string;
  parentId?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  fatherName?: string;
  fatherPhone?: string;
  fatherEmail?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherPhone?: string;
  motherEmail?: string;
  motherOccupation?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianRelation?: string;
  previousSchool?: string;
  previousClass?: string;
  previousPercentage?: number;
  academicYear?: string;
  stream?: string;
  isActive?: boolean;
  profilePicture?: string;
  aadhaarNumber?: string;
  apaarId?: string;
  birthCertificateNumber?: string;
}

// Teacher types
export interface Teacher {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  nationality?: string;
  maritalStatus?: string;
  schoolId: string;
  address?: Address;
  qualificationInfo?: QualificationInfo;
  employmentInfo?: EmploymentInfo;
  subjectIds?: string[];
  classIds?: string[];
  profilePicture?: string;
  isActive: boolean;
  isPrincipal?: boolean;
  joiningDate?: string;
  createdAt: string;
  updatedAt: string;
  customFields?: Record<string, any>;
}

export interface QualificationInfo {
  highestDegree?: string;
  university?: string;
  yearOfPassing?: number;
  certifications?: string[];
  specializations?: string[];
  percentage?: number;
}

export interface EmploymentInfo {
  designation?: string;
  department?: string;
  salary?: number;
  employmentType?: string;
  totalExperience?: number;
  previousSchool?: string;
  achievements?: string[];
  bankAccountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  panNumber?: string;
}

export interface TeacherCreateRequest {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  nationality?: string;
  maritalStatus?: string;
  schoolId: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  highestDegree?: string;
  university?: string;
  yearOfPassing?: number;
  certifications?: string[];
  specializations?: string[];
  percentage?: number;
  designation?: string;
  department?: string;
  salary?: number;
  employmentType?: string;
  totalExperience?: number;
  previousSchoolEmployment?: string;
  achievements?: string[];
  bankAccountNumber?: string;
  bankName?: string;
  ifscCode?: string;
  panNumber?: string;
  subjectIds?: string[];
  classIds?: string[];
  joiningDate?: string;
  passwordMode?: 'GENERATE' | 'CUSTOM' | 'NONE';
  teacherPassword?: string;
  sendEmailToTeacher?: boolean;
  customFields?: Record<string, any>;
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
  fees?: number;
  feesType?: 'ANNUAL' | 'TERM' | 'MONTHLY';
  durationMonths?: number;
  startDate?: string;
  endDate?: string;
  // Roll number configuration (optional)
  rollNumberPrefix?: string;
  rollNumberWidth?: number;
  nextRollNumber?: number;
}

// Subject types
export interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  schoolId: string;
  type?: 'CORE' | 'ELECTIVE' | 'OPTIONAL' | 'CO_CURRICULAR';
  category?: string;
  credits?: number;
  totalHours?: number;
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
  classId: string;
  feeType: string;
  amount: number;
  discountAmount?: number;
  discountReason?: string;
  netAmount: number;
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'WAIVED';
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
  type: 'ASSIGNMENT' | 'EXAM' | 'FEE' | 'ATTENDANCE' | 'EVENT' | 'ANNOUNCEMENT' | 'EMERGENCY' | 'HOLIDAY' | 'RESULT' | 'GENERAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  schoolId: string;
  recipientIds?: string[];
  recipientRoles?: string[];
  recipientClasses?: string[];
  sendToAll?: boolean;
  senderId?: string;
  senderName?: string;
  link?: string;
  attachmentUrl?: string;
  isRead: boolean;
  readAt?: string;
  isActive: boolean;
  expiresAt?: string;
  scheduledFor?: string;
  isSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationCreateRequest {
  title: string;
  message: string;
  type: Notification['type'];
  priority: Notification['priority'];
  recipientIds?: string[];
  recipientRoles?: string[];
  recipientClasses?: string[];
  sendToAll?: boolean;
  link?: string;
  attachmentUrl?: string;
  scheduledFor?: string;
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

// Timetable types (aligned with backend)
export interface Timetable {
  id: string;
  schoolId: string;
  classId: string;
  section?: string;
  academicYear?: string;
  term?: string;
  entries: TimetableEntry[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
export type PeriodType = 'LECTURE' | 'PRACTICAL' | 'BREAK' | 'LUNCH' | 'ASSEMBLY' | 'SPORTS' | 'LIBRARY';

export interface TimetableEntry {
  day: DayOfWeek;
  period: string; // e.g., "Period 1"
  startTime: string; // HH:mm:ss
  endTime: string;   // HH:mm:ss
  subjectId?: string;
  subjectName?: string;
  teacherId?: string;
  teacherName?: string;
  room?: string;
  periodType: PeriodType;
}

// Classroom types
export interface Classroom {
  id: string;
  schoolId: string;
  name: string;
  code?: string;
  capacity?: number;
  building?: string;
  floor?: string;
  isActive?: boolean;
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

// Custom Field Config types
export interface CustomFieldConfig {
  id: string;
  fieldName: string;
  fieldLabel: string;
  fieldType: 'TEXT' | 'NUMBER' | 'DATE' | 'DROPDOWN' | 'CHECKBOX' | 'TEXTAREA' | 'EMAIL' | 'PHONE';
  entityType: 'STUDENT' | 'TEACHER' | 'PARENT' | 'CLASS';
  schoolId?: string;
  isRequired: boolean;
  isActive: boolean;
  displayOrder: number;
  options?: string[];
  validationRegex?: string;
  validationMessage?: string;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string;
  createdAt: string;
  updatedAt: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

// Pagination types
export interface PageRequest {
  page?: number;
  size?: number;
  sort?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
