import React, { useState, useEffect, useRef } from 'react';
import { Modal, Input, List, Typography, Space, Badge, message } from 'antd';
import {
    SearchOutlined,
    HomeOutlined,
    ProjectOutlined,
    CheckSquareOutlined,
    NotificationOutlined,
    FileDoneOutlined,
    ReadOutlined,
    CloudServerOutlined,
    BarChartOutlined,
    SettingOutlined,
    LogoutOutlined,
    BgColorsOutlined,
    BugOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';

const { Text } = Typography;

interface CommandItem {
    id: string;
    title: string;
    description?: string;
    icon: React.ReactNode;
    action: () => void;
    group: 'Navigation' | 'Action' | 'System';
}

const CommandPalette: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    const navigate = useNavigate();
    const { settings, updateSettings, saveSettings } = useSettings();
    const { logout } = useAuthStore();
    const inputRef = useRef<any>(null);

    // Toggle Palette
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
                setSearchTerm('');
                setSelectedIndex(0);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Define Commands
    const commands: CommandItem[] = [
        // Navigation
        { id: 'nav-home', title: '대시보드', group: 'Navigation', icon: <HomeOutlined />, action: () => navigate('/') },
        { id: 'nav-projects', title: '프로젝트 목록', group: 'Navigation', icon: <ProjectOutlined />, action: () => navigate('/projects') },
        { id: 'nav-tasks', title: '내 작업', group: 'Navigation', icon: <CheckSquareOutlined />, action: () => navigate('/tasks') },
        { id: 'nav-comm', title: '커뮤니케이션', group: 'Navigation', icon: <NotificationOutlined />, action: () => navigate('/communication') },
        { id: 'nav-issues', title: '이슈 트래커', group: 'Navigation', icon: <BugOutlined />, action: () => navigate('/issues') },
        { id: 'nav-approvals', title: '전자결재', group: 'Navigation', icon: <FileDoneOutlined />, action: () => navigate('/approvals') },
        { id: 'nav-wiki', title: '지식 관리 (Wiki)', group: 'Navigation', icon: <ReadOutlined />, action: () => navigate('/wiki') },
        { id: 'nav-drive', title: '통합 자료실 (Drive)', group: 'Navigation', icon: <CloudServerOutlined />, action: () => navigate('/drive') },
        { id: 'nav-reports', title: '보고서', group: 'Navigation', icon: <BarChartOutlined />, action: () => navigate('/reports') },
        { id: 'nav-settings', title: '설정', group: 'Navigation', icon: <SettingOutlined />, action: () => navigate('/settings') },

        // Actions
        {
            id: 'act-theme',
            title: `테마 변경 (${settings.theme === 'light' ? '다크' : '라이트'})`,
            group: 'Action',
            icon: <BgColorsOutlined />,
            action: () => {
                const newTheme = settings.theme === 'light' ? 'dark' : 'light';
                updateSettings('theme', newTheme);
                saveSettings(); // Persist change
                message.success(`테마가 ${newTheme === 'light' ? '라이트' : '다크'} 모드로 변경되었습니다.`);
            }
        },

        // System
        { id: 'sys-logout', title: '로그아웃', group: 'System', icon: <LogoutOutlined />, action: () => { logout(); navigate('/login'); } },
    ];

    // Filter Logic
    const filteredCommands = commands.filter(cmd =>
        cmd.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cmd.group.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (command: CommandItem) => {
        command.action();
        setIsOpen(false);
    };

    // Keyboard Navigation in List
    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredCommands[selectedIndex]) {
                handleSelect(filteredCommands[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    return (
        <Modal
            open={isOpen}
            onCancel={() => setIsOpen(false)}
            footer={null}
            closable={false}
            maskClosable={true}
            style={{ top: '15%' }}
            width={600}
            bodyStyle={{ padding: 0, borderRadius: 12, overflow: 'hidden' }}
        >
            <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
                <Input
                    ref={inputRef}
                    prefix={<SearchOutlined style={{ fontSize: 20, color: '#bfbfbf', marginRight: 8 }} />}
                    placeholder="무엇을 도와드릴까요? (명령어 검색)"
                    bordered={false}
                    style={{ fontSize: 18 }}
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setSelectedIndex(0); }}
                    onKeyDown={handleInputKeyDown}
                />
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <List
                    dataSource={filteredCommands}
                    renderItem={(item, index) => (
                        <List.Item
                            onClick={() => handleSelect(item)}
                            style={{
                                padding: '12px 24px',
                                cursor: 'pointer',
                                background: index === selectedIndex ? '#e6f7ff' : 'transparent',
                                borderLeft: index === selectedIndex ? '4px solid #1890ff' : '4px solid transparent',
                                transition: 'all 0.1s'
                            }}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                                <div style={{ fontSize: 20, marginRight: 16, color: '#595959', display: 'flex' }}>
                                    {item.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <Text strong={index === selectedIndex}>{item.title}</Text>
                                    {item.description && <div><Text type="secondary" style={{ fontSize: 12 }}>{item.description}</Text></div>}
                                </div>
                                <div>
                                    <Badge count={item.group} style={{ backgroundColor: '#f0f0f0', color: '#8c8c8c' }} />
                                </div>
                                {index === selectedIndex && (
                                    <div style={{ marginLeft: 12 }}>
                                        <Text type="secondary" style={{ fontSize: 12 }}>Enter</Text>
                                    </div>
                                )}
                            </div>
                        </List.Item>
                    )}
                    locale={{ emptyText: '검색 결과가 없습니다' }}
                />
            </div>
            <div style={{ padding: '8px 16px', background: '#fafafa', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end' }}>
                <Space size="large">
                    <Text type="secondary" style={{ fontSize: 12 }}><Text strong>↑↓</Text> 이동</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}><Text strong>Enter</Text> 선택</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}><Text strong>Esc</Text> 닫기</Text>
                </Space>
            </div>
        </Modal>
    );
};

export default CommandPalette;
