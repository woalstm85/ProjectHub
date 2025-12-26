import React, { useState, useRef } from 'react';
import { Card, Tabs, Button, Table, Row, Col, Statistic, Space, Tag, Typography, message, Spin } from 'antd';
import {
  TeamOutlined,
  DollarOutlined,
  ProjectOutlined,
} from '@ant-design/icons';

// 커스텀 PDF 아이콘
const PdfIcon = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" fill="#E53935" />
    <path d="M6 20V4h7v5h5v11H6z" fill="#FFCDD2" />
    <text x="7" y="17" fontSize="6" fontWeight="bold" fill="#C62828">PDF</text>
  </svg>
);

// 커스텀 Excel 아이콘
const ExcelIcon = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor">
    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" fill="#2E7D32" />
    <path d="M6 20V4h7v5h5v11H6z" fill="#C8E6C9" />
    <text x="6.5" y="17" fontSize="5" fontWeight="bold" fill="#1B5E20">XLS</text>
  </svg>
);
import { useProjectStore, ProjectStatus } from '../store/projectStore';
import { useTaskStore, TaskStatus } from '../store/taskStore';
import { useMemberStore } from '../store/memberStore';
import { useSettings } from '../store/settingsStore';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import jsPDF from 'jspdf';

import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Reports: React.FC = () => {
  const { projects } = useProjectStore();
  const { tasks } = useTaskStore();
  const { members } = useMemberStore();
  const { effectiveTheme } = useSettings();
  const [activeTab, setActiveTab] = useState('project');
  const [isExporting, setIsExporting] = useState(false);

  // 각 탭 콘텐츠를 캡처하기 위한 ref
  const contentRef = useRef<HTMLDivElement>(null);

  const isDark = effectiveTheme === 'dark';

  // 다크모드 색상
  const colors = {
    cardBg: isDark ? '#1f1f1f' : '#ffffff',
    text: isDark ? '#ffffff' : '#262626',
    textSecondary: isDark ? '#a0a0a0' : '#8c8c8c',
    border: isDark ? '#404040' : '#f0f0f0',
    chartGrid: isDark ? '#404040' : '#e0e0e0',
  };

  // --- Data Preparation ---

  // Project Data
  const projectData = projects.map(p => {
    const pTasks = tasks.filter(t => t.projectId === p.id);
    const completed = pTasks.filter(t => t.status === TaskStatus.DONE).length;
    const total = pTasks.length;
    return {
      key: p.id,
      name: p.name,
      status: p.status,
      progress: p.progress,
      taskProgress: total > 0 ? Math.round((completed / total) * 100) : 0,
      budget: p.budget,
      spent: p.spentBudget,
      startDate: p.startDate,
      endDate: p.endDate,
    };
  });

  // Team Data
  const teamData = members.map(m => {
    const mTasks = tasks.filter(t => t.assignee === m.id);
    const completed = mTasks.filter(t => t.status === TaskStatus.DONE).length;
    return {
      key: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      totalTasks: mTasks.length,
      completedTasks: completed,
      activeTasks: mTasks.length - completed,
      completionRate: mTasks.length > 0 ? Math.round((completed / mTasks.length) * 100) : 0,
    };
  });

  // Financial Data
  const financialData = projects.map(p => ({
    key: p.id,
    name: p.name,
    budget: p.budget,
    spent: p.spentBudget,
    variance: p.budget - p.spentBudget,
    usageRate: p.budget > 0 ? Math.round((p.spentBudget / p.budget) * 100) : 0,
  }));

  // --- Columns ---

  const projectColumns = [
    { title: '프로젝트명', dataIndex: 'name', key: 'name' },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: ProjectStatus) => (
        <Tag color={status === ProjectStatus.COMPLETED ? 'green' : status === ProjectStatus.IN_PROGRESS ? 'blue' : 'default'}>
          {status}
        </Tag>
      )
    },
    { title: '진행률', dataIndex: 'progress', key: 'progress', render: (val: number) => `${val}%` },
    { title: '작업 완료율', dataIndex: 'taskProgress', key: 'taskProgress', render: (val: number) => `${val}%` },
    { title: '시작일', dataIndex: 'startDate', key: 'startDate', render: (val: Date) => dayjs(val).format('YYYY-MM-DD') },
    { title: '종료일', dataIndex: 'endDate', key: 'endDate', render: (val: Date) => dayjs(val).format('YYYY-MM-DD') },
  ];

  const teamColumns = [
    { title: '이름', dataIndex: 'name', key: 'name' },
    { title: '이메일', dataIndex: 'email', key: 'email' },
    { title: '역할', dataIndex: 'role', key: 'role' },
    { title: '총 작업', dataIndex: 'totalTasks', key: 'totalTasks' },
    { title: '완료된 작업', dataIndex: 'completedTasks', key: 'completedTasks' },
    { title: '진행중인 작업', dataIndex: 'activeTasks', key: 'activeTasks' },
    { title: '완료율', dataIndex: 'completionRate', key: 'completionRate', render: (val: number) => `${val}%` },
  ];

  const financialColumns = [
    { title: '프로젝트명', dataIndex: 'name', key: 'name' },
    { title: '총 예산', dataIndex: 'budget', key: 'budget', render: (val: number) => `${val.toLocaleString()}원` },
    { title: '지출', dataIndex: 'spent', key: 'spent', render: (val: number) => `${val.toLocaleString()}원` },
    {
      title: '잔액',
      dataIndex: 'variance',
      key: 'variance',
      render: (val: number) => (
        <span style={{ color: val < 0 ? 'red' : 'green' }}>{val.toLocaleString()}원</span>
      )
    },
    {
      title: '사용률',
      dataIndex: 'usageRate',
      key: 'usageRate',
      render: (val: number) => (
        <Tag color={val > 100 ? 'red' : val > 90 ? 'orange' : 'green'}>{val}%</Tag>
      )
    },
  ];

  // --- Export Functions ---

  // 화면 캡처 PDF 내보내기 (html2canvas 사용)
  const exportPDFWithScreenshot = async () => {
    if (!contentRef.current) {
      message.error('내보낼 콘텐츠를 찾을 수 없습니다.');
      return;
    }

    setIsExporting(true);
    message.loading({ content: 'PDF 생성 중...', key: 'pdf-export' });

    try {
      // html2canvas 동적 import
      const html2canvas = (await import('html2canvas')).default;

      const element = contentRef.current;

      // 캡처 전 배경색 설정 (다크모드 대응)
      const originalBg = element.style.backgroundColor;
      element.style.backgroundColor = isDark ? '#141414' : '#ffffff';

      const canvas = await html2canvas(element, {
        scale: 2, // 고해상도
        useCORS: true,
        logging: false,
        backgroundColor: isDark ? '#141414' : '#ffffff',
      });

      // 원래 배경색 복원
      element.style.backgroundColor = originalBg;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'mm',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth - 20; // 좌우 마진 10mm씩
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // 이미지가 한 페이지에 안 맞으면 여러 페이지로 분할
      let yPosition = 10; // 상단 마진만
      let remainingHeight = imgHeight;
      let sourceY = 0;

      while (remainingHeight > 0) {
        const availableHeight = pageHeight - yPosition - 10; // 하단 마진
        const heightToDraw = Math.min(remainingHeight, availableHeight);
        const sourceHeight = (heightToDraw / imgHeight) * canvas.height;

        // 이미지 일부분 추출
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = sourceHeight;
        const ctx = tempCanvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(
            canvas,
            0, sourceY, canvas.width, sourceHeight,
            0, 0, canvas.width, sourceHeight
          );

          const partImgData = tempCanvas.toDataURL('image/png');
          pdf.addImage(partImgData, 'PNG', 10, yPosition, imgWidth, heightToDraw);
        }

        remainingHeight -= heightToDraw;
        sourceY += sourceHeight;

        if (remainingHeight > 0) {
          pdf.addPage();
          yPosition = 10;
        }
      }

      const fileName = `${activeTab}_report_${dayjs().format('YYYYMMDD_HHmmss')}.pdf`;
      pdf.save(fileName);

      message.success({ content: 'PDF가 다운로드되었습니다!', key: 'pdf-export' });
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      message.error({ content: 'PDF 생성에 실패했습니다. html2canvas가 설치되어 있는지 확인해주세요.', key: 'pdf-export' });
    } finally {
      setIsExporting(false);
    }
  };



  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    let ws;
    let sheetName = '';

    if (activeTab === 'project') {
      ws = XLSX.utils.json_to_sheet(projectData);
      sheetName = 'Project_Report';
    } else if (activeTab === 'team') {
      ws = XLSX.utils.json_to_sheet(teamData);
      sheetName = 'Team_Report';
    } else {
      ws = XLSX.utils.json_to_sheet(financialData);
      sheetName = 'Financial_Report';
    }

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${activeTab}_report_${dayjs().format('YYYYMMDD')}.xlsx`);
    message.success('Excel 다운로드가 시작되었습니다.');
  };

  // --- Tab Content ---

  const renderProjectContent = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={16}>
        <Col span={8}>
          <Card style={{ background: colors.cardBg, borderColor: colors.border }}>
            <Statistic
              title={<span style={{ color: colors.textSecondary }}>총 프로젝트</span>}
              value={projects.length}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: colors.text }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ background: colors.cardBg, borderColor: colors.border }}>
            <Statistic
              title={<span style={{ color: colors.textSecondary }}>평균 진행률</span>}
              value={Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length || 0)}
              suffix="%"
              valueStyle={{ color: colors.text }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ background: colors.cardBg, borderColor: colors.border }}>
            <Statistic
              title={<span style={{ color: colors.textSecondary }}>완료된 프로젝트</span>}
              value={projects.filter(p => p.status === ProjectStatus.COMPLETED).length}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>
      <Card title="프로젝트 현황 차트" style={{ background: colors.cardBg, borderColor: colors.border }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={projectData}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
            <XAxis dataKey="name" tick={{ fill: colors.text }} />
            <YAxis tick={{ fill: colors.text }} />
            <Tooltip
              contentStyle={{
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.border}`,
                color: colors.text,
              }}
            />
            <Legend wrapperStyle={{ color: colors.text }} />
            <Bar dataKey="progress" name="진행률 (%)" fill="#1890ff" />
            <Bar dataKey="taskProgress" name="작업 완료율 (%)" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Table columns={projectColumns} dataSource={projectData} pagination={false} />
    </Space>
  );

  const renderTeamContent = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={16}>
        <Col span={8}>
          <Card style={{ background: colors.cardBg, borderColor: colors.border }}>
            <Statistic
              title={<span style={{ color: colors.textSecondary }}>총 팀원</span>}
              value={members.length}
              prefix={<TeamOutlined />}
              valueStyle={{ color: colors.text }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ background: colors.cardBg, borderColor: colors.border }}>
            <Statistic
              title={<span style={{ color: colors.textSecondary }}>총 할당된 작업</span>}
              value={tasks.length}
              valueStyle={{ color: colors.text }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ background: colors.cardBg, borderColor: colors.border }}>
            <Statistic
              title={<span style={{ color: colors.textSecondary }}>평균 작업 완료율</span>}
              value={Math.round(teamData.reduce((acc, m) => acc + m.completionRate, 0) / members.length || 0)}
              suffix="%"
              valueStyle={{ color: colors.text }}
            />
          </Card>
        </Col>
      </Row>
      <Card title="팀원별 작업 현황" style={{ background: colors.cardBg, borderColor: colors.border }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={teamData}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
            <XAxis dataKey="name" tick={{ fill: colors.text }} />
            <YAxis tick={{ fill: colors.text }} />
            <Tooltip
              contentStyle={{
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.border}`,
                color: colors.text,
              }}
            />
            <Legend wrapperStyle={{ color: colors.text }} />
            <Bar dataKey="totalTasks" name="총 작업" fill="#8884d8" />
            <Bar dataKey="completedTasks" name="완료된 작업" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Table columns={teamColumns} dataSource={teamData} pagination={false} />
    </Space>
  );

  const renderFinancialContent = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={16}>
        <Col span={8}>
          <Card style={{ background: colors.cardBg, borderColor: colors.border }}>
            <Statistic
              title={<span style={{ color: colors.textSecondary }}>총 예산</span>}
              value={projects.reduce((acc, p) => acc + p.budget, 0)}
              prefix="₩"
              precision={0}
              valueStyle={{ color: colors.text }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ background: colors.cardBg, borderColor: colors.border }}>
            <Statistic
              title={<span style={{ color: colors.textSecondary }}>총 지출</span>}
              value={projects.reduce((acc, p) => acc + p.spentBudget, 0)}
              prefix="₩"
              precision={0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ background: colors.cardBg, borderColor: colors.border }}>
            <Statistic
              title={<span style={{ color: colors.textSecondary }}>예산 잔액</span>}
              value={projects.reduce((acc, p) => acc + (p.budget - p.spentBudget), 0)}
              prefix="₩"
              precision={0}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>
      <Card title="예산 대비 지출 현황" style={{ background: colors.cardBg, borderColor: colors.border }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={financialData}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.chartGrid} />
            <XAxis dataKey="name" tick={{ fill: colors.text }} />
            <YAxis tick={{ fill: colors.text }} />
            <Tooltip
              formatter={(value: number) => `${value.toLocaleString()}원`}
              contentStyle={{
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.border}`,
                color: colors.text,
              }}
            />
            <Legend wrapperStyle={{ color: colors.text }} />
            <Bar dataKey="budget" name="예산" fill="#1890ff" />
            <Bar dataKey="spent" name="지출" fill="#ff4d4f" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Table columns={financialColumns} dataSource={financialData} pagination={false} />
    </Space>
  );

  const items = [
    {
      key: 'project',
      label: <span><ProjectOutlined /> 프로젝트 보고서</span>,
      children: renderProjectContent(),
    },
    {
      key: 'team',
      label: <span><TeamOutlined /> 팀원 성과 보고서</span>,
      children: renderTeamContent(),
    },
    {
      key: 'financial',
      label: <span><DollarOutlined /> 비용 분석 보고서</span>,
      children: renderFinancialContent(),
    },
  ];

  return (
    <div className="reports-container">
      <Spin spinning={isExporting} tip="PDF 생성 중...">
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2} style={{ marginBottom: 0 }}>종합 보고서</Title>
            <Text type="secondary">프로젝트, 팀, 비용에 대한 상세 분석 및 리포트</Text>
          </div>
          <Space>
            <Button
              icon={<PdfIcon />}
              onClick={exportPDFWithScreenshot}
              loading={isExporting}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              PDF 내보내기
            </Button>
            <Button
              icon={<ExcelIcon />}
              onClick={exportExcel}
              style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#217346', borderColor: '#217346', color: '#fff' }}
            >
              Excel 내보내기
            </Button>
          </Space>
        </div>

        <Card style={{ background: colors.cardBg, borderColor: colors.border }}>
          <div ref={contentRef} style={{ padding: '16px 0' }}>
            {/* PDF 캡처용 헤더 */}
            <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${colors.border}` }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: colors.text, marginBottom: 4 }}>
                {activeTab === 'project' && '프로젝트 보고서'}
                {activeTab === 'team' && '팀원 성과 보고서'}
                {activeTab === 'financial' && '비용 분석 보고서'}
              </div>
              <div style={{ fontSize: 12, color: colors.textSecondary }}>
                생성일: {dayjs().format('YYYY년 MM월 DD일 HH:mm')}
              </div>
            </div>

            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={items}
              type="card"
              size="large"
            />
          </div>
        </Card>
      </Spin>
    </div>
  );
};

export default Reports;
