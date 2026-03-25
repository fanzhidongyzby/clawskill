import { Layout, Dropdown, Avatar } from 'antd'
import { UserOutlined, LogoutOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'

const { Header } = Layout

const items: MenuProps['items'] = [
  {
    key: 'profile',
    label: '个人资料',
    icon: <UserOutlined />,
  },
  {
    key: 'logout',
    label: '退出登录',
    icon: <LogoutOutlined />,
  },
]

function AppHeader() {
  return (
    <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontSize: 20, fontWeight: 600 }}>
        技能市场
      </div>
      <Dropdown menu={{ items }} placement="bottomRight">
        <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
      </Dropdown>
    </Header>
  )
}

export default AppHeader