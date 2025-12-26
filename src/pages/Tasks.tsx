import React, { useState, useMemo } from 'react';
import { Card, Tag, Avatar, Select, Button, Input, message, Popconfirm, Space, theme, Segmented, Table, Tooltip, Divider, Typography } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  BarsOutlined,
  SearchOutlined,
  FilterOutlined,
  GroupOutlined,
  UserOutlined,
  CheckCircleOutlined,
  EnterOutlined
} from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useTaskStore, TaskStatus, TaskPriority } from '../store/taskStore';
import { useProjectStore } from '../store/projectStore';
import { useMemberStore } from '../store/memberStore';
import { useSettings } from '../store/settingsStore';
import dayjs from 'dayjs';
import TaskModal from '../components/TaskModal';

const { Title } = Typography;

type ViewMode = 'BOARD' | 'LIST';
type GroupBy = 'STATUS' | 'PRIORITY' | 'ASSIGNEE';

const Tasks: React.FC = () => {
  const { tasks, addTask, updateTask, deleteTask } = useTaskStore();
  const { projects } = useProjectStore();
  const { members } = useMemberStore();
  const { effectiveTheme, settings } = useSettings();
  const { token } = theme.useToken();

  const isDark = effectiveTheme === 'dark';

  // State
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projects.length > 0 ? projects[0].id : null
  );
  const [viewMode, setViewMode] = useState<ViewMode>('BOARD');
  const [groupBy, setGroupBy] = useState<GroupBy>('STATUS');
  const [filterAssignee, setFilterAssignee] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [searchText, setSearchText] = useState<string>('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

  // Quick Add State
  const [quickAddText, setQuickAddText] = useState<Record<string, string>>({});

  // Colors
  const colors = {
    columnBg: isDark ? '#1f1f1f' : '#f9f9f9',
    columnHeaderBg: isDark ? '#262626' : '#f0f0f0',
    cardBg: isDark ? '#2a2a2a' : '#ffffff',
    cardHoverBg: isDark ? '#333333' : '#ffffff',
    text: isDark ? '#ffffff' : '#262626',
    textSecondary: isDark ? '#a0a0a0' : '#666666',
    border: isDark ? '#404040' : '#f0f0f0',
    bannerBg: isDark ? '#262626' : '#f0f2f5',
    addBtnBorder: isDark ? '#404040' : '#d9d9d9',
    addBtnText: isDark ? '#a0a0a0' : '#666666',
    addBtnHoverBg: isDark ? '#333333' : '#fafafa',
    dragOverBg: isDark ? 'rgba(24, 144, 255, 0.15)' : 'rgba(24, 144, 255, 0.05)',
    taskCountBg: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
  };

  const priorityColors: Record<TaskPriority, string> = {
    [TaskPriority.LOW]: 'default',
    [TaskPriority.MEDIUM]: 'blue',
    [TaskPriority.HIGH]: 'orange',
    [TaskPriority.URGENT]: 'red',
  };

  const priorityLabels: Record<TaskPriority, string> = {
    [TaskPriority.LOW]: '낮음',
    [TaskPriority.MEDIUM]: '보통',
    [TaskPriority.HIGH]: '높음',
    [TaskPriority.URGENT]: '긴급',
  };

  const statusLabels: Record<TaskStatus, string> = {
    [TaskStatus.TODO]: '할 일',
    [TaskStatus.IN_PROGRESS]: '진행중',
    [TaskStatus.REVIEW]: '검토중',
    [TaskStatus.DONE]: '완료',
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    if (!selectedProjectId) return [];

    return tasks.filter((t) => {
      if (t.projectId !== selectedProjectId) return false;
      if (filterAssignee !== 'ALL' && t.assignee !== filterAssignee) return false;
      if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false;
      if (searchText && !t.title.toLowerCase().includes(searchText.toLowerCase()) && !t.description?.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  }, [tasks, selectedProjectId, filterAssignee, filterPriority, searchText]);

  // Grouped Columns
  const columns = useMemo(() => {
    if (groupBy === 'STATUS') {
      return [
        { id: TaskStatus.TODO, title: '할 일', color: isDark ? '#595959' : '#d9d9d9' },
        { id: TaskStatus.IN_PROGRESS, title: '진행중', color: '#52c41a' },
        { id: TaskStatus.REVIEW, title: '검토중', color: '#1890ff' },
        { id: TaskStatus.DONE, title: '완료', color: '#ff4d4f' },
      ];
    } else if (groupBy === 'PRIORITY') {
      return [
        { id: TaskPriority.URGENT, title: '긴급', color: '#ff4d4f' },
        { id: TaskPriority.HIGH, title: '높음', color: '#fa8c16' },
        { id: TaskPriority.MEDIUM, title: '보통', color: '#1890ff' },
        { id: TaskPriority.LOW, title: '낮음', color: '#8c8c8c' },
      ];
    } else {
      // Group by Assignee
      const memberColumns = members.map(m => ({
        id: m.id,
        title: m.name,
        color: settings.primaryColor,
        avatar: m.avatar
      }));
      return [
        ...memberColumns,
        { id: 'unassigned', title: '미지정', color: '#8c8c8c', avatar: undefined }
      ];
    }
  }, [groupBy, isDark, members, settings.primaryColor]);

  const getTasksByColumn = (columnId: string) => {
    return filteredTasks.filter((t) => {
      if (groupBy === 'STATUS') return t.status === columnId;
      if (groupBy === 'PRIORITY') return t.priority === columnId;
      if (groupBy === 'ASSIGNEE') return columnId === 'unassigned' ? !t.assignee : t.assignee === columnId;
      return false;
    });
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const updates: any = {};
    const destId = destination.droppableId;

    if (groupBy === 'STATUS') {
      updates.status = destId as TaskStatus;
    } else if (groupBy === 'PRIORITY') {
      updates.priority = destId as TaskPriority;
    } else if (groupBy === 'ASSIGNEE') {
      updates.assignee = destId === 'unassigned' ? undefined : destId;
    }

    updateTask(draggableId, updates);
    message.success('작업이 이동되었습니다');
  };

  const handleAddTask = (columnId?: string) => {
    if (!selectedProjectId) {
      message.warning('프로젝트를 먼저 선택해주세요');
      return;
    }
    setEditingTask(null);

    // Set default values based on current grouping/column
    const defaults: any = {};
    if (columnId) {
      if (groupBy === 'STATUS') defaults.status = columnId;
      if (groupBy === 'PRIORITY') defaults.priority = columnId;
      if (groupBy === 'ASSIGNEE') defaults.assignee = columnId === 'unassigned' ? undefined : columnId;
    }

    // Store these defaults to pass to modal
    setSelectedColumn(JSON.stringify(defaults));
    setIsModalOpen(true);
  };

  const handleQuickAdd = (columnId: string) => {
    const text = quickAddText[columnId];
    if (!text || !text.trim()) return;
    if (!selectedProjectId) return;

    const newTask: any = {
      projectId: selectedProjectId,
      title: text,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
    };

    if (groupBy === 'STATUS') newTask.status = columnId;
    if (groupBy === 'PRIORITY') newTask.priority = columnId;
    if (groupBy === 'ASSIGNEE') newTask.assignee = columnId === 'unassigned' ? undefined : columnId;

    addTask(newTask);
    setQuickAddText(prev => ({ ...prev, [columnId]: '' }));
    message.success('작업이 추가되었습니다');
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleOk = (values: any) => {
    if (editingTask) {
      updateTask(editingTask.id, {
        ...values,
        startDate: values.startDate ? values.startDate.toDate() : undefined,
        dueDate: values.dueDate ? values.dueDate.toDate() : undefined,
      });
      message.success('작업이 수정되었습니다');
    } else {
      // Parse defaults if any
      let defaults = {};
      try {
        if (selectedColumn) defaults = JSON.parse(selectedColumn);
      } catch (e) { }

      addTask({
        projectId: selectedProjectId!,
        ...defaults,
        ...values,
        startDate: values.startDate ? values.startDate.toDate() : undefined,
        dueDate: values.dueDate ? values.dueDate.toDate() : undefined,
      });
      message.success('작업이 추가되었습니다');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (taskId: string) => {
    deleteTask(taskId);
    message.success('작업이 삭제되었습니다');
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  // Table Columns for List View
  const tableColumns = [
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: any) => (
        <Space>
          <span
            style={{ fontWeight: 500, cursor: 'pointer', color: colors.text }}
            onClick={() => handleEditTask(record)}
          >
            {text}
          </span>
        </Space>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: TaskStatus) => (
        <Tag color={
          status === TaskStatus.DONE ? 'success' :
            status === TaskStatus.IN_PROGRESS ? 'processing' :
              status === TaskStatus.REVIEW ? 'warning' : 'default'
        }>
          {statusLabels[status]}
        </Tag>
      ),
    },
    {
      title: '우선순위',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: TaskPriority) => (
        <Tag color={priorityColors[priority]}>
          {priorityLabels[priority]}
        </Tag>
      ),
    },
    {
      title: '담당자',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 150,
      render: (assigneeId: string) => {
        const member = members.find(m => m.id === assigneeId);
        return member ? (
          <Space>
            <Avatar size="small" src={member.avatar}>{member.name[0]}</Avatar>
            <span>{member.name}</span>
          </Space>
        ) : <span style={{ color: colors.textSecondary }}>미지정</span>;
      },
    },
    {
      title: '마감일',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (date: Date) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: '관리',
      key: 'action',
      width: 100,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditTask(record)}
          />
          <Popconfirm
            title="작업 삭제"
            onConfirm={() => handleDelete(record.id)}
            okText="삭제"
            cancelText="취소"
          >
            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (projects.length === 0) {
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>작업관리</Title>
        </div>
        <Card style={{ textAlign: 'center', padding: 40, background: colors.cardBg }}>
          <p style={{ fontSize: 16, color: colors.textSecondary }}>프로젝트가 없습니다. 먼저 프로젝트를 생성해주세요.</p>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', paddingBottom: 24 }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>작업관리</Title>
          <Select
            style={{ width: 300 }}
            placeholder="프로젝트 선택"
            value={selectedProjectId}
            onChange={setSelectedProjectId}
          >
            {projects.map((project) => (
              <Select.Option key={project.id} value={project.id}>
                {project.name}
              </Select.Option>
            ))}
          </Select>
        </div>

        {/* 컨트롤 바 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          background: colors.cardBg,
          padding: 16,
          borderRadius: 12,
          border: `1px solid ${colors.border}`
        }}>
          <Space wrap>
            <Input
              prefix={<SearchOutlined style={{ color: colors.textSecondary }} />}
              placeholder="검색..."
              style={{ width: 200 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Divider type="vertical" style={{ borderColor: colors.border }} />
            <Space>
              <FilterOutlined style={{ color: colors.textSecondary }} />
              <Select
                value={filterAssignee}
                onChange={setFilterAssignee}
                style={{ width: 140 }}
                options={[
                  { value: 'ALL', label: '전체 담당자' },
                  ...members.map(m => ({ value: m.id, label: m.name }))
                ]}
              />
              <Select
                value={filterPriority}
                onChange={setFilterPriority}
                style={{ width: 120 }}
                options={[
                  { value: 'ALL', label: '전체 우선순위' },
                  { value: TaskPriority.URGENT, label: '긴급' },
                  { value: TaskPriority.HIGH, label: '높음' },
                  { value: TaskPriority.MEDIUM, label: '보통' },
                  { value: TaskPriority.LOW, label: '낮음' },
                ]}
              />
            </Space>
            <Divider type="vertical" style={{ borderColor: colors.border }} />
            <Space>
              <GroupOutlined style={{ color: colors.textSecondary }} />
              <Select
                value={groupBy}
                onChange={(val) => setGroupBy(val as GroupBy)}
                style={{ width: 140 }}
                options={[
                  { value: 'STATUS', label: '상태별 보기' },
                  { value: 'PRIORITY', label: '우선순위별 보기' },
                  { value: 'ASSIGNEE', label: '담당자별 보기' },
                ]}
              />
            </Space>
          </Space>

          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleAddTask()}>
              새 작업
            </Button>
            <Segmented
              value={viewMode}
              onChange={(val) => setViewMode(val as ViewMode)}
              options={[
                { value: 'BOARD', icon: <AppstoreOutlined />, label: '보드' },
                { value: 'LIST', icon: <BarsOutlined />, label: '리스트' },
              ]}
            />
          </Space>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      {viewMode === 'LIST' ? (
        <Card bordered={false} bodyStyle={{ padding: 0 }} style={{ background: colors.cardBg, flex: 1, overflow: 'hidden' }}>
          <Table
            columns={tableColumns}
            dataSource={filteredTasks}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ y: 'calc(100vh - 350px)' }}
          />
        </Card>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div
            style={{
              display: 'flex',
              gap: 16,
              flex: 1,
              overflowX: 'auto',
              paddingBottom: 8
            }}
          >
            {columns.map((column) => {
              const columnTasks = getTasksByColumn(column.id);

              return (
                <div
                  key={column.id}
                  style={{
                    background: colors.columnBg,
                    borderRadius: 12,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 300,
                    maxWidth: 300,
                    border: isDark ? `1px solid ${colors.border}` : 'none',
                    borderTop: `4px solid ${column.color}`,
                    height: '100%',
                  }}
                >
                  {/* 컬럼 헤더 */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 16,
                      paddingBottom: 12,
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {column.avatar && <Avatar size="small" src={column.avatar} />}
                      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: colors.text }}>
                        {column.title}
                      </h3>
                    </div>
                    <span
                      style={{
                        background: colors.taskCountBg,
                        padding: '2px 10px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 500,
                        color: colors.text,
                      }}
                    >
                      {columnTasks.length}
                    </span>
                  </div>

                  {/* 드롭 영역 */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                          flex: 1,
                          overflowY: 'auto',
                          minHeight: 100,
                          transition: 'background-color 0.2s',
                          background: snapshot.isDraggingOver ? colors.dragOverBg : 'transparent',
                          borderRadius: 8,
                          padding: snapshot.isDraggingOver ? 8 : 0,
                        }}
                      >
                        {columnTasks.map((task, index) => {
                          const assignedMember = task.assignee ? members.find((m) => m.id === task.assignee) : null;

                          return (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                    background: snapshot.isDragging ? colors.cardHoverBg : colors.cardBg,
                                    borderRadius: 8,
                                    padding: 12,
                                    marginBottom: 8,
                                    boxShadow: snapshot.isDragging
                                      ? '0 8px 16px rgba(0, 0, 0, 0.3)'
                                      : isDark
                                        ? '0 2px 4px rgba(0, 0, 0, 0.3)'
                                        : '0 1px 3px rgba(0, 0, 0, 0.1)',
                                    cursor: snapshot.isDragging ? 'grabbing' : 'grab',
                                    borderLeft: `4px solid ${priorityColors[task.priority]}`,
                                    borderTop: isDark ? `1px solid ${colors.border}` : 'none',
                                    borderRight: isDark ? `1px solid ${colors.border}` : 'none',
                                    borderBottom: isDark ? `1px solid ${colors.border}` : 'none',
                                    opacity: snapshot.isDragging ? 0.95 : 1,
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 8, marginBottom: 8 }}>
                                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 500, flex: 1, lineHeight: 1.4, color: colors.text }}>
                                      {task.title}
                                    </h4>
                                  </div>

                                  {task.description && (
                                    <p style={{
                                      margin: '0 0 12px 0',
                                      fontSize: 12,
                                      color: colors.textSecondary,
                                      lineHeight: 1.5,
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                    }}>
                                      {task.description}
                                    </p>
                                  )}

                                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginTop: 8,
                                    paddingTop: 8,
                                    borderTop: `1px solid ${colors.border}`
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      {assignedMember && (
                                        <Tooltip title={assignedMember.name}>
                                          <Avatar size="small" src={assignedMember.avatar} style={{ backgroundColor: settings.primaryColor }}>
                                            {assignedMember.name[0]}
                                          </Avatar>
                                        </Tooltip>
                                      )}
                                      {task.dueDate && (
                                        <span style={{ fontSize: 12, color: colors.textSecondary }}>
                                          {dayjs(task.dueDate).format('MM/DD')}
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                      <Button
                                        type="text"
                                        size="small"
                                        icon={<EditOutlined />}
                                        style={{ color: colors.textSecondary }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditTask(task);
                                        }}
                                      />
                                      <Popconfirm
                                        title="작업 삭제"
                                        onConfirm={(e) => {
                                          e?.stopPropagation();
                                          handleDelete(task.id);
                                        }}
                                        okText="삭제"
                                        cancelText="취소"
                                      >
                                        <Button
                                          type="text"
                                          size="small"
                                          danger
                                          icon={<DeleteOutlined />}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </Popconfirm>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  {/* 빠른 추가 */}
                  <div style={{ marginTop: 12 }}>
                    <Input
                      placeholder="+ 빠른 작업 추가"
                      value={quickAddText[column.id] || ''}
                      onChange={(e) => setQuickAddText(prev => ({ ...prev, [column.id]: e.target.value }))}
                      onPressEnter={() => handleQuickAdd(column.id)}
                      suffix={
                        <Button
                          type="text"
                          size="small"
                          icon={<EnterOutlined />}
                          onClick={() => handleQuickAdd(column.id)}
                          disabled={!quickAddText[column.id]}
                        />
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      <TaskModal
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        initialValues={editingTask || (selectedColumn ? JSON.parse(selectedColumn) : {})}
        title={editingTask ? '작업 수정' : '새 작업 추가'}
        okText={editingTask ? '수정' : '추가'}
      />
    </div>
  );
};

export default Tasks;
