import apiService from './api';
import { Teacher, TeacherCreateRequest, PageResponse, PageRequest } from '../types';

// Normalize backend payloads that may return `active` instead of `isActive`
const normalizeTeacher = (t: any): Teacher => ({
  ...t,
  isActive: t?.isActive ?? t?.active ?? false,
});

// Helper to build address
const buildAddress = (d: Partial<TeacherCreateRequest>) => {
  const has = d.addressLine1 || d.addressLine2 || d.city || d.state || d.zipCode;
  if (!has) return undefined;
  return {
    street: [d.addressLine1, d.addressLine2].filter(Boolean).join(', '),
    city: d.city || '',
    state: d.state || '',
    zipCode: d.zipCode || '',
  };
};

// Helper to build qualification info
const buildQualificationInfo = (d: Partial<TeacherCreateRequest>) => {
  const has = d.highestDegree || d.university || d.yearOfPassing || d.certifications || d.specializations || d.percentage;
  if (!has) return undefined;
  return {
    highestDegree: d.highestDegree || '',
    university: d.university || '',
    yearOfPassing: d.yearOfPassing,
    certifications: d.certifications || [],
    specializations: d.specializations || [],
    percentage: d.percentage,
  };
};

// Helper to build employment info
const buildEmploymentInfo = (d: Partial<TeacherCreateRequest>) => {
  const has = d.designation || d.department || d.salary || d.employmentType || d.totalExperience;
  if (!has) return undefined;
  return {
    designation: d.designation || '',
    department: d.department || '',
    salary: d.salary,
    employmentType: d.employmentType || '',
    totalExperience: d.totalExperience,
    previousSchool: d.previousSchoolEmployment || '',
    achievements: d.achievements || [],
    bankAccountNumber: d.bankAccountNumber || '',
    bankName: d.bankName || '',
    ifscCode: d.ifscCode || '',
    panNumber: d.panNumber || '',
  };
};

export const teacherService = {
  // Admin CRUD operations
  async getAllTeachers(params?: PageRequest): Promise<PageResponse<Teacher>> {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size) queryParams.append('size', params.size.toString());
    if (params?.sort) queryParams.append('sort', params.sort);
    
    const page = await apiService.get<PageResponse<any>>(`/teachers?${queryParams.toString()}`);
    return {
      ...page,
      content: (page.content || []).map(normalizeTeacher),
    } as PageResponse<Teacher>;
  },

  async getTeacherById(id: string): Promise<Teacher> {
    const data = await apiService.get<any>(`/teachers/${id}`);
    return normalizeTeacher(data);
  },

  async getTeacherByEmployeeId(employeeId: string): Promise<Teacher> {
    const data = await apiService.get<any>(`/teachers/employee/${employeeId}`);
    return normalizeTeacher(data);
  },

  async getTeachersBySchool(schoolId: string): Promise<Teacher[]> {
    const list = await apiService.get<any[]>(`/teachers/school/${schoolId}`);
    return list.map(normalizeTeacher);
  },

  async searchTeachers(name: string): Promise<Teacher[]> {
    const list = await apiService.get<any[]>(`/teachers/search?name=${encodeURIComponent(name)}`);
    return list.map(normalizeTeacher);
  },

  async getTeachersBySubject(subjectId: string): Promise<Teacher[]> {
    const list = await apiService.get<any[]>(`/teachers/subject/${subjectId}`);
    return list.map(normalizeTeacher);
  },

  async getTeachersByClass(classId: string): Promise<Teacher[]> {
    const list = await apiService.get<any[]>(`/teachers/class/${classId}`);
    return list.map(normalizeTeacher);
  },

  async createTeacher(data: TeacherCreateRequest): Promise<any> {
    const payload = {
      teacher: {
        employeeId: data.employeeId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        nationality: data.nationality,
        maritalStatus: data.maritalStatus,
        schoolId: data.schoolId,
        address: buildAddress(data),
        qualificationInfo: buildQualificationInfo(data),
        employmentInfo: buildEmploymentInfo(data),
        subjectIds: data.subjectIds || [],
        classIds: data.classIds || [],
        joiningDate: data.joiningDate,
        customFields: data.customFields || {},
      },
      passwordMode: data.passwordMode || 'GENERATE',
      teacherPassword: data.teacherPassword,
      sendEmailToTeacher: data.sendEmailToTeacher !== false,
    };
    
    return apiService.post('/teachers', payload);
  },

  async updateTeacher(id: string, data: any): Promise<Teacher> {
    // Build nested structure like createTeacher does
    const payload: any = {
      employeeId: data.employeeId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      bloodGroup: data.bloodGroup,
      nationality: data.nationality,
      maritalStatus: data.maritalStatus,
      schoolId: data.schoolId,
      address: buildAddress(data),
      qualificationInfo: buildQualificationInfo(data),
      employmentInfo: buildEmploymentInfo(data),
      subjectIds: data.subjectIds || [],
      classIds: data.classIds || [],
      joiningDate: data.joiningDate,
      profilePicture: data.profilePicture,
      customFields: data.customFields || {},
    };
    const resp = await apiService.put<any>(`/teachers/${id}`, payload);
    return normalizeTeacher(resp);
  },

  async partialUpdateTeacher(id: string, updates: Partial<Teacher>): Promise<Teacher> {
    const resp = await apiService.patch<any>(`/teachers/${id}`, updates);
    return normalizeTeacher(resp);
  },

  async deleteTeacher(id: string): Promise<void> {
    return apiService.delete(`/teachers/${id}`);
  },

  async activateTeacher(id: string): Promise<Teacher> {
    const resp = await apiService.post<any>(`/teachers/${id}/activate`, {});
    return normalizeTeacher(resp);
  },

  // Teacher dashboard
  async getDashboardStats(): Promise<{
    totalClasses: number;
    totalStudents: number;
    totalAssignments: number;
    pendingGrading: number;
  }> {
    return apiService.get('/teacher/dashboard/stats');
  },

  // Teacher Portal - Classes
  async getMyClasses(): Promise<any[]> {
    return apiService.get('/teacher/classes');
  },

  async getClassDetails(classId: string): Promise<any> {
    return apiService.get(`/teacher/classes/${classId}`);
  },

  async getClassStudents(classId: string): Promise<any[]> {
    return apiService.get(`/teacher/classes/${classId}/students`);
  },

  // Teacher Portal - Assignments
  async getMyAssignments(): Promise<any[]> {
    return apiService.get('/teacher/assignments');
  },

  async getClassAssignments(classId: string): Promise<any[]> {
    return apiService.get(`/teacher/classes/${classId}/assignments`);
  },

  async createAssignment(assignment: any): Promise<any> {
    return apiService.post('/teacher/assignments', assignment);
  },

  async updateAssignment(assignmentId: string, assignment: any): Promise<any> {
    return apiService.put(`/teacher/assignments/${assignmentId}`, assignment);
  },

  async deleteAssignment(assignmentId: string): Promise<void> {
    return apiService.delete(`/teacher/assignments/${assignmentId}`);
  },

  async getAssignmentSubmissions(assignmentId: string): Promise<any[]> {
    return apiService.get(`/teacher/assignments/${assignmentId}/submissions`);
  },

  async gradeSubmission(submissionId: string, marks: number, feedback: string): Promise<any> {
    return apiService.put(`/teacher/submissions/${submissionId}/grade`, { marks, feedback });
  },

  // Teacher Portal - Attendance
  async recordAttendance(classId: string, attendance: any): Promise<any> {
    return apiService.post(`/teacher/classes/${classId}/attendance`, attendance);
  },

  async getClassAttendance(classId: string, startDate?: string, endDate?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiService.get(`/teacher/classes/${classId}/attendance?${params.toString()}`);
  },

  async updateAttendance(attendanceId: string, attendance: any): Promise<any> {
    return apiService.put(`/teacher/attendance/${attendanceId}`, attendance);
  },
};
