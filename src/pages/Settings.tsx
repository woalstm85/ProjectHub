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
  Input,
  Descriptions,
  Form
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
  SaveOutlined,
  CloudDownloadOutlined,
  CloudUploadOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useProjectStore } from '../store/projectStore';
import { useTaskStore } from '../store/taskStore';
import { useMemberStore } from '../store/memberStore';
import { useSettings } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Settings: React.FC = () => {
  const { projects } = useProjectStore();
  const { tasks } = useTaskStore();
  const { members, updateMember } = useMemberStore();
  const { settings, updateSettings, saveSettings, resetSettings, hasChanges } = useSettings();
  const { user, setUser } = useAuthStore();

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [form] = Form.useForm();

  // 프로필 업데이트 핸들러
  const handleUpdateProfile = (values: any) => {
    if (!user) return;

    // 1. Auth Store 업데이트
    const updatedUser = { ...user, ...values };
    setUser(updatedUser);

    // 2. Member Store 업데이트 (연동된 경우)
    if (user.memberId) {
      updateMember(user.memberId, {
        name: values.name,
        email: values.email,
        // 필요한 경우 다른 필드 추가
      });
    }

    message.success('프로필이 업데이트되었습니다.');
    setProfileModalOpen(false);
  };

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

  // 데이터 가져오기 (Mock implementation mostly, assumes format matches)
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
    { label: '그레이', value: '#595959' }, // New option
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            size="large"
          >
            설정 저장
          </Button>
        </Space>
      </div>

      <Row gutter={[24, 24]}>

        {/* 계정 정보 (New) */}
        <Col span={24}>
          <Card
            title={
              <Space>
                <SafetyCertificateOutlined style={{ color: '#1890ff' }} />
                계정 정보
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 16 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32
              }}>
                {user?.avatar ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : <UserOutlined style={{ color: '#bfbfbf' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <Descriptions title={null} column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
                  <Descriptions.Item label="이름">{user?.name}</Descriptions.Item>
                  <Descriptions.Item label="이메일">{user?.email}</Descriptions.Item>
                  <Descriptions.Item label="직책">{user?.role === 'admin' ? '관리자' : '일반 멤버'}</Descriptions.Item>
                  <Descriptions.Item label="가입일">{dayjs(user?.createdAt).format('YYYY-MM-DD')}</Descriptions.Item>
                </Descriptions>
              </div>
              <div>
                <Button onClick={() => {
                  form.setFieldsValue({
                    name: user?.name,
                    email: user?.email,
                  });
                  setProfileModalOpen(true);
                }}>프로필 편집</Button>
              </div>
            </div>
          </Card>
        </Col>

        {/* 1. 화면 설정 (Appearance) */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <BgColorsOutlined style={{ color: settings.primaryColor }} />
                화면 설정
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 16, height: '100%' }}
            extra={<Button type="text" size="small" onClick={() => updateSettings('theme', settings.theme === 'dark' ? 'light' : 'dark')}>{settings.theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}</Button>}
          >
            {/* 테마 모드 */}
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ display: 'block', marginBottom: 12 }}>테마 모드</Text>
              <Radio.Group
                value={settings.theme}
                onChange={(e) => updateSettings('theme', e.target.value)}
                optionType="button"
                buttonStyle="solid"
                style={{ width: '100%' }}
              >
                <Radio.Button value="light" style={{ width: '33%', textAlign: 'center' }}>
                  <SunOutlined /> 라이트
                </Radio.Button>
                <Radio.Button value="dark" style={{ width: '33%', textAlign: 'center' }}>
                  <MoonOutlined /> 다크
                </Radio.Button>
                <Radio.Button value="system" style={{ width: '34%', textAlign: 'center' }}>
                  <DesktopOutlined /> 시스템
                </Radio.Button>
              </Radio.Group>
            </div>

            <Divider />

            {/* 브랜드 컬러 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text strong>브랜드 컬러</Text>
                <Text type="secondary">{settings.primaryColor}</Text>
              </div>
              <Space wrap size={[12, 12]}>
                {colorOptions.map(color => (
                  <Tooltip title={color.label} key={color.value}>
                    <div
                      onClick={() => updateSettings('primaryColor', color.value)}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: color.value,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: settings.primaryColor === color.value ? '3px solid #1a1a1a' : '3px solid transparent',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s',
                        transform: settings.primaryColor === color.value ? 'scale(1.1)' : 'scale(1)',
                      }}
                    >
                      {settings.primaryColor === color.value && (
                        <CheckCircleOutlined style={{ color: 'white', fontSize: 18, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }} />
                      )}
                    </div>
                  </Tooltip>
                ))}
              </Space>
            </div>

            <Divider />

            {/* 폰트 크기 */}
            <div>
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
                tooltip={{ formatter: (val) => `${val}px` }}
              />
            </div>
          </Card>
        </Col>

        {/* 2. 알림 설정 (Notifications) */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <BellOutlined style={{ color: '#faad14' }} />
                알림 설정
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 16, height: '100%' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, padding: '16px', background: settings.theme === 'dark' ? '#1f1f1f' : '#fffbe6', borderRadius: 8, border: `1px solid ${settings.theme === 'dark' ? '#303030' : '#ffe58f'}` }}>
              <div>
                <Text strong>전체 알림</Text>
                <div><Text type="secondary" style={{ fontSize: 12 }}>앱의 모든 알림을 제어합니다</Text></div>
              </div>
              <Switch
                checked={settings.notifications.enabled}
                onChange={(checked) => updateSettings('notifications.enabled', checked)}
              />
            </div>

            <div style={{ opacity: settings.notifications.enabled ? 1 : 0.5, pointerEvents: settings.notifications.enabled ? 'auto' : 'none' }}>
              <List
                itemLayout="horizontal"
                dataSource={[
                  { title: '작업 할당', desc: '새로운 작업이 나에게 할당될 때', key: 'taskAssigned' },
                  { title: '작업 완료', desc: '내가 팔로우한 작업이 완료될 때', key: 'taskCompleted' },
                  { title: '프로젝트 업데이트', desc: '참여 중인 프로젝트의 주요 변경사항', key: 'projectUpdates' },
                  { title: '마감일 임박', desc: '마감일이 다가오는 작업 알림', key: 'deadlineReminder' },
                  { title: '알림 소리', desc: '알림 수신 시 효과음 재생', key: 'sound' },
                ]}
                renderItem={item => (
                  <List.Item actions={[
                    <Switch
                      checked={settings.notifications[item.key as keyof typeof settings.notifications] as boolean}
                      onChange={(checked) => updateSettings(`notifications.${item.key}`, checked)}
                    />
                  ]}>
                    <List.Item.Meta
                      title={item.title}
                      description={item.desc}
                    />
                  </List.Item>
                )}
              />
            </div>
          </Card>
        </Col>

        {/* 3. 시스템 및 언어 (System) */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <GlobalOutlined style={{ color: '#13c2c2' }} />
                시스템 및 언어
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 16 }}
          >
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>언어 (Language)</Text>
              <Select
                value={settings.language}
                onChange={(value) => updateSettings('language', value)}
                style={{ width: '100%' }}
                size="large"
                options={[
                  { label: '🇰🇷 한국어', value: 'ko' },
                  { label: '🇺🇸 English', value: 'en' },
                  { label: '🇯🇵 日本語 (준비중)', value: 'ja', disabled: true },
                ]}
              />
            </div>

            <Divider />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <Text strong>이메일 알림</Text>
                <div><Text type="secondary" style={{ fontSize: 12 }}>중요한 업데이트를 이메일로 수신</Text></div>
              </div>
              <Switch defaultChecked />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>자동 저장</Text>
                <div><Text type="secondary" style={{ fontSize: 12 }}>작업 내용을 실시간으로 저장</Text></div>
              </div>
              <Switch
                checked={settings.autoSave}
                onChange={(checked) => updateSettings('autoSave', checked)}
              />
            </div>
          </Card>
        </Col>

        {/* 4. 데이터 관리 (Data) */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <DatabaseOutlined style={{ color: '#52c41a' }} />
                데이터 관리
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 16 }}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={16}>
              <div style={{ background: settings.theme === 'dark' ? '#1f1f1f' : '#f9f9f9', padding: 16, borderRadius: 8 }}>
                <Text strong>로컬 데이터 현황</Text>
                <div style={{ marginTop: 8, display: 'flex', gap: 16 }}>
                  <Tag>{projects.length} 프로젝트</Tag>
                  <Tag>{tasks.length} 작업</Tag>
                  <Tag>{members.length} 멤버</Tag>
                </div>
              </div>

              <Button icon={<CloudDownloadOutlined />} onClick={exportData} block size="large">
                데이터 백업 (JSON)
              </Button>

              <Upload accept=".json" showUploadList={false} beforeUpload={importData}>
                <Button icon={<CloudUploadOutlined />} block size="large">
                  데이터 복원
                </Button>
              </Upload>

              <Divider style={{ margin: '8px 0' }} />

              <Button danger icon={<ReloadOutlined />} onClick={() => setResetModalOpen(true)} block>
                설정 초기화
              </Button>

              <Button danger type="dashed" icon={<DeleteOutlined />} onClick={clearAllData} block>
                모든 데이터 삭제
              </Button>
            </Space>
          </Card>
        </Col>

        {/* 푸터 정보 */}
        <Col span={24}>
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#8c8c8c' }}>
            <Space direction="vertical" size={4}>
              <Title level={5} style={{ margin: 0, color: '#bfbfbf' }}>ProjectHub Enterprise</Title>
              <Text type="secondary" style={{ fontSize: 12 }}>Version 2.5.0 (Build 20240501)</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>© 2024 ProjectHub Inc. All rights reserved.</Text>
            </Space>
          </div>
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
        <Alert
          message="주의: 모든 설정이 초기화됩니다."
          description="테마, 알림 설정, 언어 등 개인화된 설정이 기본값으로 되돌아갑니다. 저장된 프로젝트 데이터는 삭제되지 않습니다."
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Modal>

      {/* 프로필 편집 모달 */}
      <Modal
        title="프로필 편집"
        open={profileModalOpen}
        onOk={form.submit}
        onCancel={() => setProfileModalOpen(false)}
        okText="저장"
        cancelText="취소"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateProfile}
        >
          <Form.Item
            label="이름"
            name="name"
            rules={[{ required: true, message: '이름을 입력해주세요' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="이메일"
            name="email"
            rules={[
              { required: true, message: '이메일을 입력해주세요' },
              { type: 'email', message: '유효한 이메일 주소를 입력해주세요' }
            ]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Settings;
