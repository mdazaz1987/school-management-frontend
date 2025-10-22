import apiService from './api';

export const reportService = {
  async getClassStats(params: { classId: string; schoolId?: string; from?: string; to?: string }) {
    return apiService.get(`/admin/reports/class-stats`, params);
  },
  async getTeacherStats(params: { teacherId: string; schoolId?: string; from?: string; to?: string }) {
    return apiService.get(`/admin/reports/teacher-stats`, params);
  },
  async getFinanceSummary(params: { schoolId: string; from?: string; to?: string }) {
    return apiService.get(`/admin/reports/finance-summary`, params);
  },
  async downloadCsv(path: string, params: any, filename: string) {
    const axios = apiService.getAxiosInstance();
    const res = await axios.get(path, { params: { ...params, format: 'csv' }, responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
  downloadClassStatsCsv(params: { classId: string; schoolId?: string; from?: string; to?: string }) {
    return reportService.downloadCsv('/admin/reports/class-stats', params, 'class-stats.csv');
  },
  downloadTeacherStatsCsv(params: { teacherId: string; schoolId?: string; from?: string; to?: string }) {
    return reportService.downloadCsv('/admin/reports/teacher-stats', params, 'teacher-stats.csv');
  },
  downloadFinanceSummaryCsv(params: { schoolId: string; from?: string; to?: string }) {
    return reportService.downloadCsv('/admin/reports/finance-summary', params, 'finance-summary.csv');
  },
};

export default reportService;
