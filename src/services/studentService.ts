import apiService from './api';
import { Student, StudentCreateRequest, StudentUpdateRequest, PageResponse, PageRequest } from '../types';

export const studentService = {
  /**
   * Get all students with pagination
   */
  async getAllStudents(params?: PageRequest): Promise<PageResponse<Student>> {
    return apiService.get<PageResponse<Student>>('/students', params);
  },

  /**
   * Get students by school ID
   */
  async getStudentsBySchool(schoolId: string): Promise<Student[]> {
    return apiService.get<Student[]>(`/students/school/${schoolId}`);
  },

  /**
   * Get students by class ID
   */
  async getStudentsByClass(classId: string): Promise<Student[]> {
    return apiService.get<Student[]>(`/students/class/${classId}`);
  },

  /**
   * Get student by ID
   */
  async getStudentById(id: string): Promise<Student> {
    return apiService.get<Student>(`/students/${id}`);
  },

  /**
   * Get student by admission number
   */
  async getStudentByAdmissionNumber(admissionNumber: string): Promise<Student> {
    return apiService.get<Student>(`/students/admission/${admissionNumber}`);
  },

  /**
   * Search students by name
   */
  async searchStudents(name: string): Promise<Student[]> {
    return apiService.get<Student[]>(`/students/search?name=${encodeURIComponent(name)}`);
  },

  /**
   * Create a new student
   */
  async createStudent(data: StudentCreateRequest): Promise<Student> {
    return apiService.post<Student>('/students', data);
  },

  /**
   * Update student (full update)
   */
  async updateStudent(id: string, data: Student): Promise<Student> {
    return apiService.put<Student>(`/students/${id}`, data);
  },

  /**
   * Partial update student
   */
  async partialUpdateStudent(id: string, data: StudentUpdateRequest): Promise<Student> {
    return apiService.patch<Student>(`/students/${id}`, data);
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
    return apiService.put<Student>(`/students/${id}/activate`, {});
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
  async getStudentDashboard(id: string): Promise<any> {
    return apiService.get<any>(`/students/${id}/portal/dashboard`);
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
