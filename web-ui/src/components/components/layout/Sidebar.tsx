import { Menu } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  AppstoreOutlined,
  SettingOutlined,
  TeamOutlined,
  AuditOutlined,
} from '@ant-design/icons'

const menuItems = [
  {
    key: '/',
    icon: <AppstoreOutlined />,
    label: '技能浏览',
  },
  {
    key: '/manage',
    icon: <SettingOutlined />,
    label: '技能管理',
  },
  {
    key: '/admin',
    icon: <TeamOutlined />,
    label: '用户管理',
    children: [
      { key: '/admin/users', label: '用户列表' },
      { key: '/admin/skills', label: '技能审核' },
      { key: '/admin/audit', label: '审核日志' },
    ],
  },
]

function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  return (
    <>
      <div style={{
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#002140',
        color: '#fff',
        fontSize: 18,
        fontWeight: 600,
      }}>
        OpenClaw 技能平台
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
      />
      <Outlet />
    </>
  )
}

export default Sidebar