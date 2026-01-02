import React, { useState } from 'react';
import { Form, Input, Button, message, Checkbox, Typography, theme } from 'antd';
import { UserOutlined, LockOutlined, ProjectOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSettings } from '../store/settingsStore';

const { Title, Text } = Typography;

interface LoginFormValues {
  username: string;
  password: string;
  remember: boolean;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'login' | 'findPassword'>('login');
  const { token } = theme.useToken();
  const { effectiveTheme } = useSettings();
  const isDark = effectiveTheme === 'dark';

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const success = await login({ username: values.username, password: values.password });

      if (success) {
        message.success('환영합니다!');
        navigate('/');
      } else {
        message.error('아이디 또는 비밀번호를 확인해주세요.');
      }
    } catch {
      message.error('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const onFindPasswordFinish = (values: { email: string }) => {
    setLoading(true);
    setTimeout(() => {
      message.success(`${values.email}로 비밀번호 재설정 링크가 전송되었습니다.`);
      setLoading(false);
      setViewMode('login');
    }, 1500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      overflow: 'hidden'
    }}>
      {/* Left Side - Branding & Visuals */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #1a365d 0%, #2a4365 50%, #2b6cb0 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 60,
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Abstract Shapes for Visual Interest */}
        <div style={{
          position: 'absolute',
          top: -100,
          left: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute',
          bottom: -50,
          right: -50,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          filter: 'blur(40px)',
        }} />

        <div style={{ zIndex: 1, textAlign: 'center', maxWidth: 480 }}>
          <div style={{
            width: 80,
            height: 80,
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 32px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <ProjectOutlined style={{ fontSize: 40, color: 'white' }} />
          </div>
          <Title style={{ color: 'white', fontSize: 48, marginBottom: 16, fontWeight: 800 }}>
            ProjectHub
          </Title>
          <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: 18, display: 'block', lineHeight: 1.6 }}>
            효율적인 프로젝트 관리의 시작.<br />
            팀의 생산성을 극대화하고 목표를 달성하세요.
          </Text>
        </div>
      </div>

      {/* Right Side - Forms */}
      <div style={{
        flex: '0 0 500px',
        background: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 60px',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.03)',
        position: 'relative'
      }}>
        <div style={{ width: '100%', maxWidth: 360, margin: '0 auto' }}>
          {viewMode === 'login' ? (
            <>
              <div style={{ marginBottom: 40 }}>
                <Title level={2} style={{ marginBottom: 8, color: '#1a202c' }}>로그인</Title>
                <Text type="secondary">계정에 접속하여 프로젝트를 관리하세요.</Text>
              </div>

              <Form
                name="login"
                initialValues={{ remember: true }}
                onFinish={onFinish}
                layout="vertical"
                size="large"
              >
                <Form.Item
                  name="username"
                  rules={[{ required: true, message: '아이디를 입력해주세요.' }]}
                >
                  <Input
                    prefix={<UserOutlined style={{ color: token.colorTextQuaternary }} />}
                    placeholder="아이디"
                    style={{ borderRadius: 8, padding: '10px 16px' }}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[{ required: true, message: '비밀번호를 입력해주세요.' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: token.colorTextQuaternary }} />}
                    placeholder="비밀번호"
                    style={{ borderRadius: 8, padding: '10px 16px' }}
                  />
                </Form.Item>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Checkbox>로그인 상태 유지</Checkbox>
                  </Form.Item>
                  <a
                    href="#"
                    style={{ color: token.colorPrimary, fontSize: 14 }}
                    onClick={(e) => { e.preventDefault(); setViewMode('findPassword'); }}
                  >
                    비밀번호 찾기
                  </a>
                </div>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    style={{
                      height: 48,
                      borderRadius: 8,
                      fontSize: 16,
                      fontWeight: 600,
                      background: 'linear-gradient(90deg, #1a365d 0%, #2b6cb0 100%)',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(43, 108, 176, 0.3)'
                    }}
                  >
                    로그인
                  </Button>
                </Form.Item>
              </Form>

              <div style={{ marginTop: 24, padding: '12px 16px', background: isDark ? '#1a1d1e' : '#f0f7ff', borderRadius: 8, border: `1px solid ${isDark ? '#303030' : '#bae7ff'}`, textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <span style={{ color: token.colorPrimary, fontWeight: 600 }}>Tip:</span> 팀원 관리에 등록된 이메일로 로그인 가능합니다. <br /> (초기 비밀번호: <span style={{ fontWeight: 600 }}>1234</span>)
                </Text>
              </div>

              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  데모 계정:
                  <Text strong style={{ margin: '0 8px', color: '#1a202c' }}>admin / admin123</Text>
                  <Text type="secondary">|</Text>
                  <Text strong style={{ margin: '0 8px', color: '#1a202c' }}>demo / demo123</Text>
                </Text>
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 40 }}>
                <Title level={2} style={{ marginBottom: 8, color: '#1a202c' }}>비밀번호 찾기</Title>
                <Text type="secondary">가입 시 사용한 이메일 주소를 입력하시면<br />비밀번호 재설정 링크를 보내드립니다.</Text>
              </div>

              <Form
                name="findPassword"
                onFinish={onFindPasswordFinish}
                layout="vertical"
                size="large"
              >
                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: '이메일을 입력해주세요.' },
                    { type: 'email', message: '올바른 이메일 형식이 아닙니다.' }
                  ]}
                >
                  <Input
                    placeholder="이메일 주소"
                    style={{ borderRadius: 8, padding: '10px 16px' }}
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    style={{
                      height: 48,
                      borderRadius: 8,
                      fontSize: 16,
                      fontWeight: 600,
                      background: 'linear-gradient(90deg, #1a365d 0%, #2b6cb0 100%)',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(43, 108, 176, 0.3)',
                      marginBottom: 16
                    }}
                  >
                    재설정 링크 보내기
                  </Button>
                  <Button
                    type="link"
                    block
                    onClick={() => setViewMode('login')}
                    style={{ color: '#4a5568' }}
                  >
                    로그인 화면으로 돌아가기
                  </Button>
                </Form.Item>
              </Form>
            </>
          )}
        </div>

        <div style={{ position: 'absolute', bottom: 24, left: 0, right: 0, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            © 2024 ProjectHub. All rights reserved.
          </Text>
        </div>
      </div>
    </div>
  );
};
export default Login;
