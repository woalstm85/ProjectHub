import React, { useState, useEffect, useRef } from 'react';
import {
  Typography,
  Tabs,
  Collapse,
  Form,
  Input,
  Button,
  Select,
  Card,
  Row,
  Col,
  Space,
  Tag,
  Divider,
  message,
  Alert,
  Steps,
  Modal,
  Badge,
  Avatar,
  List,
  Statistic,
  Timeline,
  Empty,
  Tooltip,
  Drawer,
  Segmented,
  Upload,
  FloatButton,
  theme
} from 'antd';
import {
  QuestionCircleOutlined,
  MailOutlined,
  BugOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  UserOutlined,
  SearchOutlined,
  MessageOutlined,
  FileTextOutlined,
  FilterOutlined,
  SolutionOutlined,
  BellOutlined,
  CustomerServiceOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  ApiOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  LockOutlined,
  MobileOutlined,
  GlobalOutlined,
  PlusOutlined,
  PaperClipOutlined,
  SmileOutlined,
  EyeOutlined,
  ReloadOutlined,
  PhoneOutlined,
  LikeOutlined,
  DislikeOutlined,
  BookOutlined,
  FireOutlined,
  ProjectOutlined,
  TeamOutlined,
  FieldTimeOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  MinusCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useSettings } from '../store/settingsStore';
import 'dayjs/locale/ko';

dayjs.extend(relativeTime);
dayjs.locale('ko');

const { Title, Text, Paragraph } = Typography;

const { TextArea } = Input;

// Types
interface Ticket {
  id: string;
  type: 'bug' | 'feature' | 'account' | 'billing' | 'other';
  title: string;
  content: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  assignee?: string;
  messages: TicketMessage[];
}

interface TicketMessage {
  id: string;
  sender: 'user' | 'support';
  content: string;
  timestamp: string;
  attachments?: string[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'agent';
  content: string;
  timestamp: string;
  type?: 'text' | 'quick_reply' | 'typing';
  quickReplies?: string[];
}

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance';
  latency?: number;
  uptime: number;
  icon: React.ReactNode;
  lastIncident?: string;
}

interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  views: number;
  helpful: number;
  tags: string[];
  updatedAt: string;
}

// Mock Data
const mockTickets: Ticket[] = [
  {
    id: 'TKT-2024-001',
    type: 'bug',
    title: '프로젝트 생성 시 오류 발생',
    content: '새 프로젝트를 생성하려고 하면 "서버 오류"라는 메시지가 나타납니다.',
    status: 'in_progress',
    priority: 'high',
    createdAt: '2024-01-15T09:30:00',
    updatedAt: '2024-01-15T14:20:00',
    assignee: '김지원',
    messages: [
      { id: '1', sender: 'user', content: '새 프로젝트를 생성하려고 하면 "서버 오류"라는 메시지가 나타납니다.', timestamp: '2024-01-15T09:30:00' },
      { id: '2', sender: 'support', content: '안녕하세요, 문의 감사합니다. 해당 오류에 대해 확인 중입니다. 브라우저와 OS 정보를 알려주시겠어요?', timestamp: '2024-01-15T10:15:00' },
      { id: '3', sender: 'user', content: 'Chrome 120, Windows 11 사용 중입니다.', timestamp: '2024-01-15T10:30:00' },
      { id: '4', sender: 'support', content: '확인했습니다. 현재 특정 조건에서 발생하는 이슈를 파악했으며, 수정 중입니다. 오늘 중으로 해결될 예정입니다.', timestamp: '2024-01-15T14:20:00' },
    ]
  },
  {
    id: 'TKT-2024-002',
    type: 'feature',
    title: '다크 모드에서 간트 차트 색상 개선 요청',
    content: '다크 모드에서 간트 차트의 색상이 너무 어두워서 구분이 어렵습니다.',
    status: 'open',
    priority: 'medium',
    createdAt: '2024-01-14T16:45:00',
    updatedAt: '2024-01-14T16:45:00',
    messages: [
      { id: '1', sender: 'user', content: '다크 모드에서 간트 차트의 색상이 너무 어두워서 구분이 어렵습니다.', timestamp: '2024-01-14T16:45:00' },
    ]
  },
  {
    id: 'TKT-2024-003',
    type: 'billing',
    title: '결제 영수증 재발급 요청',
    content: '2023년 12월 결제 영수증이 필요합니다.',
    status: 'resolved',
    priority: 'low',
    createdAt: '2024-01-10T11:00:00',
    updatedAt: '2024-01-10T15:30:00',
    assignee: '박민수',
    messages: [
      { id: '1', sender: 'user', content: '2023년 12월 결제 영수증이 필요합니다.', timestamp: '2024-01-10T11:00:00' },
      { id: '2', sender: 'support', content: '요청하신 영수증을 이메일로 발송해드렸습니다. 확인 부탁드립니다.', timestamp: '2024-01-10T15:30:00' },
    ]
  },
];

const serviceStatuses: ServiceStatus[] = [
  { name: 'API 서버', status: 'operational', latency: 45, uptime: 99.99, icon: <ApiOutlined /> },
  { name: '웹 애플리케이션', status: 'operational', latency: 120, uptime: 99.95, icon: <GlobalOutlined /> },
  { name: '데이터베이스', status: 'operational', latency: 12, uptime: 99.99, icon: <DatabaseOutlined /> },
  { name: '파일 스토리지', status: 'operational', latency: 85, uptime: 99.90, icon: <CloudServerOutlined /> },
  { name: '인증 서비스', status: 'operational', latency: 30, uptime: 99.99, icon: <LockOutlined /> },
  { name: '모바일 앱', status: 'operational', latency: 150, uptime: 99.85, icon: <MobileOutlined /> },
  { name: '실시간 알림', status: 'degraded', latency: 350, uptime: 98.50, icon: <BellOutlined />, lastIncident: '일부 지연 발생 중 (모니터링 중)' },
  { name: '검색 엔진', status: 'operational', latency: 65, uptime: 99.92, icon: <SearchOutlined /> },
];

const knowledgeBase: KnowledgeArticle[] = [
  { id: '1', title: '프로젝트 시작하기 가이드', category: '시작하기', content: '새로운 프로젝트를 만들고 팀원을 초대하는 방법을 알아보세요.', views: 1520, helpful: 145, tags: ['프로젝트', '초보자', '가이드'], updatedAt: '2024-01-10' },
  { id: '2', title: '작업 관리 및 할당 방법', category: '작업관리', content: '효율적인 작업 관리와 팀원 할당 방법을 설명합니다.', views: 980, helpful: 89, tags: ['작업', '할당', '팀'], updatedAt: '2024-01-08' },
  { id: '3', title: '간트 차트 사용법', category: '타임라인', content: '간트 차트로 프로젝트 일정을 시각화하는 방법입니다.', views: 756, helpful: 67, tags: ['간트', '일정', '시각화'], updatedAt: '2024-01-05' },
  { id: '4', title: '2단계 인증 설정 방법', category: '보안', content: '계정 보안을 강화하는 2단계 인증 설정 가이드입니다.', views: 432, helpful: 41, tags: ['보안', '2FA', '인증'], updatedAt: '2024-01-03' },
  { id: '5', title: '팀원 권한 관리', category: '팀관리', content: '팀원별 권한을 설정하고 관리하는 방법을 알아보세요.', views: 654, helpful: 58, tags: ['권한', '팀', '관리자'], updatedAt: '2024-01-01' },
  { id: '6', title: '보고서 생성 및 내보내기', category: '보고서', content: '프로젝트 보고서를 생성하고 PDF로 내보내는 방법입니다.', views: 521, helpful: 47, tags: ['보고서', 'PDF', '내보내기'], updatedAt: '2023-12-28' },
  { id: '7', title: '알림 설정 커스터마이징', category: '설정', content: '원하는 알림만 받도록 설정을 조정하는 방법입니다.', views: 389, helpful: 35, tags: ['알림', '설정', '이메일'], updatedAt: '2023-12-25' },
  { id: '8', title: 'API 연동 가이드', category: '개발자', content: 'ProjectHub API를 활용한 외부 시스템 연동 방법입니다.', views: 287, helpful: 32, tags: ['API', '연동', '개발'], updatedAt: '2023-12-20' },
];

const announcements = [
  { id: '1', type: 'update', title: 'v2.5.0 업데이트 안내', content: '새로운 대시보드 위젯과 성능 개선이 포함되었습니다.', date: '2024-01-15', important: true },
  { id: '2', type: 'maintenance', title: '정기 점검 안내', content: '1월 20일 02:00-04:00 서버 점검이 예정되어 있습니다.', date: '2024-01-12', important: true },
  { id: '3', type: 'feature', title: '새로운 기능: AI 작업 추천', content: '인공지능 기반 작업 우선순위 추천 기능이 추가되었습니다.', date: '2024-01-10', important: false },
  { id: '4', type: 'notice', title: '요금제 개편 안내', content: '2월부터 새로운 요금 체계가 적용됩니다. 기존 사용자는 영향 없습니다.', date: '2024-01-08', important: false },
];

const faqData = [
  {
    category: '계정 및 보안',
    icon: <LockOutlined />,
    color: '#722ed1',
    items: [
      { q: '비밀번호를 분실했습니다. 어떻게 재설정하나요?', a: '로그인 화면의 "비밀번호 찾기" 링크를 클릭하여 이메일 인증을 통해 비밀번호를 재설정할 수 있습니다. 등록된 이메일로 재설정 링크가 발송되며, 24시간 동안 유효합니다.' },
      { q: '2단계 인증을 설정하고 싶습니다.', a: '설정 > 계정 보안 메뉴에서 2단계 인증(OTP)을 활성화할 수 있습니다. Google Authenticator 또는 Microsoft Authenticator 앱을 사용하실 수 있습니다.' },
      { q: '계정을 삭제하고 싶습니다.', a: '설정 > 계정 관리에서 "계정 삭제" 버튼을 클릭하세요. 삭제 전 모든 데이터를 백업하시기 바랍니다. 삭제된 계정은 복구할 수 없습니다.' },
    ]
  },
  {
    category: '프로젝트 관리',
    icon: <ProjectOutlined />,
    color: '#1890ff',
    items: [
      { q: '프로젝트를 삭제하면 복구할 수 있나요?', a: '프로젝트 삭제 후 30일 이내에는 휴지통에서 복구가 가능합니다. 설정 > 휴지통 메뉴에서 삭제된 프로젝트를 확인하실 수 있습니다.' },
      { q: '팀원을 프로젝트에 어떻게 초대하나요?', a: '프로젝트 설정 > 멤버 관리 탭에서 이메일 주소로 팀원을 초대할 수 있습니다. 초대된 팀원은 이메일로 초대 링크를 받게 됩니다.' },
      { q: '프로젝트 템플릿을 만들 수 있나요?', a: '네, 기존 프로젝트를 템플릿으로 저장하거나 새 템플릿을 만들 수 있습니다. 프로젝트 설정에서 "템플릿으로 저장" 옵션을 선택하세요.' },
    ]
  },
  {
    category: '결제 및 요금',
    icon: <SafetyCertificateOutlined />,
    color: '#52c41a',
    items: [
      { q: '요금제를 변경하고 싶습니다.', a: '관리자 페이지의 "구독 관리" 메뉴에서 언제든지 요금제를 업그레이드하거나 다운그레이드할 수 있습니다. 변경은 다음 결제일부터 적용됩니다.' },
      { q: '영수증은 어디서 출력하나요?', a: '결제 내역 페이지에서 각 결제 건에 대한 영수증을 PDF로 다운로드할 수 있습니다. 세금계산서 발행도 가능합니다.' },
      { q: '환불 정책은 어떻게 되나요?', a: '결제일로부터 7일 이내에 환불 요청 시 전액 환불이 가능합니다. 이후에는 잔여 기간에 대한 비례 환불이 적용됩니다.' },
    ]
  },
  {
    category: '기능 및 사용법',
    icon: <BulbOutlined />,
    color: '#fa8c16',
    items: [
      { q: '오프라인에서도 사용할 수 있나요?', a: '제한적으로 가능합니다. 오프라인 모드에서는 이전에 로드된 데이터를 조회할 수 있으며, 변경사항은 온라인 복귀 시 동기화됩니다.' },
      { q: '모바일 앱이 있나요?', a: '네, iOS와 Android용 앱을 제공합니다. 각 앱 스토어에서 "ProjectHub"를 검색하여 다운로드하실 수 있습니다.' },
      { q: 'API를 사용하여 외부 시스템과 연동할 수 있나요?', a: '프로 플랜 이상에서 REST API를 제공합니다. 개발자 문서에서 자세한 API 사용법을 확인하실 수 있습니다.' },
    ]
  }
];

const Support: React.FC = () => {
  const { token } = theme.useToken();
  const { effectiveTheme } = useSettings();
  const isDark = effectiveTheme === 'dark';
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketDrawerOpen, setTicketDrawerOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'bot', content: '안녕하세요! ProjectHub 고객지원 챗봇입니다. 무엇을 도와드릴까요?', timestamp: new Date().toISOString(), type: 'text' },
    { id: '2', sender: 'bot', content: '', timestamp: new Date().toISOString(), type: 'quick_reply', quickReplies: ['자주 묻는 질문', '문의하기', '상담원 연결'] }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [ticketFilter, setTicketFilter] = useState<string>('all');
  const [articleModal, setArticleModal] = useState<KnowledgeArticle | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Stats
  const stats = {
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length,
    avgResponseTime: '2.5시간',
    satisfactionRate: 94.5,
  };

  // Handlers
  const handleInquirySubmit = async (values: any) => {
    setLoading(true);
    setTimeout(() => {
      const newTicket: Ticket = {
        id: `TKT-2024-${String(tickets.length + 1).padStart(3, '0')}`,
        type: values.type,
        title: values.title,
        content: values.content,
        status: 'open',
        priority: values.priority || 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          { id: '1', sender: 'user', content: values.content, timestamp: new Date().toISOString() }
        ]
      };
      setTickets([newTicket, ...tickets]);
      setLoading(false);
      message.success('문의가 성공적으로 접수되었습니다.');
      form.resetFields();
      setActiveTab('tickets');
    }, 1000);
  };

  const handleChatSend = () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: chatInput,
      timestamp: new Date().toISOString(),
      type: 'text'
    };
    setChatMessages([...chatMessages, userMessage]);
    setChatInput('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        content: getBotResponse(chatInput),
        timestamp: new Date().toISOString(),
        type: 'text'
      };
      setChatMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const getBotResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('비밀번호') || lowerInput.includes('로그인')) {
      return '비밀번호 관련 문의시네요. 로그인 화면의 "비밀번호 찾기"를 클릭하시면 이메일로 재설정 링크를 받으실 수 있습니다. 추가 도움이 필요하시면 "상담원 연결"을 입력해주세요.';
    }
    if (lowerInput.includes('결제') || lowerInput.includes('환불') || lowerInput.includes('요금')) {
      return '결제 관련 문의는 민감한 사항이므로 상담원 연결을 권장드립니다. "상담원 연결"을 입력하시면 담당자와 연결해드리겠습니다.';
    }
    if (lowerInput.includes('상담원')) {
      return '상담원 연결을 요청하셨습니다. 현재 평균 대기 시간은 약 5분입니다. 잠시만 기다려주세요...';
    }
    return '문의해주신 내용을 확인했습니다. 더 정확한 답변을 위해 "문의하기" 탭에서 상세 내용을 남겨주시거나, 상담원 연결을 요청해주세요.';
  };

  const handleQuickReply = (reply: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: reply,
      timestamp: new Date().toISOString(),
      type: 'text'
    };
    setChatMessages([...chatMessages, userMessage]);

    setTimeout(() => {
      let response = '';
      if (reply === '자주 묻는 질문') {
        response = '자주 묻는 질문 카테고리입니다:\n\n1. 계정 및 보안\n2. 프로젝트 관리\n3. 결제 및 요금\n4. 기능 및 사용법\n\n원하시는 카테고리 번호를 입력해주세요.';
      } else if (reply === '문의하기') {
        response = '문의하기 탭으로 이동하시면 상세한 문의를 남기실 수 있습니다. 문의 접수 후 평균 2시간 이내에 답변드리고 있습니다.';
      } else if (reply === '상담원 연결') {
        response = '상담원 연결을 요청하셨습니다. 운영 시간: 평일 09:00-18:00\n현재 대기 인원: 2명 (예상 대기 시간: 약 5분)';
      }

      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        content: response,
        timestamp: new Date().toISOString(),
        type: 'text'
      };
      setChatMessages(prev => [...prev, botResponse]);
    }, 500);
  };

  const getStatusConfig = (status: ServiceStatus['status']) => {
    const configs = {
      operational: { color: '#52c41a', text: '정상', icon: <CheckCircleOutlined /> },
      degraded: { color: '#faad14', text: '성능저하', icon: <ExclamationCircleOutlined /> },
      partial_outage: { color: '#fa8c16', text: '부분장애', icon: <MinusCircleOutlined /> },
      major_outage: { color: '#f5222d', text: '장애', icon: <CloseOutlined /> },
      maintenance: { color: '#1890ff', text: '점검중', icon: <SyncOutlined spin /> },
    };
    return configs[status];
  };

  const getTicketStatusConfig = (status: Ticket['status']) => {
    const configs = {
      open: { color: 'blue', text: '접수됨' },
      in_progress: { color: 'orange', text: '처리중' },
      resolved: { color: 'green', text: '해결됨' },
      closed: { color: 'default', text: '종료' },
    };
    return configs[status];
  };

  const getPriorityConfig = (priority: Ticket['priority']) => {
    const configs = {
      low: { color: 'default', text: '낮음' },
      medium: { color: 'blue', text: '보통' },
      high: { color: 'orange', text: '높음' },
      urgent: { color: 'red', text: '긴급' },
    };
    return configs[priority];
  };

  const getTypeConfig = (type: Ticket['type']) => {
    const configs = {
      bug: { icon: <BugOutlined />, text: '버그', color: '#f5222d' },
      feature: { icon: <BulbOutlined />, text: '기능요청', color: '#722ed1' },
      account: { icon: <UserOutlined />, text: '계정', color: '#1890ff' },
      billing: { icon: <SafetyCertificateOutlined />, text: '결제', color: '#52c41a' },
      other: { icon: <InfoCircleOutlined />, text: '기타', color: '#8c8c8c' },
    };
    return configs[type];
  };

  const filteredTickets = tickets.filter(t => {
    if (ticketFilter === 'all') return true;
    return t.status === ticketFilter;
  });

  const filteredArticles = knowledgeBase.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Render Components
  const renderDashboard = () => (
    <div>
      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card hoverable style={{ borderRadius: 12, textAlign: 'center', boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)', border: isDark ? '1px solid #303030' : '1px solid #e0e0e0', background: isDark ? '#1f1f1f' : '#ffffff' }}>
            <Statistic
              title="전체 문의"
              value={stats.totalTickets}
              prefix={<FileTextOutlined style={{ color: token.colorPrimary }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable style={{ borderRadius: 12, textAlign: 'center', boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)', border: isDark ? '1px solid #303030' : '1px solid #e0e0e0', background: isDark ? '#1f1f1f' : '#ffffff' }}>
            <Statistic
              title="처리 중"
              value={stats.openTickets}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable style={{ borderRadius: 12, textAlign: 'center', boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)', border: isDark ? '1px solid #303030' : '1px solid #e0e0e0', background: isDark ? '#1f1f1f' : '#ffffff' }}>
            <Statistic
              title="평균 응답"
              value={stats.avgResponseTime}
              prefix={<FieldTimeOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable style={{ borderRadius: 12, textAlign: 'center', boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)', border: isDark ? '1px solid #303030' : '1px solid #e0e0e0', background: isDark ? '#1f1f1f' : '#ffffff' }}>
            <Statistic
              title="만족도"
              value={stats.satisfactionRate}
              suffix="%"
              prefix={<SmileOutlined style={{ color: '#eb2f96' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* Announcements */}
        <Col xs={24} lg={12}>
          <Card
            title={<Space><BellOutlined /> 공지사항</Space>}
            extra={<Button type="link" size="small">전체보기</Button>}
            style={{ borderRadius: 12, height: '100%', boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)', border: isDark ? '1px solid #303030' : '1px solid #e0e0e0', background: isDark ? '#1f1f1f' : '#ffffff' }}
          >
            <List
              itemLayout="horizontal"
              dataSource={announcements}
              renderItem={item => (
                <List.Item style={{ padding: '12px 0' }}>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{
                          background: item.type === 'update' ? '#1890ff' :
                            item.type === 'maintenance' ? '#faad14' :
                              item.type === 'feature' ? '#52c41a' : '#8c8c8c'
                        }}
                        icon={
                          item.type === 'update' ? <RocketOutlined /> :
                            item.type === 'maintenance' ? <ClockCircleOutlined /> :
                              item.type === 'feature' ? <ThunderboltOutlined /> : <InfoCircleOutlined />
                        }
                      />
                    }
                    title={
                      <Space>
                        <Text strong>{item.title}</Text>
                        {item.important && <Tag color="red">중요</Tag>}
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary" style={{ fontSize: 13 }}>{item.content}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{item.date}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* System Status */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <CloudServerOutlined />
                시스템 상태
                <Tag color="success">모든 시스템 정상</Tag>
              </Space>
            }
            extra={<Button type="link" size="small" icon={<ReloadOutlined />}>새로고침</Button>}
            style={{ borderRadius: 12, height: '100%', boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)', border: isDark ? '1px solid #303030' : '1px solid #e0e0e0', background: isDark ? '#1f1f1f' : '#ffffff' }}
          >
            <Row gutter={[12, 12]}>
              {serviceStatuses.map((service, idx) => {
                const config = getStatusConfig(service.status);
                return (
                  <Col xs={12} key={idx}>
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: 8,
                        background: token.colorBgLayout,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Space>
                        <span style={{ fontSize: 18, color: token.colorTextSecondary }}>{service.icon}</span>
                        <div>
                          <Text style={{ fontSize: 13 }}>{service.name}</Text>
                          {service.latency && (
                            <div>
                              <Text type="secondary" style={{ fontSize: 11 }}>{service.latency}ms</Text>
                            </div>
                          )}
                        </div>
                      </Space>
                      <Tooltip title={service.lastIncident || `가동률: ${service.uptime}%`}>
                        <Tag color={config.color} icon={config.icon} style={{ margin: 0 }}>
                          {config.text}
                        </Tag>
                      </Tooltip>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </Card>
        </Col>
      </Row>


    </div>
  );

  const renderFAQ = () => (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Input
          size="large"
          placeholder="질문을 검색하세요..."
          prefix={<SearchOutlined />}
          style={{ maxWidth: 500, borderRadius: 8 }}
        />
      </div>

      <Row gutter={[24, 24]}>
        {faqData.map((section, idx) => (
          <Col xs={24} lg={12} key={idx}>
            <Card
              title={
                <Space>
                  <Avatar style={{ background: section.color }} icon={section.icon} />
                  <Text strong style={{ fontSize: 16 }}>{section.category}</Text>
                </Space>
              }
              style={{ height: '100%', borderRadius: 12, boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)', border: isDark ? '1px solid #303030' : '1px solid #e0e0e0', background: isDark ? '#1f1f1f' : '#ffffff' }}
            >
              <Collapse
                ghost
                expandIconPosition="end"
                items={section.items.map((item, i) => ({
                  key: i.toString(),
                  label: <Text style={{ fontSize: 14 }}>{item.q}</Text>,
                  children: (
                    <div>
                      <Paragraph style={{ color: token.colorTextSecondary, marginBottom: 12 }}>
                        {item.a}
                      </Paragraph>
                      <Space>
                        <Button type="text" size="small" icon={<LikeOutlined />}>도움됨</Button>
                        <Button type="text" size="small" icon={<DislikeOutlined />}>아니요</Button>
                      </Space>
                    </div>
                  ),
                }))}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Alert
        message="찾으시는 질문이 없나요?"
        description="문의하기를 통해 직접 문의를 남겨주시면 신속하게 답변해 드리겠습니다."
        type="info"
        showIcon
        action={
          <Button type="primary" onClick={() => setActiveTab('contact')}>
            문의하기
          </Button>
        }
        style={{ marginTop: 24, borderRadius: 8 }}
      />
    </div>
  );

  const renderKnowledge = () => (
    <div>
      <Card style={{ marginBottom: 24, borderRadius: 12, boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)', border: isDark ? '1px solid #303030' : '1px solid #e0e0e0', background: isDark ? '#1f1f1f' : '#ffffff' }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Input
              size="large"
              placeholder="도움말 검색..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ borderRadius: 8 }}
            />
          </Col>
          <Col>
            <Space>
              <Button icon={<FilterOutlined />}>필터</Button>
            </Space>
          </Col>
        </Row>

        <div style={{ marginTop: 16 }}>
          <Space wrap>
            {['전체', '시작하기', '작업관리', '타임라인', '보안', '팀관리', '보고서', '설정', '개발자'].map(cat => (
              <Tag.CheckableTag key={cat} checked={false} style={{ padding: '4px 12px', borderRadius: 16 }}>
                {cat}
              </Tag.CheckableTag>
            ))}
          </Space>
        </div>
      </Card>

      {/* Popular Articles */}
      <Card
        title={<Space><FireOutlined style={{ color: '#fa541c' }} /> 인기 문서</Space>}
        style={{ marginBottom: 24, borderRadius: 12, boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)', border: isDark ? '1px solid #303030' : '1px solid #e0e0e0', background: isDark ? '#1f1f1f' : '#ffffff' }}
      >
        <Row gutter={[16, 16]}>
          {knowledgeBase.slice(0, 4).map((article, idx) => (
            <Col xs={24} sm={12} md={6} key={idx}>
              <Card
                hoverable
                size="small"
                style={{ borderRadius: 8, height: '100%', boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)', border: isDark ? '1px solid #303030' : '1px solid #e0e0e0', background: isDark ? '#1f1f1f' : '#ffffff' }}
                onClick={() => setArticleModal(article)}
              >
                <Tag color="blue" style={{ marginBottom: 8 }}>{article.category}</Tag>
                <Title level={5} style={{ marginBottom: 8, fontSize: 14 }}>{article.title}</Title>
                <Space size="small">
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <EyeOutlined /> {article.views}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <LikeOutlined /> {article.helpful}
                  </Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* All Articles */}
      <Card title="전체 문서" style={{ borderRadius: 12 }}>
        <List
          itemLayout="horizontal"
          dataSource={filteredArticles}
          renderItem={article => (
            <List.Item
              actions={[
                <Button type="link" onClick={() => setArticleModal(article)}>읽기</Button>
              ]}
              style={{ cursor: 'pointer' }}
            >
              <List.Item.Meta
                avatar={<Avatar style={{ background: token.colorPrimary }}><BookOutlined /></Avatar>}
                title={
                  <Space>
                    <Text strong>{article.title}</Text>
                    <Tag>{article.category}</Tag>
                  </Space>
                }
                description={
                  <Space>
                    <Text type="secondary"><EyeOutlined /> {article.views}</Text>
                    <Text type="secondary"><LikeOutlined /> {article.helpful}</Text>
                    <Text type="secondary">업데이트: {article.updatedAt}</Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );

  const renderTickets = () => (
    <div>
      <Card style={{ marginBottom: 24, borderRadius: 12, boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)', border: isDark ? '1px solid #303030' : '1px solid #e0e0e0', background: isDark ? '#1f1f1f' : '#ffffff' }}>
        <Row gutter={16} align="middle" justify="space-between">
          <Col>
            <Segmented
              value={ticketFilter}
              onChange={v => setTicketFilter(v as string)}
              options={[
                { label: '전체', value: 'all' },
                { label: '접수됨', value: 'open' },
                { label: '처리중', value: 'in_progress' },
                { label: '해결됨', value: 'resolved' },
                { label: '종료', value: 'closed' },
              ]}
            />
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setActiveTab('contact')}>
              새 문의
            </Button>
          </Col>
        </Row>
      </Card>

      {filteredTickets.length === 0 ? (
        <Card style={{ borderRadius: 12, boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)', border: isDark ? '1px solid #303030' : '1px solid #e0e0e0', background: isDark ? '#1f1f1f' : '#ffffff' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="문의 내역이 없습니다"
          >
            <Button type="primary" onClick={() => setActiveTab('contact')}>
              첫 문의하기
            </Button>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {filteredTickets.map(ticket => {
            const statusConfig = getTicketStatusConfig(ticket.status);
            const typeConfig = getTypeConfig(ticket.type);
            const priorityConfig = getPriorityConfig(ticket.priority);

            return (
              <Col xs={24} lg={12} key={ticket.id}>
                <Card
                  hoverable
                  style={{ borderRadius: 12, boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)', border: isDark ? '1px solid #303030' : '1px solid #e0e0e0', background: isDark ? '#1f1f1f' : '#ffffff' }}
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setTicketDrawerOpen(true);
                  }}
                >
                  <Row justify="space-between" align="top">
                    <Col>
                      <Space direction="vertical" size={4}>
                        <Space>
                          <Text type="secondary" style={{ fontSize: 12 }}>{ticket.id}</Text>
                          <Tag color={priorityConfig.color}>{priorityConfig.text}</Tag>
                        </Space>
                        <Title level={5} style={{ margin: 0 }}>{ticket.title}</Title>
                      </Space>
                    </Col>
                    <Col>
                      <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
                    </Col>
                  </Row>

                  <Divider style={{ margin: '12px 0' }} />

                  <Row justify="space-between" align="middle">
                    <Col>
                      <Space>
                        <Tag icon={typeConfig.icon} style={{ color: typeConfig.color, borderColor: typeConfig.color, background: `${typeConfig.color}10` }}>
                          {typeConfig.text}
                        </Tag>
                        {ticket.assignee && (
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            담당: {ticket.assignee}
                          </Text>
                        )}
                      </Space>
                    </Col>
                    <Col>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(ticket.updatedAt).fromNow()}
                      </Text>
                    </Col>
                  </Row>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );

  const renderContact = () => (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={16}>
        <Card style={{ borderRadius: 12 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={3}>문의 접수</Title>
            <Text type="secondary">버그 제보, 기능 요청, 기타 문의사항을 남겨주세요.</Text>
          </div>

          <Form form={form} layout="vertical" onFinish={handleInquirySubmit}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="type"
                  label="문의 유형"
                  rules={[{ required: true, message: '유형을 선택해주세요' }]}
                >
                  <Select placeholder="선택" size="large">
                    <Select.Option value="bug"><Space><BugOutlined /> 버그 신고</Space></Select.Option>
                    <Select.Option value="feature"><Space><BulbOutlined /> 기능 요청</Space></Select.Option>
                    <Select.Option value="account"><Space><UserOutlined /> 계정 관련</Space></Select.Option>
                    <Select.Option value="billing"><Space><SafetyCertificateOutlined /> 결제 문의</Space></Select.Option>
                    <Select.Option value="other"><Space><InfoCircleOutlined /> 기타</Space></Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="priority" label="우선순위" initialValue="medium">
                  <Select size="large">
                    <Select.Option value="low">낮음</Select.Option>
                    <Select.Option value="medium">보통</Select.Option>
                    <Select.Option value="high">높음</Select.Option>
                    <Select.Option value="urgent">긴급</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="title"
              label="제목"
              rules={[{ required: true, message: '제목을 입력해주세요' }]}
            >
              <Input placeholder="문의 제목" size="large" />
            </Form.Item>

            <Form.Item
              name="content"
              label="내용"
              rules={[{ required: true, message: '내용을 입력해주세요' }]}
            >
              <TextArea rows={6} placeholder="상세 내용을 입력해주세요" showCount maxLength={2000} />
            </Form.Item>

            <Form.Item name="attachments" label="첨부파일">
              <Upload.Dragger>
                <p className="ant-upload-drag-icon"><PaperClipOutlined /></p>
                <p className="ant-upload-text">파일을 드래그하거나 클릭하여 업로드</p>
                <p className="ant-upload-hint">최대 10MB, 이미지 및 문서 파일</p>
              </Upload.Dragger>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" size="large" block loading={loading} icon={<SendOutlined />}>
                문의 접수
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>

      <Col xs={24} lg={8}>
        <Card title="연락처 정보" style={{ borderRadius: 12, marginBottom: 16, boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)', border: isDark ? '1px solid #303030' : '1px solid #e0e0e0', background: isDark ? '#1f1f1f' : '#ffffff' }}>
          <List
            itemLayout="horizontal"
            dataSource={[
              { icon: <MailOutlined />, title: '이메일', desc: 'support@projecthub.com', color: '#1890ff' },
              { icon: <PhoneOutlined />, title: '전화', desc: '02-1234-5678', color: '#52c41a' },
              { icon: <MessageOutlined />, title: '실시간 채팅', desc: '평일 09:00-18:00', color: '#722ed1' },
            ]}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar style={{ background: item.color }} icon={item.icon} />}
                  title={item.title}
                  description={item.desc}
                />
              </List.Item>
            )}
          />
        </Card>

        <Card title="처리 절차" style={{ borderRadius: 12 }}>
          <Steps
            direction="vertical"
            size="small"
            current={-1}
            items={[
              { title: '문의 접수', description: '시스템에 등록', icon: <SendOutlined /> },
              { title: '담당자 배정', description: '24시간 이내', icon: <TeamOutlined /> },
              { title: '답변 처리', description: '문제 해결', icon: <SolutionOutlined /> },
              { title: '완료', description: '이메일 발송', icon: <CheckCircleOutlined /> },
            ]}
          />
        </Card>
      </Col>
    </Row>
  );

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="large"
        items={[
          { key: 'dashboard', label: <Space><CustomerServiceOutlined />지원 센터</Space>, children: renderDashboard() },
          { key: 'faq', label: <Space><QuestionCircleOutlined />FAQ</Space>, children: renderFAQ() },
          { key: 'knowledge', label: <Space><BookOutlined />지식 베이스</Space>, children: renderKnowledge() },
          { key: 'tickets', label: <Space><FileTextOutlined />내 문의<Badge count={stats.openTickets} size="small" /></Space>, children: renderTickets() },
          { key: 'contact', label: <Space><MailOutlined />문의하기</Space>, children: renderContact() },
        ]}
      />

      {/* Chat Widget */}
      <FloatButton
        icon={<MessageOutlined />}
        type="primary"
        style={{ right: 24, bottom: 24, width: 56, height: 56 }}
        onClick={() => setChatOpen(true)}
        badge={{ dot: true }}
      />

      {/* Chat Drawer */}
      <Drawer
        title={
          <Space>
            <Avatar style={{ background: token.colorPrimary }} icon={<CustomerServiceOutlined />} />
            <div>
              <Text strong>실시간 채팅</Text>
              <div><Badge status="success" text={<Text type="secondary" style={{ fontSize: 12 }}>온라인</Text>} /></div>
            </div>
          </Space>
        }
        placement="right"
        onClose={() => setChatOpen(false)}
        open={chatOpen}
        width={400}
        styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' } }}
      >
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {chatMessages.map(msg => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 12,
              }}
            >
              {msg.sender !== 'user' && (
                <Avatar
                  size="small"
                  icon={<CustomerServiceOutlined />}
                  style={{ marginRight: 8, background: token.colorPrimary }}
                />
              )}
              <div style={{ maxWidth: '75%' }}>
                {msg.type === 'quick_reply' && msg.quickReplies ? (
                  <Space direction="vertical" size={8}>
                    {msg.quickReplies.map((reply, idx) => (
                      <Button
                        key={idx}
                        size="small"
                        onClick={() => handleQuickReply(reply)}
                        style={{ borderRadius: 16 }}
                      >
                        {reply}
                      </Button>
                    ))}
                  </Space>
                ) : (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: msg.sender === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: msg.sender === 'user' ? token.colorPrimary : token.colorBgLayout,
                      color: msg.sender === 'user' ? 'white' : token.colorText,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {msg.content}
                  </div>
                )}
                <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
                  {dayjs(msg.timestamp).format('HH:mm')}
                </Text>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div style={{ padding: 16, borderTop: `1px solid ${token.colorBorder}` }}>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="메시지를 입력하세요..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onPressEnter={handleChatSend}
              suffix={<SmileOutlined style={{ color: token.colorTextSecondary }} />}
            />
            <Button type="primary" icon={<SendOutlined />} onClick={handleChatSend} />
          </Space.Compact>
        </div>
      </Drawer>

      {/* Ticket Detail Drawer */}
      <Drawer
        title={selectedTicket ? `${selectedTicket.id} - ${selectedTicket.title}` : ''}
        placement="right"
        width={600}
        onClose={() => setTicketDrawerOpen(false)}
        open={ticketDrawerOpen}
      >
        {selectedTicket && (
          <div>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Text type="secondary">상태</Text>
                <div><Tag color={getTicketStatusConfig(selectedTicket.status).color}>{getTicketStatusConfig(selectedTicket.status).text}</Tag></div>
              </Col>
              <Col span={8}>
                <Text type="secondary">우선순위</Text>
                <div><Tag color={getPriorityConfig(selectedTicket.priority).color}>{getPriorityConfig(selectedTicket.priority).text}</Tag></div>
              </Col>
              <Col span={8}>
                <Text type="secondary">유형</Text>
                <div><Tag>{getTypeConfig(selectedTicket.type).text}</Tag></div>
              </Col>
            </Row>

            <Divider>대화 내역</Divider>

            <Timeline
              items={selectedTicket.messages.map(msg => ({
                color: msg.sender === 'support' ? 'blue' : 'gray',
                children: (
                  <div>
                    <Text strong>{msg.sender === 'support' ? '상담원' : '나'}</Text>
                    <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                      {dayjs(msg.timestamp).format('YYYY-MM-DD HH:mm')}
                    </Text>
                    <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>{msg.content}</Paragraph>
                  </div>
                ),
              }))}
            />

            {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
              <div style={{ marginTop: 24 }}>
                <Form layout="vertical">
                  <Form.Item>
                    <TextArea rows={3} placeholder="추가 메시지를 입력하세요..." />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" icon={<SendOutlined />}>답글 보내기</Button>
                  </Form.Item>
                </Form>
              </div>
            )}
          </div>
        )}
      </Drawer>



      {/* Article Modal */}
      <Modal
        title={articleModal?.title}
        open={!!articleModal}
        onCancel={() => setArticleModal(null)}
        footer={
          <Space>
            <Button icon={<LikeOutlined />}>도움됨 ({articleModal?.helpful})</Button>
            <Button type="primary" onClick={() => setArticleModal(null)}>닫기</Button>
          </Space>
        }
        width={700}
      >
        {articleModal && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Tag color="blue">{articleModal.category}</Tag>
              <Text type="secondary"><EyeOutlined /> {articleModal.views}회 조회</Text>
              <Text type="secondary">업데이트: {articleModal.updatedAt}</Text>
            </Space>
            <Paragraph>{articleModal.content}</Paragraph>
            <Paragraph>
              이 문서에서는 {articleModal.title}에 대한 상세한 내용을 다룹니다.
              단계별 가이드와 함께 실제 예시를 통해 쉽게 따라할 수 있도록 구성되어 있습니다.
            </Paragraph>
            <Paragraph>
              추가적인 질문이 있으시면 FAQ를 확인하시거나 문의하기를 통해 연락주세요.
            </Paragraph>
            <Divider />
            <Space>
              {articleModal.tags.map(tag => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Support;
