import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Table, Button, Modal, Form, Input, Select, Tag, message, Space, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, RollbackOutlined } from '@ant-design/icons'
import type { Skill } from '../types'
import axios from 'axios'

const { TextArea } = Input
const { Option } = Select

function SkillManage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data: skillsData, isLoading } = useQuery(
    ['my-skills'],
    () => axios.get('/api/skills/my').then((res) => res.data),
  )

  const createMutation = useMutation(
    (data: Partial<Skill>) => axios.post('/api/skills', data),
    {
      onSuccess: () => {
        message.success('技能发布成功')
        queryClient.invalidateQueries(['my-skills'])
        setIsModalOpen(false)
        form.resetFields()
      },
      onError: () => {
        message.error('技能发布失败')
      },
    },
  )

  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: Partial<Skill> }) =>
      axios.put(`/api/skills/${id}`, data),
    {
      onSuccess: () => {
        message.success('技能更新成功')
        queryClient.invalidateQueries(['my-skills'])
        setIsModalOpen(false)
        setEditingSkill(null)
        form.resetFields()
      },
      onError: () => {
        message.error('技能更新失败')
      },
    },
  )

  const deleteMutation = useMutation(
    (id: string) => axios.delete(`/api/skills/${id}`),
    {
      onSuccess: () => {
        message.success('技能删除成功')
        queryClient.invalidateQueries(['my-skills'])
      },
      onError: () => {
        message.error('技能删除失败')
      },
    },
  )

  const handlePublish = () => {
    setEditingSkill(null)
    setIsModalOpen(true)
    form.resetFields()
  }

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill)
    setIsModalOpen(true)
    form.setFieldsValue(skill)
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  const handleRollback = (skillId: string, version: string) => {
    message.info(`回滚到版本 ${version}`)
    // 实际实现需要调用版本回滚 API
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingSkill) {
        updateMutation.mutate({ id: editingSkill.id, data: values })
      } else {
        createMutation.mutate(values)
      }
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      render: (version: string) => <Tag color="blue">{version}</Tag>,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag color="geekblue">{category}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          published: 'green',
          draft: 'default',
          archived: 'orange',
        }
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
      },
    },
    {
      title: '下载量',
      dataIndex: 'downloads',
      key: 'downloads',
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Skill) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个技能吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handlePublish}>
          发布新技能
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={skillsData?.items || []}
        loading={isLoading}
        rowKey="id"
        expandable={{
          expandedRowRender: (record: Skill) => (
            <div>
              <h4>版本历史</h4>
              <Table
                columns={[
                  { title: '版本', dataIndex: 'version', key: 'version' },
                  { title: '发布时间', dataIndex: 'created_at', key: 'created_at' },
                  { title: '变更说明', dataIndex: 'changelog', key: 'changelog' },
                  {
                    title: '操作',
                    key: 'actions',
                    render: (_: any, version: any) => (
                      <Button
                        size="small"
                        icon={<RollbackOutlined />}
                        onClick={() => handleRollback(record.id, version.version)}
                      >
                        回滚
                      </Button>
                    ),
                  },
                ]}
                dataSource={record.versions || []}
                pagination={false}
                size="small"
                rowKey="version"
              />
            </div>
          ),
        }}
      />

      <Modal
        title={editingSkill ? '编辑技能' : '发布新技能'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setIsModalOpen(false)
          setEditingSkill(null)
          form.resetFields()
        }}
        okText={editingSkill ? '更新' : '发布'}
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="技能名称"
            name="name"
            rules={[{ required: true, message: '请输入技能名称' }]}
          >
            <Input placeholder="技能名称" />
          </Form.Item>
          <Form.Item
            label="描述"
            name="description"
            rules={[{ required: true, message: '请输入技能描述' }]}
          >
            <TextArea rows={4} placeholder="技能描述" />
          </Form.Item>
          <Form.Item
            label="分类"
            name="category"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="选择分类">
              <Option value="productivity">生产力</Option>
              <Option value="automation">自动化</Option>
              <Option value="ai">AI工具</Option>
              <Option value="development">开发工具</Option>
              <Option value="integration">集成</Option>
              <Option value="utility">实用工具</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="版本"
            name="version"
            rules={[{ required: true, message: '请输入版本号' }]}
            initialValue="1.0.0"
          >
            <Input placeholder="例如: 1.0.0" />
          </Form.Item>
          <Form.Item label="标签" name="tags">
            <Select mode="tags" placeholder="添加标签" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SkillManage