import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Form, Button, Table, Alert } from 'react-bootstrap';
import { Layout } from '../components/Layout';
import { Sidebar } from '../components/Sidebar';
import reportService from '../services/reportService';
import { useLang } from '../contexts/LangContext';
import { classService } from '../services/classService';
import { schoolService } from '../services/schoolService';
import { School, SchoolClass } from '../types';
import { teacherService } from '../services/teacherService';

const sidebarItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'bi-speedometer2' },
  { path: '/students', label: 'Students', icon: 'bi-people' },
  { path: '/teachers', label: 'Teachers', icon: 'bi-person-badge' },
  { path: '/classes', label: 'Classes', icon: 'bi-door-open' },
  { path: '/fees', label: 'Fees', icon: 'bi-cash-coin' },
  { path: '/admin/reports', label: 'Admin Reports', icon: 'bi-file-earmark-bar-graph' },
];

export const AdminReports: React.FC = () => {
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [classParams, setClassParams] = useState<{ classId: string; schoolId?: string; from?: string; to?: string }>({ classId: '' });
  const [teacherParams, setTeacherParams] = useState<{ teacherId: string; schoolId?: string; from?: string; to?: string }>({ teacherId: '' });
  const [financeParams, setFinanceParams] = useState<{ schoolId: string; from?: string; to?: string }>({ schoolId: '' });

  const [classStats, setClassStats] = useState<any | null>(null);
  const [teacherStats, setTeacherStats] = useState<any | null>(null);
  const [financeSummary, setFinanceSummary] = useState<any | null>(null);

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  const onChange = (set: any) => (e: React.ChangeEvent<HTMLInputElement>) => {
    set((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [cls, sch] = await Promise.all([
          classService.getAllClasses().catch(() => []),
          schoolService.list().catch(() => []),
        ]);
        setClasses(cls || []);
        setSchools(sch || []);
      } catch {}
      try {
        // Load teachers for dropdown (fetch first 1000 entries)
        const page = await teacherService.getAllTeachers({ page: 0, size: 1000, sort: 'firstName,asc' });
        setTeachers((page?.content as any[]) || []);
      } catch {
        setTeachers([]);
      }
    };
    init();
  }, []);

  const fetchClassStats = async () => {
    setLoading(true); setError('');
    try {
      const data = await reportService.getClassStats(classParams);
      setClassStats(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || t('error.failed_to_fetch_class_stats'));
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherStats = async () => {
    setLoading(true); setError('');
    try {
      const data = await reportService.getTeacherStats(teacherParams);
      setTeacherStats(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || t('error.failed_to_fetch_teacher_stats'));
    } finally {
      setLoading(false);
    }
  };

  const fetchFinanceSummary = async () => {
    setLoading(true); setError('');
    try {
      const data = await reportService.getFinanceSummary(financeParams);
      setFinanceSummary(data);
    } catch (e: any) {
      setError(e?.response?.data?.message || t('error.failed_to_fetch_finance_summary'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Row>
        <Col md={2} className="px-0">
          <Sidebar items={sidebarItems} />
        </Col>
        <Col md={10}>
          <div className="mb-4">
            <h2>{t('nav.admin_reports')}</h2>
            <p className="text-muted">{t('admin.reports.subtitle')}</p>
          </div>

          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

          <Row>
            <Col md={12} className="mb-4">
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white"><strong>{t('admin.reports.class_stats')}</strong></Card.Header>
                <Card.Body>
                  <Row className="g-3">
                    <Col md={3}>
                      <Form.Select name="classId" value={classParams.classId} onChange={(e) => setClassParams(prev => ({ ...prev, classId: e.target.value }))}>
                        <option value="">{t('admin.reports.select_class')}</option>
                        {(classes || []).filter(c => !classParams.schoolId || c.schoolId === classParams.schoolId).map((c) => (
                          <option key={c.id} value={c.id}>{c.className || c.name || c.id}</option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={3}>
                      <Form.Select name="schoolId" value={classParams.schoolId || ''} onChange={(e) => setClassParams(prev => ({ ...prev, schoolId: e.target.value }))}>
                        <option value="">{t('admin.reports.select_school')}</option>
                        {(schools || []).map((s) => (
                          <option key={s.id} value={s.id}>{s.name || s.id}</option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={3}>
                      <Form.Control type="date" name="from" value={classParams.from || ''} onChange={onChange(setClassParams)} />
                    </Col>
                    <Col md={3}>
                      <Form.Control type="date" name="to" value={classParams.to || ''} onChange={onChange(setClassParams)} />
                    </Col>
                  </Row>
                  <div className="d-flex gap-2 mt-3">
                    <Button onClick={fetchClassStats} disabled={loading || !classParams.classId}>{t('common.fetch')}</Button>
                    <Button variant="outline-secondary" onClick={() => reportService.downloadClassStatsCsv(classParams)} disabled={!classParams.classId}>{t('common.download_csv')}</Button>
                  </div>
                  {classStats && (
                    <div className="mt-3">
                      <Table bordered size="sm">
                        <tbody>
                          {Object.keys(classStats).map((k) => (
                            <tr key={k}><td>{k}</td><td>{String(classStats[k])}</td></tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={12} className="mb-4">
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white"><strong>{t('admin.reports.teacher_report')}</strong></Card.Header>
                <Card.Body>
                  <Row className="g-3">
                    <Col md={3}>
                      <Form.Select
                        name="teacherId"
                        value={teacherParams.teacherId}
                        onChange={(e) => setTeacherParams(prev => ({ ...prev, teacherId: e.target.value }))}
                      >
                        <option value="">{t('admin.reports.select_teacher') || 'Select Teacher'}</option>
                        {(teachers || [])
                          .filter((tch: any) => !teacherParams.schoolId || tch.schoolId === teacherParams.schoolId)
                          .map((tch: any) => (
                            <option key={tch.id} value={tch.id}>{`${tch.firstName || ''} ${tch.lastName || ''}`.trim() || tch.email || tch.id}</option>
                          ))}
                      </Form.Select>
                    </Col>
                    <Col md={3}>
                      <Form.Select name="schoolId" value={teacherParams.schoolId || ''} onChange={(e) => setTeacherParams(prev => ({ ...prev, schoolId: e.target.value }))}>
                        <option value="">{t('admin.reports.select_school')}</option>
                        {(schools || []).map((s) => (
                          <option key={s.id} value={s.id}>{s.name || s.id}</option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={3}>
                      <Form.Control type="date" name="from" value={teacherParams.from || ''} onChange={onChange(setTeacherParams)} />
                    </Col>
                    <Col md={3}>
                      <Form.Control type="date" name="to" value={teacherParams.to || ''} onChange={onChange(setTeacherParams)} />
                    </Col>
                  </Row>
                  <div className="d-flex gap-2 mt-3">
                    <Button onClick={fetchTeacherStats} disabled={loading || !teacherParams.teacherId}>{t('common.fetch')}</Button>
                    <Button variant="outline-secondary" onClick={() => reportService.downloadTeacherStatsCsv(teacherParams)} disabled={!teacherParams.teacherId}>{t('common.download_csv')}</Button>
                  </div>
                  {teacherStats && (
                    <div className="mt-3">
                      <Table bordered size="sm">
                        <tbody>
                          {Object.keys(teacherStats).map((k) => (
                            <tr key={k}><td>{k}</td><td>{String(teacherStats[k])}</td></tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={12} className="mb-4">
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white"><strong>{t('admin.reports.finance_summary')}</strong></Card.Header>
                <Card.Body>
                  <Row className="g-3">
                    <Col md={4}>
                      <Form.Select name="schoolId" value={financeParams.schoolId} onChange={(e) => setFinanceParams(prev => ({ ...prev, schoolId: e.target.value }))}>
                        <option value="">{t('admin.reports.select_school')}</option>
                        {(schools || []).map((s) => (
                          <option key={s.id} value={s.id}>{s.name || s.id}</option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col md={4}>
                      <Form.Control type="date" name="from" value={financeParams.from || ''} onChange={onChange(setFinanceParams)} />
                    </Col>
                    <Col md={4}>
                      <Form.Control type="date" name="to" value={financeParams.to || ''} onChange={onChange(setFinanceParams)} />
                    </Col>
                  </Row>
                  <div className="d-flex gap-2 mt-3">
                    <Button onClick={fetchFinanceSummary} disabled={loading || !financeParams.schoolId}>{t('common.fetch')}</Button>
                    <Button variant="outline-secondary" onClick={() => reportService.downloadFinanceSummaryCsv(financeParams)} disabled={!financeParams.schoolId}>{t('common.download_csv')}</Button>
                  </div>
                  {financeSummary && (
                    <div className="mt-3">
                      <Table bordered size="sm">
                        <tbody>
                          {Object.keys(financeSummary).map((k) => (
                            <tr key={k}><td>{k}</td><td>{String(financeSummary[k])}</td></tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Layout>
  );
};
