import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Tabs, Table, Button, Modal, Form, Input, Select, Tag, message, Space } from 'antd'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import axios from 'axios'

const { Option } = Select

function Admin() {
  const [activeTab, setActiveTab] = useState('users')
  const queryClient = useQueryClient()

  const { data: usersData, isLoading: usersLoading } = useQuery(
    ['admin-users'],
    () => axios.get('/api/admin/users').then((res) => res.data),
    { enabled: activeTab === 'users' },
  )

  const { data: skillsData, isLoading: skillsLoading } = useQuery(
    ['admin-skills'],
    () => axios.get('/api/admin/skills').then((res) => res.data),
    { enabled: activeTab === 'skills' },
  )

  const { data: auditData, isLoading: auditLoading } = useQuery(
    ['admin-audit'],
    () => axios.get('/api/admin/audit').then((res) => res.data),
    { enabled: activeTab === 'audit' },
  )

  const approveSkillMutation = useMutation(
    (id: string) => axios.post(`/api/admin/skills/${id}/approve`),
    {
      onSuccess: () => {
        message.success('技能审核通过')
        queryClient.invalidateQueries(['admin-skills'])
      },
    },
  )

  const rejectSkillMutation = useMutation(
    (id: string) => axios.post(`/api/admin/skills/${id}/reject`),
    {
      onSuccess: () => {
        message.success('技能已拒绝')
        queryClient.invalidateQueries(['admin-skills'])
      },
    },
  )

  const userColumns = [
    { title: '用户ID', dataIndex: 'id', key: 'id' },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const colorMap: Record<string, string> = {
          admin: 'red',
          developer: 'blue',
          user: 'green',
        }
        return <Tag color={colorMap[role] || 'default'}>{role}</Tag>
      },
    },
    { title: '注册时间', dataIndex: 'created_at', key: 'created_at' },
    { title: '最后活跃', dataIndex: 'last_active', key: 'last_active' },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link">编辑</Button>
          <Button type="link" danger>封禁</Button>
        </Space>
      ),
    },
  ]

  const skillColumns = [
    { title: '技能ID', dataIndex: 'id', key: 'id' },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '作者', dataIndex: 'author', key: 'author' },
    { title: '版本', dataIndex: 'version', key: 'version' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    {
      title: '审核状态',
      dataIndex: 'audit_status',
      key: 'audit_status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          pending: 'orange',
          approved: 'green',
          rejected: 'red',
        }
        const textMap: Record<string, string> = {
          pending: '待审核',
          approved: '已通过',
          rejected: '已拒绝',
        }
        return <Tag color={colorMap[status]}>{textMap[status]}</Tag>
      },
    },
    { title: '提交时间', dataIndex: 'submitted_at', key: 'submitted_at' },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<CheckOutlined />}
            onClick={() => approveSkillMutation.mutate(record.id)}
          >
            通过
          </Button>
          <Button
            type="link"
            danger
            icon={<CloseOutlined />}
            onClick={() => rejectSkillMutation.mutate(record.id)}
          >
            拒绝
          </Button>
          <Button type="link">详情</Button>
        </Space>
      ),
    },
  ]

  const auditColumns = [
    { title: '操作ID', dataIndex: 'id', key: 'id' },
    { title: '操作类型', dataIndex: 'action', key: 'action' },
    { title: '操作人', dataIndex: 'operator', key: 'operator' },
    { title: '目标', dataIndex: 'target', key: 'target' },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      render: (result: string) => {
        const colorMap: Record<string, string> = {
          success: 'green',
          failure: 'red',
        }
        return <Tag color={colorMap[result]}>{result}</Tag>
      },
    },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip' },
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp' },
  ]

  const items = [
    { key: 'users', label: '用户管理' },
    { key: 'skills', label: '技能审核' },
    { key: 'audit', label: '审核日志' },
  ]

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        items={items}
        onChange={setActiveTab}
      />

      {activeTab === 'users' && (
        <Table
          columns={userColumns}
          dataSource={usersData?.items || []}
          loading={usersLoading}
          rowKey="id"
        />
      )}

      {activeTab === 'skills' && (
        <Table
          columns={skillColumns}
          dataSource={skillsData?.items || []}
          loading={skillsLoading}
          rowKey="id"
        />
      )}

      {activeTab === 'audit' && (
        <Table
          columns={auditColumns}
          dataSource={auditData?.items || []}
          loading={auditLoading}
          rowKey="id"
        />
      )}
    </div>
  )
}

export default Admin