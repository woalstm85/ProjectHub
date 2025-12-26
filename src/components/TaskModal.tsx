import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, Row, Col, Divider } from 'antd';
import { TaskStatus, TaskPriority } from '../store/taskStore';
import { useMemberStore } from '../store/memberStore';
import dayjs from 'dayjs';

const { TextArea } = Input;

interface TaskModalProps {
    open: boolean;
    onOk: (values: any) => void;
    onCancel: () => void;
    initialValues?: any;
    title: string;
    okText?: string;
}

const TaskModal: React.FC<TaskModalProps> = ({
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
                    startDate: initialValues.startDate ? dayjs(initialValues.startDate) : undefined,
                    dueDate: initialValues.dueDate ? dayjs(initialValues.dueDate) : undefined,
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

    const taskStatusLabels: Record<TaskStatus, string> = {
        [TaskStatus.TODO]: '할일',
        [TaskStatus.IN_PROGRESS]: '진행중',
        [TaskStatus.REVIEW]: '검토중',
        [TaskStatus.DONE]: '완료',
    };

    const taskPriorityLabels: Record<TaskPriority, string> = {
        [TaskPriority.LOW]: '낮음',
        [TaskPriority.MEDIUM]: '보통',
        [TaskPriority.HIGH]: '높음',
        [TaskPriority.URGENT]: '긴급',
    };

    return (
        <Modal
            title={title}
            open={open}
            onOk={handleOk}
            onCancel={onCancel}
            width={700}
            okText={okText}
            cancelText="취소"
            centered
        >
            <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
                <Row gutter={16}>
                    <Col span={24}>
                        <Form.Item
                            name="title"
                            label="작업명"
                            rules={[{ required: true, message: '작업명을 입력해주세요' }]}
                        >
                            <Input placeholder="작업명을 입력하세요" size="large" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={24}>
                        <Form.Item name="description" label="설명">
                            <TextArea rows={4} placeholder="작업에 대한 상세 설명을 입력하세요" />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider orientation="left" plain>기본 설정</Divider>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="status"
                            label="상태"
                            rules={[{ required: true, message: '상태를 선택해주세요' }]}
                        >
                            <Select placeholder="상태 선택">
                                {Object.entries(taskStatusLabels).map(([key, label]) => (
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
                            <Select placeholder="우선순위 선택">
                                {Object.entries(taskPriorityLabels).map(([key, label]) => (
                                    <Select.Option key={key} value={key}>
                                        {label}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={24}>
                        <Form.Item name="assignee" label="담당자">
                            <Select placeholder="담당자 선택" allowClear showSearch optionFilterProp="children">
                                {members.map((member) => (
                                    <Select.Option key={member.id} value={member.id}>
                                        {member.name} ({member.email})
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Divider orientation="left" plain>일정</Divider>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="startDate" label="시작일">
                            <DatePicker placeholder="시작일 선택" style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="dueDate"
                            label="마감일"
                            rules={[
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        const startDate = getFieldValue('startDate');
                                        if (startDate && value && dayjs(value).isBefore(dayjs(startDate))) {
                                            return Promise.reject(new Error('마감일은 시작일 이후여야 합니다'));
                                        }
                                        return Promise.resolve();
                                    },
                                }),
                            ]}
                        >
                            <DatePicker placeholder="마감일 선택" style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider orientation="left" plain>리소스 및 비용</Divider>

                <Row gutter={16}>
                    <Col span={8}>
                        <Form.Item name="estimatedHours" label="예상 소요 시간">
                            <InputNumber
                                placeholder="0"
                                suffix="시간"
                                style={{ width: '100%' }}
                                min={0}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="estimatedCost" label="예상 비용">
                            <InputNumber
                                placeholder="0"
                                suffix="원"
                                style={{ width: '100%' }}
                                min={0}
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item name="actualCost" label="실제 비용">
                            <InputNumber
                                placeholder="0"
                                suffix="원"
                                style={{ width: '100%' }}
                                min={0}
                                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

export default TaskModal;
