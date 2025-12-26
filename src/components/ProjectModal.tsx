import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, Row, Col } from 'antd';
import dayjs from 'dayjs';
import { ProjectStatus, ProjectPriority } from '../store/projectStore';
import { useMemberStore } from '../store/memberStore';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface ProjectModalProps {
    open: boolean;
    onOk: (values: any) => void;
    onCancel: () => void;
    initialValues?: any;
    title: string;
    okText?: string;
}

const ProjectModal: React.FC<ProjectModalProps> = ({
    open,
    onOk,
    onCancel,
    initialValues,
    title,
    okText = '확인',
}) => {
    const [form] = Form.useForm();
    const { members } = useMemberStore();

    useEffect(() => {
        if (open) {
            form.resetFields();
            if (initialValues) {
                form.setFieldsValue({
                    ...initialValues,
                    dateRange: initialValues.startDate && initialValues.endDate
                        ? [dayjs(initialValues.startDate), dayjs(initialValues.endDate)]
                        : undefined,
                    teamMembers: initialValues.teamMembers || [],
                });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            onOk(values);
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const statusLabels: Record<ProjectStatus, string> = {
        [ProjectStatus.PLANNING]: '계획',
        [ProjectStatus.IN_PROGRESS]: '진행중',
        [ProjectStatus.ON_HOLD]: '보류',
        [ProjectStatus.COMPLETED]: '완료',
        [ProjectStatus.CANCELLED]: '취소',
    };

    const priorityLabels: Record<ProjectPriority, string> = {
        [ProjectPriority.LOW]: '낮음',
        [ProjectPriority.MEDIUM]: '보통',
        [ProjectPriority.HIGH]: '높음',
        [ProjectPriority.URGENT]: '긴급',
    };

    return (
        <Modal
            title={title}
            open={open}
            onOk={handleOk}
            onCancel={onCancel}
            width={600}
            okText={okText}
            cancelText="취소"
        >
            <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
                <Form.Item
                    name="name"
                    label="프로젝트명"
                    rules={[{ required: true, message: '프로젝트명을 입력해주세요' }]}
                >
                    <Input placeholder="프로젝트명을 입력하세요" />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="설명"
                    rules={[{ required: true, message: '설명을 입력해주세요' }]}
                >
                    <TextArea rows={4} placeholder="프로젝트 설명을 입력하세요" />
                </Form.Item>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="status"
                            label="상태"
                            rules={[{ required: true, message: '상태를 선택해주세요' }]}
                        >
                            <Select placeholder="상태를 선택하세요">
                                {Object.entries(statusLabels).map(([key, label]) => (
                                    <Select.Option key={key} value={key}>
                                        {label}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="priority"
                            label="우선순위"
                            rules={[{ required: true, message: '우선순위를 선택해주세요' }]}
                        >
                            <Select placeholder="우선순위를 선택하세요">
                                {Object.entries(priorityLabels).map(([key, label]) => (
                                    <Select.Option key={key} value={key}>
                                        {label}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    name="teamMembers"
                    label="팀원 선택"
                    rules={[{ required: true, message: '최소 1명 이상의 팀원을 선택해주세요' }]}
                >
                    <Select
                        mode="multiple"
                        placeholder="팀원을 선택하세요"
                        optionFilterProp="children"
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label as string || '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={members.map(member => ({
                            label: `${member.name} (${member.email})`,
                            value: member.id,
                        }))}
                    />
                </Form.Item>

                <Form.Item
                    name="dateRange"
                    label="프로젝트 기간"
                    rules={[{ required: true, message: '프로젝트 기간을 선택해주세요' }]}
                >
                    <RangePicker style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                    name="budget"
                    label="예산 (원)"
                    rules={[{ required: true, message: '예산을 입력해주세요' }]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        placeholder="예산을 입력하세요"
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ProjectModal;
