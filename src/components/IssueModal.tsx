import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, Space, Row, Col, Divider } from 'antd';
import {
  BugOutlined,
  BulbOutlined,
  RiseOutlined,
  QuestionCircleOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  IssueType,
  IssueStatus,
  IssuePriority,
  IssueSeverity,
  type Issue,
  getIssueTypeLabel,
  getIssueTypeColor,
  getIssueStatusLabel,
  getIssuePriorityLabel,
  getIssueSeverityLabel,
  useIssueStore,
} from '../store/issueStore';
import { useProjectStore } from '../store/projectStore';
import { useMemberStore } from '../store/memberStore';

const { TextArea } = Input;

interface IssueModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: (values: any) => void;
  initialValues?: Partial<Issue> | null;
  title?: string;
  okText?: string;
}

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
  const { labels } = useIssueStore();
  const issueType = Form.useWatch('type', form);

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
          type: IssueType.BUG,
          status: IssueStatus.OPEN,
          priority: IssuePriority.MEDIUM,
        });
      }
    }
  }, [open, initialValues, form]);

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

  const typeOptions = [
    { value: IssueType.BUG, label: getIssueTypeLabel(IssueType.BUG), icon: <BugOutlined style={{ color: getIssueTypeColor(IssueType.BUG) }} /> },
    { value: IssueType.FEATURE, label: getIssueTypeLabel(IssueType.FEATURE), icon: <BulbOutlined style={{ color: getIssueTypeColor(IssueType.FEATURE) }} /> },
    { value: IssueType.IMPROVEMENT, label: getIssueTypeLabel(IssueType.IMPROVEMENT), icon: <RiseOutlined style={{ color: getIssueTypeColor(IssueType.IMPROVEMENT) }} /> },
    { value: IssueType.QUESTION, label: getIssueTypeLabel(IssueType.QUESTION), icon: <QuestionCircleOutlined style={{ color: getIssueTypeColor(IssueType.QUESTION) }} /> },
    { value: IssueType.TASK, label: getIssueTypeLabel(IssueType.TASK), icon: <CheckSquareOutlined style={{ color: getIssueTypeColor(IssueType.TASK) }} /> },
  ];

  return (
    <Modal
      title={title}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText={okText}
      cancelText="취소"
      width={720}
      centered
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item name="title" label="제목" rules={[{ required: true, message: '제목을 입력해주세요' }]}>
              <Input placeholder="이슈 제목" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="type" label="이슈 타입" rules={[{ required: true }]}>
              <Select>
                {typeOptions.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    <Space>{opt.icon}{opt.label}</Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="projectId" label="프로젝트" rules={[{ required: true, message: '프로젝트를 선택해주세요' }]}>
              <Select placeholder="프로젝트 선택">
                {projects.map((project) => (
                  <Select.Option key={project.id} value={project.id}>{project.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="status" label="상태">
              <Select>
                {Object.values(IssueStatus).map((status) => (
                  <Select.Option key={status} value={status}>{getIssueStatusLabel(status)}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="priority" label="우선순위">
              <Select>
                {Object.values(IssuePriority).map((priority) => (
                  <Select.Option key={priority} value={priority}>{getIssuePriorityLabel(priority)}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {issueType === IssueType.BUG && (
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="severity" label="심각도">
                <Select placeholder="심각도 선택">
                  {Object.values(IssueSeverity).map((severity) => (
                    <Select.Option key={severity} value={severity}>{getIssueSeverityLabel(severity)}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="environment" label="환경">
                <Input placeholder="예: Production, Staging, Windows 10, Chrome 120" />
              </Form.Item>
            </Col>
          </Row>
        )}

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="assigneeId" label="담당자">
              <Select placeholder="담당자 선택" allowClear>
                {members.map((member) => (
                  <Select.Option key={member.id} value={member.id}>{member.name} ({member.role})</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="dueDate" label="마감일">
              <DatePicker style={{ width: '100%' }} placeholder="마감일 선택" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="labels" label="라벨">
          <Select mode="multiple" placeholder="라벨 선택" allowClear>
            {labels.map((label) => (
              <Select.Option key={label.id} value={label.id}>
                <Space>
                  <div style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: label.color }} />
                  {label.name}
                </Space>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="description" label="설명" rules={[{ required: true, message: '설명을 입력해주세요' }]}>
          <TextArea rows={4} placeholder="이슈에 대한 상세 설명" />
        </Form.Item>

        {issueType === IssueType.BUG && (
          <>
            <Divider plain style={{ fontSize: 14 }}>버그 상세 정보</Divider>
            <Form.Item name="stepsToReproduce" label="재현 방법">
              <TextArea rows={3} placeholder={'1. 첫 번째 단계\n2. 두 번째 단계\n3. 세 번째 단계'} />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="expectedResult" label="기대 결과">
                  <TextArea rows={2} placeholder="예상되는 정상 동작" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="actualResult" label="실제 결과">
                  <TextArea rows={2} placeholder="실제로 발생한 동작" />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default IssueModal;
