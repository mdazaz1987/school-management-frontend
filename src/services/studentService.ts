import apiService from './api';
import { Student, StudentCreateRequest, StudentUpdateRequest, PageResponse, PageRequest } from '../types';

// Helpers to build nested payloads expected by backend
const buildAddress = (d: Partial<StudentCreateRequest | StudentUpdateRequest>) => {
  const has = d.addressLine1 || d.addressLine2 || d.city || d.state || d.zipCode;
  if (!has) return undefined;
  // Backend expects User.Address { street, city, state, zipCode, country? }
  return {
    street: [d.addressLine1, d.addressLine2].filter(Boolean).join(', '),
    city: d.city || '',
    state: d.state || '',
    zipCode: d.zipCode || '',
  } as any;
};

// Normalize backend payload to frontend shape
const normalizeStudent = (s: any): Student => {
  const normalized: any = {
    ...s,
    isActive: s?.isActive ?? s?.active ?? false,
  };
  if (s?.address) {
    const a = s.address;
    // Map street -> addressLine1 for UI; keep existing if present
    normalized.address = {
      addressLine1: a.addressLine1 ?? a.street ?? '',
      addressLine2: a.addressLine2 ?? '',
      city: a.city ?? '',
      state: a.state ?? '',
      zipCode: a.zipCode ?? '',
    };
  }
  return normalized as Student;
};

const buildParentInfo = (d: Partial<StudentCreateRequest | StudentUpdateRequest>) => {
  const has = d.fatherName || d.fatherPhone || d.fatherEmail || d.fatherOccupation ||
              d.motherName || d.motherPhone || d.motherEmail || d.motherOccupation ||
              d.guardianName || d.guardianPhone || d.guardianEmail || d.guardianRelation;
  if (!has) return undefined;
  return {
    fatherName: d.fatherName || '',
    fatherPhone: d.fatherPhone || '',
    fatherEmail: d.fatherEmail || '',
    fatherOccupation: d.fatherOccupation || '',
    motherName: d.motherName || '',
    motherPhone: d.motherPhone || '',
    motherEmail: d.motherEmail || '',
    motherOccupation: d.motherOccupation || '',
    guardianName: d.guardianName || '',
    guardianPhone: d.guardianPhone || '',
    guardianEmail: d.guardianEmail || '',
    guardianRelation: d.guardianRelation || '',
  };
};

const buildAcademicInfo = (d: Partial<StudentCreateRequest | StudentUpdateRequest>) => {
  const has = d.previousSchool || d.previousClass || d.previousPercentage !== undefined || d.academicYear || d.stream;
  if (!has) return undefined;
  return {
    previousSchool: d.previousSchool || '',
    previousClass: d.previousClass || '',
    previousPercentage: d.previousPercentage,
    academicYear: d.academicYear || '',
    stream: d.stream || '',
  };
};

export const studentService = {
  /**
   * Get all students with pagination
   */
  async getAllStudents(params?: PageRequest): Promise<PageResponse<Student>> {
    const page = await apiService.get<PageResponse<any>>('/students', params);
    return {
      ...page,
      content: (page.content || []).map(normalizeStudent),
    } as PageResponse<Student>;
  },

  /**
   * Get students by school ID
   */
  async getStudentsBySchool(schoolId: string): Promise<Student[]> {
    const data = await apiService.get<any[]>(`/students/school/${schoolId}`);
    return data.map(normalizeStudent);
  },

  /**
   * Get students by class ID
   */
  async getStudentsByClass(classId: string): Promise<Student[]> {
    const data = await apiService.get<any[]>(`/students/class/${classId}`);
    return data.map(normalizeStudent);
  },

  /**
   * Get student by ID
   */
  async getStudentById(id: string): Promise<Student> {
    const data = await apiService.get<any>(`/students/${id}`);
    return normalizeStudent(data);
  },

  /**
   * Get student by admission number
   */
  async getStudentByAdmissionNumber(admissionNumber: string): Promise<Student> {
    const data = await apiService.get<any>(`/students/admission/${admissionNumber}`);
    return normalizeStudent(data);
  },

  /**
   * Get student by email
   */
  async getStudentByEmail(email: string): Promise<Student> {
    const data = await apiService.get<any>(`/students/email/${encodeURIComponent(email)}`);
    return normalizeStudent(data);
  },

  /**
   * Search students by name
   */
  async searchStudents(name: string): Promise<Student[]> {
    const data = await apiService.get<any[]>(`/students/search?name=${encodeURIComponent(name)}`);
    return data.map(normalizeStudent);
  },

  /**
   * Create a new student (legacy method - without password options)
   */
  async createStudent(data: StudentCreateRequest): Promise<Student> {
    // Transform flat form into nested backend model
    const studentPayload: any = {
      admissionNumber: data.admissionNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      bloodGroup: data.bloodGroup,
      religion: data.religion,
      nationality: data.nationality,
      schoolId: data.schoolId,
      classId: data.classId,
      section: data.section,
      rollNumber: data.rollNumber,
      parentId: data.parentId,
      address: buildAddress(data),
      parentInfo: buildParentInfo(data),
      academicInfo: buildAcademicInfo(data),
      isActive: data.isActive !== undefined ? data.isActive : true,
      active: data.isActive !== undefined ? data.isActive : true,
      admissionDate: data.admissionDate,
      aadhaarNumber: data.aadhaarNumber,
      apaarId: data.apaarId,
      birthCertificateNumber: (data as any).birthCertificateNumber,
    };
    
    // Wrap in new API format
    const payload = {
      student: studentPayload,
      passwordMode: 'GENERATE',
      sendEmailToStudent: true,
      sendEmailToParents: true
    };
    
    const resp = await apiService.post<any>('/students', payload);
    return normalizeStudent(resp.student as any);
  },

  /**
   * Create a new student with password configuration options
   */
  async createStudentWithCredentials(options: {
    student: StudentCreateRequest;
    passwordMode: 'CUSTOM' | 'GENERATE' | 'NONE';
    studentPassword?: string;
    parentPassword?: string;
    sendEmailToStudent: boolean;
    sendEmailToParents: boolean;
    createParentAccount?: boolean;
    parentAccountType?: 'father' | 'mother' | 'guardian';
  }): Promise<{
    student: Student;
    credentialsCreated: Array<{
      email: string;
      password?: string;
      role: string;
      name: string;
    }>;
  }> {
    // Transform flat form into nested backend model
    const studentPayload: any = {
      admissionNumber: options.student.admissionNumber,
      firstName: options.student.firstName,
      lastName: options.student.lastName,
      email: options.student.email,
      phone: options.student.phone,
      dateOfBirth: options.student.dateOfBirth,
      gender: options.student.gender,
      bloodGroup: options.student.bloodGroup,
      religion: options.student.religion,
      nationality: options.student.nationality,
      schoolId: options.student.schoolId,
      classId: options.student.classId,
      section: options.student.section,
      rollNumber: options.student.rollNumber,
      parentId: options.student.parentId,
      address: buildAddress(options.student),
      parentInfo: buildParentInfo(options.student),
      academicInfo: buildAcademicInfo(options.student),
      isActive: options.student.isActive !== undefined ? options.student.isActive : true,
      active: options.student.isActive !== undefined ? options.student.isActive : true,
      admissionDate: options.student.admissionDate,
      aadhaarNumber: options.student.aadhaarNumber,
      apaarId: options.student.apaarId,
      birthCertificateNumber: (options.student as any).birthCertificateNumber,
    };

    const payload = {
      student: studentPayload,
      passwordMode: options.passwordMode,
      studentPassword: options.studentPassword,
      parentPassword: options.parentPassword,
      sendEmailToStudent: options.sendEmailToStudent,
      sendEmailToParents: options.sendEmailToParents,
      createParentAccount: options.createParentAccount ?? false,
      parentAccountType: options.parentAccountType || 'father'
    };

    const resp = await apiService.post<any>('/students', payload);
    
    return {
      student: normalizeStudent(resp.student as any),
      credentialsCreated: resp.credentialsCreated || []
    };
  },

  /**
   * Update student (full update)
   */
  async updateStudent(id: string, data: Student): Promise<Student> {
    const resp = await apiService.put<Student>(`/students/${id}`, data);
    return normalizeStudent(resp as any);
  },

  /**
   * Partial update student
   */
  async partialUpdateStudent(id: string, data: StudentUpdateRequest): Promise<Student> {
    const payload: any = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      bloodGroup: data.bloodGroup,
      religion: data.religion,
      nationality: data.nationality,
      classId: data.classId,
      section: data.section,
      rollNumber: data.rollNumber,
      parentId: data.parentId,
      address: buildAddress(data),
      parentInfo: buildParentInfo(data),
      academicInfo: buildAcademicInfo(data),
      isActive: data.isActive,
      active: data.isActive,
      profilePicture: data.profilePicture,
      aadhaarNumber: data.aadhaarNumber,
      apaarId: data.apaarId,
      birthCertificateNumber: (data as any).birthCertificateNumber,
    };
    const resp = await apiService.patch<Student>(`/students/${id}`, payload);
    return normalizeStudent(resp as any);
  },

  /**
   * Deactivate student (soft delete)
   */
  async deactivateStudent(id: string): Promise<void> {
    return apiService.delete<void>(`/students/${id}`);
  },

  /**
   * Reactivate student
   */
  async activateStudent(id: string): Promise<Student> {
    const resp = await apiService.put<Student>(`/students/${id}/activate`, {});
    return normalizeStudent(resp as any);
  },

  async updateStatus(id: string, isActive: boolean): Promise<Student> {
    const resp = await apiService.put<Student>(`/students/${id}/status`, { isActive, active: isActive });
    return normalizeStudent(resp as any);
  },

  /**
   * Transfer student to another class
   */
  async transferStudent(id: string, data: { newClassId: string; newSection?: string; newRollNumber?: string }): Promise<Student> {
    return apiService.put<Student>(`/students/${id}/transfer`, data);
  },

  /**
   * Get student profile (public info only)
   */
  async getStudentProfile(id: string): Promise<any> {
    return apiService.get<any>(`/students/${id}/profile`);
  },

  /**
   * Get student dashboard data
   */
  async getStudentDashboard(id: string): Promise<{
    student: any;
    classInfo: any;
    attendancePercentage: number;
    totalDays: number;
    presentDays: number;
    pendingAssignments: any[];
    recentSubmissions: any[];
  }> {
    return apiService.get(`/students/${id}/portal/dashboard`);
  },

  /**
   * Get student performance records
   */
  async getPerformanceRecords(id: string): Promise<any[]> {
    return apiService.get<any[]>(`/students/${id}/performance`);
  },

  /**
   * Get upcoming exams for a student (within next `days` days; default backend is 30 days)
   */
  async getUpcomingExams(id: string, days: number = 30, fromDate?: string): Promise<any[]> {
    const params: any = { days };
    if (fromDate) params.fromDate = fromDate;
    return apiService.get<any[]>(`/students/${id}/exams/upcoming`, params);
  },

  /**
   * Add performance record
   */
  async addPerformanceRecord(id: string, data: any): Promise<any> {
    return apiService.post<any>(`/students/${id}/performance`, data);
  },

  // ===== LEAVE APPLICATION SYSTEM =====
  
  /**
   * Apply for leave
   */
  async applyForLeave(data: {
    startDate: string;
    endDate: string;
    reason: string;
    leaveType: 'SICK' | 'PERSONAL' | 'FAMILY' | 'OTHER';
  }): Promise<any> {
    return apiService.post('/student/leave/apply', data);
  },

  /**
   * Get my leave applications
   */
  async getMyLeaveApplications(): Promise<any[]> {
    return apiService.get('/student/leave/my-applications');
  },

  /**
   * Cancel leave application
   */
  async cancelLeaveApplication(leaveId: string): Promise<void> {
    return apiService.delete(`/student/leave/${leaveId}`);
  },

  // ===== STUDENT PORTAL =====

  /**
   * Get student's own dashboard
   */
  async getMyDashboard(): Promise<any> {
    return apiService.get('/student/dashboard');
  },

  /**
   * Get my assignments
   */
  async getMyAssignments(): Promise<any[]> {
    return apiService.get('/student/assignments');
  },

  /**
   * Submit assignment
   */
  async submitAssignment(assignmentId: string, data: FormData): Promise<any> {
    return apiService.post(`/student/assignments/${assignmentId}/submit`, data);
  },

  /**
   * Get my attendance
   */
  async getMyAttendance(startDate?: string, endDate?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiService.get(`/student/attendance?${params.toString()}`);
  },

  /**
   * Request attendance correction
   */
  async requestAttendanceCorrection(data: {
    date: string;
    period: string;
    reason: string;
  }): Promise<any> {
    return apiService.post('/student/attendance/correction-request', data);
  },

  /**
   * Get my exams
   */
  async getMyExams(): Promise<any[]> {
    return apiService.get('/student/exams');
  },

  /**
   * Get my results
   */
  async getMyResults(): Promise<any[]> {
    return apiService.get('/student/results');
  },

  /**
   * Get my fees
   */
  async getMyFees(): Promise<any[]> {
    return apiService.get('/student/fees');
  },

  /**
   * Get my timetable
   */
  async getMyTimetable(): Promise<any> {
    return apiService.get('/student/timetable');
  },

  /**
   * Get my notifications
   */
  async getMyNotifications(): Promise<any[]> {
    return apiService.get('/student/notifications');
  },

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    return apiService.put(`/student/notifications/${notificationId}/read`, {});
  },

  /**
   * Upload an attachment for a government ID for a student
   * type: 'aadhaar' | 'apaar' | 'birth-certificate'
   */
  async uploadGovtIdDocument(studentId: string, type: 'aadhaar' | 'apaar' | 'birth-certificate', file: File): Promise<{
    success: boolean;
    message: string;
    fileId?: string;
    url?: string;
  }> {
    const form = new FormData();
    form.append('file', file);
    // use raw axios instance for multipart
    const axios = apiService.getAxiosInstance();
    const response = await axios.post(`/students/${studentId}/documents/${type}` as any, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
