import apiService from './api';
import { Teacher, TeacherCreateRequest, PageResponse, PageRequest } from '../types';

// Normalize backend payloads that may return `active` instead of `isActive`
const normalizeTeacher = (t: any): Teacher => ({
  ...t,
  isActive: t?.isActive ?? t?.active ?? false,
});


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
      user: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        schoolId: data.schoolId,
        password: data.teacherPassword,
      },
      teacher: {
        employeeId: data.employeeId,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        subjectIds: (data as any).subjectIds,
        classIds: (data as any).classIds,
        qualificationInfo: (data as any).qualificationInfo,
        employmentInfo: (data as any).employmentInfo,
      },
    };
    
    return apiService.post('/teachers', payload);
  },

  async updateTeacher(id: string, data: any): Promise<Teacher> {
    const payload = {
      user: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      },
      teacher: {
        employeeId: data.employeeId,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        subjectIds: data.subjectIds,
        classIds: data.classIds,
        qualificationInfo: data.qualificationInfo,
        employmentInfo: data.employmentInfo,
      },
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

  async getRecentSubmissions(limit = 5): Promise<Array<{
    submissionId: string;
    assignmentId: string;
    assignmentTitle: string;
    studentId: string;
    studentName: string;
    classId: string;
    className: string;
    section: string;
    submittedAt: string;
    status: string;
  }>> {
    return apiService.get(`/teacher/recent-submissions`, { limit });
  },

  // Teacher Portal - Classes
  async getMyClasses(): Promise<any[]> {
    // Session-based endpoint; no admin calls
    try {
      return await apiService.get(`/teacher/classes`);
    } catch (error) {
      console.error('Error fetching teacher classes:', error);
      return [];
    }
  },

  // Get teacher's assigned subjects
  async getMySubjects(): Promise<any[]> {
    try {
      return await apiService.get(`/teacher/my-subjects`);
    } catch (error) {
      console.error('Error fetching teacher subjects:', error);
      return [];
    }
  },

  // Get teacher's assigned students
  async getMyStudents(): Promise<any[]> {
    try {
      return await apiService.get(`/teacher/my-students`);
    } catch (error) {
      console.error('Error fetching teacher students:', error);
      return [];
    }
  },

  async getClassDetails(classId: string): Promise<any> {
    return apiService.get(`/teacher/classes/${classId}`);
  },

  async getClassStudents(classId: string): Promise<any[]> {
    return apiService.get(`/teacher/classes/${classId}/students`);
  },

  // Prefer this for detailed student info (rollNumber, section, etc.)
  async getClassStudentsV2(classId: string): Promise<any[]> {
    // Session-based teacher endpoint returns proper User info for names
    return apiService.get(`/teacher/classes/${classId}/students`);
  },

  // Enriched students with attendance% and average grade%
  async getEnrichedClassStudents(classId: string): Promise<Array<{
    id: string;
    name: string;
    rollNo: string;
    studentClass: string;
    section: string;
    email: string;
    attendance: number;
    avgGrade: number;
  }>> {
    return apiService.get(`/teacher/classes/${classId}/students/enriched`);
  },

  // Teacher Portal - Assignments
  async getMyAssignments(): Promise<any[]> {
    // Legacy (if exists)
    return apiService.get('/teacher/assignments');
  },

  // New backend-compatible teacher endpoints
  async listTeacherAssignments(_teacherId?: string): Promise<any[]> {
    // Session-based list; do not hit admin-only endpoints
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

  // V2 assignment endpoints (teacher-scoped)
  async createAssignmentV2(teacherId: string, assignment: any): Promise<any> {
    return apiService.post(`/teachers/${teacherId}/assignments`, assignment);
  },

  async updateAssignmentV2(teacherId: string, assignmentId: string, assignment: any): Promise<any> {
    return apiService.put(`/teachers/${teacherId}/assignments/${assignmentId}`, assignment);
  },

  async deleteAssignment(assignmentId: string): Promise<void> {
    return apiService.delete(`/teacher/assignments/${assignmentId}`);
  },

  async uploadAssignmentAttachment(assignmentId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    return apiService.post(`/teacher/assignments/${assignmentId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async getAssignmentSubmissions(assignmentId: string): Promise<any[]> {
    // Legacy endpoint if exists
    return apiService.get(`/teacher/assignments/${assignmentId}/submissions`);
  },

  async listSubmissions(_teacherId: string, assignmentId: string): Promise<any[]> {
    // Prefer session-based endpoint first to avoid 403
    try {
      return await apiService.get(`/teacher/assignments/${assignmentId}/submissions`);
    } catch (e) {
      // Fallback to teacher-scoped path if available (may require ADMIN)
      return apiService.get(`/teachers/${_teacherId}/assignments/${assignmentId}/submissions`);
    }
  },

  async gradeSubmission(submissionId: string, marks: number, feedback: string): Promise<any> {
    return apiService.put(`/teacher/submissions/${submissionId}/grade`, { marks, feedback });
  },

  async gradeSubmissionV2(teacherId: string, assignmentId: string, submissionId: string, marks: number, feedback: string): Promise<any> {
    // Prefer session-based grading endpoint
    try {
      return await apiService.put(`/teacher/submissions/${submissionId}/grade`, { marks, feedback });
    } catch (e) {
      return apiService.put(`/teachers/${teacherId}/assignments/${assignmentId}/submissions/${submissionId}/grade`, { marks, feedback });
    }
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

  // Teacher Portal - Leave Approval
  async getPendingLeaveApplications(): Promise<any[]> {
    return apiService.get('/teacher/leave/pending');
  },

  async approveLeaveApplication(leaveId: string, comments?: string): Promise<any> {
    return apiService.put(`/teacher/leave/${leaveId}/approve`, { comments });
  },

  async rejectLeaveApplication(leaveId: string, reason: string): Promise<any> {
    return apiService.put(`/teacher/leave/${leaveId}/reject`, { reason });
  },
};
