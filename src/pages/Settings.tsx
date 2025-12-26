import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Switch,
  Button,
  Select,
  Divider,
  Space,
  message,
  Modal,
  Alert,
  Radio,
  Slider,
  List,
  Tag,
  Upload,
  Tooltip,
} from 'antd';
import {
  BgColorsOutlined,
  BellOutlined,
  GlobalOutlined,
  DatabaseOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  SunOutlined,
  MoonOutlined,
  DesktopOutlined,
  ReloadOutlined,
  KeyOutlined,
  InfoCircleOutlined,
  SaveOutlined,
  CloudDownloadOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';
import { useProjectStore } from '../store/projectStore';
import { useTaskStore } from '../store/taskStore';
import { useMemberStore } from '../store/memberStore';
import { useSettings, defaultSettings } from '../store/settingsStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Settings: React.FC = () => {
  const { projects } = useProjectStore();
  const { tasks } = useTaskStore();
  const { members } = useMemberStore();
  const { settings, updateSettings, saveSettings, resetSettings, hasChanges } = useSettings();

  const [resetModalOpen, setResetModalOpen] = useState(false);

  // 설정 저장 핸들러
  const handleSave = () => {
    saveSettings();
    message.success('설정이 저장되었습니다.');
  };

  // 설정 초기화 핸들러
  const handleReset = () => {
    resetSettings();
    setResetModalOpen(false);
    message.success('설정이 초기화되었습니다.');
  };

  // 데이터 내보내기
  const exportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      projects: localStorage.getItem('project-storage'),
      tasks: localStorage.getItem('task-storage'),
      members: localStorage.getItem('member-storage'),
      settings: localStorage.getItem('app-settings'),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projecthub-backup-${dayjs().format('YYYYMMDD-HHmmss')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    message.success('데이터가 내보내기되었습니다.');
  };

  // 데이터 가져오기
  const importData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.projects) localStorage.setItem('project-storage', data.projects);
        if (data.tasks) localStorage.setItem('task-storage', data.tasks);
        if (data.members) localStorage.setItem('member-storage', data.members);
        if (data.settings) localStorage.setItem('app-settings', data.settings);
        
        message.success('데이터를 성공적으로 가져왔습니다. 페이지를 새로고침합니다.');
        setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
        message.error('잘못된 백업 파일입니다.');
      }
    };
    reader.readAsText(file);
    return false;
  };

  // 모든 데이터 삭제
  const clearAllData = () => {
    Modal.confirm({
      title: '모든 데이터 삭제',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>정말 모든 데이터를 삭제하시겠습니까?</p>
          <p style={{ color: '#ff4d4f' }}>이 작업은 되돌릴 수 없습니다!</p>
          <ul style={{ color: '#8c8c8c', fontSize: 13 }}>
            <li>프로젝트 {projects.length}개</li>
            <li>작업 {tasks.length}개</li>
            <li>팀원 {members.length}명</li>
          </ul>
        </div>
      ),
      okText: '삭제',
      okType: 'danger',
      cancelText: '취소',
      onOk() {
        localStorage.removeItem('project-storage');
        localStorage.removeItem('task-storage');
        localStorage.removeItem('member-storage');
        message.success('모든 데이터가 삭제되었습니다. 페이지를 새로고침합니다.');
        setTimeout(() => window.location.reload(), 1500);
      },
    });
  };

  // 테마 색상 옵션
  const colorOptions = [
    { label: '퍼플', value: '#667eea' },
    { label: '블루', value: '#1890ff' },
    { label: '그린', value: '#52c41a' },
    { label: '오렌지', value: '#fa8c16' },
    { label: '레드', value: '#f5222d' },
    { label: '핑크', value: '#eb2f96' },
    { label: '시안', value: '#13c2c2' },
  ];

  // 단축키 목록
  const shortcuts = [
    { key: 'Ctrl + N', description: '새 작업 추가' },
    { key: 'Ctrl + P', description: '새 프로젝트 추가' },
    { key: 'Ctrl + S', description: '저장' },
    { key: 'Ctrl + F', description: '검색' },
    { key: 'Ctrl + /', description: '단축키 도움말' },
    { key: 'Esc', description: '모달 닫기' },
  ];

  return (
    <div>
      {/* 헤더 */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>설정</Title>
          <Text type="secondary">앱 환경설정 및 데이터 관리</Text>
        </div>
        <Space>
          {hasChanges && (
            <Tag color="warning" icon={<ExclamationCircleOutlined />}>
              저장되지 않은 변경사항
            </Tag>
          )}
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            disabled={!hasChanges}
          >
            설정 저장
          </Button>
        </Space>
      </div>

      <Row gutter={[24, 24]}>
        {/* 테마 설정 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <BgColorsOutlined style={{ color: settings.primaryColor }} />
                테마 설정
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 12, height: '100%' }}
          >
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ display: 'block', marginBottom: 12 }}>테마 모드</Text>
              <Radio.Group
                value={settings.theme}
                onChange={(e) => updateSettings('theme', e.target.value)}
                optionType="button"
                buttonStyle="solid"
              >
                <Radio.Button value="light">
                  <SunOutlined /> 라이트
                </Radio.Button>
                <Radio.Button value="dark">
                  <MoonOutlined /> 다크
                </Radio.Button>
                <Radio.Button value="system">
                  <DesktopOutlined /> 시스템
                </Radio.Button>
              </Radio.Group>
            </div>

            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ display: 'block', marginBottom: 12 }}>테마 색상</Text>
              <Space wrap>
                {colorOptions.map(color => (
                  <Tooltip title={color.label} key={color.value}>
                    <div
                      onClick={() => updateSettings('primaryColor', color.value)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: color.value,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: settings.primaryColor === color.value ? '3px solid #1a1a1a' : '3px solid transparent',
                        transition: 'all 0.2s',
                      }}
                    >
                      {settings.primaryColor === color.value && (
                        <CheckCircleOutlined style={{ color: 'white', fontSize: 16 }} />
                      )}
                    </div>
                  </Tooltip>
                ))}
              </Space>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text strong>글꼴 크기</Text>
                <Text type="secondary">{settings.fontSize}px</Text>
              </div>
              <Slider
                min={12}
                max={18}
                value={settings.fontSize}
                onChange={(value) => updateSettings('fontSize', value)}
                marks={{ 12: '작게', 14: '보통', 16: '크게', 18: '아주 크게' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong>컴팩트 모드</Text>
                  <div><Text type="secondary" style={{ fontSize: 12 }}>UI 요소 간격을 줄여 더 많은 정보 표시</Text></div>
                </div>
                <Switch
                  checked={settings.compactMode}
                  onChange={(checked) => updateSettings('compactMode', checked)}
                />
              </div>
            </div>
          </Card>
        </Col>

        {/* 알림 설정 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <BellOutlined style={{ color: '#faad14' }} />
                알림 설정
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 12, height: '100%' }}
          >
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong>알림 활성화</Text>
                  <div><Text type="secondary" style={{ fontSize: 12 }}>모든 알림을 켜거나 끕니다</Text></div>
                </div>
                <Switch
                  checked={settings.notifications.enabled}
                  onChange={(checked) => updateSettings('notifications.enabled', checked)}
                />
              </div>
            </div>

            <Divider style={{ margin: '16px 0' }} />

            <div style={{ opacity: settings.notifications.enabled ? 1 : 0.5, pointerEvents: settings.notifications.enabled ? 'auto' : 'none' }}>
              <Text strong style={{ display: 'block', marginBottom: 12 }}>알림 유형</Text>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>마감일 알림</Text>
                  <Space>
                    <Select
                      size="small"
                      value={settings.notifications.deadlineDays}
                      onChange={(value) => updateSettings('notifications.deadlineDays', value)}
                      style={{ width: 80 }}
                      options={[
                        { label: '1일 전', value: 1 },
                        { label: '3일 전', value: 3 },
                        { label: '7일 전', value: 7 },
                      ]}
                    />
                    <Switch
                      size="small"
                      checked={settings.notifications.deadlineReminder}
                      onChange={(checked) => updateSettings('notifications.deadlineReminder', checked)}
                    />
                  </Space>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>작업 할당 알림</Text>
                  <Switch
                    size="small"
                    checked={settings.notifications.taskAssigned}
                    onChange={(checked) => updateSettings('notifications.taskAssigned', checked)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>작업 완료 알림</Text>
                  <Switch
                    size="small"
                    checked={settings.notifications.taskCompleted}
                    onChange={(checked) => updateSettings('notifications.taskCompleted', checked)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>프로젝트 업데이트</Text>
                  <Switch
                    size="small"
                    checked={settings.notifications.projectUpdates}
                    onChange={(checked) => updateSettings('notifications.projectUpdates', checked)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>알림 소리</Text>
                  <Switch
                    size="small"
                    checked={settings.notifications.sound}
                    onChange={(checked) => updateSettings('notifications.sound', checked)}
                  />
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* 언어 및 지역 설정 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <GlobalOutlined style={{ color: '#13c2c2' }} />
                언어 및 지역
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 12 }}
          >
            <div style={{ marginBottom: 20 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>언어</Text>
              <Select
                value={settings.language}
                onChange={(value) => updateSettings('language', value)}
                style={{ width: '100%' }}
                options={[
                  { label: '🇰🇷 한국어', value: 'ko' },
                  { label: '🇺🇸 English', value: 'en' },
                  { label: '🇯🇵 日本語', value: 'ja' },
                  { label: '🇨🇳 中文', value: 'zh' },
                ]}
              />
              <div style={{ marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>* 언어 변경은 추후 업데이트 예정입니다.</Text>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>날짜 형식</Text>
              <Select
                value={settings.dateFormat}
                onChange={(value) => updateSettings('dateFormat', value)}
                style={{ width: '100%' }}
                options={[
                  { label: `YYYY-MM-DD (${dayjs().format('YYYY-MM-DD')})`, value: 'YYYY-MM-DD' },
                  { label: `YYYY.MM.DD (${dayjs().format('YYYY.MM.DD')})`, value: 'YYYY.MM.DD' },
                  { label: `MM/DD/YYYY (${dayjs().format('MM/DD/YYYY')})`, value: 'MM/DD/YYYY' },
                  { label: `DD/MM/YYYY (${dayjs().format('DD/MM/YYYY')})`, value: 'DD/MM/YYYY' },
                ]}
              />
            </div>

            <div>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>시간 형식</Text>
              <Radio.Group
                value={settings.timeFormat}
                onChange={(e) => updateSettings('timeFormat', e.target.value)}
              >
                <Radio value="24h">24시간 (14:30)</Radio>
                <Radio value="12h">12시간 (2:30 PM)</Radio>
              </Radio.Group>
            </div>
          </Card>
        </Col>

        {/* 데이터 관리 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <DatabaseOutlined style={{ color: '#52c41a' }} />
                데이터 관리
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 12 }}
          >
            <Alert
              message="현재 데이터 현황"
              description={
                <Space split={<Divider type="vertical" />}>
                  <span>프로젝트 <strong>{projects.length}</strong>개</span>
                  <span>작업 <strong>{tasks.length}</strong>개</span>
                  <span>팀원 <strong>{members.length}</strong>명</span>
                </Space>
              }
              type="info"
              showIcon
              style={{ marginBottom: 20 }}
            />

            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              <Button
                icon={<CloudDownloadOutlined />}
                onClick={exportData}
                block
                style={{ textAlign: 'left', height: 48 }}
              >
                <span style={{ marginLeft: 8 }}>
                  <div>데이터 내보내기</div>
                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>JSON 파일로 백업</div>
                </span>
              </Button>

              <Upload
                accept=".json"
                showUploadList={false}
                beforeUpload={importData}
              >
                <Button
                  icon={<CloudUploadOutlined />}
                  block
                  style={{ textAlign: 'left', height: 48, width: '100%' }}
                >
                  <span style={{ marginLeft: 8 }}>
                    <div>데이터 가져오기</div>
                    <div style={{ fontSize: 11, color: '#8c8c8c' }}>백업 파일에서 복원</div>
                  </span>
                </Button>
              </Upload>

              <Button
                icon={<DeleteOutlined />}
                danger
                onClick={clearAllData}
                block
                style={{ textAlign: 'left', height: 48 }}
              >
                <span style={{ marginLeft: 8 }}>
                  <div>모든 데이터 삭제</div>
                  <div style={{ fontSize: 11, color: '#ff7875' }}>되돌릴 수 없습니다</div>
                </span>
              </Button>
            </Space>
          </Card>
        </Col>

        {/* 단축키 안내 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <KeyOutlined style={{ color: '#722ed1' }} />
                단축키 안내
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 12 }}
          >
            <List
              size="small"
              dataSource={shortcuts}
              renderItem={(item) => (
                <List.Item style={{ padding: '8px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <Text type="secondary">{item.description}</Text>
                    <Tag style={{ fontFamily: 'monospace' }}>{item.key}</Tag>
                  </div>
                </List.Item>
              )}
            />
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                * 단축키 기능은 추후 업데이트 예정입니다.
              </Text>
            </div>
          </Card>
        </Col>

        {/* 기타 설정 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                기타 설정
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 12 }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong>자동 저장</Text>
                  <div><Text type="secondary" style={{ fontSize: 12 }}>변경사항을 자동으로 저장합니다</Text></div>
                </div>
                <Switch
                  checked={settings.autoSave}
                  onChange={(checked) => updateSettings('autoSave', checked)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong>도움말 팁 표시</Text>
                  <div><Text type="secondary" style={{ fontSize: 12 }}>유용한 팁과 안내를 표시합니다</Text></div>
                </div>
                <Switch
                  checked={settings.showTips}
                  onChange={(checked) => updateSettings('showTips', checked)}
                />
              </div>

              <Divider style={{ margin: '8px 0' }} />

              <Button
                icon={<ReloadOutlined />}
                onClick={() => setResetModalOpen(true)}
              >
                설정 초기화
              </Button>
            </div>
          </Card>
        </Col>

        {/* 앱 정보 */}
        <Col span={24}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: 48, 
                height: 48, 
                borderRadius: 12, 
                background: `linear-gradient(135deg, ${settings.primaryColor} 0%, #764ba2 100%)`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}>
                <span style={{ color: 'white', fontSize: 20, fontWeight: 700 }}>P</span>
              </div>
              <div>
                <Text strong style={{ fontSize: 16 }}>ProjectHub</Text>
              </div>
              <div>
                <Text type="secondary">버전 1.0.0</Text>
              </div>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  © 2024 ProjectHub. All rights reserved.
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 설정 초기화 모달 */}
      <Modal
        title="설정 초기화"
        open={resetModalOpen}
        onOk={handleReset}
        onCancel={() => setResetModalOpen(false)}
        okText="초기화"
        cancelText="취소"
        okButtonProps={{ danger: true }}
      >
        <p>모든 설정을 기본값으로 초기화하시겠습니까?</p>
        <p style={{ color: '#8c8c8c', fontSize: 13 }}>
          테마, 알림, 언어 등 모든 설정이 초기화됩니다.
          (프로젝트, 작업, 팀원 데이터는 유지됩니다.)
        </p>
      </Modal>
    </div>
  );
};

export default Settings;
