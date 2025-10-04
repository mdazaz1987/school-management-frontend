import apiService from './api';
import { Teacher, TeacherCreateRequest, PageResponse, PageRequest } from '../types';

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
    
    return apiService.get(`/teachers?${queryParams.toString()}`);
  },

  async getTeacherById(id: string): Promise<Teacher> {
    return apiService.get(`/teachers/${id}`);
  },

  async getTeacherByEmployeeId(employeeId: string): Promise<Teacher> {
    return apiService.get(`/teachers/employee/${employeeId}`);
  },

  async getTeachersBySchool(schoolId: string): Promise<Teacher[]> {
    return apiService.get(`/teachers/school/${schoolId}`);
  },

  async searchTeachers(name: string): Promise<Teacher[]> {
    return apiService.get(`/teachers/search?name=${encodeURIComponent(name)}`);
  },

  async getTeachersBySubject(subjectId: string): Promise<Teacher[]> {
    return apiService.get(`/teachers/subject/${subjectId}`);
  },

  async getTeachersByClass(classId: string): Promise<Teacher[]> {
    return apiService.get(`/teachers/class/${classId}`);
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

  async updateTeacher(id: string, data: Partial<Teacher>): Promise<Teacher> {
    return apiService.put(`/teachers/${id}`, data);
  },

  async partialUpdateTeacher(id: string, updates: Partial<Teacher>): Promise<Teacher> {
    return apiService.patch(`/teachers/${id}`, updates);
  },

  async deleteTeacher(id: string): Promise<void> {
    return apiService.delete(`/teachers/${id}`);
  },

  async activateTeacher(id: string): Promise<Teacher> {
    return apiService.post(`/teachers/${id}/activate`, {});
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
};
