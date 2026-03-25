import { useState } from 'react'
import { useQuery } from 'react-query'
import { Input, Select, Card, Row, Col, Tag, Pagination, Modal, Descriptions, Button } from 'antd'
import { SearchOutlined, DownloadOutlined, StarOutlined } from '@ant-design/icons'
import type { Skill, SkillCategory } from '../types'
import axios from 'axios'

const { Search } = Input
const { Option } = Select

const categories: SkillCategory[] = [
  { id: 'all', name: '全部' },
  { id: 'productivity', name: '生产力' },
  { id: 'automation', name: '自动化' },
  { id: 'ai', name: 'AI工具' },
  { id: 'development', name: '开发工具' },
  { id: 'integration', name: '集成' },
  { id: 'utility', name: '实用工具' },
]

function SkillBrowse() {
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('popular')
  const [page, setPage] = useState(1)
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const pageSize = 12

  const { data: skillsData, isLoading } = useQuery(
    ['skills', searchQuery, category, sortBy, page],
    async () => {
      const params = {
        page,
        page_size: pageSize,
        ...(searchQuery && { q: searchQuery }),
        ...(category !== 'all' && { category }),
        sort_by: sortBy,
      }
      const { data } = await axios.get('/api/skills', { params })
      return data
    },
  )

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setPage(1)
  }

  const handleCardClick = (skill: Skill) => {
    setSelectedSkill(skill)
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索技能..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="分类"
              value={category}
              onChange={setCategory}
              size="large"
            >
              {categories.map((cat) => (
                <Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="排序"
              value={sortBy}
              onChange={setSortBy}
              size="large"
            >
              <Option value="popular">最热门</Option>
              <Option value="newest">最新</Option>
              <Option value="downloads">下载量</Option>
              <Option value="rating">评分</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {skillsData?.items?.map((skill: Skill) => (
          <Col xs={24} sm={12} md={8} lg={6} key={skill.id}>
            <Card
              hoverable
              title={skill.name}
              extra={<Tag color="blue">{skill.version}</Tag>}
              onClick={() => handleCardClick(skill)}
              style={{ height: '100%' }}
            >
              <div style={{ marginBottom: 12 }}>
                <p style={{ marginBottom: 8, color: '#666' }}>
                  {skill.description || '暂无描述'}
                </p>
                <Tag color="geekblue">{skill.category}</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>
                  <StarOutlined style={{ color: '#faad14', marginRight: 4 }} />
                  {skill.rating || 'N/A'}
                </span>
                <span>
                  <DownloadOutlined style={{ marginRight: 4 }} />
                  {skill.downloads || 0}
                </span>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {skillsData?.total > pageSize && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Pagination
            current={page}
            pageSize={pageSize}
            total={skillsData.total}
            onChange={setPage}
            showSizeChanger={false}
            showQuickJumper
          />
        </div>
      )}

      <Modal
        title={selectedSkill?.name}
        open={!!selectedSkill}
        onCancel={() => setSelectedSkill(null)}
        footer={[
          <Button key="install" type="primary">
            安装技能
          </Button>,
        ]}
        width={800}
      >
        {selectedSkill && (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="版本" span={1}>
              <Tag color="blue">{selectedSkill.version}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="分类" span={1}>
              <Tag color="geekblue">{selectedSkill.category}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="作者" span={2}>
              {selectedSkill.author}
            </Descriptions.Item>
            <Descriptions.Item label="描述" span={2}>
              {selectedSkill.description || '暂无描述'}
            </Descriptions.Item>
            <Descriptions.Item label="评分" span={1}>
              <StarOutlined style={{ color: '#faad14', marginRight: 4 }} />
              {selectedSkill.rating || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="下载量" span={1}>
              <DownloadOutlined style={{ marginRight: 4 }} />
              {selectedSkill.downloads || 0}
            </Descriptions.Item>
            <Descriptions.Item label="最后更新" span={2}>
              {selectedSkill.updated_at || '未知'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default SkillBrowse