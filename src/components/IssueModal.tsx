import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, Space, Row, Col, Divider, Badge, Typography, Avatar, Tag } from 'antd';
import {
  BugOutlined,
  BulbOutlined,
  RiseOutlined,
  QuestionCircleOutlined,
  CheckSquareOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  FireOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  IndustryType,
  IssueType,
  IssueStatus,
  IssuePriority,
  IssueSeverity,
  type Issue,
  getIssueTypeLabel,
  getIssueTypeColor,
  getIssueStatusLabel,
  getIssueStatusColor,
  getIssuePriorityLabel,
  getIssuePriorityColor,
  getIssueSeverityLabel,
  getIssueSeverityColor,
  useIssueStore,
} from '../store/issueStore';
import { useProjectStore } from '../store/projectStore';
import { useMemberStore } from '../store/memberStore';

const { TextArea } = Input;
const { Text } = Typography;

interface IssueModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: (values: any) => void;
  initialValues?: Partial<Issue> | null;
  title?: string;
  okText?: string;
}

const industryConfigs = {
  [IndustryType.SOFTWARE]: {
    environmentLabel: '환경',
    environmentPlaceholder: '예: Production, Windows 10, Chrome 120',
    stepsLabel: '재현 단계',
    stepsPlaceholder: '1. 로그인 페이지 접속\n2. 잘못된 비밀번호 입력\n3. 에러 메시지 미출력 확인',
    allowedTypes: [IssueType.BUG, IssueType.FEATURE, IssueType.IMPROVEMENT, IssueType.QUESTION, IssueType.TASK],
    showBugDetails: [IssueType.BUG] as IssueType[],
  },
  [IndustryType.MANUFACTURING]: {
    environmentLabel: '공정/설비',
    environmentPlaceholder: '예: A-1 라인, CNC 밀링기 #4',
    stepsLabel: '발생 상황 상세',
    stepsPlaceholder: '1. 야간 조업 중 발생\n2. 가공 속도 150% 설정 시 소음 발생\n3. 센서 값 임계치 초과 확인',
    allowedTypes: [IssueType.DEFECT, IssueType.EQUIPMENT, IssueType.SAFETY, IssueType.QUALITY, IssueType.TASK],
    showBugDetails: [IssueType.DEFECT, IssueType.EQUIPMENT] as IssueType[],
  },
  [IndustryType.SERVICE]: {
    environmentLabel: '채널/환경',
    environmentPlaceholder: '예: 카카오톡 상담, 콜센터 2번 노드',
    stepsLabel: '상세 정황',
    stepsPlaceholder: '1. 고객 인입 시각 확인\n2. 이전 상담 이력 조회 시 오류 발생\n3. 데이터베이스 타임아웃 발생 확인',
    allowedTypes: [IssueType.BUG, IssueType.IMPROVEMENT, IssueType.QUESTION, IssueType.TASK],
    showBugDetails: [IssueType.BUG] as IssueType[],
  },
  [IndustryType.GENERAL]: {
    environmentLabel: '부서/장소',
    environmentPlaceholder: '예: 영업 1팀, 서울 본사 4층 회의실',
    stepsLabel: '이슈 발생 경로',
    stepsPlaceholder: '1. 업무 협의 시 발생\n2. 문서 공유 시스템 접근 불가',
    allowedTypes: Object.values(IssueType),
    showBugDetails: [IssueType.BUG, IssueType.DEFECT] as IssueType[],
  },
};

const IssueModal: React.FC<IssueModalProps> = ({
  open,
  onCancel,
  onOk,
  initialValues,
  title = '새 이슈 등록',
  okText = '등록',
}) => {
  const [form] = Form.useForm();
  const { projects } = useProjectStore();
  const { members } = useMemberStore();
  const { labels, industry } = useIssueStore();
  const issueType = Form.useWatch('type', form);

  const config = industryConfigs[industry] || industryConfigs[IndustryType.SOFTWARE];

  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.setFieldsValue({
          ...initialValues,
          dueDate: initialValues.dueDate ? dayjs(initialValues.dueDate) : undefined,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          type: config.allowedTypes[0] as any,
          status: IssueStatus.OPEN,
          priority: IssuePriority.MEDIUM,
        });
      }
    }
  }, [open, initialValues, form, config.allowedTypes]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onOk({
        ...values,
        dueDate: values.dueDate ? values.dueDate.toDate() : undefined,
      });
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const typeOptions = config.allowedTypes.map(type => ({
    value: type,
    label: getIssueTypeLabel(type),
    icon: type === IssueType.BUG ? <BugOutlined /> :
      type === IssueType.FEATURE ? <BulbOutlined /> :
        type === IssueType.IMPROVEMENT ? <RiseOutlined /> :
          type === IssueType.QUESTION ? <QuestionCircleOutlined /> :
            type === IssueType.TASK ? <CheckSquareOutlined /> :
              type === IssueType.DEFECT ? <ExclamationCircleOutlined /> :
                type === IssueType.EQUIPMENT ? <SyncOutlined /> :
                  type === IssueType.SAFETY ? <FireOutlined /> : <CheckCircleOutlined />,
    color: getIssueTypeColor(type)
  }));

  const statusOptions = Object.values(IssueStatus).map((status) => ({
    value: status,
    label: getIssueStatusLabel(status),
    color: getIssueStatusColor(status),
    icon: <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: getIssueStatusColor(status) }} />
  }));

  const priorityOptions = Object.values(IssuePriority).map((p) => ({
    value: p,
    label: getIssuePriorityLabel(p),
    color: getIssuePriorityColor(p),
  }));

  return (
    <Modal
      title={<Space>{(config.allowedTypes as string[]).includes(IssueType.DEFECT) ? <ExclamationCircleOutlined style={{ color: '#f5222d' }} /> : <BugOutlined style={{ color: '#1890ff' }} />} {title}</Space>}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText={okText}
      cancelText="취소"
      width={720}
      centered
      destroyOnClose
      okButtonProps={{ style: { borderRadius: 6, padding: '0 24px' } }}
      cancelButtonProps={{ style: { borderRadius: 6 } }}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item name="title" label={<Text strong>이슈 제목</Text>} rules={[{ required: true, message: '제목을 입력해주세요' }]}>
              <Input placeholder="이슈를 한 눈에 파악할 수 있는 제목" style={{ borderRadius: 6 }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="type" label={<Text strong>이슈 타입</Text>} rules={[{ required: true }]}>
              <Select style={{ borderRadius: 6 }}>
                {typeOptions.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    <Space><span style={{ color: opt.color }}>{opt.icon}</span>{opt.label}</Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="projectId" label={<Text strong>프로젝트</Text>} rules={[{ required: true, message: '프로젝트를 선택해주세요' }]}>
              <Select placeholder="프로젝트 선택" style={{ borderRadius: 6 }}>
                {projects.map((project) => (
                  <Select.Option key={project.id} value={project.id}>{project.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="status" label={<Text strong>상태</Text>}>
              <Select style={{ borderRadius: 6 }}>
                {statusOptions.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    <Space>{opt.icon}{opt.label}</Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="priority" label={<Text strong>우선순위</Text>}>
              <Select style={{ borderRadius: 6 }}>
                {priorityOptions.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    <Tag color={opt.color} bordered={false} style={{ borderRadius: 4, margin: 0 }}>{opt.label}</Tag>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {config.showBugDetails.includes(issueType) && (
          <Row gutter={16} style={{ background: 'rgba(245, 34, 45, 0.02)', padding: '16px 8px', borderRadius: 8, marginBottom: 24, border: '1px solid rgba(245, 34, 45, 0.08)' }}>
            <Col span={8}>
              <Form.Item name="severity" label={<Text strong>심각도</Text>}>
                <Select placeholder="심각도 선택" style={{ borderRadius: 6 }}>
                  {Object.values(IssueSeverity).map((severity) => (
                    <Select.Option key={severity} value={severity}>
                      <Badge color={getIssueSeverityColor(severity)} text={getIssueSeverityLabel(severity)} />
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={industry === IndustryType.MANUFACTURING ? 8 : 16}>
              <Form.Item name="environment" label={<Text strong>{config.environmentLabel}</Text>}>
                <Input placeholder={config.environmentPlaceholder} style={{ borderRadius: 6 }} />
              </Form.Item>
            </Col>
            {industry === IndustryType.MANUFACTURING && (
              <Col span={8}>
                <Form.Item name={['metadata', 'lineId']} label={<Text strong>라인 ID</Text>}>
                  <Input placeholder="예: L-101" style={{ borderRadius: 6 }} />
                </Form.Item>
              </Col>
            )}
          </Row>
        )}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="assigneeId" label={<Text strong>담당자</Text>}>
              <Select placeholder="담당자 선택" allowClear style={{ borderRadius: 6 }}>
                {members.map((member) => (
                  <Select.Option key={member.id} value={member.id}>
                    <Space>
                      <Avatar size="small" style={{ backgroundColor: '#bae7ff', color: '#096dd9' }}>{member.name[0]}</Avatar>
                      {member.name} <Text type="secondary" style={{ fontSize: 12 }}>({member.role})</Text>
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="dueDate" label={<Text strong>마감일</Text>}>
              <DatePicker style={{ width: '100%', borderRadius: 6 }} placeholder="마감일 선택" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="labels" label={<Text strong>라벨</Text>}>
          <Select mode="multiple" placeholder="관련 라벨 선택" allowClear style={{ borderRadius: 6 }}>
            {labels.map((label) => (
              <Select.Option key={label.id} value={label.id}>
                <Space>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: label.color }} />
                  {label.name}
                </Space>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="description" label={<Text strong>상세 설명</Text>} rules={[{ required: true, message: '설명을 입력해주세요' }]}>
          <TextArea rows={4} placeholder="이슈의 배경, 발생 경로 등 상세 내용을 입력하세요" style={{ borderRadius: 6 }} />
        </Form.Item>

        {config.showBugDetails.includes(issueType) && (
          <div style={{ background: '#fafafa', padding: 16, borderRadius: 8, border: '1px solid #f0f0f0' }}>
            <Divider plain style={{ margin: '0 0 16px 0' }}><Text type="secondary" style={{ fontSize: 13 }}>{issueType === IssueType.BUG ? '버그 상세 리포트' : '결함 상세 내역'}</Text></Divider>
            <Form.Item name="stepsToReproduce" label={<Text strong style={{ fontSize: 13 }}>{config.stepsLabel}</Text>}>
              <TextArea rows={3} placeholder={config.stepsPlaceholder} style={{ borderRadius: 6 }} />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="expectedResult" label={<Text strong style={{ fontSize: 13 }}>기대 결과</Text>}>
                  <TextArea rows={2} placeholder="정상적인 동작 설명" style={{ borderRadius: 6 }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="actualResult" label={<Text strong style={{ fontSize: 13 }}>실제 결과</Text>}>
                  <TextArea rows={2} placeholder="현재 발생하는 오동작 설명" style={{ borderRadius: 6 }} />
                </Form.Item>
              </Col>
            </Row>
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default IssueModal;
