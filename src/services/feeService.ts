import apiService from './api';
import { Fee } from '../types';

const normalizeFee = (f: any): Fee => {
  return {
    id: f.id,
    studentId: f.studentId,
    schoolId: f.schoolId,
    classId: f.classId,
    feeType: f.feeType || f.type || '',
    amount: Number(f.amount ?? 0),
    discountAmount: f.discount ?? f.discountAmount ?? 0,
    discountReason: f.remarks ?? f.discountReason,
    netAmount: Number(f.finalAmount ?? f.netAmount ?? 0),
    status: f.status || 'PENDING',
    dueDate: f.dueDate,
    paidAmount: f.paidAmount,
    paidDate: f.paidDate,
    paymentMethod: f.paymentMethod,
    receiptNumber: f.receiptNumber,
    academicYear: f.academicYear,
    term: f.term,
  } as Fee;
};

export const feeService = {
  async list(params?: { schoolId?: string; classId?: string; status?: string }): Promise<Fee[]> {
    const data = await apiService.get<any[]>('/fees', params);
    return (data || []).map(normalizeFee);
  },

  async getById(id: string): Promise<Fee> {
    const data = await apiService.get<any>(`/fees/${id}`);
    return normalizeFee(data);
  },

  async listByStudent(studentId: string, params?: { status?: string; academicYear?: string }): Promise<Fee[]> {
    const query: any = {};
    if (params?.status) query.status = params.status;
    if (params?.academicYear) query.academicYear = params.academicYear;
    const data = await apiService.get<any[]>(`/fees/student/${studentId}`, query);
    return (data || []).map(normalizeFee);
  },

  async create(data: Partial<Fee>): Promise<Fee> {
    const payload: any = {
      studentId: data.studentId,
      schoolId: data.schoolId,
      classId: data.classId,
      feeType: (data.feeType || '').toString().toUpperCase(),
      feeDescription: (data as any).feeDescription,
      amount: data.amount,
      discount: data.discountAmount,
      dueDate: data.dueDate,
      term: data.term,
      academicYear: data.academicYear,
      feeItems: (data as any).feeItems,
      remarks: data.discountReason,
      status: data.status,
    };
    const created = await apiService.post<any>('/fees', payload);
    return normalizeFee(created);
  },

  async update(id: string, data: Partial<Fee>): Promise<Fee> {
    const payload: any = {
      feeType: data.feeType,
      feeDescription: (data as any).feeDescription,
      amount: data.amount,
      discount: data.discountAmount,
      dueDate: data.dueDate,
      term: data.term,
      feeItems: (data as any).feeItems,
      remarks: data.discountReason,
    };
    const updated = await apiService.put<any>(`/fees/${id}`, payload);
    return normalizeFee(updated);
  },

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    return apiService.delete(`/fees/${id}`);
  },

  async pay(id: string, data: { paymentMethod: string; transactionId?: string }): Promise<Fee> {
    const updated = await apiService.post<any>(`/fees/${id}/pay`, data);
    return normalizeFee(updated);
  },

  async applyDiscount(id: string, data: { discount: number; reason?: string }): Promise<Fee> {
    const updated = await apiService.post<any>(`/fees/${id}/discount`, data);
    return normalizeFee(updated);
  },

  async overdue(): Promise<Fee[]> {
    const data = await apiService.get<any[]>('/fees/overdue');
    return (data || []).map(normalizeFee);
  },

  async schoolStats(schoolId: string): Promise<any> {
    return apiService.get(`/fees/school/${schoolId}/stats`);
  },

  async studentSummary(studentId: string, options?: { academicYear?: string }): Promise<any> {
    const params: any = {};
    if (options?.academicYear) params.academicYear = options.academicYear;
    return apiService.get(`/fees/student/${studentId}/summary`, params);
  },

  // Admin tools: create admission fee
  async createAdmissionFee(data: {
    studentId: string;
    schoolId: string;
    classId: string;
    academicYear: string;
    term: string;
    feeItems?: Array<{ itemName: string; itemAmount: number; description?: string }>;
    discount?: number;
    dueDate?: string;
  }): Promise<any> {
    return apiService.post('/fees/admission', data);
  },

  // Admin tools: seed sample fees for a student
  async seedForStudent(data: {
    studentId: string;
    schoolId: string;
    classId: string;
    academicYear: string;
    term: string;
  }): Promise<{ success: boolean; created: number }> {
    return apiService.post('/fees/seed', data);
  },
};
