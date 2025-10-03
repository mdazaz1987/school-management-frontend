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
   * Create a new student
   */
  async createStudent(data: StudentCreateRequest): Promise<Student> {
    // Transform flat form into nested backend model
    const payload: any = {
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
    };
    const resp = await apiService.post<Student>('/students', payload);
    return normalizeStudent(resp as any);
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
   * Add performance record
   */
  async addPerformanceRecord(id: string, data: any): Promise<any> {
    return apiService.post<any>(`/students/${id}/performance`, data);
  },
};
